/**
 * Server-only shared docs renderer.
 *
 * Takes the raw upstream MDX string for a single page (sourced from the
 * `./docs-source` registry) and returns a single sanitized HTML string
 * styled with the same Tailwind utility classes the bespoke Svelte docs
 * pages use, so the migrated route is visually indistinguishable from
 * the hand-authored prose it replaces.
 *
 * The pipeline is:
 *
 *   1. Strip MDX-only artifacts (export/import lines, JSX-only `<div
 *      className=...>` blocks) via the same `mdxToCleanMarkdown` helper
 *      the search index uses.
 *   2. Pre-highlight every fenced code block via Shiki using the
 *      project's existing `code-highlight.server` helper, so token
 *      colors and theme variables match the bespoke `<CodeBlock />`
 *      component byte-for-byte.
 *   3. Parse the cleaned markdown with `marked`, using a custom
 *      renderer that:
 *        - applies the Tailwind classes the bespoke pages use for
 *          h1/h2/p/ul/ol/li/code,
 *        - swaps each fenced code block for the same wrapper div
 *          markup `CodeBlock.svelte` emits, with the pre-highlighted
 *          Shiki HTML inlined.
 *
 * The `.server.ts` suffix tells SvelteKit to keep this file off the
 * client bundle. `marked`, the Shiki theme tables, and the cleaned
 * markdown intermediates stay on the server, and the only thing that
 * leaves is the final HTML string consumed via `{@html}` in
 * `+page.svelte`.
 *
 * Trust posture: input is a build-time-bundled string from the sibling
 * `apps/web` MDX files (via Vite's `?raw` glob in `./docs-source`).
 * It is never user input, so the `{@html}` consumption in the route
 * component is safe under the same assumptions the existing
 * `CodeBlock.svelte` component already operates on.
 */
import { Marked, type Tokens } from "marked";
import { docsSources, type DocsSource } from "./docs-source";
import { highlight, type SupportedLang } from "./code-highlight.server";
import { mdxToCleanMarkdown } from "./mdx-to-markdown";

const H1_CLASS = "mb-6 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100";
const H2_CLASS = "mb-4 mt-12 text-lg font-semibold text-neutral-900 first:mt-0 dark:text-neutral-100";
const H3_CLASS = "mb-3 mt-8 text-base font-semibold text-neutral-900 dark:text-neutral-100";
const P_CLASS = "mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400";
const UL_CLASS = "mb-4 list-disc space-y-1 pl-5 text-sm";
const OL_CLASS = "mb-4 list-decimal space-y-1 pl-5 text-sm";
const LI_CLASS = "text-neutral-600 dark:text-neutral-400";
const STRONG_CLASS = "font-medium text-neutral-900 dark:text-neutral-100";
const INLINE_CODE_CLASS = "rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800";
const LINK_CLASS =
  "text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-700 dark:hover:decoration-neutral-100";
const CODE_BLOCK_OUTER_CLASS =
  "my-4 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 font-mono text-[13px] dark:border-neutral-800 dark:bg-neutral-900";
const CODE_BLOCK_INNER_CLASS = "code-block-shiki overflow-x-auto";

/**
 * Maps a fenced code block's language hint onto the `SupportedLang`
 * union the existing Shiki helper accepts. Unlabeled fences default to
 * typescript, matching `apps/web/mdx-components.tsx`'s upstream default
 * so the architecture page's unlabeled directory-tree fence (the only
 * unlabeled fence in the upstream corpus today) preserves its
 * typescript-tinted token coloring through the migration. Unknown
 * languages fall back to bash so untagged shell snippets still render.
 */
function mapLang(lang: string | undefined): SupportedLang {
  switch ((lang ?? "").toLowerCase()) {
    case "ts":
    case "tsx":
    case "typescript":
    case "":
      return "typescript";
    case "yaml":
    case "yml":
      return "yaml";
    case "bash":
    case "sh":
    case "shell":
      return "bash";
    default:
      return "bash";
  }
}

/**
 * Renders a single docs page from its raw upstream MDX string.
 *
 * Pre-highlights fenced code blocks via Shiki using a `walkTokens`
 * pass before the synchronous `marked` render, then looks each
 * highlighted snippet back up by token reference inside the `code`
 * renderer via a `WeakMap`. This avoids any `text` mutation footgun
 * and keeps the highlight pass cleanly separated from the markup pass.
 */
export async function renderDocsHtml(rawMdx: string): Promise<string> {
  const cleaned = mdxToCleanMarkdown(rawMdx);

  const highlightedByToken = new WeakMap<Tokens.Code, string>();

  const instance = new Marked({
    async: true,
    walkTokens: async (token) => {
      if (token.type === "code") {
        const codeToken = token as Tokens.Code;
        const html = await highlight(codeToken.text, mapLang(codeToken.lang));
        highlightedByToken.set(codeToken, html);
      }
    },
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        if (depth === 1) return `<h1 class="${H1_CLASS}">${text}</h1>\n`;
        if (depth === 2) return `<h2 class="${H2_CLASS}">${text}</h2>\n`;
        return `<h${depth} class="${H3_CLASS}">${text}</h${depth}>\n`;
      },
      paragraph({ tokens }) {
        const text = this.parser.parseInline(tokens);
        return `<p class="${P_CLASS}">${text}</p>\n`;
      },
      list(token) {
        const tag = token.ordered ? "ol" : "ul";
        const cls = token.ordered ? OL_CLASS : UL_CLASS;
        let body = "";
        for (const item of token.items) {
          body += this.listitem(item);
        }
        const start = token.ordered && token.start !== 1 && token.start !== "" ? ` start="${token.start}"` : "";
        return `<${tag} class="${cls}"${start}>\n${body}</${tag}>\n`;
      },
      listitem(item) {
        return `<li class="${LI_CLASS}">${this.parser.parse(item.tokens)}</li>\n`;
      },
      code(token) {
        const html = highlightedByToken.get(token);
        if (html === undefined) {
          throw new Error(
            `render-docs: code block was not pre-highlighted by walkTokens. ` +
              `lang=${token.lang ?? "(none)"} text-prefix=${JSON.stringify(token.text.slice(0, 60))}`,
          );
        }
        return `<div class="${CODE_BLOCK_OUTER_CLASS}"><div class="${CODE_BLOCK_INNER_CLASS}">${html}</div></div>\n`;
      },
      codespan({ text }) {
        return `<code class="${INLINE_CODE_CLASS}">${text}</code>`;
      },
      strong({ tokens }) {
        const text = this.parser.parseInline(tokens);
        return `<strong class="${STRONG_CLASS}">${text}</strong>`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
        return `<a class="${LINK_CLASS}" href="${escapeAttr(href)}"${titleAttr}>${text}</a>`;
      },
    },
  });

  const out = await instance.parse(cleaned);
  return out;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Resolves a docs-source registry entry by href, then renders it.
 * Throws loudly if the href is not in the registry, so a typo at the
 * call site surfaces at build time rather than as a 404 or empty page.
 */
export async function renderDocsHtmlByHref(href: string): Promise<{
  source: DocsSource;
  html: string;
}> {
  const source = docsSources.find((entry) => entry.href === href);
  if (source === undefined) {
    throw new Error(
      `render-docs: no docs-source registry entry for href ${href}. ` +
        `Either the Svelte route does not exist yet or the href is misspelled.`,
    );
  }
  const html = await renderDocsHtml(source.raw);
  return { source, html };
}
