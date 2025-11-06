import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    const { data: vendor, error } = await supabaseAdmin
      .from("dataset_vendors")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.log("获取vendor错误:", error);
      return NextResponse.json({ success: false, error: "Failed to fetch vendor data", details: error.message }, { status: 500 });
    }

    if (!vendor) {
      return NextResponse.json({ success: false, error: "No vendor found for this user" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    console.log("API错误:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

