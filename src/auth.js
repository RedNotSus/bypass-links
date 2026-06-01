import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";
const OAUTH_STATE_COOKIE = "hackclub_oauth_state";
const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

export function normalizeHackClubUser(payload = {}) {
  const identity = payload.identity || payload;
  const firstName = identity.first_name || "";
  const lastName = identity.last_name || "";
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    id: identity.id,
    email: identity.primary_email || identity.email,
    name: name || identity.name || identity.display_name || "",
    firstName,
    lastName
  };
}

export function createAuthService({
  accessSecret,
  refreshSecret,
  isProduction = process.env.NODE_ENV === "production"
}) {
  function cookieOptions(maxAgeSeconds) {
    return {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: maxAgeSeconds * 1000,
      path: "/"
    };
  }

  function stateCookieOptions() {
    return {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: 10 * 60 * 1000,
      path: "/"
    };
  }

  function signAccessToken(user) {
    return jwt.sign({ sub: user.id, user }, accessSecret, {
      expiresIn: ACCESS_TTL_SECONDS
    });
  }

  function signRefreshToken(user) {
    return jwt.sign({ sub: user.id, user }, refreshSecret, {
      expiresIn: REFRESH_TTL_SECONDS
    });
  }

  function setSessionCookies(response, user) {
    response.cookie(ACCESS_COOKIE, signAccessToken(user), cookieOptions(ACCESS_TTL_SECONDS));
    response.cookie(REFRESH_COOKIE, signRefreshToken(user), cookieOptions(REFRESH_TTL_SECONDS));
  }

  function clearSessionCookies(response) {
    response.clearCookie(ACCESS_COOKIE, { path: "/" });
    response.clearCookie(REFRESH_COOKIE, { path: "/" });
  }

  function createOauthState(response) {
    const state = crypto.randomBytes(24).toString("hex");
    response.cookie(OAUTH_STATE_COOKIE, state, stateCookieOptions());
    return state;
  }

  function verifyOauthState(request, response, state) {
    const cookieState = request.cookies?.[OAUTH_STATE_COOKIE];
    response.clearCookie(OAUTH_STATE_COOKIE, { path: "/" });
    if (!state || !cookieState || state.length !== cookieState.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(state), Buffer.from(cookieState));
  }

  function readAccessUser(request) {
    const token = request.cookies?.[ACCESS_COOKIE];
    if (!token) {
      return null;
    }

    try {
      const payload = jwt.verify(token, accessSecret);
      return payload.user;
    } catch {
      return null;
    }
  }

  function readRefreshUser(request) {
    const token = request.cookies?.[REFRESH_COOKIE];
    if (!token) {
      return null;
    }

    try {
      const payload = jwt.verify(token, refreshSecret);
      return payload.user;
    } catch {
      return null;
    }
  }

  function requireAuth(request, response, next) {
    const user = readAccessUser(request);
    if (!user) {
      response.status(401).json({ ok: false, error: "unauthorized" });
      return;
    }

    request.user = user;
    next();
  }

  return {
    clearSessionCookies,
    createOauthState,
    readAccessUser,
    readRefreshUser,
    requireAuth,
    setSessionCookies,
    verifyOauthState
  };
}
