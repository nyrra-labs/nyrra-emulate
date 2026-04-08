import type { Context, RouteContext } from "@emulators/core";
import type { AppEnv } from "@emulators/core";
import {
  buildComputeModuleRuntimeUrls,
  completeComputeModuleJob,
  computeModuleJobEnvelope,
  createOrResetComputeModuleRuntimeSession,
  getComputeModuleJob,
  getComputeModuleRuntime,
  getNextQueuedComputeModuleJob,
  storeComputeModuleSchemas,
} from "../compute-modules/helpers.js";
import { getFoundryStore } from "../store.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function computeModuleBadRequest(c: Context<AppEnv>, errorDescription: string): Response {
  return c.json(
    {
      error: "invalid_request",
      error_description: errorDescription,
    },
    400,
  );
}

function computeModuleNotFound(c: Context<AppEnv>, errorDescription: string): Response {
  return c.json(
    {
      error: "not_found",
      error_description: errorDescription,
    },
    404,
  );
}

function computeModuleUnauthorized(c: Context<AppEnv>): Response {
  return c.json(
    {
      error: "invalid_module_auth_token",
      error_description: "The Module-Auth-Token header is invalid.",
    },
    401,
  );
}

export function computeModuleRuntimeRoutes({ app, store, baseUrl }: RouteContext): void {
  app.post("/_emulate/foundry/compute-modules/runtimes", async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!isRecord(body)) {
      return computeModuleBadRequest(c, "Request body must be a JSON object.");
    }

    const runtimeId = typeof body.runtimeId === "string" ? body.runtimeId.trim() : "";
    if (!runtimeId) {
      return computeModuleBadRequest(c, "The runtimeId field is required.");
    }

    const deployedAppRid = typeof body.deployedAppRid === "string" && body.deployedAppRid.trim()
      ? body.deployedAppRid.trim()
      : null;
    const branch = typeof body.branch === "string" && body.branch.trim() ? body.branch.trim() : null;
    const displayName = typeof body.displayName === "string" && body.displayName.trim() ? body.displayName : null;

    const { runtime } = createOrResetComputeModuleRuntimeSession(store, {
      runtimeId,
      deployedAppRid,
      branch,
      displayName,
    });
    const urls = buildComputeModuleRuntimeUrls(baseUrl, runtimeId);

    return c.json({
      runtimeId,
      moduleAuthToken: runtime.module_auth_token,
      getJobUri: urls.getJobUri,
      postResultUri: urls.postResultUri,
      postSchemaUri: urls.postSchemaUri,
    });
  });

  app.get("/_emulate/foundry/compute-modules/runtimes/:runtimeId/job", (c) => {
    const runtimeId = c.req.param("runtimeId");
    const runtime = getComputeModuleRuntime(store, runtimeId);
    if (!runtime) {
      return computeModuleNotFound(c, `Unknown runtime '${runtimeId}'.`);
    }
    if (c.req.header("Module-Auth-Token") !== runtime.module_auth_token) {
      return computeModuleUnauthorized(c);
    }

    const job = getNextQueuedComputeModuleJob(store, runtimeId);
    if (!job) {
      return new Response(null, { status: 204 });
    }

    return c.json(computeModuleJobEnvelope(job));
  });

  app.post("/_emulate/foundry/compute-modules/runtimes/:runtimeId/schemas", async (c) => {
    const runtimeId = c.req.param("runtimeId");
    const runtime = getComputeModuleRuntime(store, runtimeId);
    if (!runtime) {
      return computeModuleNotFound(c, `Unknown runtime '${runtimeId}'.`);
    }
    if (c.req.header("Module-Auth-Token") !== runtime.module_auth_token) {
      return computeModuleUnauthorized(c);
    }

    const body = await c.req.json().catch(() => null);
    if (body === null) {
      return computeModuleBadRequest(c, "Schema payload must be valid JSON.");
    }

    storeComputeModuleSchemas(store, runtimeId, body);
    return c.json({});
  });

  app.post("/_emulate/foundry/compute-modules/runtimes/:runtimeId/results/:jobId", async (c) => {
    const runtimeId = c.req.param("runtimeId");
    const jobId = c.req.param("jobId");
    const runtime = getComputeModuleRuntime(store, runtimeId);
    if (!runtime) {
      return computeModuleNotFound(c, `Unknown runtime '${runtimeId}'.`);
    }
    if (c.req.header("Module-Auth-Token") !== runtime.module_auth_token) {
      return computeModuleUnauthorized(c);
    }

    const rawBody = Buffer.from(await c.req.arrayBuffer()).toString("utf8");
    const contentType = c.req.header("Content-Type")?.split(";")[0]?.trim() || "application/octet-stream";
    const job = completeComputeModuleJob(store, runtimeId, jobId, rawBody, contentType);
    if (!job) {
      return computeModuleNotFound(c, `Unknown job '${jobId}' for runtime '${runtimeId}'.`);
    }

    return c.json({});
  });

  app.get("/_emulate/foundry/compute-modules/runtimes/:runtimeId/jobs/:jobId", (c) => {
    const runtimeId = c.req.param("runtimeId");
    const jobId = c.req.param("jobId");
    const runtime = getComputeModuleRuntime(store, runtimeId);
    if (!runtime) {
      return computeModuleNotFound(c, `Unknown runtime '${runtimeId}'.`);
    }

    const job = getComputeModuleJob(store, jobId);
    if (!job || job.runtime_id !== runtimeId) {
      return computeModuleNotFound(c, `Unknown job '${jobId}' for runtime '${runtimeId}'.`);
    }

    const fs = getFoundryStore(store);
    const schemas = fs.computeModuleSchemas
      .findBy("runtime_id", runtimeId)
      .sort((a, b) => a.function_name.localeCompare(b.function_name));

    return c.json({
      runtime,
      job,
      schemas,
    });
  });
}
