/**
 * Canonical docs page registry.
 *
 * `allDocsPages` is the single source of truth for every implemented
 * docs route in the Next.js `apps/web` app. Every entry must have a
 * corresponding `apps/web/app/{slug}/page.mdx` (or
 * `apps/web/app/page.mdx` for the root). The registry is consumed by:
 *
 *   - `./docs-navigation.ts` — builds the grouped sidebar/mobile-nav
 *     via `docsNavSections`.
 *   - `./page-titles.ts` — derives the slug-keyed `PAGE_TITLES` map.
 *   - `./search-index.ts` — walks the registry to build
 *     `IndexEntry` records for the search handler.
 *   - `./docs-files.ts` — walks the registry to pre-load every
 *     docs MDX file into the `/workspace/*.md` map the docs-chat
 *     bash tool exposes to the AI model.
 *   - `apps/web-svelte/src/lib/page-titles.ts` — mirrors the same
 *     18-entry registry into the Svelte app's slug-keyed
 *     `PAGE_TITLES` map (which it then layers its FoundryCI root
 *     override on top of).
 *
 * This file exists as a dedicated lightweight module so non-nav
 * consumers stop reaching into `./docs-navigation.ts` for route/title
 * source of truth when they are not actually doing navigation work.
 * The nav grouping logic, label-shortening map, and section
 * classification all still live in `./docs-navigation.ts` (plus the
 * shared `./docs-nav-sections.ts` helper). Consumers that care about
 * nav shape import from there; consumers that only care about the
 * registered page list import from here.
 */

/**
 * A single docs page registered in the Next.js app router.
 * Every entry must have a matching `apps/web/app/<slug>/page.mdx`
 * on disk (verified by the `docs-route-tree-web.test.ts` coverage
 * guard). The root entry uses href `"/"` and has no per-slug layout.
 */
export type NavItem = {
  /** Human-visible document title — the canonical name the search
   *  index, docs-chat workspace, and non-overridden nav labels all
   *  derive from. */
  name: string;
  /** Route href with leading slash. `"/"` for the root page. */
  href: string;
};

/**
 * Ordered registry of every docs page. Adding a new docs page
 * requires adding an entry here, creating the matching
 * `app/<slug>/page.mdx` + `app/<slug>/layout.tsx` pair, and
 * (optionally) adding an href entry to `TOP_SECTION_HREFS` or
 * `REFERENCE_SECTION_HREFS` in `./docs-nav-sections.ts` if the new
 * page should live outside the default Services bucket.
 *
 * Source order is preserved by every consumer that walks this
 * array: the nav classifier, the search index, the docs-chat file
 * loader, and the page-title map. Reordering entries here
 * reorders every consumer's output.
 */
export const allDocsPages: NavItem[] = [
  { name: "Getting Started", href: "/" },
  { name: "Programmatic API", href: "/programmatic-api" },
  { name: "Configuration", href: "/configuration" },
  { name: "Next.js Integration", href: "/nextjs" },
  { name: "Vercel API", href: "/vercel" },
  { name: "GitHub API", href: "/github" },
  { name: "Google API", href: "/google" },
  { name: "Slack API", href: "/slack" },
  { name: "Apple Sign In", href: "/apple" },
  { name: "Microsoft Entra ID", href: "/microsoft" },
  { name: "Foundry", href: "/foundry" },
  { name: "AWS", href: "/aws" },
  { name: "Okta", href: "/okta" },
  { name: "MongoDB Atlas", href: "/mongoatlas" },
  { name: "Resend", href: "/resend" },
  { name: "Stripe", href: "/stripe" },
  { name: "Authentication", href: "/authentication" },
  { name: "Architecture", href: "/architecture" },
];
