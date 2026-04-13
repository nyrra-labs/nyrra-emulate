import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { allDocsPages } from "../docs-pages";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// apps/web/lib/__tests__ → repo root is 4 levels up.
const REPO_ROOT = resolve(__dirname, "../../../..");
const APPS_WEB_APP = resolve(REPO_ROOT, "apps/web/app");

/**
 * Non-docs Next.js route directories under `apps/web/app/` that are
 * not expected to have a corresponding `allDocsPages` entry. These
 * are dynamic API / OG image routes that serve non-MDX content.
 * Every other directory under `app/` MUST map to an `allDocsPages`
 * non-root entry.
 */
const NON_DOCS_APP_DIRS: ReadonlySet<string> = new Set(["api", "og"]);

function hrefToSlug(href: string): string {
  return href === "/" ? "" : href.replace(/^\//, "");
}

describe("app/ route tree covers every allDocsPages entry", () => {
  it("app/page.mdx exists for the root '/' entry", () => {
    const rootPage = resolve(APPS_WEB_APP, "page.mdx");
    expect(existsSync(rootPage)).toBe(true);
  });

  it("every non-root allDocsPages entry has app/<slug>/page.mdx on disk", () => {
    for (const page of allDocsPages) {
      if (page.href === "/") continue;
      const slug = hrefToSlug(page.href);
      const mdxPath = resolve(APPS_WEB_APP, slug, "page.mdx");
      expect(
        existsSync(mdxPath),
        `expected app/${slug}/page.mdx to exist for allDocsPages entry "${page.name}" (${page.href})`,
      ).toBe(true);
    }
  });

  it("every non-root page.mdx file is non-empty (no stub file regression)", () => {
    for (const page of allDocsPages) {
      if (page.href === "/") continue;
      const slug = hrefToSlug(page.href);
      const mdxPath = resolve(APPS_WEB_APP, slug, "page.mdx");
      const content = readFileSync(mdxPath, "utf-8");
      expect(
        content.trim().length,
        `app/${slug}/page.mdx is empty or whitespace-only`,
      ).toBeGreaterThan(0);
    }
  });
});

describe("every non-root layout.tsx delegates metadata via pageMetadata('slug')", () => {
  it("every non-root allDocsPages entry has app/<slug>/layout.tsx on disk", () => {
    for (const page of allDocsPages) {
      if (page.href === "/") continue;
      const slug = hrefToSlug(page.href);
      const layoutPath = resolve(APPS_WEB_APP, slug, "layout.tsx");
      expect(
        existsSync(layoutPath),
        `expected app/${slug}/layout.tsx to exist for allDocsPages entry "${page.name}" (${page.href})`,
      ).toBe(true);
    }
  });

  it("every non-root layout.tsx imports pageMetadata from @/lib/page-metadata", () => {
    for (const page of allDocsPages) {
      if (page.href === "/") continue;
      const slug = hrefToSlug(page.href);
      const layoutPath = resolve(APPS_WEB_APP, slug, "layout.tsx");
      const src = readFileSync(layoutPath, "utf-8");
      expect(
        src.includes('import { pageMetadata } from "@/lib/page-metadata"'),
        `app/${slug}/layout.tsx does not import pageMetadata from @/lib/page-metadata`,
      ).toBe(true);
    }
  });

  it("every non-root layout.tsx exports metadata = pageMetadata(\"<slug>\") with the matching slug", () => {
    for (const page of allDocsPages) {
      if (page.href === "/") continue;
      const slug = hrefToSlug(page.href);
      const layoutPath = resolve(APPS_WEB_APP, slug, "layout.tsx");
      const src = readFileSync(layoutPath, "utf-8");
      const expectedCall = `export const metadata = pageMetadata("${slug}")`;
      expect(
        src.includes(expectedCall),
        `app/${slug}/layout.tsx does not export metadata via ${expectedCall}`,
      ).toBe(true);
    }
  });

  it("no non-root layout.tsx uses a literal Metadata object (drift guard against bypass of pageMetadata)", () => {
    for (const page of allDocsPages) {
      if (page.href === "/") continue;
      const slug = hrefToSlug(page.href);
      const layoutPath = resolve(APPS_WEB_APP, slug, "layout.tsx");
      const src = readFileSync(layoutPath, "utf-8");
      // A literal Metadata export would look like `export const metadata: Metadata = {`
      // or `export const metadata = { title: ... }`. Neither should exist
      // in a non-root layout: the pageMetadata call is the only source.
      expect(src).not.toMatch(/export\s+const\s+metadata\s*:\s*Metadata\s*=/);
      expect(src).not.toMatch(/export\s+const\s+metadata\s*=\s*\{/);
    }
  });

  it("every non-root layout.tsx default-exports a Layout component that passes children through", () => {
    for (const page of allDocsPages) {
      if (page.href === "/") continue;
      const slug = hrefToSlug(page.href);
      const layoutPath = resolve(APPS_WEB_APP, slug, "layout.tsx");
      const src = readFileSync(layoutPath, "utf-8");
      expect(src).toMatch(/export default function Layout/);
      expect(src).toContain("return children");
    }
  });

  it("every non-root layout.tsx is short (no page-specific logic creeping in)", () => {
    // The canonical per-slug layout is 8 lines. A layout that grew
    // significantly beyond that likely picked up page-specific logic
    // that belongs in the page.mdx or in a shared component, not in
    // the metadata shim. Flag anything over 20 lines as suspicious.
    for (const page of allDocsPages) {
      if (page.href === "/") continue;
      const slug = hrefToSlug(page.href);
      const layoutPath = resolve(APPS_WEB_APP, slug, "layout.tsx");
      const src = readFileSync(layoutPath, "utf-8");
      const lineCount = src.split("\n").length;
      expect(
        lineCount,
        `app/${slug}/layout.tsx has ${lineCount} lines (expected ≤ 20 for a metadata-only shim)`,
      ).toBeLessThanOrEqual(20);
    }
  });
});

describe("root special case: app/layout.tsx carries the shared template, not a per-slug mirror", () => {
  it("app/layout.tsx exists (the root layout)", () => {
    expect(existsSync(resolve(APPS_WEB_APP, "layout.tsx"))).toBe(true);
  });

  it("app/page.mdx exists (the root page)", () => {
    expect(existsSync(resolve(APPS_WEB_APP, "page.mdx"))).toBe(true);
  });

  it("app/layout.tsx does NOT import pageMetadata (the root uses a hand-written Metadata literal + title template, not the derivation chain)", () => {
    const src = readFileSync(resolve(APPS_WEB_APP, "layout.tsx"), "utf-8");
    expect(src).not.toContain('from "@/lib/page-metadata"');
    expect(src).not.toContain("pageMetadata");
  });

  it("app/layout.tsx derives the title template from the shared TITLE_TEMPLATE constant", () => {
    const src = readFileSync(resolve(APPS_WEB_APP, "layout.tsx"), "utf-8");
    // After the site-metadata extraction the template literal lives
    // in `site-metadata.ts`; the root layout just references the
    // constant by name. The value assertion (that TITLE_TEMPLATE
    // equals "%s | emulate") is pinned by `site-metadata-web.test.ts`.
    expect(src).toContain('from "@/lib/site-metadata"');
    expect(src).toMatch(/template:\s*TITLE_TEMPLATE/);
  });

  it("app/layout.tsx derives the root title.default from the shared ROOT_DEFAULT_TITLE constant", () => {
    const src = readFileSync(resolve(APPS_WEB_APP, "layout.tsx"), "utf-8");
    // Next.js does NOT apply the title template to the root segment's
    // own metadata — the template only applies to child segments. So
    // the '/' URL needs an explicit default title, which lives in
    // `site-metadata.ts` as `ROOT_DEFAULT_TITLE` and is imported here
    // by name.
    expect(src).toMatch(/default:\s*ROOT_DEFAULT_TITLE/);
  });

  it("there is no app/<root>/layout.tsx mirror of the non-root per-slug pattern", () => {
    // Root handling lives at app/layout.tsx, not at a per-slug mirror.
    // Guard against a future refactor that tries to apply the non-root
    // `pageMetadata("slug")` pattern to the root.
    for (const candidate of ["root", "index", "_root", "_index", ""]) {
      if (!candidate) continue;
      const mirrorLayout = resolve(APPS_WEB_APP, candidate, "layout.tsx");
      expect(
        existsSync(mirrorLayout),
        `unexpected root mirror: app/${candidate}/layout.tsx exists`,
      ).toBe(false);
    }
  });

  it("app/page.mdx does not export its own metadata (root metadata lives exclusively in app/layout.tsx)", () => {
    const src = readFileSync(resolve(APPS_WEB_APP, "page.mdx"), "utf-8");
    expect(src).not.toMatch(/^export\s+const\s+metadata\b/m);
  });

  it("no non-root page.mdx exports its own metadata (every non-root metadata comes from its sibling layout.tsx)", () => {
    for (const page of allDocsPages) {
      if (page.href === "/") continue;
      const slug = hrefToSlug(page.href);
      const mdxPath = resolve(APPS_WEB_APP, slug, "page.mdx");
      const src = readFileSync(mdxPath, "utf-8");
      expect(
        src.match(/^export\s+const\s+metadata\b/m),
        `app/${slug}/page.mdx unexpectedly exports its own metadata (should be handled by sibling layout.tsx)`,
      ).toBeNull();
    }
  });
});

describe("app/ directory bidirectional coverage (no orphan routes in either direction)", () => {
  it("every app/<X>/page.mdx on disk corresponds to an allDocsPages entry (or is a known non-docs dir)", () => {
    const entries = readdirSync(APPS_WEB_APP, { withFileTypes: true });
    const registrySlugs = new Set(
      allDocsPages.filter((p) => p.href !== "/").map((p) => hrefToSlug(p.href)),
    );

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (NON_DOCS_APP_DIRS.has(entry.name)) continue;
      const pageMdx = resolve(APPS_WEB_APP, entry.name, "page.mdx");
      if (!existsSync(pageMdx)) continue;
      expect(
        registrySlugs.has(entry.name),
        `app/${entry.name}/page.mdx exists on disk but has no allDocsPages entry (orphan docs route)`,
      ).toBe(true);
    }
  });

  it("every app/<X>/layout.tsx on disk corresponds to an allDocsPages entry (or is a known non-docs dir)", () => {
    const entries = readdirSync(APPS_WEB_APP, { withFileTypes: true });
    const registrySlugs = new Set(
      allDocsPages.filter((p) => p.href !== "/").map((p) => hrefToSlug(p.href)),
    );

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (NON_DOCS_APP_DIRS.has(entry.name)) continue;
      const layoutTsx = resolve(APPS_WEB_APP, entry.name, "layout.tsx");
      if (!existsSync(layoutTsx)) continue;
      expect(
        registrySlugs.has(entry.name),
        `app/${entry.name}/layout.tsx exists on disk but has no allDocsPages entry (orphan layout)`,
      ).toBe(true);
    }
  });

  it("every app/ subdirectory is either an allDocsPages slug or in the NON_DOCS_APP_DIRS allowlist", () => {
    const entries = readdirSync(APPS_WEB_APP, { withFileTypes: true });
    const registrySlugs = new Set(
      allDocsPages.filter((p) => p.href !== "/").map((p) => hrefToSlug(p.href)),
    );

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const inRegistry = registrySlugs.has(entry.name);
      const inAllowlist = NON_DOCS_APP_DIRS.has(entry.name);
      expect(
        inRegistry || inAllowlist,
        `app/${entry.name} is neither an allDocsPages slug nor in NON_DOCS_APP_DIRS ("api", "og"). ` +
          `Either add it to allDocsPages or extend the non-docs allowlist in docs-route-tree-web.test.ts.`,
      ).toBe(true);
    }
  });

  it("the app/ directory contains exactly allDocsPages non-root count + NON_DOCS_APP_DIRS count subdirectories", () => {
    const entries = readdirSync(APPS_WEB_APP, { withFileTypes: true });
    const dirCount = entries.filter((e) => e.isDirectory()).length;
    const expectedCount =
      allDocsPages.filter((p) => p.href !== "/").length + NON_DOCS_APP_DIRS.size;
    expect(dirCount).toBe(expectedCount);
  });
});

