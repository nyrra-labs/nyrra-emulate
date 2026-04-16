# Job Execution

The Foundry emulator supports two modes of compute module job execution: synchronous and asynchronous. Both use the Contour API, which requires bearer token authentication.

All Contour routes are prefixed with `/contour-backend-multiplexer/api/module-group-multiplexer`.

## Synchronous Execution

Submit a job and wait for the result in a single request. The emulator queues the job, waits for the runtime to process it, and returns the raw result.

```
POST /contour-backend-multiplexer/api/module-group-multiplexer/compute-modules/jobs/execute
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request body:**

```json
{
  "deployedAppRid": "ri.foundry.main.deployed-app.my-app",
  "deployedAppBranch": "master",
  "queryType": "myFunction",
  "query": { "input": "value" }
}
```

| Field | Required | Description |
|---|---|---|
| `deployedAppRid` | Yes | The deployed app identifier |
| `deployedAppBranch` | No | Branch to target (uses any active binding if omitted) |
| `queryType` | Yes | The function name to invoke |
| `query` | No | The function input payload (defaults to `{}`) |

**Response:**

The raw result body as `application/octet-stream`, exactly as posted by the runtime.

**Timeout:** The emulator waits up to 30 seconds for the runtime to complete the job. If the runtime does not respond in time:

```json
{
  "error": "job_timeout",
  "error_description": "Timed out waiting for compute-module job 'foundry_job_...'."
}
```

**Failed jobs:**

```json
{
  "error": "job_failed",
  "error_description": "Compute module job failed."
}
```

### Sync Example

```bash
# Submit a sync job (blocks until the runtime processes it)
curl -X POST \
  "http://localhost:4000/contour-backend-multiplexer/api/module-group-multiplexer/compute-modules/jobs/execute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deployedAppRid": "ri.foundry.main.deployed-app.my-app",
    "queryType": "health",
    "query": {}
  }'
```

## Asynchronous Execution

Submit a job and receive a handle immediately. Poll for status and retrieve the result separately.

### Step 1: Submit the Job

```
POST /contour-backend-multiplexer/api/module-group-multiplexer/deployed-apps/jobs
Authorization: Bearer <access_token>
Content-Type: application/json
```

The request body has the same shape as the sync endpoint.

**Response:**

```json
{
  "id": "foundry_job_...",
  "nodeId": null,
  "moduleId": null,
  "jobHandle": "{\"type\":\"v1\",\"jobId\":\"foundry_job_...\",\"nodeId\":null,\"moduleId\":null,\"persistJobResult\":null}",
  "persistJobResult": null,
  "status": {
    "type": "queued",
    "queued": {
      "queueInfo": "NORMAL_OPERATION"
    }
  }
}
```

### Step 2: Poll for Status

```
GET /contour-backend-multiplexer/api/module-group-multiplexer/jobs/:jobId/status
Authorization: Bearer <access_token>
```

**Status values:**

| Status | Meaning |
|---|---|
| `queued` | Job is waiting in the queue |
| `running` | Runtime has picked up the job |
| `succeeded` | Result is ready |
| `failed` | Job failed with an error |

**Queued response:**

```json
{
  "type": "queued",
  "queued": { "queueInfo": "NORMAL_OPERATION" }
}
```

**Running response:**

```json
{
  "type": "running",
  "running": {
    "metadata": null,
    "intermediateJobInfoList": [],
    "multiplexerJobTiming": { ... }
  }
}
```

**Succeeded response:**

```json
{
  "type": "succeeded",
  "succeeded": {
    "metadata": null,
    "intermediateJobInfoList": [],
    "multiplexerJobTiming": { ... }
  }
}
```

**Failed response:**

```json
{
  "type": "failed",
  "failed": { "message": "Compute module job failed." }
}
```

### Step 3: Retrieve the Result

Once the status is `succeeded`, fetch the raw result:

```
PUT /contour-backend-multiplexer/api/module-group-multiplexer/jobs/result/v2
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request body (by job ID):**

```json
{
  "id": "foundry_job_..."
}
```

**Request body (by job handle):**

```json
{
  "jobHandle": "{\"type\":\"v1\",\"jobId\":\"foundry_job_...\"}"
}
```

**Response:** The raw result body as `application/octet-stream`.

If the job has not succeeded yet:

```json
{
  "error": "job_not_ready",
  "error_description": "Compute-module job 'foundry_job_...' has not completed successfully."
}
```

### Async TypeScript Example

```typescript
async function executeAsync(
  baseUrl: string,
  token: string,
  deployedAppRid: string,
  queryType: string,
  query: unknown
): Promise<string> {
  const contourBase = `${baseUrl}/contour-backend-multiplexer/api/module-group-multiplexer`;

  // Submit the job
  const submitRes = await fetch(`${contourBase}/deployed-apps/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ deployedAppRid, queryType, query }),
  });
  const { id: jobId } = await submitRes.json();

  // Poll until done
  let status = "queued";
  while (status !== "succeeded" && status !== "failed") {
    await new Promise((r) => setTimeout(r, 100));
    const statusRes = await fetch(`${contourBase}/jobs/${jobId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statusBody = await statusRes.json();
    status = statusBody.type;
  }

  if (status === "failed") {
    throw new Error("Compute module job failed");
  }

  // Fetch the result
  const resultRes = await fetch(`${contourBase}/jobs/result/v2`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: jobId }),
  });

  return resultRes.text();
}
```

## Deployed App Resolution

Both sync and async endpoints require a `deployedAppRid`. The emulator looks up an active deployed app binding that matches the RID and (optionally) the branch. If no matching binding exists:

```json
{
  "error": "not_found",
  "error_description": "No active compute-module runtime is bound to 'ri.foundry.main.deployed-app.my-app'."
}
```

Ensure that your seed config or runtime session creation has bound the deployed app to a runtime.

## Job Sources

The emulator tracks how each job was submitted:

| Source | Route |
|---|---|
| `contour-sync` | `POST .../compute-modules/jobs/execute` |
| `contour-async` | `POST .../deployed-apps/jobs` |
| `runtime-direct` | Jobs enqueued programmatically |
