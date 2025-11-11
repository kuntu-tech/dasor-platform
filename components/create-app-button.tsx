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

  // 同步订阅状态
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

      // 如果订阅状态已缓存，直接使用
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

      // 如果订阅状态未加载，等待加载完成
      if (subscriptionLoading) {
        // 等待订阅状态加载完成（最多等待3秒）
        let waitCount = 0;
        while (subscriptionLoading && waitCount < 30) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          waitCount++;
        }
      }

      // 如果还是没有订阅状态，强制刷新
      if (!currentSubscriptionStatus && !subscriptionStatus) {
        await refreshSubscriptionStatus();
        // 等待状态更新（给React状态更新和useEffect执行时间）
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // 使用最新的订阅状态（优先使用currentSubscriptionStatus，因为它会通过useEffect自动同步）
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
