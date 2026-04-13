import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSearchIndex, searchEntries } = vi.hoisted(() => ({
  getSearchIndex: vi.fn(),
  searchEntries: vi.fn(),
}));

vi.mock("@/lib/search-index", () => ({
  getSearchIndex,
  searchEntries,
}));

import { GET } from "@/app/api/search/route";

describe("apps/web/app/api/search/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty result set with no cache header for a missing query and does not load the index", async () => {
    const response = await GET(new NextRequest("https://example.com/api/search"));

    expect(getSearchIndex).not.toHaveBeenCalled();
    expect(searchEntries).not.toHaveBeenCalled();
    expect(response.headers.get("Cache-Control")).toBeNull();
    await expect(response.json()).resolves.toEqual({ results: [] });
  });

  it("returns an empty result set with no cache header for a whitespace-only query and does not load the index", async () => {
    const response = await GET(new NextRequest("https://example.com/api/search?q=%20%20%20"));

    expect(getSearchIndex).not.toHaveBeenCalled();
    expect(searchEntries).not.toHaveBeenCalled();
    expect(response.headers.get("Cache-Control")).toBeNull();
    await expect(response.json()).resolves.toEqual({ results: [] });
  });

  it("loads the index, delegates scoring, and sets Cache-Control for a non-empty query", async () => {
    const index = [{ title: "Foundry", href: "/foundry", content: "Foundry emulator" }];
    const results = [{ title: "Foundry", href: "/foundry", snippet: "Foundry emulator" }];
    getSearchIndex.mockResolvedValue(index);
    searchEntries.mockReturnValue(results);

    const response = await GET(new NextRequest("https://example.com/api/search?q=foundry"));

    expect(getSearchIndex).toHaveBeenCalledTimes(1);
    expect(searchEntries).toHaveBeenCalledWith("foundry", index);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=60");
    await expect(response.json()).resolves.toEqual({ results });
  });
});
