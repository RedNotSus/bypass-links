import assert from "node:assert/strict";
import test from "node:test";
import { formatTelegramReply, processTelegramUpdate } from "../src/bot.js";

test("formats https result as an HTML download link", () => {
  assert.deepEqual(formatTelegramReply("https://files.example/download?a=1&b=2"), {
    text: '<a href="https://files.example/download?a=1&amp;b=2">Download</a>',
    parseMode: "HTML"
  });
});

test("formats non-https result as plain text", () => {
  assert.deepEqual(formatTelegramReply("unsupported"), {
    text: "unsupported\n"
  });
});

test("processes only the first extracted message url and sends one Telegram reply", async () => {
  const bypassed = [];
  const sent = [];
  const result = await processTelegramUpdate(
    {
      message: {
        chat: { id: 123 },
        caption: "one.com/a https://two.com/b"
      }
    },
    {
      bypassClient: {
        bypass: async (url) => {
          bypassed.push(url);
          return `https://download.example/?from=${encodeURIComponent(url)}`;
        }
      },
      telegramClient: {
        sendMessage: async (message) => {
          sent.push(message);
        }
      }
    }
  );

  assert.deepEqual(result, { processed: true, sent: 1 });
  assert.deepEqual(bypassed, ["https://one.com/a"]);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].chatId, 123);
  assert.equal(sent[0].parseMode, "HTML");
});
