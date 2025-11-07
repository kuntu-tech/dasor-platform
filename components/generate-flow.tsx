"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
type SelectedProblem = {
  id: string;
  userProfile: string;
  problem: string;
  marketValue: string;
  implementationMethod: string;
  implementationDifficulty: number;
};

type QuestionStatus = "pending" | "generating" | "done";

interface QuestionItem {
  id: string;
  text: string;
  status: QuestionStatus;
}

type BatchJobStatus = {
  appId?: string;
  status?: "pending" | "generating" | "succeeded" | "failed";
  currentQueryIndex?: number | null;
  totalQueries?: number | null;
  currentToolName?: string | null;
  currentToolIndex?: number | null;
  totalToolsInCurrentQuery?: number | null;
  message?: string | null;
  error?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  lastUpdatedAt?: string | null;
};

type GenerationState =
  | "idle"
  | "preparing"
  | "submitting"
  | "running"
  | "succeeded"
  | "failed";

const templates = [
  { id: "query", name: "Information Display" },
  { id: "carousel", name: "Carousel" },
  { id: "metrics", name: "Dashboard" },
  { id: "list-filter", name: "List" },
];

const DEFAULT_ANCHOR_INDEX =
  '[{"table":"calendar","columns":["listing_id","date","available","price","adjusted_price","minimum_nights","maximum_nights"],"index":0},{"table":"listings","columns":["id","name","host_id","host_name","neighbourhood_group","neighbourhood","latitude","longitude","room_type","price","minimum_nights","number_of_reviews","last_review","reviews_per_month","calculated_host_listings_count","availability_365","number_of_reviews_ltm","license"],"index":1},{"table":"listingsdetails","columns":["id","listing_url","scrape_id","last_scraped","source","name","description","neighborhood_overview","picture_url","host_id","host_url","host_name","host_since","host_location","host_about","host_response_time","host_response_rate","host_acceptance_rate","host_is_superhost","host_thumbnail_url","host_picture_url","host_neighbourhood","host_listings_count","host_total_listings_count","host_verifications","host_has_profile_pic","host_identity_verified","neighbourhood","neighbourhood_cleansed","neighbourhood_group_cleansed","latitude","longitude","property_type","room_type","accommodates","bathrooms","bathrooms_text","bedrooms","beds","amenities","price","minimum_nights","maximum_nights","minimum_minimum_nights","maximum_minimum_nights","minimum_maximum_nights","maximum_maximum_nights","minimum_nights_avg_ntm","maximum_nights_avg_ntm","calendar_updated","has_availability","availability_30","availability_60","availability_90","availability_365","calendar_last_scraped","number_of_reviews","number_of_reviews_ltm","number_of_reviews_l30d","availability_eoy","number_of_reviews_ly","estimated_occupancy_l365d","estimated_revenue_l365d","first_review","last_review","review_scores_rating","review_scores_accuracy","review_scores_cleanliness","review_scores_checkin","review_scores_communication","review_scores_location","review_scores_value","license","instant_bookable","calculated_host_listings_count","calculated_host_listings_count_entire_homes","calculated_host_listings_count_private_rooms","calculated_host_listings_count_shared_rooms","reviews_per_month"],"index":2},{"table":"neighbourhoods","columns":["neighbourhood_group","neighbourhood"],"index":3},{"table":"reviews","columns":["listing_id","date"],"index":4},{"table":"reviewsdetails","columns":["listing_id","id","date","reviewer_id","reviewer_name","comments"],"index":5}]';


