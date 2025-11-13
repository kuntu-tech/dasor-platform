import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

// GET /api/users - Retrieve user list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    // Build base query
    let query = supabaseAdmin
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filters when provided
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data: users, error, count } = await query;

    if (error) {
      console.log("Failed to fetch user list:", error);
      return NextResponse.json(
        { error: "Failed to fetch user list", details: error.message },
        { status: 500 }
      );
    }

    // Fetch total count
    const { count: totalCount } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.log("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, avatar_url } = body;

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "This email is already in use" }, { status: 409 });
    }

    // Create new user
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .insert([
        {
          email,
          name,
          avatar_url,
        },
      ])
      .select()
      .single();

    if (error) {
      console.log("Failed to create user:", error);
      return NextResponse.json(
        { error: "Failed to create user", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: "User created successfully",
    });
  } catch (error) {
    console.log("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
