"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X } from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import { getVendorStatus, createSubscription } from "@/portable-pages/lib/connectApi"

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>("pro")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // 处理ESC键关闭和错误状态
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      // 防止背景滚动
      document.body.style.overflow = "hidden"
      // 清除错误状态
      setError(null)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  // 处理订阅
  const handleSubscribe = async () => {
    if (!user?.id) {
      setError("Please log in first")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 1. 获取 vendorId
      const vendorStatus = await getVendorStatus(user.id)
      
      if (!vendorStatus.success || !vendorStatus.data?.id) {
        setError("Vendor information not found. Please connect your Stripe account first")
        setIsLoading(false)
        return
      }

      const vendorId = vendorStatus.data.id

      // 2. 构建回调 URL
      const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
      const successUrl = `${baseUrl}/subscription/success`
      const cancelUrl = `${baseUrl}/subscription/cancel`

      // 3. 调用订阅接口（固定为月付）
      const subscriptionResponse = await createSubscription(vendorId, {
        interval: "month",
        successUrl,
        cancelUrl,
      })

      // 检查是否已经有活跃订阅
      if (subscriptionResponse.success && subscriptionResponse.data) {
        if (subscriptionResponse.data.alreadySubscribed === true || 
            subscriptionResponse.message?.toLowerCase().includes("already has an active subscription")) {
          setError("You already have an active subscription")
          setIsLoading(false)
          return
        }
      }

      if (!subscriptionResponse.success || !subscriptionResponse.data?.checkoutUrl) {
        setError(subscriptionResponse.error || "Failed to create subscription")
        setIsLoading(false)
        return
      }

      // 3. 跳转到支付页面
      window.location.href = subscriptionResponse.data.checkoutUrl
    } catch (err) {
      console.log("订阅处理错误:", err)
      setError(err instanceof Error ? err.message : "Subscription processing failed. Please try again later")
      setIsLoading(false)
    }
  }

  const plans = [
    {
      id: "pro",
      name: "Pro",
      description: "For more projects and usage",
      price: "$35",
      period: "per month",
      buttonText: "Subscribe",
      buttonVariant: "default" as const,
      features: [
        "Unlimited generating ChatAPP",
        "Unlimited import dasebase",
        "Unlimited times business analyst",
        "Unlock McKinsey-level AI analytics"
      ],
      isPopular: false
    }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 蒙版 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 窗口 */}
      <div className="relative w-full max-w-md mx-4 p-4">
        {/* 价格计划卡片 */}
        <div className="flex justify-center">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative w-full max-w-md transition-all duration-200 bg-white rounded-lg shadow-2xl ${
                selectedPlan === plan.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:ring-2 hover:ring-gray-300'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {/* 关闭按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                className="absolute top-3 right-3 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>

              <CardHeader className="text-center pb-2 pt-6">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                
                <div className="mt-2">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground font-normal">/mo</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {error && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <div className="space-y-2 mb-4">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="size-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full" 
                  variant={plan.buttonVariant}
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSubscribe()
                  }}
                >
                  {isLoading ? "Processing..." : plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
