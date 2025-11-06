"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import Prism from "@/components/Prism";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // 检查URL中的哈希参数（Supabase重置密码链接通常使用哈希）
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken =
      hashParams.get("access_token") || searchParams.get("access_token");
    const refreshToken =
      hashParams.get("refresh_token") || searchParams.get("refresh_token");

    console.log("重置密码页面 - 检查令牌:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hash: window.location.hash,
      search: window.location.search,
    });

    if (accessToken && refreshToken) {
      // 设置会话
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        .then(({ data, error }) => {
          if (error) {
            console.log("设置会话错误:", error);
            setError("重置密码链接无效或已过期");
          } else {
            console.log("会话设置成功:", data);
            // 清除URL中的敏感参数
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          }
        });
    } else {
      // 如果没有令牌，检查是否已有会话
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error || !session) {
          setError("请通过邮件中的链接访问此页面");
        }
      });
    }
  }, [searchParams]);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      setError("请填写所有字段");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (password.length < 6) {
      setError("密码至少需要6位字符");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // 首先检查当前会话状态
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.log("会话检查失败:", sessionError);
        setError("会话无效，请重新申请密码重置");
        return;
      }

      console.log("当前会话:", session);

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.log("重置密码错误:", error);
        setError(error.message || "重置密码失败");
      } else {
        setSuccess("密码重置成功！正在跳转到登录页...");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    } catch (error: any) {
      console.log("重置密码异常:", error);
      setError("重置密码失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Reset Password Form */}
      <div className="w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
              </div>
              <span className="text-2xl font-bold text-gray-900">Datail</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Title */}
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                Set new password
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Enter your new password below.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* New Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  NEW PASSWORD
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="size-5 text-gray-400" />
                    ) : (
                      <Eye className="size-5 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  CONFIRM PASSWORD
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pr-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-5 text-gray-400" />
                    ) : (
                      <Eye className="size-5 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              {/* Reset Password Button */}
              <Button
                onClick={handleResetPassword}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium text-base"
                disabled={loading}
              >
                {loading ? "重置中..." : "Reset Password"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Text Display with Prism Background */}
      <div className="w-1/2 relative">
        <Prism
          height={3.5}
          baseWidth={5.5}
          animationType="3drotate"
          glow={1}
          noise={0.3}
          transparent={true}
          scale={2.5}
          hueShift={0}
          colorFrequency={1}
          hoverStrength={2}
          inertia={0.05}
          bloom={1}
          suspendWhenOffscreen={true}
          timeScale={0.8}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Welcome <span className="text-blue-500">Back</span>
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
