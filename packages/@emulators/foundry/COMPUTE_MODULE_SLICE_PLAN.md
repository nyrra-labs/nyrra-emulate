# Foundry Compute Modules Slice Plan

## Status

Planned.

This slice should land before broader Foundry query and action emulation. It unlocks higher value local testing for:

- real TypeScript compute-module containers built with `@palantir/compute-module`
- `nyrra-foundry-cli` compute-module execution paths
- dogfooding complex compute-module apps such as agent loops

## Goal

Add a narrow, high-fidelity Foundry compute-module emulator with two route families:

1. emulator-owned runtime routes used by a running compute-module container
2. public Foundry-facing execute and native job routes used by CLI and app clients

The runtime slice should be reliable enough for local integration tests and CI. The public route slice should be faithful enough to exercise the CLI behavior that matters today, especially streaming and native-job result handling.

## Non-Goals

This slice should not attempt to emulate all of Foundry compute modules.

Out of scope for the first implementation:

- build, publish, and deployment flows
- start, stop, scale, and logs APIs
- full compute-module configuration APIs
- UI parity
- resource-level authorization rules
- ontology reads and writes
- generic function registry flows
- multi-container orchestration
- background scheduler realism beyond a small in-memory queue

## Ground Truth

### Runtime protocol

Source-verified against the public TypeScript SDK:

- `palantir/typescript-compute-module`
- local installed package `@palantir/compute-module`

Important observed behavior from the SDK:

- the module polls `GET_JOB_URI`
- the module posts schemas to `POST_SCHEMA_URI`
- the module posts results to `POST_RESULT_URI/{jobId}`
- the module authenticates with `Module-Auth-Token`
- a streaming handler writes raw JSON values into a writable stream
- the SDK posts the streaming body as `application/octet-stream`

### Public execute and native-job behavior

Live-verified separately on April 8, 2026 against a real Foundry deployed app.

Important observed behavior:

- `POST /contour-backend-multiplexer/api/module-group-multiplexer/compute-modules/jobs/execute`
  returns the raw result body as `application/octet-stream`
- non-streaming functions return a single JSON value
- streaming functions return concatenated JSON values with no delimiter
- `POST /contour-backend-multiplexer/api/module-group-multiplexer/deployed-apps/jobs`
  plus status polling plus `PUT /jobs/result/v2` returns the same raw body as the sync execute route

### Function Executor

`foundry-internal-reconstruct` is useful for request and route shapes on the function-executor side, but it is not the runtime implementation for `@palantir/compute-module`. Function-executor support should stay deferred until the contour-backed slice is done.

## Design Principles

- Keep emulator-owned routes separate from emulated public Foundry routes.
- Preserve raw result bodies. Do not parse and reserialize streamed output.
- Prefer explicit store entities over anonymous `store.getData()` blobs for long-lived state.
- Accept a useful subset of real request envelopes. Reject obviously invalid requests. Do not invent broad validation rules that are not needed yet.
- Use a `/_emulate/...` prefix for emulator-owned control and runtime routes.
- Keep auth rules simple in the first slice.

## Route Families

### A. Emulator-owned runtime routes

These routes are not meant to mimic public Foundry paths. The running container receives full URLs through environment variables, so the emulator owns these route shapes.

Suggested prefix:

- `/_emulate/foundry/compute-modules/...`

### B. Public Foundry routes

These routes should match the public paths currently used by the CLI and the compute-module web app:

- contour sync execute
- contour native async submit
- contour job status
- contour job result

## Store Model

Extend `FoundryStore` with compute-module collections.

### `computeModuleDeployedApps`

Purpose: lookup from public deployed app RID and branch to a runtime session.

Fields:

- `deployed_app_rid: string`
- `branch: string`
- `runtime_id: string`
- `display_name: string | null`
- `active: boolean`

Indexes:

- `deployed_app_rid`
- `runtime_id`

### `computeModuleRuntimes`

Purpose: represent a single runtime session that a real container can poll against.

Fields:

- `runtime_id: string`
- `module_auth_token: string`
- `created_at: number`
- `last_poll_at: number | null`
- `last_schema_post_at: number | null`
- `connected: boolean`

Indexes:

- `runtime_id`

### `computeModuleJobs`

Purpose: queue work and preserve exact results.

Fields:

- `job_id: string`
- `runtime_id: string`
- `deployed_app_rid: string | null`
- `deployed_app_branch: string | null`
- `query_type: string`
- `query: unknown`
- `source: "runtime-direct" | "contour-sync" | "contour-async"`
- `status: "queued" | "running" | "succeeded" | "failed"`
- `queued_at: number`
- `started_at: number | null`
- `completed_at: number | null`
- `result_content_type: string | null`
- `result_body_utf8: string | null`
- `error_message: string | null`

Indexes:

- `job_id`
- `runtime_id`
- `deployed_app_rid`

### `computeModuleSchemas`

Purpose: store the latest posted schemas per runtime and function name.

Fields:

- `runtime_id: string`
- `function_name: string`
- `schema_payload: unknown`
- `posted_at: number`

