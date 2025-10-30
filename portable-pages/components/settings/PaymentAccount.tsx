import { useState } from "react";
import PathSelection from "./payment/PathSelection";
import CreateAccount from "./payment/CreateAccount";
import ConnectExisting from "./payment/ConnectExisting";
import ConnectedState from "./payment/ConnectedState";

type PaymentStep = "selection" | "create" | "connect" | "connected";

const PaymentAccount = () => {
  const [currentStep, setCurrentStep] = useState<PaymentStep>("selection");
  const [connectedEmail, setConnectedEmail] = useState<string>("");

  const handleSelection = (hasAccount: boolean) => {
    setCurrentStep(hasAccount ? "connect" : "create");
  };

  const handleBack = () => {
    setCurrentStep("selection");
  };

  const handleConnect = (email: string) => {
    setConnectedEmail(email);
    setCurrentStep("connected");
  };

  const handleDisconnect = () => {
    setConnectedEmail("");
    setCurrentStep("selection");
  };

  return (
    <div>
      {currentStep !== "connected" ? (
        <>
          <h2 className="mb-8 text-3xl font-semibold">Set Up Your Payout Account</h2>
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


