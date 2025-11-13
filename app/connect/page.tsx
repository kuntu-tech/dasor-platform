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

    // Check if subscription has already been validated in this session
    const subscriptionCheckedKey = `subscription_checked_${user.id}`;
    const hasCheckedInSession =
      sessionStorage.getItem(subscriptionCheckedKey) === "true";

    // Use cached subscription status when available
    if (subscriptionStatus) {
      setChecking(false);
      if (subscriptionStatus.hasActiveSubscription) {
        setAllowed(true);
        // Mark as checked in session
        sessionStorage.setItem(subscriptionCheckedKey, "true");
      } else {
        setAllowed(false);
        // Only redirect if not already checked in this session
        if (!hasCheckedInSession) {
          sessionStorage.setItem(subscriptionCheckedKey, "true");
          router.replace("/?subscription_required=1");
        }
      }
      return;
    }

    // Only check subscription on first visit (not on refresh)
    // If subscription was already checked in this session, allow access
    if (hasCheckedInSession) {
      setChecking(false);
      setAllowed(true);
      return;
    }

    // Only call the API when status is missing, not loading, and not checked in session
    // This ensures we only check once per login session
    if (!subscriptionLoading) {
      refreshSubscriptionStatus()
        .then(() => {
          // Mark as checked after successful check
          sessionStorage.setItem(subscriptionCheckedKey, "true");
        })
        .catch((error) => {
          console.log("Subscription check failed:", error);
          setChecking(false);
          // Mark as checked even on error to prevent repeated checks
          sessionStorage.setItem(subscriptionCheckedKey, "true");
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

    // Check if subscription has already been validated in this session
    const subscriptionCheckedKey = `subscription_checked_${user.id}`;
    const hasCheckedInSession =
      sessionStorage.getItem(subscriptionCheckedKey) === "true";

    setChecking(false);
    if (subscriptionStatus.hasActiveSubscription) {
      setAllowed(true);
      // Mark as checked in session
      sessionStorage.setItem(subscriptionCheckedKey, "true");
    } else {
      setAllowed(false);
      // Only redirect with parameter if not already checked in this session
      // This prevents repeated popup on page refresh
      if (!hasCheckedInSession) {
        sessionStorage.setItem(subscriptionCheckedKey, "true");
        router.replace("/?subscription_required=1");
      } else {
        // If already checked, redirect to home without parameter to avoid popup
        router.replace("/");
      }
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
