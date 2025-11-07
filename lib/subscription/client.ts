"use client";

export interface SubscriptionCheckResponse {
  hasActiveSubscription: boolean;
  subscriptionStatus?: string | null;
  subscriptionPeriodEnd?: string | null;
}

export async function fetchSubscriptionStatus(
  userId: string
): Promise<SubscriptionCheckResponse> {
  const res = await fetch("/api/check-subscription", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Subscription check failed: ${res.status}`);
  }

  const data = (await res.json()) as SubscriptionCheckResponse;

  return data;
}


