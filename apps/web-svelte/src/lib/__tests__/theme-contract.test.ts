import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// =====================================================================
// Shared fake-DOM helpers (no jsdom)
// =====================================================================

type ThemeMqlListener = (event: { matches: boolean }) => void;

type FakeDom = {
  classList: Set<string>;
  headChildren: unknown[];
  localStorageData: Record<string, string>;
  rAFCallbacks: Array<() => void>;
  triggerMqlChange: (matches: boolean) => void;
  flushRAF: () => void;
};

function setupFakeBrowserGlobals(opts: {
  initialDarkClass: boolean;
  storedTheme: string | null;
  matchMediaDarkMatches: boolean;
}): FakeDom {
  const classList = new Set<string>();
  if (opts.initialDarkClass) classList.add("dark");

  const headChildren: unknown[] = [];
  const mqlListeners: ThemeMqlListener[] = [];
  let currentMqlMatches = opts.matchMediaDarkMatches;

  const localStorageData: Record<string, string> = {};
  if (opts.storedTheme !== null) localStorageData.theme = opts.storedTheme;

  const rAFCallbacks: Array<() => void> = [];

  const fakeClassList = {
    contains: (cls: string) => classList.has(cls),
    add: (cls: string) => {
      classList.add(cls);
    },
    remove: (cls: string) => {
      classList.delete(cls);
    },
    toggle: (cls: string, force?: boolean) => {
      if (force === undefined) {
        if (classList.has(cls)) classList.delete(cls);
        else classList.add(cls);
      } else if (force) {
        classList.add(cls);
      } else {
        classList.delete(cls);
      }
      return classList.has(cls);
    },
  };

  const fakeHead = {
    appendChild: (el: unknown) => {
      headChildren.push(el);
      return el;
    },
  };

  type FakeElement = {
    tag: string;
    children: unknown[];
    appendChild: (child: unknown) => unknown;
    remove: () => void;
  };

  const fakeDocument = {
    documentElement: { classList: fakeClassList },
    body: {},
    head: fakeHead,
    createElement: (tag: string): FakeElement => {
      const el: FakeElement = {
        tag,
        children: [],
        appendChild(child: unknown) {
          this.children.push(child);
          return child;
        },
        remove() {
          const idx = headChildren.indexOf(this);
          if (idx >= 0) headChildren.splice(idx, 1);
        },
      };
      return el;
    },
    createTextNode: (text: string) => ({ text }),
  };

  const fakeWindow = {
    matchMedia: (query: string) => ({
      matches: currentMqlMatches,
      media: query,
      addEventListener: (event: string, listener: ThemeMqlListener) => {
        if (event === "change") mqlListeners.push(listener);
      },
      removeEventListener: () => {},
    }),
    getComputedStyle: () => ({ backgroundColor: "rgb(0, 0, 0)" }),
  };

  const fakeLocalStorage = {
    getItem: (key: string) => (key in localStorageData ? localStorageData[key] : null),
    setItem: (key: string, value: string) => {
      localStorageData[key] = value;
    },
    removeItem: (key: string) => {
      delete localStorageData[key];
    },
    clear: () => {
      for (const k of Object.keys(localStorageData)) delete localStorageData[k];
    },
  };

  const fakeRAF = (cb: () => void) => {
    rAFCallbacks.push(cb);
    return rAFCallbacks.length;
  };

  vi.stubGlobal("document", fakeDocument);
  vi.stubGlobal("window", fakeWindow);
  vi.stubGlobal("localStorage", fakeLocalStorage);
  vi.stubGlobal("requestAnimationFrame", fakeRAF);

  return {
    classList,
    headChildren,
    localStorageData,
    rAFCallbacks,
    triggerMqlChange: (matches: boolean) => {
      currentMqlMatches = matches;
      for (const listener of mqlListeners) listener({ matches });
    },
    flushRAF: () => {
      while (rAFCallbacks.length > 0) {
        const cb = rAFCallbacks.shift()!;
        cb();
      }
    },
  };
}

async function importThemeWithBrowser(value: boolean) {
  vi.doMock("$app/environment", () => ({ browser: value }));
  vi.resetModules();
  return await import("../theme.svelte");
}

