import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { allDocsPages } from "../docs-navigation";
import { pageMetadata } from "../page-metadata";
import { getPageTitle, PAGE_TITLES } from "../page-titles";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// apps/web/lib/__tests__ → repo root is 4 levels up.
const REPO_ROOT = resolve(__dirname, "../../../..");
const OG_ROOT_ROUTE_PATH = resolve(REPO_ROOT, "apps/web/app/og/route.tsx");
const OG_SLUG_ROUTE_PATH = resolve(REPO_ROOT, "apps/web/app/og/[...slug]/route.tsx");
const OG_IMAGE_PATH = resolve(REPO_ROOT, "apps/web/app/og/og-image.tsx");

/**
 * Pure title-resolution helper every metadata / OG consumer funnels
 * through. Mirrors the contract `page-metadata.ts` and the two OG
 * route files rely on so the tests below can name it explicitly
 * without duplicating the `\n`→space collapse at every call site.
 */
function expectedDisplayTitle(slug: string): string | null {
  const raw = getPageTitle(slug);
  return raw === null ? null : raw.replace(/\n/g, " ");
}

describe("pageMetadata(slug) root behavior against PAGE_TITLE_OVERRIDES marketing hero", () => {
  it("returns a metadata object for the root empty-string slug", () => {
    const meta = pageMetadata("");
    expect(meta).toBeDefined();
    expect(Object.keys(meta).length).toBeGreaterThan(0);
  });

  it("collapses the root marketing hero's \\n line break to a space for the document title", () => {
    // PAGE_TITLES[""] is "Local API Emulation\nfor CI and Sandboxes"
    // (two stacked lines in the OG image), but the HTML <title> tag
    // and the social-card title need to be one line, so pageMetadata
    // replaces the \n with a space.
    const meta = pageMetadata("");
    expect(meta.title).toBe("Local API Emulation for CI and Sandboxes");
    expect(meta.title).not.toContain("\n");
  });

  it("root openGraph.title is the collapsed display title suffixed with ' | emulate'", () => {
    const meta = pageMetadata("");
    expect(meta.openGraph?.title).toBe("Local API Emulation for CI and Sandboxes | emulate");
  });

  it("root twitter.title matches openGraph.title", () => {
    const meta = pageMetadata("");
    expect(meta.twitter?.title).toBe(meta.openGraph?.title);
  });

  it("root openGraph.images[0].url is '/og' (not '/og/')", () => {
    const meta = pageMetadata("");
    const images = meta.openGraph?.images;
    expect(Array.isArray(images)).toBe(true);
    const image = (images as Array<{ url: string | URL }>)[0];
    expect(image.url).toBe("/og");
  });

  it("root twitter.images[0] matches the openGraph image URL", () => {
    const meta = pageMetadata("");
    const twitterImages = meta.twitter?.images;
    expect(Array.isArray(twitterImages)).toBe(true);
    expect((twitterImages as string[])[0]).toBe("/og");
  });

  it("root metadata carries the shared product description on all three surfaces", () => {
    const meta = pageMetadata("");
    const description =
      "Local drop-in replacement services for CI and no-network sandboxes. Fully stateful, production-fidelity API emulation.";
    expect(meta.description).toBe(description);
    expect(meta.openGraph?.description).toBe(description);
    expect(meta.twitter?.description).toBe(description);
  });

  it("root openGraph carries the expected fixed fields (type, locale, siteName)", () => {
    const meta = pageMetadata("");
    // Next.js's `Metadata.openGraph` is a discriminated union across
    // website / article / profile / ... subtypes; `type`, `locale`,
    // and `siteName` live on different branches, so narrow via a
    // targeted cast that matches the runtime shape the metadata
    // pipeline emits for docs pages.
    const og = meta.openGraph as {
      type?: string;
      locale?: string;
      siteName?: string;
    };
    expect(og.type).toBe("website");
    expect(og.locale).toBe("en_US");
    expect(og.siteName).toBe("emulate");
  });

  it("root openGraph.images[0] carries the expected 1200x630 dimensions and alt text", () => {
    const meta = pageMetadata("");
    const image = (meta.openGraph?.images as Array<{ width: number; height: number; alt: string }>)[0];
    expect(image.width).toBe(1200);
    expect(image.height).toBe(630);
    expect(image.alt).toBe("Local API Emulation for CI and Sandboxes - emulate");
  });

  it("root twitter.card is 'summary_large_image'", () => {
    const meta = pageMetadata("");
    const twitter = meta.twitter as { card?: string };
    expect(twitter.card).toBe("summary_large_image");
  });
});

