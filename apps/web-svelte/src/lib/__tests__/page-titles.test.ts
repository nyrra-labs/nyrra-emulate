import { describe, expect, it } from "vitest";
import { allDocsPages } from "docs-upstream";
import { PAGE_TITLES, PAGE_TITLE_OVERRIDES, getPageTitle } from "../page-titles";

const slugForHref = (href: string) => (href === "/" ? "" : href.replace(/^\/+/, ""));

describe("PAGE_TITLES root and brand entries", () => {
  it("resolves the empty-string root slug to Overview", () => {
    expect(PAGE_TITLES[""]).toBe("Overview");
    expect(getPageTitle("")).toBe("Overview");
  });

  it("resolves the FoundryCI brand slugs to their human titles", () => {
    expect(PAGE_TITLES["foundry"]).toBe("Foundry");
    expect(PAGE_TITLES["configuration"]).toBe("Configuration");
    expect(getPageTitle("foundry")).toBe("Foundry");
    expect(getPageTitle("configuration")).toBe("Configuration");
  });

  it("resolves representative service slugs to upstream-mirrored display names", () => {
    expect(PAGE_TITLES["vercel"]).toBe("Vercel API");
    expect(PAGE_TITLES["github"]).toBe("GitHub API");
    expect(PAGE_TITLES["google"]).toBe("Google API");
    expect(PAGE_TITLES["slack"]).toBe("Slack API");
    expect(PAGE_TITLES["apple"]).toBe("Apple Sign In");
    expect(PAGE_TITLES["microsoft"]).toBe("Microsoft Entra ID");
    expect(PAGE_TITLES["mongoatlas"]).toBe("MongoDB Atlas");
    expect(PAGE_TITLES["nextjs"]).toBe("Next.js Integration");
    expect(PAGE_TITLES["programmatic-api"]).toBe("Programmatic API");
  });
});

describe("getPageTitle behavior", () => {
  it("returns null for an unknown slug instead of throwing or returning undefined", () => {
    expect(getPageTitle("definitely-not-a-page")).toBeNull();
    expect(getPageTitle("foundry/something")).toBeNull();
  });

  it("treats the slug as a bare identifier, not a pathname", () => {
    // The function takes a slug (no leading slash), not a pathname.
    // "/foundry" is not a key in PAGE_TITLES, so it returns null.
    expect(getPageTitle("/foundry")).toBeNull();
    expect(getPageTitle("foundry")).toBe("Foundry");
  });

  it("matches the exported PAGE_TITLES map entry-by-entry", () => {
    for (const [slug, expected] of Object.entries(PAGE_TITLES)) {
      expect(getPageTitle(slug)).toBe(expected);
    }
  });
});

// PAGE_TITLES ↔ docsSources parity is no longer asserted here. After
// the title-registry consolidation, docsSources is a derived projection
// of PAGE_TITLES — there is no second hand-maintained map to keep in
// lockstep. The single derivation-proof assertion lives in
// docs-source.test.ts ("is the derived projection of PAGE_TITLES with
// the slug→href convention").

describe("PAGE_TITLES upstream catalog derivation", () => {
  it("PAGE_TITLE_OVERRIDES contains exactly the expected explicit local divergences", () => {
    // Pinning the override map shape locks in the conscious local
    // divergences from the upstream catalog. Today this map has
    // exactly one entry — the root slug "" branded as "Overview"
    // instead of upstream's "Getting Started" — and a future change
    // must update the test and the source together.
    expect(PAGE_TITLE_OVERRIDES).toEqual({
      "": "Overview",
    });
  });

  it("PAGE_TITLES has the same key set as the upstream allDocsPages catalog", () => {
    // Every implemented slug derives from upstream; there is no
    // hand-maintained second list. A regression that hand-added a
    // local-only slug or dropped an upstream slug would fail this
    // assertion with a precise diff.
    const upstreamSlugs = allDocsPages.map(({ href }) => slugForHref(href)).sort();
    const pageSlugs = Object.keys(PAGE_TITLES).sort();
    expect(pageSlugs).toEqual(upstreamSlugs);
  });

  it("every PAGE_TITLES value equals PAGE_TITLE_OVERRIDES[slug] when set, otherwise the upstream name", () => {
    // The load-bearing assertion that there is no hand-duplicated
    // title anywhere in PAGE_TITLES. Every value must come from one
    // of two sources, and the two sources are checked in priority
    // order (override wins over upstream). A regression that
    // hand-duplicated a title that drifts from upstream would fail
    // here with a precise mismatch on that single slug.
    for (const { name, href } of allDocsPages) {
      const slug = slugForHref(href);
      const expected = PAGE_TITLE_OVERRIDES[slug] ?? name;
      expect(PAGE_TITLES[slug], `expected PAGE_TITLES["${slug}"]`).toBe(expected);
    }
  });

  it("PAGE_TITLES differs from upstream allDocsPages only at the slugs in PAGE_TITLE_OVERRIDES", () => {
    // The inverse formulation: walk upstream and find every slug
    // whose PAGE_TITLES value differs from the upstream name. The
    // resulting set must equal the override map's key set exactly.
    // Today that means the only divergent slug is the root ("").
    const divergent: Record<string, { upstream: string; local: string }> = {};
    for (const { name, href } of allDocsPages) {
      const slug = slugForHref(href);
      if (PAGE_TITLES[slug] !== name) {
        divergent[slug] = { upstream: name, local: PAGE_TITLES[slug]! };
      }
    }
    expect(Object.keys(divergent).sort()).toEqual(Object.keys(PAGE_TITLE_OVERRIDES).sort());
    // And each divergent local value matches the override map.
    for (const [slug, { local }] of Object.entries(divergent)) {
      expect(local).toBe(PAGE_TITLE_OVERRIDES[slug]);
    }
  });

  it("the root override is exactly Overview vs upstream Getting Started", () => {
    // An explicit pin for the load-bearing single divergence today,
    // so a future upstream rename of "Getting Started" to anything
    // else would surface here AND would require either updating the
    // override or removing it (which would let the upstream rename
    // flow through automatically).
    const upstreamRoot = allDocsPages.find(({ href }) => href === "/");
    expect(upstreamRoot).toBeDefined();
    expect(upstreamRoot!.name).toBe("Getting Started");
    expect(PAGE_TITLES[""]).toBe("Overview");
    expect(PAGE_TITLE_OVERRIDES[""]).toBe("Overview");
  });
});
