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
 * requires adding its href to the corresponding explicit set in
 * `./docs-nav-sections.ts`; the module-init coverage guard throws
 * loudly if a non-existent href is listed or if an override key
 * does not correspond to any real `allDocsPages` entry.
 *
 * `NAV_LABEL_OVERRIDES`, `TOP_SECTION_HREFS`, and
 * `REFERENCE_SECTION_HREFS` are imported from
 * `./docs-nav-sections.ts`, which is the single cross-app source of
 * truth for the label-shortening map and the top/reference section
 * classification. Both the Svelte docs nav and this Next.js docs
 * nav consume the same three constants so a rebrand or section
 * move touches one file.
 */
import { allDocsPages, type NavItem } from "./docs-pages";
import {
  NAV_LABEL_OVERRIDES,
  REFERENCE_SECTION_HREFS as REFERENCE_SECTION_HREFS_LIST,
  TOP_SECTION_HREFS as TOP_SECTION_HREFS_LIST,
} from "./docs-nav-sections";

/**
 * Re-export of the shared `NAV_LABEL_OVERRIDES` map from
 * `./docs-nav-sections`. Existing callers and test imports that
 * resolve `NAV_LABEL_OVERRIDES` from `@/lib/docs-navigation` keep
 * working without changes.
 */
export { NAV_LABEL_OVERRIDES } from "./docs-nav-sections";

/**
 * Re-export of the canonical docs page registry + type from
 * `./docs-pages`. Non-nav consumers should import these from
 * `./docs-pages` directly; the re-export here exists so historical
 * callers that resolve `allDocsPages` / `NavItem` from
 * `@/lib/docs-navigation` keep compiling during any future migration
 * pass. Nav-aware consumers (both nav components, the Svelte nav
 * shim) still import `docsNavSections` / `docsNavAllItems` /
 * `NAV_LABEL_OVERRIDES` / `DocsNavSection` / `DocsNavItem` from
 * this file as before.
 */
export { allDocsPages, type NavItem } from "./docs-pages";

export type DocsNavItem = {
  href: string;
  label: string;
};

export type DocsNavSection = {
  title?: string;
  items: readonly DocsNavItem[];
};

/**
 * O(1) lookup sets derived from the shared `TOP_SECTION_HREFS` /
 * `REFERENCE_SECTION_HREFS` arrays in `./docs-nav-sections`. The
 * shared helper exports arrays (so the Svelte consumer can spread
 * them into its own ordered `rawSections`), and each consumer
 * wraps locally with `new Set()` where O(1) membership checks are
 * useful. Apps/web's classifier needs `.has(href)` per-page inside
 * the services/top/reference bucket split, so the wrapped forms
 * live here at module init.
 */
const TOP_SECTION_HREFS: ReadonlySet<string> = new Set(TOP_SECTION_HREFS_LIST);
const REFERENCE_SECTION_HREFS: ReadonlySet<string> = new Set(
  REFERENCE_SECTION_HREFS_LIST,
);

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
