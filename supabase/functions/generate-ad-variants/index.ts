import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { runGpt } from '../rss-feeds/ai.ts';
import { InsufficientCreditsError } from '../rss-feeds/credits.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Country to language mapping
const COUNTRY_LANGUAGES: Record<string, { language: string; name: string }> = {
  'US': { language: 'English', name: 'United States' },
  'GB': { language: 'English', name: 'United Kingdom' },
  'DE': { language: 'German', name: 'Germany' },
  'FR': { language: 'French', name: 'France' },
  'IL': { language: 'Hebrew', name: 'Israel' },
  'ES': { language: 'Spanish', name: 'Spain' },
  'IT': { language: 'Italian', name: 'Italy' },
  'CA': { language: 'English', name: 'Switzerland' },
  'MX': { language: 'Mexican', name: 'Mexico' },
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
  current_image_url?: string;
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

function buildVariantPrompt(aiItem: any, campaign: any, options: any): string {
  const tones = options.tones?.join(', ') || 'professional, casual, urgent';
  
  // Determine target language based on campaign countries
  const countries = campaign.rss_countries || ['US'];
  const primaryCountry = countries[0] || 'US';
  const targetLanguageInfo = COUNTRY_LANGUAGES[primaryCountry] || COUNTRY_LANGUAGES['US'];
  const targetLanguage = targetLanguageInfo.language;
  const isEnglish = targetLanguage === 'English';
  
  return `Create ${options.count || 3} different ad variations for A/B testing based on this content:

ORIGINAL NEWS ARTICLE:
- News Headline: "${aiItem.headline}"
- News Description: "${aiItem.description}"
- News Source: ${aiItem.link}

CURRENT AD PLACEMENT:
- Ad Headline: "${aiItem.ad_placement?.headline || aiItem.headline}"
- Ad Body: "${aiItem.ad_placement?.body || aiItem.description}"
- Ad CTA: "${aiItem.ad_placement?.cta || 'Learn More'}"

CAMPAIGN CONTEXT:
- Campaign: ${campaign.name}
- Campaign Description: ${campaign.description}
- Target Audience: ${campaign.target_audience}
- Product/Service: ${campaign.product_description}
- Tags: ${aiItem.tags?.join(', ') || 'None'}
- Keywords: ${aiItem.keywords?.join(', ') || 'None'}
- Target Country: ${targetLanguageInfo.name}
- Target Language: ${targetLanguage}

⚠️ CRITICAL REQUIREMENTS:

1. LANGUAGE: ALL ad variants (headline, body, CTA) MUST be written in ${targetLanguage} for the ${targetLanguageInfo.name} market.
${!isEnglish ? '   You MUST also provide English translations for headline and body in separate fields (headline_en, body_en).' : '   Since the target language is English, translation fields should be left empty.'}

2. NEWS REFERENCE: Each variant should subtly reference the original news article ("${aiItem.headline}") to maintain relevance and context. 
   - Connect the news event to the campaign's value proposition
   - Use the news as a hook or conversation starter
   - Make the connection feel natural, not forced
   - Keep the news reference brief (don't dominate the ad)

3. VARIATION STRATEGY:
   - Generate ${options.count || 3} distinct variations in ${targetLanguage}
   - Each variation should test a different approach:
     * Benefit-focused (what they gain from acting on this news)
     * Pain-point/urgency focused (what they lose by ignoring this trend)
     * Social proof/authority focused (experts/others are responding)
     * Feature-focused (specific solutions for this situation)
     * Emotional focused (tap into feelings about the news)
   - Use these tones appropriately: ${tones}
${options.vary_headline ? `   - Vary headlines significantly (in ${targetLanguage})` : ''}
${options.vary_body ? `   - Vary body copy approach (in ${targetLanguage})` : ''}
${options.vary_cta ? `   - Vary call-to-action wording (in ${targetLanguage})` : ''}

For each variation, create:
1. A descriptive label in English (e.g., "Benefit Focus + News Hook", "Urgency + Trend Reference")
2. Headline in ${targetLanguage} (attention-grabbing, references news subtly)
3. Body text in ${targetLanguage} (2-3 sentences, compelling, connects news to offer)
4. Call-to-action in ${targetLanguage} (action-oriented, relevant to news context)
5. Image prompt in English (detailed description for AI image generation)
6. Tone classification (professional/casual/urgent/friendly/authoritative)
7. Focus classification (benefit/urgency/social-proof/feature/emotional)
${!isEnglish ? '8. headline_en: English translation of the headline\n9. body_en: English translation of the body' : ''}

RESPONSE FORMAT (JSON only):
{
  "variants": [
    {
      "variant_label": "Benefit Focus + News Hook",
      "headline": ${!isEnglish ? `"[Headline in ${targetLanguage} that references the news]"` : `"Capitalize on [News Topic]: Transform Your Business Today"`},
      "body": ${!isEnglish ? `"[Body in ${targetLanguage} that connects news to offer]"` : `"With [brief news reference], now's the perfect time to [benefit]. Our solution helps you [specific advantage]. Don't miss this opportunity."`},
      "cta": ${!isEnglish ? `"[CTA in ${targetLanguage}]"` : `"Get Started Now"`},
      ${!isEnglish ? `"headline_en": "Capitalize on [News Topic]: Transform Your Business Today",\n      "body_en": "With [brief news reference], now's the perfect time to [benefit]. Our solution helps you [specific advantage]. Don't miss this opportunity.",` : ''}
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

    const userId = user.id;

    // Parse request body
    const requestData: VariantGenerationRequest = await req.json();
    const { ai_item_id, count = 3, options = {}, current_image_url } = requestData;

    if (!ai_item_id) {
      return new Response(
        JSON.stringify({ error: 'ai_item_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎯 Starting variant generation for AI item:', ai_item_id);
    console.log('📸 Current image URL:', current_image_url);

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

    // Generate variants using OpenAI via runGpt helper
    const openaiResponse = await runGpt(prompt, supabaseClient, userId);
    
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
      image_url: current_image_url || null, // Use the current image from the AI item
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
    
    // Handle insufficient credits error specifically
    if (error instanceof InsufficientCreditsError) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          message: error.message,
          currentCredits: error.currentCredits
        }),
        {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
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