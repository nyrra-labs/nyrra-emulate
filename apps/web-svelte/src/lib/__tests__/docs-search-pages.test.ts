import { describe, expect, it } from "vitest";
import { docsSources } from "../docs-source";
import { allDocsPages, type DocsSearchPage } from "../docs-search-pages";

describe("allDocsPages", () => {
  it("is the ordered { name, href } projection of docsSources", () => {
    expect(allDocsPages.length).toBe(docsSources.length);
    const projected: DocsSearchPage[] = docsSources.map((source) => ({
      name: source.title,
      href: source.href,
    }));
    expect(allDocsPages).toEqual(projected);
  });

  it("preserves the docsSources iteration order entry-by-entry", () => {
    for (let i = 0; i < docsSources.length; i++) {
      expect(allDocsPages[i]).toEqual({
        name: docsSources[i].title,
        href: docsSources[i].href,
      });
    }
  });

  it("exposes only the { name, href } shape and does not leak the upstream raw MDX", () => {
    for (const page of allDocsPages) {
      expect(Object.keys(page).sort()).toEqual(["href", "name"]);
      expect(typeof page.name).toBe("string");
      expect(typeof page.href).toBe("string");
      expect(page.name.length).toBeGreaterThan(0);
      expect(page.href.length).toBeGreaterThan(0);
    }
  });

  it("places the FoundryCI brand routes in the same positions as docsSources", () => {
    const sourceFoundryIdx = docsSources.findIndex((s) => s.href === "/foundry");
    const sourceConfigIdx = docsSources.findIndex((s) => s.href === "/configuration");
    const sourceRootIdx = docsSources.findIndex((s) => s.href === "/");
    expect(sourceFoundryIdx).toBeGreaterThanOrEqual(0);
    expect(allDocsPages[sourceFoundryIdx]).toEqual({ name: "Foundry", href: "/foundry" });
    expect(allDocsPages[sourceConfigIdx]).toEqual({ name: "Configuration", href: "/configuration" });
    expect(allDocsPages[sourceRootIdx]).toEqual({ name: "Overview", href: "/" });
  });
});
