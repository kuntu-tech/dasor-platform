"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
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
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "payout", label: "Payout Account", icon: Wallet },
]

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: string
}

export function SettingsModal({ isOpen, onClose, defaultTab = "account" }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const { user, session } = useAuth()
  const [billingPortalUrl, setBillingPortalUrl] = useState<string | null>(null)
  const [billingPortalLoading, setBillingPortalLoading] = useState(false)
  const [billingPortalError, setBillingPortalError] = useState<string | null>(null)
  const [hasPaymentHistory, setHasPaymentHistory] = useState<boolean | null>(null)
  const [checkingPaymentHistory, setCheckingPaymentHistory] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"no_vendor" | "no_payment_history" | "has_payment_history" | null>(null)
  
  // Avatar upload states
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [useCustomUsername, setUseCustomUsername] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  const getLatestAccessToken = useCallback(async (): Promise<string | null> => {
    let accessToken = session?.access_token ?? null
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.warn("Failed to refresh Supabase session:", error)
      }
      if (data?.session?.access_token) {
        accessToken = data.session.access_token
      }
    } catch (error) {
      console.warn("Unexpected error while fetching Supabase session:", error)
    }
    return accessToken
  }, [session?.access_token])

  const avatarCacheKey = useMemo(() => {
    if (typeof window === "undefined") return null
    return user?.id ? `cached_avatar_${user.id}` : null
  }, [user?.id])

  const updateAvatar = useCallback(
    (url: string | null) => {
      setAvatarUrl(url)
      if (typeof window === "undefined" || !avatarCacheKey) return
      if (url) {
        localStorage.setItem(avatarCacheKey, url)
      } else {
        localStorage.removeItem(avatarCacheKey)
      }
    },
    [avatarCacheKey]
  )

  type UserProfileRow = {
    name?: string | null
    full_name?: string | null
    username?: string | null
    bio?: string | null
    avatar_url?: string | null
  }

  const deriveDefaultUsername = () => {
    if (user?.email) {
      return user.email
    }
    return ""
  }

// Handle ESC key to close the modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      // Prevent background scrolling
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

// Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        setDisplayName("")
        setUsername("")
        setBio("")
        updateAvatar(null)
        setUseCustomUsername(false)
        return
      }

      // Prefill from Supabase Auth metadata to avoid temporary empty fields
      const metadataDisplayName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        user.email ??
        ""
      setDisplayName(metadataDisplayName)

      const metadataUsername =
        (user.user_metadata?.username as string | undefined) ??
        deriveDefaultUsername()
      setUsername(metadataUsername ?? "")
      setUseCustomUsername(Boolean(user.user_metadata?.username))

      const metadataBio =
        (user.user_metadata?.bio as string | undefined) ?? ""
      setBio(metadataBio)

      const metadataAvatar =
        (user.user_metadata?.avatar_url as string | undefined) ??
        (user.user_metadata?.picture as string | undefined) ??
        null
      updateAvatar(metadataAvatar ?? null)

      const accessToken = await getLatestAccessToken()

      if (!accessToken) {
        return
      }

      setProfileLoading(true)

      try {
        const response = await fetch("/api/users/self", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.id }),
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.status}`)
        }

        const payload = (await response.json()) as {
          data?: UserProfileRow | null
        }

        const profileData = payload?.data ?? null

        const fallbackDisplayName =
          profileData?.name ??
          profileData?.full_name ??
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          user.email ??
          ""

        setDisplayName(fallbackDisplayName)

        const fetchedUsername =
          profileData?.username ??
          (user.user_metadata?.username as string | undefined) ??
          deriveDefaultUsername()
        setUsername(fetchedUsername ?? "")
        setUseCustomUsername(Boolean(profileData?.username || user.user_metadata?.username))

        const fetchedBio =
          profileData?.bio ?? (user.user_metadata?.bio as string | undefined) ?? ""
        setBio(fetchedBio)

        const fetchedAvatar =
          profileData?.avatar_url ??
          (user.user_metadata?.avatar_url as string | undefined) ??
          (user.user_metadata?.picture as string | undefined) ??
          null
        updateAvatar(fetchedAvatar ?? null)
      } catch (error) {
        console.log("Failed to load user profile:", error)
      } finally {
        setProfileLoading(false)
      }
    }

    if (isOpen) {
      if (typeof window !== "undefined" && avatarCacheKey) {
        const cachedUrl = localStorage.getItem(avatarCacheKey)
        if (cachedUrl) {
          setAvatarUrl(cachedUrl)
        }
      }
      fetchUserProfile()
    }
  }, [user?.id, isOpen, avatarCacheKey, updateAvatar, getLatestAccessToken])

// Set the default tab whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab)
    }
  }, [isOpen, defaultTab])

  useEffect(() => {
    const handleAvatarUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ avatarUrl?: string | null }>).detail
      if (detail && "avatarUrl" in detail) {
        updateAvatar(detail.avatarUrl ?? null)
      }
    }

    window.addEventListener("avatar-updated", handleAvatarUpdated)
    return () => {
      window.removeEventListener("avatar-updated", handleAvatarUpdated)
    }
  }, [updateAvatar])

// When switching to the billing tab, check payment history before loading Customer Portal
  useEffect(() => {
    if (activeTab === "billing" && user?.id) {
      // Check payment history if not already done
      if (hasPaymentHistory === null && !checkingPaymentHistory) {
        setCheckingPaymentHistory(true)
        
        fetch(`/api/check-payment-history?userId=${user.id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setHasPaymentHistory(data.hasPaymentHistory)
              setPaymentStatus(data.status || null)
              
              // Only load the portal when payment history exists
              if (data.status === "has_payment_history" && !billingPortalUrl && !billingPortalLoading) {
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
                console.log("Failed to load Customer Portal:", error)
                    setBillingPortalError("Network error. Please try again later.")
                  })
                  .finally(() => {
                    setBillingPortalLoading(false)
                  })
              }
            } else {
              // On failure, default to “no payment history”
              setHasPaymentHistory(false)
              setPaymentStatus("no_payment_history")
            }
          })
          .catch((error) => {
            console.log("Failed to check payment history:", error)
            setHasPaymentHistory(false)
            setPaymentStatus("no_payment_history")
          })
          .finally(() => {
            setCheckingPaymentHistory(false)
          })
      } else if (paymentStatus === "has_payment_history" && !billingPortalUrl && !billingPortalLoading) {
        // Load the portal if payment history exists but the portal has not yet loaded
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
            console.log("Failed to load Customer Portal:", error)
            setBillingPortalError("Network error. Please try again later.")
          })
          .finally(() => {
            setBillingPortalLoading(false)
          })
      }
    }
  }, [activeTab, user?.id, billingPortalUrl, billingPortalLoading, hasPaymentHistory, checkingPaymentHistory, paymentStatus])

