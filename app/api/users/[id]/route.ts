import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      console.log("Failed to fetch user:", error);
      return NextResponse.json(
        { error: "Failed to fetch user", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.log("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user information
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { email, full_name, avatar_url, role, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If updating email, ensure it is not used by other users
    if (email) {
      const { data: emailExists } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email)
        .neq("id", id)
        .single();

      if (emailExists) {
        return NextResponse.json(
          { error: "Email is already in use by another user" },
          { status: 409 }
        );
      }
    }

    // Build update payload
    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;
    updateData.updated_at = new Date().toISOString();

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.log("Failed to update user:", error);
      return NextResponse.json(
        { error: "Failed to update user", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: "User information updated successfully",
    });
  } catch (error) {
    console.log("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error } = await supabaseAdmin.from("users").delete().eq("id", id);

    if (error) {
      console.log("Failed to delete user:", error);
      return NextResponse.json(
        { error: "Failed to delete user", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
