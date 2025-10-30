export const CONNECT_API_BASE =
  process.env.NEXT_PUBLIC_CONNECT_API_BASE?.replace(/\/$/, "") ||
  "https://unfrequentable-sceptical-vince.ngrok-free.dev";

export const SERVICE_API_TOKEN = process.env.NEXT_PUBLIC_SERVICE_API_TOKEN || "";

export interface BindRequestBody {
  vendorId?: number;
  email?: string;
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


