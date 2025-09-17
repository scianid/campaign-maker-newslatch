
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

    const res = await fetch(GPT_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-5-mini", // adjust if needed
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2500,
            temperature: 0.9,
            response_format: { type: "json_object" }
        }),
    });
    const data = await res.json();
    // Extract the response text
    const text = data.choices?.[0]?.message?.content || "";
    return text;
}
