<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	type SearchResult = {
		title: string;
		href: string;
		snippet: string;
	};

	let open = $state(false);
	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let loading = $state(false);
	let activeIndex = $state(0);

	let inputEl: HTMLInputElement | null = $state(null);
	let listEl: HTMLDivElement | null = $state(null);

	let abortCtrl: AbortController | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	function close() {
		open = false;
	}

	function navigate(href: string) {
		open = false;
		query = '';
		results = [];
		goto(href);
	}

	function onGlobalKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
			event.preventDefault();
			open = !open;
		} else if (event.key === 'Escape' && open) {
			event.preventDefault();
			close();
		}
	}

	function onInputKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeIndex = Math.min(activeIndex + 1, Math.max(results.length - 1, 0));
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
		} else if (event.key === 'Enter' && results[activeIndex]) {
			event.preventDefault();
			navigate(results[activeIndex].href);
		}
	}

	function onOverlayKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') close();
	}

	onMount(() => {
		document.addEventListener('keydown', onGlobalKeydown);
		return () => document.removeEventListener('keydown', onGlobalKeydown);
	});

	$effect(() => {
		if (!open) {
			query = '';
			results = [];
			activeIndex = 0;
			return;
		}

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		const focusTimer = setTimeout(() => inputEl?.focus(), 0);

		return () => {
			document.body.style.overflow = previousOverflow;
			clearTimeout(focusTimer);
		};
	});

	$effect(() => {
		const q = query.trim();

		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
		if (abortCtrl) {
			abortCtrl.abort();
			abortCtrl = null;
		}

		if (!q) {
			results = [];
			loading = false;
			return;
		}

		loading = true;
		const ctrl = new AbortController();
		abortCtrl = ctrl;

		debounceTimer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
					signal: ctrl.signal
				});
				if (res.ok) {
					const data = (await res.json()) as { results: SearchResult[] };
					if (!ctrl.signal.aborted) {
						results = data.results;
						activeIndex = 0;
					}
				}
			} catch {
				// aborted or network error — surface as zero results
			} finally {
				if (!ctrl.signal.aborted) {
					loading = false;
				}
			}
		}, 150);
	});

	$effect(() => {
		if (!listEl) return;
		// referenced for reactivity
		void activeIndex;
		const active = listEl.querySelector('[data-active="true"]');
		if (active && typeof (active as HTMLElement).scrollIntoView === 'function') {
			(active as HTMLElement).scrollIntoView({ block: 'nearest' });
		}
	});

	const hasQuery = $derived(query.trim().length > 0);
</script>

<button
	type="button"
	onclick={() => (open = true)}
	class="hidden items-center gap-2 rounded-md border border-neutral-200/70 bg-neutral-100/60 px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:border-neutral-400/40 hover:text-neutral-900 sm:flex dark:border-neutral-800/70 dark:bg-neutral-900/60 dark:text-neutral-400 dark:hover:border-neutral-600/40 dark:hover:text-neutral-100"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<circle cx="11" cy="11" r="8" />
		<path d="m21 21-4.3-4.3" />
	</svg>
	Search docs
	<kbd
		class="pointer-events-none ml-1 inline-flex items-center gap-0.5 rounded border border-neutral-200/70 bg-white px-1.5 py-0.5 font-mono text-[10px] text-neutral-500 dark:border-neutral-800/70 dark:bg-neutral-950 dark:text-neutral-400"
	>
		<span>&#8984;</span>K
	</kbd>
</button>

<button
	type="button"
	onclick={() => (open = true)}
	aria-label="Search docs"
	class="flex items-center text-neutral-500 transition-colors hover:text-neutral-900 sm:hidden dark:text-neutral-400 dark:hover:text-neutral-100"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<circle cx="11" cy="11" r="8" />
		<path d="m21 21-4.3-4.3" />
	</svg>
</button>

{#if open}
	<div class="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh] sm:pt-[20vh]">
		<div
			class="absolute inset-0 bg-black/50"
			onclick={close}
			onkeydown={onOverlayKeydown}
			role="presentation"
			aria-hidden="true"
		></div>
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Search documentation"
			class="relative z-10 flex w-full max-w-lg flex-col gap-0 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
		>
			<div class="flex items-center gap-2 border-b border-neutral-200 px-3 dark:border-neutral-800">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="shrink-0 text-neutral-500 dark:text-neutral-400"
					aria-hidden="true"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.3-4.3" />
				</svg>
				<input
					bind:this={inputEl}
					bind:value={query}
					onkeydown={onInputKeydown}
					type="text"
					placeholder="Search docs..."
					autocomplete="off"
					spellcheck="false"
					class="flex-1 bg-transparent py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-400"
				/>
				{#if query}
					<button
						type="button"
						onclick={() => (query = '')}
						aria-label="Clear search"
						class="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M18 6 6 18" />
							<path d="m6 6 12 12" />
						</svg>
					</button>
				{/if}
			</div>

			<div bind:this={listEl} class="max-h-[min(60vh,400px)] overflow-y-auto p-2">
				{#if loading && hasQuery}
					<div class="flex items-center justify-center py-6">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-transparent dark:border-neutral-700 dark:border-t-transparent"
						></div>
					</div>
				{:else if hasQuery && results.length === 0}
					<p class="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
						No results found.
					</p>
				{:else if !hasQuery}
					<p class="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
						Type to search documentation...
					</p>
				{:else}
					{#each results as result, i (result.href + i)}
						<button
							type="button"
							data-active={i === activeIndex}
							onclick={() => navigate(result.href)}
							onmouseenter={() => (activeIndex = i)}
							class="flex w-full flex-col gap-1 rounded-md px-3 py-2 text-left transition-colors {i ===
							activeIndex
								? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
								: 'text-neutral-900 dark:text-neutral-100'}"
						>
							<span class="text-sm font-medium">{result.title}</span>
							{#if result.snippet}
								<span
									class="line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400"
								>
									{result.snippet}
								</span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}
