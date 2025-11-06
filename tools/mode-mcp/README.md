# Mode MCP (local)

A minimal Model Context Protocol server exposing a subset of Mode Analytics API to Cursor.

## Setup

1) Create `.env.local` at the repo root with your Mode workspace API credentials:

```
MODE_WORKSPACE=your-workspace-slug
MODE_TOKEN=your-workspace-api-key-id
MODE_SECRET=your-workspace-api-key-secret
```

2) Ensure `.cursor/mcp.json` contains:

```
{
  "mcpServers": {
    "mode": { "command": "node", "args": ["tools/mode-mcp/index.js"] }
  }
}
```

Restart Cursor in this workspace to load the server.

## Tools

- `mode.listReports()` -> list reports
- `mode.listSpaces()` -> list spaces
- `mode.getReport({ reportToken })` -> report details
- `mode.runReport({ reportToken, parameters? })` -> trigger a run
- `mode.downloadRunCsv({ reportToken, runId, outPath? })` -> save CSV under repo (default `public/analytics/<report>-<run>.csv`)

Notes
- Auth: HTTP Basic with `MODE_TOKEN:MODE_SECRET`
- Base URL used: `https://mode.com/api/<MODE_WORKSPACE>/...`
- CSV write path is relative to repo root; folders are created if missing

## Safety
- Credentials are read from env; never hard-code keys.
- Errors from Mode API are surfaced verbatim in tool errors.

## Limitations
- Endpoints and shapes may vary by Mode account; adjust as needed.
- Only a small subset is implemented; extend inside `index.js`.


