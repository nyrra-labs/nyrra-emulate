/**
 * Server-only Shiki wrapper used by `+page.server.ts` files to pre-render
 * fenced code blocks at build time. The `prerender = true` flag in each page's
 * server load module means this runs once during `vite build`, never on
 * request, and shiki itself never enters the client bundle.
 *
 * Theme palette mirrors apps/web/components/code.tsx so the rendered tokens
 * match the Next.js docs site (Vercel light + Vercel dark, with
 * `defaultColor: false` so both color sets are emitted as CSS variables and
 * the consumer's `:root` / `.dark` selectors switch them).
 */
import { codeToHtml } from "shiki";

const vercelDarkTheme = {
  name: "vercel-dark",
  type: "dark" as const,
  colors: {
    "editor.background": "transparent",
    "editor.foreground": "#EDEDED",
  },
  settings: [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#A1A1A1" },
    },
    {
      scope: ["string", "string.quoted", "string.template", "punctuation.definition.string"],
      settings: { foreground: "#00CA50" },
    },
    {
      scope: ["constant.numeric", "constant.language.boolean", "constant.language.null"],
      settings: { foreground: "#47A8FF" },
    },
    {
      scope: ["keyword", "storage.type", "storage.modifier"],
      settings: { foreground: "#FF4D8D" },
    },
    {
      scope: ["keyword.operator", "keyword.control"],
      settings: { foreground: "#FF4D8D" },
    },
    {
      scope: ["entity.name.function", "support.function", "meta.function-call"],
      settings: { foreground: "#C472FB" },
    },
    {
      scope: ["variable", "variable.other"],
      settings: { foreground: "#EDEDED" },
    },
    {
      scope: ["variable.parameter"],
      settings: { foreground: "#FF9300" },
    },
    {
      scope: ["entity.name.tag", "support.class.component", "entity.name.type"],
      settings: { foreground: "#FF4D8D" },
    },
    {
      scope: ["punctuation", "meta.brace", "meta.bracket"],
      settings: { foreground: "#EDEDED" },
    },
    {
      scope: [
        "support.type.property-name",
        "entity.name.tag.json",
        "meta.object-literal.key",
        "punctuation.support.type.property-name",
      ],
      settings: { foreground: "#FF4D8D" },
    },
    {
      scope: ["entity.other.attribute-name"],
      settings: { foreground: "#00CA50" },
    },
    {
      scope: ["support.type.primitive", "entity.name.type.primitive"],
      settings: { foreground: "#00CA50" },
    },
  ],
};

const vercelLightTheme = {
  name: "vercel-light",
  type: "light" as const,
  colors: {
    "editor.background": "transparent",
    "editor.foreground": "#171717",
  },
  settings: [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#6B7280" },
    },
    {
      scope: ["string", "string.quoted", "string.template", "punctuation.definition.string"],
      settings: { foreground: "#067A6E" },
    },
    {
      scope: ["constant.numeric", "constant.language.boolean", "constant.language.null"],
      settings: { foreground: "#0070C0" },
    },
    {
      scope: ["keyword", "storage.type", "storage.modifier"],
      settings: { foreground: "#D6409F" },
    },
    {
      scope: ["keyword.operator", "keyword.control"],
      settings: { foreground: "#D6409F" },
    },
    {
      scope: ["entity.name.function", "support.function", "meta.function-call"],
      settings: { foreground: "#6E56CF" },
    },
    {
      scope: ["variable", "variable.other"],
      settings: { foreground: "#171717" },
    },
    {
      scope: ["variable.parameter"],
      settings: { foreground: "#B45309" },
    },
    {
      scope: ["entity.name.tag", "support.class.component", "entity.name.type"],
      settings: { foreground: "#D6409F" },
    },
    {
      scope: ["punctuation", "meta.brace", "meta.bracket"],
      settings: { foreground: "#6B7280" },
    },
    {
      scope: [
        "support.type.property-name",
        "entity.name.tag.json",
        "meta.object-literal.key",
        "punctuation.support.type.property-name",
      ],
      settings: { foreground: "#D6409F" },
    },
    {
      scope: ["entity.other.attribute-name"],
      settings: { foreground: "#067A6E" },
    },
    {
      scope: ["support.type.primitive", "entity.name.type.primitive"],
      settings: { foreground: "#067A6E" },
    },
  ],
};

export type SupportedLang = "bash" | "yaml" | "typescript";

export async function highlight(code: string, lang: SupportedLang = "typescript"): Promise<string> {
  return await codeToHtml(code.trim(), {
    lang,
    themes: {
      light: vercelLightTheme,
      dark: vercelDarkTheme,
    },
    defaultColor: false,
  });
}

/**
 * Highlights a record of code blocks in parallel and returns a record of
 * the same shape with `code` replaced by the rendered HTML string.
 */
export async function highlightAll<K extends string>(
  blocks: Record<K, { lang: SupportedLang; code: string }>,
): Promise<Record<K, string>> {
  const entries = await Promise.all(
    (Object.entries(blocks) as Array<[K, { lang: SupportedLang; code: string }]>).map(
      async ([key, { lang, code }]) => [key, await highlight(code, lang)] as const,
    ),
  );
  return Object.fromEntries(entries) as Record<K, string>;
}
