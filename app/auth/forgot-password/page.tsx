"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Prism from "@/components/Prism";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleResetPassword = async () => {
    if (!email) {
      setError("请输入邮箱地址");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.log("发送重置邮件错误:", error);
        setError(error.message || "发送重置邮件失败");
      } else {
        setSuccess("重置密码邮件已发送，请检查您的邮箱");
      }
    } catch (error: any) {
      console.log("发送重置邮件异常:", error);
      setError("发送重置邮件失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Forgot Password Form */}
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
                Reset your password
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  EMAIL ADDRESS
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
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
                className="w-full h-12 bg-black hover:bg-gray-900 text-white font-medium text-base"
                disabled={loading}
              >
                {loading ? "发送中..." : "Send Reset Link"}
              </Button>

              {/* Back to Login */}
              <div className="text-center">
                <Button
                  variant="link"
                  asChild
                  className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto"
                >
                  <Link href="/auth/login">Back to login</Link>
                </Button>
              </div>
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
              Secure & <span className="text-blue-500">Reliable</span>
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
