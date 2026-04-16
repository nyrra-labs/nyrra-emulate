import { describe, expect, it } from "vitest";
import { FOUNDRY_ROUTES } from "../route-registry.js";

function routeAuth(method: string, path: string): string | undefined {
  return FOUNDRY_ROUTES.find((route) => route.method === method && route.path === path)?.auth;
}

function routeScopes(method: string, path: string): readonly string[] | undefined {
  return FOUNDRY_ROUTES.find((route) => route.method === method && route.path === path)?.requiredScopes;
}

describe("FOUNDRY_ROUTES auth metadata", () => {
  it("marks the token endpoint as form-authenticated rather than header-authenticated", () => {
    expect(routeAuth("POST", "/multipass/api/oauth2/token")).toBe("none");
  });

  it("marks runtime session creation as unauthenticated", () => {
    expect(routeAuth("POST", "/_emulate/foundry/compute-modules/runtimes")).toBe("none");
  });

  it("marks job inspection as unauthenticated", () => {
    expect(routeAuth("GET", "/_emulate/foundry/compute-modules/runtimes/:runtimeId/jobs/:jobId")).toBe("none");
  });

  it("tracks admin enrollment and multipass me routes", () => {
    expect(routeAuth("GET", "/api/v2/admin/enrollments/getCurrent")).toBe("bearer");
    expect(routeScopes("GET", "/api/v2/admin/enrollments/getCurrent")).toEqual(["api:admin-read"]);
    expect(routeAuth("GET", "/multipass/api/me")).toBe("bearer");
  });

  it("tracks connectivity read and write scopes", () => {
    expect(routeScopes("POST", "/api/v2/connectivity/connections")).toEqual(["api:connectivity-connection-write"]);
    expect(routeScopes("GET", "/api/v2/connectivity/connections/:connectionRid")).toEqual([
      "api:connectivity-connection-read",
    ]);
    expect(routeScopes("POST", "/api/v2/connectivity/connections/:connectionRid/updateSecrets")).toEqual([
      "api:connectivity-connection-write",
    ]);
  });

  it("tracks ontology routes as bearer-protected read operations", () => {
    expect(routeAuth("GET", "/api/v2/ontologies")).toBe("bearer");
    expect(routeScopes("GET", "/api/v2/ontologies")).toEqual(["api:ontologies-read"]);
    expect(routeScopes("POST", "/api/v2/ontologies/:ontology/queries/:queryApiName/execute")).toEqual([
      "api:ontologies-read",
    ]);
  });
});
