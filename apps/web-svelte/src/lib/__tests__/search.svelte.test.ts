import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import Search from "../components/Search.svelte";

describe("Search.svelte SSR default state", () => {
  it("renders the desktop Search docs button shell", () => {
    const { body } = render(Search);
    expect(body).toContain("Search docs");
    expect(body).toContain("sm:flex");
    expect(body).toContain("rounded-md");
    expect(body).toContain('type="button"');
  });

  it("includes the cmd+K kbd hint inside the desktop button", () => {
    const { body } = render(Search);
    expect(body).toContain("<kbd");
    expect(body).toMatch(/<kbd[^>]*>[\s\S]*K[\s\S]*<\/kbd>/);
    // The Svelte template uses the &#8984; HTML entity; the compiler
    // resolves it to the literal U+2318 PLACE OF INTEREST SIGN (⌘) in
    // the rendered output, so the test asserts on the literal char.
    expect(body).toContain("\u2318");
  });

  it("renders the mobile search button shell with the aria-label", () => {
    const { body } = render(Search);
    expect(body).toContain('aria-label="Search docs"');
    expect(body).toContain("sm:hidden");
  });

  it("does not render the modal/dialog subtree in the closed default state", () => {
    const { body } = render(Search);
    expect(body).not.toContain('role="dialog"');
    expect(body).not.toContain('aria-modal="true"');
    expect(body).not.toContain("Type to search documentation");
    expect(body).not.toContain('aria-label="Search documentation"');
  });

  it("does not render the result list scroll container or the results list items", () => {
    const { body } = render(Search);
    expect(body).not.toContain('placeholder="Search docs..."');
    expect(body).not.toContain("No results found");
    expect(body).not.toContain("animate-spin");
  });
});
