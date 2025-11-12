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
  
  // Generate default callback URLs based on the current origin
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

  // Update callback URLs whenever app_userid changes
  useEffect(() => {
    if (app_userid && typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      // Update the success callback with the new app_userid
      const newSuccessUrl = `${baseUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}&app_userid=${app_userid}`;
      // Only overwrite if the current URL is defaulted or contains {APP_USERID}
      if (!successUrl || successUrl.includes("{APP_USERID}") || successUrl.includes("app_userid=")) {
        setSuccessUrl(newSuccessUrl);
      }
      
      // Update the cancel callback with the new app_userid
      const newCancelUrl = `${baseUrl}/purchase/cancel?app_userid=${app_userid}`;
      if (!cancelUrl || cancelUrl.includes("{APP_USERID}") || cancelUrl.includes("app_userid=")) {
        setCancelUrl(newCancelUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app_userid]);

  const handleCreatePayment = async () => {
    if (!app_userid.trim()) {
      setError("Please enter App User ID");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Build the request payload including optional callback URLs
      const requestBody: {
        app_userid: string;
        successUrl?: string;
        cancelUrl?: string;
      } = {
        app_userid: app_userid.trim(),
      };

      // Include callback URLs when provided
      if (successUrl.trim()) {
        requestBody.successUrl = successUrl.trim();
      }
      if (cancelUrl.trim()) {
        requestBody.cancelUrl = cancelUrl.trim();
      }

      const response = await createAppPayment(requestBody);

      setResult(response);

      if (!response.success) {
        setError(response.error || "Failed to create payment link");
      }
    } catch (err) {
      console.log("Failed to create payment link:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
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
        {/* Heading */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Test App Payment Function</h1>
          <p className="text-muted-foreground">
            Call API to generate payment link and test purchase flow
          </p>
        </div>

        {/* Input form */}
        <Card>
          <CardHeader>
            <CardTitle>Input Parameters</CardTitle>
            <CardDescription>
              Enter App User ID (app_users.id) and click the button to generate payment link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app_userid">
                App User ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="app_userid"
                placeholder="e.g.: ee61a3d1-d16a-4d0b-a635-062f7e4750de"
                value={app_userid}
                onChange={(e) => setApp_userid(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                The id from app_users table (corresponds to app_users.id). The system will query app_id and user information using this ID.
              </p>
            </div>

            {/* Callback URLs auto-filled for convenience */}
            {successUrl && cancelUrl && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <Label className="text-sm font-semibold">
                    Callback URLs (Auto-generated, no need to fill manually)
                  </Label>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Payment Success Callback URL:
                    </p>
                    <div className="p-2 bg-background rounded border border-border text-xs font-mono break-all">
                      {successUrl}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Payment Cancel Callback URL:
                    </p>
                    <div className="p-2 bg-background rounded border border-border text-xs font-mono break-all">
                      {cancelUrl}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Tip: Callback URLs are automatically generated based on the current domain and App ID. You can use them directly. To customize, modify the code.
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
                    Generating payment link...
                  </>
                ) : (
                  "Generate Payment Link"
                )}
              </Button>
              {result && (
                <Button onClick={handleClear} variant="outline">
                  Clear Result
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Result section */}
        {result && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>API Response Result</CardTitle>
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "Success" : "Failed"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Free app */}
              {result.success && result.data?.type === "free" && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>Free App</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    {result.data.message || "This is a free app and has been automatically activated"}
                  </AlertDescription>
                </Alert>
              )}

              {/* Paid app */}
              {result.success && result.data?.type === "paid" && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <AlertTitle>Paid App</AlertTitle>
                    <AlertDescription className="text-blue-700 dark:text-blue-400">
                      Payment link has been generated. Please click the button below to go to Stripe payment page
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {result.data.priceAmount && (
                        <div>
                          <span className="text-muted-foreground">Price: </span>
                          <span className="font-semibold">
                            ${result.data.priceAmount}
                          </span>
                        </div>
                      )}
                      {result.data.paymentModel && (
                        <div>
                          <span className="text-muted-foreground">Payment Model: </span>
                          <span className="font-semibold">
                            {result.data.paymentModel === "subscription"
                              ? "Subscription"
                              : "One-time"}
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
                        Go to Stripe Payment Page
                      </Button>
                    )}

                    {result.data.sessionId && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                              Current Session ID (This is CHECKOUT_SESSION_ID)
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                              This ID will appear in the session_id parameter of the callback URL after payment is completed
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

              {/* Full JSON response */}
              <div className="space-y-2">
                <Label>Complete Response Data:</Label>
                <pre className="p-4 bg-muted rounded-md overflow-auto text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Usage notes */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Enter App User ID (required) - corresponds to app_users.id</p>
            <p>2. (Optional) Enter callback URLs for payment success and cancellation</p>
            <p>3. Click the "Generate Payment Link" button</p>
            <p>4. If it's a paid App, a payment link will be returned. Click the button to go to Stripe payment</p>
            <p>5. If it's a free App, it will show "Free app, automatically activated"</p>
            <p className="mt-4 font-semibold text-foreground">About Parameters:</p>
            <p>• <strong>app_userid</strong>: Corresponds to the id field in app_users table. The system will query app_id and user information using this ID</p>
            <p>• <strong>Data Flow</strong>: Receive app_userid → Query app_users table to get app_id → Use app_id to query apps table → Continue payment flow</p>
            <p className="mt-4 font-semibold text-foreground">About CHECKOUT_SESSION_ID:</p>
            <p>• <strong>Method 1</strong>: After generating payment link, check "Session ID" in the returned result. This is the current CHECKOUT_SESSION_ID</p>
            <p>• <strong>Method 2</strong>: After payment is completed, get it from the <code className="bg-muted px-1 rounded">session_id</code> parameter in the callback URL</p>
            <p>• <strong>Placeholder Note</strong>: Use <code className="bg-muted px-1 rounded">{`{CHECKOUT_SESSION_ID}`}</code> in callback URLs, and Stripe will automatically replace it with the actual Session ID</p>
            <p className="mt-4 font-semibold text-foreground">Callback URL Notes:</p>
            <p>• If successUrl is provided, it will redirect to the specified address after successful payment</p>
            <p>• If cancelUrl is provided, it will redirect to the specified address after payment cancellation</p>
            <p>• If no callback URLs are provided, default addresses (current project) will be used</p>
            <p>• You can use {`{CHECKOUT_SESSION_ID}`} and {`{APP_USERID}`} placeholders in callback URLs, which will be automatically replaced</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

