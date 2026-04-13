import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
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
});
