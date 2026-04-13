/**
 * Sidebar and mobile-nav source of truth for the Svelte docs site.
 *
 * `sections` is the ordered list of nav groupings the Sidebar.svelte and
 * MobileNav.svelte components render. Add a route here only when the
 * matching `+page.svelte` exists in `src/routes/` AND a `PAGE_TITLES`
 * entry exists in `./page-titles.ts`, otherwise the assertions below
 * fire at module init and abort the build.
 *
 * Visibility contract:
 *
 *   1. Every slug in `PAGE_TITLES` must either be visible in `sections`
 *      or be explicitly listed in `INTENTIONALLY_HIDDEN`. There are no
 *      silent omissions: a page that exists as an implemented route but
 *      is not surfaced anywhere in the nav is a bug, not a feature.
 *
 *   2. Every href in `sections` must correspond to a slug that exists
 *      in `PAGE_TITLES`. The nav cannot link into a route that has no
 *      title / metadata entry.
 *
 *   3. Every entry in `INTENTIONALLY_HIDDEN` must correspond to a slug
 *      that exists in `PAGE_TITLES`. A stale allowlist entry for a
 *      removed page is itself a bug.
 *
 * The three assertions run at module-init time, which on SvelteKit means
 * at SSR prerender during `vite build` for every prerendered route. Any
 * contract violation aborts the build with a precise error message
 * rather than silently dropping the page from the nav or shipping a
 * broken sidebar link.
 */
import { PAGE_TITLES } from "./page-titles";

export type NavSection = {
  title?: string;
  items: { href: string; label: string }[];
};

export const sections: NavSection[] = [
  {
    items: [
      { href: "/", label: "Overview" },
      { href: "/programmatic-api", label: "Programmatic API" },
      { href: "/configuration", label: "Configuration" },
      { href: "/nextjs", label: "Next.js Integration" },
    ],
  },
  {
    title: "Services",
    items: [
      { href: "/foundry", label: "Foundry" },
      { href: "/vercel", label: "Vercel" },
      { href: "/github", label: "GitHub" },
      { href: "/google", label: "Google" },
      { href: "/slack", label: "Slack" },
      { href: "/apple", label: "Apple" },
      { href: "/microsoft", label: "Microsoft Entra ID" },
      { href: "/aws", label: "AWS" },
      { href: "/okta", label: "Okta" },
      { href: "/mongoatlas", label: "MongoDB Atlas" },
      { href: "/resend", label: "Resend" },
      { href: "/stripe", label: "Stripe" },
    ],
  },
  {
    title: "Reference",
    items: [
      { href: "/authentication", label: "Authentication" },
      { href: "/architecture", label: "Architecture" },
    ],
  },
];

export const allItems = sections.flatMap((s) => s.items);

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

function hrefToSlug(href: string): string {
  return href === "/" ? "" : href.replace(/^\/+/, "").replace(/\/+$/, "");
}

const visibleSlugs = new Set(allItems.map((item) => hrefToSlug(item.href)));

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

for (const slug of visibleSlugs) {
  if (!(slug in PAGE_TITLES)) {
    const display = slug === "" ? "/" : `/${slug}`;
    throw new Error(
      `nav: sidebar entry ${JSON.stringify(display)} has no PAGE_TITLES entry. ` +
        `Add the slug to apps/web-svelte/src/lib/page-titles.ts before linking to it.`,
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
