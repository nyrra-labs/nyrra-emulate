<script lang="ts">
	import { page } from '$app/state';
	import { sections } from '$lib/nav';
</script>

<aside class="hidden w-56 shrink-0 lg:block">
	<nav class="sticky top-20 space-y-6">
		{#each sections as section, i (i)}
			<div>
				{#if section.title}
					<div
						class="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-600"
					>
						{section.title}
					</div>
				{/if}
				<div class="space-y-1">
					{#each section.items as { href, label } (href)}
						{@const active = page.url.pathname === href}
						<a
							{href}
							class="block rounded-md px-3 py-1.5 text-sm transition-colors {active
								? 'bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
								: 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'}"
						>
							{label}
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</nav>
</aside>
