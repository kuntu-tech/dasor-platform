import { NextRequest, NextResponse } from "next/server";

const BATCH_SERVICE_BASE_URL =
  process.env.BATCH_SERVICE_BASE_URL || "http://localhost:3001";
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
  queries?: unknown[];
  anchorIndex?: unknown;
  app?: {
    name?: string;
    description?: string;
    connection_id?: string;
  };
};

const requiredFieldError = (payload: BatchPayload): string | null => {
  if (!payload || typeof payload !== "object") {
    return "请求体不能为空";
  }
  if (!payload.user_id) {
    return "user_id 为必填";
  }
  if (
    !payload.supabase_config?.supabase_url ||
    !payload.supabase_config?.supabase_key
  ) {
    return "supabase_config 中需包含 supabase_url 与 supabase_key";
  }
  if (!Array.isArray(payload.queries) || payload.queries.length === 0) {
    return "queries 数组不能为空";
  }
  if (!payload.anchorIndex) {
    return "anchorIndex 为必填";
  }
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
    console.log("收到批量生成任务:", body?.user_id);

    const validationError = requiredFieldError(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const externalApiUrl = `${BATCH_SERVICE_BASE_URL.replace(/\/$/, "")}/generate-batch`;
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
      console.log("外部批量任务调用失败:", response.status, parsed);
      return NextResponse.json(
        {
          error: parsed?.error || "外部批量服务调用失败",
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
    console.log("批量生成接口错误:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const isAbort =
      msg.toLowerCase().includes("aborted") ||
      msg.includes("The user aborted a request");
    return NextResponse.json(
      {
        error: isAbort ? "Request timeout" : "服务器内部错误",
        details: msg,
      },
      { status: isAbort ? 504 : 500 }
    );
  }
}
