import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { rootCodeBlocks } from "../root-code-blocks.server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// apps/web-svelte/src/lib/__tests__ → repo root is 5 levels up.
const REPO_ROOT = resolve(__dirname, "../../../../..");
const ROOT_MDX_PATH = resolve(REPO_ROOT, "apps/web/app/page.mdx");

/**
 * Independent parser (same regex as the helper under test) that
 * reads `apps/web/app/page.mdx` via Node fs at test time and
 * extracts its fenced blocks in source order. Running this in the
 * test proves the helper's extraction matches a from-scratch walk
 * of the real upstream file, not just the helper's own Vite-glob
 * snapshot.
 */
function extractFencedBlocksFromFile(): Array<{ lang: string; code: string }> {
  const text = readFileSync(ROOT_MDX_PATH, "utf-8");
  const blocks: Array<{ lang: string; code: string }> = [];
  const regex = /^```(\w*)\n([\s\S]*?)^```/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({ lang: match[1], code: match[2].replace(/\n$/, "") });
  }
  return blocks;
}

describe("rootCodeBlocks derivation from upstream apps/web/app/page.mdx", () => {
  const upstreamBlocks = extractFencedBlocksFromFile();

  it("upstream apps/web/app/page.mdx has at least 2 fenced code blocks", () => {
    expect(upstreamBlocks.length).toBeGreaterThanOrEqual(2);
  });

  it("quickStart source equals the first fenced block of the upstream MDX", () => {
    expect(rootCodeBlocks.quickStart.code).toBe(upstreamBlocks[0].code);
    expect(rootCodeBlocks.quickStart.lang).toBe(upstreamBlocks[0].lang);
  });

  it("cli source equals the second fenced block of the upstream MDX", () => {
    expect(rootCodeBlocks.cli.code).toBe(upstreamBlocks[1].code);
    expect(rootCodeBlocks.cli.lang).toBe(upstreamBlocks[1].lang);
  });

  it("both blocks are bash (the only Shiki language the root page uses today)", () => {
    expect(rootCodeBlocks.quickStart.lang).toBe("bash");
    expect(rootCodeBlocks.cli.lang).toBe("bash");
  });

  it("quickStart is the load-bearing `npx emulate` block", () => {
    expect(rootCodeBlocks.quickStart.code).toBe("npx emulate");
  });

  it("cli is the multi-line CLI examples block with --service, --port, and foundry tokens", () => {
    expect(rootCodeBlocks.cli.code).toContain("# Start the default startup set");
    expect(rootCodeBlocks.cli.code).toContain("--service");
    expect(rootCodeBlocks.cli.code).toContain("--port");
    expect(rootCodeBlocks.cli.code).toContain("foundry");
    // The multi-line block has multiple newline-separated sections.
    expect(rootCodeBlocks.cli.code.split("\n").length).toBeGreaterThan(5);
  });

  it("neither block has trailing whitespace or stray newlines after the regex trim", () => {
    expect(rootCodeBlocks.quickStart.code.endsWith("\n")).toBe(false);
    expect(rootCodeBlocks.cli.code.endsWith("\n")).toBe(false);
  });
});
