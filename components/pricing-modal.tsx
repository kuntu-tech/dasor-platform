"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Pricing6 } from "@/components/ui/pricing-6"

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {

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


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 蒙版 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 窗口 */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 p-4">
        {/* 关闭按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4"
        >
          <X className="size-4" />
        </Button>


        {/* 使用新的 Pricing6 组件 */}
        <div className="py-4">
          <Pricing6
            heading="Pro Plan"
            description="Everything you need to turn your data into AI-powered businesses."
            price={20}
            priceSuffix="/mo"
            features={[
              ["Unlimited datasets and apps", "AI-powered market analysis", "ChatGPT Store publishing"],
              ["Advanced analytics dashboard", "Priority support", "Keep 100% of your revenue"]
            ]}
            buttonText="Get Started"
          />
        </div>
      </div>
    </div>
  )
}
