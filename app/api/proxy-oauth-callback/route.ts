import { NextRequest, NextResponse } from "next/server";

const CONNECT_API_BASE = process.env.NEXT_PUBLIC_CONNECT_API_BASE?.replace(/\/$/, "") || "https://test-payment-1j3d.onrender.com";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.json({ success: false, error: "Missing code or state" }, { status: 400 });
    }

    // Forward request server-side to bypass browser restrictions
    const targetUrl = `${CONNECT_API_BASE}/api/oauth/callback?code=${code}&state=${state}`;
    console.log("Proxy forwarding to:", targetUrl);
    console.log("Proxy headers:", {
      "Accept": "application/json",
      "User-Agent": "curl/7.68.0",
      "ngrok-skip-browser-warning": "any",
    });
    
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "curl/7.68.0",
        "ngrok-skip-browser-warning": "any",
      },
    });

    console.log("Proxy response status:", response.status, response.headers.get("content-type"));

    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.log("Non-JSON response from proxy:", text.substring(0, 500));
      return NextResponse.json(
        { success: false, error: "Invalid response from backend" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.log("Proxy OAuth callback error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process OAuth callback" },
      { status: 500 }
    );
  }
}

