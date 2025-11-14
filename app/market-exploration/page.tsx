"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  RotateCcw,
  ChevronDown,
  ArrowRight,
  X,
  CheckCircle2,
  Plus,
  GitMerge,
  BarChart3,
  User,
  TrendingUp,
  Shield,
  FileQuestion,
  Trash2,
  Edit,
  Tag,
} from "lucide-react";
import { DetailModal } from "@/components/DetailModal";
import { ValueQuestionsSection } from "@/components/ValueQuestionsSection";
import { CommandPalette } from "@/components/CommandPalette";
import { FloatingCommandButton } from "@/components/FloatingCommandButton";
import { SegmentSelectionModal } from "@/components/SegmentSelectionModal";
import {
  QuestionSelectionModal,
  QuestionOption,
} from "@/components/QuestionSelectionModal";
import { AnimatedDropdownMenu } from "@/components/ui/animated-dropdown-menu";
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
  | "delete-segments"
  | "edit-d1"
  | "edit-d2"
  | "edit-d3"
  | "edit-d4"
  | "add-question"
  | "edit-question"
  | "delete-question"
  | "switching-version";

type CommandPayload = {
  intent: string;
  selector: string;
  user_prompt: string;
  new_name?: string;
  target?: string;
  segments?: string[];
};

type CommandItem = {
  label: string;
  command: CommandPayload;
};

type SegmentSelectionCommand =
  | "Correct Segment"
  | "edit d1"
  | "edit d2"
  | "edit d3"
  | "edit d4"
  | "add question"
  | "delete question"
  | "edit question"
  | "rename segment";

const SEGMENT_SELECTION_COMMANDS = new Set<SegmentSelectionCommand>([
  "Correct Segment",
  "edit d1",
  "edit d2",
  "edit d3",
  "edit d4",
  "add question",
  "delete question",
  "edit question",
  "rename segment",
]);

const QUESTION_SELECTOR_COMMANDS = new Set<string>([
  "delete question",
  "edit question",
]);

const RENAME_SEGMENT_FLOW_COMMANDS = new Set<string>(["rename segment"]);

const deriveCommandKey = (item: CommandItem): string | null => {
  const normalized = item.label.toLowerCase();
  if (normalized.includes("correct segment"))
    return "Correct Segment";
  if (normalized.includes("add segments") || normalized.includes("add new segment manually")) return "add segment";
  if (normalized.includes("merge segments")) return "merge segments";
  if (normalized.includes("delete segments")) return "delete segments";
  if (normalized.includes("market size") || normalized.includes("adjust market size")) return "edit d1";
  if (normalized.includes("persona") || normalized.includes("adjust persona")) return "edit d2";
  if (normalized.includes("conversion") || normalized.includes("adjust conversion rhythm")) return "edit d3";
  if (normalized.includes("competitive") || normalized.includes("adjust competitive moat")) return "edit d4";
  if (normalized.includes("add new value question") || normalized.includes("add value questions")) return "add question";
  if (normalized.includes("delete value question")) return "delete question";
  if (normalized.includes("adjust value question")) return "edit question";
  if (normalized.includes("rename segment")) return "rename segment";
  if (normalized.includes("reanalyse") || normalized.includes("re-analyse") || normalized.includes("reanalyze")) return "reanalyse";
  return null;
};

