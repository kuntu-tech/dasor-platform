export interface EnsureVendorRequestBody {
  email: string;
  userId?: string;
  redirectUri?: string;
}

export interface EnsureVendorResponse {
  success: boolean;
  data?: {
    vendorId: number;
    state?: string;
  };
  error?: string;
  details?: unknown;
}

export async function ensureVendor(
  body: EnsureVendorRequestBody
): Promise<EnsureVendorResponse> {
  const res = await fetch(`/api/vendors/ensure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  let json: EnsureVendorResponse;
  try {
    json = (await res.json()) as EnsureVendorResponse;
  } catch (error) {
    console.log("Failed to parse ensureVendor response:", error);
    return {
      success: false,
      error: `Failed to parse response: ${res.status}`,
    };
  }

  if (!res.ok || json.success === false) {
    return {
      success: false,
      error:
        json.error ||
        (typeof json.details === "string" ? json.details : undefined) ||
        `HTTP error: ${res.status}`,
      details: json.details,
    };
  }

  return json;
}


