import { describe, expect, it } from "vitest";
import { docsSources } from "../docs-source";

/**
 * Discovers every migrated docs route's +page.server.ts under
 * src/routes/<slug>/+page.server.ts using a Vite eager glob. The single
 * `*` in the pattern matches exactly one path segment, so the root
 * `src/routes/+page.server.ts` is excluded automatically. The api/search
 * directory is also excluded because it ships +server.ts, not
 * +page.server.ts.
 */
const routeModules = import.meta.glob<{
  prerender: boolean;
  load: (event: unknown) => Promise<unknown>;
}>("../../routes/*/+page.server.ts", { eager: true });

type RouteCase = {
  slug: string;
  modulePath: string;
  mod: { prerender: boolean; load: (event: unknown) => Promise<unknown> };
};

type RouteLoadData = { html: string };

const cases: RouteCase[] = Object.entries(routeModules)
  .map(([modulePath, mod]) => {
    const slugMatch = modulePath.match(/^\.\.\/\.\.\/routes\/([^/]+)\/\+page\.server\.ts$/);
    if (!slugMatch) {
      throw new Error(
        `route-page-server.test: unexpected glob key ${modulePath}; expected ../../routes/<slug>/+page.server.ts`,
      );
    }
    return { slug: slugMatch[1], modulePath, mod };
  })
  .sort((a, b) => a.slug.localeCompare(b.slug));

async function callLoad(loader: RouteCase["mod"]["load"]): Promise<RouteLoadData> {
  const data = await loader({} as Parameters<typeof loader>[0]);
  return data as RouteLoadData;
}

describe("migrated docs route +page.server.ts discovery", () => {
  it("finds at least one route module via the import.meta.glob discovery", () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  it("covers every implemented docsSources entry except the root /", () => {
    // docsSources includes the root /, which has its own root +page.server.ts
    // outside this glob. Every other implemented docs route must have a
    // matching +page.server.ts under src/routes/<slug>/.
    const expectedSlugs = docsSources
      .filter((s) => s.href !== "/")
      .map((s) => s.href.slice(1))
      .sort();
    expect(cases.map((c) => c.slug)).toEqual(expectedSlugs);
  });
});

describe("migrated docs route +page.server.ts contract", () => {
  it.each(cases)("$slug exports prerender = true", ({ mod }) => {
    expect(mod.prerender).toBe(true);
  });

  it.each(cases)("$slug load() returns a non-empty html string", async ({ mod }) => {
    const data = await callLoad(mod.load);
    expect(typeof data.html).toBe("string");
    expect(data.html.length).toBeGreaterThan(100);
  });

  it.each(cases)("$slug load() returns rendered docs HTML with H1 and paragraph markers", async ({ mod }) => {
    const { html } = await callLoad(mod.load);
    expect(html).toContain('<h1 class="');
    expect(html).toContain('<p class="');
  });

  it.each(cases)("$slug load() does not leak raw MDX residue (import/export/className)", async ({ mod }) => {
    const { html } = await callLoad(mod.load);
    expect(html).not.toMatch(/^import /m);
    expect(html).not.toMatch(/^export /m);
    expect(html).not.toContain("className=");
  });
});
