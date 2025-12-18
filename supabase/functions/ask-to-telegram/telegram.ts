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
  };
  error_code?: number;
  description?: string;
}

export type InlineKeyboardMarkup = {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
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
