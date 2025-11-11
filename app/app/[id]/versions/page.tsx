"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Copy,
  Check,
  AlertCircle,
  Calendar,
  Tag,
  Globe,
  FileText,
  Users,
  DollarSign,
  Loader2,
} from "lucide-react";

type AppData = {
  id: string;
  name: string;
  description: string;
  status: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  payment_model?: string | null;
  mcp_server_ids?: string | string[] | null;
  url?: string | null;
  app_meta_info?: {
    chatAppMeta?: {
      name?: string;
      description?: string;
      coreFeatures?: Array<{
        title: string;
        summary: string;
      }>;
      highlightedQuestions?: Array<{
        question: string;
        simulatedAnswer?: string;
      }>;
    };
  } | null;
  generator_meta?: {
    queries?: Array<{
      index: number;
      query: string;
    }>;
    [key: string]: any;
  } | null;
  [key: string]: any;
};

export default function AppVersionsPage() {
  const params = useParams();
  const appId = params?.id as string;
  const [copyFeedback, setCopyFeedback] = useState<{
    item: string;
    status: "success" | "error";
  } | null>(null);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch app data
  useEffect(() => {
    const fetchAppData = async () => {
      if (!appId) {
        setError("Missing app ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/apps/${appId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch app data");
        }

        if (result.success && result.data) {
          setAppData(result.data);
        } else {
          throw new Error("App data not found");
        }
      } catch (err) {
        console.log("Failed to fetch app data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch app data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAppData();
  }, [appId]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const showCopyFeedback = (itemType: string, status: "success" | "error") => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setCopyFeedback({ item: itemType, status });
    feedbackTimeoutRef.current = setTimeout(() => {
      setCopyFeedback(null);
      feedbackTimeoutRef.current = null;
    }, 2000);
  };

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

  const handleCopy = async (text: string, itemType: string) => {
    const attemptClipboardCopy = async () => {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    };

    try {
      const clipboardWorked = await attemptClipboardCopy();
      if (!clipboardWorked) {
        fallbackCopyText(text);
      }
      showCopyFeedback(itemType, "success");
    } catch (err) {
      console.log("Failed to copy text:", err);
      try {
        fallbackCopyText(text);
        showCopyFeedback(itemType, "success");
      } catch (fallbackErr) {
        console.log("Fallback copy failed:", fallbackErr);
        showCopyFeedback(itemType, "error");
      }
    }
  };

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Parse payment_model
  const parsePaymentModel = (paymentModel: string | null | undefined) => {
    if (!paymentModel) return { model: "free", price: 0 };
    try {
      if (typeof paymentModel === "string") {
        return JSON.parse(paymentModel);
      }
      return paymentModel;
    } catch {
      return { model: "free", price: 0 };
    }
  };

  // Get features (from app_meta_info or generator_meta)
  const getFeatures = () => {
    if (appData?.app_meta_info?.chatAppMeta?.coreFeatures) {
      return appData.app_meta_info.chatAppMeta.coreFeatures.map(
        (feature) => feature.title
      );
    }
    if (appData?.generator_meta?.queries) {
      return appData.generator_meta.queries.map(
        (q: any) => q.query || `Query ${q.index || ""}`
      );
    }
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !appData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {error || "App data not found"}
          </p>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const paymentModel = parsePaymentModel(appData.payment_model);
  const features = getFeatures();
  const appName = appData.name;
  const appDescription = appData.description;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="size-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{appName}</h1>
        </div>

        {/* App Info Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Tag className="size-3" />
                    {appData.status === "published"
                      ? "Published"
                      : appData.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  {formatDate(appData.published_at || appData.created_at)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Revenue Statistics - If payment info exists */}
              {paymentModel.model !== "free" && paymentModel.price > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-blue-500 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="size-4 text-muted-foreground" />
                        <label className="text-sm font-medium text-muted-foreground">
                          Paid Users
                        </label>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        -
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Active Subscribers
                      </div>
                    </div>

                    <div className="border border-blue-500 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="size-4 text-muted-foreground" />
                        <label className="text-sm font-medium text-muted-foreground">
                          Total Revenue
                        </label>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        $-
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Total Revenue
                      </div>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* App Name */}
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="size-4" />
                  App Name
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-medium">{appName}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(appName, "name")}
                      className="flex items-center gap-1"
                    >
                      {copyFeedback?.item === "name" ? (
                        copyFeedback.status === "success" ? (
                          <Check className="size-3 text-emerald-600" />
                        ) : (
                          <AlertCircle className="size-3 text-destructive" />
                        )
                      ) : (
                        <Copy className="size-3" />
                      )}
                      <span className="sr-only">Copy app name</span>
                    </Button>
                    {copyFeedback?.item === "name" && (
                      <span
                        className={`text-xs font-medium transition-opacity duration-150 ${
                          copyFeedback.status === "success"
                            ? "text-emerald-600"
                            : "text-destructive"
                        }`}
                      >
                        {copyFeedback.status === "success"
                          ? "Copied!"
                          : "Copy failed"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <div className="flex items-start gap-2 mt-1">
                  <p className="text-sm text-muted-foreground flex-1">
                    {appDescription}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(appDescription, "description")}
                      className="flex items-center gap-1"
                    >
                      {copyFeedback?.item === "description" ? (
                        copyFeedback.status === "success" ? (
                          <Check className="size-3 text-emerald-600" />
                        ) : (
                          <AlertCircle className="size-3 text-destructive" />
                        )
                      ) : (
                        <Copy className="size-3" />
                      )}
                      <span className="sr-only">Copy description</span>
                    </Button>
                    {copyFeedback?.item === "description" && (
                      <span
                        className={`text-xs font-medium transition-opacity duration-150 ${
                          copyFeedback.status === "success"
                            ? "text-emerald-600"
                            : "text-destructive"
                        }`}
                      >
                        {copyFeedback.status === "success"
                          ? "Copied!"
                          : "Copy failed"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* MCP Server IDs - If available */}
              {/* {appData.mcp_server_ids && ( */}
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Globe className="size-4" />
                    URL
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1 font-mono">
                      {appData.mcp_server_ids}
                    </code>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleCopy(
                            Array.isArray(appData.mcp_server_ids)
                              ? appData.mcp_server_ids.join(", ")
                              : appData.mcp_server_ids || "",
                            "url"
                          )
                        }
                        className="flex items-center gap-1"
                      >
                        {copyFeedback?.item === "url" ? (
                          copyFeedback.status === "success" ? (
                            <Check className="size-3 text-emerald-600" />
                          ) : (
                            <AlertCircle className="size-3 text-destructive" />
                          )
                        ) : (
                          <Copy className="size-3" />
                        )}
                        <span className="sr-only">Copy URL</span>
                      </Button>
                      {copyFeedback?.item === "url" && (
                        <span
                          className={`text-xs font-medium transition-opacity duration-150 ${
                            copyFeedback.status === "success"
                              ? "text-emerald-600"
                              : "text-destructive"
                          }`}
                        >
                          {copyFeedback.status === "success"
                            ? "Copied!"
                            : "Copy failed"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </>
              {/* )} */}

              {/* Features */}
              {features.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Features</h4>
                    <ul className="space-y-1">
                      {features.map((feature: string, idx: number) => (
                        <li
                          key={idx}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
      </div>
    </div>
  );
}
