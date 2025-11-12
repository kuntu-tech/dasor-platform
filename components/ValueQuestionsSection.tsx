"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { QuestionAccordion } from "@/components/QuestionAccordion";
import { AnalysisCard } from "@/components/AnalysisCard";
import { CompactAnalysisCard } from "@/components/CompactAnalysisCard";
interface Question {
  id: string;
  text: string;
  tags: string[];
  status: "success" | "warning" | "error" | "info";
}
interface Segment {
  id: string;
  name: string;
  subtitle: string;
  questions: Question[];
}
interface AnalysisData {
  id: string;
  dimensionName: string;
  score: number;
  summary: string;
  tags: string[];
  supportingIndicators?: string[];
  userPersona?: {
    role: string;
    companyType: string;
    painPoints: string[];
    goals: string[];
  };
  revenue_band?: string;
  retention_signal?: string;
  conversion_rate_est?: number;
  moat_score?: number;
  scalability_score?: number;
  competitive_advantage?: string[];
  fullDetails: string;
}
type RefreshType =
  | "none"
  | "domain"
  | "segment"
  | "question-list"
  | "question"
  | "add-segment"
  | "merge-segments"
  | "edit-d1"
  | "edit-d2"
  | "edit-d3"
  | "edit-d4"
  | "add-question"
  | "edit-question"
  | "delete-question"
  | "switching-version";
interface ExternalSegment {
  id?: string;
  segmentId?: string;
  name: string;
  subtitle?: string;
  analysis?: any;
  valueQuestions?: Array<{
    id: string;
    intent?: string;
    question: string;
    answerShape?: string;
    feasibility?: { status?: string };
  }>;
}

interface ValueQuestionsSectionProps {
  onAnalysisClick: (analysis: AnalysisData) => void;
  isGenerating: boolean;
  generationProgress: number;
  refreshType: RefreshType;
  refreshKey: number;
  segmentsData?: ExternalSegment[]; // 新增：外部传入的段数据（来自接口）
  onSegmentChange?: (segmentName?: string) => void;
}

const DIMENSION_CONFIG = [
  { id: "D1", key: "D1", name: "Market Opportunity" },
  { id: "D2", key: "D2", name: "Customer Persona" },
  { id: "D3", key: "D3", name: "Conversion & Retention" },
  { id: "D4", key: "D4", name: "Revenue Potential" },
];

const normalizeSegmentId = (segment?: ExternalSegment | null): string => {
  if (!segment) return "";
  const fallback =
    (segment as any)?.segment_id ||
    (segment as any)?.segmentID ||
    (segment as any)?.id ||
    (segment as any)?.uuid ||
    "";
  return (
    segment.segmentId ||
    fallback ||
    segment.id ||
    segment.name ||
    (segment as any)?.title ||
    ""
  ).toString();
};

const normalizeSegmentName = (segment?: ExternalSegment | null): string => {
  if (!segment) return "";
  return (
    segment.name ||
    (segment as any)?.title ||
    normalizeSegmentId(segment)
  ).toString();
};

const mapQuestionStatus = (status?: string): Question["status"] => {
  if (!status) return "info";
  const normalized = status.toUpperCase();
  if (normalized === "IMPOSSIBLE") return "error";
  if (normalized === "NEEDS_TRANSFORM") return "warning";
  if (normalized === "AMBIGUOUS") return "info";
  return "success";
};

const transformExternalSegment = (segment: ExternalSegment): Segment | null => {
  const id = normalizeSegmentId(segment);
  const name = normalizeSegmentName(segment);
  if (!id && !name) {
    return null;
  }

  const questions = Array.isArray(segment.valueQuestions)
    ? (segment.valueQuestions
        .map((question) => {
          const text = question?.question?.trim();
          if (!text) return null;
          const questionId =
            question.id ||
            (question as any)?.questionId ||
            (question as any)?.question_id ||
            text;
          const tags = [
            question.intent,
            question.answerShape,
          ].filter(Boolean) as string[];
          return {
            id: questionId.toString(),
            text,
            tags,
            status: mapQuestionStatus(question.feasibility?.status),
          } satisfies Question;
        })
        .filter(Boolean) as Question[])
    : [];

  return {
    id: id || name,
    name: name || id,
    subtitle:
      segment.subtitle ||
      (segment as any)?.sub_title ||
      (segment as any)?.subtitle ||
      "",
    questions,
  };
};

