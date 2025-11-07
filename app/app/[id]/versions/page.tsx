"use client";

import { useState, useEffect } from "react";
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
  ExternalLink,
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
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取 app 数据
  useEffect(() => {
    const fetchAppData = async () => {
      if (!appId) {
        setError("缺少 app ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/apps/${appId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "获取应用数据失败");
        }

        if (result.success && result.data) {
          setAppData(result.data);
        } else {
          throw new Error("未找到应用数据");
        }
      } catch (err) {
        console.error("获取应用数据失败:", err);
        setError(err instanceof Error ? err.message : "获取应用数据失败");
      } finally {
        setLoading(false);
      }
    };

    fetchAppData();
  }, [appId]);

  const handleCopy = async (text: string, itemType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemType);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.log("Failed to copy text: ", err);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // 解析 payment_model
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

  // 获取 features（从 app_meta_info 或 generator_meta）
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
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !appData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "未找到应用数据"}</p>
          <Button asChild variant="outline">
            <Link href="/">返回首页</Link>
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
              返回首页
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
                    {appData.status === "published" ? "已发布" : appData.status}
                  </Badge>
                  {appData.status === "published" && (
                    <Badge variant="default">Published</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  {formatDate(appData.published_at || appData.created_at)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Revenue Statistics - 如果有支付信息 */}
              {paymentModel.model !== "free" && paymentModel.price > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-blue-500 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="size-4 text-muted-foreground" />
                        <label className="text-sm font-medium text-muted-foreground">
                          付费人数
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
                          总收入额
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(appName, "name")}
                  >
                    <Copy className="size-3" />
                    {copiedItem === "name" ? "Copied!" : "Copy"}
                  </Button>
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(appDescription, "description")}
                  >
                    <Copy className="size-3" />
                    {copiedItem === "description" ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>

              {/* URL - 如果有的话 */}
              {appData.app_meta_info?.chatAppMeta && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Globe className="size-4" />
                      URL
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-muted px-2 py-1 rounded flex-1 font-mono">
                        {appData.url}
                      </code>
                      {appData.url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(appData.url, "url")}
                        >
                          <Copy className="size-3" />
                          {copiedItem === "url" ? "Copied!" : "Copy"}
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}

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
