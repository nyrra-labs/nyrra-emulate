import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  GITHUB_REPO_URL,
  NPM_PACKAGE_URL,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  OG_LOCALE,
  OG_TYPE,
  PAGE_SITE_DESCRIPTION,
  ROOT_DEFAULT_TITLE,
  ROOT_OG_IMAGE_URL,
  ROOT_SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  TITLE_TEMPLATE,
  TWITTER_CARD,
  VERCEL_ATTRIBUTION_TITLE,
  VERCEL_ATTRIBUTION_URL,
  ogImageAlt,
  suffixWithSiteName,
} from "../../../../../apps/web/lib/site-metadata";
import {
  FOUNDRYCI_BRAND,
  FOUNDRYCI_SITE_NAME,
  NYRRA_PARENT_LABEL,
  NYRRA_URL,
} from "../foundryci-branding";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// apps/web-svelte/src/lib/__tests__ → repo root is 5 levels up.
const REPO_ROOT = resolve(__dirname, "../../../../..");
const APPS_WEB_LAYOUT_PATH = resolve(REPO_ROOT, "apps/web/app/layout.tsx");
const APPS_WEB_PAGE_METADATA_PATH = resolve(REPO_ROOT, "apps/web/lib/page-metadata.ts");
const APPS_WEB_SITE_METADATA_PATH = resolve(REPO_ROOT, "apps/web/lib/site-metadata.ts");
const APPS_WEB_OG_IMAGE_PATH = resolve(REPO_ROOT, "apps/web/app/og/og-image.tsx");
const APPS_WEB_DOCS_CHAT_PATH = resolve(REPO_ROOT, "apps/web/components/docs-chat.tsx");
const APPS_WEB_DOCS_CHAT_SUMMARY_PATH = resolve(REPO_ROOT, "apps/web/lib/docs-chat-summary.ts");
const WEB_SVELTE_PAGE_METADATA_PATH = resolve(
  REPO_ROOT,
  "apps/web-svelte/src/lib/page-metadata.ts",
);
const WEB_SVELTE_UPSTREAM_META_PATH = resolve(
  REPO_ROOT,
  "apps/web-svelte/src/lib/upstream-site-metadata.ts",
);
const WEB_SVELTE_HEADER_PATH = resolve(
  REPO_ROOT,
  "apps/web-svelte/src/lib/components/Header.svelte",
);
const WEB_SVELTE_LAYOUT_PATH = resolve(
  REPO_ROOT,
  "apps/web-svelte/src/routes/+layout.svelte",
);
const WEB_SVELTE_ROOT_PAGE_PATH = resolve(
  REPO_ROOT,
  "apps/web-svelte/src/routes/+page.svelte",
);
const WEB_SVELTE_FOUNDRYCI_BRANDING_PATH = resolve(
  REPO_ROOT,
  "apps/web-svelte/src/lib/foundryci-branding.ts",
);

describe("site-metadata.ts constant values", () => {
  it("SITE_NAME is 'emulate'", () => {
    expect(SITE_NAME).toBe("emulate");
  });

  it("SITE_URL is 'https://emulate.dev'", () => {
    expect(SITE_URL).toBe("https://emulate.dev");
  });

  it("SITE_URL is a valid absolute URL that `new URL()` can parse (required by metadataBase)", () => {
    expect(() => new URL(SITE_URL)).not.toThrow();
    expect(new URL(SITE_URL).origin).toBe(SITE_URL);
  });

  it("ROOT_DEFAULT_TITLE is the compact '&'-glyph form used by the HTML <title> at '/'", () => {
    expect(ROOT_DEFAULT_TITLE).toBe("emulate | Local API Emulation for CI & Sandboxes");
  });

  it("TITLE_TEMPLATE is '%s | emulate'", () => {
    expect(TITLE_TEMPLATE).toBe("%s | emulate");
  });

  it("TITLE_TEMPLATE uses the Next.js '%s' placeholder token for child-segment interpolation", () => {
    expect(TITLE_TEMPLATE).toContain("%s");
    // Simulate Next.js's interpolation of a child title:
    const interpolated = TITLE_TEMPLATE.replace("%s", "Foundry");
    expect(interpolated).toBe("Foundry | emulate");
  });

  it("OG_IMAGE_WIDTH / OG_IMAGE_HEIGHT are the standard 1200x630 social preview dimensions", () => {
    expect(OG_IMAGE_WIDTH).toBe(1200);
    expect(OG_IMAGE_HEIGHT).toBe(630);
  });

  it("ROOT_OG_IMAGE_URL is '/og' (no trailing slash, maps to app/og/route.tsx)", () => {
    expect(ROOT_OG_IMAGE_URL).toBe("/og");
  });

  it("OG_TYPE is 'website'", () => {
    expect(OG_TYPE).toBe("website");
  });

  it("OG_LOCALE is 'en_US'", () => {
    expect(OG_LOCALE).toBe("en_US");
  });

  it("TWITTER_CARD is 'summary_large_image'", () => {
    expect(TWITTER_CARD).toBe("summary_large_image");
  });

  it("GITHUB_REPO_URL is the canonical vercel-labs/emulate GitHub URL", () => {
    expect(GITHUB_REPO_URL).toBe("https://github.com/vercel-labs/emulate");
  });

  it("GITHUB_REPO_URL is a valid absolute URL that `new URL()` can parse", () => {
    expect(() => new URL(GITHUB_REPO_URL)).not.toThrow();
    expect(new URL(GITHUB_REPO_URL).hostname).toBe("github.com");
  });

  it("NPM_PACKAGE_URL is the canonical npmjs.com/package/emulate URL", () => {
    expect(NPM_PACKAGE_URL).toBe("https://www.npmjs.com/package/emulate");
  });

  it("NPM_PACKAGE_URL is a valid absolute URL that `new URL()` can parse", () => {
    expect(() => new URL(NPM_PACKAGE_URL)).not.toThrow();
    expect(new URL(NPM_PACKAGE_URL).hostname).toBe("www.npmjs.com");
  });

  it("VERCEL_ATTRIBUTION_URL is 'https://vercel.com'", () => {
    expect(VERCEL_ATTRIBUTION_URL).toBe("https://vercel.com");
  });

  it("VERCEL_ATTRIBUTION_TITLE is the 'Made with love by Vercel' tooltip string", () => {
    expect(VERCEL_ATTRIBUTION_TITLE).toBe("Made with love by Vercel");
  });
});

