/**
 * Per-page metadata for the Svelte docs site.
 *
 * Returns fully resolved metadata (title, description, OG, Twitter) for
 * any docs page. SvelteKit has no title.template, so non-root titles are
 * pre-expanded with the " | emulate" suffix. Root and foundry/* pages get
 * FoundryCI-branded metadata. All pages share a static OG image.
 */
import { PAGE_TITLES } from "./page-titles";
import { docsEntryByHref } from "./docs-registry";
import { FOUNDRYCI_SITE_NAME } from "./foundryci-branding";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  OG_LOCALE,
  OG_TYPE,
  PAGE_SITE_DESCRIPTION,
  SITE_NAME,
  TWITTER_CARD,
  ogImageAlt,
  suffixWithSiteName,
} from "./upstream-site-metadata";

const BASE_URL = "https://foundryci.com";
const OG_IMAGE_PATH = "/og-default.png";
const OG_IMAGE_URL = `${BASE_URL}${OG_IMAGE_PATH}`;

/**
 * Root page title, description, and site name. The Svelte shell is
 * branded as FoundryCI by Nyrra, so the root metadata diverges from the
 * upstream `apps/web` values: the document `<title>` and OG title both
 * lead with the FoundryCI brand, the description names FoundryCI as a
 * Nyrra project while preserving explicit upstream credit to emulate
 * by Vercel Labs, and the OG site name matches the brand the visible
 * header shows. Non-root pages still expand into `${displayTitle} |
 * emulate` via `SITE_NAME` so per-service titles stay aligned with the
 * upstream Next.js docs.
 */
const ROOT_TITLE = `${FOUNDRYCI_SITE_NAME} | Local Foundry Emulation`;
const ROOT_DESCRIPTION =
  "Local Palantir Foundry emulation for CI and no-network sandboxes. FoundryCI is a Nyrra project built on emulate by Vercel Labs. Not mocks.";
const ROOT_SITE_NAME = FOUNDRYCI_SITE_NAME;

/**
 * Per-page FoundryCI metadata overrides. Pages keyed in this map opt out of
 * the generic `${displayTitle} | emulate` upstream-mirroring path and instead
 * ship FoundryCI-branded title/description/siteName/OG-image-alt that match
 * the root metadata's FoundryCI by Nyrra positioning. Other non-root pages
 * (vercel, github, google, ...) still expand into the generic suffix via
 * `SITE_NAME` so per-service titles stay aligned with the upstream Next.js
 * docs and the search index continues to mirror the upstream display names.
 *
 * Add an entry here only when a page is FoundryCI-critical enough to deserve
 * brand-leading metadata. Today that is `/foundry` (the actual Foundry docs)
 * and `/configuration` (the seed config reference, which leads with Foundry
 * users / OAuth clients / runtimes even though it also covers the supporting
 * emulate base layer).
 */
const FOUNDRYCI_PAGE_METADATA: Record<string, { title: string; description: string }> = {
  foundry: {
    title: `Foundry | ${FOUNDRYCI_SITE_NAME}`,
    description:
      "Local Palantir Foundry emulation: OAuth 2.0, current-user lookup, and compute-module runtime. FoundryCI by Nyrra, built on emulate by Vercel Labs.",
  },
  configuration: {
    title: `Configuration | ${FOUNDRYCI_SITE_NAME}`,
    description:
      "Seed config for FoundryCI: Foundry users, OAuth clients, runtimes, and the supporting emulate services. By Nyrra, built on emulate by Vercel Labs.",
  },
};

export type PageMetadata = {
  title: string;
  description: string;
  openGraph: {
    type: typeof OG_TYPE;
    locale: typeof OG_LOCALE;
    siteName: string;
    title: string;
    description: string;
    url: string;
    image: {
      url: string;
      width: typeof OG_IMAGE_WIDTH;
      height: typeof OG_IMAGE_HEIGHT;
      alt: string;
    };
  };
  twitter: {
    card: typeof TWITTER_CARD;
    title: string;
    description: string;
    image: string;
  };
};

