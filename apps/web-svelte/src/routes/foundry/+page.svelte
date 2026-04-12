<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="mb-6 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
	Foundry
</h1>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Palantir Foundry emulation with OAuth 2.0, current-user lookup, and compute-module runtime plus
	contour job routes.
</p>

<h2
	class="mb-4 mt-12 text-lg font-semibold text-neutral-900 first:mt-0 dark:text-neutral-100"
>
	OAuth and Current User Endpoints
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /multipass/api/oauth2/authorize</code
		> - authorization endpoint (shows user picker)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /multipass/api/oauth2/authorize/callback</code
		> - internal user-picker form callback
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /multipass/api/oauth2/token</code
		> - token exchange (authorization code, refresh token, client credentials)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /api/v2/admin/users/getCurrent</code
		> - current user lookup
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Authorization Code Flow
</h2>

<ol class="mb-4 list-decimal space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		Redirect the user to
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
		>, and optional PKCE parameters
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		The emulator renders a seeded user picker
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		On selection, the emulator redirects to
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>redirect_uri</code
		>
		with
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>code</code
		>
		and
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>state</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Exchange the code at
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /multipass/api/oauth2/token</code
		>
	</li>
</ol>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	PKCE and Refresh Tokens
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	PKCE supports
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">S256</code>.
	Include
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>code_challenge</code
	>
	and
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>code_challenge_method</code
	> on authorize, then send
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>code_verifier</code
	> to the token endpoint.
</p>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>offline_access</code
	> returns a refresh token. Refresh token exchange rotates the refresh token.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Client Credentials
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>grant_type=client_credentials</code
	> returns an access token only. The emulator creates or reuses a service principal whose username
	matches
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>client_id</code
	>.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Current User
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>GET /api/v2/admin/users/getCurrent</code
	> requires a bearer token with the
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>api:admin-read</code
	> scope.
</p>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Auth code and refresh flows return a seeded human principal. Client credentials returns the
	service principal.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Compute Module Endpoints
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /_emulate/foundry/compute-modules/runtimes</code
		> - create or reset a runtime session and return runtime URLs plus
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>Module-Auth-Token</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /_emulate/foundry/compute-modules/runtimes/:runtimeId/job</code
		> - runtime poll route that returns
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>computeModuleJobV1</code
		>
		or
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>204 No Content</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /_emulate/foundry/compute-modules/runtimes/:runtimeId/schemas</code
		> - runtime schema upload
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /_emulate/foundry/compute-modules/runtimes/:runtimeId/results/:jobId</code
		> - runtime result upload
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /contour-backend-multiplexer/api/module-group-multiplexer/compute-modules/jobs/execute</code
		> - sync contour execute route
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /contour-backend-multiplexer/api/module-group-multiplexer/deployed-apps/jobs</code
		> - async contour submit route
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /contour-backend-multiplexer/api/module-group-multiplexer/jobs/:jobId/status</code
		> - async contour status route
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>PUT /contour-backend-multiplexer/api/module-group-multiplexer/jobs/result/v2</code
		> - async contour raw result fetch
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Compute Module Flow
</h2>

<ol class="mb-4 list-decimal space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		Create a runtime session with
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /_emulate/foundry/compute-modules/runtimes</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Boot a real compute-module container with the returned URLs and
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>Module-Auth-Token</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Submit sync or async contour jobs with bearer auth
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Read raw
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>application/octet-stream</code
		> results without delimiter rewriting
	</li>
</ol>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Compute Module Seed Config
</h2>

<CodeBlock html={data.codeBlocks.computeModulesSeed} />
