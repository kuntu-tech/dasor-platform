import { NextRequest, NextResponse } from "next/server";

const CONNECT_API_BASE =
  process.env.NEXT_PUBLIC_CONNECT_API_BASE?.replace(/\/$/, "") ||
  "https://unfrequentable-sceptical-vince.ngrok-free.dev";
const SERVICE_API_TOKEN = process.env.NEXT_PUBLIC_SERVICE_API_TOKEN || "";
const DEFAULT_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      userId,
      redirectUri,
    }: {
      email?: string;
      userId?: string;
      redirectUri?: string;
    } = body ?? {};

    if (!email) {
      return NextResponse.json(
        { success: false, error: "email is required" },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin") || DEFAULT_APP_URL;
    const normalizedBase = origin.replace(/\/$/, "");
    const resolvedRedirect = redirectUri?.trim()
      ? redirectUri.trim()
      : `${normalizedBase}/oauth/callback`;

    const targetUrl = `${CONNECT_API_BASE}/api/oauth/start`;
    const payload = {
      email,
      userId,
      redirectUri: resolvedRedirect,
    };

    console.log("Ensure vendor via:", targetUrl, payload);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(SERVICE_API_TOKEN
          ? { Authorization: `Bearer ${SERVICE_API_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.log(
        "Ensure vendor unexpected response:",
        text.substring(0, 500)
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from backend",
          details: text.substring(0, 200),
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    console.log("Ensure vendor response:", JSON.stringify(data));

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error || data?.message || "Failed to ensure vendor",
          details: data,
        },
        { status: response.status }
      );
    }

    const vendorId = data?.data?.vendorId;

    if (!vendorId) {
      return NextResponse.json(
        {
          success: false,
          error: "vendorId missing in backend response",
          details: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        vendorId,
        state: data?.data?.state,
      },
    });
  } catch (error) {
    console.log("Ensure vendor error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to ensure vendor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


