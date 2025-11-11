"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles,
  Database,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Info,
  Send,
  TrendingUp,
  Users,
  Target,
  Wrench,
  Clock,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

type Step = "connect" | "analyzing" | "results";
type AnalysisStep =
  | "connecting"
  | "validating-data"
  | "reading-schema"
  | "sampling-data"
  | "evaluating"
  | "complete";

type AnalysisResultItem = {
  id: string;
  userProfile: string;
  problem: string;
  marketValue: string;
  implementationMethod: "Metadata Supported" | "Requires Modeling";
  implementationDifficulty: number;
};

export function ConnectFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("connect");
  const [connectionUrl, setConnectionUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [readOnly, setReadOnly] = useState(true);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResultItem[]>(
    []
  );
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>("connecting");
  const [chatInput, setChatInput] = useState("");
  const [pendingChatInput, setPendingChatInput] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedUserProfiles, setSelectedUserProfiles] = useState<Set<string>>(
    new Set()
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [dataValidationError, setDataValidationError] = useState<string | null>(
    null
  );
  const [hasValidated, setHasValidated] = useState<boolean>(false);

  // 真实的数据库验证函数 - 调用后端API
  const performRealDatabaseValidation = async (
    url: string,
    key: string
  ): Promise<void> => {
    const response = await fetch("/api/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, key }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Connection failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("Database connection validation succeeded:", data);
  };

  // 获取分析结果的真实API调用
  const fetchAnalysisResults = async () => {
    try {
      setAnalysisStep("connecting");

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: connectionUrl,
          key: apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();

      // 模拟分析步骤进度
      const steps: AnalysisStep[] = [
        "connecting",
        "validating-data",
        "reading-schema",
        "sampling-data",
        "evaluating",
        "complete",
      ];

      for (let i = 0; i < steps.length; i++) {
        setAnalysisStep(steps[i]);
        // 每个步骤之间稍作延迟，让用户看到进度
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // 设置分析结果
      setAnalysisResults(data.results || []);
      setStep("results");
    } catch (error) {
      console.log("Analysis failed:", error);
      setConnectionError(
        `Analysis failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setStep("connect");
    }
  };

  useEffect(() => {
    // If URL param results=1, jump directly to results screen with existing/default suggestions
    const shouldShowResults = searchParams?.get("results") === "1";
    if (shouldShowResults) {
      // Keep previous results if any; otherwise show minimal placeholder so the page renders
      if (analysisResults.length === 0) {
        setAnalysisResults([
          {
            id: "seed-1",
            userProfile: "Product Managers",
            problem: "Explore more AI app ideas",
            marketValue: "Medium Value - Brainstorm based on your data context",
            implementationMethod: "Metadata Supported",
            implementationDifficulty: 1,
          },
        ]);
      }
      setStep("results");
      return;
    }

    if (step === "analyzing") {
      fetchAnalysisResults();
    }
  }, [step, searchParams]);

  const handleConnectAPI = async () => {
    console.log("handleConnectAPI");

    // 校验 connectionUrl 格式
    if (!connectionUrl || connectionUrl.trim() === "") {
      setConnectionError("Connection URL cannot be empty");
      return;
    }

    // 校验 URL 格式
    try {
      new URL(connectionUrl);
    } catch (error) {
      setConnectionError("Invalid connection URL format, please enter a valid URL");
      return;
    }

    // 校验 apiKey 格式
    if (!apiKey || apiKey.trim() === "") {
      setConnectionError("API key cannot be empty");
      return;
    }

    // 校验 API Key 长度（通常至少8位）
    if (apiKey.length < 8) {
      setConnectionError("API key must be at least 8 characters long");
      return;
    }

    // 清除之前的错误信息
    setConnectionError("");

    // 开始分析流程
    setStep("analyzing");
    setAnalysisStep("connecting");

    try {
      const response = await fetch("/api/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: connectionUrl, key: apiKey }),
      });

      const data = await response.json();
      console.log("API response:", data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      // API调用成功，继续到下一步
      setAnalysisStep("validating-data");
    } catch (error) {
      console.log("Error connecting to API:", error);
      setConnectionError(
        `Connection failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      // 连接失败时重置步骤
      setStep("connect");
      setAnalysisStep("connecting");
    }
  };

  const handleConnect = async () => {
    if (!connectionUrl) return;

    setStep("analyzing");
    setAnalysisStep("connecting");

    try {
      await performRealDatabaseValidation(connectionUrl, apiKey);
      setHasValidated(true);
      setConnectionError(null);

      // 连接成功后，继续分析流程
      setAnalysisStep("validating-data");
    } catch (error) {
      console.log("Database validation failed:", error);
      setConnectionError(
        error instanceof Error ? error.message : "Database connection failed"
      );
      setStep("connect");
      setAnalysisStep("connecting");
    }
  };

  const handleDataValidation = async () => {
    if (!hasValidated) return;

    setAnalysisStep("validating-data");

    try {
      // 调用数据验证API
      const response = await fetch("/api/validate-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: connectionUrl,
          key: apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Data validation failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.valid) {
        setDataValidationError(null);
        setAnalysisStep("reading-schema");
      } else {
        throw new Error(data.error || "Data authenticity validation failed");
      }
    } catch (error) {
      console.log("Data validation failed:", error);
      setDataValidationError(
        error instanceof Error ? error.message : "Data validation failed"
      );
      setStep("connect");
    }
  };

  const getStepStatus = (stepName: AnalysisStep) => {
    const steps: AnalysisStep[] = [
      "connecting",
      "validating-data",
      "reading-schema",
      "sampling-data",
      "evaluating",
      "complete",
    ];

    const currentIndex = steps.indexOf(analysisStep);
    const stepIndex = steps.indexOf(stepName);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  const getStepIcon = (stepName: AnalysisStep) => {
    const status = getStepStatus(stepName);

    if (status === "completed")
      return <CheckCircle2 className="size-5 text-green-500" />;
    if (status === "current")
      return <Loader2 className="size-5 text-blue-500 animate-spin" />;
    return <Clock className="size-5 text-gray-400" />;
  };

  const getStepText = (stepName: AnalysisStep) => {
    const stepTexts = {
      connecting: "Connecting to database",
      "validating-data": "Validating data authenticity",
      "reading-schema": "Reading data schema",
      "sampling-data": "Sampling data",
      evaluating: "Evaluating business opportunities",
      complete: "Analysis complete",
    };
    return stepTexts[stepName];
  };

  const handleItemSelect = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleUserProfileSelect = (profile: string) => {
    const newSelected = new Set(selectedUserProfiles);
    if (newSelected.has(profile)) {
      newSelected.delete(profile);
    } else {
      newSelected.add(profile);
    }
    setSelectedUserProfiles(newSelected);
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    setPendingChatInput(chatInput);
    setChatInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: pendingChatInput,
          context: {
            selectedItems: Array.from(selectedItems),
            selectedUserProfiles: Array.from(selectedUserProfiles),
            analysisResults: analysisResults,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Chat response:", data);
    } catch (error) {
      console.log("Chat failed:", error);
    }
  };

  if (step === "connect") {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Connect Database
            </h1>
            <p className="text-lg text-gray-600">
              Connect your database to discover AI-powered business
              opportunities
            </p>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-5" />
                Database Connection
              </CardTitle>
              <CardDescription>
                Enter your database connection details to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="url">Database URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={connectionUrl}
                  onChange={(e) => setConnectionUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="key">API Key</Label>
                <Input
                  id="key"
                  type="password"
                  placeholder="your-api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="readonly"
                  checked={readOnly}
                  onCheckedChange={(checked) => setReadOnly(checked as boolean)}
                />
                <Label htmlFor="readonly">Read-only access</Label>
              </div>

              {connectionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2 text-red-800">
                    <XCircle className="size-4" />
                    <span className="text-sm">{connectionError}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleConnectAPI} className="flex-1">
                  <Database className="size-4 mr-2" />
                  Connect & Analyze
                </Button>
                <Button variant="outline" onClick={handleConnect}>
                  <Info className="size-4 mr-2" />
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "analyzing") {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Analyzing Your Database
            </h1>
            <p className="text-lg text-gray-600">
              We're discovering business opportunities in your data
            </p>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="space-y-6">
                {[
                  "connecting",
                  "validating-data",
                  "reading-schema",
                  "sampling-data",
                  "evaluating",
                  "complete",
                ].map((stepName) => (
                  <div
                    key={stepName}
                    className="flex items-center gap-4 p-4 rounded-lg border"
                  >
                    {getStepIcon(stepName as AnalysisStep)}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {getStepText(stepName as AnalysisStep)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {stepName === "connecting" &&
                          "Establishing secure connection"}
                        {stepName === "validating-data" &&
                          "Verifying data authenticity"}
                        {stepName === "reading-schema" &&
                          "Understanding your data structure"}
                        {stepName === "sampling-data" &&
                          "Analyzing data patterns"}
                        {stepName === "evaluating" &&
                          "Identifying business opportunities"}
                        {stepName === "complete" && "Finalizing results"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "results") {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {analysisResults.length} business opportunities found for you
            </h1>
            <p className="text-lg text-gray-600">
              Select the ones you are interested in
            </p>
          </div>

          <div className="grid gap-6">
            {analysisResults.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => handleItemSelect(item.id)}
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.userProfile}</Badge>
                      <Badge
                        variant={
                          item.implementationMethod === "Metadata Supported"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {item.implementationMethod}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.problem}
                    </h3>
                    <p className="text-gray-600">{item.marketValue}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={() => setStep("connect")}>
              <ArrowRight className="size-4 mr-2" />
              Start New Analysis
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
