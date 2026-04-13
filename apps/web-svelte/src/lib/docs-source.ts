/**
 * Shared upstream docs-source registry.
 *
 * Derived projection of the single authoritative title registry in
 * `./page-titles`. Both the search index and the docs-search-pages
 * catalog consume this module, so neither duplicates the page list or
 * the raw import wiring.
 *
 * Source of truth and discovery strategy:
 *
 *   - `PAGE_TITLES` in `./page-titles.ts` is the single hand-maintained
 *     map of every implemented docs slug to its human-visible title.
 *     Mirrors the names in `apps/web/lib/docs-navigation.ts` so search
 *     hits read the same as the Next.js docs ("Vercel API" rather than
 *     "Vercel", "Microsoft Entra ID" rather than "Microsoft"). The
 *     metadata module (`page-metadata.ts`) and the nav contract
 *     (`nav.ts`) both already consume this map directly.
 *
 *   - `docsSources` below derives from `PAGE_TITLES` by converting each
 *     bare slug to a docs href (`""` -> `"/"`, `"foundry"` -> `"/foundry"`),
 *     looking up the matching upstream MDX file via the `?raw` glob
 *     below, and emitting one `DocsSource` per entry. There is no
 *     second title map to keep in lockstep; a regression that wanted
 *     to break the parity would have to break the projection itself.
 *
 *   - Upstream raw MDX is pulled via Vite's eager `?raw` glob over
 *     `apps/web/app/**\/page.mdx`. The registry validates at module init
 *     that every `PAGE_TITLES` entry has a matching upstream MDX file,
 *     so adding a slug to `PAGE_TITLES` without the upstream MDX present
 *     aborts the build with a precise error.
 *
 *   - The Svelte route surface for non-root docs pages is a single
 *     generic `src/routes/[slug]/+page.svelte` whose `+page.server.ts`
 *     prerenders one HTML file per non-root entry in this registry via
 *     SvelteKit's `EntryGenerator`.
 *
 * `PAGE_TITLES` insertion order determines `docsSources` iteration
 * order, which in turn determines the search-result order for entries
 * that tie on relevance score.
 */
import { PAGE_TITLES } from "./page-titles";

const upstreamMdxRaw = import.meta.glob("../../../web/app/**/page.mdx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function slugToHref(slug: string): string {
  return slug === "" ? "/" : `/${slug}`;
}

function hrefToUpstreamMdxKey(href: string): string {
  // "/" -> "../../../web/app/page.mdx"
  // "/vercel" -> "../../../web/app/vercel/page.mdx"
  return href === "/" ? "../../../web/app/page.mdx" : `../../../web/app/${href.slice(1)}/page.mdx`;
}

export type DocsSource = {
  title: string;
  href: string;
  raw: string;
};

/**
 * Ordered list of every implemented Svelte route that is backed by an
 * upstream apps/web MDX file. Consumers (search-index, docs-search-pages,
 * the generic [slug] route's `EntryGenerator`) iterate this list directly
 * and should not duplicate its entries. The list is the derived projection
 * of `PAGE_TITLES`; do not introduce a second hand-maintained title map.
 */
export const docsSources: readonly DocsSource[] = Object.entries(PAGE_TITLES).map(
  ([slug, title]) => {
    const href = slugToHref(slug);
    const mdxKey = hrefToUpstreamMdxKey(href);
    const raw = upstreamMdxRaw[mdxKey];
    if (raw === undefined) {
      throw new Error(
        `docs-source: slug ${JSON.stringify(slug)} has a PAGE_TITLES entry but no ` +
          `upstream MDX was found at ${mdxKey}. Either the upstream apps/web page ` +
          `was removed or the slug-to-path convention was violated.`,
      );
    }
    return { href, title, raw };
  },
);
