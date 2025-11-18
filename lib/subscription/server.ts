import { supabaseAdmin } from "@/lib/supabase";

export interface SubscriptionStatusResult {
  hasActiveSubscription: boolean;
  subscriptionStatus: string | null;
  subscriptionPeriodEnd: string | null;
}

type SubscriptionRecord = {
  subscription_status: string | null;
  subscription_period_end: string | null;
};

const parseSupabaseTimestamp = (value: string | null): Date | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(" ", "T");

  let parsed = new Date(normalized);

  if (isNaN(parsed.getTime())) {
    parsed = new Date(`${normalized}Z`);
  }

  if (isNaN(parsed.getTime())) {
    console.log("Invalid subscription_period_end format:", value);
    return null;
  }

  return parsed;
};

export async function getSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatusResult | null> {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("dataset_vendors")
    .select("subscription_status, subscription_period_end")
    .eq("user_id", userId)
    .single<SubscriptionRecord>();

  if (error) {
    if (error.code === "PGRST116") {
      return {
        hasActiveSubscription: false,
        subscriptionStatus: null,
        subscriptionPeriodEnd: null,
      };
    }

    throw error;
  }

  if (!data) {
    return {
      hasActiveSubscription: false,
      subscriptionStatus: null,
      subscriptionPeriodEnd: null,
    };
  }

  const periodEndDate = parseSupabaseTimestamp(data.subscription_period_end);
  const hasActiveSubscription =
    data.subscription_status === "active" &&
    periodEndDate !== null &&
    periodEndDate.getTime() > Date.now();

  return {
    hasActiveSubscription,
    subscriptionStatus: data.subscription_status,
    subscriptionPeriodEnd: data.subscription_period_end,
  };
}
