"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
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

const templates = [
  { id: "query", name: "Information Display" },
  { id: "carousel", name: "Carousel" },
  { id: "metrics", name: "Dashboard" },
  { id: "list-filter", name: "List" },
];

// 假数据：全部10个问题
const mockAllQuestions: QuestionItem[] = [
  { id: "q1", text: "筛选高价值用户", status: "pending" },
  { id: "q2", text: "统计商品品类销售额", status: "pending" },
  { id: "q3", text: "分析新用户来源", status: "pending" },
  { id: "q4", text: "预测用户流失风险", status: "pending" },
  { id: "q5", text: "分析用户购买行为模式", status: "pending" },
  { id: "q6", text: "评估营销活动效果", status: "pending" },
  { id: "q7", text: "识别高潜力产品", status: "pending" },
  { id: "q8", text: "分析用户满意度趋势", status: "pending" },
  { id: "q9", text: "预测库存需求", status: "pending" },
  { id: "q10", text: "优化推荐算法", status: "pending" },
];

export function GenerateFlow() {
  const router = useRouter();
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { user } = useAuth();
  const [dbConnectionDataObj, setDbConnectionDataObj] = useState<any>({});
  // 防重复调用与首渲染仅触发一次
  const inFlightRef = useRef(false);
  const mountedCalledRef = useRef(false);
  const statusUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    }
  }, []);

  // 当 selectedProblems 变化时，更新 allQuestions
  useEffect(() => {
    if (selectedProblems.length > 0) {
      const questions = getQuestionsFromProblems(selectedProblems);
      setAllQuestions(questions);
    }
  }, [selectedProblems]);

  // 模拟状态更新：每个问题从pending -> generating -> done
  useEffect(() => {
    if (!isGenerating) {
      // 重置所有问题为pending
      if (selectedProblems.length > 0) {
        const questions = getQuestionsFromProblems(selectedProblems);
        setAllQuestions(questions);
      }
      return;
    }

    // 初始化：将第一个问题设为generating
    if (
      allQuestions.length > 0 &&
      allQuestions.every((q) => q.status === "pending")
    ) {
      setAllQuestions((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[0] = {
            ...updated[0],
            status: "generating" as QuestionStatus,
          };
        }
        return updated;
      });
    }

    let currentIndex = 0;
    const totalQuestions = allQuestions.length;

    // 模拟状态转换：每隔2-3秒更新一个问题的状态
    const updateStatus = () => {
      setAllQuestions((prev) => {
        const updated = [...prev];

        // 找到当前正在生成中的问题，将其标记为done
        const generatingIndex = updated.findIndex(
          (q) => q.status === "generating"
        );
        if (generatingIndex !== -1) {
          updated[generatingIndex] = {
            ...updated[generatingIndex],
            status: "done",
          };
        }

        // 找到下一个pending的问题，将其标记为generating
        const nextPendingIndex = updated.findIndex(
          (q) => q.status === "pending"
        );
        if (nextPendingIndex !== -1) {
          updated[nextPendingIndex] = {
            ...updated[nextPendingIndex],
            status: "generating",
          };
          currentIndex++;
          return updated;
        }

        // 如果所有问题都done了，停止更新
        if (updated.every((q) => q.status === "done")) {
          if (statusUpdateIntervalRef.current) {
            clearInterval(statusUpdateIntervalRef.current);
            statusUpdateIntervalRef.current = null;
          }
        }

        return updated;
      });
    };

    // 首次立即更新一次（让选中的问题开始generating）
    const firstUpdate = setTimeout(() => {
      updateStatus();
    }, 1000);

    // 然后每隔2-3秒更新一次
    statusUpdateIntervalRef.current = setInterval(() => {
      updateStatus();
    }, 2500) as unknown as NodeJS.Timeout;

    return () => {
      clearTimeout(firstUpdate);
      if (statusUpdateIntervalRef.current) {
        clearInterval(statusUpdateIntervalRef.current);
        statusUpdateIntervalRef.current = null;
      }
    };
  }, [isGenerating, allQuestions.length, selectedProblems.length]);

  useEffect(() => {
    const stored = localStorage.getItem("selectedProblems");
    if (stored) {
      try {
        const problems = JSON.parse(stored);
        setSelectedProblems(problems);
        // Auto-start generation process
        startGeneration(problems);
      } catch (e) {
        console.log("Failed to parse selected problems", e);
      }
    }
    if (!mountedCalledRef.current) {
      mountedCalledRef.current = true;
      generateBatchData();
    }
    // testGenerateBatch();
  }, []);
  const testGenerateBatch = async () => {
    setTimeout(() => {
      router.push(`/preview?id=cd444900-083e-479a-bf5b-0a5b297c4563`);
    }, 13000);
  };

  const generateBatchData = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsGenerating(true);
    setHasError(false);
    setErrorMessage("");
    // 提前声明供两个阶段复用的变量
    let extractedQueries: any[] = [];
    let anchIndexNum: any = null;
    const selectedQuestionsWithSql = localStorage.getItem(
      "selectedQuestionsWithSql"
    );
    if (selectedQuestionsWithSql) {
      const { anchIndex, questionsWithSql } = JSON.parse(
        selectedQuestionsWithSql
      );
      extractedQueries = questionsWithSql;
      anchIndexNum = anchIndex;
    }
    try {
      const batchData = {
        queries: extractedQueries,
        anchorIndex: anchIndexNum,
        user_id: user?.id || "",
        supabase_config: {
          supabase_url: dbConnectionDataObj.connectionUrl,
          supabase_key: dbConnectionDataObj.apiKey,
        },
      };

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

      console.log(data);
      if (typeof window !== "undefined") {
        localStorage.setItem("currentAppUrl", data.data.domain);
      }
      router.push(`/preview?id=${data.data.serviceId}`);
    } catch (err) {
      console.log("Error generating batch", err);
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : "生成失败，请重试");
    } finally {
      setIsGenerating(false);
      inFlightRef.current = false;
    }
  };
  const startGeneration = (problems: SelectedProblem[]) => {
    setIsGenerating(true);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation removed on generate page */}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold mb-2">Generating Your ChatAPP</h1>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            {hasError ? (
              <XCircle className="size-12 text-red-500 mb-6" />
            ) : (
              <Loader2 className="size-12 text-blue-600 animate-spin mb-6" />
            )}

            <CardTitle className="mb-4 text-xl">
              {hasError ? "Generation Failed" : ""}
            </CardTitle>

            <div className="w-full max-w-md space-y-4">
              {hasError ? (
                /* Error State */
                <div className="text-center">
                  {/* <p className="text-lg font-medium text-red-600 mb-4">
                    {errorMessage}
                  </p> */}
                  <Button
                    onClick={() => {
                      setHasError(false);
                      setErrorMessage("");
                      generateBatchData();
                    }}
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                /* Loading State */
                <div className="text-center"></div>
              )}

              {/* Selected Features Preview */}
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
                          {question.status === "generating" ? (
                            <Icon
                              className={`size-5 ${config.color} shrink-0 animate-spin`}
                            />
                          ) : (
                            <Icon
                              className={`size-5 ${config.color} shrink-0`}
                            />
                          )}
                          <span className={`${config.color} font-medium`}>
                            {config.label}
                          </span>
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
              This process will take a few minutes. You can close this page. We
              will notify you once everything is complete.
            </CardDescription>
            <Button
              className="mt-4"
              onClick={() => {
                router.push("/");
              }}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
