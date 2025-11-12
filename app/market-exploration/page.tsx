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
  marketsData?: any[]; // Compatible with new API segment payloads
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

  // Load data for a specific version
  const loadVersionData = async (runId: string) => {
    // Block switching when generation is in progress
    if (isGenerating) {
      console.warn("Cannot switch version while generating is in progress");
      return;
    }

    try {
      console.log("Loading data for run_id:", runId);

      // Show loading state while switching versions
      setIsGenerating(true);
      setGenerationProgress(0);
      setRefreshType("switching-version");

      // Read user_id and task_id from localStorage
      const runResultStr = localStorage.getItem("run_result");
      let userId = user?.id || "";
      let taskId = "";

      if (runResultStr) {
        try {
          const runResult = JSON.parse(runResultStr);
          taskId = runResult.task_id || "";
        } catch (e) {
          console.log("Failed to parse run_result:", e);
        }
      }

      if (!userId || !taskId) {
        console.log("Missing user_id or task_id, cannot load version data");
        setIsGenerating(false);
        setGenerationProgress(0);
        return;
      }

      // Call API to fetch version data (requires user_id and task_id)
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

      // Update localStorage
      setGenerationProgress(70);
      localStorage.setItem("run_result", JSON.stringify(runResult));

      // Update page state when segment data exists
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

      // Refresh standalJson cache when available
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

      // Hide loading state after a short delay
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
        setRefreshType("none");
      }, 300);
    } catch (error) {
      console.log("Error loading version data:", error);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Fetch the list of available versions
  const fetchVersions = async (shouldLoadData = true) => {
    if (!user?.id) {
      console.warn("No user ID, cannot fetch versions");
      return;
    }

    try {
      // Read task_id from run_result only; do not mutate or persist elsewhere
      const runResultStr = localStorage.getItem("run_result");
      let taskId = "";

      if (runResultStr) {
        try {
          const runResult = JSON.parse(runResultStr);
          taskId = runResult.task_id || "";
        } catch (e) {
          console.log("Failed to parse run_result:", e);
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

      // Call API to fetch version list (requires both user_id and task_id)
      const apiUrl = `/api/run-results?user_id=${user.id}&task_id=${taskId}`;

      console.log("Fetching versions from:", apiUrl);
      console.log("Query params - user_id:", user.id, "task_id:", taskId);

      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store", // Disable caching to avoid stale responses
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

        // Map run_id (r_1, r_2, ...) to display labels (v1, v2, ...)
        const versionList = runResults.map((item: any) => {
          const runId = item.run_id || "";
          // Extract numeric portion: r_1 -> 1, r_2 -> 2
          const match = runId.match(/r_(\d+)/);
          const number = match ? match[1] : "";
          const display = number ? `v${number}` : runId;

          return {
            display,
            runId,
          };
        });

        // Sort run_id descending so newest appears first
        versionList.sort((a: any, b: any) => {
          const numA = parseInt(a.runId.match(/r_(\d+)/)?.[1] || "0");
          const numB = parseInt(b.runId.match(/r_(\d+)/)?.[1] || "0");
          return numB - numA;
        });

        console.log("Version list after sorting:", versionList);

        setVersions(versionList);

        // Build a lookup map
        const map = new Map<string, string>();
        versionList.forEach((v: any) => {
          map.set(v.display, v.runId);
        });
        setVersionMap(map);

        // Default to the first (latest) version
        if (versionList.length > 0) {
          const firstVersion = versionList[0];
          console.log("Setting selected version to:", firstVersion.display);
          console.log("Total versions found:", versionList.length);

          // Load data only when shouldLoadData is true
          // On initial entry (shouldLoadData = false), only set selection
          if (shouldLoadData) {
            setSelectedVersion(firstVersion.display);
            // Auto-load the first version
            if (firstVersion.runId) {
              await loadVersionData(firstVersion.runId);
            }
          } else {
            // On first entry just set the selected version (avoid refresh)
            // If selectedVersion is empty, set the default
            if (!selectedVersion) {
              setSelectedVersion(firstVersion.display);
            }
          }
        } else {
          console.warn("No versions found in the list");
        }
      } catch (error) {
        console.log("Error fetching versions:", error);
      }
    } catch (error) {
      console.log("Error in fetchVersions:", error);
    }
  };

  // On mount, fetch version list (skip data load to avoid refresh)
  useEffect(() => {
    // Determine if we arrive immediately after generation (from connect-flow)
    // In that case, run_result and marketsData should already exist in localStorage
    const runResultStr = localStorage.getItem("run_result");
    const marketsDataStr = localStorage.getItem("marketsData");

    // If data already exists, treat as first-time entry and skip API call
    if (runResultStr && marketsDataStr) {
      console.log("First-time generation entry detected, skip version list API call");

      // Pull version info from localStorage when possible
      try {
        const runResult = JSON.parse(runResultStr);
        if (runResult.run_id) {
          // Extract run_id and compute display label
          const match = runResult.run_id.match(/r_(\d+)/);
          const number = match ? match[1] : "";
          const display = number ? `v${number}` : runResult.run_id;

          // Populate version state without API calls
          setVersions([{ display, runId: runResult.run_id }]);
          setVersionMap(new Map([[display, runResult.run_id]]));
          if (!selectedVersion) {
            setSelectedVersion(display);
          }

          // task_id stays read-only from run_result
        }
      } catch (e) {
        console.log("Failed to parse run_result:", e);
      }

      return; // Early exit for first-time generation entry
    }

    // For refresh or direct visit, fetch versions via API
    console.log("Not first-time entry, fetching version list via API");
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
  const [versionMap, setVersionMap] = useState<Map<string, string>>(new Map()); // display -> runId mapping
  // task_id is read only from run_result; do not store or update separately

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
      console.log("Failed to parse dbConnectionData for regeneration", error);
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

    // Invoke the feedback-mrf/process endpoint
    try {
      // Load required data from localStorage
      const runResultStr = localStorage.getItem("run_result");
      const dbConnectionDataStr = localStorage.getItem("dbConnectionData");

      let runResult: any = null;
      let connectionId = "";

      if (runResultStr) {
        try {
          runResult = JSON.parse(runResultStr);
        } catch (e) {
          console.log("Failed to parse run_result:", e);
        }
      }

      if (dbConnectionDataStr) {
        try {
          const dbConnectionData = JSON.parse(dbConnectionDataStr);
          connectionId =
            dbConnectionData.connection_id || dbConnectionData.id || "";
        } catch (e) {
          console.log("Failed to parse dbConnectionData:", e);
        }
      }

      // Determine run_id based on the selected version
      const baseRunId =
        versionMap.get(selectedVersion) || runResult?.run_id || "r_1";

      // Read task_id from run_result only; do not overwrite it
      const taskId = runResult?.task_id || "";

      if (!taskId) {
        // alert("Unable to retrieve task_id. Please reconnect the database");
        return;
      }

      console.log(
        "Chat generation: using task_id read from run_result:",
        taskId
      );

      // Assemble request payload
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
      // Close the version dropdown while generation runs
      setIsVersionDropdownOpen(false);

      // Step 1: call feedback-mrf/process (0% → 30%)
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
        // throw new Error(`API call failed: ${response.status} - ${errorText}`);
        console.log("Clarify your prompt so the system can continue");
        alert("Clarify your prompt so the system can continue");
      }

      setGenerationProgress(30); // feedback-mrf/process complete, progress 30%
      const result = await response.json();
      console.log("Feedback API response:", result);

      if (result.status === "ignored") {
        console.warn("Feedback ignored:", result?.message);
        alert("Clarify your prompt so the system can continue");
        setIsGenerating(false);
        setGenerationProgress(0);
        return;
      }

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

      // Ensure run_results exists in the response
      if (!runResultsPayload) {
        console.warn(
          "No run_results available for standal_sql request",
          result
        );
        alert("Clarify your prompt so the system can continue");
        setIsGenerating(false);
        setGenerationProgress(0);
        return;
      }

      // Step 2: call standal_sql (30% → 70%)
      console.log("Calling standal_sql with run_results...");
      setGenerationProgress((prev) => Math.max(prev, 40)); // standal_sql invocation starts, progress 40%
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 600_000); // 10 minute timeout

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
      setGenerationProgress(70); // standal_sql completed, progress 70%
      const standalText = await standalRes.text();
      console.log("standal_sql response:", standalText);

      let standalJson: any = null;
      try {
        standalJson = JSON.parse(standalText);
      } catch (e) {
        console.log("Failed to parse standal_sql response:", e);
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

      // Step 3: process data and update localStorage (70% → 90%)
      setGenerationProgress(80);
      if (standalJson?.run_results?.run_result) {
        localStorage.setItem(
          "standalJson",
          JSON.stringify({
            anchIndex: standalJson.run_results?.run_result?.anchIndex,
            segments: standalJson.run_results.run_result.segments,
          })
        );

        // Update run_result (must happen before calling fetchVersions)
        const updatedRunResult = standalJson.run_results.run_result;
        localStorage.setItem("run_result", JSON.stringify(updatedRunResult));

        // Refresh segmentsData so the UI updates immediately
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

        // Step 4: refresh version list (90% → 100%)
        setGenerationProgress(90);
        // Ensure localStorage is updated before fetching; add delay for DB writes
        // Use a retry loop to guarantee the latest version is retrieved
        const refreshVersionsWithRetry = async (
          retries = 5,
          delay = 1000,
          initialDelay = 2000
        ) => {
          // Record version count before refresh
          const previousVersionCount = versions.length;
          console.log(
            `Previous version count: ${previousVersionCount}, waiting ${initialDelay}ms for database write...`
          );

          // Wait the initial delay to give the database time to persist
          await new Promise((resolve) => setTimeout(resolve, initialDelay));

          for (let i = 0; i < retries; i++) {
            try {
              console.log(
                `Refreshing versions (attempt ${i + 1}/${retries})...`
              );

              // Fetch the newest version list
              // Note: do not call fetchVersions directly—it will trigger loadVersionData
              // Instead manually fetch and compare the list size
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

              // If the count increases, a new version has been persisted
              if (currentVersionCount > previousVersionCount) {
                console.log(
                  `New version detected! Count increased from ${previousVersionCount} to ${currentVersionCount}`
                );
                // New version detected: run fetchVersions to refresh UI (and load data)
                await fetchVersions(true);
                setGenerationProgress(100); // All done, progress 100%
                return;
              } else if (i < retries - 1) {
                // No new version yet—wait and retry
                console.log(
                  `Version count not increased yet, waiting ${delay}ms before retry...`
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
              } else {
                // Final retry: refresh anyway (database might still be syncing)
                console.log("Max retries reached, updating versions anyway...");
                await fetchVersions(true);
                setGenerationProgress(100);
              }
            } catch (error) {
              console.log(
                `Error refreshing versions (attempt ${i + 1}):`,
                error
              );
              if (i < retries - 1) {
                // Not the final retry yet; wait and retry
                await new Promise((resolve) => setTimeout(resolve, delay));
              } else {
                // Final retry failed; mark progress complete regardless
                console.log("Failed to refresh versions after all retries");
                setGenerationProgress(100);
              }
            }
          }
        };

        // Kick off the refresh workflow (internally waits for initial delay)
        refreshVersionsWithRetry();
      } else {
        // No data returned; finish immediately
        setGenerationProgress(100);
      }

      // Legacy refresh logic retained for UI updates
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

      // Reset state after a short delay
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
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };
  const handleGenerateApp = () => {
    console.log("Generating ChatApp");
    // Preserve selectedProblems saved by ValueQuestionsSection (current tab only)
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
                  // Disable dropdown while generation is running
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

                          // Double-check: disallow version switching while generating
                          if (isGenerating) {
                            console.warn(
                              "Cannot switch version while generating"
                            );
                            setIsVersionDropdownOpen(false);
                            return;
                          }

                          // Skip reload if user selects the current version
                          if (version.display === selectedVersion) {
                            setIsVersionDropdownOpen(false);
                            return;
                          }

                          console.log("Version switch clicked:", {
                            display: version.display,
                            runId: version.runId,
                            currentVersion: selectedVersion,
                          });

                          // Close dropdown to prevent repeated clicks
                          setIsVersionDropdownOpen(false);

                          // Load the corresponding data for the selected version
                          // loadVersionData performs its own isGenerating guard
                          try {
                            await loadVersionData(version.runId);
                            // Update selection only after data loads successfully
                            setSelectedVersion(version.display);
                          } catch (error) {
                            console.log("Failed to load version data:", error);
                            // On failure keep the previous version selection
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
                      No versions available
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
