import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

import { handleCors, createErrorResponse, createSuccessResponse } from '../rss-feeds/http-utils.ts';
import { AskApiError, pollUntilCompleted, submitQuestion } from './ask-api.ts';
import { sendTelegramMessage } from './telegram.ts';

const DEFAULT_CHANNEL_ID = '-1003280682258';

function normalizeTelegramChatId(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 'This endpoint only accepts POST requests', 405);
    }

    const inboundApiKey = req.headers.get('x-api-key')?.trim();
    if (!inboundApiKey) {
      return createErrorResponse(
        'Missing API key',
        'x-api-key header is required',
        400,
      );
    }

    const body = await req.json().catch(() => null) as null | {
      question?: string;
      includeSources?: boolean;
      pollIntervalMs?: number;
      timeoutMs?: number;
      channelId?: string;
      telegram_channel_id?: string;
    };

    if (!body || typeof body.question !== 'string') {
      return createErrorResponse('Invalid question', 'Request body must include question as a string', 400);
    }

    const question = body.question.trim();
    if (question.length === 0) {
      return createErrorResponse('Missing question', 'Request body must include a non-empty question', 400);
    }

    const includeSources = body.includeSources ?? true;
    const pollIntervalMs = Math.max(500, Math.min(body.pollIntervalMs ?? 2000, 10000));
    const timeoutMs = Math.max(5_000, Math.min(body.timeoutMs ?? 120_000, 600_000));

    const requestedTelegramChannelId = normalizeTelegramChatId(body.telegram_channel_id);

    console.log('📨 Submitting ASK question');
    const submit = await submitQuestion(question, includeSources, inboundApiKey);

    console.log('⏳ Polling ASK status', { queryId: submit.queryId, pollIntervalMs, timeoutMs });
    const completed = await pollUntilCompleted(submit.queryId, { pollIntervalMs, timeoutMs }, inboundApiKey);

    const channelId =
      requestedTelegramChannelId ??
      DEFAULT_CHANNEL_ID;

    const answer = completed?.result?.answer;
    if (!answer || answer.trim().length === 0) {
      return createErrorResponse('No answer in response', 'COMPLETED response had no result.answer', 502);
    }

    const keyboard = {
      inline_keyboard: [[
        {
          text: 'Publish',
          callback_data: `publish:${submit.queryId}`,
        },
        {
          text: 'Make variants',
          callback_data: `variants:${submit.queryId}`,
        },
        {
          text: 'View in Argus',
          url: `http://34.165.46.113:8081/ask/${submit.queryId}`,
        },
      ]],
    };

    console.log('📣 Sending to Telegram channel', { channelId });
    const tg = await sendTelegramMessage(channelId, answer, keyboard);

    if (!tg.ok) {
      return createErrorResponse(
        'Telegram send failed',
        tg.description ?? 'sendMessage returned ok=false',
        502,
      );
    }

    return createSuccessResponse({
      queryId: submit.queryId,
      askStatus: completed.status,
      telegram: {
        message_id: tg.result?.message_id,
        chat_id: tg.result?.chat?.id,
      },
    });
  } catch (error) {
    if (error instanceof AskApiError) {
      return createErrorResponse(
        'ASK API error',
        typeof error.body === 'string' ? error.body : JSON.stringify(error.body),
        error.status,
      );
    }

    console.error('❌ ask-to-telegram error:', error);
    return createErrorResponse(
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error',
      500,
    );
  }
});
