# emulate

Local drop-in replacement services for CI and no-network sandboxes. Fully stateful, production-fidelity API emulation. Not mocks.

## Quick Start

```bash
npx emulate
```

The default startup set starts with sensible defaults. No config file needed:

- **Vercel** on `http://localhost:4000`
- **GitHub** on `http://localhost:4001`
- **Google** on `http://localhost:4002`
- **Slack** on `http://localhost:4003`
- **Apple** on `http://localhost:4004`
- **Microsoft** on `http://localhost:4005`
- **AWS** on `http://localhost:4006`

Foundry is available when you enable it explicitly with `emulate --service foundry` or include `foundry:` in the seed config. The current Foundry slice covers OAuth 2.0, current-user lookup, and compute-module runtime plus contour job routes.

## CLI

```bash
# Start the default startup set
emulate

# Start specific services
emulate --service vercel,github,foundry

# Custom port
emulate --port 3000

# Use a seed config file
emulate --seed config.yaml

# Generate a starter config
emulate init

# Generate config for a specific service
emulate init --service foundry

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

## Programmatic API

```bash
npm install emulate
```

Each call to `createEmulator` starts a single service:

```typescript
import { createEmulator } from 'emulate'

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

### Vitest / Jest setup

```typescript
// vitest.setup.ts
import { createEmulator, type Emulator } from 'emulate'

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

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `service` | *(required)* | Registered service name such as `'vercel'`, `'github'`, `'google'`, `'slack'`, `'apple'`, `'microsoft'`, `'aws'`, or `'foundry'` |
| `port` | `4000` | Port for the HTTP server |
| `seed` | none | Inline seed data (same shape as YAML config) |

### Instance methods

| Method | Description |
|--------|-------------|
| `url` | Base URL of the running server |
| `reset()` | Wipe the store and replay seed data |
| `close()` | Shut down the HTTP server, returns a Promise |

## Configuration

Configuration is optional. The CLI auto-detects config files in this order: `emulate.config.yaml` / `.yml`, `emulate.config.json`, `service-emulator.config.yaml` / `.yml`, `service-emulator.config.json`. Or pass `--seed <file>` explicitly. Run `emulate init` to generate a starter file.

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

google:
  users:
    - email: testuser@example.com
      name: Test User
  oauth_clients:
    - client_id: my-client-id.apps.googleusercontent.com
      client_secret: GOCSPX-secret
      redirect_uris:
        - http://localhost:3000/api/auth/callback/google
  labels:
    - id: Label_ops
      user_email: testuser@example.com
      name: Ops/Review
      color_background: "#DDEEFF"
      color_text: "#111111"
  messages:
    - id: msg_welcome
      user_email: testuser@example.com
      from: welcome@example.com
      to: testuser@example.com
      subject: Welcome to the Gmail emulator
      body_text: You can now test Gmail, Calendar, and Drive flows locally.
      label_ids: [INBOX, UNREAD, CATEGORY_UPDATES]
  calendars:
    - id: primary
      user_email: testuser@example.com
      summary: testuser@example.com
      primary: true
      selected: true
      time_zone: UTC
  calendar_events:
    - id: evt_kickoff
      user_email: testuser@example.com
      calendar_id: primary
      summary: Project Kickoff
      start_date_time: 2025-01-10T09:00:00.000Z
      end_date_time: 2025-01-10T09:30:00.000Z
  drive_items:
    - id: drv_docs
      user_email: testuser@example.com
      name: Docs
      mime_type: application/vnd.google-apps.folder
      parent_ids: [root]

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
    - name: random
      topic: Random stuff
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
      - name: my-app-uploads
  sqs:
    queues:
      - name: my-app-events
      - name: my-app-dlq
  iam:
    users:
      - user_name: developer
        create_access_key: true
    roles:
      - role_name: lambda-execution-role
        description: Role for Lambda function execution
```

## OAuth & Integrations

The emulator supports configurable OAuth apps and integrations with strict client validation.

### Vercel Integrations

```yaml
vercel:
  integrations:
    - client_id: "oac_abc123"
      client_secret: "secret_abc123"
      name: "My Vercel App"
      redirect_uris:
        - "http://localhost:3000/api/auth/callback/vercel"
```

### GitHub OAuth Apps

```yaml
github:
  oauth_apps:
    - client_id: "Iv1.abc123"
      client_secret: "secret_abc123"
      name: "My Web App"
      redirect_uris:
        - "http://localhost:3000/api/auth/callback/github"
```

If no `oauth_apps` are configured, the emulator accepts any `client_id` (backward-compatible). With apps configured, strict validation is enforced.

### GitHub Apps

Full GitHub App support with JWT authentication and installation access tokens:

```yaml
github:
  apps:
    - app_id: 12345
      slug: "my-github-app"
      name: "My GitHub App"
      private_key: |
        -----BEGIN RSA PRIVATE KEY-----
        ...your PEM key...
        -----END RSA PRIVATE KEY-----
      permissions:
        contents: read
        issues: write
      events: [push, pull_request]
      webhook_url: "http://localhost:3000/webhooks/github"
      webhook_secret: "my-secret"
      installations:
        - installation_id: 100
          account: my-org
          repository_selection: all
```

