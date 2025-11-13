import { useMemo, useState } from "react";
import { ExternalLink, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { bindVendor, startOAuth, linkVendorAccount } from "../../../lib/connectApi";
import { useAuth } from "../../../../components/AuthProvider";

interface ConnectExistingProps {
  onBack: () => void;
  onConnect: (email: string) => void;
}

const ConnectExisting = ({ onBack, onConnect }: ConnectExistingProps) => {
  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [errors, setErrors] = useState<{ publishable?: string; secret?: string; accountId?: string }>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const loginEmail = user?.email || "";
  const userId = user?.id || "";
  const returnUrl = useMemo(() => `${window.location.origin}/oauth/callback`, []);
  const refreshUrl = returnUrl;
  const redirectUri = useMemo(() => `${window.location.origin}/oauth/callback`, []);

  // OAuth authorization flow
  const handleOAuthConnect = async () => {
    if (!loginEmail) {
      console.log(user,'user')
      alert("Login required: missing email");
      return;
    }
    try {
      setLoading(true);
      // Preserve current path so OAuth callback can redirect back
      if (typeof window !== "undefined") {
        sessionStorage.setItem("oauth_return_path", window.location.pathname);
      }
      const resp = await startOAuth({
        email: loginEmail,
        userId: userId,
        redirectUri: redirectUri,
      });
      if (!resp.success) {
        alert(resp.error || "Failed to start OAuth");
        return;
      }
      // Redirect to Stripe OAuth page
      window.location.href = resp.data!.authUrl;
    } catch (err) {
      console.log("OAuth start error:", err);
      alert("Failed to start OAuth. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Black button: auto onboarding, always sends real email and users.id
  const handleStartOnboarding = async () => {
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

  // Manually link by entering Account ID (uses OAuth link API)
  const handleAccountIdConnect = async () => {
    if (!accountId.trim()) {
      setErrors((prev) => ({ ...prev, accountId: "Please enter your Stripe Account ID" }));
      return;
    }
    try {
      setLoading(true);
      const resp = await linkVendorAccount({
        stripeAccountId: accountId.trim(),
        email: loginEmail,
        userId: userId,
      });
      if (!resp.success) {
        alert(resp.error || "Failed to link account");
        return;
      }
      onConnect(resp.data!.stripeAccountId);
    } catch (err) {
      console.log("Link account error:", err);
      alert("Failed to link account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Gray button: bind existing Stripe Account ID, still sends real email and users.id (bind API)
  const handleBindWithAccountId = async () => {
    if (!accountId.trim()) {
      setErrors((prev) => ({ ...prev, accountId: "Please enter your Stripe Account ID" }));
      return;
    }
    if (!loginEmail) {
      alert("Login required: missing email");
      return;
    }
    try {
      setLoading(true);
      const body = { stripeAccountId: accountId.trim(), returnUrl, refreshUrl, email: loginEmail, userId };
      const resp = await bindVendor(body as any);
      if (!resp.success) {
        alert(resp.error || "Bind failed");
        return;
      }
      onConnect(accountId.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Black button for automatic onboarding / registration */}
      <div className="max-w-2xl rounded-xl border border-border bg-card p-8">
        <Button onClick={handleOAuthConnect} className="w-full gap-2 bg-black text-white" size="lg" disabled={loading}>
          Connect with Stripe (OAuth)
          <ExternalLink className="h-4 w-4" />
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Account ID entry option */}
        <div className="space-y-3">
          <Input
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              setErrors((prev) => ({ ...prev, accountId: undefined }));
            }}
            placeholder="Please enter your Stripe Account ID"
            className={errors.accountId ? "border-destructive" : ""}
          />
          {errors.accountId && <p className="text-sm text-destructive">{errors.accountId}</p>}
          <Button onClick={handleAccountIdConnect} className="w-full bg-gray-500 text-white" size="lg" disabled={!accountId.trim() || loading}>
            Connect With Account ID
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConnectExisting;
