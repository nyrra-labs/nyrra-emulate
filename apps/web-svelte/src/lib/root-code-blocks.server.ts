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
 * This helper consumes the shared `./root-page-source.server` module
 * to read the root page's raw upstream MDX and to run the
 * `extractFencedBlocks` regex over it, validates that the first two
 * blocks are both in the `SupportedLang` union at module init, and
 * exports them in the shape that `highlightAll()` expects. A future
 * upstream edit to either fenced block — text, language, or
 * position — flows into the Svelte root page automatically without a
 * parallel local edit, and a regression that removes or reorders the
 * blocks aborts the build with a precise error.
 *
 * The `.server.ts` suffix keeps this module off the client bundle;
 * it is only consumed by the root `+page.server.ts` at build-time
 * prerender, and the raw MDX it depends on is build-time-bundled
 * via the shared `root-page-source.server` helper.
 */
import type { SupportedLang } from "./code-highlight.server";
import { extractFencedBlocks, rootPageRawMdx } from "./root-page-source.server";

type RootCodeBlock = { lang: SupportedLang; code: string };

function isSupportedLang(lang: string): lang is SupportedLang {
  return lang === "bash" || lang === "yaml" || lang === "typescript";
}

const fencedBlocks = extractFencedBlocks(rootPageRawMdx);
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
