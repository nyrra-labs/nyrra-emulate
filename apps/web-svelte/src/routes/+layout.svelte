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

<Header />
<MobileNav />
<div class="mx-auto max-w-5xl px-6 py-8 lg:py-12">
	<div class="flex gap-12">
		<Sidebar />
		<main class="min-w-0 flex-1">
			<article class="max-w-none">
				{@render children()}
			</article>
		</main>
	</div>
</div>
