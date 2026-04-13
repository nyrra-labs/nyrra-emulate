import { describe, expect, it } from "vitest";
import { docsSources } from "../docs-source";
import { getSearchIndex } from "../search-index";

describe("getSearchIndex", () => {
  it("returns one entry per implemented docs source with a non-empty stripped body", () => {
    const index = getSearchIndex();
    expect(index.length).toBe(docsSources.length);
    expect(index.length).toBeGreaterThan(0);
    for (const entry of index) {
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.href.length).toBeGreaterThan(0);
      expect(entry.content.length).toBeGreaterThan(0);
    }
  });

  it("indexes the FoundryCI docs route with the expected title and content keyword", () => {
    const index = getSearchIndex();
    const foundry = index.find((e) => e.href === "/foundry");
    expect(foundry).toBeDefined();
    expect(foundry!.title).toBe("Foundry");
    expect(foundry!.content).toMatch(/Foundry/i);
    expect(foundry!.content).not.toMatch(/^import /m);
    expect(foundry!.content).not.toMatch(/```/);
  });

  it("indexes a representative non-FoundryCI route with the upstream title", () => {
    const index = getSearchIndex();
    const vercel = index.find((e) => e.href === "/vercel");
    expect(vercel).toBeDefined();
    expect(vercel!.title).toBe("Vercel API");
    expect(vercel!.content.length).toBeGreaterThan(0);
  });

  it("memoizes the index and returns the same array reference on repeat calls", () => {
    const first = getSearchIndex();
    const second = getSearchIndex();
    expect(second).toBe(first);
  });
});