export function GenerateFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appIdFromQuery = searchParams.get("appId");
  const [selectedProblems, setSelectedProblems] = useState<SelectedProblem[]>(
    []
  );
  // 将 selectedProblems 转换为 QuestionItem 格式用于显示
  const getQuestionsFromProblems = (
    problems: SelectedProblem[]
  ): QuestionItem[] => {
    return problems.map((problem, index) => ({
      id: problem.id || `problem-${index}`,
      text: problem.problem || problem.toString(),
      status: "pending" as QuestionStatus,
    }));
  };
  const [allQuestions, setAllQuestions] = useState<QuestionItem[]>([]);
  const [jobState, setJobState] = useState<GenerationState>("idle");
  const jobStateRef = useRef<GenerationState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [batchStatus, setBatchStatus] = useState<BatchJobStatus | null>(null);
  const [jobAppId, setJobAppId] = useState<string | null>(null);
  const { user } = useAuth();
  const [dbConnectionDataObj, setDbConnectionDataObj] = useState<any>({});
  const [dbConnectionReady, setDbConnectionReady] = useState(false);
  // 防重复调用与首渲染仅触发一次
  const inFlightRef = useRef(false);
  const mountedCalledRef = useRef(false);
  const statusUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const POLL_INTERVAL_MS = 4000;

  useEffect(() => {
    jobStateRef.current = jobState;
  }, [jobState]);

  // 在客户端获取 dbConnectionData
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dbConnectionData = localStorage.getItem("dbConnectionData");
      if (dbConnectionData) {
        try {
          const parsed = JSON.parse(dbConnectionData);
          setDbConnectionDataObj(parsed);
          console.log(parsed, "dbConnectionDataObj");
        } catch (e) {
          console.error("Failed to parse dbConnectionData:", e);
        }
      }
      setDbConnectionReady(true);
    }
  }, []);

  // 当 selectedProblems 变化时，更新 allQuestions
  useEffect(() => {
    if (selectedProblems.length > 0) {
      const questions = getQuestionsFromProblems(selectedProblems);
      setAllQuestions(questions);
    }
  }, [selectedProblems]);

  const clearStatusTimer = useCallback(() => {
    if (statusUpdateIntervalRef.current) {
      clearTimeout(statusUpdateIntervalRef.current);
      statusUpdateIntervalRef.current = null;
    }
  }, []);

  const buildMetadataPayload = useCallback(() => {
    const taskId =
      (globalThis as any).crypto?.randomUUID?.() || `task_${Date.now()}`;
    let segmentsPayload: any[] = [];
    try {
      const marketsRaw = localStorage.getItem("marketsData");
      if (marketsRaw) {
        const markets = JSON.parse(marketsRaw);
        if (Array.isArray(markets)) {
          segmentsPayload = markets.map((seg: any) => ({
            name: seg.name || seg.title,
            analysis: seg.analysis || undefined,
            valueQuestions: seg.valueQuestions || undefined,
          }));
        }
      }
    } catch {}

    let runResult: any = {};
    try {
      runResult = JSON.parse(localStorage.getItem("run_result") || "{}");
    } catch {}

    return {
      run_result: runResult,
      domain: { primaryDomain: "Hospitality Management" },
      ingest: { schemaHash: "sha256-3c7459f15975eae5" },
      run_id: "r_1",
      status: "complete",
      task_id: taskId,
      segments: segmentsPayload,
    };
  }, []);

  const fetchMetadataFromService = useCallback(
    async (signal?: AbortSignal) => {
      const metadataPayload = buildMetadataPayload();
      let payloadToSend: any = metadataPayload;
      try {
        const storedPublish = localStorage.getItem("run_result_publish");
        if (storedPublish) {
          const parsedPublish = JSON.parse(storedPublish);
          if (parsedPublish && typeof parsedPublish === "object") {
            payloadToSend = parsedPublish;
          }
        }
      } catch (err) {
        console.warn("解析 run_result_publish 失败，使用默认 payload", err);
      }

      const response = await fetch(
        "https://business-insight.datail.ai/api/v1/apps/metadata",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadToSend),
          cache: "no-store",
          signal,
        }
      );
      const text = await response.text();
      let parsed: any = text;
      try {
        parsed = JSON.parse(text);
      } catch {}
      if (!response.ok) {
        const err = new Error(
          typeof parsed === "string"
            ? parsed
            : parsed?.error || `apps/metadata HTTP ${response.status}`
        );
        (err as any).meta = parsed;
        throw err;
      }
      return parsed;
    },
    [buildMetadataPayload]
  );

  const updateQuestionStatuses = useCallback((statusPayload: BatchJobStatus | null) => {
    setAllQuestions((prev) => {
      if (!prev.length) {
        return prev;
      }

      if (!statusPayload) {
        return prev.map((item) => ({ ...item, status: "pending" }));
      }

      if (statusPayload.status === "succeeded") {
        return prev.map((item) => ({ ...item, status: "done" }));
      }

      const total = prev.length;
      const rawIndex =
        typeof statusPayload.currentQueryIndex === "number"
          ? statusPayload.currentQueryIndex
          : null;
      const assumedOneBased =
        rawIndex !== null && rawIndex > 0 ? rawIndex - 1 : rawIndex ?? 0;
      const normalizedIndex =
        rawIndex === null
          ? null
          : Math.min(total - 1, Math.max(0, assumedOneBased));
      const completedCount = Math.max(
        0,
        Math.min(total, statusPayload.status === "failed" ? assumedOneBased : assumedOneBased)
      );

      return prev.map((item, index) => {
        if (statusPayload.status === "failed") {
          if (index < completedCount) {
            return { ...item, status: "done" };
          }
          return { ...item, status: "pending" };
        }

        if (index < completedCount) {
          return { ...item, status: "done" };
        }

        if (
          normalizedIndex !== null &&
          index === normalizedIndex &&
          (statusPayload.status === "generating" || statusPayload.status === "pending")
        ) {
          return { ...item, status: "generating" };
        }

        if (
          normalizedIndex === null &&
          index === 0 &&
          (statusPayload.status === "pending" || statusPayload.status === "generating")
        ) {
          return { ...item, status: "generating" };
        }

        return { ...item, status: "pending" };
      });
    });
  }, []);

  const hydrateAppRecord = useCallback(async (appId: string) => {
    if (!appId) return;
    try {
      const response = await fetch(`/api/apps/${appId}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || `HTTP ${response.status}`);
      }

      if (typeof window !== "undefined" && payload?.data) {
        const appData = payload.data;
        try {
          localStorage.setItem("latestAppRecord", JSON.stringify(appData));
        } catch {}

        const domains = Array.isArray(appData?.generator_servers)
          ? appData.generator_servers
          : [];
        const domain = domains[0]?.domain || "";
        if (domain) {
          localStorage.setItem("currentAppUrl", domain);
        }

        if (appData?.generator_meta) {
          try {
            localStorage.setItem(
              "generator_meta",
              JSON.stringify(appData.generator_meta)
            );
          } catch {}
        }

        if (appData?.generator_config) {
          try {
            localStorage.setItem(
              "generator_config",
              JSON.stringify(appData.generator_config)
            );
          } catch {}
        }

        localStorage.setItem("currentAppId", appId);
      }
    } catch (error) {
      console.warn("加载应用详情失败", error);
    }
  }, []);

  const requestStatus = useCallback(
    async (appId: string) => {
      if (!appId) return;
      clearStatusTimer();

      try {
        const response = await fetch(`/api/generate-batch/${appId}/status`, {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || `HTTP ${response.status}`);
        }

        setBatchStatus(payload);
        updateQuestionStatuses(payload);

        if (payload?.status === "succeeded") {
          setJobState("succeeded");
          await hydrateAppRecord(appId);
          router.push(`/preview?id=${appId}`);
          return;
        }

        if (payload?.status === "failed") {
          setJobState("failed");
          setErrorMessage(payload?.error || payload?.message || "生成失败，请重试");
          return;
        }

        statusUpdateIntervalRef.current = setTimeout(() => {
          requestStatus(appId);
        }, POLL_INTERVAL_MS);
      } catch (error) {
        console.log("查询任务状态失败", error);
        if (
          jobStateRef.current !== "failed" &&
          jobStateRef.current !== "succeeded"
        ) {
          statusUpdateIntervalRef.current = setTimeout(() => {
            requestStatus(appId);
          }, POLL_INTERVAL_MS);
        }
      }
    },
    [POLL_INTERVAL_MS, clearStatusTimer, hydrateAppRecord, updateQuestionStatuses]
  );

  useEffect(() => {
    if (!jobAppId) return;
    requestStatus(jobAppId);
  }, [jobAppId, requestStatus]);

  useEffect(() => {
    return () => {
      clearStatusTimer();
    };
  }, [clearStatusTimer]);

  useEffect(() => {
    if (!dbConnectionReady) {
      return;
    }
    let problemsFromStorage: SelectedProblem[] | null = null;
    const stored = localStorage.getItem("selectedProblems");
    if (stored) {
      try {
        const problems = JSON.parse(stored);
        problemsFromStorage = problems;
        setSelectedProblems(problems);
        // Auto-start generation process for UI display only
        startGeneration(problems);
      } catch (e) {
        console.log("Failed to parse selected problems", e);
      }
    }

    if (!mountedCalledRef.current) {
      mountedCalledRef.current = true;
      if (appIdFromQuery) {
        updateQuestionStatuses(null);
        setBatchStatus(null);
        setJobState("running");
        setJobAppId(appIdFromQuery);
      } else {
        generateBatchData(problemsFromStorage || undefined);
      }
    }
  }, [appIdFromQuery, dbConnectionReady]);
  const generateBatchData = async (problemsOverride?: SelectedProblem[]) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setJobState("preparing");
    setErrorMessage("");
    setBatchStatus(null);
    setJobAppId(null);
    clearStatusTimer();
    updateQuestionStatuses(null);
    // 提前声明供两个阶段复用的变量
    let extractedQueries: any[] = [];
    const currentProblems =
        problemsOverride && problemsOverride.length > 0
          ? problemsOverride
          : selectedProblems;

    let anchIndexNum: any = null;
    const selectedQuestionsWithSql = localStorage.getItem(
      "selectedQuestionsWithSql"
    );
    if (selectedQuestionsWithSql) {
      const parsed = JSON.parse(selectedQuestionsWithSql);
      extractedQueries = parsed?.questionsWithSql || extractedQueries;
      anchIndexNum =
        parsed?.anchIndex ??
        parsed?.anchorIndex ??
        parsed?.anchor_index ??
        null;
    }
    try {
      // 先调用业务元数据接口，获取 app_meta_info
      let appMetaFromService: any | null = null;
      try {
        appMetaFromService = await fetchMetadataFromService();
      } catch (err) {
        console.warn("获取应用元数据异常", err);
      }

      if (!appMetaFromService || typeof appMetaFromService !== "object") {
        appMetaFromService = {};
      }

      // 从 metadata 中提取 name 和 description
      const chatMeta =
        appMetaFromService.chatAppMeta ||
        appMetaFromService.chatappmeta ||
        appMetaFromService.chat_app_meta ||
        {};

      const appName =
        (typeof chatMeta.name === "string" && chatMeta.name.trim()
          ? chatMeta.name.trim()
          : null) ||
        currentProblems[0]?.problem ||
        "Generated App";

      const appDescription =
        (typeof chatMeta.description === "string" && chatMeta.description.trim()
          ? chatMeta.description.trim()
          : null) ||
        "Batch generated app";

      // 更新 chatMeta 以确保包含最新的 name 和 description
      chatMeta.name = appName;
      chatMeta.description = appDescription;
      appMetaFromService.chatAppMeta = chatMeta;

      const batchData = {
        queries: extractedQueries,
        anchorIndex: anchIndexNum,
        user_id: user?.id || "",
        supabase_config: {
          supabase_url: dbConnectionDataObj.connectionUrl,
          supabase_key: dbConnectionDataObj.apiKey,
          access_token: dbConnectionDataObj.accessToken,
        },
        app: {
          name: appName,
          description: appDescription,
          connection_id:
            dbConnectionDataObj.connectionId ||
            dbConnectionDataObj.connection_id ||
            undefined,
          app_meta_info: appMetaFromService,
        },
      };

      setJobState("submitting");
      const response = await fetch("/api/generate-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batchData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const nextAppId = data?.appId || data?.data?.appId || data?.data?.id;
      if (!nextAppId) {
        throw new Error("Batch generation service did not return appId");
      }

      const initialStatus: BatchJobStatus = {
        appId: nextAppId,
        status: (data?.status as BatchJobStatus["status"]) || "pending",
        currentQueryIndex:
          typeof data?.currentQueryIndex === "number"
            ? data.currentQueryIndex
            : 1,
        totalQueries:
          typeof data?.totalQueries === "number"
            ? data.totalQueries
            : extractedQueries.length,
        message:
          data?.message || "Batch generation task submitted, please check the progress later",
      };

      setBatchStatus(initialStatus);
      updateQuestionStatuses(initialStatus);
      setJobAppId(nextAppId);
      setJobState("running");
    } catch (err) {
      console.log("Error generating batch", err);
      setJobState("failed");
      setErrorMessage(err instanceof Error ? err.message : "Batch generation failed, please try again");
    } finally {
      inFlightRef.current = false;
    }
  };

    const startGeneration = (problems: SelectedProblem[]) => {

    // Auto-assign default templates based on problem type
    const defaultTemplateMapping: Record<string, string> = {
      "Order Management": "query",
      "Inventory Monitoring": "metrics",
      "Return and Refund": "query",
      "Supplier Performance": "metrics",
      "Logistics Delivery": "query",
      "Promotional Campaign": "metrics",
      "Customer Lifetime Value": "metrics",
      "Product Recommendation": "carousel",
      "Price Competitiveness": "metrics",
      "Seasonal Demand": "metrics",
      "Product Catalog": "list-filter",
      "User Feedback": "query",
      "Feature Usage": "metrics",
      "A/B Testing": "metrics",
      "User Churn": "metrics",
      "Competitor Feature": "query",
      "Target User": "list-filter",
      "Product Roadmap": "metrics",
      "Feature Adoption": "metrics",
      "User Journey": "query",
      "Customer Acquisition": "metrics",
      "Campaign Performance": "metrics",
      "Customer Segmentation": "list-filter",
      "Content Performance": "metrics",
      "Lead Scoring": "query",
      "Social Media": "query",
      "Email Marketing": "query",
      "Cross-channel": "metrics",
      "Marketing ROI": "metrics",
    };

    // Complete generation
    const features = problems.map((problem, index) => {
      const templateId = defaultTemplateMapping[problem.problem] || "query";
      return {
        id: `feature-${index + 1}`,
        name: problem.problem,
        userProfile: problem.userProfile,
        marketValue: problem.marketValue,
        templateType: templateId,
        templateName:
          templates.find((t) => t.id === templateId)?.name ||
          "Information Display",
        implementationMethod: problem.implementationMethod,
        implementationDifficulty: problem.implementationDifficulty,
      };
    });

    const app = {
      id: `app-${Date.now()}`,
      name: "MY First APP Hello GPT1",
      features: features,
      status: "draft",
      createdAt: new Date().toISOString().split("T")[0],
      featureCount: features.length,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("currentApp", JSON.stringify(app));
    }
  };

  const isStatusTrackingOnly = Boolean(appIdFromQuery);
  const isFailed = jobState === "failed";
  const isSucceeded = jobState === "succeeded";
  const isProcessing = !isFailed && !isSucceeded;
  const statusMessage =
    batchStatus?.message ||
    (isSucceeded
      ? "Batch generation task completed"
      : "Batch generation task is in progress, please wait");
  const progressText =
    typeof batchStatus?.currentQueryIndex === "number"
      ? `${Math.max(1, batchStatus.currentQueryIndex)} / ${
          (batchStatus?.totalQueries ?? allQuestions.length) || 1
        }`
      : null;
  const toolProgress =
    typeof batchStatus?.currentToolIndex === "number" &&
    typeof batchStatus?.totalToolsInCurrentQuery === "number"
      ? `(${Math.max(1, batchStatus.currentToolIndex + 1)} / ${
          batchStatus.totalToolsInCurrentQuery || 1
        })`
      : "";
  const currentToolText = batchStatus?.currentToolName
    ? `${batchStatus.currentToolName}`.trim()
    : null;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold mb-2">Generating Your ChatAPP</h1>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            {isFailed ? (
              <XCircle className="size-12 text-red-500 mb-6" />
            ) : isSucceeded ? (
              <CheckCircle2 className="size-12 text-green-600 mb-6" />
            ) : (
              <Loader2 className="size-12 text-blue-600 animate-spin mb-6" />
            )}

            {/* <CardTitle className="mb-4 text-xl">
              {isFailed
                ? "Generation Failed"
                : isSucceeded
                ? "Generation Complete"
                : "Generating Your App"}
            </CardTitle> */}

            <div className="w-full max-w-md space-y-4">
              {isFailed ? (
                <div className="text-center space-y-3">
                  {errorMessage && (
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  )}
                  {isStatusTrackingOnly ? (
                    <Button
                      disabled={!jobAppId}
                      onClick={() => {
                        if (jobAppId) {
                          requestStatus(jobAppId);
                        }
                      }}
                    >
                      Refresh Status
                    </Button>
                  ) : (
                    <Button onClick={() => generateBatchData()}>
                      Try Again
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground space-y-2">
                  {/* <p>{statusMessage}</p>
                  {progressText && (
                    <p>
                      Queries: <span className="font-medium">{progressText}</span>
                    </p>
                  )}
                  {currentToolText && (
                    <p>
                      Current Tool:{" "}
                      <span className="font-medium">{currentToolText}</span>
                    </p>
                  )}
                  {batchStatus?.status && (
                    <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                      Status: {batchStatus.status}
                    </p>
                  )} */}
                </div>
              )}

              <div className="mt-8 w-full">
                <h2 className="text-lg font-medium text-muted-foreground mb-3">
                  Selected Features:
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allQuestions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p>
                        No features selected. Please go back and select
                        features.
                      </p>
                    </div>
                  ) : (
                    allQuestions.map((question, index) => {
                      const statusConfig = {
                        pending: {
                          icon: Clock,
                          color: "text-muted-foreground",
                          label: "",
                          bgColor: "bg-gray-50",
                        },
                        generating: {
                          icon: Loader2,
                          color: "text-blue-600",
                          label: "Generating",
                          bgColor: "bg-blue-50",
                        },
                        done: {
                          icon: CheckCircle2,
                          color: "text-green-600",
                          label: "",
                          bgColor: "bg-green-50",
                        },
                      };

                      const config = statusConfig[question.status];
                      const Icon = config.icon;

                      return (
                        <div
                          key={question.id}
                          className={`flex items-center gap-3 text-sm p-3 rounded-lg transition-colors ${config.bgColor}`}
                        >
                          {question.status === "generating" && isProcessing ? (
                            <Icon
                              className={`size-5 ${config.color} shrink-0 animate-spin`}
                            />
                          ) : (
                            <Icon
                              className={`size-5 ${config.color} shrink-0`}
                            />
                          )}
                          <span className="text-foreground flex-1">
                            {index + 1}. {question.text}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <CardDescription className="text-center max-w-md mt-6">
              {isSucceeded
                ? "Batch generation completed, you can jump to the preview to view the application details."
                : "Batch generation process may take several minutes, we will continue to synchronize the progress."}
            </CardDescription>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => router.push("/")}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
