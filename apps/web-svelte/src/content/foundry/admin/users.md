# User Management

Users in the Foundry emulator are configured through the seed config file. The emulator supports two principal types: human users (for interactive sign-in) and service principals (created automatically via the client credentials grant).

## Default User

When the emulator starts, it automatically seeds a default human user:

| Field | Value |
|---|---|
| `username` | `admin` |
| `display_name` | `Admin` |
| `email` | `admin@localhost` |
| `realm` | `palantir-internal-realm` |
| `organization_rid` | `ri.organization.main.organization.default` |
| `principal_type` | `human` |
| `active` | `true` |

This user always exists, even when no seed config is provided. If your seed config defines a user with username `admin`, the default is skipped and your definition takes precedence.

## Seeding Users

Define users in the `foundry.users` section of your seed config:

```yaml
foundry:
  users:
    - username: alice
      display_name: Alice Chen
      email: alice@example.com
      given_name: Alice
      family_name: Chen

    - username: bob
      display_name: Bob Park
      email: bob@example.com
      given_name: Bob
      family_name: Park
      attributes:
        department: ["Finance"]
        location: ["NYC"]

    - username: svc-etl
      display_name: ETL Service
      principal_type: service
      oauth_client_id: etl-pipeline
```

## User Fields

| Field | Type | Default | Description |
|---|---|---|---|
| `username` | string | (required) | Unique login name |
| `display_name` | string | Same as `username` | Name shown in the sign-in UI |
| `email` | string | null | Primary email address |
| `given_name` | string | null | First name |
| `family_name` | string | null | Last name |
| `realm` | string | `palantir-internal-realm` | Authentication realm |
| `organization_rid` | string | `ri.organization.main.organization.default` | Organization RID |
| `principal_type` | `human` or `service` | `human` | Whether this is a human or service principal |
| `active` | boolean | `true` | Whether the user can authenticate |
| `oauth_client_id` | string | null | Ties a service principal to an OAuth client |
| `attributes` | object | `{}` | Custom key-value attributes (values are string arrays) |

## Human vs. Service Principals

**Human principals** appear on the OAuth sign-in page and can be selected during the authorization code flow. Only active human users are shown.

**Service principals** are typically created automatically when the client credentials grant is used. You can also pre-seed them to control their metadata. Service principals:

- Do not appear on the sign-in page
- Have an empty `organization` field in the current-user response
- Are linked to an OAuth client via `oauth_client_id`

## Deactivating Users

Set `active: false` to prevent a user from authenticating:

```yaml
foundry:
  users:
    - username: former-employee
      display_name: Former Employee
      active: false
```

Deactivated users:

- Are hidden from the OAuth sign-in page
- Cannot complete the authorization code flow
- Cannot have their refresh tokens used (refresh attempts fail with `invalid_grant`)
- Return a 401 error from the current user endpoint if a previously-issued token is used

## Custom Attributes

The `attributes` field accepts a map where each key maps to an array of strings. These appear in the current-user response merged with the reserved `multipass:` attributes:

```yaml
attributes:
  department: ["Engineering"]
  team: ["Platform", "Infrastructure"]
  badge_level: ["L3"]
```

These attributes are useful for testing attribute-based access control or user profile displays in your application.

## Duplicate Handling

If a user with the same `username` already exists in the store (from a previous seed or the default admin user), the duplicate entry in the seed config is skipped. The first definition wins.
