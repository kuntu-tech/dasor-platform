"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * ✅ 改进版 AuthGuard
 * - 延迟跳转以等待 Supabase 恢复会话
 * - 二次 getSession 验证，避免假登出
 * - 使用 isVerifyingSignOut 状态，防止误跳
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, isVerifyingSignOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // ✅ 定义公开页面（不需要登录的路径）
  const isPublicPath = useMemo(() => {
    if (!pathname) return false;

    const publicExact = new Set([
      "/auth/login",
      "/auth/register",
      "/auth/callback",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/purchase/success",
      "/purchase/cancel",
    ]);

    if (publicExact.has(pathname)) return true;

    const publicPrefixes = ["/auth/"];
    return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
  }, [pathname]);

  /**
   * 🚦 守卫逻辑：
   * - loading 或正在验证登出时不跳转
   * - 如果暂时无用户信息，延迟 1 秒再确认
   */
  useEffect(() => {
    if (isPublicPath || loading || isVerifyingSignOut) return;

    let verifyTimer: ReturnType<typeof setTimeout> | null = null;

    if (!user) {
      verifyTimer = setTimeout(async () => {
        // ⏳ 延迟后二次确认会话
        const { data } = await import("@/lib/supabase").then((m) =>
          m.supabase.auth.getSession()
        );

        if (!data.session) {
          console.log("🚪 二次确认无会话，执行跳转 /auth/login");
          router.replace("/auth/login");
        } else {
          console.log("✅ 二次确认发现有效会话，取消跳转");
        }
      }, 1000); // 延迟 1 秒让 Supabase SDK 恢复 session
    }

    return () => {
      if (verifyTimer) clearTimeout(verifyTimer);
    };
  }, [user, loading, isVerifyingSignOut, isPublicPath, router]);

  // ✅ 如果用户已登录但在登录页，则重定向到首页
  useEffect(() => {
    if (!loading && user && pathname === "/auth/login") {
      router.replace("/");
    }
  }, [loading, user, pathname, router]);

  // ✅ 公共路径：直接渲染
  if (isPublicPath) return <>{children}</>;

  // ✅ 加载中或验证中：显示等待动画
  if (loading || isVerifyingSignOut) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying identity...</p>
        </div>
      </div>
    );
  }

  // ✅ 未检测到用户：可能正在恢复会话
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking session status...</p>
        </div>
      </div>
    );
  }

  // ✅ 一切正常，渲染受保护页面
  return <>{children}</>;
}
