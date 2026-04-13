import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("$app/state", () => ({
  page: {
    get url() {
      return { pathname: mocks.pathname };
    },
  },
}));

import { render } from "svelte/server";
import MobileNav from "../components/MobileNav.svelte";

function renderMobileNav(pathname: string): string {
  mocks.pathname = pathname;
  const { body } = render(MobileNav);
  return body;
}

describe("MobileNav.svelte SSR closed trigger", () => {
  it("renders the closed-state trigger button with the open-toc aria-label and aria-expanded=false", () => {
    const body = renderMobileNav("/foundry");
    expect(body).toContain('aria-label="Open table of contents"');
    expect(body).toContain('aria-expanded="false"');
    expect(body).toContain('aria-controls="mobile-nav-drawer"');
    expect(body).toContain('type="button"');
  });

  it("wraps the trigger in the lg:hidden sticky shell", () => {
    const body = renderMobileNav("/foundry");
    expect(body).toContain("sticky");
    expect(body).toContain("lg:hidden");
    expect(body).toContain("border-b");
  });

  it("shows the current page label inside the trigger for a known pathname", () => {
    const body = renderMobileNav("/foundry");
    expect(body).toMatch(/<span[^>]*>\s*Foundry\s*<\/span>/);
  });

  it("shows a different current page label after the pathname changes between renders", () => {
    renderMobileNav("/foundry");
    const body = renderMobileNav("/vercel");
    expect(body).toMatch(/<span[^>]*>\s*Vercel\s*<\/span>/);
    expect(body).not.toMatch(/<span[^>]*>\s*Foundry\s*<\/span>/);
  });

  it("falls back to the first allItems entry (Overview) when the pathname matches no nav item", () => {
    const body = renderMobileNav("/this-route-does-not-exist");
    expect(body).toMatch(/<span[^>]*>\s*Overview\s*<\/span>/);
  });
});

describe("MobileNav.svelte SSR closed-state drawer absence", () => {
  it("does not render the drawer dialog subtree in the closed default state", () => {
    const body = renderMobileNav("/foundry");
    expect(body).not.toContain('role="dialog"');
    expect(body).not.toContain('aria-modal="true"');
    expect(body).not.toContain('aria-label="Table of contents"');
    expect(body).not.toContain('id="mobile-nav-drawer"');
  });

  it("does not render the Table of Contents drawer header text or the close button", () => {
    const body = renderMobileNav("/foundry");
    expect(body).not.toContain(">Table of Contents<");
    expect(body).not.toContain('aria-label="Close table of contents"');
  });

  it("does not render the drawer overlay backdrop", () => {
    const body = renderMobileNav("/foundry");
    expect(body).not.toContain("bg-black/50");
    expect(body).not.toContain("absolute inset-0");
  });
});
