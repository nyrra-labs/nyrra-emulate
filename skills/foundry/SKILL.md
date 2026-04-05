---
name: foundry
description: Emulated Palantir Foundry OAuth 2.0 and current-user API for local development and testing. Use when the user needs to test Foundry OAuth locally, emulate authorization code or client credentials flows, configure Foundry OAuth clients, validate PKCE behavior, rotate refresh tokens, or call the current user endpoint without hitting a real Foundry stack.
allowed-tools: Bash(npx emulate:*), Bash(emulate:*), Bash(curl:*)
---

# Foundry OAuth Emulator

Palantir Foundry OAuth 2.0 emulation with authorization code flow, PKCE with `S256`, refresh token rotation, client credentials, and `GET /api/v2/admin/users/getCurrent`.

## Start

```bash
# Foundry only
npx emulate --service foundry

# Default port when run alone
# http://localhost:4000
```

Or programmatically:

```typescript
import { createEmulator } from 'emulate'

const foundry = await createEmulator({ service: 'foundry', port: 4000 })
// foundry.url === 'http://localhost:4000'
```

## Pointing Your App at the Emulator

### Environment Variable

```bash
FOUNDRY_EMULATOR_URL=http://localhost:4000
```

### URL Mapping

| Real Foundry URL | Emulator URL |
|------------------|-------------|
| `https://<stack>/multipass/api/oauth2/authorize` | `$FOUNDRY_EMULATOR_URL/multipass/api/oauth2/authorize` |
| `https://<stack>/multipass/api/oauth2/token` | `$FOUNDRY_EMULATOR_URL/multipass/api/oauth2/token` |
| `https://<stack>/api/v2/admin/users/getCurrent` | `$FOUNDRY_EMULATOR_URL/api/v2/admin/users/getCurrent` |

## Seed Config

```yaml
foundry:
  users:
    - username: jane
      display_name: Jane Smith
      email: jane@example.com
      given_name: Jane
      family_name: Smith
      attributes:
        department:
          - Finance
  oauth_clients:
    - client_id: foundry-web
      client_secret: foundry-secret
      name: Foundry Web App
      redirect_uris:
        - http://localhost:3000/callback
      grant_types:
        - authorization_code
        - refresh_token
        - client_credentials
      allowed_scopes:
        - api:admin-read
        - api:ontologies-read
        - api:ontologies-write
        - offline_access
```

When no `oauth_clients` are configured, the emulator accepts any `client_id`. With clients configured, strict validation is enforced for `client_id`, `client_secret`, `redirect_uri`, grant type, and requested scopes.

## Authorization Code Flow

```bash
curl -v "http://localhost:4000/multipass/api/oauth2/authorize?\
client_id=foundry-web&\
redirect_uri=http://localhost:3000/callback&\
response_type=code&\
scope=api:admin-read+offline_access&\
state=random-state"
```

The emulator renders a user picker. After selection, it redirects back to `redirect_uri` with `code` and `state`.

Supports PKCE with `code_challenge` and `code_challenge_method=S256`.

## Token Exchange

```bash
curl -X POST http://localhost:4000/multipass/api/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "code=<authorization_code>&\
client_id=foundry-web&\
client_secret=foundry-secret&\
redirect_uri=http://localhost:3000/callback&\
grant_type=authorization_code"
```

Returns:

```json
{
  "access_token": "foundry_...",
  "refresh_token": "foundry_refresh_...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

`refresh_token` is returned only when the granted scopes include `offline_access`.

## Refresh Token

```bash
curl -X POST http://localhost:4000/multipass/api/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "refresh_token=foundry_refresh_...&\
client_id=foundry-web&\
client_secret=foundry-secret&\
grant_type=refresh_token"
```

Refresh rotates the token and returns a new `refresh_token`.

## Client Credentials

```bash
curl -X POST http://localhost:4000/multipass/api/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=foundry-web&\
client_secret=foundry-secret&\
grant_type=client_credentials&\
scope=api:admin-read"
```

This creates or reuses a service principal whose `username` matches `client_id`.

## Current User

```bash
curl http://localhost:4000/api/v2/admin/users/getCurrent \
  -H "Authorization: Bearer foundry_..."
```

`getCurrent` requires the `api:admin-read` scope. Auth code and refresh tokens resolve to seeded human users. Client credentials tokens resolve to the service principal.
