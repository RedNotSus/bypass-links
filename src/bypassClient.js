import { isUrlLike } from "./urlExtractor.js";
import { createLogger, serializeError, summarizeUrl } from "./logger.js";

const BYPASS_API_BASE_URL = "https://api.bypass.vip/premium/";

export function createBypassClient({
  apiKey,
  authHeader,
  maxHops = 5,
  fetchImpl = fetch,
  logger = createLogger("bypass"),
  queue = { schedule: (task) => task() }
}) {
  async function bypassOnce(url, { refresh = false } = {}) {
    const requestUrl = new URL(refresh ? "refresh" : "bypass", BYPASS_API_BASE_URL);
    requestUrl.searchParams.set("url", url);
    const startedAt = Date.now();

    logger.info("bypass_api_request_started", {
      mode: refresh ? "refresh" : "bypass",
      url: summarizeUrl(url),
      authHeader
    });

    const response = await queue.schedule(() =>
      fetchImpl(requestUrl, {
        method: "GET",
        headers: {
          [authHeader]: apiKey
        }
      })
    );

    if (!response.ok) {
      logger.error("bypass_api_request_failed", {
        statusCode: response.status,
        durationMs: Date.now() - startedAt,
        url: summarizeUrl(url)
      });
      throw new Error(`bypass.vip request failed with HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (typeof payload.result !== "string" || payload.result.length === 0) {
      logger.error("bypass_api_invalid_response", {
        statusCode: response.status,
        durationMs: Date.now() - startedAt,
        hasResult: Boolean(payload.result)
      });
      throw new Error("bypass.vip response did not include a result");
    }

    logger.info("bypass_api_request_succeeded", {
      statusCode: response.status,
      durationMs: Date.now() - startedAt,
      resultIsUrl: isUrlLike(payload.result),
      resultLength: payload.result.length,
      result: summarizeUrl(payload.result)
    });

    return payload.result;
  }

  async function bypass(url, options = {}) {
    let currentUrl = url;
    let lastResult = "";

    for (let hop = 0; hop < maxHops; hop += 1) {
      try {
        logger.info("bypass_hop_started", {
          hop: hop + 1,
          maxHops,
          url: summarizeUrl(currentUrl)
        });
        const result = await bypassOnce(currentUrl, options);
        lastResult = result;

        if (!isUrlLike(result) || result === currentUrl) {
          logger.info("bypass_finished", {
            hop: hop + 1,
            reason: result === currentUrl ? "same_url" : "non_url_result",
            resultLength: result.length
          });
          return result;
        }

        currentUrl = result;
      } catch (error) {
        logger.error("bypass_hop_failed", {
          hop: hop + 1,
          hasLastResult: Boolean(lastResult),
          error: serializeError(error)
        });
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
