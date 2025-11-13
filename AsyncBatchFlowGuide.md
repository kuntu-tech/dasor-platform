# Async Batch Generation API Guide

## 1. Submit a Job

**POST** `/generate-batch`

- Header: `Content-Type: application/json`
- Sample body:

```json
{
  "user_id": "USER_UUID",
  "supabase_config": {
    "supabase_url": "https://project.supabase.co",
    "supabase_key": "service-role-key"
  },
  "queries": [
    { "query": "Natural language prompt A", "sql": "SELECT * FROM ..." },
    { "query": "Natural language prompt B", "sql": "" }
  ],
  "anchorIndex": "{...table schema json...}",
  "app": {
    "name": "Marketing Dashboard",
    "description": "Supabase tool generated in batch mode",
    "connection_id": "CONNECTION_UUID"
  }
}
```

Successful response (`202 Accepted`):

```json
{
  "appId": "app-record-id",
  "status": "pending",
  "message": "Batch generation job submitted. You can query status later.",
  "statusEndpoint": "/generate-batch/<jobId>/status"
}
```

## 2. Check Progress

**GET** `/generate-batch/{appId}/status`

Response fields:

| Field | Description |
| --- | --- |
| `status` | `pending` / `generating` / `succeeded` / `failed` |
| `currentQueryIndex` / `totalQueries` | Current query index within the batch |
| `currentToolName`, `currentToolIndex`, `totalToolsInCurrentQuery` | Information about the tool being generated |
| `message`, `error` | Textual updates and error messages |
| `startedAt`, `completedAt`, `lastUpdatedAt` | Timestamps |

Poll every 3–5 seconds (or use exponential backoff) until the status becomes `succeeded` or `failed`.

## 3. Supabase `apps` Table Data

Three JSONB columns store generation results:

| Column | Example |
| --- | --- |
| `generator_config` | `{ "plan": {...}, "outputDir": "...", "mcpPort": 8201 }` |
| `generator_meta` | `{ "anchorIndex": "...", "totalQueries": 3, "status": "completed", "completedAt": "...", "error": null }` |
| `generator_servers` | `[ { "serviceId": "...", "domain": "https://xxx.datail.ai", "status": "running" } ]` |

After completion, the frontend can read these fields to render plans, domains, and related info.

## 4. Recommended Frontend Flow

1. Call `/generate-batch` and store the returned `appId`.
2. Poll the `statusEndpoint`, showing a progress bar or “currently generating tool” copy.
3. When `status === "succeeded"`, query the `apps` table for `generator_config` / `generator_meta` / `generator_servers` to display MCP domain and plan details.
4. When `status === "failed"`, surface the error and check `generator_meta.error` for additional context.

## 5. Error Conventions

| Scenario | Response |
| --- | --- |
| Validation failure | `400 ValidationError` (with `issues` payload) |
| Unknown `jobId` | `404 JobNotFound` |
| Server exception | `500 BatchGenerationFailed` |

Follow the above flow to safely launch and monitor batch MCP generation jobs in the web client. Use the JSON in `generator_meta` if you need to extend the UI.