// =====================================================================
// theme.svelte.ts runtime tests
// =====================================================================

describe("theme.svelte.ts browser=false (SSR / node)", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.doUnmock("$app/environment");
  });

  it("imports without touching document/window/localStorage and defaults current to dark", async () => {
    // Intentionally do NOT call setupFakeBrowserGlobals; the import must
    // be a safe no-op when browser is false.
    const { themeState } = await importThemeWithBrowser(false);
    expect(themeState.current).toBe("dark");
  });
});

describe("theme.svelte.ts browser=true initialization", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.doUnmock("$app/environment");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock("$app/environment");
  });

  it('reads current=dark from an existing <html class="dark"> on the document', async () => {
    setupFakeBrowserGlobals({
      initialDarkClass: true,
      storedTheme: null,
      matchMediaDarkMatches: true,
    });
    const { themeState } = await importThemeWithBrowser(true);
    expect(themeState.current).toBe("dark");
  });

  it("reads current=light when <html> has no dark class on init", async () => {
    setupFakeBrowserGlobals({
      initialDarkClass: false,
      storedTheme: null,
      matchMediaDarkMatches: false,
    });
    const { themeState } = await importThemeWithBrowser(true);
    expect(themeState.current).toBe("light");
  });
});

describe("theme.svelte.ts toggle() behavior", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.doUnmock("$app/environment");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock("$app/environment");
  });

  it("flips dark→light: updates classList, persists localStorage, installs+removes the transition style", async () => {
    const dom = setupFakeBrowserGlobals({
      initialDarkClass: true,
      storedTheme: null,
      matchMediaDarkMatches: true,
    });
    const { themeState } = await importThemeWithBrowser(true);
    expect(themeState.current).toBe("dark");
    expect(dom.classList.has("dark")).toBe(true);
    expect(dom.localStorageData.theme).toBeUndefined();

    themeState.toggle();

    expect(themeState.current).toBe("light");
    expect(dom.classList.has("dark")).toBe(false);
    expect(dom.localStorageData.theme).toBe("light");
    // The temporary transition-suppression <style> was added to head.
    expect(dom.headChildren).toHaveLength(1);
    // requestAnimationFrame queued a callback that removes it.
    expect(dom.rAFCallbacks).toHaveLength(1);
    dom.flushRAF();
    expect(dom.headChildren).toHaveLength(0);
  });

  it("flips light→dark and persists the new value to localStorage", async () => {
    const dom = setupFakeBrowserGlobals({
      initialDarkClass: false,
      storedTheme: null,
      matchMediaDarkMatches: false,
    });
    const { themeState } = await importThemeWithBrowser(true);
    expect(themeState.current).toBe("light");
    expect(dom.classList.has("dark")).toBe(false);

    themeState.toggle();

    expect(themeState.current).toBe("dark");
    expect(dom.classList.has("dark")).toBe(true);
    expect(dom.localStorageData.theme).toBe("dark");
  });
});

describe("theme.svelte.ts matchMedia change listener", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.doUnmock("$app/environment");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock("$app/environment");
  });

  it("updates the active theme when no stored theme exists and the system flips to dark", async () => {
    const dom = setupFakeBrowserGlobals({
      initialDarkClass: false,
      storedTheme: null,
      matchMediaDarkMatches: false,
    });
    const { themeState } = await importThemeWithBrowser(true);
    expect(themeState.current).toBe("light");

    dom.triggerMqlChange(true);

    expect(themeState.current).toBe("dark");
    expect(dom.classList.has("dark")).toBe(true);
    // The system-preference path should NOT persist to localStorage.
    expect(dom.localStorageData.theme).toBeUndefined();
  });

  it("updates the active theme when no stored theme exists and the system flips to light", async () => {
    const dom = setupFakeBrowserGlobals({
      initialDarkClass: true,
      storedTheme: null,
      matchMediaDarkMatches: true,
    });
    const { themeState } = await importThemeWithBrowser(true);
    expect(themeState.current).toBe("dark");

    dom.triggerMqlChange(false);

    expect(themeState.current).toBe("light");
    expect(dom.classList.has("dark")).toBe(false);
    expect(dom.localStorageData.theme).toBeUndefined();
  });

  it("does NOT update the active theme when an explicit stored theme exists", async () => {
    const dom = setupFakeBrowserGlobals({
      initialDarkClass: true,
      storedTheme: "dark",
      matchMediaDarkMatches: true,
    });
    const { themeState } = await importThemeWithBrowser(true);
    expect(themeState.current).toBe("dark");
    expect(dom.localStorageData.theme).toBe("dark");

    // Trigger system change to light. The stored "dark" must win.
    dom.triggerMqlChange(false);

    expect(themeState.current).toBe("dark");
    expect(dom.classList.has("dark")).toBe(true);
    expect(dom.localStorageData.theme).toBe("dark");
  });
});

