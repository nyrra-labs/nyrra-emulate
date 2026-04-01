import type { Hono } from "hono";
import type { AppEnv, RouteContext, ServicePlugin, Store, TokenMap, WebhookDispatcher } from "@emulators/core";
import type { FoundryOAuthGrantType, FoundryPrincipalType } from "./entities.js";
import { getFoundryStore } from "./store.js";
import { oauthRoutes } from "./routes/oauth.js";
import { adminRoutes } from "./routes/admin.js";
import { DEFAULT_ORGANIZATION_RID, DEFAULT_REALM, foundryUserId } from "./helpers.js";

export { getFoundryStore, type FoundryStore } from "./store.js";
export * from "./entities.js";

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
}

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
}

export const foundryPlugin: ServicePlugin = {
  name: "foundry",
  register(app: Hono<AppEnv>, store: Store, webhooks: WebhookDispatcher, baseUrl: string, tokenMap?: TokenMap): void {
    const ctx: RouteContext = { app, store, webhooks, baseUrl, tokenMap };
    oauthRoutes(ctx);
    adminRoutes(ctx);
  },
  seed(store: Store, baseUrl: string): void {
    seedDefaults(store, baseUrl);
  },
};

export default foundryPlugin;
