"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
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
    ]);

    if (publicExact.has(pathname)) {
      return true;
    }

    const publicPrefixes = ["/auth/"];

    return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
  }, [pathname]);

  useEffect(() => {
    if (isPublicPath || loading) {
      return;
    }

    if (!user) {
      const fallbackTimer = setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }, 1500);

      router.replace("/auth/login");

      return () => {
        clearTimeout(fallbackTimer);
      };
    }
  }, [user, loading, router, isPublicPath]);

  useEffect(() => {
    if (!loading && user && pathname === "/auth/login") {
      router.replace("/");
    }
  }, [loading, user, pathname, router]);

  if (isPublicPath) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying identity...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to the login page...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
