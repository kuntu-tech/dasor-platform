export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { warmupSupabase } from "@/lib/supabase-warmup";

const jsonResponse = (body: unknown, init?: ResponseInit) => {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
};

export async function POST(request: NextRequest) {
  try {
    // Warm up Supabase connection early to prevent cold start timeout
    // Don't await - let it run in background while we process the request
    warmupSupabase().catch(() => {
      // Ignore warmup errors, continue with request
    });

    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Add timeout handling for Supabase getUser call to handle cold start
    const getUserPromise = supabaseAdmin.auth.getUser(token);
    const timeoutPromise = new Promise<{
      data: { user: null };
      error: { message: string };
    }>((_, reject) => {
      setTimeout(
        () => reject(new Error("Supabase getUser timeout after 30 seconds")),
        30000
      );
    });

    let getUserResult;
    try {
      getUserResult = await Promise.race([getUserPromise, timeoutPromise]);
    } catch (timeoutError: any) {
      console.log(
        "❌ [users/self] Supabase getUser timeout:",
        timeoutError.message
      );
      return jsonResponse(
        { error: "Authentication service timeout. Please try again." },
        { status: 504 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = getUserResult;

    if (authError || !user) {
      return jsonResponse(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    let bodyUserId: string | undefined;
    try {
      const body = await request.json();
      if (body && typeof body.userId === "string") {
        bodyUserId = body.userId;
      }
    } catch {
      // ignore body parsing errors; treat as undefined
    }

    const targetUserId = bodyUserId ?? user.id;

    // Restrict access to self to prevent forged userId
    if (targetUserId !== user.id) {
      return jsonResponse(
        { error: "Forbidden: userId mismatch" },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("name, avatar_url")
      .eq("id", targetUserId)
      .maybeSingle();

    if (error) {
      return jsonResponse(
        { error: error.message || "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    return jsonResponse({
      success: true,
      data: {
        name: data?.name ?? null,
        avatar_url: data?.avatar_url ?? null,
      },
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while fetching profile",
      },
      { status: 500 }
    );
  }
}
