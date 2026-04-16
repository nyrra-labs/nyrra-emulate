/**
 * Sidebar and mobile-nav source of truth for the Svelte docs site.
 *
 * Supports both upstream-backed pages (single-segment hrefs like /vercel)
 * and local Foundry docs pages (nested hrefs like /foundry/auth/oauth).
 * Nav section hrefs and label overrides come from docs-upstream.
 */
import { PAGE_TITLES } from "./page-titles";
import { allDocsEntries } from "./docs-registry";
import { NAV_LABEL_OVERRIDES, REFERENCE_SECTION_HREFS, TOP_SECTION_HREFS } from "docs-upstream";

export { NAV_LABEL_OVERRIDES, REFERENCE_SECTION_HREFS, TOP_SECTION_HREFS };

export type NavItem = {
  href: string;
  label: string;
  children?: NavItem[];
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

/**
 * Foundry sub-navigation hierarchy. These are local pages that appear
 * as children under the /foundry nav entry.
 */
const FOUNDRY_CHILDREN: NavItem[] = [
  { href: "/foundry/getting-started", label: "Getting Started" },
  {
    href: "/foundry/auth/oauth",
    label: "Auth",
    children: [
      { href: "/foundry/auth/oauth", label: "OAuth 2.0" },
      { href: "/foundry/auth/client-credentials", label: "Client Credentials" },
      { href: "/foundry/auth/refresh-tokens", label: "Refresh Tokens" },
      { href: "/foundry/auth/scopes", label: "Scopes" },
      { href: "/foundry/auth/current-user", label: "Current User" },
    ],
  },
  {
    href: "/foundry/admin/users",
    label: "Admin",
    children: [{ href: "/foundry/admin/users", label: "Users" }],
  },
  {
    href: "/foundry/compute-modules/overview",
    label: "Compute Modules",
    children: [
      { href: "/foundry/compute-modules/overview", label: "Overview" },
      { href: "/foundry/compute-modules/runtimes", label: "Runtimes" },
      { href: "/foundry/compute-modules/jobs", label: "Jobs" },
    ],
  },
  {
    href: "/foundry/reference/seed-config",
    label: "Reference",
    children: [
      { href: "/foundry/reference/seed-config", label: "Seed Config" },
      { href: "/foundry/reference/endpoints", label: "Endpoints" },
      { href: "/foundry/reference/scope-matrix", label: "Scope Matrix" },
    ],
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
  if (title !== undefined) return title;
  // For local pages, look up in the docs registry
  const entry = allDocsEntries.find((e) => e.href === href);
  if (entry) return entry.title;
  throw new Error(
    `nav: href ${JSON.stringify(href)} has no title source. ` +
      `Add it to PAGE_TITLES, docs-registry, or NAV_LABEL_OVERRIDES.`,
  );
}

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
  { hrefs: TOP_SECTION_HREFS },
  { title: "Services", hrefs: SERVICES_SECTION_HREFS },
  { title: "Reference", hrefs: REFERENCE_SECTION_HREFS },
];

function buildNavItem(href: string): NavItem {
  const label = resolveNavLabel(href);
  if (href === "/foundry") {
    return { href, label, children: FOUNDRY_CHILDREN };
  }
  return { href, label };
}

export const sections: NavSection[] = rawSections.map((section) => ({
  title: section.title,
  items: section.hrefs.map(buildNavItem),
}));

export const allItems = sections.flatMap((s) => s.items);

/** Flat list of every nav item including nested children, for page lookups. */
function flattenItems(items: NavItem[]): NavItem[] {
  const result: NavItem[] = [];
  for (const item of items) {
    if (item.children) {
      for (const child of item.children) {
        if (child.children) {
          for (const grandchild of child.children) {
            result.push(grandchild);
          }
        }
        result.push(child);
      }
    }
    result.push(item);
  }
  return result;
}

export const allFlatItems = flattenItems(allItems);
