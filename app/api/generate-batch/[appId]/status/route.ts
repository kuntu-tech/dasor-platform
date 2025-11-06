import { NextRequest, NextResponse } from "next/server";

const BATCH_SERVICE_BASE_URL =
  process.env.BATCH_SERVICE_BASE_URL || "http://localhost:3000";
const BATCH_SERVICE_TOKEN =
  process.env.BATCH_SERVICE_TOKEN ||
  "gpustack_e118b9d6237a51e7_2997f1849c2cd471bdd8351152a1e84c";
const REQUEST_TIMEOUT_MS = 600_000;

const withAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (BATCH_SERVICE_TOKEN) {
    headers.Authorization = `Bearer ${BATCH_SERVICE_TOKEN}`;
  }
  return headers;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;
  if (!appId) {
    return NextResponse.json({ error: "缺少 appId" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const statusUrl = `${BATCH_SERVICE_BASE_URL.replace(/\/$/, "")}/generate-batch/${appId}/status`;

  try {
    const response = await fetch(statusUrl, {
      method: "GET",
      headers: withAuthHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.error || "查询任务状态失败",
          status: response.status,
          details: data,
        },
        { status: response.status }
      );
    }

    const payload =
      data && typeof data === "object"
        ? { ...data, appId: data.appId || appId }
        : { status: "pending", appId };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    clearTimeout(timeout);
    const msg = error instanceof Error ? error.message : String(error);
    const isAbort =
      msg.toLowerCase().includes("aborted") ||
      msg.includes("The user aborted a request");
    return NextResponse.json(
      {
        error: isAbort ? "Request timeout" : "查询状态失败",
        details: msg,
      },
      { status: isAbort ? 504 : 500 }
    );
  }
}
