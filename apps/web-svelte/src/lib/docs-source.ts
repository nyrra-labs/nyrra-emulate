/**
 * Shared upstream docs-source registry.
 *
 * Single source of truth for the set of doc pages that are implemented as
 * Svelte routes today and backed by an upstream apps/web MDX file. Both
 * the search index and the docs-search-pages catalog consume this module,
 * so neither duplicates the page list or the raw import wiring.
 *
 * Discovery strategy:
 *
 *   - Upstream raw MDX is pulled via Vite's eager glob with `?raw`, so a
 *     single glob call replaces the hand-maintained block of
 *     `import ... ?raw` lines that search-index.ts used to carry.
 *
 *   - Implemented Svelte routes are discovered via a lazy glob over
 *     `../routes/**\/+page.svelte`. The glob keys are converted to href
 *     form and used as the implemented-page boundary: only hrefs that
 *     have both a Svelte route and an upstream MDX entry appear in the
 *     registry. New routes are picked up for free; upstream pages
 *     without a matching Svelte route stay out of search automatically.
 *
 *   - Human titles (e.g. "Vercel API", "Microsoft Entra ID") mirror the
 *     apps/web/lib/docs-navigation.ts labels so search hits read the
 *     same as the Next.js docs. This map is the one thing that must be
 *     hand-maintained when adding a page. The module throws loudly at
 *     build time if an implemented Svelte route has no matching title,
 *     or if a titled href has no upstream MDX, so silent drift between
 *     the three surfaces (route, title, upstream) is impossible.
 */

const upstreamMdxRaw = import.meta.glob("../../../web/app/**/page.mdx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const svelteRouteModules = import.meta.glob("../routes/**/+page.svelte");

function routeKeyToHref(key: string): string {
  // "../routes/+page.svelte" -> "/"
  // "../routes/foundry/+page.svelte" -> "/foundry"
  const prefix = "../routes";
  const suffix = "/+page.svelte";
  const inner = key.slice(prefix.length, -suffix.length);
  return inner === "" ? "/" : inner;
}

function hrefToUpstreamMdxKey(href: string): string {
  // "/" -> "../../../web/app/page.mdx"
  // "/vercel" -> "../../../web/app/vercel/page.mdx"
  return href === "/" ? "../../../web/app/page.mdx" : `../../../web/app/${href.slice(1)}/page.mdx`;
}

const IMPLEMENTED_HREFS: ReadonlySet<string> = new Set(
  Object.keys(svelteRouteModules).map(routeKeyToHref),
);

/**
 * Human-visible titles keyed by Svelte route href. Mirrors the names in
 * `apps/web/lib/docs-navigation.ts` so Svelte docs search results read
 * the same as the Next.js site ("Vercel API" rather than "Vercel",
 * "Microsoft Entra ID" rather than "Microsoft").
 *
 * Insertion order determines the registry iteration order, which in
 * turn determines the search-result order for entries that tie on
 * relevance score.
 */
const HREF_TITLES: Record<string, string> = {
  "/": "Overview",
  "/programmatic-api": "Programmatic API",
  "/configuration": "Configuration",
  "/nextjs": "Next.js Integration",
  "/vercel": "Vercel API",
  "/github": "GitHub API",
  "/google": "Google API",
  "/slack": "Slack API",
  "/apple": "Apple Sign In",
  "/microsoft": "Microsoft Entra ID",
  "/foundry": "Foundry",
  "/aws": "AWS",
  "/okta": "Okta",
  "/mongoatlas": "MongoDB Atlas",
  "/resend": "Resend",
  "/stripe": "Stripe",
  "/authentication": "Authentication",
  "/architecture": "Architecture",
};

for (const href of IMPLEMENTED_HREFS) {
  if (!(href in HREF_TITLES)) {
    throw new Error(
      `docs-source: implemented Svelte route ${href} has no title in HREF_TITLES. ` +
        `Add an entry to apps/web-svelte/src/lib/docs-source.ts so the page is ` +
        `surfaced in search.`,
    );
  }
}

export type DocsSource = {
  title: string;
  href: string;
  raw: string;
};

/**
 * Ordered list of every implemented Svelte route that is backed by an
 * upstream apps/web MDX file. Consumers (search-index, docs-search-pages)
 * iterate this list directly and should not duplicate its entries.
 */
export const docsSources: readonly DocsSource[] = Object.entries(HREF_TITLES)
  .filter(([href]) => IMPLEMENTED_HREFS.has(href))
  .map(([href, title]) => {
    const mdxKey = hrefToUpstreamMdxKey(href);
    const raw = upstreamMdxRaw[mdxKey];
    if (raw === undefined) {
      throw new Error(
        `docs-source: href ${href} has a HREF_TITLES entry but no upstream MDX ` +
          `was found at ${mdxKey}. Either the upstream apps/web page was removed ` +
          `or the href-to-path convention was violated.`,
      );
    }
    return { href, title, raw };
  });
