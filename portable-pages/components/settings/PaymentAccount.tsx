import { useEffect, useState } from "react";
import PathSelection from "./payment/PathSelection";
import CreateAccount from "./payment/CreateAccount";
import ConnectExisting from "./payment/ConnectExisting";
import ConnectedState from "./payment/ConnectedState";
import { useAuth } from "../../../components/AuthProvider";

type PaymentStep = "selection" | "create" | "connect" | "connected";

const PaymentAccount = () => {
  const [currentStep, setCurrentStep] = useState<PaymentStep>("selection");
  const [connectedEmail, setConnectedEmail] = useState<string>("");
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

  return (
    <div>
      {currentStep !== "connected" ? (
        <>
          <h2 className="mb-2 text-3xl font-semibold">Payout Account</h2>
          <p className="mb-8 text-sm text-red-500">❗️Connect your Stripe account for receive payment from your users</p>
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


