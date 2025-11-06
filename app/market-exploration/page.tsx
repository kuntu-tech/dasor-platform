"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RotateCcw, ChevronDown, ArrowRight } from "lucide-react";
import { DetailModal } from "@/components/DetailModal";
import { ValueQuestionsSection } from "@/components/ValueQuestionsSection";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
interface MarketSegment {
  id: string;
  title: string;
  valueAnalysis: string[];
  capabilities: string[];
  isNew?: boolean;
  hasNewContent?: boolean;
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
  fullDetails: string;
  marketsData: MarketSegment[];
}
interface MarketExplorationPageProps {
  marketsData?: any[]; // 兼容新接口段数据
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
  | "delete-question";
export default function MarketExplorationPage({
  marketsData,
}: MarketExplorationPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [segmentsData, setSegmentsData] = useState<any[] | undefined>(
    marketsData
  );
  useEffect(() => {
    console.log("segmentsData", segmentsData);
    if (!segmentsData) {
      try {
        const raw = localStorage.getItem("marketsData");
        if (raw) setSegmentsData(JSON.parse(raw));
      } catch {}
    }
  }, [segmentsData]);

  // 加载指定版本的数据
  const loadVersionData = async (runId: string) => {
    try {
      console.log("Loading data for run_id:", runId);

      // 显示加载状态
      setIsGenerating(true);
      setGenerationProgress(0);

      // 调用 API 获取对应版本的数据
      setGenerationProgress(30);
      const response = await fetch(`/api/run-result/${runId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch version data: ${response.status}`);
      }

      setGenerationProgress(60);
      const result = await response.json();
      const runResult = result.data;

      if (!runResult) {
        console.warn("No data found for run_id:", runId);
        setIsGenerating(false);
        setGenerationProgress(0);
        return;
      }

      console.log("Loaded version data:", runResult);

      // 更新 localStorage
      setGenerationProgress(70);
      localStorage.setItem("run_result", JSON.stringify(runResult));

      // 如果有 segments 数据，更新页面
      setGenerationProgress(85);
      if (runResult.segments && Array.isArray(runResult.segments)) {
        const mapped = runResult.segments.map((seg: any) => ({
          id: seg.segmentId || seg.id || seg.name,
          name: seg.name,
          segmentId: seg.segmentId || seg.id,
          analysis: seg.analysis,
          valueQuestions: seg.valueQuestions,
        }));

        setSegmentsData(mapped);
        localStorage.setItem("marketsData", JSON.stringify(mapped));
      }

      // 更新 standalJson（如果存在）
      if (runResult.anchIndex !== undefined || runResult.segments) {
        localStorage.setItem(
          "standalJson",
          JSON.stringify({
            anchIndex: runResult.anchIndex,
            segments: runResult.segments || [],
          })
        );
      }

      setGenerationProgress(100);

      // 延迟后隐藏加载状态
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 300);
    } catch (error) {
      console.error("Error loading version data:", error);
      setIsGenerating(false);
      setGenerationProgress(0);
      alert(
        `加载版本数据失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
    }
  };

  // 获取版本列表的函数
  const fetchVersions = async () => {
    if (!user?.id) {
      console.warn("No user ID, cannot fetch versions");
      return;
    }

    try {
      // 从 localStorage 获取 task_id
      const runResultStr = localStorage.getItem("run_result");
      let taskId = "";

      if (runResultStr) {
        try {
          const runResult = JSON.parse(runResultStr);
          taskId = runResult.task_id || "";
          console.log(
            "Fetching versions for task_id:",
            taskId,
            "user_id:",
            user.id
          );
        } catch (e) {
          console.error("Failed to parse run_result:", e);
        }
      }

      if (!taskId) {
        console.warn("No task_id found, cannot fetch versions");
        return;
      }

      // 调用 API 获取版本列表（必须同时提供 user_id 和 task_id）
      const apiUrl = `/api/run-results?user_id=${user.id}&task_id=${taskId}`;

      console.log("Fetching versions from:", apiUrl);
      console.log("Query params - user_id:", user.id, "task_id:", taskId);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch versions: ${response.status}`);
      }

