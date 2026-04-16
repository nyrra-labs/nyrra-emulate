# Runtime Lifecycle

A compute module runtime represents a running instance of your function executor. The emulator manages runtime sessions, including registration, job polling, schema storage, and result submission.

## Creating a Runtime Session

Register a new runtime or reset an existing one:

```
POST /_emulate/foundry/compute-modules/runtimes
Content-Type: application/json
```

**Request body:**

```json
{
  "runtimeId": "my-runtime",
  "deployedAppRid": "ri.foundry.main.deployed-app.my-app",
  "branch": "master",
  "displayName": "My App"
}
```

| Field | Required | Description |
|---|---|---|
| `runtimeId` | Yes | Unique identifier for this runtime |
| `deployedAppRid` | No | Deployed app RID to bind to this runtime |
| `branch` | No | Branch name (defaults to `master` if a deployed app is provided) |
| `displayName` | No | Human-readable name |

**Response:**

```json
{
  "runtimeId": "my-runtime",
  "moduleAuthToken": "foundry_module_auth_...",
  "getJobUri": "http://localhost:4000/_emulate/foundry/compute-modules/runtimes/my-runtime/job",
  "postResultUri": "http://localhost:4000/_emulate/foundry/compute-modules/runtimes/my-runtime/results",
  "postSchemaUri": "http://localhost:4000/_emulate/foundry/compute-modules/runtimes/my-runtime/schemas"
}
```

The response provides the URIs your runtime should use for all subsequent operations, and the `moduleAuthToken` required for authentication.

### Session Reset Behavior

If a runtime with the same `runtimeId` already exists, calling this endpoint resets its state:

- Existing jobs are cleared
- Existing schemas are cleared
- Deployed app bindings are replaced
- A new `moduleAuthToken` is generated

This allows your runtime to restart cleanly without leftover state.

## Polling for Jobs

Your runtime polls for the next queued job:

```
GET /_emulate/foundry/compute-modules/runtimes/:runtimeId/job
Module-Auth-Token: <moduleAuthToken>
```

**204 No Content:** No jobs are queued. Poll again after a short delay.

**200 OK:** A job is available. The response contains the job envelope:

```json
{
  "type": "computeModuleJobV1",
  "computeModuleJobV1": {
    "jobId": "foundry_job_...",
    "queryType": "myFunction",
    "query": { "input": "value" }
  }
}
```

When a job is returned, its status transitions from `queued` to `running`. The runtime's `connected` flag is set to `true` and `last_poll_at` is updated on every poll.

### Polling Loop Example

```typescript
async function pollForJobs(
  getJobUri: string,
  moduleAuthToken: string
) {
  while (true) {
    const res = await fetch(getJobUri, {
      headers: { "Module-Auth-Token": moduleAuthToken },
    });

    if (res.status === 204) {
      // No job available; wait and retry
      await new Promise((r) => setTimeout(r, 100));
      continue;
    }

    if (res.status === 200) {
      const envelope = await res.json();
      const { jobId, queryType, query } = envelope.computeModuleJobV1;
      // Execute the function and post the result
      await executeAndPostResult(jobId, queryType, query);
    }
  }
}
```

## Posting Schemas

Register function schemas so the emulator knows what functions your runtime supports:

```
POST /_emulate/foundry/compute-modules/runtimes/:runtimeId/schemas
Module-Auth-Token: <moduleAuthToken>
Content-Type: application/json
```

The schema payload is flexible. The emulator accepts several formats:

**Array of named schemas:**

```json
[
  {
    "functionName": "myFunction",
    "schema": { "type": "object", "properties": { "input": { "type": "string" } } }
  }
]
```

**Wrapped in a container:**

```json
{
  "functions": [
    { "functionName": "myFunction", "schema": { "type": "object" } }
  ]
}
```

**Simple key-value map:**

```json
{
  "myFunction": { "type": "object", "properties": { "input": { "type": "string" } } }
}
```

The emulator extracts function names and schema payloads from any of these formats. If a schema for the same function name already exists, it is updated.

## Posting Results

After executing a job, post the result back:

```
POST /_emulate/foundry/compute-modules/runtimes/:runtimeId/results/:jobId
Module-Auth-Token: <moduleAuthToken>
Content-Type: application/octet-stream
```

The body is the raw result of the function execution. For JSON results:

```bash
curl -X POST \
  "http://localhost:4000/_emulate/foundry/compute-modules/runtimes/my-runtime/results/$JOB_ID" \
  -H "Module-Auth-Token: $MODULE_AUTH_TOKEN" \
  -H "Content-Type: application/octet-stream" \
  -d '{"output": "computed value"}'
```

On success, the job status transitions to `succeeded` and any client waiting on the result (via the sync Contour API) receives the response.

## Inspecting Runtime and Job State

Retrieve the full state of a runtime, a specific job, and associated schemas:

```
GET /_emulate/foundry/compute-modules/runtimes/:runtimeId/jobs/:jobId
```

This returns the runtime record, the job record, and all schemas for the runtime:

```json
{
  "runtime": {
    "runtime_id": "my-runtime",
    "module_auth_token": "...",
    "connected": true,
    "last_poll_at": 1713200000000
  },
  "job": {
    "job_id": "foundry_job_...",
    "status": "succeeded",
    "query_type": "myFunction",
    "result_body_utf8": "{\"output\": \"computed value\"}"
  },
  "schemas": [...]
}
```

## Authentication

All runtime routes (except session creation and job inspection) require the `Module-Auth-Token` header. Requests with an invalid or missing token receive:

```json
{
  "error": "invalid_module_auth_token",
  "error_description": "The Module-Auth-Token header is invalid."
}
```
