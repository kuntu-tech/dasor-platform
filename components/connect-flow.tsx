"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MarketExplorationPage from "@/app/market-exploration/page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles,
  Database,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Info,
  Send,
  TrendingUp,
  Users,
  Target,
  Wrench,
  Clock,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CircleProgress } from "@/components/ui/circle-progress";
import aaaa from "@/formatted_analysis_result.json";
type Step = "connect" | "analyzing" | "results";
type AnalysisStep =
  | "connecting"
  | "validating-data"
  | "reading-schema"
  | "sampling-data"
  | "evaluating"
  | "complete";
type StepVisualStatus = "waiting" | "in-progress" | "completed" | "error";
const STEP_PROGRESS_RANGES: Record<AnalysisStep, { start: number; end: number }> =
  {
    connecting: { start: 0, end: 10 },
    "reading-schema": { start: 10, end: 30 },
    "validating-data": { start: 30, end: 40 },
    "sampling-data": { start: 40, end: 85 },
    evaluating: { start: 85, end: 100 },
    complete: { start: 100, end: 100 },
  };
import { useAuth } from "./AuthProvider";
type AnalysisResultItem = {
  id: string;
  userProfile: string;
  problem: string;
  marketValue: string; // Changed to text description
  implementationMethod: "Metadata Supported" | "Requires Modeling";
  implementationDifficulty: number; // 1-5, 1 being easiest
};
const testAnalysisData = [
  // E-commerce Platform Operators - 10 problems
  {
    id: "1-1",
    userProfile: "E-commerce Platform Operators",
    problem: "Order Management and Tracking System",
    marketValue:
      "High Value - Can improve operational efficiency by 50%, reduce customer service inquiries",
    implementationMethod: "Metadata Supported" as const,
    implementationDifficulty: 1,
  },
  {
    id: "1-2",
    userProfile: "E-commerce Platform Operators",
    problem: "Real-time Inventory Monitoring Dashboard",
    marketValue:
      "High Value - Prevent overselling, improve inventory turnover by 30%",
    implementationMethod: "Metadata Supported" as const,
    implementationDifficulty: 1,
  },
  {
    id: "1-3",
    userProfile: "E-commerce Platform Operators",
    problem: "Return and Refund Process Management",
    marketValue:
      "Medium Value - Simplify return process, improve customer satisfaction",
    implementationMethod: "Metadata Supported" as const,
    implementationDifficulty: 2,
  },
  {
    id: "1-4",
    userProfile: "E-commerce Platform Operators",
    problem: "Supplier Performance Analysis",
    marketValue:
      "Medium Value - Optimize supply chain, reduce procurement costs by 15%",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 3,
  },
  {
    id: "1-5",
    userProfile: "E-commerce Platform Operators",
    problem: "Logistics Delivery Optimization Recommendations",
    marketValue:
      "High Value - Reduce delivery costs by 20%, improve delivery efficiency",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 4,
  },
  {
    id: "1-6",
    userProfile: "E-commerce Platform Operators",
    problem: "Promotional Campaign Effectiveness Analysis",
    marketValue: "High Value - Improve ROI by 40%, precise marketing targeting",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 3,
  },
  {
    id: "1-7",
    userProfile: "E-commerce Platform Operators",
    problem: "Customer Lifetime Value Prediction",
    marketValue:
      "High Value - Identify high-value customers, improve repeat purchase rate by 25%",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 4,
  },
  {
    id: "1-8",
    userProfile: "E-commerce Platform Operators",
    problem: "Product Recommendation Engine",
    marketValue:
      "High Value - Increase average order value by 30%, boost cross-selling",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 5,
  },
  {
    id: "1-9",
    userProfile: "E-commerce Platform Operators",
    problem: "Price Competitiveness Analysis",
    marketValue:
      "Medium Value - Optimize pricing strategy, maintain market competitiveness",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 3,
  },
  {
    id: "1-10",
    userProfile: "E-commerce Platform Operators",
    problem: "Seasonal Demand Forecasting",
    marketValue:
      "High Value - Optimize inventory planning, reduce stock accumulation",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 4,
  },
  // Product Managers - 10 problems
  {
    id: "2-1",
    userProfile: "Product Managers",
    problem: "Product Catalog and Inventory Display",
    marketValue:
      "High Value - Improve product visibility, increase conversion rate",
    implementationMethod: "Metadata Supported" as const,
    implementationDifficulty: 1,
  },
  {
    id: "2-2",
    userProfile: "Product Managers",
    problem: "User Feedback Collection and Analysis",
    marketValue:
      "High Value - Rapid product iteration, improve user satisfaction",
    implementationMethod: "Metadata Supported" as const,
    implementationDifficulty: 2,
  },
  {
    id: "2-3",
    userProfile: "Product Managers",
    problem: "Feature Usage Statistics",
    marketValue:
      "Medium Value - Identify core features, optimize product roadmap",
    implementationMethod: "Metadata Supported" as const,
    implementationDifficulty: 2,
  },
  {
    id: "2-4",
    userProfile: "Product Managers",
    problem: "A/B Testing Results Analysis",
    marketValue:
      "High Value - Data-driven decisions, improve product effectiveness",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 3,
  },
  {
    id: "2-5",
    userProfile: "Product Managers",
    problem: "User Churn Early Warning System",
    marketValue: "High Value - Early intervention, reduce churn rate by 30%",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 4,
  },
  {
    id: "2-6",
    userProfile: "Product Managers",
    problem: "Competitor Feature Comparison Analysis",
    marketValue:
      "Medium Value - Maintain competitive advantage, respond quickly to market",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 3,
  },
  {
    id: "2-7",
    userProfile: "Product Managers",
    problem: "Target User Segmentation",
    marketValue:
      "High Value - Precise target user positioning, improve conversion",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 3,
  },
  {
    id: "2-8",
    userProfile: "Product Managers",
    problem: "Product Roadmap Priority Ranking",
    marketValue:
      "Medium Value - Optimize resource allocation, accelerate product iteration",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 4,
  },
  {
    id: "2-9",
    userProfile: "Product Managers",
    problem: "New Feature Adoption Rate Prediction",
    marketValue:
      "Medium Value - Evaluate feature value, reduce development risk",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 4,
  },
  {
    id: "2-10",
    userProfile: "Product Managers",
    problem: "User Journey Visualization",
    marketValue: "High Value - Discover pain points, optimize user experience",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 3,
  },
  // Marketing Teams - 10 problems
  {
    id: "3-1",
    userProfile: "Marketing Teams",
    problem: "Customer Acquisition Cost Analysis",
    marketValue:
      "High Value - Optimize marketing budget allocation, improve ROI by 35%",
    implementationMethod: "Metadata Supported" as const,
    implementationDifficulty: 1,
  },
  {
    id: "3-2",
    userProfile: "Marketing Teams",
    problem: "Campaign Performance Real-time Monitoring",
    marketValue:
      "High Value - Real-time optimization, improve conversion rate by 20%",
    implementationMethod: "Metadata Supported" as const,
    implementationDifficulty: 2,
  },
  {
    id: "3-3",
    userProfile: "Marketing Teams",
    problem: "Customer Segmentation and Targeting",
    marketValue:
      "High Value - Precise targeting, improve campaign effectiveness by 40%",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 3,
  },
  {
    id: "3-4",
    userProfile: "Marketing Teams",
    problem: "Content Performance Analysis",
    marketValue:
      "Medium Value - Optimize content strategy, improve engagement by 25%",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 3,
  },
  {
    id: "3-5",
    userProfile: "Marketing Teams",
    problem: "Lead Scoring and Qualification",
    marketValue:
      "High Value - Improve lead quality, increase conversion rate by 30%",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 4,
  },
  {
    id: "3-6",
    userProfile: "Marketing Teams",
    problem: "Social Media Sentiment Analysis",
    marketValue:
      "Medium Value - Monitor brand reputation, respond quickly to issues",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 4,
  },
  {
    id: "3-7",
    userProfile: "Marketing Teams",
    problem: "Email Marketing Optimization",
    marketValue:
      "High Value - Improve open rates by 15%, increase click-through rates by 20%",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 3,
  },
  {
    id: "3-8",
    userProfile: "Marketing Teams",
    problem: "Cross-channel Attribution Analysis",
    marketValue:
      "High Value - Understand customer journey, optimize marketing mix",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 4,
  },
  {
    id: "3-9",
    userProfile: "Marketing Teams",
    problem: "Customer Lifetime Value Prediction",
    marketValue:
      "High Value - Identify high-value customers, improve retention by 25%",
    implementationMethod: "Requires Modeling" as const,
    implementationDifficulty: 4,
  },
  {
    id: "3-10",
    userProfile: "Marketing Teams",
    problem: "Marketing ROI Comprehensive Analysis",
    marketValue:
      "High Value - Optimize budget allocation, improve overall marketing efficiency",
    implementationMethod: "Metadata Supported" as const,
    implementationDifficulty: 2,
  },
].sort((a, b) => {
  // First by market value (High -> Medium -> Low)
  const aValue = a.marketValue.includes("High")
    ? 3
    : a.marketValue.includes("Medium")
    ? 2
    : 1;
  const bValue = b.marketValue.includes("High")
    ? 3
    : b.marketValue.includes("Medium")
    ? 2
    : 1;
  if (aValue !== bValue) {
    return bValue - aValue;
  }
  // Then by implementation difficulty (easy->hard)
  return a.implementationDifficulty - b.implementationDifficulty;
});

