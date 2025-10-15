import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OpenAI API configuration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Country to language mapping
const COUNTRY_LANGUAGES: Record<string, { language: string; name: string }> = {
  'US': { language: 'English', name: 'United States' },
  'GB': { language: 'English', name: 'United Kingdom' },
  'DE': { language: 'German', name: 'Germany' },
  'FR': { language: 'French', name: 'France' },
  'ES': { language: 'Spanish', name: 'Spain' },
  'IT': { language: 'Italian', name: 'Italy' },
  'CA': { language: 'English', name: 'Switzerland' },
};

interface VariantGenerationRequest {
  ai_item_id: string;
  count: number;
  options: {
    vary_headline?: boolean;
    vary_body?: boolean;
    vary_cta?: boolean;
    tones?: string[];
  };
}

interface GeneratedVariant {
  variant_label: string;
  headline: string;
  body: string;
  cta: string;
  headline_en?: string;
  body_en?: string;
  image_prompt: string;
  tone: string;
  focus: string;
}

async function callOpenAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert copywriter specializing in creating multiple ad variations for A/B testing. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

function buildVariantPrompt(aiItem: any, campaign: any, options: any): string {
  const tones = options.tones?.join(', ') || 'professional, casual, urgent';
  
  // Determine target language based on campaign countries
  const countries = campaign.rss_countries || ['US'];
  const primaryCountry = countries[0] || 'US';
  const targetLanguageInfo = COUNTRY_LANGUAGES[primaryCountry] || COUNTRY_LANGUAGES['US'];
  const targetLanguage = targetLanguageInfo.language;
  const isEnglish = targetLanguage === 'English';
  
  return `Create ${options.count || 3} different ad variations for A/B testing based on this content:

ORIGINAL CONTENT:
- Headline: "${aiItem.headline}"
- Description: "${aiItem.description}"
- Link: ${aiItem.link}
- Campaign: ${campaign.name}
- Campaign Description: ${campaign.description}
- Target Audience: ${campaign.target_audience}

CAMPAIGN CONTEXT:
- Product/Service: ${campaign.product_description}
- Tags: ${aiItem.tags?.join(', ') || 'None'}
- Keywords: ${aiItem.keywords?.join(', ') || 'None'}
- Target Country: ${targetLanguageInfo.name}
- Target Language: ${targetLanguage}

⚠️ CRITICAL LANGUAGE REQUIREMENT:
ALL ad variants (headline, body, CTA) MUST be written in ${targetLanguage} for the ${targetLanguageInfo.name} market.
${!isEnglish ? 'You MUST also provide English translations for headline and body in separate fields (headline_en, body_en).' : 'Since the target language is English, translation fields should be left empty.'}

VARIATION REQUIREMENTS:
- Generate ${options.count || 3} distinct variations in ${targetLanguage}
- Each variation should test a different approach:
  * Benefit-focused (what they gain)
  * Pain-point/urgency focused (what they lose)
  * Social proof/authority focused
  * Feature-focused
  * Emotional focused
- Use these tones appropriately: ${tones}
${options.vary_headline ? `- Vary headlines significantly (in ${targetLanguage})` : ''}
${options.vary_body ? `- Vary body copy approach (in ${targetLanguage})` : ''}
${options.vary_cta ? `- Vary call-to-action wording (in ${targetLanguage})` : ''}

For each variation, create:
1. A descriptive label in English (e.g., "Benefit Focus", "Urgency Appeal")
2. Headline in ${targetLanguage} (attention-grabbing, relevant)
3. Body text in ${targetLanguage} (2-3 sentences, compelling)
4. Call-to-action in ${targetLanguage} (action-oriented)
5. Image prompt in English (detailed description for AI image generation)
6. Tone classification (professional/casual/urgent/friendly/authoritative)
7. Focus classification (benefit/urgency/social-proof/feature/emotional)
${!isEnglish ? '8. headline_en: English translation of the headline\n9. body_en: English translation of the body' : ''}

RESPONSE FORMAT (JSON only):
{
  "variants": [
    {
      "variant_label": "Benefit Focus",
      "headline": ${!isEnglish ? `"[Headline in ${targetLanguage}]"` : `"Transform Your Business with New Opportunities"`},
      "body": ${!isEnglish ? `"[Body text in ${targetLanguage}]"` : `"Discover how these changes can boost your profits and streamline operations. Don't miss out on competitive advantages."`},
      "cta": ${!isEnglish ? `"[CTA in ${targetLanguage}]"` : `"Get Started Today"`},
      ${!isEnglish ? `"headline_en": "Transform Your Business with New Opportunities",\n      "body_en": "Discover how these changes can boost your profits and streamline operations. Don't miss out on competitive advantages.",` : ''}
      "image_prompt": "Professional business team celebrating success in modern office, diverse group looking at positive charts and graphs, bright lighting, corporate success imagery",
      "tone": "professional",
      "focus": "benefit"
    }
  ]
}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token from Authorization header
    const jwt = authHeader.replace('Bearer ', '');

    // Create Supabase client with anon key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication using the JWT token directly
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message || 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Authenticated user:', user.id);

    // Parse request body
    const requestData: VariantGenerationRequest = await req.json();
    const { ai_item_id, count = 3, options = {} } = requestData;

    if (!ai_item_id) {
      return new Response(
        JSON.stringify({ error: 'ai_item_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎯 Starting variant generation for AI item:', ai_item_id);

    // Fetch AI item with campaign data
    const { data: aiItem, error: aiItemError } = await supabaseClient
      .from('ai_generated_items')
      .select(`
        *,
        campaigns (*)
      `)
      .eq('id', ai_item_id)
      .single();

    if (aiItemError || !aiItem) {
      return new Response(
        JSON.stringify({ error: 'AI item not found or not accessible' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns this campaign
    if (aiItem.campaigns.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to access this campaign' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Found AI item:', aiItem.headline);

    // Build prompt for AI generation
    const prompt = buildVariantPrompt(aiItem, aiItem.campaigns, { ...options, count });

    console.log('🤖 Calling OpenAI for variant generation...');

    // Generate variants using OpenAI
    const openaiResponse = await callOpenAI(prompt);
    
    let variantsData;
    try {
      variantsData = JSON.parse(openaiResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid response from AI service');
    }

    if (!variantsData.variants || !Array.isArray(variantsData.variants)) {
      throw new Error('Invalid variants structure in AI response');
    }

    console.log('✅ Generated variants:', variantsData.variants.length);

    // Prepare variants for database insertion
    const variantsToSave = variantsData.variants.map((variant: GeneratedVariant, index: number) => ({
      ai_generated_item_id: ai_item_id,
      variant_label: variant.variant_label,
      display_order: index + 1, // Start from 1, 0 is reserved for original
      headline: variant.headline,
      body: variant.body,
      cta: variant.cta,
      headline_en: variant.headline_en || null,
      body_en: variant.body_en || null,
      image_url: null, // Initially no image selected
      image_prompt: variant.image_prompt,
      tone: variant.tone || 'professional',
      focus: variant.focus || 'general',
      is_favorite: false,
    }));

    // Save variants to database
    const { data: savedVariants, error: saveError } = await supabaseClient
      .from('ad_variants')
      .insert(variantsToSave)
      .select();

    if (saveError) {
      console.error('❌ Failed to save variants:', saveError);
      throw new Error('Failed to save generated variants');
    }

    console.log('💾 Saved variants to database:', savedVariants?.length || 0);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Ad variants generated successfully',
        variants: savedVariants,
        count: savedVariants?.length || 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Edge function error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to generate variants',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});