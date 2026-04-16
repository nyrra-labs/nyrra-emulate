# Scope to Endpoint Mapping

This reference maps OAuth scopes to the endpoints they protect.

## Scope Matrix

| Scope | Endpoint | Effect |
|---|---|---|
| `api:admin-read` | `GET /api/v2/admin/users/getCurrent` | Required; returns 403 without it |
| `api:ontologies-read` | Ontology read endpoints | Stored on token for application-level checks |
| `api:ontologies-write` | Ontology write endpoints | Stored on token for application-level checks |
| `offline_access` | `POST /multipass/api/oauth2/token` (authorization_code) | Triggers refresh token issuance |

## Enforcement Levels

The emulator enforces scopes at two levels:

### Emulator-Enforced Scopes

These scopes are checked by the emulator itself and produce errors if missing:

| Scope | Enforcement |
|---|---|
| `api:admin-read` | The `getCurrent` endpoint returns `PERMISSION_DENIED` (403) without this scope |
| `offline_access` | The token endpoint omits `refresh_token` from the response without this scope |

### Application-Level Scopes

These scopes are stored on the access token and passed through to your application. The emulator does not enforce them at the route level, but your application can read them from the token to make access control decisions:

- `api:ontologies-read`
- `api:ontologies-write`
- Any custom scope strings

## Client Scope Restriction

When an OAuth client has `allowed_scopes` configured, any token request that includes a scope not in the list is rejected before the token is issued:

```yaml
foundry:
  oauth_clients:
    - client_id: restricted-app
      client_secret: secret
      allowed_scopes:
        - api:ontologies-read
```

Requesting `api:admin-read` with this client:

```json
{
  "error": "invalid_scope",
  "error_description": "The requested scope is invalid, unknown, or malformed."
}
```

This applies to all grant types: authorization code, refresh token, and client credentials.

## Scope Flow by Grant Type

### Authorization Code

```
authorize request (scope=X Y Z)
    --> user signs in
    --> code issued
    --> token exchange
    --> access_token carries scopes [X, Y, Z]
    --> if Z includes offline_access: refresh_token also issued
```

### Refresh Token

```
refresh request
    --> inherits scopes from original authorization
    --> new access_token carries same scopes
    --> new refresh_token issued (rotation)
```

### Client Credentials

```
token request (scope=X Y)
    --> access_token carries scopes [X, Y]
    --> scope field echoed in response
    --> no refresh_token
```

## Checking Scopes in Your Application

The emulator stores granted scopes on each access token. When your application receives a request with a bearer token, the scopes are available via the auth middleware. In a test, you can verify scope enforcement:

```typescript
// Token obtained with api:ontologies-read only
const res = await fetch("http://localhost:4000/api/v2/admin/users/getCurrent", {
  headers: { Authorization: `Bearer ${token}` },
});

// Returns 403 because api:admin-read was not requested
console.log(res.status); // 403
const body = await res.json();
console.log(body.errorCode); // "PERMISSION_DENIED"
```

## Wildcard Behavior

When `allowed_scopes` is empty or omitted on an OAuth client, the client accepts any scope value. This is the default and is useful during development when you want to avoid scope configuration overhead.
