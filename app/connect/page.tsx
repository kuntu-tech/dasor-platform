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

  // 处理用户认证和初始订阅检查
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

    // 如果订阅状态已缓存，直接使用（不显示 loading，立即允许访问）
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

    // 如果订阅状态不存在且不在加载中，才需要调用 API
    // 这种情况应该很少见，因为登录时已经检查过了
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

  // 处理订阅状态变化（当订阅状态从 null 变为有值时）
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