export function ConnectFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("connect");
  const [connectionUrl, setConnectionUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [readOnly, setReadOnly] = useState(true);
  const [markets, setMarkets] = useState<
    { id: string; title: string; analysis: any }[]
  >([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResultItem[]>(
    []
  );
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>("connecting");
  const [chatInput, setChatInput] = useState("");
  const [pendingChatInput, setPendingChatInput] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedUserProfiles, setSelectedUserProfiles] = useState<Set<string>>(
    new Set()
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [dataValidationError, setDataValidationError] = useState<string | null>(
    null
  );
  const [runError, setRunError] = useState<string | null>(null);
  const [hasValidated, setHasValidated] = useState<boolean>(false);
  const [showInputError, setShowInputError] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState("");
  const { user } = useAuth();
  const [progress, setProgress] = useState(0); // percentage
  const [jobStatus, setJobStatus] = useState("init");
  // const [connectionId, setConnectionId] = useState("");
  // Simplified database validation helper supporting test URLs and API keys
  const performRealDatabaseValidation = async (
    url: string,
    key: string
  ): Promise<void> => {
    // Valid test combinations for demos
    const validTestCombinations = [
      { url: "https://demo.supabase.co", key: "demo-key-abcdefghijklmnop" },
      {
        url: "https://example.supabase.co",
        key: "example-key-123456789012345",
      },
      {
        url: "https://myproject.supabase.co",
        key: "myproject-key-abcdefghijklmnopqrstuvwxyz",
      },
      { url: "https://localhost:3000", key: "localhost-key-123456789" },
    ];

    // Special combination: connection succeeds but data validation fails later
    const dataValidationFailedCombination = {
      url: "https://test.supabase.co",
      key: "test-api-key-123456789",
    };

    // Check whether this matches the data-validation failure combination
    if (
      url === dataValidationFailedCombination.url &&
      key === dataValidationFailedCombination.key
    ) {
      // Simulate latency for connection validation
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Connection succeeds; data validation will fail downstream
      return;
    }

    // Evaluate other valid test combos
    const isValidTest = validTestCombinations.some(
      (combo) => url === combo.url && key === combo.key
    );

    if (isValidTest) {
      // Simulate validation delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      return; // Validation passed
    }

    // Perform basic format validation for all other inputs
    if (!url.includes("supabase.co") && !url.includes("localhost")) {
      throw new Error(
        "Invalid Supabase URL format. Try: https://test.supabase.co"
      );
    }

    if (!key || key.length < 10) {
      throw new Error("Invalid API Key format. Try: test-api-key-123456789");
    }

    // Simulate failure (used for testing error handling)
    throw new Error(
      "Invalid Supabase URL format. Try: https://test.supabase.co"
    );
  };

  // Detect redirect from publish page and pre-populate markets defaults
  useEffect(() => {
    if (typeof window === "undefined") return;

    const skipToBusinessInsight = localStorage.getItem("skipToBusinessInsight");
    if (skipToBusinessInsight === "true") {
      // Clear the flag
      localStorage.removeItem("skipToBusinessInsight");

      // Load marketsData from localStorage and use as defaults
      const marketsDataStr = localStorage.getItem("marketsData");
      if (marketsDataStr) {
        try {
          const marketsData = JSON.parse(marketsDataStr);
          if (Array.isArray(marketsData) && marketsData.length > 0) {
            // Ensure every field has a default value when mapping markets
            const mappedMarkets = marketsData.map(
              (seg: any, index: number) => ({
                id: seg.id || seg.segmentId || seg.name || `segment-${index}`,
                title: seg.title || seg.name || "Untitled Segment",
                analysis: seg.analysis || {},
                valueQuestions: seg.valueQuestions || [],
              })
            );
            setMarkets(mappedMarkets);
          }
        } catch (e) {
          console.log("Failed to parse marketsData from localStorage:", e);
        }
      }

      // If run_result exists, jump directly to the results step
      const runResultStr = localStorage.getItem("run_result");
      if (runResultStr) {
        // Directly transition to the results step (business insight)
        setStep("results");
        setAnalysisStep("complete");
        setProgress(100);
        setHasValidated(true);

        // Seed default analysisResults so the page renders correctly
        // The results view requires either analysisResults or marketsDataWithDefaults
        setAnalysisResults((prev) => {
          if (prev.length === 0) {
            return testAnalysisData;
          }
          return prev;
        });
      }
    }
  }, []);

  // Compute fallback marketsData (used after publish-page redirects)
  const marketsDataWithDefaults = useMemo(() => {
    if (markets.length > 0) {
      return markets;
    }

    // When no markets are present, attempt to hydrate from localStorage
    if (typeof window !== "undefined") {
      try {
        const marketsDataStr = localStorage.getItem("marketsData");
        if (marketsDataStr) {
          const marketsData = JSON.parse(marketsDataStr);
          if (Array.isArray(marketsData) && marketsData.length > 0) {
            return marketsData.map((seg: any, index: number) => ({
              id: seg.id || seg.segmentId || seg.name || `segment-${index}`,
              title: seg.title || seg.name || "Untitled Segment",
              analysis: seg.analysis || {},
              valueQuestions: seg.valueQuestions || [],
            }));
          }
        }
      } catch (e) {
        console.log("Failed to parse marketsData from localStorage:", e);
      }
    }

    return [];
  }, [markets]);

  // useEffect(() => {
  //   // If URL param results=1, jump directly to results screen with existing/default suggestions
  //   const shouldShowResults = searchParams?.get("results") === "1";
  //   if (shouldShowResults) {
  //     // Keep previous results if any; otherwise show minimal placeholder so the page renders
  //     if (analysisResults.length === 0) {
  //       setAnalysisResults([
  //         {
  //           id: "seed-1",
  //           userProfile: "Product Managers",
  //           problem: "Explore more AI app ideas",
  //           marketValue: "Medium Value - Brainstorm based on your data context",
  //           implementationMethod: "Metadata Supported",
  //           implementationDifficulty: 1,
  //         },
  //       ]);
  //     }
  //     setStep("results");
  //     return;
  //   }

  //   if (step === "analyzing") {
  //     const steps: AnalysisStep[] = [
  //       "connecting",
  //       "validating-data",
  //       "reading-schema",
  //       "sampling-data",
  //       "evaluating",
  //       "complete",
  //     ];
  //     let currentIndex = 0;

  //     const interval = setInterval(() => {
  //       currentIndex++;
  //       if (currentIndex < steps.length) {
  //         setAnalysisStep(steps[currentIndex]);

  //         // Note: actual validation is completed within handleConnect
  //         // This section only updates progress visuals
  //       } else {
  //         clearInterval(interval);
  //         // When all steps finish, set analysis results and navigate to results
  //         setAnalysisResults(
  //           [
  //             // E-commerce Platform Operators - 10 problems
  //             {
  //               id: "1-1",
  //               userProfile: "E-commerce Platform Operators",
  //               problem: "Order Management and Tracking System",
  //               marketValue:
  //                 "High Value - Can improve operational efficiency by 50%, reduce customer service inquiries",
  //               implementationMethod: "Metadata Supported" as const,
  //               implementationDifficulty: 1,
  //             },
  //             {
  //               id: "1-2",
  //               userProfile: "E-commerce Platform Operators",
  //               problem: "Real-time Inventory Monitoring Dashboard",
  //               marketValue:
  //                 "High Value - Prevent overselling, improve inventory turnover by 30%",
  //               implementationMethod: "Metadata Supported" as const,
  //               implementationDifficulty: 1,
  //             },
  //             {
  //               id: "1-3",
  //               userProfile: "E-commerce Platform Operators",
  //               problem: "Return and Refund Process Management",
  //               marketValue:
  //                 "Medium Value - Simplify return process, improve customer satisfaction",
  //               implementationMethod: "Metadata Supported" as const,
  //               implementationDifficulty: 2,
  //             },
  //             {
  //               id: "1-4",
  //               userProfile: "E-commerce Platform Operators",
  //               problem: "Supplier Performance Analysis",
  //               marketValue:
  //                 "Medium Value - Optimize supply chain, reduce procurement costs by 15%",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 3,
  //             },
  //             {
  //               id: "1-5",
  //               userProfile: "E-commerce Platform Operators",
  //               problem: "Logistics Delivery Optimization Recommendations",
  //               marketValue:
  //                 "High Value - Reduce delivery costs by 20%, improve delivery efficiency",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 4,
  //             },
  //             {
  //               id: "1-6",
  //               userProfile: "E-commerce Platform Operators",
  //               problem: "Promotional Campaign Effectiveness Analysis",
  //               marketValue:
  //                 "High Value - Improve ROI by 40%, precise marketing targeting",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 3,
  //             },
  //             {
  //               id: "1-7",
  //               userProfile: "E-commerce Platform Operators",
  //               problem: "Customer Lifetime Value Prediction",
  //               marketValue:
  //                 "High Value - Identify high-value customers, improve repeat purchase rate by 25%",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 4,
  //             },
  //             {
  //               id: "1-8",
  //               userProfile: "E-commerce Platform Operators",
  //               problem: "Product Recommendation Engine",
  //               marketValue:
  //                 "High Value - Increase average order value by 30%, boost cross-selling",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 5,
  //             },
  //             {
  //               id: "1-9",
  //               userProfile: "E-commerce Platform Operators",
  //               problem: "Price Competitiveness Analysis",
  //               marketValue:
  //                 "Medium Value - Optimize pricing strategy, maintain market competitiveness",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 3,
  //             },
  //             {
  //               id: "1-10",
  //               userProfile: "E-commerce Platform Operators",
  //               problem: "Seasonal Demand Forecasting",
  //               marketValue:
  //                 "High Value - Optimize inventory planning, reduce stock accumulation",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 4,
  //             },
  //             // Product Managers - 10 problems
  //             {
  //               id: "2-1",
  //               userProfile: "Product Managers",
  //               problem: "Product Catalog and Inventory Display",
  //               marketValue:
  //                 "High Value - Improve product visibility, increase conversion rate",
  //               implementationMethod: "Metadata Supported" as const,
  //               implementationDifficulty: 1,
  //             },
  //             {
  //               id: "2-2",
  //               userProfile: "Product Managers",
  //               problem: "User Feedback Collection and Analysis",
  //               marketValue:
  //                 "High Value - Rapid product iteration, improve user satisfaction",
  //               implementationMethod: "Metadata Supported" as const,
  //               implementationDifficulty: 2,
  //             },
  //             {
  //               id: "2-3",
  //               userProfile: "Product Managers",
  //               problem: "Feature Usage Statistics",
  //               marketValue:
  //                 "Medium Value - Identify core features, optimize product roadmap",
  //               implementationMethod: "Metadata Supported" as const,
  //               implementationDifficulty: 2,
  //             },
  //             {
  //               id: "2-4",
  //               userProfile: "Product Managers",
  //               problem: "A/B Testing Results Analysis",
  //               marketValue:
  //                 "High Value - Data-driven decisions, improve product effectiveness",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 3,
  //             },
  //             {
  //               id: "2-5",
  //               userProfile: "Product Managers",
  //               problem: "User Churn Early Warning System",
  //               marketValue:
  //                 "High Value - Early intervention, reduce churn rate by 30%",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 4,
  //             },
  //             {
  //               id: "2-6",
  //               userProfile: "Product Managers",
  //               problem: "Competitor Feature Comparison Analysis",
  //               marketValue:
  //                 "Medium Value - Maintain competitive advantage, respond quickly to market",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 3,
  //             },
  //             {
  //               id: "2-7",
  //               userProfile: "Product Managers",
  //               problem: "Target User Segmentation",
  //               marketValue:
  //                 "High Value - Precise target user positioning, improve conversion",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 3,
  //             },
  //             {
  //               id: "2-8",
  //               userProfile: "Product Managers",
  //               problem: "Product Roadmap Priority Ranking",
  //               marketValue:
  //                 "Medium Value - Optimize resource allocation, accelerate product iteration",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 4,
  //             },
  //             {
  //               id: "2-9",
  //               userProfile: "Product Managers",
  //               problem: "New Feature Adoption Rate Prediction",
  //               marketValue:
  //                 "Medium Value - Evaluate feature value, reduce development risk",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 4,
  //             },
  //             {
  //               id: "2-10",
  //               userProfile: "Product Managers",
  //               problem: "User Journey Visualization",
  //               marketValue:
  //                 "High Value - Discover pain points, optimize user experience",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 3,
  //             },
  //             // Marketing Teams - 10 problems
  //             {
  //               id: "3-1",
  //               userProfile: "Marketing Teams",
  //               problem: "Customer Acquisition Cost Analysis",
  //               marketValue:
  //                 "High Value - Optimize marketing budget allocation, improve ROI by 35%",
  //               implementationMethod: "Metadata Supported" as const,
  //               implementationDifficulty: 1,
  //             },
  //             {
  //               id: "3-2",
  //               userProfile: "Marketing Teams",
  //               problem: "Campaign Performance Real-time Monitoring",
  //               marketValue:
  //                 "High Value - Real-time optimization, improve conversion rate by 20%",
  //               implementationMethod: "Metadata Supported" as const,
  //               implementationDifficulty: 2,
  //             },
  //             {
  //               id: "3-3",
  //               userProfile: "Marketing Teams",
  //               problem: "Customer Segmentation and Targeting",
  //               marketValue:
  //                 "High Value - Precise targeting, improve campaign effectiveness by 40%",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 3,
  //             },
  //             {
  //               id: "3-4",
  //               userProfile: "Marketing Teams",
  //               problem: "Content Performance Analysis",
  //               marketValue:
  //                 "Medium Value - Optimize content strategy, improve engagement by 25%",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 3,
  //             },
  //             {
  //               id: "3-5",
  //               userProfile: "Marketing Teams",
  //               problem: "Lead Scoring and Qualification",
  //               marketValue:
  //                 "High Value - Improve lead quality, increase conversion rate by 30%",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 4,
  //             },
  //             {
  //               id: "3-6",
  //               userProfile: "Marketing Teams",
  //               problem: "Social Media Sentiment Analysis",
  //               marketValue:
  //                 "Medium Value - Monitor brand reputation, respond quickly to issues",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 4,
  //             },
  //             {
  //               id: "3-7",
  //               userProfile: "Marketing Teams",
  //               problem: "Email Marketing Optimization",
  //               marketValue:
  //                 "High Value - Improve open rates by 15%, increase click-through rates by 20%",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 3,
  //             },
  //             {
  //               id: "3-8",
  //               userProfile: "Marketing Teams",
  //               problem: "Cross-channel Attribution Analysis",
  //               marketValue:
  //                 "High Value - Understand customer journey, optimize marketing mix",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 4,
  //             },
  //             {
  //               id: "3-9",
  //               userProfile: "Marketing Teams",
  //               problem: "Customer Lifetime Value Prediction",
  //               marketValue:
  //                 "High Value - Identify high-value customers, improve retention by 25%",
  //               implementationMethod: "Requires Modeling" as const,
  //               implementationDifficulty: 4,
  //             },
  //             {
  //               id: "3-10",
  //               userProfile: "Marketing Teams",
  //               problem: "Marketing ROI Comprehensive Analysis",
  //               marketValue:
  //                 "High Value - Optimize budget allocation, improve overall marketing efficiency",
  //               implementationMethod: "Metadata Supported" as const,
  //               implementationDifficulty: 2,
  //             },
  //           ].sort((a, b) => {
  //             // First by market value (High -> Medium -> Low)
  //             const aValue = a.marketValue.includes("High")
  //               ? 3
  //               : a.marketValue.includes("Medium")
  //               ? 2
  //               : 1;
  //             const bValue = b.marketValue.includes("High")
  //               ? 3
  //               : b.marketValue.includes("Medium")
  //               ? 2
  //               : 1;
  //             if (aValue !== bValue) {
  //               return bValue - aValue;
  //             }
  //             // Then by implementation difficulty (easy->hard)
  //             return a.implementationDifficulty - b.implementationDifficulty;
  //           })
  //         );
  //         // setStep("results");
  //       }
  //     }, 1900); // Halved duration to speed up the analysis flow

  //     return () => clearInterval(interval);
  //   }
  // }, [step, searchParams]);
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
    console.log("handleConnectAPI");

    // Clear previous error states
    setConnectionError(null);
    setDataValidationError(null);
    setRunError(null);
    setShowInputError(false);
    setStep("analyzing");
    setIsAnalyzing(false);

    // Validate connectionUrl format
    if (!connectionUrl || connectionUrl.trim() === "") {
      setConnectionError("Connection URL cannot be empty");
      return;
    }

    // Validate URL format
    // try {
    //   new URL(connectionUrl);
    // } catch (error) {
    //   setConnectionError("Invalid connection URL format");
    //   return;
    // }

    // Validate access token format
    if (!accessToken || accessToken.trim() === "") {
      setConnectionError("access token cannot be empty");
      return;
    }

    // Enforce minimum access token length (typically ≥ 8)
    if (accessToken.length < 8) {
      setConnectionError("Access token must be at least 8 characters long");
      return;
    }
    if (!apiKey || apiKey.trim() === "") {
      setConnectionError("API key cannot be empty");
      return;
    }

    // Enforce minimum API key length (typically ≥ 8)
    if (apiKey.length < 8) {
      setConnectionError("API key must be at least 8 characters long");
      return;
    }

    // Begin the analysis flow
    setStep("analyzing");
    setAnalysisStep("connecting");
    setProgress(0); // Initialize progress
    setIsAnalyzing(true);
    console.log(aaaa, "--------------------------------");
    let connectionId = "";
    let runData = {};
    try {
      console.log("Step 0: Validating connection...");
      setProgress(5); // Connection validation at 5%
      const validateRes = await fetch("/api/validate-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: connectionUrl,
          accessToken: accessToken,
        }),
      });
      if (!validateRes.ok) {
        let errorMsg = `Connection validation failed: ${validateRes.status}`;
        try {
          const errorData = await validateRes.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          const errorText = await validateRes.text();
          errorMsg = errorText?.slice(0, 200) || errorMsg;
        }
        setConnectionError(
          "Please check your API Key, Project ID or Access Token"
        );
        setDataValidationError(null);
        setAnalysisStep("connecting"); // Reset to connecting step (failure stage)
        setStep("analyzing");
        setIsAnalyzing(false);
        return; // Exit early, skip subsequent steps
      }
      const validateResData = await validateRes.json();
      console.log("Data validation successful:", validateResData);
      if (!validateResData.success) {
        setConnectionError(
          "Please check your API Key, Project ID or Access Token"
        );
        setDataValidationError(null);
        setAnalysisStep("connecting"); // Reset to connecting step (failure stage)
        setStep("analyzing");
        setIsAnalyzing(false);
        return; // Exit early, skip subsequent steps
      }
      // After validate-connection succeeds, continue with persistence
      try {
        const dataConnectionsResponse = await fetch("/api/data-connections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id || "",
            connectionInfo: {
              project_id: connectionUrl,
              access_token: accessToken,
              api_key: apiKey,
            },
            connectionSource: "supabase",
            status: "active",
          }),
        });
        const dataConnectionsData = await dataConnectionsResponse.json();
        console.log("Data connections successful:", dataConnectionsData);
        if (!dataConnectionsData.success) {
          throw new Error(
            dataConnectionsData.error || "Data connections failed"
          );
        }
        // connectionId corresponds to the id field in data_connections
        connectionId = dataConnectionsData.record?.id;
      } catch (e) {
        console.warn("save data_connections failed", e);
      }

      // Step 1 complete: database connection at 10%
      setProgress(10);

      // Steps 2 & 3: run data validation APIs
      // UI Step 2: Read Data Table Structure (reading-schema) - progress 0-20%
      // UI Step 3: Data Availability Validation (validating-data) - progress 20-40%
      console.log("Step 2-3: Validating data...");
      setAnalysisStep("reading-schema"); // Start UI Step 2
      setProgress(15); // Begin validation at 15%
      // const validateResponse = await fetch(
      //   "https://my-connector.onrender.com/review",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       supabase_project_id: connectionUrl,
      //       supabase_access_token: accessToken,
      //       user_name: "huimin",
      //     }),
      //   }
      // );
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
            project_id: connectionUrl,
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
        setAnalysisStep("validating-data"); // Surface UI Step 3
        setStep("analyzing");
        setIsAnalyzing(false);
        return;
      }

      const validateData = await validateResponse.json();
      console.log("Data validation successful:", validateData);

      // Midway through validation; transition to UI Step 3
      setAnalysisStep("validating-data"); // UI Step 3
      setProgress(30); // Validation at 30%

      if (validateData.validation_report.summary.status == "unusable") {
        setDataValidationError(
          validateData.validation_report.summary.note ||
            "Data validation failed"
        );
        setAnalysisStep("validating-data"); // Keep UI Step 3 active
        setStep("analyzing");
        setIsAnalyzing(false);
        return;
      }

      // Data validation finished, progress to 40%
      setProgress(40);
      runData = {
        user_id: user?.id || validateData.user_id,
        trace_id: validateData.trace_id,
        connection_id: connectionId || validateData.connection_id,
        data_structure: validateData.data_structure,
      };

      // Step 4: execute pipeline/run and begin polling
      console.log("Step 4: Running pipeline...");
      setAnalysisStep("sampling-data"); // UI Step 4
      setProgress(45); // Start pipeline/run at 45%

      // Connection approach 1
      // const connectResponse = await fetch("/api/connect", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ url: connectionUrl, key: accessToken }),
      // });
      // Connection approach 2
      // const connectResponse = await fetch(
      //   "https://my-connector.onrender.com/analyze",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       analysis_type: "all",
      //       supabase_project_id: connectionUrl,
      //       supabase_access_token: accessToken,
      //       user_name: "huimin",
      //       data_review_result: true,
      //     }),
      //     signal: AbortSignal.timeout(180000),
      //   }
      // );

      // if (!connectResponse.ok) {
      //   const errorData = await connectResponse.json();

      //   throw new Error(
      //     errorData.error || `Connection failed: ${connectResponse.status}`
      //   );
      // }

      // const connectData = await connectResponse.json();
      // console.log(
      //   "Database connection successful:",
      //   connectData.results.market_analysis
      // );
      // Connection approach 3
      const connectResponse = await fetch(
        "https://business-insight.datail.ai/api/v1/pipeline/run",
        // "http://192.168.30.159:8900/api/v1/pipeline/run",
        // "https://business-insight.datail.ai/api/v1/pipeline/run",
        // "https://business-insighter.onrender.com/api/v1/run-analysis",
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
        setAnalysisStep("sampling-data"); // Flag sampling-data step as failure point
        setStep("analyzing");
        setIsAnalyzing(false);
        return;
      }

      const connectData = await connectResponse.json();
      console.log("Pipeline run successful, job_id:", connectData.job_id);

      // Enter polling phase; update analysisStep based on progress
      // Progress allocation: polling consumes 40-80%, standal_sql uses 80-100%
      setJobStatus("waiting");
      const pollingResult = await pollJobProgress(
        connectData.job_id,
        (progress, status, data) => {
          if (progress !== null) {
            // Map polling progress (0-100) into 45-80 and keep analysisStep aligned
            const mappedProgress = 45 + Math.floor((progress / 100) * 35); // 45-80%
            setProgress(mappedProgress);
            // Remain within sampling-data (UI Step 4)
          }
          if (status) setJobStatus(status);
        },
        10000, // Poll every 10 seconds
        6 // Maximum polling window 6 minutes
      );
      if (pollingResult.status === "completed") {
        setJobStatus("done");
        setProgress(80); // Polling complete, progress at 80%
        console.log("pollingResult:", pollingResult);
      } else {
        setJobStatus(pollingResult.status || "error");
        setRunError(pollingResult.error || "Pipeline run failed");
        setStep("analyzing");
        setIsAnalyzing(false);
        return;
      }

      // Step 5: evaluating - call standal_sql endpoint
      // During standal_sql, progress spans 80% to 100%
      console.log("Step 5: Evaluating - calling standal_sql...");
      setAnalysisStep("evaluating"); // UI Step 5
      setProgress(85); // Initiate standal_sql at 85%
      let standalJson: any = {};
      try {
        const run_results = pollingResult?.run_results;
        if (!run_results) {
          throw new Error("No run_result found in polling result");
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 600_000); // 10 minute timeout

        setProgress(90); // standal_sql in progress, 90%
        const standalRes = await fetch(
          // "http://192.168.30.159:8900/api/v1/standal_sql",
          "https://business-insight.datail.ai/api/v1/standal_sql",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ run_results }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeout);
        const standalText = await standalRes.text();
        console.log(standalText, "standal_sql response");

        try {
          standalJson = JSON.parse(standalText);
        } catch {}

        if (!standalRes.ok) {
          throw new Error(
            typeof standalJson === "string"
              ? standalJson.slice(0, 200)
              : standalJson?.error || `standal_sql HTTP ${standalRes.status}`
          );
        }

        console.log("standal_sql completed successfully:", standalJson);
        localStorage.setItem(
          "standalJson",
          JSON.stringify({
            anchIndex: standalJson.run_results?.run_result?.anchIndex,
            segments: standalJson.run_results.run_result.segments,
          })
        );
        setProgress(100); // standal_sql finished, progress 100%
        // Success: continue to next steps
      } catch (e) {
        console.log("standal_sql call failed", e);
        const errorMsg =
          e instanceof Error ? e.message : "standal_sql request failed";
        setRunError(errorMsg);
        setAnalysisStep("evaluating");
        setStep("analyzing");
        setIsAnalyzing(false);
        return;
      }

      // Evaluating stage complete; mark as finished
      setAnalysisStep("complete");
      const segments = standalJson?.run_results?.run_result?.segments || [];

      // Persist run_result ensuring task_id is present
      const runResultToSave = {
        ...standalJson?.run_results.run_result,
        task_id:
          pollingResult?.run_results?.task_id ||
          pollingResult?.task_id ||
          standalJson?.run_results?.task_id,
      };
      localStorage.setItem("run_result", JSON.stringify(runResultToSave));

      // Save task_id separately in localStorage for durability
      if (runResultToSave.task_id) {
        localStorage.setItem("originalTaskId", runResultToSave.task_id);
      }
      const mapped = segments.map((seg: any) => ({
        id: seg.segmentId || seg.name,
        title: seg.name,
        analysis: seg.analysis,
        valueQuestions: seg.valueQuestions,
      }));
      setMarkets(mapped);
      try {
        localStorage.setItem("marketsData", JSON.stringify(mapped));
      } catch {}

      // Populate analysis results (page rendered via markets; demo data deprecated)
      setAnalysisResults(testAnalysisData);
      setStep("results");
      setIsAnalyzing(false);
      localStorage.setItem(
        "dbConnectionData",
        JSON.stringify({
          connectionUrl: connectionUrl,
          apiKey: apiKey,
          accessToken: accessToken,
          id: connectionId,
          connectionId: connectionId,
        })
      );
    } catch (error) {
      console.log("API call failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Derive error type based on where the failure occurred
      // Identify which step raised the failure
      if (
        analysisStep === "reading-schema" ||
        analysisStep === "validating-data"
      ) {
        // Data validation failure
        setDataValidationError(errorMessage);
        setRunError(null);
      } else if (analysisStep === "sampling-data") {
        // pipeline/run failure
        setRunError(errorMessage);
        setDataValidationError(null);
      } else if (analysisStep === "evaluating") {
        // standal_sql failure
        setRunError(errorMessage);
        setDataValidationError(null);
      } else {
        // Miscellaneous errors
        setRunError(errorMessage);
        setDataValidationError(null);
      }

      // Keep UI on analyzing step to display the error
      setStep("analyzing");
      setIsAnalyzing(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    // Store the chat input for later use
    setPendingChatInput(chatInput);
    setChatInput("");

    // Show the analysis progress window
    setStep("analyzing");
    setAnalysisStep("connecting");

    setTimeout(() => {
      const newIdea: AnalysisResultItem = {
        id: Date.now().toString(),
        userProfile: "Custom Requirements",
        problem: pendingChatInput,
        marketValue:
          Math.random() > 0.5
            ? "High Value - Generated based on your data analysis"
            : "Medium Value - Requires further evaluation",
        implementationMethod:
          Math.random() > 0.5 ? "Metadata Supported" : "Requires Modeling",
        implementationDifficulty: Math.floor(Math.random() * 3) + 1,
      };

      setAnalysisResults((prev) => [...prev, newIdea]);
      setPendingChatInput("");
      setStep("results");
    }, 500);
  };

  const toggleUserProfileSelection = (userProfile: string) => {
    setSelectedUserProfiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userProfile)) {
        newSet.delete(userProfile);
        // Deselect all items in this user group
        setSelectedItems((prevItems) => {
          const newItems = new Set(prevItems);
          analysisResults.forEach((result) => {
            if (result.userProfile === userProfile) {
              newItems.delete(result.id);
            }
          });
          return newItems;
        });
      } else {
        newSet.add(userProfile);
        // Select all items in this user group
        setSelectedItems((prevItems) => {
          const newItems = new Set(prevItems);
          analysisResults.forEach((result) => {
            if (result.userProfile === userProfile) {
              newItems.add(result.id);
            }
          });
          return newItems;
        });
      }
      return newSet;
    });
  };

  const getStepStatus = (stepName: AnalysisStep): StepVisualStatus => {
    // API order: connecting -> validating-data (UI Steps 2 & 3) -> pipeline/run (UI Step 4) -> standal_sql (UI Step 5)
    // UI order: connecting -> reading-schema (Step 2) -> validating-data (Step 3) -> sampling-data (Step 4) -> evaluating (Step 5)
    const steps: AnalysisStep[] = [
      "connecting",
      "reading-schema", // UI Step 2 executing validating-data API
      "validating-data", // UI Step 3 continuing validating-data API
      "sampling-data", // UI Step 4 running pipeline/polling
      "evaluating", // UI Step 5 executing standal_sql
      "complete",
    ];
    const currentIndex = steps.indexOf(analysisStep);
    const stepIndex = steps.indexOf(stepName);

    // When connection errors exist, determine status by step position
    if (connectionError) {
      const connectingIndex = steps.indexOf("connecting");
      const readingSchemaIndex = steps.indexOf("reading-schema");

      // Connection step failed; surface the error (UI handles messaging)
      if (stepName === "connecting") {
        return "error";
      }
      // Error while parked on reading-schema indicates failure in that step
      if (stepName === "reading-schema" && analysisStep === "reading-schema") {
        return "error";
      }
      // After connection failure, later steps should remain waiting
      if (stepIndex > connectingIndex) {
        // reading-schema with error means failure for that step
        if (
          stepIndex === readingSchemaIndex &&
          analysisStep === "reading-schema"
        ) {
          return "error";
        }
        return "waiting";
      }
      // Steps before connecting (e.g., validating-data) may already be complete or failed
      if (stepIndex < connectingIndex) {
        // If validating-data also reports an error, mark as failure
        if (stepName === "validating-data" && dataValidationError) {
          return "error";
        }
        // Otherwise treat as completed when the index is behind current
        return currentIndex > stepIndex ? "completed" : "waiting";
      }
    }

    // When runError exists (reading-schema failure), subsequent steps should wait
    if (runError) {
      if (stepName === "reading-schema") {
        return "error";
      }
      // After reading-schema failure, both validating-data and later steps wait
      const readingSchemaIndex = steps.indexOf("reading-schema");
      if (stepIndex > readingSchemaIndex) {
        return "waiting";
      }
    }

    // Highlight data validation errors when step is validating-data
    if (dataValidationError && stepName === "validating-data") {
      return "error";
    }

    // Special handling: when analysisStep is "connecting", both reading-schema and validating-data remain waiting
    // API order is validating-data -> reading-schema, while UI order is reading-schema -> validating-data
    // if (analysisStep === "connecting") {
    //   if (stepName === "validating-data") {
    //     // If the connection is still running, validation might be active or done
    //     // For safety, mark as completed only after connection finishes
    //     // Check for connection errors; absence suggests validation is underway
    //     return "waiting";
    //   }
    //   if (stepName === "connecting") {
    //     return "in-progress";
    //   }
    //   // Subsequent steps remain waiting
    //   return "waiting";
    // }

    // Normal flow: determine status based on position in step order
    // API order: validating-data (UI Steps 2 & 3) -> pipeline/run (UI Step 4) -> standal_sql (UI Step 5)
    // UI order: reading-schema (Step 2) -> validating-data (Step 3) -> sampling-data (Step 4) -> evaluating (Step 5)

    // If analysisStep is reading-schema, the validating-data API (UI Step 2) is active
    // reading-schema (UI Step 2) should be in-progress; validating-data (UI Step 3) should wait
    if (analysisStep === "reading-schema") {
      if (stepName === "reading-schema") {
        return "in-progress"; // UI Step 2 executing validating-data
      }
      if (stepName === "validating-data") {
        return "waiting"; // UI Step 3 awaiting validating-data completion
      }
    }

    // When the current step is validating-data, that API (UI Step 3) is executing
    // reading-schema (UI Step 2) should appear complete and validating-data (UI Step 3) should be in-progress
    if (analysisStep === "validating-data") {
      if (stepName === "reading-schema") {
        return "completed"; // UI Step 2 completed
      }
      if (stepName === "validating-data") {
        return "in-progress"; // UI Step 3 executing validating-data
      }
    }

    // All other cases fall back to the default progression
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

  const getMarketValueColor = (value: string) => {
    // This function is no longer directly used as marketValue is now text, but kept for potential future use
    if (value.startsWith("High Value"))
      return "bg-green-100 text-green-800 border-green-200";
    if (value.startsWith("Medium Value"))
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getImplementationColor = (method: string) => {
    return method === "Metadata Supported"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-purple-100 text-purple-800 border-purple-200";
  };

  const groupedResults = analysisResults.reduce((acc, result) => {
    if (!acc[result.userProfile]) {
      acc[result.userProfile] = [];
    }
    acc[result.userProfile].push(result);
    return acc;
  }, {} as Record<string, AnalysisResultItem[]>);

  const stepStatuses = {
    connecting: getStepStatus("connecting"),
    reading: getStepStatus("reading-schema"),
    validating: getStepStatus("validating-data"),
    sampling:
      connectionError || dataValidationError
        ? ("error" as StepVisualStatus)
        : getStepStatus("sampling-data"),
    evaluating:
      connectionError || dataValidationError
        ? ("error" as StepVisualStatus)
        : getStepStatus("evaluating"),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto pl-2 pr-4 max-w-6xl py-0">
        {/* Progress Steps */}

        {/* Step Content */}
        {step === "connect" && (
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-8 p-8">
              <h1 className="font-bold text-xl">
                Connect Your Supabase Database
              </h1>

              {/* Supabase URL */}
              <div className="space-y-3">
                <Label
                  htmlFor="supabase-url"
                  className="text-base font-semibold text-foreground"
                >
                  Project ID
                </Label>
                <div className="relative">
                  <Input
                    id="supabase-url"
                    placeholder="Please input Project ID"
                    value={connectionUrl}
                    onChange={(e) => {
                      setConnectionUrl(e.target.value);
                      setShowInputError(false);
                    }}
                    className={`h-12 pr-12 text-base ${
                      showInputError
                        ? "border-red-500 text-red-600 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                  />
                  <Database className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="size-4 mt-0.5 shrink-0" />
                  <span>
                    Project ID can be found in "Project Settings → General
                    Settings"
                  </span>
                </div>
              </div>

              {/* Supabase API Key */}
              <div className="space-y-3">
                <Label
                  htmlFor="api-key"
                  className="text-base font-semibold text-foreground"
                >
                  Access Token
                </Label>
                <div className="relative">
                  <Input
                    id="access-token"
                    placeholder="Please input Access Token"
                    value={accessToken}
                    onChange={(e) => {
                      setAccessToken(e.target.value);
                      setShowInputError(false);
                    }}
                    className={`h-12 pr-12 text-base ${
                      showInputError
                        ? "border-red-500 text-red-600 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    type="password"
                  />
                  <Database className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="size-4 mt-0.5 shrink-0" />
                  <span>
                    Access Token can be found in "Account Preferences → Access
                    Tokens"
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="api-key"
                  className="text-base font-semibold text-foreground"
                >
                  API Key
                </Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    placeholder="Please input API Key"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setShowInputError(false);
                    }}
                    className={`h-12 pr-12 text-base ${
                      showInputError
                        ? "border-red-500 text-red-600 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    type="password"
                  />
                  <Database className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="size-4 mt-0.5 shrink-0" />
                  <span>
                    APl Key can be found in "Project Settings → API Keys →
                    Publishable key"
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                className="w-full h-14 text-base"
                size="lg"
                onClick={handleConnectAPI}
                disabled={
                  !connectionUrl || !apiKey || !accessToken || isAnalyzing
                }
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Import and Analyse"
                )}
              </Button>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Info className="size-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-900">
                      You're in Control
                    </h4>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      Datail do not modify or upload any of your database
                      content. Access is strictly read-only.
                    </p>
                    <h4 className="font-semibold text-blue-900">
                      Data Access Details
                    </h4>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      Access permissions are used solely to read your database
                      structure and content for generating analysis results. No
                      data will be written to, updated, or deleted from your
                      database.{" "}
                    </p>
                  </div>
                </div>
              </div>

              {/* Test URL and API key hints */}
              {/* <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Info className="size-5 text-green-600 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-900">
                      🧪 Test with Demo Data
                    </h4>
                    <p className="text-sm text-green-800 leading-relaxed mb-3">
                      You can use these test combinations to try the full
                      analysis flow:
                    </p>
                    <div className="space-y-2 text-sm text-green-800">
                      <div className="font-mono bg-red-100 p-2 rounded border border-red-200">
                        <div>
                          <strong>URL:</strong> https://test.supabase.co
                        </div>
                        <div>
                          <strong>API Key:</strong> test-api-key-123456789
                        </div>
                        <div className="text-red-600 text-xs mt-1">
                          ⚠️ Connection succeeded but data validation failed
                        </div>
                      </div>
                      <div className="font-mono bg-green-100 p-2 rounded">
                        <div>
                          <strong>URL:</strong> https://demo.supabase.co
                        </div>
                        <div>
                          <strong>API Key:</strong> demo-key-abcdefghijklmnop
                        </div>
                      </div>
                      <div className="font-mono bg-green-100 p-2 rounded">
                        <div>
                          <strong>URL:</strong> https://example.supabase.co
                        </div>
                        <div>
                          <strong>API Key:</strong> example-key-123456789012345
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
            </CardContent>
          </Card>
        )}

        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h1 className="text-3xl font-bold mb-6 text-center">
              Analyzing Your Database
            </h1>
            <Card className="max-w-2xl mx-auto w-full">
              {/* <CardHeader>
                <CardTitle>Analyzing Your Database</CardTitle>
              </CardHeader> */}
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

                      {/* {getStepStatus("connecting") === "in-progress" && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {progress}%
                        </span>
                      )} */}
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
                        {/* <h4 className="font-bold text-red-900 text-lg">
                          🚨 Database Connection Failed
                        </h4>
                        <p className="text-red-800 font-medium">
                          {connectionError}
                        </p>
                        <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                          <p className="font-semibold text-red-900 mb-2">
                            🔍 Connection Problem Diagnosis:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                            <li>
                              Invalid Supabase URL format or project not found
                            </li>
                            <li>
                              Incorrect API Key or insufficient permissions
                            </li>
                            <li>
                              Network connectivity issues or firewall blocking
                            </li>
                            <li>Supabase service temporarily unavailable</li>
                            <li>
                              Database project may have been deleted or
                              suspended
                            </li>
                          </ul>
                        </div> */}
                        <h4 className="font-bold text-red-900 text-lg">
                          {connectionError}
                        </h4>
                        {/* <div className="bg-red-200 border border-red-300 rounded-lg p-4">
                          <p className="font-semibold text-red-900 mb-2">
                            💡 Suggested Solutions:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                            <li>
                              Verify the Supabase URL is correct and the project
                              exists
                            </li>
                            <li>
                              Check that the API Key is valid and has proper
                              permissions
                            </li>
                            <li>Ensure your network connection is stable</li>
                            <li>
                              Try using a different API Key or creating a new
                              one
                            </li>
                            <li>
                              Contact Supabase support if the problem persists
                            </li>
                          </ul>
                        </div> */}
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setStep("connect");
                              setConnectionError(null);
                              setDataValidationError(null);
                              setHasValidated(false);
                              setShowInputError(true);
                            }}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Reconnect
                          </Button>
                          {/* <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setConnectionUrl("");
                              setAccessToken("");
                              setConnectionError(null);
                              setDataValidationError(null);
                              setHasValidated(false);
                            }}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Clear and Refill
                          </Button> */}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Read Data Table Structure (metadata) - Step 2 in UI order */}
                {/* Hide Step 2 when Step 1 fails */}
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
                            onClick={() => {
                              setRunError(null);
                              setStep("connect");
                              setConnectionError(null);
                              setDataValidationError(null);
                              setHasValidated(false);
                              setShowInputError(true);
                            }}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Reconnect
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Availability Validation - Step 3 in UI order */}
                {/* Hide Step 3 when Step 1 fails */}
                {!connectionError && (
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {dataValidationError ? (
                        <XCircle className="size-6 text-red-600" />
                      ) : runError ? (
                        // If reading-schema fails, keep validating-data in waiting state
                        <Clock className="size-6 text-muted-foreground" />
                      ) : getStepStatus("validating-data") === "completed" ? (
                        <CheckCircle2 className="size-6 text-green-600" />
                      ) : getStepStatus("validating-data") === "in-progress" ? (
                        <Loader2 className="size-6 text-primary animate-spin" />
                      ) : (
                        <Clock className="size-6 text-muted-foreground" />
                      )}
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
                    {/* Display error messaging and guidance when data validation fails */}
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
                                  setStep("connect");
                                  setConnectionError(null);
                                  setDataValidationError(null);
                                  setHasValidated(false);
                                  setShowInputError(true);
                                }}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                Reconnect
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Skip subsequent steps when Step 3 fails */}
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

                        <div className="flex items-start gap-4">
                          <div className="mt-1">
                            <StepProgressIndicator
                              step="evaluating"
                              status={stepStatuses.evaluating}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                Evaluate Business Value and Generate
                                Recommendations
                              </span>
                              {/* {getStepStatus("evaluating") === "completed" && (
                            <span className="text-xs text-green-600 font-medium">
                              [✓]
                            </span>
                          )}
                              {getStepStatus("evaluating") ===
                                "in-progress" && (
                            <span className="text-xs text-primary font-medium">
                              [In Progress...]
                            </span>
                          )}
                          {getStepStatus("evaluating") === "waiting" && (
                            <span className="text-xs text-muted-foreground font-medium">
                              [Waiting...]
                            </span>
                              )} */}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              AI analyzes data value and recommends best ChatApp
                              templates
                            </p>
                          </div>
                        </div>

                        {/* Progress bar - only show if both connection and data validation are successful */}
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
          </div>
        )}

        {step === "results" &&
          (analysisResults.length > 0 ||
            marketsDataWithDefaults.length > 0) && (
            <div className="space-y-6">
              <Card className="leading-3 border-muted border-none -mt-12">
                <CardHeader></CardHeader>
                <CardContent className="space-y-6">
                  <MarketExplorationPage
                    marketsData={marketsDataWithDefaults}
                  />
                  {/* Debug info */}
                  {/* {process.env.NODE_ENV === "development" && (
                  <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                    <p>Markets data passed: {markets.length} items</p>
                    {markets.length > 0 && (
                      <pre className="mt-1 text-xs">
                        {JSON.stringify(markets[0], null, 2)}
                      </pre>
                    )}
                  </div>
                )} */}
                </CardContent>
              </Card>
            </div>
          )}
      </main>
    </div>
  );
}