JWT authentication: sign a JWT with `{ iss: "<app_id>" }` using the app's private key (RS256). The emulator verifies the signature and resolves the app.

**App webhook delivery**: When events occur on repos where a GitHub App is installed, the emulator mirrors real GitHub behavior:
- All webhook payloads (including repo and org hooks) include an `installation` field with `{ id, node_id }`.
- If the app has a `webhook_url`, the emulator delivers the event there with the `installation` field and (if configured) an `X-Hub-Signature-256` header signed with `webhook_secret`.

### Slack OAuth Apps

```yaml
slack:
  oauth_apps:
    - client_id: "12345.67890"
      client_secret: "example_client_secret"
      name: "My Slack App"
      redirect_uris:
        - "http://localhost:3000/api/auth/callback/slack"
```

### Apple OAuth Clients

```yaml
apple:
  oauth_clients:
    - client_id: "com.example.app"
      team_id: "TEAM001"
      name: "My Apple App"
      redirect_uris:
        - "http://localhost:3000/api/auth/callback/apple"
```

### Microsoft OAuth Clients

```yaml
microsoft:
  oauth_clients:
    - client_id: "example-client-id"
      client_secret: "example-client-secret"
      name: "My Microsoft App"
      redirect_uris:
        - "http://localhost:3000/api/auth/callback/microsoft-entra-id"
```

### Foundry OAuth Clients

```yaml
foundry:
  oauth_clients:
    - client_id: "foundry-web"
      client_secret: "foundry-secret"
      name: "Foundry Web App"
      redirect_uris:
        - "http://localhost:3000/callback"
      allowed_scopes:
        - "api:admin-read"
        - "api:ontologies-read"
        - "offline_access"
```

When no `oauth_clients` are configured, Foundry accepts any `client_id`. With clients configured, strict validation is enforced for `client_id`, `client_secret`, `redirect_uri`, grant type, and requested scopes.

### Foundry Compute Modules

