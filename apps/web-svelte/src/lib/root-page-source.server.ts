/**
 * Shared root-page upstream MDX source + slicing + fence-extraction
 * helper.
 *
 * Three root-page derivation helpers previously each redid the same
 * three lookup steps:
 *
 *   1. Find the `/` entry in `./docs-source`'s `docsSources` registry
 *      and throw if it is missing.
 *   2. Access `rootSource.raw` to get the raw upstream MDX for
 *      `apps/web/app/page.mdx`.
 *   3. For section-slice helpers: slice the raw MDX between a
 *      start heading marker (`## Options`, `## Quick Start`) and an
 *      optional end marker (`## CLI`), throwing precise errors if
 *      either marker is missing.
 *
 * Plus two of the three helpers ran the same `^```lang ... ```` fence
 * regex to pull fenced code blocks out of the raw MDX.
 *
 * This helper consolidates all of that into one module:
 *
 *   - `rootPageRawMdx` is the single accessor for the upstream MDX,
 *     computed once at module init via one `docsSources.find` +
 *     one throw-if-missing guard.
 *   - `sliceRootPageSection(startMarker, endMarker?)` returns the
 *     substring from `startMarker` (inclusive) to `endMarker`
 *     (exclusive) or end-of-file if no end marker is given, with
 *     one shared error message format and the same slice-inclusive-
 *     start semantics both consumers tolerate.
 *   - `extractFencedBlocks(mdx)` extracts every ```lang ... ```
 *     fenced block from any markdown string in source order, with
 *     the same regex shape and trailing-newline-strip behavior the
 *     `root-code-blocks.server.ts` helper used locally.
 *
 * Each consumer (`root-code-blocks.server.ts`,
 * `root-quick-start-prose.server.ts`, `root-lower-half.server.ts`)
 * now imports from this helper and keeps its own consumer-specific
 * validation + rendering logic. A future change that wants to
 * re-source the root MDX (e.g. read from a different upstream path
 * or introduce a build-time cache) only needs to touch this one
 * module.
 *
 * The `.server.ts` suffix keeps this module off the client bundle;
 * it is only consumed by the three root-page derivation helpers
 * above at build-time prerender.
 */
import { docsSources } from "./docs-source";

const rootSource = docsSources.find((source) => source.href === "/");
if (!rootSource) {
  throw new Error(
    "root-page-source: docsSources is missing the root '/' entry. " +
      "Check apps/web-svelte/src/lib/docs-source.ts and " +
      "apps/web-svelte/src/lib/page-titles.ts.",
  );
}

/**
 * Raw upstream MDX for the docs-site root page (apps/web/app/page.mdx),
 * accessed once here at module init. Every root-page derivation
 * helper reads from this single constant so they all see the same
 * source and a future upstream path change only touches this file.
 */
export const rootPageRawMdx: string = rootSource.raw;

/**
 * Slices the raw root MDX between a start heading marker (inclusive)
 * and an optional end heading marker (exclusive). If no end marker is
 * given, the slice runs to end-of-file.
 *
 * Both consumers that use this helper — `root-quick-start-prose`
 * (slices `## Quick Start` → `## CLI`) and `root-lower-half`
 * (slices `## Options` → EOF) — tolerate the start marker being
 * included in the returned substring: the fence-finding step in
 * the Quick Start consumer skips over `## Quick Start` because the
 * fence regex anchors on the next line that starts with ```` ``` ````,
 * and the lower-half consumer passes the marker-inclusive slice
 * through `renderDocsHtml` which renders it as an H2 heading.
 * Both paths produce byte-identical output to the pre-refactor
 * helpers.
 *
 * Throws loudly if either marker is missing from the upstream MDX,
 * naming the missing marker so the stack trace at the caller site
 * points at the helper whose contract just broke.
 */
export function sliceRootPageSection(startMarker: string, endMarker?: string): string {
  const startIdx = rootPageRawMdx.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error(
      `root-page-source: upstream apps/web/app/page.mdx does not contain ` +
        `the ${JSON.stringify(startMarker)} marker. Removing or renaming ` +
        `it breaks the root-page derivation helper that consumed this slice.`,
    );
  }
  if (endMarker === undefined) {
    return rootPageRawMdx.slice(startIdx);
  }
  const endIdx = rootPageRawMdx.indexOf(endMarker, startIdx + startMarker.length);
  if (endIdx === -1) {
    throw new Error(
      `root-page-source: upstream apps/web/app/page.mdx does not contain ` +
        `the ${JSON.stringify(endMarker)} marker after the ` +
        `${JSON.stringify(startMarker)} marker. Both anchors are needed to ` +
        `slice the section body deterministically.`,
    );
  }
  return rootPageRawMdx.slice(startIdx, endIdx);
}

/**
 * A single fenced code block extracted from markdown source.
 */
export type FencedBlock = { lang: string; code: string };

/**
 * Extracts every ```lang ... ``` fenced block from a markdown string
 * in source order. The regex uses the `m` flag so `^` anchors on line
 * starts, and the non-greedy `[\s\S]*?` body stops at the first line
 * that begins with ```` ``` ````. The captured code has its trailing
 * newline stripped so the result matches the text between the
 * opening fence's `\n` and the closing fence's preceding `\n`, which
 * is the canonical form the existing `highlightAll()` consumers
 * expect.
 *
 * Lifted verbatim from `root-code-blocks.server.ts` so both the
 * code-block helper and any future prose helper that needs fence
 * detection can share the same implementation.
 */
export function extractFencedBlocks(mdx: string): FencedBlock[] {
  const blocks: FencedBlock[] = [];
  const regex = /^```(\w*)\n([\s\S]*?)^```/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(mdx)) !== null) {
    blocks.push({ lang: match[1], code: match[2].replace(/\n$/, "") });
  }
  return blocks;
}
