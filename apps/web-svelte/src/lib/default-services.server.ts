/**
 * Shared accessor for the runtime default startup service set.
 *
 * The docs-site root page lists the services the `emulate` CLI starts
 * by default when no `--service` flag or seed config is provided.
 * That list is `DEFAULT_SERVICE_NAMES` in
 * `packages/emulate/src/registry.ts`; the CLI's `start` command at
 * `packages/emulate/src/commands/start.ts` iterates that array with
 * `basePort + i` port allocation. This helper imports the constant
 * directly (server-only, via a relative workspace path), projects
 * each entry into a display-friendly `{ name, label, port }` tuple,
 * and returns the ordered list. A future change to
 * `DEFAULT_SERVICE_NAMES` (e.g. adding a new service to the default
 * startup set) automatically reaches the root page's rendered list
 * without any parallel local edit.
 *
 * The `.server.ts` suffix tells SvelteKit to keep this module off
 * the client bundle; it is consumed only by `+page.server.ts` at
 * build-time prerender, so the relative cross-package import never
 * ships to the browser.
 */
import { DEFAULT_SERVICE_NAMES, SERVICE_NAMES } from "../../../../packages/emulate/src/registry";
import { formatServiceLabelsProse, resolveServiceLabel } from "../../../../apps/web/lib/service-labels";

/**
 * Base port the CLI uses when starting the default startup set. Matches
 * the `defaultPort = "4000"` literal in `packages/emulate/src/index.ts`
 * and the `basePort + i` allocation in
 * `packages/emulate/src/commands/start.ts`.
 */
const BASE_PORT = 4000;

/**
 * Re-export of the shared `STARTUP_LABEL_OVERRIDES` map from
 * `apps/web/lib/service-labels.ts`. The map used to live inline in
 * this file alongside a parallel copy in
 * `apps/web/lib/docs-chat-summary.ts`; the extraction collapsed both
 * into one source of truth so a future awkwardly-cased service only
 * needs one entry added to the shared helper. Keeping the re-export
 * here so existing test imports against `default-services.server`
 * continue to resolve unchanged, and so consumers that grep for
 * "STARTUP_LABEL_OVERRIDES" on this side of the monorepo still
 * find the binding.
 */
export { STARTUP_LABEL_OVERRIDES } from "../../../../apps/web/lib/service-labels";

export type DefaultStartupService = {
  name: string;
  label: string;
  port: number;
};

export type SupportedService = {
  name: string;
  label: string;
};

/**
 * Returns the default startup service list as a display-ready array.
 * The order matches `DEFAULT_SERVICE_NAMES` (which matches the CLI's
 * iteration order), and the port for index `i` is `BASE_PORT + i`,
 * matching the CLI's `basePort + i` allocation in
 * `packages/emulate/src/commands/start.ts`.
 */
export const defaultStartupServices: readonly DefaultStartupService[] = DEFAULT_SERVICE_NAMES.map((name, i) => ({
  name,
  label: resolveServiceLabel(name),
  port: BASE_PORT + i,
}));

/**
 * Hero-prose supported service list for the root docs page.
 *
 * Derived from the full runtime `SERVICE_NAMES` set (which is
 * `DEFAULT_SERVICE_NAMES + EXTRA_SERVICE_NAME_LIST` and includes
 * `foundry`), with one explicit local filter: `foundry` itself is
 * excluded because the FoundryCI hero paragraph already mentions
 * Foundry as the main subject in the preceding sentences ("FoundryCI
 * is a Nyrra project that runs Palantir Foundry locally..."), so
 * including Foundry again in the comma-separated "stand in for"
 * list reads awkwardly. Every other supported service is included
 * in the runtime order, so a future addition to `SERVICE_NAMES`
 * (e.g. a new OAuth provider) flows into the hero list automatically.
 */
export const supportedServices: readonly SupportedService[] = SERVICE_NAMES.filter((name) => name !== "foundry").map(
  (name) => ({ name, label: resolveServiceLabel(name) }),
);

/**
 * Pre-formatted Oxford-comma English prose form of `supportedServices`,
 * computed at module init via the shared `formatServiceLabelsProse`
 * helper so the docs-site prerender bakes the final string into the
 * static HTML. Renders as "Vercel, GitHub, Google, ..., Stripe,
 * MongoDB Atlas, and Clerk" (with "and " before the last entry,
 * Foundry filtered out because the FoundryCI hero mentions it in
 * its preceding sentences). The root-page hero paragraph drops this
 * string into the "...so the same process can also stand in for
 * <X> inside your test runs." sentence so the entire supporting list
 * stays in lockstep with the runtime registry.
 */
export const supportedServicesProse: string = formatServiceLabelsProse(supportedServices.map((s) => s.label));
