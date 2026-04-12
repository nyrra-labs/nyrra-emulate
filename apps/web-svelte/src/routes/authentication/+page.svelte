<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="mb-6 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
	Authentication
</h1>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Tokens are configured in the seed config and map to users. Pass them as
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>Authorization: Bearer &lt;token&gt;</code
	>
	or
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>Authorization: token &lt;token&gt;</code
	>.
</p>

<h2
	class="mb-4 mt-12 text-lg font-semibold text-neutral-900 first:mt-0 dark:text-neutral-100"
>
	Vercel
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	All endpoints accept
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>teamId</code
	>
	or
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">slug</code>
	query params for team scoping. Pagination uses cursor-based
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>limit</code
	>/<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>since</code
	>/<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>until</code
	>
	with
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>pagination</code
	> response objects.
</p>

<CodeBlock html={data.codeBlocks.vercelCurl} />

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">GitHub</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Public repo endpoints work without auth. Private repos and write operations require a valid
	token. Pagination uses
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">page</code
	>/<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>per_page</code
	>
	with
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">Link</code>
	headers.
</p>

<CodeBlock html={data.codeBlocks.githubTokensYaml} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Use the token in requests:
</p>

<CodeBlock html={data.codeBlocks.githubCurl} />

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	GitHub Apps (JWT)
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	For GitHub App authentication, sign a JWT with
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>{`{ iss: "<app_id>" }`}</code
	> using the app's private key (RS256). The emulator verifies the signature and resolves the app.
</p>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Then create an installation access token:
</p>

<CodeBlock html={data.codeBlocks.githubAppsCurl} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	The returned token can be used for API calls scoped to that installation's permissions.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Google OAuth
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	The Google emulator uses the standard OAuth 2.0 authorization code flow. Configure clients in
	the seed config and use them with your OAuth library of choice. The OIDC discovery document is
	available at
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>/.well-known/openid-configuration</code
	>.
</p>

<CodeBlock html={data.codeBlocks.googleCurl} />

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Slack OAuth
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	The Slack emulator supports OAuth v2 with a user picker UI. Configure OAuth apps in the seed
	config for strict client validation. Point your Slack SDK at the emulator URL:
</p>

<CodeBlock html={data.codeBlocks.slackTypescript} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	All Web API endpoints require
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>Authorization: Bearer &lt;token&gt;</code
	>.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Apple Sign In
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	The Apple emulator provides OIDC discovery, JWKS, and a full authorization code flow with
	RS256 ID tokens. Point your app at the emulator's endpoints:
</p>

<CodeBlock html={data.codeBlocks.appleCurl} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	On first authorization per user/client pair, a
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">user</code>
	JSON blob is included in the callback (matching real Apple behavior).
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Microsoft Entra ID
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	The Microsoft emulator supports OIDC discovery, authorization code flow, PKCE, and client
	credentials grants. It also provides a Microsoft Graph
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>/v1.0/me</code
	> endpoint.
</p>

<CodeBlock html={data.codeBlocks.microsoftCurl} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Supports
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>Authorization: Basic</code
	>
	header with base64-encoded
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>client_id:client_secret</code
	> as an alternative to body parameters.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Foundry OAuth
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	The Foundry emulator supports authorization code, PKCE with
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">S256</code
	>, refresh token rotation, and client credentials. The token endpoint expects
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>application/x-www-form-urlencoded</code
	>.
</p>

<CodeBlock html={data.codeBlocks.foundryCurl} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	For browser flows, redirect users to
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>/multipass/api/oauth2/authorize</code
	>
	with
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>client_id</code
	>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>redirect_uri</code
	>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>response_type=code</code
	>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>scope</code
	>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>state</code
	>, and optional PKCE parameters.
</p>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>GET /api/v2/admin/users/getCurrent</code
	>
	requires
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>Authorization: Bearer &lt;token&gt;</code
	>
	and the
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>api:admin-read</code
	> scope.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">AWS</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Pass tokens as
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>Authorization: Bearer &lt;token&gt;</code
	>. Scoped permissions use
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>s3:*</code
	>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>sqs:*</code
	>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>iam:*</code
	>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>sts:*</code
	> patterns.
</p>

<CodeBlock html={data.codeBlocks.awsCurl} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	For the AWS SDK, use IAM access key credentials. A default key pair is always seeded:
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>AKIAIOSFODNN7EXAMPLE</code
	>
	/
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY</code
	>.
</p>
