<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import MobileNav from '$lib/components/MobileNav.svelte';
	import PageMeta from '$lib/components/PageMeta.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import '../app.css';

	let { children }: { children: Snippet } = $props();
</script>

<PageMeta pathname={page.url.pathname} />

<div class="flex min-h-screen flex-col">
	<Header />
	<MobileNav />
	<div class="mx-auto w-full max-w-5xl flex-1 px-6 py-8 lg:py-12">
		<div class="flex gap-12">
			<Sidebar />
			<main class="min-w-0 flex-1">
				<article class="max-w-none">
					{@render children()}
				</article>
			</main>
		</div>
	</div>
	<footer class="border-t border-neutral-200 dark:border-neutral-800">
		<div
			class="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between dark:text-neutral-500"
		>
			<div>
				Built on
				<a
					href="https://github.com/vercel-labs/emulate"
					target="_blank"
					rel="noopener noreferrer"
					class="text-neutral-700 underline decoration-neutral-300 underline-offset-2 transition-colors hover:text-neutral-900 hover:decoration-neutral-900 dark:text-neutral-300 dark:decoration-neutral-700 dark:hover:text-neutral-100 dark:hover:decoration-neutral-100"
					>emulate by Vercel Labs</a
				>.
			</div>
			<div>
				A
				<a
					href="https://nyrra.ai"
					target="_blank"
					rel="noopener noreferrer"
					class="text-neutral-700 underline decoration-neutral-300 underline-offset-2 transition-colors hover:text-neutral-900 hover:decoration-neutral-900 dark:text-neutral-300 dark:decoration-neutral-700 dark:hover:text-neutral-100 dark:hover:decoration-neutral-100"
					>Nyrra</a
				> project.
			</div>
		</div>
	</footer>
</div>
