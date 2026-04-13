import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import CodeBlock from "../components/CodeBlock.svelte";

describe("CodeBlock.svelte SSR", () => {
  it("wraps the provided html in the outer code block wrapper classes", () => {
    const { body } = render(CodeBlock, { props: { html: "<pre>noop</pre>" } });
    expect(body).toContain("rounded-lg");
    expect(body).toContain("border");
    expect(body).toContain("font-mono");
    expect(body).toContain("text-[13px]");
    expect(body).toContain("dark:bg-neutral-900");
  });

  it("renders the code-block-shiki inner wrapper around the html", () => {
    const { body } = render(CodeBlock, { props: { html: "<pre>noop</pre>" } });
    expect(body).toContain("code-block-shiki");
    expect(body).toContain("overflow-x-auto");
  });

  it("embeds the provided html via {@html} rather than escaping it", () => {
    const html = '<pre class="shiki shiki-themes vercel-light vercel-dark"><code>const x = 1;</code></pre>';
    const { body } = render(CodeBlock, { props: { html } });
    expect(body).toContain(html);
    expect(body).not.toContain("&lt;pre");
    expect(body).not.toContain("&lt;code");
  });

  it("preserves an empty html prop without crashing or injecting fallback content", () => {
    const { body } = render(CodeBlock, { props: { html: "" } });
    expect(body).toContain("code-block-shiki");
    expect(body).toContain("rounded-lg");
  });
});
