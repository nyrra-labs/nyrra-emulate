#!/usr/bin/env node
const API_BASE = "https://api.cloudflare.com/client/v4";

/**
 * @typedef {{ dryRun: boolean; help?: boolean; recordName: string; target: string; zone: string }} Args
 * @typedef {{ body?: unknown; method?: string; token: string }} CloudflareRequestOptions
 * @typedef {{ code?: number }} CloudflareError
 * @typedef {{ errors?: CloudflareError[]; result?: unknown; success?: boolean }} CloudflareResponse
 * @typedef {{ id: string }} CloudflareZone
 * @typedef {{ content?: string; id?: string; name: string; proxied?: boolean; ttl?: number; type: string }} DnsRecord
 * @typedef {{ content: string; name: string; proxied: boolean; ttl: number; type: "CNAME" }} DesiredCnameRecord
 */

/**
 * @param {string[]} argv
 * @returns {Args}
 */
function parseArgs(argv) {
  const args = /** @type {Args} */ ({
    dryRun: false,
    recordName: "www",
    target: "foundryci.com",
    zone: "foundryci.com",
  });

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--dry-run") {
      args.dryRun = true;
    } else if (value === "--record-name") {
      args.recordName = argv[++index];
    } else if (value === "--target") {
      args.target = argv[++index];
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
  console.log(`Usage: node apps/web-svelte/scripts/ensure-cloudflare-www-dns.mjs [options]

Ensures the FoundryCI production www DNS record exists after Wrangler deploys the Worker custom-domain trigger.

Options:
  --zone <zone>             Cloudflare zone name, defaults to foundryci.com
  --record-name <name>      DNS record name, defaults to www
  --target <hostname>       CNAME target, defaults to foundryci.com
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
      ? " The Cloudflare token must include Zone:DNS read/edit permission for the target zone."
      : "";
    throw new Error(
      `Cloudflare ${method} ${path} failed: ${JSON.stringify(errors.length > 0 ? errors : data)}.${hint}`,
    );
  }
  return data.result;
}

/**
 * @param {{ recordName: string; target: string; zone: string }} options
 * @returns {DesiredCnameRecord}
 */
export function desiredCnameRecord({ recordName, target, zone }) {
  return {
    content: target,
    name: recordName.includes(".") ? recordName : `${recordName}.${zone}`,
    proxied: true,
    ttl: 1,
    type: "CNAME",
  };
}

/**
 * @param {DnsRecord} current
 * @param {DesiredCnameRecord} desired
 * @returns {boolean}
 */
export function cnameNeedsUpdate(current, desired) {
  return (
    current.type !== desired.type ||
    current.name !== desired.name ||
    current.content !== desired.content ||
    current.proxied !== desired.proxied ||
    current.ttl !== desired.ttl
  );
}

/**
 * @param {DnsRecord[]} records
 * @param {DesiredCnameRecord} desired
 * @returns {DnsRecord[]}
 */
export function conflictingRecords(records, desired) {
  return records.filter((record) => record.name === desired.name && record.type !== desired.type);
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    return;
  }

  const token = requiredToken();
  const desired = desiredCnameRecord(args);
  const zones = /** @type {CloudflareZone[]} */ (
    await cloudflareFetch(`/zones?name=${encodeURIComponent(args.zone)}&status=active`, { token })
  );
  const zone = zones[0];
  if (!zone) {
    throw new Error(`Cloudflare zone not found or inactive: ${args.zone}`);
  }

  const records = /** @type {DnsRecord[]} */ (
    await cloudflareFetch(`/zones/${zone.id}/dns_records?name=${encodeURIComponent(desired.name)}`, {
      token,
    })
  );
  const conflicts = conflictingRecords(records, desired);
  const existing = records.find((record) => record.type === desired.type);

  if (conflicts.length > 0) {
    if (args.dryRun) {
      console.log(`dry run would delete ${conflicts.length} conflicting ${desired.name} DNS record(s)`);
    } else {
      for (const conflict of conflicts) {
        await cloudflareFetch(`/zones/${zone.id}/dns_records/${conflict.id}`, {
          method: "DELETE",
          token,
        });
        console.log(`deleted conflicting ${conflict.type} record for ${desired.name}`);
      }
    }
  }

  if (!existing) {
    if (args.dryRun) {
      console.log(`dry run would create ${desired.name} CNAME ${desired.content}`);
      return;
    }
    await cloudflareFetch(`/zones/${zone.id}/dns_records`, {
      body: desired,
      method: "POST",
      token,
    });
    console.log(`created ${desired.name} CNAME ${desired.content}`);
    return;
  }

  if (!cnameNeedsUpdate(existing, desired)) {
    console.log(`${desired.name} CNAME ${desired.content} already current`);
    return;
  }

  if (args.dryRun) {
    console.log(`dry run would update ${desired.name} CNAME ${desired.content}`);
    return;
  }

  await cloudflareFetch(`/zones/${zone.id}/dns_records/${existing.id}`, {
    body: desired,
    method: "PATCH",
    token,
  });
  console.log(`updated ${desired.name} CNAME ${desired.content}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
