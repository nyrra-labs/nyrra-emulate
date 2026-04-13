import type { EntryGenerator, PageServerLoad } from "./$types";
import { docsSources } from "$lib/docs-source";
import { renderDocsHtmlByHref } from "$lib/render-docs.server";

/**
 * Generic prerendered loader for every non-root upstream-backed docs page.
 *
 * Replaces the old per-slug `+page.server.ts` wrappers (one directory per
 * upstream-backed slug) with a single dynamic route. Adding a new docs
 * page is now a single edit to `apps/web-svelte/src/lib/docs-source.ts`
 * (plus the matching `apps/web-svelte/src/lib/page-titles.ts` and
 * `apps/web-svelte/src/lib/nav.ts` updates the nav contract enforces);
 * the entries generator below picks up the new slug automatically.
 */
export const prerender = true;

export const entries: EntryGenerator = () =>
  docsSources
    .filter((source) => source.href !== "/")
    .map((source) => ({ slug: source.href.slice(1) }));

export const load: PageServerLoad = async ({ params }) => {
  const { html } = await renderDocsHtmlByHref(`/${params.slug}`);
  return { html };
};
