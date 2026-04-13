<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="mb-6 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
	Getting Started
</h1>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Local drop-in replacement for Vercel, GitHub, Google, Slack, Apple, Microsoft, AWS, Okta,
	MongoDB Atlas, Resend, Stripe, Clerk, and Foundry APIs. Built for CI and no-network sandboxes.
	Fully stateful, production-fidelity API emulation. Not mocks.
</p>

<h2
	class="mb-4 mt-12 text-lg font-semibold text-neutral-900 first:mt-0 dark:text-neutral-100"
>
	Quick Start
</h2>

<CodeBlock html={data.codeBlocks.quickStart} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	The default startup set starts with sensible defaults. No config file needed:
</p>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Vercel</strong> on
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>http://localhost:4000</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">GitHub</strong> on
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>http://localhost:4001</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Google</strong> on
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>http://localhost:4002</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Slack</strong> on
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>http://localhost:4003</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Apple</strong> on
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>http://localhost:4004</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Microsoft</strong> on
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>http://localhost:4005</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">AWS</strong> on
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>http://localhost:4006</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Okta</strong> on
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>http://localhost:4007</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">MongoDB Atlas</strong>
		on
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>http://localhost:4008</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Resend</strong> on
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>http://localhost:4009</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<strong class="font-medium text-neutral-900 dark:text-neutral-100">Stripe</strong> on
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>http://localhost:4010</code
		>
	</li>
</ul>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Palantir <a
		class="text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-700 dark:hover:decoration-neutral-100"
		href="/foundry">Foundry</a
	> is a first-class emulator covering OAuth 2.0, current-user lookup, and compute-module runtime plus
	contour job routes. Start it with
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>emulate --service foundry</code
	>
	or include
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>foundry:</code
	> in the seed config.
</p>

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
