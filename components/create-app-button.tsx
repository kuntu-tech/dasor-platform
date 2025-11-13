"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import type { SubscriptionCheckResponse } from "@/lib/subscription/client";

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
    useState<SubscriptionCheckResponse | null>(subscriptionStatus);

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
      const hasCheckedInSession =
        typeof window !== "undefined" &&
        sessionStorage.getItem(subscriptionCheckedKey) === "true";

      // Wait for subscription status to load if it's currently loading
      // This ensures we have the latest status before making decisions
      if (subscriptionLoading) {
        let waitCount = 0;
        const maxWait = 50; // Wait up to 5 seconds
        while (subscriptionLoading && waitCount < maxWait) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          waitCount++;
        }
        // Re-sync status after waiting
        const latestStatus = subscriptionStatus;
        if (latestStatus) {
          setCurrentSubscriptionStatus(latestStatus);
        }
        // If still loading after max wait, don't show popup, just return
        if (subscriptionLoading) {
          console.log(
            "Subscription check is taking too long, please try again later"
          );
          return;
        }
      }

      // Use cached subscription status when available (check both current and subscriptionStatus)
      const statusToCheck = currentSubscriptionStatus || subscriptionStatus;
      if (statusToCheck) {
        if (statusToCheck.hasActiveSubscription) {
          router.push(successHref);
          return;
        } else {
          // No active subscription - show popup every time button is clicked
          if (typeof onRequireSubscription === "function") {
            onRequireSubscription();
          } else {
            alert("You need an active subscription to continue.");
          }
          return;
        }
      }

      // If subscription was already checked in this session, use cached status from AuthProvider
      // Don't make another API call
      if (hasCheckedInSession) {
        // Wait a bit for status to be available if it's still loading
        if (subscriptionLoading) {
          let waitCount = 0;
          const maxWait = 30;
          while (subscriptionLoading && waitCount < maxWait) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            waitCount++;
          }
        }
        // Check status again after waiting
        const finalStatusAfterWait = (currentSubscriptionStatus ||
          subscriptionStatus) as SubscriptionCheckResponse | null;
        if (finalStatusAfterWait) {
          if (finalStatusAfterWait.hasActiveSubscription) {
            router.push(successHref);
            return;
          } else {
            // No active subscription - show popup
            if (typeof onRequireSubscription === "function") {
              onRequireSubscription();
            } else {
              alert("You need an active subscription to continue.");
            }
            return;
          }
        }
        // If status is still not available after waiting, don't show popup
        // User should wait for the check to complete
        return;
      }

      // Wait for subscription status to load when missing (only if not checked in session)
      if (!hasCheckedInSession && subscriptionLoading) {
        // Await up to 5 seconds for subscription status resolution
        let waitCount = 0;
        const maxWait = 50;
        while (subscriptionLoading && waitCount < maxWait) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          waitCount++;
        }
        // If still loading after max wait, don't show popup, just return
        if (subscriptionLoading) {
          console.log(
            "Subscription check is taking too long, please try again later"
          );
          return;
        }
      }

      // Only call API if status is still unavailable and not checked in session
      if (
        !hasCheckedInSession &&
        !currentSubscriptionStatus &&
        !subscriptionStatus &&
        !subscriptionLoading
      ) {
        await refreshSubscriptionStatus();
        // Allow time for React state updates and useEffect execution
        await new Promise((resolve) => setTimeout(resolve, 300));
        // Re-sync status after refresh
        const refreshedStatus = subscriptionStatus;
        if (refreshedStatus) {
          setCurrentSubscriptionStatus(refreshedStatus);
        }
      }

      // Final check after all loading and refreshing
      // Prioritize currentSubscriptionStatus because it auto-syncs via useEffect
      const finalStatus = (currentSubscriptionStatus ||
        subscriptionStatus) as SubscriptionCheckResponse | null;
      if (finalStatus) {
        if (finalStatus.hasActiveSubscription) {
          router.push(successHref);
          return;
        } else {
          // No active subscription - show popup every time button is clicked
          if (typeof onRequireSubscription === "function") {
            onRequireSubscription();
          } else {
            alert("You need an active subscription to continue.");
          }
          return;
        }
      }

      // If status is still null after all attempts, show popup
      if (typeof onRequireSubscription === "function") {
        onRequireSubscription();
      } else {
        alert("Unable to verify your subscription. Please try again later.");
      }
    } catch (error) {
      console.log("Subscription check failed:", error);
      // Show popup every time on error
      if (typeof onRequireSubscription === "function") {
        onRequireSubscription();
      } else {
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
