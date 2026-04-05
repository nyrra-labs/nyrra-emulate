import type { Entity } from "@emulators/core";

export type FoundryPrincipalType = "human" | "service";
export type FoundryOAuthGrantType = "authorization_code" | "refresh_token" | "client_credentials";

export interface FoundryUser extends Entity {
  user_id: string;
  username: string;
  display_name: string;
  email: string | null;
  given_name: string | null;
  family_name: string | null;
  realm: string;
  organization_rid: string | null;
  principal_type: FoundryPrincipalType;
  active: boolean;
  oauth_client_id: string | null;
  attributes: Record<string, string[]>;
}

export interface FoundryOAuthClient extends Entity {
  client_id: string;
  client_secret: string;
  name: string;
  redirect_uris: string[];
  grant_types: FoundryOAuthGrantType[];
  allowed_scopes: string[];
}
