/**
 * Svelte-local FoundryCI / Nyrra branding constants.
 *
 * The Svelte docs site is FoundryCI-branded and carries a small set
 * of FoundryCI / Nyrra brand literals (the product wordmark, the
 * "by Nyrra" attribution text, the full "FoundryCI by Nyrra" site
 * name, and the Nyrra homepage URL) that previously appeared as
 * duplicated hand-written literals across `page-metadata.ts`,
 * `components/Header.svelte`, and `routes/+layout.svelte`. This
 * helper consolidates them in one file so a future rebrand (or an
 * org rename) touches one constant per brand element instead of
 * chasing literals across four files.
 *
 * This helper is STRICTLY for Svelte-local FoundryCI / Nyrra brand
 * facts. Upstream emulate branding (SITE_NAME, GITHUB_REPO_URL,
 * NPM_PACKAGE_URL, page description, OG/Twitter fixed fields, etc.)
 * lives in `./upstream-site-metadata.ts` which re-exports from
 * `apps/web/lib/site-metadata.ts`. The two helpers are kept separate
 * so the upstream coupling stays explicit: a future upstream rebrand
 * touches `upstream-site-metadata.ts`, a future FoundryCI rebrand
 * touches this file, and neither crosses into the other.
 *
 * Editorial copy (root marketing hero descriptions, FoundryCI per-
 * page description prose in `page-metadata.ts`'s
 * `FOUNDRYCI_PAGE_METADATA`, the "emulate by Vercel Labs" footer
 * attribution label) intentionally stays hand-written because it
 * represents deliberate framing, not drift-prone branding constants.
 */

/** Nyrra (FoundryCI parent organization) homepage URL. */
export const NYRRA_URL = "https://nyrra.ai";

/**
 * Bare FoundryCI product name. Used for the Header wordmark span,
 * the Header "home" aria-label, and as a building block for the
 * compound `FOUNDRYCI_SITE_NAME` below.
 */
export const FOUNDRYCI_BRAND = "FoundryCI";

/**
 * Bare Nyrra parent-organization display name. Used as visible
 * attribution text in the Header ("by Nyrra") and the layout
 * footer ("A Nyrra project"), and as a building block for the
 * compound `FOUNDRYCI_SITE_NAME` below.
 */
export const NYRRA_PARENT_LABEL = "Nyrra";

/**
 * Full "FoundryCI by Nyrra" site name. Used as the root metadata
 * `openGraph.siteName`, as the root HTML `<title>` prefix, and as
 * the suffix for FoundryCI-branded per-page titles
 * (Foundry, Configuration). Computed from `FOUNDRYCI_BRAND` and
 * `NYRRA_PARENT_LABEL` so a future rename of either bare constant
 * cascades through the compound form automatically.
 */
export const FOUNDRYCI_SITE_NAME = `${FOUNDRYCI_BRAND} by ${NYRRA_PARENT_LABEL}`;