describe("ROOT_SITE_DESCRIPTION vs PAGE_SITE_DESCRIPTION intentional divergence", () => {
  // The two descriptions differ in one specific way: the root description
  // ends with "Not mocks." (load-bearing emphasis for the "/" URL's meta)
  // and the non-root per-page description does not. This divergence
  // predates the site-metadata extraction and applies to different
  // rendered surfaces. These tests pin the divergence so a future
  // refactor cannot silently unify the two strings and regress the
  // visible social-preview copy on either surface.

  it("ROOT_SITE_DESCRIPTION ends with 'Not mocks.' emphasis", () => {
    expect(ROOT_SITE_DESCRIPTION.endsWith("Not mocks.")).toBe(true);
  });

  it("PAGE_SITE_DESCRIPTION does NOT end with 'Not mocks.' emphasis", () => {
    expect(PAGE_SITE_DESCRIPTION.endsWith("Not mocks.")).toBe(false);
    expect(PAGE_SITE_DESCRIPTION).not.toContain("Not mocks.");
  });

  it("ROOT_SITE_DESCRIPTION and PAGE_SITE_DESCRIPTION share the same lead sentence", () => {
    // Both start with the same "Local drop-in replacement services..."
    // lead — the only difference is the trailing sentence.
    const lead =
      "Local drop-in replacement services for CI and no-network sandboxes. " +
      "Fully stateful, production-fidelity API emulation.";
    expect(PAGE_SITE_DESCRIPTION).toBe(lead);
    expect(ROOT_SITE_DESCRIPTION.startsWith(lead)).toBe(true);
  });

  it("the two descriptions differ by exactly the ' Not mocks.' trailer (no silent drift elsewhere)", () => {
    expect(ROOT_SITE_DESCRIPTION).toBe(PAGE_SITE_DESCRIPTION + " Not mocks.");
  });

  it("PAGE_SITE_DESCRIPTION preserves the historical non-root description the pageMetadata pipeline returned pre-refactor", () => {
    // Byte-for-byte match against the exact literal the old
    // `page-metadata.ts` carried as the `DESCRIPTION` const.
    expect(PAGE_SITE_DESCRIPTION).toBe(
      "Local drop-in replacement services for CI and no-network sandboxes. Fully stateful, production-fidelity API emulation.",
    );
  });

  it("ROOT_SITE_DESCRIPTION preserves the historical root description the app/layout.tsx metadata literal carried pre-refactor", () => {
    // Byte-for-byte match against the exact literal the old
    // `app/layout.tsx` hand-written metadata had in all three places
    // (description, openGraph.description, twitter.description).
    expect(ROOT_SITE_DESCRIPTION).toBe(
      "Local drop-in replacement services for CI and no-network sandboxes. Fully stateful, production-fidelity API emulation. Not mocks.",
    );
  });
});

describe("site-metadata helper functions", () => {
  it("suffixWithSiteName('Foundry') returns 'Foundry | emulate' (the openGraph.title shape)", () => {
    expect(suffixWithSiteName("Foundry")).toBe("Foundry | emulate");
  });

  it("suffixWithSiteName produces the same shape as the Next.js title.template interpolation", () => {
    // Next.js applies `TITLE_TEMPLATE` to child metadata.title via
    // `template.replace("%s", childTitle)`. The `suffixWithSiteName`
    // helper's output must match that interpolation exactly so the
    // HTML <title> tag and the openGraph.title stay in sync on every
    // non-root docs page.
    const childTitle = "Vercel API";
    const templateOutput = TITLE_TEMPLATE.replace("%s", childTitle);
    expect(suffixWithSiteName(childTitle)).toBe(templateOutput);
  });

  it("ogImageAlt('Foundry') returns 'Foundry - emulate' (the openGraph.images[0].alt shape)", () => {
    expect(ogImageAlt("Foundry")).toBe("Foundry - emulate");
  });

  it("ogImageAlt collapses correctly with a display-title that came from the root marketing hero", () => {
    // The root `pageMetadata("")` pipeline collapses "Local API
    // Emulation\nfor CI and Sandboxes" to "Local API Emulation for
    // CI and Sandboxes" via the \n→space replace in `page-metadata.ts`,
    // then passes the collapsed form through `ogImageAlt`.
    const rootCollapsed = "Local API Emulation for CI and Sandboxes";
    expect(ogImageAlt(rootCollapsed)).toBe("Local API Emulation for CI and Sandboxes - emulate");
  });
});

