#!/usr/bin/env node

import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = resolve(workspaceRoot, "packages/emulate");
const distDir = resolve(packageRoot, "dist");
const releaseDir = resolve(packageRoot, ".release");

const sourceManifest = JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf8"));

function collectWorkspacePackageVersions() {
  const packageVersions = new Map();
  const searchRoots = ["packages", "apps", "examples"];
  const ignoredDirs = new Set(["node_modules", ".git", ".next", ".svelte-kit", ".turbo", "dist", ".release"]);

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (ignoredDirs.has(entry.name)) {
        continue;
      }

      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name === "package.json") {
        const manifest = JSON.parse(readFileSync(fullPath, "utf8"));
        if (typeof manifest.name === "string" && typeof manifest.version === "string") {
          packageVersions.set(manifest.name, manifest.version);
        }
      }
    }
  }

  for (const relativeRoot of searchRoots) {
    const absoluteRoot = resolve(workspaceRoot, relativeRoot);
    if (statSync(absoluteRoot, { throwIfNoEntry: false })?.isDirectory()) {
      walk(absoluteRoot);
    }
  }

  return packageVersions;
}

const workspacePackageVersions = collectWorkspacePackageVersions();

function replaceWorkspaceProtocolVersion(dependencyName, versionRange) {
  if (typeof versionRange !== "string" || !versionRange.startsWith("workspace:")) {
    return versionRange;
  }

  const workspaceReference = versionRange.slice("workspace:".length);
  const referencedVersion =
    workspacePackageVersions.get(dependencyName) ??
    workspacePackageVersions.get(
      workspaceReference.startsWith("^") || workspaceReference.startsWith("~")
        ? workspaceReference.slice(1)
        : workspaceReference,
    );

  if (!referencedVersion) {
    throw new Error(`Unable to resolve workspace dependency version for ${dependencyName}@${versionRange}.`);
  }

  if (workspaceReference === "^") {
    return `^${referencedVersion}`;
  }

  if (workspaceReference === "~") {
    return `~${referencedVersion}`;
  }

  if (
    workspaceReference === "*" ||
    workspaceReference === "" ||
    workspaceReference.startsWith("file:") ||
    workspaceReference.startsWith("../") ||
    workspaceReference.startsWith("./")
  ) {
    return referencedVersion;
  }

  if (workspaceReference.startsWith("^")) {
    return `^${referencedVersion}`;
  }

  if (workspaceReference.startsWith("~")) {
    return `~${referencedVersion}`;
  }

  return workspaceReference;
}

function normalizeDependencyBlock(dependencies) {
  if (!dependencies) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(dependencies).map(([dependencyName, versionRange]) => [
      dependencyName,
      replaceWorkspaceProtocolVersion(dependencyName, versionRange),
    ]),
  );
}

function rewriteDistPath(value) {
  if (typeof value === "string") {
    if (value.startsWith("./dist/")) {
      return `.${value.slice("./dist".length)}`;
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => rewriteDistPath(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, rewriteDistPath(entryValue)]),
    );
  }

  return value;
}

function createReleaseManifest(manifest) {
  const {
    devDependencies: _devDependencies,
    files: _files,
    scripts: _scripts,
    ...publishableManifest
  } = manifest;

  return {
    ...publishableManifest,
    main: rewriteDistPath(manifest.main),
    types: rewriteDistPath(manifest.types),
    exports: rewriteDistPath(manifest.exports),
    bin: rewriteDistPath(manifest.bin),
    dependencies: normalizeDependencyBlock(manifest.dependencies),
    optionalDependencies: normalizeDependencyBlock(manifest.optionalDependencies),
    peerDependencies: normalizeDependencyBlock(manifest.peerDependencies),
  };
}

function copyReleaseFiles(sourceDir, targetDir) {
  mkdirSync(targetDir, { recursive: true });

  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = resolve(sourceDir, entry.name);
    const targetPath = resolve(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyReleaseFiles(sourcePath, targetPath);
      continue;
    }

    if (extname(entry.name) === ".map") {
      continue;
    }

    copyFileSync(sourcePath, targetPath);
  }
}

if (!statSync(distDir, { throwIfNoEntry: false })?.isDirectory()) {
  throw new Error("Missing packages/emulate/dist. Run `pnpm --filter @nyrra/emulate build` first.");
}

rmSync(releaseDir, { recursive: true, force: true });
mkdirSync(releaseDir, { recursive: true });
copyReleaseFiles(distDir, releaseDir);
copyFileSync(resolve(workspaceRoot, "README.md"), resolve(releaseDir, "README.md"));
copyFileSync(resolve(workspaceRoot, "LICENSE"), resolve(releaseDir, "LICENSE"));

const releaseManifest = createReleaseManifest(sourceManifest);
writeFileSync(resolve(releaseDir, "package.json"), `${JSON.stringify(releaseManifest, null, 2)}\n`);
