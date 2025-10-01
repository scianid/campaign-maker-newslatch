import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared utilities from rss-feeds function
import { authenticateUser, createAuthenticatedClient } from '../rss-feeds/auth.ts';
import { handleCors, createErrorResponse, createSuccessResponse } from '../rss-feeds/http-utils.ts';

interface Database {
  public: {
    Tables: {
      landing_pages: {
        Row: {
          id: string;
          ai_generated_item_id: string;
          title: string;
          slug: string | null;
          is_active: boolean;
          view_count: number;
          created_at: string;
          updated_at: string;
          sections: any[] | null;
        };
        Update: {
          sections?: any[] | null;
        };
      };
    };
  };
}

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
      quality: 'medium',
      response_format: 'url'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Image API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].url;
}

// Upload image to Supabase Storage
async function uploadImageToStorage(
  supabaseClient: any,
  imageUrl: string,
  userId: string,
  landingPageId: string,
  sectionIndex: number
): Promise<string> {
  console.log('📥 Downloading image from OpenAI...');
  
  // Download image from OpenAI URL
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error('Failed to download image from OpenAI');
  }
  
  const imageBlob = await imageResponse.blob();
  const imageBuffer = await imageBlob.arrayBuffer();
  
  // Generate unique filename
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const uuid = crypto.randomUUID();
  const fileName = `${timestamp}_${uuid}.png`;
  const filePath = `${userId}/${landingPageId}/${fileName}`;
  
  console.log('☁️ Uploading to Supabase Storage:', filePath);
  
  // Upload to Supabase Storage
  const { data, error } = await supabaseClient
    .storage
    .from('public-files')
    .upload(filePath, imageBuffer, {
      contentType: 'image/png',
      upsert: false
    });
  
  if (error) {
    console.error('❌ Storage upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabaseClient
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

    // Get request parameters
    const body = await req.json();
    const { landing_page_id, section_index, image_prompt } = body;

    // Validate required parameters
    if (!landing_page_id) {
      return createErrorResponse('Missing required parameters', 'landing_page_id is required', 400);
    }

    if (section_index === undefined || section_index === null) {
      return createErrorResponse('Missing required parameters', 'section_index is required', 400);
    }

    if (!image_prompt) {
      return createErrorResponse('Missing required parameters', 'image_prompt is required', 400);
    }

    console.log('🚀 Starting image generation for landing page:', landing_page_id);
    console.log('📍 Section index:', section_index);

    // Fetch landing page to verify ownership and get sections
    const { data: landingPage, error: fetchError } = await supabaseClient
      .from('landing_pages')
      .select(`
        *,
        ai_generated_items!inner (
          campaigns!inner (
            user_id
          )
        )
      `)
      .eq('id', landing_page_id)
      .single();

    if (fetchError || !landingPage) {
      console.error('❌ Landing page not found:', fetchError);
      return createErrorResponse(
        'Landing page not found',
        'The specified landing page does not exist or is not accessible',
        404
      );
    }

    // Verify ownership
    if (landingPage.ai_generated_items.campaigns.user_id !== userId) {
      return createErrorResponse(
        'Unauthorized',
        'You do not have permission to modify this landing page',
        403
      );
    }

    // Verify section exists
    if (!landingPage.sections || !Array.isArray(landingPage.sections)) {
      return createErrorResponse(
        'Invalid landing page structure',
        'Landing page has no sections',
        400
      );
    }

    if (section_index >= landingPage.sections.length) {
      return createErrorResponse(
        'Invalid section index',
        `Section index ${section_index} is out of range (max: ${landingPage.sections.length - 1})`,
        400
      );
    }

    console.log('✅ Landing page verified, generating image...');

    // Generate image using OpenAI
    const openaiImageUrl = await generateImage(image_prompt);
    console.log('✅ Image generated by OpenAI');

    // Upload to Supabase Storage
    const storageUrl = await uploadImageToStorage(
      supabaseClient,
      openaiImageUrl,
      userId,
      landing_page_id,
      section_index
    );

    // Update landing page sections with image URL
    const updatedSections = [...landingPage.sections];
    updatedSections[section_index] = {
      ...updatedSections[section_index],
      image_url: storageUrl
    };

    console.log('💾 Updating landing page with new image URL...');

    const { error: updateError } = await supabaseClient
      .from('landing_pages')
      .update({ sections: updatedSections })
      .eq('id', landing_page_id);

    if (updateError) {
      console.error('❌ Failed to update landing page:', updateError);
      return createErrorResponse(
        'Failed to update landing page',
        updateError.message,
        500
      );
    }

    console.log('✅ Landing page updated successfully');

    return createSuccessResponse({
      message: 'Image generated and uploaded successfully',
      image_url: storageUrl,
      section_index: section_index,
      landing_page_id: landing_page_id
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
