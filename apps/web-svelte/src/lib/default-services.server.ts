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
import { DEFAULT_SERVICE_NAMES } from "../../../../packages/emulate/src/registry";

/**
 * Base port the CLI uses when starting the default startup set. Matches
 * the `defaultPort = "4000"` literal in `packages/emulate/src/index.ts`
 * and the `basePort + i` allocation in
 * `packages/emulate/src/commands/start.ts`.
 */
const BASE_PORT = 4000;

/**
 * Display-label overrides for the default startup service list on the
 * root docs page. The default is to capitalize the bare service name,
 * so this map only carries the small set of names whose capitalized
 * form reads incorrectly ("GitHub" not "Github", "AWS" not "Aws",
 * "MongoDB Atlas" not "Mongoatlas"). Keep this map small and obvious.
 * A future service whose capitalized form reads incorrectly on the
 * homepage should get an entry here with a comment explaining why.
 */
export const STARTUP_LABEL_OVERRIDES: Readonly<Record<string, string>> = {
  github: "GitHub",
  aws: "AWS",
  mongoatlas: "MongoDB Atlas",
};

function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export type DefaultStartupService = {
  name: string;
  label: string;
  port: number;
};

/**
 * Returns the default startup service list as a display-ready array.
 * The order matches `DEFAULT_SERVICE_NAMES` (which matches the CLI's
 * iteration order), and the port for index `i` is `BASE_PORT + i`,
 * matching the CLI's `basePort + i` allocation in
 * `packages/emulate/src/commands/start.ts`.
 */
export const defaultStartupServices: readonly DefaultStartupService[] = DEFAULT_SERVICE_NAMES.map(
  (name, i) => ({
    name,
    label: STARTUP_LABEL_OVERRIDES[name] ?? capitalize(name),
    port: BASE_PORT + i,
  }),
);
