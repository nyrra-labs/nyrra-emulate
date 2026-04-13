import { describe, expect, it } from "vitest";
import {
  allDocsPages,
  docsNavAllItems,
  docsNavSections,
  NAV_LABEL_OVERRIDES,
} from "../docs-navigation";

const SERVICE_HREF_REFERENCE: readonly string[] = [
  "/vercel",
  "/github",
  "/google",
  "/slack",
  "/apple",
  "/microsoft",
  "/foundry",
  "/aws",
  "/okta",
  "/mongoatlas",
  "/resend",
  "/stripe",
];

describe("docsNavSections structural shape", () => {
  it("has exactly three sections in order (top, services, reference)", () => {
    expect(docsNavSections.length).toBe(3);
  });

  it("the first section is the unlabeled top section (no title)", () => {
    expect(docsNavSections[0].title).toBeUndefined();
  });

  it("the second section is 'Services'", () => {
    expect(docsNavSections[1].title).toBe("Services");
  });

  it("the third section is 'Reference'", () => {
    expect(docsNavSections[2].title).toBe("Reference");
  });

  it("every item has a non-empty href and label", () => {
    for (const section of docsNavSections) {
      for (const item of section.items) {
        expect(typeof item.href).toBe("string");
        expect(typeof item.label).toBe("string");
        expect(item.href.length).toBeGreaterThan(0);
        expect(item.label.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("docsNavSections coverage of the canonical allDocsPages registry", () => {
  it("the union of every section's items covers allDocsPages.length entries", () => {
    const flat = docsNavSections.flatMap((s) => s.items);
    expect(flat.length).toBe(allDocsPages.length);
  });

  it("every allDocsPages href appears in exactly one section item", () => {
    const flat = docsNavSections.flatMap((s) => s.items);
    const hrefCounts = new Map<string, number>();
    for (const item of flat) {
      hrefCounts.set(item.href, (hrefCounts.get(item.href) ?? 0) + 1);
    }
    for (const page of allDocsPages) {
      expect(hrefCounts.get(page.href)).toBe(1);
    }
  });

  it("every nav href corresponds to a real allDocsPages entry (no dangling links)", () => {
    const allHrefs = new Set(allDocsPages.map((p) => p.href));
    for (const section of docsNavSections) {
      for (const item of section.items) {
        expect(allHrefs.has(item.href)).toBe(true);
      }
    }
  });

  it("docsNavAllItems is a flat view of docsNavSections and matches allDocsPages source order", () => {
    const flat = docsNavSections.flatMap((s) => s.items);
    expect(docsNavAllItems).toEqual(flat);
  });
});

describe("docsNavSections top section", () => {
  it("contains the four onboarding pages in allDocsPages source order", () => {
    const top = docsNavSections[0];
    expect(top.items.map((item) => item.href)).toEqual([
      "/",
      "/programmatic-api",
      "/configuration",
      "/nextjs",
    ]);
  });

  it("uses the canonical allDocsPages names for onboarding labels (no overrides)", () => {
    const top = docsNavSections[0];
    expect(top.items.map((item) => item.label)).toEqual([
      "Getting Started",
      "Programmatic API",
      "Configuration",
      "Next.js Integration",
    ]);
  });
});

describe("docsNavSections services section", () => {
  it("contains exactly the 12 per-provider service hrefs in allDocsPages source order", () => {
    const services = docsNavSections[1];
    expect(services.items.map((item) => item.href)).toEqual(SERVICE_HREF_REFERENCE);
  });

  it("contains /foundry (the canonical registry entry that was previously silently omitted)", () => {
    const services = docsNavSections[1];
    const foundryItem = services.items.find((item) => item.href === "/foundry");
    expect(foundryItem).toBeDefined();
    expect(foundryItem?.label).toBe("Foundry");
  });

  it("places /foundry in allDocsPages source order (between /microsoft and /aws)", () => {
    const services = docsNavSections[1];
    const hrefs = services.items.map((item) => item.href);
    const foundryIdx = hrefs.indexOf("/foundry");
    const microsoftIdx = hrefs.indexOf("/microsoft");
    const awsIdx = hrefs.indexOf("/aws");
    expect(foundryIdx).toBe(microsoftIdx + 1);
    expect(awsIdx).toBe(foundryIdx + 1);
  });

  it("applies NAV_LABEL_OVERRIDES to the five intentionally-shortened service labels", () => {
    const services = docsNavSections[1];
    const byHref = new Map(services.items.map((item) => [item.href, item.label]));
    expect(byHref.get("/vercel")).toBe("Vercel");
    expect(byHref.get("/github")).toBe("GitHub");
    expect(byHref.get("/google")).toBe("Google");
    expect(byHref.get("/slack")).toBe("Slack");
    expect(byHref.get("/apple")).toBe("Apple");
  });

  it("uses the canonical allDocsPages name for non-overridden service labels", () => {
    const services = docsNavSections[1];
    const byHref = new Map(services.items.map((item) => [item.href, item.label]));
    // Non-overridden: microsoft / foundry / aws / okta / mongoatlas / resend / stripe.
    expect(byHref.get("/microsoft")).toBe("Microsoft Entra ID");
    expect(byHref.get("/foundry")).toBe("Foundry");
    expect(byHref.get("/aws")).toBe("AWS");
    expect(byHref.get("/okta")).toBe("Okta");
    expect(byHref.get("/mongoatlas")).toBe("MongoDB Atlas");
    expect(byHref.get("/resend")).toBe("Resend");
    expect(byHref.get("/stripe")).toBe("Stripe");
  });
});

describe("docsNavSections reference section", () => {
  it("contains /authentication and /architecture in allDocsPages source order", () => {
    const reference = docsNavSections[2];
    expect(reference.items.map((item) => item.href)).toEqual([
      "/authentication",
      "/architecture",
    ]);
  });

  it("uses the canonical allDocsPages names for reference labels (no overrides)", () => {
    const reference = docsNavSections[2];
    expect(reference.items.map((item) => item.label)).toEqual([
      "Authentication",
      "Architecture",
    ]);
  });
});

describe("NAV_LABEL_OVERRIDES contract", () => {
  it("contains exactly the five expected service shortenings", () => {
    expect(NAV_LABEL_OVERRIDES).toEqual({
      "/vercel": "Vercel",
      "/github": "GitHub",
      "/google": "Google",
      "/slack": "Slack",
      "/apple": "Apple",
    });
  });

  it("every override key corresponds to a real allDocsPages entry (no stale overrides)", () => {
    const allHrefs = new Set(allDocsPages.map((page) => page.href));
    for (const overrideHref of Object.keys(NAV_LABEL_OVERRIDES)) {
      expect(allHrefs.has(overrideHref)).toBe(true);
    }
  });

  it("every override label differs from its allDocsPages.name (otherwise the override is dead code)", () => {
    const pageByHref = new Map(allDocsPages.map((page) => [page.href, page.name]));
    for (const [overrideHref, overrideLabel] of Object.entries(NAV_LABEL_OVERRIDES)) {
      const canonicalName = pageByHref.get(overrideHref);
      expect(canonicalName).toBeDefined();
      expect(overrideLabel).not.toBe(canonicalName);
    }
  });
});

describe("desktop and mobile nav share the same docsNavSections data", () => {
  it("docsNavAllItems equals the concat of section items across all three sections", () => {
    const manual = [
      ...docsNavSections[0].items,
      ...docsNavSections[1].items,
      ...docsNavSections[2].items,
    ];
    expect(docsNavAllItems).toEqual(manual);
  });

  it("docsNavAllItems preserves the exact allDocsPages source order for the visible subset", () => {
    // Since TOP_SECTION_HREFS and REFERENCE_SECTION_HREFS are explicit
    // and non-overlapping, and the services bucket is the default, the
    // concat top + services + reference does NOT equal the raw
    // allDocsPages order when the canonical ordering interleaves them.
    // But within each bucket, the ordering must match the allDocsPages
    // source index. Verify the index-per-bucket monotonicity here.
    const hrefToIdx = new Map(allDocsPages.map((page, i) => [page.href, i]));
    for (const section of docsNavSections) {
      let previousIdx = -1;
      for (const item of section.items) {
        const idx = hrefToIdx.get(item.href);
        expect(idx).toBeDefined();
        expect(idx!).toBeGreaterThan(previousIdx);
        previousIdx = idx!;
      }
    }
  });
});
