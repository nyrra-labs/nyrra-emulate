import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { rootLowerHalfHtml, rootLowerHalfMdx } from "../root-lower-half.server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// apps/web-svelte/src/lib/__tests__ → repo root is 5 levels up.
const REPO_ROOT = resolve(__dirname, "../../../../..");
const ROOT_MDX_PATH = resolve(REPO_ROOT, "apps/web/app/page.mdx");

describe("rootLowerHalfMdx slice", () => {
  it("starts with the '## Options' heading anchor", () => {
    expect(rootLowerHalfMdx.startsWith("## Options")).toBe(true);
  });

  it("includes the Programmatic API and Next.js Integration H2 headings", () => {
    expect(rootLowerHalfMdx).toContain("## Options");
    expect(rootLowerHalfMdx).toContain("## Programmatic API");
    expect(rootLowerHalfMdx).toContain("## Next.js Integration");
  });

  it("does NOT include anything above the Options anchor", () => {
    // The slice must exclude the Quick Start bullets, the CLI
    // fenced block, and the Getting Started H1 — those live above
    // '## Options' in the upstream MDX and are sourced separately
    // (Quick Start via the derived startup list, CLI via the
    // upstream code block helper, the hero H1 via hand-authored
    // FoundryCI branding).
    expect(rootLowerHalfMdx).not.toContain("# Getting Started");
    expect(rootLowerHalfMdx).not.toContain("## Quick Start");
    expect(rootLowerHalfMdx).not.toContain("## CLI");
    // The CLI fenced block's '# Start the default startup set'
    // bash comment must be absent from the slice.
    expect(rootLowerHalfMdx).not.toContain("# Start the default startup set");
  });

  it("matches the upstream apps/web/app/page.mdx slice from '## Options' onward", () => {
    const upstream = readFileSync(ROOT_MDX_PATH, "utf-8");
    const startIdx = upstream.indexOf("## Options");
    expect(startIdx).toBeGreaterThan(-1);
    const upstreamSlice = upstream.slice(startIdx);
    expect(rootLowerHalfMdx).toBe(upstreamSlice);
  });
});

describe("rootLowerHalfHtml rendered content", () => {
  it("renders the Options H2 with the shared docs H2 utility class", () => {
    expect(rootLowerHalfHtml).toMatch(/<h2\s+class="[^"]*text-lg[^"]*"[^>]*>Options<\/h2>/);
  });

  it("renders the Options table as pass-through HTML with every flag row", () => {
    expect(rootLowerHalfHtml).toContain("<table>");
    expect(rootLowerHalfHtml).toContain("<code>-p, --port</code>");
    expect(rootLowerHalfHtml).toContain("<code>-s, --service</code>");
    expect(rootLowerHalfHtml).toContain("<code>--seed</code>");
    expect(rootLowerHalfHtml).toContain("Base port (auto-increments per service)");
    expect(rootLowerHalfHtml).toContain("default startup set");
    expect(rootLowerHalfHtml).toContain("Path to seed config (YAML or JSON)");
    expect(rootLowerHalfHtml).toContain("</table>");
  });

  it("renders the EMULATE_PORT and PORT env-var inline code tokens via the docs codespan class", () => {
    expect(rootLowerHalfHtml).toMatch(
      /<code class="[^"]*bg-neutral-100[^"]*"[^>]*>EMULATE_PORT<\/code>/,
    );
    expect(rootLowerHalfHtml).toMatch(
      /<code class="[^"]*bg-neutral-100[^"]*"[^>]*>PORT<\/code>/,
    );
    expect(rootLowerHalfHtml).toContain("environment variables");
  });

  it("renders the Programmatic API H2 heading and the /programmatic-api link", () => {
    expect(rootLowerHalfHtml).toMatch(
      /<h2[^>]*>Programmatic API<\/h2>/,
    );
    expect(rootLowerHalfHtml).toContain('href="/programmatic-api"');
    expect(rootLowerHalfHtml).toMatch(/>Programmatic API<\/a>/);
    // The Programmatic API paragraph mentions `createEmulator` as
    // inline code — a load-bearing token that proves the upstream
    // prose rendered through.
    expect(rootLowerHalfHtml).toMatch(
      /<code class="[^"]*bg-neutral-100[^"]*"[^>]*>createEmulator<\/code>/,
    );
  });

  it("renders the Next.js Integration H2 heading and the /nextjs link", () => {
    expect(rootLowerHalfHtml).toMatch(/<h2[^>]*>Next\.js Integration<\/h2>/);
    expect(rootLowerHalfHtml).toContain('href="/nextjs"');
    expect(rootLowerHalfHtml).toMatch(/>Next\.js Integration<\/a>/);
    // The Next.js Integration paragraph mentions "same origin" and
    // "setup instructions" — load-bearing prose tokens from upstream.
    expect(rootLowerHalfHtml).toContain("same origin");
    expect(rootLowerHalfHtml).toContain("setup instructions");
  });

  it("does NOT render any content from the hero, Quick Start, or CLI sections", () => {
    // The lower-half slice must not include any content above
    // '## Options'. These assertions complement the negative
    // assertions on rootLowerHalfMdx above: even after marked +
    // Shiki render the slice, the upstream content from the sections
    // above must not leak into the HTML.
    expect(rootLowerHalfHtml).not.toContain("Getting Started");
    expect(rootLowerHalfHtml).not.toContain("Quick Start");
    expect(rootLowerHalfHtml).not.toContain(">CLI<");
    expect(rootLowerHalfHtml).not.toContain("# Start the default startup set");
  });

  it("is a non-empty string that starts with the <h2> Options heading", () => {
    expect(typeof rootLowerHalfHtml).toBe("string");
    expect(rootLowerHalfHtml.length).toBeGreaterThan(100);
    expect(rootLowerHalfHtml.trimStart().startsWith("<h2")).toBe(true);
  });
});
