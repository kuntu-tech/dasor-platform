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
      "/subscription/cancel",
      "/subscription/success",
    ]);

    if (publicExact.has(pathname)) return true;

    const publicPrefixes = ["/auth/", "/oauth/"];
    return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
  }, [pathname]);

  // 🚦 Primary guard logic
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

      // ✅ Initial delayed verification
      verifyTimer = setTimeout(verifyAndRedirect, 800);

      // ✅ Hard timeout fallback to avoid indefinite waiting
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

  // ✅ Secondary check: auto-refresh if user recovers but UI was stuck
  useEffect(() => {
    if (!loading && user) {
      console.log("✅ AuthGuard detected session recovery, refreshing page");
      router.refresh(); // Re-render protected content
    }
  }, [user, loading, router]);

  // ✅ Redirect to homepage if user remains on login after sign-in
  useEffect(() => {
    if (!loading && user && pathname === "/auth/login") {
      router.replace("/");
    }
  }, [loading, user, pathname, router]);

  // ✅ Allow public routes to render directly
  if (isPublicPath) return <>{children}</>;

  // ✅ Loading or verification-in-progress state
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

  // ✅ Show waiting state when user is absent (recovery may occur)
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

  // ✅ Everything looks good
  return <>{children}</>;
}
