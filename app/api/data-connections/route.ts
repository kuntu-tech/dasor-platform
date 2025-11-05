import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type Body = {
  userId?: string;
  connectionInfo?: Record<string, any>;
  connectionSource?: string; // default: supabase
  status?: string; // default: active
};

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      connectionInfo,
      connectionSource = "supabase",
      status = "active",
    } = (await req.json()) as Body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    if (!connectionInfo || typeof connectionInfo !== "object") {
      return NextResponse.json(
        { error: "Missing connectionInfo" },
        { status: 400 }
      );
    }

    // 查重：同一用户、同一来源、相同 project_id 视为重复
    if (connectionInfo && typeof connectionInfo === "object") {
      const projectId = (connectionInfo as any)?.project_id;
      if (projectId) {
        const { data: existRows, error: existErr } = await supabaseAdmin
          .from("data_connections")
          .select("id, user_id, created_at")
          .eq("user_id", userId)
          .eq("connection_source", connectionSource)
          .contains("connection_info", { project_id: projectId });
        if (!existErr && Array.isArray(existRows) && existRows.length > 0) {
          return NextResponse.json(
            { success: true, record: existRows[0], duplicated: true },
            { status: 200 }
          );
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from("data_connections")
      .insert([
        {
          user_id: userId,
          connection_info: connectionInfo,
          connection_source: connectionSource,
          status,
        },
      ])
      .select("id, user_id, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, record: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
