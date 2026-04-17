import { type Store, type Collection } from "@emulators/core";
import type {
  FoundryOAuthClient,
  FoundryUser,
  FoundryEnrollment,
  FoundryConnection,
  FoundryOntology,
  FoundryOntologyQueryResult,
} from "./entities.js";
import type {
  FoundryComputeModuleDeployedApp,
  FoundryComputeModuleJob,
  FoundryComputeModuleRuntime,
  FoundryComputeModuleSchema,
} from "./compute-modules/entities.js";

export interface FoundryStore {
  users: Collection<FoundryUser>;
  oauthClients: Collection<FoundryOAuthClient>;
  enrollments: Collection<FoundryEnrollment>;
  connections: Collection<FoundryConnection>;
  ontologies: Collection<FoundryOntology>;
  ontologyQueryResults: Collection<FoundryOntologyQueryResult>;
  computeModuleDeployedApps: Collection<FoundryComputeModuleDeployedApp>;
  computeModuleRuntimes: Collection<FoundryComputeModuleRuntime>;
  computeModuleJobs: Collection<FoundryComputeModuleJob>;
  computeModuleSchemas: Collection<FoundryComputeModuleSchema>;
}

export function getFoundryStore(store: Store): FoundryStore {
  return {
    users: store.collection<FoundryUser>("foundry.users", ["user_id", "username", "email", "oauth_client_id"]),
    oauthClients: store.collection<FoundryOAuthClient>("foundry.oauthClients", ["client_id"]),
    enrollments: store.collection<FoundryEnrollment>("foundry.enrollments", ["enrollment_rid"]),
    connections: store.collection<FoundryConnection>("foundry.connections", ["rid", "parent_folder_rid"]),
    ontologies: store.collection<FoundryOntology>("foundry.ontologies", ["rid", "api_name"]),
    ontologyQueryResults: store.collection<FoundryOntologyQueryResult>("foundry.ontologyQueryResults", [
      "ontology_rid",
      "query_api_name",
    ]),
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
