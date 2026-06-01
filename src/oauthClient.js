const HACK_CLUB_AUTH_BASE_URL = "https://auth.hackclub.com";

export function createHackClubOAuthClient({
  clientId,
  clientSecret,
  redirectUri,
  fetchImpl = fetch
}) {
  function buildAuthorizationUrl(state) {
    const url = new URL("/oauth/authorize", HACK_CLUB_AUTH_BASE_URL);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "email name");
    url.searchParams.set("state", state);
    return url.toString();
  }

  async function exchangeCodeForToken(code) {
    const response = await fetchImpl(new URL("/oauth/token", HACK_CLUB_AUTH_BASE_URL), {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
        grant_type: "authorization_code"
      })
    });

    if (!response.ok) {
      throw new Error(`Hack Club token exchange failed with HTTP ${response.status}`);
    }

    return response.json();
  }

  async function fetchMe(accessToken) {
    const response = await fetchImpl(new URL("/api/v1/me", HACK_CLUB_AUTH_BASE_URL), {
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Hack Club profile request failed with HTTP ${response.status}`);
    }

    return response.json();
  }

  return {
    buildAuthorizationUrl,
    exchangeCodeForToken,
    fetchMe
  };
}
