# ask-to-telegram

Submits a question to the external ASK API, polls until the job is `COMPLETED`, then posts `result.answer` to a Telegram channel with two inline buttons.

## Secrets / env vars

- `ASK_TO_TELEGRAM_API_KEY` (required): expected value for request header `x-api-key`
- ASK API URLs are currently hardcoded in the function (no env vars needed for them).
- `TELEGRAM_BOT_TOKEN` (required)
- `TELEGRAM_CHANNEL_ID` (optional): defaults to `-1003280682258`

## Request

`POST /functions/v1/ask-to-telegram`

Headers:
- `x-api-key: ...`

Body:
```json
{
  "question": "...",
  "includeSources": true,
  "pollIntervalMs": 2000,
  "timeoutMs": 120000,
  "channelId": "-1003280682258"
}
```

## Behavior

- Sends only `response.result.answer` to Telegram.
- Adds two inline buttons: `publish` and `make variants`.
- Button callback payloads are compact: `publish:<queryId>` and `variants:<queryId>`.
