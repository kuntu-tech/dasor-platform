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

  const handleDisconnect = () => {
    setConnectedEmail("");
    setCurrentStep("selection");
    notifyStripeStatusChange();
  };

  // When returning from OAuth success, show the connected state once (priority check)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (loading) return;

    const shouldShowConnected = sessionStorage.getItem("payout_show_connected");
    if (shouldShowConnected) {
      sessionStorage.removeItem("payout_show_connected");
      setConnectedEmail(user?.email || "");
      setCurrentStep("connected");
      setCheckingConnection(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("stripe-connection-updated"));
      }
      return; // Skip the connection check if OAuth return is detected
    }
  }, [loading, user?.email]);

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


