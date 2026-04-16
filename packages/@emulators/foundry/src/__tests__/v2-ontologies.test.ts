import { describe, expect, it, beforeEach } from "vitest";
import type { Hono } from "hono";
import type { TokenMap } from "@emulators/core";
import { createFoundryTestApp, base, authHeader } from "./test-helpers.js";

describe("Foundry v2 ontology routes", () => {
  let app: Hono;
  let tokenMap: TokenMap;

  beforeEach(() => {
    const setup = createFoundryTestApp({
      ontologies: [
        {
          rid: "ri.ontology.main.ontology.alpha",
          api_name: "alpha",
          display_name: "Alpha Ontology",
          description: "Test ontology",
          queries: [
            {
              api_name: "echoQuery",
              result: { value: { message: "HELLO" } },
            },
          ],
        },
        {
          rid: "ri.ontology.main.ontology.beta",
          api_name: "beta",
          display_name: "Beta Ontology",
        },
      ],
    });
    app = setup.app;
    tokenMap = setup.tokenMap;
    tokenMap.set("ont-read", { login: "jane", id: 1, scopes: ["api:ontologies-read"] });
    tokenMap.set("no-scope", { login: "jane", id: 1, scopes: [] });
  });

  it("GET /api/v2/ontologies lists seeded ontologies", async () => {
    const res = await app.request(`${base}/api/v2/ontologies?pageSize=100`, {
      headers: authHeader("ont-read"),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<Record<string, unknown>>; nextPageToken: string };
    expect(body.data).toHaveLength(2);
    expect(body.data[0].apiName).toBe("alpha");
    expect(body.data[0].rid).toBe("ri.ontology.main.ontology.alpha");
    expect(body.data[0].displayName).toBe("Alpha Ontology");
    expect(body.data[0].description).toBe("Test ontology");
    expect(body.data[1].rid).toBe("ri.ontology.main.ontology.beta");
    expect(body.data[1].description).toBe("");
  });

  it("GET /api/v2/ontologies supports pagination", async () => {
    const res1 = await app.request(`${base}/api/v2/ontologies?pageSize=1`, {
      headers: authHeader("ont-read"),
    });
    expect(res1.status).toBe(200);
    const body1 = (await res1.json()) as { data: unknown[] };
    expect(body1.data).toHaveLength(1);

    const nextPageToken = Buffer.from("1").toString("base64url");
    const res2 = await app.request(`${base}/api/v2/ontologies?pageSize=1&pageToken=${nextPageToken}`, {
      headers: authHeader("ont-read"),
    });
    expect(res2.status).toBe(200);
    const body2 = (await res2.json()) as { data: unknown[] };
    expect(body2.data).toHaveLength(1);
  });

  it("GET /api/v2/ontologies requires api:ontologies-read", async () => {
    const res = await app.request(`${base}/api/v2/ontologies?pageSize=100`, {
      headers: authHeader("no-scope"),
    });
    expect(res.status).toBe(403);
  });

  it("GET /api/v2/ontologies requires auth", async () => {
    const res = await app.request(`${base}/api/v2/ontologies?pageSize=100`);
    expect(res.status).toBe(401);
  });

  it("POST execute query returns seeded result", async () => {
    const res = await app.request(
      `${base}/api/v2/ontologies/ri.ontology.main.ontology.alpha/queries/echoQuery/execute`,
      {
        method: "POST",
        headers: { ...authHeader("ont-read"), "Content-Type": "application/json" },
        body: JSON.stringify({ parameters: { message: "hello" } }),
      },
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({ value: { message: "HELLO" } });
  });

  it("POST execute query resolves ontology by apiName", async () => {
    const res = await app.request(`${base}/api/v2/ontologies/alpha/queries/echoQuery/execute`, {
      method: "POST",
      headers: { ...authHeader("ont-read"), "Content-Type": "application/json" },
      body: JSON.stringify({ parameters: {} }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({ value: { message: "HELLO" } });
  });

  it("POST execute query returns 404 for unknown ontology", async () => {
    const res = await app.request(`${base}/api/v2/ontologies/unknown/queries/echoQuery/execute`, {
      method: "POST",
      headers: { ...authHeader("ont-read"), "Content-Type": "application/json" },
      body: JSON.stringify({ parameters: {} }),
    });

    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.errorCode).toBe("NOT_FOUND");
    expect(body.errorName).toBe("OntologyNotFound");
  });

  it("POST execute query returns 404 for unknown query name", async () => {
    const res = await app.request(
      `${base}/api/v2/ontologies/ri.ontology.main.ontology.alpha/queries/noSuchQuery/execute`,
      {
        method: "POST",
        headers: { ...authHeader("ont-read"), "Content-Type": "application/json" },
        body: JSON.stringify({ parameters: {} }),
      },
    );

    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.errorName).toBe("QueryNotFound");
  });

  it("POST execute query requires api:ontologies-read", async () => {
    const res = await app.request(
      `${base}/api/v2/ontologies/ri.ontology.main.ontology.alpha/queries/echoQuery/execute`,
      {
        method: "POST",
        headers: { ...authHeader("no-scope"), "Content-Type": "application/json" },
        body: JSON.stringify({ parameters: {} }),
      },
    );
    expect(res.status).toBe(403);
  });
});
