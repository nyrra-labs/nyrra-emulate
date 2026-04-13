import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import Page from "../../routes/+page.svelte";

// SvelteKit's auto-generated PageData for the root route does not
// declare `codeBlocks` or `defaultStartupServices`, so synthetic test
// data is cast at the test boundary to the concrete runtime shape
// the route component reads.
type SyntheticStartupService = { name: string; label: string; port: number };
type SyntheticPageData = {
  data: {
    codeBlocks: { quickStart: string; cli: string };
    defaultStartupServices: readonly SyntheticStartupService[];
  };
};

const QUICK_START_HTML =
  '<pre class="shiki shiki-themes vercel-light vercel-dark"><code>NPX_TEST_TOKEN</code></pre>';
const CLI_HTML =
  '<pre class="shiki shiki-themes vercel-light vercel-dark"><code>CLI_TEST_TOKEN</code></pre>';

// Synthetic startup list mirroring the real DEFAULT_SERVICE_NAMES order
// (vercel, github, google, slack, apple, microsoft, okta, aws, resend,
// stripe, mongoatlas, clerk) with the same label-override convention.
// Ports start at 4000 and increment by one. The component should render
// each entry as `<strong>label</strong> on http://localhost:port`.
const SYNTHETIC_STARTUP: readonly SyntheticStartupService[] = [
  { name: "vercel", label: "Vercel", port: 4000 },
  { name: "github", label: "GitHub", port: 4001 },
  { name: "google", label: "Google", port: 4002 },
  { name: "slack", label: "Slack", port: 4003 },
  { name: "apple", label: "Apple", port: 4004 },
  { name: "microsoft", label: "Microsoft", port: 4005 },
  { name: "okta", label: "Okta", port: 4006 },
  { name: "aws", label: "AWS", port: 4007 },
  { name: "resend", label: "Resend", port: 4008 },
  { name: "stripe", label: "Stripe", port: 4009 },
  { name: "mongoatlas", label: "MongoDB Atlas", port: 4010 },
  { name: "clerk", label: "Clerk", port: 4011 },
];

function renderRoot(): { body: string } {
  const props: SyntheticPageData = {
    data: {
      codeBlocks: { quickStart: QUICK_START_HTML, cli: CLI_HTML },
      defaultStartupServices: SYNTHETIC_STARTUP,
    },
  };
  return render(Page, { props: props as Parameters<typeof render>[1] });
}

describe("root +page.svelte SSR landing copy", () => {
  it("renders the FoundryCI-first H1 hero", () => {
    const { body } = renderRoot();
    expect(body).toMatch(/<h1[^>]*>[\s\S]*Local Foundry Emulation[\s\S]*<\/h1>/);
  });

  it("describes FoundryCI as a Nyrra project built on emulate by Vercel Labs", () => {
    const { body } = renderRoot();
    expect(body).toContain("FoundryCI is a Nyrra project");
    expect(body).toContain("Palantir Foundry");
    expect(body).toContain("emulate by Vercel Labs");
    expect(body).toContain('href="https://github.com/vercel-labs/emulate"');
  });

  it("renders the Start with Foundry section heading", () => {
    const { body } = renderRoot();
    expect(body).toMatch(/<h2[^>]*>[\s\S]*Start with Foundry[\s\S]*<\/h2>/);
  });

  it("links to /foundry and /configuration from the Foundry-first section", () => {
    const { body } = renderRoot();
    expect(body).toMatch(/href="\/foundry"/);
    expect(body).toMatch(/href="\/configuration"/);
    expect(body).toContain(">Foundry</a");
    expect(body).toContain(">Configuration</a");
  });

  it("links to /programmatic-api and /nextjs from the lower sections", () => {
    const { body } = renderRoot();
    expect(body).toContain('href="/programmatic-api"');
    expect(body).toContain('href="/nextjs"');
    expect(body).toContain(">Programmatic API</a");
    expect(body).toContain(">Next.js Integration</a");
  });

  it("renders the Quick Start, CLI, Options, Programmatic API, and Next.js Integration H2 headings", () => {
    const { body } = renderRoot();
    expect(body).toContain("Quick Start");
    expect(body).toContain("CLI");
    expect(body).toContain("Options");
    expect(body).toContain("Programmatic API");
    expect(body).toContain("Next.js Integration");
  });
});

