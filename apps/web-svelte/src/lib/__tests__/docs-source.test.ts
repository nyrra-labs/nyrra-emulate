import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { docsSources, mdxRelativePathToHref } from "../docs-source";
import { PAGE_TITLES } from "../page-titles";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Recursively walks `baseDir` for every `page.mdx` file (at arbitrary
 * depth) and returns one href per file using the shared
 * `mdxRelativePathToHref` mapping helper from `docs-source.ts`. Both
 * the real upstream `apps/web/app` walk and the temp-fixture walker
 * test below funnel through this single function, so a regression in
 * either the recursive enumeration or the path→href mapping surfaces
 * in both test paths consistently.
 */
function walkMdxHrefs(baseDir: string): string[] {
  const entries = readdirSync(baseDir, { recursive: true, withFileTypes: true });
  const hrefs: string[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || entry.name !== "page.mdx") continue;
    const fullPath = resolve(entry.parentPath, entry.name);
    const relativePath = relative(baseDir, fullPath);
    hrefs.push(mdxRelativePathToHref(relativePath));
  }
  return hrefs.sort();
}

/**
 * Lists every upstream apps/web docs MDX page by walking the filesystem
 * directly (not via the Vite glob), so the test verifies the same set
 * the docs-source registry's reverse parity guard sees at module init,
 * via an independent path. Uses the recursive `walkMdxHrefs` helper so
 * any future nested-route layout (e.g. apps/web/app/foundry/oauth/page.mdx)
 * is included automatically without a test-side update.
 */
function listUpstreamDocsHrefs(): string[] {
  const upstreamAppDir = resolve(__dirname, "../../../../web/app");
  return walkMdxHrefs(upstreamAppDir);
}

describe("docsSources", () => {
  it("registers every implemented Svelte route once with non-empty upstream MDX", () => {
    const hrefs = docsSources.map((s) => s.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const source of docsSources) {
      expect(source.title.length).toBeGreaterThan(0);
      expect(source.raw.length).toBeGreaterThan(0);
    }
  });

  it("is the derived projection of PAGE_TITLES with the slug→href convention", () => {
    // PAGE_TITLES is the single source of truth for the implemented
    // docs slug set. docsSources derives from it via the slug→href
    // convention ("" -> "/", "foundry" -> "/foundry"), so this test
    // pins both the entry-set parity and the iteration order in one
    // assertion. A regression that broke the derivation would change
    // the projected (href, title) pair for at least one entry.
    const expected = Object.entries(PAGE_TITLES).map(([slug, title]) => ({
      href: slug === "" ? "/" : `/${slug}`,
      title,
    }));
    expect(docsSources.map(({ href, title }) => ({ href, title }))).toEqual(expected);
  });

  it("includes the FoundryCI brand routes the metadata module overrides", () => {
    const hrefs = new Set(docsSources.map((s) => s.href));
    expect(hrefs.has("/foundry")).toBe(true);
    expect(hrefs.has("/configuration")).toBe(true);
    expect(hrefs.has("/")).toBe(true);
  });

  it("each upstream raw MDX entry contains some recognizable Markdown", () => {
    const foundry = docsSources.find((s) => s.href === "/foundry");
    expect(foundry).toBeDefined();
    expect(foundry!.raw).toMatch(/Foundry/i);
    const vercel = docsSources.find((s) => s.href === "/vercel");
    expect(vercel).toBeDefined();
    expect(vercel!.raw).toMatch(/vercel/i);
  });
});

