import type { Hono } from "hono";
import type { AppEnv, RouteContext, ServicePlugin, Store, TokenMap, WebhookDispatcher } from "@emulators/core";
import type { FoundryOAuthGrantType, FoundryPrincipalType } from "./entities.js";
import { bindComputeModuleDeployedApp, ensureComputeModuleRuntime } from "./compute-modules/helpers.js";
import { getFoundryStore } from "./store.js";
import { oauthRoutes } from "./routes/oauth.js";
import { adminRoutes } from "./routes/admin.js";
import { v2ConnectivityRoutes } from "./routes/v2-connectivity.js";
import { v2OntologyRoutes } from "./routes/v2-ontologies.js";
import { computeModuleRuntimeRoutes } from "./routes/compute-modules-runtime.js";
import { computeModuleContourRoutes } from "./routes/compute-modules-contour.js";
import {
  DEFAULT_ORGANIZATION_RID,
  DEFAULT_REALM,
  foundryRid,
  foundryUserId,
  normalizeFoundryUriScheme,
} from "./helpers.js";

export { getFoundryStore, type FoundryStore } from "./store.js";
export * from "./entities.js";
export * from "./compute-modules/entities.js";

export interface FoundrySeedConfig {
  port?: number;
  users?: Array<{
    username: string;
    display_name?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    realm?: string;
    organization_rid?: string;
    principal_type?: FoundryPrincipalType;
    active?: boolean;
    oauth_client_id?: string;
    attributes?: Record<string, string[]>;
  }>;
  oauth_clients?: Array<{
    client_id: string;
    client_secret: string;
    name?: string;
    redirect_uris?: string[];
    grant_types?: FoundryOAuthGrantType[];
    allowed_scopes?: string[];
  }>;
  enrollment?: {
    rid?: string;
    name?: string;
  };
  connections?: Array<{
    rid?: string;
    display_name: string;
    parent_folder_rid: string;
    domains?: Array<{ host: string; port?: number; scheme?: string; auth?: Record<string, unknown> }>;
    oauth2_client_rid?: string;
  }>;
  ontologies?: Array<{
    rid?: string;
    api_name: string;
    display_name: string;
    description?: string;
    queries?: Array<{
      api_name: string;
      result: unknown;
    }>;
  }>;
  compute_modules?: {
    deployed_apps?: Array<{
      deployed_app_rid: string;
      branch?: string;
      runtime_id: string;
      display_name?: string;
      active?: boolean;
    }>;
    runtimes?: Array<{
      runtime_id: string;
      module_auth_token?: string;
    }>;
  };
}

export const DEFAULT_ENROLLMENT_RID = "ri.enrollment..enrollment.default";
export const DEFAULT_ENROLLMENT_NAME = "Default Enrollment";

function seedDefaults(store: Store, _baseUrl: string): void {
  const fs = getFoundryStore(store);

  if (!fs.users.findOneBy("username", "admin")) {
    fs.users.insert({
      user_id: foundryUserId(),
      username: "admin",
      display_name: "Admin",
      email: "admin@localhost",
      given_name: "Admin",
      family_name: null,
      realm: DEFAULT_REALM,
      organization_rid: DEFAULT_ORGANIZATION_RID,
      principal_type: "human",
      active: true,
      oauth_client_id: null,
      attributes: {},
    });
  }

  if (fs.enrollments.all().length === 0) {
    fs.enrollments.insert({
      enrollment_rid: DEFAULT_ENROLLMENT_RID,
      name: DEFAULT_ENROLLMENT_NAME,
      created_time: new Date().toISOString(),
    });
  }
}

