import { describe, expect, it } from "vitest";
import { docsSources } from "../docs-source";
import { mdxToCleanMarkdown } from "../mdx-to-markdown";

describe("mdxToCleanMarkdown synthetic fixtures", () => {
  it("strips top-level import and export lines while preserving the heading and paragraph", () => {
    const input = [
      'import { Code } from "../components/code";',
      'export const meta = { title: "Foo" };',
      "",
      "# Foo",
      "",
      "Some prose paragraph with `inline code`.",
    ].join("\n");
    const out = mdxToCleanMarkdown(input);
    expect(out).not.toMatch(/^import /m);
    expect(out).not.toMatch(/^export /m);
    expect(out).toContain("# Foo");
    expect(out).toContain("Some prose paragraph with `inline code`.");
  });

  it("strips a multi-line JSX div block with className and respects nested div depth", () => {
    const input = [
      "# Heading",
      "",
      '<div className="card">',
      '  <div className="card-body">',
      "    inner JSX text",
      "  </div>",
      "</div>",
      "",
      "Trailing paragraph.",
    ].join("\n");
    const out = mdxToCleanMarkdown(input);
    expect(out).not.toContain("<div");
    expect(out).not.toContain("</div>");
    expect(out).not.toContain("className");
    expect(out).not.toContain("inner JSX text");
    expect(out).toContain("# Heading");
    expect(out).toContain("Trailing paragraph.");
  });

  it("preserves markdown that looks like a JSX wrapper but lacks className", () => {
    const input = ["# Heading", "", "<div>this should pass through</div>", ""].join("\n");
    const out = mdxToCleanMarkdown(input);
    expect(out).toContain("<div>this should pass through</div>");
  });

  it("preserves fenced code blocks, lists, and links unchanged", () => {
    const input = [
      "# Title",
      "",
      "Intro [link](/dest) and `code`.",
      "",
      "- one",
      "- two",
      "",
      "```bash",
      "echo hi",
      "```",
    ].join("\n");
    const out = mdxToCleanMarkdown(input);
    expect(out).toContain("[link](/dest)");
    expect(out).toContain("- one");
    expect(out).toContain("- two");
    expect(out).toContain("```bash");
    expect(out).toContain("echo hi");
    expect(out).toContain("```");
  });

  it("preserves import and export lines inside fenced code blocks while still stripping top-level directives", () => {
    const input = [
      'import { Code } from "../components/code";',
      'export const meta = { title: "Foo" };',
      "",
      "```typescript",
      'import { createHash } from "crypto";',
      "export const answer = 42;",
      "```",
    ].join("\n");
    const out = mdxToCleanMarkdown(input);
    expect(out).not.toContain("../components/code");
    expect(out).not.toContain('title: "Foo"');
    expect(out).toContain('import { createHash } from "crypto";');
    expect(out).toContain("export const answer = 42;");
  });
});

describe("mdxToCleanMarkdown on real upstream fixtures", () => {
  it("removes every top-level import/export line from the foundry MDX while keeping the H1", () => {
    const foundry = docsSources.find((s) => s.href === "/foundry");
    expect(foundry).toBeDefined();
    const cleaned = mdxToCleanMarkdown(foundry!.raw);
    expect(cleaned).not.toMatch(/^import /m);
    expect(cleaned).not.toMatch(/^export /m);
    expect(cleaned).toMatch(/^# Foundry/m);
  });

  it("strips the JSX <table> wrapper className blocks from the root MDX while keeping the H1 and prose", () => {
    const root = docsSources.find((s) => s.href === "/");
    expect(root).toBeDefined();
    const cleaned = mdxToCleanMarkdown(root!.raw);
    expect(cleaned).toMatch(/^# Getting Started/m);
    expect(cleaned).toContain("Local drop-in replacement");
  });
});
