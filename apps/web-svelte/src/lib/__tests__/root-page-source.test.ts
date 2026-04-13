import { describe, expect, it } from "vitest";
import {
  extractFencedBlocks,
  rootPageRawMdx,
  sliceRootPageSection,
  type FencedBlock,
} from "../root-page-source.server";

describe("rootPageRawMdx upstream accessor", () => {
  it("is a non-empty string", () => {
    expect(typeof rootPageRawMdx).toBe("string");
    expect(rootPageRawMdx.length).toBeGreaterThan(0);
  });

  it("starts with the upstream '# Getting Started' top-level heading", () => {
    expect(rootPageRawMdx.startsWith("# Getting Started")).toBe(true);
  });

  it("contains the three H2 section markers the consumer helpers slice on", () => {
    expect(rootPageRawMdx).toContain("## Quick Start");
    expect(rootPageRawMdx).toContain("## CLI");
    expect(rootPageRawMdx).toContain("## Options");
  });
});

describe("sliceRootPageSection start-marker + end-marker slicing", () => {
  it("returns the substring from the start marker (inclusive) to the end marker (exclusive)", () => {
    const slice = sliceRootPageSection("## Quick Start", "## CLI");
    expect(slice.startsWith("## Quick Start")).toBe(true);
    expect(slice.endsWith("## CLI")).toBe(false);
    // The slice must NOT contain the CLI heading.
    expect(slice).not.toContain("## CLI");
    // The slice MUST contain the Quick Start body.
    expect(slice).toContain("npx emulate");
  });

  it("returns the substring from the start marker to EOF when no end marker is given", () => {
    const slice = sliceRootPageSection("## Options");
    expect(slice.startsWith("## Options")).toBe(true);
    // All three lower-half H2 headings appear in the slice.
    expect(slice).toContain("## Options");
    expect(slice).toContain("## Programmatic API");
    expect(slice).toContain("## Next.js Integration");
  });

  it("the Quick Start slice matches what the quick-start-prose consumer expects", async () => {
    // Byte-for-byte parity check against the consumer's exported
    // intro/post-list MDX: the shared slice must still contain those
    // raw paragraph strings so the consumer's post-fence block split
    // produces the same output it did pre-refactor.
    const slice = sliceRootPageSection("## Quick Start", "## CLI");
    const { rootQuickStartIntroMdx, rootQuickStartPostListMdx } = await import("../root-quick-start-prose.server");
    expect(slice).toContain(rootQuickStartIntroMdx);
    expect(slice).toContain(rootQuickStartPostListMdx);
  });

  it("the Options slice matches what the lower-half consumer exports", async () => {
    const slice = sliceRootPageSection("## Options");
    const { rootLowerHalfMdx } = await import("../root-lower-half.server");
    expect(slice).toBe(rootLowerHalfMdx);
  });

  it("throws with a precise error naming the missing start marker", () => {
    expect(() => sliceRootPageSection("## DefinitelyNotInTheMdx")).toThrow(/"## DefinitelyNotInTheMdx" marker/);
  });

  it("throws with a precise error naming the missing end marker", () => {
    expect(() => sliceRootPageSection("## Quick Start", "## DefinitelyNotInTheMdx")).toThrow(
      /"## DefinitelyNotInTheMdx" marker after the "## Quick Start" marker/,
    );
  });

  it("rejects an end marker that exists but only appears BEFORE the start marker", () => {
    // `# Getting Started` appears at the top of the MDX, well before
    // `## Quick Start`. Using it as an end marker should fail because
    // sliceRootPageSection only looks for the end marker AFTER the
    // start marker position.
    expect(() => sliceRootPageSection("## Quick Start", "# Getting Started")).toThrow(
      /"# Getting Started" marker after the "## Quick Start" marker/,
    );
  });
});

describe("extractFencedBlocks regex + shape", () => {
  it("returns at least two fenced blocks from the full root MDX (Quick Start + CLI examples)", () => {
    const blocks = extractFencedBlocks(rootPageRawMdx);
    expect(blocks.length).toBeGreaterThanOrEqual(2);
  });

  it("the first root fenced block is the Quick Start `npx emulate` bash example", () => {
    const blocks = extractFencedBlocks(rootPageRawMdx);
    expect(blocks[0].lang).toBe("bash");
    expect(blocks[0].code).toBe("npx emulate");
  });

  it("the second root fenced block is the CLI multi-line bash example", () => {
    const blocks = extractFencedBlocks(rootPageRawMdx);
    expect(blocks[1].lang).toBe("bash");
    // The CLI example starts with a `# Start the default startup set`
    // comment line and contains multiple emulate invocations.
    expect(blocks[1].code).toContain("# Start the default startup set");
    expect(blocks[1].code).toContain("emulate --service");
  });

  it("every returned block has its trailing newline stripped", () => {
    const blocks = extractFencedBlocks(rootPageRawMdx);
    for (const block of blocks) {
      expect(block.code.endsWith("\n")).toBe(false);
    }
  });

  it("returns an empty array for markdown with no fenced blocks", () => {
    expect(extractFencedBlocks("just some prose, no fences here")).toEqual([]);
  });

  it("returns blocks in source order (not sorted)", () => {
    const mdx = "```yaml\nfirst: 1\n```\n\n```bash\nsecond\n```\n\n```typescript\nconst third = 3;\n```";
    const blocks = extractFencedBlocks(mdx);
    expect(blocks.map((b) => b.lang)).toEqual(["yaml", "bash", "typescript"]);
  });

  it("each block matches the FencedBlock type shape", () => {
    const blocks: FencedBlock[] = extractFencedBlocks(rootPageRawMdx);
    for (const block of blocks) {
      expect(typeof block.lang).toBe("string");
      expect(typeof block.code).toBe("string");
    }
  });
});

describe("shared helper drives all three root-page consumers with byte-identical output", () => {
  it("root-code-blocks consumes extractFencedBlocks(rootPageRawMdx) and emits the same first two blocks", async () => {
    const { rootCodeBlocks } = await import("../root-code-blocks.server");
    const shared = extractFencedBlocks(rootPageRawMdx);
    expect(rootCodeBlocks.quickStart.code).toBe(shared[0].code);
    expect(rootCodeBlocks.quickStart.lang).toBe(shared[0].lang);
    expect(rootCodeBlocks.cli.code).toBe(shared[1].code);
    expect(rootCodeBlocks.cli.lang).toBe(shared[1].lang);
  });

  it("root-lower-half's rootLowerHalfMdx equals sliceRootPageSection('## Options') exactly", async () => {
    const { rootLowerHalfMdx } = await import("../root-lower-half.server");
    expect(rootLowerHalfMdx).toBe(sliceRootPageSection("## Options"));
  });

  it("root-quick-start-prose's intro + post-list MDX are derived from sliceRootPageSection('## Quick Start', '## CLI')", async () => {
    const { rootQuickStartIntroMdx, rootQuickStartPostListMdx } = await import("../root-quick-start-prose.server");
    const qsBody = sliceRootPageSection("## Quick Start", "## CLI");
    // Both paragraph fragments must appear in the slice — the
    // consumer's post-fence block split picks them out of the
    // blank-line-separated blocks.
    expect(qsBody).toContain(rootQuickStartIntroMdx);
    expect(qsBody).toContain(rootQuickStartPostListMdx);
  });
});
