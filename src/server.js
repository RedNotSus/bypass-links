import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createAuthService, normalizeHackClubUser } from "./auth.js";
import { notifyDiscord, processTelegramUpdate } from "./bot.js";
import { createHackClubOAuthClient } from "./oauthClient.js";
import { isUrlLike } from "./urlExtractor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CLIENT_DIST = path.resolve(__dirname, "../dist/client");

export function createApp({
  telegramWebhookSecret,
  telegramClient,
  bypassClient,
  discordErrorWebhookUrl = "",
  fetchImpl = fetch,
  authConfig = {},
  oauthClient,
  clientDistPath = DEFAULT_CLIENT_DIST,
  serveClient = true
}) {
  const app = express();
  const auth = createAuthService({
    accessSecret: authConfig.jwtAccessSecret || "test-access-secret",
    refreshSecret: authConfig.jwtRefreshSecret || "test-refresh-secret",
    isProduction: authConfig.isProduction
  });
  const hackClubOAuth = oauthClient || createHackClubOAuthClient({
    clientId: authConfig.hackClubClientId || "test-client-id",
    clientSecret: authConfig.hackClubClientSecret || "test-client-secret",
    redirectUri: authConfig.hackClubRedirectUri || "http://localhost:3000/oauth/callback",
    fetchImpl
  });
  const bypassLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use(helmet());
  app.use(cookieParser());
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

  app.get("/auth/hackclub", (request, response) => {
    const state = auth.createOauthState(response);
    response.redirect(hackClubOAuth.buildAuthorizationUrl(state));
  });

  app.get("/oauth/callback", async (request, response, next) => {
    try {
      const { code, state } = request.query;
      if (typeof code !== "string" || !auth.verifyOauthState(request, response, String(state || ""))) {
        response.status(400).send("Invalid Hack Club OAuth callback.");
        return;
      }

      const tokenPayload = await hackClubOAuth.exchangeCodeForToken(code);
      const profilePayload = await hackClubOAuth.fetchMe(tokenPayload.access_token);
      const user = normalizeHackClubUser(profilePayload);
      if (!user.id || !user.email) {
        response.status(502).send("Hack Club profile response was missing required identity fields.");
        return;
      }

      auth.setSessionCookies(response, user);
      response.redirect("/");
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/me", (request, response) => {
    const user = auth.readAccessUser(request);
    if (!user) {
      response.status(401).json({ ok: false, error: "unauthorized" });
      return;
    }

    response.json({ ok: true, user });
  });

  app.get("/api/session", (request, response) => {
    const accessUser = auth.readAccessUser(request);
    if (accessUser) {
      response.json({ ok: true, user: accessUser });
      return;
    }

    const refreshUser = auth.readRefreshUser(request);
    if (refreshUser) {
      auth.setSessionCookies(response, refreshUser);
      response.json({ ok: true, user: refreshUser });
      return;
    }

    response.json({ ok: true, user: null });
  });

  app.post("/auth/refresh", (request, response) => {
    const user = auth.readRefreshUser(request);
    if (!user) {
      response.status(401).json({ ok: false, error: "unauthorized" });
      return;
    }

    auth.setSessionCookies(response, user);
    response.json({ ok: true, user });
  });

  app.post("/auth/logout", (_request, response) => {
    auth.clearSessionCookies(response);
    response.json({ ok: true });
  });

  app.post("/api/bypass", bypassLimiter, auth.requireAuth, async (request, response, next) => {
    try {
      const { refresh = false, url } = request.body || {};
      if (!isUrlLike(url)) {
        response.status(400).json({ ok: false, error: "invalid_url" });
        return;
      }

      const result = await bypassClient.bypass(url, { refresh: refresh === true });
      response.json({ ok: true, result });
    } catch (error) {
      next(error);
    }
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

  if (serveClient) {
    app.use(express.static(clientDistPath));
    app.get("*", (_request, response, next) => {
      response.sendFile(path.join(clientDistPath, "index.html"), (error) => {
        if (error) {
          next();
        }
      });
    });
  }

  app.use((error, _request, response, _next) => {
    console.error("Unhandled request error", error);
    response.status(500).json({ ok: false, error: "internal_server_error" });
  });

  return app;
}
