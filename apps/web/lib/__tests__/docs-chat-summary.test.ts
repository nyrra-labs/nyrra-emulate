import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildDocsChatOpeningSummary,
  NEXTJS_ADAPTER_PACKAGE,
  NEXTJS_DOCS_KEY,
  PROGRAMMATIC_API_DOCS_KEY,
  PROGRAMMATIC_API_TOKEN,
  STARTUP_LABEL_OVERRIDES,
  supportedServiceLabels,
  supportedServicesProse,
} from "../docs-chat-summary";
import { DEFAULT_SERVICE_NAMES, SERVICE_NAMES } from "../../../../packages/emulate/src/service-names";
import { mdxToCleanMarkdown } from "../mdx-to-markdown";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// apps/web/lib/__tests__ → repo root is 4 levels up.
const REPO_ROOT = resolve(__dirname, "../../../..");
const PROGRAMMATIC_API_MDX_PATH = resolve(REPO_ROOT, "apps/web/app/programmatic-api/page.mdx");
const NEXTJS_MDX_PATH = resolve(REPO_ROOT, "apps/web/app/nextjs/page.mdx");

/**
 * Resolves a runtime service name to its human-visible label using the
 * same convention as `docs-chat-summary.ts`:
 * `STARTUP_LABEL_OVERRIDES[name]` wins, otherwise capitalize the first
 * character. The helper's internal `resolveLabel` is private; this
 * reimplementation lets the test validate the derivation independently.
 */
