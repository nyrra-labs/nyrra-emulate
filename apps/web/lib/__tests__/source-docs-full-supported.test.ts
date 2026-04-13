import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SERVICE_NAMES } from "../../../../packages/emulate/src/registry";
import { resolveServiceLabel } from "../service-labels";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// apps/web/lib/__tests__ → repo root is 4 levels up.
const REPO_ROOT = resolve(__dirname, "../../../..");

const PAGE_MDX_PATH = resolve(REPO_ROOT, "apps/web/app/page.mdx");

// The sibling docs-chat route.ts previously carried its own hand-
// authored comma list which this test file used to parse. That drift
// surface was removed: the docs-chat opening summary now derives its
// service list at request time via
// `apps/web/lib/docs-chat-summary.ts`'s `buildDocsChatOpeningSummary`,
// which funnels the runtime `SERVICE_NAMES` constant through the
// shared `resolveServiceLabel` helper this file also uses. Helper-
// level correctness is covered by `docs-chat-summary.test.ts`; this
// file keeps its page.mdx parity surface as the last remaining
// hand-authored full supported list in the repo.

/**
 * Expected full supported-service label sequence derived from the
 * runtime `SERVICE_NAMES` constant via the shared
 * `resolveServiceLabel` helper in `apps/web/lib/service-labels.ts`.
 * This is the 13-entry ordering (12 default services + foundry)
 * that `apps/web/app/page.mdx` references in its full-support
 * intro prose sentence.
 */
const expectedFullSupportedLabels: string[] = SERVICE_NAMES.map(resolveServiceLabel);

/**
 * Parses the full supported-service list out of a docs file's text
 * by slicing between the well-known `drop-in replacement for ` start
 * marker and the following ` APIs` end marker. The page.mdx file has
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

  it("apps/web/app/page.mdx includes Clerk in the full supported list", () => {
    const text = readFileSync(PAGE_MDX_PATH, "utf-8");
    const labels = parseFullSupportedList(text);
    expect(labels).toContain("Clerk");
  });

  it("apps/web/app/page.mdx includes Foundry in the full supported list (the full set includes it)", () => {
    const text = readFileSync(PAGE_MDX_PATH, "utf-8");
    const labels = parseFullSupportedList(text);
    expect(labels).toContain("Foundry");
  });

  it("apps/web/app/page.mdx has exactly SERVICE_NAMES.length entries (12 default + foundry = 13)", () => {
    const text = readFileSync(PAGE_MDX_PATH, "utf-8");
    const labels = parseFullSupportedList(text);
    expect(labels.length).toBe(SERVICE_NAMES.length);
  });

  it("Foundry is the last entry in apps/web/app/page.mdx (matching the runtime SERVICE_NAME_LIST order)", () => {
    // SERVICE_NAME_LIST concatenates DEFAULT_SERVICE_NAME_LIST with
    // EXTRA_SERVICE_NAME_LIST = ["foundry"], so foundry is always the
    // last entry. If a future change inserts foundry elsewhere in the
    // sequence, this assertion surfaces the drift explicitly.
    const text = readFileSync(PAGE_MDX_PATH, "utf-8");
    const labels = parseFullSupportedList(text);
    expect(labels[labels.length - 1]).toBe("Foundry");
  });
});
