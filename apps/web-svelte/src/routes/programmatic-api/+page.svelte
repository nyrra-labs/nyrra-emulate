<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="mb-6 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
	Programmatic API
</h1>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Use emulators as libraries in your tests and scripts. There are two approaches: the
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">emulate</code>
	CLI package (which wraps all services) and the individual
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>@emulators/*</code
	> scoped packages.
</p>

<h2
	class="mb-4 mt-12 text-lg font-semibold text-neutral-900 first:mt-0 dark:text-neutral-100"
>
	CLI package
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	The <code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>emulate</code
	>
	package provides a
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>createEmulator</code
	> helper that starts any service by name.
</p>

<CodeBlock html={data.codeBlocks.installEmulate} />

<CodeBlock html={data.codeBlocks.createEmulatorExample} />

<h3 class="mb-3 mt-8 text-base font-semibold text-neutral-900 dark:text-neutral-100">
	Vitest / Jest setup
</h3>

<CodeBlock html={data.codeBlocks.vitestSetup} />

<h3 class="mb-3 mt-8 text-base font-semibold text-neutral-900 dark:text-neutral-100">
	createEmulator options
</h3>

<table>
	<thead>
		<tr>
			<th>Option</th>
			<th>Default</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>service</code></td>
			<td><em>(required)</em></td>
			<td>
				Service name: <code>'vercel'</code>, <code>'github'</code>, <code>'google'</code>,
				<code>'slack'</code>, <code>'apple'</code>, <code>'microsoft'</code>,
				<code>'aws'</code>, <code>'okta'</code>, <code>'mongoatlas'</code>,
				<code>'resend'</code>, or <code>'stripe'</code>
			</td>
		</tr>
		<tr>
			<td><code>port</code></td>
			<td><code>4000</code></td>
			<td>Port for the HTTP server</td>
		</tr>
		<tr>
			<td><code>seed</code></td>
			<td>none</td>
			<td>Inline seed data (same shape as YAML config)</td>
		</tr>
	</tbody>
</table>

<h3 class="mb-3 mt-8 text-base font-semibold text-neutral-900 dark:text-neutral-100">
	Instance methods
</h3>

<table>
	<thead>
		<tr>
			<th>Method</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>url</code></td>
			<td>Base URL of the running server</td>
		</tr>
		<tr>
			<td><code>reset()</code></td>
			<td>Wipe the store and replay seed data</td>
		</tr>
		<tr>
			<td><code>close()</code></td>
			<td>Shut down the HTTP server, returns a Promise</td>
		</tr>
	</tbody>
</table>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Scoped packages
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Each emulator is published as its own
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>@emulators/*</code
	> package. Install only the ones you need:
</p>

<CodeBlock html={data.codeBlocks.installScopedPackages} />

<h3 class="mb-3 mt-8 text-base font-semibold text-neutral-900 dark:text-neutral-100">
	Available packages
</h3>

<table>
	<thead>
		<tr>
			<th>Package</th>
			<th>Service</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>@emulators/vercel</code></td>
			<td>Vercel API</td>
		</tr>
		<tr>
			<td><code>@emulators/github</code></td>
			<td>GitHub API</td>
		</tr>
		<tr>
			<td><code>@emulators/google</code></td>
			<td>Google OAuth, Gmail, Calendar, Drive</td>
		</tr>
		<tr>
			<td><code>@emulators/slack</code></td>
			<td>Slack Web API, OAuth v2, webhooks</td>
		</tr>
		<tr>
			<td><code>@emulators/apple</code></td>
			<td>Apple Sign In / OIDC</td>
		</tr>
		<tr>
			<td><code>@emulators/microsoft</code></td>
			<td>Microsoft Entra ID, Graph API</td>
		</tr>
		<tr>
			<td><code>@emulators/aws</code></td>
			<td>AWS S3, SQS, IAM, STS</td>
		</tr>
		<tr>
			<td><code>@emulators/okta</code></td>
			<td>Okta identity provider / OIDC</td>
		</tr>
		<tr>
			<td><code>@emulators/mongoatlas</code></td>
			<td>MongoDB Atlas Admin API + Data API</td>
		</tr>
		<tr>
			<td><code>@emulators/resend</code></td>
			<td>Resend email API</td>
		</tr>
		<tr>
			<td><code>@emulators/stripe</code></td>
			<td>Stripe billing and payments API</td>
		</tr>
		<tr>
			<td><code>@emulators/core</code></td>
			<td>Shared store, middleware, and utilities</td>
		</tr>
		<tr>
			<td><code>@emulators/adapter-next</code></td>
			<td>Next.js App Router integration</td>
		</tr>
	</tbody>
</table>

<h3 class="mb-3 mt-8 text-base font-semibold text-neutral-900 dark:text-neutral-100">
	Direct usage
</h3>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Each scoped package exports its Hono app and seed function, so you can compose emulators
	however you like:
</p>

<CodeBlock html={data.codeBlocks.directUsageExample} />

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	These are the same modules used internally by the CLI and the <a
		class="text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-700 dark:hover:decoration-neutral-100"
		href="/nextjs">Next.js adapter</a
	>. See the Next.js Integration page for a full example of using scoped packages with
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>createEmulateHandler</code
	>.
</p>
