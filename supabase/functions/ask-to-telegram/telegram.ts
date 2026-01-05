import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: {
  env: { get(key: string): string | undefined };
};

interface TelegramSendMessageResponse {
  ok: boolean;
  result?: {
    message_id: number;
    date: number;
    chat: { id: number; type: string; title?: string; username?: string };
    text?: string;
    caption?: string;
  };
  error_code?: number;
  description?: string;
}

export type InlineKeyboardMarkup = {
  inline_keyboard: Array<
    Array<
      | { text: string; callback_data: string }
      | { text: string; url: string }
    >
  >;
};

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyMarkup?: InlineKeyboardMarkup,
): Promise<TelegramSendMessageResponse> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!token) {
    return {
      ok: false,
      error_code: 500,
      description: 'TELEGRAM_BOT_TOKEN is not configured',
    };
  }

  const MAX_LENGTH = 3900;

  // If message is too long, split it into multiple messages
  if (text.length > MAX_LENGTH) {
    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= MAX_LENGTH) {
        chunks.push(remaining);
        break;
      }

      // Try to find a good break point (newline, space, etc.)
      let splitIndex = MAX_LENGTH;
      const lastNewline = remaining.lastIndexOf('\n', MAX_LENGTH);
      const lastSpace = remaining.lastIndexOf(' ', MAX_LENGTH);

      if (lastNewline > MAX_LENGTH * 0.8) {
        splitIndex = lastNewline + 1;
      } else if (lastSpace > MAX_LENGTH * 0.8) {
        splitIndex = lastSpace + 1;
      }

      chunks.push(remaining.substring(0, splitIndex));
      remaining = remaining.substring(splitIndex);
    }

    // Send all chunks, but only add reply markup to the last one
    let lastResponse: TelegramSendMessageResponse = { ok: false };
    for (let i = 0; i < chunks.length; i++) {
      const isLast = i === chunks.length - 1;
      const chunkMarkup = isLast ? replyMarkup : undefined;
      
      lastResponse = await sendSingleTelegramMessage(
        token,
        chatId,
        chunks[i],
        chunkMarkup,
      );

      if (!lastResponse.ok) {
        return lastResponse;
      }

      // Small delay between messages to avoid rate limiting
      if (!isLast) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return lastResponse;
  }

  // Message is short enough, send normally
  return sendSingleTelegramMessage(token, chatId, text, replyMarkup);
}

async function sendSingleTelegramMessage(
  token: string,
  chatId: string,
  text: string,
  replyMarkup?: InlineKeyboardMarkup,
): Promise<TelegramSendMessageResponse> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as TelegramSendMessageResponse;

  if (!res.ok || !data.ok) {
    console.error('❌ Telegram sendMessage failed', {
      status: res.status,
      data,
    });
  }

  return data;
}

export async function sendTelegramPhoto(
  chatId: string,
  photoUrl: string,
  caption?: string,
  replyMarkup?: InlineKeyboardMarkup,
): Promise<TelegramSendMessageResponse> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!token) {
    return {
      ok: false,
      error_code: 500,
      description: 'TELEGRAM_BOT_TOKEN is not configured',
    };
  }

  const MAX_CAPTION_LENGTH = 1024;
  const url = `https://api.telegram.org/bot${token}/sendPhoto`;

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    photo: photoUrl,
  };

  let photoCaption: string | undefined;
  let remainingText: string | undefined;

  if (caption && caption.trim().length > 0) {
    if (caption.length > MAX_CAPTION_LENGTH) {
      // Truncate caption and save remaining text
      photoCaption = caption.substring(0, MAX_CAPTION_LENGTH - 3) + '...';
      remainingText = caption;
    } else {
      photoCaption = caption;
    }
    payload.caption = photoCaption;
  }

  if (replyMarkup && !remainingText) {
    payload.reply_markup = replyMarkup;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as TelegramSendMessageResponse;

  if (!res.ok || !data.ok) {
    console.error('❌ Telegram sendPhoto failed', {
      status: res.status,
      data,
    });
    return data;
  }

  // If caption was too long, send the full text as a follow-up message
  if (remainingText) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return await sendTelegramMessage(chatId, remainingText, replyMarkup);
  }

  return data;
}

export async function sendTelegramPhotoFile(
  chatId: string,
  file: { bytes: Uint8Array; contentType: string; filename?: string },
  caption?: string,
  replyMarkup?: InlineKeyboardMarkup,
): Promise<TelegramSendMessageResponse> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!token) {
    return {
      ok: false,
      error_code: 500,
      description: 'TELEGRAM_BOT_TOKEN is not configured',
    };
  }

  const MAX_CAPTION_LENGTH = 1024;
  const url = `https://api.telegram.org/bot${token}/sendPhoto`;
  const form = new FormData();
  form.set('chat_id', chatId);

  const filename = file.filename ?? 'image';
  const blob = new Blob([file.bytes], { type: file.contentType || 'application/octet-stream' });
  form.set('photo', blob, filename);

  let photoCaption: string | undefined;
  let remainingText: string | undefined;

  if (caption && caption.trim().length > 0) {
    if (caption.length > MAX_CAPTION_LENGTH) {
      // Truncate caption and save remaining text
      photoCaption = caption.substring(0, MAX_CAPTION_LENGTH - 3) + '...';
      remainingText = caption;
    } else {
      photoCaption = caption;
    }
    form.set('caption', photoCaption);
  }

  if (replyMarkup && !remainingText) {
    form.set('reply_markup', JSON.stringify(replyMarkup));
  }

  const res = await fetch(url, {
    method: 'POST',
    body: form,
  });

  const data = (await res.json()) as TelegramSendMessageResponse;

  if (!res.ok || !data.ok) {
    console.error('❌ Telegram sendPhoto(file) failed', {
      status: res.status,
      data,
    });
    return data;
  }

  // If caption was too long, send the full text as a follow-up message
  if (remainingText) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return await sendTelegramMessage(chatId, remainingText, replyMarkup);
  }

  return data;
}
