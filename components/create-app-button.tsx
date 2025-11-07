"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { fetchSubscriptionStatus } from "@/lib/subscription/client";

type NativeButtonProps = ButtonProps & {
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
  const { user } = useAuth();
  const [checking, setChecking] = useState(false);

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
      const status = await fetchSubscriptionStatus(user.id);

      if (status?.hasActiveSubscription) {
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
    <Button
      {...rest}
      onClick={handleClick}
      disabled={disabled || checking}
    >
      {children}
    </Button>
  );
}


