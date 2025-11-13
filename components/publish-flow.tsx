"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, Copy, Check, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/AuthProvider";
import { triggerConfettiFireworks } from "@/components/ui/confetti-fireworks";
import {
  getVendorStatus,
  type VendorStatusResponse,
} from "@/portable-pages/lib/connectApi";

interface MonetizationEligibility {
  canUseFree: boolean;
  freeReason: string | null;
  canUseSubscription: boolean;
  subscriptionReason: string | null;
}

function parseSubscriptionPeriodEnd(raw?: string | null): Date | null {
  if (!raw) return null;
  try {
    const normalized = raw.trim().replace(" ", "T");
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
    const fallback = new Date(`${normalized}Z`);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  } catch (error) {
    console.log("Failed to parse subscription_period_end", raw, error);
    return null;
  }
}

function deriveMonetizationEligibility(
  vendor: VendorStatusResponse["data"] | null,
  vendorStatusError: string | null
): MonetizationEligibility {
  const now = Date.now();
  let freeReason: string | null = null;

  const subscriptionPeriodEnd = parseSubscriptionPeriodEnd(
    vendor?.subscription_period_end ?? null
  );

  const hasSubscriptionRecord = Boolean(vendor?.subscription_id);
  const subscriptionStatus = vendor?.subscription_status ?? null;
  const subscriptionValid =
    hasSubscriptionRecord &&
    subscriptionStatus === "active" &&
    subscriptionPeriodEnd !== null &&
    subscriptionPeriodEnd.getTime() > now;

  if (!subscriptionValid) {
    if (!hasSubscriptionRecord) {
      freeReason =
        "You need an active Dasor subscription before publishing. Please subscribe and try again.";
    } else if (subscriptionStatus !== "active") {
      freeReason =
        "Your Dasor subscription is not active. Please renew it before publishing.";
    } else if (!subscriptionPeriodEnd) {
      freeReason =
        "We couldn't verify your subscription renewal date. Please contact support.";
    } else if (subscriptionPeriodEnd.getTime() <= now) {
      freeReason =
        "Your Dasor subscription has expired. Please renew it before publishing.";
    }
  }

  if (!freeReason && vendorStatusError) {
    freeReason =
      vendorStatusError === "No vendor found for this user"
        ? "You need an active Dasor subscription before publishing. Please subscribe and try again."
        : "We couldn't verify your vendor status. Please refresh or contact support.";
  }

  const canUseFree = subscriptionValid;

  let subscriptionReason: string | null = freeReason;
  let canUseSubscription = canUseFree;

  if (canUseSubscription) {
    if (vendor?.stripe_account_status !== "active") {
      subscriptionReason =
        "Complete your Stripe payout account to enable subscription pricing.";
      canUseSubscription = false;
    } else if (vendor?.is_active !== true) {
      subscriptionReason =
        "Your Stripe payout account is not ready to receive payments. Please finish onboarding.";
      canUseSubscription = false;
    } else if (vendor?.charges_enabled === false) {
      subscriptionReason =
        "Stripe has not enabled charges for your payout account. Please review your Stripe dashboard.";
      canUseSubscription = false;
    } else if (vendor?.payouts_enabled === false) {
      subscriptionReason =
        "Stripe payouts are not enabled for your account. Please review your Stripe dashboard.";
      canUseSubscription = false;
    }
  }

  return {
    canUseFree,
    freeReason,
    canUseSubscription,
    subscriptionReason,
  };
}
export function PublishFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appId = searchParams.get("id");
  const { session, user } = useAuth();
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [monetization, setMonetization] = useState("free");
  const [paymentPrice, setPaymentPrice] = useState<string>("0");
  const [isPublished, setIsPublished] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);
  const [currentAppUrl, setCurrentAppUrl] = useState("");
  const [appDataFromDb, setAppDataFromDb] = useState<any | null>(null);
  const [metadataFromService, setMetadataFromService] = useState<any | null>(
    null
  );
  const [metadataApplied, setMetadataApplied] = useState(false);
  const [vendorStatus, setVendorStatus] = useState<
    VendorStatusResponse["data"] | null
  >(null);
  const [vendorStatusError, setVendorStatusError] = useState<string | null>(
    null
  );
  const [vendorStatusLoading, setVendorStatusLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<{
    item: string;
    status: "success" | "error";
  } | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedProblems = localStorage.getItem("selectedProblems");
    if (storedProblems) {
      try {
        const problems = JSON.parse(storedProblems);
        setFeatureCount(problems.length || 0);
      } catch (e) {
        console.log("Failed to parse selectedProblems", e);
      }
    }
  }, []);

  const fetchAppFromDatabase = useCallback(async () => {
    if (!appId) return;
    try {
      const response = await fetch(`/api/apps/${appId}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || `HTTP ${response.status}`);
      }
      return payload?.data || null;
    } catch (err) {
      console.warn("Failed to load app data from database:", err);
      return null;
    }
  }, [appId]);

  const applyMetadataDefaults = useCallback(
    (appData: any) => {
      if (!appData || metadataApplied) return;

      // Extract data from app_meta_info stored in the database
      const appMetaInfo = appData?.app_meta_info;
      if (appMetaInfo && typeof appMetaInfo === "object") {
        const chatMeta =
          appMetaInfo?.chatAppMeta ||
          appMetaInfo?.chatappmeta ||
          appMetaInfo?.chat_app_meta ||
          null;

        if (chatMeta) {
          if (typeof chatMeta.name === "string" && chatMeta.name.trim()) {
            setAppName(chatMeta.name.trim());
          }
          if (
            typeof chatMeta.description === "string" &&
            chatMeta.description.trim()
          ) {
            setDescription(chatMeta.description.trim());
          }
          if (typeof chatMeta.domain === "string" && chatMeta.domain.trim()) {
            setCurrentAppUrl(chatMeta.domain.trim());
          } else {
            setCurrentAppUrl(appData?.mcp_server_ids || "");
          }
        }
      }

      // Fallback to database name and description when app_meta_info is missing
      setAppName((prev) => {
        if (prev) return prev;
        if (typeof appData?.name === "string" && appData.name.trim()) {
          return appData.name.trim();
        }
        return prev;
      });
      setDescription((prev) => {
        if (prev) return prev;
        if (
          typeof appData?.description === "string" &&
          appData.description.trim()
        ) {
          return appData.description.trim();
        }
        return prev;
      });

      setMetadataApplied(true);
    },
    [metadataApplied]
  );

  useEffect(() => {
    if (!appId) return;
    const controller = new AbortController();
    fetchAppFromDatabase()
      .then((appData) => {
        if (appData) {
          setAppDataFromDb(appData);
          applyMetadataDefaults(appData);
          // If app is already published, automatically show success page
          if (appData.status === "published") {
            setIsPublished(true);
          }
        }
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        console.warn("Failed to load app data:", err);
      });

    return () => controller.abort();
  }, [appId, fetchAppFromDatabase, applyMetadataDefaults]);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    const loadVendorStatus = async () => {
      setVendorStatusLoading(true);
      try {
        const response = await getVendorStatus(user.id);
        if (cancelled) return;
        if (response.success && response.data) {
          setVendorStatus(response.data);
          setVendorStatusError(null);
        } else {
          setVendorStatus(null);
          setVendorStatusError(response.error ?? null);
        }
      } catch (error) {
        console.log("Failed to fetch vendor status:", error);
        if (!cancelled) {
          setVendorStatus(null);
          setVendorStatusError("Failed to load vendor status");
        }
      } finally {
        if (!cancelled) {
          setVendorStatusLoading(false);
        }
      }
    };

    loadVendorStatus();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const monetizationEligibility = useMemo(
    () => deriveMonetizationEligibility(vendorStatus, vendorStatusError),
    [vendorStatus, vendorStatusError]
  );

  useEffect(() => {
    if (
      monetization === "subscription" &&
      !monetizationEligibility.canUseSubscription
    ) {
      setMonetization("free");
    }
  }, [monetization, monetizationEligibility.canUseSubscription]);

  const canPublish = useMemo(() => {
    if (monetization === "subscription") {
      return monetizationEligibility.canUseSubscription;
    }
    return monetizationEligibility.canUseFree;
  }, [monetization, monetizationEligibility]);

  const showCopyFeedback = useCallback(
    (itemType: string, status: "success" | "error") => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      setCopyFeedback({ item: itemType, status });
      feedbackTimeoutRef.current = setTimeout(() => {
        setCopyFeedback(null);
        feedbackTimeoutRef.current = null;
      }, 2000);
    },
    []
  );

  const fallbackCopyText = (text: string) => {
    if (typeof document === "undefined") {
      throw new Error("Document not available for fallback copy");
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const succeeded = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!succeeded) {
      throw new Error("Fallback copy command failed");
    }
  };

  const handleCopy = useCallback(
    async (text: string, itemType: string) => {
      const safeText = text ?? "";
      const attemptClipboardCopy = async () => {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(safeText);
          return true;
        }
        return false;
      };

      try {
        const clipboardWorked = await attemptClipboardCopy();
        if (!clipboardWorked) {
          fallbackCopyText(safeText);
        }
        showCopyFeedback(itemType, "success");
      } catch (err) {
        console.log("Failed to copy text:", err);
        try {
          fallbackCopyText(safeText);
          showCopyFeedback(itemType, "success");
        } catch (fallbackErr) {
          console.log("Fallback copy failed:", fallbackErr);
          showCopyFeedback(itemType, "error");
        }
      }
    },
    [showCopyFeedback]
  );

  const openPayoutSettingsModal = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("openSettings", "payout");
    const queryString = params.toString();
    router.push(`?${queryString}`, { scroll: false });
  }, [router, searchParams]);

  const handlePublish = async () => {
    if (!canPublish || vendorStatusLoading) {
      return;
    }
    try {
      // app_meta_info retrieved from the database; default to empty object when absent
      let appMetaInfo: any = {};
      if (
        appDataFromDb?.app_meta_info &&
        typeof appDataFromDb.app_meta_info === "object"
      ) {
        appMetaInfo = { ...appDataFromDb.app_meta_info };
      }

      // Update chatMeta name and description fields
      const chatMeta =
        appMetaInfo.chatAppMeta ||
        appMetaInfo.chatappmeta ||
        appMetaInfo.chat_app_meta ||
        {};
      chatMeta.name = appName.trim();
      chatMeta.description = description.trim();
      appMetaInfo.chatAppMeta = chatMeta;

      const response = await fetch(`/api/apps/${appId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          name: appName.trim(),
          description: description.trim(),
          payment_model: JSON.stringify({
            model: monetization,
            price: Number(paymentPrice) || 0,
          }),
          status: "published",
          app_version: "1.0.0",
          build_status: "success",
          deployment_status: "success",
          published_at: new Date().toISOString(),
          // Omit connection_id so the backend selects the most recent active connection
          app_meta_info: appMetaInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Surface duplicate-name errors with specific messaging
          alert(
            data.error || "App name already exists. Please use a different name"
          );
          return;
        }
        throw new Error(data.error || "Save failed");
      }

      console.log("Application saved successfully:", data);
      setIsPublished(true);
    } catch (error) {
      console.log("Application save failed:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to publish the app. Please try again.";
      alert(message);
    }
  };

  useEffect(() => {
    if (!isPublished) return;

    // Delay briefly to ensure page is fully rendered before triggering fireworks
    let cleanup: (() => void) | undefined;
    const timer = setTimeout(() => {
      cleanup = triggerConfettiFireworks({
        duration: 1000,
        intervalDelay: 200,
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      if (cleanup) {
        cleanup();
      }
    };
  }, [isPublished]);

  const handleContinueToGenerate = async () => {
    if (!appId || !user?.id) {
      console.log("Missing appId or user id");
      return;
    }

    try {
      // Fetch app data
      const response = await fetch(`/api/apps/${appId}`, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.data) {
        throw new Error(payload?.error || "Failed to fetch app data");
      }

      const app = payload.data;
      const connectionId = app.connection_id;

      // if (!connectionId) {
      //   console.log("App does not have connection_id");
      //   alert(
      //     "App does not have a connection. Please connect a database first."
      //   );
      //   return;
      // }

      // Retrieve task_id from generator_meta or app_meta_info
      let taskId = "";

      // Attempt to read from app_meta_info
      if (app.app_meta_info && typeof app.app_meta_info === "object") {
        taskId = app.app_meta_info.task_id;
        // if (runResult && runResult.task_id) {
        //   taskId = runResult.task_id;
        // }
      }

      // If no task_id exists on the app, try reading from localStorage
      // if (!taskId) {
      //   const runResultStr = localStorage.getItem("run_result");
      //   if (runResultStr) {
      //     try {
      //       const runResult = JSON.parse(runResultStr);
      //       taskId = runResult.task_id || "";
      //     } catch (e) {
      //       console.log("Failed to parse run_result from localStorage:", e);
      //     }
      //   }
      // }

      if (!taskId) {
        alert(
          "Cannot find task_id. Please ensure the app has been generated from a valid connection."
        );
        return;
      }

      // Fetch run_result data by task_id, run_id=r_1, and user_id
      let runId = "r_1";
      let runResult = null;

      // First try run_id=r_1
      console.log(
        `Attempting to fetch run_result for run_id=${runId}, task_id=${taskId}, user_id=${user.id}`
      );
      let runResultResponse = await fetch(
        `/api/run-result/${runId}?user_id=${user.id}&task_id=${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (runResultResponse.ok) {
        const runResultData = await runResultResponse.json();
        console.log("API response for r_1:", runResultData);

        // API returns data as { success: true, data: run_result }
        if (runResultData.data && runResultData.data !== null) {
          runResult = runResultData.data;
        }
      }

      // If r_1 is missing, fallback to the latest run_id
      if (!runResult) {
        console.log(
          `run_id=r_1 not found, attempting to fetch latest run_result for task_id=${taskId}`
        );
        const runResultsResponse = await fetch(
          `/api/run-results?user_id=${user.id}&task_id=${taskId}`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          }
        );

        if (runResultsResponse.ok) {
          const runResultsData = await runResultsResponse.json();
          console.log("Available run_ids:", runResultsData);

          if (runResultsData.data && runResultsData.data.length > 0) {
            // Retrieve the latest run_id (sorted by creation time, first is newest)
            const latestRunId = runResultsData.data[0].run_id;
            console.log(`Using latest run_id: ${latestRunId} instead of r_1`);

            // Use the latest run_id to query data
            runResultResponse = await fetch(
              `/api/run-result/${latestRunId}?user_id=${user.id}&task_id=${taskId}`,
              {
                headers: {
                  Authorization: `Bearer ${session?.access_token}`,
                },
              }
            );

            if (runResultResponse.ok) {
              const runResultData = await runResultResponse.json();
              if (runResultData.data && runResultData.data !== null) {
                runResult = runResultData.data;
              }
            }
          }
        }
      }

      // If still empty, raise an error
      // if (!runResult) {
      //   console.log(
      //     `No run_result found for task_id=${taskId}, user_id=${user.id}`
      //   );
      //   throw new Error(
      //     `No run_result data found for this app. Please ensure the app was generated from a valid connection and has analysis results.`
      //   );
      // }

      // Persist to localStorage
      localStorage.setItem("run_result", JSON.stringify(runResult));

      // Extract segments data
      if (runResult.segments) {
        localStorage.setItem("marketsData", JSON.stringify(runResult.segments));
      }

      // Save standalJson when available (it usually comes from elsewhere, not run_result)
      // Try to read standalJson from localStorage when present
      const existingStandalJson = localStorage.getItem("standalJson");
      if (!existingStandalJson && runResult.standalJson) {
        localStorage.setItem(
          "standalJson",
          JSON.stringify(runResult.standalJson)
        );
      }

      // Persist connection data when required
      const dbConnectionDataStr = localStorage.getItem("dbConnectionData");
      if (!dbConnectionDataStr) {
        // If missing, attempt to load using the app's connection_id
        // Store connectionId for future usage
        const dbConnectionData = {
          connectionId: connectionId,
        };
        localStorage.setItem(
          "dbConnectionData",
          JSON.stringify(dbConnectionData)
        );
      }

      // Flag ConnectFlow to jump directly to the results step
      localStorage.setItem("skipToBusinessInsight", "true");

      // Navigate to the connect page
      router.push("/connect");
    } catch (error) {
      console.log("Failed to continue to generate:", error);
      alert("Failed to load data. Please try again.");
    }
  };

  if (isPublished) {
    return (
      <div className="min-h-screen bg-background">
        {/* Top navigation removed for a cleaner publish success view */}

        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="size-8 text-green-600" />
              </div>
              <CardTitle className="mb-2 text-2xl">
                APP Created Successfully!
              </CardTitle>

              {/* App Details Section */}
              <div className="w-full max-w-lg space-y-4 mb-8">
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600">
                    You can now copy and paste these details into ChatGPT to
                    create your application
                  </p>
                </div>

                {/* URL */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    URL
                  </Label>
                  <div className="flex items-start gap-2">
                    <Input
                      value={currentAppUrl}
                      readOnly
                      className="flex-1 bg-gray-50"
                    />
                    <div className="flex flex-col items-center gap-1 min-w-[44px]">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(currentAppUrl ?? "", "url")}
                        className="flex items-center gap-1"
                      >
                        {copyFeedback?.item === "url" ? (
                          copyFeedback.status === "success" ? (
                            <Check className="size-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="size-4 text-destructive" />
                          )
                        ) : (
                          <Copy className="size-4" />
                        )}
                        <span className="sr-only">Copy URL</span>
                      </Button>
                      <span
                        aria-live="polite"
                        className={`text-xs font-medium transition-opacity duration-150 h-4 flex items-center ${
                          copyFeedback?.item === "url"
                            ? copyFeedback.status === "success"
                              ? "text-emerald-600 opacity-100"
                              : "text-destructive opacity-100"
                            : "opacity-0 text-transparent"
                        }`}
                      >
                        {copyFeedback?.item === "url"
                          ? copyFeedback.status === "success"
                            ? "Copied!"
                            : "Copy failed"
                          : "\u00A0"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Name
                  </Label>
                  <div className="flex items-start gap-2">
                    <Input
                      value={appName}
                      readOnly
                      className="flex-1 bg-gray-50"
                    />
                    <div className="flex flex-col items-center gap-1 min-w-[44px]">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(appName ?? "", "name")}
                        className="flex items-center gap-1"
                      >
                        {copyFeedback?.item === "name" ? (
                          copyFeedback.status === "success" ? (
                            <Check className="size-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="size-4 text-destructive" />
                          )
                        ) : (
                          <Copy className="size-4" />
                        )}
                        <span className="sr-only">Copy app name</span>
                      </Button>
                      <span
                        aria-live="polite"
                        className={`text-xs font-medium transition-opacity duration-150 h-4 flex items-center ${
                          copyFeedback?.item === "name"
                            ? copyFeedback.status === "success"
                              ? "text-emerald-600 opacity-100"
                              : "text-destructive opacity-100"
                            : "opacity-0 text-transparent"
                        }`}
                      >
                        {copyFeedback?.item === "name"
                          ? copyFeedback.status === "success"
                            ? "Copied!"
                            : "Copy failed"
                          : "\u00A0"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <div className="flex items-start gap-2">
                    <Textarea
                      value={description}
                      readOnly
                      className="flex-1 bg-gray-50 min-h-[60px]"
                    />
                    <div className="flex flex-col items-center gap-1 min-w-[44px]">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleCopy(description ?? "", "description")
                        }
                        className="flex items-center gap-1"
                      >
                        {copyFeedback?.item === "description" ? (
                          copyFeedback.status === "success" ? (
                            <Check className="size-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="size-4 text-destructive" />
                          )
                        ) : (
                          <Copy className="size-4" />
                        )}
                        <span className="sr-only">Copy description</span>
                      </Button>
                      <span
                        aria-live="polite"
                        className={`text-xs font-medium transition-opacity duration-150 h-4 flex items-center text-center ${
                          copyFeedback?.item === "description"
                            ? copyFeedback.status === "success"
                              ? "text-emerald-600 opacity-100"
                              : "text-destructive opacity-100"
                            : "opacity-0 text-transparent"
                        }`}
                      >
                        {copyFeedback?.item === "description"
                          ? copyFeedback.status === "success"
                            ? "Copied!"
                            : "Copy failed"
                          : "\u00A0"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleContinueToGenerate}>
                  Continue To Generate
                </Button>
                <Button>
                  <Link href="https://chatgpt.com/#settings/Connectors">
                    Go to ChatGPT
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation removed on publish page */}

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Publish</h1>
          <p className="text-muted-foreground">
            Name your ChatApp and choose monetization model
          </p>
          {featureCount > 0 && (
            <Badge variant="outline" className="mt-2">
              Contains {featureCount} features
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ChatApp Information</CardTitle>
            <CardDescription>
              This information will be displayed in the ChatGPT App Store
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="app-name">ChatApp Name *</Label>
              <Input
                id="app-name"
                placeholder="e.g., E-commerce Operations Assistant"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">ChatApp Description *</Label>
              <Textarea
                id="description"
                placeholder="Briefly describe your ChatApp
's features and purpose..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <Label>Monetization Model</Label>
              <RadioGroup value={monetization} onValueChange={setMonetization}>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-start space-x-3 border border-border rounded-lg p-4">
                    <RadioGroupItem value="free" id="free" className="mt-1" />
                    <div className="flex-1">
                      <Label
                        htmlFor="free"
                        className="font-medium cursor-pointer"
                      >
                        Free
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        All users can use your ChatApp for free
                      </p>
                    </div>
                  </div>
                  {!vendorStatusLoading &&
                    !monetizationEligibility.canUseFree &&
                    monetizationEligibility.freeReason &&
                    monetizationEligibility.freeReason !==
                      monetizationEligibility.subscriptionReason && (
                      <p className="text-sm text-destructive">
                        {monetizationEligibility.freeReason}
                      </p>
                    )}
                  <div className="flex items-start space-x-3 border border-border rounded-lg p-4">
                    <RadioGroupItem
                      value="subscription"
                      id="subscription"
                      className="mt-1"
                      disabled={!monetizationEligibility.canUseSubscription}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="subscription"
                        className="font-medium cursor-pointer"
                      >
                        Subscription
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Users need to pay for a subscription to use your ChatApp
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {monetizationEligibility.freeReason}
                  </p>
                  {!vendorStatusLoading &&
                    monetizationEligibility.subscriptionReason &&
                    monetizationEligibility.freeReason !==
                      monetizationEligibility.subscriptionReason && (
                      <p className="text-sm text-destructive">
                        {monetizationEligibility.subscriptionReason}
                        {monetizationEligibility.canUseFree &&
                          !monetizationEligibility.canUseSubscription && (
                            <>
                              {" "}
                              <button
                                type="button"
                                onClick={openPayoutSettingsModal}
                                className="underline text-left text-sm font-medium text-destructive"
                              >
                                Open payout settings
                              </button>
                            </>
                          )}
                      </p>
                    )}
                </div>
              </RadioGroup>
              {vendorStatusLoading && (
                <p className="text-sm text-muted-foreground">
                  Checking Stripe eligibility…
                </p>
              )}
            </div>

            {monetization === "subscription" && (
              <>
                <p className="text-sm text-destructive">
                  You&apos;ll need to set &quot;Authentication -&gt; OAuth&quot;
                  on ChatGPT in order to receive payments.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="price">Subscription Price (Monthly)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      id="price"
                      type="number"
                      placeholder="9.9"
                      className="flex-1"
                      value={paymentPrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string so users can delete all content
                        if (value === "") {
                          setPaymentPrice("");
                        } else {
                          // Only allow numbers and decimal point
                          const numValue = value.replace(/[^0-9.]/g, "");
                          setPaymentPrice(numValue);
                        }
                      }}
                      onBlur={(e) => {
                        // When losing focus, if empty or invalid, set to "0"
                        const value = e.target.value;
                        if (
                          value === "" ||
                          isNaN(Number(value)) ||
                          Number(value) < 0
                        ) {
                          setPaymentPrice("0");
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handlePublish}
              disabled={
                !appName || !description || !canPublish || vendorStatusLoading
              }
            >
              Generate URL
            </Button>
            {!vendorStatusLoading && !canPublish && (
              <p className="text-sm text-destructive">
                {monetization === "subscription"
                  ? monetizationEligibility.subscriptionReason
                  : monetizationEligibility.freeReason}
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
