"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle2, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import Image from "next/image";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { signInWithGoogle, signUpWithEmail, loading } = useAuth();

  const handleEmailRegister = async () => {
    if (!email || !password || !fullName) {
      setError("请填写所有必填字段");
      return;
    }

    if (password.length < 6) {
      setError("密码至少需要6位字符");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await signUpWithEmail(email, password, fullName);
      setSuccess("注册成功！请检查邮箱验证链接。");
    } catch (error: any) {
      console.log("注册失败:", error);
      setError(error.message || "注册失败，请稍后重试");
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Register Form or Success Message */}
      <div className="w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {success ? (
            /* Success Confirmation Modal */
            <div className="bg-white rounded-3xl shadow-xl p-8 relative max-w-md w-full">
             

              {/* Success Content */}
              <div className="space-y-6 pt-2">
                {/* Success Icon and Title */}
                <div className="flex items-start gap-4">
                  
                  <h1 className="text-2xl font-semibold text-gray-900 leading-tight pt-1">
                    Check your email
                  </h1>
                </div>

                {/* Message */}
                <div className="space-y-2 text-gray-700 text-base leading-relaxed">
                  <p>
                    We've sent you a confirmation link to
                  </p>
                  <p className="font-semibold text-gray-900">{email}</p>
                  <p>
                    Please check your email and click the link to activate your account.
                  </p>
                </div>

                {/* Got it Button */}
                <Button
                  onClick={() => setSuccess("")}
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium text-base rounded-lg mt-4"
                >
                  Got it
                </Button>
              </div>
            </div>
          ) : (
            /* Register Form */
            <div className="space-y-10">
              {/* Title */}
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Create a Datail account
                </h1>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center"
                  onClick={signInWithGoogle}
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-sm text-gray-500">Or</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Full Name Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="fullName"
                    className="text-sm font-medium text-gray-700"
                  >
                    FULL NAME
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder=""
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    EMAIL
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder=""
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    PASSWORD
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder=""
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

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Create Account Button */}
                <Button
                  onClick={handleEmailRegister}
                  className="w-full h-12 bg-black hover:bg-gray-900 text-white font-medium text-base"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Account"}
                </Button>

                {/* Sign In Link */}
                <div className="text-center pt-4">
                  <span className="text-sm text-gray-600">
                    Already have an account?{" "}
                  </span>
                  <Button
                    variant="link"
                    asChild
                    className="text-sm text-green-600 hover:text-green-800 p-0 h-auto font-medium underline"
                  >
                    <Link href="/auth/login">Log in</Link>
                  </Button>
                </div>

                {/* Terms and Privacy */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    By continuing, you agree to Datail's{" "}
                    <Button
                      variant="link"
                      className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto "
                    >
                      Terms of Service
                    </Button>{" "}
                    and{" "}
                    <Button
                      variant="link"
                      className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto "
                    >
                      Privacy Policy
                    </Button>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Background Image */}
      <div className="w-1/2 relative">
        <Image
          src="/jimeng222.png"
          alt="Register background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
              Data to ChatAPP, <span className="text-blue-500">Fast!</span>
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
