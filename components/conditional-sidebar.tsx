"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
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
import { supabase } from "@/lib/supabase";
import { getVendorStatus } from "@/portable-pages/lib/connectApi";
export function ConditionalSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHomePage = pathname === "/";
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState("account");
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const { signOut, user } = useAuth();
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
  const fetchUserAvatar = useCallback(async () => {
    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("avatar_url")
          .eq("id", user.id)
          .single();
        
        if (!error && data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        } else {
          const metadataAvatar =
            user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
          setAvatarUrl(metadataAvatar);
        }
      } catch (error) {
        console.log("获取用户头像失败:", error);
        setAvatarUrl(null);
      }
    } else {
      setAvatarUrl(null);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserAvatar();
  }, [fetchUserAvatar]);

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
        setAvatarUrl(detail.avatarUrl);
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

  // 如果是公开页面，直接显示内容，不显示侧边栏
  if (isPublicPage) {
    return <>{children}</>;
  }
  const displayAvatarUrl =
    avatarUrl ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
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

  if (isHomePage) {
    // 首页显示顶部导航栏
    return (
      <div className="min-h-svh">
        <TopNavBar />
        <div className="pt-16">{children}</div>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          defaultTab={settingsDefaultTab}
        />
        <PricingModal
          isOpen={isPricingOpen}
          onClose={() => setIsPricingOpen(false)}
        />
      </div>
    );
  }

  // 其他页面不显示顶部导航栏
  return (
    <div className="min-h-svh">
      {children}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultTab={settingsDefaultTab}
      />
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />
    </div>
  );
}
