# Seed Config Reference

The seed config file pre-populates the Foundry emulator with users, OAuth clients, and compute module resources. Pass it when starting the emulator:

```bash
emulate --service foundry --seed emulate.seed.yaml
```

## Full Schema

```yaml
foundry:
  port: 4000  # optional; override the default port

  users:
    - username: string          # required, unique
      display_name: string      # defaults to username
      email: string             # optional
      given_name: string        # optional
      family_name: string       # optional
      realm: string             # defaults to "palantir-internal-realm"
      organization_rid: string  # defaults to "ri.organization.main.organization.default"
      principal_type: string    # "human" (default) or "service"
      active: boolean           # defaults to true
      oauth_client_id: string   # optional; ties service principals to an OAuth client
      attributes:               # optional; custom key-value attributes
        key: [value1, value2]

  oauth_clients:
    - client_id: string         # required, unique
      client_secret: string     # required
      name: string              # defaults to client_id
      redirect_uris:            # optional; list of allowed redirect URIs
        - string
      grant_types:              # defaults to all three
        - authorization_code
        - refresh_token
        - client_credentials
      allowed_scopes:           # optional; restricts which scopes the client can request
        - string

  compute_modules:
    runtimes:
      - runtime_id: string         # required, unique
        module_auth_token: string   # optional; auto-generated if omitted

    deployed_apps:
      - deployed_app_rid: string   # required
        runtime_id: string         # required; must match a runtime
        branch: string             # defaults to "master"
        display_name: string       # optional
        active: boolean            # defaults to true
```

## Complete Example

```yaml
foundry:
  users:
    - username: alice
      display_name: Alice Chen
      email: alice@example.com
      given_name: Alice
      family_name: Chen
      attributes:
        department: ["Engineering"]
        team: ["Platform"]

    - username: bob
      display_name: Bob Park
      email: bob@example.com
      given_name: Bob
      family_name: Park

    - username: svc-pipeline
      display_name: Pipeline Service
      principal_type: service
      oauth_client_id: pipeline-client

  oauth_clients:
    - client_id: web-app
      client_secret: web-secret
      name: Foundry Web App
      redirect_uris:
        - http://localhost:3000/callback
        - http://localhost:3000/auth/callback
      grant_types:
        - authorization_code
        - refresh_token
      allowed_scopes:
        - api:admin-read
        - api:ontologies-read
        - api:ontologies-write
        - offline_access

    - client_id: pipeline-client
      client_secret: pipeline-secret
      grant_types:
        - client_credentials
      allowed_scopes:
        - api:ontologies-read
        - api:ontologies-write

  compute_modules:
    runtimes:
      - runtime_id: agent-loop
        module_auth_token: test-token-123

    deployed_apps:
      - deployed_app_rid: ri.foundry.main.deployed-app.agent-loop
        runtime_id: agent-loop
        branch: master
        display_name: Agent Loop
```

## Default Values

| Field | Default |
|---|---|
| `users[].display_name` | Same as `username` |
| `users[].realm` | `palantir-internal-realm` |
| `users[].organization_rid` | `ri.organization.main.organization.default` |
| `users[].principal_type` | `human` |
| `users[].active` | `true` |
| `users[].attributes` | `{}` |
| `oauth_clients[].name` | Same as `client_id` |
| `oauth_clients[].redirect_uris` | `[]` |
| `oauth_clients[].grant_types` | `["authorization_code", "refresh_token", "client_credentials"]` |
| `oauth_clients[].allowed_scopes` | `[]` (no restriction) |
| `deployed_apps[].branch` | `master` |
| `deployed_apps[].active` | `true` |

## Default User

Even without a seed config, the emulator creates a default `admin` user. See [User Management](/foundry/admin/users) for details. If your seed config includes a user with username `admin`, the default is skipped.

## Duplicate Handling

For each entity type, the emulator checks for existing records by the unique key (`username` for users, `client_id` for clients). If a record with the same key already exists, the duplicate seed entry is skipped. The first definition wins.

## OAuth Client Defaults

When `grant_types` is omitted, the client accepts all three grant types. When `allowed_scopes` is omitted or empty, the client accepts any requested scope. This is useful for development when you do not want scope restrictions.

## Compute Module Dependencies

Deployed apps reference runtimes by `runtime_id`. If a deployed app references a `runtime_id` that is not listed under `runtimes`, the emulator auto-creates the runtime when processing the deployed app. You can still explicitly list it under `runtimes` if you want to set a specific `module_auth_token`.
