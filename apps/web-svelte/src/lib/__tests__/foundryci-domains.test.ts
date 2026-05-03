import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type WranglerRoute = {
  pattern: string;
  custom_domain: boolean;
};

const WEB_SVELTE_ROOT = resolve(import.meta.dirname, "../../..");
const WRANGLER_CONFIG_PATH = resolve(WEB_SVELTE_ROOT, "wrangler.jsonc");
const PACKAGE_JSON_PATH = resolve(WEB_SVELTE_ROOT, "package.json");
const WORKER_WRAPPER_SCRIPT_PATH = resolve(WEB_SVELTE_ROOT, "scripts/wrap-cloudflare-worker.mjs");

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

  it("runs the Worker before static assets so www can redirect consistently", () => {
    expect(wranglerConfig().assets.run_worker_first).toBe(true);
  });

  it("wraps the generated Cloudflare Worker during production builds", () => {
    const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts["build:cloudflare"]).toContain("node scripts/wrap-cloudflare-worker.mjs");
  });

  it("redirects www traffic before SvelteKit serves static assets", () => {
    const script = readFileSync(WORKER_WRAPPER_SCRIPT_PATH, "utf-8");

    expect(script).toContain('const WWW_HOSTNAME = "www.foundryci.com"');
    expect(script).toContain('const CANONICAL_ORIGIN = "https://foundryci.com"');
    expect(script).toContain("status: 308");
    expect(script).toContain("location: CANONICAL_ORIGIN + url.pathname + url.search");
    expect(script).toContain("return svelteWorker.fetch(request, env, ctx)");
  });
});
