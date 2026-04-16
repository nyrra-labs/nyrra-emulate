# Compute Modules Overview

Compute modules let you run custom functions within Foundry. The emulator provides a local implementation of the compute module lifecycle: runtime registration, job dispatch, schema storage, and result collection.

## Architecture

A compute module integration has three participants:

1. **Your application** submits jobs through the Contour API (the client-facing API).
2. **The emulator** queues jobs and manages runtime state.
3. **Your compute module runtime** polls for jobs, executes them, and posts results back.

```
Your App                     Emulator                    Your Runtime
   |                            |                            |
   |--- POST execute job ------>|                            |
   |                            |--- queue job ------------->|
   |                            |                            |
   |                            |<-- GET poll for job -------|
   |                            |--- return job ------------>|
   |                            |                            |
   |                            |<-- POST result ------------|
   |<-- return result ----------|                            |
```

## Two API Layers

The emulator exposes two sets of routes for compute modules:

### Runtime Routes (internal)

Used by the compute module runtime process itself. These routes handle session management, job polling, schema posting, and result submission.

All runtime routes are prefixed with `/_emulate/foundry/compute-modules/runtimes/`.

See [Runtime Lifecycle](/foundry/compute-modules/runtimes) for details.

### Contour Routes (client-facing)

Used by your application to submit and monitor jobs. These routes require bearer token authentication.

All contour routes are prefixed with `/contour-backend-multiplexer/api/module-group-multiplexer/`.

See [Job Execution](/foundry/compute-modules/jobs) for details.

## Seed Configuration

Pre-register runtimes and deployed apps in your seed config:

```yaml
foundry:
  compute_modules:
    runtimes:
      - runtime_id: my-runtime
        module_auth_token: my-token  # optional; auto-generated if omitted

    deployed_apps:
      - deployed_app_rid: ri.foundry.main.deployed-app.my-app
        runtime_id: my-runtime
        branch: master           # defaults to "master"
        display_name: My App     # optional
        active: true             # defaults to true
```

Runtimes defined in the seed are created on startup so that the compute module process can immediately begin polling.

Deployed apps bind a `deployed_app_rid` (the identifier your application uses) to a specific runtime. The `branch` field defaults to `master` if omitted.

## Typical Workflow

1. **Start the emulator** with compute module runtimes in the seed config.
2. **Start your compute module** process. It registers or connects to its runtime, posts schemas, and begins polling for jobs.
3. **Submit a job** from your application through the Contour sync or async API.
4. **The runtime picks up the job**, executes the function, and posts the result.
5. **Your application receives the result** (immediately for sync, via polling for async).

## Module Auth Token

Each runtime has a `module_auth_token` that authenticates the runtime process. The token must be sent as the `Module-Auth-Token` header on all runtime API calls (job polling, schema posting, result posting).

If you do not specify a token in the seed config, one is generated automatically and returned when the runtime session is created.

## Next Steps

- [Runtime Lifecycle](/foundry/compute-modules/runtimes) for session management and polling
- [Job Execution](/foundry/compute-modules/jobs) for sync and async job submission
- [Seed Config Reference](/foundry/reference/seed-config) for all compute module options
