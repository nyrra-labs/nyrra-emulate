<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="mb-6 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
	Configuration
</h1>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Configuration is optional. All services start with sensible defaults. To customize seed data,
	create
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>emulate.config.yaml</code
	>
	in your project root (or pass
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>--seed</code
	>):
</p>

<CodeBlock html={data.codeBlocks.tokens} />

<h2
	class="mb-4 mt-12 text-lg font-semibold text-neutral-900 first:mt-0 dark:text-neutral-100"
>
	Vercel Seed Config
</h2>

<CodeBlock html={data.codeBlocks.vercelSeed} />

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Vercel Integrations
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Register Vercel OAuth integrations for strict client validation:
</p>

<CodeBlock html={data.codeBlocks.vercelIntegrations} />

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	GitHub Seed Config
</h2>

<CodeBlock html={data.codeBlocks.githubSeed} />

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	GitHub OAuth Apps
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Register OAuth applications so the emulator validates
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>client_id</code
	>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>client_secret</code
	>, and
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>redirect_uri</code
	> during the OAuth flow:
</p>

<CodeBlock html={data.codeBlocks.githubOauthApps} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	If no <code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>oauth_apps</code
	>
	are configured, the emulator accepts any
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>client_id</code
	> (backward-compatible). With apps configured, strict validation is enforced.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	GitHub Apps
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Full GitHub App support with JWT authentication and installation access tokens:
</p>

<CodeBlock html={data.codeBlocks.githubApps} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	<strong class="font-medium text-neutral-900 dark:text-neutral-100">Endpoints:</strong>
</p>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /app</code
		> - get authenticated app (JWT required)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /app/installations</code
		> - list app installations
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /app/installations/:id</code
		> - get installation
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /app/installations/:id/access_tokens</code
		> - create installation access token
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /repos/:owner/:repo/installation</code
		> - find repo installation
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /orgs/:org/installation</code
		> - find org installation
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /users/:username/installation</code
		> - find user installation
	</li>
</ul>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	JWT authentication: sign a JWT with
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>{`{ iss: "<app_id>" }`}</code
	>
	using the app's private key (RS256). The emulator verifies the signature and resolves the app.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Google Seed Config
</h2>

<CodeBlock html={data.codeBlocks.googleSeed} />

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Slack Seed Config
</h2>

<CodeBlock html={data.codeBlocks.slackSeed} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	When no OAuth apps are configured, the emulator accepts any
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>client_id</code
	>. With apps configured, strict validation is enforced.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Apple Seed Config
</h2>

<CodeBlock html={data.codeBlocks.appleSeed} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Users with
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>is_private_email: true</code
	>
	get a generated
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>@privaterelay.appleid.com</code
	>
	email in the
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>id_token</code
	>.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Microsoft Seed Config
</h2>

<CodeBlock html={data.codeBlocks.microsoftSeed} />

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Foundry Seed Config
</h2>

<CodeBlock html={data.codeBlocks.foundrySeed} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	When no <code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>oauth_clients</code
	>
	are configured, Foundry accepts any
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>client_id</code
	>. With clients configured, strict validation is enforced for
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>client_id</code
	>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>client_secret</code
	>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>redirect_uri</code
	>, grant type, and requested scopes.
</p>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	No compute-module state is seeded by default. Use
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>compute_modules</code
	> when you want contour routes to resolve a deployed app to a runtime session immediately on startup.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	AWS Seed Config
</h2>

<CodeBlock html={data.codeBlocks.awsSeed} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Default seed (always created): S3 bucket
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>emulate-default</code
	>, SQS queue
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>emulate-default-queue</code
	>, IAM user
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">admin</code>
	with access key pair.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Okta Seed Config
</h2>

<CodeBlock html={data.codeBlocks.oktaSeed} />

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	MongoDB Atlas Seed Config
</h2>

<CodeBlock html={data.codeBlocks.mongoatlasSeed} />

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Resend Seed Config
</h2>

<CodeBlock html={data.codeBlocks.resendSeed} />

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Stripe Seed Config
</h2>

<CodeBlock html={data.codeBlocks.stripeSeed} />
