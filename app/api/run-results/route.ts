import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// 确保路由是动态的
export const dynamic = "force-dynamic";

// GET /api/run-results - 根据 user_id 和 task_id 获取 run_id 列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const taskId = searchParams.get("task_id");

    if (!userId || !taskId) {
      return NextResponse.json(
        { error: "user_id and task_id are required" },
        { status: 400 }
      );
    }

    // 查询 run_results 表
    // 根据 user_id 和 task_id 查询该项目的所有版本
    console.log(
      "Querying run_results for user_id:",
      userId,
      "task_id:",
      taskId
    );

    const { data, error } = await supabaseAdmin
      .from("run_results")
      .select("run_id, task_id, user_id, created_at")
      .eq("user_id", userId)
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    console.log("Query result count:", data?.length || 0);
    console.log("Query result data:", data);

    if (error) {
      console.log("查询 run_results 错误:", error);
      console.log("Error code:", error.code);
      console.log("Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        {
          error: "Failed to fetch run results",
          details: error.message || "Database query failed",
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.log("获取 run_results 异常:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.log("Error details:", errorDetails);
    return NextResponse.json(
      {
        error: "Failed to fetch run results",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
