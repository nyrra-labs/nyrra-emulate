import { describe, expect, it } from "vitest";
import { NAV_LABEL_OVERRIDES, REFERENCE_SECTION_HREFS, TOP_SECTION_HREFS } from "docs-upstream";
import { NAV_LABEL_OVERRIDES as svelteNavOverrides, sections } from "../nav";

describe("NAV_LABEL_OVERRIDES canonical shape", () => {
  it("contains exactly the five brand-sensitive service shortenings", () => {
    expect(NAV_LABEL_OVERRIDES).toEqual({
      "/vercel": "Vercel",
      "/github": "GitHub",
      "/google": "Google",
      "/slack": "Slack",
      "/apple": "Apple",
    });
  });

  it("is re-exported from web-svelte nav module", () => {
    expect(svelteNavOverrides).toEqual(NAV_LABEL_OVERRIDES);
  });

  it("every override key is a top-level href (single slash segment, leading slash)", () => {
    for (const key of Object.keys(NAV_LABEL_OVERRIDES)) {
      expect(key.startsWith("/")).toBe(true);
      expect(key.slice(1).includes("/")).toBe(false);
    }
  });

  it("every override value is a non-empty shortened label", () => {
    for (const value of Object.values(NAV_LABEL_OVERRIDES)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
      expect(value).not.toMatch(/ API$/);
      expect(value).not.toMatch(/ Sign In$/);
    }
  });
});

describe("TOP_SECTION_HREFS canonical shape", () => {
  it("contains exactly the four first-party onboarding hrefs in the expected order", () => {
    expect(TOP_SECTION_HREFS).toEqual(["/", "/programmatic-api", "/configuration", "/nextjs"]);
  });

  it("is a readonly array so consumers can spread into ordered lists", () => {
    expect(Array.isArray(TOP_SECTION_HREFS)).toBe(true);
  });

  it("contains the root href '/'", () => {
    expect(TOP_SECTION_HREFS).toContain("/");
  });
});

describe("REFERENCE_SECTION_HREFS canonical shape", () => {
  it("contains exactly the two reference hrefs in the expected order", () => {
    expect(REFERENCE_SECTION_HREFS).toEqual(["/authentication", "/architecture"]);
  });

  it("is a readonly array", () => {
    expect(Array.isArray(REFERENCE_SECTION_HREFS)).toBe(true);
  });

  it("does NOT contain any top or services hrefs (bucket separation guard)", () => {
    for (const href of REFERENCE_SECTION_HREFS) {
      expect(TOP_SECTION_HREFS).not.toContain(href);
      expect(href).not.toMatch(
        /^\/(foundry|vercel|github|google|slack|apple|microsoft|aws|okta|mongoatlas|resend|stripe)$/,
      );
    }
  });
});

describe("Svelte nav.sections consumes upstream data with the expected structure", () => {
  it("has exactly three sections (top, services, reference)", () => {
    expect(sections.length).toBe(3);
  });

  it("top section has no title and contains the four TOP_SECTION_HREFS entries in order", () => {
    const top = sections[0];
    expect(top.title).toBeUndefined();
    expect(top.items.map((i) => i.href)).toEqual([...TOP_SECTION_HREFS]);
  });

  it("root top item resolves to the Svelte-local 'Overview' label (NOT 'Getting Started')", () => {
    const top = sections[0];
    const rootItem = top.items.find((i) => i.href === "/");
    expect(rootItem).toBeDefined();
    expect(rootItem!.label).toBe("Overview");
  });

  it("services section is titled 'Services' and places /foundry first (FoundryCI-first positioning)", () => {
    const services = sections[1];
    expect(services.title).toBe("Services");
    expect(services.items[0].href).toBe("/foundry");
  });

  it("services section contains all twelve service hrefs in the Svelte-local Foundry-first order", () => {
    const services = sections[1];
    expect(services.items.map((i) => i.href)).toEqual([
      "/foundry",
      "/vercel",
      "/github",
      "/google",
      "/slack",
      "/apple",
      "/microsoft",
      "/aws",
      "/okta",
      "/mongoatlas",
      "/resend",
      "/stripe",
    ]);
  });

  it("services section applies the NAV_LABEL_OVERRIDES to the five brand-sensitive entries", () => {
    const services = sections[1];
    const byHref = new Map(services.items.map((item) => [item.href, item.label]));
    expect(byHref.get("/vercel")).toBe("Vercel");
    expect(byHref.get("/github")).toBe("GitHub");
    expect(byHref.get("/google")).toBe("Google");
    expect(byHref.get("/slack")).toBe("Slack");
    expect(byHref.get("/apple")).toBe("Apple");
  });

  it("services section preserves the non-overridden labels verbatim (from Svelte PAGE_TITLES)", () => {
    const services = sections[1];
    const byHref = new Map(services.items.map((item) => [item.href, item.label]));
    expect(byHref.get("/microsoft")).toBe("Microsoft Entra ID");
    expect(byHref.get("/foundry")).toBe("Foundry");
    expect(byHref.get("/aws")).toBe("AWS");
    expect(byHref.get("/okta")).toBe("Okta");
    expect(byHref.get("/mongoatlas")).toBe("MongoDB Atlas");
    expect(byHref.get("/resend")).toBe("Resend");
    expect(byHref.get("/stripe")).toBe("Stripe");
  });

  it("reference section is titled 'Reference' and contains the two REFERENCE_SECTION_HREFS entries in order", () => {
    const reference = sections[2];
    expect(reference.title).toBe("Reference");
    expect(reference.items.map((i) => i.href)).toEqual([...REFERENCE_SECTION_HREFS]);
  });

  it("reference section renders 'Authentication' and 'Architecture' labels verbatim", () => {
    const reference = sections[2];
    const labels = reference.items.map((i) => i.label);
    expect(labels).toEqual(["Authentication", "Architecture"]);
  });
});
