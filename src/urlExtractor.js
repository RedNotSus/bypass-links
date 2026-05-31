const URL_PATTERN = /(?:https?:\/\/)?(?:[\w-]+\.)+[a-z]{2,}(?:\/\S*)?/gi;

export function extractUrls(text) {
  const rawText = String(text || "");
  const matches = rawText.match(URL_PATTERN) || [];

  return matches.map((url) => (url.startsWith("http") ? url : `https://${url}`));
}

export function extractMessageText(message = {}) {
  return message.text || message.caption || "";
}

export function isUrlLike(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}
