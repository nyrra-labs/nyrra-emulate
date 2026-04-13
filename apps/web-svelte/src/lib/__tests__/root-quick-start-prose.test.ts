import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  rootQuickStartIntroHtml,
  rootQuickStartIntroMdx,
  rootQuickStartPostListHtml,
  rootQuickStartPostListMdx,
} from "../root-quick-start-prose.server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// apps/web-svelte/src/lib/__tests__ -> repo root is 5 levels up.
const REPO_ROOT = resolve(__dirname, "../../../../..");
const ROOT_MDX_PATH = resolve(REPO_ROOT, "apps/web/app/page.mdx");

describe("rootQuickStartIntroMdx slice", () => {
  it("is a non-empty single-paragraph string", () => {
    expect(typeof rootQuickStartIntroMdx).toBe("string");
    expect(rootQuickStartIntroMdx.length).toBeGreaterThan(0);
    // Single paragraph -> no blank line inside the block.
    expect(rootQuickStartIntroMdx).not.toMatch(/\n\n/);
  });

  it("does not start with a list-item marker", () => {
    expect(rootQuickStartIntroMdx.startsWith("- ")).toBe(false);
  });

  it("contains the upstream 'default startup set' load-bearing phrase", () => {
    // The upstream intro reads "The default startup set starts with sensible
    // defaults. No config file needed:" — both halves are load-bearing.
    expect(rootQuickStartIntroMdx).toContain("default startup set");
    expect(rootQuickStartIntroMdx).toContain("sensible defaults");
    expect(rootQuickStartIntroMdx).toContain("No config file needed");
  });

  it("matches the upstream apps/web/app/page.mdx slice between the Quick Start fence and the first bullet", () => {
    const upstream = readFileSync(ROOT_MDX_PATH, "utf-8");
    const qsIdx = upstream.indexOf("## Quick Start");
    const cliIdx = upstream.indexOf("## CLI", qsIdx);
    expect(qsIdx).toBeGreaterThan(-1);
    expect(cliIdx).toBeGreaterThan(qsIdx);
    const body = upstream.slice(qsIdx, cliIdx);

    // Find the fence, then slice after it.
    const fenceMatch = body.match(/^```(?:\w*)\n[\s\S]*?^```/m);
    expect(fenceMatch).not.toBeNull();
    const afterFence = body.slice((fenceMatch!.index ?? 0) + fenceMatch![0].length).trim();
    const [expectedIntro] = afterFence.split(/\n{2,}/).map((s) => s.trim());
    expect(rootQuickStartIntroMdx).toBe(expectedIntro);
  });
});

describe("rootQuickStartPostListMdx slice", () => {
  it("is a non-empty single-paragraph string", () => {
    expect(typeof rootQuickStartPostListMdx).toBe("string");
    expect(rootQuickStartPostListMdx.length).toBeGreaterThan(0);
    expect(rootQuickStartPostListMdx).not.toMatch(/\n\n/);
  });

  it("does not start with a list-item marker", () => {
    expect(rootQuickStartPostListMdx.startsWith("- ")).toBe(false);
  });

  it("starts with the upstream 'Foundry is available' Foundry-availability sentence", () => {
    expect(rootQuickStartPostListMdx.startsWith("Foundry is available")).toBe(true);
  });

  it("contains the upstream backtick-inline-code tokens for `emulate --service foundry` and `foundry:`", () => {
    // The upstream paragraph wraps both as inline code spans.
    expect(rootQuickStartPostListMdx).toContain("`emulate --service foundry`");
    expect(rootQuickStartPostListMdx).toContain("`foundry:`");
  });

  it("contains the upstream Foundry slice description tokens", () => {
    expect(rootQuickStartPostListMdx).toContain("OAuth 2.0");
    expect(rootQuickStartPostListMdx).toContain("current-user lookup");
    expect(rootQuickStartPostListMdx).toContain("compute-module runtime");
    expect(rootQuickStartPostListMdx).toContain("contour routes");
  });

  it("matches the upstream apps/web/app/page.mdx slice between the last Quick Start bullet and the '## CLI' heading", () => {
    const upstream = readFileSync(ROOT_MDX_PATH, "utf-8");
    const qsIdx = upstream.indexOf("## Quick Start");
    const cliIdx = upstream.indexOf("## CLI", qsIdx);
    const body = upstream.slice(qsIdx, cliIdx);

    const fenceMatch = body.match(/^```(?:\w*)\n[\s\S]*?^```/m);
    expect(fenceMatch).not.toBeNull();
    const afterFence = body.slice((fenceMatch!.index ?? 0) + fenceMatch![0].length).trim();
    const blocks = afterFence
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    expect(blocks.length).toBe(3);
    expect(rootQuickStartPostListMdx).toBe(blocks[2]);
  });
});

