---
name: foundry
description: Emulated Palantir Foundry OAuth 2.0, admin identity, connectivity, ontology query, and compute-module APIs for local development and testing. Use when the user needs to test Foundry OAuth locally, emulate authorization code or client credentials flows, configure Foundry OAuth clients, validate PKCE behavior, rotate refresh tokens, call the current user or enrollment endpoints, exercise connectivity or ontology APIs, or run compute-module containers and contour job flows without hitting a real Foundry stack.
allowed-tools: Bash(npx emulate:*), Bash(emulate:*), Bash(curl:*)
---

# Foundry Emulator

Palantir Foundry emulation with OAuth 2.0, admin identity, connectivity, ontology query, and compute-module runtime plus contour job routes.

## Start

```bash
# Foundry only
npx emulate --service foundry

# Default port when run alone
# http://localhost:4000
```

`http://localhost:4000` is guaranteed when Foundry is running on its own. If you start multiple
services in one process, ports are assigned in `--service` order from the base port, so Foundry may
land on a later port.

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
| `https://<stack>/contour-backend-multiplexer/api/module-group-multiplexer/compute-modules/jobs/execute` | `$FOUNDRY_EMULATOR_URL/contour-backend-multiplexer/api/module-group-multiplexer/compute-modules/jobs/execute` |
| `https://<stack>/contour-backend-multiplexer/api/module-group-multiplexer/deployed-apps/jobs` | `$FOUNDRY_EMULATOR_URL/contour-backend-multiplexer/api/module-group-multiplexer/deployed-apps/jobs` |
| `https://<stack>/contour-backend-multiplexer/api/module-group-multiplexer/jobs/:jobId/status` | `$FOUNDRY_EMULATOR_URL/contour-backend-multiplexer/api/module-group-multiplexer/jobs/:jobId/status` |
| `https://<stack>/contour-backend-multiplexer/api/module-group-multiplexer/jobs/result/v2` | `$FOUNDRY_EMULATOR_URL/contour-backend-multiplexer/api/module-group-multiplexer/jobs/result/v2` |

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
        - api:connectivity-connection-read
        - api:connectivity-connection-write
        - api:ontologies-read
        - api:ontologies-write
        - offline_access
  enrollment:
    name: Default Enrollment
  connections:
    - display_name: External API
      parent_folder_rid: ri.compass.main.folder.project
      domains:
        - host: api.example.com
          scheme: HTTPS
  ontologies:
    - api_name: health
      display_name: Health Ontology
      queries:
        - api_name: echo
          result:
            value:
              ok: true
  compute_modules:
    deployed_apps:
      - deployed_app_rid: ri.foundry.main.deployed-app.agent-loop
        branch: master
        runtime_id: agent-loop
        display_name: Agent Loop
        active: true
    runtimes:
      - runtime_id: agent-loop
        module_auth_token: local-module-auth-token
```

When no `oauth_clients` are configured, the emulator accepts any `client_id`. With clients configured, strict validation is enforced for `client_id`, `client_secret`, `redirect_uri`, grant type, and requested scopes.

No compute-module state is seeded by default. Use either `compute_modules` in the seed config or `POST /_emulate/foundry/compute-modules/runtimes` to provision a runtime session for tests.

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

## Enrollment and CLI Identity

```bash
curl "http://localhost:4000/api/v2/admin/enrollments/getCurrent?preview=true" \
  -H "Authorization: Bearer foundry_..."

curl http://localhost:4000/multipass/api/me \
  -H "Authorization: Bearer foundry_..."
```

`/api/v2/admin/enrollments/getCurrent` also requires `api:admin-read`. `/multipass/api/me` is a CLI compatibility shim and returns `{ id, username, displayName }`.

## Connectivity and Ontologies

```bash
curl -X POST http://localhost:4000/api/v2/connectivity/connections \
  -H "Authorization: Bearer foundry_..." \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "External API",
    "parentFolderRid": "ri.compass.main.folder.project",
    "worker": { "type": "unknownWorker" },
    "configuration": {
      "type": "rest",
      "domains": [{ "host": "api.example.com", "scheme": "HTTPS" }]
    }
  }'

curl "http://localhost:4000/api/v2/ontologies?pageSize=100" \
  -H "Authorization: Bearer foundry_..."
```

Connectivity routes require `api:connectivity-connection-read` or `api:connectivity-connection-write`. Ontology list and query execution require `api:ontologies-read`.

## Compute Modules

Create a runtime session for a real container or a local integration test:

```bash
curl -X POST http://localhost:4000/_emulate/foundry/compute-modules/runtimes \
  -H "Content-Type: application/json" \
  -d '{
    "runtimeId": "agent-loop",
    "deployedAppRid": "ri.foundry.main.deployed-app.agent-loop",
    "branch": "master",
    "displayName": "Agent Loop"
  }'
```

The response returns:

- `moduleAuthToken`
- `getJobUri`
- `postSchemaUri`
- `postResultUri`

Point a real `@palantir/compute-module` container at those URLs, send `Module-Auth-Token` on runtime polling, schema, and result routes, and use the contour routes for app-facing execution:

```bash
curl -X POST http://localhost:4000/contour-backend-multiplexer/api/module-group-multiplexer/compute-modules/jobs/execute \
  -H "Authorization: Bearer contour-token" \
  -H "Content-Type: application/json" \
  -d '{
    "deployedAppRid": "ri.foundry.main.deployed-app.agent-loop",
    "deployedAppBranch": "master",
    "queryType": "run_stream",
    "query": {
      "prompt": "hello"
    }
  }'
```

Sync execute and async result fetches return raw `application/octet-stream` bodies. Streaming outputs remain concatenated JSON values with no delimiter rewriting.
