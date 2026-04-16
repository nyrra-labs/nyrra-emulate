/**
 * Docs-upstream sync script.
 *
 * Reads the upstream apps/web mirror and generates committed artifacts
 * in packages/docs-upstream/generated/ that apps/web-svelte can consume
 * without any direct cross-app imports.
 *
 * Usage:
 *   node --experimental-strip-types src/sync.ts          # generate
 *   node --experimental-strip-types src/sync.ts --check   # dry-run, exits 1 if stale
 */
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const WEB_APP = path.join(ROOT, "apps/web/app");
const WEB_LIB = path.join(ROOT, "apps/web/lib");
const GENERATED = path.join(ROOT, "packages/docs-upstream/generated");
const CONTENT_DIR = path.join(GENERATED, "content");

const checkMode = process.argv.includes("--check");

// ---------------------------------------------------------------------------
// 1. Read upstream page registry (apps/web/lib/docs-pages.ts)
// ---------------------------------------------------------------------------

// We parse the allDocsPages array from the source file directly rather than
// importing it, since this script runs standalone without a bundler.
const docsPagesSource = fs.readFileSync(path.join(WEB_LIB, "docs-pages.ts"), "utf-8");

type PageEntry = { name: string; href: string; slug: string };

function parseDocsPages(source: string): PageEntry[] {
  const entries: PageEntry[] = [];
  // Match { name: "...", href: "..." } entries
  const regex = /\{\s*name:\s*"([^"]+)"\s*,\s*href:\s*"([^"]+)"\s*\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    const name = match[1];
    const href = match[2];
    const slug = href === "/" ? "" : href.replace(/^\//, "");
    entries.push({ name, href, slug });
  }
  return entries;
}

const pages = parseDocsPages(docsPagesSource);
if (pages.length === 0) {
  console.error("sync: failed to parse any pages from apps/web/lib/docs-pages.ts");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Read upstream nav sections (apps/web/lib/docs-nav-sections.ts)
// ---------------------------------------------------------------------------

const navSectionsSource = fs.readFileSync(path.join(WEB_LIB, "docs-nav-sections.ts"), "utf-8");

function parseStringArray(source: string, varName: string): string[] {
  const pattern = new RegExp(`export\\s+const\\s+${varName}[^=]*=\\s*\\[([^\\]]+)\\]`, "s");
  const match = pattern.exec(source);
  if (!match) return [];
  const items: string[] = [];
  const strRegex = /"([^"]+)"/g;
  let strMatch: RegExpExecArray | null;
  while ((strMatch = strRegex.exec(match[1])) !== null) {
    items.push(strMatch[1]);
  }
  return items;
}

