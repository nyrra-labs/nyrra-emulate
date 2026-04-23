<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import { GITHUB_REPO_URL } from '$lib/upstream-site-metadata';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="mb-6 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
	Local Foundry Emulation
</h1>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	FoundryCI is a Nyrra project that runs Palantir Foundry locally for CI and no-network
	sandboxes. It emulates the OAuth 2.0, current-user, and compute-module routes Foundry clients
	depend on, with production-fidelity state instead of mocks. FoundryCI is built on
	<a
		class="text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-700 dark:hover:decoration-neutral-100"
		href={GITHUB_REPO_URL}
		target="_blank"
		rel="noopener noreferrer">emulate by Vercel Labs</a
	>, so the same process can also stand in for {data.supportedServicesProse} inside your test runs.
</p>

<h2
	class="mb-4 mt-12 text-lg font-semibold text-neutral-900 first:mt-0 dark:text-neutral-100"
>
	Start with Foundry
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	FoundryCI should get you to local Foundry first, not make you hunt through generic emulate docs.
	These are the pages to start with:
</p>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<a
			class="text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-700 dark:hover:decoration-neutral-100"
			href="/foundry/getting-started">Getting Started</a
		>
		shows the fastest path to a local Foundry process, seed config, and a first verification request.
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<a
			class="text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-700 dark:hover:decoration-neutral-100"
			href="/foundry">Foundry</a
		>
		covers the OAuth 2.0 endpoints, current-user lookup, compute-module runtime, and contour job routes.
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<a
			class="text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-700 dark:hover:decoration-neutral-100"
			href="/configuration">Configuration</a
		>
		shows the seed config for users, OAuth clients, deployed apps, and compute-module runtimes.
	</li>
</ul>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Bring up the Foundry emulator with
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>npx @nyrra/emulate --service foundry</code
	>
	or include
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>foundry:</code
	> in the seed config. When Foundry runs by itself, its base URL is
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>http://localhost:4000</code
	>.
</p>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	If you start multiple services in one process, ports are assigned in the order you pass to
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>--service</code
	>, starting from the base port. So Foundry is guaranteed to stay on
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>4000</code
	> only when it is the only service, or the first service in the list.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Foundry Quick Start</h2>

<CodeBlock html={data.codeBlocks.quickStart} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Set
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>FOUNDRY_EMULATOR_URL=http://localhost:4000</code
	>
	when Foundry is running on its own. If you launch more than one service, use the startup banner
	to see which port Foundry received.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Default Startup Set
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	The generic multi-service emulate stack is still available. It starts with sensible defaults and
	keeps Foundry out of the default list unless you opt in:
</p>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	{#each data.defaultStartupServices as service (service.name)}
		<li class="text-neutral-600 dark:text-neutral-400">
			<strong class="font-medium text-neutral-900 dark:text-neutral-100">{service.label}</strong>
			on
			<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
				>http://localhost:{service.port}</code
			>
		</li>
	{/each}
</ul>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Foundry is available when you enable it explicitly with
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>npx @nyrra/emulate --service foundry</code
	>
	or include
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>foundry:</code
	>
	in the seed config. The current Foundry slice covers OAuth 2.0, current-user lookup, and
	compute-module runtime plus contour routes.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">CLI</h2>

<CodeBlock html={data.codeBlocks.cli} />

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Options</h2>

<div class="my-4 overflow-x-auto">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-neutral-200 dark:border-neutral-800">
				<th class="pb-2 pr-4 text-left font-medium text-neutral-900 dark:text-neutral-100">Flag</th>
				<th class="pb-2 pr-4 text-left font-medium text-neutral-900 dark:text-neutral-100">Default</th>
				<th class="pb-2 text-left font-medium text-neutral-900 dark:text-neutral-100">Description</th>
			</tr>
		</thead>
		<tbody class="text-neutral-600 dark:text-neutral-400">
			<tr class="border-b border-neutral-100 dark:border-neutral-800/50">
				<td class="py-2 pr-4"><code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">-p, --port</code></td>
				<td class="py-2 pr-4"><code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">4000</code></td>
				<td class="py-2">Base port (auto-increments per service)</td>
			</tr>
			<tr class="border-b border-neutral-100 dark:border-neutral-800/50">
				<td class="py-2 pr-4"><code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">-s, --service</code></td>
				<td class="py-2 pr-4">default startup set</td>
				<td class="py-2">Comma-separated services to enable</td>
			</tr>
			<tr>
				<td class="py-2 pr-4"><code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">--seed</code></td>
				<td class="py-2 pr-4">auto-detect</td>
				<td class="py-2">Path to seed config (YAML or JSON)</td>
			</tr>
		</tbody>
	</table>
</div>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	The port can also be set via
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">EMULATE_PORT</code>
	or
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">PORT</code>
	environment variables.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Programmatic API</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	You can also use emulate as a library in your tests. See the
	<a
		class="text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-700 dark:hover:decoration-neutral-100"
		href="/programmatic-api">Programmatic API</a
	> page for
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">createEmulator</code>,
	Vitest/Jest setup, and instance methods.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Next.js Integration</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Embed emulators directly in your Next.js app so they run on the same origin. See the
	<a
		class="text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-700 dark:hover:decoration-neutral-100"
		href="/nextjs">Next.js Integration</a
	> page for setup instructions.
</p>
