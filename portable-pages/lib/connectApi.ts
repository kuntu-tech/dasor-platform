export const CONNECT_API_BASE =
  process.env.NEXT_PUBLIC_CONNECT_API_BASE?.replace(/\/$/, "") ||
  "https://unfrequentable-sceptical-vince.ngrok-free.dev";

export const SERVICE_API_TOKEN = process.env.NEXT_PUBLIC_SERVICE_API_TOKEN || "";

export interface BindRequestBody {
  vendorId?: number;
  email?: string;
  userId?: string;
  name?: string;
  company_name?: string;
  returnUrl?: string;
  refreshUrl?: string;
}

export interface BindResponse {
  success: boolean;
  data?: {
    vendorId: number;
    stripeAccountId?: string;
    status: "active" | "onboarding" | "not_created";
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    accountType?: string;
    requiresOnboarding: boolean;
    onboarding?: {
      url: string;
      expiresAt: number;
    };
  };
  error?: string;
}

export interface VendorStatusResponse {
  success: boolean;
  data?: {
    id: number;
    email: string;
    name: string;
    company_name: string;
    stripe_account_id: string;
    stripe_account_status: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    user_id: string;
  };
  error?: string;
}

export async function bindVendor(body: BindRequestBody): Promise<BindResponse> {
  const res = await fetch(`${CONNECT_API_BASE}/api/connect/bind`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(SERVICE_API_TOKEN ? { Authorization: `Bearer ${SERVICE_API_TOKEN}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as BindResponse;
  return json;
}

export async function getVendorStatus(userId: string): Promise<VendorStatusResponse> {
  const res = await fetch(`/api/connect/status?userId=${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = (await res.json()) as VendorStatusResponse;
  return json;
}

// OAuth 相关接口
export interface OAuthStartRequestBody {
  email: string;
  userId?: string;
  redirectUri: string;
}

export interface OAuthStartResponse {
  success: boolean;
  data?: {
    authUrl: string;
    state: string;
    vendorId: number;
  };
  error?: string;
}

export interface OAuthLinkRequestBody {
  stripeAccountId: string;
  email?: string;
  userId?: string;
}

export interface OAuthLinkResponse {
  success: boolean;
  data?: {
    vendorId: number;
    stripeAccountId: string;
    accountType: string;
    country: string;
  };
  error?: string;
}

export async function startOAuth(body: OAuthStartRequestBody): Promise<OAuthStartResponse> {
  const url = `${CONNECT_API_BASE}/api/oauth/start`;
  console.log("Calling startOAuth:", url, body);
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(SERVICE_API_TOKEN ? { Authorization: `Bearer ${SERVICE_API_TOKEN}` } : {}),
    },
    body: JSON.stringify(body),
  });

  console.log("startOAuth response status:", res.status);
  const json = (await res.json()) as OAuthStartResponse;
  return json;
}

export async function linkVendorAccount(body: OAuthLinkRequestBody): Promise<OAuthLinkResponse> {
  const res = await fetch(`${CONNECT_API_BASE}/api/oauth/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(SERVICE_API_TOKEN ? { Authorization: `Bearer ${SERVICE_API_TOKEN}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as OAuthLinkResponse;
  return json;
}

// 订阅相关接口
export interface CreateSubscriptionRequestBody {
  interval: "month" | "year";
  successUrl?: string; // 支付成功回调 URL（可选）
  cancelUrl?: string; // 支付取消回调 URL（可选）
}

export interface CreateSubscriptionResponse {
  success: boolean;
  data?: {
    sessionId: string;
    customerId: string;
    checkoutUrl: string;
    priceId: string;
  };
  message?: string;
  error?: string;
}

export async function createSubscription(
  vendorId: number,
  body: CreateSubscriptionRequestBody
): Promise<CreateSubscriptionResponse> {
  // 使用后端代理 API 避免 CORS 问题
  const res = await fetch(`/api/subscriptions/${vendorId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(body),
  });

  // 尝试解析响应
  let json: CreateSubscriptionResponse;
  try {
    json = (await res.json()) as CreateSubscriptionResponse;
  } catch (error) {
    console.error("Failed to parse JSON response:", error);
    return {
      success: false,
      error: `Failed to parse response: ${res.status}`,
    };
  }

  // 检查响应状态和数据
  if (!res.ok) {
    console.error("Subscription API HTTP error:", res.status, json);
    return {
      success: false,
      error: json.error || `HTTP error: ${res.status}`,
    };
  }

  // 检查响应数据是否有 success 字段
  if (json.success === false || (json.success === undefined && !json.data?.checkoutUrl)) {
    console.error("Subscription API error:", res.status, json);
    return {
      success: false,
      error: json.error || json.message || "Subscription request failed",
    };
  }

  return json;
}

// 同步订阅状态接口
export interface SyncSubscriptionStatusResponse {
  success: boolean;
  data?: {
    vendorId: number;
    subscriptionStatus: string;
    transactionId?: number;
  };
  message?: string;
  error?: string;
}

export async function syncSubscriptionStatus(
  vendorId: number,
  sessionId?: string
): Promise<SyncSubscriptionStatusResponse> {
  // 构建请求体（如果提供了 sessionId）
  const requestBody: { sessionId?: string } = {};
  if (sessionId) {
    requestBody.sessionId = sessionId;
  }

  // 使用后端代理 API 避免 CORS 问题
  const res = await fetch(`/api/subscriptions/${vendorId}/sync-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
  });

  // 尝试解析响应
  let json: SyncSubscriptionStatusResponse;
  try {
    json = (await res.json()) as SyncSubscriptionStatusResponse;
  } catch (error) {
    console.error("Failed to parse JSON response:", error);
    return {
      success: false,
      error: `Failed to parse response: ${res.status}`,
    };
  }

  // 检查响应状态和数据
  if (!res.ok) {
    console.error("Sync-status API HTTP error:", res.status, json);
    return {
      success: false,
      error: json.error || `HTTP error: ${res.status}`,
    };
  }

  // 检查响应数据是否有 success 字段
  if (json.success === false) {
    console.error("Sync-status API error:", res.status, json);
    return {
      success: false,
      error: json.error || json.message || "Sync status request failed",
    };
  }

  return json;
}