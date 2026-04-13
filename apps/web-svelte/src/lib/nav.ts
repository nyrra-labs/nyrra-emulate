/**
 * Sidebar and mobile-nav source of truth for the Svelte docs site.
 *
 * `sections` is the ordered list of nav groupings that Sidebar.svelte
 * and MobileNav.svelte render. Each entry is declared by `href` only;
 * the visible label is resolved from `PAGE_TITLES` by default, with
 * explicit overrides from `NAV_LABEL_OVERRIDES` for the few service
 * pages whose nav label is intentionally SHORTER than the document
 * title (e.g. nav says "Vercel" while the document title is
 * "Vercel API"). This keeps the visible nav and the per-page metadata
 * in lockstep on the labels that should agree, while still allowing
 * the few intentional shortenings to be reviewed in one place.
 *
 * Add an entry to `sections` only when a matching `PAGE_TITLES` entry
 * exists in `./page-titles.ts`; the generic `src/routes/[slug]/+page.svelte`
 * route picks up the rest of the wiring automatically. The module-init
 * assertions below abort the build if any of the contracts below drift.
 *
 * Visibility contract:
 *
 *   1. Every slug in `PAGE_TITLES` must either be visible in `sections`
 *      or be explicitly listed in `INTENTIONALLY_HIDDEN`. There are no
 *      silent omissions: a page that exists as an implemented route but
 *      is not surfaced anywhere in the nav is a bug, not a feature.
 *
 *   2. Every href in `sections` must correspond to a slug that exists
 *      in `PAGE_TITLES`. The label resolver throws at module init if a
 *      visible href has no PAGE_TITLES entry, so the nav cannot link
 *      into a route that has no title / metadata entry.
 *
 *   3. Every entry in `INTENTIONALLY_HIDDEN` must correspond to a slug
 *      that exists in `PAGE_TITLES`. A stale allowlist entry for a
 *      removed page is itself a bug.
 *
 *   4. Every entry in `NAV_LABEL_OVERRIDES` must correspond to a slug
 *      that exists in `PAGE_TITLES` AND a href that is currently
 *      visible somewhere in `sections`. An orphan override (no visible
 *      href) is dead code; a stale override (no PAGE_TITLES slug) is
 *      a regression waiting to happen.
 *
 * The four assertions run at module-init time, which on SvelteKit
 * means at SSR prerender during `vite build` for every prerendered
 * route. Any contract violation aborts the build with a precise error
 * message rather than silently dropping the page from the nav or
 * shipping a broken sidebar link.
 */
import { PAGE_TITLES } from "./page-titles";
import {
  NAV_LABEL_OVERRIDES,
  REFERENCE_SECTION_HREFS,
  TOP_SECTION_HREFS,
} from "../../../../apps/web/lib/docs-nav-sections";

export type NavSection = {
  title?: string;
  items: { href: string; label: string }[];
};

/**
 * Re-export of the shared `NAV_LABEL_OVERRIDES` map from
 * `apps/web/lib/docs-nav-sections.ts`. The map used to live inline
 * in this file alongside a parallel copy in
 * `apps/web/lib/docs-navigation.ts`; the extraction collapsed both
 * into one source of truth so a future nav-label shortening only
 * needs one entry added to the shared helper. Keeping the re-export
 * here so existing test imports against `$lib/nav` continue to
 * resolve unchanged. The resolver below still falls back to the
 * Svelte-local `PAGE_TITLES[slug]` (which overrides the root to
 * "Overview"), so the Next.js and Svelte navs share the override
 * map but keep distinct fallback sources for non-overridden labels.
 */
export { NAV_LABEL_OVERRIDES } from "../../../../apps/web/lib/docs-nav-sections";

/**
 * Implemented pages that intentionally do not appear anywhere in the
 * sidebar or mobile-nav. Every entry must be a slug that exists in
 * `PAGE_TITLES`. The set is empty today because every implemented
 * route is currently surfaced in `sections`. If a future route lands
 * that should be reachable via direct URL but should not be visible
 * in navigation (e.g. a draft page, a deep-link landing page, or a
 * deprecated alias), add its bare slug here.
 */
const INTENTIONALLY_HIDDEN: ReadonlySet<string> = new Set<string>();

/**
 * Svelte-local services section ordering. Deliberately FoundryCI-
 * first, NOT derived from the `allDocsPages` source order apps/web
 * uses — the Svelte docs site is FoundryCI-branded and leads with
 * the Foundry service in the sidebar to reflect that positioning.
 * Every other service follows in the same source order the upstream
 * registry uses. This list stays local (not imported from
 * `docs-nav-sections.ts`) because the two apps intentionally
 * diverge on service ordering.
 */
