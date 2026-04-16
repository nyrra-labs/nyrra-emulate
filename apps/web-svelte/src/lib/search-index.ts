/**
 * Build-time-bundled search index for the Svelte docs.
 *
 * Uses the unified docs registry (upstream + local) so search covers
 * all pages regardless of source kind.
 */
import { allDocsEntries } from "./docs-registry";
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

  const entries: IndexEntry[] = allDocsEntries.map(({ title, href, raw }) => {
    const md = mdxToCleanMarkdown(raw);
    const content = stripMarkdown(md);
    return { title, href, content };
  });

  cached = entries;
  return entries;
}
