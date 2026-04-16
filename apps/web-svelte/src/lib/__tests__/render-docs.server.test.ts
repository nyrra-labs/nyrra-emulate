import { describe, expect, it } from "vitest";
import { highlight } from "../code-highlight.server";
import { renderDocsHtml, renderDocsHtmlByHref } from "../render-docs.server";

describe("renderDocsHtmlByHref on the root /` page", () => {
  it("renders the H1 with the docs H1 utility class", async () => {
    const { html } = await renderDocsHtmlByHref("/");
    expect(html).toContain("<h1 class=");
    expect(html).toContain("text-2xl");
    expect(html).toContain("Getting Started");
  });

  it("renders H2 sections with the docs H2 utility class", async () => {
    const { html } = await renderDocsHtmlByHref("/");
    expect(html).toContain("<h2 class=");
    expect(html).toContain("Quick Start");
    expect(html).toContain("CLI");
  });

  it("renders paragraphs with the docs paragraph utility class", async () => {
    const { html } = await renderDocsHtmlByHref("/");
    expect(html).toContain("<p class=");
    expect(html).toContain("text-sm leading-relaxed");
  });

  it("renders markdown links to other doc routes with the docs link class and href", async () => {
    const { html } = await renderDocsHtmlByHref("/");
    expect(html).toMatch(/<a class="[^"]*underline[^"]*" href="\/programmatic-api">Programmatic API<\/a>/);
    expect(html).toMatch(/<a class="[^"]*underline[^"]*" href="\/nextjs">Next\.js Integration<\/a>/);
  });

  it("wraps fenced code blocks in the CodeBlock outer/inner div pair with the Shiki shell", async () => {
    const { html } = await renderDocsHtmlByHref("/");
    expect(html).toContain("code-block-shiki");
    expect(html).toContain("rounded-lg border");
    expect(html).toMatch(/<div class="[^"]*rounded-lg[^"]*"><div class="code-block-shiki/);
    expect(html).toMatch(/<pre[^>]*shiki/);
  });

  it("returns the registry source alongside the html so callers can read the title without re-querying", async () => {
    const { source, html } = await renderDocsHtmlByHref("/");
    expect(source.href).toBe("/");
    expect(source.title).toBe("Overview");
    expect(html.length).toBeGreaterThan(0);
  });

  it("does not leak raw MDX import/export lines or html-like JSX className blocks into the output", async () => {
    const { html } = await renderDocsHtmlByHref("/");
    expect(html).not.toMatch(/^import /m);
    expect(html).not.toMatch(/^export /m);
    expect(html).not.toContain("className=");
  });
});

describe("renderDocsHtmlByHref error path", () => {
  it("throws a precise error when the href is not in the registry", async () => {
    await expect(renderDocsHtmlByHref("/this-route-does-not-exist")).rejects.toThrow(
      /no docs-source registry entry for href \/this-route-does-not-exist/,
    );
  });
});

describe("renderDocsHtml direct", () => {
  it("renders a small synthetic markdown string with a heading, paragraph, and code block", async () => {
    const md = ["# Heading", "", "A paragraph.", "", "```bash", "echo hi", "```", ""].join("\n");
    const html = await renderDocsHtml(md);
    expect(html).toContain("<h1 class=");
    expect(html).toContain(">Heading</h1>");
    expect(html).toContain("<p class=");
    expect(html).toContain("A paragraph.");
    expect(html).toContain("code-block-shiki");
  });

  it("maps json fences to json highlighting instead of the bash fallback", async () => {
    const code = ["{", '  "enabled": true,', '  "service": "foundry"', "}"].join("\n");
    const md = ["```json", code, "```", ""].join("\n");
    const expected = await highlight(code, "json");
    const html = await renderDocsHtml(md);
    expect(html).toContain(expected);
  });
});
