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

      // Use cached subscription status when available
      if (currentSubscriptionStatus) {
        if (currentSubscriptionStatus.hasActiveSubscription) {
          router.push(successHref);
          return;
        } else {
          if (typeof onRequireSubscription === "function") {
            onRequireSubscription();
          } else {
            alert("You need an active subscription to continue.");
          }
          return;
        }
      }

      // Wait for subscription status to load when missing
      if (subscriptionLoading) {
        // Await up to 3 seconds for subscription status resolution
        let waitCount = 0;
        while (subscriptionLoading && waitCount < 30) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          waitCount++;
        }
      }

      // Force refresh if status is still unavailable
      if (!currentSubscriptionStatus && !subscriptionStatus) {
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

      if (typeof onRequireSubscription === "function") {
        onRequireSubscription();
      } else {
        alert("You need an active subscription to continue.");
      }
    } catch (error) {
      console.log("Subscription check failed:", error);
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
