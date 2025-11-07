import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionStatus } from "@/lib/subscription/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    try {
      const status = await getSubscriptionStatus(userId);

      if (!status) {
        return NextResponse.json({
          hasActiveSubscription: false,
          message: "No subscription found",
        });
      }

      return NextResponse.json(status);
    } catch (error) {
      console.log("Error checking subscription:", error);
      return NextResponse.json(
        { error: "Failed to check subscription" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.log("Error in check-subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
