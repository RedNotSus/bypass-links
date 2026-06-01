import { createBypassClient } from "../src/bypassClient.js";
import { readConfig, validateConfig } from "../src/config.js";
import { RateLimitQueue } from "../src/rateLimitQueue.js";
import { createApp } from "../src/server.js";
import { createTelegramClient } from "../src/telegramClient.js";

const config = readConfig();
validateConfig(config);

const telegramClient = createTelegramClient({
  botToken: config.telegramBotToken
});

const bypassClient = createBypassClient({
  apiKey: config.bypassApiKey,
  authHeader: config.bypassApiAuthHeader,
  maxHops: config.bypassMaxHops,
  queue: new RateLimitQueue({ limit: 25, intervalMs: 10_000, concurrency: 2 })
});

export default createApp({
  telegramWebhookSecret: config.telegramWebhookSecret,
  telegramClient,
  bypassClient,
  discordErrorWebhookUrl: config.discordErrorWebhookUrl,
  authConfig: {
    hackClubClientId: config.hackClubClientId,
    hackClubClientSecret: config.hackClubClientSecret,
    hackClubRedirectUri: config.hackClubRedirectUri,
    jwtAccessSecret: config.jwtAccessSecret,
    jwtRefreshSecret: config.jwtRefreshSecret,
    isProduction: true
  },
  serveClient: false
});
