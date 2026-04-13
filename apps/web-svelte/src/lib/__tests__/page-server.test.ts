import { describe, expect, it } from "vitest";
import { load, prerender } from "../../routes/+page.server";
import { rootCodeBlocks } from "../root-code-blocks.server";
import {
  DEFAULT_SERVICE_NAMES,
  SERVICE_NAMES,
} from "../../../../../packages/emulate/src/registry";

const SHIKI_THEMES_CLASS = 'class="shiki shiki-themes vercel-light vercel-dark"';

function isShikiHtml(html: string): boolean {
  return (
    html.startsWith("<pre ") &&
    html.includes(SHIKI_THEMES_CLASS) &&
    html.includes("--shiki-light:") &&
    html.includes("--shiki-dark:")
  );
}

// SvelteKit's auto-generated `PageServerLoad` types the load return as
// `void | Omit<App.PageData, ...>`, and `App.PageData` does not declare
// the `codeBlocks` / `defaultStartupServices` / `rootLowerHalfHtml`
// fields this load returns at runtime. Asserting the concrete runtime
// shape at the test boundary is the cleanest way to keep the assertions
// readable without widening the global type.
type StartupService = { name: string; label: string; port: number };
type SupportedSvc = { name: string; label: string };
type RootLoadData = {
  codeBlocks: { quickStart: string; cli: string };
  defaultStartupServices: readonly StartupService[];
  supportedServices: readonly SupportedSvc[];
  supportedServicesProse: string;
  rootLowerHalfHtml: string;
  rootQuickStartIntroHtml: string;
  rootQuickStartPostListHtml: string;
};

async function callLoad(): Promise<RootLoadData> {
  const data = await load({} as Parameters<typeof load>[0]);
  return data as RootLoadData;
}

