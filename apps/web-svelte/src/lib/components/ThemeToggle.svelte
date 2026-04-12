<script lang="ts">
	import { onMount } from 'svelte';
	import { themeState } from '$lib/theme.svelte';

	// Mirrors apps/web/components/theme-toggle.tsx, which uses
	// useSyncExternalStore to render an empty `w-8 h-8` placeholder until the
	// component has mounted on the client. The placeholder prevents a brief
	// sun/moon icon flip when the SSR-default theme does not match the user's
	// actual preference (read from localStorage / matchMedia by the inline
	// script in app.html before hydration).
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});
</script>

{#if !mounted}
	<div class="h-8 w-8" aria-hidden="true"></div>
{:else}
	<button
		type="button"
		onclick={() => themeState.toggle()}
		class="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
		aria-label="Toggle theme"
	>
		{#if themeState.current === 'dark'}
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="12" cy="12" r="4" />
				<path d="M12 2v2" />
				<path d="M12 20v2" />
				<path d="m4.93 4.93 1.41 1.41" />
				<path d="m17.66 17.66 1.41 1.41" />
				<path d="M2 12h2" />
				<path d="M20 12h2" />
				<path d="m6.34 17.66-1.41 1.41" />
				<path d="m19.07 4.93-1.41 1.41" />
			</svg>
		{:else}
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
			</svg>
		{/if}
	</button>
{/if}
