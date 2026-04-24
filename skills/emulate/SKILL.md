---
name: emulate
description: Local drop-in API emulator for Vercel, GitHub, Google, Slack, Apple, Microsoft, AWS, and Foundry. Foundry currently covers OAuth, current-user lookup, and compute-module routes. Use when the user needs to start emulated services, configure seed data, write tests against local APIs, set up CI without network access, or work with the emulate CLI or programmatic API. Triggers include "start the emulator", "emulate services", "mock API locally", "create emulator config", "test against local API", "npx emulate", or any task requiring local service emulation.
allowed-tools: Bash(npx emulate:*), Bash(emulate:*)
---

# Service Emulation with emulate

Local drop-in replacement services for CI and no-network sandboxes. Fully stateful, production-fidelity API emulation, not mocks.

## Quick Start

```bash
npx @nyrra/emulate
```

The default startup set starts with sensible defaults:

| Service   | Default Port |
|-----------|-------------|
| Vercel    | 4000        |
| GitHub    | 4001        |
| Google    | 4002        |
| Slack     | 4003        |
| Apple     | 4004        |
| Microsoft | 4005        |
| Okta      | 4006        |
| AWS       | 4007        |
| Resend    | 4008        |
| Stripe    | 4009        |
| MongoDB Atlas | 4010    |
| Clerk     | 4011        |

Foundry is opt-in. Start it explicitly with `npx @nyrra/emulate --service foundry`, or include `foundry:` in the seed config so service inference enables it. If you install the package globally, the executable name is still `emulate`. Starter configs are bundled into the CLI: run `emulate init` in a TTY for the interactive builder, or use `--service`, `--stdout`, and `--out` for scripted generation. When Foundry runs on its own, it uses `http://localhost:4000`; if you start multiple services together, ports are assigned in `--service` order from the base port. The current Foundry slice covers OAuth, admin identity, connectivity, ontology queries, and compute-module runtime plus contour routes.

## CLI

```bash
# Start the default startup set
emulate

# Start specific services
emulate --service vercel,github,foundry

# Custom base port (auto-increments per service)
emulate --port 3000

# Use a seed config file
emulate --seed config.yaml

# Launch the interactive starter-config builder
emulate init

# Generate config for a specific service
emulate init --service foundry

# Print starter YAML without writing a file
emulate init --service foundry --stdout

# List available services
emulate list
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `-p, --port` | `4000` | Base port (auto-increments per service) |
| `-s, --service` | default startup set | Comma-separated services to enable |
| `--seed` | auto-detect | Path to seed config (YAML or JSON) |

The port can also be set via `EMULATE_PORT` or `PORT` environment variables.

### Starter Config Generation

- `emulate init` opens an interactive builder when a TTY is available.
- `emulate init --service foundry` writes `emulate.config.yaml` with a Foundry starter template and a working `foundry_test_token`.
- `emulate init --service github,foundry --stdout` prints bundled starter YAML for scripting or redirection.
- `emulate init --out ./configs/local.yaml --force` writes to a custom path and overwrites the file when needed.

When Foundry starts, the banner also prints a `Quick start` section with a ready-to-open authorize URL and curl examples for `/multipass/api/me` and `/api/v2/admin/users/getCurrent`.

## Programmatic API

```bash
npm install @nyrra/emulate
```

Each call to `createEmulator` starts a single service:

```typescript
import { createEmulator } from '@nyrra/emulate'

const github = await createEmulator({ service: 'github', port: 4001 })
const vercel = await createEmulator({ service: 'vercel', port: 4002 })
const foundry = await createEmulator({ service: 'foundry', port: 4003 })

github.url   // 'http://localhost:4001'
vercel.url   // 'http://localhost:4002'
foundry.url  // 'http://localhost:4003'

await github.close()
await vercel.close()
await foundry.close()
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `service` | *(required)* | Registered service name such as `'vercel'`, `'github'`, `'google'`, `'slack'`, `'apple'`, `'microsoft'`, `'aws'`, or `'foundry'` |
| `port` | `4000` | Port for the HTTP server |
| `seed` | none | Inline seed data (same shape as YAML config) |

### Instance Methods

| Method | Description |
|--------|-------------|
| `url` | Base URL of the running server |
| `reset()` | Wipe the store and replay seed data |
| `close()` | Shut down the HTTP server, returns a Promise |

## Vitest / Jest Setup

```typescript
import { createEmulator, type Emulator } from '@nyrra/emulate'

let github: Emulator
let vercel: Emulator

beforeAll(async () => {
  ;[github, vercel] = await Promise.all([
    createEmulator({ service: 'github', port: 4001 }),
    createEmulator({ service: 'vercel', port: 4002 }),
  ])
  process.env.GITHUB_EMULATOR_URL = github.url
  process.env.VERCEL_EMULATOR_URL = vercel.url
})

afterEach(() => { github.reset(); vercel.reset() })
afterAll(() => Promise.all([github.close(), vercel.close()]))
```

## Configuration

Configuration is optional. The CLI auto-detects config files in this order:

1. `emulate.config.yaml` / `.yml`
2. `emulate.config.json`
3. `service-emulator.config.yaml` / `.yml`
4. `service-emulator.config.json`

Or pass `--seed <file>` explicitly. Run `emulate init` for the interactive builder, or use `emulate init --service <name> --stdout` to generate starter YAML non-interactively.

### Config Structure