describe("upstream MDX ↔ PAGE_TITLES parity", () => {
  it("the upstream apps/web docs MDX set is exactly equal to the surfaced PAGE_TITLES set today", () => {
    // Independent filesystem walk of apps/web/app/**/page.mdx, compared
    // against docsSources's projected hrefs. The forward guard inside
    // docs-source.ts already aborts module init if PAGE_TITLES references
    // a missing upstream page; the reverse guard aborts module init if
    // upstream has a page that PAGE_TITLES does not surface and that is
    // not in INTENTIONALLY_UNSURFACED_UPSTREAM_HREFS. This test pins
    // both directions explicitly so a future upstream sync that adds
    // a page without a PAGE_TITLES update fails here AND at module init,
    // and a future PAGE_TITLES change without an upstream MDX fails here
    // AND at module init.
    const upstreamHrefs = listUpstreamDocsHrefs();
    const surfacedHrefs = docsSources.map((s) => s.href).sort();
    expect(upstreamHrefs).toEqual(surfacedHrefs);
  });

  it("the current repo state has no upstream pages that need an explicit unsurfaced-allowlist entry", () => {
    // A direct reformulation of the parity assertion: every upstream
    // page is surfaced today, so the INTENTIONALLY_UNSURFACED_UPSTREAM_HREFS
    // allowlist should remain empty. If this test ever fails, it means
    // a future state legitimately needs a non-empty allowlist; the test
    // and the comment in docs-source.ts should both be updated together.
    const upstreamHrefs = new Set(listUpstreamDocsHrefs());
    const surfacedHrefs = new Set(docsSources.map((s) => s.href));
    const missing = [...upstreamHrefs].filter((href) => !surfacedHrefs.has(href));
    expect(missing).toEqual([]);
  });
});

describe("mdxRelativePathToHref nested-path support", () => {
  // Synthetic-input unit tests for the shared mapping helper. These
  // are the load-bearing proof that the path→href convention handles
  // arbitrary depth, NOT just the single-segment cases that exist in
  // the upstream tree today.

  it("maps the root page.mdx to /", () => {
    expect(mdxRelativePathToHref("page.mdx")).toBe("/");
  });

  it("maps a single-segment slug to /<slug>", () => {
    expect(mdxRelativePathToHref("foundry/page.mdx")).toBe("/foundry");
    expect(mdxRelativePathToHref("vercel/page.mdx")).toBe("/vercel");
    expect(mdxRelativePathToHref("programmatic-api/page.mdx")).toBe("/programmatic-api");
  });

  it("maps a two-segment nested slug to /<a>/<b>", () => {
    expect(mdxRelativePathToHref("foundry/oauth/page.mdx")).toBe("/foundry/oauth");
    expect(mdxRelativePathToHref("docs/getting-started/page.mdx")).toBe("/docs/getting-started");
  });

  it("maps a four-segment deeply-nested slug to /<a>/<b>/<c>/<d>", () => {
    expect(mdxRelativePathToHref("a/b/c/d/page.mdx")).toBe("/a/b/c/d");
  });
});

describe("walkMdxHrefs end-to-end against a synthetic temp fixture", () => {
  it("recursively discovers nested page.mdx files at arbitrary depth", () => {
    // Builds a synthetic upstream-style tree under os.tmpdir() with a
    // mix of root, single-segment, and nested page.mdx files (plus a
    // non-mdx file that must be ignored), then walks it via the same
    // helper the real upstream test uses. Proves the recursive walker
    // + mdxRelativePathToHref pair handles the nested-path case end
    // to end without depending on the real apps/web layout.
    const tmpRoot = mkdtempSync(resolve(tmpdir(), "docs-source-walk-"));
    try {
      // Root page.
      writeFileSync(resolve(tmpRoot, "page.mdx"), "# root\n");
      // Single-segment slug.
      mkdirSync(resolve(tmpRoot, "foundry"));
      writeFileSync(resolve(tmpRoot, "foundry/page.mdx"), "# foundry\n");
      // Two-segment nested slug.
      mkdirSync(resolve(tmpRoot, "foundry/oauth"), { recursive: true });
      writeFileSync(resolve(tmpRoot, "foundry/oauth/page.mdx"), "# foundry/oauth\n");
      // Four-segment deeply nested slug.
      mkdirSync(resolve(tmpRoot, "a/b/c/d"), { recursive: true });
      writeFileSync(resolve(tmpRoot, "a/b/c/d/page.mdx"), "# a/b/c/d\n");
      // A file that is NOT page.mdx; the walker must ignore it.
      writeFileSync(resolve(tmpRoot, "foundry/README.md"), "ignore me\n");
      // A directory that has no page.mdx; the walker must NOT emit a href for it.
      mkdirSync(resolve(tmpRoot, "empty-dir"));

      const hrefs = walkMdxHrefs(tmpRoot);
      expect(hrefs).toEqual(["/", "/a/b/c/d", "/foundry", "/foundry/oauth"]);
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});
