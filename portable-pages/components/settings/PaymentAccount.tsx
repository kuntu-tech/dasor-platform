import { useEffect, useState } from "react";
import PathSelection from "./payment/PathSelection";
import CreateAccount from "./payment/CreateAccount";
import ConnectExisting from "./payment/ConnectExisting";
import ConnectedState from "./payment/ConnectedState";
import { useAuth } from "../../../components/AuthProvider";
import { getVendorStatus } from "../../lib/connectApi";

type PaymentStep = "selection" | "create" | "connect" | "connected";

const PaymentAccount = () => {
  const [currentStep, setCurrentStep] = useState<PaymentStep>("selection");
  const [connectedEmail, setConnectedEmail] = useState<string>("");
  const [checkingConnection, setCheckingConnection] = useState(true);
  const { user, session, loading } = useAuth();

  useEffect(() => {
    console.log("[PaymentAccount] useAuth", { user, session, loading });
  }, [user, session, loading]);

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
    setCurrentStep(hasAccount ? "connect" : "create");
  };

  const handleBack = () => {
    setCurrentStep("selection");
  };

  const handleConnect = (email: string) => {
    setConnectedEmail(email);
    setCurrentStep("connected");
    notifyStripeStatusChange();
  };

  const handleDisconnect = async () => {
    // Reset UI state immediately
    setConnectedEmail("");
    setCurrentStep("selection");
    notifyStripeStatusChange();
    
    // Re-check connection status to ensure UI is in sync with backend
    if (user?.id) {
      try {
        const resp = await getVendorStatus(user.id);
        if (resp.success && resp.data && resp.data.stripe_account_id) {
          // If still connected (shouldn't happen, but handle edge case)
          setConnectedEmail(resp.data.email || user.email || "");
          setCurrentStep("connected");
        } else {
          // Confirmed disconnected - show selection page
          setCurrentStep("selection");
        }
      } catch (error) {
        console.log("Failed to re-check connection status after disconnect:", error);
        // On error, ensure we're on selection page
        setCurrentStep("selection");
      }
    }
  };

  // When returning from OAuth success, show the connected state once (priority check)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (loading) return;
    if (!user?.id) return;

    const shouldShowConnected = sessionStorage.getItem("payout_show_connected");
    if (shouldShowConnected) {
      // Remove the flag immediately to prevent other useEffects from running
      sessionStorage.removeItem("payout_show_connected");
      
      // Verify connection status from backend to ensure it's actually connected
      // Add retry mechanism to handle backend processing delay
      const verifyConnection = async (retryCount = 0) => {
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second

        try {
          const resp = await getVendorStatus(user.id);
          if (resp.success && resp.data && resp.data.stripe_account_id) {
            // Confirmed connected - show connected state
            setConnectedEmail(resp.data.email || user.email || "");
            setCurrentStep("connected");
            setCheckingConnection(false);
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("stripe-connection-updated"));
            }
          } else {
            // Not connected yet - might be a timing issue, retry if we haven't exceeded max retries
            if (retryCount < maxRetries) {
              console.log(`OAuth callback detected but account not yet connected, retrying (${retryCount + 1}/${maxRetries})...`);
              setTimeout(() => {
                verifyConnection(retryCount + 1);
              }, retryDelay);
            } else {
              // After max retries, show connected state anyway since OAuth callback succeeded
              console.log("OAuth callback succeeded but connection status not confirmed after retries, showing connected state");
              setConnectedEmail(user.email || "");
              setCurrentStep("connected");
              setCheckingConnection(false);
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("stripe-connection-updated"));
              }
            }
          }
        } catch (error) {
          console.log("Failed to verify connection after OAuth:", error);
          // On error, retry if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            setTimeout(() => {
              verifyConnection(retryCount + 1);
            }, retryDelay);
          } else {
            // After max retries, show connected state anyway since OAuth callback succeeded
            setConnectedEmail(user.email || "");
            setCurrentStep("connected");
            setCheckingConnection(false);
          }
        }
      };

      // Add a small delay before first check to allow backend to process
      setTimeout(() => {
        verifyConnection();
      }, 500);
    }
  }, [loading, user?.id, user?.email]);

  // Check if user already has a connected Stripe account when component mounts
  useEffect(() => {
    // Skip if OAuth return was detected (handled by the previous useEffect)
    if (typeof window !== "undefined" && sessionStorage.getItem("payout_show_connected")) {
      return;
    }

    const checkExistingConnection = async () => {
      if (loading || !user?.id) {
        setCheckingConnection(false);
        return;
      }

      try {
        const resp = await getVendorStatus(user.id);
        if (resp.success && resp.data && resp.data.stripe_account_id) {
          // User already has a connected Stripe account
          setConnectedEmail(resp.data.email || user.email || "");
          setCurrentStep("connected");
        } else {
          // User doesn't have a connected Stripe account
          setCurrentStep("selection");
        }
      } catch (error) {
        console.log("Failed to check Stripe connection status:", error);
        // On error, default to selection step
        setCurrentStep("selection");
      } finally {
        setCheckingConnection(false);
      }
    };

    checkExistingConnection();
  }, [user?.id, loading]);

  // Show loading state while checking connection status
  if (checkingConnection) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Payout Account</h1>
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
        <h1 className="text-2xl font-bold">Payout Account</h1>
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


