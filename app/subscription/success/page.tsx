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
import { useAuth } from "@/components/AuthProvider";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshSubscriptionStatus } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Synchronize subscription status
  const handleSyncStatus = async (
    vendorId: string,
    sessionIdValue?: string | null
  ) => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(false);

    try {
      // Invoke API helper and pass sessionId when available
      const data = await syncSubscriptionStatus(
        Number(vendorId),
        sessionIdValue || undefined
      );

      if (data.success) {
        setSyncSuccess(true);
        console.log("Subscription status synced:", data);
        // Refresh subscription status cache
        if (user?.id) {
          try {
            await refreshSubscriptionStatus();
            console.log("Subscription status cache refreshed");
          } catch (error) {
            console.warn("Failed to refresh subscription status cache:", error);
          }
        }
        // After a successful sync, redirect to connect page after 2 seconds
        setTimeout(() => {
          router.push("/connect");
        }, 2000);
      } else {
        throw new Error(data.error || "Sync failed");
      }
    } catch (error) {
      console.log("Subscription sync error:", error);
      setSyncError(
        error instanceof Error
          ? error.message
          : "Failed to sync subscription status"
      );
      // Even if sync fails, allow the user to continue because the webhook may have succeeded
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Extract Stripe callback parameters from the URL
    const sessionIdParam = searchParams.get("session_id");
    const vendorIdParam = searchParams.get("vendorId");

    setSessionId(sessionIdParam);
    setVendorId(vendorIdParam);

    // Call sync endpoint to ensure data consistency, even if the webhook already processed it
    if (vendorIdParam) {
      handleSyncStatus(vendorIdParam, sessionIdParam);
    }
  }, [searchParams]);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleViewSubscription = () => {
    // Navigate to subscription management page
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
          <CardTitle className="text-3xl font-bold mb-2">
            Subscription Successful!
          </CardTitle>
          <CardDescription className="text-lg">
            Your subscription has been successfully activated
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Sync status indicator */}
          {isSyncing && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>Syncing subscription status...</span>
            </div>
          )}

          {syncSuccess && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-700 dark:text-green-400">
              ✓ Subscription status synced, data saved
            </div>
          )}

          {syncError && (
            <div className="rounded-md bg-orange-50 dark:bg-orange-900/20 p-3 text-sm text-orange-700 dark:text-orange-400">
              ⚠ {syncError} (Data may have been saved if Webhook has already
              processed it)
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
                Go to Connect
                <ArrowRight className="ml-2 size-4" />
              </Button>
            )}

            <Button
              onClick={handleViewSubscription}
              variant={syncSuccess ? "outline" : "default"}
              className="w-full"
              size="lg"
            >
              View Subscription Details
              <ArrowRight className="ml-2 size-4" />
            </Button>

            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Home className="mr-2 size-5" />
              Return to Home
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>
              Thank you for your subscription! You can now use all Pro features.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
