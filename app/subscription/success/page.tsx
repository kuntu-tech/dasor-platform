"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Home, Loader2 } from "lucide-react";
import { syncSubscriptionStatus } from "@/portable-pages/lib/connectApi";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // 同步订阅状态
  const handleSyncStatus = async (
    vendorId: string,
    sessionIdValue?: string | null
  ) => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(false);

    try {
      // 调用 API 库函数，传递 sessionId（如果有）
      const data = await syncSubscriptionStatus(
        Number(vendorId),
        sessionIdValue || undefined
      );

      if (data.success) {
        setSyncSuccess(true);
        console.log("订阅状态同步成功:", data);
        // 同步成功后，延迟 2 秒自动跳转到 connect 页面
        setTimeout(() => {
          router.push("/connect");
        }, 2000);
      } else {
        throw new Error(data.error || "同步失败");
      }
    } catch (error) {
      console.error("同步订阅状态错误:", error);
      setSyncError(error instanceof Error ? error.message : "同步订阅状态失败");
      // 即使同步失败，也不阻止用户继续，因为 Webhook 可能已经处理
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // 从 URL 参数中获取 Stripe 返回的信息
    const sessionIdParam = searchParams.get("session_id");
    const vendorIdParam = searchParams.get("vendorId");

    setSessionId(sessionIdParam);
    setVendorId(vendorIdParam);

    // 调用同步接口确保数据完整（即使 Webhook 已经处理，这里也会确保数据同步）
    if (vendorIdParam) {
      handleSyncStatus(vendorIdParam, sessionIdParam);
    }
  }, [searchParams]);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleViewSubscription = () => {
    // 跳转到订阅管理页面
    router.push("/settings?tab=billing");
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
          <CardTitle className="text-3xl font-bold mb-2">订阅成功！</CardTitle>
          <CardDescription className="text-lg">
            您的订阅已成功激活
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 同步状态提示 */}
          {isSyncing && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>正在同步订阅状态...</span>
            </div>
          )}

          {syncSuccess && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-700 dark:text-green-400">
              ✓ 订阅状态已同步，数据已保存
            </div>
          )}

          {syncError && (
            <div className="rounded-md bg-orange-50 dark:bg-orange-900/20 p-3 text-sm text-orange-700 dark:text-orange-400">
              ⚠ {syncError}（如果 Webhook 已处理，数据可能已保存）
            </div>
          )}

          {sessionId && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Session ID: {sessionId.substring(0, 20)}...</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {syncSuccess && (
              <Button
                onClick={() => router.push("/connect")}
                className="w-full"
                size="lg"
              >
                开始创建应用
                <ArrowRight className="ml-2 size-4" />
              </Button>
            )}

            <Button
              onClick={handleViewSubscription}
              variant={syncSuccess ? "outline" : "default"}
              className="w-full"
              size="lg"
            >
              查看订阅详情
              <ArrowRight className="ml-2 size-4" />
            </Button>

            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Home className="mr-2 size-5" />
              返回首页
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>感谢您的订阅！您可以使用所有 Pro 功能。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
