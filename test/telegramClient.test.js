import assert from "node:assert/strict";
import test from "node:test";
import { createTelegramClient } from "../src/telegramClient.js";

test("registers Telegram webhook with secret token", async () => {
  const calls = [];
  const client = createTelegramClient({
    botToken: "token",
    fetchImpl: async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) });
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true })
      };
    }
  });

  await client.setWebhook({
    url: "https://bot.example/telegram/webhook",
    secretToken: "secret"
  });

  assert.equal(calls[0].url, "https://api.telegram.org/bottoken/setWebhook");
  assert.deepEqual(calls[0].body, {
    url: "https://bot.example/telegram/webhook",
    allowed_updates: ["message"],
    secret_token: "secret"
  });
});

test("sends Telegram messages", async () => {
  const calls = [];
  const client = createTelegramClient({
    botToken: "token",
    fetchImpl: async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) });
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true })
      };
    }
  });

  await client.sendMessage({
    chatId: 42,
    text: "<b>ok</b>",
    parseMode: "HTML"
  });

  assert.equal(calls[0].url, "https://api.telegram.org/bottoken/sendMessage");
  assert.equal(calls[0].body.chat_id, 42);
  assert.equal(calls[0].body.parse_mode, "HTML");
});
