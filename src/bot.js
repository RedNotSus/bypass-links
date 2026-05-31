import { extractMessageText, extractUrls } from "./urlExtractor.js";

export function formatTelegramReply(result) {
  if (typeof result === "string" && result.startsWith("https://")) {
    return {
      text: `<a href="${escapeHtmlAttribute(result)}">Download</a>`,
      parseMode: "HTML"
    };
  }

  return {
    text: `${result}\n`
  };
}

export async function processTelegramUpdate(update, { bypassClient, telegramClient }) {
  const message = update?.message;
  if (!message?.chat?.id) {
    return { processed: false, reason: "missing_message" };
  }

  const text = extractMessageText(message);
  const urls = extractUrls(text);
  if (urls.length === 0) {
    return { processed: true, sent: 0 };
  }

  let sent = 0;
  for (const url of urls) {
    const result = await bypassClient.bypass(url);
    const reply = formatTelegramReply(result);

    await telegramClient.sendMessage({
      chatId: message.chat.id,
      text: reply.text,
      parseMode: reply.parseMode
    });

    sent += 1;
  }

  return { processed: true, sent };
}

export async function notifyDiscord(webhookUrl, error, fetchImpl = fetch) {
  if (!webhookUrl) {
    return;
  }

  const stack = error?.stack || String(error);
  const message = `# Error Detected in Automation Link Bypasser\nError: ${error.message || error}\n\`\`\`${stack}\`\`\``;

  await fetchImpl(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ message })
  }).catch((notifyError) => {
    console.error("Failed to send Discord error notification", notifyError);
  });
}

function escapeHtmlAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
