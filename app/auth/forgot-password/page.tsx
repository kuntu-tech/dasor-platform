"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address.");
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
        console.log("Failed to send reset email:", error);
        setError(error.message || "Failed to send reset email.");
      } else {
        setSuccess("Password reset email sent. Please check your inbox.");
      }
    } catch (error: any) {
      console.log("Unexpected error while sending reset email:", error);
      setError("Failed to send password reset email. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Forgot Password Form */}
      <div className="w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Title */}
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                Reset your password
              </h1>
             
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address
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
                {loading ? "Sending..." : "Send Reset Link"}
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

      {/* Right Side - Background Image */}
      <div className="w-1/2 relative">
        <Image
          src="/blackwhitelight.png"
          alt="Login background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <h1
              className="text-3xl md:text-4xl font-semibold italic leading-tight text-black animate-glow-wave"
            >
              Data to ChatAPP
              <br />
              <span className="text-[1.1em]">Fast!</span>
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
