import { describe, expect, it } from "vitest";
import { allDocsEntries } from "../docs-registry";
import { docsSearchPages, type DocsSearchPage } from "../docs-search-pages";

describe("docsSearchPages", () => {
  it("is the ordered { name, href } projection of the docs registry", () => {
    expect(docsSearchPages.length).toBe(allDocsEntries.length);
    const projected: DocsSearchPage[] = allDocsEntries.map((entry) => ({
      name: entry.title,
      href: entry.href,
    }));
    expect(docsSearchPages).toEqual(projected);
  });

  it("exposes only the { name, href } shape", () => {
    for (const page of docsSearchPages) {
      expect(Object.keys(page).sort()).toEqual(["href", "name"]);
      expect(typeof page.name).toBe("string");
      expect(typeof page.href).toBe("string");
      expect(page.name.length).toBeGreaterThan(0);
      expect(page.href.length).toBeGreaterThan(0);
    }
  });

  it("includes both upstream and local Foundry pages", () => {
    const hrefs = docsSearchPages.map((p) => p.href);
    expect(hrefs).toContain("/vercel");
    expect(hrefs).toContain("/foundry/getting-started");
    expect(hrefs).toContain("/foundry/auth/oauth");
  });
});
