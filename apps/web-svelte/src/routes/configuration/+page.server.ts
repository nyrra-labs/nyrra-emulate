import type { PageServerLoad } from './$types';
import { highlightAll } from '$lib/code-highlight.server';

export const prerender = true;

const codes = {
	tokens: {
		lang: 'yaml' as const,
		code: `tokens:
  gho_test_token_admin:
    login: admin
    scopes:
      - repo
      - user
      - admin:org
      - admin:repo_hook
  gho_test_token_user1:
    login: octocat
    scopes:
      - repo
      - user`
	},
	vercelSeed: {
		lang: 'yaml' as const,
		code: `vercel:
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
      envVars:
        - key: DATABASE_URL
          value: postgres://localhost
          target: [production, preview]`
	},
	vercelIntegrations: {
		lang: 'yaml' as const,
		code: `vercel:
  integrations:
    - client_id: "oac_abc123"
      client_secret: "secret_abc123"
      name: "My Vercel App"
      redirect_uris:
        - "http://localhost:3000/api/auth/callback/vercel"`
	},
	githubSeed: {
		lang: 'yaml' as const,
		code: `github:
  users:
    - login: octocat
      name: The Octocat
      email: octocat@github.com
      bio: I am the Octocat
      company: GitHub
      location: San Francisco

  orgs:
    - login: my-org
      name: My Organization
      description: A test organization

  repos:
    - owner: octocat
      name: hello-world
      description: My first repository
      language: JavaScript
      topics: [hello, world]
      auto_init: true
    - owner: my-org
      name: org-repo
      description: An organization repository
      language: TypeScript
      auto_init: true`
	},
	githubOauthApps: {
		lang: 'yaml' as const,
		code: `github:
  oauth_apps:
    - client_id: "Iv1.abc123"
      client_secret: "secret_abc123"
      name: "My Web App"
      redirect_uris:
        - "http://localhost:3000/api/auth/callback/github"`
	},
	githubApps: {
		lang: 'yaml' as const,
		code: `github:
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
      installations:
        - installation_id: 100
          account: my-org
          repository_selection: all
          permissions:
            contents: read`
	},
	googleSeed: {
		lang: 'yaml' as const,
		code: `google:
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
  messages:
    - id: msg_welcome
      user_email: testuser@example.com
      from: welcome@example.com
      to: testuser@example.com
      subject: Welcome to the Gmail emulator
      body_text: You can now test Gmail, Calendar, and Drive flows locally.
      label_ids: [INBOX, UNREAD]
  calendars:
    - id: primary
      user_email: testuser@example.com
      summary: testuser@example.com
      primary: true
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
      parent_ids: [root]`
	},
	slackSeed: {
		lang: 'yaml' as const,
		code: `slack:
  team:
    name: My Workspace
    domain: my-workspace
  users:
    - name: developer
      real_name: Developer
      email: dev@example.com
      is_admin: true
  channels:
    - name: general
      topic: General discussion
    - name: engineering
      topic: Engineering discussions
      is_private: true
  bots:
    - name: my-bot
  oauth_apps:
    - client_id: "12345.67890"
      client_secret: example_client_secret
      name: My Slack App
      redirect_uris:
        - http://localhost:3000/api/auth/callback/slack
  incoming_webhooks:
    - channel: general
      label: CI Notifications
  signing_secret: my_signing_secret`
	},
	appleSeed: {
		lang: 'yaml' as const,
		code: `apple:
  users:
    - email: testuser@icloud.com
      name: Test User
      given_name: Test
      family_name: User
    - email: private@example.com
      name: Private User
      is_private_email: true
  oauth_clients:
    - client_id: com.example.app
      team_id: TEAM001
      name: My Apple App
      redirect_uris:
        - http://localhost:3000/api/auth/callback/apple`
	},
	microsoftSeed: {
		lang: 'yaml' as const,
		code: `microsoft:
  users:
    - email: testuser@outlook.com
      name: Test User
      given_name: Test
      family_name: User
      tenant_id: 9188040d-6c67-4c5b-b112-36a304b66dad
  oauth_clients:
    - client_id: example-client-id
      client_secret: example-client-secret
      name: My Microsoft App
      redirect_uris:
        - http://localhost:3000/api/auth/callback/microsoft-entra-id
      tenant_id: 9188040d-6c67-4c5b-b112-36a304b66dad`
	},
	foundrySeed: {
		lang: 'yaml' as const,
		code: `foundry:
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
        module_auth_token: local-module-auth-token`
	},
	awsSeed: {
		lang: 'yaml' as const,
		code: `aws:
  region: us-east-1
  s3:
    buckets:
      - name: my-app-bucket
      - name: my-app-uploads
        region: eu-west-1
  sqs:
    queues:
      - name: my-app-events
      - name: my-app-dlq
        visibility_timeout: 60
      - name: my-app-orders.fifo
        fifo: true
  iam:
    users:
      - user_name: developer
        create_access_key: true
    roles:
      - role_name: lambda-execution-role
        description: Role for Lambda function execution`
	},
	oktaSeed: {
		lang: 'yaml' as const,
		code: `okta:
  users:
    - login: testuser@example.com
      email: testuser@example.com
      firstName: Test
      lastName: User
  groups:
    - name: Everyone
      description: All users
  apps:
    - name: My App
      label: My App
  authorization_servers:
    - name: default
      audiences: ["api://default"]`
	},
	mongoatlasSeed: {
		lang: 'yaml' as const,
		code: `mongoatlas:
  projects:
    - name: my-project
  clusters:
    - project: my-project
      name: my-cluster
  database_users:
    - project: my-project
      username: app-user`
	},
	resendSeed: {
		lang: 'yaml' as const,
		code: `resend:
  domains:
    - name: example.com
  api_keys:
    - name: default`
	},
	stripeSeed: {
		lang: 'yaml' as const,
		code: `stripe:
  customers:
    - name: Test Customer
      email: test@example.com
  products:
    - name: Pro Plan
  prices:
    - product: Pro Plan
      unit_amount: 2000
      currency: usd
      recurring:
        interval: month`
	}
};

export const load: PageServerLoad = async () => {
	const codeBlocks = await highlightAll(codes);
	return { codeBlocks };
};
