"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { XCircle, CheckCircle2 } from "lucide-react";
import { CircleProgress } from "@/components/ui/circle-progress";

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

interface AnalyzeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisStep: AnalysisStep;
  progress: number;
  connectionError: string | null;
  dataValidationError: string | null;
  runError: string | null;
  isAnalyzing: boolean;
  onReconnect: () => void;
}

export function AnalyzeModal({
  open,
  onOpenChange,
  analysisStep,
  progress,
  connectionError,
  dataValidationError,
  runError,
  isAnalyzing,
  onReconnect,
}: AnalyzeModalProps) {
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
      const connectingIndex = steps.indexOf("connecting");
      const readingSchemaIndex = steps.indexOf("reading-schema");

      if (stepName === "connecting") {
        return "error";
      }
      if (stepName === "reading-schema" && analysisStep === "reading-schema") {
        return "error";
      }
      if (stepIndex > connectingIndex) {
        if (
          stepIndex === readingSchemaIndex &&
          analysisStep === "reading-schema"
        ) {
          return "error";
        }
        return "waiting";
      }
      if (stepIndex < connectingIndex) {
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
                value={25}
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
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black">
            <svg
              className="size-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
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
    validating: getStepStatus("validating-data"),
    sampling: getStepStatus("sampling-data"),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto" 
        showCloseButton={!isAnalyzing}
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
          <CardContent className="space-y-6 py-8">
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

            {/* Display connection error details when failure occurs */}
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
                        onClick={onReconnect}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Reconnect
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Read Data Table Structure */}
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

            {/* Surface error message when Step 3 fails */}
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
                        onClick={onReconnect}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Reconnect
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Availability Validation */}
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

            {/* Only show subsequent steps if both connection and data validation are successful */}
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
                            onClick={onReconnect}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Reconnect
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

                    {/* Progress bar */}
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

