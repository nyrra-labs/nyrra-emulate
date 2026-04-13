import type { Component } from "svelte";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import { docsSources } from "../docs-source";

/**
 * Discovers every migrated docs route's +page.svelte under
 * src/routes/<slug>/+page.svelte using a Vite eager glob. The single
 * `*` matches exactly one path segment, so the root
 * `src/routes/+page.svelte` is excluded automatically (it has its own
 * dedicated SSR coverage in root-page.svelte.test.ts) and the
 * api/search directory is excluded because it ships +server.ts only.
 */
const routeComponents = import.meta.glob<{ default: Component }>(
  "../../routes/*/+page.svelte",
  { eager: true },
);

type RouteCase = {
  slug: string;
  componentPath: string;
  Page: Component;
};

const cases: RouteCase[] = Object.entries(routeComponents)
  .map(([componentPath, mod]) => {
    const slugMatch = componentPath.match(/^\.\.\/\.\.\/routes\/([^/]+)\/\+page\.svelte$/);
    if (!slugMatch) {
      throw new Error(
        `route-page-svelte.test: unexpected glob key ${componentPath}; expected ../../routes/<slug>/+page.svelte`,
      );
    }
    return { slug: slugMatch[1], componentPath, Page: mod.default };
  })
  .sort((a, b) => a.slug.localeCompare(b.slug));

const SYNTHETIC_HTML = [
  '<h1 class="docs-test-h1">SYNTHETIC_DOCS_TITLE</h1>',
  '<p class="docs-test-p">SYNTHETIC_DOCS_PARAGRAPH</p>',
  '<pre class="docs-test-pre"><code>SYNTHETIC_DOCS_CODE</code></pre>',
].join("\n");

function renderRoute(Page: Component): string {
  // SvelteKit's auto-generated PageData type for each route does not
  // declare `html`, so the synthetic data prop is cast at the test
  // boundary to the concrete runtime shape the route wrapper reads.
  const props = { data: { html: SYNTHETIC_HTML } };
  const { body } = render(Page, { props: props as Parameters<typeof render>[1] });
  return body;
}

describe("migrated docs route +page.svelte discovery", () => {
  it("finds at least one migrated route component via the import.meta.glob discovery", () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  it("covers exactly the same set of slugs as docsSources excluding the root /", () => {
    // docsSources includes the root /, which has its own dedicated SSR
    // coverage in root-page.svelte.test.ts. Every other implemented
    // docs route must have a matching +page.svelte under
    // src/routes/<slug>/, and the +page.svelte set must equal the
    // +page.server.ts set pinned in route-page-server.test.ts.
    const expectedSlugs = docsSources
      .filter((s) => s.href !== "/")
      .map((s) => s.href.slice(1))
      .sort();
    expect(cases.map((c) => c.slug)).toEqual(expectedSlugs);
  });
});

describe("migrated docs route +page.svelte SSR contract", () => {
  it.each(cases)("$slug renders the docs-content wrapper", ({ Page }) => {
    const body = renderRoute(Page);
    expect(body).toContain('class="docs-content"');
  });

  it.each(cases)("$slug embeds the synthetic html via {@html} rather than escaping it", ({ Page }) => {
    const body = renderRoute(Page);
    expect(body).toContain("SYNTHETIC_DOCS_TITLE");
    expect(body).toContain("SYNTHETIC_DOCS_PARAGRAPH");
    expect(body).toContain("SYNTHETIC_DOCS_CODE");
    expect(body).toContain('<h1 class="docs-test-h1">');
    expect(body).toContain('<p class="docs-test-p">');
    expect(body).toContain('<pre class="docs-test-pre">');
  });

  it.each(cases)("$slug does not escape the synthetic h1/p/pre markers", ({ Page }) => {
    const body = renderRoute(Page);
    expect(body).not.toContain("&lt;h1");
    expect(body).not.toContain("&lt;p ");
    expect(body).not.toContain("&lt;pre");
    expect(body).not.toContain("&lt;code");
  });
});
