import { describe, expect, it } from "vitest";
import { docsSources } from "../docs-source";
import { PAGE_TITLES } from "../page-titles";

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
