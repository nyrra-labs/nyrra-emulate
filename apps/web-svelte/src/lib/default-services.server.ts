/**
 * Shared accessor for the runtime default startup service set.
 *
 * Imports service name constants from the emulate CLI package and
 * label resolution from the docs-upstream generated package.
 */
import { DEFAULT_SERVICE_NAMES, SERVICE_NAMES } from "../../../../packages/emulate/src/service-names";
import { formatServiceLabelsProse, resolveServiceLabel, STARTUP_LABEL_OVERRIDES } from "docs-upstream";

export { STARTUP_LABEL_OVERRIDES };

const BASE_PORT = 4000;

export type DefaultStartupService = {
  name: string;
  label: string;
  port: number;
};

export type SupportedService = {
  name: string;
  label: string;
};

export const defaultStartupServices: readonly DefaultStartupService[] = DEFAULT_SERVICE_NAMES.map((name, i) => ({
  name,
  label: resolveServiceLabel(name),
  port: BASE_PORT + i,
}));

/**
 * Hero-prose supported service list for the root docs page.
 * Excludes foundry since the FoundryCI hero already mentions it.
 */
export const supportedServices: readonly SupportedService[] = SERVICE_NAMES.filter((name) => name !== "foundry").map(
  (name) => ({ name, label: resolveServiceLabel(name) }),
);

export const supportedServicesProse: string = formatServiceLabelsProse(supportedServices.map((s) => s.label));
