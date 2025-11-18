"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { CircleProgress } from "@/components/ui/circle-progress";
import { useAuth } from "@/components/AuthProvider";

type AnalysisStep =
  | "connecting"
  | "validating-data"
  | "reading-schema"
  | "sampling-data"
  | "evaluating"
  | "complete";

type StepVisualStatus = "waiting" | "in-progress" | "completed" | "error";

const STEP_PROGRESS_RANGES: Record<
  AnalysisStep,
  { start: number; end: number }
> = {
  connecting: { start: 0, end: 10 },
  "reading-schema": { start: 10, end: 30 },
  "validating-data": { start: 30, end: 40 },
  "sampling-data": { start: 40, end: 100 },
  evaluating: { start: 100, end: 100 },
  complete: { start: 100, end: 100 },
};

interface DatabaseAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  accessToken: string;
  onComplete?: () => void;
}

export function DatabaseAnalysisModal({
  isOpen,
  onClose,
  projectId,
  accessToken,
  onComplete,
}: DatabaseAnalysisModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>("connecting");
  const [progress, setProgress] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [dataValidationError, setDataValidationError] = useState<string | null>(
    null
  );
  const [runError, setRunError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [jobStatus, setJobStatus] = useState("init");

  const pollJobProgress = async (
    jobId: string,
    onProgress?: (
      progress: number | null,
      status: string | null,
      data: any
    ) => void,
    interval = 5000,
    maxMinutes = 6
  ) => {
    const maxTime = maxMinutes * 60 * 1000;
    const start = Date.now();
    let last = null;
    while (Date.now() - start < maxTime) {
      const res = await fetch(
        `https://business-insight.datail.ai/api/v1/runs/job/${jobId}`
      );
      const data = await res.json();
      if (typeof onProgress === "function") {
        onProgress(
          typeof data.progress === "number" ? data.progress : null,
          data.status || null,
          data
        );
      }
      if (
        data.status === "completed" ||
        data.status === "failed" ||
        data.status === "error"
      ) {
        return data;
      }
      await new Promise((r) => setTimeout(r, interval));
      last = data;
    }
    return {
      ...last,
      status: "timeout",
      error: "Exceeded maximum polling wait time",
    };
  };

  const handleConnectAPI = async () => {
    setConnectionError(null);
    setDataValidationError(null);
    setRunError(null);
    setAnalysisStep("connecting");
    setIsAnalyzing(true);
    setProgress(0);

    let connectionId = "";
    let runData = {};

    try {
      setProgress(5);
      const validateRes = await fetch("/api/validate-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: projectId,
          accessToken: accessToken,
        }),
      });

      if (!validateRes.ok) {
        setConnectionError("Please check your Project ID or Access Token");
        setAnalysisStep("connecting");
        setIsAnalyzing(false);
        return;
      }

      const validateResData = await validateRes.json();
      if (!validateResData.success) {
        setConnectionError("Please check your Project ID or Access Token");
        setAnalysisStep("connecting");
        setIsAnalyzing(false);
        return;
      }

      try {
        const dataConnectionsResponse = await fetch("/api/data-connections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id || "",
            connectionInfo: {
              project_id: projectId,
              access_token: accessToken,
            },
            connectionSource: "supabase",
            status: "active",
          }),
        });
        const dataConnectionsData = await dataConnectionsResponse.json();
        if (!dataConnectionsData.success) {
          throw new Error(
            dataConnectionsData.error || "Data connections failed"
          );
        }
        connectionId = dataConnectionsData.record?.id;
      } catch (e) {
        console.warn("save data_connections failed", e);
      }

      setProgress(10);
      setAnalysisStep("reading-schema");
      setProgress(15);

      const validateResponse = await fetch(
        "https://data-validation.datail.ai/api/v1/validate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user?.id || "",
            connection_id: connectionId,
            project_id: projectId,
            access_token: accessToken,
          }),
        }
      );

      if (!validateResponse.ok) {
        const errorData = await validateResponse.json();
        const errorMsg =
          errorData.error ||
          `Data validation failed: ${validateResponse.status}`;
        setDataValidationError(errorMsg);
        setAnalysisStep("validating-data");
        setIsAnalyzing(false);
        return;
      }

      const validateData = await validateResponse.json();

      if (validateData.data_structure?.database_note) {
        try {
          localStorage.setItem(
            "database_note",
            validateData.data_structure.database_note
          );
        } catch (e) {
          console.warn("Failed to save database_note to localStorage:", e);
        }
      }

      setAnalysisStep("validating-data");
      setProgress(30);

      if (validateData.validation_report.summary.status == "unusable") {
        setDataValidationError(
          validateData.validation_report.summary.note ||
            "Data validation failed"
        );
        setAnalysisStep("validating-data");
        setIsAnalyzing(false);
        return;
      }

      setProgress(40);
      runData = {
        user_id: user?.id || validateData.user_id,
        trace_id: validateData.trace_id,
        connection_id: connectionId || validateData.connection_id,
        data_structure: validateData.data_structure,
      };

      setAnalysisStep("sampling-data");
      setProgress(45);

      const connectResponse = await fetch(
        "https://business-insight.datail.ai/api/v1/pipeline/run",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(runData),
        }
      );

      if (!connectResponse.ok) {
        let errorMsg = `Pipeline run failed: ${connectResponse.status}`;
        try {
          const errorData = await connectResponse.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          const errorText = await connectResponse.text();
          errorMsg = errorText?.slice(0, 200) || errorMsg;
        }
        setRunError(errorMsg);
        setAnalysisStep("sampling-data");
        setIsAnalyzing(false);
        return;
      }

      const connectData = await connectResponse.json();

      setJobStatus("waiting");
      const pollingResult = await pollJobProgress(
        connectData.job_id,
        (progress, status, data) => {
          if (progress !== null) {
            const mappedProgress = 45 + Math.floor((progress / 100) * 55);
            setProgress(mappedProgress);
          }
          if (status) setJobStatus(status);
        },
        10000,
        6
      );

      if (pollingResult.status === "completed") {
        setJobStatus("done");
        setProgress(100);
      } else {
        setJobStatus(pollingResult.status || "error");
        setRunError(pollingResult.error || "Pipeline run failed");
        setIsAnalyzing(false);
        return;
      }

      setAnalysisStep("evaluating");

      const run_results = pollingResult?.run_results;
      if (!run_results) {
        setRunError("No run_result found in polling result");
        setAnalysisStep("evaluating");
        setIsAnalyzing(false);
        return;
      }

      const standalJson = pollingResult;

      localStorage.setItem(
        "standalJson",
        JSON.stringify({
          anchIndex: standalJson.run_results?.run_result?.anchIndex,
          segments: standalJson.run_results?.run_result?.segments,
        })
      );

      setAnalysisStep("complete");
      const segments = standalJson?.run_results?.run_result?.segments || [];

      const runResultToSave = {
        ...standalJson?.run_results?.run_result,
        task_id:
          pollingResult?.run_results?.task_id || pollingResult?.task_id,
      };
      localStorage.setItem("run_result", JSON.stringify(runResultToSave));

      if (runResultToSave.task_id) {
        localStorage.setItem("originalTaskId", runResultToSave.task_id);
      }

      const mapped = segments.map((seg: any) => ({
        id: seg.segmentId || seg.name,
        title: seg.name,
        analysis: seg.analysis,
        valueQuestions: seg.valueQuestions,
      }));
      try {
        localStorage.setItem("marketsData", JSON.stringify(mapped));
      } catch {}

      localStorage.setItem(
        "dbConnectionData",
        JSON.stringify({
          connectionUrl: projectId,
          accessToken: accessToken,
          id: connectionId,
          connectionId: connectionId,
        })
      );

      setIsAnalyzing(false);
      
      // 设置标志，让 connect-flow 自动跳转到 results 步骤
      try {
        localStorage.setItem("skipToBusinessInsight", "true");
      } catch (e) {
        console.warn("Failed to set skipToBusinessInsight flag:", e);
      }
      
      onComplete?.();
      // 延迟关闭弹窗，让用户看到完成状态，然后跳转
      setTimeout(() => {
        onClose();
        // 跳转到 business insight 界面（connect 页面的 results 步骤）
        router.push("/connect");
      }, 500);
    } catch (error) {
      console.log("API call failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (
        analysisStep === "reading-schema" ||
        analysisStep === "validating-data"
      ) {
        setDataValidationError(errorMessage);
        setRunError(null);
      } else if (analysisStep === "sampling-data") {
        setRunError(errorMessage);
        setDataValidationError(null);
      } else if (analysisStep === "evaluating") {
        setRunError(errorMessage);
        setDataValidationError(null);
      } else {
        setRunError(errorMessage);
        setDataValidationError(null);
      }

      setAnalysisStep("connecting");
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId && accessToken && !isAnalyzing) {
      // 重置状态
      setAnalysisStep("connecting");
      setProgress(0);
      setConnectionError(null);
      setDataValidationError(null);
      setRunError(null);
      setJobStatus("init");
      handleConnectAPI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 当弹窗关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      setAnalysisStep("connecting");
      setProgress(0);
      setConnectionError(null);
      setDataValidationError(null);
      setRunError(null);
      setIsAnalyzing(false);
      setJobStatus("init");
    }
  }, [isOpen]);

  const getStepStatus = (stepName: AnalysisStep): StepVisualStatus => {
    const steps: AnalysisStep[] = [
      "connecting",
      "reading-schema",
      "validating-data",
      "sampling-data",
      "evaluating",
      "complete",
    ];
    const currentIndex = steps.indexOf(analysisStep);
    const stepIndex = steps.indexOf(stepName);

    if (connectionError) {
      if (stepName === "connecting") {
        return "error";
      }
      if (stepName === "reading-schema" && analysisStep === "reading-schema") {
        return "error";
      }
      if (stepIndex > steps.indexOf("connecting")) {
        if (
          stepIndex === steps.indexOf("reading-schema") &&
          analysisStep === "reading-schema"
        ) {
          return "error";
        }
        return "waiting";
      }
      if (stepIndex < steps.indexOf("connecting")) {
        if (stepName === "validating-data" && dataValidationError) {
          return "error";
        }
        return currentIndex > stepIndex ? "completed" : "waiting";
      }
    }

    if (runError) {
      if (stepName === "reading-schema") {
        return "error";
      }
      const readingSchemaIndex = steps.indexOf("reading-schema");
      if (stepIndex > readingSchemaIndex) {
        return "waiting";
      }
    }

    if (dataValidationError && stepName === "validating-data") {
      return "error";
    }

    if (analysisStep === "reading-schema") {
      if (stepName === "reading-schema") {
        return "in-progress";
      }
      if (stepName === "validating-data") {
        return "waiting";
      }
    }

    if (analysisStep === "validating-data") {
      if (stepName === "reading-schema") {
        return "completed";
      }
      if (stepName === "validating-data") {
        return "in-progress";
      }
    }

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "in-progress";
    return "waiting";
  };

  const getStepProgressPercentage = (stepName: AnalysisStep) => {
    if (stepName === "complete") {
      return progress >= 100 ? 100 : 0;
    }
    const range = STEP_PROGRESS_RANGES[stepName];
    if (!range) {
      return 0;
    }
    if (progress <= range.start) {
      return 0;
    }
    if (progress >= range.end) {
      return 100;
    }
    const span = Math.max(range.end - range.start, 1);
    return Math.round(((progress - range.start) / span) * 100);
  };

  const StepProgressIndicator = ({
    step,
    status,
  }: {
    step: AnalysisStep;
    status: StepVisualStatus;
  }) => {
    let value = getStepProgressPercentage(step);

    if (status === "completed") {
      value = 100;
    } else if (status === "waiting") {
      value = 0;
    } else if (status === "in-progress" && value === 0) {
      value = 1;
    } else if (status === "error" && value === 0 && progress > 0) {
      value = 1;
    }

    value = Math.max(0, Math.min(100, value));

    const isCompleted = status === "completed" && value === 100;

    return (
      <div className="relative flex h-9 w-9 items-center justify-center">
        {status === "in-progress" ? (
          <div className="relative">
            <div className="animate-spin">
              <CircleProgress
                value={value}
                maxValue={100}
                size={36}
                strokeWidth={2}
                getColor={() => "stroke-primary"}
                disableAnimation={true}
                className="text-primary"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {value}%
              </span>
            </div>
          </div>
        ) : status === "error" ? (
          <XCircle className="size-9 text-red-600" />
        ) : isCompleted ? (
          <CheckCircle2 className="size-9 text-green-500" />
        ) : (
          <div className="relative flex h-9 w-9 items-center justify-center">
            <span className="text-xs font-semibold text-muted-foreground">
              {value}%
            </span>
          </div>
        )}
      </div>
    );
  };

  const stepStatuses = {
    connecting: getStepStatus("connecting"),
    reading: getStepStatus("reading-schema"),
    validating: dataValidationError
      ? ("error" as StepVisualStatus)
      : runError
      ? ("waiting" as StepVisualStatus)
      : getStepStatus("validating-data"),
    sampling:
      connectionError || dataValidationError
        ? ("error" as StepVisualStatus)
        : getStepStatus("sampling-data"),
    evaluating:
      connectionError || dataValidationError
        ? ("error" as StepVisualStatus)
        : getStepStatus("evaluating"),
  };

  const handleClose = () => {
    // 只有在没有正在分析或者有错误时才允许关闭
    if (!isAnalyzing || connectionError || dataValidationError || runError) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto duration-300 ease-out data-[state=open]:zoom-in-100 data-[state=open]:slide-in-from-bottom-4"
        showCloseButton={!isAnalyzing || !!connectionError || !!dataValidationError || !!runError}
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
            Analyzing Your Database
          </DialogTitle>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="space-y-6 py-4">
            {/* Database Connection */}
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <StepProgressIndicator
                  step="connecting"
                  status={stepStatuses.connecting}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Database Connection</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {connectionError
                    ? "Connection failed, please check database configuration"
                    : "Verify connection information and establish secure connection"}
                </p>
              </div>
            </div>

            {connectionError && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <XCircle className="size-6 text-red-600 mt-0.5 shrink-0" />
                  <div className="space-y-3">
                    <h4 className="font-bold text-red-900 text-lg">
                      {connectionError}
                    </h4>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setConnectionError(null);
                          setDataValidationError(null);
                          handleConnectAPI();
                        }}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!connectionError && (
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <StepProgressIndicator
                    step="reading-schema"
                    status={stepStatuses.reading}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      Read Data Table Structure
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {runError
                      ? "Failed to read database schema"
                      : "Analyze table structure, field types and relationships"}
                  </p>
                </div>
              </div>
            )}

            {runError && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <XCircle className="size-6 text-red-600 mt-0.5 shrink-0" />
                  <div className="space-y-3">
                    <h4 className="font-bold text-red-900 text-lg">
                      {runError}
                    </h4>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRunError(null);
                          setConnectionError(null);
                          setDataValidationError(null);
                          handleConnectAPI();
                        }}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!connectionError && (
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <StepProgressIndicator
                    step="validating-data"
                    status={stepStatuses.validating}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      Data Availability Validation
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {dataValidationError
                      ? "Data validation failed, please check data availability"
                      : runError
                      ? "Waiting for schema reading..."
                      : "Check data integrity and accessibility"}
                  </p>
                </div>
              </div>
            )}

            {!connectionError && !dataValidationError && (
              <>
                {dataValidationError && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="size-6 text-red-600 mt-0.5 shrink-0" />
                      <div className="space-y-3">
                        <h4 className="font-bold text-red-900 text-lg">
                          {dataValidationError}
                        </h4>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsAnalyzing(false);
                              setConnectionError(null);
                              setDataValidationError(null);
                              handleConnectAPI();
                            }}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Retry
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!runError && (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <StepProgressIndicator
                          step="sampling-data"
                          status={stepStatuses.sampling}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            Extract Sample Data for Content Analysis
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Read small samples to understand data content and
                          patterns
                        </p>
                      </div>
                    </div>

                    {!connectionError &&
                      !dataValidationError &&
                      !runError && (
                        <div className="pt-4">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-500"
                              style={{
                                width: `${progress}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

