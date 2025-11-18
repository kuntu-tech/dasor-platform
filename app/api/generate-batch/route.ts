import { NextRequest, NextResponse } from "next/server";

const BATCH_SERVICE_BASE_URL =
  process.env.BATCH_SERVICE_BASE_URL || "https://business-insight.datail.ai";
const BATCH_SERVICE_TOKEN =
  process.env.BATCH_SERVICE_TOKEN ||
  "gpustack_e118b9d6237a51e7_2997f1849c2cd471bdd8351152a1e84c";
const REQUEST_TIMEOUT_MS = 600_000;

type BatchPayload = {
  user_id?: string;
  supabase_config?: {
    supabase_url?: string;
    supabase_key?: string;
  };
  connection_id?: string;
  queries?: unknown[];
  anchorIndex?: unknown;
  app?: {
    name?: string;
    description?: string;
    connection_id?: string;
    app_meta_info?: any;
  };
};

const requiredFieldError = (payload: BatchPayload): string | null => {
  if (!payload || typeof payload !== "object") {
    return "request body cannot be empty";
  }
  if (!payload.user_id) {
    return "user_id is required";
  }
  if (!payload.connection_id) {
    return "connection_id is required";
  }
  // if (!Array.isArray(payload.queries) || payload.queries.length === 0) {
  //   return "queries array cannot be empty";
  // }
  // if (!payload.anchorIndex) {
  //   return "anchorIndex is required";
  // }
  return null;
};

const withAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (BATCH_SERVICE_TOKEN) {
    headers.Authorization = `Bearer ${BATCH_SERVICE_TOKEN}`;
  }
  return headers;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BatchPayload;
    console.log("Received batch generation task:", body?.user_id);

    const validationError = requiredFieldError(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const externalApiUrl = `${BATCH_SERVICE_BASE_URL.replace(
      /\/$/,
      ""
    )}/generate-batch`;
    let response: Response;
    try {
      response = await fetch(externalApiUrl, {
        method: "POST",
        headers: withAuthHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const rawText = await response.text();
    let parsed: any = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = rawText;
    }

    if (!response.ok) {
      console.log(
        "External batch service call failed:",
        response.status,
        parsed
      );
      return NextResponse.json(
        {
          error: parsed?.error || "Generate batch service call failed",
          status: response.status,
          details: parsed,
        },
        { status: response.status }
      );
    }

    const appId =
      parsed?.appId || parsed?.data?.appId || parsed?.app?.id || null;
    const proxiedStatusEndpoint = appId
      ? `/api/generate-batch/${appId}/status`
      : parsed?.statusEndpoint;

    return NextResponse.json(
      {
        ...parsed,
        appId: appId || parsed?.appId,
        statusEndpoint: proxiedStatusEndpoint,
        remoteStatusEndpoint: parsed?.statusEndpoint || proxiedStatusEndpoint,
      },
      { status: response.status }
    );
  } catch (error) {
    console.log("Batch generation API error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const isAbort =
      msg.toLowerCase().includes("aborted") ||
      msg.includes("The user aborted a request");
    return NextResponse.json(
      {
        error: isAbort ? "Request timeout" : "Internal server error",
        details: msg,
      },
      { status: isAbort ? 504 : 500 }
    );
  }
}
