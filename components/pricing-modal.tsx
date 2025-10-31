"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import { getVendorStatus, createSubscription } from "@/portable-pages/lib/connectApi"

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [billingCycle, setBillingCycle] = useState<"yearly" | "monthly">("yearly")
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
      setError("请先登录")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 1. 获取 vendorId
      const vendorStatus = await getVendorStatus(user.id)
      
      if (!vendorStatus.success || !vendorStatus.data?.id) {
        setError("未找到商家信息，请先绑定 Stripe 账户")
        setIsLoading(false)
        return
      }

      const vendorId = vendorStatus.data.id

      // 2. 调用订阅接口
      const interval = billingCycle === "yearly" ? "year" : "month"
      const subscriptionResponse = await createSubscription(vendorId, { interval })

      if (!subscriptionResponse.success || !subscriptionResponse.data?.checkoutUrl) {
        setError(subscriptionResponse.error || "创建订阅失败")
        setIsLoading(false)
        return
      }

      // 3. 跳转到支付页面
      window.location.href = subscriptionResponse.data.checkoutUrl
    } catch (err) {
      console.error("订阅处理错误:", err)
      setError(err instanceof Error ? err.message : "订阅处理失败，请稍后重试")
      setIsLoading(false)
    }
  }

  const plans = [
    {
      id: "pro",
      name: "Pro",
      description: "For more projects and usage",
      price: billingCycle === "yearly" ? "US$330" : "US$35",
      period: billingCycle === "yearly" ? "billed yearly" : "per month",
      buttonText: "Subscribe",
      buttonVariant: "default" as const,
      features: [
        "100 credits included",
        "Everything from Free",
        "Clone site feature",
        "Support in Email"
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
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-5xl mx-4 p-8">
        {/* 关闭按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4"
        >
          <X className="size-4" />
        </Button>

        {/* 顶部切换 */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <div className="flex flex-col items-center relative">
              {billingCycle === "yearly" && (
                <Badge className="absolute -top-6 bg-green-500 text-white text-xs px-2 py-0.5">
                  Save 21%
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBillingCycle("yearly")}
                className={`${
                  billingCycle === "yearly" 
                    ? "bg-white border-2 border-blue-500 text-blue-600" 
                    : "hover:bg-gray-200"
                }`}
              >
                Yearly
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBillingCycle("monthly")}
              className={`${
                billingCycle === "monthly" 
                  ? "bg-white border-2 border-blue-500 text-blue-600" 
                  : "hover:bg-gray-200"
              }`}
            >
              Monthly
            </Button>
          </div>
        </div>

        {/* 价格计划卡片 */}
        <div className="flex justify-center">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative w-full max-w-md transition-all duration-200 ${
                selectedPlan === plan.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:ring-2 hover:ring-gray-300'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{plan.period}</p>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <Button 
                  className="w-full mb-6" 
                  variant={plan.buttonVariant}
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSubscribe()
                  }}
                >
                  {isLoading ? "处理中..." : plan.buttonText}
                </Button>

                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="size-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
