"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { ConnectFlow } from "@/components/connect-flow";
import { useAuth } from "@/components/AuthProvider";
import { fetchSubscriptionStatus } from "@/lib/subscription/client";
import { triggerConfettiFireworks } from "@/components/ui/confetti-fireworks";

export default function ConnectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const guard = async () => {
      if (loading) {
        return;
      }

      if (!user?.id) {
        if (!cancelled) {
          setChecking(false);
          setAllowed(false);
        }
        router.replace("/?auth_required=1");
        return;
      }

      try {
        setChecking(true);
        const status = await fetchSubscriptionStatus(user.id);

        if (cancelled) return;

        if (status?.hasActiveSubscription) {
          setAllowed(true);
        } else {
          router.replace("/?subscription_required=1");
        }
      } catch (error) {
        console.log("Subscription guard failed:", error);
        if (!cancelled) {
          router.replace("/?subscription_required=1");
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    guard();

    return () => {
      cancelled = true;
    };
  }, [user, loading, router]);

  // 当页面加载完成且允许访问时，触发烟花特效
  useEffect(() => {
    if (!allowed || checking) return;

    // 延迟一小段时间确保页面完全渲染后再触发烟花
    let cleanup: (() => void) | undefined;
    const timer = setTimeout(() => {
      cleanup = triggerConfettiFireworks({
        duration: 1000,
        intervalDelay: 200,
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      if (cleanup) {
        cleanup();
      }
    };
  }, [allowed, checking]);

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
