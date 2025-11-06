import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const BUCKET_NAME = "avatars";

export async function POST(request: NextRequest) {
  try {
    // 获取用户ID（从请求头或body中获取）
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

    // 验证文件类型
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type. Supported types: ${ALLOWED_FILE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds limit (Max 5MB)` },
        { status: 400 }
      );
    }

    // 获取用户当前头像URL（用于删除旧文件）
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    // 生成唯一文件名
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    // 将文件转换为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传文件到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.log("上传文件错误:", uploadError);
      
      // 检查是否是 bucket 不存在
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

    // 获取公共URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // 更新数据库中的 avatar_url
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    if (updateError) {
      console.log("更新用户头像URL错误:", updateError);
      // 如果更新失败，尝试删除刚上传的文件
      await supabaseAdmin.storage.from(BUCKET_NAME).remove([fileName]);
      return NextResponse.json(
        { error: "Failed to update user avatar", details: updateError.message },
        { status: 500 }
      );
    }

    // 删除旧头像文件（如果存在且不是默认头像）
    if (currentUser?.avatar_url) {
      try {
        // 从URL中提取文件路径
        const oldUrl = currentUser.avatar_url;
        // 检查是否是 Supabase Storage 的URL
        // 支持多种 URL 格式：
        // 1. https://xxx.supabase.co/storage/v1/object/public/avatars/...
        // 2. https://xxx.supabase.co/storage/v1/object/sign/avatars/...
        if (oldUrl.includes(`/${BUCKET_NAME}/`)) {
          // 提取文件路径（包含 userId 目录）
          const urlParts = oldUrl.split(`/${BUCKET_NAME}/`);
          if (urlParts.length > 1) {
            // 移除可能的查询参数（如签名参数）
            const oldFilePath = urlParts[1].split('?')[0];
            // 确保旧文件路径与新文件路径不同
            if (oldFilePath && oldFilePath !== fileName) {
              try {
                await supabaseAdmin.storage.from(BUCKET_NAME).remove([oldFilePath]);
                console.log(`已删除旧头像文件: ${oldFilePath}`);
              } catch (deleteErr) {
                console.warn(`删除旧头像文件失败 (${oldFilePath}):`, deleteErr);
              }
            }
          }
        }
      } catch (deleteError) {
        // 删除旧文件失败不影响主流程，只记录错误
        console.warn("删除旧头像文件失败:", deleteError);
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: "Avatar uploaded successfully",
    });
  } catch (error) {
    console.log("API错误:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

