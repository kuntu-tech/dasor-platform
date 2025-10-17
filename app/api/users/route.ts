import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

// GET /api/users - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    // 构建查询
    let query = supabaseAdmin
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // 如果有搜索条件，添加搜索
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data: users, error, count } = await query;

    if (error) {
      console.error("获取用户列表错误:", error);
      return NextResponse.json(
        { error: "获取用户列表失败", details: error.message },
        { status: 500 }
      );
    }

    // 获取总数
    const { count: totalCount } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error("API错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// POST /api/users - 创建新用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, avatar_url } = body;

    // 验证必填字段
    if (!email || !name) {
      return NextResponse.json(
        { error: "邮箱和姓名是必填字段" },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "该邮箱已被使用" }, { status: 409 });
    }

    // 创建新用户
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .insert([
        {
          email,
          name,
          avatar_url,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("创建用户错误:", error);
      return NextResponse.json(
        { error: "创建用户失败", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: "用户创建成功",
    });
  } catch (error) {
    console.error("API错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
