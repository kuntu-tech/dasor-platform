import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// 获取所有用户（从Supabase Auth）
export async function GET() {
  try {
    // 使用admin API获取所有用户
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("获取用户失败:", error);
      return NextResponse.json(
        { error: "获取用户失败", details: error.message },
        { status: 500 }
      );
    }

    // 格式化用户数据
    const users = data.users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split("@")[0] || "未设置",
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
    }));

    return NextResponse.json({ data: users, message: "获取用户成功" });
  } catch (error) {
    console.error("API错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}