describe("rootQuickStartIntroHtml rendered content", () => {
  it("renders a single <p> with the shared docs paragraph utility classes", () => {
    // The shared docs renderer emits `<p class="mb-4 text-sm leading-relaxed
    // text-neutral-600 dark:text-neutral-400">`, matching the historical
    // hand-written Svelte paragraph classes byte-for-byte.
    expect(rootQuickStartIntroHtml).toMatch(/<p\s+class="[^"]*mb-4[^"]*text-sm[^"]*leading-relaxed[^"]*"[^>]*>/);
  });

  it("renders the upstream 'default startup set starts with sensible defaults' text", () => {
    expect(rootQuickStartIntroHtml).toContain("default startup set starts with sensible defaults");
    expect(rootQuickStartIntroHtml).toContain("No config file needed");
  });

  it("does not render any list, list-item, or heading markup", () => {
    expect(rootQuickStartIntroHtml).not.toContain("<ul");
    expect(rootQuickStartIntroHtml).not.toContain("<li");
    expect(rootQuickStartIntroHtml).not.toContain("<h2");
    expect(rootQuickStartIntroHtml).not.toContain("<h1");
  });

  it("does not render the stale hand-authored 'boots the supporting emulator stack' prose", () => {
    expect(rootQuickStartIntroHtml).not.toContain("boots the supporting emulator stack");
    expect(rootQuickStartIntroHtml).not.toContain("No config file is needed for the supporting");
  });
});

describe("rootQuickStartPostListHtml rendered content", () => {
  it("renders a single <p> with the shared docs paragraph utility classes", () => {
    expect(rootQuickStartPostListHtml).toMatch(/<p\s+class="[^"]*mb-4[^"]*text-sm[^"]*leading-relaxed[^"]*"[^>]*>/);
  });

  it("renders the Foundry-availability lead sentence", () => {
    expect(rootQuickStartPostListHtml).toContain("Foundry is available");
  });

  it("renders the `emulate --service foundry` inline code via the shared docs codespan class", () => {
    expect(rootQuickStartPostListHtml).toMatch(
      /<code class="[^"]*bg-neutral-100[^"]*"[^>]*>emulate --service foundry<\/code>/,
    );
  });

  it("renders the `foundry:` inline code via the shared docs codespan class", () => {
    expect(rootQuickStartPostListHtml).toMatch(/<code class="[^"]*bg-neutral-100[^"]*"[^>]*>foundry:<\/code>/);
  });

  it("renders the Foundry slice description tokens", () => {
    expect(rootQuickStartPostListHtml).toContain("OAuth 2.0");
    expect(rootQuickStartPostListHtml).toContain("current-user lookup");
    expect(rootQuickStartPostListHtml).toContain("compute-module runtime");
    expect(rootQuickStartPostListHtml).toContain("contour routes");
  });

  it("does not render any list, list-item, or heading markup", () => {
    expect(rootQuickStartPostListHtml).not.toContain("<ul");
    expect(rootQuickStartPostListHtml).not.toContain("<li");
    expect(rootQuickStartPostListHtml).not.toContain("<h2");
    expect(rootQuickStartPostListHtml).not.toContain("<h1");
  });
});
