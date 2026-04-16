# Client Credentials Grant

The client credentials grant authenticates service accounts (machine-to-machine communication) without user interaction. When your application uses this grant, the emulator creates a service principal tied to the OAuth client.

## Request

```
POST /multipass/api/oauth2/token
Content-Type: application/x-www-form-urlencoded
```

**Body parameters:**

| Parameter | Required | Description |
|---|---|---|
| `grant_type` | Yes | `client_credentials` |
| `client_id` | Yes | The OAuth client ID |
| `client_secret` | Yes | The OAuth client secret |
| `scope` | No | Space-separated list of requested scopes |

**Example:**

```bash
curl -X POST http://localhost:4000/multipass/api/oauth2/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials' \
  -d 'client_id=my-app' \
  -d 'client_secret=my-secret' \
  -d 'scope=api:admin-read api:ontologies-read'
```

## Response

```json
{
  "access_token": "foundry_...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "api:admin-read api:ontologies-read"
}
```

The `scope` field is only present in the response when the request included scopes. No `refresh_token` is returned for this grant type because the client can re-authenticate at any time with its credentials.

## Service Principal

The first time a client_id is used with the client credentials grant, the emulator automatically creates a service principal with:

- `username` set to the `client_id`
- `principal_type` set to `service`
- `oauth_client_id` set to the `client_id`

Subsequent requests with the same client_id reuse this principal. The service principal appears in current-user responses:

```bash
curl http://localhost:4000/api/v2/admin/users/getCurrent \
  -H "Authorization: Bearer $TOKEN" | jq
```

```json
{
  "id": "...",
  "username": "my-app",
  "realm": "palantir-internal-realm",
  "organization": "",
  "status": "ACTIVE",
  "attributes": {
    "multipass:realm": ["palantir-internal-realm"]
  }
}
```

Note that the `organization` field is empty for service principals, matching Foundry's production behavior.

## Seed Configuration

Register an OAuth client that supports the client credentials grant:

```yaml
foundry:
  oauth_clients:
    - client_id: etl-pipeline
      client_secret: pipeline-secret
      grant_types:
        - client_credentials
      allowed_scopes:
        - api:ontologies-read
        - api:ontologies-write
```

If `grant_types` is omitted, the client defaults to allowing all three grant types: `authorization_code`, `refresh_token`, and `client_credentials`.

## Scope Validation

When `allowed_scopes` is configured on the client, the emulator rejects requests for scopes not in the list:

```json
{
  "error": "invalid_scope",
  "error_description": "The requested scope is invalid, unknown, or malformed."
}
```

If `allowed_scopes` is empty or not set, any scope is accepted.
