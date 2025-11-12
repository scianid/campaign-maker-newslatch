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
};

// Get CTA examples for the target language
function getCTAExamples(language: string): string {
  const examples: Record<string, string> = {
    'French': `- "Commencer"
- "En Savoir Plus"
- "Devis Gratuit"
- "Nous Contacter"
- "Essayer"`,
    'German': `- "Jetzt Starten"
- "Mehr Erfahren"
- "Kostenlos Anfragen"
- "Kontakt"
- "Jetzt Testen"`,
    'Hebrew': `- "התחל עכשיו"
- "למד עוד"
- "הצעת מחיר חינם"
- "הזמן עכשיו"
- "קנה עכשיו"
- "צור קשר"
- "נסה עכשיו"`,
    'Spanish': `- "Comenzar"
- "Saber Más"
- "Cotización Gratis"
- "Contáctanos"
- "Probar Ahora"`,
    'Italian': `- "Inizia Ora"
- "Scopri di Più"
- "Preventivo Gratuito"
- "Contattaci"
- "Prova Ora"`,
    'English': `- "Get Started"
- "Learn More"
- "Free Quote"
- "Contact Us"
- "Try Now"
- "Schedule Call"`
  };
  
  return examples[language] || examples['English'];
}

export function buildPrompt(
    newsArray: Array<{ headline: string; link: string }>,
    tags: string[],
    campaignInfo?: { name: string; description: string; url: string; tags: string[]; product_description?: string; target_audience?: string; rss_countries?: string[] }
): string {
    // Use campaign info if provided, otherwise fallback to generic approach
    const companyName = campaignInfo?.name || "the business";
    const companyUrl = campaignInfo?.url || "their website";
    const companyDesc = campaignInfo?.description || "their services";
    const companyTags = campaignInfo?.tags || [];
    const productDesc = campaignInfo?.product_description || "";
    const targetAudience = campaignInfo?.target_audience || "";
    
    // Determine target language based on campaign countries
    const countries = campaignInfo?.rss_countries || ['US'];
    const primaryCountry = countries[0] || 'US';
    const targetLanguageInfo = COUNTRY_LANGUAGES[primaryCountry] || COUNTRY_LANGUAGES['US'];
    const targetLanguage = targetLanguageInfo.language;
    const isEnglish = targetLanguage === 'English';
    
    // Determine industry context for appropriate messaging
    const allTags = [...companyTags, ...tags].map(t => t.toLowerCase());
    const isGambling = allTags.some(tag => 
      ['gambling', 'casino', 'betting', 'poker', 'slots', 'sports betting', 'gaming'].includes(tag)
    );
    const isFinance = allTags.some(tag => 
      ['finance', 'banking', 'investment', 'trading', 'loans', 'credit', 'financial'].includes(tag)
    );
    const isHealthcare = allTags.some(tag => 
      ['health', 'medical', 'healthcare', 'wellness', 'fitness', 'therapy'].includes(tag)
    );
    const isEcommerce = allTags.some(tag => 
      ['ecommerce', 'retail', 'shopping', 'store', 'marketplace'].includes(tag)
    );
    const isTechnology = allTags.some(tag => 
      ['technology', 'software', 'saas', 'app', 'platform', 'tech', 'digital'].includes(tag)
    );

    // Build industry-specific CTA guidance
    let ctaGuidance = '';
    if (isGambling) {
      ctaGuidance = `\n⚠️ GAMBLING/CASINO INDUSTRY: CTAs should focus on entertainment and excitement. Use action-oriented language like "Play Now", "Join the Action", "Start Playing", "Claim Bonus", "Spin Now", "Bet Now". Avoid financial recovery language like "Recover Funds" or "Get Balance".`;
    } else if (isFinance) {
      ctaGuidance = `\n⚠️ FINANCE INDUSTRY: CTAs should focus on financial goals and security. Use language like "Get Started", "Apply Now", "Check Rates", "Learn More", "Invest Now", "Free Consultation". Keep professional and trustworthy.`;
    } else if (isHealthcare) {
      ctaGuidance = `\n⚠️ HEALTHCARE INDUSTRY: CTAs should focus on care and improvement. Use language like "Book Appointment", "Learn More", "Get Help", "Start Treatment", "Consult Now", "Schedule Visit". Keep caring and professional.`;
    } else if (isEcommerce) {
      ctaGuidance = `\n⚠️ E-COMMERCE INDUSTRY: CTAs should focus on shopping and discovery. Use language like "Shop Now", "View Deals", "Browse Collection", "Add to Cart", "Buy Now", "Explore Products". Create urgency and excitement.`;
    } else if (isTechnology) {
      ctaGuidance = `\n⚠️ TECHNOLOGY/SaaS INDUSTRY: CTAs should focus on trials and demos. Use language like "Try Free", "Start Free Trial", "Get Demo", "Sign Up", "Learn More", "See How It Works". Emphasize ease and value.`;
    }

    return `
You are an expert AI marketing analyst creating targeted ad placements for lead generation campaigns.

CAMPAIGN CONTEXT:
Company/Campaign: ${companyName}
Business Description: ${companyDesc}
Product/Service Description: ${productDesc}
Target Audience: ${targetAudience}
Campaign Tags: ${companyTags.join(", ")}
Target Categories: ${tags.join(", ")}
Target Country: ${targetLanguageInfo.name}
Target Language: ${targetLanguage}${ctaGuidance}

YOUR MISSION:
Analyze the provided news articles and create compelling ad placements that connect current events to ${companyName}'s services. Each selected headline should create urgency and drive potential customers to take action.

⚠️ CRITICAL LANGUAGE REQUIREMENT:
ALL ad content (headline, body, CTA) MUST be written in ${targetLanguage} for the ${targetLanguageInfo.name} market.
${!isEnglish ? 'You MUST also provide English translations for title and body in separate fields.' : 'Since the target language is English, translation fields should be left empty.'}

NEWS ANALYSIS OBJECTIVES:
1. Identify 3-5 headlines most relevant for lead generation related to ${tags.join(", ")}
2. Connect news events to ${companyName}'s business value proposition
3. Create compelling ad copy in ${targetLanguage} that drives conversions appropriate for the industry
4. Focus on urgency, relevance, and clear calls-to-action that match the business context

For each selected headline, create:
- Viral clickbait optimized for ${companyName}'s target audience in ${targetLanguage}
- Clear connection between the news and ${companyName}'s services
- Urgency-driven description explaining why prospects need to act NOW
- Conversion-focused tooltip that drives traffic to ${companyUrl}

OUTPUT FORMAT (JSON only):
{
    "results": [
        {
            "headline": "[Original headline]",
            "clickbait": "[Viral clickbait hook for ${companyName}]",
            "link": "[Link from newsArray]",
            "relevance_score": [0-100],
            "trend": "[Short trend label]",
            "tags": ["[tag1]", "tag2"], // up to 5 tags including names in the title, fields of interest, locations, people, companies
            "keywords": ["keyword1", "keyword2", "keyword3"], // 5-10 specific keywords from this NEWS ARTICLE for ad targeting: actual names, places, events, specific topics, trending terms, niche phrases from the article. Focus on what makes THIS article unique and targetable at lower cost, not only generic business terms
            "description": "[Why this creates urgency for ${companyName}'s services]",
            "tooltip": "[Conversion-focused explanation connecting news to ${companyName}'s value - drive action toward ${companyUrl}]",
            "ad_placement": {
                "headline": "[Compelling ad headline in ${targetLanguage} that connects news to ${companyName}]",
                "body": "[Persuasive ad body text in ${targetLanguage} explaining the connection and value proposition]",
                "cta": "[Short action text in ${targetLanguage} ONLY - no URLs, no links, just 2-4 words]"${!isEnglish ? ',\n                "headline_en": "[English translation of headline]",\n                "body_en": "[English translation of body]"' : ''}
            },
            "image_prompt": "[Detailed Stable Diffusion prompt in English for generating a professional marketing image that combines the news topic with ${companyName}'s services. Make it visually compelling, professional, and relevant to the ad. Include style, composition, and key visual elements.]"
        }
    ],
    "trend_summary": "[Marketing strategy overview for ${companyName} based on identified trends]",
    "campaign_strategy": "[Specific recommendations for ${companyName} to capitalize on these news trends]"
}

NEWS ARTICLES TO ANALYZE:
${JSON.stringify({ newsArray })}

CRITICAL INSTRUCTIONS:
1. Response must be ONLY valid JSON - no explanatory text
2. Focus on ${companyName}'s business needs and target audience in ${targetLanguageInfo.name}
3. Every result must drive leads toward ${companyUrl}
4. Create urgency that compels immediate action
5. Return 1-3 highly relevant results maximum
6. ⚠️ MANDATORY: All ad_placement content (headline, body, cta) MUST be in ${targetLanguage}
7. ${!isEnglish ? '⚠️ MANDATORY: Provide English translations in headline_en and body_en fields' : 'Translation fields (headline_en, body_en) are not needed for English campaigns'}
8. ⚠️ CTA REQUIREMENTS: CTA must be SHORT button text only (2-4 words) - NO URLs or links. The CTA MUST match the industry and business context - consider the product/service being offered and create action language that makes sense for that specific business type.
9. If the content is too far away and the creative will not be approved by a marketing analyst expert, return less results in the array
10. ⚠️ KEYWORDS STRATEGY: Extract specific, unique keywords FROM THE NEWS ARTICLE itself - names, places, events, trending terms, niche topics. These should be low-competition, article-specific terms that will cost less for ad targeting, NOT broad generic business terms

CTA EXAMPLES for ${targetLanguage} (use similar format):
${getCTAExamples(targetLanguage)}

Generate JSON now:
    `;
}


