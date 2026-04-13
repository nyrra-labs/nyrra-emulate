import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import { docsSources } from "../docs-source";
import SlugPage from "../../routes/[slug]/+page.svelte";

/**
 * Tests for the generic non-root docs route component at
 * src/routes/[slug]/+page.svelte. This single dynamic component
 * replaces the old per-slug `+page.svelte` wrappers, so the SSR
 * contract is asserted once with synthetic data — the wrapper does
 * not vary per slug. The slug-set parity check (every non-root
 * docsSources entry has a matching prerender path) lives in
 * route-page-server.test.ts where it is enforced via the EntryGenerator.
 */
const SYNTHETIC_HTML = [
  '<h1 class="docs-test-h1">SYNTHETIC_DOCS_TITLE</h1>',
  '<p class="docs-test-p">SYNTHETIC_DOCS_PARAGRAPH</p>',
  '<pre class="docs-test-pre"><code>SYNTHETIC_DOCS_CODE</code></pre>',
].join("\n");

function renderSlugPage(): string {
  // SvelteKit's auto-generated PageData type for the [slug] route does
  // not declare `html`, so the synthetic data prop is cast at the test
  // boundary to the concrete runtime shape the route wrapper reads.
  const props = { data: { html: SYNTHETIC_HTML } };
  const { body } = render(SlugPage, { props: props as Parameters<typeof render>[1] });
  return body;
}

describe("generic [slug] route +page.svelte SSR contract", () => {
  it("renders the docs-content wrapper", () => {
    const body = renderSlugPage();
    expect(body).toContain('class="docs-content"');
  });

  it("embeds the synthetic html via {@html} rather than escaping it", () => {
    const body = renderSlugPage();
    expect(body).toContain("SYNTHETIC_DOCS_TITLE");
    expect(body).toContain("SYNTHETIC_DOCS_PARAGRAPH");
    expect(body).toContain("SYNTHETIC_DOCS_CODE");
    expect(body).toContain('<h1 class="docs-test-h1">');
    expect(body).toContain('<p class="docs-test-p">');
    expect(body).toContain('<pre class="docs-test-pre">');
  });

  it("does not escape the synthetic h1/p/pre markers", () => {
    const body = renderSlugPage();
    expect(body).not.toContain("&lt;h1");
    expect(body).not.toContain("&lt;p ");
    expect(body).not.toContain("&lt;pre");
    expect(body).not.toContain("&lt;code");
  });
});

describe("generic [slug] route docsSources parity", () => {
  it("docsSources still has at least one non-root entry the [slug] route can render", () => {
    // The slug-set parity contract is enforced at the +page.server.ts
    // layer via the EntryGenerator (see route-page-server.test.ts).
    // This sanity check just guards against an accidental empty list.
    const nonRoot = docsSources.filter((s) => s.href !== "/");
    expect(nonRoot.length).toBeGreaterThan(0);
  });
});
