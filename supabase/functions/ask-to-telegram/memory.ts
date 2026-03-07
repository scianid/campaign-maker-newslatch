import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: { get(key: string): string | undefined };
};

const MEMORY_LIMIT = 10;

function getSupabaseClient() {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(url, key);
}

/**
 * Fetches the last `limit` topic summaries stored under the given memory key.
 * Returns an empty array on error (non-fatal).
 */
export async function getRecentTopics(
  memoryKey: string,
  limit: number = MEMORY_LIMIT,
): Promise<string[]> {
  console.log('🧠 [memory] Fetching recent topics', { memoryKey, limit });
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('post_memories')
    .select('topic_summary')
    .eq('memory_key', memoryKey)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ [memory] Failed to fetch recent topics from post_memories', { error, memoryKey });
    return [];
  }

  const topics = (data ?? []).map((row: { topic_summary: string }) => row.topic_summary);
  console.log('🧠 [memory] Recent topics fetched', { memoryKey, count: topics.length, topics });
  return topics;
}

/**
 * Calls OpenAI to produce a single-sentence summary of the given post text.
 * Throws on failure — caller should handle errors.
 */
export async function summarizePost(answer: string): Promise<string> {
  console.log('🧠 [memory] Summarizing post via OpenAI', { answerLength: answer.length });
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: `Summarize the following post in a single short sentence, that makes it very clear to know what this post it about. Reply with only the sentence — no extra text, no quotes.`,
        },
        { role: 'user', content: answer },
      ],
      max_tokens: 100,
    }),
  });

  console.log('🧠 [memory] OpenAI summarize response status', { status: res.status });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ [memory] OpenAI summarize request failed', { status: res.status, errorText });
    throw new Error(`OpenAI API error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  const summary: string = data.choices?.[0]?.message?.content?.trim();
  if (!summary) {
    console.error('❌ [memory] OpenAI returned an empty summary', { data });
    throw new Error('OpenAI returned an empty summary');
  }

  console.log('🧠 [memory] Summary generated', { summary });
  return summary;
}

/**
 * Inserts a topic summary row into post_memories.
 * Throws on failure — caller should handle errors.
 */
export async function saveTopicMemory(memoryKey: string, topic: string): Promise<void> {
  console.log('🧠 [memory] Saving topic to post_memories', { memoryKey, topic });
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('post_memories')
    .insert({ memory_key: memoryKey, topic_summary: topic });

  if (error) {
    console.error('❌ [memory] Failed to save topic memory to post_memories', { error, memoryKey, topic });
    throw error;
  }

  console.log('✅ [memory] Topic saved successfully', { memoryKey, topic });
}
