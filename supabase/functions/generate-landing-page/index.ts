import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared utilities from rss-feeds function
import { runGpt } from '../rss-feeds/ai.ts';
import { authenticateUser, createAuthenticatedClient } from '../rss-feeds/auth.ts';
import { handleCors, createErrorResponse, createSuccessResponse, getUrlParams, validateRequiredParams } from '../rss-feeds/http-utils.ts';

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
        Insert: {
          id?: string;
          ai_generated_item_id: string;
          title: string;
          slug?: string | null;
          is_active?: boolean;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
          sections?: any[] | null;
        };
        Update: {
          id?: string;
          ai_generated_item_id?: string;
          title?: string;
          slug?: string | null;
          is_active?: boolean;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
          sections?: any[] | null;
        };
      };
      ai_generated_items: {
        Row: {
          id: string;
          campaign_id: string;
          headline: string;
          clickbait: string;
          link: string;
          relevance_score: number;
          trend: string;
          description: string;
          tooltip: string;
          ad_placement: string | null;
          is_published: boolean;
          ttl: string;
          created_at: string;
          updated_at: string;
          image_url: string | null;
          tags: string[] | null;
        };
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          url: string;
          tags: string[];
          description: string | null;
          rss_categories: string[];
          rss_countries: string[];
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}

// Build the copywriting prompt (now returns JSON format for runGpt)
function buildLandingPagePrompt(aiItem: any, campaign: any, newsContent: string, description: string): string {
  const productInfo = `
PRODUCT INFO:
Campaign: ${campaign.name}
Website: ${campaign.url}
Business Description: ${campaign.description || 'No description provided'}
Product/Service Description: ${campaign.product_description || 'No product description provided'}
Target Audience: ${campaign.target_audience || 'No target audience specified'}
Tags: ${campaign.tags?.join(', ') || 'None'}
Categories: ${campaign.rss_categories?.join(', ') || 'None'}

Product Details:
- Headline: ${aiItem.headline}
- Description: ${aiItem.description}
- Trend: ${aiItem.trend}
- Relevance Score: ${aiItem.relevance_score}/100
- Tooltip: ${aiItem.tooltip}
`;

  return `You are a professional direct-response copywriter. 
I will give you three inputs:
1. A news article text.
2. A product/service I want to sell with detailed information including target audience.
3. The logic behind the product and why it is relevant to the news article.

Your task:
- Transform the news article into a concise but powerful advertorial-style landing page article that sells the product.
- Use the provided target audience information to tailor your messaging, tone, and appeals specifically to that demographic.
- Leverage the detailed product/service description to highlight specific features, benefits, and unique value propositions.
- The structure must follow this sequence (MAX 5 SECTIONS):
   1. Hero section (headline, subheadline, compelling intro story with hook, CTA)
   2. Problem amplification + Authority/credibility (combine the problem with your expertise)
   3. Unique mechanism/discovery + How it works (explain the solution and methodology)
   4. Benefits/results + Social proof (show outcomes and testimonials)
   5. Final offer + CTA (pricing, guarantee, urgency, final call to action)

- Each section should be substantial with 3-5 paragraphs of compelling copy
- Focus on emotional storytelling and strong benefits in each section
- Speak directly to the target audience using language and examples that resonate with them
- Highlight specific product features and benefits mentioned in the product description

- Output everything as a JSON object.
- Each section should contain:
   - "subtitle": string (the section headline or subhead)
   - "paragraphs": array of strings (the body text in multiple paragraphs)
   - "image_prompt": string (a description prompt for generating an image for this section, or leave null if no image needed. IMPORTANT: Images should NOT contain any text, words, letters, or numbers. Focus on visual elements, scenes, objects, and people only.)
   - "cta": string (optional, only for sections with a call to action button, otherwise null)

Inputs:
[NEWS ARTICLE]: ${newsContent}

[PRODUCT INFO]: ${productInfo}

[LOGIC]: ${description}

CRITICAL: Return response as valid JSON in this exact format:
{
  "title": "The overall article title",
  "sections": [
    {
      "subtitle": "This section's subtitle",
      "paragraphs": [
        "PARAGRAPH 1",
        "PARAGRAPH 2"
      ],
      "image_prompt": "A PROMPT FOR THE RELEVANT IMAGE HERE",
      "cta": "A CALL TO ACTION"
    }
  ]
}

Return ONLY valid JSON, no additional text or explanation.`;
}

