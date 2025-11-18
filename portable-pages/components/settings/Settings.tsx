import { useState } from "react";
import { User, CreditCard, Wallet } from "lucide-react";
import PaymentAccount from "./PaymentAccount";
import { Dialog, DialogContent } from "../../components/ui/dialog";
import UsageBillingDetails from "./usage/UsageBillingDetails";

type SettingsSection = "account" | "usage" | "payment";

interface SettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Settings = ({ open, onOpenChange }: SettingsProps) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>("payment");
  type UsageMode = "overview" | "edit" | "addPayment";
  const [usageMode, setUsageMode] = useState<UsageMode>("overview");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] p-0">
        <div className="flex h-full">
          <div className="w-64 border-r border-border bg-card p-6">
            <div className="mb-8">
              <h1 className="text-xl font-semibold">Settings</h1>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveSection("account")}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  activeSection === "account" ? "bg-muted font-medium" : "hover:bg-muted/50"
                }`}
              >
                <User className="h-4 w-4" />
                Account
              </button>
              <button
                onClick={() => setActiveSection("payment")}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  activeSection === "payment" ? "bg-muted font-medium" : "hover:bg-muted/50"
                }`}
              >
                <Wallet className="h-4 w-4" />
                Payout
              </button>
              <button
                onClick={() => setActiveSection("usage")}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  activeSection === "usage" ? "bg-muted font-medium" : "hover:bg-muted/50"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Billing
              </button>

           
            </nav>
          </div>

          <div className="flex-1 p-12 overflow-y-auto">
            {activeSection === "account" && (
              <div>
                <h2 className="mb-2 text-3xl font-semibold">Account</h2>
                <p className="text-muted-foreground">Manage your account settings and preferences</p>
              </div>
            )}

            {activeSection === "usage" && (
              <div>
                <h2 className="mb-2 text-3xl font-semibold">Billing</h2>
                {usageMode === "overview" && (
                  <p className="text-muted-foreground">View your usage statistics and manage billing</p>
                )}
                <UsageBillingDetails mode={usageMode} onModeChange={setUsageMode} />
              </div>
            )}

            {activeSection === "payment" && <PaymentAccount />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Settings;