Indexes:

- `runtime_id`
- `function_name`

## Seed Config Additions

Extend `FoundrySeedConfig` with an optional `compute_modules` block.

Suggested shape:

```yaml
foundry:
  compute_modules:
    deployed_apps:
      - deployed_app_rid: ri.foundry.main.deployed-app.agent-loop
        branch: master
        runtime_id: agent-loop
        display_name: Agent Loop
        active: true
    runtimes:
      - runtime_id: agent-loop
        module_auth_token: local-module-auth-token
```

Notes:

- Do not seed any compute-module state by default.
- Tests should be able to use either seed config or a runtime-creation control route.

## Emulator-owned Control API

The runtime needs dynamic URLs and a module auth token. The cleanest way to support external Docker tests is an explicit control route.

Suggested route:

- `POST /_emulate/foundry/compute-modules/runtimes`

Suggested request:

```json
{
  "runtimeId": "agent-loop",
  "deployedAppRid": "ri.foundry.main.deployed-app.agent-loop",
  "branch": "master",
  "displayName": "Agent Loop"
}
```

Suggested response:

```json
{
  "runtimeId": "agent-loop",
  "moduleAuthToken": "local-module-auth-token",
  "getJobUri": "http://localhost:4000/_emulate/foundry/compute-modules/runtimes/agent-loop/job",
  "postResultUri": "http://localhost:4000/_emulate/foundry/compute-modules/runtimes/agent-loop/results",
  "postSchemaUri": "http://localhost:4000/_emulate/foundry/compute-modules/runtimes/agent-loop/schemas"
}
```

This route is not a public Foundry route. It exists so tests can boot a real container without hard-coded paths.

## Endpoint Matrix

### Emulator-owned runtime routes

| Route | Auth | Behavior |
|------|------|----------|
| `POST /_emulate/foundry/compute-modules/runtimes` | none in first slice | Create or reset a runtime session and optionally bind it to a deployed app |
| `GET /_emulate/foundry/compute-modules/runtimes/:runtimeId/job` | `Module-Auth-Token` | Return the next queued job as `computeModuleJobV1` or `204 No Content` when none exists |
| `POST /_emulate/foundry/compute-modules/runtimes/:runtimeId/schemas` | `Module-Auth-Token` | Store latest schemas and return `{}` |
| `POST /_emulate/foundry/compute-modules/runtimes/:runtimeId/results/:jobId` | `Module-Auth-Token` | Store the raw request body exactly as received and return `{}` |
| `GET /_emulate/foundry/compute-modules/runtimes/:runtimeId/jobs/:jobId` | none in first slice | Test inspection route for job state, stored result body, and schema snapshots |

#### `GET .../job`

When a job exists:

```json
{
  "type": "computeModuleJobV1",
  "computeModuleJobV1": {
    "jobId": "job-1",
    "queryType": "health",
    "query": {}
  }
}
```

When no job exists:

- return `204`

Important fidelity note:

- the real SDK marks the module responsive after the first `2xx` response from `GET_JOB_URI`
- schema posting may happen after a `200` or after a `204`
- the emulator must not assume schema posting order beyond that

### Public contour-backed routes

| Route | Auth | Behavior |
|------|------|----------|
| `POST /contour-backend-multiplexer/api/module-group-multiplexer/compute-modules/jobs/execute` | bearer token | Enqueue a job, wait for completion, and return the raw result body as `application/octet-stream` |
| `POST /contour-backend-multiplexer/api/module-group-multiplexer/deployed-apps/jobs` | bearer token | Enqueue a job and return an async job handle |
| `GET /contour-backend-multiplexer/api/module-group-multiplexer/jobs/:jobId/status` | bearer token | Return queued, running, succeeded, or failed status |
| `PUT /contour-backend-multiplexer/api/module-group-multiplexer/jobs/result/v2` | bearer token | Return the raw stored result body for a completed job |

#### `POST .../compute-modules/jobs/execute`

Request body:

```json
{
  "deployedAppRid": "ri.foundry.main.deployed-app.agent-loop",
  "deployedAppBranch": "master",
  "queryType": "run_stream",
  "query": {
    "prompt": "hello"
  }
}
```

Behavior:

- resolve deployed app to runtime session
- enqueue a job
- wait until the runtime posts a result
- return the stored `result_body_utf8` as `application/octet-stream`
- do not parse the body
- do not wrap concatenated JSON into an array

#### `POST .../deployed-apps/jobs`

Request body is the same as sync execute.

Suggested response:

```json
{
  "id": "job-1",
  "nodeId": null,
  "moduleId": null,
  "jobHandle": "{\"type\":\"v1\",\"jobId\":\"job-1\",\"nodeId\":null,\"moduleId\":null,\"persistJobResult\":null}",
  "persistJobResult": null,
  "status": {
    "type": "queued",
    "queued": {
      "queueInfo": "NORMAL_OPERATION"
    }
  }
}
```

#### `GET .../jobs/:jobId/status`

Minimum response set:

