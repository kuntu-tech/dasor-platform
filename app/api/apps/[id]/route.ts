import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// APISIX 配置
const APISIX_ADMIN_URL =
  process.env.APISIX_ADMIN_URL || "http://172.31.8.49:9261";
const APISIX_API_KEY =
  process.env.APISIX_API_KEY || "edd1c9f034335f136f87ad84b625c8f1";
const APISIX_ROUTE_ID =
  process.env.APISIX_ROUTE_ID || "593055411876135622";

/**
 * 从 MCP URL 中提取三级域名
 * 例如: https://mcp-l3jw60cf.datail.ai/mcp -> mcp-l3jw60cf
 */
function extractSubdomain(mcpUrl: string): string | null {
  try {
    const url = new URL(mcpUrl);
    const hostname = url.hostname;
    // 匹配 mcp-xxxxx.datail.ai 格式
    const match = hostname.match(/^([^\.]+)\.datail\.ai$/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (e) {
    console.warn("Failed to parse MCP URL:", mcpUrl, e);
    return null;
  }
}

/**
 * 更新 APISIX 路由配置，添加 appName 到 mcp_server_ids 的映射
 */
async function updateApisixRoute(
  appName: string,
  mcpServerId: string
): Promise<boolean> {
  try {
    // 确保 appName 是小写的
    const normalizedAppName = appName.toLowerCase();

    // 先获取现有的路由配置
    const getUrl = `${APISIX_ADMIN_URL}/apisix/admin/routes/${APISIX_ROUTE_ID}`;
    const getResponse = await fetch(getUrl, {
      method: "GET",
      headers: {
        "X-API-KEY": APISIX_API_KEY,
      },
    });

    let existingMapping: Record<string, string> = {};
    if (getResponse.ok) {
      const routeData = await getResponse.json();
      const existingMappingData =
        routeData?.value?.plugins?.["serverless-pre-function"]?.mapping;
      if (existingMappingData && typeof existingMappingData === "object") {
        existingMapping = { ...existingMappingData };
      }
    }

    // 合并新的映射，使用小写的 appName
    const updatedMapping = {
      ...existingMapping,
      [normalizedAppName]: mcpServerId,
    };

    // 更新路由配置
    const patchUrl = `${APISIX_ADMIN_URL}/apisix/admin/routes/${APISIX_ROUTE_ID}`;
    const patchResponse = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        "X-API-KEY": APISIX_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plugins: {
          "serverless-pre-function": {
            mapping: updatedMapping,
          },
        },
      }),
    });

    if (!patchResponse.ok) {
      const errorText = await patchResponse.text();
      console.error(
        `Failed to update APISIX route: ${patchResponse.status}`,
        errorText
      );
      return false;
    }

    console.log(
      `Successfully updated APISIX route mapping: ${normalizedAppName} -> ${mcpServerId}`
    );
    return true;
  } catch (err) {
    console.error("Error updating APISIX route:", err);
    return false;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appId } = await params;
  if (!appId) {
    return NextResponse.json({ error: "Missing appId" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("apps")
      .select("*")
      .eq("id", appId)
      .maybeSingle();

    if (error) {
      console.log("Failed to fetch app details:", error);
      return NextResponse.json(
        { error: "Failed to fetch app details" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "App not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.log("Unexpected error while fetching app details:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, params);
}

async function handleUpdate(
  request: NextRequest,
  paramsPromise: Promise<{ id: string }>
) {
  const { id: appId } = await paramsPromise;
  if (!appId) {
    return NextResponse.json({ error: "Missing appId" }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body cannot be empty" },
        { status: 400 }
      );
    }

    // 获取当前 app 信息，用于后续检查
    const { data: currentApp, error: fetchError } = await supabaseAdmin
      .from("apps")
      .select("id, user_id, name, mcp_server_ids, app_web_link")
      .eq("id", appId)
      .maybeSingle();

    if (fetchError) {
      console.log("Failed to fetch current app:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch app information" },
        { status: 500 }
      );
    }

    if (!currentApp) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    // 如果更新了 name，检查是否与其他 app 冲突
    if (body.name !== undefined && body.name !== currentApp.name) {
      const appName = typeof body.name === "string" ? body.name.trim() : "";
      if (!appName) {
        return NextResponse.json(
          { error: "App name cannot be empty" },
          { status: 400 }
        );
      }

      // 检查同一用户下是否有其他 app 使用相同的 name
      const { data: existingApp, error: checkError } = await supabaseAdmin
        .from("apps")
        .select("id, name")
        .eq("user_id", currentApp.user_id)
        .eq("name", appName)
        .neq("id", appId) // 排除当前 app
        .maybeSingle();

      if (checkError) {
        console.log("Failed to check app name:", checkError);
        return NextResponse.json(
          { error: "Failed to check app name" },
          { status: 500 }
        );
      }

      if (existingApp) {
        return NextResponse.json(
          {
            error: "App name already exists. Please use a different name",
          },
          { status: 409 }
        );
      }
    }

    const allowedFields = [
      "name",
      "description",
      "status",
      "app_version",
      "build_status",
      "deployment_status",
      "payment_model",
      "published_at",
      "app_meta_info",
      "mcp_server_ids",
      "app_web_link",
    ];

    const payload: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        payload[field] = body[field];
      }
    }

    if (body.app_meta_info !== undefined) {
      try {
        if (typeof body.app_meta_info === "string") {
          payload.app_meta_info = JSON.parse(body.app_meta_info);
        } else if (
          body.app_meta_info &&
          typeof body.app_meta_info === "object"
        ) {
          payload.app_meta_info = body.app_meta_info;
        } else {
          payload.app_meta_info = null;
        }
      } catch (e) {
        console.warn("Failed to parse app_meta_info", e);
      }
    }

    // 如果更新了 name，自动生成并存储域名到 app_web_link
    // 只有当用户没有明确提供 app_web_link 时才自动生成
    if (!body.app_web_link) {
      const finalName = payload.name || currentApp.name;
      if (finalName && typeof finalName === "string") {
        const appName = finalName.trim().toLowerCase();
        if (appName) {
          payload.app_web_link = `https://${appName}.datail.ai`;
        }
      }
    } else if (body.app_web_link && typeof body.app_web_link === "string") {
      // 如果用户提供了 app_web_link，确保转换为小写
      payload.app_web_link = body.app_web_link.toLowerCase();
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // 更新数据库
    const { data, error } = await supabaseAdmin
      .from("apps")
      .update(payload)
      .eq("id", appId)
      .select("*")
      .single();

    if (error) {
      console.log("Failed to update app:", error);
      return NextResponse.json(
        { error: "Failed to update app", details: error.message || String(error) },
        { status: 500 }
      );
    }

    // 如果同时更新了 name 和 mcp_server_ids，且 name 不冲突，则更新 APISIX 路由
    const updatedName = payload.name || currentApp.name;
    const updatedMcpServerIds =
      payload.mcp_server_ids || currentApp.mcp_server_ids;

    if (
      updatedName &&
      updatedMcpServerIds &&
      typeof updatedMcpServerIds === "string"
    ) {
      const subdomain = extractSubdomain(updatedMcpServerIds);
      if (subdomain) {
        // 确保 appName 是小写的，然后异步更新 APISIX 路由，不阻塞响应
        const normalizedName =
          typeof updatedName === "string"
            ? updatedName.trim().toLowerCase()
            : updatedName;
        updateApisixRoute(normalizedName, subdomain).catch((err) => {
          console.error("Failed to update APISIX route asynchronously:", err);
        });
      } else {
        console.warn(
          `Failed to extract subdomain from mcp_server_ids: ${updatedMcpServerIds}`
        );
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.log("Unexpected error while updating app:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appId } = await params;
  if (!appId) {
    return NextResponse.json({ error: "Missing appId" }, { status: 400 });
  }

  try {
    // Verify app exists before deletion
    const { data: existingApp, error: checkError } = await supabaseAdmin
      .from("apps")
      .select("id")
      .eq("id", appId)
      .maybeSingle();

    if (checkError) {
      console.log("Failed to query app:", checkError);
      return NextResponse.json(
        {
          error: "Failed to delete app",
          details: checkError.message || String(checkError),
        },
        { status: 500 }
      );
    }

    if (!existingApp) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    // Perform deletion
    const { data, error } = await supabaseAdmin
      .from("apps")
      .delete()
      .eq("id", appId)
      .select();

    if (error) {
      console.log("Failed to delete app:", error);
      return NextResponse.json(
        {
          error: "Failed to delete app",
          details: error.message || String(error),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "App deleted",
      data: data?.[0] || null,
    });
  } catch (err) {
    console.log("Unexpected error while deleting app:", err);
    const errorMessage =
      err instanceof Error ? err.message : String(err) || "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to delete app",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
