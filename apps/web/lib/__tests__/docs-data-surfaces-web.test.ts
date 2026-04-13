import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { allDocsPages } from "../docs-pages";
import { loadDocsFilesFromRoot } from "../docs-files";
import { buildSearchIndexFromRoot, searchEntries, type IndexEntry } from "../search-index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// apps/web/lib/__tests__ → repo root is 4 levels up.
const REPO_ROOT = resolve(__dirname, "../../../..");
const APPS_WEB_DIR = resolve(REPO_ROOT, "apps/web");

// Source file paths for the static contract assertions at the bottom
// of this file — pin that the route handlers still delegate to the
// shared `search-index.ts` / `docs-files.ts` helpers rather than
// carrying their own hand-maintained page lists.
const SEARCH_ROUTE_PATH = resolve(REPO_ROOT, "apps/web/app/api/search/route.ts");
const DOCS_CHAT_ROUTE_PATH = resolve(REPO_ROOT, "apps/web/app/api/docs-chat/route.ts");
const APPS_WEB_ROOT_LIB_PATH = resolve(REPO_ROOT, "apps/web/lib/apps-web-root.ts");
const SEARCH_INDEX_LIB_PATH = resolve(REPO_ROOT, "apps/web/lib/search-index.ts");
const DOCS_FILES_LIB_PATH = resolve(REPO_ROOT, "apps/web/lib/docs-files.ts");

