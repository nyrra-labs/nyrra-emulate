/**
 * Shared docs-nav grouping and label-shortening constants.
 *
 * Both the Next.js docs nav (`apps/web/lib/docs-navigation.ts`) and
 * the Svelte docs nav (`apps/web-svelte/src/lib/nav.ts`) apply the
 * same intentional label-shortening map for the five service pages
 * whose document title is longer than the sidebar nav label reads
 * well (Vercel / GitHub / Google / Slack / Apple), and both apps
 * route the same set of hrefs to the unlabeled top section and the
 * "Reference" section. The override map and the two href sets used
 * to live as parallel hand-written literals in both files; a drift
 * between the two copies would have produced inconsistent nav
 * labels or grouping across the two surfaces with no obvious
 * failure signal.
 *
 * This helper consolidates those three constants into one source of
 * truth. Both consumer files import from here and re-export
 * `NAV_LABEL_OVERRIDES` (for backwards compat with existing test
 * imports). The Services section is DELIBERATELY not represented
 * here because the two apps intentionally differ on service
 * ordering: the Next.js docs nav follows `allDocsPages` source
 * order (Foundry sits between Microsoft and AWS), while the Svelte
 * FoundryCI-branded docs nav puts Foundry first in the Services
 * section to reflect the FoundryCI-first positioning. Each app
 * supplies its own ordered services list locally.
 *
 * The label resolver is ALSO deliberately not represented here
 * because the two apps have different fallback sources: the Next.js
 * nav falls back to `allDocsPages.name`, while the Svelte nav falls
 * back to its own local `PAGE_TITLES[slug]` (which overrides the
 * root to "Overview" — a FoundryCI-specific root label that is NOT
 * shared with the Next.js "Getting Started" value). Sharing only
 * the override map keeps the override-lookup step consistent
 * across the two surfaces while letting each side keep its own
 * fallback chain.
 */

/**
 * Sidebar/mobile-nav label-shortening map for the five service
 * pages whose canonical document title is longer than what fits
 * naturally in the narrow sidebar column. The sidebar's "Services"
 * section header already implies "API", so the short brand form
 * reads better there.
 *
 * Every key is a full href (with leading slash). Adding a new entry
 * requires a matching page in the consuming app's page registry
 * (apps/web's `allDocsPages` or apps/web-svelte's `PAGE_TITLES`);
 * both consumer files' module-init coverage guards throw if an
 * override key is stale. Keep this map small and obvious — the
 * default should always be the canonical document title.
 */
export const NAV_LABEL_OVERRIDES: Readonly<Record<string, string>> = {
  "/vercel": "Vercel", // canonical title: "Vercel API"
  "/github": "GitHub", // canonical title: "GitHub API"
  "/google": "Google", // canonical title: "Google API"
  "/slack": "Slack", // canonical title: "Slack API"
  "/apple": "Apple", // canonical title: "Apple Sign In"
};

/**
 * Hrefs that belong in the unlabeled top section of the sidebar
 * (first-party onboarding: the root, Programmatic API,
 * Configuration, Next.js Integration). Explicit rather than derived
 * because this is a deliberate IA decision shared between the two
 * apps. Order within the section is preserved by iteration order
 * when consumers walk this array.
 */
export const TOP_SECTION_HREFS: readonly string[] = [
  "/",
  "/programmatic-api",
  "/configuration",
  "/nextjs",
];

/**
 * Hrefs that belong in the "Reference" section (Authentication,
 * Architecture). Same rationale as `TOP_SECTION_HREFS`: explicit
 * classification because this is a deliberate IA decision shared
 * between the two apps.
 */
export const REFERENCE_SECTION_HREFS: readonly string[] = [
  "/authentication",
  "/architecture",
];