describe("apps/web/app/layout.tsx delegates site metadata to the shared module", () => {
  it("imports constants from @/lib/site-metadata", () => {
    const src = readFileSync(APPS_WEB_LAYOUT_PATH, "utf-8");
    expect(src).toContain('from "@/lib/site-metadata"');
  });

  it("references every constant it needs (no stray literal strings)", () => {
    const src = readFileSync(APPS_WEB_LAYOUT_PATH, "utf-8");
    const constants = [
      "OG_IMAGE_HEIGHT",
      "OG_IMAGE_WIDTH",
      "OG_LOCALE",
      "OG_TYPE",
      "ROOT_DEFAULT_TITLE",
      "ROOT_OG_IMAGE_URL",
      "ROOT_SITE_DESCRIPTION",
      "SITE_NAME",
      "SITE_URL",
      "TITLE_TEMPLATE",
      "TWITTER_CARD",
    ];
    for (const constantName of constants) {
      expect(
        src.includes(constantName),
        `app/layout.tsx does not reference ${constantName}`,
      ).toBe(true);
    }
  });

  it("does NOT hand-write the 'emulate | Local API Emulation for CI & Sandboxes' literal (delegates to ROOT_DEFAULT_TITLE)", () => {
    const src = readFileSync(APPS_WEB_LAYOUT_PATH, "utf-8");
    expect(src).not.toContain('"emulate | Local API Emulation for CI & Sandboxes"');
  });

  it("does NOT hand-write the '%s | emulate' title template literal (delegates to TITLE_TEMPLATE)", () => {
    const src = readFileSync(APPS_WEB_LAYOUT_PATH, "utf-8");
    expect(src).not.toContain('"%s | emulate"');
  });

  it("does NOT hand-write the root description literal with 'Not mocks.' (delegates to ROOT_SITE_DESCRIPTION)", () => {
    const src = readFileSync(APPS_WEB_LAYOUT_PATH, "utf-8");
    expect(src).not.toContain(
      "Local drop-in replacement services for CI and no-network sandboxes. Fully stateful, production-fidelity API emulation. Not mocks.",
    );
  });

  it("does NOT hand-write the 'https://emulate.dev' URL (delegates to SITE_URL)", () => {
    const src = readFileSync(APPS_WEB_LAYOUT_PATH, "utf-8");
    expect(src).not.toContain('"https://emulate.dev"');
  });

  it("does NOT hand-write the '1200' or '630' image dimension literals (delegates to OG_IMAGE_WIDTH / OG_IMAGE_HEIGHT)", () => {
    const src = readFileSync(APPS_WEB_LAYOUT_PATH, "utf-8");
    expect(src).not.toMatch(/\bwidth:\s*1200\b/);
    expect(src).not.toMatch(/\bheight:\s*630\b/);
  });

  it("Header references GITHUB_REPO_URL (not the literal GitHub URL)", () => {
    const src = readFileSync(APPS_WEB_LAYOUT_PATH, "utf-8");
    expect(src).toContain("href={GITHUB_REPO_URL}");
    expect(src).not.toContain('"https://github.com/vercel-labs/emulate"');
  });

  it("Header references NPM_PACKAGE_URL (not the literal npm URL)", () => {
    const src = readFileSync(APPS_WEB_LAYOUT_PATH, "utf-8");
    expect(src).toContain("href={NPM_PACKAGE_URL}");
    expect(src).not.toContain('"https://www.npmjs.com/package/emulate"');
  });

  it("Header references VERCEL_ATTRIBUTION_URL + VERCEL_ATTRIBUTION_TITLE (not the literal Vercel URL or tooltip)", () => {
    const src = readFileSync(APPS_WEB_LAYOUT_PATH, "utf-8");
    expect(src).toContain("href={VERCEL_ATTRIBUTION_URL}");
    expect(src).toContain("title={VERCEL_ATTRIBUTION_TITLE}");
    expect(src).not.toContain('"https://vercel.com"');
    expect(src).not.toContain('"Made with love by Vercel"');
  });

  it("Header renders the wordmark via {SITE_NAME} inside the GeistPixelSquare span", () => {
    const src = readFileSync(APPS_WEB_LAYOUT_PATH, "utf-8");
    // The wordmark lives in the GeistPixelSquare-branded <span>. After
    // the refactor the literal "emulate" JSX text becomes {SITE_NAME}
    // interpolation so a future rename only touches site-metadata.ts.
    expect(src).toContain("GeistPixelSquare.className");
    expect(src).toContain(">{SITE_NAME}</span>");
    // The bare JSX text "emulate" (wrapped in a span without an
    // interpolation) must NOT appear anywhere in the file.
    expect(src).not.toMatch(/>\s*emulate\s*</);
  });
});

describe("apps/web/lib/page-metadata.ts delegates site metadata to the shared module", () => {
  it("imports constants from ./site-metadata", () => {
    const src = readFileSync(APPS_WEB_PAGE_METADATA_PATH, "utf-8");
    expect(src).toContain('from "./site-metadata"');
  });

  it("references every constant it needs (no stray literal strings)", () => {
    const src = readFileSync(APPS_WEB_PAGE_METADATA_PATH, "utf-8");
    const constants = [
      "OG_IMAGE_HEIGHT",
      "OG_IMAGE_WIDTH",
      "OG_LOCALE",
      "OG_TYPE",
      "PAGE_SITE_DESCRIPTION",
      "ROOT_OG_IMAGE_URL",
      "SITE_NAME",
      "TWITTER_CARD",
      "ogImageAlt",
      "suffixWithSiteName",
    ];
    for (const constantName of constants) {
      expect(
        src.includes(constantName),
        `page-metadata.ts does not reference ${constantName}`,
      ).toBe(true);
    }
  });

  it("no longer carries its own DESCRIPTION literal constant (the old parallel source)", () => {
    const src = readFileSync(APPS_WEB_PAGE_METADATA_PATH, "utf-8");
    expect(src).not.toMatch(/const\s+DESCRIPTION\s*=/);
  });

  it("does NOT hand-write the page description literal (delegates to PAGE_SITE_DESCRIPTION)", () => {
    const src = readFileSync(APPS_WEB_PAGE_METADATA_PATH, "utf-8");
    expect(src).not.toContain(
      "Local drop-in replacement services for CI and no-network sandboxes. Fully stateful, production-fidelity API emulation.",
    );
  });

  it("does NOT hand-write the '1200' or '630' image dimension literals (delegates to OG_IMAGE_WIDTH / OG_IMAGE_HEIGHT)", () => {
    const src = readFileSync(APPS_WEB_PAGE_METADATA_PATH, "utf-8");
    expect(src).not.toMatch(/width:\s*1200\b/);
    expect(src).not.toMatch(/height:\s*630\b/);
  });

  it("does NOT hand-write the 'website' / 'en_US' / 'summary_large_image' literals (delegates to OG_TYPE / OG_LOCALE / TWITTER_CARD)", () => {
    const src = readFileSync(APPS_WEB_PAGE_METADATA_PATH, "utf-8");
    expect(src).not.toContain('"website"');
    expect(src).not.toContain('"en_US"');
    expect(src).not.toContain('"summary_large_image"');
  });

  it("does NOT hand-write ' | emulate' or ' - emulate' suffix literals (delegates to suffixWithSiteName / ogImageAlt)", () => {
    const src = readFileSync(APPS_WEB_PAGE_METADATA_PATH, "utf-8");
    expect(src).not.toMatch(/\$\{[^}]+\}\s*\|\s*emulate/);
    expect(src).not.toMatch(/\$\{[^}]+\}\s*-\s*emulate/);
  });
});

