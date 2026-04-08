import { type Store, type Collection } from "@emulators/core";
import type { FoundryOAuthClient, FoundryUser } from "./entities.js";
import type {
  FoundryComputeModuleDeployedApp,
  FoundryComputeModuleJob,
  FoundryComputeModuleRuntime,
  FoundryComputeModuleSchema,
} from "./compute-modules/entities.js";

export interface FoundryStore {
  users: Collection<FoundryUser>;
  oauthClients: Collection<FoundryOAuthClient>;
  computeModuleDeployedApps: Collection<FoundryComputeModuleDeployedApp>;
  computeModuleRuntimes: Collection<FoundryComputeModuleRuntime>;
  computeModuleJobs: Collection<FoundryComputeModuleJob>;
  computeModuleSchemas: Collection<FoundryComputeModuleSchema>;
}

export function getFoundryStore(store: Store): FoundryStore {
  return {
    users: store.collection<FoundryUser>("foundry.users", ["user_id", "username", "email", "oauth_client_id"]),
    oauthClients: store.collection<FoundryOAuthClient>("foundry.oauthClients", ["client_id"]),
    computeModuleDeployedApps: store.collection<FoundryComputeModuleDeployedApp>("foundry.computeModuleDeployedApps", [
      "deployed_app_rid",
      "runtime_id",
    ]),
    computeModuleRuntimes: store.collection<FoundryComputeModuleRuntime>("foundry.computeModuleRuntimes", [
      "runtime_id",
    ]),
    computeModuleJobs: store.collection<FoundryComputeModuleJob>("foundry.computeModuleJobs", [
      "job_id",
      "runtime_id",
      "deployed_app_rid",
    ]),
    computeModuleSchemas: store.collection<FoundryComputeModuleSchema>("foundry.computeModuleSchemas", [
      "runtime_id",
      "function_name",
    ]),
  };
}
