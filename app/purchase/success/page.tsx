"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Home, ArrowRight } from "lucide-react";

export default function PurchaseSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);

  useEffect(() => {
    // 从 URL 参数中获取 session_id 和 app_id
    const sessionIdParam = searchParams.get("session_id");
    const appIdParam = searchParams.get("app_id");

    setSessionId(sessionIdParam);
    setAppId(appIdParam);

    console.log("支付成功回调参数:", {
      sessionId: sessionIdParam,
      appId: appIdParam,
    });
  }, [searchParams]);

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-6">
            <div className="size-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="size-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold mb-2">
            支付成功！
          </CardTitle>
          <CardDescription className="text-lg">
            您的支付已完成
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {sessionId && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground mb-1">
                Session ID (CHECKOUT_SESSION_ID):
              </p>
              <p className="text-xs font-mono break-all text-foreground">
                {sessionId}
              </p>
            </div>
          )}

          {appId && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground mb-1">
                App ID:
              </p>
              <p className="text-xs font-mono break-all text-foreground">
                {appId}
              </p>
            </div>
          )}

          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-700 dark:text-green-400">
            💡 这是一个测试页面。在生产环境中，这个回调应该由另一个平台处理。
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handleGoHome} className="w-full" size="lg">
              <Home className="mr-2 size-5" />
              返回首页
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>感谢您的支付！</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

