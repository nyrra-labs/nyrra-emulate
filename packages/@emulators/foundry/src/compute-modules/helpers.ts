import type { Store } from "@emulators/core";
import { foundryId } from "../helpers.js";
import { getFoundryStore } from "../store.js";
import type {
  FoundryComputeModuleDeployedApp,
  FoundryComputeModuleJob,
  FoundryComputeModuleJobStatus,
  FoundryComputeModuleJobSource,
  FoundryComputeModuleRuntime,
  FoundryComputeModuleSchema,
} from "./entities.js";

const DEFAULT_WAIT_TIMEOUT_MS = 30_000;
const JOB_WAIT_POLL_INTERVAL_MS = 10;

type SchemaEntry = {
  functionName: string;
  schemaPayload: unknown;
};

export interface CreateComputeModuleRuntimeInput {
  runtimeId: string;
  deployedAppRid?: string | null;
  branch?: string | null;
  displayName?: string | null;
  moduleAuthToken?: string;
}

export interface EnqueueComputeModuleJobInput {
  runtimeId: string;
  deployedAppRid?: string | null;
  deployedAppBranch?: string | null;
  queryType: string;
  query: unknown;
  source: FoundryComputeModuleJobSource;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextModuleAuthToken(): string {
  return foundryId("foundry_module_auth");
}

function nextJobId(): string {
  return foundryId("foundry_job");
}

function deleteCollectionItems<T extends { id: number }>(items: T[], deleter: (id: number) => boolean): void {
  for (const item of items) {
    deleter(item.id);
  }
}

function extractNamedSchemaEntries(value: unknown): SchemaEntry[] {
  if (!isRecord(value)) return [];

  const functionName = typeof value.functionName === "string"
    ? value.functionName
    : typeof value.function_name === "string"
      ? value.function_name
      : typeof value.name === "string"
        ? value.name
        : null;

  if (!functionName) return [];

  if ("schema" in value) {
    return [{ functionName, schemaPayload: value.schema }];
  }
  if ("schemaPayload" in value) {
    return [{ functionName, schemaPayload: value.schemaPayload }];
  }

  return [{ functionName, schemaPayload: value }];
}

function extractSchemaEntries(payload: unknown): SchemaEntry[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((item) => extractSchemaEntries(item));
  }

  if (!isRecord(payload)) return [];

  if (Array.isArray(payload.functions)) {
    return payload.functions.flatMap((item) => extractSchemaEntries(item));
  }
  if (Array.isArray(payload.schemas)) {
    return payload.schemas.flatMap((item) => extractSchemaEntries(item));
  }

  const namedEntries = extractNamedSchemaEntries(payload);
  if (namedEntries.length > 0) {
    return namedEntries;
  }

  return Object.entries(payload).map(([functionName, schemaPayload]) => ({
    functionName,
    schemaPayload,
  }));
}

function statusTiming(job: FoundryComputeModuleJob): {
  type: "queuedJob";
  queuedJob: {
    multiplexerSubmitTimeMillis: number;
    queueSubmitTimeMillis: number;
    queuedJobDispatchTimeMillis: number;
    moduleSubmitTimeMillis: number;
  };
} {
  const submitTime = job.queued_at;
  const dispatchTime = job.started_at ?? submitTime;

  return {
    type: "queuedJob",
    queuedJob: {
      multiplexerSubmitTimeMillis: submitTime,
      queueSubmitTimeMillis: submitTime,
      queuedJobDispatchTimeMillis: dispatchTime,
      moduleSubmitTimeMillis: dispatchTime,
    },
  };
}

export function isTerminalComputeModuleJobStatus(status: FoundryComputeModuleJobStatus): boolean {
  return status === "succeeded" || status === "failed";
}

export function getComputeModuleRuntime(store: Store, runtimeId: string): FoundryComputeModuleRuntime | null {
  return getFoundryStore(store).computeModuleRuntimes.findOneBy("runtime_id", runtimeId) ?? null;
}

export function ensureComputeModuleRuntime(
  store: Store,
  runtimeId: string,
  moduleAuthToken: string = nextModuleAuthToken(),
): FoundryComputeModuleRuntime {
  const fs = getFoundryStore(store);
  const existing = fs.computeModuleRuntimes.findOneBy("runtime_id", runtimeId);
  if (existing) return existing;

  return fs.computeModuleRuntimes.insert({
    runtime_id: runtimeId,
    module_auth_token: moduleAuthToken,
    last_poll_at: null,
    last_schema_post_at: null,
    connected: false,
  });
}

