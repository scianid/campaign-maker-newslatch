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
Target Language: ${targetLanguage}

YOUR MISSION:
Analyze the provided news articles and create compelling ad placements that connect current events to ${companyName}'s services. Each selected headline should create urgency and drive potential customers to take action.

⚠️ CRITICAL LANGUAGE REQUIREMENT:
ALL ad content (headline, body, CTA) MUST be written in ${targetLanguage} for the ${targetLanguageInfo.name} market.
${!isEnglish ? 'You MUST also provide English translations for title and body in separate fields.' : 'Since the target language is English, translation fields should be left empty.'}

NEWS ANALYSIS OBJECTIVES:
1. Identify 3-5 headlines most relevant for lead generation related to ${tags.join(", ")}
2. Connect news events to ${companyName}'s business value proposition
3. Create compelling ad copy in ${targetLanguage} that drives conversions
4. Focus on urgency, relevance, and clear calls-to-action appropriate for ${targetLanguageInfo.name}

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
8. CTA must be SHORT button text only (2-4 words) - NO URLs or links
9. If the content is too far away and the creative will not be approved by a marketing analyst expert, return less results in the array
10. ⚠️ KEYWORDS STRATEGY: Extract specific, unique keywords FROM THE NEWS ARTICLE itself - names, places, events, trending terms, niche topics. These should be low-competition, article-specific terms that will cost less for ad targeting, NOT broad generic business terms

CTA EXAMPLES for ${targetLanguage} (use similar format):
${getCTAExamples(targetLanguage)}

Generate JSON now:
    `;
}

export async function runGpt(prompt: string, supabaseClient: any, userId: string): Promise<string> {
    // Import credit utilities (lazy import to avoid circular dependencies)
    const { checkUserCredits, deductUserCredit, InsufficientCreditsError } = await import('./credits.ts');
    
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