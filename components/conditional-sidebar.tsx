"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Settings, Crown, LogOut, Wallet } from "lucide-react";
import { SettingsModal } from "@/components/settings-modal";
import { PricingModal } from "@/components/pricing-modal";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { getVendorStatus } from "@/portable-pages/lib/connectApi";
import { supabase } from "@/lib/supabase";
export function ConditionalSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hasMounted, setHasMounted] = useState(false);
  const isHomePage = pathname === "/";
  const shouldRenderHomeLayout = hasMounted && isHomePage;
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState("account");
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const { signOut, user, session } = useAuth();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasConnectedStripeAccount, setHasConnectedStripeAccount] = useState<boolean | null>(null);
  const fetchStripeStatus = useCallback(async (retryCount = 0, isRetry = false) => {
    if (!user?.id) {
      setHasConnectedStripeAccount(null);
      return;
    }

    // Add delay for retry attempts to allow backend to update
    // Only delay if this is a retry (not the first attempt)
    if (isRetry && retryCount > 0) {
      const delay = Math.min(1000 * retryCount, 3000); // Max 3 seconds delay
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      const status = await getVendorStatus(user.id);
      if (status.success && status.data) {
        const stripeStatus = status.data.stripe_account_status;
        const isActive = status.data.is_active;
        const stripeAccountId = status.data.stripe_account_id;

        // Determine if Stripe account is ready
        // Account is ready if BOTH conditions are met:
        // 1. stripe_account_status is "active" (account is fully set up and ready)
        // 2. is_active is true (account is active and can receive payments)
        // This matches the logic in publish-flow.tsx for consistency
        // Note: charges_enabled and payouts_enabled are not stored in database,
        // so we rely on stripe_account_status and is_active fields
        const isStripeReady: boolean =
          stripeStatus === "active" && isActive === true;

        // If account is ready, update state immediately
        if (isStripeReady) {
          console.log("[ConditionalSidebar] Stripe account is ready:", {
            stripeStatus,
            isActive,
            stripeAccountId,
            retryCount,
          });
          setHasConnectedStripeAccount(true);
          return;
        }

        // If account is not ready but we have stripe_account_id, it might be in onboarding
        // Retry a few times to check if status updates (only when triggered by event)
        if (stripeAccountId && retryCount < 3 && isRetry) {
          console.log(`[ConditionalSidebar] Stripe account exists but not ready, retrying (${retryCount + 1}/3)...`, {
            stripeStatus,
            isActive,
            stripeAccountId,
          });
          // Schedule next retry - delay is handled at the start of the function
          setTimeout(() => {
            fetchStripeStatus(retryCount + 1, true);
          }, 0); // Use 0 delay, actual delay is handled at function start
          return;
        }

        // Account exists but not ready after retries, or no retry needed
        console.log("[ConditionalSidebar] Stripe account not ready:", {
          stripeStatus,
          isActive,
          hasAccountId: !!stripeAccountId,
          retryCount,
          isRetry,
        });
        setHasConnectedStripeAccount(isStripeReady);
      } else if (status.success === false) {
        // API returned an error
        // Don't retry if account doesn't exist (404) - this is not a temporary error
        const isAccountNotFound = status.error?.includes("not found") || status.error?.includes("No vendor");
        
        if (!isAccountNotFound && isRetry && retryCount < 3) {
          // Retry for temporary errors (server errors, network issues, etc.)
          console.log(`[ConditionalSidebar] Failed to get vendor status (temporary error), retrying (${retryCount + 1}/3)...`, {
            error: status.error,
          });
          setTimeout(() => {
            fetchStripeStatus(retryCount + 1, true);
          }, 0);
          return;
        }
        
        // Account doesn't exist or no retries left - set to false
        console.log("[ConditionalSidebar] Failed to get vendor status:", {
          error: status.error,
          isAccountNotFound,
          retryCount,
        });
        setHasConnectedStripeAccount(false);
      } else {
        // Invalid response - only retry if we're in retry mode
        if (isRetry && retryCount < 3) {
          console.log(`[ConditionalSidebar] Invalid vendor status response, retrying (${retryCount + 1}/3)...`);
          setTimeout(() => {
            fetchStripeStatus(retryCount + 1, true);
          }, 0);
          return;
        }
        setHasConnectedStripeAccount(null);
      }
    } catch (error) {
      // Network or other errors - only retry if we're in retry mode
      if (isRetry && retryCount < 3) {
        console.log(`[ConditionalSidebar] Error retrieving Stripe status, retrying (${retryCount + 1}/3)...`, error);
        setTimeout(() => {
          fetchStripeStatus(retryCount + 1, true);
        }, 0);
        return;
      }
      console.log("Failed to retrieve Stripe connection status:", error);
      setHasConnectedStripeAccount(null);
    }
  }, [user?.id]);

  // Retrieve user avatar
  const avatarCacheKey = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return user?.id ? `cached_avatar_${user.id}` : null;
  }, [user?.id]);

  const updateAvatar = useCallback(
    (url: string | null) => {
      setAvatarUrl(url);
      if (typeof window === "undefined") {
        return;
      }
      if (!avatarCacheKey) {
        return;
      }

      if (url) {
        localStorage.setItem(avatarCacheKey, url);
      } else {
        localStorage.removeItem(avatarCacheKey);
      }
    },
    [avatarCacheKey]
  );

  const getLatestAccessToken = useCallback(async (): Promise<string | null> => {
    let accessToken = session?.access_token ?? null;
    console.log("[ConditionalSidebar] getLatestAccessToken - initial", {
      userId: user?.id,
      sessionAccessToken: session?.access_token,
    });
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn("Failed to refresh Supabase session:", error);
      }
      if (data?.session?.access_token) {
        accessToken = data.session.access_token;
      }
      console.log("[ConditionalSidebar] getLatestAccessToken - after supabase.auth.getSession", {
        supabaseAccessToken: data?.session?.access_token,
        resolvedAccessToken: accessToken,
      });
    } catch (error) {
      console.warn("Unexpected error while getting Supabase session:", error);
    }
    return accessToken;
  }, [session?.access_token, user?.id]);

  const fetchUserAvatar = useCallback(async (): Promise<boolean> => {
    console.log("[ConditionalSidebar] fetchUserAvatar - start", {
      userId: user?.id,
      sessionAccessToken: session?.access_token,
    });
    if (!user?.id) {
      updateAvatar(null);
      console.log("[ConditionalSidebar] fetchUserAvatar - no user, clear avatar");
      return false;
    }

    const accessToken = await getLatestAccessToken();
    console.log("[ConditionalSidebar] fetchUserAvatar - resolved access token", {
      accessTokenPresent: Boolean(accessToken),
    });

    if (!accessToken) {
      const metadataAvatar =
        (user.user_metadata?.avatar_url as string | undefined) ??
        (user.user_metadata?.picture as string | undefined) ??
        null;
      updateAvatar(metadataAvatar ?? null);
      console.log("[ConditionalSidebar] fetchUserAvatar - no access token, using metadata avatar", {
        metadataAvatar,
      });
      return false;
    }

    try {
      const response = await fetch("/api/users/self", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
        cache: "no-store",
      });

      if (!response.ok) {
        console.warn("[ConditionalSidebar] fetchUserAvatar - /api/users/self failed", {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const json = await response.json();
      const avatarUrl =
        (json?.data?.avatar_url as string | undefined) ?? null;

      if (avatarUrl) {
        updateAvatar(avatarUrl);
        console.log("[ConditionalSidebar] fetchUserAvatar - fetched avatar from API", {
          avatarUrl,
        });
        return true;
      }

      const metadataAvatar =
        (user.user_metadata?.avatar_url as string | undefined) ??
        (user.user_metadata?.picture as string | undefined) ??
        null;
      updateAvatar(metadataAvatar ?? null);
      console.log("[ConditionalSidebar] fetchUserAvatar - API returned no avatar, fallback to metadata", {
        metadataAvatar,
      });
    } catch (error) {
      console.log("Failed to fetch user avatar:", error);
      const metadataAvatar =
        (user?.user_metadata?.avatar_url as string | undefined) ??
        (user?.user_metadata?.picture as string | undefined) ??
        null;
      updateAvatar(metadataAvatar ?? null);
      console.warn("[ConditionalSidebar] fetchUserAvatar - error fallback metadata", {
        metadataAvatar,
      });
    }

    return false;
  }, [
    getLatestAccessToken,
    updateAvatar,
    user?.id,
    user?.user_metadata,
  ]);
  useEffect(() => {
    if (!user?.id) {
      updateAvatar(null);
      return;
    }

    if (typeof window !== "undefined") {
      if (avatarCacheKey) {
        const cachedUrl = localStorage.getItem(avatarCacheKey);
        if (cachedUrl) {
          setAvatarUrl(cachedUrl);
        } else {
          const metadataAvatar =
            (user.user_metadata?.avatar_url as string | undefined) ??
            (user.user_metadata?.picture as string | undefined) ??
            null;
          setAvatarUrl(metadataAvatar ?? null);
        }
      }
    }

    const fetchWithRetry = async (attempt = 0) => {
      const hasDbAvatar = await fetchUserAvatar();

      if (!hasDbAvatar && attempt < 2) {
        setTimeout(() => fetchWithRetry(attempt + 1), 500 * (attempt + 1));
      }
    };

    fetchWithRetry();
  }, [
    avatarCacheKey,
    fetchUserAvatar,
    updateAvatar,
    user?.id,
    user?.user_metadata?.avatar_url,
    user?.user_metadata?.picture,
  ]);

  useEffect(() => {
    fetchStripeStatus();
  }, [fetchStripeStatus]);

  useEffect(() => {
    const handleStripeStatusUpdated = () => {
      console.log("[ConditionalSidebar] Stripe connection updated event received, fetching status with retry...");
      // Add initial delay to allow backend to process the update
      // Then retry up to 3 times to ensure we get the latest status
      setTimeout(() => {
        fetchStripeStatus(0, true);
      }, 500);
    };

    window.addEventListener("stripe-connection-updated", handleStripeStatusUpdated);

    return () => {
      window.removeEventListener("stripe-connection-updated", handleStripeStatusUpdated);
    };
  }, [fetchStripeStatus]);

  // Listen for avatar update events
  useEffect(() => {
    const handleAvatarUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ avatarUrl?: string }>).detail;
      if (detail?.avatarUrl) {
        updateAvatar(detail.avatarUrl ?? null);
      } else {
        fetchUserAvatar();
      }
    };

    window.addEventListener("avatar-updated", handleAvatarUpdated);

    return () => {
      window.removeEventListener("avatar-updated", handleAvatarUpdated);
    };
  }, [fetchUserAvatar]);

  // Inspect URL parameters to decide whether the settings dialog should open
  useEffect(() => {
    const openSettings = searchParams.get("openSettings");
    if (openSettings) {
      // Verify that the requested tab name is valid
      const validTabs = ["account", "billing", "payout"];
      if (validTabs.includes(openSettings)) {
        setSettingsDefaultTab(openSettings);
        setIsSettingsOpen(true);
        // Remove URL parameters so refreshes do not reopen the dialog
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("openSettings");
        router.replace(newUrl.pathname + (newUrl.search || ""), { scroll: false });
      }
    }
  }, [searchParams, router]);

  // Public routes that do not require authentication
  const publicPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/callback",
    "/auth/forgot-password",
    "/auth/reset-password",
  ];
  const isPublicPage = publicPaths.includes(pathname);

  const displayAvatarUrl =
    avatarUrl ??
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined) ??
    "/placeholder-user.jpg";

  // Top navigation bar component
  const TopNavBar = () => (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Logo - top-left */}
        <Link href="/" className="flex items-center gap-2">
          {/* <div className="size-10 rounded-lg bg-primary flex items-center justify-center"> */}
          <img src="/logo.png" alt="Logo" className="size-10 object-contain" />
          {/* </div> */}
          <span className="text-lg font-semibold text-gray-900">Datail</span>
        </Link>

        {/* User avatar - top-right */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="relative cursor-pointer hover:ring-2 hover:ring-gray-300 hover:ring-offset-2 rounded-full transition-all duration-200">
              {hasConnectedStripeAccount === false && (
                <span
                  className="absolute -right-0.5 -top-0.5 z-10 inline-flex size-3 items-center justify-center rounded-full bg-red-500"
                  aria-hidden="true"
                />
              )}
              <Avatar className="size-10">
                <AvatarImage
                  key={displayAvatarUrl}
                  src={displayAvatarUrl}
                  alt={user?.user_metadata?.full_name || "Account"}
                />
                <AvatarFallback>
                  {user?.user_metadata?.full_name?.charAt(0) ||
                    user?.email?.charAt(0) ||
                    "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" className="w-48 p-2">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setSettingsDefaultTab("account");
                  setIsSettingsOpen(true);
                }}
              >
                <Settings className="size-4" />
                Account
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setSettingsDefaultTab("payout");
                  setIsSettingsOpen(true);
                }}
              >
                <Wallet className="size-4" />
                <span className="flex-1 text-left">Payout</span>
                {hasConnectedStripeAccount === false && (
                  <span className="text-base leading-none text-red-500" aria-hidden="true">❗️</span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setIsPricingOpen(true)}
              >
                <Crown className="size-4" />
                Upgrade
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setSettingsDefaultTab("billing");
                  setIsSettingsOpen(true);
                }}
              >
                <Crown className="size-4" />
                Billing
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={async () => {
                  const redirectToLogin = () => {
                    router.push("/auth/login");
                    router.refresh();
                  };
                  try {
                    await signOut();
                  } catch (error) {
                    console.log("Sign-out failed:", error);
                  } finally {
                    // Wait briefly before redirecting to ensure state sync
                    setTimeout(redirectToLogin, 50);
                  }
                }}
              >
                <LogOut className="size-4" />
                Logout
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  const content = isPublicPage ? (
    <>{children}</>
  ) : shouldRenderHomeLayout ? (
    <>
      <TopNavBar />
      <div className="pt-16">{children}</div>
    </>
  ) : (
    <>{children}</>
  );

  return (
    <div className="min-h-svh">
      {content}
      {!isPublicPage && (
        <>
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            defaultTab={settingsDefaultTab}
          />
          <PricingModal
            isOpen={isPricingOpen}
            onClose={() => setIsPricingOpen(false)}
          />
        </>
      )}
    </div>
  );
}
