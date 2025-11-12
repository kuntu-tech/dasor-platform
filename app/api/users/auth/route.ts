import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET all users (via Supabase Auth)
export async function GET() {
  try {
    // Use admin API to list all users
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.log("Failed to list users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users", details: error.message },
        { status: 500 }
      );
    }

    // Normalize user payload
    const users = data.users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split("@")[0] || "Not set",
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
    }));

    return NextResponse.json({ data: users, message: "Fetched users successfully" });
  } catch (error) {
    console.log("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}