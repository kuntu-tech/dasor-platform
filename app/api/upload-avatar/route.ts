import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const BUCKET_NAME = "avatars";

export async function POST(request: NextRequest) {
  try {
    // Retrieve user ID from form payload
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID cannot be empty" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type. Supported types: ${ALLOWED_FILE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds limit (Max 5MB)` },
        { status: 400 }
      );
    }

    // Fetch current avatar URL so we can delete any previous file
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    // Generate unique file name
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.log("Avatar upload error:", uploadError);
      
      // Detect missing bucket scenarios
      if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("not found")) {
        return NextResponse.json(
          { 
            error: "Bucket not found", 
            details: "Please create a Storage bucket named 'avatars' in the Supabase Dashboard and set it to public access" 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: "File upload failed", details: uploadError.message },
        { status: 500 }
      );
    }

    // Generate public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update avatar_url in database
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    if (updateError) {
      console.log("Failed to update user avatar URL:", updateError);
      // Delete the newly uploaded file if database update fails
      await supabaseAdmin.storage.from(BUCKET_NAME).remove([fileName]);
      return NextResponse.json(
        { error: "Failed to update user avatar", details: updateError.message },
        { status: 500 }
      );
    }

    // Remove previous avatar file when applicable
    if (currentUser?.avatar_url) {
      try {
        // Extract file path from URL
        const oldUrl = currentUser.avatar_url;
        // Confirm URL belongs to Supabase Storage; supports formats like:
        // 1. https://xxx.supabase.co/storage/v1/object/public/avatars/...
        // 2. https://xxx.supabase.co/storage/v1/object/sign/avatars/...
        if (oldUrl.includes(`/${BUCKET_NAME}/`)) {
          // Extract file path including userId directory
          const urlParts = oldUrl.split(`/${BUCKET_NAME}/`);
          if (urlParts.length > 1) {
            // Strip query parameters (e.g., signed URLs)
            const oldFilePath = urlParts[1].split('?')[0];
            // Ensure old file path differs from the new one
            if (oldFilePath && oldFilePath !== fileName) {
              try {
                await supabaseAdmin.storage.from(BUCKET_NAME).remove([oldFilePath]);
                console.log(`Deleted previous avatar file: ${oldFilePath}`);
              } catch (deleteErr) {
                console.warn(`Failed to delete previous avatar file (${oldFilePath}):`, deleteErr);
              }
            }
          }
        }
      } catch (deleteError) {
        // Non-fatal: log the failure
        console.warn("Failed to remove previous avatar file:", deleteError);
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: "Avatar uploaded successfully",
    });
  } catch (error) {
    console.log("API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

