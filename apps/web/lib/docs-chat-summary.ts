/**
 * Docs-chat opening summary composer.
 *
 * The `/api/docs-chat` route prepends an opening product summary to
 * its system prompt before the bullet-point tool-usage rules. The
 * previous implementation carried that summary as a single
 * hand-authored string literal in `route.ts`, with a full comma list
 * of supported services ("Vercel, GitHub, Google, ..., Clerk, and
 * Foundry") plus load-bearing capability references
 * (`createEmulator`, `@emulators/adapter-next`). Every upstream rename
 * or service addition drifted silently until a separate parity test
 * caught it at test time.
 *
 * This helper turns the opening summary into a build-time derivation:
 *
 *   1. The supported service list is derived from the runtime
 *      `SERVICE_NAMES` constant in `packages/emulate/src/registry.ts`
 *      (the same single source of truth the Svelte root page hero
 *      prose and the CLI consumed in the preceding refactor slices),
 *      projected through a local label-override map, and composed via
 *      `Intl.ListFormat` into an Oxford-comma English prose string.
 *      Adding or removing a service in the runtime registry flows
 *      into the docs-chat opening summary without a parallel literal
 *      edit.
 *
 *   2. The programmatic-API capability mention keys off the literal
 *      `createEmulator` token, which is asserted at request time to
 *      still exist in the upstream `apps/web/app/programmatic-api/
 *      page.mdx` content already loaded into the docs-files map that
 *      the route handler passes to the bash tool. If upstream renames
 *      or removes `createEmulator`, `buildDocsChatOpeningSummary`
 *      throws a precise error instead of rendering a stale prompt.
 *
 *   3. The Next.js integration mention keys off the literal
 *      `@emulators/adapter-next` package name, which is asserted at
 *      request time to still exist in the upstream
 *      `apps/web/app/nextjs/page.mdx` content. Same loud-fail posture
 *      if upstream renames the adapter package.
 *
 * The editorial phrases ("fully stateful, production-fidelity API
 * emulation, not mocks", "installed as the 'emulate' npm package and
 * run via 'npx emulate'") remain literal — they are not drift-prone
 * and their copy is deliberate framing that upstream docs do not own
 * verbatim.
 *
 * Only relative imports are used so this helper can be loaded from
 * both Next.js's webpack build (via the `@/lib/docs-chat-summary`
 * alias from `route.ts`) and from the Svelte app's Vitest suite (via
 * a cross-package relative path in the regression test).
 */
import { SERVICE_NAMES } from "../../../packages/emulate/src/registry";

/**
 * Display-label overrides for runtime service names whose default
 * capitalize-first-letter transform reads incorrectly. Kept small and
 * obvious; the Svelte root-page hero uses its own copy of the same
 * three entries in `apps/web-svelte/src/lib/default-services.server.ts`,
 * and both copies are validated against runtime parity via focused
 * tests so adding a new awkwardly-cased service must update both.
 */
export const STARTUP_LABEL_OVERRIDES: Readonly<Record<string, string>> = {
  github: "GitHub",
  aws: "AWS",
  mongoatlas: "MongoDB Atlas",
};

function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function resolveLabel(name: string): string {
  return STARTUP_LABEL_OVERRIDES[name] ?? capitalize(name);
}

/**
 * Ordered display labels for every supported service, derived from
 * the runtime `SERVICE_NAMES` constant in exact source-order (which
 * is `DEFAULT_SERVICE_NAMES` followed by `EXTRA_SERVICE_NAME_LIST`
 * ending with `"foundry"`). Consumed by `supportedServicesProse`
 * below and exported for test verification.
 */
export const supportedServiceLabels: readonly string[] = SERVICE_NAMES.map(resolveLabel);

/**
 * Oxford-comma English prose form of the full supported-service
 * label list, e.g. "Vercel, GitHub, Google, ..., Clerk, and Foundry".
 * Composed via `Intl.ListFormat` at module init so the final string
 * is a plain constant the route handler can splice into the opening
 * summary without re-formatting on every request.
 */
const LIST_FORMATTER = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});
export const supportedServicesProse: string = LIST_FORMATTER.format(supportedServiceLabels);

/**
 * Load-bearing programmatic-API entry point token. The opening
 * summary references this literal name, and `buildDocsChatOpeningSummary`
 * asserts it still exists in the upstream `/programmatic-api/page.mdx`
 * content at request time.
 */
export const PROGRAMMATIC_API_TOKEN = "createEmulator";

