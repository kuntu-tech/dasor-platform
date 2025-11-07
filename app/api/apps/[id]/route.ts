import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appId } = await params;
  if (!appId) {
    return NextResponse.json({ error: "缺少 appId" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("apps")
      .select("*")
      .eq("id", appId)
      .maybeSingle();

    if (error) {
      console.log("查询 app 详情失败:", error);
      return NextResponse.json({ error: "查询 app 详情失败" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "未找到对应 app" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.log("app 详情接口异常:", err);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appId } = await params;
  if (!appId) {
    return NextResponse.json({ error: "缺少 appId" }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "请求体不能为空" }, { status: 400 });
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
        } else if (body.app_meta_info && typeof body.app_meta_info === "object") {
          payload.app_meta_info = body.app_meta_info;
        } else {
          payload.app_meta_info = null;
        }
      } catch (e) {
        console.warn("app_meta_info 解析失败", e);
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "没有可更新的字段" },
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
      console.log("更新 app 失败:", error);
      return NextResponse.json(
        { error: "更新 app 失败", details: error.message || String(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.log("更新 app 接口异常:", err);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
