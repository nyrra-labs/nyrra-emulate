import { describe, expect, it, beforeEach } from "vitest";
import type { Hono } from "hono";
import type { TokenMap } from "@emulators/core";
import { createFoundryTestApp, base, authHeader } from "./test-helpers.js";

describe("Foundry v2 connectivity routes", () => {
  let app: Hono;
  let tokenMap: TokenMap;

  beforeEach(() => {
    const setup = createFoundryTestApp();
    app = setup.app;
    tokenMap = setup.tokenMap;
    tokenMap.set("conn-read", { login: "jane", id: 1, scopes: ["api:connectivity-connection-read"] });
    tokenMap.set("conn-write", { login: "jane", id: 1, scopes: ["api:connectivity-connection-write"] });
    tokenMap.set("conn-rw", {
      login: "jane",
      id: 1,
      scopes: ["api:connectivity-connection-read", "api:connectivity-connection-write"],
    });
    tokenMap.set("no-scope", { login: "jane", id: 1, scopes: [] });
  });

  async function createConnection(token = "conn-rw"): Promise<Record<string, unknown>> {
    const res = await app.request(`${base}/api/v2/connectivity/connections`, {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: "Test REST Source",
        parentFolderRid: "ri.compass.main.folder.test-project",
        configuration: {
          type: "restConnectionConfiguration",
          domains: [{ host: "api.example.com", port: 443, scheme: "https" }],
        },
      }),
    });
    return (await res.json()) as Record<string, unknown>;
  }

  it("POST /api/v2/connectivity/connections creates a connection", async () => {
    const res = await app.request(`${base}/api/v2/connectivity/connections`, {
      method: "POST",
      headers: { ...authHeader("conn-rw"), "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: "My REST Source",
        parentFolderRid: "ri.compass.main.folder.project-1",
        configuration: {
          type: "restConnectionConfiguration",
          domains: [{ host: "api.example.com", port: 443, scheme: "https" }],
        },
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.rid).toBeDefined();
    expect(typeof body.rid).toBe("string");
    expect((body.rid as string).startsWith("ri.magritte..source.")).toBe(true);
    expect(body.displayName).toBe("My REST Source");
    expect(body.parentFolderRid).toBe("ri.compass.main.folder.project-1");
    expect(body.exportSettings).toEqual({
      exportsEnabled: false,
      exportEnabledWithoutMarkingsValidation: false,
    });
    expect(body.worker).toEqual({ type: "unknownWorker" });
    expect(body.configuration).toEqual({
      type: "rest",
      domains: [{ host: "api.example.com", port: 443, scheme: "HTTPS" }],
    });
  });

  it("POST create connection requires write scope", async () => {
    const res = await app.request(`${base}/api/v2/connectivity/connections`, {
      method: "POST",
      headers: { ...authHeader("conn-read"), "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: "Test",
        parentFolderRid: "ri.compass.main.folder.test",
      }),
    });
    expect(res.status).toBe(403);
  });

  it("POST create connection requires auth", async () => {
    const res = await app.request(`${base}/api/v2/connectivity/connections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Test", parentFolderRid: "test" }),
    });
    expect(res.status).toBe(401);
  });

  it("GET /api/v2/connectivity/connections/:rid returns stored connection", async () => {
    const created = await createConnection();

    const res = await app.request(`${base}/api/v2/connectivity/connections/${created.rid}`, {
      headers: authHeader("conn-read"),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.rid).toBe(created.rid);
    expect(body.displayName).toBe("Test REST Source");
  });

  it("GET connection returns 404 for unknown rid", async () => {
    const res = await app.request(`${base}/api/v2/connectivity/connections/ri.magritte..source.nonexistent`, {
      headers: authHeader("conn-read"),
    });
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.errorCode).toBe("NOT_FOUND");
    expect(body.errorName).toBe("ConnectionNotFound");
    expect(body.parameters).toEqual({ connectionRid: "ri.magritte..source.nonexistent" });
  });

  it("GET connection requires read scope", async () => {
    const created = await createConnection();
    const res = await app.request(`${base}/api/v2/connectivity/connections/${created.rid}`, {
      headers: authHeader("no-scope"),
    });
    expect(res.status).toBe(403);
  });

  it("GET /api/v2/connectivity/connections/:rid/getConfiguration returns config without secrets", async () => {
    const createRes = await app.request(`${base}/api/v2/connectivity/connections`, {
      method: "POST",
      headers: { ...authHeader("conn-rw"), "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: "Secret Source",
        parentFolderRid: "ri.compass.main.folder.test",
        configuration: {
          type: "restConnectionConfiguration",
          domains: [{ host: "secret.example.com" }],
          additionalSecrets: {
            type: "secretsWithPlaintextValues",
            secrets: { API_KEY: "super-secret" },
          },
        },
      }),
    });
    const created = (await createRes.json()) as Record<string, unknown>;

    const res = await app.request(`${base}/api/v2/connectivity/connections/${created.rid}/getConfiguration`, {
      headers: authHeader("conn-read"),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.type).toBe("rest");
    expect(body.domains).toEqual([{ host: "secret.example.com" }]);
    expect(body.additionalSecrets).toEqual({
      type: "asSecretsNames",
      secretNames: ["API_KEY"],
    });
    expect(body).not.toHaveProperty("secrets");
  });

  it("GET getConfiguration returns 404 for unknown connection", async () => {
    const res = await app.request(
      `${base}/api/v2/connectivity/connections/ri.magritte..source.unknown/getConfiguration`,
      { headers: authHeader("conn-read") },
    );
    expect(res.status).toBe(404);
  });

  it("POST /api/v2/connectivity/connections/:rid/updateSecrets returns 204", async () => {
    const created = await createConnection();

    const res = await app.request(`${base}/api/v2/connectivity/connections/${created.rid}/updateSecrets`, {
      method: "POST",
      headers: { ...authHeader("conn-rw"), "Content-Type": "application/json" },
      body: JSON.stringify({
        secrets: { API_KEY: "key-value", API_SECRET: "secret-value" },
      }),
    });

    expect(res.status).toBe(204);
  });

  it("POST updateSecrets does not leak secrets via GET", async () => {
    const created = await createConnection();

    await app.request(`${base}/api/v2/connectivity/connections/${created.rid}/updateSecrets`, {
      method: "POST",
      headers: { ...authHeader("conn-rw"), "Content-Type": "application/json" },
      body: JSON.stringify({ secrets: { API_KEY: "leaked?" } }),
    });

    const connRes = await app.request(`${base}/api/v2/connectivity/connections/${created.rid}`, {
      headers: authHeader("conn-read"),
    });
    const connBody = (await connRes.json()) as Record<string, unknown>;
    expect(JSON.stringify(connBody)).not.toContain("leaked?");

    const configRes = await app.request(`${base}/api/v2/connectivity/connections/${created.rid}/getConfiguration`, {
      headers: authHeader("conn-read"),
    });
    const configBody = (await configRes.json()) as Record<string, unknown>;
    expect(JSON.stringify(configBody)).not.toContain("leaked?");
  });

  it("POST updateSecrets merges new keys without deleting omitted secret names", async () => {
    const createRes = await app.request(`${base}/api/v2/connectivity/connections`, {
      method: "POST",
      headers: { ...authHeader("conn-rw"), "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: "Merge Secrets Source",
        parentFolderRid: "ri.compass.main.folder.test",
        configuration: {
          type: "rest",
          domains: [{ host: "merge.example.com" }],
          additionalSecrets: {
            type: "asSecretsWithPlaintextValues",
            secrets: { API_KEY: "first-secret" },
          },
        },
      }),
    });
    const created = (await createRes.json()) as Record<string, unknown>;

    const updateRes = await app.request(`${base}/api/v2/connectivity/connections/${created.rid}/updateSecrets`, {
      method: "POST",
      headers: { ...authHeader("conn-rw"), "Content-Type": "application/json" },
      body: JSON.stringify({ secrets: { API_SECRET: "second-secret" } }),
    });
    expect(updateRes.status).toBe(204);

    const configRes = await app.request(`${base}/api/v2/connectivity/connections/${created.rid}/getConfiguration`, {
      headers: authHeader("conn-read"),
    });
    const configBody = (await configRes.json()) as Record<string, unknown>;
    expect(configBody.additionalSecrets).toEqual({
      type: "asSecretsNames",
      secretNames: ["API_KEY", "API_SECRET"],
    });
  });

  it("POST updateSecrets requires write scope", async () => {
    const created = await createConnection();
    const res = await app.request(`${base}/api/v2/connectivity/connections/${created.rid}/updateSecrets`, {
      method: "POST",
      headers: { ...authHeader("conn-read"), "Content-Type": "application/json" },
      body: JSON.stringify({ secrets: { KEY: "val" } }),
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.errorName).toBe("UpdateSecretsForConnectionPermissionDenied");
    expect(body.parameters).toEqual({ connectionRid: created.rid });
  });

  it("POST updateSecrets returns 404 for unknown connection", async () => {
    const res = await app.request(`${base}/api/v2/connectivity/connections/ri.magritte..source.nope/updateSecrets`, {
      method: "POST",
      headers: { ...authHeader("conn-rw"), "Content-Type": "application/json" },
      body: JSON.stringify({ secrets: { KEY: "val" } }),
    });
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.errorName).toBe("ConnectionNotFound");
    expect(body.parameters).toEqual({ connectionRid: "ri.magritte..source.nope" });
  });
});
