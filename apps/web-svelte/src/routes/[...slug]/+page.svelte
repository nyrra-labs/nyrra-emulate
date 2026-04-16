<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="docs-content">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html data.html}
</div>
