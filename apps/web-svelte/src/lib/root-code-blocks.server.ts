/**
 * Root-page code-block extractor.
 *
 * The docs-site root page prerenders two bash fenced code blocks in
 * its Quick Start and CLI sections. Those blocks live in upstream
 * `apps/web/app/page.mdx` (the canonical Getting Started docs), so
 * maintaining a parallel hardcoded copy in `+page.server.ts` means
 * every upstream edit to the Quick Start or CLI examples would drift
 * silently from the Svelte shell's rendered output.
 *
 * This helper reuses the shared `docs-source` registry to read the
 * root page's raw MDX (the same `?raw` Vite glob that feeds the
 * search index and the generic `[slug]` docs renderer), extracts the
 * first two ``` ``` fenced blocks, validates that both are in the
 * `SupportedLang` union at module init, and exports them in the
 * shape that `highlightAll()` expects. A future upstream edit to
 * either fenced block — text, language, or position — flows into
 * the Svelte root page automatically without a parallel local edit,
 * and a regression that removes or reorders the blocks aborts the
 * build with a precise error.
 *
 * The `.server.ts` suffix keeps this module off the client bundle;
 * it is only consumed by the root `+page.server.ts` at build-time
 * prerender, and the raw MDX it depends on is build-time-bundled.
 */
import type { SupportedLang } from "./code-highlight.server";
import { docsSources } from "./docs-source";

type RootCodeBlock = { lang: SupportedLang; code: string };

type FencedBlock = { lang: string; code: string };

/**
 * Extracts every ```lang ... ``` fenced block from a markdown string
 * in source order. The regex uses the `m` flag so `^` anchors on line
 * starts, and the non-greedy `[\s\S]*?` body stops at the first line
 * that begins with ``` ```. The captured code has its trailing newline
 * stripped so the result matches the text between the opening fence's
 * `\n` and the closing fence's preceding `\n`, which is the canonical
 * form the existing `highlightAll()` consumers expect.
 */
function extractFencedBlocks(mdx: string): FencedBlock[] {
  const blocks: FencedBlock[] = [];
  const regex = /^```(\w*)\n([\s\S]*?)^```/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(mdx)) !== null) {
    blocks.push({ lang: match[1], code: match[2].replace(/\n$/, "") });
  }
  return blocks;
}

function isSupportedLang(lang: string): lang is SupportedLang {
  return lang === "bash" || lang === "yaml" || lang === "typescript";
}

const rootSource = docsSources.find((source) => source.href === "/");
if (!rootSource) {
  throw new Error(
    "root-code-blocks: docsSources is missing the root '/' entry. " +
      "Check apps/web-svelte/src/lib/docs-source.ts and apps/web-svelte/src/lib/page-titles.ts.",
  );
}

const fencedBlocks = extractFencedBlocks(rootSource.raw);
if (fencedBlocks.length < 2) {
  throw new Error(
    `root-code-blocks: expected at least 2 fenced code blocks in upstream ` +
      `apps/web/app/page.mdx, found ${fencedBlocks.length}. The root Quick Start and ` +
      `CLI sections each own one fenced block; removing either breaks the Svelte root page.`,
  );
}

const firstLang = fencedBlocks[0].lang;
const secondLang = fencedBlocks[1].lang;
if (!isSupportedLang(firstLang) || !isSupportedLang(secondLang)) {
  throw new Error(
    `root-code-blocks: the first two fenced block langs in apps/web/app/page.mdx ` +
      `must be in SupportedLang ("bash" | "yaml" | "typescript"); got ` +
      `${JSON.stringify(firstLang)} and ${JSON.stringify(secondLang)}.`,
  );
}

/**
 * First two fenced code blocks from upstream `apps/web/app/page.mdx`,
 * in source order: the Quick Start `npx emulate` block and the CLI
 * multi-line examples block. Consumed by the root `+page.server.ts`
 * as the input to `highlightAll()`, so the rendered root page's
 * `codeBlocks.quickStart` and `codeBlocks.cli` HTML are guaranteed to
 * match the upstream MDX source byte-for-byte.
 */
export const rootCodeBlocks: { quickStart: RootCodeBlock; cli: RootCodeBlock } = {
  quickStart: { lang: firstLang, code: fencedBlocks[0].code },
  cli: { lang: secondLang, code: fencedBlocks[1].code },
};