const transformSegments = (
  segmentsData?: ExternalSegment[]
): Segment[] => {
  if (!Array.isArray(segmentsData)) return [];
  return segmentsData
    .map((segment) => transformExternalSegment(segment))
    .filter((segment): segment is Segment => Boolean(segment));
};

const buildAnalysisEntries = (analysis?: any): AnalysisData[] => {
  if (!analysis) return [];

  return DIMENSION_CONFIG.map((config) => {
    const detail = analysis?.[config.key];
    if (!detail) return null;

    const hasContent =
      detail.summary ||
      typeof detail.score === "number" ||
      (Array.isArray(detail.tags) && detail.tags.length > 0) ||
      (Array.isArray(detail.supporting_indicators) &&
        detail.supporting_indicators.length > 0);

    if (!hasContent) return null;

    const entry: AnalysisData = {
      id: config.id,
      dimensionName: config.name,
      score: typeof detail.score === "number" ? detail.score : 0,
      summary: detail.summary ?? "",
      tags: Array.isArray(detail.tags) ? detail.tags : [],
      supportingIndicators: Array.isArray(detail.supporting_indicators)
        ? detail.supporting_indicators
        : undefined,
      fullDetails: detail.summary ?? "",
    };

    if (detail.user_persona) {
      entry.userPersona = {
        role: detail.user_persona.role,
        companyType: detail.user_persona.company_type,
        painPoints: Array.isArray(detail.user_persona.pain_points)
          ? detail.user_persona.pain_points
          : [],
        goals: Array.isArray(detail.user_persona.goals)
          ? detail.user_persona.goals
          : [],
      };
    }

    if (detail.revenue_band) entry.revenue_band = detail.revenue_band;
    if (detail.retention_signal)
      entry.retention_signal = detail.retention_signal;
    if (detail.conversion_rate_est)
      entry.conversion_rate_est = detail.conversion_rate_est;
    if (detail.moat_score) entry.moat_score = detail.moat_score;
    if (detail.scalability_score)
      entry.scalability_score = detail.scalability_score;
    if (Array.isArray(detail.competitive_advantage))
      entry.competitive_advantage = detail.competitive_advantage;

    return entry;
  }).filter((entry): entry is AnalysisData => Boolean(entry));
};

