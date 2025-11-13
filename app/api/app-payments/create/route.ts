import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const CONNECT_API_BASE =
  process.env.NEXT_PUBLIC_CONNECT_API_BASE?.replace(/\/$/, "") ||
  "https://test-payment-1j3d.onrender.com";
const SERVICE_API_TOKEN = process.env.NEXT_PUBLIC_SERVICE_API_TOKEN || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { app_userid, successUrl, cancelUrl } = body;

    // Validate required fields
    if (!app_userid) {
      return NextResponse.json(
        { success: false, error: "app_userid is a required field" },
        { status: 400 }
      );
    }

    // Use app_userid to look up app_id from app_users table
    const { data: appUser, error: appUserError } = await supabaseAdmin
      .from("app_users")
      .select("id, app_id")
      .eq("id", app_userid)
      .single();

    if (appUserError || !appUser) {
      return NextResponse.json(
        { success: false, error: "User does not exist or is not associated with any app" },
        { status: 404 }
      );
    }

    if (!appUser.app_id) {
      return NextResponse.json(
        { success: false, error: "User is not associated with any app" },
        { status: 400 }
      );
    }

    // Build request body with app_userid (backend resolves remaining data)
    const requestBody: {
      app_userid: string;
      successUrl?: string;
      cancelUrl?: string;
    } = {
      app_userid,
    };

    // Include callback URLs when provided
    if (successUrl) {
      requestBody.successUrl = successUrl;
    }
    if (cancelUrl) {
      requestBody.cancelUrl = cancelUrl;
    }

    // Forward via server to avoid browser CORS restrictions
    const targetUrl = `${CONNECT_API_BASE}/api/app-payments/create`;
    console.log("Proxy app-payment request to:", targetUrl);
    console.log("Request body:", requestBody);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(SERVICE_API_TOKEN
          ? { Authorization: `Bearer ${SERVICE_API_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(requestBody),
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
          {
            success: false,
            error: "Invalid response from backend",
            details: text.substring(0, 200),
          },
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

    // Propagate external API error payloads
    if (!response.ok) {
      console.log("External API error:", response.status, data);
      return NextResponse.json(
        {
          success: false,
          error: data?.error || data?.message || `External API error: ${response.status}`,
          details: data,
        },
        { status: response.status }
      );
    }

    // Guard against empty responses
    if (!data || Object.keys(data).length === 0) {
      console.log("Empty response from backend");
      return NextResponse.json(
        { success: false, error: "Empty response from backend" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.log("Proxy app-payment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process app-payment request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

