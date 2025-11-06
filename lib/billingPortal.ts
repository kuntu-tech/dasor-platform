import { CONNECT_API_BASE } from "@/portable-pages/lib/connectApi";

/**
 * 打开 Customer Portal (账单门户)
 * @param userId 用户 ID (必填)
 * @param returnUrl 客户完成操作后返回的 URL (可选)
 * @param sessionId Checkout Session ID，用于快速获取 customer ID (可选)
 */
export async function openBillingPortal(
  userId: string,
  returnUrl?: string,
  sessionId?: string
) {
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
        },
      }
    );

    const result = await response.json();

    if (result.success && result.data?.url) {
      // 在新窗口打开 Customer Portal
      window.open(result.data.url, "_blank");
    } else {
      console.error("获取 Customer Portal URL 失败:", result.error);
      // 处理错误情况
      if (result.error?.includes("未找到客户的 Stripe Customer ID")) {
        alert("请先完成支付后再访问客户门户");
      } else {
        alert(result.message || "获取客户门户失败");
      }
    }
  } catch (error) {
    console.error("请求失败:", error);
    alert("网络错误，请稍后重试");
  }
}