export function seedFromConfig(store: Store, _baseUrl: string, config: FoundrySeedConfig): void {
  const fs = getFoundryStore(store);

  if (config.users) {
    for (const user of config.users) {
      const existing = fs.users.findOneBy("username", user.username);
      if (existing) continue;

      fs.users.insert({
        user_id: foundryUserId(),
        username: user.username,
        display_name: user.display_name ?? user.username,
        email: user.email ?? null,
        given_name: user.given_name ?? null,
        family_name: user.family_name ?? null,
        realm: user.realm ?? DEFAULT_REALM,
        organization_rid: user.organization_rid ?? DEFAULT_ORGANIZATION_RID,
        principal_type: user.principal_type ?? "human",
        active: user.active ?? true,
        oauth_client_id: user.oauth_client_id ?? null,
        attributes: user.attributes ?? {},
      });
    }
  }

  if (config.oauth_clients) {
    for (const client of config.oauth_clients) {
      const existing = fs.oauthClients.findOneBy("client_id", client.client_id);
      if (existing) continue;

      fs.oauthClients.insert({
        client_id: client.client_id,
        client_secret: client.client_secret,
        name: client.name ?? client.client_id,
        redirect_uris: client.redirect_uris ?? [],
        grant_types: client.grant_types ?? ["authorization_code", "refresh_token", "client_credentials"],
        allowed_scopes: client.allowed_scopes ?? [],
      });
    }
  }

  if (config.enrollment) {
    const existing = fs.enrollments.all()[0];
    if (existing) {
      fs.enrollments.update(existing.id, {
        enrollment_rid: config.enrollment.rid ?? existing.enrollment_rid,
        name: config.enrollment.name ?? existing.name,
      });
    } else {
      fs.enrollments.insert({
        enrollment_rid: config.enrollment.rid ?? DEFAULT_ENROLLMENT_RID,
        name: config.enrollment.name ?? DEFAULT_ENROLLMENT_NAME,
        created_time: new Date().toISOString(),
      });
    }
  }

  if (config.connections) {
    for (const conn of config.connections) {
      const rid = conn.rid ?? foundryRid("magritte", "source", "");
      const existing = fs.connections.findOneBy("rid", rid);
      if (existing) continue;

      fs.connections.insert({
        rid,
        display_name: conn.display_name,
        parent_folder_rid: conn.parent_folder_rid,
        config_type: "rest",
        config_domains:
          conn.domains?.map((domain) => ({
            host: domain.host,
            ...(typeof domain.port === "number" ? { port: domain.port } : {}),
            ...(normalizeFoundryUriScheme(domain.scheme) ? { scheme: normalizeFoundryUriScheme(domain.scheme) } : {}),
            ...(domain.auth ? { auth: domain.auth } : {}),
          })) ?? [],
        config_oauth2_client_rid: conn.oauth2_client_rid ?? null,
        worker_type: "unknownWorker",
        worker_network_egress_policy_rids: [],
        secrets: {},
        exports_enabled: false,
        export_enabled_without_markings_validation: false,
      });
    }
  }

  if (config.ontologies) {
    for (const ont of config.ontologies) {
      const rid = ont.rid ?? foundryRid("ontology", "ontology");
      const existing = fs.ontologies.findOneBy("rid", rid);
      if (existing) continue;

      fs.ontologies.insert({
        rid,
        api_name: ont.api_name,
        display_name: ont.display_name,
        description: ont.description ?? null,
      });

      if (ont.queries) {
        for (const q of ont.queries) {
          fs.ontologyQueryResults.insert({
            ontology_rid: rid,
            query_api_name: q.api_name,
            result_json: JSON.stringify(q.result),
          });
        }
      }
    }
  }

  if (config.compute_modules?.runtimes) {
    for (const runtime of config.compute_modules.runtimes) {
      ensureComputeModuleRuntime(store, runtime.runtime_id, runtime.module_auth_token);
    }
  }

  if (config.compute_modules?.deployed_apps) {
    for (const deployedApp of config.compute_modules.deployed_apps) {
      ensureComputeModuleRuntime(store, deployedApp.runtime_id);
      bindComputeModuleDeployedApp(store, {
        deployedAppRid: deployedApp.deployed_app_rid,
        branch: deployedApp.branch,
        runtimeId: deployedApp.runtime_id,
        displayName: deployedApp.display_name,
        active: deployedApp.active,
      });
    }
  }
}

export const foundryPlugin: ServicePlugin = {
  name: "foundry",
  register(app: Hono<AppEnv>, store: Store, webhooks: WebhookDispatcher, baseUrl: string, tokenMap?: TokenMap): void {
    const ctx: RouteContext = { app, store, webhooks, baseUrl, tokenMap };
    oauthRoutes(ctx);
    adminRoutes(ctx);
    v2ConnectivityRoutes(ctx);
    v2OntologyRoutes(ctx);
    computeModuleRuntimeRoutes(ctx);
    computeModuleContourRoutes(ctx);
  },
  seed(store: Store, baseUrl: string): void {
    seedDefaults(store, baseUrl);
  },
};

export default foundryPlugin;
