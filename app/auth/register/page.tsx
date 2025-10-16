"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"

export default function RegisterPage() {
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
            <h1 className="text-2xl font-semibold text-gray-900">Create a Replit account</h1>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <Button variant="outline" className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center">
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            <Button variant="outline" className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </Button>
            <Button variant="outline" className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Continue with X
            </Button>
            <Button variant="outline" className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </Button>
            <Button variant="outline" className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.02-.546 7.322 1.519 9.712 1.013 1.18 2.205 2.504 3.799 2.458 1.521-.048 2.09-.985 3.903-.985 1.798 0 2.35.985 3.96.948 1.637-.026 2.676-1.18 3.676-2.357 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2.004-.152-3.816 1.108-4.814 1.108zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
              Continue with Apple
            </Button>
            <Button variant="outline" className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium">
              Or Use SSO login
            </Button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
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

            {/* Create Account Button */}
            <Button className="w-full h-12 bg-gray-400 text-white font-medium text-base cursor-not-allowed" disabled>
              Create Account
            </Button>

            {/* Terms and Privacy */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                By continuing, you agree to Replit's{" "}
                <Button variant="link" className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto underline">
                  Terms of Service
                </Button>{" "}
                and{" "}
                <Button variant="link" className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto underline">
                  Privacy Policy
                </Button>
              </p>
            </div>

            {/* Sign In Link */}
            <div className="text-center pt-4">
              <span className="text-sm text-gray-600">Already have an account? </span>
              <Button variant="link" asChild className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto font-medium">
                <Link href="/auth/login">Log in</Link>
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
