import { isUrlLike } from "./urlExtractor.js";

const BYPASS_API_BASE_URL = "https://api.bypass.vip/premium/";

export function createBypassClient({
  apiKey,
  authHeader,
  maxHops = 5,
  fetchImpl = fetch,
  queue = { schedule: (task) => task() }
}) {
  async function bypassOnce(url, { refresh = false } = {}) {
    const requestUrl = new URL(refresh ? "refresh" : "bypass", BYPASS_API_BASE_URL);
    requestUrl.searchParams.set("url", url);

    const response = await queue.schedule(() =>
      fetchImpl(requestUrl, {
        method: "GET",
        headers: {
          [authHeader]: apiKey
        }
      })
    );

    if (!response.ok) {
      throw new Error(`bypass.vip request failed with HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (typeof payload.result !== "string" || payload.result.length === 0) {
      throw new Error("bypass.vip response did not include a result");
    }

    return payload.result;
  }

  async function bypass(url, options = {}) {
    let currentUrl = url;
    let lastResult = "";

    for (let hop = 0; hop < maxHops; hop += 1) {
      try {
        const result = await bypassOnce(currentUrl, options);
        lastResult = result;

        if (!isUrlLike(result) || result === currentUrl) {
          return result;
        }

        currentUrl = result;
      } catch (error) {
        if (lastResult) {
          return lastResult;
        }
        throw error;
      }
    }

    return lastResult;
  }

  return {
    bypass,
    bypassOnce
  };
}
