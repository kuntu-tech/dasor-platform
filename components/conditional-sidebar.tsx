"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
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
import { Settings, Crown, LogOut } from "lucide-react";
import { SettingsModal } from "@/components/settings-modal";
import { PricingModal } from "@/components/pricing-modal";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
export function ConditionalSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState("account");
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const { signOut, user } = useAuth();
  const router = useRouter();

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
  // 顶部导航栏组件
  const TopNavBar = () => (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Logo - 左上角 */}
        <Link href="/" className="flex items-center gap-2">
          <div className="size-10 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="size-6 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-gray-900">Datail</span>
        </Link>

        {/* 用户头像 - 右上角 */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="cursor-pointer hover:ring-2 hover:ring-gray-300 hover:ring-offset-2 rounded-full transition-all duration-200">
              <Avatar className="size-10">
                <AvatarImage
                  src={
                    user?.user_metadata?.avatar_url || "/placeholder-user.jpg"
                  }
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
                onClick={() => {
                  signOut().then(() => {
                    router.push("/auth/login");
                  });
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
