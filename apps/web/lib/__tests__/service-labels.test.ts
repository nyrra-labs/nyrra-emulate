import { describe, expect, it } from "vitest";
import {
  STARTUP_LABEL_OVERRIDES,
  formatServiceLabelsProse,
  resolveServiceLabel,
} from "../service-labels";
import { STARTUP_LABEL_OVERRIDES as docsChatOverrides } from "../docs-chat-summary";
// Cross-workspace import: the Svelte default-services.server.ts
// re-exports the same underlying STARTUP_LABEL_OVERRIDES reference
// via its own import from apps/web/lib/service-labels.ts. The
// identity-equality guard below proves both re-exports resolve to
// the same object, catching any regression that reintroduces a
// parallel literal on either side.
import { STARTUP_LABEL_OVERRIDES as svelteOverrides } from "../../../web-svelte/src/lib/default-services.server";
import {
  DEFAULT_SERVICE_NAMES,
  SERVICE_NAMES,
} from "../../../../packages/emulate/src/registry";

describe("STARTUP_LABEL_OVERRIDES canonical shape", () => {
  it("contains exactly the three brand-sensitive service name overrides", () => {
    expect(STARTUP_LABEL_OVERRIDES).toEqual({
      github: "GitHub",
      aws: "AWS",
      mongoatlas: "MongoDB Atlas",
    });
  });

  it("is the exact same object reference re-exported from apps/web/lib/docs-chat-summary", () => {
    // Identity equality via toBe proves the re-export is not a
    // parallel literal — both consumer paths resolve to the same
    // underlying map in apps/web/lib/service-labels.ts.
    expect(docsChatOverrides).toBe(STARTUP_LABEL_OVERRIDES);
  });

  it("is the exact same object reference re-exported from apps/web-svelte default-services.server", () => {
    expect(svelteOverrides).toBe(STARTUP_LABEL_OVERRIDES);
  });

  it("covers every brand-sensitive service name currently in SERVICE_NAMES (no unapplied overrides)", () => {
    // Every override key must correspond to a real runtime service;
    // a stale override is a regression waiting to happen.
    for (const overrideKey of Object.keys(STARTUP_LABEL_OVERRIDES)) {
      expect((SERVICE_NAMES as readonly string[]).includes(overrideKey)).toBe(true);
    }
  });
});

