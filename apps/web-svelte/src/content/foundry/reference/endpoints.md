# Endpoint Reference

All endpoints served by the Foundry emulator, organized by category.

## OAuth 2.0

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/multipass/api/oauth2/authorize` | None | Authorization page; renders user selection UI |
| POST | `/multipass/api/oauth2/authorize/callback` | None | Processes user selection; redirects with authorization code |
| POST | `/multipass/api/oauth2/token` | None | Token exchange for all grant types |

### Token Endpoint Grant Types

The token endpoint (`POST /multipass/api/oauth2/token`) handles three grant types based on the `grant_type` body parameter:

| Grant Type | Required Parameters | Description |
|---|---|---|
| `authorization_code` | `code`, `client_id` | Exchanges an authorization code for tokens |
| `refresh_token` | `refresh_token`, `client_id` | Refreshes an access token using a refresh token |
| `client_credentials` | `client_id`, `client_secret` | Issues a token for a service principal |

## Admin API

| Method | Path | Auth | Required Scope | Description |
|---|---|---|---|---|
| GET | `/api/v2/admin/users/getCurrent` | Bearer | `api:admin-read` | Returns the current authenticated user |

## Compute Module Runtime Routes

These routes are used by the compute module runtime process. All paths are prefixed with `/_emulate/foundry/compute-modules/runtimes`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/_emulate/foundry/compute-modules/runtimes` | None | Create or reset a runtime session |
| GET | `/_emulate/foundry/compute-modules/runtimes/:runtimeId/job` | Module-Auth-Token | Poll for the next queued job |
| POST | `/_emulate/foundry/compute-modules/runtimes/:runtimeId/schemas` | Module-Auth-Token | Post function schemas |
| POST | `/_emulate/foundry/compute-modules/runtimes/:runtimeId/results/:jobId` | Module-Auth-Token | Post a job result |
| GET | `/_emulate/foundry/compute-modules/runtimes/:runtimeId/jobs/:jobId` | None | Inspect runtime, job, and schema state |

## Compute Module Contour Routes

These routes are used by your application to submit and monitor jobs. All paths are prefixed with `/contour-backend-multiplexer/api/module-group-multiplexer`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `.../compute-modules/jobs/execute` | Bearer | Synchronous job execution (blocks until result) |
| POST | `.../deployed-apps/jobs` | Bearer | Asynchronous job submission |
| GET | `.../jobs/:jobId/status` | Bearer | Poll job status |
| PUT | `.../jobs/result/v2` | Bearer | Retrieve result of a completed async job |

## Authentication Types

| Type | Header | Used By |
|---|---|---|
| Bearer | `Authorization: Bearer <token>` | Admin API, Contour routes |
| Module-Auth-Token | `Module-Auth-Token: <token>` | Runtime routes (polling, schemas, results) |
| None | No authentication required | OAuth endpoints, runtime creation, job inspection |

## Content Types

| Endpoint | Request Content-Type | Response Content-Type |
|---|---|---|
| Token endpoint | `application/x-www-form-urlencoded` | `application/json` |
| Authorization page | N/A | `text/html` |
| Admin getCurrent | N/A | `application/json` |
| Runtime creation | `application/json` | `application/json` |
| Schema posting | `application/json` | `application/json` |
| Result posting | `application/octet-stream` | `application/json` |
| Contour sync execute | `application/json` | `application/octet-stream` |
| Contour async submit | `application/json` | `application/json` |
| Contour job status | N/A | `application/json` |
| Contour result fetch | `application/json` | `application/octet-stream` |

## Common Error Shapes

**OAuth errors** (token endpoint):

```json
{
  "error": "error_code",
  "error_description": "Human-readable message."
}
```

**Permission errors** (admin API):

```json
{
  "errorCode": "PERMISSION_DENIED",
  "errorName": "...",
  "errorDescription": "..."
}
```

**Compute module errors** (runtime and contour routes):

```json
{
  "error": "error_code",
  "error_description": "Human-readable message."
}
```
