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


