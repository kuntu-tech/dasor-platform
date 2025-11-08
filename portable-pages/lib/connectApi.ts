export const CONNECT_API_BASE =
  process.env.NEXT_PUBLIC_CONNECT_API_BASE?.replace(/\/$/, "") ||
  "https://test-payment-1j3d.onrender.com";

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
    subscription_id?: string | null;
    subscription_status?: string | null;
    subscription_period_end?: string | null;
    charges_enabled?: boolean | null;
    payouts_enabled?: boolean | null;
  };
  error?: string;
}

export async function bindVendor(body: BindRequestBody): Promise<BindResponse> {
  const res = await fetch(`${CONNECT_API_BASE}/api/connect/bind`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
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
      "ngrok-skip-browser-warning": "true",
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
      "ngrok-skip-browser-warning": "true",
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
    sessionId?: string;
    customerId?: string;
    checkoutUrl?: string;
    priceId?: string;
    subscriptionId?: string;
    status?: string;
    alreadySubscribed?: boolean;
    message?: string;
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
    console.log("Failed to parse JSON response:", error);
    return {
      success: false,
      error: `Failed to parse response: ${res.status}`,
    };
  }

  // 检查响应状态和数据
  if (!res.ok) {
    console.log("Subscription API HTTP error:", res.status, json);
    return {
      success: false,
      error: json.error || `HTTP error: ${res.status}`,
    };
  }

  // 检查响应数据是否有 success 字段
  if (json.success === false || (json.success === undefined && !json.data?.checkoutUrl)) {
    console.log("Subscription API error:", res.status, json);
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
    console.log("Failed to parse JSON response:", error);
    return {
      success: false,
      error: `Failed to parse response: ${res.status}`,
    };
  }

  // 检查响应状态和数据
  if (!res.ok) {
    console.log("Sync-status API HTTP error:", res.status, json);
    return {
      success: false,
      error: json.error || `HTTP error: ${res.status}`,
    };
  }

  // 检查响应数据是否有 success 字段
  if (json.success === false) {
    console.log("Sync-status API error:", res.status, json);
    return {
      success: false,
      error: json.error || json.message || "Sync status request failed",
    };
  }

  return json;
}

// App 支付相关接口
export interface CreateAppPaymentRequestBody {
  app_userid: string; // app_users.id - 通过此ID查询获取app_id和用户信息
  successUrl?: string; // 支付成功回调地址（可选）
  cancelUrl?: string; // 支付取消回调地址（可选）
}

export interface CreateAppPaymentResponse {
  success: boolean;
  data?: {
    type: "free" | "paid";
    url?: string; // 付费 App 的支付链接
    sessionId?: string; // 付费 App 的 session ID
    paymentModel?: string; // 支付模式 (subscription/one_time)
    priceAmount?: number; // 价格
    message?: string; // 免费 App 的提示信息
  };
  message?: string;
  error?: string;
  details?: any; // 错误详情（可选）
}

/**
 * 创建 App 支付会话
 * @param body 请求参数 { app_userid } - app_userid 对应 app_users.id
 * @returns 支付信息
 */
export async function createAppPayment(
  body: CreateAppPaymentRequestBody
): Promise<CreateAppPaymentResponse> {
  // 使用后端代理 API 避免 CORS 问题
  const url = `/api/app-payments/create`;
  console.log("Calling createAppPayment:", url, body);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("createAppPayment response status:", res.status);

    // 尝试解析响应
    let json: CreateAppPaymentResponse;
    try {
      json = (await res.json()) as CreateAppPaymentResponse;
    } catch (error) {
      console.log("Failed to parse JSON response:", error);
      return {
        success: false,
        error: `Failed to parse response: ${res.status}`,
      };
    }

    // 检查响应状态
    if (!res.ok) {
      console.log("App Payment API HTTP error:", res.status, json);
      // 尝试获取更详细的错误信息
      const errorMessage = 
        json.error || 
        json.details?.error || 
        json.message || 
        json.details?.message ||
        `HTTP error: ${res.status}`;
      
      return {
        success: false,
        error: errorMessage,
        details: json.details,
      };
    }

    // 检查响应数据
    if (json.success === false) {
      console.log("App Payment API error:", res.status, json);
      return {
        success: false,
        error: json.error || json.message || "创建支付链接失败",
      };
    }

    return json;
  } catch (error) {
    console.log("createAppPayment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "网络错误",
    };
  }
}