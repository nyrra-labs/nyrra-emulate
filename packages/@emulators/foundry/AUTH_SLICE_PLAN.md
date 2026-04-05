# Foundry Auth Slice Plan

## Status

This auth slice is implemented and registered for explicit use through the CLI, starter config generation, skills, and docs.

The supported Foundry surface is intentionally narrow:

- `GET /multipass/api/oauth2/authorize`
- `POST /multipass/api/oauth2/token`
- `GET /api/v2/admin/users/getCurrent`

Foundry does not join the zero-config default startup set. Start it explicitly with `emulate --service foundry`, or include a `foundry:` block in the seed config so service inference enables it.

## Scope

This first implementation slice covers only Foundry authentication and current user identity:

- `GET /multipass/api/oauth2/authorize`
- `POST /multipass/api/oauth2/token`
- `GET /api/v2/admin/users/getCurrent`

The goal is to support local OAuth2 integration tests without committing to the broader Ontology surface yet.

## Supported Grants

- `authorization_code`
- `refresh_token`
- `client_credentials`

The auth code flow should support PKCE with `S256`. Refresh tokens should only be returned when the requested scopes include `offline_access`.

## Principal Model

The store should represent Foundry principals explicitly so later Ontology routes can enforce behavior without special cases in core auth middleware.

- Human principals represent normal Foundry users.
- Service principals represent the service-user identity created by `client_credentials`.

For the initial slice, both principal types can still map into the shared `tokenMap`, but the Foundry package should keep enough principal metadata in its own store for later route-level checks.

## Scope Model

Scopes should be stored as raw strings exactly as requested and granted. That keeps the auth layer neutral and lets later routes enforce their own rules.

Expected early scopes:

- `api:admin-read`
- `api:ontologies-read`
- `api:ontologies-write`
- `offline_access`

## Endpoint Behavior

### Authorization endpoint

- Validate `client_id`
- Validate `redirect_uri` when provided
- Require `response_type=code`
- Persist pending auth codes for 10 minutes
- Echo `state` back on success
- Support PKCE parameters when provided

### Token endpoint

- Accept `application/x-www-form-urlencoded`
- Exchange auth codes for bearer tokens
- Issue refresh tokens only when `offline_access` is present
- Rotate refresh tokens on refresh
- Support `client_credentials` by minting a service principal token

### Current user endpoint

- Require bearer auth
- Require `api:admin-read`
- Return a human principal when the token came from `authorization_code` or `refresh_token`
- Return the service principal when the token came from `client_credentials`

## Deferred Work

These are intentionally out of scope for the first slice:

- Ontology discovery routes
- Action and query execution routes
- Resource level authorization
- Third-party app management APIs
- Full refresh token reuse detection windows
- Multi-organization tenancy rules

## Suggested Test Plan

- Authorization request validates unknown clients and redirect URI mismatches
- Authorization code exchange succeeds with PKCE and fails with bad verifier
- `offline_access` produces refresh tokens and refresh rotates them
- `client_credentials` yields a service principal token
- `getCurrent` returns the correct principal shape for both human and service tokens
- Missing bearer token returns the expected auth error

## Current Coverage

The current test suite covers:

- seeded default users
- authorize page rendering
- strict client validation when clients are configured
- auth code exchange with and without PKCE
- refresh token rotation
- `client_credentials` service principal creation
- `getCurrent` for human and service principals
- `api:admin-read` enforcement
- `allowed_scopes` validation

## Next Slices

The next useful Foundry slices are:

- ontology discovery routes
- object reads
- action execution
- query execution
