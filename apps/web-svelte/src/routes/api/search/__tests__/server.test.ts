import { describe, expect, it } from "vitest";
import { GET } from "../+server";

type SearchResult = { title: string; href: string; snippet: string };
type SearchResponse = { results: SearchResult[] };

async function callSearch(q: string | null): Promise<{ status: number; headers: Headers; body: SearchResponse }> {
  const url = new URL(
    q === null ? "http://test.local/api/search" : `http://test.local/api/search?q=${encodeURIComponent(q)}`,
  );
  const res = await GET({ url } as Parameters<typeof GET>[0]);
  const body = (await res.json()) as SearchResponse;
  return { status: res.status, headers: res.headers, body };
}

describe("GET /api/search empty query", () => {
  it("returns an empty result list when the query parameter is missing entirely", async () => {
    const { status, body } = await callSearch(null);
    expect(status).toBe(200);
    expect(body).toEqual({ results: [] });
  });

  it("returns an empty result list when the query parameter is the empty string", async () => {
    const { status, body, headers } = await callSearch("");
    expect(status).toBe(200);
    expect(body).toEqual({ results: [] });
    expect(headers.get("Cache-Control")).toBeNull();
  });

  it("returns an empty result list when the query parameter is whitespace only", async () => {
    const { body } = await callSearch("   ");
    expect(body).toEqual({ results: [] });
  });
});

describe("GET /api/search title vs content scoring", () => {
  it("ranks an exact title hit ahead of content-only hits for the same term", async () => {
    const { body } = await callSearch("foundry");
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results[0]).toMatchObject({ href: "/foundry", title: "Foundry" });
  });

  it("ranks an exact title hit for a different service ahead of content-only hits", async () => {
    const { body } = await callSearch("vercel");
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results[0]).toMatchObject({ href: "/vercel", title: "Vercel API" });
  });

  it("matches content-only when the term does not appear in any title", async () => {
    const { body } = await callSearch("Palantir");
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results.some((r) => r.href === "/foundry")).toBe(true);
    expect(body.results.every((r) => !r.title.toLowerCase().includes("palantir"))).toBe(true);
  });
});

describe("GET /api/search result shape and snippet", () => {
  it("shapes every result as exactly title, href, snippet and caps the result set at 20", async () => {
    const { body } = await callSearch("api");
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results.length).toBeLessThanOrEqual(20);
    for (const result of body.results) {
      expect(Object.keys(result).sort()).toEqual(["href", "snippet", "title"]);
      expect(typeof result.title).toBe("string");
      expect(typeof result.href).toBe("string");
      expect(typeof result.snippet).toBe("string");
    }
  });

  it("returns a snippet that contains the matched term and is bounded around the first hit", async () => {
    const { body } = await callSearch("Palantir");
    const foundryHit = body.results.find((r) => r.href === "/foundry");
    expect(foundryHit).toBeDefined();
    expect(foundryHit!.snippet.toLowerCase()).toContain("palantir");
    expect(foundryHit!.snippet.length).toBeGreaterThan(0);
    // Slice spans at most firstTermIdx-40..firstTermIdx+120 (160 chars),
    // wrapped with at most "..." on each end (6 chars).
    expect(foundryHit!.snippet.length).toBeLessThanOrEqual(166);
  });
});

describe("GET /api/search cache header", () => {
  it("sets a 60-second public cache header on non-empty queries", async () => {
    const { headers } = await callSearch("foundry");
    expect(headers.get("Cache-Control")).toBe("public, max-age=60");
  });
});