describe("apps/web/app/og/og-image.tsx delegates the wordmark to SITE_NAME", () => {
  it("imports SITE_NAME from @/lib/site-metadata", () => {
    const src = readFileSync(APPS_WEB_OG_IMAGE_PATH, "utf-8");
    expect(src).toContain('import { SITE_NAME } from "@/lib/site-metadata"');
  });

  it("renders the OG image wordmark via {SITE_NAME} interpolation", () => {
    const src = readFileSync(APPS_WEB_OG_IMAGE_PATH, "utf-8");
    // After the refactor the bare JSX text "emulate" in the OG
    // renderer's GeistPixelSquare <span> becomes {SITE_NAME} so the
    // rendered OG image and the HTML Header wordmark share one source.
    expect(src).toContain("{SITE_NAME}");
  });

  it("does NOT carry the literal 'emulate' JSX text anywhere (wordmark only appears via interpolation)", () => {
    const src = readFileSync(APPS_WEB_OG_IMAGE_PATH, "utf-8");
    // The only JSX text in the OG renderer that displays the brand
    // name is the GeistPixelSquare wordmark span. After the refactor
    // it reads `{SITE_NAME}` instead of the bare text `emulate`, so
    // `>emulate<` should not appear anywhere in the file.
    expect(src).not.toMatch(/>\s*emulate\s*</);
  });

  it("still renders the separator '/' literal between the Vercel triangle and the wordmark (layout preserved)", () => {
    const src = readFileSync(APPS_WEB_OG_IMAGE_PATH, "utf-8");
    // The OG image header is: [Vercel triangle] [separator slash] [emulate wordmark].
    // The separator slash is a layout element, not a brand constant,
    // so it remains a literal. This test pins that the separator
    // survives the wordmark refactor and did not get accidentally
    // collapsed into the SITE_NAME interpolation.
    expect(src).toMatch(/>\s*\/\s*</);
  });
});

describe("apps/web/components/docs-chat.tsx delegates product-name branding to SITE_NAME", () => {
  it("imports SITE_NAME from @/lib/site-metadata", () => {
    const src = readFileSync(APPS_WEB_DOCS_CHAT_PATH, "utf-8");
    expect(src).toContain('import { SITE_NAME } from "@/lib/site-metadata"');
  });

  it("the SUGGESTIONS list interpolates SITE_NAME in the 'What is ...' suggestion", () => {
    const src = readFileSync(APPS_WEB_DOCS_CHAT_PATH, "utf-8");
    expect(src).toContain("`What is ${SITE_NAME}?`");
    // The bare-literal form must be gone.
    expect(src).not.toContain('"What is emulate?"');
  });

  it("the chat panel label interpolates SITE_NAME as '${SITE_NAME} docs'", () => {
    const src = readFileSync(APPS_WEB_DOCS_CHAT_PATH, "utf-8");
    expect(src).toContain("`${SITE_NAME} docs`");
    // The bare-literal form must be gone.
    expect(src).not.toContain('"emulate docs"');
    expect(src).not.toContain(">emulate docs<");
  });

  it("the SUGGESTIONS list preserves the four non-branding suggestion copy strings (behavior preservation)", () => {
    const src = readFileSync(APPS_WEB_DOCS_CHAT_PATH, "utf-8");
    // These suggestions contain no product-name interpolation and
    // must survive the refactor unchanged.
    expect(src).toContain('"How do I start the server?"');
    expect(src).toContain('"What GitHub APIs are supported?"');
    expect(src).toContain('"How do I configure OAuth?"');
    expect(src).toContain("\"What's the architecture?\"");
  });
});

describe("apps/web/lib/docs-chat-summary.ts delegates product-name branding to SITE_NAME", () => {
  it("imports SITE_NAME from ./site-metadata", () => {
    const src = readFileSync(APPS_WEB_DOCS_CHAT_SUMMARY_PATH, "utf-8");
    expect(src).toContain('import { SITE_NAME } from "./site-metadata"');
  });

  it("buildDocsChatOpeningSummary interpolates SITE_NAME for the 'for X, a local drop-in' phrase", () => {
    const src = readFileSync(APPS_WEB_DOCS_CHAT_SUMMARY_PATH, "utf-8");
    expect(src).toContain("documentation assistant for ${SITE_NAME}");
    // The bare form must be absent from the runtime body.
    expect(src).not.toContain("documentation assistant for emulate,");
  });

  it("buildDocsChatOpeningSummary interpolates SITE_NAME for the 'X provides' phrase", () => {
    const src = readFileSync(APPS_WEB_DOCS_CHAT_SUMMARY_PATH, "utf-8");
    expect(src).toContain("${SITE_NAME} provides fully stateful");
    expect(src).not.toContain("emulate provides fully stateful");
  });

  it("buildDocsChatOpeningSummary interpolates SITE_NAME for the quoted '\"X\" npm package' phrase", () => {
    const src = readFileSync(APPS_WEB_DOCS_CHAT_SUMMARY_PATH, "utf-8");
    expect(src).toContain('"${SITE_NAME}" npm package');
    expect(src).not.toContain('"emulate" npm package');
  });

  it("buildDocsChatOpeningSummary interpolates SITE_NAME for the 'npx X' and 'just \"X\"' CLI phrases", () => {
    const src = readFileSync(APPS_WEB_DOCS_CHAT_SUMMARY_PATH, "utf-8");
    expect(src).toContain('"npx ${SITE_NAME}"');
    expect(src).toContain('just "${SITE_NAME}"');
    expect(src).not.toContain('"npx emulate"');
    expect(src).not.toContain('just "emulate"');
  });

  it("the non-branding framing phrases are preserved verbatim (behavior preservation)", () => {
    const src = readFileSync(APPS_WEB_DOCS_CHAT_SUMMARY_PATH, "utf-8");
    expect(src).toContain("documentation assistant for");
    expect(src).toContain("a local drop-in replacement");
    expect(src).toContain("fully stateful, production-fidelity API emulation, not mocks");
    expect(src).toContain("used in CI and no-network sandboxes");
    expect(src).toContain("programmatic API via");
    expect(src).toContain("Next.js adapter");
    expect(src).toContain("embedding emulators in your app");
  });
});

