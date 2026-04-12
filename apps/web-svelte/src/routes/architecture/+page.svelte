<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="mb-6 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
	Architecture
</h1>

<CodeBlock html={data.codeBlocks.directoryTree} />

<h2
	class="mb-4 mt-12 text-lg font-semibold text-neutral-900 first:mt-0 dark:text-neutral-100"
>
	Core
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	The core package provides a generic
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>Store</code
	>
	with typed
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>Collection&lt;T&gt;</code
	> instances supporting CRUD, indexing, filtering, and pagination. Each service plugin registers its
	routes on the shared Hono app and uses the store for state.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Plugin System
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Each service is a plugin that:
</p>

<ol class="mb-4 list-decimal space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		Defines its entity types and store collections
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Registers HTTP routes on the shared Hono app
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Provides a seed function to populate initial state from config
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Uses shared middleware for auth, error handling, and pagination
	</li>
</ol>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Multiple services can run simultaneously, each on its own port (auto-incremented from the base
	port).
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	In-Memory State
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	All state is held in memory with no database. This makes the emulator fast, easy to reset, and
	ideal for CI pipelines. State is populated from the seed config on startup and can be modified
	via API calls during a test run.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Middleware
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	The core provides shared middleware:
</p>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Auth</strong>: validates
		Bearer/token authorization headers against configured tokens
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Error handling</strong>:
		consistent error responses matching each service's format
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Pagination</strong>:
		GitHub-style
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>page</code
		>/<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>per_page</code
		>
		with
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">Link</code
		> headers, Vercel-style cursor-based pagination
	</li>
</ul>
