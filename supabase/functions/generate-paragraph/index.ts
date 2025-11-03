import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared utilities from rss-feeds function
import { runGpt } from '../rss-feeds/ai.ts';
import { authenticateUser, createAuthenticatedClient } from '../rss-feeds/auth.ts';
import { handleCors, createErrorResponse, createSuccessResponse } from '../rss-feeds/http-utils.ts';

interface GenerateSectionRequest {
  landingPageId: string;
  prompt: string;
  contentType: string;
  context?: string;
}

const CONTENT_TYPE_PROMPTS = {
  'product-description': 'Write a compelling product description that highlights features and benefits in a persuasive way.',
  'problem-solution': 'Describe a specific problem that the target audience faces and explain how this product/service solves it.',
  'social-proof': 'Write a paragraph that builds credibility using testimonials, statistics, or expert endorsements.',
  'urgency-scarcity': 'Create a sense of urgency or scarcity to encourage immediate action.',
  'benefit-focused': 'Focus on the key benefits and transformations the customer will experience.',
  'story-telling': 'Tell a relatable story that connects emotionally with the audience.',
  'comparison': 'Compare this solution to alternatives or the current situation, showing why it\'s better.',
  'how-it-works': 'Explain the process or mechanism of how the product/service works in simple terms.',
  'objection-handling': 'Address common objections or concerns potential customers might have.',
  'call-to-value': 'Emphasize the value proposition and return on investment.'
};

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

    const { landingPageId, prompt, contentType, context }: GenerateSectionRequest = await req.json();

    if (!landingPageId || !prompt || !contentType) {
      return createErrorResponse(
        'Missing required fields',
        'landingPageId, prompt, and contentType are required',
        400
      );
    }

    console.log('📝 Generating section:', { landingPageId, contentType, promptLength: prompt.length });

    // Fetch landing page to get context
    const { data: landingPage, error: pageError } = await supabaseClient
      .from('landing_pages')
      .select(`
        *,
        ai_generated_items (
          headline,
          description,
          campaigns (
            name,
            url,
            description,
            product_description,
            target_audience
          )
        )
      `)
      .eq('id', landingPageId)
      .single();

    if (pageError || !landingPage) {
      return createErrorResponse('Landing page not found', pageError?.message || '', 404);
    }

    // Build context for AI
    const fullContext = context || `
Landing Page Title: ${landingPage.title}
Campaign: ${landingPage.ai_generated_items?.campaigns?.name || 'N/A'}
Business Description: ${landingPage.ai_generated_items?.campaigns?.description || 'N/A'}
Product/Service Description: ${landingPage.ai_generated_items?.campaigns?.product_description || 'N/A'}
Target Audience: ${landingPage.ai_generated_items?.campaigns?.target_audience || 'N/A'}
Current Content: ${landingPage.sections?.map((s: any) => s.paragraphs?.join(' ')).join(' ') || 'N/A'}
    `.trim();

    const contentTypeInstruction = CONTENT_TYPE_PROMPTS[contentType as keyof typeof CONTENT_TYPE_PROMPTS] || 
      'Write a persuasive paragraph for a sales landing page.';

    // Build prompt for AI (using JSON format since runGpt expects JSON response)
    const aiPrompt = `You are an expert direct-response copywriter specializing in high-converting sales and advertising content. 
Your task is to create compelling landing page sections that drive conversions.

Follow these guidelines:
- Write in a clear, persuasive, and engaging style
- Focus on benefits, not just features
- Use emotional triggers and power words
- Each section should have 2-4 substantial paragraphs
- Maintain a professional yet conversational tone
- Avoid generic or clichéd phrases
- Make every sentence count
- Tailor your language and messaging to speak directly to the target audience
- Highlight specific product features and benefits from the product description
- Use the target audience information to choose appropriate examples and appeals

CONTENT TYPE: ${contentTypeInstruction}

USER'S SPECIFIC REQUEST: ${prompt}

CONTEXT ABOUT THIS LANDING PAGE:
${fullContext}

Create ONE complete landing page section that fits naturally into this landing page.

CRITICAL: Return response as valid JSON in this exact format:
{
  "subtitle": "Compelling section headline or subhead",
  "paragraphs": [
    "First compelling paragraph here",
    "Second compelling paragraph here",
    "Third paragraph if needed"
  ],
  "image_prompt": "Description for generating a relevant image (visual elements only, no text/words/letters)",
  "cta": "Call to action text if this section needs a button, otherwise null"
}

Return ONLY valid JSON, no additional text or explanation.`;

    console.log('🤖 Calling AI with prompt length:', aiPrompt.length);

    // Use shared runGpt function (returns JSON)
    const gptResponse = await runGpt(aiPrompt, supabaseClient, userId);
    
    console.log('📦 Raw GPT response:', gptResponse.substring(0, 200));
    
    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(gptResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse GPT response:', parseError);
      console.error('Response was:', gptResponse);
      throw new Error('Failed to parse AI response as JSON');
    }
    
    // Validate section structure
    if (!parsedResponse.subtitle || !parsedResponse.paragraphs || !Array.isArray(parsedResponse.paragraphs)) {
      throw new Error('Invalid section structure in AI response');
    }
    
    if (parsedResponse.paragraphs.length === 0) {
      throw new Error('No paragraph content in AI response');
    }

    console.log('✅ Section generated successfully:', {
      subtitle: parsedResponse.subtitle.substring(0, 50) + '...',
      paragraphCount: parsedResponse.paragraphs.length,
      hasImagePrompt: !!parsedResponse.image_prompt,
      hasCTA: !!parsedResponse.cta
    });

    return createSuccessResponse({
      success: true,
      section: {
        subtitle: parsedResponse.subtitle,
        paragraphs: parsedResponse.paragraphs,
        image_prompt: parsedResponse.image_prompt,
        cta: parsedResponse.cta
      },
      contentType,
    });

  } catch (error) {
    console.error('Error generating section:', error);
    return createErrorResponse(
      'Section generation failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});
