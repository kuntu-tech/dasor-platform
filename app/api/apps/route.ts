import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

// GET /api/apps - Fetch app list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // const page = parseInt(searchParams.get("page") || "1");
    // const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const userId = searchParams.get("user_id");

    // const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from("apps")
      .select(
        `
        *,
        users:user_id (
          id,
          name,
          email,
          avatar_url
        ),
        data_connections:connection_id (
          id,
          connection_info
        )
      `
      )
      .order("created_at", { ascending: false });
    //   .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (status) {
      query = query.eq("status", status);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: apps, error, count } = await query;

    if (error) {
      console.log("Failed to fetch app list:", error);
      return NextResponse.json({ error: "Failed to fetch app list" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: apps,
      //   pagination: {
      //     page,
      //     limit,
      //     total: count || 0,
      //     pages: Math.ceil((count || 0) / limit),
      //   },
    });
  } catch (error) {
    console.log("Unexpected error while fetching app list:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/apps - Create new app
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      status,
      app_version,
      build_status,
      deployment_status,
      payment_model,
      published_at,
      connection_id: bodyConnectionId,
      app_meta_info,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "App name cannot be empty" }, { status: 400 });
    }

    // Retrieve current user (from request header/token)
    const authHeader = request.headers.get("Authorization");
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const {
        data: { user },
        error: authError,
      } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 });
      }

      // Fetch user ID from users table
      const { data: userProfile, error: userError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (userError || !userProfile) {
        return NextResponse.json({ error: "User information not found" }, { status: 404 });
      }

      userId = userProfile.id;
    } else {
      return NextResponse.json({ error: "Missing authentication token" }, { status: 401 });
    }

    // Verify whether app name already exists for this user
    const { data: existingApp, error: checkError } = await supabaseAdmin
      .from("apps")
      .select("id, name")
      .eq("user_id", userId)
      .eq("name", name.trim())
      .maybeSingle();

    if (checkError) {
      console.log("Failed to check app name:", checkError);
      return NextResponse.json({ error: "Failed to check app name" }, { status: 500 });
    }

    if (existingApp) {
      return NextResponse.json(
        {
          error: "App name already exists. Please use a different name",
        },
        { status: 409 }
      );
    }

    // Resolve connection_id: prefer client supplied value, otherwise use latest active connection for user
    let resolvedConnectionId: string | null = bodyConnectionId ?? null;
    if (!resolvedConnectionId) {
      const { data: latestConn, error: latestConnError } = await supabaseAdmin
        .from("data_connections")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestConnError && latestConn?.id) {
        resolvedConnectionId = latestConn.id as string;
      }
    }

    // Create app
    // Normalize app_meta_info: accept string/object directly for JSON column
    let normalizedAppMetaInfo: any = null;
    try {
      if (typeof app_meta_info === "string") {
        normalizedAppMetaInfo = JSON.parse(app_meta_info);
      } else if (app_meta_info && typeof app_meta_info === "object") {
        normalizedAppMetaInfo = app_meta_info;
      }
    } catch (e) {
      console.warn("Failed to parse app_meta_info, defaulting to null", e);
      normalizedAppMetaInfo = null;
    }

    const basePayload: any = {
      user_id: userId,
      name,
      description,
      status,
      app_version,
      build_status,
      deployment_status,
      connection_id: resolvedConnectionId,
      payment_model,
      published_at,
    };
    if (normalizedAppMetaInfo !== null) {
      basePayload.app_meta_info = normalizedAppMetaInfo;
    }

    let appInsert = await supabaseAdmin
      .from("apps")
      .insert([basePayload])
      .select(
        `
        *,
        users:user_id (
          id,
          name,
          email,
          avatar_url
        ),
        data_connections:connection_id (
          id,
          connection_info
        )
      `
      )
      .single();

    // Fall back: if insert fails due to missing column, retry without app_meta_info
    if (appInsert.error && normalizedAppMetaInfo) {
      const msg = appInsert.error.message || "";
      if (msg.includes("app_meta_info") || msg.includes("column")) {
        const fallbackPayload = { ...basePayload };
        delete (fallbackPayload as any).app_meta_info;
        appInsert = await supabaseAdmin
          .from("apps")
          .insert([fallbackPayload])
          .select(
            `
            *,
            users:user_id (
              id,
              name,
              email,
              avatar_url
            ),
            data_connections:connection_id (
              id,
              connection_info
            )
          `
          )
          .single();
      }
    }

    const { data: app, error } = appInsert;

    if (error) {
      console.log("Failed to create app:", error);
      return NextResponse.json(
        { error: "Failed to create app", details: error.message || String(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: app,
    });
  } catch (error) {
    console.log("Unexpected error while creating app:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
