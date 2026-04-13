/**
 * Canonical docs page registry plus the grouped sidebar/mobile-nav
 * derivation that both `components/docs-nav.tsx` and
 * `components/docs-mobile-nav.tsx` consume.
 *
 * `allDocsPages` is the source of truth for every implemented docs
 * route in this Next.js app. Every entry must have a corresponding
 * `app/{slug}/page.mdx` (or `app/page.mdx` for the root). The search
 * index, the `/api/docs-chat` route's `loadDocsFiles()` pass, and
 * this module's `docsNavSections` grouping all walk this array, so a
 * page added here flows into every consumer without a parallel
 * literal edit.
 *
 * `docsNavSections` is the grouped nav shape the two Next.js nav
 * components render. It is derived from `allDocsPages` by walking
 * the canonical source in order and classifying each entry into one
 * of three buckets:
 *
 *   - the unlabeled top section (first-party onboarding: Getting
 *     Started, Programmatic API, Configuration, Next.js Integration),
 *   - the "Services" section (per-provider API emulator pages),
 *   - the "Reference" section (Authentication, Architecture).
 *
 * Source order is preserved inside each section. Adding a new
 * service page to `allDocsPages` automatically surfaces it in the
 * Services section at the right position without any parallel edit
 * to the nav components. Adding a new top-level or reference page
 * requires adding its href to the corresponding explicit set below;
 * the module-init coverage guard throws loudly if a non-existent
 * href is listed or if an override key does not correspond to any
 * real `allDocsPages` entry.
 *
 * `NAV_LABEL_OVERRIDES` carries the small set of intentional nav
 * label shortenings (e.g. "Vercel" instead of the document title
 * "Vercel API"). The sidebar has limited horizontal space and the
 * "Services" section header already implies "API", so the short
 * form reads better there. Any override key must correspond to a
 * real `allDocsPages` entry; the assertion at module init catches
 * stale entries before render.
 */

export type NavItem = {
  name: string;
  href: string;
};

export type DocsNavItem = {
  href: string;
  label: string;
};

export type DocsNavSection = {
  title?: string;
  items: readonly DocsNavItem[];
};

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

/**
 * Sidebar/mobile-nav label overrides for pages whose `allDocsPages`
 * name is intentionally longer than the nav label. The default is to
 * derive each nav item's label from the page's `name` field, so this
 * map should stay small and only carry the conscious shortenings the
 * Services section uses for OAuth / social / cloud provider pages.
 *
 * Every key must correspond to a real `allDocsPages` entry; the
 * module-init coverage guard below throws if a stale override is
 * left behind.
 */
export const NAV_LABEL_OVERRIDES: Readonly<Record<string, string>> = {
  "/vercel": "Vercel", // allDocsPages: "Vercel API"
  "/github": "GitHub", // allDocsPages: "GitHub API"
  "/google": "Google", // allDocsPages: "Google API"
  "/slack": "Slack", // allDocsPages: "Slack API"
  "/apple": "Apple", // allDocsPages: "Apple Sign In"
};

/**
 * Hrefs that belong in the unlabeled top section of the sidebar
 * (first-party onboarding). Explicit rather than derived because
 * the top section is a deliberate IA decision, not a mechanical
 * projection of the canonical registry. Every entry must correspond
 * to a real `allDocsPages` entry.
 */
const TOP_SECTION_HREFS: ReadonlySet<string> = new Set([
  "/",
  "/programmatic-api",
  "/configuration",
  "/nextjs",
]);

/**
 * Hrefs that belong in the "Reference" section. Same rationale as
 * `TOP_SECTION_HREFS`: explicit classification because this is an IA
 * decision, not a mechanical projection. Every entry must correspond
 * to a real `allDocsPages` entry.
 */
const REFERENCE_SECTION_HREFS: ReadonlySet<string> = new Set([
  "/authentication",
  "/architecture",
]);

