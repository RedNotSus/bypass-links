# bypass-links

Telegram webhook bot that extracts links from messages, sends them through the bypass.vip Premium API, and replies with the final result.

## Setup

```sh
npm install
cp .env.example .env
```

Fill in:

- `TELEGRAM_BOT_TOKEN`
- `WEBHOOK_BASE_URL`
- `TELEGRAM_WEBHOOK_SECRET`
- `BYPASS_API_KEY`
- `BYPASS_API_AUTH_HEADER`

`WEBHOOK_BASE_URL` must be a public HTTPS origin. On startup the app registers:

```txt
${WEBHOOK_BASE_URL}/telegram/webhook
```

## Run

```sh
npm start
```

## Test

```sh
npm test
npm run lint
```