describe("root +page.svelte SSR code blocks", () => {
  it("renders both code blocks through the CodeBlock wrapper", () => {
    const { body } = renderRoot();
    expect(body).toContain(QUICK_START_HTML);
    expect(body).toContain(CLI_HTML);
    expect(body).toContain("NPX_TEST_TOKEN");
    expect(body).toContain("CLI_TEST_TOKEN");
  });

  it("wraps each code block in the CodeBlock outer wrapper class set", () => {
    const { body } = renderRoot();
    // Each rendered CodeBlock instance should carry the outer wrapper
    // tokens (rounded-lg + border + font-mono) and the inner shell
    // (code-block-shiki). Two CodeBlock instances → at least two
    // matches for each marker.
    const outerMatches = body.match(/rounded-lg/g) ?? [];
    const innerMatches = body.match(/code-block-shiki/g) ?? [];
    expect(outerMatches.length).toBeGreaterThanOrEqual(2);
    expect(innerMatches.length).toBeGreaterThanOrEqual(2);
  });

  it("does not escape or drop the code block html when rendering through CodeBlock", () => {
    const { body } = renderRoot();
    expect(body).not.toContain("&lt;pre");
    expect(body).not.toContain("&lt;code");
  });
});

describe("root +page.svelte SSR default startup service list", () => {
  it("renders one <li> per defaultStartupServices entry with label + port", () => {
    const { body } = renderRoot();
    for (const service of SYNTHETIC_STARTUP) {
      // Each entry should appear as `<strong>{label}</strong> on http://localhost:{port}`.
      // Match the strong tag + label and the http localhost port via two separate
      // substring checks (the rendered Svelte output may interleave whitespace).
      const labelPattern = new RegExp(
        `<strong[^>]*>${service.label.replace(/\./g, "\\.")}</strong>`,
      );
      expect(body).toMatch(labelPattern);
      expect(body).toContain(`http://localhost:${service.port}`);
    }
  });

  it("renders Clerk in the startup list (the regression guard against the pre-derived hardcoded 11-service list)", () => {
    const { body } = renderRoot();
    expect(body).toMatch(/<strong[^>]*>Clerk<\/strong>/);
    expect(body).toContain("http://localhost:4011");
  });

  it("does NOT include Foundry in the startup service list", () => {
    const { body } = renderRoot();
    // Foundry is in EXTRA_SERVICE_NAME_LIST, not the default startup
    // set, so the bullet list should not contain a Foundry entry. The
    // page does still mention Foundry elsewhere (the Start with Foundry
    // section heading and the /foundry link), so we cannot just grep
    // for the bare "Foundry" substring; instead we assert the specific
    // pattern of a startup-list <li> containing Foundry is absent.
    expect(body).not.toMatch(/<strong[^>]*>Foundry<\/strong>\s*on\s*<code/);
  });

  it("renders the startup list in the same order as the synthetic DEFAULT_SERVICE_NAMES projection", () => {
    const { body } = renderRoot();
    // Each label appears in the rendered body at the index that matches
    // its position in SYNTHETIC_STARTUP. Walk the body and check that
    // body.indexOf(labelN) > body.indexOf(labelN-1) for every adjacent
    // pair, proving the rendered order matches the data order.
    let previousIdx = -1;
    for (const service of SYNTHETIC_STARTUP) {
      const idx = body.indexOf(`<strong class="font-medium text-neutral-900 dark:text-neutral-100">${service.label}</strong>`);
      expect(idx).toBeGreaterThan(previousIdx);
      previousIdx = idx;
    }
  });

  it("uses port 4000 as the base and increments by one per entry in the rendered output", () => {
    const { body } = renderRoot();
    // First and last expected ports in the synthetic startup list.
    expect(body).toContain("http://localhost:4000");
    expect(body).toContain(`http://localhost:${4000 + SYNTHETIC_STARTUP.length - 1}`);
    // No port outside the [4000, 4011] window should appear in the
    // synthetic-data render.
    expect(body).not.toContain("http://localhost:3999");
    expect(body).not.toContain(`http://localhost:${4000 + SYNTHETIC_STARTUP.length}`);
  });
});
