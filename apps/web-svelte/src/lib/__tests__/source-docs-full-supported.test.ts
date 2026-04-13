import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { STARTUP_LABEL_OVERRIDES } from "../default-services.server";
import { SERVICE_NAMES } from "../../../../../packages/emulate/src/registry";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// apps/web-svelte/src/lib/__tests__ → repo root is 5 levels up.
const REPO_ROOT = resolve(__dirname, "../../../../..");

const PAGE_MDX_PATH = resolve(REPO_ROOT, "apps/web/app/page.mdx");
const ROUTE_TS_PATH = resolve(REPO_ROOT, "apps/web/app/api/docs-chat/route.ts");

/**
 * Resolves a runtime service name to its human-visible label using the
 * same convention as `default-services.server.ts`:
 * `STARTUP_LABEL_OVERRIDES[name]` wins, otherwise capitalize the first
 * character. Recomputed locally rather than imported from the helper
 * because the helper's `resolveLabel` is a private function and the
 * override map is the only exported part of that chain.
 */
function resolveLabel(name: string): string {
  return STARTUP_LABEL_OVERRIDES[name] ?? name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Expected full supported-service label sequence derived from the
 * runtime `SERVICE_NAMES` constant. This is the 13-entry ordering
 * (12 default services + foundry) that both `apps/web/app/page.mdx`
 * and `apps/web/app/api/docs-chat/route.ts` reference in their
 * full-support prose sentences.
 */
const expectedFullSupportedLabels: string[] = SERVICE_NAMES.map(resolveLabel);

/**
 * Parses the full supported-service list out of a docs file's text
 * by slicing between the well-known `drop-in replacement for ` start
 * marker and the following ` APIs` end marker. Both files have
 * exactly one `drop-in replacement for X APIs` sentence, so first-
 * match semantics are unambiguous. The extracted list text has
 * Oxford-comma English form (`A, B, C, and D`), which is split on
 * `, ` and then has the leading `and ` stripped from the last entry.
 */
function parseFullSupportedList(text: string): string[] {
  const startMarker = "drop-in replacement for ";
  const endMarker = " APIs";
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error(`parseFullSupportedList: start marker "${startMarker}" not found`);
  }
  const afterStart = text.slice(startIdx + startMarker.length);
  const endIdx = afterStart.indexOf(endMarker);
  if (endIdx === -1) {
    throw new Error(`parseFullSupportedList: end marker "${endMarker}" not found`);
  }
  const listText = afterStart.slice(0, endIdx);
  const parts = listText.split(", ").map((part) => part.trim());
  const last = parts[parts.length - 1];
  if (last.startsWith("and ")) {
    parts[parts.length - 1] = last.slice(4);
  }
  return parts;
}

describe("source docs full supported service list parity", () => {
  it("apps/web/app/page.mdx intro prose matches the runtime SERVICE_NAMES order", () => {
    const text = readFileSync(PAGE_MDX_PATH, "utf-8");
    const labels = parseFullSupportedList(text);
    expect(labels).toEqual(expectedFullSupportedLabels);
  });

  it("apps/web/app/api/docs-chat/route.ts SYSTEM_PROMPT matches the runtime SERVICE_NAMES order", () => {
    const text = readFileSync(ROUTE_TS_PATH, "utf-8");
    const labels = parseFullSupportedList(text);
    expect(labels).toEqual(expectedFullSupportedLabels);
  });

  it("both source docs include Clerk in the full supported list", () => {
    for (const path of [PAGE_MDX_PATH, ROUTE_TS_PATH]) {
      const text = readFileSync(path, "utf-8");
      const labels = parseFullSupportedList(text);
      expect(labels).toContain("Clerk");
    }
  });

  it("both source docs include Foundry in the full supported list (the full set includes it)", () => {
    for (const path of [PAGE_MDX_PATH, ROUTE_TS_PATH]) {
      const text = readFileSync(path, "utf-8");
      const labels = parseFullSupportedList(text);
      expect(labels).toContain("Foundry");
    }
  });

  it("both source docs have exactly SERVICE_NAMES.length entries (12 default + foundry = 13)", () => {
    for (const path of [PAGE_MDX_PATH, ROUTE_TS_PATH]) {
      const text = readFileSync(path, "utf-8");
      const labels = parseFullSupportedList(text);
      expect(labels.length).toBe(SERVICE_NAMES.length);
    }
  });

  it("Foundry is the last entry in both source docs (matching the runtime SERVICE_NAME_LIST order)", () => {
    // SERVICE_NAME_LIST concatenates DEFAULT_SERVICE_NAME_LIST with
    // EXTRA_SERVICE_NAME_LIST = ["foundry"], so foundry is always the
    // last entry. If a future change inserts foundry elsewhere in the
    // sequence, this assertion surfaces the drift explicitly.
    for (const path of [PAGE_MDX_PATH, ROUTE_TS_PATH]) {
      const text = readFileSync(path, "utf-8");
      const labels = parseFullSupportedList(text);
      expect(labels[labels.length - 1]).toBe("Foundry");
    }
  });
});
