"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle, ArrowLeft, Home } from "lucide-react"

export default function SubscriptionCancelPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [vendorId, setVendorId] = useState<string | null>(null)

  useEffect(() => {
    // Retrieve info from URL parameters
    const vendorIdParam = searchParams.get("vendorId")
    setVendorId(vendorIdParam)
  }, [searchParams])

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const handleTryAgain = () => {
    // Return to pricing or subscription page
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-6">
            <div className="size-20 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <XCircle className="size-10 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold mb-2">
            Subscription Cancelled
          </CardTitle>
          <CardDescription className="text-lg">
            You have cancelled the subscription process
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Your subscription process has been cancelled. You can start a new subscription at any time.</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleTryAgain}
              className="w-full"
              size="lg"
            >
              Subscribe Again
              <ArrowLeft className="ml-2 size-4" />
            </Button>

            <Button 
              onClick={handleGoBack}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Go Back
            </Button>

            <Button 
              onClick={handleGoHome}
              variant="ghost"
              className="w-full"
              size="lg"
            >
              <Home className="mr-2 size-5" />
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

