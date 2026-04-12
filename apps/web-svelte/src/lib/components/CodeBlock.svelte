<script lang="ts">
	/**
	 * Renders pre-highlighted Shiki HTML inside the same wrapper styling that
	 * apps/web/components/code.tsx uses (rounded border, neutral bg, font-mono
	 * text-[13px], horizontal scroll). The `html` string is produced at build
	 * time by `+page.server.ts` calling the server-only highlight() helper.
	 */
	let { html }: { html: string } = $props();
</script>

<div
	class="my-4 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 font-mono text-[13px] dark:border-neutral-800 dark:bg-neutral-900"
>
	<!-- The HTML is produced at build time by shiki via highlight() in
	     code-highlight.server.ts. The input is hard-coded code strings from
	     the page's +page.server.ts, never user input, so XSS is not a risk
	     for this specific use of {@html}. -->
	<div class="code-block-shiki overflow-x-auto">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html html}
	</div>
</div>

<style>
	.code-block-shiki :global(pre) {
		background: transparent !important;
		margin: 0 !important;
		padding: 1rem !important;
	}

	.code-block-shiki :global(code) {
		background: transparent !important;
	}

	.code-block-shiki :global(.shiki) {
		background: transparent !important;
	}
</style>
