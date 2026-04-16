/**
 * Implemented docs slug to human-visible title map for the Svelte shell.
 *
 * Derived from the upstream docs-upstream generated manifest. The upstream
 * `allDocsPages` catalog provides both the implemented slug set and the
 * per-slug names. Local overrides in `PAGE_TITLE_OVERRIDES` carry the
 * small set of explicit divergences from upstream (today: root page uses
 * "Overview" instead of upstream's "Getting Started").
 */
import { allDocsPages } from "docs-upstream";

function hrefToSlug(href: string): string {
  return href === "/" ? "" : href.replace(/^\/+/, "");
}

/**
 * Local label overrides for the Svelte shell. Each entry overrides the
 * corresponding upstream name for the same slug. Keep this map small.
 */
export const PAGE_TITLE_OVERRIDES: Readonly<Record<string, string>> = {
  "": "Overview",
};

export const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  allDocsPages.map(({ name, href }) => {
    const slug = hrefToSlug(href);
    const override = PAGE_TITLE_OVERRIDES[slug];
    return [slug, override ?? name];
  }),
);

const upstreamSlugs = new Set(allDocsPages.map(({ href }) => hrefToSlug(href)));
for (const overrideSlug of Object.keys(PAGE_TITLE_OVERRIDES)) {
  if (!upstreamSlugs.has(overrideSlug)) {
    throw new Error(
      `page-titles: PAGE_TITLE_OVERRIDES has an entry for slug ${JSON.stringify(overrideSlug)} ` +
        `that is not in the upstream catalog. ` +
        `Either the upstream docs page was removed/renamed or the override is stale.`,
    );
  }
}

export function getPageTitle(slug: string): string | null {
  return slug in PAGE_TITLES ? PAGE_TITLES[slug]! : null;
}
