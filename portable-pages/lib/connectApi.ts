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
    note?: {
      previouslyDisconnected: boolean;
      previousAccountId?: string;
      message: string;
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
    livemode?: boolean | null; // Stripe account mode: true for live, false for test
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
  // Add timeout to prevent long waits
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout

  try {
    const res = await fetch(`/api/connect/status?userId=${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await res.text();
    let json: VendorStatusResponse | undefined;

    if (rawText) {
      try {
        json = JSON.parse(rawText) as VendorStatusResponse;
      } catch (parseError) {
        console.warn("Failed to parse vendor status response:", parseError);
      }
    }

    if (!res.ok) {
      const notFoundMessage = res.status === 404 ? "Vendor status not found" : `Request failed: ${res.status}`;
      return {
        success: false,
        error: json?.error || notFoundMessage,
      };
    }

    if (!json) {
      return {
        success: false,
        error: "Invalid vendor status response",
      };
    }

    return json;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("getVendorStatus request error:", error);
    const errorMessage = error instanceof Error && error.name === "AbortError"
      ? "Request timeout"
      : error instanceof Error ? error.message : "Network error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// OAuth-related interfaces
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

// Subscription-related interfaces
export interface CreateSubscriptionRequestBody {
  interval: "month" | "year";
  successUrl?: string; // Callback URL after successful payment (optional)
  cancelUrl?: string; // Callback URL after payment cancellation (optional)
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
  // Use the backend proxy API to avoid CORS issues
  const res = await fetch(`/api/subscriptions/${vendorId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(body),
  });

  // Attempt to parse the response
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

  // Validate response status and payload
  if (!res.ok) {
    console.log("Subscription API HTTP error:", res.status, json);
    return {
      success: false,
      error: json.error || `HTTP error: ${res.status}`,
    };
  }

  // Ensure the response includes a success flag
  if (json.success === false || (json.success === undefined && !json.data?.checkoutUrl)) {
    console.log("Subscription API error:", res.status, json);
    return {
      success: false,
      error: json.error || json.message || "Subscription request failed",
    };
  }

  return json;
}

// Sync subscription status API
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
  // Build the request body (include sessionId when provided)
  const requestBody: { sessionId?: string } = {};
  if (sessionId) {
    requestBody.sessionId = sessionId;
  }

  // Use the backend proxy API to avoid CORS issues
  const res = await fetch(`/api/subscriptions/${vendorId}/sync-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
  });

  // Attempt to parse the response
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

  // Validate response status and payload
  if (!res.ok) {
    console.log("Sync-status API HTTP error:", res.status, json);
    return {
      success: false,
      error: json.error || `HTTP error: ${res.status}`,
    };
  }

  // Ensure the response indicates success
  if (json.success === false) {
    console.log("Sync-status API error:", res.status, json);
    return {
      success: false,
      error: json.error || json.message || "Sync status request failed",
    };
  }

  return json;
}

// App payment interfaces
export interface CreateAppPaymentRequestBody {
  app_userid: string; // app_users.id – used to look up app_id and user details
  successUrl?: string; // Callback URL after successful payment (optional)
  cancelUrl?: string; // Callback URL when payment is cancelled (optional)
}

export interface CreateAppPaymentResponse {
  success: boolean;
  data?: {
    type: "free" | "paid";
    url?: string; // Payment link for paid apps
    sessionId?: string; // Session ID for paid apps
    paymentModel?: string; // Payment mode (subscription/one_time)
    priceAmount?: number; // Price amount
    message?: string; // Informational message for free apps
  };
  message?: string;
  error?: string;
  details?: any; // Additional error details (optional)
}

/**
 * Create an app payment session
 * @param body Request payload { app_userid } - corresponds to app_users.id
 * @returns Payment information
 */
export async function createAppPayment(
  body: CreateAppPaymentRequestBody
): Promise<CreateAppPaymentResponse> {
  // Use the backend proxy API to avoid CORS issues
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

    // Attempt to parse the response
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

    // Validate response status
    if (!res.ok) {
      console.log("App Payment API HTTP error:", res.status, json);
      // Attempt to extract more detailed error information
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

    // Validate response payload
    if (json.success === false) {
      console.log("App Payment API error:", res.status, json);
      return {
        success: false,
        error: json.error || json.message || "Failed to create payment link",
      };
    }

    return json;
  } catch (error) {
    console.log("createAppPayment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Login link interfaces
export interface GetLoginLinkResponse {
  success: boolean;
  data?: {
    url: string; // Temporary login link (when onboarding complete) or direct Dashboard URL (when onboarding incomplete)
    dashboardUrl: string; // Direct dashboard URL (for reference)
    accountType: string; // 'standard', 'express', 'custom'
    livemode: boolean; // true for live, false for test
    requiresOnboarding?: boolean; // true if account needs to complete onboarding
    onboardingUrl?: string; // Onboarding link to complete account setup
    message?: string; // Message when onboarding is required
    warning?: string; // Warning message when login link creation fails
    note?: string; // Additional note about the response
  };
  message?: string; // Top-level message (when onboarding is required)
  error?: string;
}

// Disconnect account interfaces
export interface DisconnectAccountResponse {
  success: boolean;
  data?: {
    vendorId: number;
    message: string;
    disconnectedAt: string;
    canReconnect: boolean;
    warning?: {
      hasActiveSubscription: boolean;
      subscriptionStatus: string;
      message: string;
    };
  };
  error?: string;
}

/**
 * Get Stripe Dashboard login link for a vendor
 * @param vendorId Vendor ID (required)
 * @returns Login link response with temporary login URL and dashboard URL
 */
export async function getLoginLink(
  vendorId: number
): Promise<GetLoginLinkResponse> {
  try {
    const url = `${CONNECT_API_BASE}/api/connect/${vendorId}/login-link`;
    console.log("Calling getLoginLink:", url, { vendorId });

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(SERVICE_API_TOKEN ? { Authorization: `Bearer ${SERVICE_API_TOKEN}` } : {}),
      },
    });

    console.log("getLoginLink response status:", res.status);

    // Attempt to parse the response
    let json: GetLoginLinkResponse;
    try {
      json = (await res.json()) as GetLoginLinkResponse;
    } catch (error) {
      console.log("Failed to parse JSON response:", error);
      return {
        success: false,
        error: `Failed to parse response: ${res.status}`,
      };
    }

    // Validate response status
    if (!res.ok) {
      console.log("Login link API HTTP error:", res.status, json);
      return {
        success: false,
        error: json.error || `HTTP error: ${res.status}`,
      };
    }

    // Ensure the response indicates success
    if (json.success === false) {
      console.log("Login link API error:", res.status, json);
      return {
        success: false,
        error: json.error || "Failed to get login link",
      };
    }

    return json;
  } catch (error) {
    console.log("getLoginLink error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Disconnect a Stripe Connect account
 * @param vendorId Vendor ID (required)
 * @param userId User ID (optional, for logging purposes)
 * @returns Disconnect result with optional subscription warning
 */
export async function disconnectAccount(
  vendorId: number,
  userId?: string
): Promise<DisconnectAccountResponse> {
  try {
    const url = `${CONNECT_API_BASE}/api/connect/${vendorId}/disconnect`;
    console.log("Calling disconnectAccount:", url, { vendorId, userId });

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(SERVICE_API_TOKEN ? { Authorization: `Bearer ${SERVICE_API_TOKEN}` } : {}),
      },
      body: userId ? JSON.stringify({ userId }) : undefined,
    });

    console.log("disconnectAccount response status:", res.status);

    // Attempt to parse the response
    let json: DisconnectAccountResponse;
    try {
      json = (await res.json()) as DisconnectAccountResponse;
    } catch (error) {
      console.log("Failed to parse JSON response:", error);
      return {
        success: false,
        error: `Failed to parse response: ${res.status}`,
      };
    }

    // Validate response status
    if (!res.ok) {
      console.log("Disconnect API HTTP error:", res.status, json);
      return {
        success: false,
        error: json.error || `HTTP error: ${res.status}`,
      };
    }

    // Ensure the response indicates success
    if (json.success === false) {
      console.log("Disconnect API error:", res.status, json);
      return {
        success: false,
        error: json.error || "Failed to disconnect account",
      };
    }

    return json;
  } catch (error) {
    console.log("disconnectAccount error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}