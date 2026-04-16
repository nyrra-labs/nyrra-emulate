<script lang="ts">
	import { page } from '$app/state';
	import { allFlatItems, sections } from '$lib/nav';

	let open = $state(false);

	const currentPage = $derived(
		allFlatItems.find((item) => item.href === page.url.pathname) ?? allFlatItems[0]
	);

	function close() {
		open = false;
	}

	function onOverlayKey(event: KeyboardEvent) {
		if (event.key === 'Escape') close();
	}

	function isActive(href: string): boolean {
		return page.url.pathname === href;
	}

	$effect(() => {
		if (!open) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		function onKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') close();
		}
		window.addEventListener('keydown', onKeydown);

		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener('keydown', onKeydown);
		};
	});
</script>

<div
	class="sticky top-14 z-40 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-sm lg:hidden dark:border-neutral-800 dark:bg-neutral-950/80"
>
	<button
		type="button"
		aria-label="Open table of contents"
		aria-expanded={open}
		aria-controls="mobile-nav-drawer"
		onclick={() => (open = true)}
		class="flex w-full items-center justify-between px-6 py-3 focus:outline-none"
	>
		<span class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
			{currentPage.label}
		</span>
		<span class="flex h-8 w-8 items-center justify-center">
			<svg
				class="h-4 w-4 text-neutral-500 dark:text-neutral-400"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<line x1="8" y1="6" x2="21" y2="6" />
				<line x1="8" y1="12" x2="21" y2="12" />
				<line x1="8" y1="18" x2="21" y2="18" />
				<line x1="3" y1="6" x2="3.01" y2="6" />
				<line x1="3" y1="12" x2="3.01" y2="12" />
				<line x1="3" y1="18" x2="3.01" y2="18" />
			</svg>
		</span>
	</button>
</div>

{#if open}
	<div class="fixed inset-0 z-50 lg:hidden" role="presentation">
		<div
			class="absolute inset-0 bg-black/50"
			onclick={close}
			onkeydown={onOverlayKey}
			aria-hidden="true"
			role="presentation"
		></div>
		<div
			id="mobile-nav-drawer"
			role="dialog"
			aria-modal="true"
			aria-label="Table of contents"
			class="absolute inset-y-0 left-0 flex h-full w-3/4 max-w-sm flex-col gap-4 overflow-y-auto border-r border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
		>
			<div class="flex items-center justify-between">
				<div class="font-semibold text-neutral-900 dark:text-neutral-100">Table of Contents</div>
				<button
					type="button"
					aria-label="Close table of contents"
					onclick={close}
					class="rounded-sm text-neutral-500 opacity-70 transition-opacity hover:opacity-100 dark:text-neutral-400"
				>
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
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>
			<nav class="space-y-6">
				{#each sections as section, i (i)}
					<div>
						{#if section.title}
							<div
								class="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-600"
							>
								{section.title}
							</div>
						{/if}
						<ul class="space-y-1">
							{#each section.items as item (item.href)}
								{@const active = isActive(item.href)}
								<li>
									<a
										href={item.href}
										onclick={close}
										class="block py-2 text-sm transition-colors {active
											? 'font-medium text-neutral-900 dark:text-neutral-100'
											: 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'}"
									>
										{item.label}
									</a>
									{#if item.children}
										<ul class="ml-3 space-y-0.5 border-l border-neutral-200 pl-3 dark:border-neutral-800">
											{#each item.children as child (child.href)}
												{#if child.children}
													<li class="pt-2 pb-1">
														<span class="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-600">
															{child.label}
														</span>
														<ul class="mt-1 space-y-0.5">
															{#each child.children as gc (gc.href)}
																{@const gcActive = isActive(gc.href)}
																<li>
																	<a
																		href={gc.href}
																		onclick={close}
																		class="block py-1 text-xs transition-colors {gcActive
																			? 'font-medium text-neutral-900 dark:text-neutral-100'
																			: 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'}"
																	>
																		{gc.label}
																	</a>
																</li>
															{/each}
														</ul>
													</li>
												{:else}
													{@const childActive = isActive(child.href)}
													<li>
														<a
															href={child.href}
															onclick={close}
															class="block py-1 text-xs transition-colors {childActive
																? 'font-medium text-neutral-900 dark:text-neutral-100'
																: 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'}"
														>
															{child.label}
														</a>
													</li>
												{/if}
											{/each}
										</ul>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</nav>
		</div>
	</div>
{/if}
