<script lang="ts">
	/**
	 * Renders the per-page metadata `<svelte:head>` tags for the docs site.
	 *
	 * Mounted once at the layout level with `pathname={page.url.pathname}` so
	 * a single instance covers every implemented route. The component derives
	 * the slug from the pathname, looks up the matching `PageMetadata`, and
	 * emits title / description / Open Graph / Twitter card tags. If the
	 * route is not in `PAGE_TITLES` (e.g., a 404 or a future page that has
	 * not been added to the catalog yet), the component renders nothing so
	 * SvelteKit falls back to the inert defaults from `app.html`.
	 */
	import { pageMetadataForPathname } from '$lib/page-metadata';

	let { pathname }: { pathname: string } = $props();

	const meta = $derived(pageMetadataForPathname(pathname));
</script>

<svelte:head>
	{#if meta}
		<title>{meta.title}</title>
		<meta name="description" content={meta.description} />

		<meta property="og:type" content={meta.openGraph.type} />
		<meta property="og:locale" content={meta.openGraph.locale} />
		<meta property="og:site_name" content={meta.openGraph.siteName} />
		<meta property="og:title" content={meta.openGraph.title} />
		<meta property="og:description" content={meta.openGraph.description} />
		<meta property="og:url" content={meta.openGraph.url} />
		<meta property="og:image" content={meta.openGraph.image.url} />
		<meta property="og:image:width" content={String(meta.openGraph.image.width)} />
		<meta property="og:image:height" content={String(meta.openGraph.image.height)} />
		<meta property="og:image:alt" content={meta.openGraph.image.alt} />

		<meta name="twitter:card" content={meta.twitter.card} />
		<meta name="twitter:title" content={meta.twitter.title} />
		<meta name="twitter:description" content={meta.twitter.description} />
		<meta name="twitter:image" content={meta.twitter.image} />
	{/if}
</svelte:head>