/**
 * Load-bearing Next.js adapter package name. Same loud-fail posture
 * as `PROGRAMMATIC_API_TOKEN`, asserted against upstream
 * `/nextjs/page.mdx`.
 */
export const NEXTJS_ADAPTER_PACKAGE = "@emulators/adapter-next";

/**
 * Docs-files map key that the `/api/docs-chat` route handler uses for
 * the upstream `apps/web/app/programmatic-api/page.mdx` content. The
 * key shape `/slug.md` mirrors `loadDocsFiles()` in `route.ts`.
 */
export const PROGRAMMATIC_API_DOCS_KEY = "/programmatic-api.md";

/**
 * Docs-files map key for the upstream `apps/web/app/nextjs/page.mdx`
 * content. Same `/slug.md` shape.
 */
export const NEXTJS_DOCS_KEY = "/nextjs.md";

/**
 * Composes the opening summary portion of the `/api/docs-chat`
 * system prompt from:
 *   - the runtime-derived `supportedServicesProse` list,
 *   - the `createEmulator` token asserted to still exist in the
 *     loaded upstream `/programmatic-api.md` content,
 *   - the `@emulators/adapter-next` package asserted to still exist
 *     in the loaded upstream `/nextjs.md` content.
 *
 * Throws loudly if either required doc is missing from the files map
 * or no longer contains its load-bearing token. The route handler
 * passes the same `docsFiles` map it feeds into the bash tool, so
 * one filesystem read serves both the tool environment and the
 * prompt validation.
 */
export function buildDocsChatOpeningSummary(
  docsFiles: Readonly<Record<string, string>>,
): string {
  const programmaticApiDoc = docsFiles[PROGRAMMATIC_API_DOCS_KEY];
  if (typeof programmaticApiDoc !== "string") {
    throw new Error(
      `docs-chat-summary: expected docsFiles[${JSON.stringify(PROGRAMMATIC_API_DOCS_KEY)}] ` +
        `to be a string loaded from upstream apps/web/app/programmatic-api/page.mdx, ` +
        `but the key was missing. The docs-chat opening summary derives its ` +
        `programmatic-API capability mention from this page; the route handler ` +
        `must load it via loadDocsFiles() before calling buildDocsChatOpeningSummary.`,
    );
  }
  if (!programmaticApiDoc.includes(PROGRAMMATIC_API_TOKEN)) {
    throw new Error(
      `docs-chat-summary: expected upstream apps/web/app/programmatic-api/page.mdx to ` +
        `contain the ${JSON.stringify(PROGRAMMATIC_API_TOKEN)} token (the load-bearing ` +
        `programmatic-API entry point). If that page renamed or removed ` +
        `createEmulator, update both the upstream docs and the ` +
        `PROGRAMMATIC_API_TOKEN constant in apps/web/lib/docs-chat-summary.ts.`,
    );
  }

  const nextjsDoc = docsFiles[NEXTJS_DOCS_KEY];
  if (typeof nextjsDoc !== "string") {
    throw new Error(
      `docs-chat-summary: expected docsFiles[${JSON.stringify(NEXTJS_DOCS_KEY)}] ` +
        `to be a string loaded from upstream apps/web/app/nextjs/page.mdx, but the ` +
        `key was missing. The docs-chat opening summary derives its Next.js ` +
        `capability mention from this page; the route handler must load it via ` +
        `loadDocsFiles() before calling buildDocsChatOpeningSummary.`,
    );
  }
  if (!nextjsDoc.includes(NEXTJS_ADAPTER_PACKAGE)) {
    throw new Error(
      `docs-chat-summary: expected upstream apps/web/app/nextjs/page.mdx to contain ` +
        `the ${JSON.stringify(NEXTJS_ADAPTER_PACKAGE)} package reference. If that ` +
        `page renamed or removed the Next.js adapter, update both the upstream docs ` +
        `and the NEXTJS_ADAPTER_PACKAGE constant in apps/web/lib/docs-chat-summary.ts.`,
    );
  }

  return (
    `You are a helpful documentation assistant for emulate, a local drop-in replacement ` +
    `for ${supportedServicesProse} APIs used in CI and no-network sandboxes.\n` +
    `\n` +
    `emulate provides fully stateful, production-fidelity API emulation, not mocks. ` +
    `The CLI is installed as the "emulate" npm package and run via "npx emulate" or ` +
    `just "emulate". It also supports a programmatic API via ${PROGRAMMATIC_API_TOKEN} ` +
    `and a Next.js adapter (${NEXTJS_ADAPTER_PACKAGE}) for embedding emulators in your app.`
  );
}
