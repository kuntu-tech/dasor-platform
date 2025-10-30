import { NextRequest, NextResponse } from "next/server";

type ValidateRequestBody = {
  projectId?: string;
  accessToken?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { projectId, accessToken } =
      (await req.json()) as ValidateRequestBody;

    if (!projectId || !accessToken) {
      return NextResponse.json(
        { success: false, error: "Missing projectId or accessToken" },
        { status: 400 }
      );
    }

    const url = `https://mcp.supabase.com/mcp?project_ref=${encodeURIComponent(
      projectId
    )}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "User-Agent": "MCP-Validate/1.0",
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
        signal: controller.signal,
        // Do not cache sensitive validations
        cache: "no-store",
      });
    } finally {
      clearTimeout(timeout);
    }

    const text = await res.text();

    if (res.ok) {
      return NextResponse.json({
        success: true,
        statusCode: res.status,
        data: text,
      });
    }

    let friendlyError = `HTTP ${res.status}`;
    if (res.status === 401) friendlyError = "Unauthorized - 凭据无效";
    if (res.status === 404) friendlyError = "Not Found - 项目不存在";

    return NextResponse.json(
      {
        success: false,
        statusCode: res.status,
        error: friendlyError,
        data: text,
      },
      { status: res.status }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isAbort =
      message.toLowerCase().includes("aborted") ||
      message.includes("The user aborted a request");
    return NextResponse.json(
      { success: false, error: isAbort ? "Request timeout" : message },
      { status: isAbort ? 504 : 500 }
    );
  }
}
