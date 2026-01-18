import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

import { handleCors, createErrorResponse, createSuccessResponse } from '../rss-feeds/http-utils.ts';
import { AskApiError, pollUntilCompleted, submitQuestion } from './ask-api.ts';
import { sendTelegramMessage, sendTelegramPhotoFile } from './telegram.ts';
import { firstDownloadedSocialImageFromCoreArticles } from './social-image.ts';

const DEFAULT_CHANNEL_ID = '-1003280682258';

function truncateTelegramCaption(text: string): { caption: string; truncated: boolean } {
  // Telegram caption limit is 1024 characters for photos.
  const limit = 1024;
  const normalized = text ?? '';
  if (normalized.length <= limit) {
    return { caption: normalized, truncated: false };
  }
  // Keep room for an ellipsis.
  return { caption: `${normalized.slice(0, limit - 1)}…`, truncated: true };
}

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
      withPhoto?: boolean;
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
    const withPhoto = typeof body.withPhoto === 'boolean' ? body.withPhoto : false;

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

    const coreArticles = completed?.result?.coreArticles;
    const hasSources = Array.isArray(coreArticles) && coreArticles.length > 0;

    // If ASK produced an answer but no sources, it likely isn't based on news.
    // In that case, skip sending to Telegram.
    if (includeSources && !hasSources) {
      console.log('ℹ️ℹ️ℹ️ No sources in ASK response; skipping Telegram send', {
        queryId: submit.queryId,
      });
      return createSuccessResponse({
        queryId: submit.queryId,
        askStatus: completed.status,
        includeSources,
        withPhoto,
        skipped: true,
        reason: 'no_sources',
      });
    }

    const keyboard = {
      inline_keyboard: [[
        {
          text: 'View In Publisher',
          url: `https://publisher.newslatch.com/?post=${answer.trim()}`,
        },
        {
          text: 'View in Argus',
          url: `https://argus.newslatch.com/ask/${submit.queryId}`,
        },
      ]],
    };

    let selectedImage: { imageUrl: string; sourceUrl: string } | null = null;
    let captionTruncated = false;

  // Prefer a single-message Telegram post when withPhoto is enabled and an image is found.
    if (withPhoto) {
      if (Array.isArray(coreArticles) && coreArticles.length > 0) {
        console.log('🖼️ withPhoto enabled; racing coreArticles for social image', {
          candidates: coreArticles.length,
        });
        const downloaded = await firstDownloadedSocialImageFromCoreArticles(coreArticles, {
          maxCandidates: 10,
          perPageTimeoutMs: 7000,
          perImageTimeoutMs: 12000,
          maxImageBytes: 8_000_000,
        });

        if (downloaded) {
          selectedImage = { sourceUrl: downloaded.sourceUrl, imageUrl: downloaded.imageUrl };
          const { caption, truncated } = truncateTelegramCaption(answer);
          captionTruncated = truncated;

          console.log('📸 Sending Telegram photo with caption + buttons', {
            channelId,
            sourceUrl: downloaded.sourceUrl,
            captionTruncated,
          });

          const photo = await sendTelegramPhotoFile(
            channelId,
            {
              bytes: downloaded.bytes,
              contentType: downloaded.contentType,
              filename: 'social-image',
            },
            caption,
            keyboard,
          );

          if (!photo.ok) {
            console.warn('⚠️ Telegram photo send failed; falling back to text message', {
              description: photo.description,
            });
          } else {
            return createSuccessResponse({
              queryId: submit.queryId,
              askStatus: completed.status,
              withPhoto,
              captionTruncated,
              image: selectedImage,
              telegram: {
                message_id: photo.result?.message_id,
                chat_id: photo.result?.chat?.id,
                sent_as: 'photo',
              },
            });
          }
        } else {
          console.log('ℹ️ No social image found in coreArticles; sending text message');
        }
      } else {
        console.log('ℹ️ withPhoto enabled but no coreArticles present; sending text message');
      }
    }

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
      withPhoto,
      captionTruncated,
      image: selectedImage,
      telegram: {
        message_id: tg.result?.message_id,
        chat_id: tg.result?.chat?.id,
        sent_as: 'text',
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
