/**
 * Root-page Quick Start prose extractor.
 *
 * The docs-site root page's `## Quick Start` section reads as:
 *
 *     ## Quick Start
 *
 *     ```bash
 *     npx emulate
 *     ```
 *
 *     <intro paragraph>
 *
 *     - **Vercel** on ...
 *     - **GitHub** on ...
 *     ...
 *     - **Clerk** on ...
 *
 *     <post-list paragraph mentioning Foundry availability>
 *
 *     ## CLI
 *
 * The fenced code block is already derived from upstream via
 * `root-code-blocks.server.ts`, and the bullet list is runtime-derived
 * from `DEFAULT_SERVICE_NAMES` via `default-services.server.ts`. The
 * intro paragraph and the post-list paragraph, however, lived as
 * hand-authored prose on the Svelte root page even though upstream
 * `apps/web/app/page.mdx` owns the canonical copy. Hardcoding either
 * paragraph in the Svelte shell means every upstream edit drifts
 * silently.
 *
 * This helper slices the `## Quick Start` -> `## CLI` body out of the
 * upstream MDX, splits the post-fence content into its three
 * blank-line-separated blocks (intro paragraph | bullet list |
 * post-list paragraph), validates the shape at module init, and
 * renders each prose block through the shared `renderDocsHtml`
 * pipeline so inline code spans pick up the same Tailwind classes
 * the bespoke docs pages use.
 *
 * The runtime-derived bullet list still lives in the Svelte template,
 * so the rendered Quick Start section reads: upstream intro prose ->
 * runtime list -> upstream post-list prose -> `## CLI`.
 *
 * A future upstream edit to either paragraph flows into the Svelte
 * root page automatically. A future upstream change that restructures
 * the Quick Start section (removes the intro, drops the Foundry-
 * availability paragraph, reorders the list, or inserts extra blocks)
 * aborts the build at module init with a precise error.
 *
 * The `.server.ts` suffix keeps this module off the client bundle; it
 * is only consumed by the root `+page.server.ts` at build-time
 * prerender. The rendered HTML strings are computed eagerly via
 * top-level await so `+page.server.ts`'s `load()` just reads the
 * pre-baked values rather than re-running the docs renderer on every
 * prerender call.
 */
import { renderDocsHtml } from "./render-docs.server";
import { sliceRootPageSection } from "./root-page-source.server";

const QUICK_START_HEADING = "## Quick Start";
const CLI_HEADING = "## CLI";
const LIST_ITEM_PREFIX = "- ";

// The shared `sliceRootPageSection` helper throws a precise error
// at module init if either heading anchor is missing from the
// upstream MDX, so this helper inherits that loud-fail behavior
// without duplicating the docsSources lookup or the per-marker
// precondition checks. The returned slice is start-marker-inclusive;
// the fence-finding step below anchors on the next line beginning
// with ```` ``` ```` so the included heading is a no-op for the rest
// of the pipeline.
const quickStartBody = sliceRootPageSection(QUICK_START_HEADING, CLI_HEADING);

// The Quick Start section contains exactly one fenced code block (the
// `npx emulate` example). Find the first fence and split the body
// into "before fence | fence | after fence" via the same regex shape
// `root-code-blocks.server.ts` uses, minus the global flag since only
// the first match matters here.
const fenceRegex = /^```(?:\w*)\n[\s\S]*?^```/m;
const fenceMatch = fenceRegex.exec(quickStartBody);
if (!fenceMatch) {
  throw new Error(
    `root-quick-start-prose: the upstream Quick Start section does not ` +
      `contain a fenced code block. The root Svelte page expects a ` +
      `bash fence (the 'npx emulate' example) inside this section.`,
  );
}

const afterFenceStart = fenceMatch.index + fenceMatch[0].length;
const afterFence = quickStartBody.slice(afterFenceStart).trim();

// Split by blank-line boundaries. The expected post-fence shape is:
//   [0] intro paragraph
//   [1] bullet list (single markdown block, one `- ` line per item)
//   [2] post-list paragraph (Foundry availability)
const blocks = afterFence
  .split(/\n{2,}/)
  .map((block) => block.trim())
  .filter((block) => block.length > 0);

if (blocks.length !== 3) {
  throw new Error(
    `root-quick-start-prose: expected exactly 3 blank-line-separated blocks ` +
      `after the fenced code block in the upstream Quick Start section ` +
      `(intro paragraph | bullet list | post-list paragraph); found ` +
      `${blocks.length}. The root Svelte page's prose derivation requires ` +
      `exactly this shape so the runtime-derived bullet list can sit between ` +
      `the two prose fragments.`,
  );
}

const [introBlock, listBlock, postListBlock] = blocks;

if (introBlock.startsWith(LIST_ITEM_PREFIX)) {
  throw new Error(
    `root-quick-start-prose: the first post-fence block is a list, not an ` +
      `intro paragraph. Upstream Quick Start shape changed unexpectedly.`,
  );
}

if (!listBlock.startsWith(LIST_ITEM_PREFIX)) {
  throw new Error(
    `root-quick-start-prose: the middle post-fence block is not a markdown ` +
      `list (no leading "${LIST_ITEM_PREFIX}"). Upstream Quick Start shape ` +
      `changed unexpectedly.`,
  );
}

if (postListBlock.startsWith(LIST_ITEM_PREFIX)) {
  throw new Error(
    `root-quick-start-prose: the third post-fence block is a list, not a ` +
      `post-list paragraph. Upstream Quick Start shape changed unexpectedly.`,
  );
}

/**
 * Raw intro paragraph MDX between the `npx emulate` fenced block and
 * the first bullet of the default-startup list. Exported for test
 * verification; consumers should read `rootQuickStartIntroHtml` below.
 */
export const rootQuickStartIntroMdx: string = introBlock;

/**
 * Raw post-list paragraph MDX between the last bullet of the default-
 * startup list and the `## CLI` heading. Exported for test
 * verification; consumers should read `rootQuickStartPostListHtml`
 * below.
 */
export const rootQuickStartPostListMdx: string = postListBlock;

/**
 * Pre-rendered HTML for the Quick Start intro paragraph, baked at
 * module init via the shared `renderDocsHtml` pipeline. Emits a
 * `<p class="${P_CLASS}">...</p>` block that the root Svelte template
 * drops in above the runtime-derived default-startup list.
 */
export const rootQuickStartIntroHtml: string = await renderDocsHtml(introBlock);

/**
 * Pre-rendered HTML for the Quick Start post-list paragraph (the
 * Foundry-availability prose), baked at module init via the shared
 * `renderDocsHtml` pipeline. Emits a `<p class="${P_CLASS}">...</p>`
 * block with the `emulate --service foundry` and `foundry:` inline
 * code spans styled via the shared `INLINE_CODE_CLASS`. The root
 * Svelte template drops it in below the runtime-derived default-
 * startup list, right before the `## CLI` heading.
 */
export const rootQuickStartPostListHtml: string = await renderDocsHtml(postListBlock);
