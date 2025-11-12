import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Ensure this route is treated as dynamic
export const dynamic = "force-dynamic";

// GET /api/run-results - Fetch run_id list by user_id and task_id
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

    // Query run_results table for all versions matching user_id and task_id
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
      console.log("Failed to query run_results:", error);
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
    console.log("Unexpected error while fetching run_results:", error);
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
