import { CONNECT_API_BASE } from "@/portable-pages/lib/connectApi";

/**
 * 获取 Customer Portal URL（不直接打开）
 * @param userId 用户 ID (必填)
 * @param returnUrl 客户完成操作后返回的 URL (可选)
 * @param sessionId Checkout Session ID，用于快速获取 customer ID (可选)
 * @returns Promise<string | null> 返回 URL 或 null（如果失败）
 */
export async function getBillingPortalUrl(
  userId: string,
  returnUrl?: string,
  sessionId?: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      userId: userId,
    });

    if (returnUrl) {
      params.append("returnUrl", returnUrl);
    }

    if (sessionId) {
      params.append("sessionId", sessionId);
    }

    const response = await fetch(
      `${CONNECT_API_BASE}/api/user-payments/billing-portal?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    const result = await response.json();

    if (result.success && result.data?.url) {
      console.log("Customer Portal URL retrieved successfully:", result.data.url);
      return result.data.url;
    } else {
      console.log("Failed to retrieve Customer Portal URL:", result);
      return null;
    }
  } catch (error) {
    console.log("Request failed:", error);
    return null;
  }
}

/**
 * 打开 Customer Portal (账单门户) - 在新窗口打开
 * @param userId 用户 ID (必填)
 * @param returnUrl 客户完成操作后返回的 URL (可选)
 * @param sessionId Checkout Session ID，用于快速获取 customer ID (可选)
 */
export async function openBillingPortal(
  userId: string,
  returnUrl?: string,
  sessionId?: string
) {
  const url = await getBillingPortalUrl(userId, returnUrl, sessionId);
  if (url) {
    window.open(url, "_blank");
  } else {
    alert("Failed to load customer portal, please try again later");
  }
}
