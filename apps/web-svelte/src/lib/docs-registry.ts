/**
 * Unified docs registry that merges upstream-backed and local pages.
 *
 * Two source kinds:
 * - "upstream": content from packages/docs-upstream/generated/content/
 * - "local": content from apps/web-svelte/src/content/
 *
 * Both kinds produce the same DocsEntry shape. Nav, search, metadata,
 * and prerendering all consume this single registry.
 */
import { PAGE_TITLES } from "./page-titles";

const upstreamMdxRaw = import.meta.glob(
  "../../../../packages/docs-upstream/generated/content/*.mdx",
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
) as Record<string, string>;

const localMdRaw = import.meta.glob(
  "../content/**/*.md",
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
) as Record<string, string>;

export type DocsSourceKind = "upstream" | "local";

export type DocsEntry = {
  title: string;
  href: string;
  raw: string;
  kind: DocsSourceKind;
};

// ---------------------------------------------------------------------------
// Upstream entries (from docs-upstream generated content)
// ---------------------------------------------------------------------------

function slugToContentKey(slug: string): string {
  const fileName = slug === "" ? "_root" : slug;
  return `../../../../packages/docs-upstream/generated/content/${fileName}.mdx`;
}

const upstreamEntries: DocsEntry[] = Object.entries(PAGE_TITLES).map(([slug, title]) => {
  const href = slug === "" ? "/" : `/${slug}`;
  const contentKey = slugToContentKey(slug);
  const raw = upstreamMdxRaw[contentKey];
  if (raw === undefined) {
    throw new Error(
      `docs-registry: slug ${JSON.stringify(slug)} has a PAGE_TITLES entry but no ` +
        `upstream MDX was found. Run \`pnpm docs:sync\` to regenerate.`,
    );
  }
  return { href, title, raw, kind: "upstream" as const };
});

// ---------------------------------------------------------------------------
// Local entries (from src/content/)
// ---------------------------------------------------------------------------

const LOCAL_CONTENT_PREFIX = "../content/";

type LocalPageDef = {
  href: string;
  title: string;
  contentPath: string;
};

function parseLocalTitle(raw: string, fallbackTitle: string): string {
  // Extract title from first H1 heading
  const match = raw.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallbackTitle;
}

function discoverLocalPages(): LocalPageDef[] {
  const pages: LocalPageDef[] = [];
  for (const key of Object.keys(localMdRaw)) {
    if (!key.startsWith(LOCAL_CONTENT_PREFIX)) continue;
    const relativePath = key.slice(LOCAL_CONTENT_PREFIX.length);
    // Convert file path to href: foundry/auth/oauth.md -> /foundry/auth/oauth
    const href = "/" + relativePath.replace(/\.md$/, "");
    const raw = localMdRaw[key];
    const title = parseLocalTitle(raw, href);
    pages.push({ href, title, contentPath: key });
  }
  return pages.sort((a, b) => a.href.localeCompare(b.href));
}

const localPageDefs = discoverLocalPages();

const localEntries: DocsEntry[] = localPageDefs.map(({ href, title, contentPath }) => {
  const raw = localMdRaw[contentPath];
  return { href, title, raw, kind: "local" as const };
});

// ---------------------------------------------------------------------------
// Merged registry
// ---------------------------------------------------------------------------

/**
 * All docs entries, upstream first then local. The upstream `/foundry`
 * page is replaced by the local Foundry overview if one exists.
 */
export const allDocsEntries: readonly DocsEntry[] = (() => {
  const localHrefs = new Set(localEntries.map((e) => e.href));
  // Filter out upstream entries that are overridden by local pages
  const filtered = upstreamEntries.filter((e) => !localHrefs.has(e.href));
  return [...filtered, ...localEntries];
})();

export const docsEntryByHref = new Map(allDocsEntries.map((e) => [e.href, e]));

/**
 * All prerenderable hrefs, excluding the root (which has its own route).
 */
export function allNonRootHrefs(): string[] {
  return allDocsEntries.filter((e) => e.href !== "/").map((e) => e.href);
}
