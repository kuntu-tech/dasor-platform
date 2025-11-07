"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import { getVendorStatus, createSubscription } from "@/portable-pages/lib/connectApi"
import { PricingCard, type Plan } from "@/components/ui/pricing"

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
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
      name: "Pro",
      info: "For more projects and usage",
      price: {
        monthly: 35,
        yearly: 35 * 12,
      },
      features: [
        { text: "Unlimited generating ChatAPP" },
        { text: "Unlimited import dasebase" },
        { text: "Unlimited times business analyst" },
        { text: "Unlock McKinsey-level AI analytics" },
      ],
      btn: {
        text: "Subscribe",
        loadingText: "Processing...",
        disabled: isLoading,
        onClick: () => {
          handleSubscribe()
        },
        variant: "default",
      },
    } satisfies Plan,
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      {/* 蒙版 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 窗口 */}
      <div className="relative mx-auto flex w-full max-w-lg flex-col items-center">
        <div className="relative w-full max-w-[19rem]">
          <PricingCard
            plan={plans[0]}
            frequency="monthly"
            className="rounded-[28px] border border-white/10 bg-[#0D0F16] shadow-[0_25px_80px_rgba(0,0,0,0.65)]"
          />

          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-zinc-200 shadow-[0_8px_16px_rgba(0,0,0,0.3)] transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-black/20"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 w-full max-w-sm rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
