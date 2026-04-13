import { describe, expect, it } from "vitest";
import {
  NAV_LABEL_OVERRIDES,
  REFERENCE_SECTION_HREFS,
  TOP_SECTION_HREFS,
} from "../../../../../apps/web/lib/docs-nav-sections";
import { NAV_LABEL_OVERRIDES as webNavOverrides } from "../../../../../apps/web/lib/docs-navigation";
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

  it("is the exact same object reference re-exported from apps/web/lib/docs-navigation", () => {
    // Identity equality (toBe, not toEqual) proves the re-export
    // resolves to the single shared object in docs-nav-sections.ts —
    // no parallel literal exists in the Next.js nav consumer.
    expect(webNavOverrides).toBe(NAV_LABEL_OVERRIDES);
  });

  it("is the exact same object reference re-exported from apps/web-svelte/src/lib/nav", () => {
    // Same identity-equality guard for the Svelte nav consumer.
    expect(svelteNavOverrides).toBe(NAV_LABEL_OVERRIDES);
  });

  it("every override key is a top-level href (single slash segment, leading slash)", () => {
    for (const key of Object.keys(NAV_LABEL_OVERRIDES)) {
      expect(key.startsWith("/")).toBe(true);
      // Single-segment slug, e.g. "/vercel" not "/vercel/api".
      expect(key.slice(1).includes("/")).toBe(false);
    }
  });

  it("every override value is a non-empty shortened label", () => {
    for (const value of Object.values(NAV_LABEL_OVERRIDES)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
      // Shortened labels must not contain the " API" or " Sign In"
      // suffix the canonical page names carry.
      expect(value).not.toMatch(/ API$/);
      expect(value).not.toMatch(/ Sign In$/);
    }
  });
});

describe("TOP_SECTION_HREFS canonical shape", () => {
  it("contains exactly the four first-party onboarding hrefs in the expected order", () => {
    expect(TOP_SECTION_HREFS).toEqual([
      "/",
      "/programmatic-api",
      "/configuration",
      "/nextjs",
    ]);
  });

  it("is a readonly array (not a Set) so consumers can spread into ordered lists", () => {
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
      // /foundry, /vercel, etc. are service hrefs; none should leak
      // into the reference set.
      expect(href).not.toMatch(/^\/(foundry|vercel|github|google|slack|apple|microsoft|aws|okta|mongoatlas|resend|stripe)$/);
    }
  });
});