```yaml
foundry:
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

No compute-module state is seeded by default. Use either `compute_modules` in the seed config or `POST /_emulate/foundry/compute-modules/runtimes` to provision a runtime session for tests.

## Vercel API

Every endpoint below is fully stateful with Vercel-style JSON responses and cursor-based pagination.

### User & Teams
- `GET /v2/user` - authenticated user
- `PATCH /v2/user` - update user
- `GET /v2/teams` - list teams (cursor paginated)
- `GET /v2/teams/:teamId` - get team (by ID or slug)
- `POST /v2/teams` - create team
- `PATCH /v2/teams/:teamId` - update team
- `GET /v2/teams/:teamId/members` - list members
- `POST /v2/teams/:teamId/members` - add member

### Projects
- `POST /v11/projects` - create project (with optional env vars and git integration)
- `GET /v10/projects` - list projects (search, cursor pagination)
- `GET /v9/projects/:idOrName` - get project (includes env vars)
- `PATCH /v9/projects/:idOrName` - update project
- `DELETE /v9/projects/:idOrName` - delete project (cascades)
- `GET /v1/projects/:projectId/promote/aliases` - promote aliases status
- `PATCH /v1/projects/:idOrName/protection-bypass` - manage bypass secrets

### Deployments
- `POST /v13/deployments` - create deployment (auto-transitions to READY)
- `GET /v13/deployments/:idOrUrl` - get deployment (by ID or URL)
- `GET /v6/deployments` - list deployments (filter by project, target, state)
- `DELETE /v13/deployments/:id` - delete deployment (cascades)
- `PATCH /v12/deployments/:id/cancel` - cancel building deployment
- `GET /v2/deployments/:id/aliases` - list deployment aliases
- `GET /v3/deployments/:idOrUrl/events` - get build events/logs
- `GET /v6/deployments/:id/files` - list deployment files
- `POST /v2/files` - upload file (by SHA digest)

### Domains
- `POST /v10/projects/:idOrName/domains` - add domain (with verification challenge)
- `GET /v9/projects/:idOrName/domains` - list domains
- `GET /v9/projects/:idOrName/domains/:domain` - get domain
- `PATCH /v9/projects/:idOrName/domains/:domain` - update domain
- `DELETE /v9/projects/:idOrName/domains/:domain` - remove domain
- `POST /v9/projects/:idOrName/domains/:domain/verify` - verify domain

### Environment Variables
- `GET /v10/projects/:idOrName/env` - list env vars (with decrypt option)
- `POST /v10/projects/:idOrName/env` - create env vars (single, batch, upsert)
- `GET /v10/projects/:idOrName/env/:id` - get env var
- `PATCH /v9/projects/:idOrName/env/:id` - update env var
- `DELETE /v9/projects/:idOrName/env/:id` - delete env var

## GitHub API

Every endpoint below is fully stateful. Creates, updates, and deletes persist in memory and affect related entities.

### Users
- `GET /user` - authenticated user
- `PATCH /user` - update profile
- `GET /users/:username` - get user
- `GET /users` - list users
- `GET /users/:username/repos` - list user repos
- `GET /users/:username/orgs` - list user orgs
- `GET /users/:username/followers` - list followers
- `GET /users/:username/following` - list following

### Repositories
- `GET /repos/:owner/:repo` - get repo
- `POST /user/repos` - create user repo
- `POST /orgs/:org/repos` - create org repo
- `PATCH /repos/:owner/:repo` - update repo
- `DELETE /repos/:owner/:repo` - delete repo (cascades)
- `GET/PUT /repos/:owner/:repo/topics` - get/replace topics
- `GET /repos/:owner/:repo/languages` - languages
- `GET /repos/:owner/:repo/contributors` - contributors
- `GET /repos/:owner/:repo/forks` - list forks
- `POST /repos/:owner/:repo/forks` - create fork
- `GET/PUT/DELETE /repos/:owner/:repo/collaborators/:username` - collaborators
- `GET /repos/:owner/:repo/collaborators/:username/permission`
- `POST /repos/:owner/:repo/transfer` - transfer repo
- `GET /repos/:owner/:repo/tags` - list tags

### Issues
- `GET /repos/:owner/:repo/issues` - list (filter by state, labels, assignee, milestone, creator, since)
- `POST /repos/:owner/:repo/issues` - create
- `GET /repos/:owner/:repo/issues/:number` - get
- `PATCH /repos/:owner/:repo/issues/:number` - update (state transitions, events)
- `PUT/DELETE /repos/:owner/:repo/issues/:number/lock` - lock/unlock
- `GET /repos/:owner/:repo/issues/:number/timeline` - timeline events
- `GET /repos/:owner/:repo/issues/:number/events` - events
- `POST/DELETE /repos/:owner/:repo/issues/:number/assignees` - manage assignees

### Pull Requests
- `GET /repos/:owner/:repo/pulls` - list (filter by state, head, base)
- `POST /repos/:owner/:repo/pulls` - create
- `GET /repos/:owner/:repo/pulls/:number` - get
- `PATCH /repos/:owner/:repo/pulls/:number` - update
- `PUT /repos/:owner/:repo/pulls/:number/merge` - merge (with branch protection enforcement)
- `GET /repos/:owner/:repo/pulls/:number/commits` - list commits
- `GET /repos/:owner/:repo/pulls/:number/files` - list files
- `POST/DELETE /repos/:owner/:repo/pulls/:number/requested_reviewers` - manage reviewers
- `PUT /repos/:owner/:repo/pulls/:number/update-branch` - update branch

### Comments
- Issue comments: full CRUD on `/repos/:owner/:repo/issues/:number/comments`
- Review comments: full CRUD on `/repos/:owner/:repo/pulls/:number/comments`
- Commit comments: full CRUD on `/repos/:owner/:repo/commits/:sha/comments`
- Repo-wide listings for each type

### Reviews
- `GET /repos/:owner/:repo/pulls/:number/reviews` - list
- `POST /repos/:owner/:repo/pulls/:number/reviews` - create (with inline comments)
- `GET/PUT /repos/:owner/:repo/pulls/:number/reviews/:id` - get/update
- `POST /repos/:owner/:repo/pulls/:number/reviews/:id/events` - submit
- `PUT /repos/:owner/:repo/pulls/:number/reviews/:id/dismissals` - dismiss

### Labels & Milestones
- Labels: full CRUD, add/remove from issues, replace all
- Milestones: full CRUD, state transitions, issue counts

### Branches & Git Data
- Branches: list, get, protection CRUD (status checks, PR reviews, enforce admins)
- Refs: get, match, create, update, delete
- Commits: get, create
- Trees: get (with recursive), create (with inline content)
- Blobs: get, create
- Tags: get, create

### Organizations & Teams
- Orgs: get, update, list
- Org members: list, check, remove, get/set membership
- Teams: full CRUD, members, repos

### Releases
- Releases: full CRUD, latest, by tag
- Release assets: full CRUD, upload
- Generate release notes

### Webhooks
- Repo webhooks: full CRUD, ping, test, deliveries
- Org webhooks: full CRUD, ping
- Real HTTP delivery to registered URLs on all state changes

### Search
- `GET /search/repositories` - full query syntax (user, org, language, topic, stars, forks, etc.)
- `GET /search/issues` - issues + PRs (repo, is, author, label, milestone, state, etc.)
- `GET /search/users` - users + orgs
- `GET /search/code` - blob content search
- `GET /search/commits` - commit message search
- `GET /search/topics` - topic search
- `GET /search/labels` - label search

### Actions
- Workflows: list, get, enable/disable, dispatch
- Workflow runs: list, get, cancel, rerun, delete, logs
- Jobs: list, get, logs
- Artifacts: list, get, delete
- Secrets: repo + org CRUD

### Checks
- Check runs: create, update, get, annotations, rerequest, list by ref/suite
- Check suites: create, get, preferences, rerequest, list by ref
- Automatic suite status rollup from check run results

### Misc
- `GET /rate_limit` - rate limit status
- `GET /meta` - server metadata
- `GET /octocat` - ASCII art
- `GET /emojis` - emoji URLs
- `GET /zen` - random zen phrase
- `GET /versions` - API versions

## Google OAuth + Gmail, Calendar, and Drive APIs

OAuth 2.0, OpenID Connect, and mutable Google Workspace-style surfaces for local inbox, calendar, and drive flows.

- `GET /o/oauth2/v2/auth` - authorization endpoint
- `POST /oauth2/token` - token exchange
- `GET /oauth2/v2/userinfo` - get user info
- `GET /.well-known/openid-configuration` - OIDC discovery document
- `GET /oauth2/v3/certs` - JSON Web Key Set (JWKS)
- `GET /gmail/v1/users/:userId/messages` - list messages with `q`, `labelIds`, `maxResults`, and `pageToken`
- `GET /gmail/v1/users/:userId/messages/:id` - fetch a Gmail-style message payload in `full`, `metadata`, `minimal`, or `raw` formats
- `GET /gmail/v1/users/:userId/messages/:messageId/attachments/:id` - fetch attachment bodies
- `POST /gmail/v1/users/:userId/messages/send` - create sent mail from `raw` MIME or structured fields
- `POST /gmail/v1/users/:userId/messages/import` - import inbox mail
- `POST /gmail/v1/users/:userId/messages` - insert a message directly
- `POST /gmail/v1/users/:userId/messages/:id/modify` - add/remove labels on one message
- `POST /gmail/v1/users/:userId/messages/batchModify` - add/remove labels across many messages
- `POST /gmail/v1/users/:userId/messages/:id/trash` and `POST /gmail/v1/users/:userId/messages/:id/untrash`
- `GET /gmail/v1/users/:userId/drafts`, `POST /gmail/v1/users/:userId/drafts`, `GET /gmail/v1/users/:userId/drafts/:id`, `PUT /gmail/v1/users/:userId/drafts/:id`, `POST /gmail/v1/users/:userId/drafts/:id/send`, `DELETE /gmail/v1/users/:userId/drafts/:id`
- `POST /gmail/v1/users/:userId/threads/:id/modify` - add/remove labels across a thread
- `GET /gmail/v1/users/:userId/threads` and `GET /gmail/v1/users/:userId/threads/:id`
- `GET /gmail/v1/users/:userId/labels`, `POST /gmail/v1/users/:userId/labels`, `PATCH /gmail/v1/users/:userId/labels/:id`, `DELETE /gmail/v1/users/:userId/labels/:id`
- `GET /gmail/v1/users/:userId/history`, `POST /gmail/v1/users/:userId/watch`, `POST /gmail/v1/users/:userId/stop`
- `GET /gmail/v1/users/:userId/settings/filters`, `POST /gmail/v1/users/:userId/settings/filters`, `DELETE /gmail/v1/users/:userId/settings/filters/:id`
- `GET /gmail/v1/users/:userId/settings/forwardingAddresses`, `GET /gmail/v1/users/:userId/settings/sendAs`
- `GET /calendar/v3/users/:userId/calendarList`, `GET /calendar/v3/calendars/:calendarId/events`, `POST /calendar/v3/calendars/:calendarId/events`, `DELETE /calendar/v3/calendars/:calendarId/events/:eventId`, `POST /calendar/v3/freeBusy`
- `GET /drive/v3/files`, `GET /drive/v3/files/:fileId`, `POST /drive/v3/files`, `PATCH /drive/v3/files/:fileId`, `PUT /drive/v3/files/:fileId`, `POST /upload/drive/v3/files`

## Slack API

Fully stateful Slack Web API emulation with channels, messages, threads, reactions, OAuth v2, and incoming webhooks.

### Auth & Chat
- `POST /api/auth.test` - test authentication
- `POST /api/chat.postMessage` - post message (supports threads via `thread_ts`)
- `POST /api/chat.update` - update message
- `POST /api/chat.delete` - delete message
- `POST /api/chat.meMessage` - /me message

### Conversations
- `POST /api/conversations.list` - list channels (cursor pagination)
- `POST /api/conversations.info` - get channel info
- `POST /api/conversations.create` - create channel
- `POST /api/conversations.history` - channel history
- `POST /api/conversations.replies` - thread replies
- `POST /api/conversations.join` / `conversations.leave` - join/leave
- `POST /api/conversations.members` - list members

### Users & Reactions
- `POST /api/users.list` - list users (cursor pagination)
- `POST /api/users.info` - get user info
- `POST /api/users.lookupByEmail` - lookup by email
- `POST /api/reactions.add` / `reactions.remove` / `reactions.get` - manage reactions

### Team, Bots & Webhooks
- `POST /api/team.info` - workspace info
- `POST /api/bots.info` - bot info
- `POST /services/:teamId/:botId/:webhookId` - incoming webhook

### OAuth
- `GET /oauth/v2/authorize` - authorization (shows user picker)
- `POST /api/oauth.v2.access` - token exchange

## Apple Sign In

Sign in with Apple emulation with authorization code flow, PKCE support, RS256 ID tokens, and OIDC discovery.

- `GET /.well-known/openid-configuration` - OIDC discovery document
- `GET /auth/keys` - JSON Web Key Set (JWKS)
- `GET /auth/authorize` - authorization endpoint (shows user picker)
- `POST /auth/token` - token exchange (authorization code and refresh token grants)
- `POST /auth/revoke` - token revocation

## Microsoft Entra ID

Microsoft Entra ID (Azure AD) v2.0 OAuth 2.0 and OpenID Connect emulation with authorization code flow, PKCE, client credentials, RS256 ID tokens, and OIDC discovery.

- `GET /.well-known/openid-configuration` - OIDC discovery document
- `GET /:tenant/v2.0/.well-known/openid-configuration` - tenant-scoped OIDC discovery
- `GET /discovery/v2.0/keys` - JSON Web Key Set (JWKS)
- `GET /oauth2/v2.0/authorize` - authorization endpoint (shows user picker)
- `POST /oauth2/v2.0/token` - token exchange (authorization code, refresh token, client credentials)
- `GET /oidc/userinfo` - OpenID Connect user info
- `GET /v1.0/me` - Microsoft Graph user profile
- `GET /oauth2/v2.0/logout` - end session / logout
- `POST /oauth2/v2.0/revoke` - token revocation

## Foundry

Palantir Foundry emulation with OAuth 2.0, current-user lookup, and compute-module runtime plus contour job routes.

### OAuth and current user

- `GET /multipass/api/oauth2/authorize` - authorization endpoint (shows user picker)
- `POST /multipass/api/oauth2/token` - token exchange (authorization code, refresh token, client credentials)
- `GET /api/v2/admin/users/getCurrent` - current user lookup

### Compute modules

- `POST /_emulate/foundry/compute-modules/runtimes` - create or reset a runtime session and return runtime URLs plus `Module-Auth-Token`
- `GET /_emulate/foundry/compute-modules/runtimes/:runtimeId/job` - runtime poll route that returns `computeModuleJobV1` or `204`
- `POST /_emulate/foundry/compute-modules/runtimes/:runtimeId/schemas` - runtime schema upload
- `POST /_emulate/foundry/compute-modules/runtimes/:runtimeId/results/:jobId` - runtime result upload with exact raw body preservation
- `POST /contour-backend-multiplexer/api/module-group-multiplexer/compute-modules/jobs/execute` - sync contour execute route
- `POST /contour-backend-multiplexer/api/module-group-multiplexer/deployed-apps/jobs` - async contour submit route
- `GET /contour-backend-multiplexer/api/module-group-multiplexer/jobs/:jobId/status` - async contour status route
- `PUT /contour-backend-multiplexer/api/module-group-multiplexer/jobs/result/v2` - async contour raw result fetch

Behavior notes:

- The token endpoint accepts `application/x-www-form-urlencoded`
- `offline_access` returns refresh tokens and refresh rotates them
- `client_credentials` creates a service principal whose username matches `client_id`
- `getCurrent` requires the `api:admin-read` scope
- Runtime routes require the exact `Module-Auth-Token` header returned by the control route
- Contour routes require bearer auth and return raw `application/octet-stream` bodies for both single JSON and streaming outputs

## AWS

S3, SQS, IAM, and STS emulation with REST-style S3 paths and query-style SQS/IAM/STS endpoints. All responses use AWS-compatible XML.

### S3
- `GET /s3/` - list all buckets
- `PUT /s3/:bucket` - create bucket
- `DELETE /s3/:bucket` - delete bucket
- `HEAD /s3/:bucket` - check existence
- `GET /s3/:bucket` - list objects (prefix, delimiter, max-keys)
- `PUT /s3/:bucket/:key` - put object (supports copy via `x-amz-copy-source`)
- `GET /s3/:bucket/:key` - get object
- `HEAD /s3/:bucket/:key` - head object
- `DELETE /s3/:bucket/:key` - delete object

### SQS
All operations via `POST /sqs/` with `Action` parameter:
- `CreateQueue`, `ListQueues`, `GetQueueUrl`, `GetQueueAttributes`
- `SendMessage`, `ReceiveMessage`, `DeleteMessage`
- `PurgeQueue`, `DeleteQueue`

### IAM
All operations via `POST /iam/` with `Action` parameter:
- `CreateUser`, `GetUser`, `ListUsers`, `DeleteUser`
- `CreateAccessKey`, `ListAccessKeys`, `DeleteAccessKey`
- `CreateRole`, `GetRole`, `ListRoles`, `DeleteRole`

### STS
All operations via `POST /sts/` with `Action` parameter:
- `GetCallerIdentity`, `AssumeRole`

## Next.js Integration

Embed emulators directly in your Next.js app so they run on the same origin. This solves the Vercel preview deployment problem where OAuth callback URLs change with every deployment.

### Install

```bash
npm install @emulators/adapter-next @emulators/github @emulators/google
```

Only install the emulators you need. Each `@emulators/*` package is published independently.

### Route handler

Create a catch-all route that serves emulator traffic:

```typescript
// app/emulate/[...path]/route.ts
import { createEmulateHandler } from '@emulators/adapter-next'
import * as github from '@emulators/github'
import * as google from '@emulators/google'

export const { GET, POST, PUT, PATCH, DELETE } = createEmulateHandler({
  services: {
    github: {
      emulator: github,
      seed: {
        users: [{ login: 'octocat', name: 'The Octocat' }],
        repos: [{ owner: 'octocat', name: 'hello-world', auto_init: true }],
      },
    },
    google: {
      emulator: google,
      seed: {
        users: [{ email: 'test@example.com', name: 'Test User' }],
      },
    },
  },
})
```

### Auth.js / NextAuth configuration

Point your provider at the emulator paths on the same origin:

```typescript
import GitHub from 'next-auth/providers/github'

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

GitHub({
  clientId: 'any-value',
  clientSecret: 'any-value',
  authorization: { url: `${baseUrl}/emulate/github/login/oauth/authorize` },
  token: { url: `${baseUrl}/emulate/github/login/oauth/access_token` },
  userinfo: { url: `${baseUrl}/emulate/github/user` },
})
```

No `oauth_apps` need to be seeded. When none are configured, the emulator skips `client_id`, `client_secret`, and `redirect_uri` validation.

### Font files in serverless

Emulator UI pages use bundled fonts. Wrap your Next.js config to include them in the serverless trace:

```typescript
// next.config.mjs
import { withEmulate } from '@emulators/adapter-next'

export default withEmulate({
  // your normal Next.js config
})
```

If you mount the catch-all at a custom path, pass the matching prefix:

```typescript
export default withEmulate(nextConfig, { routePrefix: '/api/emulate' })
```

### Persistence

By default, emulator state is in-memory and resets on every cold start. To persist state across restarts, pass a `persistence` adapter:

```typescript
import { createEmulateHandler } from '@emulators/adapter-next'
import * as github from '@emulators/github'

const kvAdapter = {
  async load() { return await kv.get('emulate-state') },
  async save(data: string) { await kv.set('emulate-state', data) },
}

export const { GET, POST, PUT, PATCH, DELETE } = createEmulateHandler({
  services: { github: { emulator: github } },
  persistence: kvAdapter,
})
```

For local development, `@emulators/core` ships `filePersistence`:

```typescript
import { filePersistence } from '@emulators/core'

// ...
persistence: filePersistence('.emulate/state.json'),
```

The persistence adapter is called on cold start (load) and after every mutating request (save). Saves are serialized via an internal queue to prevent race conditions.

## Architecture

```
packages/
  emulate/          # CLI entry point (commander)
  @emulators/
    core/           # HTTP server, in-memory store, plugin interface, middleware
    adapter-next/   # Next.js App Router integration
    vercel/         # Vercel API service
    github/         # GitHub API service
    google/         # Google OAuth 2.0 / OIDC + Gmail, Calendar, Drive
    slack/          # Slack Web API, OAuth v2, incoming webhooks
    apple/          # Apple Sign In / OIDC
    microsoft/      # Microsoft Entra ID OAuth 2.0 / OIDC + Graph /me
    clerk/          # Clerk users + organizations + OAuth applications
    foundry/        # Foundry OAuth 2.0 + compute modules + current user
    aws/            # AWS S3, SQS, IAM, STS
    okta/           # Okta identity provider / OIDC
    mongoatlas/     # MongoDB Atlas Admin API + Data API
    resend/         # Resend email API
    stripe/         # Stripe billing and payments API
apps/
  web-svelte/       # Deployable docs site (SvelteKit + Cloudflare adapter)
  web/              # Upstream Next.js docs / content source (not deployed)
```

The core provides a generic `Store` with typed `Collection<T>` instances supporting CRUD, indexing, filtering, and pagination. Each service plugin registers its routes on the shared Hono app and uses the store for state.

## Docs Site

The deployable docs app in this repo is `apps/web-svelte`. Build it with:

```bash
pnpm --filter web-svelte build
```

The build emits a Cloudflare adapter output under `apps/web-svelte/.svelte-kit/cloudflare/`, containing the prerendered HTML for every docs route, the worker entry, and the static assets.

`apps/web` is still in the repo as the upstream Next.js docs source. It is not the deployed docs app, but its MDX files under `apps/web/app/**/page.mdx` remain the single source of truth for docs page content. The Svelte app pulls them at build time through the shared registry at `apps/web-svelte/src/lib/docs-source.ts`, which uses Vite's eager `?raw` glob to inline every upstream MDX file as a build-time string.

To update docs content, edit the relevant `apps/web/app/<slug>/page.mdx` file, then re-verify the Svelte build:

```bash
pnpm --filter web-svelte type-check
pnpm --filter web-svelte build
pnpm --filter web-svelte lint
```

If the Svelte build fails on an upstream MDX change, or a page renders an upstream construct incorrectly, the fix usually lives in one of two shared files rather than in the route components:

- `apps/web-svelte/src/lib/mdx-to-markdown.ts` strips MDX-only artifacts (`export`/`import` lines, JSX-only `<div className="...">` blocks) before the raw string reaches the markdown parser. Add new strip rules here when upstream MDX introduces MDX-only syntax that marked would otherwise choke on.
- `apps/web-svelte/src/lib/render-docs.server.ts` is the shared marked + Shiki renderer. Add a new renderer method or extend `mapLang` here when upstream MDX uses a markdown construct or fence language the renderer does not yet cover. Every migrated route consumes this renderer through `renderDocsHtmlByHref(href)`, so a single renderer extension reaches every page at once.

Hand-duplicating upstream MDX content into a Svelte route component is the wrong answer: the renderer should learn the construct instead.

The visible shell branding and per-page metadata also live in a small set of shared files rather than in each route:

- `apps/web-svelte/src/lib/components/Header.svelte` owns the header brand cluster (the F mark, the `FoundryCI` wordmark, the `by Nyrra` link, plus the search / GitHub / npm / theme-toggle nav). Edit the wordmark, mark, or brand-link copy here.
- `apps/web-svelte/src/routes/+layout.svelte` owns the footer attribution row (`Built on emulate by Vercel Labs` and `A Nyrra project`). Edit footer copy or attribution links here.
- `apps/web-svelte/src/lib/page-metadata.ts` is the single source for `<title>`, meta description, and Open Graph / Twitter metadata. The `ROOT_*` constants drive the homepage card; the `FOUNDRYCI_PAGE_METADATA` map opts FoundryCI-critical pages out of the generic `${displayTitle} | emulate` template.
- `apps/web-svelte/static/og-default.svg` is the source-of-truth social card (embedded Geist + GeistPixelSquare TTFs); `apps/web-svelte/static/og-default.png` is the rasterized output the build serves. The SVG is the canonical, human-reviewable form.

Per-route components are intentionally thin and should not carry brand strings of their own.

Deploy wiring status: the build emits to `apps/web-svelte/.svelte-kit/cloudflare/` and the repo now ships a minimal `apps/web-svelte/wrangler.toml` plus a `pnpm --filter web-svelte deploy:dry-run` script (backed by a repo-local `wrangler` devDependency pinned in `apps/web-svelte/package.json` so the dry run is reproducible without a global wrangler install). The dry run rebuilds the worker and validates that the generated artifact can be packaged for Cloudflare Workers, with the `nodejs_compat` compatibility flag enabled so the SvelteKit server bundle's `node:async_hooks` import does not fail at runtime. A separate `pnpm --filter web-svelte preview:worker` script boots the same artifact under `wrangler dev --local` on `http://127.0.0.1:8788` for live local request testing without a real Cloudflare account. If an interrupted preview run leaves port 8788 occupied or hung wrangler dev / shell wrapper / workerd processes attached to it, `pnpm --filter web-svelte preview:worker:stop` sends SIGTERM (escalating to SIGKILL after 5 seconds) to the listener on tcp:8788, every process whose command line carries the preview signature `--port 8788 --show-interactive-dev-session=false`, the descendant tree of those processes (which catches the inner workerd runtime children wrangler dev forks on ephemeral ports), and any workerd whose binary path lives in this workspace's pnpm store under `node_modules/.pnpm/@cloudflare+workerd-*` (which catches earlier-phase workerds that became orphaned before wrangler dev took over). It does not touch unrelated wrangler sessions on other ports or workerd processes installed in other repos. To keep fresh installs deterministic for this build / preview / dry-run path, the root `package.json` declares `pnpm.onlyBuiltDependencies = ["esbuild", "workerd"]` (the bundler wrangler and vite invoke plus the runtime `wrangler dev --local` spawns) and `pnpm.ignoredBuiltDependencies` for every unrelated workspace build-script dep (`@mongodb-js/zstd`, `msw`, `node-liblzma`, `sharp`, `unrs-resolver`) so a fresh `pnpm install --frozen-lockfile` exits zero without prompting for build approval. GitHub Actions at `.github/workflows/ci.yml` now runs `pnpm --filter web-svelte deploy:dry-run` as its final job step on every push to `main` and every pull request, so a regression in the Cloudflare packaging path (vite build, the SvelteKit Cloudflare adapter, the wrangler bundle) surfaces as a red CI run before merge. There is still no CI workflow that pushes to a real Cloudflare account, and no custom domain, route, or `account_id` is encoded in the wrangler.toml. If a real deploy wrapper or CI workflow lands, or if the production docs domain changes from the value currently encoded in `apps/web-svelte/src/lib/page-metadata.ts`, this README section, `apps/web-svelte/wrangler.toml`, and `apps/web-svelte/src/lib/page-metadata.ts` must be updated together so the documented build path, the deployed hostname, and the metadata `BASE_URL` stay in lockstep.

