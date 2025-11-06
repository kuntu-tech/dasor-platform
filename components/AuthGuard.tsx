"use client";

// import { useEffect } from "react";
// import { useRouter, usePathname } from "next/navigation";
// import { useAuth } from "@/components/AuthProvider";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  // 跳过登录验证，直接允许访问所有页面
  return <>{children}</>;

  // 以下代码已禁用，如需恢复认证，请取消注释
  /*
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 不需要认证的页面路径
  const publicPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/callback",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/purchase/success",
    "/purchase/cancel",
  ];

  useEffect(() => {
    console.log("loading", loading, "pathname", pathname);
    
    // 如果是公开页面，直接允许访问（不需要等待 loading 完成）
    if (publicPaths.includes(pathname)) {
      return;
    }

    // 如果正在加载，等待加载完成
    if (loading) return;

    // 如果没有用户且不在公开页面，重定向到登录页
    if (!user) {
      console.log("未认证用户访问受保护页面，重定向到登录页");
      router.push("/auth/login");
      return;
    }

    // 如果已登录用户在登录页，重定向到首页
    if (user && pathname === "/auth/login") {
      console.log("已认证用户访问登录页，重定向到首页");
      router.push("/");
      return;
    }
  }, [user, loading, pathname, router]);

  // 如果是公开页面，直接显示内容（不需要等待 loading 完成）
  if (publicPaths.includes(pathname)) {
    return <>{children}</>;
  }

  // 如果正在加载，显示加载界面
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

  // 如果没有用户且不在公开页面，不显示内容（等待重定向）
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

  // 已认证用户，显示受保护的内容
  return <>{children}</>;
  */
}
