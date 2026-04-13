import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import PageMeta from "../components/PageMeta.svelte";

function renderForPathname(pathname: string): { body: string; head: string } {
  const { body, head } = render(PageMeta, { props: { pathname } });
  return { body, head };
}

// Svelte's SSR renderer emits self-closing meta tags as `<meta ... />`
// (XHTML-style) rather than `<meta ... >`, and renders empty fragments as
// `<!--[--><!--]-->` comment markers. The substring assertions below
// intentionally omit the closing `>` / `/>` so they stay invariant to
// the trailing slash convention.

describe("PageMeta.svelte SSR root /", () => {
  it("emits the FoundryCI by Nyrra root title and description into <svelte:head>", () => {
    const { head } = renderForPathname("/");
    expect(head).toContain("<title>FoundryCI by Nyrra | Local Foundry Emulation</title>");
    expect(head).toMatch(
      /<meta name="description" content="[^"]*Not mocks\.[^"]*"/,
    );
    expect(head).toContain("Nyrra");
  });

  it("emits Open Graph tags with the foundryci.com root URL and FoundryCI by Nyrra siteName", () => {
    const { head } = renderForPathname("/");
    expect(head).toContain('<meta property="og:type" content="website"');
    expect(head).toContain('<meta property="og:locale" content="en_US"');
    expect(head).toContain('<meta property="og:site_name" content="FoundryCI by Nyrra"');
    expect(head).toContain(
      '<meta property="og:title" content="FoundryCI by Nyrra | Local Foundry Emulation"',
    );
    expect(head).toContain('<meta property="og:url" content="https://foundryci.com"');
    expect(head).toContain(
      '<meta property="og:image" content="https://foundryci.com/og-default.png"',
    );
    expect(head).toContain('<meta property="og:image:width" content="1200"');
    expect(head).toContain('<meta property="og:image:height" content="630"');
    expect(head).toContain('<meta property="og:image:alt" content="FoundryCI by Nyrra"');
  });

  it("emits Twitter card tags that mirror the OG values", () => {
    const { head } = renderForPathname("/");
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image"');
    expect(head).toContain(
      '<meta name="twitter:title" content="FoundryCI by Nyrra | Local Foundry Emulation"',
    );
    expect(head).toContain(
      '<meta name="twitter:image" content="https://foundryci.com/og-default.png"',
    );
  });
});

describe("PageMeta.svelte SSR /foundry FoundryCI brand override", () => {
  it("emits the FoundryCI by Nyrra branded title and absolute /foundry URL", () => {
    const { head } = renderForPathname("/foundry");
    expect(head).toContain("<title>Foundry | FoundryCI by Nyrra</title>");
    expect(head).toContain(
      '<meta property="og:title" content="Foundry | FoundryCI by Nyrra"',
    );
    expect(head).toContain('<meta property="og:url" content="https://foundryci.com/foundry"');
    expect(head).toContain('<meta property="og:site_name" content="FoundryCI by Nyrra"');
    expect(head).toContain(
      '<meta property="og:image:alt" content="Foundry - FoundryCI by Nyrra"',
    );
  });

  it("emits a Twitter card with the FoundryCI by Nyrra branded title", () => {
    const { head } = renderForPathname("/foundry");
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image"');
    expect(head).toContain(
      '<meta name="twitter:title" content="Foundry | FoundryCI by Nyrra"',
    );
  });
});

describe("PageMeta.svelte SSR /vercel generic suffix", () => {
  it("emits the upstream-mirrored title with the | emulate suffix", () => {
    const { head } = renderForPathname("/vercel");
    expect(head).toContain("<title>Vercel API | emulate</title>");
    expect(head).toContain('<meta property="og:title" content="Vercel API | emulate"');
    expect(head).toContain('<meta property="og:url" content="https://foundryci.com/vercel"');
    expect(head).toContain('<meta property="og:site_name" content="emulate"');
    expect(head).toContain('<meta property="og:image:alt" content="Vercel API - emulate"');
  });

  it("emits a Twitter card with the upstream-mirrored title", () => {
    const { head } = renderForPathname("/vercel");
    expect(head).toContain('<meta name="twitter:title" content="Vercel API | emulate"');
  });
});

describe("PageMeta.svelte SSR unknown pathname", () => {
  it("renders no metadata tags into <svelte:head> for an unknown pathname", () => {
    const { head } = renderForPathname("/this-route-does-not-exist");
    expect(head).not.toContain("<title>");
    expect(head).not.toContain('property="og:title"');
    expect(head).not.toContain('property="og:url"');
    expect(head).not.toContain('property="og:site_name"');
    expect(head).not.toContain('name="twitter:card"');
    expect(head).not.toContain('name="description"');
  });

  it("renders no body content for an unknown pathname (only Svelte fragment markers)", () => {
    const { body } = renderForPathname("/this-route-does-not-exist");
    // Svelte renders an empty {#if} branch as fragment-marker comments;
    // the contract is that no real content slips into the body.
    const stripped = body.replace(/<!--.*?-->/g, "").trim();
    expect(stripped).toBe("");
  });
});
