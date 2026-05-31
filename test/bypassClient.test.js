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
  const client = createBypassClient({
    apiKey: "key",
    authHeader: "Authorization",
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
});

function jsonResponse(payload) {
  return {
    ok: true,
    status: 200,
    json: async () => payload
  };
}
