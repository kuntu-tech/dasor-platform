"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, isVerifyingSignOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
      "/oauth/callback",
    ]);

    if (publicExact.has(pathname)) return true;

    const publicPrefixes = ["/auth/", "/oauth/"];
    return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
  }, [pathname]);

  // 🚦 主守卫逻辑
  useEffect(() => {
    if (isPublicPath || loading || isVerifyingSignOut) return;

    let cancelled = false;
    let verifyTimer: NodeJS.Timeout | null = null;
    let hardRedirectTimer: NodeJS.Timeout | null = null;

    if (!user) {
      const verifyAndRedirect = async () => {
        try {
          const { data, error } = await supabase.auth.getSession();

          if (cancelled) return;

          if (error) console.warn("AuthGuard session verification error:", error);

          if (!data.session) {
            console.log("🚪 Session missing after verification, redirecting.");
            router.replace("/auth/login");
          } else {
            console.log("✅ Session recovered during verification, stay on page.");
            clearTimeout(hardRedirectTimer!);
          }
        } catch (err) {
          if (!cancelled) {
            console.warn("AuthGuard session verification threw:", err);
            router.replace("/auth/login");
          }
        }
      };

      // ✅ 第一次延迟验证
      verifyTimer = setTimeout(verifyAndRedirect, 800);

      // ✅ 硬超时兜底：防止永远卡住
      hardRedirectTimer = setTimeout(() => {
        if (!cancelled) {
          console.warn(
            "AuthGuard hard fallback triggered, forcing redirect to /auth/login."
          );
          router.replace("/auth/login");
        }
      }, 5000);
    }

    return () => {
      cancelled = true;
      if (verifyTimer) clearTimeout(verifyTimer);
      if (hardRedirectTimer) clearTimeout(hardRedirectTimer);
    };
  }, [user, loading, isVerifyingSignOut, isPublicPath, router]);

  // ✅ 二次检测逻辑：如果用户恢复但之前 UI 卡死，自动刷新
  useEffect(() => {
    if (!loading && user) {
      console.log("✅ AuthGuard detected session recovery, refreshing page");
      router.refresh(); // 重新渲染受保护内容
    }
  }, [user, loading, router]);

  // ✅ 登录后留在 login 页，自动跳首页
  useEffect(() => {
    if (!loading && user && pathname === "/auth/login") {
      router.replace("/");
    }
  }, [loading, user, pathname, router]);

  // ✅ 公共路径直接渲染
  if (isPublicPath) return <>{children}</>;

  // ✅ Loading 或验证中状态
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

  // ✅ 无用户时显示等待（仍可能恢复中）
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

  // ✅ 一切正常
  return <>{children}</>;
}
