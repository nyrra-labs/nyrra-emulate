import { describe, expect, it } from "vitest";
import { allDocsEntries } from "../docs-registry";
import * as slugRoute from "../../routes/[...slug]/+page.server";

const expectedSlugs = allDocsEntries
  .filter((e) => e.href !== "/")
  .map((e) => e.href.slice(1))
  .sort();

type LoadEvent = Parameters<typeof slugRoute.load>[0];
type RouteLoadData = { html: string; title: string };

async function callLoad(slug: string): Promise<RouteLoadData> {
  const event = { params: { slug } } as unknown as LoadEvent;
  const data = await slugRoute.load(event);
  return data as RouteLoadData;
}

describe("generic [...slug] route +page.server.ts shape", () => {
  it("exports prerender = true", () => {
    expect(slugRoute.prerender).toBe(true);
  });

  it("exports entries() that returns one entry per non-root docs entry", () => {
    const generated = slugRoute.entries();
    expect(Array.isArray(generated)).toBe(true);
    const slugs = (generated as Array<{ slug: string }>).map((e) => e.slug).sort();
    expect(slugs).toEqual(expectedSlugs);
  });

  it("entries() includes nested Foundry slugs", () => {
    const generated = slugRoute.entries() as Array<{ slug: string }>;
    const slugs = generated.map((e) => e.slug);
    expect(slugs).toContain("foundry/getting-started");
    expect(slugs).toContain("foundry/auth/oauth");
    expect(slugs).toContain("foundry/compute-modules/overview");
    expect(slugs).toContain("foundry/reference/seed-config");
  });
});

describe("generic [...slug] route load contract", () => {
  it("loads an upstream page successfully", async () => {
    const data = await callLoad("vercel");
    expect(typeof data.html).toBe("string");
    expect(data.html.length).toBeGreaterThan(100);
    expect(data.html).toContain('<h1 class="');
  });

  it("loads a local Foundry page successfully", async () => {
    const data = await callLoad("foundry/getting-started");
    expect(typeof data.html).toBe("string");
    expect(data.html.length).toBeGreaterThan(50);
    expect(data.title.length).toBeGreaterThan(0);
  });

  it("loads a deeply nested Foundry page", async () => {
    const data = await callLoad("foundry/auth/oauth");
    expect(typeof data.html).toBe("string");
    expect(data.html.length).toBeGreaterThan(50);
  });

  it("throws for an unregistered slug", async () => {
    await expect(callLoad("this-route-does-not-exist")).rejects.toThrow(
      /no registry entry for href/,
    );
  });
});
