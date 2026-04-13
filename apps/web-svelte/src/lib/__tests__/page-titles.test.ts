import { describe, expect, it } from "vitest";
import { PAGE_TITLES, getPageTitle } from "../page-titles";

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