- `queued`
- `running`
- `succeeded`
- `failed`

Suggested succeeded shape:

```json
{
  "type": "succeeded",
  "succeeded": {
    "metadata": null,
    "intermediateJobInfoList": [],
    "multiplexerJobTiming": {
      "type": "queuedJob",
      "queuedJob": {
        "multiplexerSubmitTimeMillis": 1775607131742,
        "queueSubmitTimeMillis": 1775607131838,
        "queuedJobDispatchTimeMillis": 1775607131838,
        "moduleSubmitTimeMillis": 1775607131838
      }
    }
  }
}
```

Timing values may be synthetic. The important part is the surrounding shape and state transition.

#### `PUT .../jobs/result/v2`

The live route accepts a body that repeats the job handle and current status. The emulator should accept that shape and primarily key off `id`.

Suggested request:

```json
{
  "id": "job-1",
  "nodeId": null,
  "moduleId": null,
  "jobHandle": "{\"type\":\"v1\",\"jobId\":\"job-1\",\"nodeId\":null,\"moduleId\":null,\"persistJobResult\":null}",
  "persistJobResult": null,
  "status": {
    "type": "queued",
    "queued": {
      "queueInfo": "NORMAL_OPERATION"
    }
  }
}
```

Behavior:

- return `application/octet-stream`
- return the raw stored result body exactly
- reject unknown job IDs

## Auth Model

### Runtime routes

Require the exact `Module-Auth-Token` header expected by the runtime session.

The first slice should not require bearer auth on runtime routes.

### Public contour routes

Require a valid bearer token through the existing auth middleware.

The first slice does not need route-specific scope enforcement. A valid token is enough.

## Execution Model

### Sync contour execute

1. client submits execute request
2. emulator resolves runtime session
3. emulator creates queued job
4. runtime polls and receives job
5. runtime posts result body
6. emulator returns that exact body to the caller

### Native async contour jobs

1. client submits async job
2. emulator creates queued job and returns handle
3. runtime polls and receives job
4. caller polls status until terminal state
5. caller fetches result body

### Runtime-direct tests

1. test creates runtime session through `/_emulate/.../runtimes`
2. test boots a real compute-module container with returned env URLs and token
3. test enqueues a runtime-direct job or calls public contour routes
4. test inspects recorded schemas and results

## Fidelity Boundaries

Must preserve:

- `Module-Auth-Token` auth on runtime routes
- `application/octet-stream` result transport
- raw result body preservation for streaming outputs
- `204` polling behavior when no job exists
- real `computeModuleJobV1` envelope
- public contour route paths and basic request envelopes

Acceptable simplifications in the first slice:

- in-memory store only
- one runtime bound to one deployed app branch
- no concurrency guarantees beyond a simple queue
- synthetic timing values in status payloads
- no function-executor routes yet
- no build and deployment APIs

Must not do:

- parse a streaming result and convert it into an array
- normalize or pretty-print result JSON
- fake the runtime with a handler that bypasses the real poll loop when the goal is runtime fidelity

## Suggested File Layout

Keep auth routes separate from compute-module code.

Suggested additions:

- `src/compute-modules/entities.ts`
- `src/compute-modules/store.ts`
- `src/compute-modules/helpers.ts`
- `src/routes/compute-modules-runtime.ts`
- `src/routes/compute-modules-contour.ts`
- `src/__tests__/compute-modules-runtime.test.ts`
- `src/__tests__/compute-modules-contour.test.ts`

Then wire them from `src/index.ts`.

## Implementation Order

1. Add compute-module entities and store accessors.
2. Add the runtime session control route.
3. Add runtime poll, schema, and result routes.
4. Add tests that simulate a runtime session without Docker.
5. Add contour sync execute and bind it to the runtime queue.
6. Add async submit, status, and result routes.
7. Add tests for non-streaming and streaming result bodies.
8. Update docs, skills, and registry copy only after behavior lands.

## Test Plan

### Runtime slice tests

- runtime session creation returns usable env URLs
- wrong `Module-Auth-Token` returns `401`
- unknown runtime returns `404`
- `GET .../job` returns `204` when empty
- `GET .../job` returns `computeModuleJobV1` when queued
- `POST .../schemas` stores latest schemas
- `POST .../results/:jobId` stores exact raw body for both single JSON and concatenated JSON

### Contour route tests

- sync execute returns raw single JSON for a non-streaming function
- sync execute returns raw concatenated JSON for a streaming function
- async submit returns a handle with queued status
- status transitions queued to running to succeeded
- result route returns the same body as sync execute for the same job output
- public contour routes require bearer auth

### Cross-repo integration tests

These should live outside `nyrra-emulate`:

- boot a real container built from `templates/compute-module-ts`
- boot a real container built from the future `agent-loop` template
- point both at the emulator runtime session
- verify that the emulator and the container interoperate end to end

## Exit Criteria

This slice is done when:

- a real `@palantir/compute-module` container can poll and post against `nyrra-emulate`
- `nyrra-foundry-cli` can hit the contour sync execute route and receive correct raw bodies