// =====================================================================
// app.html theme bootstrap script tests
// =====================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_HTML_PATH = resolve(__dirname, "../../app.html");

function extractInlineBootstrapScript(html: string): string {
  const match = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
  if (!match) {
    throw new Error("theme-contract.test: no <script> block found in app.html");
  }
  return match[1];
}

function runBootstrapScript(opts: { stored: string | null; systemLight: boolean }): { hasDarkClass: boolean } {
  const classes = new Set<string>(["dark"]); // initial state from <html class="dark">

  const fakeDocument = {
    documentElement: {
      classList: {
        toggle: (cls: string, force: boolean) => {
          if (force) classes.add(cls);
          else classes.delete(cls);
        },
      },
    },
  };

  const fakeWindow = {
    matchMedia: (query: string) => ({
      matches: opts.systemLight && query === "(prefers-color-scheme: light)",
    }),
  };

  const fakeLocalStorage = {
    // Bootstrap script only queries 'theme'; returning opts.stored only
    // for that key doubles as a small constraint check against a future
    // bootstrap that starts querying a different key.
    getItem: (key: string) => (key === "theme" ? opts.stored : null),
  };

  const html = readFileSync(APP_HTML_PATH, "utf-8");
  const scriptText = extractInlineBootstrapScript(html);

  // The script is an IIFE; wrapping it with `new Function(...)` gives it a
  // controlled scope where localStorage/window/document refer to the fakes.
  const runner = new Function("localStorage", "window", "document", scriptText);
  runner(fakeLocalStorage, fakeWindow, fakeDocument);

  return { hasDarkClass: classes.has("dark") };
}

describe("app.html theme bootstrap script precedence", () => {
  it("stored 'light' wins over a dark system preference", () => {
    expect(runBootstrapScript({ stored: "light", systemLight: false }).hasDarkClass).toBe(false);
  });

  it("stored 'dark' wins over a light system preference", () => {
    expect(runBootstrapScript({ stored: "dark", systemLight: true }).hasDarkClass).toBe(true);
  });

  it("no stored value with a system light preference resolves to light", () => {
    expect(runBootstrapScript({ stored: null, systemLight: true }).hasDarkClass).toBe(false);
  });

  it("no stored value with no system light preference resolves to default dark", () => {
    expect(runBootstrapScript({ stored: null, systemLight: false }).hasDarkClass).toBe(true);
  });

  it("an unrecognized stored value falls through to the system preference branch", () => {
    // The script only treats 'light' and 'dark' as valid stored values;
    // anything else should be ignored and the system branch should run.
    expect(runBootstrapScript({ stored: "auto", systemLight: true }).hasDarkClass).toBe(false);
    expect(runBootstrapScript({ stored: "auto", systemLight: false }).hasDarkClass).toBe(true);
  });

  it("toggles the dark class on document.documentElement (not a different element)", () => {
    // Sanity check: extract the script text and confirm it actually
    // calls .documentElement.classList.toggle('dark', ...).
    const html = readFileSync(APP_HTML_PATH, "utf-8");
    const scriptText = extractInlineBootstrapScript(html);
    expect(scriptText).toMatch(/document\.documentElement\.classList\.toggle\(\s*['"]dark['"]/);
  });
});
