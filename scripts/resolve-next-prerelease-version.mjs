#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const packageName = "@nyrra/emulate";
const manifestPath = "packages/emulate/package.json";

function readManifestVersion() {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  return manifest.version;
}

function readDistTag(tagName) {
  try {
    const output = execFileSync(
      "npm",
      [
        "view",
        packageName,
        `dist-tags.${tagName}`,
        "--json",
        "--registry=https://registry.npmjs.org",
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).trim();

    if (output.length === 0 || output === "null") {
      return null;
    }

    return JSON.parse(output);
  } catch {
    return null;
  }
}

function parseStableVersion(version) {
  const match = /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)$/.exec(version);
  if (!match?.groups) {
    throw new Error(`Expected a stable x.y.z manifest version, but received \"${version}\".`);
  }

  return {
    major: Number(match.groups.major),
    minor: Number(match.groups.minor),
    patch: Number(match.groups.patch),
  };
}

const stableVersion = readManifestVersion();
const { major, minor, patch } = parseStableVersion(stableVersion);
const expectedPrereleasePrefix = `${major}.${minor}.${patch + 1}-next.`;

const latestVersion = readDistTag("latest");
if (latestVersion !== null && latestVersion !== stableVersion) {
  throw new Error(`Stable manifest ${stableVersion} is out of sync with npm latest ${latestVersion}.`);
}

const currentNextVersion = readDistTag("next");
if (currentNextVersion?.startsWith(expectedPrereleasePrefix)) {
  const prereleaseCounter = currentNextVersion.slice(expectedPrereleasePrefix.length);

  if (!/^\d+$/.test(prereleaseCounter)) {
    throw new Error(
      `Unsupported next tag \"${currentNextVersion}\". Expected ${expectedPrereleasePrefix}<number>.`,
    );
  }

  process.stdout.write(`${expectedPrereleasePrefix}${Number(prereleaseCounter) + 1}\n`);
  process.exit(0);
}

process.stdout.write(`${expectedPrereleasePrefix}0\n`);
