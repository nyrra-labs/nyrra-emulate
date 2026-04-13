<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<!--
	The HTML is rendered at build time by `renderDocsHtmlByHref('/' + params.slug)`
	in `+page.server.ts`, which pulls the raw MDX from the shared
	`docs-source` registry (sibling apps/web upstream page) and runs it
	through the shared docs renderer. The renderer applies the same
	Tailwind classes the bespoke pages use and inlines pre-highlighted
	Shiki output for fenced code blocks. Input is a build-time-bundled
	string, never user input, so {@html} is safe here under the same
	trust posture as `CodeBlock.svelte`. This single component replaces
	the old pile of per-slug `+page.svelte` wrappers; the generic [slug]
	route prerenders one HTML file per non-root entry in the docs-source
	registry via the EntryGenerator in `+page.server.ts`.
-->
<div class="docs-content">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html data.html}
</div>
