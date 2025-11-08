import { NextRequest, NextResponse } from "next/server";

const CONNECT_API_BASE = process.env.NEXT_PUBLIC_CONNECT_API_BASE?.replace(/\/$/, "") || "https://test-payment-1j3d.onrender.com";
const SERVICE_API_TOKEN = process.env.NEXT_PUBLIC_SERVICE_API_TOKEN || "";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;
    const body = await request.json();

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: "vendorId is required" },
        { status: 400 }
      );
    }

    // 服务端发起请求，绕过浏览器 CORS 限制
    const targetUrl = `${CONNECT_API_BASE}/api/subscriptions/${vendorId}`;
    console.log("Proxy subscription request to:", targetUrl);
    console.log("Request body:", body);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(SERVICE_API_TOKEN ? { Authorization: `Bearer ${SERVICE_API_TOKEN}` } : {}),
      },
      body: JSON.stringify(body),
    });

    console.log("Proxy response status:", response.status);
    console.log("Proxy response headers:", Object.fromEntries(response.headers.entries()));

    const contentType = response.headers.get("content-type");
    let data;

    try {
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
        console.log("Proxy response data:", JSON.stringify(data));
      } else {
        const text = await response.text();
        console.log("Non-JSON response from proxy:", text.substring(0, 500));
        return NextResponse.json(
          { success: false, error: "Invalid response from backend", details: text.substring(0, 200) },
          { status: 500 }
        );
      }
    } catch (parseError) {
      console.log("Failed to parse response:", parseError);
      return NextResponse.json(
        { success: false, error: "Failed to parse response from backend" },
        { status: 500 }
      );
    }

    // 检查返回的数据是否为空
    if (!data || Object.keys(data).length === 0) {
      console.log("Empty response from backend");
      return NextResponse.json(
        { success: false, error: "Empty response from backend" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.log("Proxy subscription error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process subscription request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

