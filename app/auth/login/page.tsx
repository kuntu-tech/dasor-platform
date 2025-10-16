"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            </div>
            <span className="text-2xl font-bold text-gray-900">replit</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Log in to your account</h1>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                EMAIL OR USERNAME
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
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
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

            {/* Log In Button */}
            <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium text-base">
              Log In
            </Button>

            {/* Forgot Password */}
            <div className="text-center">
              <Button variant="link" className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto">
                Forgot password?
              </Button>
            </div>

            {/* SSO Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-sm text-gray-500">Or Use SSO login</span>
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3">
                <Button variant="outline" className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium">
                  Continue with Google
                </Button>
                <Button variant="outline" className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium">
                  Continue with GitHub
                </Button>
                <Button variant="outline" className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium">
                  Continue with X
                </Button>
                <Button variant="outline" className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium">
                  Continue with Facebook
                </Button>
                <Button variant="outline" className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium">
                  Continue with Apple
                </Button>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center pt-4">
              <span className="text-sm text-gray-600">New to Replit? </span>
              <Button variant="link" asChild className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto font-medium">
                <Link href="/auth/register">Sign up</Link>
              </Button>
            </div>

            {/* Help Link */}
            <div className="text-center">
              <Button variant="link" className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto">
                Get help
              </Button>
            </div>

            {/* Privacy Notice */}
            <div className="text-center pt-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                This site is protected by reCAPTCHA Enterprise and the Google{" "}
                <Button variant="link" className="text-xs text-gray-500 hover:text-gray-700 p-0 h-auto underline">
                  Privacy Policy
                </Button>{" "}
                and{" "}
                <Button variant="link" className="text-xs text-gray-500 hover:text-gray-700 p-0 h-auto underline">
                  Terms of Service
                </Button>{" "}
                apply.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
