import { NextRequest, NextResponse } from "next/server";

const CONNECT_API_BASE = process.env.NEXT_PUBLIC_CONNECT_API_BASE?.replace(/\/$/, "") || "https://test-payment-1j3d.onrender.com";
const SERVICE_API_TOKEN = process.env.NEXT_PUBLIC_SERVICE_API_TOKEN || "";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: "vendorId is required" },
        { status: 400 }
      );
    }

    // Parse body (sessionId is optional)
    let requestBody: { sessionId?: string } = {};
    try {
      const body = await request.json();
      if (body && body.sessionId) {
        requestBody = { sessionId: body.sessionId };
      }
    } catch {
      // Ignore parsing errors; empty body is valid because sessionId is optional
    }

    // Forward request server-side to avoid browser CORS limitations
    const targetUrl = `${CONNECT_API_BASE}/api/subscriptions/${vendorId}/sync-status`;
    console.log("Proxy sync-status request to:", targetUrl);
    console.log("Sync-status request body:", requestBody);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(SERVICE_API_TOKEN ? { Authorization: `Bearer ${SERVICE_API_TOKEN}` } : {}),
      },
      body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
    });

    console.log("Sync-status response status:", response.status);

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
      console.log("Sync-status response data:", JSON.stringify(data));
    } else {
      const text = await response.text();
      console.log("Non-JSON response from sync-status:", text.substring(0, 500));
      return NextResponse.json(
        { success: false, error: "Invalid response from backend", details: text.substring(0, 200) },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.log("Proxy sync-status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync subscription status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

