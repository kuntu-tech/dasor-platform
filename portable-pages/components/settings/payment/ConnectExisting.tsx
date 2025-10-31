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

  // OAuth 授权流程
  const handleOAuthConnect = async () => {
    if (!loginEmail) {
      alert("Login required: missing email");
      return;
    }
    try {
      setLoading(true);
      const resp = await startOAuth({
        email: loginEmail,
        userId: userId,
        redirectUri: redirectUri,
      });
      if (!resp.success) {
        alert(resp.error || "Failed to start OAuth");
        return;
      }
      // 跳转到 Stripe 授权页面
      window.location.href = resp.data!.authUrl;
    } catch (err) {
      console.error("OAuth start error:", err);
      alert("启动 OAuth 失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 黑色按钮：直接开户，无需输入，但始终传真实邮箱和users.id
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

  // 手动输入账户 ID 关联（使用 OAuth link API）
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
      console.error("Link account error:", err);
      alert("关联账户失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 灰色按钮：用已有Stripe Account ID绑定，始终传真实邮箱和users.id（使用 bind API）
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
      {/* 黑色按钮自动开户/引导注册 */}
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

        {/* 账号ID方式 */}
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
