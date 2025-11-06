import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // 查询 dataset_vendors 表
    const { data, error } = await supabaseAdmin
      .from("dataset_vendors")
      .select("subscription_status, subscription_period_end")
      .eq("user_id", userId)
      .single();

    if (error) {
      // 如果查询失败（可能是记录不存在），返回未订阅状态
      if (error.code === "PGRST116") {
        return NextResponse.json({
          hasActiveSubscription: false,
          message: "No subscription found",
        });
      }
      console.log("Error checking subscription:", error);
      return NextResponse.json(
        { error: "Failed to check subscription" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({
        hasActiveSubscription: false,
        message: "No subscription found",
      });
    }

    // 检查订阅状态和到期时间
    const now = new Date();
    let periodEnd: Date | null = null;

    if (data.subscription_period_end) {
      try {
        periodEnd = new Date(data.subscription_period_end);
        // 检查日期是否有效
        if (isNaN(periodEnd.getTime())) {
          periodEnd = null;
        }
      } catch (e) {
        console.log("Invalid date format:", data.subscription_period_end);
        periodEnd = null;
      }
    }

    const hasActiveSubscription =
      data.subscription_status === "active" &&
      periodEnd !== null &&
      periodEnd.getTime() > now.getTime();

    return NextResponse.json({
      hasActiveSubscription,
      subscriptionStatus: data.subscription_status,
      subscriptionPeriodEnd: data.subscription_period_end,
    });
  } catch (error) {
    console.log("Error in check-subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
