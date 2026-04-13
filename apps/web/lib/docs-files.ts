/**
 * Docs-files loader for the `/api/docs-chat` route handler.
 *
 * Walks `allDocsPages` in source order, reads each registered
 * page's upstream `page.mdx` from the given `docsRoot` (the
 * `apps/web` project root; `app/` is appended internally to match
 * the Next.js `app/<slug>/page.mdx` layout), runs it through the
 * shared `mdxToCleanMarkdown` stripper, and returns a flat
 * `{ fileName -> markdown }` map keyed on the `/index.md` / `/<slug>.md`
 * shape the bash tool's virtual workspace exposes to the model.
 *
 * The key shape contract is:
 *
 *   - root page (href "/")   -> `/index.md`
 *   - non-root page (href "/X") -> `/X.md`
 *
 * The docs-chat opening-summary composer in `./docs-chat-summary.ts`
 * asserts that `/programmatic-api.md` and `/nextjs.md` are present
 * in this map before emitting the system prompt, so any drift in
 * the key shape would surface there as a loud runtime failure.
 *
 * Uses `Promise.allSettled` so individual file-read failures (a
 * page that was removed from disk but still exists in `allDocsPages`,
 * a permissions glitch, etc.) do not break the whole map — the
 * remaining pages still surface, and the missing entry is simply
 * absent from the returned map.
 *
 * Exported as a pure function so the docs-chat regression tests can
 * pass a test-time `docsRoot` without touching the live `/api/docs-chat`
 * route handler, which imports `next/headers`, the AI SDK, and the
 * bash tool at module init and cannot be imported cleanly from a
 * vanilla Vitest environment.
 */
import { readFile } from "fs/promises";
import { join } from "path";
import { allDocsPages } from "./docs-navigation";
import { mdxToCleanMarkdown } from "./mdx-to-markdown";

export async function loadDocsFilesFromRoot(
  docsRoot: string,
): Promise<Record<string, string>> {
  const files: Record<string, string> = {};

  const results = await Promise.allSettled(
    allDocsPages.map(async (page) => {
      const slug = page.href.replace(/^\//, "");
      const filePath = slug
        ? join(docsRoot, "app", slug, "page.mdx")
        : join(docsRoot, "app", "page.mdx");

      const raw = await readFile(filePath, "utf-8");
      const md = mdxToCleanMarkdown(raw);
      const fileName = slug ? `/${slug}.md` : "/index.md";
      return { fileName, md };
    }),
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      files[result.value.fileName] = result.value.md;
    }
  }

  return files;
}
