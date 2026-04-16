import { createHash } from "crypto";
import { describe, expect, it, beforeEach } from "vitest";
import { Hono } from "hono";
import { Store, WebhookDispatcher, authMiddleware, type TokenMap } from "@emulators/core";
import { foundryPlugin, seedFromConfig, getFoundryStore } from "../index.js";

const base = "http://localhost:4000";

function createTestApp() {
  const store = new Store();
  const webhooks = new WebhookDispatcher();
  const tokenMap: TokenMap = new Map();

  const app = new Hono();
  app.use("*", authMiddleware(tokenMap));
  foundryPlugin.register(app as any, store, webhooks, base, tokenMap);
  foundryPlugin.seed?.(store, base);
  seedFromConfig(store, base, {
    users: [
      {
        username: "jane",
        display_name: "Jane Smith",
        email: "jane@example.com",
        given_name: "Jane",
        family_name: "Smith",
        attributes: {
          department: ["Finance"],
        },
      },
    ],
    oauth_clients: [
      {
        client_id: "foundry-web",
        client_secret: "foundry-secret",
        name: "Foundry Web App",
        redirect_uris: ["http://localhost:3000/callback"],
        allowed_scopes: ["api:admin-read", "api:ontologies-read", "api:ontologies-write", "offline_access"],
      },
    ],
  });

  return { app, store, tokenMap };
}

