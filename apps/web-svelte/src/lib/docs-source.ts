/**
 * Shared docs-source registry.
 *
 * Reads upstream content from the docs-upstream generated package
 * instead of reaching into apps/web directly. Local content sources
 * will be merged in once the local docs content model is introduced.
 *
 * The Vite glob reads from packages/docs-upstream/generated/content/
 * which contains committed MDX copies produced by `pnpm docs:sync`.
 */
import { PAGE_TITLES } from "./page-titles";

// @ts-ignore Vite injects import.meta.glob; apps/web imports this file under a non-Vite tsconfig for architecture tests.
const upstreamMdxRaw = import.meta.glob("../../../../packages/docs-upstream/generated/content/*.mdx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function slugToHref(slug: string): string {
  return slug === "" ? "/" : `/${slug}`;
}

function slugToContentKey(slug: string): string {
  const fileName = slug === "" ? "_root" : slug;
  return `../../../../packages/docs-upstream/generated/content/${fileName}.mdx`;
}

/**
 * Maps a docs-upstream content filename back to a docs href.
 */
export function mdxRelativePathToHref(relativePath: string): string {
  if (relativePath === "_root.mdx") return "/";
  const inner = relativePath.replace(/\.mdx$/, "");
  return `/${inner}`;
}

/**
 * Upstream hrefs intentionally not surfaced in this Svelte app.
 * Empty today: every upstream page has a matching PAGE_TITLES entry.
 */
const INTENTIONALLY_UNSURFACED_UPSTREAM_HREFS: ReadonlySet<string> = new Set<string>();

export type DocsSource = {
  title: string;
  href: string;
  raw: string;
};

/**
 * Ordered list of every implemented Svelte route backed by upstream MDX.
 */
export const docsSources: readonly DocsSource[] = Object.entries(PAGE_TITLES).map(([slug, title]) => {
  const href = slugToHref(slug);
  const contentKey = slugToContentKey(slug);
  const raw = upstreamMdxRaw[contentKey];
  if (raw === undefined) {
    throw new Error(
      `docs-source: slug ${JSON.stringify(slug)} has a PAGE_TITLES entry but no ` +
        `upstream MDX was found at ${contentKey}. Run \`pnpm docs:sync\` to regenerate.`,
    );
  }
  return { href, title, raw };
});

// Reverse parity guard: every docs-upstream content file must be surfaced
// or explicitly unsurfaced.
const CONTENT_KEY_PREFIX = "../../../../packages/docs-upstream/generated/content/";
const surfacedHrefs = new Set(docsSources.map((source) => source.href));
for (const mdxKey of Object.keys(upstreamMdxRaw)) {
  const fileName = mdxKey.startsWith(CONTENT_KEY_PREFIX) ? mdxKey.slice(CONTENT_KEY_PREFIX.length) : mdxKey;
  const upstreamHref = mdxRelativePathToHref(fileName);
  if (surfacedHrefs.has(upstreamHref)) continue;
  if (INTENTIONALLY_UNSURFACED_UPSTREAM_HREFS.has(upstreamHref)) continue;
  throw new Error(
    `docs-source: upstream content file ${fileName} (href ${JSON.stringify(upstreamHref)}) ` +
      `is not surfaced via PAGE_TITLES and is not in ` +
      `INTENTIONALLY_UNSURFACED_UPSTREAM_HREFS. Run \`pnpm docs:sync\` or update PAGE_TITLES.`,
  );
}
