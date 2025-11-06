import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    // 1. 检查 dataset_vendors 表中是否有该用户的记录
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from("dataset_vendors")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (vendorError) {
      console.log("Error checking vendor:", vendorError);
      return NextResponse.json(
        { success: false, error: "Failed to check vendor data" },
        { status: 500 }
      );
    }

    // 如果没有 vendor 记录，返回未绑定 Stripe 账户
    if (!vendor) {
      return NextResponse.json({
        success: true,
        hasVendor: false,
        hasPaymentHistory: false,
        status: "no_vendor",
        message: "Stripe account not connected",
      });
    }

    // 2. 检查 transactions 表中是否有该 vendor_id 的记录
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("vendor_id", vendor.id)
      .limit(1);

    if (transactionsError) {
      console.log("Error checking transactions:", transactionsError);
      return NextResponse.json(
        { success: false, error: "Failed to check transactions" },
        { status: 500 }
      );
    }

    // 如果有交易记录，返回 true
    const hasPaymentHistory = transactions && transactions.length > 0;

    return NextResponse.json({
      success: true,
      hasVendor: true,
      hasPaymentHistory,
      vendorId: vendor.id,
      status: hasPaymentHistory ? "has_payment_history" : "no_payment_history",
      message: hasPaymentHistory
        ? "Payment history found"
        : "No payment history found",
    });
  } catch (error) {
    console.log("Error in check-payment-history:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

