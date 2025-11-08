"use client";
import React, { useEffect, useState, useCallback } from "react";
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
  | "delete-question"
  | "switching-version";
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
    // 如果正在生成中，不允许切换版本
    if (isGenerating) {
      console.warn("Cannot switch version while generating is in progress");
      return;
    }

    try {
      console.log("Loading data for run_id:", runId);

      // 显示加载状态（切换版本）
      setIsGenerating(true);
      setGenerationProgress(0);
      setRefreshType("switching-version");

      // 从 localStorage 获取 user_id 和 task_id
      const runResultStr = localStorage.getItem("run_result");
      let userId = user?.id || "";
      let taskId = "";

      if (runResultStr) {
        try {
          const runResult = JSON.parse(runResultStr);
          taskId = runResult.task_id || "";
        } catch (e) {
          console.error("Failed to parse run_result:", e);
        }
      }

      if (!userId || !taskId) {
        console.error("Missing user_id or task_id, cannot load version data");
        setIsGenerating(false);
        setGenerationProgress(0);
        return;
      }

      // 调用 API 获取对应版本的数据（需要传递 user_id 和 task_id）
      setGenerationProgress(30);
      const response = await fetch(
        `/api/run-result/${runId}?user_id=${userId}&task_id=${taskId}`
      );

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
        setRefreshType("none");
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
  const fetchVersions = async (shouldLoadData = true) => {
    if (!user?.id) {
      console.warn("No user ID, cannot fetch versions");
      return;
    }

    try {
      // 只从 run_result 中获取 task_id，不更新，保持不变
      const runResultStr = localStorage.getItem("run_result");
      let taskId = "";

      if (runResultStr) {
        try {
          const runResult = JSON.parse(runResultStr);
          taskId = runResult.task_id || "";
        } catch (e) {
          console.error("Failed to parse run_result:", e);
        }
      }

      console.log(
        "Fetching versions for task_id:",
        taskId,
        "user_id:",
        user.id,
        "shouldLoadData:",
        shouldLoadData
      );

      if (!taskId) {
        console.warn("No task_id found, cannot fetch versions");
        return;
      }

      // 调用 API 获取版本列表（必须同时提供 user_id 和 task_id）
      const apiUrl = `/api/run-results?user_id=${user.id}&task_id=${taskId}`;

      console.log("Fetching versions from:", apiUrl);
      console.log("Query params - user_id:", user.id, "task_id:", taskId);

      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store", // 禁用缓存，避免使用缓存的错误响应
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: "Unknown error",
            details: `HTTP ${response.status}`,
          }));
          throw new Error(
            errorData.details || `Failed to fetch versions: ${response.status}`
          );
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
          console.log("Total versions found:", versionList.length);

          // 只有在 shouldLoadData 为 true 时才加载数据
          // 首次进入时（shouldLoadData = false），只设置选中版本，不加载数据
          if (shouldLoadData) {
            setSelectedVersion(firstVersion.display);
            // 自动加载第一个版本的数据
            if (firstVersion.runId) {
              await loadVersionData(firstVersion.runId);
            }
          } else {
            // 首次进入时，只设置选中版本，不加载数据（避免刷新页面）
            // 但如果 selectedVersion 为空，则设置默认值
            if (!selectedVersion) {
              setSelectedVersion(firstVersion.display);
            }
          }
        } else {
          console.warn("No versions found in the list");
        }
      } catch (error) {
        console.error("Error fetching versions:", error);
      }
    } catch (error) {
      console.error("Error in fetchVersions:", error);
    }
  };

  // 初始加载时获取版本列表（不加载数据，避免刷新页面）
  useEffect(() => {
    // 检查是否是首次生成进入（从 connect-flow 跳转过来的）
    // 如果是首次生成进入，localStorage 中应该已经有 run_result 和 marketsData
    const runResultStr = localStorage.getItem("run_result");
    const marketsDataStr = localStorage.getItem("marketsData");

    // 如果已经有数据，说明是首次生成进入，不需要调用接口获取版本列表
    if (runResultStr && marketsDataStr) {
      console.log("首次生成进入，已有数据，跳过版本列表接口调用");

      // 只从 localStorage 中提取版本信息（如果有的话）
      try {
        const runResult = JSON.parse(runResultStr);
        if (runResult.run_id) {
          // 提取 run_id 并设置版本显示
          const match = runResult.run_id.match(/r_(\d+)/);
          const number = match ? match[1] : "";
          const display = number ? `v${number}` : runResult.run_id;

          // 设置版本信息（不调用接口）
          setVersions([{ display, runId: runResult.run_id }]);
          setVersionMap(new Map([[display, runResult.run_id]]));
          if (!selectedVersion) {
            setSelectedVersion(display);
          }

          // task_id 只从 run_result 中读取，不更新，保持不变
          // 不需要保存到 localStorage 或更新状态
        }
      } catch (e) {
        console.error("Failed to parse run_result:", e);
      }

      return; // 首次生成进入，不调用接口
    }

    // 如果不是首次生成进入（刷新页面或直接访问），才调用接口获取版本列表
    console.log("非首次进入，调用接口获取版本列表");
    fetchVersions(false);
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
  // task_id 只从 run_result 中读取，不保存状态，不更新

  const pollJobProgress = useCallback(
    async (
      jobId: string,
      onProgress?: (
        progress: number | null,
        status: string | null,
        data: any
      ) => void,
      interval = 10000,
      maxMinutes = 6
    ) => {
      const maxTime = maxMinutes * 60 * 1000;
      const start = Date.now();
      let last: any = null;

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

        await new Promise((resolve) => setTimeout(resolve, interval));
        last = data;
      }

      return { ...last, status: "timeout", error: "Polling timed out" };
    },
    []
  );

  const runFullRegeneration = useCallback(async () => {
    if (typeof window === "undefined") {
      throw new Error(
        "Full regeneration is only available in the browser context"
      );
    }

    const dbConnectionDataStr = localStorage.getItem("dbConnectionData");
    if (!dbConnectionDataStr) {
      throw new Error("Missing connection data for full regeneration");
    }

    let projectId = "";
    let accessToken = "";
    let connectionId = "";
    try {
      const dbConnectionData = JSON.parse(dbConnectionDataStr);
      projectId =
        dbConnectionData.connectionUrl ||
        dbConnectionData.projectId ||
        dbConnectionData.project_id ||
        "";
      accessToken =
        dbConnectionData.accessToken ||
        dbConnectionData.apiKey ||
        dbConnectionData.access_token ||
        "";
      connectionId =
        dbConnectionData.connectionId ||
        dbConnectionData.connection_id ||
        dbConnectionData.id ||
        "";
    } catch (error) {
      console.error("Failed to parse dbConnectionData for regeneration", error);
      throw new Error("Invalid connection data for full regeneration");
    }

    if (!projectId || !accessToken) {
      throw new Error("Incomplete connection data for full regeneration");
    }

    setGenerationProgress((prev) => Math.max(prev, 35));

    const validateRes = await fetch("/api/validate-connection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        accessToken,
      }),
    });

    const validateText = await validateRes.text();
    let validateData: any = null;
    try {
      validateData = validateText ? JSON.parse(validateText) : {};
    } catch (error) {
      throw new Error(
        `Failed to validate connection: ${validateText.slice(0, 200)}`
      );
    }

    if (!validateRes.ok) {
      throw new Error(
        validateData?.error ||
          validateData?.message ||
          `Connection validation failed: ${validateRes.status}`
      );
    }

    const validationRequestBody = {
      user_id: user?.id || validateData?.user_id || "",
      connection_id: connectionId || validateData?.connection_id || "",
      project_id: projectId,
      access_token: accessToken,
    };

    if (!validationRequestBody.connection_id) {
      throw new Error("Missing connection_id for full regeneration");
    }

    const dataValidationRes = await fetch(
      "https://data-validation.datail.ai/api/v1/validate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validationRequestBody),
      }
    );

    const dataValidationText = await dataValidationRes.text();
    let dataValidation: any = null;
    try {
      dataValidation = dataValidationText ? JSON.parse(dataValidationText) : {};
    } catch (error) {
      throw new Error(
        `Failed to parse validation response: ${dataValidationText.slice(
          0,
          200
        )}`
      );
    }

    if (!dataValidationRes.ok) {
      throw new Error(
        dataValidation?.error ||
          dataValidation?.message ||
          `Data validation failed: ${dataValidationRes.status}`
      );
    }

    if (dataValidation?.validation_report?.summary?.status === "unusable") {
      throw new Error(
        dataValidation?.validation_report?.summary?.note ||
          "Data validation reported unusable data"
      );
    }

    const runPayload = {
      user_id: validationRequestBody.user_id,
      trace_id: dataValidation?.trace_id,
      connection_id: validationRequestBody.connection_id,
      data_structure: dataValidation?.data_structure,
    };

    if (!runPayload.trace_id || !runPayload.data_structure) {
      throw new Error("Incomplete pipeline payload after validation");
    }

    setGenerationProgress((prev) => Math.max(prev, 45));

    const pipelineRes = await fetch(
      "https://business-insight.datail.ai/api/v1/pipeline/run",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(runPayload),
      }
    );

    const pipelineText = await pipelineRes.text();
    let pipelineData: any = null;
    try {
      pipelineData = pipelineText ? JSON.parse(pipelineText) : {};
    } catch (error) {
      throw new Error(
        `Failed to parse pipeline response: ${pipelineText.slice(0, 200)}`
      );
    }

    if (!pipelineRes.ok) {
      throw new Error(
        pipelineData?.error ||
          pipelineData?.message ||
          `Pipeline run failed: ${pipelineRes.status}`
      );
    }

    if (!pipelineData?.job_id) {
      throw new Error("Pipeline run did not return a job_id");
    }

    const pollingResult = await pollJobProgress(
      pipelineData.job_id,
      (progress) => {
        if (typeof progress === "number") {
          const mapped = 45 + Math.floor((progress / 100) * 25); // 45% -> 70%
          setGenerationProgress((prev) => Math.max(prev, mapped));
        }
      },
      10000,
      6
    );

    if (pollingResult.status !== "completed") {
      throw new Error(
        pollingResult.error ||
          `Pipeline job ended with status: ${pollingResult.status}`
      );
    }

    setGenerationProgress((prev) => Math.max(prev, 70));

    return pollingResult;
  }, [pollJobProgress, user?.id]);

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

      // 获取 task_id：只从 run_result 中读取，不更新，保持不变
      const taskId = runResult?.task_id || "";

      if (!taskId) {
        alert("无法获取 task_id，请重新连接数据库");
        return;
      }

      console.log("聊天生成：使用 task_id（从 run_result 读取）:", taskId);

      // 准备请求参数
      const requestBody = {
        feedback_text: inputValue.trim(),
        base_run_id: baseRunId,
        policy: "standard",
        user_id: user?.id,
        task_id: taskId,
        connection_id: connectionId,
        current_data: runResult,
      };

      console.log("Calling feedback-mrf/process with:", requestBody);

      setIsGenerating(true);
      setGenerationProgress(0);
      // 生成开始时关闭版本下拉框
      setIsVersionDropdownOpen(false);

      // 第一步：调用 feedback-mrf/process 接口 (0% -> 30%)
      setGenerationProgress(10);
      const response = await fetch(
        // "http://localhost:8000/api/v1/feedback-mrf/process",
        "https://business-insight.datail.ai/api/v1/feedback-mrf/process",
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

      let runResultsPayload = result.run_results;

      if (result.status === "requires_full_regeneration") {
        console.log("Feedback indicates full regeneration is required");
        const regenerationResult = await runFullRegeneration();
        runResultsPayload = regenerationResult?.run_results;
        if (!runResultsPayload) {
          throw new Error(
            "Full regeneration completed without returning run_results"
          );
        }
      }

      // 检查返回结果中是否有 run_results
      if (!runResultsPayload) {
        throw new Error("No run_results available for standal_sql request");
      }

      // 第二步：调用 standal_sql 接口 (30% -> 70%)
      console.log("Calling standal_sql with run_results...");
      setGenerationProgress((prev) => Math.max(prev, 40)); // 开始调用 standal_sql，进度 40%
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 600_000); // 10分钟超时

      const standalRes = await fetch(
        "https://business-insight.datail.ai/api/v1/standal_sql",
        // "http://192.168.30.159:8900/api/v1/standal_sql",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ run_results: runResultsPayload }),
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
        // 确保在 localStorage 更新后再调用，并添加延迟确保数据库写入完成
        // 使用重试机制，确保能够获取到最新版本
        const refreshVersionsWithRetry = async (
          retries = 5,
          delay = 1000,
          initialDelay = 2000
        ) => {
          // 记录刷新前的版本数量
          const previousVersionCount = versions.length;
          console.log(
            `Previous version count: ${previousVersionCount}, waiting ${initialDelay}ms for database write...`
          );

          // 先等待初始延迟，给数据库足够时间写入
          await new Promise((resolve) => setTimeout(resolve, initialDelay));

          for (let i = 0; i < retries; i++) {
            try {
              console.log(
                `Refreshing versions (attempt ${i + 1}/${retries})...`
              );

              // 调用 fetchVersions 获取最新版本列表
              // 注意：这里不能直接调用 fetchVersions，因为它会触发 loadVersionData
              // 我们需要手动获取版本列表并检查数量
              const taskId =
                localStorage.getItem("originalTaskId") ||
                JSON.parse(localStorage.getItem("run_result") || "{}")
                  ?.task_id ||
                "";

              if (!taskId) {
                console.warn("No task_id found, cannot refresh versions");
                setGenerationProgress(100);
                return;
              }

              const apiUrl = `/api/run-results?user_id=${user?.id}&task_id=${taskId}`;
              const response = await fetch(apiUrl, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
                cache: "no-store",
              });

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
              }

              const result = await response.json();
              const runResults = result.data || [];
              const currentVersionCount = runResults.length;

              console.log(
                `Current version count: ${currentVersionCount}, previous: ${previousVersionCount}`
              );

              // 检查版本数量是否增加（说明新版本已写入数据库）
              if (currentVersionCount > previousVersionCount) {
                console.log(
                  `New version detected! Count increased from ${previousVersionCount} to ${currentVersionCount}`
                );
                // 版本数量增加了，调用完整的 fetchVersions 来更新 UI（需要加载数据）
                await fetchVersions(true);
                setGenerationProgress(100); // 所有操作完成，进度 100%
                return;
              } else if (i < retries - 1) {
                // 版本数量还没增加，继续等待并重试
                console.log(
                  `Version count not increased yet, waiting ${delay}ms before retry...`
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
              } else {
                // 最后一次重试，即使版本数量没增加也更新（可能是数据库延迟）
                console.log("Max retries reached, updating versions anyway...");
                await fetchVersions(true);
                setGenerationProgress(100);
              }
            } catch (error) {
              console.error(
                `Error refreshing versions (attempt ${i + 1}):`,
                error
              );
              if (i < retries - 1) {
                // 如果不是最后一次重试，等待后重试
                await new Promise((resolve) => setTimeout(resolve, delay));
              } else {
                // 最后一次重试失败，仍然完成进度
                console.error("Failed to refresh versions after all retries");
                setGenerationProgress(100);
              }
            }
          }
        };

        // 立即开始刷新流程（内部会先等待初始延迟）
        refreshVersionsWithRetry();
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
                onClick={() => {
                  // 生成过程中不允许打开下拉框
                  if (isGenerating) {
                    return;
                  }
                  setIsVersionDropdownOpen(!isVersionDropdownOpen);
                }}
                disabled={isGenerating}
                className={`flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg transition-colors ${
                  isGenerating
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50 cursor-pointer"
                }`}
              >
                <RotateCcw className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {selectedVersion ||
                    (versions.length > 0 ? versions[0].display : "v1")}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
              {/* Dropdown Menu */}
              {isVersionDropdownOpen && !isGenerating && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {versions.length > 0 ? (
                    versions.map((version) => (
                      <button
                        key={version.display}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          // 生成过程中不允许切换版本（双重检查）
                          if (isGenerating) {
                            console.warn(
                              "Cannot switch version while generating"
                            );
                            setIsVersionDropdownOpen(false);
                            return;
                          }

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

                          // 先关闭下拉框，防止重复点击
                          setIsVersionDropdownOpen(false);

                          // 切换版本时加载对应的数据
                          // loadVersionData 内部会再次检查 isGenerating 状态
                          try {
                            await loadVersionData(version.runId);
                            // 只有在成功加载后才更新选中版本
                            setSelectedVersion(version.display);
                          } catch (error) {
                            console.error(
                              "Failed to load version data:",
                              error
                            );
                            // 如果加载失败，恢复原来的选中版本
                          }
                        }}
                        disabled={isGenerating}
                        className={`w-full px-4 py-2 text-left text-sm first:rounded-t-lg last:rounded-b-lg transition-colors ${
                          isGenerating
                            ? "opacity-50 cursor-not-allowed"
                            : version.display === selectedVersion
                            ? "bg-gray-100 font-medium text-gray-900 hover:bg-gray-100"
                            : "text-gray-700 hover:bg-gray-50"
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
                placeholder="Any thoughts or suggestions?"
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
