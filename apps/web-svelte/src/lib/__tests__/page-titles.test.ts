import { describe, expect, it } from "vitest";
import { docsSources } from "../docs-source";
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

describe("PAGE_TITLES ↔ docsSources parity", () => {
  it("every non-root PAGE_TITLES slug maps to an implemented docsSources entry with matching title", () => {
    const sourceByHref = new Map(docsSources.map((s) => [s.href, s]));
    for (const slug of Object.keys(PAGE_TITLES)) {
      if (slug === "") continue;
      const href = `/${slug}`;
      const source = sourceByHref.get(href);
      expect(source, `expected docsSources entry for href ${href}`).toBeDefined();
      expect(source!.title).toBe(PAGE_TITLES[slug]);
    }
  });

  it("every docsSources entry corresponds to a PAGE_TITLES slug with matching title", () => {
    for (const source of docsSources) {
      const slug = source.href === "/" ? "" : source.href.slice(1);
      expect(PAGE_TITLES[slug]).toBe(source.title);
    }
  });
});