// Fetch news content from the link
async function fetchNewsContent(url: string): Promise<string> {
  console.log('🔗 Fetching news content from:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch news content: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Basic HTML to text extraction (you might want to use a more sophisticated parser)
    const textContent = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Take first 2000 characters to avoid token limits
    const truncatedContent = textContent.length > 2000 
      ? textContent.substring(0, 2000) + '...'
      : textContent;
    
    console.log('✅ Successfully fetched news content, length:', truncatedContent.length);
    return truncatedContent;
    
  } catch (error) {
    console.error('❌ Failed to fetch news content:', error);
    // Fallback: use a generic message
    return `News Article Content: Unable to fetch the full article content from the provided URL: ${url}. Please use the headline and description provided.`;
  }
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

    // Get AI generated item ID from request body or URL params
    let aiItemId: string;
    
    try {
      const body = await req.json();
      aiItemId = body.ai_item_id || body.aiItemId || body.id;
    } catch {
      // Fallback to URL params if body parsing fails
      const params = getUrlParams(req);
      const validation = validateRequiredParams(params, ['ai_item_id']);
      
      if (!validation.valid) {
        return createErrorResponse(
          'Missing required parameters',
          'ai_item_id is required either in request body or as URL parameter',
          400
        );
      }
      
      aiItemId = params.get('ai_item_id')!;
    }

    if (!aiItemId) {
      return createErrorResponse(
        'Missing AI item ID',
        'ai_item_id is required',
        400
      );
    }

    console.log('🚀 Starting landing page generation for AI item:', aiItemId);

    // Fetch AI generated item with campaign data
    const { data: aiItem, error: aiItemError } = await supabaseClient
      .from('ai_generated_items')
      .select(`
        *,
        campaigns (*)
      `)
      .eq('id', aiItemId)
      .single();

    if (aiItemError || !aiItem) {
      return createErrorResponse(
        'AI item not found',
        'The specified AI generated item does not exist or is not accessible',
        404
      );
    }

    console.log('✅ Found AI item:', aiItem.headline);

    // Check if landing page already exists
    const { data: existingLandingPage } = await supabaseClient
      .from('landing_pages')
      .select('id, title, slug')
      .eq('ai_generated_item_id', aiItemId)
      .single();

    if (existingLandingPage) {
      return createErrorResponse(
        'Landing page already exists',
        `A landing page already exists for this AI item: ${existingLandingPage.title}`,
        409
      );
    }

    // Fetch news content from the link
    const newsContent = {
        headline: aiItem.headline,
        trend: aiItem.trend,
        ad_copy: aiItem.ad_placement,
        clickbait: aiItem.clickbait,
        tags: aiItem.tags || []
    }

    // Build the copywriting prompt
    const prompt = buildLandingPagePrompt(aiItem, aiItem.campaigns, JSON.stringify(newsContent), aiItem.description);

    console.log('🤖 Calling OpenAI to generate landing page...');

    // Use shared runGpt function
    const openaiResponse = await runGpt(prompt);
    
    console.log('✅ OpenAI response received');

    // Parse the response
    let landingPageData;
    try {
      landingPageData = JSON.parse(openaiResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', parseError);
      console.error('Response was:', openaiResponse);
      return createErrorResponse(
        'Failed to parse AI response',
        'The AI generated invalid JSON response',
        500
      );
    }

    // Validate the response structure
    if (!landingPageData.title || !landingPageData.sections || !Array.isArray(landingPageData.sections)) {
      return createErrorResponse(
        'Invalid AI response structure',
        'The AI response is missing required fields (title, sections)',
        500
      );
    }

    console.log('💾 Saving landing page to database...');

    // Save to database
    const { data: savedLandingPage, error: saveError } = await supabaseClient
      .from('landing_pages')
      .insert({
        ai_generated_item_id: aiItemId,
        title: landingPageData.title,
        sections: landingPageData.sections,
        is_active: true
      })
      .select()
      .single();

    if (saveError) {
      console.error('❌ Failed to save landing page:', saveError);
      return createErrorResponse(
        'Failed to save landing page',
        saveError.message,
        500
      );
    }

    console.log('✅ Landing page saved successfully:', savedLandingPage.id);

    return createSuccessResponse({
      message: 'Landing page generated successfully',
      landing_page: savedLandingPage,
      sections_count: landingPageData.sections.length,
      ai_item_id: aiItemId
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