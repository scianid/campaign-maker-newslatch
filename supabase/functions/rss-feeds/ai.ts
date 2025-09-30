export function buildPrompt(
    newsArray: Array<{ headline: string; link: string }>,
    tags: string[],
    campaignInfo?: { name: string; description: string; url: string; tags: string[] }
): string {
    // Use campaign info if provided, otherwise fallback to generic approach
    const companyName = campaignInfo?.name || "the business";
    const companyUrl = campaignInfo?.url || "their website";
    const companyDesc = campaignInfo?.description || "their services";
    const companyTags = campaignInfo?.tags || [];

    return `
You are an expert AI marketing analyst creating targeted ad placements for lead generation campaigns.

CAMPAIGN CONTEXT:
Company/Campaign: ${companyName}
Website: ${companyUrl}
Business Description: ${companyDesc}
Campaign Tags: ${companyTags.join(", ")}
Target Categories: ${tags.join(", ")}

YOUR MISSION:
Analyze the provided news articles and create compelling ad placements that connect current events to ${companyName}'s services. Each selected headline should create urgency and drive potential customers to take action.

NEWS ANALYSIS OBJECTIVES:
1. Identify 3-5 headlines most relevant for lead generation related to ${tags.join(", ")}
2. Connect news events to ${companyName}'s business value proposition
3. Create compelling ad copy that drives conversions for ${companyUrl}
4. Focus on urgency, relevance, and clear calls-to-action

For each selected headline, create:
- Viral clickbait optimized for ${companyName}'s target audience
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
            "description": "[Why this creates urgency for ${companyName}'s services]",
            "tooltip": "[Conversion-focused explanation connecting news to ${companyName}'s value - drive action toward ${companyUrl}]",
            "ad_placement": {
                "headline": "[Compelling ad headline that connects news to ${companyName}]",
                "body": "[Persuasive ad body text explaining the connection and value proposition]",
                "cta": "[Short action text ONLY - no URLs, no links, just 2-4 words like 'Get Started' or 'Learn More']"
            }
        }
    ],
    "trend_summary": "[Marketing strategy overview for ${companyName} based on identified trends]",
    "campaign_strategy": "[Specific recommendations for ${companyName} to capitalize on these news trends]"
}

NEWS ARTICLES TO ANALYZE:
${JSON.stringify({ newsArray })}

CRITICAL INSTRUCTIONS:
1. Response must be ONLY valid JSON - no explanatory text
2. Focus on ${companyName}'s business needs and target audience
3. Every result must drive leads toward ${companyUrl}
4. Create urgency that compels immediate action
5. Return 1-3 highly relevant results maximum
6. CTA must be SHORT button text only (2-4 words) - NO URLs or links
7. If the content is too far away and the creative will not be approved by a marketing analyst expert, return less results in the array

CTA EXAMPLES (use similar format):
- "Get Started"
- "Learn More" 
- "Free Quote"
- "Contact Us"
- "Try Now"
- "Schedule Call"

Generate JSON now:
    `;
}

export async function runGpt(prompt: string): Promise<string> {
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

    return text;
}