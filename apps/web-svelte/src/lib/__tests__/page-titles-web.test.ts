import { describe, expect, it } from "vitest";
import { allDocsPages } from "../../../../../apps/web/lib/docs-navigation";
import {
  getPageTitle,
  PAGE_TITLE_OVERRIDES,
  PAGE_TITLES,
} from "../../../../../apps/web/lib/page-titles";

/**
 * Apps/web `PAGE_TITLES` derivation parity test.
 *
 * Pins the `apps/web/lib/page-titles.ts` → `apps/web/lib/docs-navigation.ts`
 * derivation contract: every `allDocsPages` entry must produce exactly
 * one slug-keyed `PAGE_TITLES` entry, every slug in `PAGE_TITLES` must
 * come from the registry, and the single root override must preserve
 * the marketing hero string with its deliberate `\n` line break.
 */

function hrefToSlug(href: string): string {
  return href === "/" ? "" : href.replace(/^\/+/, "").replace(/\/+$/, "");
}

describe("apps/web PAGE_TITLES derivation from allDocsPages", () => {
  it("has exactly one PAGE_TITLES entry per allDocsPages entry (same cardinality)", () => {
    expect(Object.keys(PAGE_TITLES).length).toBe(allDocsPages.length);
  });

  it("every allDocsPages href maps to a slug that exists in PAGE_TITLES", () => {
    for (const page of allDocsPages) {
      const slug = hrefToSlug(page.href);
      expect(slug in PAGE_TITLES).toBe(true);
    }
  });

  it("every PAGE_TITLES slug corresponds to an allDocsPages entry (no orphan titles)", () => {
    const registrySlugs = new Set(allDocsPages.map((p) => hrefToSlug(p.href)));
    for (const slug of Object.keys(PAGE_TITLES)) {
      expect(registrySlugs.has(slug)).toBe(true);
    }
  });

  it("every non-override slug's title equals its allDocsPages.name verbatim", () => {
    for (const page of allDocsPages) {
      const slug = hrefToSlug(page.href);
      if (slug in PAGE_TITLE_OVERRIDES) continue;
      expect(PAGE_TITLES[slug]).toBe(page.name);
    }
  });

  it("PAGE_TITLES preserves allDocsPages source-order key insertion", () => {
    const expectedOrder = allDocsPages.map((p) => hrefToSlug(p.href));
    expect(Object.keys(PAGE_TITLES)).toEqual(expectedOrder);
  });
});

describe("apps/web PAGE_TITLE_OVERRIDES contract", () => {
  it("contains exactly one entry (the root marketing hero)", () => {
    expect(Object.keys(PAGE_TITLE_OVERRIDES)).toEqual([""]);
  });

  it("the root override preserves the exact 'Local API Emulation\\nfor CI and Sandboxes' marketing hero", () => {
    expect(PAGE_TITLE_OVERRIDES[""]).toBe("Local API Emulation\nfor CI and Sandboxes");
  });

  it("the root override contains the deliberate \\n line break the OG renderer splits into two stacked lines", () => {
    expect(PAGE_TITLE_OVERRIDES[""]).toContain("\n");
    const lines = PAGE_TITLE_OVERRIDES[""]!.split("\n");
    expect(lines).toEqual(["Local API Emulation", "for CI and Sandboxes"]);
  });

  it("PAGE_TITLES[''] surfaces the root override string, not the 'Getting Started' sidebar label", () => {
    expect(PAGE_TITLES[""]).toBe("Local API Emulation\nfor CI and Sandboxes");
    expect(PAGE_TITLES[""]).not.toBe("Getting Started");
  });

  it("every override key corresponds to a real allDocsPages slug (no stale overrides)", () => {
    const registrySlugs = new Set(allDocsPages.map((p) => hrefToSlug(p.href)));
    for (const overrideSlug of Object.keys(PAGE_TITLE_OVERRIDES)) {
      expect(registrySlugs.has(overrideSlug)).toBe(true);
    }
  });
});

describe("apps/web getPageTitle accessor", () => {
  it("returns the root marketing hero for the empty-string slug", () => {
    expect(getPageTitle("")).toBe("Local API Emulation\nfor CI and Sandboxes");
  });

  it("returns the canonical allDocsPages.name for every non-root slug", () => {
    for (const page of allDocsPages) {
      const slug = hrefToSlug(page.href);
      if (slug === "") continue;
      expect(getPageTitle(slug)).toBe(page.name);
    }
  });

  it("returns null for an unknown slug", () => {
    expect(getPageTitle("does-not-exist")).toBeNull();
  });

  it("returns null for a slug that looks like a real page but is not registered", () => {
    expect(getPageTitle("clerk")).toBeNull();
  });
});

describe("apps/web PAGE_TITLES visible-title snapshot", () => {
  it("surfaces the exact set of service/reference titles the metadata/OG pipeline produced before the derivation refactor", () => {
    // Pin the before/after behavior: these are the exact titles the
    // hand-maintained literal carried. If a future refactor changes
    // any of these, the test fails and surfaces the visible change.
    const expected: Readonly<Record<string, string>> = {
      "": "Local API Emulation\nfor CI and Sandboxes",
      "programmatic-api": "Programmatic API",
      configuration: "Configuration",
      nextjs: "Next.js Integration",
      vercel: "Vercel API",
      github: "GitHub API",
      google: "Google API",
      slack: "Slack API",
      apple: "Apple Sign In",
      microsoft: "Microsoft Entra ID",
      foundry: "Foundry",
      aws: "AWS",
      okta: "Okta",
      mongoatlas: "MongoDB Atlas",
      resend: "Resend",
      stripe: "Stripe",
      authentication: "Authentication",
      architecture: "Architecture",
    };
    expect(PAGE_TITLES).toEqual(expected);
  });
});
