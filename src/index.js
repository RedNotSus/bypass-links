import "dotenv/config";
import { createBypassClient } from "./bypassClient.js";
import { readConfig, validateConfig } from "./config.js";
import { RateLimitQueue } from "./rateLimitQueue.js";
import { createApp } from "./server.js";
import { createTelegramClient } from "./telegramClient.js";

async function main() {
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

  const webhookUrl = new URL("/telegram/webhook", config.webhookBaseUrl).toString();
  if (config.skipTelegramWebhook) {
    console.log(`Telegram webhook registration skipped: ${webhookUrl}`);
  } else {
    await telegramClient.setWebhook({
      url: webhookUrl,
      secretToken: config.telegramWebhookSecret
    });
    console.log(`Telegram webhook registered: ${webhookUrl}`);
  }

  const app = createApp({
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
      isProduction: process.env.NODE_ENV === "production"
    }
  });

  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
