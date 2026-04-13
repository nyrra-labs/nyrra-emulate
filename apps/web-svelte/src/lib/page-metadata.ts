/**
 * Per-page metadata for the Svelte docs site.
 *
 * The apps/web Next.js docs use a two-layer metadata model that this file
 * recreates manually because SvelteKit has no equivalent of Next's metadata
 * merging or `title.template` machinery:
 *
 *   1. The root layout (apps/web/app/layout.tsx) defines a default Metadata
 *      with `title.default = "emulate | Local API Emulation for CI & Sandboxes"`,
 *      a long description that includes "Not mocks.", and Open Graph / Twitter
 *      values that mirror the default. The root URL `/` has no per-page
 *      layout.tsx, so it renders the layout default verbatim.
 *
 *   2. Every non-root page (e.g. apps/web/app/programmatic-api/layout.tsx) is
 *      a thin wrapper that exports `metadata = pageMetadata(slug)`. The
 *      apps/web `pageMetadata()` returns `{ title: displayTitle, description,
 *      openGraph: { title: fullTitle }, twitter: { title: fullTitle } }`.
 *      Next.js then applies the parent layout's `title.template = "%s | emulate"`
 *      to expand the bare `displayTitle` into `<page> | emulate` for the
 *      rendered <title> tag, while the OG/Twitter titles already contain the
 *      full suffix.
 *
 * SvelteKit has no template machinery, so this function pre-expands the
 * suffix into the `title` field for non-root pages. The root branch returns
 * the layout-default values directly. The single function therefore returns
 * a fully resolved metadata object that PageMeta.svelte can drop straight
 * into <svelte:head>.
 *
 * One intentional difference from the apps/web port: adds an explicit
 * `og:url` field. apps/web's non-root pages get their og:url from Next.js's
 * `metadataBase` auto-resolution; SvelteKit has no equivalent so we compute
 * the absolute canonical URL inline.
 *
 * Open Graph and Twitter image URLs point at a single static social card at
 * `apps/web-svelte/static/og-default.png`. Every page shares the same image.
 * The dynamic satori + @resvg/resvg-js renderer that apps/web uses is not
 * compatible with the Cloudflare Workers runtime this app deploys to, so the
 * static fallback is the deployment-foundation simplification: one PNG,
 * served as a plain static asset, no runtime font reads, no Node-only image
 * pipeline. If per-page social cards are reintroduced later, the apps/web
 * Next.js site remains the authoritative source of the dynamic layout.
 */
import { PAGE_TITLES } from "./page-titles";

const SITE_NAME = "emulate";
const BASE_URL = "https://emulate.dev";
const OG_IMAGE_PATH = "/og-default.png";
const OG_IMAGE_URL = `${BASE_URL}${OG_IMAGE_PATH}`;

/**
 * Root page title and description. Mirrors `apps/web/app/layout.tsx` exactly,
 * including the literal `&` (not "and") in "CI & Sandboxes" and the trailing
 * "Not mocks." sentence in the description.
 */
const ROOT_TITLE = "emulate | Local API Emulation for CI & Sandboxes";
const ROOT_DESCRIPTION =
  "Local drop-in replacement services for CI and no-network sandboxes. Fully stateful, production-fidelity API emulation. Not mocks.";

/**
 * Description for every non-root page. Mirrors `apps/web/lib/page-metadata.ts`
 * exactly. Note that this string does NOT include the "Not mocks." sentence
 * — apps/web intentionally varies the description between the layout default
 * (root) and the per-page metadata (non-root).
 */
const PAGE_DESCRIPTION =
  "Local drop-in replacement services for CI and no-network sandboxes. Fully stateful, production-fidelity API emulation.";

export type PageMetadata = {
  title: string;
  description: string;
  openGraph: {
    type: "website";
    locale: "en_US";
    siteName: string;
    title: string;
    description: string;
    url: string;
    image: {
      url: string;
      width: 1200;
      height: 630;
      alt: string;
    };
  };
  twitter: {
    card: "summary_large_image";
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
        type: "website",
        locale: "en_US",
        siteName: SITE_NAME,
        title: ROOT_TITLE,
        description: ROOT_DESCRIPTION,
        url: BASE_URL,
        image: {
          url: OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: "emulate",
        },
      },
      twitter: {
        card: "summary_large_image",
        title: ROOT_TITLE,
        description: ROOT_DESCRIPTION,
        image: OG_IMAGE_URL,
      },
    };
  }

  const title = PAGE_TITLES[slug];
  if (title === undefined) return null;

  const displayTitle = title.replace(/\n/g, " ");
  // Pre-expand the apps/web title.template = "%s | emulate" so the rendered
  // document <title> matches what Next.js produces (e.g.
  // "Programmatic API | emulate"), not the bare displayTitle.
  const fullTitle = `${displayTitle} | ${SITE_NAME}`;
  const url = `${BASE_URL}/${slug}`;

  return {
    title: fullTitle,
    description: PAGE_DESCRIPTION,
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE_NAME,
      title: fullTitle,
      description: PAGE_DESCRIPTION,
      url,
      image: {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: `${displayTitle} - ${SITE_NAME}`,
      },
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: PAGE_DESCRIPTION,
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
