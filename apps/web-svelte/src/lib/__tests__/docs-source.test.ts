import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { docsSources } from "../docs-source";
import { PAGE_TITLES } from "../page-titles";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Lists every upstream apps/web docs MDX page by reading the filesystem
 * directly (not via the Vite glob), so the test verifies the same set
 * the docs-source registry's reverse parity guard sees at module init,
 * via an independent path. Returns one href per upstream page using the
 * same convention the registry uses (root `/`, otherwise `/${slug}`).
 */
function listUpstreamDocsHrefs(): string[] {
  const upstreamAppDir = resolve(__dirname, "../../../../web/app");
  const hrefs: string[] = [];
  for (const entry of readdirSync(upstreamAppDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name === "page.mdx") {
      hrefs.push("/");
      continue;
    }
    if (entry.isDirectory()) {
      const inner = readdirSync(resolve(upstreamAppDir, entry.name), { withFileTypes: true });
      if (inner.some((f) => f.isFile() && f.name === "page.mdx")) {
        hrefs.push(`/${entry.name}`);
      }
    }
  }
  return hrefs.sort();
}

describe("docsSources", () => {
  it("registers every implemented Svelte route once with non-empty upstream MDX", () => {
    const hrefs = docsSources.map((s) => s.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const source of docsSources) {
      expect(source.title.length).toBeGreaterThan(0);
      expect(source.raw.length).toBeGreaterThan(0);
    }
  });

  it("is the derived projection of PAGE_TITLES with the slug→href convention", () => {
    // PAGE_TITLES is the single source of truth for the implemented
    // docs slug set. docsSources derives from it via the slug→href
    // convention ("" -> "/", "foundry" -> "/foundry"), so this test
    // pins both the entry-set parity and the iteration order in one
    // assertion. A regression that broke the derivation would change
    // the projected (href, title) pair for at least one entry.
    const expected = Object.entries(PAGE_TITLES).map(([slug, title]) => ({
      href: slug === "" ? "/" : `/${slug}`,
      title,
    }));
    expect(docsSources.map(({ href, title }) => ({ href, title }))).toEqual(expected);
  });

  it("includes the FoundryCI brand routes the metadata module overrides", () => {
    const hrefs = new Set(docsSources.map((s) => s.href));
    expect(hrefs.has("/foundry")).toBe(true);
    expect(hrefs.has("/configuration")).toBe(true);
    expect(hrefs.has("/")).toBe(true);
  });

  it("each upstream raw MDX entry contains some recognizable Markdown", () => {
    const foundry = docsSources.find((s) => s.href === "/foundry");
    expect(foundry).toBeDefined();
    expect(foundry!.raw).toMatch(/Foundry/i);
    const vercel = docsSources.find((s) => s.href === "/vercel");
    expect(vercel).toBeDefined();
    expect(vercel!.raw).toMatch(/vercel/i);
  });
});

describe("upstream MDX ↔ PAGE_TITLES parity", () => {
  it("the upstream apps/web docs MDX set is exactly equal to the surfaced PAGE_TITLES set today", () => {
    // Independent filesystem walk of apps/web/app/**/page.mdx, compared
    // against docsSources's projected hrefs. The forward guard inside
    // docs-source.ts already aborts module init if PAGE_TITLES references
    // a missing upstream page; the reverse guard aborts module init if
    // upstream has a page that PAGE_TITLES does not surface and that is
    // not in INTENTIONALLY_UNSURFACED_UPSTREAM_HREFS. This test pins
    // both directions explicitly so a future upstream sync that adds
    // a page without a PAGE_TITLES update fails here AND at module init,
    // and a future PAGE_TITLES change without an upstream MDX fails here
    // AND at module init.
    const upstreamHrefs = listUpstreamDocsHrefs();
    const surfacedHrefs = docsSources.map((s) => s.href).sort();
    expect(upstreamHrefs).toEqual(surfacedHrefs);
  });

  it("the current repo state has no upstream pages that need an explicit unsurfaced-allowlist entry", () => {
    // A direct reformulation of the parity assertion: every upstream
    // page is surfaced today, so the INTENTIONALLY_UNSURFACED_UPSTREAM_HREFS
    // allowlist should remain empty. If this test ever fails, it means
    // a future state legitimately needs a non-empty allowlist; the test
    // and the comment in docs-source.ts should both be updated together.
    const upstreamHrefs = new Set(listUpstreamDocsHrefs());
    const surfacedHrefs = new Set(docsSources.map((s) => s.href));
    const missing = [...upstreamHrefs].filter((href) => !surfacedHrefs.has(href));
    expect(missing).toEqual([]);
  });
});
