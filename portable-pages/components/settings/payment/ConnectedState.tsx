import { ExternalLink } from "lucide-react";
import { Button } from "../../ui/button";
import { useState } from "react";
import DisconnectModal from "./DisconnectModal";

interface ConnectedStateProps {
  email: string;
  onDisconnect: () => void;
}

const ConnectedState = ({ email, onDisconnect }: ConnectedStateProps) => {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  return (
    <div>
      <h2 className="mb-2 text-3xl font-semibold">Payout Account</h2>
      <div className="max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-8">
          <h3 className="mb-6 text-lg font-semibold">Account Details</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">Stripe Account Email</p>
              <p className="font-medium">{email}</p>
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <Button variant="outline" className="gap-2" asChild>
              <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                View Dashboard on Stripe
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <Button variant="destructive" size="sm" className="text-white" onClick={() => setShowDisconnectModal(true)}>
            Disconnect Account
          </Button>
        </div>
      </div>
      <DisconnectModal open={showDisconnectModal} onOpenChange={setShowDisconnectModal} onConfirm={onDisconnect} />
    </div>
  );
};

export default ConnectedState;


