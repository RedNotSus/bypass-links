const DEFAULT_PORT = 3000;
const DEFAULT_BYPASS_MAX_HOPS = 5;
const DEFAULT_APP_ORIGIN = "http://localhost:3000";

export function readConfig(env = process.env) {
  const appOrigin = env.APP_ORIGIN || env.WEBHOOK_BASE_URL || DEFAULT_APP_ORIGIN;

  return {
    port: Number(env.PORT || DEFAULT_PORT),
    appOrigin,
    webhookBaseUrl: env.WEBHOOK_BASE_URL,
    telegramBotToken: env.TELEGRAM_BOT_TOKEN,
    telegramWebhookSecret: env.TELEGRAM_WEBHOOK_SECRET,
    bypassApiKey: env.BYPASS_API_KEY,
    bypassApiAuthHeader: env.BYPASS_API_AUTH_HEADER || "Authorization",
    bypassMaxHops: Number(env.BYPASS_MAX_HOPS || DEFAULT_BYPASS_MAX_HOPS),
    discordErrorWebhookUrl: env.DISCORD_ERROR_WEBHOOK_URL || "",
    skipTelegramWebhook: env.SKIP_TELEGRAM_WEBHOOK === "true",
    hackClubClientId: env.HACK_CLUB_CLIENT_ID,
    hackClubClientSecret: env.HACK_CLUB_CLIENT_SECRET,
    hackClubRedirectUri: env.HACK_CLUB_REDIRECT_URI || new URL("/oauth/callback", appOrigin).toString(),
    jwtAccessSecret: env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: env.JWT_REFRESH_SECRET
  };
}

export function validateConfig(config) {
  const required = [
    ["WEBHOOK_BASE_URL", config.webhookBaseUrl],
    ["TELEGRAM_BOT_TOKEN", config.telegramBotToken],
    ["TELEGRAM_WEBHOOK_SECRET", config.telegramWebhookSecret],
    ["BYPASS_API_KEY", config.bypassApiKey],
    ["BYPASS_API_AUTH_HEADER", config.bypassApiAuthHeader],
    ["HACK_CLUB_CLIENT_ID", config.hackClubClientId],
    ["HACK_CLUB_CLIENT_SECRET", config.hackClubClientSecret],
    ["HACK_CLUB_REDIRECT_URI", config.hackClubRedirectUri],
    ["JWT_ACCESS_SECRET", config.jwtAccessSecret],
    ["JWT_REFRESH_SECRET", config.jwtRefreshSecret],
    ["APP_ORIGIN", config.appOrigin]
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

  for (const [name, value] of [
    ["APP_ORIGIN", config.appOrigin],
    ["WEBHOOK_BASE_URL", config.webhookBaseUrl],
    ["HACK_CLUB_REDIRECT_URI", config.hackClubRedirectUri]
  ]) {
    try {
      new URL(value);
    } catch {
      throw new Error(`${name} must be a valid URL`);
    }
  }
}
