import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import jwt from "jsonwebtoken";
import { createApp } from "../src/server.js";

const accessSecret = "test-access-secret";
const refreshSecret = "test-refresh-secret";
const testUser = {
  id: "ident!test",
  email: "user@example.com",
  name: "Test User"
};

test("rejects bypass API requests without authentication", async () => {
  const { baseUrl, close } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/api/bypass`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://linkvertise.com/example" })
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { ok: false, error: "unauthorized" });
  } finally {
    await close();
  }
});

test("authenticated bypass API requests call the bypass client", async () => {
  const bypassedRequests = [];
  const { baseUrl, close } = await startServer({
    bypassClient: {
      bypass: async (url, options) => {
        bypassedRequests.push({ url, options });
        return "https://download.example/file";
      }
    }
  });

  try {
    const response = await fetch(`${baseUrl}/api/bypass`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `access_token=${signAccessToken(testUser)}`
      },
      body: JSON.stringify({ url: "https://linkvertise.com/example", autoRedirect: false, refresh: true })
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, result: "https://download.example/file" });
    assert.deepEqual(bypassedRequests, [
      { url: "https://linkvertise.com/example", options: { refresh: true } }
    ]);
  } finally {
    await close();
  }
});

test("OAuth callback rejects missing or invalid state", async () => {
  const { baseUrl, close } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/oauth/callback?code=abc&state=bad`, {
      redirect: "manual"
    });

    assert.equal(response.status, 400);
  } finally {
    await close();
  }
});

test("me API returns the user from a valid access token", async () => {
  const { baseUrl, close } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/api/me`, {
      headers: {
        cookie: `access_token=${signAccessToken(testUser)}`
      }
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, user: testUser });
  } finally {
    await close();
  }
});

test("session API returns null user without authentication", async () => {
  const { baseUrl, close } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/api/session`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, user: null });
  } finally {
    await close();
  }
});

async function startServer(options = {}) {
  const app = createApp({
    telegramWebhookSecret: "secret",
    bypassClient: options.bypassClient || {
      bypass: async () => "https://download.example/file"
    },
    telegramClient: {
      sendMessage: async () => {}
    },
    authConfig: {
      jwtAccessSecret: accessSecret,
      jwtRefreshSecret: refreshSecret,
      isProduction: false
    },
    serveClient: false
  });

  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  return {
    baseUrl: `http://${address.address}:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  };
}

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, user }, accessSecret, {
    expiresIn: "15m"
  });
}