function resolveNavLabel(page: NavItem): string {
  return NAV_LABEL_OVERRIDES[page.href] ?? page.name;
}

/**
 * Walks `allDocsPages` in source order and distributes each entry
 * into its section bucket. Pages not listed in `TOP_SECTION_HREFS`
 * or `REFERENCE_SECTION_HREFS` fall through to the Services bucket
 * by default, so adding a new service page to `allDocsPages` flows
 * into the Services section automatically at the right position.
 */
function buildDocsNavSections(): DocsNavSection[] {
  const top: DocsNavItem[] = [];
  const services: DocsNavItem[] = [];
  const reference: DocsNavItem[] = [];

  for (const page of allDocsPages) {
    const item: DocsNavItem = { href: page.href, label: resolveNavLabel(page) };
    if (TOP_SECTION_HREFS.has(page.href)) {
      top.push(item);
    } else if (REFERENCE_SECTION_HREFS.has(page.href)) {
      reference.push(item);
    } else {
      services.push(item);
    }
  }

  return [
    { items: top },
    { title: "Services", items: services },
    { title: "Reference", items: reference },
  ];
}

/**
 * Grouped sidebar/mobile-nav data the two Next.js nav components
 * consume via a single import. Computed once at module init from
 * `allDocsPages` so both components render exactly the same shape
 * and source order.
 */
export const docsNavSections: readonly DocsNavSection[] = buildDocsNavSections();

/**
 * Flat list of every visible nav item in source order. Consumed by
 * `docs-mobile-nav.tsx` to resolve the current page's label for the
 * mobile nav trigger button.
 */
export const docsNavAllItems: readonly DocsNavItem[] = docsNavSections.flatMap(
  (section) => section.items,
);

// Module-init coverage guards. Any violation throws at the first
// import of this module (which happens during the Next.js build when
// the nav components are imported by a route), so a stale override
// or a typo in a section set surfaces as a loud build failure rather
// than a silently broken nav link.
{
  const allPageHrefs = new Set(allDocsPages.map((page) => page.href));

  for (const overrideHref of Object.keys(NAV_LABEL_OVERRIDES)) {
    if (!allPageHrefs.has(overrideHref)) {
      throw new Error(
        `docs-navigation: NAV_LABEL_OVERRIDES key ${JSON.stringify(overrideHref)} ` +
          `does not correspond to any entry in allDocsPages. Remove the stale ` +
          `override from apps/web/lib/docs-navigation.ts or add the page to ` +
          `allDocsPages.`,
      );
    }
  }

  for (const topHref of TOP_SECTION_HREFS) {
    if (!allPageHrefs.has(topHref)) {
      throw new Error(
        `docs-navigation: TOP_SECTION_HREFS entry ${JSON.stringify(topHref)} does ` +
          `not correspond to any entry in allDocsPages. Remove the stale href or ` +
          `add the page to allDocsPages.`,
      );
    }
  }

  for (const refHref of REFERENCE_SECTION_HREFS) {
    if (!allPageHrefs.has(refHref)) {
      throw new Error(
        `docs-navigation: REFERENCE_SECTION_HREFS entry ${JSON.stringify(refHref)} ` +
          `does not correspond to any entry in allDocsPages. Remove the stale ` +
          `href or add the page to allDocsPages.`,
      );
    }
  }

  // Every allDocsPages entry must land in exactly one visible section.
  // The classifier above guarantees this by construction (the Services
  // bucket is the default), so this check is a defensive last line.
  const visibleHrefs = new Set(docsNavAllItems.map((item) => item.href));
  for (const page of allDocsPages) {
    if (!visibleHrefs.has(page.href)) {
      throw new Error(
        `docs-navigation: allDocsPages entry ${JSON.stringify(page.href)} did not ` +
          `surface in any docsNavSections bucket. This should not happen given ` +
          `the classifier's services-default fallback; inspect the classifier ` +
          `logic in buildDocsNavSections().`,
      );
    }
  }
}
