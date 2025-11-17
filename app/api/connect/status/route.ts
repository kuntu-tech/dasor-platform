import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const { data: vendor, error } = await supabaseAdmin
      .from("dataset_vendors")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.log("Failed to fetch vendor:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch vendor data", details: error.message },
        { status: 500, headers: noStoreHeaders }
      );
    }

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "No vendor found for this user" },
        { status: 404, headers: noStoreHeaders }
      );
    }

    // Log the vendor data for debugging
    console.log(`[API /connect/status] Vendor data for userId ${userId}:`, {
      id: vendor.id,
      email: vendor.email,
      stripe_account_id: vendor.stripe_account_id,
      stripe_account_status: vendor.stripe_account_status,
      is_active: vendor.is_active,
    });

    return NextResponse.json(
      {
        success: true,
        data: vendor,
      },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    console.log("API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

