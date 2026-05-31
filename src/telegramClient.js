export function createTelegramClient({ botToken, fetchImpl = fetch }) {
  const apiBase = `https://api.telegram.org/bot${botToken}`;

  async function telegramRequest(method, body) {
    const response = await fetchImpl(`${apiBase}/${method}`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      const description = payload.description || `HTTP ${response.status}`;
      throw new Error(`Telegram ${method} failed: ${description}`);
    }

    return payload;
  }

  function setWebhook({ url, secretToken }) {
    return telegramRequest("setWebhook", {
      url,
      allowed_updates: ["message"],
      secret_token: secretToken
    });
  }

  function sendMessage({ chatId, text, parseMode }) {
    const body = {
      chat_id: chatId,
      text,
      disable_web_page_preview: false
    };

    if (parseMode) {
      body.parse_mode = parseMode;
    }

    return telegramRequest("sendMessage", body);
  }

  return {
    setWebhook,
    sendMessage
  };
}
