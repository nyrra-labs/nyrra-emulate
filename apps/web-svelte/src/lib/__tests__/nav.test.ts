import { describe, expect, it } from "vitest";
import { NAV_LABEL_OVERRIDES, allItems, sections } from "../nav";
import { PAGE_TITLES, getPageTitle } from "../page-titles";

const slugForHref = (href: string) => (href === "/" ? "" : href.replace(/^\/+/, ""));

describe("nav sections", () => {
  it("renders the three expected groups in the documented order", () => {
    expect(sections).toHaveLength(3);
    expect(sections[0].title).toBeUndefined();
    expect(sections[1].title).toBe("Services");
    expect(sections[2].title).toBe("Reference");
  });

  it("places /foundry as the first entry of the Services group", () => {
    const services = sections[1];
    expect(services.items[0].href).toBe("/foundry");
    expect(services.items[0].label).toBe("Foundry");
  });

  it("every visible nav href resolves to a PAGE_TITLES slug", () => {
    for (const item of allItems) {
      const slug = slugForHref(item.href);
      expect(getPageTitle(slug)).not.toBeNull();
    }
  });

  it("every PAGE_TITLES slug is reachable from the visible nav", () => {
    const visibleSlugs = new Set(allItems.map((item) => slugForHref(item.href)));
    for (const slug of Object.keys(PAGE_TITLES)) {
      expect(visibleSlugs.has(slug)).toBe(true);
    }
  });
});

describe("nav label derivation contract", () => {
  it("NAV_LABEL_OVERRIDES contains exactly the expected service shortenings", () => {
    // Pinning the override map shape locks in the conscious shortenings
    // for OAuth/social/cloud provider pages where the nav label drops
    // the "API" or "Sign In" suffix that the document title carries
    // for SEO. A future change must update the test and the source
    // together, which is the desired forcing function.
    expect(NAV_LABEL_OVERRIDES).toEqual({
      "/vercel": "Vercel",
      "/github": "GitHub",
      "/google": "Google",
      "/slack": "Slack",
      "/apple": "Apple",
    });
  });

  it("every visible nav label equals NAV_LABEL_OVERRIDES[href] when set, otherwise PAGE_TITLES[slug]", () => {
    // The load-bearing assertion: there are no hand-duplicated labels
    // anywhere in the nav. Every label must come from one of two
    // sources, and the two sources are checked in priority order
    // (override wins over PAGE_TITLES). A regression that
    // hand-duplicates a label that drifts from PAGE_TITLES would fail
    // here with a precise mismatch on that single href.
    for (const item of allItems) {
      const slug = slugForHref(item.href);
      const expected = NAV_LABEL_OVERRIDES[item.href] ?? PAGE_TITLES[slug];
      expect(item.label, `expected nav label for ${item.href}`).toBe(expected);
    }
  });

  it("every NAV_LABEL_OVERRIDES key is currently visible in sections", () => {
    // Mirrors the runtime sanity check in nav.ts: an orphan override
    // (one whose href is not visible in any section) is dead code and
    // signals stale state.
    const visibleHrefs = new Set(allItems.map((item) => item.href));
    for (const overrideHref of Object.keys(NAV_LABEL_OVERRIDES)) {
      expect(visibleHrefs.has(overrideHref)).toBe(true);
    }
  });

  it("every NAV_LABEL_OVERRIDES key resolves to a real PAGE_TITLES slug", () => {
    // Mirrors the runtime sanity check in nav.ts: a stale override
    // (one whose slug is not in PAGE_TITLES) would silently shadow
    // nothing and confuse a future reader.
    for (const overrideHref of Object.keys(NAV_LABEL_OVERRIDES)) {
      const slug = slugForHref(overrideHref);
      expect(PAGE_TITLES[slug]).toBeDefined();
    }
  });

  it("each override entry is strictly shorter than the underlying PAGE_TITLES value", () => {
    // The override convention is documented as "intentionally SHORTER".
    // If a future override is the same length or longer than the page
    // title, it is no longer a "shortening" and the convention should
    // be revisited (or the override removed entirely if PAGE_TITLES is
    // updated to match).
    for (const [overrideHref, overrideLabel] of Object.entries(NAV_LABEL_OVERRIDES)) {
      const slug = slugForHref(overrideHref);
      const pageTitle = PAGE_TITLES[slug];
      expect(pageTitle).toBeDefined();
      expect(overrideLabel.length).toBeLessThan(pageTitle.length);
    }
  });
});
