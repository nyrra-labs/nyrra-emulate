/**
 * Site-wide metadata constants shared by `app/layout.tsx` (the root
 * layout's hand-written `Metadata` literal) and `lib/page-metadata.ts`
 * (the per-slug `pageMetadata(slug)` composer consumed by every non-
 * root `app/<slug>/layout.tsx`). Centralizing the shared literals here
 * keeps the brand name, site URL, title template, OG dimensions, and
 * openGraph / Twitter fixed fields from drifting between the two
 * surfaces.
 *
 * Two intentional divergences between the root and non-root surfaces
 * are preserved as explicitly-separated constants rather than unified:
 *
 *   1. `ROOT_SITE_DESCRIPTION` ends with the load-bearing "Not mocks."
 *      emphasis that the non-root `PAGE_SITE_DESCRIPTION` drops. The
 *      divergence predates this refactor and applies to different
 *      rendered surfaces — the root "/" URL's description and social
 *      cards vs every non-root docs page's description and social
 *      cards. Unifying would be a visible copy change that belongs
 *      in a separate copy-review slice.
 *
 *   2. `ROOT_DEFAULT_TITLE` uses an ampersand ("CI & Sandboxes") while
 *      the root marketing hero in `PAGE_TITLE_OVERRIDES[""]` (see
 *      `page-titles.ts`) uses the word "and" ("CI and Sandboxes").
 *      The ampersand form is compact for the HTML <title> tag at "/";
 *      the word form is used by the OG image renderer which stacks
 *      the hero into two visible lines. These are different surfaces
 *      with different affordances, not a drift.
 *
 * The two helper functions at the bottom (`suffixWithSiteName`,
 * `ogImageAlt`) centralize the exact " | emulate" / " - emulate"
 * suffix patterns so a future rebrand would only touch this file.
 */

/** Brand name shown in titles, site name, and alt text suffixes. */
export const SITE_NAME = "emulate";

/** Deployed site origin, used for metadataBase and openGraph.url. */
export const SITE_URL = "https://emulate.dev";

/**
 * HTML `<title>` tag shown when the user visits the site root "/".
 * Uses a compact "&" glyph for the ampersand because it renders
 * directly in the browser title bar without going through any of the
 * `pageMetadata` display-title collapses. The non-root marketing hero
 * in `PAGE_TITLE_OVERRIDES[""]` uses the word "and" instead because
 * it's stacked across two lines in the OG image renderer where the
 * glyph form reads less cleanly.
 */
export const ROOT_DEFAULT_TITLE = "emulate | Local API Emulation for CI & Sandboxes";

/**
 * Next.js `title.template` applied to every child segment's
 * `metadata.title`. When `app/foundry/layout.tsx` sets
 * `metadata = pageMetadata("foundry")` which returns `title: "Foundry"`,
 * Next.js interpolates this template to produce the final HTML
 * `<title>` tag `"Foundry | emulate"`. The template only applies to
 * child segments; the root segment's own title uses `ROOT_DEFAULT_TITLE`
 * directly.
 */
export const TITLE_TEMPLATE = "%s | emulate";

/**
 * Full product description used by the root layout's metadata
 * (description + openGraph.description + twitter.description) for
 * the "/" URL. Ends with the load-bearing "Not mocks." emphasis that
 * the non-root per-page description drops — see `PAGE_SITE_DESCRIPTION`.
 */
export const ROOT_SITE_DESCRIPTION =
  "Local drop-in replacement services for CI and no-network sandboxes. " +
  "Fully stateful, production-fidelity API emulation. Not mocks.";

/**
 * Shorter per-page description used by `pageMetadata(slug)` for every
 * non-root docs page. Drops the trailing "Not mocks." emphasis that
 * the root description carries. This divergence predates the current
 * refactor and applies to different rendered surfaces; unifying it
 * would change visible social-preview copy on every non-root docs
 * page and belongs in a separate copy-review slice rather than this
 * source-of-truth cleanup.
 */
export const PAGE_SITE_DESCRIPTION =
  "Local drop-in replacement services for CI and no-network sandboxes. " +
  "Fully stateful, production-fidelity API emulation.";

/** OG image width used by every page's `openGraph.images` entry. */
export const OG_IMAGE_WIDTH = 1200;

/** OG image height used by every page's `openGraph.images` entry. */
export const OG_IMAGE_HEIGHT = 630;

/** OG image URL for the root "/" page. */
export const ROOT_OG_IMAGE_URL = "/og";

/** Open-graph type applied to every docs page. */
export const OG_TYPE = "website" as const;

/** Open-graph locale applied to every docs page. */
export const OG_LOCALE = "en_US";

/** Twitter card type applied to every docs page. */
export const TWITTER_CARD = "summary_large_image" as const;

/**
 * Canonical GitHub repository URL for emulate. Used by the docs-site
 * header's GitHub icon link and by any other surface that wants to
 * deep-link to the upstream repo. Kept here so a future repo move
 * (e.g. org rename, fork promotion) only needs one edit.
 */
export const GITHUB_REPO_URL = "https://github.com/vercel-labs/emulate";

/**
 * Canonical npm package URL for emulate. Used by the docs-site
 * header's "npm" link. Kept here so a future package rename or scope
 * change only needs one edit.
 */
export const NPM_PACKAGE_URL = "https://www.npmjs.com/package/emulate";

/**
 * Parent-company attribution URL shown in the docs-site header next
 * to the parent-brand icon. The companion `VERCEL_ATTRIBUTION_TITLE`
 * constant carries the accompanying hover tooltip text; both are
 * kept here as a pair so a future rebrand or attribution-policy
 * change touches exactly one file.
 */
export const VERCEL_ATTRIBUTION_URL = "https://vercel.com";

/**
 * Hover-tooltip text for the parent-company attribution link in the
 * docs-site header. See `VERCEL_ATTRIBUTION_URL`.
 */
export const VERCEL_ATTRIBUTION_TITLE = "Made with love by Vercel";

/**
 * Suffixes a short page title with " | emulate". Used by
 * `pageMetadata(slug)` to build `openGraph.title` and `twitter.title`
 * strings for every non-root docs page.
 */
export function suffixWithSiteName(shortTitle: string): string {
  return `${shortTitle} | ${SITE_NAME}`;
}

/**
 * Formats the OG image alt text for a given display title. Produces
 * `"<displayTitle> - emulate"`. Used by `pageMetadata(slug)` for every
 * non-root docs page's `openGraph.images[0].alt`.
 */
export function ogImageAlt(displayTitle: string): string {
  return `${displayTitle} - ${SITE_NAME}`;
}
