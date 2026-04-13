/**
 * Build-time-bundled search index for the Svelte docs.
 *
 * Each doc page pulls its raw upstream MDX through the shared
 * `./docs-source` registry, which auto-discovers upstream sources via
 * Vite's eager glob with `?raw`. The strings are parsed through the
 * same mdxToCleanMarkdown + stripMarkdown pipeline that apps/web uses
 * on the server, so result snippets match the Next.js search behavior.
 *
 * Bundling at build time keeps the production deploy of apps/web-svelte
 * self-contained: there are no runtime filesystem reads of the sibling
 * apps/web package, so the Svelte app can ship anywhere a Vite-built
 * SvelteKit app can ship.
 *
 * Mirrors apps/web/lib/search-index.ts.
 */
import { docsSources } from "./docs-source";
import { mdxToCleanMarkdown } from "./mdx-to-markdown";

export type IndexEntry = {
  title: string;
  href: string;
  content: string;
};

let cached: IndexEntry[] | null = null;

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function getSearchIndex(): IndexEntry[] {
  if (cached) return cached;

  const entries: IndexEntry[] = docsSources.map(({ title, href, raw }) => {
    const md = mdxToCleanMarkdown(raw);
    const content = stripMarkdown(md);
    return { title, href, content };
  });

  cached = entries;
  return entries;
}
