import assert from "node:assert/strict";
import test from "node:test";
import { extractMessageText, extractUrls } from "../src/urlExtractor.js";

test("extracts and normalizes urls from text", () => {
  assert.deepEqual(extractUrls("go to onlyshare.info/s?kRyMz87A and https://onlyshare.io"), [
    "https://onlyshare.info/s?kRyMz87A",
    "https://onlyshare.io"
  ]);
});

test("reads text before caption", () => {
  assert.equal(extractMessageText({ text: "text", caption: "caption" }), "text");
});

test("falls back to caption", () => {
  assert.equal(extractMessageText({ caption: "caption" }), "caption");
});
