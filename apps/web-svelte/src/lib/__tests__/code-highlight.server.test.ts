import { describe, expect, it } from "vitest";
import { highlight, highlightAll, type SupportedLang } from "../code-highlight.server";

const SHIKI_THEMES_CLASS = 'class="shiki shiki-themes vercel-light vercel-dark"';

function isShikiHtml(html: string): boolean {
  return (
    html.startsWith("<pre ") &&
    html.includes(SHIKI_THEMES_CLASS) &&
    html.includes("--shiki-light:") &&
    html.includes("--shiki-dark:")
  );
}

describe("highlight", () => {
  it("wraps a bash snippet in a Shiki dual-theme <pre> with the dual-color CSS variables", async () => {
    const html = await highlight("npx emulate", "bash");
    expect(html).toContain("<pre ");
    expect(html).toContain(SHIKI_THEMES_CLASS);
    expect(html).toContain("--shiki-light:");
    expect(html).toContain("--shiki-dark:");
    expect(html).toContain("<code>");
    expect(html).toContain("npx");
    expect(html).toContain("emulate");
    expect(html).not.toBe("npx emulate");
  });

  it("renders typescript with the same Shiki dual-theme wrapper", async () => {
    const html = await highlight("const x: number = 1;", "typescript");
    expect(isShikiHtml(html)).toBe(true);
    expect(html).toContain("const");
    expect(html).toContain("number");
  });

  it("renders yaml with the same Shiki dual-theme wrapper", async () => {
    const html = await highlight("foundry:\n  enabled: true", "yaml");
    expect(isShikiHtml(html)).toBe(true);
    expect(html).toContain("foundry");
    expect(html).toContain("enabled");
  });

  it("trims leading/trailing whitespace from the input before tokenizing", async () => {
    const padded = await highlight("\n\nnpx emulate\n\n", "bash");
    const trimmed = await highlight("npx emulate", "bash");
    expect(padded).toBe(trimmed);
  });

  it("defaults the lang to typescript when called without a lang argument", async () => {
    const implicit = await highlight("const x = 1;");
    const explicit = await highlight("const x = 1;", "typescript");
    expect(implicit).toBe(explicit);
  });
});

describe("highlightAll", () => {
  it("preserves the requested keys, insertion order, and maps each to Shiki HTML", async () => {
    const blocks: Record<string, { lang: SupportedLang; code: string }> = {
      first: { lang: "bash", code: "echo first" },
      second: { lang: "typescript", code: "const second = 2;" },
      third: { lang: "yaml", code: "third: 3" },
    };
    const out = await highlightAll(blocks);
    expect(Object.keys(out)).toEqual(["first", "second", "third"]);
    for (const key of Object.keys(out)) {
      expect(isShikiHtml(out[key])).toBe(true);
    }
    expect(out.first).toContain("echo");
    expect(out.first).toContain("first");
    expect(out.second).toContain("const");
    expect(out.second).toContain("second");
    expect(out.third).toContain("third");
  });

  it("returns the same HTML for a key as a direct highlight() call with the same lang and code", async () => {
    const direct = await highlight("npx emulate", "bash");
    const viaAll = await highlightAll({ only: { lang: "bash", code: "npx emulate" } });
    expect(viaAll.only).toBe(direct);
  });

  it("returns an empty object for an empty input record", async () => {
    const out = await highlightAll({});
    expect(out).toEqual({});
  });
});