async function getAuthCode(
  app: Hono,
  options: {
    username?: string;
    client_id?: string;
    redirect_uri?: string;
    scope?: string;
    state?: string;
    code_challenge?: string;
    code_challenge_method?: string;
  } = {},
): Promise<{ code: string; state: string }> {
  const form = new URLSearchParams({
    username: options.username ?? "jane",
    client_id: options.client_id ?? "foundry-web",
    redirect_uri: options.redirect_uri ?? "http://localhost:3000/callback",
    scope: options.scope ?? "api:admin-read offline_access",
    state: options.state ?? "test-state",
    code_challenge: options.code_challenge ?? "",
    code_challenge_method: options.code_challenge_method ?? "",
  });

  const res = await app.request(`${base}/multipass/api/oauth2/authorize/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const location = res.headers.get("location") ?? "";
  const url = new URL(location);
  return {
    code: url.searchParams.get("code") ?? "",
    state: url.searchParams.get("state") ?? "",
  };
}

async function exchangeCode(
  app: Hono,
  code: string,
  options: {
    client_id?: string;
    client_secret?: string;
    redirect_uri?: string;
    code_verifier?: string;
  } = {},
): Promise<Response> {
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: options.client_id ?? "foundry-web",
    ...(options.client_secret !== undefined ? { client_secret: options.client_secret } : {}),
    redirect_uri: options.redirect_uri ?? "http://localhost:3000/callback",
    ...(options.code_verifier ? { code_verifier: options.code_verifier } : {}),
  });

  return app.request(`${base}/multipass/api/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
}

describe("Foundry auth slice", () => {
  let app: Hono;
  let store: Store;
  let tokenMap: TokenMap;

  beforeEach(() => {
    const setup = createTestApp();
    app = setup.app;
    store = setup.store;
    tokenMap = setup.tokenMap;
  });

  it("seeds a default human principal", () => {
    const fs = getFoundryStore(store);
    expect(fs.users.findOneBy("username", "admin")?.principal_type).toBe("human");
  });

  it("GET /multipass/api/oauth2/authorize returns an HTML sign-in page", async () => {
    const res = await app.request(
      `${base}/multipass/api/oauth2/authorize?client_id=foundry-web&redirect_uri=${encodeURIComponent("http://localhost:3000/callback")}&response_type=code&scope=api:admin-read`,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    const html = await res.text();
    expect(html).toContain("Sign in to Foundry");
    expect(html).toContain("Foundry Web App");
  });

  it("rejects an unknown client on the authorization page when clients are configured", async () => {
    const res = await app.request(
      `${base}/multipass/api/oauth2/authorize?client_id=unknown&redirect_uri=${encodeURIComponent("http://localhost:3000/callback")}&response_type=code&scope=api:admin-read`,
    );
    expect(res.status).toBe(400);
    const html = await res.text();
    expect(html).toContain("Application not found");
  });

  it("completes the authorization_code flow and issues a refresh token for offline_access", async () => {
    const { code, state } = await getAuthCode(app);
    expect(code).toBeTruthy();
    expect(state).toBe("test-state");

    const tokenRes = await exchangeCode(app, code, { client_secret: "foundry-secret" });
    expect(tokenRes.status).toBe(200);
    const body = (await tokenRes.json()) as Record<string, unknown>;
    expect((body.access_token as string).startsWith("foundry_")).toBe(true);
    expect((body.refresh_token as string).startsWith("foundry_refresh_")).toBe(true);
    expect(body.token_type).toBe("Bearer");
    expect(body.expires_in).toBe(3600);
  });

  it("supports PKCE S256 verification", async () => {
    const verifier = "this-is-a-long-pkce-verifier-value-1234567890";
    const challenge = createHash("sha256").update(verifier).digest("base64url");

    const { code } = await getAuthCode(app, {
      scope: "api:admin-read",
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    const okRes = await exchangeCode(app, code, {
      client_secret: "foundry-secret",
      code_verifier: verifier,
    });
    expect(okRes.status).toBe(200);
  });

  it("rejects PKCE exchange with the wrong verifier", async () => {
    const verifier = "this-is-a-long-pkce-verifier-value-1234567890";
    const challenge = createHash("sha256").update(verifier).digest("base64url");

    const { code } = await getAuthCode(app, {
      scope: "api:admin-read",
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    const badRes = await exchangeCode(app, code, {
      client_secret: "foundry-secret",
      code_verifier: "wrong-verifier",
    });
    expect(badRes.status).toBe(400);
    const body = (await badRes.json()) as Record<string, unknown>;
    expect(body.error).toBe("invalid_grant");
  });

  it("rotates refresh tokens", async () => {
    const { code } = await getAuthCode(app);
    const tokenRes = await exchangeCode(app, code, { client_secret: "foundry-secret" });
    const tokenBody = (await tokenRes.json()) as Record<string, unknown>;
    const refreshToken = tokenBody.refresh_token as string;

    const refreshForm = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: "foundry-web",
      client_secret: "foundry-secret",
    });
    const refreshRes = await app.request(`${base}/multipass/api/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: refreshForm.toString(),
    });

    expect(refreshRes.status).toBe(200);
    const refreshBody = (await refreshRes.json()) as Record<string, unknown>;
    expect((refreshBody.access_token as string).startsWith("foundry_")).toBe(true);
    expect(refreshBody.refresh_token).not.toBe(refreshToken);
  });

  it("issues a service principal token for client_credentials", async () => {
    const form = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: "foundry-web",
      client_secret: "foundry-secret",
      scope: "api:admin-read",
    });

    const res = await app.request(`${base}/multipass/api/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect((body.access_token as string).startsWith("foundry_")).toBe(true);
    expect(body.refresh_token).toBeUndefined();

    const fs = getFoundryStore(store);
    const serviceUser = fs.users.findOneBy("username", "foundry-web");
    expect(serviceUser?.principal_type).toBe("service");
    expect(serviceUser?.oauth_client_id).toBe("foundry-web");
  });

  it("returns the current human principal for an authorization_code token", async () => {
    const { code } = await getAuthCode(app, { scope: "api:admin-read offline_access" });
    const tokenRes = await exchangeCode(app, code, { client_secret: "foundry-secret" });
    const tokenBody = (await tokenRes.json()) as Record<string, unknown>;
    const accessToken = tokenBody.access_token as string;

    const res = await app.request(`${base}/api/v2/admin/users/getCurrent`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.username).toBe("jane");
    expect(body.givenName).toBe("Jane");
    expect(body.familyName).toBe("Smith");
    expect(body.email).toBe("jane@example.com");
    expect(body.organization).toBe("ri.organization.main.organization.default");
    expect(body.realm).toBe("palantir-internal-realm");
    expect((body.attributes as Record<string, string[]>).department).toEqual(["Finance"]);
  });

  it("returns the current service principal for a client_credentials token", async () => {
    const form = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: "foundry-web",
      client_secret: "foundry-secret",
      scope: "api:admin-read",
    });

    const tokenRes = await app.request(`${base}/multipass/api/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const tokenBody = (await tokenRes.json()) as Record<string, unknown>;

    const res = await app.request(`${base}/api/v2/admin/users/getCurrent`, {
      headers: { Authorization: `Bearer ${tokenBody.access_token as string}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.username).toBe("foundry-web");
    expect(body.organization).toBe("");
    expect(body.email).toBeUndefined();
  });

  it("returns permission denied when api:admin-read is missing", async () => {
    const { code } = await getAuthCode(app, { scope: "api:ontologies-read" });
    const tokenRes = await exchangeCode(app, code, { client_secret: "foundry-secret" });
    const tokenBody = (await tokenRes.json()) as Record<string, unknown>;

    const res = await app.request(`${base}/api/v2/admin/users/getCurrent`, {
      headers: { Authorization: `Bearer ${tokenBody.access_token as string}` },
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.errorCode).toBe("PERMISSION_DENIED");
    expect(body.errorName).toBe("GetCurrentUserPermissionDenied");
    expect(body.errorDescription).toBe("Could not getCurrent the User.");
    expect(body.errorInstanceId).toBeDefined();
    expect(body.parameters).toEqual({});
  });

  it("requires authentication for getCurrent when no bearer token is provided", async () => {
    const res = await app.request(`${base}/api/v2/admin/users/getCurrent`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.message).toBe("Requires authentication");
  });

  it("rejects scopes outside the configured allow-list", async () => {
    const form = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: "foundry-web",
      client_secret: "foundry-secret",
      scope: "api:datasets-write",
    });

    const res = await app.request(`${base}/multipass/api/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("invalid_scope");
  });

  it("stores access tokens in the shared token map", async () => {
    const { code } = await getAuthCode(app);
    const tokenRes = await exchangeCode(app, code, { client_secret: "foundry-secret" });
    const tokenBody = (await tokenRes.json()) as Record<string, unknown>;
    expect(tokenMap.has(tokenBody.access_token as string)).toBe(true);
  });

  // --- Deliverable 1: Admin baseline ---

  it("seeds a default enrollment", () => {
    const fs = getFoundryStore(store);
    const enrollment = fs.enrollments.all()[0];
    expect(enrollment).toBeDefined();
    expect(enrollment.enrollment_rid).toBe("ri.enrollment..enrollment.default");
    expect(enrollment.name).toBe("Default Enrollment");
  });

  it("GET /api/v2/admin/enrollments/getCurrent returns the seeded enrollment", async () => {
    const { code } = await getAuthCode(app, { scope: "api:admin-read" });
    const tokenRes = await exchangeCode(app, code, { client_secret: "foundry-secret" });
    const tokenBody = (await tokenRes.json()) as Record<string, unknown>;

    const res = await app.request(`${base}/api/v2/admin/enrollments/getCurrent?preview=true`, {
      headers: { Authorization: `Bearer ${tokenBody.access_token}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.rid).toBe("ri.enrollment..enrollment.default");
    expect(body.name).toBe("Default Enrollment");
    expect(body.createdTime).toBeDefined();
  });

  it("GET /api/v2/admin/enrollments/getCurrent requires api:admin-read scope", async () => {
    // Use a token without admin-read scope
    tokenMap.set("no-scope-token", { login: "jane", id: 1, scopes: [] });
    const res = await app.request(`${base}/api/v2/admin/enrollments/getCurrent?preview=true`, {
      headers: { Authorization: "Bearer no-scope-token" },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.errorCode).toBe("PERMISSION_DENIED");
    expect(body.errorName).toBe("GetCurrentEnrollmentPermissionDenied");
    expect(body.errorDescription).toBe("Could not getCurrent the Enrollment.");
    expect(body.errorInstanceId).toBeDefined();
    expect(body.parameters).toEqual({});
  });

  it("GET /api/v2/admin/enrollments/getCurrent requires auth", async () => {
    const res = await app.request(`${base}/api/v2/admin/enrollments/getCurrent?preview=true`);
    expect(res.status).toBe(401);
  });

  it("GET /multipass/api/me returns the CLI-compatible shape", async () => {
    const { code } = await getAuthCode(app, { scope: "api:admin-read" });
    const tokenRes = await exchangeCode(app, code, { client_secret: "foundry-secret" });
    const tokenBody = (await tokenRes.json()) as Record<string, unknown>;

    const res = await app.request(`${base}/multipass/api/me`, {
      headers: { Authorization: `Bearer ${tokenBody.access_token}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.id).toBeDefined();
    expect(body.username).toBe("jane");
    expect(body.displayName).toBe("Jane Smith");
    // CLI expects exactly these three fields
    expect(Object.keys(body).sort()).toEqual(["displayName", "id", "username"]);
  });

  it("GET /multipass/api/me requires auth", async () => {
    const res = await app.request(`${base}/multipass/api/me`);
    expect(res.status).toBe(401);
  });

  it("GET /multipass/api/me returns the service principal for client_credentials", async () => {
    const form = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: "foundry-web",
      client_secret: "foundry-secret",
      scope: "api:admin-read",
    });
    const tokenRes = await app.request(`${base}/multipass/api/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const tokenBody = (await tokenRes.json()) as Record<string, unknown>;

    const res = await app.request(`${base}/multipass/api/me`, {
      headers: { Authorization: `Bearer ${tokenBody.access_token}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.username).toBe("foundry-web");
  });
});
