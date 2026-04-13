import { describe, expect, it } from "vitest";
import { allItems, sections } from "../nav";
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
