# ask-to-telegram

Submits a question to the external ASK API, polls until the job is `COMPLETED`, then posts `result.answer` to a Telegram channel with two inline buttons.

## Secrets / env vars

- ASK API URLs are currently hardcoded in the function (no env vars needed for them).
- `TELEGRAM_BOT_TOKEN` (required)
- `TELEGRAM_CHANNEL_ID` (optional): defaults to `-1003280682258`

## Request

`POST /functions/v1/ask-to-telegram`

Headers:
- `x-api-key: ...` (required; this function forwards it to the ASK API)

Body:
```json
{
  "question": "...",
  "includeSources": true,
  "pollIntervalMs": 2000,
  "timeoutMs": 120000,
  "telegram_channel_id": "-1003280682258"
}
```

## Behavior

- Sends only `response.result.answer` to Telegram.
- Channel id resolution order: request body `telegram_channel_id` → request body `channelId` → `TELEGRAM_CHANNEL_ID` env → default `-1003280682258`.
- Adds two inline buttons: `publish` and `make variants`.
- Button callback payloads are compact: `publish:<queryId>` and `variants:<queryId>`.
