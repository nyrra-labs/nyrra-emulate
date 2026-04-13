/**
 * Shared upstream docs-source registry.
 *
 * Single source of truth for the set of doc pages that are implemented
 * by the Svelte app and backed by an upstream `apps/web/app/<slug>/page.mdx`.
 * Both the search index and the docs-search-pages catalog consume this
 * module, so neither duplicates the page list or the raw import wiring.
 *
 * Source of truth and discovery strategy:
 *
 *   - `HREF_TITLES` is the authoritative, hand-maintained map of every
 *     implemented docs href to its human-visible title. Mirrors the
 *     names in `apps/web/lib/docs-navigation.ts` so search hits read
 *     the same as the Next.js docs ("Vercel API" rather than "Vercel",
 *     "Microsoft Entra ID" rather than "Microsoft").
 *
 *   - Upstream raw MDX is pulled via Vite's eager `?raw` glob over
 *     `apps/web/app/**\/page.mdx`. The registry validates at module init
 *     that every `HREF_TITLES` entry has a matching upstream MDX file,
 *     so adding a slug here without the upstream MDX present aborts
 *     the build with a precise error.
 *
 *   - The Svelte route surface for non-root docs pages is now a single
 *     generic `src/routes/[slug]/+page.svelte` whose `+page.server.ts`
 *     prerenders one HTML file per non-root entry in this registry via
 *     SvelteKit's `EntryGenerator`. There is no longer a per-slug route
 *     directory to discover, so this module no longer carries the old
 *     route-glob check.
 *
 * Insertion order in `HREF_TITLES` determines the registry iteration
 * order, which in turn determines the search-result order for entries
 * that tie on relevance score.
 */

const upstreamMdxRaw = import.meta.glob("../../../web/app/**/page.mdx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function hrefToUpstreamMdxKey(href: string): string {
  // "/" -> "../../../web/app/page.mdx"
  // "/vercel" -> "../../../web/app/vercel/page.mdx"
  return href === "/" ? "../../../web/app/page.mdx" : `../../../web/app/${href.slice(1)}/page.mdx`;
}

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

export type DocsSource = {
  title: string;
  href: string;
  raw: string;
};

/**
 * Ordered list of every implemented Svelte route that is backed by an
 * upstream apps/web MDX file. Consumers (search-index, docs-search-pages,
 * the generic [slug] route's `EntryGenerator`) iterate this list directly
 * and should not duplicate its entries.
 */
export const docsSources: readonly DocsSource[] = Object.entries(HREF_TITLES).map(
  ([href, title]) => {
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
  },
);
