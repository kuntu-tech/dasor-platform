"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, Home, ArrowLeft } from "lucide-react";

export default function PurchaseCancelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [appId, setAppId] = useState<string | null>(null);

  useEffect(() => {
    // 从 URL 参数中获取 app_id
    const appIdParam = searchParams.get("app_id");

    setAppId(appIdParam);

    console.log("支付取消回调参数:", {
      appId: appIdParam,
    });
  }, [searchParams]);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-6">
            <div className="size-20 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <XCircle className="size-10 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold mb-2">
            Payment Cancelled
          </CardTitle>
          <CardDescription className="text-lg">
            You have cancelled this payment
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
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

          <div className="rounded-md bg-orange-50 dark:bg-orange-900/20 p-3 text-sm text-orange-700 dark:text-orange-400">
            💡 This is a test page. In production, this callback should be handled by another platform.
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handleGoBack} variant="outline" className="w-full" size="lg">
              <ArrowLeft className="mr-2 size-5" />
              Go Back
            </Button>
            <Button onClick={handleGoHome} className="w-full" size="lg">
              <Home className="mr-2 size-5" />
              Return to Home
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>You can try to pay again at any time.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