Upstream docs sync: the upstream `apps/web/app/**/page.mdx` content lives in the `upstream` remote (`git@github.com:vercel-labs/emulate.git`), and the canonical branch is `upstream/main`. To pull upstream docs changes into the current branch, run `git fetch upstream` and then bring the relevant `apps/web` docs changes from `upstream/main` into the current branch (merge, cherry-pick, or hand-apply, whichever fits the change). After the merge, rerun `pnpm --filter web-svelte type-check`, `pnpm --filter web-svelte build`, and `pnpm --filter web-svelte lint` to verify the Svelte site still renders.

If upstream drift breaks the Svelte site, the fix usually belongs in one of these shared files:

- `apps/web-svelte/src/lib/docs-source.ts` when the upstream slug set or directory layout changes.
- `apps/web-svelte/src/lib/mdx-to-markdown.ts` when upstream introduces new MDX-only artifacts that need stripping.
- `apps/web-svelte/src/lib/render-docs.server.ts` when upstream uses a markdown construct or fence language the renderer does not yet cover.
- The route and title metadata files (`apps/web-svelte/src/lib/page-titles.ts`, `apps/web-svelte/src/lib/nav.ts`) only when the upstream slug set changes and a new route needs to be implemented; the Phase 7 nav contract in `nav.ts` will fail the build at module init if any of these surfaces drift apart.

