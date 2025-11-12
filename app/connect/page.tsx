"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { ConnectFlow } from "@/components/connect-flow";
import { useAuth } from "@/components/AuthProvider";

export default function ConnectPage() {
  const router = useRouter();
  const {
    user,
    loading,
    subscriptionStatus,
    subscriptionLoading,
    refreshSubscriptionStatus,
  } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  // Handle user authentication and initial subscription validation
  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user?.id) {
      setChecking(false);
      setAllowed(false);
      router.replace("/?auth_required=1");
      return;
    }

    // Use cached subscription status when available to avoid loading state
    if (subscriptionStatus) {
      setChecking(false);
      if (subscriptionStatus.hasActiveSubscription) {
        setAllowed(true);
      } else {
        setAllowed(false);
        router.replace("/?subscription_required=1");
      }
      return;
    }

    // Only call the API when status is missing and not currently loading
    // This is rare because subscription is typically checked on sign-in
    if (!subscriptionLoading) {
      refreshSubscriptionStatus().catch((error) => {
        console.log("Subscription check failed:", error);
        setChecking(false);
        router.replace("/?subscription_required=1");
      });
    }
  }, [
    user?.id,
    loading,
    subscriptionStatus,
    subscriptionLoading,
    refreshSubscriptionStatus,
    router,
  ]);

  // React to subscription changes when status transitions from null to a value
  useEffect(() => {
    if (!user?.id || loading || !subscriptionStatus) {
      return;
    }

    setChecking(false);
    if (subscriptionStatus.hasActiveSubscription) {
      setAllowed(true);
    } else {
      setAllowed(false);
      router.replace("/?subscription_required=1");
    }
  }, [subscriptionStatus, user?.id, loading, router]);

  if (!allowed) {
    if (checking) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span>Verifying subscription...</span>
          </div>
        </div>
      );
    }

    return null;
  }

  return <ConnectFlow />;
}
