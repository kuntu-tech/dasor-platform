"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionCheckResponse } from "@/lib/subscription/client";

type NativeButtonProps = React.ComponentProps<typeof Button> & {
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
  const { user, subscriptionStatus, subscriptionLoading } = useAuth();
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);

  // Helper function to get cached subscription status without API call
  const getCachedSubscriptionStatus = (): SubscriptionCheckResponse | null => {
    if (typeof window === "undefined" || !user?.id) return null;
    try {
      const cacheKey = `subscription_status_${user.id}`;
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 1 day
      if (Date.now() - timestamp > CACHE_EXPIRY) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  };

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    if (typeof onClick === "function") {
      onClick(event);
    }

    if (event.defaultPrevented) {
      return;
    }

    event.preventDefault();

    if (!user?.id) {
      toast({
        variant: "warning",
        title: "Login required",
        description: "Please log in first",
      });
      return;
    }

    try {
      setChecking(true);

      // First, try to use subscriptionStatus from AuthProvider (may be cached)
      let statusToCheck = subscriptionStatus;

      // If not available, try to read from cache directly (no API call)
      if (!statusToCheck) {
        statusToCheck = getCachedSubscriptionStatus();
      }

      // If status is available (from state or cache), use it immediately
      if (statusToCheck) {
        if (statusToCheck.hasActiveSubscription) {
          router.push(successHref);
          return;
        } else {
          // No active subscription - show popup (no API call needed)
          if (typeof onRequireSubscription === "function") {
            onRequireSubscription();
          } else {
            toast({
              variant: "warning",
              title: "Subscription required",
              description: "You need an active subscription to continue.",
            });
          }
          return;
        }
      }

      // If status is loading, wait briefly (max 1 second)
      if (subscriptionLoading) {
        let waitCount = 0;
        const maxWait = 10; // 1 second
        while (subscriptionLoading && waitCount < maxWait) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          waitCount++;
        }
        // Check status after waiting
        statusToCheck = subscriptionStatus || getCachedSubscriptionStatus();
        if (statusToCheck) {
          if (statusToCheck.hasActiveSubscription) {
            router.push(successHref);
            return;
          } else {
            if (typeof onRequireSubscription === "function") {
              onRequireSubscription();
            } else {
              toast({
                variant: "warning",
                title: "Subscription required",
                description: "You need an active subscription to continue.",
              });
            }
            return;
          }
        }
      }

      // If still no status and not loading, show popup (don't call API)
      // The AuthProvider will refresh in background if needed
      if (typeof onRequireSubscription === "function") {
        onRequireSubscription();
      } else {
        toast({
          variant: "error",
          title: "Verification failed",
          description: "Unable to verify your subscription. Please try again later.",
        });
      }
    } catch (error) {
      console.log("Subscription check failed:", error);
      if (typeof onRequireSubscription === "function") {
        onRequireSubscription();
      } else {
        toast({
          variant: "error",
          title: "Verification failed",
          description: "Unable to verify your subscription. Please try again later.",
        });
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