export function bindComputeModuleDeployedApp(
  store: Store,
  input: {
    deployedAppRid: string;
    branch?: string | null;
    runtimeId: string;
    displayName?: string | null;
    active?: boolean;
  },
): FoundryComputeModuleDeployedApp {
  const fs = getFoundryStore(store);
  const branch = input.branch && input.branch.trim() ? input.branch : "master";

  deleteCollectionItems(
    fs.computeModuleDeployedApps
      .all()
      .filter(
        (item) =>
          item.runtime_id === input.runtimeId ||
          (item.deployed_app_rid === input.deployedAppRid && item.branch === branch),
      ),
    (id) => fs.computeModuleDeployedApps.delete(id),
  );

  return fs.computeModuleDeployedApps.insert({
    deployed_app_rid: input.deployedAppRid,
    branch,
    runtime_id: input.runtimeId,
    display_name: input.displayName ?? null,
    active: input.active ?? true,
  });
}

export function createOrResetComputeModuleRuntimeSession(
  store: Store,
  input: CreateComputeModuleRuntimeInput,
): {
  runtime: FoundryComputeModuleRuntime;
  deployedApp: FoundryComputeModuleDeployedApp | null;
} {
  const fs = getFoundryStore(store);
  const existingRuntime = fs.computeModuleRuntimes.findOneBy("runtime_id", input.runtimeId);
  const moduleAuthToken = input.moduleAuthToken ?? nextModuleAuthToken();

  deleteCollectionItems(fs.computeModuleJobs.findBy("runtime_id", input.runtimeId), (id) => fs.computeModuleJobs.delete(id));
  deleteCollectionItems(fs.computeModuleSchemas.findBy("runtime_id", input.runtimeId), (id) => fs.computeModuleSchemas.delete(id));
  deleteCollectionItems(
    fs.computeModuleDeployedApps.findBy("runtime_id", input.runtimeId),
    (id) => fs.computeModuleDeployedApps.delete(id),
  );

  const runtime = existingRuntime
    ? fs.computeModuleRuntimes.update(existingRuntime.id, {
        module_auth_token: moduleAuthToken,
        last_poll_at: null,
        last_schema_post_at: null,
        connected: false,
      })!
    : fs.computeModuleRuntimes.insert({
        runtime_id: input.runtimeId,
        module_auth_token: moduleAuthToken,
        last_poll_at: null,
        last_schema_post_at: null,
        connected: false,
      });

  const deployedApp = input.deployedAppRid
    ? bindComputeModuleDeployedApp(store, {
        deployedAppRid: input.deployedAppRid,
        branch: input.branch,
        runtimeId: input.runtimeId,
        displayName: input.displayName,
        active: true,
      })
    : null;

  return { runtime, deployedApp };
}

export function resolveComputeModuleDeployedApp(
  store: Store,
  deployedAppRid: string,
  branch?: string | null,
): FoundryComputeModuleDeployedApp | null {
  const fs = getFoundryStore(store);
  const candidates = fs.computeModuleDeployedApps
    .findBy("deployed_app_rid", deployedAppRid)
    .filter((item) => item.active);

  if (branch && branch.trim()) {
    return candidates.find((item) => item.branch === branch) ?? null;
  }

  return candidates[0] ?? null;
}

export function enqueueComputeModuleJob(store: Store, input: EnqueueComputeModuleJobInput): FoundryComputeModuleJob {
  const fs = getFoundryStore(store);

  return fs.computeModuleJobs.insert({
    job_id: nextJobId(),
    runtime_id: input.runtimeId,
    deployed_app_rid: input.deployedAppRid ?? null,
    deployed_app_branch: input.deployedAppBranch ?? null,
    query_type: input.queryType,
    query: input.query,
    source: input.source,
    status: "queued",
    queued_at: Date.now(),
    started_at: null,
    completed_at: null,
    result_content_type: null,
    result_body_utf8: null,
    error_message: null,
  });
}

export function getComputeModuleJob(store: Store, jobId: string): FoundryComputeModuleJob | null {
  return getFoundryStore(store).computeModuleJobs.findOneBy("job_id", jobId) ?? null;
}

export function getNextQueuedComputeModuleJob(store: Store, runtimeId: string): FoundryComputeModuleJob | null {
  const fs = getFoundryStore(store);
  const runtime = fs.computeModuleRuntimes.findOneBy("runtime_id", runtimeId);
  if (!runtime) return null;

  const now = Date.now();
  fs.computeModuleRuntimes.update(runtime.id, {
    connected: true,
    last_poll_at: now,
  });

  const nextQueuedJob = fs.computeModuleJobs
    .findBy("runtime_id", runtimeId)
    .filter((job) => job.status === "queued")
    .sort((a, b) => a.queued_at - b.queued_at)[0];

  if (!nextQueuedJob) return null;

  return fs.computeModuleJobs.update(nextQueuedJob.id, {
    status: "running",
    started_at: now,
  })!;
}