function resolveLabel(name: string): string {
  return STARTUP_LABEL_OVERRIDES[name] ?? name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Minimal synthetic docs-files fixture with the load-bearing tokens
 * the opening summary requires. Used to test the happy path without
 * depending on the real upstream files.
 */
function buildSyntheticDocsFiles(): Record<string, string> {
  return {
    [PROGRAMMATIC_API_DOCS_KEY]: `# Programmatic API\n\nUse ${PROGRAMMATIC_API_TOKEN} to boot a service.`,
    [NEXTJS_DOCS_KEY]: `# Next.js\n\nInstall ${NEXTJS_ADAPTER_PACKAGE} to embed emulators.`,
  };
}

describe("supportedServiceLabels", () => {
  it("has exactly SERVICE_NAMES.length entries (12 default + foundry = 13)", () => {
    expect(supportedServiceLabels.length).toBe(SERVICE_NAMES.length);
  });

  it("matches the runtime SERVICE_NAMES order after the local label-override resolver", () => {
    const expected = SERVICE_NAMES.map(resolveLabel);
    expect(supportedServiceLabels).toEqual(expected);
  });

  it("includes Clerk (regression guard against the pre-derived hardcoded 11-service list)", () => {
    expect(supportedServiceLabels).toContain("Clerk");
  });

  it("includes Foundry (the full set contains the extras list)", () => {
    expect(supportedServiceLabels).toContain("Foundry");
  });

  it("ends with Foundry (matches SERVICE_NAME_LIST = DEFAULT_SERVICE_NAME_LIST + ['foundry'])", () => {
    expect(supportedServiceLabels[supportedServiceLabels.length - 1]).toBe("Foundry");
  });

  it("applies STARTUP_LABEL_OVERRIDES for github, aws, and mongoatlas", () => {
    expect(supportedServiceLabels).toContain("GitHub");
    expect(supportedServiceLabels).toContain("AWS");
    expect(supportedServiceLabels).toContain("MongoDB Atlas");
    // And NOT the naive-capitalize form.
    expect(supportedServiceLabels).not.toContain("Github");
    expect(supportedServiceLabels).not.toContain("Aws");
    expect(supportedServiceLabels).not.toContain("Mongoatlas");
  });

  it("matches the default-startup ordering prefix (DEFAULT_SERVICE_NAMES maps into the first N labels)", () => {
    const prefix = supportedServiceLabels.slice(0, DEFAULT_SERVICE_NAMES.length);
    expect(prefix).toEqual(DEFAULT_SERVICE_NAMES.map(resolveLabel));
  });
});

describe("supportedServicesProse", () => {
  it("is a non-empty Oxford-comma English string", () => {
    expect(typeof supportedServicesProse).toBe("string");
    expect(supportedServicesProse.length).toBeGreaterThan(0);
    expect(supportedServicesProse).toContain(", and ");
  });

  it("contains every label from supportedServiceLabels", () => {
    for (const label of supportedServiceLabels) {
      expect(supportedServicesProse).toContain(label);
    }
  });

  it("ends with 'and Foundry' (the last runtime entry)", () => {
    expect(supportedServicesProse.endsWith("and Foundry")).toBe(true);
  });

  it("does NOT contain the old hardcoded 'Clerk, and Foundry' with a trailing Stripe-anchored list", () => {
    // The pre-derived hardcoded list ended "...MongoDB Atlas, Clerk, and Foundry" —
    // the Clerk-before-Foundry ordering must match the runtime order which
    // has clerk at DEFAULT_SERVICE_NAMES[11] and foundry as the extras entry.
    expect(supportedServicesProse).toContain("Clerk, and Foundry");
    // A previous regression had Stripe as the trailing entry before Clerk existed.
    expect(supportedServicesProse).not.toContain("MongoDB Atlas, Resend, and Stripe");
  });
});

describe("buildDocsChatOpeningSummary happy-path composition", () => {
  const docsFiles = buildSyntheticDocsFiles();

  it("returns a non-empty string", () => {
    const summary = buildDocsChatOpeningSummary(docsFiles);
    expect(typeof summary).toBe("string");
    expect(summary.length).toBeGreaterThan(0);
  });

  it("starts with the 'You are a helpful documentation assistant' hook", () => {
    const summary = buildDocsChatOpeningSummary(docsFiles);
    expect(summary.startsWith("You are a helpful documentation assistant for emulate")).toBe(true);
  });

  it("contains the runtime-derived supportedServicesProse service list", () => {
    const summary = buildDocsChatOpeningSummary(docsFiles);
    expect(summary).toContain(supportedServicesProse);
  });

  it("contains every label from supportedServiceLabels verbatim", () => {
    const summary = buildDocsChatOpeningSummary(docsFiles);
    for (const label of supportedServiceLabels) {
      expect(summary).toContain(label);
    }
  });

  it("contains the load-bearing createEmulator programmatic-API entry point", () => {
    const summary = buildDocsChatOpeningSummary(docsFiles);
    expect(summary).toContain(PROGRAMMATIC_API_TOKEN);
  });

  it("contains the load-bearing @emulators/adapter-next Next.js package reference", () => {
    const summary = buildDocsChatOpeningSummary(docsFiles);
    expect(summary).toContain(NEXTJS_ADAPTER_PACKAGE);
  });

  it("preserves the meaning-critical 'stateful, production-fidelity' framing", () => {
    const summary = buildDocsChatOpeningSummary(docsFiles);
    expect(summary).toContain("stateful, production-fidelity");
    expect(summary).toContain("not mocks");
  });

  it("preserves the CLI installation and invocation hints", () => {
    const summary = buildDocsChatOpeningSummary(docsFiles);
    expect(summary).toContain('"emulate" npm package');
    expect(summary).toContain('"npx emulate"');
  });
});

describe("buildDocsChatOpeningSummary loud-fail guards", () => {
  it("throws if the programmatic-api doc is missing from docsFiles", () => {
    const docsFiles = buildSyntheticDocsFiles();
    delete docsFiles[PROGRAMMATIC_API_DOCS_KEY];
    expect(() => buildDocsChatOpeningSummary(docsFiles)).toThrow(/programmatic-api.*missing/);
  });

  it("throws if the programmatic-api doc no longer contains createEmulator", () => {
    const docsFiles = buildSyntheticDocsFiles();
    docsFiles[PROGRAMMATIC_API_DOCS_KEY] = "# Programmatic API\n\nNo load-bearing token here.";
    expect(() => buildDocsChatOpeningSummary(docsFiles)).toThrow(/programmatic-api.*createEmulator/);
  });

  it("throws if the nextjs doc is missing from docsFiles", () => {
    const docsFiles = buildSyntheticDocsFiles();
    delete docsFiles[NEXTJS_DOCS_KEY];
    expect(() => buildDocsChatOpeningSummary(docsFiles)).toThrow(/nextjs.*missing/);
  });

  it("throws if the nextjs doc no longer contains @emulators/adapter-next", () => {
    const docsFiles = buildSyntheticDocsFiles();
    docsFiles[NEXTJS_DOCS_KEY] = "# Next.js\n\nNo load-bearing token here.";
    expect(() => buildDocsChatOpeningSummary(docsFiles)).toThrow(/nextjs.*adapter-next/);
  });
});

describe("buildDocsChatOpeningSummary against real upstream docs", () => {
  it("composes the summary when fed the real upstream programmatic-api and nextjs MDX after mdxToCleanMarkdown", () => {
    // Pin the helper against the real upstream file content the route
    // handler passes at request time. The helper only cares that the
    // load-bearing tokens exist, not about markdown structure, but
    // running it through the real files plus the same
    // `mdxToCleanMarkdown` transform the route.ts `loadDocsFiles()`
    // pipeline uses catches drift between the helper's token-search
    // and what actually ends up in the docsFiles map at runtime.
    const progRaw = readFileSync(PROGRAMMATIC_API_MDX_PATH, "utf-8");
    const nextjsRaw = readFileSync(NEXTJS_MDX_PATH, "utf-8");
    const docsFiles: Record<string, string> = {
      [PROGRAMMATIC_API_DOCS_KEY]: mdxToCleanMarkdown(progRaw),
      [NEXTJS_DOCS_KEY]: mdxToCleanMarkdown(nextjsRaw),
    };

    // Sanity check: both required tokens survive the mdxToCleanMarkdown pass.
    expect(docsFiles[PROGRAMMATIC_API_DOCS_KEY]).toContain(PROGRAMMATIC_API_TOKEN);
    expect(docsFiles[NEXTJS_DOCS_KEY]).toContain(NEXTJS_ADAPTER_PACKAGE);

    const summary = buildDocsChatOpeningSummary(docsFiles);
    expect(summary).toContain(PROGRAMMATIC_API_TOKEN);
    expect(summary).toContain(NEXTJS_ADAPTER_PACKAGE);
    expect(summary).toContain(supportedServicesProse);
  });

  it("the real upstream programmatic-api page contains the createEmulator token", () => {
    const raw = readFileSync(PROGRAMMATIC_API_MDX_PATH, "utf-8");
    expect(raw).toContain(PROGRAMMATIC_API_TOKEN);
  });

  it("the real upstream nextjs page contains the @emulators/adapter-next token", () => {
    const raw = readFileSync(NEXTJS_MDX_PATH, "utf-8");
    expect(raw).toContain(NEXTJS_ADAPTER_PACKAGE);
  });
});
