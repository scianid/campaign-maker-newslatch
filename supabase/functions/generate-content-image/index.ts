import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

// Import shared utilities from rss-feeds function
import { authenticateUser, createAuthenticatedClient } from '../rss-feeds/auth.ts';
import { handleCors, createErrorResponse, createSuccessResponse } from '../rss-feeds/http-utils.ts';
import { checkUserCredits, deductUserCredit } from '../rss-feeds/credits.ts';

// OpenAI Image Generation
async function generateImage(prompt: string): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  console.log('🎨 Generating image with prompt:', prompt);

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'medium'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Image API error: ${error}`);
  }

  const data = await response.json();
  console.log('OpenAI response structure:', Object.keys(data));
  
  // gpt-image-1 returns base64 encoded images
  const b64Image = data.data?.[0]?.b64_json;
  
  if (!b64Image) {
    throw new Error(`No base64 image found in OpenAI response`);
  }
  
  return b64Image;
}

// Upload image to Supabase Storage with compression (70% quality JPEG)
async function uploadImageToStorage(
  supabaseClient: any,
  base64Image: string,
  campaignId: string,
  contentId: string
): Promise<string> {
  console.log('📦 Processing base64 image...');
  
  // Create a service role client for storage operations to bypass RLS
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  // Decode base64 to binary
  const binaryString = atob(base64Image);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const imageBuffer = bytes.buffer;
  
  console.log('🔄 Converting and compressing image to JPEG (quality 70)...');
  
  let finalBuffer: ArrayBuffer;
  let contentType = 'image/jpeg';
  let fileExtension = 'jpg';
  
  try {
    // Decode the image using imagescript
    const image = await Image.decode(new Uint8Array(imageBuffer));

    // Encode as JPEG with quality 70 (good balance for web, saves space)
    const jpegBuffer = await image.encodeJPEG(70);
    finalBuffer = jpegBuffer.buffer;
    
    const originalSize = imageBuffer.byteLength;
    const compressedSize = finalBuffer.byteLength;
    const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    
    console.log(`✅ Image compressed: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (saved ${savings}%)`);
    
  } catch (compressionError) {
    console.warn('⚠️ Image compression failed, using original:', compressionError);
    finalBuffer = imageBuffer;
    contentType = 'image/png';
    fileExtension = 'png';
  }
  
  // Generate unique filename with date and UUID
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const uuid = crypto.randomUUID();
  const fileName = `${timestamp}_${uuid}.${fileExtension}`;
  const filePath = `${campaignId}/${contentId}/${fileName}`;
  
  console.log('☁️ Uploading to Supabase Storage:', filePath);
  
  // Upload to Supabase Storage in public-files bucket using service client
  const { data, error } = await serviceClient
    .storage
    .from('public-files')
    .upload(filePath, finalBuffer, {
      contentType: contentType,
      upsert: false
    });
  
  if (error) {
    console.error('❌ Storage upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
  
  // Get public URL using service client
  const { data: { publicUrl } } = serviceClient
    .storage
    .from('public-files')
    .getPublicUrl(filePath);
  
  console.log('✅ Image uploaded successfully:', publicUrl);
  
  return publicUrl;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    // Only handle POST requests
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 'This endpoint only accepts POST requests', 405);
    }

    // Create authenticated Supabase client
    const supabaseClient = createAuthenticatedClient(req, createClient);

    // Verify user authentication
    const authResult = await authenticateUser(supabaseClient);
    if (!authResult.success) {
      return createErrorResponse(authResult.error!, '', 401);
    }

    const userId = authResult.user!.id;

    // Check if user has credits before processing
    console.log('💳 Checking user credits...');
    const creditCheck = await checkUserCredits(supabaseClient, userId);
    
    if (!creditCheck.hasCredits) {
      return createErrorResponse(
        'Insufficient credits',
        `You need credits to generate images. Current credits: ${creditCheck.currentCredits}`,
        402
      );
    }

    console.log(`✅ User has ${creditCheck.currentCredits} credits available`);

    // Get request parameters
    const body = await req.json();
    const { content_id, custom_prompt } = body;

    // Validate required parameters
    if (!content_id) {
      return createErrorResponse('Missing required parameters', 'content_id is required', 400);
    }

    console.log('🚀 Starting image generation for content item:', content_id);

    // Fetch AI content item to verify ownership and get image_prompt
    const { data: contentItem, error: fetchError } = await supabaseClient
      .from('ai_generated_items')
      .select(`
        *,
        campaigns!inner (
          id,
          user_id
        )
      `)
      .eq('id', content_id)
      .single();

    if (fetchError || !contentItem) {
      console.error('❌ Content item not found:', fetchError);
      return createErrorResponse(
        'Content item not found',
        'The specified content item does not exist or is not accessible',
        404
      );
    }

    // Verify ownership
    if (contentItem.campaigns.user_id !== userId) {
      return createErrorResponse(
        'Unauthorized',
        'You do not have permission to modify this content item',
        403
      );
    }

    // Use custom prompt if provided, otherwise use content item's image_prompt
    const imagePrompt = custom_prompt || contentItem.image_prompt;
    
    if (!imagePrompt) {
      return createErrorResponse(
        'No image prompt available',
        'This content item does not have an AI-generated image prompt and no custom prompt was provided. Please regenerate the content to include image prompts.',
        400
      );
    }

    console.log('✅ Content item verified, generating image...');
    console.log('📝 Image prompt:', imagePrompt);
    console.log('🔧 Using custom prompt:', !!custom_prompt);

    // Generate image using OpenAI (returns base64)
    const base64Image = await generateImage(imagePrompt);
    console.log('✅ Image generated by OpenAI');

    // Deduct credit after successful image generation
    console.log('💳 Deducting credit for image generation...');
    const deductResult = await deductUserCredit(supabaseClient, userId);
    
    if (!deductResult.success) {
      console.error('⚠️ Failed to deduct credit, but image was generated');
      // Continue anyway since image was already generated
    } else {
      console.log(`✅ Credit deducted. Remaining credits: ${deductResult.remainingCredits}`);
    }

    // Upload to Supabase Storage
    const storageUrl = await uploadImageToStorage(
      supabaseClient,
      base64Image,
      contentItem.campaigns.id,
      content_id
    );

    // Update ai_generated_items with image URL
    console.log('💾 Updating content item with new image URL...');

    const { error: updateError } = await supabaseClient
      .from('ai_generated_items')
      .update({ image_url: storageUrl })
      .eq('id', content_id);

    if (updateError) {
      console.error('❌ Failed to update content item:', updateError);
      return createErrorResponse(
        'Failed to update content item',
        updateError.message,
        500
      );
    }

    console.log('✅ Content item updated successfully');

    return createSuccessResponse({
      message: 'Image generated and uploaded successfully',
      image_url: storageUrl,
      content_id: content_id,
      credits_remaining: deductResult.remainingCredits
    });

  } catch (error) {
    console.error('❌ Edge function error:', error);
    return createErrorResponse(
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});
