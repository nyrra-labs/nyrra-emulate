import { describe, expect, it, vi } from "vitest";

// Mutable holder for the mocked pathname. `vi.hoisted` lifts the
// declaration above the import statements so it is in scope for the
// `vi.mock` factory below, but stays mutable from the test bodies.
const mocks = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("$app/state", () => ({
  page: {
    get url() {
      return { pathname: mocks.pathname };
    },
  },
}));

// The component import must come AFTER `vi.mock`. Vitest hoists
// `vi.mock` calls automatically, but spelling the import here keeps the
// dependency order obvious to a future reader.
import { render } from "svelte/server";
import Sidebar from "../components/Sidebar.svelte";

const ACTIVE_CLASS_SUBSTRING = "bg-neutral-100";

function renderSidebar(pathname: string): string {
  mocks.pathname = pathname;
  const { body } = render(Sidebar);
  return body;
}

describe("Sidebar.svelte SSR section structure", () => {
  it("wraps the nav in an aside that is hidden below lg", () => {
    const body = renderSidebar("/foundry");
    expect(body).toContain("<aside");
    expect(body).toContain("hidden w-56 shrink-0 lg:block");
    expect(body).toContain("<nav");
  });

  it("renders the Services and Reference section titles from nav.ts", () => {
    const body = renderSidebar("/foundry");
    expect(body).toContain(">Services<");
    expect(body).toContain(">Reference<");
  });

  it("renders all migrated nav labels including the FoundryCI brand and reference pages", () => {
    const body = renderSidebar("/foundry");
    expect(body).toContain(">Overview<");
    expect(body).toContain(">Programmatic API<");
    expect(body).toContain(">Configuration<");
    expect(body).toContain(">Next.js Integration<");
    expect(body).toContain(">Foundry<");
    // Service shortenings via NAV_LABEL_OVERRIDES: the document
    // titles are "Vercel API" / "GitHub API" / "Google API" /
    // "Slack API" / "Apple Sign In", but the nav labels strip the
    // suffix. The override map in nav.ts is the only place this
    // shortening is encoded; this assertion locks it in at the
    // rendered surface.
    expect(body).toContain(">Vercel<");
    expect(body).toContain(">GitHub<");
    expect(body).toContain(">Google<");
    expect(body).toContain(">Slack<");
    expect(body).toContain(">Apple<");
    expect(body).toContain(">Microsoft Entra ID<");
    expect(body).toContain(">Authentication<");
    expect(body).toContain(">Architecture<");
  });

  it("does NOT render the unshortened document-title forms for the override services", () => {
    const body = renderSidebar("/foundry");
    // Negative assertions: the nav must NOT show the document-title
    // forms for any of the shortened services. A regression that
    // dropped the override map and started using PAGE_TITLES verbatim
    // for these slugs would surface here.
    expect(body).not.toContain(">Vercel API<");
    expect(body).not.toContain(">GitHub API<");
    expect(body).not.toContain(">Google API<");
    expect(body).not.toContain(">Slack API<");
    expect(body).not.toContain(">Apple Sign In<");
  });
});

describe("Sidebar.svelte SSR active route highlighting", () => {
  it("applies the active class bucket to the /foundry link when the current pathname is /foundry", () => {
    const body = renderSidebar("/foundry");
    expect(body).toMatch(
      new RegExp(`<a\\s[^>]*href="/foundry"[^>]*class="[^"]*${ACTIVE_CLASS_SUBSTRING}[^"]*"`),
    );
  });

  it("leaves a non-active sibling like /vercel in the inactive class bucket", () => {
    const body = renderSidebar("/foundry");
    expect(body).toMatch(
      /<a\s[^>]*href="\/vercel"[^>]*class="[^"]*hover:text-neutral-900[^"]*"/,
    );
    const vercelMatch = body.match(/<a\s[^>]*href="\/vercel"[^>]*class="([^"]*)"/);
    expect(vercelMatch).not.toBeNull();
    expect(vercelMatch![1]).not.toContain(ACTIVE_CLASS_SUBSTRING);
  });

  it("moves the active marker when the pathname changes between renders", () => {
    const foundryBody = renderSidebar("/foundry");
    const vercelBody = renderSidebar("/vercel");
    // After remocking to /vercel, the /vercel link should now carry the
    // active class and the /foundry link should not.
    const foundryLinkInVercelRender = vercelBody.match(
      /<a\s[^>]*href="\/foundry"[^>]*class="([^"]*)"/,
    );
    const vercelLinkInVercelRender = vercelBody.match(
      /<a\s[^>]*href="\/vercel"[^>]*class="([^"]*)"/,
    );
    expect(foundryLinkInVercelRender).not.toBeNull();
    expect(vercelLinkInVercelRender).not.toBeNull();
    expect(foundryLinkInVercelRender![1]).not.toContain(ACTIVE_CLASS_SUBSTRING);
    expect(vercelLinkInVercelRender![1]).toContain(ACTIVE_CLASS_SUBSTRING);
    // Sanity check: the foundry render had the inverse.
    expect(foundryBody).toMatch(
      new RegExp(`<a\\s[^>]*href="/foundry"[^>]*class="[^"]*${ACTIVE_CLASS_SUBSTRING}[^"]*"`),
    );
  });

  it("renders no active link when the current pathname matches no nav entry", () => {
    const body = renderSidebar("/this-route-does-not-exist");
    // Every nav link in the Services group should be in the inactive bucket.
    const allFoundryLinks = body.match(
      /<a\s[^>]*href="\/foundry"[^>]*class="([^"]*)"/g,
    );
    expect(allFoundryLinks).not.toBeNull();
    for (const link of allFoundryLinks!) {
      expect(link).not.toContain(ACTIVE_CLASS_SUBSTRING);
    }
  });
});
