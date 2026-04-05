import { type Store, type Collection } from "@emulators/core";
import type { FoundryOAuthClient, FoundryUser } from "./entities.js";

export interface FoundryStore {
  users: Collection<FoundryUser>;
  oauthClients: Collection<FoundryOAuthClient>;
}

export function getFoundryStore(store: Store): FoundryStore {
  return {
    users: store.collection<FoundryUser>("foundry.users", ["user_id", "username", "email", "oauth_client_id"]),
    oauthClients: store.collection<FoundryOAuthClient>("foundry.oauthClients", ["client_id"]),
  };
}
