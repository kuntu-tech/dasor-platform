import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appId } = await params;
  if (!appId) {
    return NextResponse.json({ error: "Missing appId" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("apps")
      .select("*")
      .eq("id", appId)
      .maybeSingle();

    if (error) {
      console.log("Failed to fetch app details:", error);
      return NextResponse.json(
        { error: "Failed to fetch app details" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "App not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.log("Unexpected error while fetching app details:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, params);
}

async function handleUpdate(
  request: NextRequest,
  paramsPromise: Promise<{ id: string }>
) {
  const { id: appId } = await paramsPromise;
  if (!appId) {
    return NextResponse.json({ error: "Missing appId" }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body cannot be empty" },
        { status: 400 }
      );
    }

    const allowedFields = [
      "name",
      "description",
      "status",
      "app_version",
      "build_status",
      "deployment_status",
      "payment_model",
      "published_at",
      "app_meta_info",
    ];

    const payload: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        payload[field] = body[field];
      }
    }

    if (body.app_meta_info !== undefined) {
      try {
        if (typeof body.app_meta_info === "string") {
          payload.app_meta_info = JSON.parse(body.app_meta_info);
        } else if (
          body.app_meta_info &&
          typeof body.app_meta_info === "object"
        ) {
          payload.app_meta_info = body.app_meta_info;
        } else {
          payload.app_meta_info = null;
        }
      } catch (e) {
        console.warn("Failed to parse app_meta_info", e);
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("apps")
      .update(payload)
      .eq("id", appId)
      .select("*")
      .single();

    if (error) {
      console.log("Failed to update app:", error);
      return NextResponse.json(
        { error: "Failed to update app", details: error.message || String(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.log("Unexpected error while updating app:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appId } = await params;
  if (!appId) {
    return NextResponse.json({ error: "Missing appId" }, { status: 400 });
  }

  try {
    // Verify app exists before deletion
    const { data: existingApp, error: checkError } = await supabaseAdmin
      .from("apps")
      .select("id")
      .eq("id", appId)
      .maybeSingle();

    if (checkError) {
      console.log("Failed to query app:", checkError);
      return NextResponse.json(
        {
          error: "Failed to delete app",
          details: checkError.message || String(checkError),
        },
        { status: 500 }
      );
    }

    if (!existingApp) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    // Perform deletion
    const { data, error } = await supabaseAdmin
      .from("apps")
      .delete()
      .eq("id", appId)
      .select();

    if (error) {
      console.log("Failed to delete app:", error);
      return NextResponse.json(
        {
          error: "Failed to delete app",
          details: error.message || String(error),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "App deleted",
      data: data?.[0] || null,
    });
  } catch (err) {
    console.log("Unexpected error while deleting app:", err);
    const errorMessage =
      err instanceof Error ? err.message : String(err) || "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to delete app",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
