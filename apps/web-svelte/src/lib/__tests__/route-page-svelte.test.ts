import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import { allDocsEntries } from "../docs-registry";
import SlugPage from "../../routes/[...slug]/+page.svelte";

const SYNTHETIC_HTML = [
  '<h1 class="docs-test-h1">SYNTHETIC_DOCS_TITLE</h1>',
  '<p class="docs-test-p">SYNTHETIC_DOCS_PARAGRAPH</p>',
  '<pre class="docs-test-pre"><code>SYNTHETIC_DOCS_CODE</code></pre>',
].join("\n");

function renderSlugPage(): string {
  const props = { data: { html: SYNTHETIC_HTML, title: "Test" } };
  const { body } = render(SlugPage, { props: props as Parameters<typeof render>[1] });
  return body;
}

describe("generic [...slug] route +page.svelte SSR contract", () => {
  it("renders the docs-content wrapper", () => {
    const body = renderSlugPage();
    expect(body).toContain('class="docs-content"');
  });

  it("embeds synthetic html via {@html} rather than escaping it", () => {
    const body = renderSlugPage();
    expect(body).toContain("SYNTHETIC_DOCS_TITLE");
    expect(body).toContain("SYNTHETIC_DOCS_PARAGRAPH");
    expect(body).toContain("SYNTHETIC_DOCS_CODE");
    expect(body).toContain('<h1 class="docs-test-h1">');
  });

  it("does not escape the synthetic markers", () => {
    const body = renderSlugPage();
    expect(body).not.toContain("&lt;h1");
    expect(body).not.toContain("&lt;p ");
  });
});

describe("docs registry has entries for the [...slug] route", () => {
  it("has at least one non-root entry the route can render", () => {
    const nonRoot = allDocsEntries.filter((e) => e.href !== "/");
    expect(nonRoot.length).toBeGreaterThan(0);
  });

  it("includes both upstream and local entries", () => {
    const kinds = new Set(allDocsEntries.map((e) => e.kind));
    expect(kinds.has("upstream")).toBe(true);
    expect(kinds.has("local")).toBe(true);
  });
});
