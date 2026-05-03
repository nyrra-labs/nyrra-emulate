import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  cnameNeedsUpdate,
  conflictingRecords,
  desiredCnameRecord,
} from "../../../scripts/ensure-cloudflare-www-dns.mjs";

type WranglerRoute = {
  pattern: string;
  custom_domain: boolean;
};

const WEB_SVELTE_ROOT = resolve(import.meta.dirname, "../../..");
const REPO_ROOT = resolve(WEB_SVELTE_ROOT, "../..");
const WRANGLER_CONFIG_PATH = resolve(WEB_SVELTE_ROOT, "wrangler.jsonc");
const PACKAGE_JSON_PATH = resolve(WEB_SVELTE_ROOT, "package.json");
const WORKER_WRAPPER_SCRIPT_PATH = resolve(WEB_SVELTE_ROOT, "scripts/wrap-cloudflare-worker.mjs");
const DEPLOY_WORKFLOW_PATH = resolve(REPO_ROOT, ".github/workflows/deploy-cloudflare.yml");

function wranglerConfig(): { routes: WranglerRoute[]; assets: { run_worker_first?: boolean } } {
  return JSON.parse(readFileSync(WRANGLER_CONFIG_PATH, "utf-8")) as {
    routes: WranglerRoute[];
    assets: { run_worker_first?: boolean };
  };
}

function wranglerRoutes(): WranglerRoute[] {
  return wranglerConfig().routes;
}

describe("FoundryCI production domains", () => {
  it("binds both apex and www hostnames as Cloudflare Worker custom domains", () => {
    expect(wranglerRoutes()).toEqual(
      expect.arrayContaining([
        { pattern: "foundryci.com", custom_domain: true },
        { pattern: "www.foundryci.com", custom_domain: true },
      ]),
    );
  });

  it("does not route all static assets through a custom Worker redirect wrapper", () => {
    const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8")) as {
      scripts: Record<string, string>;
    };

    expect(wranglerConfig().assets.run_worker_first).toBeUndefined();
    expect(packageJson.scripts["build:cloudflare"]).toBe("rm -rf .svelte-kit/cloudflare && vite build");
    expect(existsSync(WORKER_WRAPPER_SCRIPT_PATH)).toBe(false);
  });

  it("checks DNS permissions on previews and repairs DNS after production Worker deploys", () => {
    const workflow = readFileSync(DEPLOY_WORKFLOW_PATH, "utf-8");

    expect(workflow).toContain("Check production www DNS permissions");
    expect(workflow).toContain("Ensure production www DNS");
    expect(workflow).toContain("node apps/web-svelte/scripts/ensure-cloudflare-www-dns.mjs");
    expect(workflow).toContain("--zone foundryci.com");
    expect(workflow).toContain("--record-name www");
    expect(workflow).toContain("--target foundryci.com");
    expect(workflow).toContain("--dry-run");
  });

  it("targets the www hostname at the apex through a proxied CNAME", () => {
    expect(
      desiredCnameRecord({
        recordName: "www",
        target: "foundryci.com",
        zone: "foundryci.com",
      }),
    ).toEqual({
      content: "foundryci.com",
      name: "www.foundryci.com",
      proxied: true,
      ttl: 1,
      type: "CNAME",
    });
  });

  it("detects stale DNS content or proxy settings", () => {
    const desired = desiredCnameRecord({
      recordName: "www",
      target: "foundryci.com",
      zone: "foundryci.com",
    });

    expect(cnameNeedsUpdate(desired, desired)).toBe(false);
    expect(cnameNeedsUpdate({ ...desired, content: "old.example.com" }, desired)).toBe(true);
    expect(cnameNeedsUpdate({ ...desired, proxied: false }, desired)).toBe(true);
  });

  it("identifies stale non-CNAME records before creating the www CNAME", () => {
    const desired = desiredCnameRecord({
      recordName: "www",
      target: "foundryci.com",
      zone: "foundryci.com",
    });

    expect(
      conflictingRecords(
        [
          { name: "www.foundryci.com", type: "A" },
          { name: "www.foundryci.com", type: "AAAA" },
          { name: "www.foundryci.com", type: "CNAME" },
          { name: "api.foundryci.com", type: "A" },
        ],
        desired,
      ),
    ).toEqual([
      { name: "www.foundryci.com", type: "A" },
      { name: "www.foundryci.com", type: "AAAA" },
    ]);
  });
});
