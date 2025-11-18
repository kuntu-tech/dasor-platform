import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../ui/button";
import { bindVendor } from "../../../lib/connectApi";
import { useAuth } from "../../../../components/AuthProvider";

interface CreateAccountProps {
  onBack: () => void;
  onConnect: (email: string) => void;
}

const CreateAccount = ({ onBack, onConnect }: CreateAccountProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const loginEmail = user?.email || "";
  const userId = user?.id || "";
  const returnUrl = useMemo(() => `${window.location.origin}/oauth/callback`, []);
  const refreshUrl = returnUrl;

  const handleOpenStripe = async () => {
    if (!loginEmail) {
      alert("Login required: missing email");
      return;
    }
    try {
      setLoading(true);
      const resp = await bindVendor({
        email: loginEmail,
        userId: userId,
        returnUrl: returnUrl,
        refreshUrl: refreshUrl,
      });
      if (!resp.success) {
        alert(resp.error || "Failed to create account");
        return;
      }
      const data = resp.data!;
      
      // Show note if this is a new account created after disconnection
      if (data.note?.previouslyDisconnected && data.note.message) {
        alert(data.note.message);
      }
      
      if (data.requiresOnboarding && data.onboarding?.url) {
        window.open(data.onboarding.url, '_blank');
        return;
      }
      onConnect(loginEmail);
    } catch (err) {
      console.log("Bind vendor error:", err);
      alert("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleted = () => {
    onConnect("demo@example.com");
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="max-w-2xl rounded-xl border border-border bg-card p-8">
        <div className="space-y-3">
          <Button onClick={handleOpenStripe} variant="outline" className="w-full" size="lg" disabled={loading}>
            Open Stripe Registration
          </Button>
          <Button onClick={handleCompleted} className="w-full" size="lg" disabled={loading}>
            Registration Completed
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
