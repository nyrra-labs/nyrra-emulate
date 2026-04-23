import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import Page from "../../routes/+page.svelte";

type SyntheticStartupService = { name: string; label: string; port: number };
type SyntheticSupportedService = { name: string; label: string };
type SyntheticPageData = {
  data: {
    codeBlocks: { quickStart: string; cli: string };
    defaultStartupServices: readonly SyntheticStartupService[];
    supportedServices: readonly SyntheticSupportedService[];
    supportedServicesProse: string;
  };
};

const QUICK_START_HTML = '<pre class="shiki shiki-themes vercel-light vercel-dark"><code>NPX_TEST_TOKEN</code></pre>';
const CLI_HTML = '<pre class="shiki shiki-themes vercel-light vercel-dark"><code>CLI_TEST_TOKEN</code></pre>';

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

const SYNTHETIC_SUPPORTED: readonly SyntheticSupportedService[] = SYNTHETIC_STARTUP.map(({ name, label }) => ({
  name,
  label,
}));

const SYNTHETIC_SUPPORTED_PROSE = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
}).format(SYNTHETIC_SUPPORTED.map((s) => s.label));

function renderRoot(): { body: string } {
  const props: SyntheticPageData = {
    data: {
      codeBlocks: { quickStart: QUICK_START_HTML, cli: CLI_HTML },
      defaultStartupServices: SYNTHETIC_STARTUP,
      supportedServices: SYNTHETIC_SUPPORTED,
      supportedServicesProse: SYNTHETIC_SUPPORTED_PROSE,
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
    expect(body).toContain('href="https://github.com/nyrra-labs/nyrra-emulate"');
  });

  it("renders the Start with Foundry section heading", () => {
    const { body } = renderRoot();
    expect(body).toMatch(/<h2[^>]*>[\s\S]*Start with Foundry[\s\S]*<\/h2>/);
  });

  it("renders the Foundry quick start and explicit localhost:4000 guidance", () => {
    const { body } = renderRoot();
    expect(body).toContain("Foundry Quick Start");
    expect(body).toContain("FOUNDRY_EMULATOR_URL=http://localhost:4000");
    expect(body).toContain("only service");
    expect(body).toContain("first service in the list");
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

  it("renders all major H2 headings", () => {
    const { body } = renderRoot();
    expect(body).toContain("Foundry Quick Start");
    expect(body).toContain("Default Startup Set");
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
    const outerMatches = body.match(/rounded-lg/g) ?? [];
    const innerMatches = body.match(/code-block-shiki/g) ?? [];
    expect(outerMatches.length).toBeGreaterThanOrEqual(2);
    expect(innerMatches.length).toBeGreaterThanOrEqual(2);
  });
});

describe("root +page.svelte SSR default startup service list", () => {
  it("renders one li per defaultStartupServices entry with label + port", () => {
    const { body } = renderRoot();
    for (const service of SYNTHETIC_STARTUP) {
      const labelPattern = new RegExp(`<strong[^>]*>${service.label.replace(/\./g, "\\.")}</strong>`);
      expect(body).toMatch(labelPattern);
      expect(body).toContain(`http://localhost:${service.port}`);
    }
  });

  it("renders Clerk in the startup list", () => {
    const { body } = renderRoot();
    expect(body).toMatch(/<strong[^>]*>Clerk<\/strong>/);
    expect(body).toContain("http://localhost:4011");
  });

  it("does NOT include Foundry in the startup service list", () => {
    const { body } = renderRoot();
    expect(body).not.toMatch(/<strong[^>]*>Foundry<\/strong>\s*on\s*<code/);
  });

  it("renders the startup list in the same order as the data", () => {
    const { body } = renderRoot();
    let previousIdx = -1;
    for (const service of SYNTHETIC_STARTUP) {
      const idx = body.indexOf(
        `<strong class="font-medium text-neutral-900 dark:text-neutral-100">${service.label}</strong>`,
      );
      expect(idx).toBeGreaterThan(previousIdx);
      previousIdx = idx;
    }
  });

  it("uses port 4000 as the base and increments by one per entry", () => {
    const { body } = renderRoot();
    expect(body).toContain("http://localhost:4000");
    expect(body).toContain(`http://localhost:${4000 + SYNTHETIC_STARTUP.length - 1}`);
    expect(body).not.toContain("http://localhost:3999");
    expect(body).not.toContain(`http://localhost:${4000 + SYNTHETIC_STARTUP.length}`);
  });
});

describe("root +page.svelte SSR hero supported services prose", () => {
  it("renders the supportedServicesProse string inside the intro paragraph", () => {
    const { body } = renderRoot();
    expect(body).toContain(SYNTHETIC_SUPPORTED_PROSE);
    expect(body).toContain(`stand in for ${SYNTHETIC_SUPPORTED_PROSE} inside your test runs`);
  });

  it("includes Clerk in the rendered intro", () => {
    const { body } = renderRoot();
    expect(body).toContain("Clerk");
    const introIdx = body.indexOf("stand in for");
    const insideRunsIdx = body.indexOf("inside your test runs");
    expect(introIdx).toBeGreaterThan(-1);
    expect(insideRunsIdx).toBeGreaterThan(introIdx);
    const introSlice = body.slice(introIdx, insideRunsIdx);
    expect(introSlice).toContain("Clerk");
  });

  it("mentions Foundry in the hero but not in the supporting services list", () => {
    const { body } = renderRoot();
    expect(body).toContain("Palantir Foundry");
    expect(body).toContain("FoundryCI is a Nyrra project");
    const standInIdx = body.indexOf("stand in for");
    const insideRunsIdx = body.indexOf("inside your test runs");
    const standInSlice = body.slice(standInIdx, insideRunsIdx);
    expect(standInSlice).not.toContain("Foundry");
  });
});

describe("root +page.svelte SSR Options section", () => {
  it("renders the Options table with CLI flags", () => {
    const { body } = renderRoot();
    expect(body).toContain("-p, --port");
    expect(body).toContain("-s, --service");
    expect(body).toContain("--seed");
  });

  it("mentions EMULATE_PORT and PORT environment variables", () => {
    const { body } = renderRoot();
    expect(body).toContain("EMULATE_PORT");
    expect(body).toContain("PORT");
  });
});
