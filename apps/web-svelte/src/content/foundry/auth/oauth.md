# OAuth 2.0 Authorization Flow

The Foundry emulator implements the OAuth 2.0 authorization code grant with optional PKCE, matching Foundry's Multipass service. This is the flow used by interactive applications where a human user signs in through a browser.

## Flow Overview

1. Your application redirects the user to the authorization endpoint.
2. The emulator displays a sign-in page listing all seeded human users.
3. The user picks an identity and is redirected back with an authorization code.
4. Your application exchanges the code for an access token (and optionally a refresh token).

## Authorization Endpoint

```
GET /multipass/api/oauth2/authorize
```

**Query parameters:**

| Parameter | Required | Description |
|---|---|---|
| `client_id` | Yes | The OAuth client ID |
| `response_type` | Yes | Must be `code` |
| `redirect_uri` | Yes (unless client has a single registered URI) | Where to redirect after sign-in |
| `scope` | No | Space-separated list of scopes |
| `state` | No | Opaque value passed back to your redirect |
| `code_challenge` | No | PKCE challenge (base64url-encoded SHA-256 hash) |
| `code_challenge_method` | No | `S256` or `plain` |

**Example:**

```bash
open "http://localhost:4000/multipass/api/oauth2/authorize?\
client_id=my-app&\
response_type=code&\
redirect_uri=http://localhost:3000/callback&\
scope=api:admin-read%20offline_access&\
state=xyz"
```

The emulator renders a sign-in page. After the user selects an identity, the browser redirects to:

```
http://localhost:3000/callback?code=<authorization_code>&state=xyz
```

## Token Exchange

```
POST /multipass/api/oauth2/token
Content-Type: application/x-www-form-urlencoded
```

**Body parameters:**

| Parameter | Required | Description |
|---|---|---|
| `grant_type` | Yes | `authorization_code` |
| `code` | Yes | The authorization code from the redirect |
| `client_id` | Yes | The OAuth client ID |
| `client_secret` | No | Required if the client was registered with a secret |
| `redirect_uri` | No | Must match the URI used in the authorize request |
| `code_verifier` | No | Required if `code_challenge` was provided during authorization |

**Example:**

```bash
curl -X POST http://localhost:4000/multipass/api/oauth2/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=authorization_code' \
  -d 'code=<authorization_code>' \
  -d 'client_id=my-app' \
  -d 'client_secret=my-secret' \
  -d 'redirect_uri=http://localhost:3000/callback'
```

**Response:**

```json
{
  "access_token": "foundry_...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "foundry_refresh_..."
}
```

A `refresh_token` is only included when `offline_access` was in the requested scopes.

## PKCE Support

The emulator supports Proof Key for Code Exchange (PKCE) with `S256` and `plain` methods. PKCE protects against authorization code interception, especially for public clients that cannot safely store a client secret.

**TypeScript example:**

```typescript
import { createHash, randomBytes } from "crypto";

// Generate verifier and challenge
const codeVerifier = randomBytes(32).toString("base64url");
const codeChallenge = createHash("sha256")
  .update(codeVerifier)
  .digest("base64url");

// Include in the authorization URL
const authUrl = new URL("http://localhost:4000/multipass/api/oauth2/authorize");
authUrl.searchParams.set("client_id", "my-app");
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("redirect_uri", "http://localhost:3000/callback");
authUrl.searchParams.set("scope", "api:admin-read");
authUrl.searchParams.set("code_challenge", codeChallenge);
authUrl.searchParams.set("code_challenge_method", "S256");

// When exchanging the code, send the verifier
const tokenResponse = await fetch(
  "http://localhost:4000/multipass/api/oauth2/token",
  {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: authorizationCode,
      client_id: "my-app",
      redirect_uri: "http://localhost:3000/callback",
      code_verifier: codeVerifier,
    }),
  }
);
```

## Error Responses

Authorization errors render an HTML error page. Token errors return JSON:

```json
{
  "error": "invalid_grant",
  "error_description": "The code passed is incorrect or expired."
}
```

Common error codes:

| Error | Cause |
|---|---|
| `invalid_request` | Missing required parameter |
| `invalid_client` | Wrong client_id or client_secret |
| `invalid_grant` | Expired code, PKCE mismatch, or redirect_uri mismatch |
| `invalid_scope` | Requested scope not in the client's allowed_scopes |

## Authorization Code Expiry

Codes expire after 10 minutes. If a code is not exchanged within that window, the token endpoint returns `invalid_grant`.
