"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";

type NativeButtonProps = React.ComponentProps<"button"> & {
  successHref?: string;
  onRequireSubscription?: () => void;
};

export function CreateAppButton({
  successHref = "/connect",
  onRequireSubscription,
  onClick,
  disabled,
  children,
  ...rest
}: NativeButtonProps) {
  const router = useRouter();
  const {
    user,
    subscriptionStatus,
    subscriptionLoading,
    refreshSubscriptionStatus,
  } = useAuth();
  const [checking, setChecking] = useState(false);
  const [currentSubscriptionStatus, setCurrentSubscriptionStatus] =
    useState(subscriptionStatus);

  // Synchronize subscription status
  useEffect(() => {
    setCurrentSubscriptionStatus(subscriptionStatus);
  }, [subscriptionStatus]);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    if (typeof onClick === "function") {
      onClick(event);
    }

    if (event.defaultPrevented) {
      return;
    }

    event.preventDefault();

    if (!user?.id) {
      alert("Please log in first");
      return;
    }

    try {
      setChecking(true);

      // Check if subscription has already been checked in this session
      const subscriptionCheckedKey = `subscription_checked_${user.id}`;
      const subscriptionPopupKey = `subscription_popup_shown_${user.id}`;
      const hasCheckedInSession =
        typeof window !== "undefined" &&
        sessionStorage.getItem(subscriptionCheckedKey) === "true";
      const hasShownPopup =
        typeof window !== "undefined" &&
        sessionStorage.getItem(subscriptionPopupKey) === "true";

      // Use cached subscription status when available
      if (currentSubscriptionStatus) {
        if (currentSubscriptionStatus.hasActiveSubscription) {
          router.push(successHref);
          return;
        } else {
          // If popup already shown, don't show again
          if (hasShownPopup) {
            // User already knows they need subscription, just prevent action
            return;
          }
          // Show popup only if not shown before
          if (typeof onRequireSubscription === "function") {
            onRequireSubscription();
            // Mark popup as shown
            if (typeof window !== "undefined") {
              sessionStorage.setItem(subscriptionPopupKey, "true");
            }
          } else {
            alert("You need an active subscription to continue.");
          }
          return;
        }
      }

      // If subscription was already checked in this session, use cached status from AuthProvider
      // Don't make another API call
      if (hasCheckedInSession) {
        // Wait for subscription status to load if it's currently loading
        if (subscriptionLoading) {
          let waitCount = 0;
          while (subscriptionLoading && waitCount < 30) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            waitCount++;
          }
          // Re-check status after waiting
          const updatedStatus = currentSubscriptionStatus || subscriptionStatus;
          if (updatedStatus?.hasActiveSubscription) {
            router.push(successHref);
            return;
          }
        }

        // Use the status from AuthProvider (should be cached)
        const finalStatus = currentSubscriptionStatus || subscriptionStatus;
        if (finalStatus?.hasActiveSubscription) {
          router.push(successHref);
          return;
        } else if (finalStatus) {
          // Status exists but no active subscription
          // If popup already shown, don't show again
          if (hasShownPopup) {
            return;
          }
          // Show popup only if not shown before
          if (typeof onRequireSubscription === "function") {
            onRequireSubscription();
            if (typeof window !== "undefined") {
              sessionStorage.setItem(subscriptionPopupKey, "true");
            }
          } else {
            alert("You need an active subscription to continue.");
          }
          return;
        }
        // If status is still null after waiting and already checked, don't make another API call
        // Just prevent action (user should already know they need subscription)
        if (!finalStatus) {
          // Status not available but already checked - don't show popup again
          if (hasShownPopup) {
            return;
          }
          // If popup not shown yet, show it once
          if (typeof onRequireSubscription === "function") {
            onRequireSubscription();
            if (typeof window !== "undefined") {
              sessionStorage.setItem(subscriptionPopupKey, "true");
            }
          }
          return;
        }
      }

      // Wait for subscription status to load when missing (only if not checked in session)
      if (!hasCheckedInSession && subscriptionLoading) {
        // Await up to 3 seconds for subscription status resolution
        let waitCount = 0;
        while (subscriptionLoading && waitCount < 30) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          waitCount++;
        }
      }

      // Only call API if status is still unavailable and not checked in session
      if (
        !hasCheckedInSession &&
        !currentSubscriptionStatus &&
        !subscriptionStatus
      ) {
        await refreshSubscriptionStatus();
        // Allow time for React state updates and useEffect execution
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // Prioritize currentSubscriptionStatus because it auto-syncs via useEffect
      const finalStatus = currentSubscriptionStatus || subscriptionStatus;
      if (finalStatus?.hasActiveSubscription) {
        router.push(successHref);
        return;
      }

      // If popup already shown, don't show again
      if (hasShownPopup) {
        // User already knows they need subscription, just prevent action
        return;
      }

      // Show popup only if not shown before
      if (typeof onRequireSubscription === "function") {
        onRequireSubscription();
        // Mark popup as shown
        if (typeof window !== "undefined") {
          sessionStorage.setItem(subscriptionPopupKey, "true");
        }
      } else {
        alert("You need an active subscription to continue.");
      }
    } catch (error) {
      console.log("Subscription check failed:", error);
      const subscriptionPopupKey = `subscription_popup_shown_${user.id}`;
      const hasShownPopup =
        typeof window !== "undefined" &&
        sessionStorage.getItem(subscriptionPopupKey) === "true";

      // If popup already shown, don't show again
      if (!hasShownPopup && typeof onRequireSubscription === "function") {
        onRequireSubscription();
        if (typeof window !== "undefined") {
          sessionStorage.setItem(subscriptionPopupKey, "true");
        }
      } else if (!hasShownPopup) {
        alert("Unable to verify your subscription. Please try again later.");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <Button {...rest} onClick={handleClick} disabled={disabled || checking}>
      {children}
    </Button>
  );
}
