import { readFile } from "fs/promises";
import { join } from "path";
import { APPS_WEB_ROOT } from "./apps-web-root";
import { allDocsPages } from "./docs-pages";
import { mdxToCleanMarkdown } from "./mdx-to-markdown";

export type IndexEntry = {
  title: string;
  href: string;
  content: string;
};

export type SearchResult = {
  title: string;
  href: string;
  snippet: string;
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

function mdxFileForSlug(docsRoot: string, slug: string): string {
  const appRoot = join(docsRoot, "app");
  if (slug === "/") {
    return join(appRoot, "page.mdx");
  }
  const rest = slug.replace(/^\//, "");
  return join(appRoot, ...rest.split("/"), "page.mdx");
}

/**
 * Walks `allDocsPages` and produces one `IndexEntry` per registered
 * docs page, reading each page's upstream `page.mdx` from the given
 * `docsRoot` (the `apps/web` project root; `app/` is appended
 * internally to match the Next.js `app/<slug>/page.mdx` layout).
 *
 * Missing files fall back to an empty `content` string — the entry
 * is still emitted so the full registry surface stays coverable.
 *
 * Exported as a pure function so the search-index regression tests
 * can pass a test-time `docsRoot` (the absolute path to `apps/web/`)
 * without touching the shared module-level cache in `getSearchIndex`.
 */
export async function buildSearchIndexFromRoot(docsRoot: string): Promise<IndexEntry[]> {
  const entries: IndexEntry[] = [];

  for (const item of allDocsPages) {
    try {
      const raw = await readFile(mdxFileForSlug(docsRoot, item.href), "utf-8");
      const md = mdxToCleanMarkdown(raw);
      const content = stripMarkdown(md);
      entries.push({
        title: item.name,
        href: item.href,
        content,
      });
    } catch {
      entries.push({
        title: item.name,
        href: item.href,
        content: "",
      });
    }
  }

  return entries;
}

export async function getSearchIndex(): Promise<IndexEntry[]> {
  if (cached) return cached;
  cached = await buildSearchIndexFromRoot(APPS_WEB_ROOT);
  return cached;
}

/**
 * Pure search scorer consumed by `app/api/search/route.ts`'s GET
 * handler. Takes a raw query string (possibly empty, possibly
 * mixed-case) and an in-memory index, normalizes the query by
 * trimming + lowercasing, and returns up to 20 ranked results with
 * title-match entries sorted above content-match entries. The empty-
 * query case returns an empty array so the route handler can forward
 * its return value directly into `NextResponse.json({ results })`.
 *
 * Exported as a pure function so the search regression tests can
 * drive it with a synthetic index without invoking the route handler
 * or touching the real filesystem-backed search index.
 */
export function searchEntries(query: string, index: IndexEntry[]): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const terms = q.split(/\s+/).filter(Boolean);

  return index
    .map((entry) => {
      const titleLower = entry.title.toLowerCase();
      const contentLower = entry.content.toLowerCase();

      const titleMatch = terms.every((t) => titleLower.includes(t));
      const contentMatch = terms.every((t) => contentLower.includes(t));

      if (!titleMatch && !contentMatch) return null;

      let snippet = "";
      if (contentMatch) {
        const firstTermIdx = Math.min(
          ...terms.map((t) => {
            const idx = contentLower.indexOf(t);
            return idx === -1 ? Infinity : idx;
          }),
        );
        if (firstTermIdx !== Infinity) {
          const start = Math.max(0, firstTermIdx - 40);
          const end = Math.min(entry.content.length, firstTermIdx + 120);
          snippet =
            (start > 0 ? "..." : "") +
            entry.content.slice(start, end).replace(/\n/g, " ") +
            (end < entry.content.length ? "..." : "");
        }
      }

      return {
        title: entry.title,
        href: entry.href,
        snippet,
        score: titleMatch ? 2 : 1,
      };
    })
    .filter(
      (
        r,
      ): r is {
        title: string;
        href: string;
        snippet: string;
        score: number;
      } => r !== null,
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(({ title, href, snippet }) => ({ title, href, snippet }));
}
