# Current User Endpoint

The Foundry emulator provides the `getCurrent` endpoint for retrieving the identity of the authenticated principal. This matches Foundry's Admin API and is commonly used by applications to verify authentication and load user profile information.

## Request

```
GET /api/v2/admin/users/getCurrent
Authorization: Bearer <access_token>
```

**Required scope:** `api:admin-read`

## Example

```bash
curl http://localhost:4000/api/v2/admin/users/getCurrent \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Response for a Human Principal

When the token was obtained through the authorization code flow, the response represents the human user who signed in:

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "username": "alice",
  "givenName": "Alice",
  "familyName": "Chen",
  "email": "alice@example.com",
  "realm": "palantir-internal-realm",
  "organization": "ri.organization.main.organization.default",
  "status": "ACTIVE",
  "attributes": {
    "multipass:realm": ["palantir-internal-realm"],
    "multipass:givenName": ["Alice"],
    "multipass:familyName": ["Chen"],
    "multipass:email:primary": ["alice@example.com"],
    "multipass:organization-rid": ["ri.organization.main.organization.default"]
  }
}
```

## Response for a Service Principal

When the token was obtained through the client credentials grant, the response represents the auto-created service principal:

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

Service principals have an empty `organization` field and omit `givenName`, `familyName`, and `email`.

## Related Identity Endpoints

- `GET /api/v2/admin/enrollments/getCurrent` returns the current enrollment and also requires `api:admin-read`
- `GET /multipass/api/me` is a CLI compatibility shim that returns `{ id, username, displayName }` for any authenticated principal

## Response Fields

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID of the user |
| `username` | string | Login name |
| `givenName` | string | First name (omitted if null) |
| `familyName` | string | Last name (omitted if null) |
| `email` | string | Primary email (omitted if null) |
| `realm` | string | Authentication realm (default: `palantir-internal-realm`) |
| `organization` | string | Organization RID for humans; empty string for service principals |
| `status` | string | `ACTIVE` or `DELETED` |
| `attributes` | object | Key-value attributes including reserved `multipass:` prefixed fields and any custom attributes from seed config |

## Custom Attributes

Users seeded with an `attributes` map have those attributes merged into the response alongside the reserved `multipass:` attributes:

```yaml
foundry:
  users:
    - username: alice
      display_name: Alice Chen
      email: alice@example.com
      attributes:
        department: ["Engineering"]
        team: ["Platform"]
```

Response:

```json
{
  "attributes": {
    "multipass:realm": ["palantir-internal-realm"],
    "multipass:email:primary": ["alice@example.com"],
    "department": ["Engineering"],
    "team": ["Platform"]
  }
}
```

## Error Responses

**Missing or invalid token (401):**

```json
{
  "message": "Requires authentication"
}
```

**Token lacks `api:admin-read` scope (403):**

```json
{
  "errorCode": "PERMISSION_DENIED",
  "errorName": "GetCurrentUserPermissionDenied",
  "errorDescription": "Could not getCurrent the User.",
  "errorInstanceId": "00000000-0000-0000-0000-000000000000",
  "parameters": {}
}
```

**User deactivated after token was issued (401):**

```json
{
  "error": "invalid_token",
  "error_description": "The access token is invalid."
}
```