```yaml
tokens:
  my_token:
    login: admin
    scopes: [repo, user]

vercel:
  users:
    - username: developer
      name: Developer
      email: dev@example.com
  teams:
    - slug: my-team
      name: My Team
  projects:
    - name: my-app
      team: my-team
      framework: nextjs
  integrations:
    - client_id: oac_abc123
      client_secret: secret_abc123
      name: My Vercel App
      redirect_uris:
        - http://localhost:3000/api/auth/callback/vercel

github:
  users:
    - login: octocat
      name: The Octocat
      email: octocat@github.com
  orgs:
    - login: my-org
      name: My Organization
  repos:
    - owner: octocat
      name: hello-world
      language: JavaScript
      auto_init: true
  oauth_apps:
    - client_id: Iv1.abc123
      client_secret: secret_abc123
      name: My Web App
      redirect_uris:
        - http://localhost:3000/api/auth/callback/github

google:
  users:
    - email: testuser@example.com
      name: Test User
  oauth_clients:
    - client_id: my-client-id.apps.googleusercontent.com
      client_secret: GOCSPX-secret
      redirect_uris:
        - http://localhost:3000/api/auth/callback/google

slack:
  team:
    name: My Workspace
    domain: my-workspace
  users:
    - name: developer
      real_name: Developer
      email: dev@example.com
  channels:
    - name: general
      topic: General discussion
  bots:
    - name: my-bot
  oauth_apps:
    - client_id: "12345.67890"
      client_secret: example_client_secret
      name: My Slack App
      redirect_uris:
        - http://localhost:3000/api/auth/callback/slack

apple:
  users:
    - email: testuser@icloud.com
      name: Test User
  oauth_clients:
    - client_id: com.example.app
      team_id: TEAM001
      name: My Apple App
      redirect_uris:
        - http://localhost:3000/api/auth/callback/apple

microsoft:
  users:
    - email: testuser@outlook.com
      name: Test User
  oauth_clients:
    - client_id: example-client-id
      client_secret: example-client-secret
      name: My Microsoft App
      redirect_uris:
        - http://localhost:3000/api/auth/callback/microsoft-entra-id

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

aws:
  region: us-east-1
  s3:
    buckets:
      - name: my-app-bucket
  sqs:
    queues:
      - name: my-app-events
  iam:
    users:
      - user_name: developer
        create_access_key: true
    roles:
      - role_name: lambda-execution-role
```

### Auth

Tokens map to users. Pass them as `Authorization: Bearer <token>` or `Authorization: token <token>`. Generated starter configs include service-specific tokens such as `foundry_test_token`, while zero-config startup still creates a default `test_token_admin` for the `admin` user.

Each service also has a fallback user. If no token is provided, requests authenticate as the first seeded user.

Foundry current-user lookups require `api:admin-read`. The bundled `foundry_test_token` includes that scope, and zero-config Foundry startup gives `test_token_admin` the same scope.

## Pointing Your App at the Emulator

Set environment variables to override real service URLs:

```bash
VERCEL_EMULATOR_URL=http://localhost:4000
GITHUB_EMULATOR_URL=http://localhost:4001
GOOGLE_EMULATOR_URL=http://localhost:4002
SLACK_EMULATOR_URL=http://localhost:4003
APPLE_EMULATOR_URL=http://localhost:4004
MICROSOFT_EMULATOR_URL=http://localhost:4005
AWS_EMULATOR_URL=http://localhost:4006
```

When Foundry is started on its own, the usual URL is:

```bash
FOUNDRY_EMULATOR_URL=http://localhost:4000
```

Then use these in your app to construct API and OAuth URLs. See each service's skill for SDK-specific override instructions.

## Next.js Integration (Embedded Mode)

The `@emulators/adapter-next` package embeds emulators directly into a Next.js app on the same origin. See the **next** skill (`skills/next/SKILL.md`) for full setup, Auth.js configuration, persistence, and font tracing details.

## Persistence

By default, all emulator state is in-memory. For persistence across process restarts and serverless cold starts, use a `PersistenceAdapter`.

### Built-in file persistence

```typescript
import { filePersistence } from '@emulators/core'

// CLI or local dev: persists to a JSON file
const adapter = filePersistence('.emulate/state.json')
```

### Custom adapters

```typescript
import type { PersistenceAdapter } from '@emulators/core'

const kvAdapter: PersistenceAdapter = {
  async load() { return await kv.get('emulate-state') },
  async save(data) { await kv.set('emulate-state', data) },
}
```

State is loaded on cold start and saved after every mutating request (POST, PUT, PATCH, DELETE). Saves are serialized to prevent race conditions.

## Architecture

```
packages/
  emulate/           # CLI entry point + programmatic API
  @emulators/
    core/            # HTTP server (Hono), Store, plugin interface, middleware
    adapter-next/    # Next.js App Router integration
    vercel/          # Vercel API service plugin
    github/          # GitHub API service plugin
    google/          # Google OAuth 2.0 / OIDC plugin
    slack/           # Slack Web API, OAuth, incoming webhooks plugin
    apple/           # Sign in with Apple / OIDC plugin
    microsoft/       # Microsoft Entra ID OAuth 2.0 / OIDC plugin
    foundry/         # Foundry OAuth 2.0 + compute modules + current user plugin
    aws/             # AWS S3, SQS, IAM, STS plugin
```

The core provides a generic `Store` with typed `Collection<T>` instances supporting CRUD, indexing, filtering, and pagination. Each service plugin registers routes on the shared Hono app and uses the store for state.
