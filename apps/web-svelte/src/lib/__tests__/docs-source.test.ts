import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { docsSources, mdxRelativePathToHref } from "../docs-source";
import { PAGE_TITLES } from "../page-titles";

/**
 * Walks a directory for .mdx files and returns one href per file using
 * the shared mdxRelativePathToHref mapping helper from docs-source.ts.
 * This simulates the docs-upstream content directory structure.
 */
function walkContentHrefs(baseDir: string): string[] {
  const entries = readdirSync(baseDir, { withFileTypes: true });
  const hrefs: string[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".mdx")) continue;
    hrefs.push(mdxRelativePathToHref(entry.name));
  }
  return hrefs.sort();
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

  it("is the derived projection of PAGE_TITLES with the slug to href convention", () => {
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

describe("upstream content to PAGE_TITLES parity", () => {
  it("the docs-upstream content set is exactly equal to the surfaced PAGE_TITLES set today", () => {
    const contentDir = resolve(
      import.meta.dirname,
      "../../../../../packages/docs-upstream/generated/content",
    );
    const contentHrefs = walkContentHrefs(contentDir);
    const surfacedHrefs = docsSources.map((s) => s.href).sort();
    expect(contentHrefs).toEqual(surfacedHrefs);
  });

  it("the current repo state has no upstream pages that need an explicit unsurfaced-allowlist entry", () => {
    const contentDir = resolve(
      import.meta.dirname,
      "../../../../../packages/docs-upstream/generated/content",
    );
    const contentHrefs = new Set(walkContentHrefs(contentDir));
    const surfacedHrefs = new Set(docsSources.map((s) => s.href));
    const missing = [...contentHrefs].filter((href) => !surfacedHrefs.has(href));
    expect(missing).toEqual([]);
  });
});

describe("mdxRelativePathToHref content filename support", () => {
  it("maps _root.mdx to /", () => {
    expect(mdxRelativePathToHref("_root.mdx")).toBe("/");
  });

  it("maps a single-segment slug to /<slug>", () => {
    expect(mdxRelativePathToHref("foundry.mdx")).toBe("/foundry");
    expect(mdxRelativePathToHref("vercel.mdx")).toBe("/vercel");
    expect(mdxRelativePathToHref("programmatic-api.mdx")).toBe("/programmatic-api");
  });
});

describe("walkContentHrefs end-to-end against a synthetic temp fixture", () => {
  it("discovers .mdx content files and maps them to hrefs", () => {
    const tmpRoot = mkdtempSync(resolve(tmpdir(), "docs-source-walk-"));
    try {
      writeFileSync(resolve(tmpRoot, "_root.mdx"), "# root\n");
      writeFileSync(resolve(tmpRoot, "foundry.mdx"), "# foundry\n");
      writeFileSync(resolve(tmpRoot, "vercel.mdx"), "# vercel\n");
      // A non-mdx file should be ignored
      writeFileSync(resolve(tmpRoot, "README.md"), "ignore me\n");

      const hrefs = walkContentHrefs(tmpRoot);
      expect(hrefs).toEqual(["/", "/foundry", "/vercel"]);
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});
