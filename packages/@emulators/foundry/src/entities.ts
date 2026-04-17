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

export interface FoundryEnrollment extends Entity {
  enrollment_rid: string;
  name: string;
  created_time: string | null;
}

export interface FoundryConnection extends Entity {
  rid: string;
  display_name: string;
  parent_folder_rid: string;
  config_type: "rest";
  config_domains: Array<{
    host: string;
    port?: number;
    scheme?: "HTTP" | "HTTPS";
    auth?: Record<string, unknown>;
  }>;
  config_oauth2_client_rid: string | null;
  worker_type: "unknownWorker" | "foundryWorker";
  worker_network_egress_policy_rids: string[];
  secrets: Record<string, string>;
  exports_enabled: boolean;
  export_enabled_without_markings_validation: boolean;
}

export interface FoundryOntology extends Entity {
  rid: string;
  api_name: string;
  display_name: string;
  description: string | null;
}

export interface FoundryOntologyQueryResult extends Entity {
  ontology_rid: string;
  query_api_name: string;
  result_json: string;
}
