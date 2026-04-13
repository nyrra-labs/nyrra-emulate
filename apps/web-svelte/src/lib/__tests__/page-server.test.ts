import { describe, expect, it } from "vitest";
import { load, prerender } from "../../routes/+page.server";

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
// the `codeBlocks` field this load returns at runtime. Asserting the
// concrete runtime shape at the test boundary is the cleanest way to
// keep the assertions readable without widening the global type.
type RootLoadData = {
  codeBlocks: { quickStart: string; cli: string };
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
});
