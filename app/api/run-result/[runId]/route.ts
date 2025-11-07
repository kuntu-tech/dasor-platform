import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/run-result/[runId] - 根据 user_id、task_id 和 run_id 获取完整的数据
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const taskId = searchParams.get("task_id");

    if (!runId) {
      return NextResponse.json(
        { error: "run_id is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    if (!taskId) {
      return NextResponse.json(
        { error: "task_id is required" },
        { status: 400 }
      );
    }

    console.log(
      "Fetching run_result for runId:",
      runId,
      "user_id:",
      userId,
      "task_id:",
      taskId
    );

    // 查询 run_results 表，根据 user_id、task_id 和 run_id 获取 run_result 字段
    const { data, error } = await supabaseAdmin
      .from("run_results")
      .select("run_result, run_id, task_id, user_id")
      .eq("run_id", runId)
      .eq("user_id", userId)
      .eq("task_id", taskId);

    if (error) {
      console.error("查询 run_results 错误:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Failed to fetch run result", details: error.message },
        { status: 500 }
      );
    }

    console.log("Query result:", {
      dataType: Array.isArray(data) ? "array" : typeof data,
      dataLength: Array.isArray(data) ? data.length : "N/A",
      hasData: !!data,
    });

    if (!data) {
      console.warn("No data returned from query");
      return NextResponse.json(
        { error: "Run result not found" },
        { status: 404 }
      );
    }

    // 处理数组结果
    let result;
    if (Array.isArray(data)) {
      if (data.length === 0) {
        console.warn("Empty array returned");
        return NextResponse.json(
          { error: "Run result not found" },
          { status: 404 }
        );
      }
      result = data[0];
    } else {
      result = data;
    }

    console.log("Extracted result:", {
      hasRunResult: !!result.run_result,
      runResultType: typeof result.run_result,
    });

    return NextResponse.json({
      success: true,
      data: result.run_result || null,
    });
  } catch (error) {
    console.error("获取 run_result 异常:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
