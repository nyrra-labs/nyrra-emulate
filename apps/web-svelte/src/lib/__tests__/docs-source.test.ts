import { describe, expect, it } from "vitest";
import { docsSources } from "../docs-source";
import { PAGE_TITLES } from "../page-titles";

const slugForHref = (href: string) => (href === "/" ? "" : href.slice(1));

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

  it("stays in lockstep with PAGE_TITLES on the implemented set", () => {
    for (const source of docsSources) {
      const slug = slugForHref(source.href);
      expect(PAGE_TITLES[slug]).toBe(source.title);
    }
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
