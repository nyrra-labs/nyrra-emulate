<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="mb-6 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
	Next.js Integration
</h1>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	The <code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>@emulators/adapter-next</code
	> package embeds emulators directly into a Next.js app, running them on the same origin. This is
	particularly useful for Vercel preview deployments where OAuth callback URLs change with every
	deployment.
</p>

<h2
	class="mb-4 mt-12 text-lg font-semibold text-neutral-900 first:mt-0 dark:text-neutral-100"
>
	Install
</h2>

<CodeBlock html={data.codeBlocks.install} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Only install the emulators you need. Each
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>@emulators/*</code
	> package is published independently, keeping your serverless bundles small.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Route Handler
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Create a catch-all route that serves emulator traffic:
</p>

<CodeBlock html={data.codeBlocks.routeHandler} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	This creates the following routes:
</p>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>/emulate/github/**</code
		> serves the GitHub emulator
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>/emulate/google/**</code
		> serves the Google emulator
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Auth.js / NextAuth Configuration
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Point your provider at the emulator paths on the same origin:
</p>

<CodeBlock html={data.codeBlocks.authjs} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	No <code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>oauth_apps</code
	>
	need to be seeded. When none are configured, the emulator skips
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>client_id</code
	>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>client_secret</code
	>, and
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>redirect_uri</code
	> validation.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Font Tracing for Serverless
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Emulator UI pages use bundled fonts. Wrap your Next.js config to include them in the serverless
	trace:
</p>

<CodeBlock html={data.codeBlocks.withEmulateBasic} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	If you mount the catch-all at a custom path, pass the matching prefix:
</p>

<CodeBlock html={data.codeBlocks.withEmulateRoutePrefix} />

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Persistence
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	By default, emulator state is in-memory and resets on every cold start. To persist state across
	restarts, pass a
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>persistence</code
	> adapter.
</p>

<h3 class="mb-3 mt-8 text-base font-semibold text-neutral-900 dark:text-neutral-100">
	Custom Adapter (Vercel KV, Redis, etc.)
</h3>

<CodeBlock html={data.codeBlocks.kvAdapter} />

<h3 class="mb-3 mt-8 text-base font-semibold text-neutral-900 dark:text-neutral-100">
	File Persistence (Local Dev)
</h3>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	For local development,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>@emulators/core</code
	> ships a file-based adapter:
</p>

<CodeBlock html={data.codeBlocks.filePersistence} />

<h3 class="mb-3 mt-8 text-base font-semibold text-neutral-900 dark:text-neutral-100">
	How It Works
</h3>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Cold start</strong>: The
		adapter loads state from the persistence adapter. If found, it restores the full Store and
		token map (skipping seed). If not found, it seeds from config and saves the initial state.
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100"
			>After mutating requests</strong
		> (POST, PUT, PATCH, DELETE): State is saved. Saves are serialized via an internal queue to prevent
		race conditions.
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100"
			>No persistence configured</strong
		>: Falls back to pure in-memory (current behavior). Seed data re-initializes on every cold
		start.
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	How It Works
</h2>

<ol class="mb-4 list-decimal space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Incoming request</strong>:
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>/emulate/github/login/oauth/authorize?client_id=...</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Parse</strong>: service =
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>github</code
		>, rest =
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>/login/oauth/authorize</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Strip prefix</strong>: A
		new
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>Request</code
		> is created with the stripped path and forwarded to the GitHub Hono app
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Rewrite response</strong>:
		HTML
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>action</code
		>
		and
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">href</code>
		attributes, CSS
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>url()</code
		>
		font references, and
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>Location</code
		> headers get the service prefix prepended
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Persist</strong>: After
		mutating requests, state is saved via the persistence adapter
	</li>
</ol>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Limitations
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		Requires the Node.js runtime (not Edge) since emulators use
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>crypto.randomBytes</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Concurrent serverless instances writing to the same persistence adapter use last-write-wins
		semantics (acceptable for dev/preview traffic)
	</li>
</ul>