Adding a new upstream-backed route: every non-root upstream-backed page is served by a single generic dynamic route at `apps/web-svelte/src/routes/[slug]/+page.svelte` plus its `+page.server.ts` loader, so adding a new page no longer requires a new route directory. The implemented docs slug set is also a single source of truth: `apps/web-svelte/src/lib/page-titles.ts` is the authoritative `PAGE_TITLES` map, and `apps/web-svelte/src/lib/docs-source.ts` derives `docsSources` from it via the slug→href convention. There is no second title map to keep in lockstep. When upstream lands a new `apps/web/app/<slug>/page.mdx` that the Svelte app does not yet surface, the minimum set of edits is:

- `apps/web-svelte/src/lib/page-titles.ts`: add a `PAGE_TITLES` entry. This is the single source of truth for the implemented docs slug set; `docs-source.ts` derives `docsSources` from `PAGE_TITLES`, so the new entry automatically reaches the generic `[slug]` route's `EntryGenerator`, the search index, and the per-page metadata resolver. The `docs-source.ts` registry fails at module init if the new slug has no matching upstream MDX file at `apps/web/app/<slug>/page.mdx`.
- `apps/web-svelte/src/lib/nav.ts`: add the new href to the appropriate section, or add the bare slug to `INTENTIONALLY_HIDDEN` in the same file if the route should be reachable via direct URL but not visible in the sidebar / mobile-nav.

