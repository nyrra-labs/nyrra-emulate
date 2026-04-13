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
	>, so the same process can also stand in for {data.supportedServicesProse} inside your test runs.
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

<!--
	The Quick Start intro paragraph below and the post-list Foundry-
	availability paragraph further down are derived from upstream
	`apps/web/app/page.mdx` via `$lib/root-quick-start-prose.server.ts`,
	so future upstream edits to either fragment flow into this page
	automatically. The runtime-derived default-startup list still sits
	between them, so the Quick Start section reads: upstream intro
	prose -> runtime list -> upstream post-list prose -> CLI heading.
-->
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html data.rootQuickStartIntroHtml}

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

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html data.rootQuickStartPostListHtml}

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">CLI</h2>

<CodeBlock html={data.codeBlocks.cli} />

<!--
	The Options / Programmatic API / Next.js Integration sections
	below are derived from upstream `apps/web/app/page.mdx` via the
	shared `renderDocsHtml` pipeline (see
	`$lib/root-lower-half.server.ts`), so any future upstream edit to
	those sections flows into this page automatically. The
	Foundry-first hero, the Start with Foundry section, the derived
	default startup list, and the Quick Start / CLI code blocks above
	remain hand-authored or upstream-code-block-sourced separately.
-->
<div class="docs-content">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html data.rootLowerHalfHtml}
</div>