function parseRecordStringString(source: string, varName: string): Record<string, string> {
  const pattern = new RegExp(`export\\s+const\\s+${varName}[^=]*=\\s*\\{([^}]+)\\}`, "s");
  const match = pattern.exec(source);
  if (!match) return {};
  // Strip single-line comments before parsing to avoid matching comment content
  const body = match[1].replace(/\/\/.*$/gm, "");
  const record: Record<string, string> = {};
  // Handle both quoted and unquoted keys: "key": "value" or key: "value"
  const kvRegex = /(?:"([^"]+)"|(\w+)):\s*"([^"]+)"/g;
  let kvMatch: RegExpExecArray | null;
  while ((kvMatch = kvRegex.exec(body)) !== null) {
    const key = kvMatch[1] ?? kvMatch[2];
    record[key] = kvMatch[3];
  }
  return record;
}

const topSectionHrefs = parseStringArray(navSectionsSource, "TOP_SECTION_HREFS");
const referenceSectionHrefs = parseStringArray(navSectionsSource, "REFERENCE_SECTION_HREFS");
const navLabelOverrides = parseRecordStringString(navSectionsSource, "NAV_LABEL_OVERRIDES");

// ---------------------------------------------------------------------------
// 3. Read upstream site metadata constants (apps/web/lib/site-metadata.ts)
// ---------------------------------------------------------------------------

const siteMetaSource = fs.readFileSync(path.join(WEB_LIB, "site-metadata.ts"), "utf-8");

function parseStringConst(source: string, varName: string): string {
  // Handle multi-line string concatenation: "part1" + "part2"
  const pattern = new RegExp(
    `export\\s+const\\s+${varName}\\s*=\\s*\\n?\\s*("(?:[^"\\\\]|\\\\.)*"(?:\\s*\\+\\s*"(?:[^"\\\\]|\\\\.)*")*)`,
    "s",
  );
  const match = pattern.exec(source);
  if (!match) return "";
  // Evaluate the concatenation: "a" + "b" -> "ab"
  return match[1]
    .split(/"\s*\+\s*"/)
    .map((s) => s.replace(/^"|"$/g, ""))
    .join("");
}

function parseNumberConst(source: string, varName: string): number {
  const pattern = new RegExp(`export\\s+const\\s+${varName}\\s*=\\s*(\\d+)`);
  const match = pattern.exec(source);
  return match ? parseInt(match[1], 10) : 0;
}

const siteMetadata = {
  SITE_NAME: parseStringConst(siteMetaSource, "SITE_NAME"),
  SITE_URL: parseStringConst(siteMetaSource, "SITE_URL"),
  ROOT_DEFAULT_TITLE: parseStringConst(siteMetaSource, "ROOT_DEFAULT_TITLE"),
  TITLE_TEMPLATE: parseStringConst(siteMetaSource, "TITLE_TEMPLATE"),
  ROOT_SITE_DESCRIPTION: parseStringConst(siteMetaSource, "ROOT_SITE_DESCRIPTION"),
  PAGE_SITE_DESCRIPTION: parseStringConst(siteMetaSource, "PAGE_SITE_DESCRIPTION"),
  OG_IMAGE_WIDTH: parseNumberConst(siteMetaSource, "OG_IMAGE_WIDTH"),
  OG_IMAGE_HEIGHT: parseNumberConst(siteMetaSource, "OG_IMAGE_HEIGHT"),
  OG_TYPE: "website" as const,
  OG_LOCALE: "en_US",
  TWITTER_CARD: "summary_large_image" as const,
  GITHUB_REPO_URL: parseStringConst(siteMetaSource, "GITHUB_REPO_URL"),
  NPM_PACKAGE_URL: parseStringConst(siteMetaSource, "NPM_PACKAGE_URL"),
};

// ---------------------------------------------------------------------------
// 4. Read upstream service labels (apps/web/lib/service-labels.ts)
// ---------------------------------------------------------------------------

const serviceLabelsSource = fs.readFileSync(path.join(WEB_LIB, "service-labels.ts"), "utf-8");
const startupLabelOverrides = parseRecordStringString(serviceLabelsSource, "STARTUP_LABEL_OVERRIDES");

// ---------------------------------------------------------------------------
// 5. Copy upstream MDX content files
// ---------------------------------------------------------------------------

function copyContentFiles(entries: PageEntry[]): void {
  for (const entry of entries) {
    const mdxPath = entry.slug === "" ? path.join(WEB_APP, "page.mdx") : path.join(WEB_APP, entry.slug, "page.mdx");

    if (!fs.existsSync(mdxPath)) {
      console.error(`sync: missing upstream MDX at ${mdxPath} for slug "${entry.slug}"`);
      process.exit(1);
    }

    const content = fs.readFileSync(mdxPath, "utf-8");
    const targetSlug = entry.slug === "" ? "_root" : entry.slug;
    const targetPath = path.join(CONTENT_DIR, `${targetSlug}.mdx`);
    fs.writeFileSync(targetPath, content, "utf-8");
  }
}

// ---------------------------------------------------------------------------
// 6. Build output artifacts
// ---------------------------------------------------------------------------

const manifest = {
  generatedAt: new Date().toISOString().split("T")[0],
  pages: pages.map((p) => ({
    name: p.name,
    href: p.href,
    slug: p.slug,
    contentFile: p.slug === "" ? "_root.mdx" : `${p.slug}.mdx`,
  })),
};

const nav = {
  topSectionHrefs,
  referenceSectionHrefs,
  navLabelOverrides,
};

// Generate plain JavaScript (no TypeScript syntax). The .d.ts companion
// provides type information.
const indexJs = `// Auto-generated by packages/docs-upstream/src/sync.ts
// Do not edit manually. Run \`pnpm docs:sync\` to regenerate.

export const SITE_NAME = ${JSON.stringify(siteMetadata.SITE_NAME)};
export const SITE_URL = ${JSON.stringify(siteMetadata.SITE_URL)};
export const ROOT_DEFAULT_TITLE = ${JSON.stringify(siteMetadata.ROOT_DEFAULT_TITLE)};
export const TITLE_TEMPLATE = ${JSON.stringify(siteMetadata.TITLE_TEMPLATE)};
export const ROOT_SITE_DESCRIPTION = ${JSON.stringify(siteMetadata.ROOT_SITE_DESCRIPTION)};
export const PAGE_SITE_DESCRIPTION = ${JSON.stringify(siteMetadata.PAGE_SITE_DESCRIPTION)};
export const OG_IMAGE_WIDTH = ${siteMetadata.OG_IMAGE_WIDTH};
export const OG_IMAGE_HEIGHT = ${siteMetadata.OG_IMAGE_HEIGHT};
export const OG_TYPE = ${JSON.stringify(siteMetadata.OG_TYPE)};
export const OG_LOCALE = ${JSON.stringify(siteMetadata.OG_LOCALE)};
export const TWITTER_CARD = ${JSON.stringify(siteMetadata.TWITTER_CARD)};
export const GITHUB_REPO_URL = ${JSON.stringify(siteMetadata.GITHUB_REPO_URL)};
export const NPM_PACKAGE_URL = ${JSON.stringify(siteMetadata.NPM_PACKAGE_URL)};

export function suffixWithSiteName(shortTitle) {
  return \`\${shortTitle} | \${SITE_NAME}\`;
}

export function ogImageAlt(displayTitle) {
  return \`\${displayTitle} - \${SITE_NAME}\`;
}

export const STARTUP_LABEL_OVERRIDES = ${JSON.stringify(startupLabelOverrides, null, 2)};

export function resolveServiceLabel(name) {
  return STARTUP_LABEL_OVERRIDES[name] ?? name.charAt(0).toUpperCase() + name.slice(1);
}

export function formatServiceLabelsProse(labels) {
  const formatter = new Intl.ListFormat("en", { style: "long", type: "conjunction" });
  return formatter.format(labels);
}

export const allDocsPages = ${JSON.stringify(
  pages.map((p) => ({ name: p.name, href: p.href })),
  null,
  2,
)};

export const TOP_SECTION_HREFS = ${JSON.stringify(topSectionHrefs)};
export const REFERENCE_SECTION_HREFS = ${JSON.stringify(referenceSectionHrefs)};
export const NAV_LABEL_OVERRIDES = ${JSON.stringify(navLabelOverrides, null, 2)};
`;

// Generate the declaration file
const indexDts = `// Auto-generated by packages/docs-upstream/src/sync.ts
// Do not edit manually.

export declare const SITE_NAME: string;
export declare const SITE_URL: string;
export declare const ROOT_DEFAULT_TITLE: string;
export declare const TITLE_TEMPLATE: string;
export declare const ROOT_SITE_DESCRIPTION: string;
export declare const PAGE_SITE_DESCRIPTION: string;
export declare const OG_IMAGE_WIDTH: number;
export declare const OG_IMAGE_HEIGHT: number;
export declare const OG_TYPE: "website";
export declare const OG_LOCALE: string;
export declare const TWITTER_CARD: "summary_large_image";
export declare const GITHUB_REPO_URL: string;
export declare const NPM_PACKAGE_URL: string;
export declare function suffixWithSiteName(shortTitle: string): string;
export declare function ogImageAlt(displayTitle: string): string;
export declare const STARTUP_LABEL_OVERRIDES: Readonly<Record<string, string>>;
export declare function resolveServiceLabel(name: string): string;
export declare function formatServiceLabelsProse(labels: readonly string[]): string;
export type NavItem = { name: string; href: string };
export declare const allDocsPages: NavItem[];
export declare const TOP_SECTION_HREFS: readonly string[];
export declare const REFERENCE_SECTION_HREFS: readonly string[];
export declare const NAV_LABEL_OVERRIDES: Readonly<Record<string, string>>;
export type ManifestPage = {
  name: string;
  href: string;
  slug: string;
  contentFile: string;
};
`;

// ---------------------------------------------------------------------------
// 7. Write or check
// ---------------------------------------------------------------------------

function normalizeManifestForCheck(content: string): string {
  try {
    const parsed = JSON.parse(content) as { generatedAt?: string };
    delete parsed.generatedAt;
    return JSON.stringify(parsed, null, 2) + "\n";
  } catch {
    return content;
  }
}

function writeOrCheck(
  filePath: string,
  content: string,
  normalizeForCheck: (content: string) => string = (value) => value,
): boolean {
  if (checkMode) {
    if (!fs.existsSync(filePath)) {
      console.error(`CHECK FAILED: missing ${path.relative(ROOT, filePath)}`);
      return false;
    }
    const existing = fs.readFileSync(filePath, "utf-8");
    if (normalizeForCheck(existing) !== normalizeForCheck(content)) {
      console.error(`CHECK FAILED: stale ${path.relative(ROOT, filePath)}`);
      return false;
    }
    return true;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
  return true;
}

function writeOrCheckContent(entries: PageEntry[]): boolean {
  let ok = true;
  for (const entry of entries) {
    const mdxPath = entry.slug === "" ? path.join(WEB_APP, "page.mdx") : path.join(WEB_APP, entry.slug, "page.mdx");
    const content = fs.readFileSync(mdxPath, "utf-8");
    const targetSlug = entry.slug === "" ? "_root" : entry.slug;
    const targetPath = path.join(CONTENT_DIR, `${targetSlug}.mdx`);
    if (!writeOrCheck(targetPath, content)) ok = false;
  }
  return ok;
}

const manifestForWrite = JSON.stringify(manifest, null, 2) + "\n";

let allOk = true;

if (!writeOrCheck(path.join(GENERATED, "index.js"), indexJs)) allOk = false;
if (!writeOrCheck(path.join(GENERATED, "index.d.ts"), indexDts)) allOk = false;
if (!writeOrCheck(path.join(GENERATED, "manifest.json"), manifestForWrite, normalizeManifestForCheck)) allOk = false;
if (!writeOrCheck(path.join(GENERATED, "nav.json"), JSON.stringify(nav, null, 2) + "\n")) allOk = false;
if (!writeOrCheckContent(pages)) allOk = false;

if (checkMode) {
  if (allOk) {
    console.log("docs:sync:check passed. Generated artifacts are up to date.");
  } else {
    console.error("\ndocs:sync:check FAILED. Run `pnpm docs:sync` to regenerate.");
    process.exit(1);
  }
} else {
  console.log(`Synced ${pages.length} upstream pages to packages/docs-upstream/generated/`);
}
