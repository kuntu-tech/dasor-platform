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
    // 从 URL 参数中获取信息
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
    // 返回定价页面或订阅页面
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
            订阅已取消
          </CardTitle>
          <CardDescription className="text-lg">
            您取消了订阅流程
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>您的订阅流程已被取消。您可以随时重新开始订阅。</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleTryAgain}
              className="w-full"
              size="lg"
            >
              重新订阅
              <ArrowLeft className="ml-2 size-4" />
            </Button>

            <Button 
              onClick={handleGoBack}
              variant="outline"
              className="w-full"
              size="lg"
            >
              返回上一页
            </Button>

            <Button 
              onClick={handleGoHome}
              variant="ghost"
              className="w-full"
              size="lg"
            >
              <Home className="mr-2 size-5" />
              返回首页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

