# Foundry Package Domain Boundaries

## Overview

`@emulators/foundry` is one published npm package. Its internals are organized by domain so each functional area can grow independently without cross-domain entanglement.

## Domain structure

```
packages/@emulators/foundry/src/
  auth/           OAuth 2.0 + identity (authorize, token, PKCE, scopes)
  admin/          Admin API (current-user, user management)
  connectivity/   Future: connections, secrets
  ontologies/     Future: object reads, queries, actions
  compute-modules/  Runtime protocol, contour job execution
  index.ts        Plugin export, seed config, public API surface
  store.ts        Collection factory (shared across domains)
  helpers.ts      Cross-domain utilities (user ID generation, scope parsing)
  route-helpers.ts  Shared response formatting
  entities.ts     Shared entity types (principals, OAuth types)
```

## Domain responsibilities

### auth

- OAuth 2.0 authorization endpoint (`/multipass/api/oauth2/authorize`)
- Token exchange (`/multipass/api/oauth2/token`) supporting `authorization_code`, `refresh_token`, and `client_credentials` grants
- PKCE (S256 and plain)
- Scope enforcement and token lifecycle

### admin

- Current-user lookup (`/api/v2/admin/users/getCurrent`)
- Scope-gated (`api:admin-read`)

### compute-modules

- Emulator-owned runtime control (`/_emulate/foundry/compute-modules/...`)
- Public contour routes (`/contour-backend-multiplexer/api/module-group-multiplexer/...`)
- Job queue: enqueue, poll, execute (sync/async), result retrieval
- Schema storage for compute-module functions

### connectivity (future)

- Connection management
- Secret storage

### ontologies (future)

- Object discovery and reads
- Query execution
- Action execution

## Public API surface

Only `index.ts` is the public entry point. Domain modules are internal. The exports are:

- `foundryPlugin` (ServicePlugin)
- `seedFromConfig` (seed config handler)
- `getFoundryStore` / `FoundryStore` (store accessor)
- Entity types from `entities.ts` and `compute-modules/entities.ts`

## Route registry

Each domain module registers its routes through a `RouteContext` passed from the plugin's `register()` method. The route registry provides machine-readable metadata about endpoints, supported scopes, and grant types for generated reference docs.

## Test alignment

Tests mirror domain boundaries: `foundry.test.ts` (auth), `compute-modules-runtime.test.ts`, `compute-modules-contour.test.ts`. Shared test utilities live in `test-helpers.ts`.
