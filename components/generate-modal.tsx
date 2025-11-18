"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { FlowButton } from "@/components/ui/flow-button";

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

type ActiveTool = {
  toolName: string;
  queryIndex: number;
  toolIndex: number;
  globalToolIndex: number;
  totalToolsInQuery: number;
};

type BatchJobStatus = {
  jobId?: string;
  appId?: string;
  status?: "pending" | "generating" | "succeeded" | "failed";
  currentQueryIndex?: number | null;
  totalQueries?: number | null;
  currentToolName?: string | null;
  currentToolIndex?: number | null;
  totalToolsInCurrentQuery?: number | null;
  completedToolsInCurrentQuery?: number | null;
  totalTools?: number | null;
  totalToolsCompleted?: number | null;
  activeToolNames?: string[] | null;
  activeTools?: ActiveTool[] | null;
  lastCompletedToolName?: string | null;
  progressPercentage?: number | null;
  currentQueryProgressPercentage?: number | null;
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

interface GenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateModal({ open, onOpenChange }: GenerateModalProps) {
  const router = useRouter();
  const [selectedProblems, setSelectedProblems] = useState<SelectedProblem[]>(
    []
  );
  
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
  const inFlightRef = useRef(false);
  const mountedCalledRef = useRef(false);
  const statusUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cachedMetadataRef = useRef<any | null>(null);
  const POLL_INTERVAL_MS = 4000;

  useEffect(() => {
    jobStateRef.current = jobState;
  }, [jobState]);

  // Fetch dbConnectionData on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dbConnectionData = localStorage.getItem("dbConnectionData");
      if (dbConnectionData) {
        try {
          const parsed = JSON.parse(dbConnectionData);
          setDbConnectionDataObj(parsed);
        } catch (e) {
          console.log("Failed to parse dbConnectionData:", e);
        }
      }
      setDbConnectionReady(true);
    }
  }, []);

  // Update allQuestions whenever selectedProblems changes
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

  const formatErrorMessage = useCallback(
    (error: string | null | undefined): string => {
      if (!error) {
        return "An issue occurred during generation. Please try again later.";
      }

      const errorLower = error.toLowerCase();

      if (errorLower.includes("timeout") || errorLower.includes("aborted")) {
        return "Request timeout. The network connection may be unstable. Please check your network and try again.";
      }

      if (
        errorLower.includes("500") ||
        errorLower.includes("internal server error")
      ) {
        return "The server is temporarily unable to process your request. Please try again later.";
      }

      if (
        errorLower.includes("401") ||
        errorLower.includes("unauthorized") ||
        errorLower.includes("403") ||
        errorLower.includes("forbidden")
      ) {
        return "Authentication failed. Please refresh the page and try again.";
      }

      if (errorLower.includes("404") || errorLower.includes("not found")) {
        return "The requested resource does not exist. Please go back and restart the generation process.";
      }

      if (
        errorLower.includes("connection") ||
        errorLower.includes("database") ||
        errorLower.includes("sql")
      ) {
        return "Database connection issue. Please check your connection configuration and try again.";
      }

      if (
        errorLower.includes("generation failed") ||
        errorLower.includes("generate")
      ) {
        return "Generation task failed. This may be due to data or configuration issues. Please check your input data and try again.";
      }

      return "An issue occurred during generation. Please try again later.";
    },
    []
  );

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
    async (signal?: AbortSignal, useCache: boolean = true) => {
      if (useCache && cachedMetadataRef.current !== null) {
        return cachedMetadataRef.current;
      }

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
        console.warn(
          "Failed to parse run_result_publish, using default payload",
          err
        );
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

      cachedMetadataRef.current = parsed;
      return parsed;
    },
    [buildMetadataPayload]
  );

  const updateQuestionStatuses = useCallback(
    (statusPayload: BatchJobStatus | null) => {
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

        if (statusPayload.status === "pending") {
          return prev.map((item) => ({ ...item, status: "pending" }));
        }

        const total = prev.length;
        const activeTools = Array.isArray(statusPayload.activeTools)
          ? statusPayload.activeTools
          : [];

        const activeQueryIndices = new Set(
          activeTools.map((tool) => tool.queryIndex - 1)
        );

        if (
          activeTools.length === 0 &&
          typeof statusPayload.totalToolsCompleted === "number" &&
          typeof statusPayload.totalTools === "number" &&
          statusPayload.totalToolsCompleted >= statusPayload.totalTools &&
          statusPayload.totalTools > 0
        ) {
          return prev.map((item) => ({ ...item, status: "done" }));
        }

        const currentQueryIndex =
          typeof statusPayload.currentQueryIndex === "number"
            ? statusPayload.currentQueryIndex
            : null;

        const hasValidToolData =
          (typeof statusPayload.totalTools === "number" &&
            statusPayload.totalTools > 0) ||
          activeTools.length > 0 ||
          (typeof statusPayload.totalToolsCompleted === "number" &&
            statusPayload.totalToolsCompleted > 0);

        return prev.map((item, index) => {
          const queryIndex = index + 1;

          if (statusPayload.status === "failed") {
            if (currentQueryIndex !== null && queryIndex < currentQueryIndex) {
              return { ...item, status: "done" };
            }
            return { ...item, status: "pending" };
          }

          if (activeQueryIndices.has(index)) {
            return { ...item, status: "generating" };
          }

          if (!hasValidToolData) {
            if (
              statusPayload.status === "generating" ||
              statusPayload.status === "pending"
            ) {
              return { ...item, status: "generating" };
            }
            return { ...item, status: "pending" };
          }

          if (currentQueryIndex !== null && hasValidToolData) {
            if (queryIndex < currentQueryIndex) {
              return { ...item, status: "done" };
            }

            if (queryIndex === currentQueryIndex) {
              if (activeQueryIndices.has(index)) {
                return { ...item, status: "generating" };
              }

              const currentQueryToolsCompleted =
                typeof statusPayload.completedToolsInCurrentQuery === "number"
                  ? statusPayload.completedToolsInCurrentQuery
                  : 0;
              const currentQueryTotalTools =
                typeof statusPayload.totalToolsInCurrentQuery === "number"
                  ? statusPayload.totalToolsInCurrentQuery
                  : 0;

              if (
                currentQueryTotalTools > 0 &&
                currentQueryToolsCompleted >= currentQueryTotalTools &&
                currentQueryToolsCompleted > 0 &&
                !activeQueryIndices.has(index)
              ) {
                return { ...item, status: "done" };
              }

              return { ...item, status: "generating" };
            }

            return { ...item, status: "pending" };
          }

          if (activeTools.length > 0) {
            const minActiveQueryIndex = Math.min(
              ...activeTools.map((tool) => tool.queryIndex)
            );
            if (queryIndex < minActiveQueryIndex) {
              return { ...item, status: "done" };
            }
            if (queryIndex === minActiveQueryIndex) {
              return { ...item, status: "generating" };
            }
            return { ...item, status: "pending" };
          }

          if (
            statusPayload.status === "generating" ||
            statusPayload.status === "pending"
          ) {
            if (
              typeof statusPayload.totalToolsCompleted === "number" &&
              typeof statusPayload.totalTools === "number" &&
              statusPayload.totalToolsCompleted >= statusPayload.totalTools &&
              statusPayload.totalTools > 0 &&
              activeTools.length === 0
            ) {
              return { ...item, status: "done" };
            }
            if (index === 0) {
              return { ...item, status: "generating" };
            }
          }

          return { ...item, status: "pending" };
        });
      });
    },
    []
  );

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
      console.warn("Failed to load app details", error);
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
        const payload: BatchJobStatus = await response.json();
        if (!response.ok) {
          const rawError = payload?.error || `HTTP ${response.status}`;
          throw new Error(formatErrorMessage(rawError));
        }

        setBatchStatus(payload);
        updateQuestionStatuses(payload);

        if (payload?.status === "succeeded") {
          setJobState("succeeded");
          await hydrateAppRecord(payload.appId || appId);
          // 关闭弹窗并跳转到预览页面
          onOpenChange(false);
          router.push(`/preview?id=${payload.appId || appId}`);
          return;
        }

        if (payload?.status === "failed") {
          setJobState("failed");
          const rawError = payload?.error || payload?.message || null;
          setErrorMessage(formatErrorMessage(rawError));
          return;
        }

        statusUpdateIntervalRef.current = setTimeout(() => {
          requestStatus(appId);
        }, POLL_INTERVAL_MS);
      } catch (error) {
        console.log("Failed to query job status", error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorLower = errorMsg.toLowerCase();

        if (
          errorLower.includes("timeout") ||
          errorLower.includes("network") ||
          errorLower.includes("fetch")
        ) {
          if (
            jobStateRef.current !== "failed" &&
            jobStateRef.current !== "succeeded"
          ) {
            statusUpdateIntervalRef.current = setTimeout(() => {
              requestStatus(appId);
            }, POLL_INTERVAL_MS);
          }
        } else {
          setJobState("failed");
          setErrorMessage(formatErrorMessage(errorMsg));
        }
      }
    },
    [
      POLL_INTERVAL_MS,
      clearStatusTimer,
      hydrateAppRecord,
      updateQuestionStatuses,
      router,
      formatErrorMessage,
      onOpenChange,
    ]
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

  const generateBatchData = useCallback(async (problemsOverride?: SelectedProblem[]) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setJobState("preparing");
    setErrorMessage("");
    setBatchStatus(null);
    setJobAppId(null);
    clearStatusTimer();
    updateQuestionStatuses(null);

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
      let appMetaFromService: any | null = null;
      try {
        appMetaFromService = await fetchMetadataFromService(undefined, true);
      } catch (err) {
        console.warn("Failed to fetch app metadata", err);
      }

      if (!appMetaFromService || typeof appMetaFromService !== "object") {
        appMetaFromService = {};
      }

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
          : null) || "Batch generated app";

      chatMeta.name = appName;
      chatMeta.description = appDescription;
      appMetaFromService.chatAppMeta = chatMeta;

      try {
        const storedPublish = localStorage.getItem("run_result_publish");
        if (storedPublish) {
          const parsedPublish = JSON.parse(storedPublish);
          if (parsedPublish && typeof parsedPublish === "object") {
            anchIndexNum =
              parsedPublish?.anchIndex ??
              parsedPublish?.anchorIndex ??
              parsedPublish?.anchor_index ??
              null;
          }
        }
      } catch (err) {
        console.warn("Failed to parse run_result_publish", err);
      }
      const batchData = {
        user_id: user?.id || "",
        connection_id:
          dbConnectionDataObj.connectionId ||
          dbConnectionDataObj.connection_id ||
          undefined,
        database_note: (() => {
          if (typeof window !== "undefined") {
            try {
              const savedNote = localStorage.getItem("database_note");
              if (savedNote) {
                return savedNote;
              }
            } catch (e) {
              console.warn(
                "Failed to read database_note from localStorage:",
                e
              );
            }
          }
          return undefined;
        })(),
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
        const rawError =
          data?.error || data?.message || `HTTP ${response.status}`;
        const friendlyError = formatErrorMessage(rawError);
        throw new Error(friendlyError);
      }

      const nextAppId = data?.appId || data?.data?.appId || data?.data?.id;
      if (!nextAppId) {
        throw new Error(
          formatErrorMessage("Batch generation service did not return appId")
        );
      }

      const initialStatus: BatchJobStatus = {
        jobId: data?.jobId,
        appId: nextAppId,
        status: (data?.status as BatchJobStatus["status"]) || "pending",
        currentQueryIndex:
          typeof data?.currentQueryIndex === "number"
            ? data.currentQueryIndex
            : null,
        totalQueries:
          typeof data?.totalQueries === "number"
            ? data.totalQueries
            : extractedQueries.length,
        currentToolName: data?.currentToolName ?? null,
        currentToolIndex: data?.currentToolIndex ?? null,
        totalToolsInCurrentQuery: data?.totalToolsInCurrentQuery ?? null,
        completedToolsInCurrentQuery:
          data?.completedToolsInCurrentQuery ?? null,
        totalTools: data?.totalTools ?? null,
        totalToolsCompleted: data?.totalToolsCompleted ?? null,
        activeToolNames: data?.activeToolNames ?? null,
        activeTools: Array.isArray(data?.activeTools) ? data.activeTools : null,
        lastCompletedToolName: data?.lastCompletedToolName ?? null,
        progressPercentage:
          typeof data?.progressPercentage === "number"
            ? data.progressPercentage
            : null,
        currentQueryProgressPercentage:
          typeof data?.currentQueryProgressPercentage === "number"
            ? data.currentQueryProgressPercentage
            : null,
        message:
          data?.message ||
          "Batch generation task submitted, please check the progress later",
        error: data?.error ?? null,
        startedAt: data?.startedAt ?? null,
        completedAt: data?.completedAt ?? null,
        lastUpdatedAt: data?.lastUpdatedAt ?? null,
      };

      setBatchStatus(initialStatus);
      updateQuestionStatuses(initialStatus);
      setJobAppId(nextAppId);
      setJobState("running");
    } catch (err) {
      console.log("Error generating batch", err);
      setJobState("failed");
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(formatErrorMessage(errorMsg));
    } finally {
      inFlightRef.current = false;
    }
  }, [
    user?.id,
    dbConnectionDataObj,
    formatErrorMessage,
    fetchMetadataFromService,
    updateQuestionStatuses,
    clearStatusTimer,
  ]);

  // 当弹窗打开时，初始化生成流程
  useEffect(() => {
    if (!open || !dbConnectionReady) {
      return;
    }

    // 重置状态
    setJobState("idle");
    setErrorMessage("");
    setBatchStatus(null);
    setJobAppId(null);
    setAllQuestions([]);
    setSelectedProblems([]);
    mountedCalledRef.current = false;

    let problemsFromStorage: SelectedProblem[] | null = null;
    const stored = localStorage.getItem("selectedProblems");
    if (stored) {
      try {
        const problems = JSON.parse(stored);
        problemsFromStorage = problems;
        setSelectedProblems(problems);
        generateBatchData(problems);
      } catch (e) {
        console.log("Failed to parse selected problems", e);
      }
    }
  }, [open, dbConnectionReady, generateBatchData]);

  const isFailed = jobState === "failed";
  const isSucceeded = jobState === "succeeded";
  const isProcessing = !isFailed && !isSucceeded;
  const statusMessage =
    batchStatus?.message ||
    (isSucceeded
      ? "Batch generation task completed"
      : "Batch generation task is in progress, please wait");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto" 
        showCloseButton={!isProcessing}
        onInteractOutside={(e) => {
          // 阻止点击外部关闭弹窗
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // 阻止 ESC 键关闭弹窗
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Generating Your ChatAPP
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8">
          {isFailed ? (
            <XCircle className="size-12 text-red-500 mb-6" />
          ) : isSucceeded ? (
            <CheckCircle2 className="size-12 text-green-600 mb-6" />
          ) : (
            <Loader2 className="size-12 text-gray-600 animate-spin mb-6" />
          )}

          <CardDescription className="text-center max-w-md mb-8">
            {isFailed
              ? "Batch generation failed, please try again."
              : isSucceeded
              ? "Batch generation completed, you can jump to the preview to view the application details."
              : (() => {
                  const allToolsCompleted =
                    typeof batchStatus?.totalToolsCompleted === "number" &&
                    typeof batchStatus?.totalTools === "number" &&
                    batchStatus.totalToolsCompleted >=
                      batchStatus.totalTools &&
                    batchStatus.totalTools > 0 &&
                    batchStatus?.status === "generating";

                  return allToolsCompleted
                    ? "Great! All your tools are ready. We're starting them up now so you can preview everything in just a moment!"
                    : "Batch generation process may take several minutes, we will continue to synchronize the progress.";
                })()}
          </CardDescription>

          <div className="w-full max-w-md space-y-4">
            {isFailed ? (
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  {errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800 font-medium mb-2">
                        Generation Failed
                      </p>
                      <p className="text-sm text-red-700 leading-relaxed">
                        {errorMessage}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => {
                      setErrorMessage("");
                      setJobState("idle");
                      generateBatchData();
                    }}
                    variant="default"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={() => onOpenChange(false)}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {!isFailed && !isSucceeded && (
            <div className="mt-4">
              <FlowButton
                text="Back to Home"
                onClick={() => onOpenChange(false)}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

