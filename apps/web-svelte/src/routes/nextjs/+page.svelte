<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<!--
	The HTML is rendered at build time by `renderDocsHtmlByHref('/nextjs')`
	in `+page.server.ts`, which pulls the raw MDX from the shared
	`docs-source` registry (sibling apps/web Next.js Integration page) and
	runs it through the shared docs renderer. The renderer applies the
	same Tailwind classes the bespoke pages use and inlines pre-highlighted
	Shiki output for fenced code blocks. Input is a build-time-bundled
	string, never user input, so {@html} is safe here under the same
	trust posture as `CodeBlock.svelte`.
-->
<div class="docs-content">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html data.html}
</div>
