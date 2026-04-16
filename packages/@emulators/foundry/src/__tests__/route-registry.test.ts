import { describe, expect, it } from "vitest";
import { FOUNDRY_ROUTES } from "../route-registry.js";

function routeAuth(method: string, path: string): string | undefined {
  return FOUNDRY_ROUTES.find((route) => route.method === method && route.path === path)?.auth;
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
});