const SERVICES_SECTION_HREFS: readonly string[] = [
  "/foundry",
  "/vercel",
  "/github",
  "/google",
  "/slack",
  "/apple",
  "/microsoft",
  "/aws",
  "/okta",
  "/mongoatlas",
  "/resend",
  "/stripe",
];

/**
 * Internal raw nav structure: each entry is just an `href`, no label.
 * The visible labels are derived in one place via `resolveNavLabel`
 * below, so a future PAGE_TITLES change automatically updates every
 * nav label that is not in `NAV_LABEL_OVERRIDES`. The top and
 * reference sections are imported from the shared
 * `apps/web/lib/docs-nav-sections.ts` helper so both apps share one
 * source of truth for section classification; the Services ordering
 * stays Svelte-local because the FoundryCI-first positioning differs
 * from apps/web's allDocsPages source-order fallback.
 */
const rawSections: { title?: string; hrefs: readonly string[] }[] = [
  {
    hrefs: TOP_SECTION_HREFS,
  },
  {
    title: "Services",
    hrefs: SERVICES_SECTION_HREFS,
  },
  {
    title: "Reference",
    hrefs: REFERENCE_SECTION_HREFS,
  },
];

function hrefToSlug(href: string): string {
  return href === "/" ? "" : href.replace(/^\/+/, "").replace(/\/+$/, "");
}

function resolveNavLabel(href: string): string {
  const override = NAV_LABEL_OVERRIDES[href];
  if (override !== undefined) return override;
  const slug = hrefToSlug(href);
  const title = PAGE_TITLES[slug];
  if (title === undefined) {
    throw new Error(
      `nav: href ${JSON.stringify(href)} has no PAGE_TITLES entry and no ` +
        `NAV_LABEL_OVERRIDES entry. Add the slug to ` +
        `apps/web-svelte/src/lib/page-titles.ts before linking to it from nav.ts.`,
    );
  }
  return title;
}

export const sections: NavSection[] = rawSections.map((section) => ({
  title: section.title,
  items: section.hrefs.map((href) => ({ href, label: resolveNavLabel(href) })),
}));

export const allItems = sections.flatMap((s) => s.items);

const visibleHrefs = new Set(allItems.map((item) => item.href));
const visibleSlugs = new Set(allItems.map((item) => hrefToSlug(item.href)));

// Override-map sanity: every override key must correspond to a real
// PAGE_TITLES slug AND must be visible in the nav. A stale entry on
// either axis is a regression waiting to happen.
for (const overrideHref of Object.keys(NAV_LABEL_OVERRIDES)) {
  if (!visibleHrefs.has(overrideHref)) {
    throw new Error(
      `nav: NAV_LABEL_OVERRIDES has an entry for ${JSON.stringify(overrideHref)} ` +
        `that is not visible in any nav section. Remove the stale override from ` +
        `apps/web-svelte/src/lib/nav.ts.`,
    );
  }
  const overrideSlug = hrefToSlug(overrideHref);
  if (!(overrideSlug in PAGE_TITLES)) {
    throw new Error(
      `nav: NAV_LABEL_OVERRIDES has an entry for ${JSON.stringify(overrideHref)} ` +
        `whose slug ${JSON.stringify(overrideSlug)} is not in PAGE_TITLES. ` +
        `Add the slug to apps/web-svelte/src/lib/page-titles.ts or remove the override.`,
    );
  }
}

// Every PAGE_TITLES slug must be visible in the nav OR explicitly
// hidden. (The reverse — every visible href must be in PAGE_TITLES —
// is already enforced by `resolveNavLabel` throwing during the
// `sections` build above.)
for (const slug of Object.keys(PAGE_TITLES)) {
  if (!visibleSlugs.has(slug) && !INTENTIONALLY_HIDDEN.has(slug)) {
    const display = slug === "" ? "/" : `/${slug}`;
    throw new Error(
      `nav: PAGE_TITLES entry ${JSON.stringify(display)} is neither visible in ` +
        `sections nor listed in INTENTIONALLY_HIDDEN. Either add it to the ` +
        `sidebar or add it to the hidden allowlist in apps/web-svelte/src/lib/nav.ts.`,
    );
  }
}

for (const slug of INTENTIONALLY_HIDDEN) {
  if (!(slug in PAGE_TITLES)) {
    const display = slug === "" ? "/" : `/${slug}`;
    throw new Error(
      `nav: INTENTIONALLY_HIDDEN entry ${JSON.stringify(display)} has no ` +
        `PAGE_TITLES entry. Remove the stale allowlist entry from ` +
        `apps/web-svelte/src/lib/nav.ts.`,
    );
  }
}
