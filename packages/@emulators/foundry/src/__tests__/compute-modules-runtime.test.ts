import { describe, expect, it } from "vitest";
import { getFoundryStore, seedFromConfig } from "../index.js";
import { enqueueComputeModuleJob, resolveComputeModuleDeployedApp } from "../compute-modules/helpers.js";
import { authHeader, base, createFoundryTestApp, createRuntimeSession } from "./test-helpers.js";

describe("Foundry compute-module runtime routes", () => {
  it("creates runtime sessions with usable URLs", async () => {
    const { app } = createFoundryTestApp();

    const body = await createRuntimeSession(app, {
      runtimeId: "agent-loop",
      deployedAppRid: "ri.foundry.main.deployed-app.agent-loop",
      branch: "master",
      displayName: "Agent Loop",
    });

    expect(body.runtimeId).toBe("agent-loop");
    expect(body.moduleAuthToken).toBeTruthy();
    expect(body.getJobUri).toBe(`${base}/_emulate/foundry/compute-modules/runtimes/agent-loop/job`);
    expect(body.postResultUri).toBe(`${base}/_emulate/foundry/compute-modules/runtimes/agent-loop/results`);
    expect(body.postSchemaUri).toBe(`${base}/_emulate/foundry/compute-modules/runtimes/agent-loop/schemas`);
  });

  it("seeds compute-module runtimes and deployed apps from config", () => {
    const { store } = createFoundryTestApp();

    seedFromConfig(store, base, {
      compute_modules: {
        runtimes: [{ runtime_id: "seeded-runtime", module_auth_token: "seeded-token" }],
        deployed_apps: [
          {
            deployed_app_rid: "ri.foundry.main.deployed-app.seeded",
            branch: "master",
            runtime_id: "seeded-runtime",
            display_name: "Seeded Runtime",
            active: true,
          },
        ],
      },
    });

    const fs = getFoundryStore(store);
    expect(fs.computeModuleRuntimes.findOneBy("runtime_id", "seeded-runtime")?.module_auth_token).toBe("seeded-token");
    expect(resolveComputeModuleDeployedApp(store, "ri.foundry.main.deployed-app.seeded", "master")?.runtime_id).toBe(
      "seeded-runtime",
    );
  });

  it("returns 401 for a wrong Module-Auth-Token", async () => {
    const { app } = createFoundryTestApp();
    const runtime = await createRuntimeSession(app);

    const res = await app.request(`${base}/_emulate/foundry/compute-modules/runtimes/${runtime.runtimeId}/job`, {
      headers: { "Module-Auth-Token": "wrong-token" },
    });

    expect(res.status).toBe(401);
  });

  it("returns 404 for an unknown runtime", async () => {
    const { app } = createFoundryTestApp();

    const res = await app.request(`${base}/_emulate/foundry/compute-modules/runtimes/unknown/job`, {
      headers: { "Module-Auth-Token": "anything" },
    });

    expect(res.status).toBe(404);
  });

  it("returns 204 when no queued runtime job exists", async () => {
    const { app } = createFoundryTestApp();
    const runtime = await createRuntimeSession(app);

    const res = await app.request(`${base}/_emulate/foundry/compute-modules/runtimes/${runtime.runtimeId}/job`, {
      headers: { "Module-Auth-Token": runtime.moduleAuthToken },
    });

    expect(res.status).toBe(204);
  });

  it("returns computeModuleJobV1 envelopes for queued jobs", async () => {
    const { app, store } = createFoundryTestApp();
    const runtime = await createRuntimeSession(app);

    enqueueComputeModuleJob(store, {
      runtimeId: runtime.runtimeId,
      queryType: "health",
      query: {},
      source: "runtime-direct",
    });

    const res = await app.request(`${base}/_emulate/foundry/compute-modules/runtimes/${runtime.runtimeId}/job`, {
      headers: { "Module-Auth-Token": runtime.moduleAuthToken },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      type: string;
      computeModuleJobV1: { jobId: string; queryType: string; query: unknown };
    };
    expect(body.type).toBe("computeModuleJobV1");
    expect(body.computeModuleJobV1.queryType).toBe("health");
    expect(body.computeModuleJobV1.query).toEqual({});
  });

  it("stores latest schemas and exact raw result bodies", async () => {
    const { app, store } = createFoundryTestApp();
    const runtime = await createRuntimeSession(app);
    const job = enqueueComputeModuleJob(store, {
      runtimeId: runtime.runtimeId,
      queryType: "run_stream",
      query: { prompt: "hello" },
      source: "runtime-direct",
    });

    const schemaRes = await app.request(
      `${base}/_emulate/foundry/compute-modules/runtimes/${runtime.runtimeId}/schemas`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Module-Auth-Token": runtime.moduleAuthToken,
        },
        body: JSON.stringify({
          run_stream: {
            inputSchema: { type: "object" },
            outputSchema: { type: "string" },
          },
        }),
      },
    );
    expect(schemaRes.status).toBe(200);

    const pollRes = await app.request(`${base}/_emulate/foundry/compute-modules/runtimes/${runtime.runtimeId}/job`, {
      headers: { "Module-Auth-Token": runtime.moduleAuthToken },
    });
    expect(pollRes.status).toBe(200);

    const rawResult = '{"chunk":1}{"chunk":2}';
    const resultRes = await app.request(
      `${base}/_emulate/foundry/compute-modules/runtimes/${runtime.runtimeId}/results/${job.job_id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Module-Auth-Token": runtime.moduleAuthToken,
        },
        body: rawResult,
      },
    );
    expect(resultRes.status).toBe(200);

    const inspectRes = await app.request(
      `${base}/_emulate/foundry/compute-modules/runtimes/${runtime.runtimeId}/jobs/${job.job_id}`,
      {
        headers: authHeader(),
      },
    );
    expect(inspectRes.status).toBe(200);
    const inspection = (await inspectRes.json()) as {
      job: { status: string; result_body_utf8: string };
      schemas: Array<{ function_name: string }>;
    };
    expect(inspection.job.status).toBe("succeeded");
    expect(inspection.job.result_body_utf8).toBe(rawResult);
    expect(inspection.schemas.map((schema) => schema.function_name)).toEqual(["run_stream"]);

    const fs = getFoundryStore(store);
    expect(fs.computeModuleSchemas.findBy("runtime_id", runtime.runtimeId)).toHaveLength(1);
  });
});
