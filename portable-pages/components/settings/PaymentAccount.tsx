import { useEffect, useState, useRef, useCallback } from "react";
import PathSelection from "./payment/PathSelection";
import CreateAccount from "./payment/CreateAccount";
import ConnectExisting from "./payment/ConnectExisting";
import ConnectedState from "./payment/ConnectedState";
import { useAuth } from "../../../components/AuthProvider";
import { getVendorStatus, getLoginLink, type VendorStatusResponse } from "../../lib/connectApi";

type PaymentStep = "selection" | "create" | "connect" | "connected";

interface StatusAlertInfo {
  message: string;
  linkUrl: string | null;
}

interface PaymentAccountProps {
  onLoadingChange?: (isLoading: boolean) => void;
}

const PaymentAccount = ({ onLoadingChange }: PaymentAccountProps = {}) => {
  const [currentStep, setCurrentStep] = useState<PaymentStep>("selection");
  const [connectedEmail, setConnectedEmail] = useState<string>("");
  const [checkingConnection, setCheckingConnection] = useState(false); // Start as false, will be set to true when checking
  const [vendorStatus, setVendorStatus] = useState<VendorStatusResponse["data"] | null>(null);
  const { user, session, loading } = useAuth();

  // Track if we've already checked to prevent infinite loops
  const hasCheckedRef = useRef(false);
  const lastUserIdRef = useRef<string | undefined>(undefined);
  const oauthProcessedRef = useRef(false); // Track if OAuth callback has been processed
  const componentMountedRef = useRef(false); // Track if component has mounted

  useEffect(() => {
    console.log("[PaymentAccount] useAuth", { user, session, loading });
  }, [user, session, loading]);

  // Notify parent component about loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(checkingConnection);
    }
  }, [checkingConnection, onLoadingChange]);

  // Clear checking state if no user or still loading
  useEffect(() => {
    if (loading || !user?.id) {
      setCheckingConnection(false);
      hasCheckedRef.current = false; // Reset check flag when no user
    }
  }, [loading, user?.id]);

  // Reset check flag when user changes
  useEffect(() => {
    if (user?.id !== lastUserIdRef.current) {
      hasCheckedRef.current = false;
      oauthProcessedRef.current = false; // Reset OAuth processed flag when user changes
      lastUserIdRef.current = user?.id;
      componentMountedRef.current = false; // Reset mount flag when user changes
    }
  }, [user?.id]);

  // Reset check flag on component mount
  // This ensures that every time the payout tab is opened (component mounts), we check the connection status
  useEffect(() => {
    if (!componentMountedRef.current && user?.id && !loading) {
      componentMountedRef.current = true;
      hasCheckedRef.current = false; // Reset to ensure fresh check on mount
      console.log("[PaymentAccount] Component mounted, resetting check flag for fresh check");
    }
  }, [user?.id, loading]);

  // Warm up Supabase connection when component mounts and user is available
  useEffect(() => {
    if (session?.access_token && !loading) {
      console.log("🔥 [PaymentAccount] Warming up Supabase connection...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      fetch("/api/users/self", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({}),
      })
        .then((response) => {
          clearTimeout(timeoutId);
          if (response.ok) {
            console.log("✅ [PaymentAccount] Supabase connection warmed up");
          }
        })
        .catch((error: any) => {
          clearTimeout(timeoutId);
          if (error.name !== "AbortError") {
            console.log("⚠️ [PaymentAccount] Warmup error (non-critical):", error.message);
          }
        });
      
      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    }
  }, [session?.access_token, loading]);

  const notifyStripeStatusChange = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("stripe-connection-updated"));
    }
  };

  const handleSelection = (hasAccount: boolean) => {
    // Clear disconnect_time flag when user actively chooses a path
    // This prevents the disconnect check from interfering with user's selection
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("disconnect_time");
    }
    setCurrentStep(hasAccount ? "connect" : "create");
  };

  const handleBack = () => {
    setCurrentStep("selection");
  };

  const handleConnect = (email: string) => {
    setConnectedEmail(email);
    setCurrentStep("connected");
    notifyStripeStatusChange();
    // Force refresh status alert when reconnecting
    // Add a small delay to ensure backend has updated
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 500);
  };

  const handleDisconnect = async () => {
    console.log("[PaymentAccount] handleDisconnect called");
    
    // Reset UI state immediately - trust the disconnect API result
    setConnectedEmail("");
    setCurrentStep("selection");
    setCheckingConnection(false); // Ensure checking state is cleared
    hasCheckedRef.current = false; // Reset check flag to allow re-checking after disconnect
    oauthProcessedRef.current = false; // Reset OAuth processed flag
    notifyStripeStatusChange();
    
    // Set a flag to prevent OAuth callback check from interfering
    // This ensures that after disconnect, we don't accidentally show connected state
    if (typeof window !== "undefined") {
      sessionStorage.setItem("disconnect_time", Date.now().toString());
      // Clear any OAuth callback flags that might interfere
      sessionStorage.removeItem("payout_show_connected");
      sessionStorage.removeItem("oauth_callback_time");
    }
    
    // Re-check connection status with retry mechanism to ensure UI is in sync with backend
    // Backend may need time to update the database
    const verifyDisconnect = async (retryCount = 0) => {
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second between retries
      
      if (!user?.id) {
        return;
      }
      
      try {
        const resp = await getVendorStatus(user.id);
        console.log(`[PaymentAccount] Re-check after disconnect (attempt ${retryCount + 1}/${maxRetries + 1}):`, {
          success: resp.success,
          hasData: !!resp.data,
          stripeAccountId: resp.data?.stripe_account_id,
        });
        
        if (resp.success && resp.data && resp.data.stripe_account_id) {
          // Still connected - backend may not have updated yet, retry if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            console.log(`[PaymentAccount] Account still connected, retrying in ${retryDelay}ms...`);
            setTimeout(() => {
              verifyDisconnect(retryCount + 1);
            }, retryDelay);
          } else {
            // After max retries, still connected - this shouldn't happen if disconnect was successful
            // But trust the disconnect API result and show selection page anyway
            console.warn("[PaymentAccount] Account still connected after max retries, but showing selection page based on disconnect API result");
            setCurrentStep("selection");
            setConnectedEmail("");
          }
        } else {
          // Confirmed disconnected - show selection page
          console.log("[PaymentAccount] Disconnect confirmed, showing selection page");
          setCurrentStep("selection");
          setConnectedEmail("");
        }
      } catch (error) {
        console.log("Failed to re-check connection status after disconnect:", error);
        // On error, trust the disconnect API result and show selection page
        setCurrentStep("selection");
        setConnectedEmail("");
      }
    };
    
    // Add a delay before first check to allow backend to process the disconnect
    setTimeout(() => {
      verifyDisconnect();
    }, 1000); // Increase delay to 1 second to give backend more time
  };

  // When returning from OAuth success, show the connected state once (priority check)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (loading) return;
    if (!user?.id) {
      // If no user, clear checking state
      if (checkingConnection) {
        setCheckingConnection(false);
      }
      return;
    }

    // Check if we recently disconnected (within last 10 seconds)
    // If so, skip OAuth callback check to prevent showing connected state after disconnect
    const disconnectTime = sessionStorage.getItem("disconnect_time");
    const isRecentDisconnect = disconnectTime 
      ? (Date.now() - parseInt(disconnectTime)) < 10000 // 10 seconds
      : false;
    
    if (isRecentDisconnect) {
      console.log("[PaymentAccount] Recent disconnect detected, skipping OAuth callback check");
      // Clear checking state if it was set
      if (checkingConnection) {
        setCheckingConnection(false);
      }
      // Ensure we're showing selection page after disconnect
      if (currentStep === "connected") {
        setCurrentStep("selection");
        setConnectedEmail("");
      }
      return;
    }

    const shouldShowConnected = sessionStorage.getItem("payout_show_connected");
    if (shouldShowConnected && !oauthProcessedRef.current) {
      // Mark as processed to prevent duplicate processing
      oauthProcessedRef.current = true;
      
      // Set checking state immediately to prevent other useEffects from interfering
      setCheckingConnection(true);
      
      // Remove the flag immediately to prevent other useEffects from running
      sessionStorage.removeItem("payout_show_connected");
      
      console.log("[PaymentAccount] OAuth callback detected, verifying connection status...");
      
      // Verify connection status from backend to ensure it's actually connected
      // Add retry mechanism to handle backend processing delay
      const verifyConnection = async (retryCount = 0) => {
        const maxRetries = 5; // Increased retries to handle backend processing delay
        const retryDelay = 1500; // Increased delay to 1.5 seconds to give backend more time

        try {
          console.log(`[PaymentAccount] Verifying connection (attempt ${retryCount + 1}/${maxRetries + 1})...`);
          const resp = await getVendorStatus(user.id);
          console.log("[PaymentAccount] Verification response:", {
            success: resp.success,
            hasData: !!resp.data,
            stripeAccountId: resp.data?.stripe_account_id,
            stripeAccountStatus: resp.data?.stripe_account_status,
            email: resp.data?.email,
          });
          
          // Check if account is connected (has stripe_account_id) or is in onboarding state
          // Onboarding state means the account is being set up, so we should show connected state
          if (resp.success && resp.data && (resp.data.stripe_account_id || resp.data.stripe_account_status === "onboarding")) {
            // Confirmed connected or in onboarding - show connected state
            console.log("[PaymentAccount] Connection confirmed (or onboarding), showing connected state");
            setConnectedEmail(resp.data.email || user.email || "");
            setCurrentStep("connected");
            setCheckingConnection(false);
            hasCheckedRef.current = true; // Mark as checked to prevent duplicate checks
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("stripe-connection-updated"));
            }
            // Force refresh status alert after OAuth callback to get latest account status
            setTimeout(() => {
              setRefreshKey(prev => prev + 1);
            }, 1000);
          } else {
            // Not connected yet - might be a timing issue, retry if we haven't exceeded max retries
            if (retryCount < maxRetries) {
              console.log(`[PaymentAccount] Account not yet connected, retrying in ${retryDelay}ms (${retryCount + 1}/${maxRetries})...`);
              setTimeout(() => {
                verifyConnection(retryCount + 1);
              }, retryDelay);
            } else {
              // After max retries, check one more time with a longer delay
              // Sometimes backend needs more time to process OAuth callback
              console.log("[PaymentAccount] Max retries reached, waiting 3 seconds for final check...");
              setTimeout(async () => {
                try {
                  const finalResp = await getVendorStatus(user.id);
                  if (finalResp.success && finalResp.data && (finalResp.data.stripe_account_id || finalResp.data.stripe_account_status === "onboarding")) {
                    console.log("[PaymentAccount] Connection confirmed in final check, showing connected state");
                    setConnectedEmail(finalResp.data.email || user.email || "");
                    setCurrentStep("connected");
                    setCheckingConnection(false);
                    hasCheckedRef.current = true;
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("stripe-connection-updated"));
                    }
                    // Force refresh status alert after OAuth callback to get latest account status
                    setTimeout(() => {
                      setRefreshKey(prev => prev + 1);
                    }, 1000);
                  } else {
                    // Still not connected after all retries - show connected state anyway since OAuth callback succeeded
                    console.log("[PaymentAccount] OAuth succeeded but connection not confirmed after all retries, showing connected state anyway");
                    setConnectedEmail(user.email || "");
                    setCurrentStep("connected");
                    setCheckingConnection(false);
                    hasCheckedRef.current = true;
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("stripe-connection-updated"));
                    }
                    // Force refresh status alert after OAuth callback to get latest account status
                    setTimeout(() => {
                      setRefreshKey(prev => prev + 1);
                    }, 1000);
                  }
                } catch (finalError) {
                  console.log("[PaymentAccount] Final check error, showing connected state anyway:", finalError);
                  setConnectedEmail(user.email || "");
                  setCurrentStep("connected");
                  setCheckingConnection(false);
                  hasCheckedRef.current = true;
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("stripe-connection-updated"));
                  }
                  // Force refresh status alert after OAuth callback to get latest account status
                  setTimeout(() => {
                    setRefreshKey(prev => prev + 1);
                  }, 1000);
                }
              }, 3000);
            }
          }
        } catch (error) {
          console.log("[PaymentAccount] Failed to verify connection after OAuth:", error);
          // On error, retry if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            setTimeout(() => {
              verifyConnection(retryCount + 1);
            }, retryDelay);
          } else {
            // After max retries, show connected state anyway since OAuth callback succeeded
            console.log("[PaymentAccount] Error after max retries, showing connected state anyway");
            setConnectedEmail(user.email || "");
            setCurrentStep("connected");
            setCheckingConnection(false);
            hasCheckedRef.current = true; // Mark as checked to prevent duplicate checks
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("stripe-connection-updated"));
            }
            // Force refresh status alert after OAuth callback to get latest account status
            setTimeout(() => {
              setRefreshKey(prev => prev + 1);
            }, 1000);
          }
        }
      };

      // Add a delay before first check to allow backend to process OAuth callback
      // Increased delay to give backend more time to update the database
      setTimeout(() => {
        verifyConnection();
      }, 1000); // Increased initial delay to 1 second
    } else {
      // Reset OAuth processed flag if no OAuth callback detected
      oauthProcessedRef.current = false;
    }
  }, [loading, user?.id]);

  // Check if user already has a connected Stripe account when component mounts
  // This runs AFTER the OAuth callback check to avoid race conditions
  // IMPORTANT: This effect runs every time the component mounts (when dialog opens)
  // ALWAYS fetch fresh data to ensure we have the latest vendor status
  useEffect(() => {
    // Skip if OAuth return was detected (handled by the previous useEffect)
    if (typeof window !== "undefined" && sessionStorage.getItem("payout_show_connected")) {
      console.log("[PaymentAccount] Skipping regular check - OAuth callback in progress");
      return;
    }
    
    // IMPORTANT: Skip check if user has actively chosen a path (connect/create)
    // This prevents the check from interfering with user's selection
    if (currentStep === ("connect" as PaymentStep) || currentStep === ("create" as PaymentStep)) {
      console.log("[PaymentAccount] Skipping regular check - user has chosen a path");
      setCheckingConnection(false); // Clear loading state
      return;
    }
    
    // Skip if we recently disconnected (within last 10 seconds)
    // BUT only if we're still on selection page - don't interfere if user has chosen a path
    const disconnectTime = sessionStorage.getItem("disconnect_time");
    const isRecentDisconnect = disconnectTime 
      ? (Date.now() - parseInt(disconnectTime)) < 10000 // 10 seconds
      : false;
    
    if (isRecentDisconnect && currentStep === "selection") {
      console.log("[PaymentAccount] Skipping regular check - recent disconnect, staying on selection page");
      setCheckingConnection(false); // Clear loading state
      hasCheckedRef.current = false; // Reset check flag after disconnect
      oauthProcessedRef.current = false; // Reset OAuth processed flag
      // Only ensure selection page if we're already on it - don't force it if user chose a path
      setCurrentStep("selection");
      setConnectedEmail("");
      return;
    }
    
    // If user has chosen a path (connect/create), clear disconnect_time to allow normal flow
    if (isRecentDisconnect && (currentStep === ("connect" as PaymentStep) || currentStep === ("create" as PaymentStep))) {
      console.log("[PaymentAccount] User chose a path after disconnect, clearing disconnect flag");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("disconnect_time");
      }
    }
    
    // Skip if already checking
    if (checkingConnection) {
      console.log("[PaymentAccount] Skipping regular check - already checking");
      return;
    }

    // Skip if no user or still loading
    if (loading || !user?.id) {
      setCheckingConnection(false);
      return;
    }

    // Always check connection status when component mounts or user changes
    // This ensures that every time the payout tab is opened, we verify the connection status
    // IMPORTANT: Always fetch fresh data, never rely on cached state
    console.log("[PaymentAccount] Starting connection check on mount/open (fetching fresh data)...", {
      userId: user.id,
      hasCheckedRef: hasCheckedRef.current,
    });
    
    // Reset check flag to force fresh check every time component mounts
    // This ensures we always get the latest vendor status, even if user changed it in another browser
    hasCheckedRef.current = false;
    
    // Mark as checking to prevent duplicate checks
    setCheckingConnection(true);

    const checkExistingConnection = async () => {
      // Double-check that OAuth callback is not in progress
      if (typeof window !== "undefined" && sessionStorage.getItem("payout_show_connected")) {
        console.log("[PaymentAccount] OAuth callback detected during regular check, skipping");
        setCheckingConnection(false);
        hasCheckedRef.current = false;
        return;
      }

      // IMPORTANT: Don't reset currentStep if user has actively chosen a path
      // Capture the current step before async operation
      const currentStepBeforeCheck: PaymentStep = currentStep;
      
      try {
        // Always fetch fresh vendor status (no cache) to ensure we have latest data
        // This is critical when user disconnected/reconnected in another browser
        const resp = await getVendorStatus(user.id);
        console.log("[PaymentAccount] checkExistingConnection response (fresh data):", {
          success: resp.success,
          hasData: !!resp.data,
          stripeAccountId: resp.data?.stripe_account_id,
          stripeAccountStatus: resp.data?.stripe_account_status,
          isActive: resp.data?.is_active,
          chargesEnabled: resp.data?.charges_enabled,
          payoutsEnabled: resp.data?.payouts_enabled,
          email: resp.data?.email,
        });
        
        // Set to connected if we have valid data AND (stripe_account_id exists OR status is onboarding)
        // Onboarding state means the account is being set up, so we should show connected state
        if (resp.success && resp.data && (resp.data.stripe_account_id || resp.data.stripe_account_status === "onboarding")) {
          // User already has a connected Stripe account or account is in onboarding
          console.log("[PaymentAccount] Account is connected (or onboarding), showing connected state");
          const previousEmail = connectedEmail;
          const newEmail = resp.data.email || user.email || "";
          setConnectedEmail(newEmail);
          setCurrentStep("connected");
          hasCheckedRef.current = true; // Mark as checked only when successfully connected
          // If email changed (reconnected), force refresh status alert
          if (previousEmail !== newEmail || previousEmail === "") {
            setTimeout(() => {
              setRefreshKey(prev => prev + 1);
            }, 500);
          }
        } else {
          // User doesn't have a connected Stripe account (stripe_account_id is null/empty and not onboarding)
          // BUT: Don't reset currentStep if user has actively chosen a path (connect/create)
          if (currentStepBeforeCheck === ("connect" as PaymentStep) || currentStepBeforeCheck === ("create" as PaymentStep)) {
            console.log("[PaymentAccount] No connected account found, but user has chosen a path - keeping current step");
            // Keep the current step, don't reset to selection
          } else {
            console.log("[PaymentAccount] No connected account found, showing selection page");
            setConnectedEmail(""); // Clear any previous email
            setCurrentStep("selection");
          }
          hasCheckedRef.current = true; // Mark as checked even if not connected
        }
      } catch (error) {
        console.log("Failed to check Stripe connection status:", error);
        // On error, don't mark as checked to allow retry
        // BUT: Don't reset currentStep if user has actively chosen a path
        if (currentStepBeforeCheck === ("connect" as PaymentStep) || currentStepBeforeCheck === ("create" as PaymentStep)) {
          console.log("[PaymentAccount] Error checking connection, but user has chosen a path - keeping current step");
          // Keep the current step, don't reset to selection
        } else {
          setConnectedEmail(""); // Clear any previous email
          setCurrentStep("selection");
        }
        hasCheckedRef.current = false; // Reset to allow retry on next render
      } finally {
        setCheckingConnection(false);
      }
    };

    checkExistingConnection();
  }, [user?.id, loading, currentStep]);

  // Fallback: Ensure checkingConnection is cleared if it's stuck
  useEffect(() => {
    if (checkingConnection && !loading && user?.id) {
      const timeoutId = setTimeout(() => {
        console.warn("[PaymentAccount] Checking connection timeout, clearing loading state");
        setCheckingConnection(false);
        hasCheckedRef.current = false; // Reset to allow retry after timeout
        // Default to selection page if timeout occurs
        setCurrentStep("selection");
        setConnectedEmail("");
      }, 5000); // Reduced to 5 seconds timeout

      return () => clearTimeout(timeoutId);
    }
  }, [checkingConnection, loading, user?.id]);

  // State for status alert
  const [statusAlert, setStatusAlert] = useState<StatusAlertInfo | null>(null);
  const [loadingAlert, setLoadingAlert] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh key

  // Function to fetch vendor status and update alert
  // This function ALWAYS fetches fresh data from the API, never uses cached data
  const fetchVendorStatusAndAlert = useCallback(async () => {
    if (!user?.id || loading) return;
    
    try {
      // Always fetch fresh vendor status with cache: 'no-store' to ensure latest data
      // This ensures that if user disconnected/reconnected in another browser,
      // this browser will get the latest status
      const resp = await getVendorStatus(user.id);
      if (resp.success && resp.data) {
        setVendorStatus(resp.data);
        
        // Generate alert info based on vendor status
        const status = resp.data.stripe_account_status;
        const isActive = resp.data.is_active === true;
        const vendorId = resp.data.id;
        
        // IMPORTANT: For active accounts with is_active=true, check if we should show alert
        // If account is active and is_active is true, we assume everything is working unless explicitly disabled
        if (status === "active" && isActive) {
          // For active accounts, only show alert if charges_enabled or payouts_enabled are explicitly false
          // If they are null/undefined/true, we assume they are enabled (account is active and ready)
          const chargesEnabledValue = resp.data.charges_enabled;
          const payoutsEnabledValue = resp.data.payouts_enabled;
          
          // Only show alert if explicitly disabled (false)
          // If null/undefined/true, assume enabled for active accounts
          const chargesDisabled = chargesEnabledValue === false;
          const payoutsDisabled = payoutsEnabledValue === false;
          
          // If account is active and neither charges nor payouts are explicitly disabled, no alert needed
          if (!chargesDisabled && !payoutsDisabled) {
            console.log("[PaymentAccount] Account is active and ready, no alert needed", {
              status,
              isActive,
              chargesEnabled: chargesEnabledValue,
              payoutsEnabled: payoutsEnabledValue,
            });
            setStatusAlert(null);
            setLoadingAlert(false);
            return;
          }
        }
        
        // For non-active accounts or accounts with disabled features, determine what alert to show
        const chargesEnabledValue = resp.data.charges_enabled;
        const payoutsEnabledValue = resp.data.payouts_enabled;
        
        // Determine enabled status for alert messages
        // If account is active and is_active is true, assume enabled unless explicitly false
        const chargesEnabled = chargesEnabledValue === false 
          ? false 
          : (status === "active" && isActive ? true : chargesEnabledValue === true);
        
        const payoutsEnabled = payoutsEnabledValue === false 
          ? false 
          : (status === "active" && isActive ? true : payoutsEnabledValue === true);

        // Helper function to get Stripe account link
        const getStripeAccountLink = async (vendorId: number): Promise<string | null> => {
          try {
            const loginLinkResp = await getLoginLink(vendorId);
            if (loginLinkResp.success && loginLinkResp.data) {
              // Priority: onboardingUrl > url > dashboardUrl
              return loginLinkResp.data.onboardingUrl || loginLinkResp.data.url || loginLinkResp.data.dashboardUrl || null;
            }
            return null;
          } catch (error) {
            console.log("Failed to get Stripe account link:", error);
            return null;
          }
        };

        // Determine alert message first (show immediately)
        let alertMessage = "";
        if (status === "onboarding") {
          alertMessage = "Complete your Stripe account onboarding to receive payments from your users";
        } else if (status === "active" && !isActive) {
          alertMessage = "Your Stripe account is not ready to receive payments. Please finish onboarding in your Stripe dashboard";
        } else if (status === "active" && !chargesEnabled) {
          alertMessage = "Charges are not enabled for your Stripe account. Please enable charges in your Stripe dashboard";
        } else if (status === "active" && !payoutsEnabled) {
          alertMessage = "Payouts are not enabled for your Stripe account. Please enable payouts in your Stripe dashboard";
        }

        // Show alert immediately with message (link will be added asynchronously)
        if (alertMessage) {
          setStatusAlert({
            message: alertMessage,
            linkUrl: null, // Will be updated when link is fetched
          });
          setLoadingAlert(false);
        }

        // Fetch link asynchronously and update alert (if vendorId exists)
        if (vendorId && alertMessage) {
          getStripeAccountLink(vendorId)
            .then((linkUrl) => {
              // Update alert with link if it was successfully fetched
              setStatusAlert({
                message: alertMessage,
                linkUrl: linkUrl,
              });
            })
            .catch((error) => {
              console.log("Failed to get Stripe account link:", error);
              // Keep the alert without link if fetch fails
            });
        }
      } else {
        setVendorStatus(null);
        setStatusAlert(null);
        setLoadingAlert(false);
      }
    } catch (error) {
      console.log("Failed to fetch vendor status for alert:", error);
      setVendorStatus(null);
      setStatusAlert(null);
      setLoadingAlert(false);
    }
  }, [user?.id, loading]);

  // Track when component becomes visible to force refresh
  const lastVisibilityChangeRef = useRef<number>(0);
  
  // Listen for visibility changes (when user switches tabs or browser windows)
  useEffect(() => {
    if (typeof document === "undefined") return;
    
    const handleVisibilityChange = () => {
      if (!document.hidden && currentStep === "connected") {
        // Page became visible, force refresh vendor status
        const now = Date.now();
        // Throttle: only refresh if last refresh was more than 2 seconds ago
        if (now - lastVisibilityChangeRef.current > 2000) {
          console.log("[PaymentAccount] Page became visible, refreshing vendor status");
          lastVisibilityChangeRef.current = now;
          setRefreshKey(prev => prev + 1);
        }
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentStep]);

  // Fetch vendor status when connected to show status alert
  // ALWAYS fetch fresh data when currentStep becomes "connected" to ensure latest status
  useEffect(() => {
    if (currentStep === "connected" && user?.id && !loading) {
      // Always fetch fresh vendor status, don't rely on cached data
      console.log("[PaymentAccount] Fetching fresh vendor status for status alert");
      fetchVendorStatusAndAlert();
    } else {
      setVendorStatus(null);
      setStatusAlert(null);
      setLoadingAlert(false);
    }
  }, [currentStep, user?.id, loading, refreshKey, connectedEmail, fetchVendorStatusAndAlert]);

  // Listen for Stripe connection updates
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleStripeUpdate = () => {
      console.log("[PaymentAccount] Stripe connection updated event received");
      if (currentStep === "connected") {
        // Force refresh by updating refresh key
        setRefreshKey(prev => prev + 1);
      }
    };

    window.addEventListener("stripe-connection-updated", handleStripeUpdate);
    return () => {
      window.removeEventListener("stripe-connection-updated", handleStripeUpdate);
    };
  }, [currentStep]);

  // Listen for window focus to refresh status when user returns from Stripe
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (currentStep !== "connected") return;

    const handleFocus = () => {
      console.log("[PaymentAccount] Window focused, refreshing Stripe status");
      // Add a small delay to ensure Stripe has updated their backend
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 500);
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [currentStep]);

  // Show loading state while checking connection status
  if (checkingConnection) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Payout</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking connection status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payout Account Header */}
      <div>
        <h1 className="text-2xl font-bold">Payout</h1>
        {/* Status Alert for connected accounts */}
        {currentStep === "connected" && !loadingAlert && statusAlert && (
          <p className="text-sm text-red-500 mt-2">
            {statusAlert.linkUrl ? (
              <a
                href={statusAlert.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-600 cursor-pointer no-underline"
              >
                <span>❗️</span> {statusAlert.message}
              </a>
            ) : (
              <span>
                <span>❗️</span> {statusAlert.message}
              </span>
            )}
          </p>
        )}
      </div>
      {currentStep !== "connected" ? (
        <>
          <p className="text-sm text-red-500">❗️Connect your Stripe account for receive payment from your users</p>
          {currentStep === "selection" && <PathSelection onSelect={handleSelection} />}

          {currentStep === "create" && <CreateAccount onBack={handleBack} onConnect={handleConnect} />}

          {currentStep === "connect" && <ConnectExisting onBack={handleBack} onConnect={handleConnect} />}
        </>
      ) : (
        <ConnectedState email={connectedEmail} onDisconnect={handleDisconnect} />
      )}
    </div>
  );
};

export default PaymentAccount;


