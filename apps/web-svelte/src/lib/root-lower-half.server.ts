/**
 * Root-page lower-half extractor.
 *
 * The docs-site root page prerenders three generic sections below the
 * CLI code block — "Options" (an HTML table of `emulate` CLI flags
 * plus the `EMULATE_PORT` / `PORT` env-var paragraph), "Programmatic
 * API" (a paragraph linking to `/programmatic-api`), and "Next.js
 * Integration" (a paragraph linking to `/nextjs`). Those sections
 * live in upstream `apps/web/app/page.mdx` starting at the `## Options`
 * heading and continuing through the end of the file. Hardcoding a
 * parallel copy in `+page.svelte` means every upstream edit to any
 * of those sections drifts silently from the Svelte shell.
 *
 * This helper slices the upstream MDX from the `## Options` marker to
 * the end of the file, passes it through the existing shared
 * `renderDocsHtml` pipeline (marked + Shiki + the same Tailwind
 * utility-class overrides the generic `[slug]` docs renderer uses),
 * and exports the rendered HTML string. The Foundry-first hero, the
 * "Start with Foundry" section, the derived default-startup list,
 * the Quick Start code block, and the CLI code block remain
 * hand-authored (or upstream-code-block-sourced from `a8a67da`) in
 * `+page.svelte`; only the generic post-CLI content is derived here.
 *
 * A future upstream edit to any of the three sections flows into the
 * Svelte root page automatically. A future upstream change that
 * removes or renames the `## Options` anchor aborts the build at
 * module init with a precise error.
 *
 * The `.server.ts` suffix keeps the module off the client bundle; it
 * is only consumed by the root `+page.server.ts` at build-time
 * prerender. The rendered HTML is computed eagerly via top-level
 * await so `+page.server.ts`'s `load()` just reads the pre-baked
 * string rather than re-running the docs renderer on every call.
 */
import { renderDocsHtml } from "./render-docs.server";
import { sliceRootPageSection } from "./root-page-source.server";

const OPTIONS_MARKER = "## Options";

/**
 * Raw MDX slice starting at the `## Options` heading and running to
 * the end of the upstream `apps/web/app/page.mdx` file. Delegates to
 * the shared `sliceRootPageSection` helper, which throws a precise
 * error at module init if the `## Options` anchor is missing from
 * upstream. Exported for test verification; consumers should read
 * `rootLowerHalfHtml` below.
 */
export const rootLowerHalfMdx: string = sliceRootPageSection(OPTIONS_MARKER);

/**
 * Pre-rendered HTML for the root page's lower half, baked at module
 * init via the shared `renderDocsHtml` pipeline. This is the exact
 * same Tailwind utility-class + Shiki syntax-colored output the
 * generic `[slug]` docs route produces for full page MDX, constrained
 * to the `## Options` → end-of-file slice of the root MDX.
 */
export const rootLowerHalfHtml: string = await renderDocsHtml(rootLowerHalfMdx);
