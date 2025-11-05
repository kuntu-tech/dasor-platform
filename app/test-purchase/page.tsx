"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createAppPayment, CreateAppPaymentResponse } from "@/portable-pages/lib/connectApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ExternalLink, CheckCircle2, XCircle } from "lucide-react";

export default function TestPurchasePage() {
  const { user } = useAuth();
  const [app_userid, setApp_userid] = useState("");
  
  // 生成默认的回调地址（基于当前域名）
  const getDefaultSuccessUrl = () => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      return `${baseUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}&app_userid=${app_userid || "{APP_USERID}"}`;
    }
    return "";
  };

  const getDefaultCancelUrl = () => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      return `${baseUrl}/purchase/cancel?app_userid=${app_userid || "{APP_USERID}"}`;
    }
    return "";
  };

  const [successUrl, setSuccessUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return getDefaultSuccessUrl();
    }
    return "";
  });
  const [cancelUrl, setCancelUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return getDefaultCancelUrl();
    }
    return "";
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateAppPaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 当 app_userid 变化时，自动更新回调地址中的 app_userid 参数
  useEffect(() => {
    if (app_userid && typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      // 更新成功回调地址中的 app_userid
      const newSuccessUrl = `${baseUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}&app_userid=${app_userid}`;
      // 只有在当前地址是默认值或包含 {APP_USERID} 时才更新
      if (!successUrl || successUrl.includes("{APP_USERID}") || successUrl.includes("app_userid=")) {
        setSuccessUrl(newSuccessUrl);
      }
      
      // 更新取消回调地址中的 app_userid
      const newCancelUrl = `${baseUrl}/purchase/cancel?app_userid=${app_userid}`;
      if (!cancelUrl || cancelUrl.includes("{APP_USERID}") || cancelUrl.includes("app_userid=")) {
        setCancelUrl(newCancelUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app_userid]);

  const handleCreatePayment = async () => {
    if (!app_userid.trim()) {
      setError("请输入 App User ID");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 构建请求参数，包含可选的回调地址
      const requestBody: {
        app_userid: string;
        successUrl?: string;
        cancelUrl?: string;
      } = {
        app_userid: app_userid.trim(),
      };

      // 如果传入了回调地址，添加到请求中
      if (successUrl.trim()) {
        requestBody.successUrl = successUrl.trim();
      }
      if (cancelUrl.trim()) {
        requestBody.cancelUrl = cancelUrl.trim();
      }

      const response = await createAppPayment(requestBody);

      setResult(response);

      if (!response.success) {
        setError(response.error || "创建支付链接失败");
      }
    } catch (err) {
      console.error("创建支付链接错误:", err);
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  const handleJumpToPayment = () => {
    if (result?.data?.url) {
      window.open(result.data.url, "_blank");
    }
  };

  const handleClear = () => {
    setApp_userid("");
    setSuccessUrl("");
    setCancelUrl("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标题 */}
        <div>
          <h1 className="text-3xl font-bold mb-2">测试 App 支付功能</h1>
          <p className="text-muted-foreground">
            调用接口生成支付链接，测试购买流程
          </p>
        </div>

        {/* 输入表单 */}
        <Card>
          <CardHeader>
            <CardTitle>输入参数</CardTitle>
            <CardDescription>
              填写 App User ID（app_users.id），点击按钮生成支付链接
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app_userid">
                App User ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="app_userid"
                placeholder="例如: ee61a3d1-d16a-4d0b-a635-062f7e4750de"
                value={app_userid}
                onChange={(e) => setApp_userid(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                app_users 表的 id（对应 app_users.id），系统会通过此 ID 查询获取 app_id 和用户信息
              </p>
            </div>

            {/* 回调地址显示（自动填充，无需手动填写） */}
            {successUrl && cancelUrl && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <Label className="text-sm font-semibold">
                    回调地址（已自动生成，无需手动填写）
                  </Label>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      支付成功回调地址：
                    </p>
                    <div className="p-2 bg-background rounded border border-border text-xs font-mono break-all">
                      {successUrl}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      支付取消回调地址：
                    </p>
                    <div className="p-2 bg-background rounded border border-border text-xs font-mono break-all">
                      {cancelUrl}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 提示：回调地址已根据当前域名和 App ID 自动生成，可直接使用。如需自定义，可修改代码。
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleCreatePayment}
                disabled={loading || !app_userid.trim()}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成支付链接中...
                  </>
                ) : (
                  "生成支付链接"
                )}
              </Button>
              {result && (
                <Button onClick={handleClear} variant="outline">
                  清空结果
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 结果显示 */}
        {result && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>接口返回结果</CardTitle>
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "成功" : "失败"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 免费 App */}
              {result.success && result.data?.type === "free" && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>免费应用</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    {result.data.message || "这是免费应用，已自动激活"}
                  </AlertDescription>
                </Alert>
              )}

              {/* 付费 App */}
              {result.success && result.data?.type === "paid" && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <AlertTitle>付费应用</AlertTitle>
                    <AlertDescription className="text-blue-700 dark:text-blue-400">
                      已生成支付链接，请点击下方按钮跳转到 Stripe 支付页面
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {result.data.priceAmount && (
                        <div>
                          <span className="text-muted-foreground">价格: </span>
                          <span className="font-semibold">
                            ${result.data.priceAmount}
                          </span>
                        </div>
                      )}
                      {result.data.paymentModel && (
                        <div>
                          <span className="text-muted-foreground">支付模式: </span>
                          <span className="font-semibold">
                            {result.data.paymentModel === "subscription"
                              ? "订阅"
                              : "一次性"}
                          </span>
                        </div>
                      )}
                    </div>

                    {result.data.url && (
                      <Button
                        onClick={handleJumpToPayment}
                        className="w-full"
                        size="lg"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        跳转到 Stripe 支付页面
                      </Button>
                    )}

                    {result.data.sessionId && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                              当前 Session ID（这就是 CHECKOUT_SESSION_ID）
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                              这个 ID 会在支付完成后出现在回调 URL 的 session_id 参数中
                            </p>
                            <div className="p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">
                              <p className="text-xs text-muted-foreground mb-1">
                                Session ID:
                              </p>
                              <p className="text-xs font-mono break-all text-foreground font-semibold">
                                {result.data.sessionId}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 完整的 JSON 响应 */}
              <div className="space-y-2">
                <Label>完整响应数据:</Label>
                <pre className="p-4 bg-muted rounded-md overflow-auto text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. 输入 App User ID（必填）- 对应 app_users.id</p>
            <p>2. （可选）输入支付成功和取消的回调地址</p>
            <p>3. 点击"生成支付链接"按钮</p>
            <p>4. 如果是付费 App，会返回支付链接，点击按钮跳转到 Stripe 支付</p>
            <p>5. 如果是免费 App，会显示"免费应用，已自动激活"</p>
            <p className="mt-4 font-semibold text-foreground">关于参数说明：</p>
            <p>• <strong>app_userid</strong>：对应 app_users 表的 id 字段，系统会通过此 ID 查询获取 app_id 和用户信息</p>
            <p>• <strong>数据流程</strong>：接收 app_userid → 查询 app_users 表获取 app_id → 使用 app_id 查询 apps 表 → 继续支付流程</p>
            <p className="mt-4 font-semibold text-foreground">关于 CHECKOUT_SESSION_ID：</p>
            <p>• <strong>获取方式 1</strong>：生成支付链接后，在返回结果中查看 "Session ID"，这就是当前的 CHECKOUT_SESSION_ID</p>
            <p>• <strong>获取方式 2</strong>：支付完成后，从回调 URL 的 <code className="bg-muted px-1 rounded">session_id</code> 参数中获取</p>
            <p>• <strong>占位符说明</strong>：在回调地址中使用 <code className="bg-muted px-1 rounded">{`{CHECKOUT_SESSION_ID}`}</code>，Stripe 会自动替换为实际的 Session ID</p>
            <p className="mt-4 font-semibold text-foreground">回调地址说明：</p>
            <p>• 如果传入 successUrl，支付成功后会返回到指定的地址</p>
            <p>• 如果传入 cancelUrl，支付取消后会返回到指定的地址</p>
            <p>• 如果不传入回调地址，会使用默认地址（当前项目）</p>
            <p>• 在回调地址中可以使用 {`{CHECKOUT_SESSION_ID}`} 和 {`{APP_USERID}`} 占位符，会被自动替换</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

