import { describe, expect, it } from "vitest";
import { docsSources } from "../docs-source";
import * as slugRoute from "../../routes/[slug]/+page.server";

/**
 * Tests for the generic non-root docs route at
 * src/routes/[slug]/+page.server.ts. This single dynamic route replaces
 * the old per-slug `+page.server.ts` wrappers, and its EntryGenerator
 * is the source of truth for which non-root slugs SvelteKit prerenders
 * at build time.
 *
 * The contract checks are still table-driven across the full
 * implemented non-root docs slug set so a regression in any single
 * slug's render path is caught with a precise per-slug failure
 * message.
 */
const expectedSlugs = docsSources
  .filter((source) => source.href !== "/")
  .map((source) => source.href.slice(1))
  .sort();

const cases = expectedSlugs.map((slug) => ({ slug }));

type LoadEvent = Parameters<typeof slugRoute.load>[0];
type RouteLoadData = { html: string };

async function callLoad(slug: string): Promise<RouteLoadData> {
  const event = { params: { slug } } as unknown as LoadEvent;
  const data = await slugRoute.load(event);
  return data as RouteLoadData;
}

describe("generic [slug] route +page.server.ts shape", () => {
  it("exports prerender = true so SvelteKit bakes static HTML for every entry", () => {
    expect(slugRoute.prerender).toBe(true);
  });

  it("exports an entries() generator that returns one { slug } per non-root docsSources entry", () => {
    const generated = slugRoute.entries();
    expect(Array.isArray(generated)).toBe(true);
    const slugs = (generated as Array<{ slug: string }>).map((e) => e.slug).sort();
    expect(slugs).toEqual(expectedSlugs);
  });

  it("entries() produces the same slug set as docsSources excluding the root /", () => {
    const generated = slugRoute.entries() as Array<{ slug: string }>;
    expect(generated.length).toBe(expectedSlugs.length);
    expect(generated.length).toBe(docsSources.length - 1);
    for (const entry of generated) {
      expect(Object.keys(entry).sort()).toEqual(["slug"]);
      expect(typeof entry.slug).toBe("string");
      expect(entry.slug.length).toBeGreaterThan(0);
      // No leading slash; the load function prepends it before calling
      // renderDocsHtmlByHref(`/${slug}`).
      expect(entry.slug.startsWith("/")).toBe(false);
    }
  });
});

describe("generic [slug] route +page.server.ts contract", () => {
  it.each(cases)("$slug load() returns a non-empty html string", async ({ slug }) => {
    const data = await callLoad(slug);
    expect(typeof data.html).toBe("string");
    expect(data.html.length).toBeGreaterThan(100);
  });

  it.each(cases)("$slug load() returns rendered docs HTML with H1 and paragraph markers", async ({ slug }) => {
    const { html } = await callLoad(slug);
    expect(html).toContain('<h1 class="');
    expect(html).toContain('<p class="');
  });

  it.each(cases)("$slug load() does not leak raw MDX residue (import/export/className)", async ({ slug }) => {
    const { html } = await callLoad(slug);
    expect(html).not.toMatch(/^import /m);
    expect(html).not.toMatch(/^export /m);
    expect(html).not.toContain("className=");
  });
});

describe("generic [slug] route +page.server.ts unknown slug", () => {
  it("propagates the renderDocsHtmlByHref loud-failure error for an unregistered slug", async () => {
    await expect(callLoad("this-route-does-not-exist")).rejects.toThrow(
      /no docs-source registry entry for href \/this-route-does-not-exist/,
    );
  });
});
