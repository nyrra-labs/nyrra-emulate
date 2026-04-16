# Token Refresh

The Foundry emulator supports the `refresh_token` grant for obtaining new access tokens without requiring the user to sign in again. Refresh tokens are issued during the authorization code flow when the `offline_access` scope is requested.

## Obtaining a Refresh Token

Include `offline_access` in your authorization request scopes. After the authorization code exchange, the response will contain both an access token and a refresh token:

```json
{
  "access_token": "foundry_...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "foundry_refresh_..."
}
```

If `offline_access` is not in the requested scopes, no refresh token is issued.

## Using a Refresh Token

```
POST /multipass/api/oauth2/token
Content-Type: application/x-www-form-urlencoded
```

**Body parameters:**

| Parameter | Required | Description |
|---|---|---|
| `grant_type` | Yes | `refresh_token` |
| `refresh_token` | Yes | The refresh token from the previous token response |
| `client_id` | Yes | The OAuth client ID |
| `client_secret` | No | Required if the client was registered with a secret |

**Example:**

```bash
curl -X POST http://localhost:4000/multipass/api/oauth2/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=refresh_token' \
  -d 'refresh_token=foundry_refresh_...' \
  -d 'client_id=my-app' \
  -d 'client_secret=my-secret'
```

## Response

```json
{
  "access_token": "foundry_...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "foundry_refresh_..."
}
```

## Token Rotation

The emulator implements refresh token rotation. Each time you use a refresh token, the emulator:

1. Invalidates the old refresh token
2. Issues a new access token
3. Issues a new refresh token

This means each refresh token can only be used once. Attempting to reuse a consumed refresh token returns an error:

```json
{
  "error": "invalid_grant",
  "error_description": "The refresh_token is invalid."
}
```

Your application must store and use the latest refresh token from each response.

## TypeScript Example

```typescript
async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await fetch(
    "http://localhost:4000/multipass/api/oauth2/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const body = await response.json();
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
  };
}
```

## Scope Persistence

The new access token retains the same scopes that were granted during the original authorization. You cannot request different scopes during a refresh.

## User Deactivation

If the user associated with the refresh token becomes inactive (e.g., `active: false` in seed config), the refresh attempt fails with `invalid_grant`.
