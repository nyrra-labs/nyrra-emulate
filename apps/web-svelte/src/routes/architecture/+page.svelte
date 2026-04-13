<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<!--
	The HTML is rendered at build time by `renderDocsHtmlByHref('/architecture')`
	in `+page.server.ts`, which pulls the raw MDX from the shared
	`docs-source` registry (sibling apps/web Architecture page) and runs
	it through the shared docs renderer. The renderer applies the same
	Tailwind classes the bespoke pages use and inlines pre-highlighted
	Shiki output for fenced code blocks. The page's leading unlabeled
	fence (the directory tree) is highlighted as typescript via the
	renderer's `mapLang` empty-string default, mirroring the apps/web
	mdx-components.tsx upstream behavior. Input is a build-time-bundled
	string, never user input, so {@html} is safe here under the same
	trust posture as `CodeBlock.svelte`.
-->
<div class="docs-content">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html data.html}
</div>

<style>
	.docs-content :global(.code-block-shiki pre) {
		background: transparent !important;
		margin: 0 !important;
		padding: 1rem !important;
	}

	.docs-content :global(.code-block-shiki code) {
		background: transparent !important;
	}

	.docs-content :global(.code-block-shiki .shiki) {
		background: transparent !important;
	}
</style>
