import { CONNECT_API_BASE } from "@/portable-pages/lib/connectApi";

/**
 * Retrieve the Customer Portal URL without opening it
 * @param userId Customer identifier (required)
 * @param returnUrl URL to return to after exiting the portal (optional)
 * @param sessionId Checkout session ID used to quickly resolve the customer (optional)
 * @returns Promise<string | null> URL string on success or null when unavailable
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
 * Open the Customer Portal (billing portal) in a new window
 * @param userId Customer identifier (required)
 * @param returnUrl URL to navigate back to after completion (optional)
 * @param sessionId Checkout session ID to quickly resolve the customer (optional)
 * @param onError Optional error callback function
 */
export async function openBillingPortal(
  userId: string,
  returnUrl?: string,
  sessionId?: string,
  onError?: (message: string) => void
) {
  const url = await getBillingPortalUrl(userId, returnUrl, sessionId);
  if (url) {
    window.open(url, "_blank");
  } else {
    const errorMessage = "Failed to load customer portal, please try again later";
    if (onError) {
      onError(errorMessage);
    } else {
      // Fallback to console error if no callback provided
      console.error(errorMessage);
    }
  }
}
