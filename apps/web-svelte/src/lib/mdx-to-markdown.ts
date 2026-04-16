/**
 * Converts raw MDX content to clean Markdown suitable for indexing.
 *
 * Strips top-level export/import statements and standalone JSX divs with
 * className attributes, passing everything else through as valid Markdown.
 *
 * Mirrors apps/web/lib/mdx-to-markdown.ts so the search index built in this
 * package matches the source-of-truth content from the Next.js docs MDX files.
 */
export function mdxToCleanMarkdown(raw: string): string {
  const lines = raw.split("\n");
  const out: string[] = [];
  let inJsxBlock = false;
  let jsxDepth = 0;
  let activeFence: { char: "`" | "~"; length: number } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);

    if (activeFence) {
      out.push(line);
      if (fenceMatch && fenceMatch[1][0] === activeFence.char && fenceMatch[1].length >= activeFence.length) {
        activeFence = null;
      }
      continue;
    }

    if (fenceMatch) {
      activeFence = {
        char: fenceMatch[1][0] as "`" | "~",
        length: fenceMatch[1].length,
      };
      out.push(line);
      continue;
    }

    if (trimmed.startsWith("export ") || trimmed.startsWith("import ")) {
      continue;
    }

    if (!inJsxBlock && trimmed.startsWith("<div ") && trimmed.includes("className=")) {
      inJsxBlock = true;
      jsxDepth = 1;
      continue;
    }

    if (inJsxBlock) {
      const opens = (line.match(/<div[\s>]/g) || []).length;
      const closes = (line.match(/<\/div>/g) || []).length;
      jsxDepth += opens - closes;
      if (jsxDepth <= 0) {
        inJsxBlock = false;
        jsxDepth = 0;
      }
      continue;
    }

    out.push(line);
  }

  let result = out.join("\n");
  result = result.replace(/^\n+/, "\n").trim();
  return result;
}
