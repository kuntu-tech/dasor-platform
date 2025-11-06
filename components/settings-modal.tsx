"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  User, 
  CreditCard, 
  FileText, 
  Eye, 
  ExternalLink, 
  ArrowRight, 
  Check, 
  Infinity,
  Download,
  X,
  Camera,
  Wallet,
  Loader2
} from "lucide-react"
import PaymentAccount from "@/portable-pages/components/settings/PaymentAccount"
import { useAuth } from "@/components/AuthProvider"
import { getBillingPortalUrl } from "@/lib/billingPortal"
import { supabase } from "@/lib/supabase"

const settingsMenu = [
  { id: "account", label: "Account", icon: User },
  { id: "billing", label: "Usage & Billing", icon: CreditCard },
  { id: "payout", label: "Payout Account", icon: Wallet },
]

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: string
}

export function SettingsModal({ isOpen, onClose, defaultTab = "account" }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const { user } = useAuth()
  const [billingPortalUrl, setBillingPortalUrl] = useState<string | null>(null)
  const [billingPortalLoading, setBillingPortalLoading] = useState(false)
  const [billingPortalError, setBillingPortalError] = useState<string | null>(null)
  
  // Avatar upload states
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // 获取用户头像
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("avatar_url")
            .eq("id", user.id)
            .single()
          
          if (!error && data?.avatar_url) {
            setAvatarUrl(data.avatar_url)
          }
        } catch (error) {
          console.log("获取用户头像失败:", error)
        }
      }
    }
    
    if (isOpen) {
      fetchUserAvatar()
    }
  }, [user?.id, isOpen])

  // 当弹窗打开时，设置默认标签页
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab)
    }
  }, [isOpen, defaultTab])

  // 当切换到 billing 标签时，自动加载 Customer Portal
  useEffect(() => {
    if (activeTab === "billing" && user?.id && !billingPortalUrl && !billingPortalLoading) {
      setBillingPortalLoading(true)
      setBillingPortalError(null)
      
      getBillingPortalUrl(user.id, window.location.href)
        .then((url) => {
          if (url) {
            setBillingPortalUrl(url)
          } else {
            setBillingPortalError("Failed to load billing portal. Please try again later.")
          }
        })
        .catch((error) => {
          console.log("加载 Customer Portal 失败:", error)
          setBillingPortalError("Network error. Please try again later.")
        })
        .finally(() => {
          setBillingPortalLoading(false)
        })
    }
  }, [activeTab, user?.id, billingPortalUrl, billingPortalLoading])

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    if (!user?.id) {
      setUploadError("Please log in first")
      return
    }

    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Unsupported file type. Supported: JPG, PNG, WebP, GIF")
      return
    }

    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadError("File size exceeds limit (Max 5MB)")
      return
    }

    // 创建预览
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)
    setUploadError(null)
    setUploadSuccess(null)
    setAvatarLoading(true)
    setUploadProgress(50) // 模拟进度

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", user.id)

      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Upload failed")
      }

      // 更新头像URL（添加缓存破坏参数）
      const avatarUrlWithCache = `${result.url}?t=${Date.now()}`
      
      // 预加载新图片，确保加载完成后再切换
      const img = new Image()
      
      // 设置加载完成和错误处理回调
      let imageLoaded = false
      
      img.onload = () => {
        if (!imageLoaded) {
          imageLoaded = true
          // 图片加载成功后，更新状态并清除预览
          setAvatarUrl(avatarUrlWithCache)
          setPreviewUrl(null)
          // 清理预览URL
          if (preview) {
            URL.revokeObjectURL(preview)
          }
        }
      }
      
      img.onerror = () => {
        if (!imageLoaded) {
          imageLoaded = true
          // 即使加载失败，也更新URL（可能是网络问题，但URL是正确的）
          // 保持预览URL一段时间，避免显示fallback
          setAvatarUrl(avatarUrlWithCache)
          // 延迟清除预览，给用户更多时间看到预览图
          setTimeout(() => {
            setPreviewUrl(null)
            if (preview) {
              URL.revokeObjectURL(preview)
            }
          }, 1000)
        }
      }
      
      // 设置图片源（这会触发加载）
      img.src = avatarUrlWithCache
      
      // 如果图片已经在缓存中（complete 为 true），onload 可能不会触发
      // 所以需要检查 complete 状态
      if (img.complete && img.naturalWidth > 0) {
        // 图片已在缓存中且有效，立即触发切换
        if (!imageLoaded) {
          imageLoaded = true
          setAvatarUrl(avatarUrlWithCache)
          setPreviewUrl(null)
          if (preview) {
            URL.revokeObjectURL(preview)
          }
        }
      }
      
      setUploadProgress(100)
      setUploadSuccess("Avatar updated successfully")

      // 3秒后自动清除成功提示
      setTimeout(() => {
        setUploadSuccess(null)
      }, 3000)
    } catch (error) {
      console.log("上传头像失败:", error)
      setUploadError(error instanceof Error ? error.message : "Upload failed")
      setPreviewUrl(null)
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    } finally {
      setAvatarLoading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }


  // 获取头像显示URL（优先使用预览，然后是已保存的头像）
  // avatarUrl 已经包含了缓存破坏参数，直接使用即可
  const displayAvatarUrl = previewUrl || avatarUrl

  // 获取用户首字母
  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return "U"
  }

  const renderAccountContent = () => (
    <div className="space-y-6">
      {/* Account Header */}
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage 
                  src={displayAvatarUrl || undefined} 
                  alt="Avatar"
                  key={displayAvatarUrl} // 添加key强制重新渲染，避免缓存问题
                />
                <AvatarFallback className="bg-orange-500 text-white text-2xl font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                >
                  {avatarLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="size-4" />
                      Change Avatar
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Upload Error */}
            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{uploadError}</p>
              </div>
            )}

            {/* Success Message */}
            {uploadSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">{uploadSuccess}</p>
              </div>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <input 
              type="text" 
              defaultValue="Gomberg Lambino"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <input 
              type="text" 
              defaultValue="gomberglambino"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="custom-username" 
                defaultChecked
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="custom-username" className="text-sm text-gray-700">
                Use custom username
              </label>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <textarea 
              placeholder="Tell us about yourself"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
            />
            <p className="text-sm text-muted-foreground">180 characters remaining</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderBillingContent = () => {
    // 如果未登录，显示提示
    if (!user?.id) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground">Please log in to view billing information</p>
          </div>
        </div>
      )
    }

    // 如果正在加载，显示加载状态
    if (billingPortalLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading billing portal...</p>
          </div>
        </div>
      )
    }

    // 如果加载失败，显示错误信息
    if (billingPortalError) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-600 mb-4">{billingPortalError}</p>
            <Button
              variant="outline"
              onClick={() => {
                setBillingPortalUrl(null)
                setBillingPortalError(null)
                setBillingPortalLoading(true)
                getBillingPortalUrl(user.id, window.location.href)
                  .then((url) => {
                    if (url) {
                      setBillingPortalUrl(url)
                    } else {
                      setBillingPortalError("Failed to load billing portal. Please try again later.")
                    }
                  })
                  .catch((error) => {
                    console.log("加载 Customer Portal 失败:", error)
                    setBillingPortalError("Network error. Please try again later.")
                  })
                  .finally(() => {
                    setBillingPortalLoading(false)
                  })
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      )
    }

    // 如果有 URL，显示提示信息和新窗口打开按钮
    // 注意：Stripe Customer Portal 不支持在 iframe 中嵌入（CSP 限制）
    if (billingPortalUrl) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-6">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ExternalLink className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Billing Portal</h2>
            <p className="text-muted-foreground mb-6">
              Stripe Customer Portal 需要在新的窗口中打开以查看和管理您的订阅信息。
            </p>
            <Button
              onClick={() => {
                if (billingPortalUrl) {
                  window.open(billingPortalUrl, '_blank', 'noopener,noreferrer');
                }
              }}
              size="lg"
              className="gap-2"
            >
              <ExternalLink className="size-4" />
              Open Billing Portal
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              点击按钮将在新标签页中打开 Stripe Customer Portal
            </p>
          </div>
        </div>
      )
    }

    // 默认状态（不应该到达这里）
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 蒙版 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 窗口 */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[80vh] mx-4 flex overflow-hidden">
        {/* 左侧导航栏 */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-semibold">Settings</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
          
          <nav className="space-y-1 flex-1">
            {settingsMenu.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3 h-10"
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 overflow-y-auto">
          <div className={activeTab === "billing" ? "h-full" : "p-8"}>
            {activeTab === "account" && renderAccountContent()}
            {activeTab === "billing" && renderBillingContent()}
            {activeTab === "payout" && <PaymentAccount />}
          </div>
        </div>
      </div>
    </div>
  )
}
