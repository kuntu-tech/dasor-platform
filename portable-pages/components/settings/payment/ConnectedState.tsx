import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { useState, useEffect, useRef } from "react";
import DisconnectModal from "./DisconnectModal";
import { getVendorStatus, disconnectAccount, getLoginLink } from "../../../lib/connectApi";
import { useAuth } from "../../../../components/AuthProvider";
import { useToast } from "../../../hooks/use-toast";

interface ConnectedStateProps {
  email: string;
  onDisconnect: () => void;
}

const ConnectedState = ({ email, onDisconnect }: ConnectedStateProps) => {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [vendorData, setVendorData] = useState<{ 
    id: number;
    email: string; 
    stripe_account_id: string;
    livemode?: boolean | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);
  const hasNotifiedDisconnect = useRef(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchVendor = async () => {
      if (user?.id) {
        // Check if we recently disconnected (within last 10 seconds)
        // If so, skip fetching vendor data to prevent showing stale data
        const disconnectTime = typeof window !== "undefined"
          ? sessionStorage.getItem("disconnect_time")
          : null;
        const isRecentDisconnect = disconnectTime 
          ? (Date.now() - parseInt(disconnectTime)) < 10000 // 10 seconds
          : false;
        
        if (isRecentDisconnect) {
          console.log("[ConnectedState] Recent disconnect detected, skipping vendor fetch");
          setVendorData(null);
          setHasCheckedOnce(true);
          setLoading(false);
          return;
        }
        
        // Check if we recently completed OAuth callback (within last 30 seconds)
        // If so, add retry mechanism to handle backend processing delay
        const oauthCallbackTime = typeof window !== "undefined" 
          ? sessionStorage.getItem("oauth_callback_time")
          : null;
        const isRecentOAuthCallback = oauthCallbackTime 
          ? (Date.now() - parseInt(oauthCallbackTime)) < 30000 // 30 seconds
          : false;
        
        const fetchWithRetry = async (retryCount = 0) => {
          const maxRetries = isRecentOAuthCallback ? 3 : 0; // Only retry if recent OAuth callback
          const retryDelay = 2000; // 2 seconds between retries
          
          try {
            const resp = await getVendorStatus(user.id);
            console.log("[ConnectedState] fetchVendor response:", {
              success: resp.success,
              hasData: !!resp.data,
              stripeAccountId: resp.data?.stripe_account_id,
              stripeAccountStatus: resp.data?.stripe_account_status,
              email: resp.data?.email,
            });
            
            setHasCheckedOnce(true);
            if (resp.success && resp.data) {
              // Set vendor data if stripe_account_id exists OR if account is in onboarding state
              // Onboarding state means the account is being set up, so we should show connected state
              if (resp.data.stripe_account_id || resp.data.stripe_account_status === "onboarding") {
                console.log("[ConnectedState] Setting vendor data with stripe_account_id:", resp.data.stripe_account_id || "onboarding", "status:", resp.data.stripe_account_status);
                setVendorData({ 
                  id: resp.data.id,
                  email: resp.data.email, 
                  stripe_account_id: resp.data.stripe_account_id || "", // Use empty string if null but status is onboarding
                  livemode: resp.data.livemode ?? null
                });
                setLoading(false);
              } else {
                // Account is disconnected (stripe_account_id is null/empty and not onboarding)
                // If recent OAuth callback, retry in case backend hasn't updated yet
                if (isRecentOAuthCallback && retryCount < maxRetries) {
                  console.log(`[ConnectedState] No stripe_account_id found after OAuth, retrying in ${retryDelay}ms (${retryCount + 1}/${maxRetries})...`);
                  setTimeout(() => {
                    fetchWithRetry(retryCount + 1);
                  }, retryDelay);
                } else {
                  console.log("[ConnectedState] No stripe_account_id found and not onboarding, clearing vendor data");
                  setVendorData(null);
                  setLoading(false);
                }
              }
            } else {
              // No vendor data or failed response
              // If recent OAuth callback, retry in case backend hasn't updated yet
              if (isRecentOAuthCallback && retryCount < maxRetries) {
                console.log(`[ConnectedState] No vendor data after OAuth, retrying in ${retryDelay}ms (${retryCount + 1}/${maxRetries})...`);
                setTimeout(() => {
                  fetchWithRetry(retryCount + 1);
                }, retryDelay);
              } else {
                console.log("[ConnectedState] No vendor data in response, clearing state");
                setVendorData(null);
                setLoading(false);
              }
            }
          } catch (err) {
            console.log("Failed to fetch vendor:", err);
            // If recent OAuth callback, retry in case of network error
            if (isRecentOAuthCallback && retryCount < maxRetries) {
              console.log(`[ConnectedState] Fetch error after OAuth, retrying in ${retryDelay}ms (${retryCount + 1}/${maxRetries})...`);
              setTimeout(() => {
                fetchWithRetry(retryCount + 1);
              }, retryDelay);
            } else {
              setHasCheckedOnce(true);
              setVendorData(null);
              setLoading(false);
            }
          }
        };
        
        // Add initial delay if recent OAuth callback to give backend time to process
        if (isRecentOAuthCallback) {
          setTimeout(() => {
            fetchWithRetry();
          }, 1000); // Wait 1 second before first check
        } else {
          fetchWithRetry();
        }
      } else {
        setLoading(false);
      }
    };

    fetchVendor();
  }, [user]);

  // Notify parent component when vendor data is cleared (account disconnected)
  // Only notify after we've checked at least once and confirmed there's no connection
  useEffect(() => {
    // Check if we just came from OAuth callback (within last 30 seconds)
    // This prevents false positives when backend hasn't finished updating yet
    // Increased timeout to 30 seconds to give backend more time to process
    const oauthCallbackTime = typeof window !== "undefined" 
      ? sessionStorage.getItem("oauth_callback_time")
      : null;
    const isRecentOAuthCallback = oauthCallbackTime 
      ? (Date.now() - parseInt(oauthCallbackTime)) < 30000 // 30 seconds
      : false;

    // Check if we recently disconnected (within last 10 seconds)
    // If so, don't notify again as parent already handled the disconnect
    const disconnectTime = typeof window !== "undefined"
      ? sessionStorage.getItem("disconnect_time")
      : null;
    const isRecentDisconnect = disconnectTime 
      ? (Date.now() - parseInt(disconnectTime)) < 10000 // 10 seconds
      : false;

    // Only notify if:
    // 1. We've finished loading
    // 2. We've checked at least once (to avoid false positives on initial load)
    // 3. There's no vendor data (account is disconnected)
    // 4. We have an email prop (meaning we were previously connected)
    // 5. We haven't already notified (to avoid infinite loops)
    // 6. It's not a recent OAuth callback (give backend time to update)
    // 7. It's not a recent disconnect (parent already handled it)
    if (!loading && hasCheckedOnce && !vendorData && email && user?.id && !hasNotifiedDisconnect.current && !isRecentOAuthCallback && !isRecentDisconnect) {
      // Account was disconnected, notify parent to update UI
      console.log("[ConnectedState] No vendor data found, notifying parent to disconnect");
      hasNotifiedDisconnect.current = true;
      onDisconnect();
    }
    // Reset notification flag when vendorData is set (reconnected)
    if (vendorData) {
      hasNotifiedDisconnect.current = false;
    }
  }, [loading, hasCheckedOnce, vendorData, user?.id, email, onDisconnect]);

  // Don't display account details if vendorData is null (account is disconnected)
  // Show details if we have valid vendor data (with stripe_account_id or in onboarding state)
  // Note: vendorData is only set if stripe_account_id exists or status is onboarding
  const shouldShowAccountDetails = vendorData && (vendorData.stripe_account_id || vendorData.id);
  
  const displayEmail = vendorData?.email || email;
  const displayStripeAccountId = vendorData?.stripe_account_id;

  const handleViewDashboard = async () => {
    if (!vendorData?.id) {
      setDashboardError("Vendor ID is required");
      return;
    }

    setDashboardLoading(true);
    setDashboardError(null);

    try {
      const result = await getLoginLink(vendorData.id);

      if (result.success && result.data) {
        // Check if account requires onboarding
        if (result.data.requiresOnboarding) {
          // Account onboarding is not complete
          const message = result.data.message || result.message;
          
          // If onboarding URL is provided, redirect to onboarding page
          if (result.data.onboardingUrl) {
            // Open onboarding page in a new tab to complete account setup
            window.open(result.data.onboardingUrl, "_blank");
            return;
          }
          
          // If no onboarding URL, show message to user
          if (message) {
            setDashboardError(message);
            console.warn("Account requires onboarding:", message);
            toast({
              variant: "warning",
              title: "Account requires onboarding",
              description: message,
            });
          }
          
          // Still try to open Dashboard URL (user may need to login first)
          if (result.data.dashboardUrl) {
            window.open(result.data.dashboardUrl, "_blank");
          }
          
          return;
        }

        // Account onboarding is complete - open Dashboard
        // Priority: use temporary login link (url), fallback to direct Dashboard URL
        const urlToOpen = result.data.url || result.data.dashboardUrl;
        
        if (urlToOpen) {
          window.open(urlToOpen, "_blank");
        } else {
          setDashboardError("Unable to get Dashboard link");
        }

        // Log warning if login link creation failed (but don't block the operation)
        if (result.data.warning) {
          console.warn("Warning:", result.data.warning);
          if (result.data.note) {
            console.log("Note:", result.data.note);
          }
        }
      } else {
        // Handle error - only show if backend returns error message
        if (result.error) {
          setDashboardError(result.error);
          console.log("Failed to get dashboard link:", result.error);
        }
      }
    } catch (err) {
      console.log("Error fetching dashboard link:", err);
      // Only show error message if it's a meaningful error
      if (err instanceof Error && err.message) {
        setDashboardError(err.message);
      } else {
        setDashboardError("Network error, please try again");
      }
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleDisconnectConfirm = async () => {
    if (!vendorData?.id || !user?.id) {
      setDisconnectError("Missing vendor or user information");
      return;
    }

    setDisconnecting(true);
    setDisconnectError(null);

    try {
      const result = await disconnectAccount(vendorData.id, user.id);

      if (result.success) {
        // Show warning if there's an active subscription
        if (result.data?.warning) {
          toast({
            variant: "warning",
            title: "Subscription active",
            description: result.data.warning.message,
          });
        }

        // Show success message
        toast({
          variant: "success",
          title: "Account disconnected successfully",
          description: "",
        });

        // Clear local vendor data
        setVendorData(null);
        hasNotifiedDisconnect.current = true;
        
        // Close modal and call parent callback to update UI
        setShowDisconnectModal(false);
        onDisconnect();
      } else {
        // Handle error - but still update UI if backend says account is not connected
        const errorMessage = result.error || "Failed to disconnect account";
        console.log("[ConnectedState] Disconnect API error:", errorMessage);
        
        // If backend says "Vendor has not connected a Stripe account yet", 
        // it means the account is already disconnected, so update UI accordingly
        if (errorMessage.includes("not connected") || errorMessage.includes("has not connected")) {
          console.log("[ConnectedState] Backend confirms account is not connected, updating UI");
          // Clear local vendor data
          setVendorData(null);
          hasNotifiedDisconnect.current = true;
          
          // Close modal and call parent callback to update UI
          setShowDisconnectModal(false);
          onDisconnect();
          
          // Show info message instead of error
          toast({
            variant: "info",
            title: "Account is already disconnected",
            description: "",
          });
        } else {
          // For other errors, show error message but don't update UI
          setDisconnectError(errorMessage);
          toast({
            variant: "error",
            title: "Error",
            description: errorMessage,
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to disconnect account";
      console.log("[ConnectedState] Disconnect error:", errorMessage);
      setDisconnectError(errorMessage);
      toast({
        variant: "error",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setDisconnecting(false);
    }
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading account details...</p>
          </div>
        </div>
      </div>
    );
  }

  // If no vendor data or no stripe_account_id, don't show account details
  // The parent component should handle showing the selection page
  if (!shouldShowAccountDetails) {
    // This should not happen if parent component logic is correct,
    // but as a safety measure, notify parent to update state
    if (hasCheckedOnce && !vendorData) {
      // Account is disconnected, parent should have been notified already
      // But if we're still here, force update
      return (
        <div className="space-y-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No connected account found. Please connect your Stripe account.</p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div>
      <div className="max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-8">
          <h3 className="mb-6 text-lg font-semibold">Account Details</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">Stripe Account Email</p>
              <p className="font-medium">{displayEmail}</p>
            </div>
            {displayStripeAccountId ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">Stripe Account ID</p>
                <p className="font-medium">{displayStripeAccountId}</p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">Account Status</p>
                <p className="font-medium text-yellow-600">Onboarding in progress...</p>
              </div>
            )}
          </div>
          <div className="mt-8 flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="gap-2 w-fit" 
              onClick={handleViewDashboard}
              disabled={dashboardLoading || !vendorData?.id}
            >
              {dashboardLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              View Dashboard on Stripe
              <ExternalLink className="h-4 w-4" />
            </Button>
            {dashboardError && (
              <div className="text-sm text-destructive">{dashboardError}</div>
            )}
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <Button 
            variant="destructive" 
            size="sm" 
            className="text-white" 
            onClick={() => setShowDisconnectModal(true)}
            disabled={disconnecting}
          >
            Disconnect Account
          </Button>
        </div>
      </div>
      <DisconnectModal 
        open={showDisconnectModal} 
        onOpenChange={setShowDisconnectModal} 
        onConfirm={handleDisconnectConfirm}
        isLoading={disconnecting}
        error={disconnectError}
      />
    </div>
  );
};

export default ConnectedState;


