import { describe, expect, it } from "vitest";
import { load, prerender } from "../../routes/+page.server";
import { DEFAULT_SERVICE_NAMES, SERVICE_NAMES } from "../../../../../packages/emulate/src/service-names";

const SHIKI_THEMES_CLASS = 'class="shiki shiki-themes vercel-light vercel-dark"';

function isShikiHtml(html: string): boolean {
  return (
    html.startsWith("<pre ") &&
    html.includes(SHIKI_THEMES_CLASS) &&
    html.includes("--shiki-light:") &&
    html.includes("--shiki-dark:")
  );
}

type StartupService = { name: string; label: string; port: number };
type SupportedSvc = { name: string; label: string };
type RootLoadData = {
  codeBlocks: { quickStart: string; cli: string };
  defaultStartupServices: readonly StartupService[];
  supportedServices: readonly SupportedSvc[];
  supportedServicesProse: string;
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
    expect(data.codeBlocks.quickStart).not.toBe("npx @nyrra/emulate --service foundry");
    expect(data.codeBlocks.cli).not.toMatch(/^# Start the default startup set/);
  });

  it("the quickStart block contains the scoped npx command source tokens", async () => {
    const data = await callLoad();
    expect(data.codeBlocks.quickStart).toContain("npx");
    expect(data.codeBlocks.quickStart).toContain("@nyrra/emulate");
    expect(data.codeBlocks.quickStart).toContain("emulate");
    expect(data.codeBlocks.quickStart).toContain("--service");
    expect(data.codeBlocks.quickStart).toContain("foundry");
  });

  it("the cli block contains the --service and --port source tokens", async () => {
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

  it("defaultStartupServices includes Clerk and excludes Foundry from the default set", async () => {
    const data = await callLoad();
    const names = data.defaultStartupServices.map((s) => s.name);
    expect(names).toContain("clerk");
    expect(names).not.toContain("foundry");
  });

  it("defaultStartupServices uses port 4000 as the base and increments by one per entry", async () => {
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

  it("supportedServices includes Clerk and excludes Foundry", async () => {
    const data = await callLoad();
    const names = data.supportedServices.map((s) => s.name);
    expect(names).toContain("clerk");
    expect(names).not.toContain("foundry");
  });

  it("load() exposes supportedServicesProse as an Oxford-comma string containing Clerk but not Foundry", async () => {
    const data = await callLoad();
    expect(typeof data.supportedServicesProse).toBe("string");
    expect(data.supportedServicesProse.length).toBeGreaterThan(0);
    expect(data.supportedServicesProse).toContain("Clerk");
    expect(data.supportedServicesProse).not.toContain("Foundry");
    expect(data.supportedServicesProse).toContain(", and ");
  });
});
