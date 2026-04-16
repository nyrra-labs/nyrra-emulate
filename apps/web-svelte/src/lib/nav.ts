/**
 * Sidebar and mobile-nav source of truth for the Svelte docs site.
 *
 * `sections` is the ordered list of nav groupings. Each entry's visible
 * label is resolved from `PAGE_TITLES` by default, with overrides from
 * `NAV_LABEL_OVERRIDES` for service pages whose nav label is shorter
 * than the document title. Nav section hrefs and label overrides come
 * from the docs-upstream generated package.
 */
import { PAGE_TITLES } from "./page-titles";
import {
  NAV_LABEL_OVERRIDES,
  REFERENCE_SECTION_HREFS,
  TOP_SECTION_HREFS,
} from "docs-upstream";

export { NAV_LABEL_OVERRIDES, REFERENCE_SECTION_HREFS, TOP_SECTION_HREFS };

export type NavSection = {
  title?: string;
  items: { href: string; label: string }[];
};

/**
 * Implemented pages that intentionally do not appear in the nav.
 * Every entry must be a slug that exists in `PAGE_TITLES`.
 */
const INTENTIONALLY_HIDDEN: ReadonlySet<string> = new Set<string>();

/**
 * Svelte-local services section ordering. FoundryCI-first, not derived
 * from the upstream registry's source order.
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
        `NAV_LABEL_OVERRIDES entry. Add the slug to page-titles.ts before linking.`,
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

for (const overrideHref of Object.keys(NAV_LABEL_OVERRIDES)) {
  if (!visibleHrefs.has(overrideHref)) {
    throw new Error(
      `nav: NAV_LABEL_OVERRIDES has an entry for ${JSON.stringify(overrideHref)} ` +
        `that is not visible in any nav section.`,
    );
  }
  const overrideSlug = hrefToSlug(overrideHref);
  if (!(overrideSlug in PAGE_TITLES)) {
    throw new Error(
      `nav: NAV_LABEL_OVERRIDES has an entry for ${JSON.stringify(overrideHref)} ` +
        `whose slug ${JSON.stringify(overrideSlug)} is not in PAGE_TITLES.`,
    );
  }
}

for (const slug of Object.keys(PAGE_TITLES)) {
  if (!visibleSlugs.has(slug) && !INTENTIONALLY_HIDDEN.has(slug)) {
    const display = slug === "" ? "/" : `/${slug}`;
    throw new Error(
      `nav: PAGE_TITLES entry ${JSON.stringify(display)} is neither visible in ` +
        `sections nor listed in INTENTIONALLY_HIDDEN.`,
    );
  }
}

for (const slug of INTENTIONALLY_HIDDEN) {
  if (!(slug in PAGE_TITLES)) {
    const display = slug === "" ? "/" : `/${slug}`;
    throw new Error(
      `nav: INTENTIONALLY_HIDDEN entry ${JSON.stringify(display)} has no ` +
        `PAGE_TITLES entry.`,
    );
  }
}
