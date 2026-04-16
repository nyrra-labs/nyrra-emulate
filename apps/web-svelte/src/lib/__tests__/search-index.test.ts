import { describe, expect, it } from "vitest";
import { allDocsEntries } from "../docs-registry";
import { getSearchIndex } from "../search-index";

describe("getSearchIndex", () => {
  it("returns one entry per docs registry entry with non-empty content", () => {
    const index = getSearchIndex();
    expect(index.length).toBe(allDocsEntries.length);
    expect(index.length).toBeGreaterThan(0);
    for (const entry of index) {
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.href.length).toBeGreaterThan(0);
      expect(entry.content.length).toBeGreaterThan(0);
    }
  });

  it("indexes upstream docs with the expected title", () => {
    const index = getSearchIndex();
    const vercel = index.find((e) => e.href === "/vercel");
    expect(vercel).toBeDefined();
    expect(vercel!.title).toBe("Vercel API");
    expect(vercel!.content.length).toBeGreaterThan(0);
  });

  it("indexes local Foundry docs", () => {
    const index = getSearchIndex();
    const oauth = index.find((e) => e.href === "/foundry/auth/oauth");
    expect(oauth).toBeDefined();
    expect(oauth!.content.length).toBeGreaterThan(0);
  });

  it("memoizes the index and returns the same array reference on repeat calls", () => {
    const first = getSearchIndex();
    const second = getSearchIndex();
    expect(second).toBe(first);
  });
});
