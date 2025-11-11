"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Settings, Crown, LogOut, Wallet } from "lucide-react";
import { SettingsModal } from "@/components/settings-modal";
import { PricingModal } from "@/components/pricing-modal";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { getVendorStatus } from "@/portable-pages/lib/connectApi";
import { supabase } from "@/lib/supabase";
export function ConditionalSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hasMounted, setHasMounted] = useState(false);
  const isHomePage = pathname === "/";
  const shouldRenderHomeLayout = hasMounted && isHomePage;
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState("account");
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const { signOut, user, session } = useAuth();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasConnectedStripeAccount, setHasConnectedStripeAccount] = useState<boolean | null>(null);
  const fetchStripeStatus = useCallback(async () => {
    if (!user?.id) {
      setHasConnectedStripeAccount(null);
      return;
    }

    try {
      const status = await getVendorStatus(user.id);
      if (status.success && status.data) {
        const stripeStatus = status.data.stripe_account_status;
        const chargesEnabled = status.data.charges_enabled;
        const payoutsEnabled = status.data.payouts_enabled;

        const isStripeReady =
          stripeStatus === "active" ||
          (chargesEnabled === true && payoutsEnabled === true);

        setHasConnectedStripeAccount(isStripeReady);
      } else if (status.success === false) {
        setHasConnectedStripeAccount(false);
      } else {
        setHasConnectedStripeAccount(null);
      }
    } catch (error) {
      setHasConnectedStripeAccount(null);
      console.log("获取Stripe连接状态失败:", error);
    }
  }, [user?.id]);

  // 获取用户头像
  const avatarCacheKey = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return user?.id ? `cached_avatar_${user.id}` : null;
  }, [user?.id]);

  const updateAvatar = useCallback(
    (url: string | null) => {
      setAvatarUrl(url);
      if (typeof window === "undefined") {
        return;
      }
      if (!avatarCacheKey) {
        return;
      }

      if (url) {
        localStorage.setItem(avatarCacheKey, url);
      } else {
        localStorage.removeItem(avatarCacheKey);
      }
    },
    [avatarCacheKey]
  );

  const getLatestAccessToken = useCallback(async (): Promise<string | null> => {
    let accessToken = session?.access_token ?? null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn("刷新 Supabase 会话失败:", error);
      }
      if (data?.session?.access_token) {
        accessToken = data.session.access_token;
      }
    } catch (error) {
      console.warn("获取 Supabase 会话异常:", error);
    }
    return accessToken;
  }, [session?.access_token]);

  const fetchUserAvatar = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      updateAvatar(null);
      return false;
    }

    const accessToken = await getLatestAccessToken();

    if (!accessToken) {
      const metadataAvatar =
        (user.user_metadata?.avatar_url as string | undefined) ??
        (user.user_metadata?.picture as string | undefined) ??
        null;
      updateAvatar(metadataAvatar ?? null);
      return false;
    }

    try {
      const response = await fetch("/api/users/self", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const json = await response.json();
      const avatarUrl =
        (json?.data?.avatar_url as string | undefined) ?? null;

      if (avatarUrl) {
        updateAvatar(avatarUrl);
        return true;
      }

      const metadataAvatar =
        (user.user_metadata?.avatar_url as string | undefined) ??
        (user.user_metadata?.picture as string | undefined) ??
        null;
      updateAvatar(metadataAvatar ?? null);
    } catch (error) {
      console.log("获取用户头像失败:", error);
      const metadataAvatar =
        (user?.user_metadata?.avatar_url as string | undefined) ??
        (user?.user_metadata?.picture as string | undefined) ??
        null;
      updateAvatar(metadataAvatar ?? null);
    }

    return false;
  }, [
    getLatestAccessToken,
    updateAvatar,
    user?.id,
    user?.user_metadata,
  ]);
  useEffect(() => {
    if (!user?.id) {
      updateAvatar(null);
      return;
    }

    if (typeof window !== "undefined") {
      if (avatarCacheKey) {
        const cachedUrl = localStorage.getItem(avatarCacheKey);
        if (cachedUrl) {
          setAvatarUrl(cachedUrl);
        } else {
          const metadataAvatar =
            (user.user_metadata?.avatar_url as string | undefined) ??
            (user.user_metadata?.picture as string | undefined) ??
            null;
          setAvatarUrl(metadataAvatar ?? null);
        }
      }
    }

    const fetchWithRetry = async (attempt = 0) => {
      const hasDbAvatar = await fetchUserAvatar();

      if (!hasDbAvatar && attempt < 2) {
        setTimeout(() => fetchWithRetry(attempt + 1), 500 * (attempt + 1));
      }
    };

    fetchWithRetry();
  }, [
    avatarCacheKey,
    fetchUserAvatar,
    updateAvatar,
    user?.id,
    user?.user_metadata?.avatar_url,
    user?.user_metadata?.picture,
  ]);

  useEffect(() => {
    fetchStripeStatus();
  }, [fetchStripeStatus]);

  useEffect(() => {
    const handleStripeStatusUpdated = () => {
      fetchStripeStatus();
    };

    window.addEventListener("stripe-connection-updated", handleStripeStatusUpdated);

    return () => {
      window.removeEventListener("stripe-connection-updated", handleStripeStatusUpdated);
    };
  }, [fetchStripeStatus]);

  // 监听头像更新事件
  useEffect(() => {
    const handleAvatarUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ avatarUrl?: string }>).detail;
      if (detail?.avatarUrl) {
        updateAvatar(detail.avatarUrl ?? null);
      } else {
        fetchUserAvatar();
      }
    };

    window.addEventListener("avatar-updated", handleAvatarUpdated);

    return () => {
      window.removeEventListener("avatar-updated", handleAvatarUpdated);
    };
  }, [fetchUserAvatar]);

  // 检查 URL 参数，如果需要打开设置对话框
  useEffect(() => {
    const openSettings = searchParams.get("openSettings");
    if (openSettings) {
      // 验证标签页是否有效
      const validTabs = ["account", "billing", "payout"];
      if (validTabs.includes(openSettings)) {
        setSettingsDefaultTab(openSettings);
        setIsSettingsOpen(true);
        // 清除 URL 参数，避免刷新时重复打开
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("openSettings");
        router.replace(newUrl.pathname + (newUrl.search || ""), { scroll: false });
      }
    }
  }, [searchParams, router]);

  // 公开页面路径（不需要认证的页面）
  const publicPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/callback",
    "/auth/forgot-password",
    "/auth/reset-password",
  ];
  const isPublicPage = publicPaths.includes(pathname);

  const displayAvatarUrl =
    avatarUrl ??
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined) ??
    "/placeholder-user.jpg";

  // 顶部导航栏组件
  const TopNavBar = () => (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Logo - 左上角 */}
        <Link href="/" className="flex items-center gap-2">
          {/* <div className="size-10 rounded-lg bg-primary flex items-center justify-center"> */}
          <img src="/logo.png" alt="Logo" className="size-10 object-contain" />
          {/* </div> */}
          <span className="text-lg font-semibold text-gray-900">Datail</span>
        </Link>

        {/* 用户头像 - 右上角 */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="relative cursor-pointer hover:ring-2 hover:ring-gray-300 hover:ring-offset-2 rounded-full transition-all duration-200">
              {hasConnectedStripeAccount === false && (
                <span
                  className="absolute -right-0.5 -top-0.5 z-10 inline-flex size-3 items-center justify-center rounded-full bg-red-500"
                  aria-hidden="true"
                />
              )}
              <Avatar className="size-10">
                <AvatarImage
                  key={displayAvatarUrl}
                  src={displayAvatarUrl}
                  alt={user?.user_metadata?.full_name || "Account"}
                />
                <AvatarFallback>
                  {user?.user_metadata?.full_name?.charAt(0) ||
                    user?.email?.charAt(0) ||
                    "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" className="w-48 p-2">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setSettingsDefaultTab("account");
                  setIsSettingsOpen(true);
                }}
              >
                <Settings className="size-4" />
                Account
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setSettingsDefaultTab("payout");
                  setIsSettingsOpen(true);
                }}
              >
                <Wallet className="size-4" />
                <span className="flex-1 text-left">Payout Account</span>
                {hasConnectedStripeAccount === false && (
                  <span className="text-base leading-none text-red-500" aria-hidden="true">❗️</span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setIsPricingOpen(true)}
              >
                <Crown className="size-4" />
                Upgrade
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setSettingsDefaultTab("billing");
                  setIsSettingsOpen(true);
                }}
              >
                <Crown className="size-4" />
                Billing
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={async () => {
                  const redirectToLogin = () => {
                    router.push("/auth/login");
                    router.refresh();
                  };
                  try {
                    await signOut();
                  } catch (error) {
                    console.log("登出失败:", error);
                  } finally {
                    // 等待状态更新后再跳转，确保状态同步
                    setTimeout(redirectToLogin, 50);
                  }
                }}
              >
                <LogOut className="size-4" />
                Logout
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  const content = isPublicPage ? (
    <>{children}</>
  ) : shouldRenderHomeLayout ? (
    <>
      <TopNavBar />
      <div className="pt-16">{children}</div>
    </>
  ) : (
    <>{children}</>
  );

  return (
    <div className="min-h-svh">
      {content}
      {!isPublicPage && (
        <>
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            defaultTab={settingsDefaultTab}
          />
          <PricingModal
            isOpen={isPricingOpen}
            onClose={() => setIsPricingOpen(false)}
          />
        </>
      )}
    </div>
  );
}
