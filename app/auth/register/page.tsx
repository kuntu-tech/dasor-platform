"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import Prism from "@/components/Prism";
import { useAuth } from "@/components/AuthProvider";

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
      setError("Please fill out all required fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await signUpWithEmail(email, password, fullName);
      setSuccess(
        "Registration successful! Please check your email for the verification link."
      );
    } catch (error: any) {
      console.log("Registration failed:", error);
      setError(error.message || "Registration failed, please try again later");
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Register Form */}
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

              {/* Success Message */}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              {/* Create Account Button */}
              <Button
                onClick={handleEmailRegister}
                className="w-full h-12 bg-black hover:bg-gray-900 text-white font-medium text-base"
                disabled={loading}
              >
                {loading ? "Registering..." : "Create Account"}
              </Button>

              {/* Terms and Privacy */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  By continuing, you agree to Datail's{" "}
                  <Button
                    variant="link"
                    className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto underline"
                  >
                    Terms of Service
                  </Button>{" "}
                  and{" "}
                  <Button
                    variant="link"
                    className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto underline"
                  >
                    Privacy Policy
                  </Button>
                </p>
              </div>

              {/* Sign In Link */}
              <div className="text-center pt-4">
                <span className="text-sm text-gray-600">
                  Already have an account?{" "}
                </span>
                <Button
                  variant="link"
                  asChild
                  className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto font-medium"
                >
                  <Link href="/auth/login">Log in</Link>
                </Button>
              </div>

              {/* Help Link */}
              <div className="text-center">
                <Button
                  variant="link"
                  className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto"
                >
                  Get help
                </Button>
              </div>

              {/* Privacy Notice */}
              <div className="text-center pt-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  This site is protected by reCAPTCHA Enterprise and the Google{" "}
                  <Button
                    variant="link"
                    className="text-xs text-gray-500 hover:text-gray-700 p-0 h-auto underline"
                  >
                    Privacy Policy
                  </Button>{" "}
                  and{" "}
                  <Button
                    variant="link"
                    className="text-xs text-gray-500 hover:text-gray-700 p-0 h-auto underline"
                  >
                    Terms of Service
                  </Button>{" "}
                  apply.
                </p>
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
              Data to app, <span className="text-blue-500">fast</span>
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
