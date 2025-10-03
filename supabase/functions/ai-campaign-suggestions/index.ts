import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared utilities
import { authenticateUser, createAuthenticatedClient } from '../rss-feeds/auth.ts';
import { handleCors, createErrorResponse, createSuccessResponse } from '../rss-feeds/http-utils.ts';
import { runGpt } from '../rss-feeds/ai.ts';

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

    // Get request data
    const { url, name } = await req.json();
    
    if (!url) {
      return createErrorResponse('Missing required field', 'URL is required', 400);
    }

    console.log('🤖 Generating campaign suggestions for:', { url, name });

    // Prepare prompt for AI analysis
    const prompt = `
Analyze the company website at "${url}" ${name ? `(company name: "${name}")` : ''} and provide:

1. 9 relevant tags that describe the company's business, industry, target audience, and solutions
2. A 3-4 sentence description that explains:
   - What the company does
   - The main problem they solve for their customers
   - Their target market or industry focus
3. A 2-3 sentence product description that focuses on:
   - The specific product or service offering
   - Key features or benefits
   - What makes it unique or valuable

Return your response in this exact JSON format:
{
  "suggested_tags": ["tag1", "tag2", "tag3", ...15 tags],
  "suggested_description": "3-4 sentence description here",
  "product_description": "2-3 sentence product description here"
}

Guidelines for tags:
- Use lowercase, single words or short phrases
- Include industry terms, product types (e.g., "computer games", "books", "software"), target audience keywords
- Avoid generic words like "company", "business", "service", "online retail", "business", "innovation"

Guidelines for description:
- Start with what the company does
- Explain the core problem they solve
- Mention their target customers/market
- Keep it professional and informative
- 3-4 sentences maximum

Guidelines for product description:
- Focus on the actual product or service
- Highlight key features or benefits
- Keep it concise and compelling
- 2-5 sentences maximum

If you cannot access the website, provide general business-appropriate suggestions based on the URL domain and company name.
`;

    try {
      // Call OpenAI API using shared utility
      const aiContent = await runGpt(prompt);

      // Parse AI response
      const suggestions = JSON.parse(aiContent.trim());
      
      // Validate response structure
      if (!suggestions.suggested_tags || !Array.isArray(suggestions.suggested_tags)) {
        throw new Error('Invalid AI response: missing or invalid tags');
      }
      
      if (!suggestions.suggested_description || typeof suggestions.suggested_description !== 'string') {
        throw new Error('Invalid AI response: missing or invalid description');
      }
      
      if (!suggestions.product_description || typeof suggestions.product_description !== 'string') {
        throw new Error('Invalid AI response: missing or invalid product description');
      }

      // Use only the tags provided by AI, no fallbacks
      const tags = suggestions.suggested_tags;

      console.log('✅ AI suggestions generated successfully:', {
        tags: tags.length,
        descriptionLength: suggestions.suggested_description.length,
        productDescriptionLength: suggestions.product_description.length
      });

      return createSuccessResponse({
        suggested_tags: tags,
        suggested_description: suggestions.suggested_description,
        product_description: suggestions.product_description,
        source: 'ai-generated'
      });

    } catch (aiError) {
      console.error('❌ AI generation failed:', aiError);
      
      // Return empty tags if AI generation fails
      console.log('🔄 Using empty suggestions due to AI failure');
      
      return createSuccessResponse({
        suggested_tags: [],
        suggested_description: '',
        product_description: '',
        source: 'ai-failed'
      });
    }

  } catch (error) {
    console.error('Edge function error:', error);
    return createErrorResponse(
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});