describe("no second hand-maintained docs route list anywhere in apps/web consumers", () => {
  // Every runtime consumer of the docs page registry should funnel
  // through allDocsPages from `./docs-pages` rather than carry
  // its own parallel slug array. This grep-level guard scans every
  // file that has historically been a candidate for a parallel list
  // and asserts that none of them contain the full docs slug set.
  const GUARDED_FILES: ReadonlyArray<string> = [
    "apps/web/components/docs-nav.tsx",
    "apps/web/components/docs-mobile-nav.tsx",
    "apps/web/lib/page-titles.ts",
    "apps/web/lib/page-metadata.ts",
    "apps/web/lib/search-index.ts",
    "apps/web/lib/docs-files.ts",
    "apps/web/lib/docs-chat-summary.ts",
    "apps/web/app/api/search/route.ts",
    "apps/web/app/api/docs-chat/route.ts",
    "apps/web/app/layout.tsx",
    "apps/web/app/og/route.tsx",
    "apps/web/app/og/[...slug]/route.tsx",
  ];

  const DOCS_SLUG_LITERALS: ReadonlyArray<string> = [
    "/programmatic-api",
    "/configuration",
    "/nextjs",
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
    "/authentication",
    "/architecture",
  ];

  it("no guarded consumer file contains an inline parallel slug array of 3+ docs slugs", () => {
    for (const relPath of GUARDED_FILES) {
      const filePath = resolve(REPO_ROOT, relPath);
      if (!existsSync(filePath)) continue;
      const src = readFileSync(filePath, "utf-8");
      const present = DOCS_SLUG_LITERALS.filter((slug) => src.includes(`"${slug}"`));
      // 3+ slug literals in a single consumer file is the signature
      // of a regression that reintroduced a hand-maintained list.
      // 0-2 is acceptable: a file might legitimately reference a
      // single slug for a targeted assertion (e.g., docs-chat-summary
      // keys on /programmatic-api and /nextjs), but a parallel
      // registry would have far more.
      expect(
        present.length,
        `${relPath} contains ${present.length} docs slug literals (${present.join(", ")}); ` +
          `use allDocsPages from @/lib/docs-pages instead of a parallel list`,
      ).toBeLessThanOrEqual(2);
    }
  });

  it("the canonical allDocsPages in docs-pages.ts is the ONE file carrying every docs slug", () => {
    const pagesSrc = readFileSync(
      resolve(REPO_ROOT, "apps/web/lib/docs-pages.ts"),
      "utf-8",
    );
    for (const slug of DOCS_SLUG_LITERALS) {
      expect(
        pagesSrc.includes(`"${slug}"`),
        `apps/web/lib/docs-pages.ts is missing the canonical "${slug}" entry`,
      ).toBe(true);
    }
  });

  it("docs-pages.ts is the only apps/web consumer file with every docs slug literal", () => {
    // Cross-check: tally how many slug literals each guarded file
    // carries. Only docs-pages.ts should have all 17. Every other
    // file (including docs-navigation.ts, which now imports the
    // registry from docs-pages.ts) should have 0-2.
    const pagesSrc = readFileSync(
      resolve(REPO_ROOT, "apps/web/lib/docs-pages.ts"),
      "utf-8",
    );
    const pagesCount = DOCS_SLUG_LITERALS.filter((slug) => pagesSrc.includes(`"${slug}"`)).length;
    expect(pagesCount).toBe(DOCS_SLUG_LITERALS.length);

    for (const relPath of GUARDED_FILES) {
      const filePath = resolve(REPO_ROOT, relPath);
      if (!existsSync(filePath)) continue;
      const src = readFileSync(filePath, "utf-8");
      const count = DOCS_SLUG_LITERALS.filter((slug) => src.includes(`"${slug}"`)).length;
      expect(count).toBeLessThan(pagesCount);
    }
  });

  it("non-nav consumers import allDocsPages from ./docs-pages, not from ./docs-navigation", () => {
    // Source-level import-direction guard. Non-nav consumers of the
    // registry (page-titles, search-index, docs-files, and the Svelte
    // shell's page-titles projection) must import `allDocsPages` from
    // the canonical `docs-pages.ts` module. `docs-navigation.ts`
    // re-exports the symbol for backward compat, but only navigation-
    // specific code should import from it. A regression that points a
    // non-nav consumer at `docs-navigation.ts` would silently work at
    // runtime (same symbol) but re-entrench the stale naming; this
    // guard catches it at test time with a precise error.
    const NON_NAV_CONSUMERS: ReadonlyArray<string> = [
      "apps/web/lib/page-titles.ts",
      "apps/web/lib/search-index.ts",
      "apps/web/lib/docs-files.ts",
      "apps/web-svelte/src/lib/page-titles.ts",
    ];
    // Matches: import { allDocsPages, ... } from "<anything>/docs-pages"
    // (single or double quotes, any leading path segments).
    const DOCS_PAGES_IMPORT = /import\s*\{[^}]*\ballDocsPages\b[^}]*\}\s*from\s*["'][^"']*docs-pages["']/;
    // Matches: import { allDocsPages, ... } from "<anything>/docs-navigation"
    const DOCS_NAVIGATION_IMPORT = /import\s*\{[^}]*\ballDocsPages\b[^}]*\}\s*from\s*["'][^"']*docs-navigation["']/;
    for (const relPath of NON_NAV_CONSUMERS) {
      const filePath = resolve(REPO_ROOT, relPath);
      expect(
        existsSync(filePath),
        `guarded consumer ${relPath} is missing from the repo`,
      ).toBe(true);
      const src = readFileSync(filePath, "utf-8");
      expect(
        DOCS_PAGES_IMPORT.test(src),
        `${relPath} must import allDocsPages from a docs-pages module (the canonical registry), ` +
          `but no matching import was found. Update the import to './docs-pages' or ` +
          `'../../../web/lib/docs-pages' depending on workspace.`,
      ).toBe(true);
      expect(
        DOCS_NAVIGATION_IMPORT.test(src),
        `${relPath} imports allDocsPages from a docs-navigation module. ` +
          `docs-navigation.ts re-exports the symbol for backward compat, but non-nav ` +
          `consumers must point at the canonical docs-pages.ts instead.`,
      ).toBe(false);
    }
  });
});
