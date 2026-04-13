/**
 * Shared runtime service display-label resolver.
 *
 * Both the Next.js docs-chat opening-summary composer
 * (`apps/web/lib/docs-chat-summary.ts`) and the Svelte default-
 * startup / supported-services plumbing
 * (`apps/web-svelte/src/lib/default-services.server.ts`) need to
 * project the lowercase runtime `SERVICE_NAMES` constants from
 * `packages/emulate/src/registry.ts` into human-readable display
 * labels for UI copy and OG/prose rendering. The same three brand-
 * sensitive overrides (`github → GitHub`, `aws → AWS`,
 * `mongoatlas → MongoDB Atlas`) plus the same capitalize-first-
 * letter fallback applied identically in both places. The same
 * `Intl.ListFormat` Oxford-comma English formatter wrapped both
 * "supported-services prose" exports.
 *
 * This helper consolidates that duplication into one source of
 * truth. Future awkwardly-cased services only need an entry in
 * `STARTUP_LABEL_OVERRIDES` here — neither consumer file needs to
 * be updated.
 *
 * Scoped to runtime service-name display only. It deliberately
 * does NOT own page titles, nav labels, or docs-route names; those
 * have their own separate derivation paths.
 */

/**
 * Brand-sensitive display-label overrides for runtime service
 * names whose default `capitalize(name)` form reads incorrectly.
 * Kept small and obvious. Add a new entry ONLY when a future
 * service's lowercase name produces the wrong display form — for
 * example if a future `hubspot` service needs to render as
 * "HubSpot" rather than "Hubspot".
 */
export const STARTUP_LABEL_OVERRIDES: Readonly<Record<string, string>> = {
  github: "GitHub",
  aws: "AWS",
  mongoatlas: "MongoDB Atlas",
};

function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Resolves a lowercase runtime service name to its display label.
 * Applies `STARTUP_LABEL_OVERRIDES` first, falls back to capitalize-
 * first-letter for everything else.
 */
export function resolveServiceLabel(name: string): string {
  return STARTUP_LABEL_OVERRIDES[name] ?? capitalize(name);
}

const LIST_FORMATTER = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});

/**
 * Formats an ordered list of service display labels into an Oxford-
 * comma English prose string. Used by both the docs-chat opening
 * summary ("Vercel, GitHub, ..., Clerk, and Foundry") and the
 * Svelte root-page hero prose ("Vercel, GitHub, ..., MongoDB
 * Atlas, and Clerk" — with Foundry filtered out there because the
 * FoundryCI hero mentions Foundry separately in its preceding
 * sentences).
 *
 * Thin wrapper over a module-level `Intl.ListFormat` instance so
 * both consumer paths share the same formatter configuration
 * (`{ style: "long", type: "conjunction" }`).
 */
export function formatServiceLabelsProse(labels: readonly string[]): string {
  return LIST_FORMATTER.format(labels);
}