const findMatchingExternalSegment = (
  segmentsData: ExternalSegment[] | undefined,
  targetId?: string,
  targetName?: string
): ExternalSegment | undefined => {
  if (!Array.isArray(segmentsData) || (!targetId && !targetName)) {
    return undefined;
  }
  return segmentsData.find((segment) => {
    const id = normalizeSegmentId(segment);
    const name = normalizeSegmentName(segment);
    return (
      (targetId && id === targetId) ||
      (targetName && name === targetName)
    );
  });
};
export function ValueQuestionsSection({
  onAnalysisClick,
  isGenerating,
  generationProgress,
  refreshType,
  refreshKey,
  segmentsData,
  onSegmentChange,
}: ValueQuestionsSectionProps) {
  const [currentSegments, setCurrentSegments] = useState<Segment[]>(() =>
    transformSegments(segmentsData)
  );
  const [activeTab, setActiveTab] = useState<string>(() => {
    const initialSegments = transformSegments(segmentsData);
    return initialSegments[0]?.id || "";
  });
  const [hasExpanded, setHasExpanded] = useState(false);
  const [currentAnalysisData, setCurrentAnalysisData] = useState<AnalysisData[]>(
    () => {
      const initialSegments = transformSegments(segmentsData);
      if (!initialSegments.length) return [];
      const firstSegment = initialSegments[0];
      const rawSegment = findMatchingExternalSegment(
        segmentsData,
        firstSegment.id,
        firstSegment.name
      );
      return buildAnalysisEntries(rawSegment?.analysis);
    }
  );

  // 将外部 segmentsData 转换为内部所需结构
  useEffect(() => {
    console.log("segmentsData", segmentsData);
    const mappedSegments = transformSegments(segmentsData);
    setCurrentSegments(mappedSegments);

    if (mappedSegments.length === 0) {
      setActiveTab("");
      setCurrentAnalysisData([]);
      return;
    }
    setActiveTab((prev) => {
      if (prev && mappedSegments.some((segment) => segment.id === prev)) {
        return prev;
      }
      return mappedSegments[0].id;
    });
  }, [segmentsData]);

  // 当切换 Tab 时，若外部数据提供了每个 segment 的 analysis，则同步更新下方分析面板
  useEffect(() => {
    if (!segmentsData || segmentsData.length === 0 || !activeTab) {
      setCurrentAnalysisData([]);
      return;
    }
    const activeSegmentMeta = currentSegments.find(
      (segment) => segment.id === activeTab
    );
    const rawSegment = findMatchingExternalSegment(
      segmentsData,
      activeTab,
      activeSegmentMeta?.name
    );
    setCurrentAnalysisData(buildAnalysisEntries(rawSegment?.analysis));
  }, [activeTab, currentSegments, segmentsData]);
  // Handle segment refresh - switch to second tab
  useEffect(() => {
    if (refreshType === "segment" && !isGenerating) {
      const secondSegment = segmentsData?.[1];
      if (secondSegment) {
        const nextActive =
          normalizeSegmentId(secondSegment) || normalizeSegmentName(secondSegment);
        if (nextActive) {
          setActiveTab(nextActive);
        }
      }
    }
  }, [refreshType, isGenerating, segmentsData]);
  const activeSegment =
    currentSegments.find((s: Segment) => s.id === activeTab) ||
    currentSegments[0];

  useEffect(() => {
    if (onSegmentChange) {
      onSegmentChange(activeSegment?.name);
    }
  }, [activeSegment?.id, activeSegment?.name, onSegmentChange]);

  // 持久化：仅存当前选中 Tab 的 valueQuestions
  useEffect(() => {
    console.log("activeSegment", activeSegment);
    console.log("activeTab", activeTab);
    console.log("currentSegments", currentSegments);

    // 根据 activeTab 过滤 run_result 中的 segments，只保留匹配的 segment
    if (activeTab && typeof window !== "undefined") {
      try {
        const runResultStr = localStorage.getItem("run_result");
        if (runResultStr) {
          const runResult = JSON.parse(runResultStr);

          if (runResult.segments && Array.isArray(runResult.segments)) {
            // 根据 activeTab 匹配 segmentId
            // activeTab 可能是 segmentId（如 "seg_01"）或者映射后的 id
            // 需要找到对应的 segmentId
            const matchedSegment = runResult.segments.find((seg: any) => {
              // 尝试多种匹配方式
              const segId = seg.segmentId || seg.id;
              const segName = seg.name;
              return (
                segId === activeTab ||
                segName === activeTab ||
                (activeSegment &&
                  (segId === activeSegment.id ||
                    segName === activeSegment.name ||
                    seg.segmentId === activeSegment.id ||
                    seg.name === activeSegment.name))
              );
            });

            // 如果找到了匹配的 segment，只保留这一个
            if (matchedSegment) {
              const filteredRunResult = {
                ...runResult,
                segments: [matchedSegment],
              };

              // 更新 localStorage 中的 run_result
              localStorage.setItem(
                "run_result_publish",
                JSON.stringify(filteredRunResult)
              );
              console.log(
                "已过滤 run_result，只保留 segmentId:",
                matchedSegment.segmentId || matchedSegment.id
              );
            } else {
              console.warn(
                "未找到匹配的 segment，activeTab:",
                activeTab,
                "可用 segments:",
                runResult.segments.map((s: any) => s.segmentId || s.id)
              );
            }
          }
        }
      } catch (e) {
        console.log("过滤 run_result 时出错:", e);
      }
    }

    try {
      localStorage.setItem(
        "selectedProblems",
        JSON.stringify(activeSegment?.questions.map((q: Question) => q.text))
      );
    } catch {}
  }, [activeTab, activeSegment, currentSegments]);

  // 根据 activeTab 筛选 standalJson 中 segments 对应 segmentId 的数据，提取 valueQuestions 的 question 和 sql
  useEffect(() => {
    if (!activeTab) return;
    const standalJsonStr = localStorage.getItem("standalJson");
    let standalJson: any = null;
    try {
      // 从 localStorage 获取 standalJson
      let segments: any[] = [];
      if (typeof window !== "undefined") {
        if (standalJsonStr) {
          try {
            standalJson = JSON.parse(standalJsonStr);
            // 支持多种数据结构
            if (standalJson.segments && Array.isArray(standalJson.segments)) {
              segments = standalJson.segments;
            } else if (
              standalJson.run_results?.run_result?.segments &&
              Array.isArray(standalJson.run_results.run_result.segments)
            ) {
              segments = standalJson.run_results.run_result.segments;
            }
          } catch (e) {
            console.log("Failed to parse standalJson:", e);
          }
        }
      }

      if (!segments || segments.length === 0) {
        console.warn("No segments found in standalJson");
        return;
      }

      // 在 segments 中查找对应 activeTab 的 segment
      // activeTab 可能是 segmentId、id 或 name
      const matchedSegment = segments.find((seg: any) => {
        const segId = seg.segmentId || seg.id;
        const segName = seg.name;
        // 检查是否匹配 activeTab（可能是 id、segmentId 或 name）
        return (
          segId === activeTab ||
          segName === activeTab ||
          segId === activeSegment?.id ||
          segName === activeSegment?.name
        );
      });

      if (!matchedSegment || !matchedSegment.valueQuestions) {
        console.warn("No matching segment found for activeTab:", activeTab);
        return;
      }

      // 提取 valueQuestions 中的 question 和 sql，格式化为指定格式
      const questionsWithSql = matchedSegment.valueQuestions.map((q: any) => {
        return {
          query: q.question || q.text || "",
          sql: q.sql || "",
        };
      });

      console.log("Extracted questions with SQL:", questionsWithSql);

      // 存储到 localStorage
      if (typeof window !== "undefined") {
        try {
          const resolvedAnchorIndex =
            standalJson?.anchIndex ??
            standalJson?.anchorIndex ??
            standalJson?.run_results?.run_result?.anchIndex ??
            standalJson?.run_results?.run_result?.anchorIndex ??
            null;

          localStorage.setItem(
            "selectedQuestionsWithSql",
            JSON.stringify({
              anchIndex: resolvedAnchorIndex,
              anchorIndex: resolvedAnchorIndex,
              questionsWithSql,
            })
          );
        } catch (e) {
          console.log("Failed to save questions with SQL:", e);
        }
      }
    } catch (error) {
      console.log("Error extracting questions and SQL:", error);
    }
  }, [activeTab, activeSegment]);
  const handleGenerateApp = () => {
    console.log("Generating app for segment:", activeSegment.name);
  };
  const showFullOverlay =
    isGenerating &&
    (refreshType === "domain" ||
      refreshType === "none" ||
      refreshType === "add-segment" ||
      refreshType === "merge-segments" ||
      refreshType === "edit-d1" ||
      refreshType === "switching-version");
  const showSegmentOverlay = isGenerating && refreshType === "segment";
  const show4DAndQuestionsOverlay =
    isGenerating &&
    (refreshType === "edit-d2" ||
      refreshType === "edit-d3" ||
      refreshType === "edit-d4");
  const showQuestionListOverlay =
    isGenerating &&
    (refreshType === "question-list" ||
      refreshType === "add-question" ||
      refreshType === "edit-question" ||
      refreshType === "delete-question");
  const showSingleQuestionOverlay = isGenerating && refreshType === "question";
  const activeIndex = currentSegments.findIndex(
    (segment: Segment) => segment.id === activeTab
  );
  const resolvedActiveIndex =
    currentSegments.length === 0
      ? -1
      : activeIndex === -1
      ? 0
      : activeIndex;

  useEffect(() => {
    if (!currentSegments.length) return;
    const hasActive = currentSegments.some((segment) => segment.id === activeTab);
    if (!hasActive) {
      setActiveTab(currentSegments[0].id);
    }
  }, [currentSegments, activeTab]);
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden relative">
      {/* Full Page Generation Loading Overlay */}
      <AnimatePresence>
        {showFullOverlay && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.3,
            }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm"
          >
            <motion.div
              initial={{
                scale: 0.9,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{
                scale: 0.9,
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
              className="text-center"
            >
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="inline-block mb-6"
              >
                <SparklesIcon
                  className="w-16 h-16"
                  style={{
                    color: "#10B981",
                  }}
                />
              </motion.div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                {refreshType === "add-segment" || refreshType === "edit-d1"
                  ? "Adding New Segment"
                  : refreshType === "merge-segments"
                  ? "Merging Segments"
                  : refreshType === "switching-version"
                  ? "Switching to New Version"
                  : "Generating New Version"}
              </h3>
              <p className="text-gray-600 mb-6">
                Creating your customized experience...
              </p>
              <div className="w-80 mx-auto">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{
                      width: "0%",
                    }}
                    animate={{
                      width: `${generationProgress}%`,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: "#10B981",
                    }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {Math.round(generationProgress)}%
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 3D Carousel-style Tabs */}
      <div className="border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white py-3 px-4 overflow-hidden relative">
        <div
          className="relative flex items-center justify-center"
          style={{
            perspective: "2000px",
            perspectiveOrigin: "center center",
            height: "60px",
          }}
        >
          {resolvedActiveIndex > 0 && (
            <button
              onClick={() => {
                if (resolvedActiveIndex > 0) {
                  setActiveTab(currentSegments[resolvedActiveIndex - 1].id);
                }
              }}
              disabled={isGenerating}
              className={`absolute left-8 z-30 p-1.5 rounded-full transition-all duration-200 ${
                isGenerating
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:scale-125"
              }`}
              aria-label="Previous segment"
              style={{
                top: "50%",
                transform: "translateY(-50%)",
              }}
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          )}
          {currentSegments.map((segment: Segment, index: number) => {
            const isActive = activeTab === segment.id;
            const distance = index - resolvedActiveIndex;
            const translateX = distance * 350;
            const translateZ = isActive ? 0 : -Math.abs(distance) * 150;
            const rotateY = isActive ? 0 : distance * 25;
            const scale = isActive
              ? 1
              : Math.max(0.6, 1 - Math.abs(distance) * 0.2);
            const opacity = isActive
              ? 1
              : Math.max(0.3, 1 - Math.abs(distance) * 0.3);
            const zIndex = isActive ? 20 : 10 - Math.abs(distance);
            return (
              <motion.button
                key={segment.id}
                onClick={() => setActiveTab(segment.id)}
                disabled={isGenerating}
                animate={{
                  x: translateX,
                  scale,
                  opacity,
                  rotateY,
                  z: translateZ,
                }}
                transition={{
                  duration: 0.35,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className={`absolute flex-shrink-0 px-6 py-1.5 rounded-2xl font-medium transition-all duration-600 ${
                  isActive
                    ? "bg-black text-white shadow-2xl"
                    : "bg-white text-gray-600 hover:text-gray-900 shadow-lg"
                } ${
                  isGenerating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
                style={{
                  width: "480px",
                  transformStyle: "preserve-3d",
                  zIndex,
                  boxShadow: isActive
                    ? "0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(64, 64, 64, 0.2)"
                    : "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div className="text-center">
                  <div
                    className={`font-bold transition-all duration-600 ${
                      isActive ? "text-lg" : "text-xs"
                    }`}
                  >
                    {(segment as any).name}
                  </div>
                </div>
                {isActive && (
                  <motion.div
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background:
                        "radial-gradient(circle at center, rgba(0, 0, 0, 0.3) 0%, transparent 70%)",
                      filter: "blur(20px)",
                      zIndex: -1,
                      transform: "scaleY(2.5)",
                    }}
                  />
                )}
              </motion.button>
            );
          })}
          {resolvedActiveIndex >= 0 &&
            resolvedActiveIndex < currentSegments.length - 1 && (
            <button
              onClick={() => {
                if (
                  resolvedActiveIndex >= 0 &&
                  resolvedActiveIndex < currentSegments.length - 1
                ) {
                  setActiveTab(currentSegments[resolvedActiveIndex + 1].id);
                }
              }}
              disabled={isGenerating}
              className={`absolute right-8 z-30 p-1.5 rounded-full transition-all duration-200 ${
                isGenerating
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:scale-125"
              }`}
              aria-label="Next segment"
              style={{
                top: "50%",
                transform: "translateY(-50%)",
              }}
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: -20,
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className="p-8 relative"
        >
          {/* Segment-level overlay */}
          <AnimatePresence>
            {showSegmentOverlay && (
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 0.3,
                }}
                className="absolute inset-0 z-40 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-xl"
              >
                <motion.div
                  initial={{
                    scale: 0.9,
                    opacity: 0,
                  }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                  }}
                  exit={{
                    scale: 0.9,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut",
                  }}
                  className="text-center"
                >
                  <motion.div
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="inline-block mb-4"
                  >
                    <SparklesIcon
                      className="w-12 h-12"
                      style={{
                        color: "#10B981",
                      }}
                    />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Refreshing Segment
                  </h3>
                  <p className="text-gray-600 text-sm">Updating content...</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* 4D Market Analysis + Value Questions overlay */}
          <div className="relative">
            <AnimatePresence>
              {show4DAndQuestionsOverlay && (
                <motion.div
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                  className="absolute inset-0 z-40 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-xl"
                  style={{
                    minHeight: "500px",
                  }}
                >
                  <motion.div
                    initial={{
                      scale: 0.9,
                      opacity: 0,
                    }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                    }}
                    exit={{
                      scale: 0.9,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="inline-block mb-4"
                    >
                      <SparklesIcon
                        className="w-12 h-12"
                        style={{
                          color: "#10B981",
                        }}
                      />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Updating Analysis
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Refreshing{" "}
                      {refreshType === "edit-d2"
                        ? "D2"
                        : refreshType === "edit-d3"
                        ? "D3"
                        : "D4"}{" "}
                      dimension...
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* 4D Market Analysis Section */}
            <div className="mb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`analysis-grid-${hasExpanded}`}
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                  onMouseEnter={() => setHasExpanded(true)}
                  className={`grid gap-3 transition-all duration-300 ${
                    hasExpanded ? "grid-cols-2" : "grid-cols-4"
                  }`}
                >
                  {currentAnalysisData.map((analysis, index) => (
                    <motion.div
                      key={`${analysis.id}-${refreshKey}`}
                      initial={{
                        opacity: 0,
                        scale: 0.95,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.1,
                      }}
                    >
                      {hasExpanded ? (
                        <AnalysisCard
                          analysis={analysis}
                          onClick={() => onAnalysisClick(analysis)}
                        />
                      ) : (
                        <CompactAnalysisCard
                          analysis={analysis}
                          onClick={() => onAnalysisClick(analysis)}
                        />
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
            {/* Value Questions Section */}
            <div
              className="pt-2 relative"
              onMouseEnter={() => setHasExpanded(true)}
            >
              <AnimatePresence>
                {showQuestionListOverlay && (
                  <motion.div
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.3,
                    }}
                    className="absolute inset-0 z-30 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-xl"
                  >
                    <motion.div
                      initial={{
                        scale: 0.9,
                        opacity: 0,
                      }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                      }}
                      exit={{
                        scale: 0.9,
                        opacity: 0,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                      className="text-center"
                    >
                      <motion.div
                        animate={{
                          rotate: 360,
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="inline-block mb-4"
                      >
                      <SparklesIcon
                          className="w-12 h-12"
                          style={{
                          color: "#10B981",
                          }}
                        />
                      </motion.div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {refreshType === "add-question"
                          ? "Adding Question"
                          : refreshType === "delete-question"
                          ? "Deleting Question"
                          : refreshType === "edit-question"
                          ? "Editing Question"
                          : "Refreshing Questions"}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Updating question list...
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              <h2 className="text-3xl font-semibold text-gray-900 mb-6">
                Value Questions
              </h2>
              <div className="space-y-1 max-h-[900px] overflow-y-auto">
                {activeSegment?.questions &&
                activeSegment.questions.length > 0 ? (
                  activeSegment.questions.map(
                    (question: Question, index: number) => (
                      <motion.div
                        key={`${question.id}-${refreshKey}`}
                        initial={{
                          opacity: 0,
                          x: -20,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05,
                        }}
                        className="relative"
                      >
                        {/* Single question overlay - only on first question */}
                        {index === 0 && showSingleQuestionOverlay && (
                          <motion.div
                            initial={{
                              opacity: 0,
                            }}
                            animate={{
                              opacity: 1,
                            }}
                            exit={{
                              opacity: 0,
                            }}
                            transition={{
                              duration: 0.3,
                            }}
                            className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-xl"
                          >
                            <motion.div
                              animate={{
                                rotate: 360,
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            >
                              <SparklesIcon
                                className="w-8 h-8"
                                style={{
                                  color: "#10B981",
                                }}
                              />
                            </motion.div>
                          </motion.div>
                        )}
                        <QuestionAccordion
                          question={question}
                          index={index + 1}
                        />
                      </motion.div>
                    )
                  )
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No value questions data</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
