import { describe, expect, it } from "vitest";
import { authHeader, base, createFoundryTestApp, createRuntimeSession } from "./test-helpers.js";

async function waitForRuntimeJob(
  app: ReturnType<typeof createFoundryTestApp>["app"],
  runtimeId: string,
  moduleAuthToken: string,
): Promise<{ computeModuleJobV1: { jobId: string } }> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const res = await app.request(`${base}/_emulate/foundry/compute-modules/runtimes/${runtimeId}/job`, {
      headers: { "Module-Auth-Token": moduleAuthToken },
    });
    if (res.status === 200) {
      return (await res.json()) as { computeModuleJobV1: { jobId: string } };
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  throw new Error(`Timed out waiting for runtime job on '${runtimeId}'.`);
}

describe("Foundry compute-module contour routes", () => {
  it("requires bearer auth for contour execute", async () => {
    const { app } = createFoundryTestApp();

    const res = await app.request(
      `${base}/contour-backend-multiplexer/api/module-group-multiplexer/compute-modules/jobs/execute`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deployedAppRid: "ri.foundry.main.deployed-app.agent-loop",
          deployedAppBranch: "master",
          queryType: "health",
          query: {},
        }),
      },
    );

    expect(res.status).toBe(401);
  });

  it("returns raw single JSON bodies for sync execute", async () => {
    const { app } = createFoundryTestApp();
    const runtime = await createRuntimeSession(app, {
      runtimeId: "agent-loop",
      deployedAppRid: "ri.foundry.main.deployed-app.agent-loop",
      branch: "master",
      displayName: "Agent Loop",
    });

    const executePromise = app.request(
      `${base}/contour-backend-multiplexer/api/module-group-multiplexer/compute-modules/jobs/execute`,
      {
        method: "POST",
        headers: {
          ...authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deployedAppRid: "ri.foundry.main.deployed-app.agent-loop",
          deployedAppBranch: "master",
          queryType: "health",
          query: {},
        }),
      },
    );

    const pollBody = await waitForRuntimeJob(app, runtime.runtimeId, runtime.moduleAuthToken);

    await app.request(
      `${base}/_emulate/foundry/compute-modules/runtimes/${runtime.runtimeId}/results/${pollBody.computeModuleJobV1.jobId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Module-Auth-Token": runtime.moduleAuthToken,
        },
        body: '{"ok":true}',
      },
    );

    const executeRes = await executePromise;
    expect(executeRes.status).toBe(200);
    expect(executeRes.headers.get("content-type")).toMatch(/application\/octet-stream/);
    expect(await executeRes.text()).toBe('{"ok":true}');
  });

  it("returns raw concatenated JSON bodies for streaming sync execute", async () => {
    const { app } = createFoundryTestApp();
    const runtime = await createRuntimeSession(app, {
      runtimeId: "agent-loop",
      deployedAppRid: "ri.foundry.main.deployed-app.agent-loop",
      branch: "master",
    });

    const executePromise = app.request(
      `${base}/contour-backend-multiplexer/api/module-group-multiplexer/compute-modules/jobs/execute`,
      {
        method: "POST",
        headers: {
          ...authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deployedAppRid: "ri.foundry.main.deployed-app.agent-loop",
          deployedAppBranch: "master",
          queryType: "run_stream",
          query: { prompt: "hello" },
        }),
      },
    );

    const pollBody = await waitForRuntimeJob(app, runtime.runtimeId, runtime.moduleAuthToken);
    const rawResult = '{"step":1}{"step":2}';

    await app.request(
      `${base}/_emulate/foundry/compute-modules/runtimes/${runtime.runtimeId}/results/${pollBody.computeModuleJobV1.jobId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Module-Auth-Token": runtime.moduleAuthToken,
        },
        body: rawResult,
      },
    );

    const executeRes = await executePromise;
    expect(executeRes.status).toBe(200);
    expect(await executeRes.text()).toBe(rawResult);
  });

  it("returns queued handles for async jobs and transitions status to succeeded", async () => {
    const { app } = createFoundryTestApp();
    const runtime = await createRuntimeSession(app, {
      runtimeId: "agent-loop",
      deployedAppRid: "ri.foundry.main.deployed-app.agent-loop",
      branch: "master",
    });

    const submitRes = await app.request(
      `${base}/contour-backend-multiplexer/api/module-group-multiplexer/deployed-apps/jobs`,
      {
        method: "POST",
        headers: {
          ...authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deployedAppRid: "ri.foundry.main.deployed-app.agent-loop",
          deployedAppBranch: "master",
          queryType: "run_once",
          query: { prompt: "hello" },
        }),
      },
    );

    expect(submitRes.status).toBe(200);
    const submitBody = (await submitRes.json()) as {
      id: string;
      jobHandle: string;
      status: { type: string };
    };
    expect(submitBody.status.type).toBe("queued");

    const queuedStatusRes = await app.request(
      `${base}/contour-backend-multiplexer/api/module-group-multiplexer/jobs/${submitBody.id}/status`,
      {
        headers: authHeader(),
      },
    );
    expect(((await queuedStatusRes.json()) as { type: string }).type).toBe("queued");

    const pollRes = await app.request(`${base}/_emulate/foundry/compute-modules/runtimes/${runtime.runtimeId}/job`, {
      headers: { "Module-Auth-Token": runtime.moduleAuthToken },
    });
    const pollBody = (await pollRes.json()) as { computeModuleJobV1: { jobId: string } };

    const runningStatusRes = await app.request(
      `${base}/contour-backend-multiplexer/api/module-group-multiplexer/jobs/${submitBody.id}/status`,
      {
        headers: authHeader(),
      },
    );
    expect(((await runningStatusRes.json()) as { type: string }).type).toBe("running");

    await app.request(
      `${base}/_emulate/foundry/compute-modules/runtimes/${runtime.runtimeId}/results/${pollBody.computeModuleJobV1.jobId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Module-Auth-Token": runtime.moduleAuthToken,
        },
        body: '{"done":true}',
      },
    );

    const succeededStatusRes = await app.request(
      `${base}/contour-backend-multiplexer/api/module-group-multiplexer/jobs/${submitBody.id}/status`,
      {
        headers: authHeader(),
      },
    );
    expect(((await succeededStatusRes.json()) as { type: string }).type).toBe("succeeded");

    const resultRes = await app.request(
      `${base}/contour-backend-multiplexer/api/module-group-multiplexer/jobs/result/v2`,
      {
        method: "PUT",
        headers: {
          ...authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: submitBody.id,
          jobHandle: submitBody.jobHandle,
          status: submitBody.status,
        }),
      },
    );

    expect(resultRes.status).toBe(200);
    expect(resultRes.headers.get("content-type")).toMatch(/application\/octet-stream/);
    expect(await resultRes.text()).toBe('{"done":true}');
  });
});
