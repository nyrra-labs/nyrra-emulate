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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// apps/web-svelte/src/lib/__tests__ → repo root is 5 levels up.
const REPO_ROOT = resolve(__dirname, "../../../../..");
const APPS_WEB_LAYOUT_PATH = resolve(REPO_ROOT, "apps/web/app/layout.tsx");
const APPS_WEB_PAGE_METADATA_PATH = resolve(REPO_ROOT, "apps/web/lib/page-metadata.ts");
const APPS_WEB_SITE_METADATA_PATH = resolve(REPO_ROOT, "apps/web/lib/site-metadata.ts");
const APPS_WEB_OG_IMAGE_PATH = resolve(REPO_ROOT, "apps/web/app/og/og-image.tsx");

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