export function storeComputeModuleSchemas(
  store: Store,
  runtimeId: string,
  payload: unknown,
): FoundryComputeModuleSchema[] {
  const fs = getFoundryStore(store);
  const runtime = fs.computeModuleRuntimes.findOneBy("runtime_id", runtimeId);
  if (!runtime) return [];

  const now = Date.now();
  const entries = extractSchemaEntries(payload);

  for (const entry of entries) {
    const existing = fs.computeModuleSchemas
      .findBy("runtime_id", runtimeId)
      .find((schema) => schema.function_name === entry.functionName);

    if (existing) {
      fs.computeModuleSchemas.update(existing.id, {
        schema_payload: entry.schemaPayload,
        posted_at: now,
      });
    } else {
      fs.computeModuleSchemas.insert({
        runtime_id: runtimeId,
        function_name: entry.functionName,
        schema_payload: entry.schemaPayload,
        posted_at: now,
      });
    }
  }

  fs.computeModuleRuntimes.update(runtime.id, {
    connected: true,
    last_schema_post_at: now,
  });

  return fs.computeModuleSchemas.findBy("runtime_id", runtimeId);
}

export function completeComputeModuleJob(
  store: Store,
  runtimeId: string,
  jobId: string,
  resultBodyUtf8: string,
  resultContentType: string | null,
): FoundryComputeModuleJob | null {
  const fs = getFoundryStore(store);
  const job = fs.computeModuleJobs.findOneBy("job_id", jobId);
  if (!job || job.runtime_id !== runtimeId) return null;

  return fs.computeModuleJobs.update(job.id, {
    status: "succeeded",
    started_at: job.started_at ?? Date.now(),
    completed_at: Date.now(),
    result_content_type: resultContentType ?? "application/octet-stream",
    result_body_utf8: resultBodyUtf8,
    error_message: null,
  })!;
}

export async function waitForComputeModuleJob(
  store: Store,
  jobId: string,
  timeoutMs: number = DEFAULT_WAIT_TIMEOUT_MS,
): Promise<FoundryComputeModuleJob | null> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() <= deadline) {
    const job = getComputeModuleJob(store, jobId);
    if (!job) return null;
    if (isTerminalComputeModuleJobStatus(job.status)) {
      return job;
    }
    await sleep(JOB_WAIT_POLL_INTERVAL_MS);
  }

  return getComputeModuleJob(store, jobId);
}

export function buildComputeModuleRuntimeUrls(baseUrl: string, runtimeId: string): {
  getJobUri: string;
  postResultUri: string;
  postSchemaUri: string;
} {
  const runtimePath = `${baseUrl}/_emulate/foundry/compute-modules/runtimes/${encodeURIComponent(runtimeId)}`;

  return {
    getJobUri: `${runtimePath}/job`,
    postResultUri: `${runtimePath}/results`,
    postSchemaUri: `${runtimePath}/schemas`,
  };
}

export function computeModuleJobEnvelope(job: FoundryComputeModuleJob): {
  type: "computeModuleJobV1";
  computeModuleJobV1: {
    jobId: string;
    queryType: string;
    query: unknown;
  };
} {
  return {
    type: "computeModuleJobV1",
    computeModuleJobV1: {
      jobId: job.job_id,
      queryType: job.query_type,
      query: job.query,
    },
  };
}

export function computeModuleAsyncJobHandle(jobId: string): string {
  return JSON.stringify({
    type: "v1",
    jobId,
    nodeId: null,
    moduleId: null,
    persistJobResult: null,
  });
}

export function parseComputeModuleAsyncJobHandle(jobHandle: unknown): { jobId: string } | null {
  if (typeof jobHandle !== "string") return null;

  try {
    const parsed = JSON.parse(jobHandle) as Record<string, unknown>;
    return typeof parsed.jobId === "string" ? { jobId: parsed.jobId } : null;
  } catch {
    return null;
  }
}

export function computeModuleJobStatusPayload(job: FoundryComputeModuleJob): Record<string, unknown> {
  switch (job.status) {
    case "queued":
      return {
        type: "queued",
        queued: {
          queueInfo: "NORMAL_OPERATION",
        },
      };
    case "running":
      return {
        type: "running",
        running: {
          metadata: null,
          intermediateJobInfoList: [],
          multiplexerJobTiming: statusTiming(job),
        },
      };
    case "succeeded":
      return {
        type: "succeeded",
        succeeded: {
          metadata: null,
          intermediateJobInfoList: [],
          multiplexerJobTiming: statusTiming(job),
        },
      };
    case "failed":
      return {
        type: "failed",
        failed: {
          message: job.error_message ?? "Compute module job failed.",
        },
      };
  }
}
