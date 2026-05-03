#!/usr/bin/env node
const API_BASE = "https://api.cloudflare.com/client/v4";
const SETTING_ID = "always_use_https";

/**
 * @typedef {{ dryRun: boolean; help?: boolean; zone: string }} Args
 * @typedef {{ body?: unknown; method?: string; token: string }} CloudflareRequestOptions
 * @typedef {{ code?: number }} CloudflareError
 * @typedef {{ errors?: CloudflareError[]; result?: unknown; success?: boolean }} CloudflareResponse
 * @typedef {{ id: string }} CloudflareZone
 * @typedef {{ id: string; value?: string }} CloudflareSetting
 */

/**
 * @param {string[]} argv
 * @returns {Args}
 */
function parseArgs(argv) {
  const args = /** @type {Args} */ ({
    dryRun: false,
    zone: "foundryci.com",
  });

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--dry-run") {
      args.dryRun = true;
    } else if (value === "--zone") {
      args.zone = argv[++index];
    } else if (value === "--help" || value === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node apps/web-svelte/scripts/ensure-cloudflare-https-settings.mjs [options]

Ensures Cloudflare redirects HTTP traffic to HTTPS for the FoundryCI production zone.

Options:
  --zone <zone>             Cloudflare zone name, defaults to foundryci.com
  --dry-run                 Report changes without mutating Cloudflare
`);
}

function requiredToken() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    throw new Error("CLOUDFLARE_API_TOKEN is required.");
  }
  return token;
}

/**
 * @param {string} path
 * @param {CloudflareRequestOptions} options
 * @returns {Promise<unknown>}
 */
async function cloudflareFetch(path, { body, method = "GET", token }) {
  const response = await fetch(`${API_BASE}${path}`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method,
  });
  const data = /** @type {CloudflareResponse} */ (await response.json());
  if (!(response.ok && data.success)) {
    const errors = data.errors ?? [];
    const permissionError = response.status === 403 || errors.some((error) => error?.code === 10000);
    const hint = permissionError
      ? " The Cloudflare token must include Zone Settings read/edit permission for the target zone."
      : "";
    throw new Error(
      `Cloudflare ${method} ${path} failed: ${JSON.stringify(errors.length > 0 ? errors : data)}.${hint}`,
    );
  }
  return data.result;
}

/**
 * @param {CloudflareSetting} setting
 * @returns {boolean}
 */
export function alwaysUseHttpsNeedsUpdate(setting) {
  return setting.value !== "on";
}

/**
 * @param {string[]} argv
 * @returns {Promise<void>}
 */
export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    return;
  }

  const token = requiredToken();
  const zones = /** @type {CloudflareZone[]} */ (
    await cloudflareFetch(`/zones?name=${encodeURIComponent(args.zone)}&status=active`, { token })
  );
  const zone = zones[0];
  if (!zone) {
    throw new Error(`Cloudflare zone not found or inactive: ${args.zone}`);
  }

  const setting = /** @type {CloudflareSetting} */ (
    await cloudflareFetch(`/zones/${zone.id}/settings/${SETTING_ID}`, { token })
  );

  if (!alwaysUseHttpsNeedsUpdate(setting)) {
    console.log(`${args.zone} Always Use HTTPS already enabled`);
    return;
  }

  if (args.dryRun) {
    console.log(`dry run would enable Always Use HTTPS for ${args.zone}`);
    return;
  }

  await cloudflareFetch(`/zones/${zone.id}/settings/${SETTING_ID}`, {
    body: { value: "on" },
    method: "PATCH",
    token,
  });
  console.log(`enabled Always Use HTTPS for ${args.zone}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
