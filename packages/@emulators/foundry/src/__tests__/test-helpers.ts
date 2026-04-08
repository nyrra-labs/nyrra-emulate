import { Hono } from "hono";
import { Store, WebhookDispatcher, authMiddleware, type TokenMap } from "@emulators/core";
import { foundryPlugin, seedFromConfig, type FoundrySeedConfig } from "../index.js";

export const base = "http://localhost:4000";

export function createFoundryTestApp(extraSeedConfig?: FoundrySeedConfig): {
  app: Hono;
  store: Store;
  tokenMap: TokenMap;
} {
  const store = new Store();
  const webhooks = new WebhookDispatcher();
  const tokenMap: TokenMap = new Map();
  tokenMap.set("contour-token", { login: "jane", id: 1, scopes: ["api:admin-read"] });

  const app = new Hono();
  app.use("*", authMiddleware(tokenMap));
  foundryPlugin.register(app as any, store, webhooks, base, tokenMap);
  foundryPlugin.seed?.(store, base);

  seedFromConfig(store, base, {
    users: [
      {
        username: "jane",
        display_name: "Jane Smith",
        email: "jane@example.com",
        given_name: "Jane",
        family_name: "Smith",
      },
    ],
    oauth_clients: [
      {
        client_id: "foundry-web",
        client_secret: "foundry-secret",
        name: "Foundry Web App",
        redirect_uris: ["http://localhost:3000/callback"],
        allowed_scopes: ["api:admin-read", "api:ontologies-read", "api:ontologies-write", "offline_access"],
      },
    ],
  });

  if (extraSeedConfig) {
    seedFromConfig(store, base, extraSeedConfig);
  }

  return { app, store, tokenMap };
}

export async function createRuntimeSession(
  app: Hono,
  options: {
    runtimeId?: string;
    deployedAppRid?: string;
    branch?: string;
    displayName?: string;
  } = {},
): Promise<{
  runtimeId: string;
  moduleAuthToken: string;
  getJobUri: string;
  postResultUri: string;
  postSchemaUri: string;
}> {
  const res = await app.request(`${base}/_emulate/foundry/compute-modules/runtimes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      runtimeId: options.runtimeId ?? "agent-loop",
      ...(options.deployedAppRid ? { deployedAppRid: options.deployedAppRid } : {}),
      ...(options.branch ? { branch: options.branch } : {}),
      ...(options.displayName ? { displayName: options.displayName } : {}),
    }),
  });

  return (await res.json()) as {
    runtimeId: string;
    moduleAuthToken: string;
    getJobUri: string;
    postResultUri: string;
    postSchemaUri: string;
  };
}

export function authHeader(token = "contour-token"): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
