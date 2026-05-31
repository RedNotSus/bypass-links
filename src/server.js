import express from "express";
import helmet from "helmet";
import { notifyDiscord, processTelegramUpdate } from "./bot.js";

export function createApp({
  telegramWebhookSecret,
  telegramClient,
  bypassClient,
  discordErrorWebhookUrl = "",
  fetchImpl = fetch
}) {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use((request, response, next) => {
    console.log(`${request.method} ${request.originalUrl}`);
    response.on("finish", () => {
      console.log(`${request.method} ${request.originalUrl} ${response.statusCode}`);
    });
    next();
  });

  app.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.post("/telegram/webhook", async (request, response) => {
    const secretToken = request.get("x-telegram-bot-api-secret-token");
    if (secretToken !== telegramWebhookSecret) {
      response.status(401).json({ ok: false, error: "invalid webhook secret" });
      return;
    }

    response.status(200).json({ ok: true });

    try {
      await processTelegramUpdate(request.body, { bypassClient, telegramClient });
    } catch (error) {
      console.error("Telegram update processing failed", error);
      await notifyDiscord(discordErrorWebhookUrl, error, fetchImpl);
    }
  });

  app.use((error, _request, response, _next) => {
    console.error("Unhandled request error", error);
    response.status(500).json({ ok: false, error: "internal_server_error" });
  });

  return app;
}
