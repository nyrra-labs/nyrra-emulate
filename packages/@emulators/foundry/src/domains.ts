/**
 * Domain boundary index for @emulators/foundry.
 *
 * This module documents the internal domain organization. The package
 * exposes a single public API through index.ts. Internal modules are
 * organized by domain:
 *
 * auth:
 *   routes/oauth.ts        OAuth 2.0 authorization and token endpoints
 *   entities.ts             Principal and OAuth client types
 *   helpers.ts              Scope parsing, user ID generation
 *
 * admin:
 *   routes/admin.ts         Current-user endpoint (api:admin-read)
 *
 * compute-modules:
 *   routes/compute-modules-runtime.ts   Runtime control (create, poll, schemas, results)
 *   routes/compute-modules-contour.ts   Contour public API (sync/async job execution)
 *   compute-modules/entities.ts         Job, schema, runtime, deployed-app types
 *   compute-modules/helpers.ts          Job queue, runtime management, schema storage
 *
 * shared:
 *   store.ts                Collection factory (used across all domains)
 *   route-helpers.ts        Response formatting utilities
 *   route-registry.ts       Machine-readable endpoint metadata
 *
 * Tests mirror domain boundaries:
 *   __tests__/foundry.test.ts                    Auth domain
 *   __tests__/compute-modules-runtime.test.ts    Compute modules runtime
 *   __tests__/compute-modules-contour.test.ts    Compute modules contour
 *   __tests__/test-helpers.ts                    Shared test utilities
 */

// Re-export domain route registrars for the plugin's register() method
export { oauthRoutes } from "./routes/oauth.js";
export { adminRoutes } from "./routes/admin.js";
export { computeModuleRuntimeRoutes } from "./routes/compute-modules-runtime.js";
export { computeModuleContourRoutes } from "./routes/compute-modules-contour.js";
