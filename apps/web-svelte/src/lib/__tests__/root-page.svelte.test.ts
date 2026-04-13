import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import Page from "../../routes/+page.svelte";

// SvelteKit's auto-generated PageData for the root route does not
// declare `codeBlocks`, so synthetic test data is cast at the test
// boundary to the concrete runtime shape the route component reads.
type SyntheticPageData = {
  data: { codeBlocks: { quickStart: string; cli: string } };
};

const QUICK_START_HTML =
  '<pre class="shiki shiki-themes vercel-light vercel-dark"><code>NPX_TEST_TOKEN</code></pre>';
const CLI_HTML =
  '<pre class="shiki shiki-themes vercel-light vercel-dark"><code>CLI_TEST_TOKEN</code></pre>';

function renderRoot(): { body: string } {
  const props: SyntheticPageData = {
    data: { codeBlocks: { quickStart: QUICK_START_HTML, cli: CLI_HTML } },
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
