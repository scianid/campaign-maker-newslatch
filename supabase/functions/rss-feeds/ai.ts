
export function buildPrompt(
    newsArray: Array<{ headline: string; link: string }>,
    tags: string[]
): string {
    return `
  You are given an array of recent news articles (newsArray).
Each article contains:

headline (string)

link (string)

Your Objective:

Analyze all headlines in newsArray to:

Identify up to 3–5 headlines that are most relevant for online lead generation in consumer services, focusing on trends related to ${tags.join(", ")}.

Prioritize articles that show signs of emerging trends (e.g., multiple related headlines, repeated themes, or growing urgency).

Consider both direct matches and indirectly relevant news (e.g., an article about a storm may be relevant for roofing, even if “roofing” isn’t mentioned).

For each chosen headline:

Assign a Relevance Score (0–100).

Rewrite it into a viral, casual clickbait hook optimized for CTR.

Add a short trend label.

Explain urgency in plain language.

Output Format (JSON only):

{
"results": [
{
"headline": "[Original headline]",
"clickbait": "[Casual/viral 1-liner]",
"link": "[Link from newsArray]",
"relevance_score": [0-100],
"trend": "[Short trend label]",
"description": "[Why this article creates urgency for ${tags.join(", ")}]",
"tooltip": "[Casual 3–4 sentence explanation driving urgency around ${tags.join(", ")}]"
}
],
"trend_summary": "[Short overview of the top 1–2 trends detected across chosen articles]"
}

NewsArray Input:

${JSON.stringify({ newsArray })}


Final Reminder:
Now, from the above newsArray, return only 3–5 results in the exact JSON format specified earlier.
    
    
    `;
}

export async function runGpt(prompt: string): Promise<string> {
    let GPT_API_URL = "https://api.openai.com/v1/chat/completions";
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
