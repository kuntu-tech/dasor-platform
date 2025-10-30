import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

// GET /api/apps - 获取应用列表
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

    // 构建查询
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

    // 添加过滤条件
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
      console.error("获取应用列表错误:", error);
      return NextResponse.json({ error: "获取应用列表失败" }, { status: 500 });
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
    console.error("获取应用列表异常:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// POST /api/apps - 创建新应用
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
    } = body;

    // 验证必填字段
    if (!name) {
      return NextResponse.json({ error: "应用名称不能为空" }, { status: 400 });
    }

    // 获取当前用户（从请求头或token中获取）
    const authHeader = request.headers.get("Authorization");
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const {
        data: { user },
        error: authError,
      } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: "无效的认证token" }, { status: 401 });
      }

      // 从users表获取用户ID
      const { data: userProfile, error: userError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (userError || !userProfile) {
        return NextResponse.json({ error: "用户信息不存在" }, { status: 404 });
      }

      userId = userProfile.id;
    } else {
      return NextResponse.json({ error: "缺少认证token" }, { status: 401 });
    }

    // 检查应用名称是否已存在（同一用户下）
    const { data: existingApp, error: checkError } = await supabaseAdmin
      .from("apps")
      .select("id, name")
      .eq("user_id", userId)
      .eq("name", name.trim())
      .maybeSingle();

    if (checkError) {
      console.error("检查应用名称错误:", checkError);
      return NextResponse.json({ error: "检查应用名称失败" }, { status: 500 });
    }

    if (existingApp) {
      return NextResponse.json(
        {
          error: "应用名称已存在，请使用其他名称",
        },
        { status: 409 }
      );
    }

    // 解析 connection_id：优先使用前端传入；否则为当前用户选取最近激活的数据连接
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

    // 创建应用
    const { data: app, error } = await supabaseAdmin
      .from("apps")
      .insert([
        {
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
        },
      ])
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

    if (error) {
      console.error("创建应用错误:", error);
      return NextResponse.json({ error: "创建应用失败" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: app,
    });
  } catch (error) {
    console.error("创建应用异常:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