describe("apps/web-svelte/src/lib/upstream-site-metadata.ts re-exports the upstream branding surface", () => {
  it("re-exports from the canonical apps/web/lib/site-metadata.ts path", () => {
    const src = readFileSync(WEB_SVELTE_UPSTREAM_META_PATH, "utf-8");
    expect(src).toContain('from "../../../../apps/web/lib/site-metadata"');
  });

  it("re-exports every constant the Svelte consumers rely on", () => {
    const src = readFileSync(WEB_SVELTE_UPSTREAM_META_PATH, "utf-8");
    const exports = [
      "GITHUB_REPO_URL",
      "NPM_PACKAGE_URL",
      "OG_IMAGE_HEIGHT",
      "OG_IMAGE_WIDTH",
      "OG_LOCALE",
      "OG_TYPE",
      "PAGE_SITE_DESCRIPTION",
      "SITE_NAME",
      "TWITTER_CARD",
      "ogImageAlt",
      "suffixWithSiteName",
    ];
    for (const name of exports) {
      expect(
        src.includes(name),
        `upstream-site-metadata.ts does not re-export ${name}`,
      ).toBe(true);
    }
  });

  it("does NOT re-export FoundryCI-specific constants that intentionally stay Svelte-local", () => {
    const src = readFileSync(WEB_SVELTE_UPSTREAM_META_PATH, "utf-8");
    // The runtime `export { ... } from "..."` block must not contain
    // any FoundryCI-specific names. Docblock MENTIONS of these names
    // are intentional (they explain why the constants stay local),
    // so this assertion scopes itself to the export statement only.
    const exportMatch = src.match(/export\s*\{[\s\S]*?\}\s*from\s*"[^"]+";/);
    expect(exportMatch, "upstream-site-metadata.ts should have a runtime `export { ... } from ...` block").not.toBeNull();
    const exportBlock = exportMatch![0];
    expect(exportBlock).not.toContain("BASE_URL");
    expect(exportBlock).not.toContain("ROOT_TITLE");
    expect(exportBlock).not.toContain("ROOT_DESCRIPTION");
    expect(exportBlock).not.toContain("ROOT_SITE_NAME");
    expect(exportBlock).not.toContain("FOUNDRYCI");
    expect(exportBlock).not.toContain("foundryci.com");
    expect(exportBlock).not.toContain("OG_IMAGE_PATH");
  });
});

