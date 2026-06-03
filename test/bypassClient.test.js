import assert from "node:assert/strict";
import test from "node:test";
import { createBypassClient } from "../src/bypassClient.js";

test("follows chained bypass results up to max hops", async () => {
  const requestedUrls = [];
  const results = [
    "https://short.example/2",
    "https://short.example/3",
    "https://short.example/4",
    "https://short.example/5",
    "https://short.example/6",
    "https://short.example/7"
  ];

  const client = createBypassClient({
    apiKey: "key",
    authHeader: "x-api-key",
    maxHops: 5,
    fetchImpl: async (url, options) => {
      requestedUrls.push(new URL(url).searchParams.get("url"));
      assert.equal(options.headers["x-api-key"], "key");
      return jsonResponse({ result: results.shift() });
    }
  });

  const result = await client.bypass("https://short.example/1");

  assert.equal(result, "https://short.example/6");
  assert.deepEqual(requestedUrls, [
    "https://short.example/1",
    "https://short.example/2",
    "https://short.example/3",
    "https://short.example/4",
    "https://short.example/5"
  ]);
});

test("uses refresh endpoint when requested", async () => {
  const requestedUrls = [];
  const client = createBypassClient({
    apiKey: "key",
    authHeader: "x-api-key",
    fetchImpl: async (url) => {
      requestedUrls.push(String(url));
      return jsonResponse({ result: "https://download.example/file" });
    }
  });

  const result = await client.bypass("https://linkvertise.com/example", { refresh: true });

  assert.equal(result, "https://download.example/file");
  assert.equal(new URL(requestedUrls[0]).pathname, "/premium/refresh");
});

test("sends configured auth header", async () => {
  const seenHeaders = [];
  const client = createBypassClient({
    apiKey: "key",
    authHeader: "x-api-key",
    fetchImpl: async (_url, options) => {
      seenHeaders.push(options.headers);
      return jsonResponse({ result: "done" });
    }
  });

  await client.bypass("https://linkvertise.com/example");

  assert.equal(seenHeaders[0]["x-api-key"], "key");
});

test("returns a non-url result immediately", async () => {
  const client = createBypassClient({
    apiKey: "key",
    authHeader: "Authorization",
    fetchImpl: async () => jsonResponse({ result: "not supported" })
  });

  assert.equal(await client.bypass("https://example.com"), "not supported");
});

test("returns the last successful result when a chained request fails", async () => {
  let calls = 0;
  const logs = [];
  const client = createBypassClient({
    apiKey: "key",
    authHeader: "Authorization",
    logger: createTestLogger(logs),
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) {
        return jsonResponse({ result: "https://example.com/next" });
      }

      return {
        ok: false,
        status: 500,
        json: async () => ({})
      };
    }
  });

  assert.equal(await client.bypass("https://example.com/start"), "https://example.com/next");
  assert.equal(logs.find((entry) => entry.event === "bypass_api_request_failed")?.level, "warn");
  assert.equal(
    logs.find((entry) => entry.event === "bypass_returning_last_successful_result")?.level,
    "warn"
  );
  assert.equal(logs.some((entry) => entry.level === "error"), false);
});

function jsonResponse(payload) {
  return {
    ok: true,
    status: 200,
    json: async () => payload
  };
}

function createTestLogger(logs) {
  function write(level, event, details = {}) {
    logs.push({ level, event, ...details });
  }

  return {
    info: (event, details) => write("info", event, details),
    warn: (event, details) => write("warn", event, details),
    error: (event, details) => write("error", event, details)
  };
}
