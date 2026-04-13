import { describe, expect, it } from "vitest";
import { pageMetadata, pageMetadataForPathname } from "../page-metadata";

describe("pageMetadata root branding", () => {
  it("returns the FoundryCI by Nyrra root metadata for the empty slug", () => {
    const root = pageMetadata("");
    expect(root).not.toBeNull();
    expect(root!.title).toBe("FoundryCI by Nyrra | Local Foundry Emulation");
    expect(root!.openGraph.siteName).toBe("FoundryCI by Nyrra");
    expect(root!.openGraph.url).toBe("https://foundryci.com");
    expect(root!.openGraph.image.url).toBe("https://foundryci.com/og-default.png");
    expect(root!.openGraph.image.width).toBe(1200);
    expect(root!.openGraph.image.height).toBe(630);
    expect(root!.description).toMatch(/Not mocks\./);
    expect(root!.description).toMatch(/Nyrra/);
    expect(root!.twitter.card).toBe("summary_large_image");
  });
});

describe("pageMetadata FoundryCI overrides", () => {
  it("brands /foundry with the FoundryCI by Nyrra title and absolute URL", () => {
    const meta = pageMetadata("foundry");
    expect(meta).not.toBeNull();
    expect(meta!.title).toBe("Foundry | FoundryCI by Nyrra");
    expect(meta!.openGraph.title).toBe("Foundry | FoundryCI by Nyrra");
    expect(meta!.openGraph.siteName).toBe("FoundryCI by Nyrra");
    expect(meta!.openGraph.url).toBe("https://foundryci.com/foundry");
    expect(meta!.openGraph.image.alt).toBe("Foundry - FoundryCI by Nyrra");
    expect(meta!.description).toMatch(/Palantir Foundry/);
  });

  it("brands /configuration with the FoundryCI by Nyrra title and absolute URL", () => {
    const meta = pageMetadata("configuration");
    expect(meta).not.toBeNull();
    expect(meta!.title).toBe("Configuration | FoundryCI by Nyrra");
    expect(meta!.openGraph.siteName).toBe("FoundryCI by Nyrra");
    expect(meta!.openGraph.url).toBe("https://foundryci.com/configuration");
    expect(meta!.openGraph.image.alt).toBe("Configuration - FoundryCI by Nyrra");
    expect(meta!.description).toMatch(/Foundry users/);
  });
});

describe("pageMetadata generic suffix", () => {
  it("expands a normal service page into the upstream `<title> | emulate` form", () => {
    const meta = pageMetadata("vercel");
    expect(meta).not.toBeNull();
    expect(meta!.title).toBe("Vercel API | emulate");
    expect(meta!.openGraph.title).toBe("Vercel API | emulate");
    expect(meta!.openGraph.siteName).toBe("emulate");
    expect(meta!.openGraph.url).toBe("https://foundryci.com/vercel");
    expect(meta!.openGraph.image.alt).toBe("Vercel API - emulate");
    expect(meta!.description).toMatch(/Local drop-in replacement/);
  });

  it("returns null for an unknown slug instead of inventing metadata", () => {
    expect(pageMetadata("definitely-not-a-page")).toBeNull();
  });
});

describe("pageMetadataForPathname", () => {
  it("resolves `/` to the root metadata", () => {
    const root = pageMetadata("");
    const fromPath = pageMetadataForPathname("/");
    expect(fromPath).toEqual(root);
  });

  it("resolves a non-root pathname to the same metadata as the slug form", () => {
    expect(pageMetadataForPathname("/foundry")).toEqual(pageMetadata("foundry"));
    expect(pageMetadataForPathname("/vercel")).toEqual(pageMetadata("vercel"));
  });
});
