/**
 * FoundryCI / Nyrra branding constants. Upstream emulate branding
 * lives in upstream-site-metadata.ts.
 */

/** Nyrra (FoundryCI parent organization) homepage URL. */
export const NYRRA_URL = "https://nyrra.ai";

/** Shared local Nyrra logo asset used in the header and browser tab icon. */
export const NYRRA_LOGO_PATH = "/nyrra-logo-5-colors.svg";

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
