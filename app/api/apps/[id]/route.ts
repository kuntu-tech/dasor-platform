import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

// GET /api/apps/[id] - 获取单个应用
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "应用ID不能为空" }, { status: 400 });
    }

    const { data: app, error } = await supabaseAdmin
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
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "应用不存在" }, { status: 404 });
      }
      console.log("获取应用错误:", error);
      return NextResponse.json({ error: "获取应用失败" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: app,
    });
  } catch (error) {
    console.log("获取应用异常:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// PUT /api/apps/[id] - 更新应用
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      name,
      description,
      category,
      tags,
      config,
      metadata,
      is_public,
      status,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "应用ID不能为空" }, { status: 400 });
    }

    // 获取当前用户
    const authHeader = request.headers.get("Authorization");
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json({ error: "无效的认证token" }, { status: 401 });
      }

      // 从users表获取用户ID
      const { data: userProfile, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (userError || !userProfile) {
        return NextResponse.json({ error: "用户信息不存在" }, { status: 404 });
      }

      userId = userProfile.id;
    } else {
      return NextResponse.json({ error: "缺少认证token" }, { status: 401 });
    }

    // 检查应用是否存在且属于当前用户
    const { data: existingApp, error: checkError } = await supabaseAdmin
      .from("apps")
      .select("user_id")
      .eq("id", id)
      .single();

    if (checkError || !existingApp) {
      return NextResponse.json({ error: "应用不存在" }, { status: 404 });
    }

    if (existingApp.user_id !== userId) {
      return NextResponse.json({ error: "无权限修改此应用" }, { status: 403 });
    }

    // 构建更新数据
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (config !== undefined) updateData.config = config;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "published") {
        updateData.published_at = new Date().toISOString();
      }
    }

    // 更新应用
    const { data: app, error } = await supabaseAdmin
      .from("apps")
      .update(updateData)
      .eq("id", id)
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
      console.log("更新应用错误:", error);
      return NextResponse.json({ error: "更新应用失败" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: app,
    });
  } catch (error) {
    console.log("更新应用异常:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// DELETE /api/apps/[id] - 删除应用
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "应用ID不能为空" }, { status: 400 });
    }

    // 获取当前用户
    const authHeader = request.headers.get("Authorization");
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json({ error: "无效的认证token" }, { status: 401 });
      }

      // 从users表获取用户ID
      const { data: userProfile, error: userError } = await supabase
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

    // 检查应用是否存在且属于当前用户
    const { data: existingApp, error: checkError } = await supabaseAdmin
      .from("apps")
      .select("user_id")
      .eq("id", id)
      .single();

    if (checkError || !existingApp) {
      return NextResponse.json({ error: "应用不存在" }, { status: 404 });
    }

    if (existingApp.user_id !== userId) {
      return NextResponse.json({ error: "无权限删除此应用" }, { status: 403 });
    }

    // 删除应用
    const { error } = await supabaseAdmin.from("apps").delete().eq("id", id);

    if (error) {
      console.log("删除应用错误:", error);
      return NextResponse.json({ error: "删除应用失败" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "应用删除成功",
    });
  } catch (error) {
    console.log("删除应用异常:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
