/**
 * Derived docs-page title map.
 *
 * Every docs route in this Next.js app is registered in
 * `./docs-navigation.ts`'s `allDocsPages` constant with a canonical
 * `name` and `href`. This module projects that registry into the
 * slug-keyed `PAGE_TITLES` map that `page-metadata.ts` (document
 * title, OG metadata, Twitter card) and the OG image routes at
 * `app/og/route.tsx` and `app/og/[...slug]/route.tsx` consume via
 * `getPageTitle(slug)`.
 *
 * The previous implementation hand-maintained a parallel literal
 * next to `allDocsPages`, so every new page or rename had to be
 * mirrored in two places and drift was silent (a new page existed
 * in the sidebar but had no metadata, or an old page had a stale
 * hero title). This module now walks `allDocsPages` at module init
 * and emits one slug entry per registered page, with a single
 * explicit override for the root slug where the OG/metadata hero
 * string intentionally differs from the sidebar onboarding label.
 *
 * A future addition to `allDocsPages` automatically flows into
 * `PAGE_TITLES` without any parallel edit. A stale override key
 * that does not correspond to a real `allDocsPages` entry fails
 * the Next.js build at module init via the coverage guard below.
 */
import { allDocsPages } from "./docs-pages";

/**
 * Slug-keyed title overrides for pages whose rendered hero / OG
 * image title intentionally differs from the short nav/sidebar
 * label in `allDocsPages`.
 *
 * Only the root slug carries an override today: the sidebar shows
 * "Getting Started" (the short onboarding label), while the
 * document title, OG image, and social-preview cards use the
 * marketing hero string with a deliberate `\n` line break that the
 * OG renderer splits into two stacked lines. Keeping the root's
 * marketing title out of `allDocsPages` preserves the short
 * onboarding label in the sidebar and top-nav consumers.
 *
 * Any key added here must correspond to a real `allDocsPages`
 * entry; the module-init coverage guard below throws if a stale
 * override is left behind.
 */
export const PAGE_TITLE_OVERRIDES: Readonly<Record<string, string>> = {
  "": "Local API Emulation\nfor CI and Sandboxes",
};

/**
 * Converts an `allDocsPages` href (e.g. "/foundry" or "/") into the
 * bare slug form `page-metadata.ts` and the OG routes expect.
 * The root href "/" maps to "" (the empty-string slug) so the
 * metadata/OG pipeline can key root-page lookups with `""`.
 */
function hrefToSlug(href: string): string {
  return href === "/" ? "" : href.replace(/^\/+/, "").replace(/\/+$/, "");
}

function resolvePageTitle(slug: string, canonicalName: string): string {
  return PAGE_TITLE_OVERRIDES[slug] ?? canonicalName;
}

/**
 * Slug -> title map derived from `allDocsPages` in source order.
 * Each entry's value is either the page's `name` from the registry
 * or, for keys listed in `PAGE_TITLE_OVERRIDES`, the intentional
 * metadata-level override string. Consumed by `page-metadata.ts`
 * (document title, OG meta, Twitter card) and the OG image routes
 * via the `getPageTitle` accessor below.
 */
export const PAGE_TITLES: Record<string, string> = (() => {
  const titles: Record<string, string> = {};
  for (const page of allDocsPages) {
    const slug = hrefToSlug(page.href);
    titles[slug] = resolvePageTitle(slug, page.name);
  }
  return titles;
})();

// Module-init coverage guard: every override key must correspond to
// a real slug that `allDocsPages` produced. A stale override (for a
// page that was removed from the registry) fails the Next.js build
// at first import rather than silently shadowing a missing entry.
{
  const generatedSlugs = new Set(Object.keys(PAGE_TITLES));
  for (const overrideSlug of Object.keys(PAGE_TITLE_OVERRIDES)) {
    if (!generatedSlugs.has(overrideSlug)) {
      throw new Error(
        `page-titles: PAGE_TITLE_OVERRIDES key ${JSON.stringify(overrideSlug)} ` +
          `does not correspond to any slug derived from allDocsPages. Remove ` +
          `the stale override from apps/web/lib/page-titles.ts or add the ` +
          `corresponding page to allDocsPages in apps/web/lib/docs-navigation.ts.`,
      );
    }
  }
}

export function getPageTitle(slug: string): string | null {
  return slug in PAGE_TITLES ? PAGE_TITLES[slug]! : null;
}
