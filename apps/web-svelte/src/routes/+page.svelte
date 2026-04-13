<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
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
		href="https://github.com/vercel-labs/emulate"
		target="_blank"
		rel="noopener noreferrer">emulate by Vercel Labs</a
	>, so the same process can also stand in for Vercel, GitHub, Google, Slack, Apple, Microsoft,
	AWS, Okta, MongoDB Atlas, Resend, and Stripe inside your test runs.
</p>

<h2
	class="mb-4 mt-12 text-lg font-semibold text-neutral-900 first:mt-0 dark:text-neutral-100"
>
	Start with Foundry
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Two docs pages cover everything you need to run Foundry locally:
</p>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
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
		>emulate --service foundry</code
	>
	or include
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>foundry:</code
	> in the seed config.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Quick Start
</h2>

<CodeBlock html={data.codeBlocks.quickStart} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>npx emulate</code
	>
	boots the supporting emulator stack with sensible defaults. No config file is needed for the supporting
	services:
</p>

<!--
	The default startup service list is derived from the runtime
	`DEFAULT_SERVICE_NAMES` constant in `packages/emulate/src/registry.ts`
	via `$lib/default-services.server.ts`, so a future change to the
	default startup set in the CLI flows into this list automatically
	without a parallel local edit. Each entry's port is `4000 + index`,
	matching the CLI's `basePort + i` allocation in
	`packages/emulate/src/commands/start.ts`.
-->
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

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">CLI</h2>

<CodeBlock html={data.codeBlocks.cli} />

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Options
</h2>

<table>
	<thead>
		<tr>
			<th>Flag</th>
			<th>Default</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>-p, --port</code></td>
			<td><code>4000</code></td>
			<td>Base port (auto-increments per service)</td>
		</tr>
		<tr>
			<td><code>-s, --service</code></td>
			<td>default startup set</td>
			<td>Comma-separated services to enable</td>
		</tr>
		<tr>
			<td><code>--seed</code></td>
			<td>auto-detect</td>
			<td>Path to seed config (YAML or JSON)</td>
		</tr>
	</tbody>
</table>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	The port can also be set via <code
		class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>EMULATE_PORT</code
	>
	or
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">PORT</code>
	environment variables.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Programmatic API
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	You can also use emulate as a library in your tests. See the <a
		class="text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-700 dark:hover:decoration-neutral-100"
		href="/programmatic-api">Programmatic API</a
	> page for
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>createEmulator</code
	>, Vitest/Jest setup, and instance methods.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Next.js Integration
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Embed emulators directly in your Next.js app so they run on the same origin. See the <a
		class="text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-700 dark:hover:decoration-neutral-100"
		href="/nextjs">Next.js Integration</a
	> page for setup instructions.
</p>
