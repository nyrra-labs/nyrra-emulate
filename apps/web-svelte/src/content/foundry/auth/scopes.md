# Scope Model

The Foundry emulator uses OAuth 2.0 scopes to control access to API endpoints. Scopes are space-separated strings passed in the `scope` parameter during authorization or token requests.

## Available Scopes

| Scope | Purpose |
|---|---|
| `api:admin-read` | Read admin APIs, including the current user endpoint |
| `api:ontologies-read` | Read access to the Ontology API |
| `api:ontologies-write` | Write access to the Ontology API |
| `offline_access` | Enables refresh token issuance |

## How Scopes Are Enforced

Scopes are checked at two levels:

### Client-Level Restriction

When an OAuth client has `allowed_scopes` configured, the emulator rejects any request that includes a scope not in the list. This applies to both the authorization endpoint and the token endpoint.

```yaml
foundry:
  oauth_clients:
    - client_id: read-only-app
      client_secret: secret
      allowed_scopes:
        - api:ontologies-read
```

Requesting `api:ontologies-write` with this client returns an error:

```json
{
  "error": "invalid_scope",
  "error_description": "The requested scope is invalid, unknown, or malformed."
}
```

If `allowed_scopes` is empty or omitted, the client accepts any scope.

### Endpoint-Level Enforcement

Individual API endpoints check the scopes on the bearer token. Currently, the `api:admin-read` scope is required by the current user endpoint (`GET /api/v2/admin/users/getCurrent`). Calling that endpoint without the scope returns:

```json
{
  "errorCode": "PERMISSION_DENIED",
  "errorName": "Get Current User Permission Denied",
  "errorDescription": "Could not get the current user."
}
```

## Requesting Multiple Scopes

Separate scopes with spaces in the `scope` parameter:

```bash
scope=api:admin-read%20api:ontologies-read%20offline_access
```

In YAML seed config, list them under `allowed_scopes`:

```yaml
allowed_scopes:
  - api:admin-read
  - api:ontologies-read
  - api:ontologies-write
  - offline_access
```

## Scope Behavior by Grant Type

| Grant Type | Scope Behavior |
|---|---|
| `authorization_code` | Scopes from the authorize request are granted after user consent |
| `refresh_token` | Inherits scopes from the original authorization; cannot be changed |
| `client_credentials` | Scopes from the token request are granted directly |

## The offline_access Scope

The `offline_access` scope has special significance: when present in an authorization code flow, the token response includes a `refresh_token`. Without it, only an `access_token` is returned. This scope has no effect on the client credentials grant, which never issues refresh tokens.

## Custom Scopes

The emulator does not restrict scope values to a fixed list. You can use any scope string in your seed config. The only scope with built-in enforcement behavior is `api:admin-read` (required by the current user endpoint) and `offline_access` (triggers refresh token issuance). All other scopes are stored on the token and can be inspected by your application.
