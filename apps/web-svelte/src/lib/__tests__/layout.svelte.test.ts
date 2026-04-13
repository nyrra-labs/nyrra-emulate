import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("$app/state", () => ({
  page: {
    get url() {
      return { pathname: mocks.pathname };
    },
  },
}));

import { createRawSnippet } from "svelte";
import { render } from "svelte/server";
import Layout from "../../routes/+layout.svelte";

const SYNTHETIC_CHILD_TOKEN = "SYNTHETIC_LAYOUT_CHILD_MARKER";

const childSnippet = createRawSnippet(() => ({
  render: () => `<span data-testid="layout-child">${SYNTHETIC_CHILD_TOKEN}</span>`,
}));

function renderLayout(pathname: string): { body: string; head: string } {
  mocks.pathname = pathname;
  const props = { children: childSnippet };
  return render(Layout, { props: props as Parameters<typeof render>[1] });
}

describe("+layout.svelte SSR shared shell composition for /foundry", () => {
  it("renders the Header brand markers", () => {
    const { body } = renderLayout("/foundry");
    expect(body).toContain("<header");
    expect(body).toContain('aria-label="FoundryCI home"');
    expect(body).toContain("FoundryCI");
    expect(body).toContain('href="https://github.com/vercel-labs/emulate"');
  });

  it("renders the MobileNav closed-state trigger inside the layout", () => {
    const { body } = renderLayout("/foundry");
    expect(body).toContain('aria-label="Open table of contents"');
    expect(body).toContain('aria-expanded="false"');
    expect(body).toContain('aria-controls="mobile-nav-drawer"');
  });

  it("renders the Sidebar shell with the Services and Reference section titles", () => {
    const { body } = renderLayout("/foundry");
    expect(body).toContain("<aside");
    expect(body).toContain("hidden w-56 shrink-0 lg:block");
    expect(body).toContain(">Services<");
    expect(body).toContain(">Reference<");
  });

  it("renders the footer with both attribution links", () => {
    const { body } = renderLayout("/foundry");
    expect(body).toContain("<footer");
    expect(body).toContain('href="https://github.com/vercel-labs/emulate"');
    expect(body).toContain(">emulate by Vercel Labs</a>");
    expect(body).toContain('href="https://nyrra.ai"');
    expect(body).toContain(">Nyrra</a>");
  });

  it("renders the synthetic child snippet inside the article main content area", () => {
    const { body } = renderLayout("/foundry");
    expect(body).toContain("<main");
    expect(body).toContain("<article");
    expect(body).toContain(SYNTHETIC_CHILD_TOKEN);
    expect(body).toContain('data-testid="layout-child"');
    // The child snippet appears between the <article> opening tag and
    // the closing </article> tag (i.e. inside the article element).
    const articleStart = body.indexOf("<article");
    const articleEnd = body.indexOf("</article>");
    const childIdx = body.indexOf(SYNTHETIC_CHILD_TOKEN);
    expect(articleStart).toBeGreaterThan(-1);
    expect(articleEnd).toBeGreaterThan(articleStart);
    expect(childIdx).toBeGreaterThan(articleStart);
    expect(childIdx).toBeLessThan(articleEnd);
  });
});

describe("+layout.svelte SSR PageMeta head integration for /foundry", () => {
  it("emits the FoundryCI by Nyrra branded title for /foundry into the head output", () => {
    const { head } = renderLayout("/foundry");
    expect(head).toContain("<title>Foundry | FoundryCI by Nyrra</title>");
  });

  it("emits the FoundryCI by Nyrra Open Graph title and the absolute /foundry URL", () => {
    const { head } = renderLayout("/foundry");
    expect(head).toContain('<meta property="og:title" content="Foundry | FoundryCI by Nyrra"');
    expect(head).toContain('<meta property="og:url" content="https://foundryci.com/foundry"');
    expect(head).toContain('<meta property="og:site_name" content="FoundryCI by Nyrra"');
  });

  it("emits the FoundryCI by Nyrra Twitter card title", () => {
    const { head } = renderLayout("/foundry");
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image"');
    expect(head).toContain('<meta name="twitter:title" content="Foundry | FoundryCI by Nyrra"');
  });
});

describe("+layout.svelte SSR shared shell composition for root /", () => {
  it("renders the same shared shell pieces (Header, MobileNav, Sidebar, footer, child)", () => {
    const { body } = renderLayout("/");
    expect(body).toContain("<header");
    expect(body).toContain('aria-label="FoundryCI home"');
    expect(body).toContain('aria-label="Open table of contents"');
    expect(body).toContain("<aside");
    expect(body).toContain("<footer");
    expect(body).toContain(">emulate by Vercel Labs</a>");
    expect(body).toContain(">Nyrra</a>");
    expect(body).toContain(SYNTHETIC_CHILD_TOKEN);
  });
});

describe("+layout.svelte SSR PageMeta head integration for root /", () => {
  it("emits the FoundryCI root title and absolute root URL into the head output", () => {
    const { head } = renderLayout("/");
    expect(head).toContain("<title>FoundryCI by Nyrra | Local Foundry Emulation</title>");
    expect(head).toContain('<meta property="og:title" content="FoundryCI by Nyrra | Local Foundry Emulation"');
    expect(head).toContain('<meta property="og:url" content="https://foundryci.com"');
    expect(head).toContain('<meta property="og:site_name" content="FoundryCI by Nyrra"');
  });

  it("emits the root description containing Not mocks. and Nyrra", () => {
    const { head } = renderLayout("/");
    expect(head).toMatch(/<meta name="description" content="[^"]*Not mocks\.[^"]*"/);
    expect(head).toContain("Nyrra");
  });
});