describe("Svelte nav.sections consumes the shared helper with the expected structure", () => {
  it("has exactly three sections (top, services, reference)", () => {
    expect(sections.length).toBe(3);
  });

  it("top section has no title and contains the four shared TOP_SECTION_HREFS entries in order", () => {
    const top = sections[0];
    expect(top.title).toBeUndefined();
    expect(top.items.map((i) => i.href)).toEqual([...TOP_SECTION_HREFS]);
  });

  it("root top item resolves to the Svelte-local 'Overview' label (NOT 'Getting Started')", () => {
    // The Svelte app overrides the root slug to "Overview" in
    // PAGE_TITLES, and resolveNavLabel falls back to PAGE_TITLES
    // for non-overridden entries. The Next.js nav uses
    // "Getting Started" from allDocsPages because it has no
    // equivalent local root override.
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
    // /microsoft is not overridden → "Microsoft Entra ID" from PAGE_TITLES
    expect(byHref.get("/microsoft")).toBe("Microsoft Entra ID");
    // /foundry, /aws, /okta, /mongoatlas, /resend, /stripe all come
    // straight from the Svelte PAGE_TITLES entries.
    expect(byHref.get("/foundry")).toBe("Foundry");
    expect(byHref.get("/aws")).toBe("AWS");
    expect(byHref.get("/okta")).toBe("Okta");
    expect(byHref.get("/mongoatlas")).toBe("MongoDB Atlas");
    expect(byHref.get("/resend")).toBe("Resend");
    expect(byHref.get("/stripe")).toBe("Stripe");
  });

  it("reference section is titled 'Reference' and contains the two shared REFERENCE_SECTION_HREFS entries in order", () => {
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

describe("Next.js docsNavSections consumes the shared helper with the expected structure", () => {
  it("top section contains the shared TOP_SECTION_HREFS in the same order", async () => {
    const { docsNavSections } = await import(
      "../../../../../apps/web/lib/docs-navigation"
    );
    const top = docsNavSections[0];
    expect(top.items.map((i) => i.href)).toEqual([...TOP_SECTION_HREFS]);
  });

  it("root top item resolves to 'Getting Started' (from allDocsPages.name, NOT 'Overview')", async () => {
    // The Next.js nav's label resolver falls back to
    // `allDocsPages.name` which has "Getting Started" for the root,
    // NOT the Svelte-local "Overview" override. This test pins that
    // the two apps' root labels intentionally differ while sharing
    // the same NAV_LABEL_OVERRIDES map.
    const { docsNavSections } = await import(
      "../../../../../apps/web/lib/docs-navigation"
    );
    const top = docsNavSections[0];
    const rootItem = top.items.find((i) => i.href === "/");
    expect(rootItem).toBeDefined();
    expect(rootItem!.label).toBe("Getting Started");
  });

  it("services section applies the same NAV_LABEL_OVERRIDES as the Svelte nav", async () => {
    const { docsNavSections } = await import(
      "../../../../../apps/web/lib/docs-navigation"
    );
    const services = docsNavSections[1];
    const byHref = new Map(services.items.map((item) => [item.href, item.label]));
    expect(byHref.get("/vercel")).toBe("Vercel");
    expect(byHref.get("/github")).toBe("GitHub");
    expect(byHref.get("/google")).toBe("Google");
    expect(byHref.get("/slack")).toBe("Slack");
    expect(byHref.get("/apple")).toBe("Apple");
  });

  it("services section follows allDocsPages source order (Foundry between Microsoft and AWS, not first)", async () => {
    // The Next.js nav falls through the classifier's services
    // default bucket in allDocsPages source order, so /foundry lands
    // at position 6 (between /microsoft at 5 and /aws at 7). This
    // differs from the Svelte nav's Foundry-first ordering and
    // confirms the two apps intentionally diverge on services
    // ordering even though they share TOP/REFERENCE_SECTION_HREFS.
    const { docsNavSections } = await import(
      "../../../../../apps/web/lib/docs-navigation"
    );
    const services = docsNavSections[1];
    const hrefs = services.items.map((i) => i.href);
    const foundryIdx = hrefs.indexOf("/foundry");
    const microsoftIdx = hrefs.indexOf("/microsoft");
    const awsIdx = hrefs.indexOf("/aws");
    expect(microsoftIdx).toBeGreaterThan(-1);
    expect(foundryIdx).toBe(microsoftIdx + 1);
    expect(awsIdx).toBe(foundryIdx + 1);
  });

  it("reference section contains the shared REFERENCE_SECTION_HREFS in the same order", async () => {
    const { docsNavSections } = await import(
      "../../../../../apps/web/lib/docs-navigation"
    );
    const reference = docsNavSections[2];
    expect(reference.items.map((i) => i.href)).toEqual([...REFERENCE_SECTION_HREFS]);
  });
});

describe("shared helper drives both apps with byte-identical overrides + top/reference classification", () => {
  it("the five brand-sensitive labels render identically on both the Next.js and Svelte Services sections", async () => {
    const [{ docsNavSections }, { sections: svelteSections }] = await Promise.all([
      import("../../../../../apps/web/lib/docs-navigation"),
      import("../nav"),
    ]);
    const webServices = new Map(
      docsNavSections[1].items.map((i) => [i.href, i.label]),
    );
    const svelteServices = new Map(
      svelteSections[1].items.map((i) => [i.href, i.label]),
    );
    for (const overrideHref of Object.keys(NAV_LABEL_OVERRIDES)) {
      const expectedLabel = NAV_LABEL_OVERRIDES[overrideHref];
      expect(webServices.get(overrideHref)).toBe(expectedLabel);
      expect(svelteServices.get(overrideHref)).toBe(expectedLabel);
    }
  });

  it("the top section href ordering is identical on both apps", async () => {
    const [{ docsNavSections }, { sections: svelteSections }] = await Promise.all([
      import("../../../../../apps/web/lib/docs-navigation"),
      import("../nav"),
    ]);
    const webTopHrefs = docsNavSections[0].items.map((i) => i.href);
    const svelteTopHrefs = svelteSections[0].items.map((i) => i.href);
    expect(webTopHrefs).toEqual(svelteTopHrefs);
    expect(webTopHrefs).toEqual([...TOP_SECTION_HREFS]);
  });

  it("the reference section href ordering is identical on both apps", async () => {
    const [{ docsNavSections }, { sections: svelteSections }] = await Promise.all([
      import("../../../../../apps/web/lib/docs-navigation"),
      import("../nav"),
    ]);
    const webReferenceHrefs = docsNavSections[2].items.map((i) => i.href);
    const svelteReferenceHrefs = svelteSections[2].items.map((i) => i.href);
    expect(webReferenceHrefs).toEqual(svelteReferenceHrefs);
    expect(webReferenceHrefs).toEqual([...REFERENCE_SECTION_HREFS]);
  });

  it("the root nav label intentionally differs: Next.js 'Getting Started' vs Svelte 'Overview'", async () => {
    const [{ docsNavSections }, { sections: svelteSections }] = await Promise.all([
      import("../../../../../apps/web/lib/docs-navigation"),
      import("../nav"),
    ]);
    const webRoot = docsNavSections[0].items.find((i) => i.href === "/");
    const svelteRoot = svelteSections[0].items.find((i) => i.href === "/");
    expect(webRoot!.label).toBe("Getting Started");
    expect(svelteRoot!.label).toBe("Overview");
    expect(webRoot!.label).not.toBe(svelteRoot!.label);
  });
});
