import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { useState, useEffect } from "react";
import DisconnectModal from "./DisconnectModal";
import { getVendorStatus, disconnectAccount, getLoginLink } from "../../../lib/connectApi";
import { useAuth } from "../../../../components/AuthProvider";

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
  const { user } = useAuth();

  useEffect(() => {
    const fetchVendor = async () => {
      if (user?.id) {
        try {
          const resp = await getVendorStatus(user.id);
          if (resp.success && resp.data) {
            setVendorData({ 
              id: resp.data.id,
              email: resp.data.email, 
              stripe_account_id: resp.data.stripe_account_id,
              livemode: resp.data.livemode ?? null
            });
          }
        } catch (err) {
          console.log("Failed to fetch vendor:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchVendor();
  }, [user]);

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
            // Redirect to onboarding page to complete account setup
            window.location.href = result.data.onboardingUrl;
            return;
          }
          
          // If no onboarding URL, show message to user
          if (message) {
            setDashboardError(message);
            console.warn("Account requires onboarding:", message);
            alert(message);
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
          console.error("Failed to get dashboard link:", result.error);
        }
      }
    } catch (err) {
      console.error("Error fetching dashboard link:", err);
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
          alert(result.data.warning.message);
        }

        // Show success message
        alert("Account disconnected successfully");

        // Clear local vendor data
        setVendorData(null);
        
        // Close modal and call parent callback to update UI
        setShowDisconnectModal(false);
        onDisconnect();
      } else {
        // Handle error
        const errorMessage = result.error || "Failed to disconnect account";
        setDisconnectError(errorMessage);
        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to disconnect account";
      setDisconnectError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div>
      <div className="max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-8">
          <h3 className="mb-6 text-lg font-semibold">Account Details</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">Stripe Account Email</p>
              <p className="font-medium">{loading ? "Loading..." : displayEmail}</p>
            </div>
            {displayStripeAccountId && (
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">Stripe Account ID</p>
                <p className="font-medium">{loading ? "Loading..." : displayStripeAccountId}</p>
              </div>
            )}
          </div>
          <div className="mt-8 flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="gap-2 w-fit" 
              onClick={handleViewDashboard}
              disabled={dashboardLoading || loading || !vendorData?.id}
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
            disabled={disconnecting || loading}
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