const COMMAND_LIST: CommandItem[] = [
  {
    label: "Reanalyse",
    command: {
      intent: "domain_correction",
      target: "domain",
      selector: "domain",
      user_prompt: "",
    },
  },
  {
    label: "Correct Segment",
    command: {
      intent: "segment_edit",
      selector: "segments[segmentId=xxx]",
      user_prompt: "",
      target: "segments",
    },
  },
  {
    label: "Add segments",
    command: {
      intent: "segment_add",
      target: "segments",
      selector: "segments",
      user_prompt: "",
    },
  },
  {
    label: "Merge segments",
    command: {
      intent: "segment_merge",
      target: "segments",
      selector: "segments",
      segments: ["seg_01", "seg_xx"],
      user_prompt: "",
    },
  },
  {
    label: "Delete segments",
    command: {
      intent: "segment_remove",
      target: "segments",
      selector: "segments",
      segments: [],
      user_prompt: "",
    },
  },
  {
    label: "Adjust market size.",
    command: {
      intent: "analysis_edit",
      selector: "segments[segmentId=xxx].analysis.D1",
      user_prompt: "",
      target: "analysis",
    },
  },
  {
    label: "Adjust persona",
    command: {
      intent: "analysis_edit",
      target: "analysis",
      selector: "",
      user_prompt: "",
    },
  },
  {
    label: "Adjust conversion rhythm",
    command: {
      intent: "analysis_edit",
      target: "analysis",
      selector: "segments[segmentId=xxx].analysis.D3",
      user_prompt: "",
    },
  },
  {
    label: "Adjust competitive moat",
    command: {
      intent: "analysis_edit",
      target: "analysis",
      selector: "segments[segmentId=xxx].analysis.D4",
      user_prompt: "",
    },
  },
  {
    label: "Add value questions",
    command: {
      intent: "value_question_add",
      target: "valueQuestions",
      selector: "segments[segmentId=xxx].valueQuestions",
      user_prompt: "",
    },
  },
  {
    label: "Delete value question",
    command: {
      intent: "value_question_remove",
      target: "valueQuestions",
      selector: "segments[segmentId=xxx].valueQuestions[id=xxx]",
      user_prompt: "",
    },
  },
  {
    label: "Adjust value question",
    command: {
      intent: "value_question_edit",
      target: "valueQuestions",
      selector: "segments[segmentId=xxx].valueQuestions[id=xxx]",
      user_prompt: "",
    },
  },
  {
    label: "Rename segment",
    command: {
      intent: "segment_rename",
      target: "segments",
      selector: "segments[segmentId=xxx]",
      user_prompt: "",
      new_name: "",
    },
  },
];

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
        if (mapped.length > 0) {
          setSelectedSegmentName(mapped[0]?.name || "");
        }
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

  // Helper function to switch to the latest version
  const switchToLatestVersion = async () => {
    try {
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
      
      if (taskId && user?.id) {
        const apiUrl = `/api/run-results?user_id=${user.id}&task_id=${taskId}`;
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        
        if (response.ok) {
          const result = await response.json();
          const runResults = result.data || [];
          if (runResults.length > 0) {
            // Sort by run_id in descending order (newest first)
            runResults.sort((a: any, b: any) => {
              const numA = parseInt(a.run_id?.match(/r_(\d+)/)?.[1] || "0");
              const numB = parseInt(b.run_id?.match(/r_(\d+)/)?.[1] || "0");
              return numB - numA;
            });
            
            const latestRunId = runResults[0].run_id;
            const match = latestRunId.match(/r_(\d+)/);
            const number = match ? match[1] : "";
            const latestVersionDisplay = number ? `v${number}` : latestRunId;
            
            // Switch to the latest version and load data
            setSelectedVersion(latestVersionDisplay);
            await loadVersionData(latestRunId);
            console.log("[Switch Version] Switched to latest version:", latestVersionDisplay);
            return true;
          }
        }
      }
    } catch (error) {
      console.warn("[Switch Version] Failed to switch to latest version:", error);
    }
    return false;
  };

  // Function to fetch version list
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
  // task_id is only read from run_result, not saved in state, not updated
  const [selectedSegmentName, setSelectedSegmentName] = useState("");
  const [targetSegmentNameForCarousel, setTargetSegmentNameForCarousel] = useState<string | undefined>(undefined);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [segmentModalMode, setSegmentModalMode] =
    useState<"select" | "input" | "multiSelect">("select");
  const [segmentModalCommand, setSegmentModalCommand] = useState("");
  const [selectedCommand, setSelectedCommand] = useState("");
  const [selectedCommandPayload, setSelectedCommandPayload] =
    useState<CommandPayload | null>(null);
  const [selectedSegmentTag, setSelectedSegmentTag] = useState("");
  const [selectedMergeSegments, setSelectedMergeSegments] = useState<string[]>([]);
  const [isMergeSegmentsExpanded, setIsMergeSegmentsExpanded] = useState(false);
  const [isSegmentDropdownOpen, setIsSegmentDropdownOpen] = useState(false);
  const [segmentSearchQuery, setSegmentSearchQuery] = useState("");
  const [isSendButtonHovered, setIsSendButtonHovered] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTargetSegmentName, setRenameTargetSegmentName] = useState("");
  const [renameNewSegmentName, setRenameNewSegmentName] = useState("");
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionModalCommand, setQuestionModalCommand] = useState("");
  const [questionModalSegmentName, setQuestionModalSegmentName] = useState("");
  const [questionModalSegmentId, setQuestionModalSegmentId] = useState("");
  const [questionOptions, setQuestionOptions] = useState<QuestionOption[]>([]);
  const [selectedQuestionOption, setSelectedQuestionOption] =
    useState<QuestionOption | null>(null);

  const commandIconMap = useMemo(() => {
    return {
      "Correct Segment": <CheckCircle2 className="h-4 w-4" />,
      "add segment": <Plus className="h-4 w-4" />,
      "merge segments": <GitMerge className="h-4 w-4" />,
      "delete segments": <Trash2 className="h-4 w-4" />,
      "edit d1": <BarChart3 className="h-4 w-4" />,
      "edit d2": <User className="h-4 w-4" />,
      "edit d3": <TrendingUp className="h-4 w-4" />,
      "edit d4": <Shield className="h-4 w-4" />,
      "add question": <FileQuestion className="h-4 w-4" />,
      "delete question": <Trash2 className="h-4 w-4" />,
      "edit question": <Edit className="h-4 w-4" />,
      "rename segment": <Tag className="h-4 w-4" />,
      "reanalyse": <RotateCcw className="h-4 w-4" />,
    } as Record<string, React.ReactNode>;
  }, []);

  const buildQuestionOptions = useCallback(
    (segmentId: string, segmentName?: string): QuestionOption[] => {
      if (!Array.isArray(segmentsData) || segmentsData.length === 0) {
        return [];
      }

      const target = segmentsData.find((seg: any) => {
        const id =
          seg?.segmentId || seg?.segment_id || seg?.id || seg?.name || seg?.title;
        const name = seg?.name || seg?.title;
        return (
          (segmentId && id === segmentId) ||
          (segmentName && name === segmentName) ||
          false
        );
      });

      const valueQuestions = Array.isArray(target?.valueQuestions)
        ? target?.valueQuestions
        : [];

      return valueQuestions
        .map((q: any, index: number): QuestionOption | null => {
          const rawId =
            q?.id ??
            q?.questionId ??
            q?.question_id ??
            (q?.question ? `${segmentId || segmentName || "segment"}-${index}` : null);
          const text = q?.question ?? q?.text ?? "";
          if (!rawId || !text) return null;

          const tags: string[] = [];
          if (Array.isArray(q?.tags)) {
            tags.push(
              ...q.tags.filter(
                (tag: unknown): tag is string =>
                  typeof tag === "string" && tag.trim().length > 0
              )
            );
          }
          if (q?.intent) tags.push(String(q.intent));
          if (q?.answerShape) tags.push(String(q.answerShape));

          return {
            id: String(rawId),
            text: String(text),
            tags,
          } as QuestionOption;
        })
        .filter(
          (item: QuestionOption | null): item is QuestionOption => item !== null
        );
    },
    [segmentsData]
  );

  const getCommandLabel = useCallback((command: string) => {
    const matched = COMMAND_LIST.find(
      (item) => deriveCommandKey(item) === command
    );
    return matched?.label || command;
  }, []);

  const availableSegments = useMemo(() => {
    if (!Array.isArray(segmentsData)) return [];
    const dynamicSegments = segmentsData
      .map((segment: any) => segment?.name || segment?.title)
      .filter((name: string | undefined): name is string => !!name);
    return Array.from(new Set(dynamicSegments));
  }, [segmentsData]);

  const filteredSegments = useMemo(() => {
    const query = segmentSearchQuery.toLowerCase();
    return availableSegments.filter((segment) =>
      segment.toLowerCase().includes(query)
    );
  }, [availableSegments, segmentSearchQuery]);
  const topSegments = useMemo(
    () => filteredSegments.slice(0, 3),
    [filteredSegments]
  );
  const hasMoreSegments = filteredSegments.length > 3;
  const displayedSegmentName =
    selectedSegmentName || availableSegments[0] || "";

  const segmentIdMap = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(segmentsData)) {
      segmentsData.forEach((segment: any) => {
        const name = segment?.name || segment?.title;
        const rawId =
          segment?.segmentId ||
          segment?.segment_id ||
          segment?.id ||
          segment?.segment_id ||
          "";
        if (name && rawId) {
          map.set(String(name), String(rawId));
        }
      });
    }
    return map;
  }, [segmentsData]);

  useEffect(() => {
    if (!questionModalSegmentId && !questionModalSegmentName) {
      return;
    }
    const options = buildQuestionOptions(
      questionModalSegmentId,
      questionModalSegmentName
    );
    setQuestionOptions(options);
  }, [
    buildQuestionOptions,
    questionModalSegmentId,
    questionModalSegmentName,
  ]);

  const sanitizeUserPrompt = useCallback((value: string) => {
    return value
      .split(/\s+/)
      .filter((token) => token && !token.startsWith("@"))
      .join(" ")
      .trim();
  }, []);

  const resolveTargetFromSelector = useCallback((selector: string) => {
    if (!selector) return selectedCommand || "general";
    if (selector.includes(".analysis")) return "analysis";
    if (selector.includes("valueQuestions")) return "valueQuestions";
    if (selector.includes("domain")) return "domain";
    if (selector.includes("segments")) return "segment";
    return selectedCommand || "general";
  }, [selectedCommand]);

  useEffect(() => {
    if (segmentsData && segmentsData.length > 0 && !selectedSegmentName) {
      const firstName =
        segmentsData[0]?.name || (segmentsData[0] as any)?.title || "";
      if (firstName) {
        setSelectedSegmentName(firstName);
      }
    }
  }, [segmentsData, selectedSegmentName]);

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

  const resetSegmentDropdown = useCallback(() => {
    setIsSegmentDropdownOpen(false);
    setSegmentSearchQuery("");
  }, []);

  const resetQuestionSelection = useCallback(() => {
    setIsQuestionModalOpen(false);
    setQuestionModalCommand("");
    setQuestionModalSegmentName("");
    setQuestionModalSegmentId("");
    setQuestionOptions([]);
    setSelectedQuestionOption(null);
  }, []);

  const clearSelectedSegment = useCallback(() => {
    resetQuestionSelection();
    setSelectedSegmentTag("");
    setSelectedMergeSegments([]);
    setIsMergeSegmentsExpanded(false);
    setTargetSegmentNameForCarousel(undefined);
    // Clear the command when segment tag is removed
    setSelectedCommand("");
    setSelectedCommandPayload(null);
    setInputValue((prev) => sanitizeUserPrompt(prev));
  }, [resetQuestionSelection, sanitizeUserPrompt]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const textAfterAt = value.substring(lastAtIndex + 1);
      if (lastAtIndex === value.length - 1 || !textAfterAt.includes(" ")) {
        setSegmentSearchQuery(textAfterAt);
        setIsSegmentDropdownOpen(true);
      } else {
        resetSegmentDropdown();
      }
    } else {
      resetSegmentDropdown();
    }
  };

  const handleSegmentSelect = (segment: string) => {
    setSelectedSegmentTag(segment);
    // Sync with 3D carousel: update selectedSegmentName and targetSegmentNameForCarousel
    setSelectedSegmentName(segment);
    setTargetSegmentNameForCarousel(segment);
    
    // If no command is selected, set "Correct Segment" command
    if (!selectedCommand) {
      const correctSegmentCommand = COMMAND_LIST.find(
        (item) => deriveCommandKey(item) === "Correct Segment"
      );
      if (correctSegmentCommand) {
        setSelectedCommand("Correct Segment");
        setSelectedCommandPayload({ ...correctSegmentCommand.command });
      }
    }
    
    // Remove @ symbol and everything after it from input, since segment is shown as a tag
    setInputValue((prev) => {
      const sanitized = sanitizeUserPrompt(prev);
      const lastAtIndex = sanitized?.lastIndexOf("@") ?? -1;
      
      if (lastAtIndex >= 0) {
        // Remove @ and everything after it
        const beforeAt = sanitized.substring(0, lastAtIndex).trim();
        return beforeAt;
      }
      // If no @ exists, return empty or keep existing content
      return sanitized || "";
    });
    resetSegmentDropdown();
  };

  const handleSpecialCommand = useCallback(
    (command: SegmentSelectionCommand | "add-segment") => {
      if (SEGMENT_SELECTION_COMMANDS.has(command as SegmentSelectionCommand)) {
        const segmentCommand = COMMAND_LIST.find(
          (item) => deriveCommandKey(item) === command
        );
        if (!segmentCommand) {
          console.warn(
            `[Command] ${command} configuration missing`
          );
          return;
        }
        resetQuestionSelection();
        setSelectedCommand(command);
        setSelectedCommandPayload({ ...segmentCommand.command });
        setSelectedSegmentTag("");
        setInputValue("");
        if (command === "rename segment") {
          setRenameTargetSegmentName("");
          setRenameNewSegmentName("");
        }
        console.log("[Command Selected]", segmentCommand.command);
        resetSegmentDropdown();
        setSegmentModalMode("select");
        setSegmentModalCommand(command);
        setIsSegmentModalOpen(true);
        return;
      }

      if (command === "add-segment") {
        const addSegmentCommand = COMMAND_LIST.find(
          (item) => deriveCommandKey(item) === "add segment"
        );
        if (!addSegmentCommand) {
          console.warn("[Command] Add segment command configuration missing");
          return;
        }
        setSelectedCommand("add segment");
        setSelectedCommandPayload(addSegmentCommand.command);
        setSelectedSegmentTag("");
        setInputValue("");
        console.log("[Command Selected]", addSegmentCommand.command);
        setSegmentModalMode("select");
        setSegmentModalCommand("");
        setIsSegmentModalOpen(false);
      }
    },
    [resetQuestionSelection, resetSegmentDropdown]
  );

  const handleCommandListSelect = useCallback(
    (commandItem: CommandItem) => {
      const commandKey = deriveCommandKey(commandItem);
      if (!commandKey) {
        console.warn("[Command] Unsupported command mapping:", commandItem);
        return;
      }
      resetQuestionSelection();
      
      // Handle merge segments command with multi-select
      if (commandKey === "merge segments") {
        const mergeCommand = COMMAND_LIST.find(
          (item) => deriveCommandKey(item) === "merge segments"
        );
        if (!mergeCommand) {
          console.warn("[Command] Merge segments command configuration missing");
          return;
        }
        setSelectedCommand("merge segments");
        setSelectedCommandPayload({ ...mergeCommand.command });
        setSelectedSegmentTag("");
        setInputValue("");
        console.log("[Command Selected]", mergeCommand.command);
        resetSegmentDropdown();
        setSegmentModalMode("multiSelect");
        setSegmentModalCommand("merge segments");
        setIsSegmentModalOpen(true);
        return;
      }
      
      // Handle delete segments command with multi-select
      if (commandKey === "delete segments") {
        const deleteCommand = COMMAND_LIST.find(
          (item) => deriveCommandKey(item) === "delete segments"
        );
        if (!deleteCommand) {
          console.warn("[Command] Delete segments command configuration missing");
          return;
        }
        setSelectedCommand("delete segments");
        setSelectedCommandPayload({ ...deleteCommand.command });
        setSelectedSegmentTag("");
        setInputValue("");
        console.log("[Command Selected]", deleteCommand.command);
        resetSegmentDropdown();
        setSegmentModalMode("multiSelect");
        setSegmentModalCommand("delete segments");
        setIsSegmentModalOpen(true);
        return;
      }
      
      if (SEGMENT_SELECTION_COMMANDS.has(commandKey as SegmentSelectionCommand)) {
        handleSpecialCommand(commandKey as SegmentSelectionCommand);
        return;
      }
      setSelectedCommand(commandKey);
      setSelectedCommandPayload(commandItem.command);
      if (commandKey !== "Correct Segment") {
        setSelectedSegmentTag("");
      }
      console.log("[Command Selected]", commandItem.command);
      setInputValue("");
      resetSegmentDropdown();
    },
    [handleSpecialCommand, resetQuestionSelection, resetSegmentDropdown]
  );

  const commandOptions = useMemo(
    () =>
      COMMAND_LIST.map((item) => {
        const key = deriveCommandKey(item);
        return {
          label: item.label,
          Icon: key ? commandIconMap[key] : undefined,
          onClick: () => handleCommandListSelect(item),
        };
      }),
    [commandIconMap, handleCommandListSelect]
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

  const executeSend = async (overrideCommand?: string) => {
    const composedInput =
      overrideCommand ??
      (selectedCommand ? `${selectedCommand} ${inputValue}` : inputValue);
    const finalCommand = composedInput.trim();

    if (!finalCommand) {
      return;
    }

    resetSegmentDropdown();
    setIsCommandPaletteOpen(false);

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
      let baseRunId = versionMap.get(selectedVersion) || "";
      
      // If not found in versionMap, try to find it in versions array
      if (!baseRunId && selectedVersion) {
        const matchedVersion = versions.find(v => v.display === selectedVersion);
        if (matchedVersion) {
          baseRunId = matchedVersion.runId;
        } else {
          // If still not found, try to convert selectedVersion format (v1 -> r_1, v2 -> r_2, etc.)
          const versionMatch = selectedVersion.match(/^v(\d+)$/);
          if (versionMatch) {
            baseRunId = `r_${versionMatch[1]}`;
          }
        }
      }
      
      // If still empty, use runResult or default
      if (!baseRunId) {
        baseRunId = runResult?.run_id || "r_1";
      }

      // Read task_id from run_result only; do not overwrite it
      const taskId = runResult?.task_id || "";

      if (!taskId) {
        return;
      }

      console.log(
        "Chat generation: using task_id read from run_result:",
        taskId
      );

      // Prepare request parameters
      const lowerCommand = finalCommand.toLowerCase();
      let feedbackText:
        | string
        | { intent: string; selector: string; user_prompt: string } =
        finalCommand;

      if (lowerCommand.startsWith("correct segment")) {
        let userPromptText = sanitizeUserPrompt(inputValue);
        if (!userPromptText) {
          userPromptText = finalCommand
            .replace(/^correct segment\s*/i, "")
            .trim();
        }
        const basePayload =
          selectedCommand === "Correct Segment" && selectedCommandPayload
            ? selectedCommandPayload
            : {
                intent: "segment_edit",
                selector: "segments[segmentId=xxx]",
                user_prompt: "",
              };
        feedbackText = {
          ...basePayload,
          user_prompt: userPromptText,
        };
      }

      const requestBody = {
        feedback_text: feedbackText,
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
      setIsVersionDropdownOpen(false);

      // Step 1: call feedback-mrf/process (0% → 30%)
      setGenerationProgress(10);
      const response = await fetch(
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
        console.log("Clarify your prompt so the system can continue");
        alert("Clarify your prompt so the system can continue");
        console.log("feedback-mrf/process error payload:", errorText);
      }

      setGenerationProgress(30); // feedback-mrf/process complete, progress 30%
      const result = await response.json();
      console.log("Feedback API response:", result);

      if (result.status === "ignored") {
        console.warn("Feedback ignored:", result?.message);
        alert("Clarify your prompt so the system can continue");
        setIsGenerating(false);
        setGenerationProgress(0);
        setSelectedCommand("");
        setSelectedCommandPayload(null);
        setSelectedSegmentTag("");
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

      if (!runResultsPayload) {
        console.warn(
          "No run_results available for standal_sql request",
          result
        );
        alert("Clarify your prompt so the system can continue");
        setIsGenerating(false);
        setGenerationProgress(0);
        setSelectedCommand("");
        setSelectedCommandPayload(null);
        setSelectedSegmentTag("");
        return;
      }

      // Step 2: call standal_sql (30% → 70%)
      console.log("Calling standal_sql with run_results...");
      setGenerationProgress((prev) => Math.max(prev, 40));
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 600_000);

      const standalRes = await fetch(
        "https://business-insight.datail.ai/api/v1/standal_sql",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ run_results: runResultsPayload }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);
      setGenerationProgress(70);
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

        const updatedRunResult = standalJson.run_results.run_result;
        localStorage.setItem("run_result", JSON.stringify(updatedRunResult));

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
        if (mapped.length > 0) {
          // If targetSegmentNameForCarousel is set, keep it; otherwise use first segment
          if (!targetSegmentNameForCarousel) {
            setSelectedSegmentName(mapped[0]?.name || "");
          }
        }
        localStorage.setItem("marketsData", JSON.stringify(mapped));

        setGenerationProgress(90);
        const refreshVersionsWithRetry = async (
          retries = 5,
          delay = 1000,
          initialDelay = 2000
        ) => {
          const previousVersionCount = versions.length;
          console.log(
            `Previous version count: ${previousVersionCount}, waiting ${initialDelay}ms for database write...`
          );

          await new Promise((resolve) => setTimeout(resolve, initialDelay));

          for (let i = 0; i < retries; i++) {
            try {
              console.log(
                `Refreshing versions (attempt ${i + 1}/${retries})...`
              );

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

              const refreshedResult = await response.json();
              const runResults = refreshedResult.data || [];
              const currentVersionCount = runResults.length;

              console.log(
                `Current version count: ${currentVersionCount}, previous: ${previousVersionCount}`
              );

              if (currentVersionCount > previousVersionCount) {
                console.log(
                  `New version detected! Count increased from ${previousVersionCount} to ${currentVersionCount}`
                );
                await fetchVersions(true);
                setGenerationProgress(100);
                return;
              } else if (i < retries - 1) {
                console.log(
                  `Version count not increased yet, waiting ${delay}ms before retry...`
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
              } else {
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
                await new Promise((resolve) => setTimeout(resolve, delay));
              } else {
                console.log("Failed to refresh versions after all retries");
                setGenerationProgress(100);
              }
            }
          }
        };

        refreshVersionsWithRetry();
      } else {
        setGenerationProgress(100);
      }
      
      // Don't clear targetSegmentNameForCarousel immediately
      // Keep it so the carousel maintains the selected segment after re-render
      // It will be cleared when a new segment is selected from the modal

      const lowerInput = finalCommand.toLowerCase();
      const isVersionChange = lowerInput.includes("rename segment");
      let detectedRefreshType: RefreshType = "none";
      if (lowerInput.includes("add segment")) {
        detectedRefreshType = "add-segment";
      } else if (lowerInput.includes("merge segments")) {
        detectedRefreshType = "merge-segments";
      } else if (lowerInput.includes("delete segments")) {
        detectedRefreshType = "delete-segments";
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
      } else if (lowerInput.includes("correct segment")) {
        detectedRefreshType = "segment";
      } else if (lowerInput.includes("segment")) {
        detectedRefreshType = "segment";
      } else if (lowerInput.includes("question list")) {
        detectedRefreshType = "question-list";
      } else if (lowerInput.includes("question")) {
        detectedRefreshType = "question";
      }
      setRefreshType(detectedRefreshType);

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
            setSelectedCommand("");
            setSelectedCommandPayload(null);
            setSelectedSegmentTag("");
            setSelectedMergeSegments([]);
            setIsMergeSegmentsExpanded(false);
            setGenerationProgress(0);
            setRefreshType("none");
          }, 1000);
        } else {
          setIsGenerating(false);
          setInputValue("");
          setSelectedCommand("");
          setSelectedCommandPayload(null);
          setSelectedSegmentTag("");
          setSelectedMergeSegments([]);
          setIsMergeSegmentsExpanded(false);
          setGenerationProgress(0);
          setRefreshType("none");
          setRefreshKey((prev) => prev + 1);
        }
      }, 500);
    } catch (error) {
      console.log("handleSend error:", error);
      setIsGenerating(false);
      setGenerationProgress(0);
      setSelectedCommand("");
      setSelectedCommandPayload(null);
      setSelectedSegmentTag("");
    }
  };

  const handleCommandSelect = (command: string) => {
    setIsCommandPaletteOpen(false);
    const normalized = command.toLowerCase();
    resetQuestionSelection();
    const matched =
      COMMAND_LIST.find((item) => deriveCommandKey(item) === normalized) ||
      null;

    if (matched) {
      if (normalized === "add segment") {
        handleSpecialCommand("add-segment");
        return;
      }
      if (SEGMENT_SELECTION_COMMANDS.has(normalized as SegmentSelectionCommand)) {
        handleSpecialCommand(normalized as SegmentSelectionCommand);
        return;
      }
      setSelectedCommand(normalized);
      setSelectedCommandPayload(matched.command);
      setSelectedSegmentTag("");
      setInputValue("");
      console.log("[Command Selected]", matched.command);
      resetSegmentDropdown();
      setTimeout(() => {
        void executeSend(command);
      }, 100);
      return;
    }

    setSelectedCommand("");
    setSelectedCommandPayload(null);
    setSelectedSegmentTag("");
    setInputValue(command);
    console.log("[Command Selected]", command);
    resetSegmentDropdown();
    setTimeout(() => {
      void executeSend(command);
    }, 100);
  };

  const handleSegmentModalConfirm = (value: string | string[]) => {
    // Handle multi-select mode for merge segments and delete segments
    if (segmentModalMode === "multiSelect") {
      if (!Array.isArray(value)) {
        setIsSegmentModalOpen(false);
        return;
      }

      // For merge segments, need at least 2 segments
      // For delete segments, need at least 1 segment and must leave at least 1 segment
      const isDeleteCommand = segmentModalCommand === "delete segments";
      const totalSegments = availableSegments.length;
      
      if (isDeleteCommand) {
        // For delete: must select at least 1, and must leave at least 1
        if (value.length < 1) {
          setIsSegmentModalOpen(false);
          return;
        }
        if (value.length >= totalSegments) {
          alert("至少需要保留1个segment，无法删除所有segments");
          return;
        }
      } else {
        // For merge: need at least 2 segments
        if (value.length < 2) {
          setIsSegmentModalOpen(false);
          return;
        }
      }

      // Convert segment names to segment IDs
      const segmentIds = value.map((segmentName) => {
        return segmentIdMap.get(segmentName) || segmentIdMap.get(segmentName.trim()) || segmentName;
      });

      const currentCommandKey = isDeleteCommand ? "delete segments" : "merge segments";
      const templatePayload =
        selectedCommandPayload ??
        COMMAND_LIST.find(
          (item) => deriveCommandKey(item) === currentCommandKey
        )?.command;

      if (templatePayload) {
        const updatedPayload: CommandPayload = {
          ...templatePayload,
          segments: segmentIds,
        };

        setSelectedCommand(currentCommandKey);
        setSelectedCommandPayload(updatedPayload);
        if (isDeleteCommand) {
          // Store selected segments for delete (similar to merge)
          setSelectedMergeSegments(value);
        } else {
          setSelectedMergeSegments(value); // Store selected segments for display
        }
        console.log(`[Command Segments Selected for ${isDeleteCommand ? 'Delete' : 'Merge'}]`, {
          command: currentCommandKey,
          segmentNames: value,
          segmentIds,
          payload: updatedPayload,
        });
        
        // Close modal but don't auto-send, wait for user to click submit button
        setIsSegmentModalOpen(false);
        // Don't clear input field, allow user to add additional text
        // setInputValue(""); // Clear input field
        resetSegmentDropdown();
      } else {
        console.warn(
          `[Command Segments Selected] Missing template payload for ${currentCommandKey}`
        );
        setIsSegmentModalOpen(false);
      }

      return;
    }

    const trimmedValue = typeof value === 'string' ? value.trim() : '';
    if (!trimmedValue) {
      setIsSegmentModalOpen(false);
      return;
    }

    if (segmentModalMode === "select") {
      const segmentName = trimmedValue;
      const segmentId =
        segmentIdMap.get(segmentName) || segmentIdMap.get(trimmedValue) || segmentName;

      setSelectedSegmentName(segmentName);
      setSelectedSegmentTag(segmentName);
      // Save segment name to select in carousel after API response
      setTargetSegmentNameForCarousel(segmentName);

      const currentCommandKey = SEGMENT_SELECTION_COMMANDS.has(selectedCommand as SegmentSelectionCommand)
        ? selectedCommand
        : "Correct Segment";

      const templatePayload =
        selectedCommandPayload ??
        COMMAND_LIST.find(
          (item) => deriveCommandKey(item) === currentCommandKey
        )?.command;

      if (templatePayload) {
        if (QUESTION_SELECTOR_COMMANDS.has(currentCommandKey)) {
          resetQuestionSelection();
        }
        const updatedSelector = templatePayload.selector
          ? templatePayload.selector.replace(
              /segmentId=[^\]\s]*/i,
              `segmentId=${segmentId}`
            )
          : templatePayload.selector;

        const updatedPayload: CommandPayload = {
          ...templatePayload,
          selector: updatedSelector ?? `segments[segmentId=${segmentId}]`,
        };

        setSelectedCommand(currentCommandKey);
        setSelectedCommandPayload(updatedPayload);
        console.log("[Command Segment Selected]", {
          command: currentCommandKey,
          segmentName,
          segmentId,
          payload: updatedPayload,
        });

        if (RENAME_SEGMENT_FLOW_COMMANDS.has(currentCommandKey)) {
          setRenameTargetSegmentName(segmentName);
          setRenameNewSegmentName(segmentName);
          // Don't open rename modal, allow user to type new name directly in input field
          // setTimeout(() => {
          //   setIsRenameModalOpen(true);
          // }, 50);
        } else if (QUESTION_SELECTOR_COMMANDS.has(currentCommandKey)) {
          setQuestionModalCommand(currentCommandKey);
          setQuestionModalSegmentName(segmentName);
          setQuestionModalSegmentId(segmentId);
          const options = buildQuestionOptions(segmentId, segmentName);
          setQuestionOptions(options);
          setIsQuestionModalOpen(true);
        }
      } else {
        console.warn(
          `[Command Segment Selected] Missing template payload for ${currentCommandKey}`
        );
      }

      resetSegmentDropdown();
      setIsSegmentModalOpen(false);
      return;
    }

    const fullCommand = `add segment ${trimmedValue}`;
    setIsSegmentModalOpen(false);
    setSelectedCommand("");
    setSelectedCommandPayload(null);
    setSelectedSegmentTag("");
    setInputValue("");
    resetSegmentDropdown();
    setTimeout(() => {
      void executeSend(fullCommand);
    }, 50);
  };

  const handleSegmentModalCancel = () => {
    resetQuestionSelection();
    setSelectedCommand("");
    setSelectedCommandPayload(null);
    setSelectedSegmentTag("");
    setSelectedMergeSegments([]);
    setIsMergeSegmentsExpanded(false);
    // Don't clear targetSegmentNameForCarousel on cancel, keep the current selection
    setRenameTargetSegmentName("");
    setRenameNewSegmentName("");
    setInputValue("");
    setIsSegmentModalOpen(false);
  };

  const handleRenameModalConfirm = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsRenameModalOpen(false);

    const basePayload =
      selectedCommandPayload ??
      COMMAND_LIST.find(
        (item) => deriveCommandKey(item) === "rename segment"
      )?.command;

    const updatedPayload = basePayload
      ? { ...basePayload, new_name: trimmed }
      : {
          intent: "segment_rename",
          selector: "segments[segmentId=xxx]",
          user_prompt: "",
          new_name: trimmed,
          target: "segments",
        };

    setRenameNewSegmentName(trimmed);
    setSelectedCommandPayload(updatedPayload);
    setInputValue(trimmed);

    const payload = {
      intent: updatedPayload.intent,
      selector: updatedPayload.selector,
      new_name: trimmed,
      target: updatedPayload.target,
      segment: renameTargetSegmentName || selectedSegmentTag,
    };

    console.log("[Rename Segment Preview]", payload);
  };

  const handleRenameModalCancel = () => {
    setIsRenameModalOpen(false);
    setSelectedCommand("");
    setSelectedCommandPayload(null);
    setSelectedSegmentTag("");
    setRenameTargetSegmentName("");
    setRenameNewSegmentName("");
    setInputValue("");
  };

  const handleQuestionModalConfirm = useCallback(
    (question: QuestionOption | QuestionOption[]) => {
      const questions = Array.isArray(question) ? question : [question];
      if (questions.length === 0) return;

      // For delete question command, always set questionIds (even for single selection)
      if (selectedCommand === "delete question") {
        // Store question IDs for deletion (single or multiple)
        setSelectedQuestionOption(questions[0]); // Keep first one for compatibility
        setIsQuestionModalOpen(false);
        // Store all question IDs for deletion
        setSelectedCommandPayload((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            questionIds: questions.map((q) => q.id),
            user_prompt: prev.user_prompt,
          };
        });
      } else {
        // Single selection (edit question)
        setSelectedQuestionOption(questions[0]);
        setIsQuestionModalOpen(false);
        setSelectedCommandPayload((prev) => {
          if (!prev) return prev;
          const selectorWithFallback =
            prev.selector && /valueQuestions/.test(prev.selector)
              ? prev.selector
              : `segments[segmentId=${
                  questionModalSegmentId || "xxx"
                }].valueQuestions[id=${questions[0].id}]`;
          const updatedSelector = selectorWithFallback.replace(
            /id=[^\]\s]*/i,
            `id=${questions[0].id}`
          );
          return {
            ...prev,
            selector: updatedSelector,
            user_prompt: questions[0].text || prev.user_prompt,
          };
        });
      }
    },
    [questionModalSegmentId, selectedCommand]
  );

  const handleQuestionModalCancel = useCallback(() => {
    resetQuestionSelection();
    if (QUESTION_SELECTOR_COMMANDS.has(selectedCommand)) {
      setSelectedCommand("");
      setSelectedCommandPayload(null);
      setSelectedSegmentTag("");
    }
  }, [resetQuestionSelection, selectedCommand]);

  const openQuestionModal = useCallback(() => {
    if (!QUESTION_SELECTOR_COMMANDS.has(selectedCommand)) {
      return;
    }
    if (!questionModalSegmentId && !questionModalSegmentName && !selectedSegmentTag) {
      return;
    }
    const commandKey = selectedCommand || "delete question";
    setQuestionModalCommand(commandKey);
    setIsQuestionModalOpen(true);
  }, [
    questionModalSegmentId,
    questionModalSegmentName,
    selectedCommand,
    selectedSegmentTag,
  ]);

  const clearSelectedQuestion = useCallback(() => {
    if (!QUESTION_SELECTOR_COMMANDS.has(selectedCommand)) {
      setSelectedQuestionOption(null);
      return;
    }

    // Check if there are multiple questions selected
    const questionIds = (selectedCommandPayload as any)?.questionIds;
    if (questionIds && Array.isArray(questionIds) && questionIds.length > 1) {
      // Remove the last question from the array
      const updatedQuestionIds = questionIds.slice(0, -1);
      setSelectedCommandPayload((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questionIds: updatedQuestionIds,
        };
      });
      // Update selectedQuestionOption to the first question in the remaining list
      const remainingQuestion = questionOptions.find(
        (q) => q.id === updatedQuestionIds[0]
      );
      if (remainingQuestion) {
        setSelectedQuestionOption(remainingQuestion);
      } else {
        // If question not found, clear everything
        setSelectedQuestionOption(null);
        setSelectedCommand("");
        setSelectedCommandPayload(null);
        setSelectedSegmentTag("");
        setInputValue("");
      }
    } else {
      // Only one question or no questionIds, clear everything
      setSelectedQuestionOption(null);
      setSelectedCommand("");
      setSelectedCommandPayload(null);
      setSelectedSegmentTag("");
      setInputValue("");
    }
  }, [selectedCommand, selectedCommandPayload, questionOptions]);

  const handleSend = async () => {
    if (isGenerating) return;
    if (!selectedCommandPayload) {
      console.warn(
        "[Command Submit Blocked] Missing command payload for:",
        selectedCommand
      );
      console.log("[Command Submit Blocked] Input value:", inputValue);
      return;
    }
    if (
      QUESTION_SELECTOR_COMMANDS.has(selectedCommand) &&
      (!selectedQuestionOption ||
        selectedCommandPayload.selector?.includes("id=xxx")) &&
      !(selectedCommandPayload as any).questionIds
    ) {
      if (!isQuestionModalOpen) {
        openQuestionModal();
      }
      return;
    }

    const userPromptText = sanitizeUserPrompt(inputValue);
    const updatedPayload: CommandPayload = {
      ...selectedCommandPayload,
      user_prompt: userPromptText,
    };

    if (selectedCommand === "rename segment" && userPromptText) {
      updatedPayload.new_name = userPromptText;
    }

    setSelectedCommandPayload(updatedPayload);
    const requestBody = (() => {
      if (typeof window === "undefined") {
        return null;
      }

      const runResultStr = localStorage.getItem("run_result");
      let runResult: any = null;
      // Get baseRunId from versionMap first
      let baseRunId = versionMap.get(selectedVersion) || "";
      
      // If not found in versionMap, try to find it in versions array
      if (!baseRunId && selectedVersion) {
        const matchedVersion = versions.find(v => v.display === selectedVersion);
        if (matchedVersion) {
          baseRunId = matchedVersion.runId;
        } else {
          // If still not found, try to convert selectedVersion format (v1 -> r_1, v2 -> r_2, etc.)
          const versionMatch = selectedVersion.match(/^v(\d+)$/);
          if (versionMatch) {
            baseRunId = `r_${versionMatch[1]}`;
          }
        }
      }
      
      let taskId = "";
      let storedUserId = "";

      if (runResultStr) {
        try {
          runResult = JSON.parse(runResultStr);
          // If baseRunId is still empty after all attempts, use runResult
          if (!baseRunId) {
            baseRunId = runResult?.run_id || "r_1";
          }
          taskId = runResult?.task_id || "";
          storedUserId = runResult?.user_id || "";
        } catch (error) {
          console.warn("Failed to parse run_result for request body:", error);
        }
      }

      // Final fallback
      if (!baseRunId) {
        baseRunId = "r_1";
      }

      const userId = user?.id || storedUserId || "";

      // Handle delete segments: generate one changeEntry per segment
      if (updatedPayload.intent === "segment_remove" && updatedPayload.segments && Array.isArray(updatedPayload.segments) && updatedPayload.segments.length > 0) {
        const changeset = updatedPayload.segments.map((segmentId: string) => {
          return {
            intent: "segment_remove",
            target: "segments",
            selector: `segments[segmentId=${segmentId}]`,
            prompt: "删除这个细分市场",
            policy: {
              propagation: "standard",
              strict_scope: true,
              downgrade_shapes: true,
            },
          };
        });

        return {
          feedback_text: updatedPayload.user_prompt,
          base_run_id: baseRunId,
          user_id: userId,
          task_id: taskId,
          changeset: changeset,
        };
      }

      // Handle delete questions: generate one changeEntry per question
      if (updatedPayload.intent === "value_question_remove" && (updatedPayload as any).questionIds && Array.isArray((updatedPayload as any).questionIds) && (updatedPayload as any).questionIds.length > 0) {
        const segmentId = questionModalSegmentId || (updatedPayload.selector?.match(/segmentId=([^\]]+)/)?.[1]) || "xxx";
        const changeset = (updatedPayload as any).questionIds.map((questionId: string) => {
          return {
            intent: "value_question_remove",
            target: "valueQuestions",
            selector: `segments[segmentId=${segmentId}].valueQuestions[id=${questionId}]`,
            prompt: "删除这个问题",
            policy: {
              propagation: "standard",
              strict_scope: true,
              downgrade_shapes: true,
            },
          };
        });

        return {
          feedback_text: updatedPayload.user_prompt,
          base_run_id: baseRunId,
          user_id: userId,
          task_id: taskId,
          changeset: changeset,
        };
      }

      // Handle other commands (merge, edit, etc.)
      const changeEntry: Record<string, any> = {
        intent: updatedPayload.intent,
        target:
          updatedPayload.target ??
          resolveTargetFromSelector(updatedPayload.selector || ""),
        selector: updatedPayload.selector,
        prompt: updatedPayload.user_prompt,
        policy: {
          propagation: "standard",
          strict_scope: true,
          downgrade_shapes: true,
        },
      };
      if (updatedPayload.new_name) {
        changeEntry.new_name = updatedPayload.new_name;
      }
      if (updatedPayload.intent === "segment_merge" && updatedPayload.segments) {
        changeEntry.segments = updatedPayload.segments;
      }

      return {
        feedback_text: updatedPayload.user_prompt,
        base_run_id: baseRunId,
        user_id: userId,
        task_id: taskId,
        changeset: [changeEntry],
      };
    })();

    console.log("[Command Submit] Selected command:", {
      key: selectedCommand,
      payload: updatedPayload,
    });

    if (!requestBody) {
      console.warn("[Command Submit] Request body unavailable");
      return;
    }

    console.log("[Command Submit] Sending changeset:", requestBody);

    try {
      setIsGenerating(true);
      setGenerationProgress(10);

      const response = await fetch(
        "https://business-insight.datail.ai/api/v1/user-feedback/changeset",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const text = await response.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : {};
      } catch (error) {
        console.warn("[Command Submit] Failed to parse response JSON", text);
      }

      if (!response.ok) {
        console.error("[Command Submit] API error", response.status, text);
        alert(
          json?.message ||
            "Failed to submit feedback. Please review your instruction."
        );
        setIsGenerating(false);
        setGenerationProgress(0);
        return;
      }

      console.log("[Command Submit] Response:", json ?? text);
      setGenerationProgress(50);

      // delete-question, rename segment, delete segments, and segment_merge commands don't need to call standal_sql
      const shouldSkipStandalSql = selectedCommand === "delete question" || selectedCommand === "rename segment" || selectedCommand === "delete segments" || selectedCommand === "merge segments" || updatedPayload.intent === "segment_merge";

      // After changeset execution completes, update version list
      // If standal_sql is not needed, immediately update version list and switch version
      // If standal_sql is needed, don't call run-results to get version data, wait until standal_sql completes
      if (shouldSkipStandalSql) {
        try {
          await fetchVersions(false); // Update version list
          await switchToLatestVersion(); // Switch to latest version
          console.log("[Command Submit] Version list updated and switched after changeset (no standal_sql)");
        } catch (error) {
          console.warn("[Command Submit] Failed to update version list:", error);
          // Version list update failure doesn't affect main flow, only log warning
        }
      } else {
        // Commands that need standal_sql, don't call run-results, wait until standal_sql completes
        console.log("[Command Submit] Changeset completed, will update version list after standal_sql");
      }
      
      // After changeset API execution completes, call standal_sql API (except for certain commands)
      let runResultsPayload = json?.run_results;
      
      // Only build runResultsPayload for commands that need to call standal_sql
      if (!shouldSkipStandalSql) {
        // Get basic info from localStorage to supplement run_results
        const runResultStr = localStorage.getItem("run_result");
        let runResult: any = null;
        if (runResultStr) {
          try {
            runResult = JSON.parse(runResultStr);
          } catch (error) {
            console.warn("[Command Submit] Failed to parse run_result from localStorage:", error);
          }
        }
        
        const connectionId = localStorage.getItem("connection_id") || "";
        const userId = user?.id || runResult?.user_id || "";
        const taskId = runResult?.task_id || requestBody?.task_id || "";
        const baseRunId = requestBody?.base_run_id || runResult?.run_id || "r_1";
        const runId = runResult?.run_id || baseRunId;
        
        // If run_results not obtained from changeset response or incomplete, build from localStorage
        if (!runResultsPayload || !runResultsPayload.run_result) {
          if (runResult) {
            // Build complete run_results object
            runResultsPayload = {
              user_id: runResultsPayload?.user_id || userId,
              connection_id: runResultsPayload?.connection_id || connectionId,
              task_id: runResultsPayload?.task_id || taskId,
              run_id: runResultsPayload?.run_id || runId,
              parent_run_id: runResultsPayload?.parent_run_id || runResult?.parent_run_id || null,
              run_result: runResultsPayload?.run_result || runResult,
              run_status: runResultsPayload?.run_status || "completed",
              created_at: runResultsPayload?.created_at || new Date().toISOString(),
            };
          }
        } else {
          // If changeset returned run_results but missing required fields, supplement them
          if (!runResultsPayload.user_id) runResultsPayload.user_id = userId;
          if (!runResultsPayload.connection_id) runResultsPayload.connection_id = connectionId;
          if (!runResultsPayload.task_id) runResultsPayload.task_id = taskId;
          if (!runResultsPayload.run_id) runResultsPayload.run_id = runId;
          if (!runResultsPayload.run_status) runResultsPayload.run_status = "completed";
          if (!runResultsPayload.created_at) runResultsPayload.created_at = new Date().toISOString();
        }
      }

      // Only non delete-question and rename segment commands call standal_sql
      if (runResultsPayload && !shouldSkipStandalSql) {
        console.log("[Command Submit] Calling standal_sql with run_results...");
        setGenerationProgress(60);
        
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 600_000); // 10 minute timeout

          const standalRes = await fetch(
            "https://business-insight.datail.ai/api/v1/standal_sql",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ run_results: runResultsPayload }),
              signal: controller.signal,
            }
          );

          clearTimeout(timeout);
          setGenerationProgress(90);
          const standalText = await standalRes.text();
          console.log("[Command Submit] standal_sql response:", standalText);

          let standalJson: any = null;
          try {
            standalJson = JSON.parse(standalText);
          } catch (e) {
            console.log("[Command Submit] Failed to parse standal_sql response:", e);
            throw new Error("Invalid JSON response from standal_sql");
          }

          if (!standalRes.ok) {
            throw new Error(
              typeof standalJson === "string"
                ? standalJson.slice(0, 200)
                : standalJson?.error || `standal_sql HTTP ${standalRes.status}`
            );
          }

          console.log("[Command Submit] standal_sql completed successfully:", standalJson);

          // Process data returned from standal_sql
          if (standalJson?.run_results?.run_result) {
            localStorage.setItem(
              "standalJson",
              JSON.stringify({
                anchIndex: standalJson.run_results?.run_result?.anchIndex,
                segments: standalJson.run_results.run_result.segments,
              })
            );

            const updatedRunResult = standalJson.run_results.run_result;
            localStorage.setItem("run_result", JSON.stringify(updatedRunResult));

            // Update segments data
            const segments = updatedRunResult.segments || [];
            const mapped = segments.map((seg: any) => ({
              id: seg.segmentId || seg.id || seg.name,
              name: seg.name,
              segmentId: seg.segmentId || seg.id,
              analysis: seg.analysis,
              valueQuestions: seg.valueQuestions || [],
            }));

            setSegmentsData(mapped);
            
            // Preserve selected segment after data update
            if (mapped.length > 0 && targetSegmentNameForCarousel) {
              // Keep the selected segment name if targetSegmentNameForCarousel is set
              const targetSegment = mapped.find((seg: any) => seg.name === targetSegmentNameForCarousel);
              if (targetSegment) {
                setSelectedSegmentName(targetSegmentNameForCarousel);
              } else if (!selectedSegmentName) {
                // If target segment not found, fallback to first segment
                setSelectedSegmentName(mapped[0]?.name || "");
              }
            } else if (mapped.length > 0 && !targetSegmentNameForCarousel && !selectedSegmentName) {
              // If no target set, use first segment
              setSelectedSegmentName(mapped[0]?.name || "");
            }
            
            // After standal_sql execution completes, switch to latest version
            // switchToLatestVersion already calls /api/run-results internally, no need to call fetchVersions separately
            try {
              await switchToLatestVersion(); // Switch to latest version (this will fetch version list and load data)
              console.log("[Command Submit] Version list updated after standal_sql");
            } catch (error) {
              console.warn("[Command Submit] Failed to update version list after standal_sql:", error);
            }
          }
        } catch (standalError) {
          console.error("[Command Submit] standal_sql request failed", standalError);
          // standal_sql failure doesn't affect changeset success, only log error
        }
      } else if (!shouldSkipStandalSql) {
        console.warn("[Command Submit] No run_results available for standal_sql");
      } else {
        console.log("[Command Submit] Skipping standal_sql for command:", selectedCommand);
      }

      setGenerationProgress(100);

      setSelectedCommand("");
      setSelectedCommandPayload(null);
      setSelectedSegmentTag("");
      setSelectedMergeSegments([]);
      setIsMergeSegmentsExpanded(false);
      setRenameTargetSegmentName("");
      setRenameNewSegmentName("");
      setInputValue("");
      resetQuestionSelection();
    } catch (error) {
      console.error("[Command Submit] Request failed", error);
      alert("Request failed. Please try again later.");
    } finally {
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
    if (e.key === "Escape") {
      e.preventDefault();
      if (isSegmentDropdownOpen) {
        resetSegmentDropdown();
        return;
      }
      if (selectedCommand) {
        setSelectedCommand("");
        setSelectedCommandPayload(null);
        setSelectedSegmentTag("");
        setInputValue("");
        return;
      }
      if (inputValue) {
        setInputValue("");
      }
    }
  };
  return (
    <div className="w-full min-h-screen bg-white pb-32">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Business Insight</h1>
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
                          });

                          setSelectedVersion(version.display);
                          setIsVersionDropdownOpen(false);
                          setIsGenerating(true);
                          setGenerationProgress(0);

                          await loadVersionData(version.runId);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm cursor-pointer ${
                          selectedVersion === version.display
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
              className="flex items-center gap-1.5 px-4 py-2 bg-black border-2 border-black rounded-lg font-medium text-white transition-all duration-200 hover:bg-white hover:text-black hover:scale-105 hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-black disabled:hover:text-white relative overflow-hidden"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="whitespace-nowrap flex items-center gap-1">
                Generate{" "}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={displayedSegmentName}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="text-green-400 inline-block max-w-[50vw] truncate"
                    title={displayedSegmentName}
                  >
                    {displayedSegmentName}
                  </motion.span>
                </AnimatePresence>
              </span>
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
              onSegmentChange={(name) =>
                setSelectedSegmentName(name ? String(name) : "")
              }
              targetSegmentName={targetSegmentNameForCarousel}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="hidden">
        <FloatingCommandButton
          onClick={() => setIsCommandPaletteOpen(true)}
        />
      </div>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onCommandSelect={handleCommandSelect}
        onSpecialCommand={handleSpecialCommand}
      />
      <SegmentSelectionModal
        isOpen={isSegmentModalOpen}
        onClose={() => setIsSegmentModalOpen(false)}
        mode={segmentModalMode}
        commandText={segmentModalCommand}
        onConfirm={handleSegmentModalConfirm}
        segments={availableSegments}
        defaultSelectedSegment={
          renameTargetSegmentName || selectedSegmentName || displayedSegmentName
        }
        onCancel={handleSegmentModalCancel}
      />
      <QuestionSelectionModal
        isOpen={isQuestionModalOpen}
        onClose={handleQuestionModalCancel}
        onCancel={handleQuestionModalCancel}
        onConfirm={handleQuestionModalConfirm}
        questions={questionOptions}
        segmentName={
          questionModalSegmentName || selectedSegmentTag || questionModalSegmentId
        }
        commandText={questionModalCommand || selectedCommand}
        defaultSelectedQuestionId={selectedQuestionOption?.id}
      />
      {selectedAnalysis && (
        <DetailModal
          analysis={selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
        />
      )}
      <AnimatePresence>
        {isRenameModalOpen && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Rename Segment
                  </h3>
                  <p className="text-sm text-gray-500">
                    Selected: {renameTargetSegmentName || selectedSegmentTag}
                  </p>
                </div>
                <button
                  onClick={handleRenameModalCancel}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Close rename modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  New segment name
                </label>
                <input
                  type="text"
                  value={renameNewSegmentName}
                  onChange={(e) => setRenameNewSegmentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Enter new segment name"
                  autoFocus
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleRenameModalCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRenameModalConfirm(renameNewSegmentName)}
                  disabled={!renameNewSegmentName.trim()}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    renameNewSegmentName.trim()
                      ? "bg-black text-white hover:bg-gray-900 cursor-pointer"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Rename
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Bottom Input Box */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-6 z-50">
        <div className="max-w-7xl mx-auto px-8 relative">
          <AnimatePresence>
            {isSegmentDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full mb-2 left-4 bg-white border border-gray-300 rounded-2xl shadow-xl overflow-hidden"
                style={{ width: "auto", minWidth: "300px", maxWidth: "400px" }}
              >
                <div className="p-2">
                  <div className="mb-2">
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
                      Quick Select
                    </div>
                    {topSegments.map((segment) => (
                      <button
                        key={segment}
                        onClick={() => handleSegmentSelect(segment)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-900 font-medium text-sm cursor-pointer"
                      >
                        {segment}
                      </button>
                    ))}
                  </div>
                  {hasMoreSegments && (
                    <div className="border-t border-gray-200 pt-2">
                      <button
                        onClick={() => {
                          setIsSegmentDropdownOpen(false);
                          setSegmentModalMode("select");
                          setSegmentModalCommand("clipboard");
                          setIsSegmentModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 font-medium text-sm flex items-center justify-between cursor-pointer"
                      >
                        <span>View all segments</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="bg-white border border-gray-300 rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-visible">
            <div className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-start gap-2 min-w-0 w-full">
                <AnimatePresence>
                  {selectedCommand && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                      style={{ marginTop: "10px" }}
                    >
                      <span>{getCommandLabel(selectedCommand)}</span>
                      <button
                        onClick={() => {
                          setSelectedCommand("");
                          setSelectedCommandPayload(null);
                          setSelectedSegmentTag("");
                          setSelectedMergeSegments([]);
                          setIsMergeSegmentsExpanded(false);
                          setSelectedQuestionOption(null);
                          setInputValue("");
                        }}
                        className="hover:bg-gray-200 rounded p-0.5 transition-colors cursor-pointer"
                        aria-label="Clear command"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {selectedSegmentTag && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium max-w-full"
                      style={{ marginTop: "10px" }}
                    >
                      <span className="whitespace-normal break-words" title={selectedSegmentTag}>
                        {selectedSegmentTag}
                      </span>
                      <button
                        onClick={clearSelectedSegment}
                        className="hover:bg-emerald-100 rounded p-0.5 transition-colors cursor-pointer flex-shrink-0"
                        aria-label="Clear selected segment"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {selectedMergeSegments.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-wrap items-center gap-2 w-full min-w-0"
                      style={{ marginTop: "10px" }}
                    >
                      {/* All segments displayed, no collapse */}
                      {selectedMergeSegments.map((segment, index) => (
                        <motion.div
                          key={segment}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium max-w-full"
                        >
                          <span className="whitespace-normal break-words" title={segment}>{segment}</span>
                          <button
                            onClick={() => {
                              const updated = selectedMergeSegments.filter(s => s !== segment);
                              setSelectedMergeSegments(updated);
                              // Check command type to determine minimum required segments
                              const isDeleteCommand = selectedCommand === "delete segments";
                              const minRequired = isDeleteCommand ? 1 : 2;
                              
                              // If less than required segments remain, clear all tags and command
                              if (updated.length < minRequired) {
                                setSelectedCommand("");
                                setSelectedCommandPayload(null);
                                setSelectedMergeSegments([]);
                                setIsMergeSegmentsExpanded(false);
                                setSelectedSegmentTag("");
                                setSelectedQuestionOption(null);
                              } else {
                                const segmentIds = updated.map((segmentName) => {
                                  return segmentIdMap.get(segmentName) || segmentIdMap.get(segmentName.trim()) || segmentName;
                                });
                                setSelectedCommandPayload((prev) => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    segments: segmentIds,
                                  };
                                });
                              }
                            }}
                            className="hover:bg-emerald-100 rounded p-0.5 transition-colors cursor-pointer flex-shrink-0"
                            aria-label="Remove segment"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {selectedQuestionOption && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                      style={{ marginTop: "10px" }}
                    >
                      <div className="flex items-center gap-1 min-w-0 max-w-[220px]">
                        <span className="truncate" title={selectedQuestionOption.text}>
                          {selectedQuestionOption.text}
                        </span>
                        {selectedCommandPayload && (selectedCommandPayload as any).questionIds && (selectedCommandPayload as any).questionIds.length > 1 && (
                          <span className="text-blue-600 font-semibold flex-shrink-0">
                            ({(selectedCommandPayload as any).questionIds.length})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={clearSelectedQuestion}
                        className="hover:bg-blue-100 rounded p-0.5 transition-colors cursor-pointer flex-shrink-0"
                        aria-label="Change selected question"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <textarea
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isGenerating}
                  placeholder="Use + to get started quickly and submit your changes."
                  rows={1}
                  className="flex-1 resize-none bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-base px-2 py-2 max-h-48 overflow-y-auto disabled:opacity-50"
                  style={{ minHeight: "40px" }}
                />
              </div>
              <div className="flex items-center gap-3">
                <AnimatedDropdownMenu options={commandOptions}>
                  <span className="text-xl">➕</span>
                </AnimatedDropdownMenu>
                <div className="flex-1" />
                <div
                  className="relative flex-shrink-0"
                  onMouseEnter={() => setIsSendButtonHovered(true)}
                  onMouseLeave={() => setIsSendButtonHovered(false)}
                >
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isGenerating || !selectedCommand}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      !isGenerating && selectedCommand
                        ? "text-black hover:bg-gray-100 cursor-pointer"
                        : "text-gray-300 cursor-not-allowed"
                    }`}
                    aria-label="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                  {!selectedCommand && isSendButtonHovered && !isGenerating && (
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50">
                      Please select a command first
                      <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
