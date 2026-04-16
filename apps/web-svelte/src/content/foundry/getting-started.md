# Getting Started with Foundry

The Foundry emulator provides a local implementation of Palantir Foundry's OAuth 2.0 and Compute Module APIs. It lets you develop and test Foundry integrations without connecting to a live Foundry environment.

## Prerequisites

Install emulate globally or use it via npx:

```bash
npm install -g emulate
```

## Quick Start

Start the Foundry emulator:

```bash
emulate --service foundry
```

This launches a local server (default port 4000) with:

- A default user `admin` (email `admin@localhost`)
- OAuth 2.0 authorization and token endpoints
- Admin and compute module API routes

## Seed Configuration

For most workflows you will want to define users, OAuth clients, and compute modules up front. Create an `emulate.seed.yaml` file:

```yaml
foundry:
  users:
    - username: alice
      display_name: Alice Chen
      email: alice@example.com
      given_name: Alice
      family_name: Chen

  oauth_clients:
    - client_id: my-app
      client_secret: my-secret
      redirect_uris:
        - http://localhost:3000/callback
      allowed_scopes:
        - api:admin-read
        - api:ontologies-read
        - offline_access

  compute_modules:
    runtimes:
      - runtime_id: my-runtime
    deployed_apps:
      - deployed_app_rid: ri.foundry.main.deployed-app.my-app
        runtime_id: my-runtime
```

Then start the emulator with that seed file:

```bash
emulate --service foundry --seed emulate.seed.yaml
```

## Verifying the Setup

Once the emulator is running, verify it by fetching the current user. First, obtain an access token through the OAuth flow or the client credentials grant, then call the current-user endpoint:

```bash
# Quick client_credentials token
TOKEN=$(curl -s -X POST http://localhost:4000/multipass/api/oauth2/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials&client_id=my-app&client_secret=my-secret&scope=api:admin-read' \
  | jq -r '.access_token')

# Fetch current user
curl -s http://localhost:4000/api/v2/admin/users/getCurrent \
  -H "Authorization: Bearer $TOKEN" | jq
```

The response includes the service principal that was auto-created for the OAuth client:

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

## Next Steps

- [OAuth 2.0 Authorization Flow](/foundry/auth/oauth) for interactive sign-in
- [Client Credentials](/foundry/auth/client-credentials) for service-to-service auth
- [Compute Modules Overview](/foundry/compute-modules/overview) for running functions locally
- [Seed Config Reference](/foundry/reference/seed-config) for full configuration options
