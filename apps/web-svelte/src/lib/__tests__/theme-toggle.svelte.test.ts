import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import ThemeToggle from "../components/ThemeToggle.svelte";

describe("ThemeToggle.svelte SSR unmounted state", () => {
  it("renders only the placeholder shell used to avoid the theme-flash on hydration", () => {
    const { body } = render(ThemeToggle);
    expect(body).toContain('class="h-8 w-8"');
    expect(body).toContain('aria-hidden="true"');
  });

  it("does not render the interactive toggle button or its aria-label", () => {
    const { body } = render(ThemeToggle);
    expect(body).not.toContain("<button");
    expect(body).not.toContain('aria-label="Toggle theme"');
  });

  it("does not render the sun or moon SVG icon used in the mounted state", () => {
    const { body } = render(ThemeToggle);
    // The mounted state renders one of two SVGs (sun for dark theme, moon
    // for light theme). Neither path has a stable test marker, so the
    // load-bearing signal that we are in the unmounted branch is the
    // absence of any <svg> element at all.
    expect(body).not.toContain("<svg");
    expect(body).not.toContain("circle");
    expect(body).not.toContain("path");
  });

  it("renders no interactive event handlers in the unmounted-state output", () => {
    const { body } = render(ThemeToggle);
    expect(body).not.toContain("onclick");
    expect(body).not.toContain("themeState");
  });
});
