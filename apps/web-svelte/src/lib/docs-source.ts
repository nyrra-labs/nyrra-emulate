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
 *   - `PAGE_TITLES` in `./page-titles.ts` is the single source of
 *     truth for every implemented docs slug → human-visible title.
 *     It is itself derived from the upstream
 *     `apps/web/lib/docs-pages.ts` `allDocsPages` catalog with
 *     one explicit local override for the root label (the Svelte
 *     shell uses "Overview" instead of upstream's "Getting Started").
 *     Search hits therefore read the same as the Next.js docs
 *     ("Vercel API" rather than "Vercel", "Microsoft Entra ID"
 *     rather than "Microsoft") for free, with no second list to keep
 *     in lockstep. The metadata module (`page-metadata.ts`) and the
 *     nav contract (`nav.ts`) both already consume this map directly.
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
 *     in BOTH directions:
 *
 *       (forward) every `PAGE_TITLES` entry must have a matching upstream
 *       MDX file, so adding a slug to `PAGE_TITLES` without the upstream
 *       MDX present aborts the build with a precise error.
 *
 *       (reverse) every upstream MDX page must be either surfaced via
 *       `PAGE_TITLES` or explicitly listed in
 *       `INTENTIONALLY_UNSURFACED_UPSTREAM_HREFS` below. Adding a new
 *       upstream MDX file (e.g. via an upstream sync) without surfacing
 *       it in `PAGE_TITLES` aborts the build with a precise error,
 *       forcing a conscious decision instead of silent drift.
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

const UPSTREAM_MDX_KEY_PREFIX = "../../../web/app/";

/**
 * Maps a path RELATIVE TO the upstream `apps/web/app/` directory (i.e.
 * everything after the `apps/web/app/` segment) back to a docs href.
 * Handles arbitrary depth: the root `page.mdx` becomes `/`, single-
 * segment `foundry/page.mdx` becomes `/foundry`, and nested
 * `foo/bar/page.mdx` becomes `/foo/bar`. This is the single source of
 * truth for the inverse of the docs-source slug→href convention; any
 * caller that needs to map a filesystem or Vite-glob MDX location to
 * an href must funnel through this helper to avoid drift.
 *
 * Exported so the test suite can verify the mapping directly with
 * synthetic inputs and use it from an independent filesystem walker
 * without duplicating the regex logic.
 */
export function mdxRelativePathToHref(relativePath: string): string {
  if (relativePath === "page.mdx") return "/";
  const inner = relativePath.replace(/\/page\.mdx$/, "");
  return `/${inner}`;
}

function upstreamMdxKeyToHref(key: string): string {
  // "../../../web/app/page.mdx" -> "/"
  // "../../../web/app/foundry/page.mdx" -> "/foundry"
  // "../../../web/app/some/nested/page.mdx" -> "/some/nested"
  const relative = key.startsWith(UPSTREAM_MDX_KEY_PREFIX)
    ? key.slice(UPSTREAM_MDX_KEY_PREFIX.length)
    : key;
  return mdxRelativePathToHref(relative);
}

/**
 * Allowlist of upstream `apps/web/app/<slug>/page.mdx` hrefs that are
 * intentionally NOT surfaced in this Svelte app yet. The reverse parity
 * guard below skips entries in this set so a future upstream-only page
 * can ship without forcing an immediate Svelte surfacing in the same
 * commit, AS LONG AS the omission is conscious and tracked here.
 *
 * Today this set is empty: every upstream `page.mdx` has a matching
 * `PAGE_TITLES` entry. Add an href here only with a comment explaining
 * why the page is upstream-only, and remove the entry once the page is
 * surfaced in `PAGE_TITLES`.
 */
const INTENTIONALLY_UNSURFACED_UPSTREAM_HREFS: ReadonlySet<string> = new Set<string>();

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

// Reverse parity guard: every upstream `apps/web/app/**\/page.mdx` page
// must either be surfaced via `PAGE_TITLES` or explicitly listed in
// `INTENTIONALLY_UNSURFACED_UPSTREAM_HREFS`. This catches the case where
// an upstream sync brings in a new page that the Svelte app has not yet
// chosen to render. The check runs after `docsSources` is built so a
// failure inside the forward map does not mask a failure here.
const surfacedHrefs = new Set(docsSources.map((source) => source.href));
for (const mdxKey of Object.keys(upstreamMdxRaw)) {
  const upstreamHref = upstreamMdxKeyToHref(mdxKey);
  if (surfacedHrefs.has(upstreamHref)) continue;
  if (INTENTIONALLY_UNSURFACED_UPSTREAM_HREFS.has(upstreamHref)) continue;
  throw new Error(
    `docs-source: upstream MDX at ${mdxKey} (href ${JSON.stringify(upstreamHref)}) ` +
      `is not surfaced via PAGE_TITLES and is not in ` +
      `INTENTIONALLY_UNSURFACED_UPSTREAM_HREFS. Add a PAGE_TITLES entry to surface ` +
      `the page, or add ${JSON.stringify(upstreamHref)} to ` +
      `INTENTIONALLY_UNSURFACED_UPSTREAM_HREFS in apps/web-svelte/src/lib/docs-source.ts ` +
      `to acknowledge it as intentionally not yet surfaced.`,
  );
}
