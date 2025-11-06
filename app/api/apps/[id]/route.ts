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
