import { requireAuth, type Context, type RouteContext } from "@emulators/core";
import type { AppEnv } from "@emulators/core";
import {
  computeModuleAsyncJobHandle,
  computeModuleJobStatusPayload,
  enqueueComputeModuleJob,
  getComputeModuleJob,
  isTerminalComputeModuleJobStatus,
  parseComputeModuleAsyncJobHandle,
  resolveComputeModuleDeployedApp,
  waitForComputeModuleJob,
} from "../compute-modules/helpers.js";

const CONTOUR_BASE_PATH = "/contour-backend-multiplexer/api/module-group-multiplexer";

type ExecuteRequest = {
  deployedAppRid: string;
  deployedAppBranch: string | null;
  queryType: string;
  query: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function contourBadRequest(c: Context<AppEnv>, errorDescription: string): Response {
  return c.json(
    {
      error: "invalid_request",
      error_description: errorDescription,
    },
    400,
  );
}

function contourNotFound(c: Context<AppEnv>, errorDescription: string): Response {
  return c.json(
    {
      error: "not_found",
      error_description: errorDescription,
    },
    404,
  );
}

function contourJobNotReady(c: Context<AppEnv>, errorDescription: string): Response {
  return c.json(
    {
      error: "job_not_ready",
      error_description: errorDescription,
    },
    409,
  );
}

function parseExecuteRequest(payload: unknown): ExecuteRequest | null {
  if (!isRecord(payload)) return null;

  const deployedAppRid = typeof payload.deployedAppRid === "string" ? payload.deployedAppRid.trim() : "";
  const queryType = typeof payload.queryType === "string" ? payload.queryType.trim() : "";
  if (!deployedAppRid || !queryType) return null;

  return {
    deployedAppRid,
    deployedAppBranch:
      typeof payload.deployedAppBranch === "string" && payload.deployedAppBranch.trim()
        ? payload.deployedAppBranch.trim()
        : null,
    queryType,
    query: "query" in payload ? payload.query : {},
  };
}

function rawResultResponse(body: string | null): Response {
  return new Response(body ?? "", {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });
}

export function computeModuleContourRoutes({ app, store }: RouteContext): void {
  app.post(`${CONTOUR_BASE_PATH}/compute-modules/jobs/execute`, requireAuth(), async (c) => {
    const body = await c.req.json().catch(() => null);
    const request = parseExecuteRequest(body);
    if (!request) {
      return contourBadRequest(
        c,
        "Request body must include deployedAppRid, queryType, and an optional deployedAppBranch.",
      );
    }

    const deployedApp = resolveComputeModuleDeployedApp(store, request.deployedAppRid, request.deployedAppBranch);
    if (!deployedApp) {
      return contourNotFound(c, `No active compute-module runtime is bound to '${request.deployedAppRid}'.`);
    }

    const job = enqueueComputeModuleJob(store, {
      runtimeId: deployedApp.runtime_id,
      deployedAppRid: deployedApp.deployed_app_rid,
      deployedAppBranch: deployedApp.branch,
      queryType: request.queryType,
      query: request.query,
      source: "contour-sync",
    });

    const completedJob = await waitForComputeModuleJob(store, job.job_id);
    if (!completedJob || !isTerminalComputeModuleJobStatus(completedJob.status)) {
      return c.json(
        {
          error: "job_timeout",
          error_description: `Timed out waiting for compute-module job '${job.job_id}'.`,
        },
        504,
      );
    }
    if (completedJob.status === "failed") {
      return c.json(
        {
          error: "job_failed",
          error_description: completedJob.error_message ?? "Compute module job failed.",
        },
        500,
      );
    }

    return rawResultResponse(completedJob.result_body_utf8);
  });

  app.post(`${CONTOUR_BASE_PATH}/deployed-apps/jobs`, requireAuth(), async (c) => {
    const body = await c.req.json().catch(() => null);
    const request = parseExecuteRequest(body);
    if (!request) {
      return contourBadRequest(
        c,
        "Request body must include deployedAppRid, queryType, and an optional deployedAppBranch.",
      );
    }

    const deployedApp = resolveComputeModuleDeployedApp(store, request.deployedAppRid, request.deployedAppBranch);
    if (!deployedApp) {
      return contourNotFound(c, `No active compute-module runtime is bound to '${request.deployedAppRid}'.`);
    }

    const job = enqueueComputeModuleJob(store, {
      runtimeId: deployedApp.runtime_id,
      deployedAppRid: deployedApp.deployed_app_rid,
      deployedAppBranch: deployedApp.branch,
      queryType: request.queryType,
      query: request.query,
      source: "contour-async",
    });

    return c.json({
      id: job.job_id,
      nodeId: null,
      moduleId: null,
      jobHandle: computeModuleAsyncJobHandle(job.job_id),
      persistJobResult: null,
      status: computeModuleJobStatusPayload(job),
    });
  });

  app.get(`${CONTOUR_BASE_PATH}/jobs/:jobId/status`, requireAuth(), (c) => {
    const jobId = c.req.param("jobId");
    const job = getComputeModuleJob(store, jobId);
    if (!job) {
      return contourNotFound(c, `Unknown compute-module job '${jobId}'.`);
    }

    return c.json(computeModuleJobStatusPayload(job));
  });

  app.put(`${CONTOUR_BASE_PATH}/jobs/result/v2`, requireAuth(), async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!isRecord(body)) {
      return contourBadRequest(c, "Request body must be a JSON object.");
    }

    const jobId = typeof body.id === "string" ? body.id : parseComputeModuleAsyncJobHandle(body.jobHandle)?.jobId;
    if (!jobId) {
      return contourBadRequest(c, "Request body must include an id or a valid jobHandle.");
    }

    const job = getComputeModuleJob(store, jobId);
    if (!job) {
      return contourNotFound(c, `Unknown compute-module job '${jobId}'.`);
    }
    if (job.status !== "succeeded") {
      return contourJobNotReady(c, `Compute-module job '${jobId}' has not completed successfully.`);
    }

    return rawResultResponse(job.result_body_utf8);
  });
}