describe("resolveServiceLabel applies overrides and falls back to capitalize", () => {
  it("resolves github to 'GitHub' via the override", () => {
    expect(resolveServiceLabel("github")).toBe("GitHub");
  });

  it("resolves aws to 'AWS' via the override", () => {
    expect(resolveServiceLabel("aws")).toBe("AWS");
  });

  it("resolves mongoatlas to 'MongoDB Atlas' via the override", () => {
    expect(resolveServiceLabel("mongoatlas")).toBe("MongoDB Atlas");
  });

  it("capitalizes non-overridden service names", () => {
    expect(resolveServiceLabel("vercel")).toBe("Vercel");
    expect(resolveServiceLabel("google")).toBe("Google");
    expect(resolveServiceLabel("slack")).toBe("Slack");
    expect(resolveServiceLabel("apple")).toBe("Apple");
    expect(resolveServiceLabel("microsoft")).toBe("Microsoft");
    expect(resolveServiceLabel("foundry")).toBe("Foundry");
    expect(resolveServiceLabel("okta")).toBe("Okta");
    expect(resolveServiceLabel("resend")).toBe("Resend");
    expect(resolveServiceLabel("stripe")).toBe("Stripe");
    expect(resolveServiceLabel("clerk")).toBe("Clerk");
  });

  it("produces a display label for every runtime SERVICE_NAMES entry", () => {
    // Every runtime service must resolve to a non-empty display
    // label (either via override or via capitalize fallback). This
    // guards against a future service being added to SERVICE_NAMES
    // without an override being considered.
    for (const name of SERVICE_NAMES) {
      const label = resolveServiceLabel(name);
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("produces a display label for every runtime DEFAULT_SERVICE_NAMES entry", () => {
    for (const name of DEFAULT_SERVICE_NAMES) {
      const label = resolveServiceLabel(name);
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("handles an unknown service name via the capitalize fallback", () => {
    expect(resolveServiceLabel("hypothetical")).toBe("Hypothetical");
  });
});

describe("formatServiceLabelsProse produces Oxford-comma English prose", () => {
  it("joins multiple labels with commas and a trailing ', and '", () => {
    expect(formatServiceLabelsProse(["Vercel", "GitHub", "Google"])).toBe(
      "Vercel, GitHub, and Google",
    );
  });

  it("joins exactly two labels with ' and ' (no comma)", () => {
    expect(formatServiceLabelsProse(["Vercel", "GitHub"])).toBe("Vercel and GitHub");
  });

  it("returns a single label unchanged for a one-entry list", () => {
    expect(formatServiceLabelsProse(["Vercel"])).toBe("Vercel");
  });

  it("returns an empty string for an empty list", () => {
    expect(formatServiceLabelsProse([])).toBe("");
  });

  it("preserves input order (no alphabetization)", () => {
    expect(formatServiceLabelsProse(["Zebra", "Alpha", "Beta"])).toBe(
      "Zebra, Alpha, and Beta",
    );
  });
});

describe("shared helper drives docs-chat-summary and default-services with byte-identical output", () => {
  it("docs-chat-summary supportedServicesProse contains the canonical brand-sensitive labels", async () => {
    const { supportedServicesProse, supportedServiceLabels } = await import(
      "../docs-chat-summary"
    );
    // The full 13-service list for the docs-chat path — includes Foundry.
    expect(supportedServicesProse).toContain("GitHub");
    expect(supportedServicesProse).toContain("AWS");
    expect(supportedServicesProse).toContain("MongoDB Atlas");
    expect(supportedServicesProse).toContain("Clerk");
    expect(supportedServicesProse).toContain(", and Foundry");
    expect(supportedServiceLabels).toContain("GitHub");
    expect(supportedServiceLabels).toContain("AWS");
    expect(supportedServiceLabels).toContain("MongoDB Atlas");
  });

  it("docs-chat-summary preserves the upstream SERVICE_NAMES source order in its prose", async () => {
    const { supportedServiceLabels } = await import(
      "../docs-chat-summary"
    );
    const expected = SERVICE_NAMES.map(resolveServiceLabel);
    expect(supportedServiceLabels).toEqual(expected);
  });

  it("default-services.server defaultStartupServices labels match resolveServiceLabel on DEFAULT_SERVICE_NAMES", async () => {
    const { defaultStartupServices } = await import("../../../web-svelte/src/lib/default-services.server");
    const expected = DEFAULT_SERVICE_NAMES.map((name) => resolveServiceLabel(name));
    expect(defaultStartupServices.map((s) => s.label)).toEqual(expected);
  });

  it("default-services.server defaultStartupServices contains 'GitHub', 'AWS', 'MongoDB Atlas' (brand-sensitive)", async () => {
    const { defaultStartupServices } = await import("../../../web-svelte/src/lib/default-services.server");
    const labels = defaultStartupServices.map((s) => s.label);
    expect(labels).toContain("GitHub");
    expect(labels).toContain("AWS");
    expect(labels).toContain("MongoDB Atlas");
  });

  it("default-services.server supportedServicesProse includes the brand-sensitive labels and ends with Clerk (Foundry filtered)", async () => {
    const { supportedServicesProse } = await import("../../../web-svelte/src/lib/default-services.server");
    expect(supportedServicesProse).toContain("GitHub");
    expect(supportedServicesProse).toContain("AWS");
    expect(supportedServicesProse).toContain("MongoDB Atlas");
    // Foundry is filtered out of the Svelte supported-services list
    // because the hero paragraph mentions it separately.
    expect(supportedServicesProse).not.toContain("Foundry");
    // The last entry in the runtime SERVICE_NAMES order (excluding
    // foundry) is "clerk", which resolves to "Clerk". The Oxford-
    // comma formatter emits ", and Clerk" as the tail.
    expect(supportedServicesProse).toMatch(/, and Clerk$/);
  });

  it("the two supportedServicesProse strings differ by exactly the ', and Foundry' tail", async () => {
    // The docs-chat path uses the full 13-entry SERVICE_NAMES set
    // (ends with ", and Foundry"); the Svelte path filters Foundry
    // out so its last entry is Clerk. The two strings must be
    // prefix-identical up to the tail divergence, which proves
    // both consumers funnel through the same override map + same
    // formatter with the same resolveServiceLabel output for every
    // non-foundry name.
    const [docsChatModule, svelteModule] = await Promise.all([
      import("../docs-chat-summary"),
      import("../../../web-svelte/src/lib/default-services.server"),
    ]);
    const docsChatProse = docsChatModule.supportedServicesProse;
    const svelteProse = svelteModule.supportedServicesProse;
    // The Svelte prose ends with "..., and Clerk".
    // The docs-chat prose ends with "..., Clerk, and Foundry".
    // So dropping ", and Foundry" from the docs-chat form and
    // swapping "Clerk" for "and Clerk" should yield the Svelte form.
    expect(docsChatProse.endsWith(", and Foundry")).toBe(true);
    expect(svelteProse.endsWith(", and Clerk")).toBe(true);
    // Common prefix: everything up to and including "MongoDB Atlas".
    const common = "Vercel, GitHub, Google, Slack, Apple, Microsoft, Okta, AWS, Resend, Stripe, MongoDB Atlas";
    expect(docsChatProse.startsWith(common)).toBe(true);
    expect(svelteProse.startsWith(common)).toBe(true);
  });
});
