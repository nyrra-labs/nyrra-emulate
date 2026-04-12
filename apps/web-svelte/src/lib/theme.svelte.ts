import { browser } from "$app/environment";

/**
 * Lightweight theme store mirroring apps/web's `next-themes` setup
 * (`attribute="class"`, `defaultTheme="dark"`, `enableSystem`,
 * `disableTransitionOnChange`).
 *
 * The actual `dark` class on `<html>` is set by the inline script in
 * `app.html` before the body renders, so by the time this constructor runs
 * on the client, `document.documentElement.classList` already reflects the
 * resolved theme (stored value > system preference > default dark).
 *
 * `toggle()` mirrors next-themes' `disableTransitionOnChange` behavior by
 * temporarily injecting a `<style>` element that suppresses CSS transitions
 * and animations during the swap, then removing it on the next animation
 * frame so the swap is visually instant.
 *
 * The constructor also subscribes to `(prefers-color-scheme: dark)` and
 * live-updates the active theme when the user's OS theme changes WHILE the
 * docs are already open. The listener no-ops when an explicit
 * `localStorage.theme` value is present, so the precedence is:
 *
 *     stored theme  >  live system preference  >  default dark
 *
 * matching what apps/web gets from next-themes' `enableSystem` option.
 */
class ThemeState {
  current = $state<"light" | "dark">("dark");

  constructor() {
    if (!browser) return;

    this.current = document.documentElement.classList.contains("dark") ? "dark" : "light";

    // Live-track system preference changes. The listener only acts when
    // there is no explicit stored theme; otherwise the user's choice wins.
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", (event) => {
      if (localStorage.getItem("theme")) return;
      this.applyTheme(event.matches ? "dark" : "light", false);
    });
  }

  /**
   * Apply a theme to the DOM with transitions disabled, optionally
   * persisting the choice to localStorage. `persist=true` is for explicit
   * user toggles; `persist=false` is for automatic system-preference syncs.
   */
  private applyTheme(next: "light" | "dark", persist: boolean) {
    if (browser) {
      // Suppress transitions for the swap so colors do not animate from
      // the old theme to the new theme. Mirrors next-themes'
      // disableTransitionOnChange.
      const style = document.createElement("style");
      style.appendChild(
        document.createTextNode("*,*::before,*::after{transition:none!important;animation:none!important}"),
      );
      document.head.appendChild(style);

      document.documentElement.classList.toggle("dark", next === "dark");
      if (persist) localStorage.setItem("theme", next);

      // Force a reflow so the new colors paint with transitions disabled,
      // then remove the override on the next frame.
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      window.getComputedStyle(document.body).backgroundColor;
      requestAnimationFrame(() => {
        style.remove();
      });
    }

    this.current = next;
  }

  toggle() {
    this.applyTheme(this.current === "dark" ? "light" : "dark", true);
  }
}

export const themeState = new ThemeState();
