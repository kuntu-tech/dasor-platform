import { useMemo, useState } from "react";
import { ExternalLink, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { bindVendor } from "../../../lib/connectApi";

interface ConnectExistingProps {
  onBack: () => void;
  onConnect: (email: string) => void;
}

const ConnectExisting = ({ onBack, onConnect }: ConnectExistingProps) => {
  const [activeTab, setActiveTab] = useState<"recommended" | "advanced">("recommended");
  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [errors, setErrors] = useState<{ publishable?: string; secret?: string; accountId?: string }>({});
  const [loading, setLoading] = useState(false);
  const returnUrl = useMemo(() => `${window.location.origin}`, []);
  const refreshUrl = returnUrl;

  const handleOAuthConnect = async () => {
    if (!accountId.trim()) {
      setErrors((prev) => ({ ...prev, accountId: "Please enter your Stripe Account ID" }));
      return;
    }
    try {
      setLoading(true);
      const body = { stripeAccountId: accountId.trim(), returnUrl, refreshUrl };
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
      onConnect(accountId.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {activeTab === "recommended" && (
        <div className="max-w-2xl rounded-xl border border-border bg-card p-8">
          <Button onClick={handleOAuthConnect} className="w-full gap-2" size="lg" disabled={loading}>
            Connect with Stripe
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
            <Button onClick={handleOAuthConnect} className="w-full" size="lg" disabled={!accountId.trim() || loading}>
              Connect With Account ID
            </Button>
          </div>
        </div>
      )}

      {activeTab === "advanced" && (
        <div className="max-w-2xl">
          <div className="mb-6 flex gap-3 rounded-lg border border-warning/50 bg-warning/10 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
            <div className="text-sm">
              <p className="font-medium text-warning-foreground">Warning: This method is for advanced users</p>
              <p className="mt-1 text-warning-foreground/80">Keep your API keys secure. Never share your secret key.</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-8">
            <h3 className="mb-6 text-lg font-semibold">Connect with API Keys</h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="publishable">Publishable Key</Label>
                <Input
                  id="publishable"
                  value={publishableKey}
                  onChange={(e) => {
                    setPublishableKey(e.target.value);
                    setErrors((prev) => ({ ...prev, publishable: undefined }));
                  }}
                  placeholder="pk_test_..."
                  className={errors.publishable ? "border-destructive" : ""}
                />
                {errors.publishable && <p className="mt-1 text-sm text-destructive">{errors.publishable}</p>}
              </div>

              <div>
                <Label htmlFor="secret">Secret Key</Label>
                <div className="relative">
                  <Input
                    id="secret"
                    type={showSecret ? "text" : "password"}
                    value={secretKey}
                    onChange={(e) => {
                      setSecretKey(e.target.value);
                      setErrors((prev) => ({ ...prev, secret: undefined }));
                    }}
                    placeholder="sk_test_..."
                    className={`pr-10 ${errors.secret ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.secret && <p className="mt-1 text-sm text-destructive">{errors.secret}</p>}
              </div>

              <Button onClick={() => {}} className="w-full" size="lg">
                Save & Connect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectExisting;