describe("root +page.server.ts", () => {
  it("opts the root page into prerendering", () => {
    expect(prerender).toBe(true);
  });

  it("load() returns codeBlocks with the quickStart and cli keys", async () => {
    const data = await callLoad();
    expect(data).toHaveProperty("codeBlocks");
    expect(Object.keys(data.codeBlocks).sort()).toEqual(["cli", "quickStart"]);
  });

  it("each returned block is Shiki-rendered HTML, not raw markdown or raw code", async () => {
    const data = await callLoad();
    expect(isShikiHtml(data.codeBlocks.quickStart)).toBe(true);
    expect(isShikiHtml(data.codeBlocks.cli)).toBe(true);
    expect(data.codeBlocks.quickStart).not.toBe("npx emulate");
    expect(data.codeBlocks.cli).not.toMatch(/^# Start the default startup set/);
  });

  it("the quickStart block contains the load-bearing `npx emulate` source token", async () => {
    const data = await callLoad();
    expect(data.codeBlocks.quickStart).toContain("npx");
    expect(data.codeBlocks.quickStart).toContain("emulate");
  });

  it("the cli block contains the load-bearing `--service` and `--port` source tokens", async () => {
    const data = await callLoad();
    expect(data.codeBlocks.cli).toContain("--service");
    expect(data.codeBlocks.cli).toContain("--port");
    expect(data.codeBlocks.cli).toContain("foundry");
  });

  it("load() exposes defaultStartupServices derived from runtime DEFAULT_SERVICE_NAMES in exact order", async () => {
    const data = await callLoad();
    expect(data.defaultStartupServices.length).toBe(DEFAULT_SERVICE_NAMES.length);
    expect(data.defaultStartupServices.map((s) => s.name)).toEqual([...DEFAULT_SERVICE_NAMES]);
  });

  it("load()'s defaultStartupServices includes Clerk and excludes Foundry from the default set", async () => {
    const data = await callLoad();
    const names = data.defaultStartupServices.map((s) => s.name);
    expect(names).toContain("clerk");
    expect(names).not.toContain("foundry");
  });

  it("load()'s defaultStartupServices uses port 4000 as the base and increments by one per entry", async () => {
    const data = await callLoad();
    expect(data.defaultStartupServices[0].port).toBe(4000);
    for (let i = 0; i < data.defaultStartupServices.length; i++) {
      expect(data.defaultStartupServices[i].port).toBe(4000 + i);
    }
  });

  it("load() exposes supportedServices derived from runtime SERVICE_NAMES filtered to exclude foundry", async () => {
    const data = await callLoad();
    const expected = SERVICE_NAMES.filter((name) => name !== "foundry");
    expect(data.supportedServices.map((s) => s.name)).toEqual([...expected]);
  });

  it("load()'s supportedServices includes Clerk and excludes Foundry", async () => {
    const data = await callLoad();
    const names = data.supportedServices.map((s) => s.name);
    expect(names).toContain("clerk");
    expect(names).not.toContain("foundry");
  });

  it("load() exposes supportedServicesProse as a non-empty Oxford-comma string containing Clerk but not Foundry", async () => {
    const data = await callLoad();
    expect(typeof data.supportedServicesProse).toBe("string");
    expect(data.supportedServicesProse.length).toBeGreaterThan(0);
    expect(data.supportedServicesProse).toContain("Clerk");
    expect(data.supportedServicesProse).not.toContain("Foundry");
    expect(data.supportedServicesProse).toContain(", and ");
  });

  it("load() exposes rootLowerHalfHtml as a non-empty string starting with the rendered Options H2", async () => {
    const data = await callLoad();
    expect(typeof data.rootLowerHalfHtml).toBe("string");
    expect(data.rootLowerHalfHtml.length).toBeGreaterThan(100);
    expect(data.rootLowerHalfHtml.trimStart().startsWith("<h2")).toBe(true);
  });

  it("load()'s rootLowerHalfHtml contains the rendered Options / Programmatic API / Next.js Integration sections sourced from upstream", async () => {
    // Pins the upstream→helper→load()→prerender chain end-to-end. If
    // `root-lower-half.server.ts` ever stopped pulling from the upstream
    // `apps/web/app/page.mdx` slice, these load-bearing tokens would
    // disappear from the rendered output.
    const data = await callLoad();
    // Options H2 + table pass-through + env-var codespan prose.
    expect(data.rootLowerHalfHtml).toMatch(/<h2[^>]*>Options<\/h2>/);
    expect(data.rootLowerHalfHtml).toContain("<code>-p, --port</code>");
    expect(data.rootLowerHalfHtml).toContain("<code>-s, --service</code>");
    expect(data.rootLowerHalfHtml).toContain("<code>--seed</code>");
    expect(data.rootLowerHalfHtml).toContain("EMULATE_PORT");
    expect(data.rootLowerHalfHtml).toContain("PORT");
    // Programmatic API section with createEmulator codespan + link.
    expect(data.rootLowerHalfHtml).toMatch(/<h2[^>]*>Programmatic API<\/h2>/);
    expect(data.rootLowerHalfHtml).toContain('href="/programmatic-api"');
    expect(data.rootLowerHalfHtml).toContain("createEmulator");
    // Next.js Integration section with /nextjs link + load-bearing prose.
    expect(data.rootLowerHalfHtml).toMatch(/<h2[^>]*>Next\.js Integration<\/h2>/);
    expect(data.rootLowerHalfHtml).toContain('href="/nextjs"');
    expect(data.rootLowerHalfHtml).toContain("same origin");
    // Nothing from the hero / Quick Start / CLI sections (above `## Options`)
    // should leak into the lower-half slice's rendered output.
    expect(data.rootLowerHalfHtml).not.toContain("Getting Started");
    expect(data.rootLowerHalfHtml).not.toContain("Quick Start");
    expect(data.rootLowerHalfHtml).not.toContain("# Start the default startup set");
  });

  it("load() exposes rootQuickStartIntroHtml and rootQuickStartPostListHtml as non-empty <p>-wrapped strings", async () => {
    const data = await callLoad();
    expect(typeof data.rootQuickStartIntroHtml).toBe("string");
    expect(typeof data.rootQuickStartPostListHtml).toBe("string");
    expect(data.rootQuickStartIntroHtml.length).toBeGreaterThan(0);
    expect(data.rootQuickStartPostListHtml.length).toBeGreaterThan(0);
    expect(data.rootQuickStartIntroHtml.trimStart().startsWith("<p")).toBe(true);
    expect(data.rootQuickStartPostListHtml.trimStart().startsWith("<p")).toBe(true);
  });

  it("load()'s rootQuickStartIntroHtml contains the upstream 'default startup set' Quick Start intro prose", async () => {
    // Pins the upstream -> helper -> load() chain for the Quick Start
    // intro paragraph. If `root-quick-start-prose.server.ts` ever
    // stopped pulling from the upstream MDX slice, these load-bearing
    // tokens would disappear from the rendered output.
    const data = await callLoad();
    expect(data.rootQuickStartIntroHtml).toContain("default startup set starts with sensible defaults");
    expect(data.rootQuickStartIntroHtml).toContain("No config file needed");
    // Nothing from the stale hand-authored intro should survive.
    expect(data.rootQuickStartIntroHtml).not.toContain("boots the supporting emulator stack");
    expect(data.rootQuickStartIntroHtml).not.toContain("No config file is needed for the supporting");
  });

  it("load()'s rootQuickStartPostListHtml contains the upstream Foundry-availability paragraph with inline code", async () => {
    const data = await callLoad();
    expect(data.rootQuickStartPostListHtml).toContain("Foundry is available");
    // Inline code spans come through as `<code class="...">...</code>`.
    expect(data.rootQuickStartPostListHtml).toMatch(
      /<code [^>]*>emulate --service foundry<\/code>/,
    );
    expect(data.rootQuickStartPostListHtml).toMatch(/<code [^>]*>foundry:<\/code>/);
    // Load-bearing Foundry slice description tokens.
    expect(data.rootQuickStartPostListHtml).toContain("OAuth 2.0");
    expect(data.rootQuickStartPostListHtml).toContain("compute-module runtime");
    expect(data.rootQuickStartPostListHtml).toContain("contour routes");
  });

  it("load()'s rendered codeBlocks contain the upstream-derived rootCodeBlocks source after HTML tag stripping", async () => {
    // Pins the source→rendered-HTML pipeline end-to-end: whatever
    // `rootCodeBlocks` exposes from apps/web/app/page.mdx must make
    // it through `highlightAll()` into the prerendered HTML. A
    // regression that broke the wiring (e.g. re-hardcoding a local
    // constant) would let `rootCodeBlocks` and `codeBlocks` drift.
    // Shiki splits each source line into multiple <span> elements
    // for per-token colors, so substring matches on the raw HTML
    // can't find "npx emulate" because the space straddles a
    // </span><span> boundary. Stripping all HTML tags reassembles
    // the plain text content, which then contains the source
    // verbatim (line by line for multi-line blocks).
    const data = await callLoad();
    const stripHtmlTags = (html: string): string => html.replace(/<[^>]+>/g, "");

    const quickStartText = stripHtmlTags(data.codeBlocks.quickStart);
    expect(quickStartText).toContain(rootCodeBlocks.quickStart.code);

    const cliText = stripHtmlTags(data.codeBlocks.cli);
    for (const line of rootCodeBlocks.cli.code.split("\n")) {
      if (line.trim() === "") continue;
      expect(cliText).toContain(line);
    }
  });
});
