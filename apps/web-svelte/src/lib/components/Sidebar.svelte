<script lang="ts">
	import { page } from '$app/state';
	import { sections, type NavItem } from '$lib/nav';

	function isActive(href: string): boolean {
		return page.url.pathname === href;
	}

	function isInSubtree(item: NavItem): boolean {
		if (isActive(item.href)) return true;
		if (item.children) {
			for (const child of item.children) {
				if (isActive(child.href)) return true;
				if (child.children) {
					for (const gc of child.children) {
						if (isActive(gc.href)) return true;
					}
				}
			}
		}
		return false;
	}
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
					{#each section.items as item (item.href)}
						{@const active = isActive(item.href)}
						<a
							href={item.href}
							class="block rounded-md px-3 py-1.5 text-sm transition-colors {active
								? 'bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
								: 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'}"
						>
							{item.label}
						</a>
						{#if item.children && isInSubtree(item)}
							<div class="ml-3 space-y-0.5 border-l border-neutral-200 pl-3 dark:border-neutral-800">
								{#each item.children as child (child.href)}
									{#if child.children}
										<div class="pt-2 pb-1">
											<span class="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-600">
												{child.label}
											</span>
										</div>
										{#each child.children as gc (gc.href)}
											{@const gcActive = isActive(gc.href)}
											<a
												href={gc.href}
												class="block rounded-md px-2 py-1 text-xs transition-colors {gcActive
													? 'bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
													: 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'}"
											>
												{gc.label}
											</a>
										{/each}
									{:else}
										{@const childActive = isActive(child.href)}
										<a
											href={child.href}
											class="block rounded-md px-2 py-1 text-xs transition-colors {childActive
												? 'bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
												: 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'}"
										>
											{child.label}
										</a>
									{/if}
								{/each}
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</nav>
</aside>
