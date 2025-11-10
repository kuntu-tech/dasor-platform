export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const jsonResponse = (body: unknown, init?: ResponseInit) => {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
};

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

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

    // 限制只能访问自己的数据，避免伪造 userId
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