export function buildPrompt2(
    newsArray: Array<{ headline: string; link: string }>,
    tags: string[],
    campaignInfo?: { name: string; description: string; url: string; tags: string[]; product_description?: string; target_audience?: string; rss_countries?: string[] }
): string {
    // Use campaign info if provided, otherwise fallback to generic approach
    const companyName = campaignInfo?.name || "the business";
    const companyUrl = campaignInfo?.url || "their website";
    const companyDesc = campaignInfo?.description || "their services";
    const companyTags = campaignInfo?.tags || [];
    const productDesc = campaignInfo?.product_description || "";
    const targetAudience = campaignInfo?.target_audience || "";
    
    // Determine target language based on campaign countries
    const countries = campaignInfo?.rss_countries || ['US'];
    const primaryCountry = countries[0] || 'US';
    const targetLanguageInfo = COUNTRY_LANGUAGES[primaryCountry] || COUNTRY_LANGUAGES['US'];
    const targetLanguage = targetLanguageInfo.language;
    const maxPlacements = 3;
    const controversyPercentage = 33;
    const professionalPercentage = 100 - controversyPercentage;
    const isEnglish = targetLanguage === 'English';

    // Determine industry context for appropriate messaging
    const allTags = [...companyTags, ...tags].map(t => t.toLowerCase());
    const isGambling = allTags.some(tag => 
      ['gambling', 'casino', 'betting', 'poker', 'slots', 'sports betting', 'gaming', 'online-betting'].includes(tag)
    );
    const isFinance = allTags.some(tag => 
      ['finance', 'banking', 'investment', 'trading', 'loans', 'credit', 'financial'].includes(tag)
    );
    const isHealthcare = allTags.some(tag => 
      ['health', 'medical', 'healthcare', 'wellness', 'fitness', 'therapy'].includes(tag)
    );
    const isEcommerce = allTags.some(tag => 
      ['ecommerce', 'retail', 'shopping', 'store', 'marketplace'].includes(tag)
    );
    const isTechnology = allTags.some(tag => 
      ['technology', 'software', 'saas', 'app', 'platform', 'tech', 'digital'].includes(tag)
    );

    // Build industry-specific CTA guidance
    let ctaGuidance = '';
    if (isGambling) {
      ctaGuidance = `\n\n⚠️ GAMBLING/CASINO INDUSTRY CONTEXT:\n- CTAs should focus on entertainment and excitement\n- Use action-oriented language like "Play Now", "Join the Action", "Start Playing", "Claim Bonus", "Spin Now", "Bet Now"\n- Avoid financial recovery language like "Recover Funds" or "Get Balance"\n- Keep tone fun, exciting, and entertainment-focused`;
    } else if (isFinance) {
      ctaGuidance = `\n\n⚠️ FINANCE INDUSTRY CONTEXT:\n- CTAs should focus on financial goals and security\n- Use language like "Get Started", "Apply Now", "Check Rates", "Learn More", "Invest Now", "Free Consultation"\n- Keep professional and trustworthy\n- Emphasize security and expert guidance`;
    } else if (isHealthcare) {
      ctaGuidance = `\n\n⚠️ HEALTHCARE INDUSTRY CONTEXT:\n- CTAs should focus on care and improvement\n- Use language like "Book Appointment", "Learn More", "Get Help", "Start Treatment", "Consult Now", "Schedule Visit"\n- Keep caring and professional\n- Build trust and compassion`;
    } else if (isEcommerce) {
      ctaGuidance = `\n\n⚠️ E-COMMERCE INDUSTRY CONTEXT:\n- CTAs should focus on shopping and discovery\n- Use language like "Shop Now", "View Deals", "Browse Collection", "Add to Cart", "Buy Now", "Explore Products"\n- Create urgency and excitement\n- Focus on value and selection`;
    } else if (isTechnology) {
      ctaGuidance = `\n\n⚠️ TECHNOLOGY/SaaS INDUSTRY CONTEXT:\n- CTAs should focus on trials and demos\n- Use language like "Try Free", "Start Free Trial", "Get Demo", "Sign Up", "Learn More", "See How It Works"\n- Emphasize ease and value\n- Highlight innovation and efficiency`;
    }

    return `
        # BUSINESS CONTEXT

        Company: ${companyName}
        Description: ${companyDesc}
        Product/Service: ${productDesc}
        Target Audience: ${targetAudience}
        ${companyTags.length > 0 ? `Campaign Tags: ${companyTags.join(", ")}\n        ` : ''}
        Target Language: ${targetLanguage}
        Max Placements: ${maxPlacements}${ctaGuidance}

        # NEWS TITLES

        You have ${newsArray.length} news titles:

        ${JSON.stringify({ newsArray })}

        ## Opportunity Evaluation

        For ANY trend, evaluate:
        1. Audience Overlap - Reaches target demographic?
        2. Emotional Trigger - What emotion? (anxiety, FOMO, humor, pride, anger)
        3. Connection Logic - Why relates? (scientific, cultural, practical, emotional)
        4. Timing Urgency - Why NOW? What changed?

        If all 4 strong → valid opportunity.

        # TASK: GENERATE AD PLACEMENTS

        Generate up to ${maxPlacements} ad placements.

        ## CONTROVERSY REQUIREMENT

        EXACTLY ${controversyPercentage}% of all ads MUST be CONTROVERSIAL (genuinely funny).
        The remaining ${professionalPercentage}% must be PROFESSIONAL.

        For controversial ads: Be casually audacious, not politely clever. Choose the boldest angle, not the smartest wordplay. Never explain the joke.

        Before submitting, validate that you've met this exact ratio. If not, adjust your selection.

        ## QUALITY & DIVERSITY

        Quality First:
        - Select strongest opportunities across all titles
        - Reject weak opportunities regardless of titles

        Diversity:
        - Mix tones: educational, aspirational, humorous, contrarian, empathetic
        - Mix emotions: fear, ambition, FOMO, humor, pride, anger
        - Maintain exact controversy percentage as specified

        Bridge Foundation:
        For creative bridges (Tier 2/3), provide:
        - Emotional trigger
        - Connection basis (why credible)
        - Timing urgency (why NOW)

        ## OUTPUT

        Return JSON with status, trend_summary, campaign_strategy, and results array.

        Each result must include:
        - All news metadata (headline, clickbait, link, trend, tags, keywords) in English
        - description and tooltip in TARGET LANGUAGE (apply NATIVE LANGUAGE GENERATION principles)
        - Bridge details (type, foundation) in English
        - ad_placement with headline, body, cta in TARGET LANGUAGE
        - English translations only if target language is not English

        Remember: The ad_placement.headline is your PRIMARY CREATIVE FIELD. Professional or controversial tone lives THERE.

        Only return "[]" (an empty array) if you genuinely cannot generate credible ads.

        # RESPONSE FORMAT (JSON only):
        
        {
            "results": [
                {
                    "headline": "[Original headline]",
                    "clickbait": "[Viral clickbait hook for ${companyName}]",
                    "link": "[Link from newsArray]",
                    "relevance_score": [0-100],
                    "trend": "[Short trend label]",
                    "tags": ["[tag1]", "tag2"], // up to 5 tags including names in the title, fields of interest, locations, people, companies
                    "keywords": ["keyword1", "keyword2", "keyword3"], // 5-10 specific keywords from this NEWS ARTICLE for ad targeting: actual names, places, events, specific topics, trending terms, niche phrases from the article. Focus on what makes THIS article unique and targetable at lower cost, not only generic business terms
                    "description": "[Why this creates urgency for ${companyName}'s services]",
                    "tooltip": "[Conversion-focused explanation connecting news to ${companyName}'s value - drive action toward ${companyUrl}]",
                    "ad_placement": {
                        "headline": "[Compelling ad headline in ${targetLanguage} that connects news to ${companyName}]",
                        "body": "[Persuasive ad body text in ${targetLanguage} explaining the connection and value proposition]",
                        "cta": "[Short action text in ${targetLanguage} ONLY - no URLs, no links, just 2-4 words]"${!isEnglish ? ',\n                "headline_en": "[English translation of headline]",\n                "body_en": "[English translation of body]"' : ''}
                    },
                    "image_prompt": "[Detailed Stable Diffusion prompt in English for generating a professional marketing image that combines the news topic with ${companyName}'s services. Make it visually compelling, professional, and relevant to the ad. Include style, composition, and key visual elements.]"
                }
            ],
            "trend_summary": "[Marketing strategy overview for ${companyName} based on identified trends]",
            "campaign_strategy": "[Specific recommendations for ${companyName} to capitalize on these news trends]"
        }

        # AD CREATIOVE ADDITIONAL NOTES
        
        Make sure the ad is clear what its selling! 

        # VERIFY RESULTS
        
        REMEMBER: You are an expert in maketing and ad copywriting!
        You generate only great ads that a top marketing analyst would approve!
        if the ad copy is not good enough for a marketing expert, do not include it in the results.
        
    `;
}