No new files under `apps/web-svelte/src/routes/` are needed for an upstream-backed page; the generic `[slug]` route picks up the new entry automatically. Then rerun `pnpm --filter web-svelte type-check`, `pnpm --filter web-svelte build`, and `pnpm --filter web-svelte lint`. The Phase 7 nav contract and the docs-source registry validation both fire at module init if any of these surfaces are missing.

Search indexing: there is no separate search page list to maintain. Once a new upstream-backed slug is wired through the shared docs-source registry and route flow above, both the in-app search index and the search-result name catalog are derived automatically:

- `apps/web-svelte/src/lib/search-index.ts` derives the search index from the bundled `docsSources` content. The upstream MDX raw strings are inlined at build time via the `?raw` glob in `docs-source.ts`, but `getSearchIndex()` itself runs lazily on first call (typically from `/api/search`), pipes each MDX raw through `mdxToCleanMarkdown` plus a small markdown-stripping pass, and caches the result in-module so subsequent calls reuse it.
- `apps/web-svelte/src/lib/docs-search-pages.ts` is a thin adapter over the same `docsSources` registry; it exists so any future consumer that wants the lightweight `{ name, href }` projection still has it.
- `apps/web-svelte/src/routes/api/search/+server.ts` serves results via `getSearchIndex()`, scoring title matches above content matches and returning short snippets around the first matched term.

