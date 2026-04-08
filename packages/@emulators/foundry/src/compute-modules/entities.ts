import type { Entity } from "@emulators/core";

export type FoundryComputeModuleJobSource = "runtime-direct" | "contour-sync" | "contour-async";
export type FoundryComputeModuleJobStatus = "queued" | "running" | "succeeded" | "failed";

export interface FoundryComputeModuleDeployedApp extends Entity {
  deployed_app_rid: string;
  branch: string;
  runtime_id: string;
  display_name: string | null;
  active: boolean;
}

export interface FoundryComputeModuleRuntime extends Entity {
  runtime_id: string;
  module_auth_token: string;
  last_poll_at: number | null;
  last_schema_post_at: number | null;
  connected: boolean;
}

export interface FoundryComputeModuleJob extends Entity {
  job_id: string;
  runtime_id: string;
  deployed_app_rid: string | null;
  deployed_app_branch: string | null;
  query_type: string;
  query: unknown;
  source: FoundryComputeModuleJobSource;
  status: FoundryComputeModuleJobStatus;
  queued_at: number;
  started_at: number | null;
  completed_at: number | null;
  result_content_type: string | null;
  result_body_utf8: string | null;
  error_message: string | null;
}

export interface FoundryComputeModuleSchema extends Entity {
  runtime_id: string;
  function_name: string;
  schema_payload: unknown;
  posted_at: number;
}
