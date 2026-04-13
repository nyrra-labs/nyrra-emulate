import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import Header from "../components/Header.svelte";

describe("Header.svelte SSR", () => {
  it("renders the FoundryCI home brand link with the home href and aria-label", () => {
    const { body } = render(Header);
    expect(body).toContain('href="/"');
    expect(body).toContain('aria-label="FoundryCI home"');
    expect(body).toContain("FoundryCI");
  });

  it("renders the by-Nyrra external link with the nyrra.ai href and rel attributes", () => {
    const { body } = render(Header);
    expect(body).toContain('href="https://nyrra.ai"');
    expect(body).toContain("by Nyrra");
    expect(body).toMatch(/href="https:\/\/nyrra\.ai"[^>]*target="_blank"/);
    expect(body).toMatch(/href="https:\/\/nyrra\.ai"[^>]*rel="noopener noreferrer"/);
  });

  it("renders the GitHub repo link to vercel-labs/emulate with the GitHub repository aria-label", () => {
    const { body } = render(Header);
    expect(body).toContain('href="https://github.com/vercel-labs/emulate"');
    expect(body).toContain('aria-label="GitHub repository"');
    expect(body).toMatch(
      /href="https:\/\/github\.com\/vercel-labs\/emulate"[^>]*target="_blank"/,
    );
  });

  it("renders the npm link to the emulate package", () => {
    const { body } = render(Header);
    expect(body).toContain('href="https://www.npmjs.com/package/emulate"');
    expect(body).toMatch(
      /href="https:\/\/www\.npmjs\.com\/package\/emulate"[^>]*target="_blank"/,
    );
    expect(body).toContain(">npm</a>");
  });

  it("uses the sticky header layout shell with the FoundryCI brand wordmark", () => {
    const { body } = render(Header);
    expect(body).toContain("<header");
    expect(body).toContain("sticky");
    expect(body).toContain("font-pixel");
  });
});