describe("buildSearchIndexFromRoot derives one entry per allDocsPages page", () => {
  it("returns exactly allDocsPages.length entries", async () => {
    const index = await buildSearchIndexFromRoot(APPS_WEB_DIR);
    expect(index.length).toBe(allDocsPages.length);
  });

  it("produces entries in the exact allDocsPages source order", async () => {
    const index = await buildSearchIndexFromRoot(APPS_WEB_DIR);
    expect(index.map((entry) => entry.href)).toEqual(allDocsPages.map((p) => p.href));
  });

  it("every index entry's title and href match the corresponding allDocsPages entry byte-for-byte", async () => {
    const index = await buildSearchIndexFromRoot(APPS_WEB_DIR);
    for (let i = 0; i < allDocsPages.length; i++) {
      expect(index[i].title).toBe(allDocsPages[i].name);
      expect(index[i].href).toBe(allDocsPages[i].href);
    }
  });

  it("the root entry has href '/' and title 'Getting Started'", async () => {
    const index = await buildSearchIndexFromRoot(APPS_WEB_DIR);
    const root = index.find((entry) => entry.href === "/");
    expect(root).toBeDefined();
    expect(root!.title).toBe("Getting Started");
  });

  it("the root entry's content surfaces real upstream page.mdx prose (non-empty and contains a load-bearing token)", async () => {
    const index = await buildSearchIndexFromRoot(APPS_WEB_DIR);
    const root = index.find((entry) => entry.href === "/")!;
    expect(root.content.length).toBeGreaterThan(0);
    // The upstream apps/web/app/page.mdx root page's intro prose
    // mentions "drop-in replacement" — a stable load-bearing token
    // that proves the file was actually read and stripped.
    expect(root.content).toContain("drop-in replacement");
  });

  it("the /foundry entry has href '/foundry' and title 'Foundry'", async () => {
    const index = await buildSearchIndexFromRoot(APPS_WEB_DIR);
    const foundry = index.find((entry) => entry.href === "/foundry");
    expect(foundry).toBeDefined();
    expect(foundry!.title).toBe("Foundry");
  });

  it("the /foundry entry's content surfaces real upstream foundry page.mdx prose", async () => {
    const index = await buildSearchIndexFromRoot(APPS_WEB_DIR);
    const foundry = index.find((entry) => entry.href === "/foundry")!;
    expect(foundry.content.length).toBeGreaterThan(0);
    // The upstream /foundry page documents the Foundry OAuth / compute
    // module emulator, so "Foundry" (capital F) should appear in the
    // stripped content at least once.
    expect(foundry.content).toContain("Foundry");
  });

  it("every index entry has a non-empty content string (no silent upstream page read failures)", async () => {
    const index = await buildSearchIndexFromRoot(APPS_WEB_DIR);
    for (const entry of index) {
      expect(entry.content.length).toBeGreaterThan(0);
    }
  });

  it("content is stripped of markdown syntax (no fenced code blocks, no heading hashes, no backticks)", async () => {
    const index = await buildSearchIndexFromRoot(APPS_WEB_DIR);
    for (const entry of index) {
      expect(entry.content).not.toContain("```");
      expect(entry.content).not.toMatch(/^#{1,6}\s/m);
    }
  });
});

describe("searchEntries (pure scorer driven by the route handler)", () => {
  // Synthetic 3-entry index shaped like the real IndexEntry triples.
  // Decoupling from the real filesystem lets the scorer tests stay
  // deterministic and focus on the ranking/snippet logic.
  const SYNTHETIC_INDEX: IndexEntry[] = [
    {
      title: "Foundry",
      href: "/foundry",
      content: "Run a local Foundry OAuth 2.0 and compute module emulator with full state persistence.",
    },
    {
      title: "Vercel API",
      href: "/vercel",
      content: "Emulate the Vercel REST API for deployments, projects, domains, and environment variables.",
    },
    {
      title: "Configuration",
      href: "/configuration",
      content: "Seed config options let you define users, OAuth clients, deployed apps, and compute module runtimes.",
    },
  ];

  it("returns an empty results array for a blank query", () => {
    expect(searchEntries("", SYNTHETIC_INDEX)).toEqual([]);
  });

  it("returns an empty results array for a whitespace-only query", () => {
    expect(searchEntries("   ", SYNTHETIC_INDEX)).toEqual([]);
  });

  it("returns a single title-match hit for a query matching only one entry's title", () => {
    const results = searchEntries("foundry", SYNTHETIC_INDEX);
    expect(results.length).toBeGreaterThanOrEqual(1);
    const foundry = results.find((r) => r.href === "/foundry");
    expect(foundry).toBeDefined();
    expect(foundry!.title).toBe("Foundry");
  });

  it("ranks title matches above content-only matches", () => {
    // "Foundry" is a title match for the /foundry entry AND a content
    // match (or token substring) inside /configuration. The title-
    // matching entry must rank first.
    const results = searchEntries("Foundry", SYNTHETIC_INDEX);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].href).toBe("/foundry");
  });

  it("returns a hit with a non-empty snippet when matching only on content", () => {
    // "emulator" appears only in the /foundry content (not its title),
    // so it should match on content and produce a snippet window.
    const results = searchEntries("emulator", SYNTHETIC_INDEX);
    const foundry = results.find((r) => r.href === "/foundry");
    expect(foundry).toBeDefined();
    expect(foundry!.snippet.length).toBeGreaterThan(0);
    expect(foundry!.snippet).toContain("emulator");
  });

  it("returns an empty results array for a query with zero hits", () => {
    expect(searchEntries("nonexistentkeywordxyz", SYNTHETIC_INDEX)).toEqual([]);
  });

  it("returns no more than 20 results even if every entry matched (cap regression guard)", () => {
    // Build a 30-entry synthetic index where every entry's title
    // contains the query term. The scorer must cap the result set
    // at 20 per the slice(0, 20) line in searchEntries.
    const bigIndex: IndexEntry[] = Array.from({ length: 30 }, (_, i) => ({
      title: `capLimitTitle${i}`,
      href: `/cap-${i}`,
      content: "",
    }));
    const results = searchEntries("caplimittitle", bigIndex);
    expect(results.length).toBe(20);
  });

  it("each result has the three expected fields and no score field (score is stripped before return)", () => {
    const results = searchEntries("foundry", SYNTHETIC_INDEX);
    for (const result of results) {
      expect(Object.keys(result).sort()).toEqual(["href", "snippet", "title"]);
    }
  });

  it("is case-insensitive on both query and content", () => {
    const lowerResults = searchEntries("foundry", SYNTHETIC_INDEX);
    const upperResults = searchEntries("FOUNDRY", SYNTHETIC_INDEX);
    const mixedResults = searchEntries("FoUnDrY", SYNTHETIC_INDEX);
    expect(lowerResults).toEqual(upperResults);
    expect(lowerResults).toEqual(mixedResults);
  });

  it("end-to-end: searchEntries against the real filesystem index matches a known upstream page", async () => {
    // Pin the pipeline end-to-end by driving searchEntries with the
    // real buildSearchIndexFromRoot output. Searching for "foundry"
    // should produce a hit with href "/foundry" at the top of the
    // result set (title match > content match).
    const index = await buildSearchIndexFromRoot(APPS_WEB_DIR);
    const results = searchEntries("foundry", index);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].href).toBe("/foundry");
    expect(results[0].title).toBe("Foundry");
  });

  it("end-to-end: searchEntries against the real filesystem index returns no results for an unmatched query", async () => {
    const index = await buildSearchIndexFromRoot(APPS_WEB_DIR);
    const results = searchEntries("nonexistentkeywordxyz123", index);
    expect(results).toEqual([]);
  });
});