export function pageMetadata(slug: string): PageMetadata | null {
  if (slug === "") {
    // Root page: render the layout default values verbatim. apps/web's
    // `openGraph.url` for the root has no trailing slash, so we mirror
    // that exactly. The OG image is the shared static social card.
    return {
      title: ROOT_TITLE,
      description: ROOT_DESCRIPTION,
      openGraph: {
        type: OG_TYPE,
        locale: OG_LOCALE,
        siteName: ROOT_SITE_NAME,
        title: ROOT_TITLE,
        description: ROOT_DESCRIPTION,
        url: BASE_URL,
        image: {
          url: OG_IMAGE_URL,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: ROOT_SITE_NAME,
        },
      },
      twitter: {
        card: TWITTER_CARD,
        title: ROOT_TITLE,
        description: ROOT_DESCRIPTION,
        image: OG_IMAGE_URL,
      },
    };
  }

  // Look up title from upstream PAGE_TITLES first, then docs registry
  let title = PAGE_TITLES[slug];
  if (title === undefined) {
    const href = `/${slug}`;
    const entry = docsEntryByHref.get(href);
    if (!entry) return null;
    title = entry.title;
  }

  const displayTitle = title.replace(/\n/g, " ");
  const url = `${BASE_URL}/${slug}`;

  // All foundry/* pages get FoundryCI-branded metadata
  const isFoundryPage = slug === "foundry" || slug.startsWith("foundry/");
  const foundryciOverride = FOUNDRYCI_PAGE_METADATA[slug];
  if (foundryciOverride !== undefined || (isFoundryPage && !foundryciOverride)) {
    // FoundryCI-critical page: lead with the FoundryCI brand in every
    // metadata surface. The OG image alt text uses the bare displayTitle
    // plus the FoundryCI site name so screen readers describe the card
    // as "<page> - FoundryCI by Nyrra" rather than "<page> - emulate".
    const defaultFoundryMeta = {
      title: `${displayTitle} | ${FOUNDRYCI_SITE_NAME}`,
      description: `${displayTitle} for FoundryCI. Local Palantir Foundry emulation by Nyrra, built on emulate by Vercel Labs.`,
    };
    const { title: foundryTitle, description: foundryDescription } = foundryciOverride ?? defaultFoundryMeta;
    return {
      title: foundryTitle,
      description: foundryDescription,
      openGraph: {
        type: OG_TYPE,
        locale: OG_LOCALE,
        siteName: ROOT_SITE_NAME,
        title: foundryTitle,
        description: foundryDescription,
        url,
        image: {
          url: OG_IMAGE_URL,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: `${displayTitle} - ${ROOT_SITE_NAME}`,
        },
      },
      twitter: {
        card: TWITTER_CARD,
        title: foundryTitle,
        description: foundryDescription,
        image: OG_IMAGE_URL,
      },
    };
  }

  // Pre-expand the apps/web title.template = "%s | emulate" so the rendered
  // document <title> matches what Next.js produces (e.g.
  // "Programmatic API | emulate"), not the bare displayTitle.
  const fullTitle = suffixWithSiteName(displayTitle);

  return {
    title: fullTitle,
    description: PAGE_SITE_DESCRIPTION,
    openGraph: {
      type: OG_TYPE,
      locale: OG_LOCALE,
      siteName: SITE_NAME,
      title: fullTitle,
      description: PAGE_SITE_DESCRIPTION,
      url,
      image: {
        url: OG_IMAGE_URL,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: ogImageAlt(displayTitle),
      },
    },
    twitter: {
      card: TWITTER_CARD,
      title: fullTitle,
      description: PAGE_SITE_DESCRIPTION,
      image: OG_IMAGE_URL,
    },
  };
}

/**
 * Convenience helper that resolves a SvelteKit `page.url.pathname` to a
 * `PageMetadata` instance, or `null` if the route is not in `PAGE_TITLES`.
 */
export function pageMetadataForPathname(pathname: string): PageMetadata | null {
  const slug = pathname === "/" ? "" : pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  return pageMetadata(slug);
}