      const result = await response.json();
      const runResults = result.data || [];
      console.log("Fetched run results:", runResults);

      // 将 run_id (r_1, r_2...) 映射为显示格式 (v1, v2...)
      const versionList = runResults.map((item: any) => {
        const runId = item.run_id || "";
        // 提取数字部分：r_1 -> 1, r_2 -> 2
        const match = runId.match(/r_(\d+)/);
        const number = match ? match[1] : "";
        const display = number ? `v${number}` : runId;

        return {
          display,
          runId,
        };
      });

      // 按 run_id 降序排列（最新的在前）
      versionList.sort((a: any, b: any) => {
        const numA = parseInt(a.runId.match(/r_(\d+)/)?.[1] || "0");
        const numB = parseInt(b.runId.match(/r_(\d+)/)?.[1] || "0");
        return numB - numA;
      });

      console.log("Version list after sorting:", versionList);

      setVersions(versionList);

      // 创建映射表
      const map = new Map<string, string>();
      versionList.forEach((v: any) => {
        map.set(v.display, v.runId);
      });
      setVersionMap(map);

      // 设置默认选中第一个版本（最新的版本）
      if (versionList.length > 0) {
        const firstVersion = versionList[0];
        console.log("Setting selected version to:", firstVersion.display);
        setSelectedVersion(firstVersion.display);
        // 自动加载第一个版本的数据
        if (firstVersion.runId) {
          await loadVersionData(firstVersion.runId);
        }
      } else {
        console.warn("No versions found in the list");
      }
    } catch (error) {
      console.error("Error fetching versions:", error);
    }
  };

  // 初始加载时获取版本列表
  useEffect(() => {
    fetchVersions();
  }, [user?.id]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(
    null
  );
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const [refreshType, setRefreshType] = useState<RefreshType>("none");
  const [refreshKey, setRefreshKey] = useState(0);
  const [versions, setVersions] = useState<
    Array<{ display: string; runId: string }>
  >([]);
  const [versionMap, setVersionMap] = useState<Map<string, string>>(new Map()); // display -> runId 映射
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    // 调用 feedback-mrf/process 接口
    try {
      // 从 localStorage 获取必要的数据
      const runResultStr = localStorage.getItem("run_result");
      const dbConnectionDataStr = localStorage.getItem("dbConnectionData");

      let runResult: any = null;
      let connectionId = "";

      if (runResultStr) {
        try {
          runResult = JSON.parse(runResultStr);
        } catch (e) {
          console.error("Failed to parse run_result:", e);
        }
      }

      if (dbConnectionDataStr) {
        try {
          const dbConnectionData = JSON.parse(dbConnectionDataStr);
          connectionId =
            dbConnectionData.connection_id || dbConnectionData.id || "";
        } catch (e) {
          console.error("Failed to parse dbConnectionData:", e);
        }
      }

      // 根据选中的版本获取对应的 run_id
      const baseRunId =
        versionMap.get(selectedVersion) || runResult?.run_id || "r_1";

      // 准备请求参数
      const requestBody = {
        feedback_text: inputValue.trim(),
        base_run_id: baseRunId,
        policy: "standard",
        user_id: user?.id || "4748756a-5682-4807-8ced-dd4c3aea5a08",
        task_id: runResult?.task_id || "5b0f631a-8a83-4836-a2fb-ad4219cdf358",
        connection_id: connectionId || "c433813a-da09-436f-81f0-d383261f5890",
      };

      console.log("Calling feedback-mrf/process with:", requestBody);

      setIsGenerating(true);
      setGenerationProgress(0);

      // 第一步：调用 feedback-mrf/process 接口 (0% -> 30%)
      setGenerationProgress(10);
      const response = await fetch(
        "http://192.168.30.159:8900/api/v1/feedback-mrf/process",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }

      setGenerationProgress(30); // feedback-mrf/process 完成，进度 30%
      const result = await response.json();
      console.log("Feedback API response:", result);

      // 检查返回结果中是否有 run_results
      if (!result.run_results) {
        throw new Error("No run_results in feedback API response");
      }

      // 第二步：调用 standal_sql 接口 (30% -> 70%)
      console.log("Calling standal_sql with run_results...");
      setGenerationProgress(40); // 开始调用 standal_sql，进度 40%
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 600_000); // 10分钟超时

      const standalRes = await fetch(
        "http://192.168.30.159:8900/api/v1/standal_sql",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ run_results: result.run_results }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);
      setGenerationProgress(70); // standal_sql 调用完成，进度 70%
      const standalText = await standalRes.text();
      console.log("standal_sql response:", standalText);

      let standalJson: any = null;
      try {
        standalJson = JSON.parse(standalText);
      } catch (e) {
        console.error("Failed to parse standal_sql response:", e);
        throw new Error("Invalid JSON response from standal_sql");
      }

      if (!standalRes.ok) {
        throw new Error(
          typeof standalJson === "string"
            ? standalJson.slice(0, 200)
            : standalJson?.error || `standal_sql HTTP ${standalRes.status}`
        );
      }

      console.log("standal_sql completed successfully:", standalJson);

      // 第三步：处理数据并更新 localStorage (70% -> 90%)
      setGenerationProgress(80);
      if (standalJson?.run_results?.run_result) {
        localStorage.setItem(
          "standalJson",
          JSON.stringify({
            anchIndex: standalJson.run_results?.run_result?.anchIndex,
            segments: standalJson.run_results.run_result.segments,
          })
        );

        // 更新 run_result（必须在调用 fetchVersions 之前更新）
        const updatedRunResult = standalJson.run_results.run_result;
        localStorage.setItem("run_result", JSON.stringify(updatedRunResult));

        // 更新 segmentsData 以刷新页面
        setGenerationProgress(85);
        const segments = updatedRunResult.segments || [];
        const mapped = segments.map((seg: any) => ({
          id: seg.segmentId || seg.id || seg.name,
          name: seg.name,
          segmentId: seg.segmentId || seg.id,
          analysis: seg.analysis,
          valueQuestions: seg.valueQuestions,
        }));

        setSegmentsData(mapped);
        localStorage.setItem("marketsData", JSON.stringify(mapped));

        // 第四步：刷新版本列表 (90% -> 100%)
        setGenerationProgress(90);
        // 确保在 localStorage 更新后再调用，并添加延迟确保数据已写入
        setTimeout(async () => {
          console.log("Refreshing versions after data update...");
          await fetchVersions();
          setGenerationProgress(100); // 所有操作完成，进度 100%
        }, 100);
      } else {
        // 如果没有数据，直接完成
        setGenerationProgress(100);
      }

      // 原有的刷新逻辑（保留用于 UI 更新）
      const lowerInput = inputValue.toLowerCase();
      const isVersionChange = lowerInput.includes("change segment");
      let detectedRefreshType: RefreshType = "none";
      if (lowerInput.includes("add segment")) {
        detectedRefreshType = "add-segment";
      } else if (lowerInput.includes("merge segments")) {
        detectedRefreshType = "merge-segments";
      } else if (lowerInput.includes("edit d1")) {
        detectedRefreshType = "edit-d1";
      } else if (lowerInput.includes("edit d2")) {
        detectedRefreshType = "edit-d2";
      } else if (lowerInput.includes("edit d3")) {
        detectedRefreshType = "edit-d3";
      } else if (lowerInput.includes("edit d4")) {
        detectedRefreshType = "edit-d4";
      } else if (lowerInput.includes("add question")) {
        detectedRefreshType = "add-question";
      } else if (lowerInput.includes("delete question")) {
        detectedRefreshType = "delete-question";
      } else if (lowerInput.includes("edit question")) {
        detectedRefreshType = "edit-question";
      } else if (lowerInput.includes("domain")) {
        detectedRefreshType = "domain";
      } else if (lowerInput.includes("segment")) {
        detectedRefreshType = "segment";
      } else if (lowerInput.includes("question list")) {
        detectedRefreshType = "question-list";
      } else if (lowerInput.includes("question")) {
        detectedRefreshType = "question";
      }
      setRefreshType(detectedRefreshType);

      // 延迟后重置状态
      setTimeout(() => {
        if (isVersionChange) {
          const currentVersionNumber = parseInt(
            selectedVersion.replace("v", "")
          );
          const nextVersion = `v${currentVersionNumber + 1}`;
          setSelectedVersion(nextVersion);
          const scrollToTop = () => {
            const currentPosition = window.pageYOffset;
            if (currentPosition > 0) {
              window.scrollTo(0, currentPosition - currentPosition / 15);
              requestAnimationFrame(scrollToTop);
            }
          };
          scrollToTop();
          setTimeout(() => {
            setIsGenerating(false);
            setInputValue("");
            setGenerationProgress(0);
            setRefreshType("none");
          }, 1000);
        } else {
          setIsGenerating(false);
          setInputValue("");
          setGenerationProgress(0);
          setRefreshType("none");
          setRefreshKey((prev) => prev + 1);
        }
      }, 500);
    } catch (error) {
      console.error("Error calling feedback API:", error);
      alert(`发送失败: ${error instanceof Error ? error.message : "未知错误"}`);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };
  const handleGenerateApp = () => {
    console.log("Generating ChatApp");
    // 保留由 ValueQuestionsSection 写入的 selectedProblems（仅当前选中 Tab 的 valueQuestions）
    router.push("/generate");
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  return (
    <div className="w-full min-h-screen bg-white pb-32">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-5xl font-bold text-gray-900">Business Insight</h1>
          {/* Right side controls */}
          <div className="flex items-center gap-4">
            {/* Version Selector */}
            <div className="relative">
              <button
                onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {selectedVersion ||
                    (versions.length > 0 ? versions[0].display : "v1")}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
              {/* Dropdown Menu */}
              {isVersionDropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {versions.length > 0 ? (
                    versions.map((version) => (
                      <button
                        key={version.display}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          // 如果选择的是当前版本，不重复加载
                          if (version.display === selectedVersion) {
                            setIsVersionDropdownOpen(false);
                            return;
                          }

                          console.log("Version switch clicked:", {
                            display: version.display,
                            runId: version.runId,
                            currentVersion: selectedVersion,
                          });

                          setSelectedVersion(version.display);
                          setIsVersionDropdownOpen(false);

                          // 切换版本时加载对应的数据
                          try {
                            await loadVersionData(version.runId);
                          } catch (error) {
                            console.error(
                              "Failed to load version data:",
                              error
                            );
                          }
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                          version.display === selectedVersion
                            ? "bg-gray-100 font-medium text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {version.display}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      暂无版本
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Generate ChatApp Button */}
            <button
              onClick={handleGenerateApp}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-black border-2 border-black rounded-lg font-medium text-white transition-all duration-200 hover:bg-white hover:text-black hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-black disabled:hover:text-white"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="whitespace-nowrap">Generate</span>
            </button>
          </div>
        </div>
        {/* ValueQuestionsSection with version-based animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedVersion}
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
          >
            <ValueQuestionsSection
              onAnalysisClick={(analysis) =>
                setSelectedAnalysis(analysis as any)
              }
              isGenerating={isGenerating}
              generationProgress={generationProgress}
              refreshType={refreshType}
              refreshKey={refreshKey}
              segmentsData={segmentsData as any}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Bottom Input Box */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-6 px-8 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray-300 rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden">
            <div className="flex items-end gap-3 p-4">
              {/* Text Input */}
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGenerating}
                placeholder="Edit D2 Persona to xxx"
                rows={1}
                className="flex-1 resize-none bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-base py-2 max-h-48 overflow-y-auto disabled:opacity-50"
                style={{
                  minHeight: "24px",
                }}
              />
              {/* Send Button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputValue.trim() || isGenerating}
                className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
                  inputValue.trim() && !isGenerating
                    ? "text-black hover:bg-gray-100"
                    : "text-gray-300 cursor-not-allowed"
                }`}
                aria-label="Send message"
              >
                <Send className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {selectedAnalysis && (
        <DetailModal
          analysis={selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
        />
      )}
    </div>
  );
}