describe("loadDocsFilesFromRoot derives one file per allDocsPages page", () => {
  it("returns one file entry per allDocsPages entry", async () => {
    const files = await loadDocsFilesFromRoot(APPS_WEB_DIR);
    expect(Object.keys(files).length).toBe(allDocsPages.length);
  });

  it("keys the root page under '/index.md' (not '/.md' or '/')", async () => {
    const files = await loadDocsFilesFromRoot(APPS_WEB_DIR);
    expect(files["/index.md"]).toBeDefined();
    expect(typeof files["/index.md"]).toBe("string");
    expect(files["/index.md"].length).toBeGreaterThan(0);
    // Guard against the wrong key shapes the previous refactors might regress into.
    expect(files["/"]).toBeUndefined();
    expect(files["/.md"]).toBeUndefined();
  });

  it("keys /foundry under '/foundry.md'", async () => {
    const files = await loadDocsFilesFromRoot(APPS_WEB_DIR);
    expect(files["/foundry.md"]).toBeDefined();
    expect(files["/foundry.md"].length).toBeGreaterThan(0);
  });

  it("keys /programmatic-api under '/programmatic-api.md' (required by docs-chat-summary's token assertion)", async () => {
    const files = await loadDocsFilesFromRoot(APPS_WEB_DIR);
    expect(files["/programmatic-api.md"]).toBeDefined();
    // docs-chat-summary.ts asserts `createEmulator` exists in this file.
    expect(files["/programmatic-api.md"]).toContain("createEmulator");
  });

  it("keys /nextjs under '/nextjs.md' (required by docs-chat-summary's token assertion)", async () => {
    const files = await loadDocsFilesFromRoot(APPS_WEB_DIR);
    expect(files["/nextjs.md"]).toBeDefined();
    // docs-chat-summary.ts asserts `@emulators/adapter-next` exists in this file.
    expect(files["/nextjs.md"]).toContain("@emulators/adapter-next");
  });

  it("every allDocsPages non-root entry has a '/<slug>.md' key in the files map", async () => {
    const files = await loadDocsFilesFromRoot(APPS_WEB_DIR);
    for (const page of allDocsPages) {
      if (page.href === "/") continue;
      const slug = page.href.replace(/^\//, "");
      const expectedKey = `/${slug}.md`;
      expect(files[expectedKey]).toBeDefined();
      expect(files[expectedKey].length).toBeGreaterThan(0);
    }
  });

  it("every file value is a non-empty stripped-markdown string (no allSettled fulfilled-with-empty surprises)", async () => {
    const files = await loadDocsFilesFromRoot(APPS_WEB_DIR);
    for (const [, content] of Object.entries(files)) {
      expect(typeof content).toBe("string");
      expect(content.length).toBeGreaterThan(0);
    }
  });

  it("file content has passed through mdxToCleanMarkdown (no MDX export/import lines, no JSX-only divs)", async () => {
    const files = await loadDocsFilesFromRoot(APPS_WEB_DIR);
    for (const content of Object.values(files)) {
      expect(content).not.toMatch(/^export\s/m);
      expect(content).not.toMatch(/^import\s/m);
      expect(content).not.toContain('<div className="');
    }
  });
});

describe("static contract: search and docs-chat routes delegate to the shared registry-backed helpers", () => {
  it("apps/web/app/api/search/route.ts imports getSearchIndex and searchEntries from the shared search-index helper", () => {
    const src = readFileSync(SEARCH_ROUTE_PATH, "utf-8");
    expect(src).toContain('from "@/lib/search-index"');
    expect(src).toContain("getSearchIndex");
    expect(src).toContain("searchEntries");
  });

  it("apps/web/app/api/search/route.ts does NOT hand-compose a parallel docs page list", () => {
    const src = readFileSync(SEARCH_ROUTE_PATH, "utf-8");
    expect(src).not.toContain("allDocsPages");
    expect(src).not.toContain('"Getting Started"');
    expect(src).not.toContain('"/foundry"');
    expect(src).not.toContain("/vercel");
  });

  it("apps/web/app/api/docs-chat/route.ts imports loadDocsFilesFromRoot from the shared docs-files helper", () => {
    const src = readFileSync(DOCS_CHAT_ROUTE_PATH, "utf-8");
    expect(src).toContain('from "@/lib/docs-files"');
    expect(src).toContain("loadDocsFilesFromRoot");
  });

  it("apps/web/app/api/docs-chat/route.ts no longer contains an inline loadDocsFiles function", () => {
    const src = readFileSync(DOCS_CHAT_ROUTE_PATH, "utf-8");
    // The previous inline function contained "allDocsPages.map" at the
    // core of its loop. After the refactor, that iteration lives
    // exclusively in docs-files.ts, so the route file must not mention
    // allDocsPages directly anymore.
    expect(src).not.toContain("allDocsPages");
    expect(src).not.toMatch(/function loadDocsFiles\s*\(/);
  });

  it("apps/web/lib/search-index.ts imports allDocsPages from the canonical registry", () => {
    const src = readFileSync(SEARCH_INDEX_LIB_PATH, "utf-8");
    expect(src).toContain('from "./docs-pages"');
    expect(src).toContain("allDocsPages");
  });

  it("apps/web/lib/search-index.ts resolves the apps/web root via the shared helper instead of process.cwd()", () => {
    const src = readFileSync(SEARCH_INDEX_LIB_PATH, "utf-8");
    expect(src).toContain('from "./apps-web-root"');
    expect(src).toContain("APPS_WEB_ROOT");
    expect(src).not.toContain("process.cwd()");
  });

  it("apps/web/lib/search-index.ts walks allDocsPages inside buildSearchIndexFromRoot", () => {
    const src = readFileSync(SEARCH_INDEX_LIB_PATH, "utf-8");
    expect(src).toMatch(/for\s*\(\s*const\s+item\s+of\s+allDocsPages\s*\)/);
  });

  it("apps/web/lib/docs-files.ts imports allDocsPages from the canonical registry", () => {
    const src = readFileSync(DOCS_FILES_LIB_PATH, "utf-8");
    expect(src).toContain('from "./docs-pages"');
    expect(src).toContain("allDocsPages");
  });

  it("apps/web/app/api/docs-chat/route.ts imports APPS_WEB_ROOT and does not depend on process.cwd()", () => {
    const src = readFileSync(DOCS_CHAT_ROUTE_PATH, "utf-8");
    expect(src).toContain('from "@/lib/apps-web-root"');
    expect(src).toContain("loadDocsFilesFromRoot(APPS_WEB_ROOT)");
    expect(src).not.toContain("process.cwd()");
  });

  it("apps/web/lib/apps-web-root.ts resolves apps/web relative to import.meta.url", () => {
    const src = readFileSync(APPS_WEB_ROOT_LIB_PATH, "utf-8");
    expect(src).toContain("fileURLToPath(import.meta.url)");
    expect(src).toContain('resolve(__dirname, "..")');
  });

  it("apps/web/lib/docs-files.ts walks allDocsPages via Promise.allSettled", () => {
    const src = readFileSync(DOCS_FILES_LIB_PATH, "utf-8");
    expect(src).toContain("Promise.allSettled");
    expect(src).toMatch(/allDocsPages\.map/);
  });

  it("apps/web/lib/docs-files.ts produces '/index.md' for root and '/<slug>.md' for non-root", () => {
    const src = readFileSync(DOCS_FILES_LIB_PATH, "utf-8");
    expect(src).toContain('"/index.md"');
    expect(src).toMatch(/`\/\$\{slug\}\.md`/);
  });

  it("neither route file carries a hand-maintained parallel list of docs slugs", () => {
    const searchRoute = readFileSync(SEARCH_ROUTE_PATH, "utf-8");
    const docsChatRoute = readFileSync(DOCS_CHAT_ROUTE_PATH, "utf-8");
    // Any inline literal array with known service slugs would be a
    // regression; the shared helper is the single source of truth.
    const forbiddenLiterals = ['"/programmatic-api"', '"/configuration"', '"/nextjs"', '"/foundry"'];
    for (const literal of forbiddenLiterals) {
      expect(searchRoute).not.toContain(literal);
      expect(docsChatRoute).not.toContain(literal);
    }
  });
});
