#!/usr/bin/env node
/**
 * Minimal Mode (BI) MCP server over stdio.
 * Implements: initialize, tools/list, tools/call.
 * Tools:
 *  - mode.listReports
 *  - mode.listSpaces
 *  - mode.getReport
 *  - mode.runReport
 *  - mode.downloadRunCsv
 *
 * Configuration via env (auto-loads .env.local / .env in project root if present):
 *  - MODE_WORKSPACE: your Mode workspace slug
 *  - MODE_TOKEN: Workspace API key ID
 *  - MODE_SECRET: Workspace API key Secret
 */
/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");

// --- Simple env loader (.env.local then .env) ---
function loadEnvFile(fileName) {
  try {
    const p = path.resolve(process.cwd(), fileName);
    if (!fs.existsSync(p)) return;
    const content = fs.readFileSync(p, "utf8");
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    });
  } catch (_) {
    // ignore
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env");

// --- JSON-RPC over stdio helpers ---
const STDIN = process.stdin;
const STDOUT = process.stdout;
STDIN.setEncoding("utf8");

let readBuffer = "";
function send(json) {
  const body = JSON.stringify(json);
  STDOUT.write(`Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`);
}

STDIN.on("data", (chunk) => {
  readBuffer += chunk;
  while (true) {
    const headerEnd = readBuffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) break;
    const headers = readBuffer.slice(0, headerEnd);
    const m = headers.match(/Content-Length:\s*(\d+)/i);
    if (!m) {
      // Drop invalid
      readBuffer = readBuffer.slice(headerEnd + 4);
      continue;
    }
    const len = parseInt(m[1], 10);
    const remainder = readBuffer.slice(headerEnd + 4);
    if (remainder.length < len) break; // wait for full body
    const body = remainder.slice(0, len);
    readBuffer = remainder.slice(len);
    try {
      const msg = JSON.parse(body);
      handleMessage(msg);
    } catch (err) {
      // ignore parse errors
    }
  }
});

// --- Mode API client ---
function getConfig() {
  const workspace = process.env.MODE_WORKSPACE || "";
  const token = process.env.MODE_TOKEN || "";
  const secret = process.env.MODE_SECRET || "";
  return { workspace, token, secret };
}

async function modeFetch(pathname, options = {}) {
  const { workspace, token, secret } = getConfig();
  if (!workspace || !token || !secret) {
    throw new Error(
      "Mode credentials not configured. Set MODE_WORKSPACE, MODE_TOKEN, MODE_SECRET."
    );
  }
  const url = new URL(`https://mode.com/api/${encodeURIComponent(workspace)}/${pathname.replace(/^\/+/, "")}`);
  const headers = {
    "Accept": "application/json",
    ...options.headers,
  };
  // HTTP Basic auth with token:secret
  const auth = Buffer.from(`${token}:${secret}`).toString("base64");
  headers["Authorization"] = `Basic ${auth}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Mode API ${res.status} ${res.statusText}: ${text}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

// --- Tool implementations ---
const tools = {
  async "mode.listReports"() {
    // GET /reports
    return await modeFetch("reports");
  },

  async "mode.listSpaces"() {
    // GET /spaces
    return await modeFetch("spaces");
  },

  async "mode.getReport"(params) {
    const { reportToken } = params || {};
    if (!reportToken) throw new Error("reportToken is required");
    // GET /reports/{reportToken}
    return await modeFetch(`reports/${encodeURIComponent(reportToken)}`);
  },

  async "mode.runReport"(params) {
    const { reportToken, parameters } = params || {};
    if (!reportToken) throw new Error("reportToken is required");
    // POST /reports/{reportToken}/runs
    return await modeFetch(`reports/${encodeURIComponent(reportToken)}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: parameters ? { parameters } : {},
    });
  },

  async "mode.downloadRunCsv"(params) {
    const { reportToken, runId, outPath } = params || {};
    if (!reportToken) throw new Error("reportToken is required");
    if (!runId) throw new Error("runId is required");
    const rel = outPath && outPath.trim().length > 0 ? outPath : `public/analytics/${reportToken}-${runId}.csv`;
    const dest = path.resolve(process.cwd(), rel);
    const dir = path.dirname(dest);
    fs.mkdirSync(dir, { recursive: true });

    const { workspace, token, secret } = getConfig();
    if (!workspace || !token || !secret) {
      throw new Error("Mode credentials not configured. Set MODE_WORKSPACE, MODE_TOKEN, MODE_SECRET.");
    }
    const url = new URL(`https://mode.com/api/${encodeURIComponent(workspace)}/reports/${encodeURIComponent(reportToken)}/runs/${encodeURIComponent(runId)}.csv`);
    const auth = Buffer.from(`${token}:${secret}`).toString("base64");
    const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`CSV download failed ${res.status} ${res.statusText}: ${text}`);
    }
    const file = fs.createWriteStream(dest);
    await new Promise((resolve, reject) => {
      res.body.pipe(file);
      res.body.on("error", reject);
      file.on("finish", resolve);
      file.on("error", reject);
    });
    return { savedTo: rel };
  },
};

// --- MCP message handling ---
function handleMessage(msg) {
  const { id, method, params } = msg;
  if (method === "initialize") {
    send({ jsonrpc: "2.0", id, result: { protocolVersion: "2024-11-05", serverInfo: { name: "mode-mcp", version: "0.1.0" } } });
    return;
  }
  if (method === "tools/list") {
    const list = Object.keys(tools).map((name) => ({
      name,
      description: name,
      inputSchema: { type: "object" },
    }));
    send({ jsonrpc: "2.0", id, result: { tools: list } });
    return;
  }
  if (method === "tools/call") {
    const { name, arguments: args } = params || {};
    const fn = name && tools[name];
    if (!fn) {
      send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown tool: ${name}` } });
      return;
    }
    (async () => {
      try {
        const result = await fn(args);
        send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result) }] } });
      } catch (err) {
        send({ jsonrpc: "2.0", id, error: { code: -32000, message: err && err.message ? err.message : String(err) } });
      }
    })();
    return;
  }
  // Unknown method
  if (id !== undefined) {
    send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown method: ${method}` } });
  }
}

// Notify ready (optional for some clients)
// process.stderr.write("mode-mcp ready\n");


