/**
 * Machine-readable route registry for Foundry endpoints.
 *
 * Provides structured metadata about every route the Foundry emulator
 * exposes. Used by docs tooling to generate endpoint reference tables,
 * scope matrices, and coverage assertions.
 */

export type RouteAuth = "bearer" | "module-auth-token" | "none";

export type RouteEntry = {
  method: string;
  path: string;
  domain: string;
  description: string;
  auth: RouteAuth;
  requiredScopes?: string[];
  contentType?: string;
  category: string;
};

/**
 * All routes registered by the Foundry emulator plugin.
 * Ordered by domain, then by logical grouping within each domain.
 */
export const FOUNDRY_ROUTES: readonly RouteEntry[] = [
  // --- Auth (OAuth 2.0) ---
  {
    method: "GET",
    path: "/multipass/api/oauth2/authorize",
    domain: "auth",
    description: "OAuth 2.0 authorization endpoint. Renders user selection UI.",
    auth: "none",
    category: "OAuth",
  },
  {
    method: "POST",
    path: "/multipass/api/oauth2/authorize/callback",
    domain: "auth",
    description: "Authorization callback. Issues an authorization code after user consent.",
    auth: "none",
    category: "OAuth",
  },
  {
    method: "POST",
    path: "/multipass/api/oauth2/token",
    domain: "auth",
    description: "Token exchange. Supports authorization_code, refresh_token, and client_credentials grants.",
    auth: "none",
    category: "OAuth",
  },

  // --- Admin ---
  {
    method: "GET",
    path: "/api/v2/admin/users/getCurrent",
    domain: "admin",
    description: "Returns the current authenticated user or service principal.",
    auth: "bearer",
    requiredScopes: ["api:admin-read"],
    category: "Admin",
  },

  // --- Compute Modules: Runtime Control ---
  {
    method: "POST",
    path: "/_emulate/foundry/compute-modules/runtimes",
    domain: "compute-modules",
    description: "Create or reset a runtime session. Returns moduleAuthToken and polling URLs.",
    auth: "none",
    category: "Runtime Control",
  },
  {
    method: "GET",
    path: "/_emulate/foundry/compute-modules/runtimes/:runtimeId/job",
    domain: "compute-modules",
    description: "Poll for the next queued job. Returns 204 if no job is available.",
    auth: "module-auth-token",
    contentType: "application/json",
    category: "Runtime Control",
  },
  {
    method: "POST",
    path: "/_emulate/foundry/compute-modules/runtimes/:runtimeId/schemas",
    domain: "compute-modules",
    description: "Post JSON schemas for compute-module functions.",
    auth: "module-auth-token",
    contentType: "application/json",
    category: "Runtime Control",
  },
  {
    method: "POST",
    path: "/_emulate/foundry/compute-modules/runtimes/:runtimeId/results/:jobId",
    domain: "compute-modules",
    description: "Post raw result body for a completed job. Preserves exact bytes.",
    auth: "module-auth-token",
    contentType: "application/octet-stream",
    category: "Runtime Control",
  },
  {
    method: "GET",
    path: "/_emulate/foundry/compute-modules/runtimes/:runtimeId/jobs/:jobId",
    domain: "compute-modules",
    description: "Inspect a job's state, schemas, and result.",
    auth: "none",
    category: "Runtime Control",
  },

  // --- Compute Modules: Contour (Public API) ---
  {
    method: "POST",
    path: "/contour-backend-multiplexer/api/module-group-multiplexer/compute-modules/jobs/execute",
    domain: "compute-modules",
    description: "Synchronous job execution. Enqueues, waits up to 30 seconds, returns raw result body.",
    auth: "bearer",
    contentType: "application/json",
    category: "Contour",
  },
  {
    method: "POST",
    path: "/contour-backend-multiplexer/api/module-group-multiplexer/deployed-apps/jobs",
    domain: "compute-modules",
    description: "Asynchronous job submission. Returns a job handle for status polling.",
    auth: "bearer",
    contentType: "application/json",
    category: "Contour",
  },
  {
    method: "GET",
    path: "/contour-backend-multiplexer/api/module-group-multiplexer/jobs/:jobId/status",
    domain: "compute-modules",
    description: "Poll job status. Returns queued, running, succeeded, or failed.",
    auth: "bearer",
    category: "Contour",
  },
  {
    method: "PUT",
    path: "/contour-backend-multiplexer/api/module-group-multiplexer/jobs/result/v2",
    domain: "compute-modules",
    description: "Fetch completed job result body. Returns raw application/octet-stream.",
    auth: "bearer",
    contentType: "application/octet-stream",
    category: "Contour",
  },
];

/**
 * All scopes recognized by the Foundry emulator.
 */
export const FOUNDRY_SCOPES = [
  { scope: "api:admin-read", description: "Read admin data (current user, user management)" },
  { scope: "api:ontologies-read", description: "Read ontology data (future)" },
  { scope: "api:ontologies-write", description: "Write ontology data (future)" },
  { scope: "offline_access", description: "Request refresh tokens for long-lived sessions" },
] as const;

/**
 * Supported OAuth 2.0 grant types.
 */
export const FOUNDRY_GRANT_TYPES = [
  { type: "authorization_code", description: "Interactive user sign-in with optional PKCE" },
  { type: "refresh_token", description: "Exchange a refresh token for a new access token" },
  { type: "client_credentials", description: "Service-to-service authentication (creates service principals)" },
] as const;
