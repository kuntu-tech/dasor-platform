import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { warmupSupabase } from "@/lib/supabase-warmup";

export async function GET(request: NextRequest) {
  try {
    // Warm up Supabase connection early to prevent cold start timeout
    warmupSupabase().catch(() => {
      // Ignore warmup errors, continue with request
    });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    // Step 1: check dataset_vendors for this user's record
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

    // No vendor record means Stripe account is not linked
    if (!vendor) {
      return NextResponse.json({
        success: true,
        hasVendor: false,
        hasPaymentHistory: false,
        status: "no_vendor",
        message: "Stripe account not connected",
      });
    }

    // Step 2: check whether transactions exist for the vendor_id
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

    // Return true when transactions exist
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

