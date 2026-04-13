/**
 * Implemented docs slug → human-visible title map for the Svelte shell.
 *
 * Source of truth and derivation:
 *
 *   - The upstream `apps/web/lib/docs-pages.ts` `allDocsPages`
 *     catalog is the default source for both the implemented slug set
 *     and the per-slug names. Importing the catalog directly means a
 *     future upstream rename (e.g. "Vercel API" → "Vercel APIs") flows
 *     into this Svelte shell automatically without a parallel local
 *     edit. The slugs are derived via the standard convention: the
 *     root href `/` becomes the empty-string slug, every other href
 *     `/<slug>` becomes the bare slug.
 *
 *   - `PAGE_TITLE_OVERRIDES` below carries the small set of explicit
 *     local divergences from upstream. Today this map has exactly one
 *     entry: the root slug uses "Overview" instead of upstream's
 *     "Getting Started", because the Svelte shell is branded as
 *     FoundryCI by Nyrra and "Overview" reads more naturally as the
 *     first item in the sidebar. See `page-metadata.ts` for the full
 *     `ROOT_TITLE` / `ROOT_DESCRIPTION` override that drives the
 *     rendered <title> tag for the root page.
 *
 *   - `PAGE_TITLES` is the derived projection of `allDocsPages` with
 *     each slug's value resolved as `PAGE_TITLE_OVERRIDES[slug] ??
 *     upstreamName`. The exported `Record<string, string>` shape and
 *     iteration order are unchanged from the previous hand-maintained
 *     version because `Object.fromEntries(allDocsPages.map(...))`
 *     preserves the upstream catalog's array order.
 *
 * The module-init check below validates that every override entry
 * points at a slug that actually exists in the upstream catalog, so a
 * future upstream rename or removal that orphans an override aborts
 * the build with a precise error.
 *
 * The non-root entries mirror the names in `apps/web/lib/docs-pages.ts`
 * directly via this derivation, so search hits read the same as the
 * Next.js docs ("Vercel API" rather than "Vercel", "Microsoft Entra ID"
 * rather than "Microsoft").
 */
import { allDocsPages } from "../../../web/lib/docs-pages";

function hrefToSlug(href: string): string {
  return href === "/" ? "" : href.replace(/^\/+/, "");
}

/**
 * Local label overrides for the Svelte shell. Each entry overrides the
 * corresponding upstream `allDocsPages` name for the same slug. Today
 * this map contains exactly one entry — the root page is branded
 * "Overview" instead of upstream's "Getting Started" — and it should
 * stay small. Add an entry only when the Svelte shell genuinely needs
 * a different visible title than upstream uses for the same page.
 */
export const PAGE_TITLE_OVERRIDES: Readonly<Record<string, string>> = {
  // Root page: "Overview" matches the FoundryCI by Nyrra branding in
  // the sidebar and the rendered H1, while upstream's "Getting Started"
  // is the more general apps/web framing.
  "": "Overview",
};

export const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  allDocsPages.map(({ name, href }) => {
    const slug = hrefToSlug(href);
    const override = PAGE_TITLE_OVERRIDES[slug];
    return [slug, override ?? name];
  }),
);

// Override-map sanity: every PAGE_TITLE_OVERRIDES key must correspond
// to a slug that exists in the upstream catalog. A stale override is
// a regression waiting to happen — it would silently shadow nothing
// after an upstream rename.
const upstreamSlugs = new Set(allDocsPages.map(({ href }) => hrefToSlug(href)));
for (const overrideSlug of Object.keys(PAGE_TITLE_OVERRIDES)) {
  if (!upstreamSlugs.has(overrideSlug)) {
    throw new Error(
      `page-titles: PAGE_TITLE_OVERRIDES has an entry for slug ${JSON.stringify(overrideSlug)} ` +
        `that is not in the upstream apps/web/lib/docs-pages.ts catalog. ` +
        `Either the upstream docs page was removed/renamed or the override is stale; ` +
        `update the upstream catalog or remove the override from page-titles.ts.`,
    );
  }
}

export function getPageTitle(slug: string): string | null {
  return slug in PAGE_TITLES ? PAGE_TITLES[slug]! : null;
}
