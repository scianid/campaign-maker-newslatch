import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared utilities
import { authenticateUser, createAuthenticatedClient } from '../rss-feeds/auth.ts';
import { handleCors, createErrorResponse, createSuccessResponse } from '../rss-feeds/http-utils.ts';

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

1. 12 relevant tags that describe the company's business, industry, target audience, and solutions
2. A 3-4 sentence description that explains:
   - What the company does
   - The main problem they solve for their customers
   - Their target market or industry focus

Return your response in this exact JSON format:
{
  "suggested_tags": ["tag1", "tag2", "tag3", ...15 tags],
  "suggested_description": "3-4 sentence description here"
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

If you cannot access the website, provide general business-appropriate suggestions based on the URL domain and company name.
`;

    try {
      // Call OpenAI API (you'll need to add your API key to environment variables)
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a marketing expert who analyzes companies and creates campaign suggestions. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const openaiResult = await openaiResponse.json();
      const aiContent = openaiResult.choices[0]?.message?.content;

      if (!aiContent) {
        throw new Error('No content received from AI');
      }

      // Parse AI response
      const suggestions = JSON.parse(aiContent.trim());
      
      // Validate response structure
      if (!suggestions.suggested_tags || !Array.isArray(suggestions.suggested_tags)) {
        throw new Error('Invalid AI response: missing or invalid tags');
      }
      
      if (!suggestions.suggested_description || typeof suggestions.suggested_description !== 'string') {
        throw new Error('Invalid AI response: missing or invalid description');
      }

      // Ensure we have exactly 15 tags
      const tags = suggestions.suggested_tags.slice(0, 15);
      
      // Pad with generic tags if we don't have enough
      const fallbackTags = [
        'business', 'technology', 'innovation', 'solutions', 'digital', 
        'services', 'productivity', 'automation', 'efficiency', 'growth',
        'professional', 'enterprise', 'software', 'platform', 'tools'
      ];
      
      while (tags.length < 15) {
        const fallbackTag = fallbackTags[tags.length - suggestions.suggested_tags.length];
        if (fallbackTag && !tags.includes(fallbackTag)) {
          tags.push(fallbackTag);
        } else {
          break;
        }
      }

      console.log('✅ AI suggestions generated successfully:', {
        tags: tags.length,
        descriptionLength: suggestions.suggested_description.length
      });

      return createSuccessResponse({
        suggested_tags: tags,
        suggested_description: suggestions.suggested_description,
        source: 'ai-generated'
      });

    } catch (aiError) {
      console.error('❌ AI generation failed:', aiError);
      
      // Fallback to hardcoded suggestions based on URL analysis
      const domain = new URL(url).hostname.toLowerCase();
      const fallbackSuggestions = generateFallbackSuggestions(domain, name);
      
      console.log('🔄 Using fallback suggestions');
      
      return createSuccessResponse({
        ...fallbackSuggestions,
        source: 'fallback'
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

// Generate fallback suggestions based on domain analysis
function generateFallbackSuggestions(domain: string, name?: string): { suggested_tags: string[], suggested_description: string } {
  const suggestions = {
    suggested_tags: [
      'business', 'technology', 'digital', 'solutions', 'innovation',
      'services', 'productivity', 'professional', 'software', 'platform',
      'automation', 'efficiency', 'growth', 'enterprise', 'tools'
    ],
    suggested_description: `This company provides innovative digital solutions to help businesses improve their operations and achieve their goals. They focus on delivering technology-driven services that enhance productivity and efficiency. Their platform is designed to meet the evolving needs of modern enterprises.`
  };

  // Customize based on domain keywords
  if (domain.includes('tech') || domain.includes('software') || domain.includes('app')) {
    suggestions.suggested_tags = [
      'technology', 'software', 'development', 'digital', 'innovation',
      'saas', 'platform', 'solutions', 'automation', 'cloud',
      'data', 'analytics', 'mobile', 'web', 'api'
    ];
    suggestions.suggested_description = `This technology company develops innovative software solutions that help businesses streamline their operations and enhance productivity. They specialize in creating digital platforms and tools that solve complex business challenges. Their software is designed to scale with growing enterprises and adapt to changing market needs.`;
  } else if (domain.includes('health') || domain.includes('medical') || domain.includes('care')) {
    suggestions.suggested_tags = [
      'healthcare', 'medical', 'wellness', 'patient-care', 'health-tech',
      'digital-health', 'telemedicine', 'medical-devices', 'diagnostics', 'treatment',
      'prevention', 'medical-software', 'health-data', 'clinical', 'therapeutic'
    ];
    suggestions.suggested_description = `This healthcare company provides innovative medical solutions that improve patient outcomes and healthcare delivery. They focus on developing technology and services that address critical healthcare challenges and enhance the quality of care. Their solutions are designed to support healthcare providers and improve patient experiences.`;
  } else if (domain.includes('finance') || domain.includes('bank') || domain.includes('pay')) {
    suggestions.suggested_tags = [
      'finance', 'fintech', 'banking', 'payments', 'financial-services',
      'digital-banking', 'investment', 'lending', 'cryptocurrency', 'blockchain',
      'financial-tech', 'money-management', 'trading', 'insurance', 'wealth'
    ];
    suggestions.suggested_description = `This financial technology company delivers innovative solutions that transform how people and businesses manage their finances. They specialize in creating digital financial services that are secure, efficient, and accessible. Their platform helps users make better financial decisions and achieve their financial goals.`;
  }

  // Add company name context if provided
  if (name) {
    suggestions.suggested_description = suggestions.suggested_description.replace(
      'This company',
      `${name}`
    );
  }

  return suggestions;
}