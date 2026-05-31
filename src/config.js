const DEFAULT_PORT = 3000;
const DEFAULT_BYPASS_MAX_HOPS = 5;

export function readConfig(env = process.env) {
  return {
    port: Number(env.PORT || DEFAULT_PORT),
    webhookBaseUrl: env.WEBHOOK_BASE_URL,
    telegramBotToken: env.TELEGRAM_BOT_TOKEN,
    telegramWebhookSecret: env.TELEGRAM_WEBHOOK_SECRET,
    bypassApiKey: env.BYPASS_API_KEY,
    bypassApiAuthHeader: env.BYPASS_API_AUTH_HEADER || "Authorization",
    bypassMaxHops: Number(env.BYPASS_MAX_HOPS || DEFAULT_BYPASS_MAX_HOPS),
    discordErrorWebhookUrl: env.DISCORD_ERROR_WEBHOOK_URL || ""
  };
}

export function validateConfig(config) {
  const required = [
    ["WEBHOOK_BASE_URL", config.webhookBaseUrl],
    ["TELEGRAM_BOT_TOKEN", config.telegramBotToken],
    ["TELEGRAM_WEBHOOK_SECRET", config.telegramWebhookSecret],
    ["BYPASS_API_KEY", config.bypassApiKey],
    ["BYPASS_API_AUTH_HEADER", config.bypassApiAuthHeader]
  ];

  const missing = required.filter(([, value]) => !value).map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  if (!Number.isInteger(config.port) || config.port <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  if (!Number.isInteger(config.bypassMaxHops) || config.bypassMaxHops <= 0) {
    throw new Error("BYPASS_MAX_HOPS must be a positive integer");
  }
}
