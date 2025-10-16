"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, ArrowUp, ArrowDown } from "lucide-react"

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [billingCycle, setBillingCycle] = useState<"yearly" | "monthly">("yearly")
  const [selectedPlan, setSelectedPlan] = useState<string>("pro")

  // 处理ESC键关闭
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
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  const plans = [
    {
      id: "free",
      name: "Free",
      description: "For personal use and testing",
      price: billingCycle === "yearly" ? "US$0" : "US$0",
      period: billingCycle === "yearly" ? "per month billed yearly" : "per month",
      buttonText: "Downgrade",
      buttonVariant: "outline" as const,
      features: [
        "10 credits included",
        "Component library",
        "UI Inspiration Library",
        "Theme Library",
        "Community support"
      ],
      isPopular: false
    },
    {
      id: "pro",
      name: "Pro",
      description: "For more projects and usage",
      price: billingCycle === "yearly" ? "US$16" : "US$20",
      period: billingCycle === "yearly" ? "per month billed yearly" : "per month",
      buttonText: "Switch to yearly billing",
      buttonVariant: "default" as const,
      features: [
        "100 credits included",
        "Everything from Free",
        "Clone site feature",
        "Support in Email"
      ],
      isPopular: true
    },
    {
      id: "pro-plus",
      name: "Pro Plus",
      description: "For power users",
      price: billingCycle === "yearly" ? "US$32" : "US$40",
      period: billingCycle === "yearly" ? "per month billed yearly" : "per month",
      buttonText: "Upgrade",
      buttonVariant: "default" as const,
      features: [
        "200 credits included",
        "Everything from Pro",
        "Priority support",
        "Early access to new features"
      ],
      isPopular: false,
      credits: "200"
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
                  Save 33%
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative cursor-pointer transition-all duration-200 ${
                selectedPlan === plan.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : plan.isPopular 
                    ? 'ring-2 ring-blue-500' 
                    : 'hover:ring-2 hover:ring-gray-300'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.isPopular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                  Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.credits && (
                      <div className="flex flex-col items-center">
                        <ArrowUp className="size-3" />
                        <span className="text-sm font-medium">{plan.credits}</span>
                        <ArrowDown className="size-3" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{plan.period}</p>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <Button 
                  className="w-full mb-6" 
                  variant={plan.buttonVariant}
                  onClick={(e) => {
                    e.stopPropagation()
                    // 这里可以添加按钮的具体逻辑
                  }}
                >
                  {plan.buttonText}
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