// Import credit utilities at module level
import { checkUserCredits, deductUserCredit, InsufficientCreditsError } from './credits.ts';

export async function runGpt(prompt: string, supabaseClient: any, userId: string): Promise<string> {
    // Check if user has credits before making API call
    console.log('💳 Checking user credits before AI operation...');
    const creditCheck = await checkUserCredits(supabaseClient, userId);
    
    if (!creditCheck.hasCredits) {
        console.error(`❌ User ${userId} has insufficient credits (${creditCheck.currentCredits})`);
        throw new InsufficientCreditsError(creditCheck.currentCredits);
    }
    
    console.log(`✅ User has ${creditCheck.currentCredits} credits available`);
    
    let GPT_API_URL = "https://api.openai.com/v1/chat/completions";
    // @ts-ignore
    let OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    console.log('🔑 API Key available:', !!OPENAI_API_KEY);
    console.log('📝 Prompt length:', prompt.length);

    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable not set');
    }

    const requestBody = {
        model: "gpt-5-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
    };

    console.log('🚀 Making OpenAI API request...');

    const res = await fetch(GPT_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
    });

    console.log('📡 API Response status:', res.status);

    if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ OpenAI API error:', errorText);
        throw new Error(`OpenAI API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    console.log('📦 Full API response:', JSON.stringify(data, null, 2));

    if (data.error) {
        console.error('❌ OpenAI returned error:', data.error);
        throw new Error(`OpenAI error: ${data.error.message || data.error}`);
    }

    const text = data.choices?.[0]?.message?.content || "";
    console.log('📝 GPT Response length:', text.length);
    console.log('🎯 GPT Response preview:', text.substring(0, 200) + '...');

    if (!text.trim()) {
        throw new Error('OpenAI returned empty response');
    }

    // Deduct credit after successful AI operation
    console.log('💰 Deducting credit after successful AI operation...');
    const deductResult = await deductUserCredit(supabaseClient, userId);
    
    if (!deductResult.success) {
        console.warn('⚠️ Failed to deduct credit, but AI operation was successful:', deductResult.error);
        // We still return the result but log the credit deduction failure
    } else {
        console.log(`✅ Credit deducted. User has ${deductResult.remainingCredits} credits remaining`);
    }

    return text;
}