// Handle avatar file upload
  const handleFileUpload = async (file: File) => {
    if (!user?.id) {
      setUploadError("Please log in first")
      return
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Unsupported file type. Supported: JPG, PNG, WebP, GIF")
      return
    }

    // Validate file size (5 MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadError("File size exceeds limit (Max 5MB)")
      return
    }

    // Create preview URL
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)
    setUploadError(null)
    setUploadSuccess(null)
    setAvatarLoading(true)
    setUploadProgress(50) // simulate midpoint progress

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

      // Update avatar URL (append cache-busting param)
      const avatarUrlWithCache = `${result.url}?t=${Date.now()}`
      
      // Preload the new image to ensure it’s ready before switching
      const img = new Image()
      
      // Attach load and error handlers
      let imageLoaded = false
      
      img.onload = () => {
        if (!imageLoaded) {
          imageLoaded = true
          // On successful load, update state and clear preview
          updateAvatar(avatarUrlWithCache)
          setPreviewUrl(null)
          // Clean up the preview URL
          if (preview) {
            URL.revokeObjectURL(preview)
          }
        }
      }
      
      img.onerror = () => {
        if (!imageLoaded) {
          imageLoaded = true
          // Even if loading fails, update the URL (network issues might be transient)
          // Keep preview URL briefly to avoid showing fallback immediately
          updateAvatar(avatarUrlWithCache)
          // Delay clearing the preview so the user can view it longer
          setTimeout(() => {
            setPreviewUrl(null)
            if (preview) {
              URL.revokeObjectURL(preview)
            }
          }, 1000)
        }
      }
      
      // Assign the image source (this triggers loading)
      img.src = avatarUrlWithCache
      
      // If the image is cached (complete === true), the onload might not fire
      // therefore check the complete state
      if (img.complete && img.naturalWidth > 0) {
        // Image is cached and valid; update immediately
        if (!imageLoaded) {
          imageLoaded = true
          updateAvatar(avatarUrlWithCache)
          setPreviewUrl(null)
          if (preview) {
            URL.revokeObjectURL(preview)
          }
        }
      }
      
      setUploadProgress(100)
      setUploadSuccess("Avatar updated successfully")

      // Dispatch a custom event so other components refresh the avatar
      window.dispatchEvent(new CustomEvent('avatar-updated', { 
        detail: { avatarUrl: avatarUrlWithCache } 
      }))

      // Automatically remove success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(null)
      }, 3000)
    } catch (error) {
      console.log("Failed to upload avatar:", error)
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

// Handle file picker change
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }


// Determine avatar display URL (prefer preview over stored avatar)
// avatarUrl already contains cache-busting params; use as-is
  const displayAvatarUrl =
    previewUrl || avatarUrl || "/placeholder-user.jpg"

// Derive user initials as fallback
  const getInitials = () => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase()
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
                key={displayAvatarUrl} // force re-render to bypass caching issues
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
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your display name"
              disabled={profileLoading}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input 
              type="text" 
              value={useCustomUsername ? username : deriveDefaultUsername()}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              disabled={!useCustomUsername || profileLoading}
            />
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="custom-username" 
                checked={useCustomUsername}
                onChange={(event) => setUseCustomUsername(event.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="custom-username" className="text-sm text-gray-700">
                Use custom email
              </label>
            </div>
          </div>

          
        </CardContent>
      </Card>
    </div>
  )

  const renderBillingContent = () => {
    <div>
    <h1 className="text-2xl font-bold">Billing</h1>
  </div>

    // Show prompt when the user is not signed in
    if (!user?.id) {
      return (
        
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground">Please log in to view billing information</p>
          </div>
        </div>
      )
    }

    // Display loading state while checking payment history
    if (checkingPaymentHistory) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking payment history...</p>
          </div>
        </div>
      )
    }

    // Prompt when Stripe account is not linked
    if (paymentStatus === "no_vendor") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md px-6">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Stripe account not connected
            </h2>
            <p className="text-gray-600 text-base leading-relaxed">
              Please connect your Stripe account to view billing information and payment history.
            </p>
          </div>
        </div>
      )
    }

    // Prompt when no payment history exists
    if (paymentStatus === "no_payment_history") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md px-6">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No payment history
            </h2>
            <p className="text-gray-600 text-base leading-relaxed">
              You don't have any payment records yet. Once you receive payments, they will appear here.
            </p>
          </div>
        </div>
      )
    }

    // Render loading state while data is fetching
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

    // Show error message on load failure
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
                    console.log("Failed to load Customer Portal:", error)
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

    // Present CTA when the portal URL is available
    // Note: Stripe Customer Portal does not support embedding inside an iframe (CSP limitation)
    if (billingPortalUrl) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-6">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ExternalLink className="h-8 w-8 text-primary" />
              </div>
            </div>
           
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
              Click the button to open the Stripe Customer Portal in a new tab.
            </p>
          </div>
        </div>
      )
    }

    // Default state (should be unreachable)
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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal window */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[80vh] mx-4 flex overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full"
        >
          <X className="size-4" />
          <span className="sr-only">Close settings</span>
        </Button>

        {/* Left sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-semibold">Settings</h2>
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

        {/* Main content area */}
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