describe("apps/web-svelte/src/lib/page-metadata.ts delegates upstream branding to upstream-site-metadata", () => {
  it("imports SITE_NAME + PAGE_SITE_DESCRIPTION + OG/Twitter fixed fields + helpers from ./upstream-site-metadata", () => {
    const src = readFileSync(WEB_SVELTE_PAGE_METADATA_PATH, "utf-8");
    expect(src).toContain('from "./upstream-site-metadata"');
    const imports = [
      "SITE_NAME",
      "PAGE_SITE_DESCRIPTION",
      "OG_TYPE",
      "OG_LOCALE",
      "OG_IMAGE_WIDTH",
      "OG_IMAGE_HEIGHT",
      "TWITTER_CARD",
      "ogImageAlt",
      "suffixWithSiteName",
    ];
    for (const name of imports) {
      expect(
        src.includes(name),
        `apps/web-svelte/src/lib/page-metadata.ts does not import ${name}`,
      ).toBe(true);
    }
  });

  it("no longer declares a local `const SITE_NAME` literal (shared with upstream)", () => {
    const src = readFileSync(WEB_SVELTE_PAGE_METADATA_PATH, "utf-8");
    expect(src).not.toMatch(/const\s+SITE_NAME\s*=\s*["']emulate["']/);
  });

  it("no longer declares a local `const PAGE_DESCRIPTION` literal (shared with upstream PAGE_SITE_DESCRIPTION)", () => {
    const src = readFileSync(WEB_SVELTE_PAGE_METADATA_PATH, "utf-8");
    expect(src).not.toMatch(/const\s+PAGE_DESCRIPTION\s*=/);
  });

  it("no longer hand-writes the production-fidelity description literal (delegates to PAGE_SITE_DESCRIPTION)", () => {
    const src = readFileSync(WEB_SVELTE_PAGE_METADATA_PATH, "utf-8");
    // The non-root description string must not appear as a local
    // literal anymore — it's imported as PAGE_SITE_DESCRIPTION.
    expect(src).not.toContain(
      'Local drop-in replacement services for CI and no-network sandboxes. Fully stateful, production-fidelity API emulation."',
    );
  });

  it("uses suffixWithSiteName for the non-root title template (not a local `${displayTitle} | emulate` literal)", () => {
    const src = readFileSync(WEB_SVELTE_PAGE_METADATA_PATH, "utf-8");
    expect(src).toContain("suffixWithSiteName(displayTitle)");
    // The old inline form must be gone.
    expect(src).not.toMatch(/\$\{displayTitle\}\s*\|\s*\$\{SITE_NAME\}/);
  });

  it("uses ogImageAlt for the non-root image alt text (not a local `${displayTitle} - emulate` literal)", () => {
    const src = readFileSync(WEB_SVELTE_PAGE_METADATA_PATH, "utf-8");
    expect(src).toContain("ogImageAlt(displayTitle)");
    expect(src).not.toMatch(/\$\{displayTitle\}\s*-\s*\$\{SITE_NAME\}/);
  });

  it("preserves the local FoundryCI-specific facts (BASE_URL, ROOT_TITLE, ROOT_SITE_NAME, FOUNDRYCI_PAGE_METADATA)", () => {
    const src = readFileSync(WEB_SVELTE_PAGE_METADATA_PATH, "utf-8");
    // BASE_URL stays as a hand-written literal — it's the FoundryCI
    // canonical domain and is not shared with apps/web.
    expect(src).toContain('const BASE_URL = "https://foundryci.com"');
    // ROOT_TITLE and ROOT_SITE_NAME now derive from FOUNDRYCI_SITE_NAME
    // via the new foundryci-branding helper — the previous hand-
    // written literals are replaced by template-literal expressions
    // that reference the shared constant. The derivation test in the
    // `page-metadata.ts delegates FoundryCI branding to
    // foundryci-branding` describe group pins the exact shape.
    expect(src).toContain("const ROOT_TITLE = `${FOUNDRYCI_SITE_NAME} | Local Foundry Emulation`");
    expect(src).toContain("const ROOT_SITE_NAME = FOUNDRYCI_SITE_NAME");
    // FOUNDRYCI_PAGE_METADATA map remains local to page-metadata.ts
    // with its per-page description prose; only the title field
    // derives from FOUNDRYCI_SITE_NAME.
    expect(src).toContain("FOUNDRYCI_PAGE_METADATA");
    expect(src).toContain("`Foundry | ${FOUNDRYCI_SITE_NAME}`");
    expect(src).toContain("`Configuration | ${FOUNDRYCI_SITE_NAME}`");
  });

  it("preserves the local OG image path handling (static /og-default.png)", () => {
    const src = readFileSync(WEB_SVELTE_PAGE_METADATA_PATH, "utf-8");
    expect(src).toContain('const OG_IMAGE_PATH = "/og-default.png"');
    expect(src).toContain("OG_IMAGE_URL = `${BASE_URL}${OG_IMAGE_PATH}`");
  });
});

describe("apps/web-svelte/src/lib/components/Header.svelte delegates GitHub/npm links to upstream-site-metadata", () => {
  it("imports GITHUB_REPO_URL + NPM_PACKAGE_URL from $lib/upstream-site-metadata", () => {
    const src = readFileSync(WEB_SVELTE_HEADER_PATH, "utf-8");
    expect(src).toContain("from '$lib/upstream-site-metadata'");
    expect(src).toContain("GITHUB_REPO_URL");
    expect(src).toContain("NPM_PACKAGE_URL");
  });

  it("GitHub icon anchor references {GITHUB_REPO_URL} (not the literal URL)", () => {
    const src = readFileSync(WEB_SVELTE_HEADER_PATH, "utf-8");
    expect(src).toContain("href={GITHUB_REPO_URL}");
    expect(src).not.toContain('"https://github.com/vercel-labs/emulate"');
  });

  it("npm link anchor references {NPM_PACKAGE_URL} (not the literal URL)", () => {
    const src = readFileSync(WEB_SVELTE_HEADER_PATH, "utf-8");
    expect(src).toContain("href={NPM_PACKAGE_URL}");
    expect(src).not.toContain('"https://www.npmjs.com/package/emulate"');
  });

  it("routes the Nyrra attribution link through foundryci-branding (NYRRA_URL + NYRRA_PARENT_LABEL)", () => {
    const src = readFileSync(WEB_SVELTE_HEADER_PATH, "utf-8");
    // After the FoundryCI-branding extraction, the Nyrra attribution
    // is Svelte-local but consolidated in `$lib/foundryci-branding`.
    // The Header references NYRRA_URL + NYRRA_PARENT_LABEL by name;
    // the literal URL and visible "Nyrra" text must be gone from the
    // component source (the rendered output still shows "by Nyrra"
    // at runtime via the interpolation).
    expect(src).toContain("from '$lib/foundryci-branding'");
    expect(src).toContain("NYRRA_URL");
    expect(src).toContain("NYRRA_PARENT_LABEL");
    expect(src).toContain("href={NYRRA_URL}");
    expect(src).toContain("by {NYRRA_PARENT_LABEL}");
    expect(src).not.toContain('"https://nyrra.ai"');
    expect(src).not.toContain(">by Nyrra<");
  });

  it("routes the FoundryCI wordmark through foundryci-branding (FOUNDRYCI_BRAND)", () => {
    const src = readFileSync(WEB_SVELTE_HEADER_PATH, "utf-8");
    // The wordmark span and the home aria-label both interpolate
    // FOUNDRYCI_BRAND. The bare JSX text "FoundryCI" must be gone
    // from the source (runtime-rendered output is unchanged).
    expect(src).toContain("FOUNDRYCI_BRAND");
    expect(src).toContain("{FOUNDRYCI_BRAND}");
    expect(src).toContain("aria-label={`${FOUNDRYCI_BRAND} home`}");
    expect(src).not.toContain(">FoundryCI</span>");
    expect(src).not.toContain('aria-label="FoundryCI home"');
  });
});

describe("apps/web-svelte/src/routes/+layout.svelte footer delegates the GitHub link to upstream-site-metadata", () => {
  it("imports GITHUB_REPO_URL from $lib/upstream-site-metadata", () => {
    const src = readFileSync(WEB_SVELTE_LAYOUT_PATH, "utf-8");
    expect(src).toContain("from '$lib/upstream-site-metadata'");
    expect(src).toContain("GITHUB_REPO_URL");
  });

  it("footer 'Built on emulate by Vercel Labs' link references {GITHUB_REPO_URL} (not the literal URL)", () => {
    const src = readFileSync(WEB_SVELTE_LAYOUT_PATH, "utf-8");
    expect(src).toContain("href={GITHUB_REPO_URL}");
    expect(src).not.toContain('"https://github.com/vercel-labs/emulate"');
  });

  it("preserves the 'emulate by Vercel Labs' link text as the footer's visible attribution label", () => {
    // The visible label is intentional FoundryCI attribution copy
    // (not a branding constant) and must survive the refactor unchanged.
    const src = readFileSync(WEB_SVELTE_LAYOUT_PATH, "utf-8");
    expect(src).toContain(">emulate by Vercel Labs</a");
  });

  it("routes the Nyrra attribution footer link through foundryci-branding (NYRRA_URL + NYRRA_PARENT_LABEL)", () => {
    const src = readFileSync(WEB_SVELTE_LAYOUT_PATH, "utf-8");
    expect(src).toContain("from '$lib/foundryci-branding'");
    expect(src).toContain("NYRRA_URL");
    expect(src).toContain("NYRRA_PARENT_LABEL");
    expect(src).toContain("href={NYRRA_URL}");
    expect(src).toContain("{NYRRA_PARENT_LABEL}</a");
    expect(src).not.toContain('"https://nyrra.ai"');
    expect(src).not.toContain(">Nyrra</a");
  });
});

describe("apps/web-svelte/src/lib/foundryci-branding.ts constant values", () => {
  it("NYRRA_URL is 'https://nyrra.ai'", () => {
    expect(NYRRA_URL).toBe("https://nyrra.ai");
  });

  it("NYRRA_URL is a parseable absolute URL", () => {
    expect(() => new URL(NYRRA_URL)).not.toThrow();
    expect(new URL(NYRRA_URL).hostname).toBe("nyrra.ai");
  });

  it("FOUNDRYCI_BRAND is 'FoundryCI' (the bare PascalCase product name)", () => {
    expect(FOUNDRYCI_BRAND).toBe("FoundryCI");
  });

  it("NYRRA_PARENT_LABEL is 'Nyrra' (the bare parent-organization display name)", () => {
    expect(NYRRA_PARENT_LABEL).toBe("Nyrra");
  });

  it("FOUNDRYCI_SITE_NAME is 'FoundryCI by Nyrra' (the full compound site name)", () => {
    expect(FOUNDRYCI_SITE_NAME).toBe("FoundryCI by Nyrra");
  });

  it("FOUNDRYCI_SITE_NAME is derived from FOUNDRYCI_BRAND + NYRRA_PARENT_LABEL", () => {
    // A future rename of either bare constant should cascade through
    // the compound form automatically.
    expect(FOUNDRYCI_SITE_NAME).toBe(`${FOUNDRYCI_BRAND} by ${NYRRA_PARENT_LABEL}`);
  });
});

describe("apps/web-svelte/src/lib/foundryci-branding.ts is the one source of the Svelte-local brand literals", () => {
  it("NYRRA_URL literal is defined in foundryci-branding.ts", () => {
    const src = readFileSync(WEB_SVELTE_FOUNDRYCI_BRANDING_PATH, "utf-8");
    expect(src).toContain('"https://nyrra.ai"');
  });

  it("FOUNDRYCI_BRAND literal is defined in foundryci-branding.ts", () => {
    const src = readFileSync(WEB_SVELTE_FOUNDRYCI_BRANDING_PATH, "utf-8");
    expect(src).toContain('"FoundryCI"');
  });

  it("NYRRA_PARENT_LABEL literal is defined in foundryci-branding.ts", () => {
    const src = readFileSync(WEB_SVELTE_FOUNDRYCI_BRANDING_PATH, "utf-8");
    expect(src).toContain('"Nyrra"');
  });

  it("FOUNDRYCI_SITE_NAME is computed via template literal (not hand-written)", () => {
    const src = readFileSync(WEB_SVELTE_FOUNDRYCI_BRANDING_PATH, "utf-8");
    expect(src).toContain("`${FOUNDRYCI_BRAND} by ${NYRRA_PARENT_LABEL}`");
    // Strip docblock comments before the negative assertion so
    // legitimate docblock references to the compound string (the
    // file's header explains what FOUNDRYCI_SITE_NAME renders as)
    // do not false-positive. The runtime code body must not carry
    // a parallel hand-written literal.
    const runtimeSrc = src
      .replace(/\/\*\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(runtimeSrc).not.toContain('"FoundryCI by Nyrra"');
  });

  it("does NOT export upstream emulate constants (those live in upstream-site-metadata.ts)", () => {
    const src = readFileSync(WEB_SVELTE_FOUNDRYCI_BRANDING_PATH, "utf-8");
    // foundryci-branding.ts is strictly for FoundryCI / Nyrra facts;
    // upstream SITE_NAME, GITHUB_REPO_URL, etc. stay in
    // upstream-site-metadata.ts. Scope the negative assertion to the
    // runtime code by stripping `/** ... */` JSDoc blocks and `//`
    // line comments before matching, so legitimate docblock mentions
    // of these names (the docblock explains why they are NOT here)
    // do not false-positive.
    const runtimeSrc = src
      .replace(/\/\*\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(runtimeSrc).not.toContain('"emulate"');
    expect(runtimeSrc).not.toContain("GITHUB_REPO_URL");
    expect(runtimeSrc).not.toContain("NPM_PACKAGE_URL");
    // Use a word-boundary regex for SITE_NAME so the bare upstream
    // identifier does NOT match the FoundryCI-local compound constant
    // FOUNDRYCI_SITE_NAME (which legitimately contains "SITE_NAME"
    // as a suffix).
    expect(runtimeSrc).not.toMatch(/\bSITE_NAME\b/);
    // Every `export` statement must name only FoundryCI / Nyrra
    // constants; cross-check by pinning the four expected runtime
    // exports by their bare names.
    expect(runtimeSrc).toContain("export const NYRRA_URL");
    expect(runtimeSrc).toContain("export const FOUNDRYCI_BRAND");
    expect(runtimeSrc).toContain("export const NYRRA_PARENT_LABEL");
    expect(runtimeSrc).toContain("export const FOUNDRYCI_SITE_NAME");
  });
});

describe("apps/web-svelte/src/lib/page-metadata.ts delegates FoundryCI branding to foundryci-branding", () => {
  it("imports FOUNDRYCI_SITE_NAME from ./foundryci-branding", () => {
    const src = readFileSync(WEB_SVELTE_PAGE_METADATA_PATH, "utf-8");
    expect(src).toContain('from "./foundryci-branding"');
    expect(src).toContain("FOUNDRYCI_SITE_NAME");
  });

  it("ROOT_TITLE derives from FOUNDRYCI_SITE_NAME via template interpolation", () => {
    const src = readFileSync(WEB_SVELTE_PAGE_METADATA_PATH, "utf-8");
    expect(src).toContain("`${FOUNDRYCI_SITE_NAME} | Local Foundry Emulation`");
    expect(src).not.toContain('"FoundryCI by Nyrra | Local Foundry Emulation"');
  });

  it("ROOT_SITE_NAME is assigned directly from FOUNDRYCI_SITE_NAME (not a parallel literal)", () => {
    const src = readFileSync(WEB_SVELTE_PAGE_METADATA_PATH, "utf-8");
    expect(src).toContain("const ROOT_SITE_NAME = FOUNDRYCI_SITE_NAME");
    expect(src).not.toContain('const ROOT_SITE_NAME = "FoundryCI by Nyrra"');
  });

  it("FOUNDRYCI_PAGE_METADATA override titles derive from FOUNDRYCI_SITE_NAME", () => {
    const src = readFileSync(WEB_SVELTE_PAGE_METADATA_PATH, "utf-8");
    expect(src).toContain("`Foundry | ${FOUNDRYCI_SITE_NAME}`");
    expect(src).toContain("`Configuration | ${FOUNDRYCI_SITE_NAME}`");
    // The hand-written literal forms must be gone.
    expect(src).not.toContain('"Foundry | FoundryCI by Nyrra"');
    expect(src).not.toContain('"Configuration | FoundryCI by Nyrra"');
  });

  it("runtime pageMetadata still produces the exact pre-refactor FoundryCI brand strings for / and /foundry", async () => {
    // This is the runtime behavior-preservation check: the helper's
    // template-literal interpolations must produce byte-identical
    // output to the pre-refactor literals. Any typo in the
    // FOUNDRYCI_SITE_NAME derivation would surface here.
    const { pageMetadata } = await import("../page-metadata");
    const root = pageMetadata("");
    expect(root).not.toBeNull();
    expect(root!.title).toBe("FoundryCI by Nyrra | Local Foundry Emulation");
    expect(root!.openGraph.siteName).toBe("FoundryCI by Nyrra");
    const foundry = pageMetadata("foundry");
    expect(foundry).not.toBeNull();
    expect(foundry!.title).toBe("Foundry | FoundryCI by Nyrra");
    expect(foundry!.openGraph.siteName).toBe("FoundryCI by Nyrra");
  });
});

describe("apps/web-svelte/src/routes/+page.svelte delegates the upstream attribution link to GITHUB_REPO_URL", () => {
  it("imports GITHUB_REPO_URL from $lib/upstream-site-metadata", () => {
    const src = readFileSync(WEB_SVELTE_ROOT_PAGE_PATH, "utf-8");
    expect(src).toContain("from '$lib/upstream-site-metadata'");
    expect(src).toContain("GITHUB_REPO_URL");
  });

  it("the 'emulate by Vercel Labs' hero link references {GITHUB_REPO_URL} (not the literal URL)", () => {
    const src = readFileSync(WEB_SVELTE_ROOT_PAGE_PATH, "utf-8");
    expect(src).toContain("href={GITHUB_REPO_URL}");
    expect(src).not.toContain('href="https://github.com/vercel-labs/emulate"');
  });

  it("preserves the 'emulate by Vercel Labs' visible link text (editorial attribution)", () => {
    const src = readFileSync(WEB_SVELTE_ROOT_PAGE_PATH, "utf-8");
    // The visible label is deliberate editorial attribution copy, not
    // a branding constant; it stays hand-written and must survive
    // the refactor unchanged.
    expect(src).toContain(">emulate by Vercel Labs</a");
  });

  it("preserves the FoundryCI-first hero heading and prose intro (not touched by this slice)", () => {
    const src = readFileSync(WEB_SVELTE_ROOT_PAGE_PATH, "utf-8");
    expect(src).toContain("Local Foundry Emulation");
    expect(src).toContain("FoundryCI is a Nyrra project");
    expect(src).toContain("Palantir Foundry");
  });
});

describe("site-metadata.ts is the one source of each literal", () => {
  it("the brand name 'emulate' literal is defined in site-metadata.ts", () => {
    const src = readFileSync(APPS_WEB_SITE_METADATA_PATH, "utf-8");
    expect(src).toContain('"emulate"');
  });

  it("the 'https://emulate.dev' URL literal is defined in site-metadata.ts", () => {
    const src = readFileSync(APPS_WEB_SITE_METADATA_PATH, "utf-8");
    expect(src).toContain('"https://emulate.dev"');
  });

  it("the '%s | emulate' title template literal is defined in site-metadata.ts", () => {
    const src = readFileSync(APPS_WEB_SITE_METADATA_PATH, "utf-8");
    expect(src).toContain('"%s | emulate"');
  });

  it("the GitHub repo URL literal is defined in site-metadata.ts", () => {
    const src = readFileSync(APPS_WEB_SITE_METADATA_PATH, "utf-8");
    expect(src).toContain('"https://github.com/vercel-labs/emulate"');
  });

  it("the npm package URL literal is defined in site-metadata.ts", () => {
    const src = readFileSync(APPS_WEB_SITE_METADATA_PATH, "utf-8");
    expect(src).toContain('"https://www.npmjs.com/package/emulate"');
  });

  it("the 'https://vercel.com' parent attribution URL literal is defined in site-metadata.ts", () => {
    const src = readFileSync(APPS_WEB_SITE_METADATA_PATH, "utf-8");
    expect(src).toContain('"https://vercel.com"');
  });

  it("the 'Made with love by Vercel' attribution tooltip literal is defined in site-metadata.ts", () => {
    const src = readFileSync(APPS_WEB_SITE_METADATA_PATH, "utf-8");
    expect(src).toContain('"Made with love by Vercel"');
  });
});
