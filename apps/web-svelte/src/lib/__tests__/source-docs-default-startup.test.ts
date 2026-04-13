import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { defaultStartupServices } from "../default-services.server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// apps/web-svelte/src/lib/__tests__ → repo root is 5 levels up.
const REPO_ROOT = resolve(__dirname, "../../../../..");

const PAGE_MDX_PATH = resolve(REPO_ROOT, "apps/web/app/page.mdx");
const README_PATH = resolve(REPO_ROOT, "README.md");

type StartupBullet = { label: string; port: number };

/**
 * Parses every line in the form `- **Label** on \`http://localhost:NNNN\``
 * out of a markdown file's text. The Quick Start sections in
 * apps/web/app/page.mdx and README.md are the only places that use this
 * exact bullet shape (the Programmatic API code blocks reference
 * localhost ports inside JS object access expressions like `vercel.url`,
 * which start with neither `- **` nor a backtick at the right position
 * and therefore do not match). A future addition of unrelated localhost
 * bullets would also match — flagged inline if the surrounding section
 * structure is ever extended.
 */
function parseStartupBullets(text: string): StartupBullet[] {
  const bullets: StartupBullet[] = [];
  const regex = /^- \*\*(.+?)\*\* on `http:\/\/localhost:(\d+)`/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    bullets.push({ label: match[1], port: parseInt(match[2], 10) });
  }
  return bullets;
}

const expectedBullets: StartupBullet[] = defaultStartupServices.map(({ label, port }) => ({
  label,
  port,
}));

describe("source docs default startup list parity", () => {
  it("apps/web/app/page.mdx Quick Start bullets match the runtime default startup set in order", () => {
    const text = readFileSync(PAGE_MDX_PATH, "utf-8");
    const bullets = parseStartupBullets(text);
    expect(bullets).toEqual(expectedBullets);
  });

  it("README.md Quick Start bullets match the runtime default startup set in order", () => {
    const text = readFileSync(README_PATH, "utf-8");
    const bullets = parseStartupBullets(text);
    expect(bullets).toEqual(expectedBullets);
  });

  it("apps/web/app/page.mdx Quick Start bullets include Clerk at port 4011", () => {
    const text = readFileSync(PAGE_MDX_PATH, "utf-8");
    const bullets = parseStartupBullets(text);
    const clerk = bullets.find((b) => b.label === "Clerk");
    expect(clerk).toBeDefined();
    expect(clerk!.port).toBe(4011);
  });

  it("README.md Quick Start bullets include Clerk at port 4011", () => {
    const text = readFileSync(README_PATH, "utf-8");
    const bullets = parseStartupBullets(text);
    const clerk = bullets.find((b) => b.label === "Clerk");
    expect(clerk).toBeDefined();
    expect(clerk!.port).toBe(4011);
  });

  it("neither source doc lists Foundry as a default startup bullet (Foundry stays explicit opt-in)", () => {
    for (const path of [PAGE_MDX_PATH, README_PATH]) {
      const text = readFileSync(path, "utf-8");
      const bullets = parseStartupBullets(text);
      expect(bullets.some((b) => b.label === "Foundry")).toBe(false);
    }
  });

  it("both source docs have exactly DEFAULT_SERVICE_NAMES.length bullets in the Quick Start section", () => {
    for (const path of [PAGE_MDX_PATH, README_PATH]) {
      const text = readFileSync(path, "utf-8");
      const bullets = parseStartupBullets(text);
      expect(bullets.length).toBe(defaultStartupServices.length);
    }
  });
});
