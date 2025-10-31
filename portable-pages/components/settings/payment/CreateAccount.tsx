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
  const returnUrl = useMemo(() => `${window.location.origin}`, []);
  const refreshUrl = returnUrl;

  const handleOpenStripe = async () => {
    if (!loginEmail) {
      alert("Login required: missing email");
      return;
    }
    try {
      setLoading(true);
      const body = { returnUrl, refreshUrl, email: loginEmail, userId };
      const resp = await bindVendor(body as any);
      if (!resp.success) {
        alert(resp.error || "Bind failed");
        return;
      }
      const data = resp.data!;
      if (data.requiresOnboarding && data.onboarding?.url) {
        window.location.href = data.onboarding.url;
        return;
      }
      alert("No onboarding required. You may already be connected.");
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


