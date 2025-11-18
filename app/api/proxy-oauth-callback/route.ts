import { NextRequest, NextResponse } from "next/server";
import { warmupSupabase } from "@/lib/supabase-warmup";

const CONNECT_API_BASE =
  process.env.NEXT_PUBLIC_CONNECT_API_BASE?.replace(/\/$/, "") ||
  "https://test-payment-1j3d.onrender.com";
const SERVICE_API_TOKEN = process.env.NEXT_PUBLIC_SERVICE_API_TOKEN || "";

export async function GET(request: NextRequest) {
  try {
    // Warm up Supabase connection early to prevent cold start timeout
    // This helps ensure subsequent Supabase calls in the OAuth flow are fast
    warmupSupabase().catch(() => {
      // Ignore warmup errors, continue with request
    });

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.json(
        { success: false, error: "Missing code or state" },
        { status: 400 }
      );
    }

    // Forward request server-side to bypass browser restrictions
    const targetUrl = `${CONNECT_API_BASE}/api/oauth/callback?code=${code}&state=${state}`;
    console.log("Proxy forwarding to:", targetUrl);
    console.log("Proxy headers:", {
      Accept: "application/json",
      "User-Agent": "curl/7.68.0",
      "ngrok-skip-browser-warning": "any",
      ...(SERVICE_API_TOKEN ? { Authorization: "Bearer ***" } : {}),
    });

    // Add timeout for external API call (40 seconds to handle cold starts)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("⏱️ Proxy fetch timeout after 40 seconds");
      controller.abort();
    }, 40000);

    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "curl/7.68.0",
          "ngrok-skip-browser-warning": "any",
          ...(SERVICE_API_TOKEN
            ? { Authorization: `Bearer ${SERVICE_API_TOKEN}` }
            : {}),
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        console.log("❌ Proxy fetch timeout");
        return NextResponse.json(
          {
            success: false,
            error:
              "Request timeout. The service may be starting up. Please try again.",
          },
          { status: 504 }
        );
      }
      throw fetchError;
    }

    console.log(
      "Proxy response status:",
      response.status,
      response.headers.get("content-type")
    );

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