describe("pageMetadata(slug) non-root service-page behavior", () => {
  it("/foundry returns the canonical 'Foundry' title (not overridden)", () => {
    const meta = pageMetadata("foundry");
    expect(meta.title).toBe("Foundry");
    expect(meta.openGraph?.title).toBe("Foundry | emulate");
    expect(meta.twitter?.title).toBe("Foundry | emulate");
  });

  it("/foundry openGraph image URL is '/og/foundry' (the slug-based dynamic OG route)", () => {
    const meta = pageMetadata("foundry");
    const image = (meta.openGraph?.images as Array<{ url: string | URL }>)[0];
    expect(image.url).toBe("/og/foundry");
    const twitterImages = meta.twitter?.images as string[];
    expect(twitterImages[0]).toBe("/og/foundry");
  });

  it("/foundry image alt text includes the canonical title", () => {
    const meta = pageMetadata("foundry");
    const image = (meta.openGraph?.images as Array<{ alt: string }>)[0];
    expect(image.alt).toBe("Foundry - emulate");
  });

  it("/vercel uses the canonical 'Vercel API' title (NOT the nav-shortened 'Vercel')", () => {
    // The sidebar nav intentionally uses the shortened "Vercel" label
    // (via NAV_LABEL_OVERRIDES in docs-navigation.ts), but the
    // document title, OG card, and Twitter card need the descriptive
    // "Vercel API" form for SEO and social preview clarity. This test
    // pins that the metadata pipeline does NOT pick up nav overrides.
    const meta = pageMetadata("vercel");
    expect(meta.title).toBe("Vercel API");
    expect(meta.title).not.toBe("Vercel");
    expect(meta.openGraph?.title).toBe("Vercel API | emulate");
  });

  it("/vercel openGraph image URL is '/og/vercel'", () => {
    const meta = pageMetadata("vercel");
    const image = (meta.openGraph?.images as Array<{ url: string | URL }>)[0];
    expect(image.url).toBe("/og/vercel");
  });

  it("/vercel image alt text uses the descriptive 'Vercel API' form", () => {
    const meta = pageMetadata("vercel");
    const image = (meta.openGraph?.images as Array<{ alt: string }>)[0];
    expect(image.alt).toBe("Vercel API - emulate");
  });

  it("every non-root allDocsPages entry produces a non-empty metadata object with a title matching PAGE_TITLES", () => {
    for (const page of allDocsPages) {
      if (page.href === "/") continue;
      const slug = page.href.replace(/^\//, "");
      const meta = pageMetadata(slug);
      expect(Object.keys(meta).length).toBeGreaterThan(0);
      // `pageMetadata`'s `displayTitle` applies a \n→space collapse,
      // but none of the non-root titles contain \n today, so the
      // document title should match PAGE_TITLES[slug] verbatim.
      expect(meta.title).toBe(PAGE_TITLES[slug]);
    }
  });

  it("every non-root allDocsPages entry routes its openGraph image to '/og/${slug}'", () => {
    for (const page of allDocsPages) {
      if (page.href === "/") continue;
      const slug = page.href.replace(/^\//, "");
      const meta = pageMetadata(slug);
      const image = (meta.openGraph?.images as Array<{ url: string | URL }>)[0];
      expect(image.url).toBe(`/og/${slug}`);
    }
  });
});

describe("pageMetadata(slug) unknown-slug behavior", () => {
  it("returns an empty metadata object for a slug not in PAGE_TITLES", () => {
    const meta = pageMetadata("does-not-exist");
    expect(meta).toEqual({});
  });

  it("returns an empty metadata object for a looks-plausible-but-unregistered slug", () => {
    // Clerk has a runtime service entry in packages/emulate/src/registry.ts
    // but does NOT have a docs page in apps/web/app/, so its slug is
    // not in allDocsPages / PAGE_TITLES. This is a realistic drift
    // regression guard: if a future slice adds /clerk to allDocsPages
    // without adding the page.mdx, pageMetadata would still return {}
    // for "clerk", surfacing the gap loudly.
    const meta = pageMetadata("clerk");
    expect(meta).toEqual({});
  });

  it("does not throw on any string input (unknown slug just produces empty metadata)", () => {
    expect(() => pageMetadata("")).not.toThrow();
    expect(() => pageMetadata("foundry")).not.toThrow();
    expect(() => pageMetadata("unknown-page-42")).not.toThrow();
    expect(() => pageMetadata("with/slashes")).not.toThrow();
  });
});

describe("pageMetadata display-title derivation contract", () => {
  it("every known slug's meta.title equals PAGE_TITLES[slug] with \\n collapsed to space", () => {
    for (const slug of Object.keys(PAGE_TITLES)) {
      const meta = pageMetadata(slug);
      expect(meta.title).toBe(expectedDisplayTitle(slug));
    }
  });

  it("the root display title is exactly 'Local API Emulation for CI and Sandboxes' after the \\n collapse", () => {
    // PAGE_TITLES[""] has exactly one \n, so the collapsed form has
    // exactly one space at the split position. If a future refactor
    // introduces a different line-break character or skips the collapse,
    // this assertion catches it.
    expect(expectedDisplayTitle("")).toBe("Local API Emulation for CI and Sandboxes");
    expect(pageMetadata("").title).toBe("Local API Emulation for CI and Sandboxes");
  });

  it("non-root display titles are never affected by the \\n collapse (none contain \\n)", () => {
    for (const slug of Object.keys(PAGE_TITLES)) {
      if (slug === "") continue;
      expect(PAGE_TITLES[slug]).not.toContain("\n");
      expect(pageMetadata(slug).title).toBe(PAGE_TITLES[slug]);
    }
  });
});

describe("OG route handlers static contract: title resolution goes through getPageTitle", () => {
  it("app/og/route.tsx imports getPageTitle from the shared og-image re-export chain", () => {
    const src = readFileSync(OG_ROOT_ROUTE_PATH, "utf-8");
    expect(src).toContain('import { getPageTitle, renderOgImage } from "./og-image"');
  });

  it("app/og/route.tsx calls getPageTitle(\"\") for the root slug (non-null-asserted)", () => {
    const src = readFileSync(OG_ROOT_ROUTE_PATH, "utf-8");
    // The root route uses `getPageTitle("")!` because the empty-slug
    // lookup is guaranteed by the PAGE_TITLE_OVERRIDES contract.
    expect(src).toMatch(/getPageTitle\(""\)!/);
  });

  it("app/og/route.tsx does NOT compose titles manually or import PAGE_TITLES directly", () => {
    const src = readFileSync(OG_ROOT_ROUTE_PATH, "utf-8");
    expect(src).not.toContain("PAGE_TITLES");
    expect(src).not.toContain("Local API Emulation");
    expect(src).not.toContain("page-titles");
  });

  it("app/og/[...slug]/route.tsx imports getPageTitle from the shared og-image re-export chain", () => {
    const src = readFileSync(OG_SLUG_ROUTE_PATH, "utf-8");
    expect(src).toContain('import { getPageTitle, renderOgImage } from "../og-image"');
  });

  it("app/og/[...slug]/route.tsx forwards the joined catch-all slug to getPageTitle", () => {
    const src = readFileSync(OG_SLUG_ROUTE_PATH, "utf-8");
    expect(src).toMatch(/getPageTitle\(slug\.join\("\/"\)\)/);
  });

  it("app/og/[...slug]/route.tsx returns a 404 NextResponse when getPageTitle returns null", () => {
    const src = readFileSync(OG_SLUG_ROUTE_PATH, "utf-8");
    // The null check must be explicit, and the 404 must surface as
    // a NextResponse.json with status 404 so unknown slugs do not
    // render a broken ImageResponse or leak a 500.
    expect(src).toMatch(/if\s*\(\s*!title\s*\)/);
    expect(src).toMatch(/NextResponse\.json\(\s*\{\s*error:\s*"Not found"\s*\}\s*,\s*\{\s*status:\s*404/);
  });

  it("app/og/[...slug]/route.tsx does NOT compose titles manually or import PAGE_TITLES directly", () => {
    const src = readFileSync(OG_SLUG_ROUTE_PATH, "utf-8");
    expect(src).not.toContain("PAGE_TITLES");
    expect(src).not.toContain("Local API Emulation");
    expect(src).not.toContain("page-titles");
  });

  it("app/og/og-image.tsx re-exports getPageTitle from @/lib/page-titles", () => {
    const src = readFileSync(OG_IMAGE_PATH, "utf-8");
    expect(src).toContain('export { getPageTitle } from "@/lib/page-titles"');
  });

  it("app/og/og-image.tsx splits the rendered title on \\n into stacked lines (the reason the root hero needs \\n)", () => {
    const src = readFileSync(OG_IMAGE_PATH, "utf-8");
    // The rendered ImageResponse splits the incoming title on \n and
    // maps each line into a separate <span>. This is why the root
    // override keeps its deliberate \n and pageMetadata collapses it
    // only for the HTML <title> tag, not for the OG image payload.
    expect(src).toMatch(/title\.split\(['"]\\n['"]\)/);
  });
});

describe("getPageTitle return-type contract the OG and metadata paths rely on", () => {
  it("returns a string for the empty-string root slug (non-null)", () => {
    const title = getPageTitle("");
    expect(title).not.toBeNull();
    expect(typeof title).toBe("string");
    expect(title).toBe("Local API Emulation\nfor CI and Sandboxes");
  });

  it("returns a string for every allDocsPages non-root slug", () => {
    for (const page of allDocsPages) {
      if (page.href === "/") continue;
      const slug = page.href.replace(/^\//, "");
      const title = getPageTitle(slug);
      expect(typeof title).toBe("string");
      expect(title).toBe(page.name);
    }
  });

  it("returns null for an unknown slug (the OG [...slug] route's null-check guard)", () => {
    expect(getPageTitle("does-not-exist")).toBeNull();
    expect(getPageTitle("nested/path")).toBeNull();
  });

  it("returns null for a slug with leading slash (the route handlers strip leading slash before calling)", () => {
    // The OG routes call `getPageTitle(slug.join("/"))` which produces
    // "foundry" (no leading slash). Calling with "/foundry" should NOT
    // match, proving the route handlers' slug normalization is the
    // source of truth, not a hidden tolerance in getPageTitle.
    expect(getPageTitle("/foundry")).toBeNull();
  });
});