If upstream MDX changes cause bad search snippets or missing search hits, the fix usually belongs in `apps/web-svelte/src/lib/mdx-to-markdown.ts` (when MDX-only artifacts leak into the search content and need stripping), `apps/web-svelte/src/lib/search-index.ts` (when the search-specific markdown-stripping pass that normalizes each entry's content needs adjusting), or `apps/web-svelte/src/routes/api/search/+server.ts` (when the ranking weights or snippet shape need adjusting), not in any per-route component.

## Auth

Tokens are configured in the seed config and map to users. Pass them as `Authorization: Bearer <token>` or `Authorization: token <token>`.

**Vercel**: All endpoints accept `teamId` or `slug` query params for team scoping. Pagination uses cursor-based `limit`/`since`/`until` with `pagination` response objects.

**GitHub**: Public repo endpoints work without auth. Private repos and write operations require a valid token. Pagination uses `page`/`per_page` with `Link` headers.

**Google**: Standard OAuth 2.0 authorization code flow. Configure clients in the seed config.

**Slack**: All Web API endpoints require `Authorization: Bearer <token>`. OAuth v2 flow with user picker UI.

**Apple**: OIDC authorization code flow with RS256 ID tokens. On first auth per user/client pair, a `user` JSON blob is included.

**Microsoft**: OIDC authorization code flow with PKCE support. Also supports client credentials grants. Microsoft Graph `/v1.0/me` available.

**Foundry**: OAuth 2.0 authorization code, refresh token, and client credentials flows, plus compute-module runtime and contour job routes. `GET /api/v2/admin/users/getCurrent` requires `api:admin-read`.

**AWS**: Bearer tokens or IAM access key credentials. Default key pair always seeded: `AKIAIOSFODNN7EXAMPLE` / `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`.
