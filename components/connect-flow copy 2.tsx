"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
import aaaa from "@/formatted_analysis_result.json";
type Step = "connect" | "analyzing" | "results";
type AnalysisStep =
  | "connecting"
  | "validating-data"
  | "reading-schema"
  | "sampling-data"
  | "evaluating"
  | "complete";

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
  const [hasValidated, setHasValidated] = useState<boolean>(false);
  const [showInputError, setShowInputError] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState("");
  // Simplified database validation helper supporting test URLs and API keys
  const performRealDatabaseValidation = async (
    url: string,
    key: string
  ): Promise<void> => {
    // Valid test combinations
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

    // Special test combination: connection succeeds but data validation fails later
    const dataValidationFailedCombination = {
      url: "https://test.supabase.co",
      key: "test-api-key-123456789",
    };

    // Check if this is the data validation failure test combination
    if (
      url === dataValidationFailedCombination.url &&
      key === dataValidationFailedCombination.key
    ) {
      // Simulate connection validation delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Connection succeeds but subsequent steps will trigger data validation failure
      return;
    }

    // Check for other valid test combinations
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

    // Simulate validation failure (for testing error scenarios)
    throw new Error(
      "Invalid Supabase URL format. Try: https://test.supabase.co"
    );
  };

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

  //         // Note: Actual validation already happens inside handleConnect
  //         // This block now only updates progress visuals
  //       } else {
  //         clearInterval(interval);
  //         // When all steps finish, set analysis results and move to the results page
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
  //     }, 1900); // Half the previous duration to speed up analysis

  //     return () => clearInterval(interval);
  //   }
  // }, [step, searchParams]);
  const handleConnectAPI = async () => {
    console.log("handleConnectAPI");

    // Clear previous error messages
    setConnectionError(null);
    setDataValidationError(null);
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

    // Ensure access token length (typically at least 8 characters)
    if (accessToken.length < 8) {
      setConnectionError("Access token must be at least 8 characters long");
      return;
    }
    if (!apiKey || apiKey.trim() === "") {
      setConnectionError("API key cannot be empty");
      return;
    }

    // Ensure API Key length (typically at least 8 characters)
    if (apiKey.length < 8) {
      setConnectionError("API key must be at least 8 characters long");
      return;
    }

    // Begin the analysis flow
    setStep("analyzing");
    setAnalysisStep("connecting");
    setIsAnalyzing(true);
    console.log(aaaa, "--------------------------------");
    try {
      // Step 1: connect to the database
      console.log("Step 1: Connecting to database...");
      // const connectResponse = await fetch("/api/connect", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ url: connectionUrl, key: accessToken }),
      // });
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
      // // Connection succeeded, proceed to data validation
      // setAnalysisStep("validating-data");

      // // Step 2: data validation
      // console.log("Step 2: Validating data...");
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

      // if (!validateResponse.ok) {
      //   const errorData = await validateResponse.json();
      //   throw new Error(
      //     errorData.error ||
      //       `Data validation failed: ${validateResponse.status}`
      //   );
      // }

      // const validateData = await validateResponse.json();
      // console.log("Data validation successful:", validateData);
      // if (!validateData.final_conclusion) {
      //   setDataValidationError(
      //     "Data authenticity validation failed: No available data tables or empty data in database"
      //   );
      //   return;
      // }

      // Data validation succeeded, continue to subsequent steps
      setAnalysisStep("reading-schema");

      // Simulate progress for the next steps
      const steps = [
        "reading-schema",
        "sampling-data",
        "evaluating",
        "complete",
      ];
      for (let i = 0; i < steps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setAnalysisStep(steps[i] as AnalysisStep);
      }

      // Fetch analysis results
      // const analyzeResponse = await fetch("/api/analyze", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ url: connectionUrl, key: accessToken }),
      // });

      // if (!analyzeResponse.ok) {
      //   throw new Error("Analysis failed");
      // }

      // const analyzeData = await analyzeResponse.json();
      // setAnalysisResults(analyzeData.results || []);
      setAnalysisResults(testAnalysisData);
      setStep("results");
      setIsAnalyzing(false);
      localStorage.setItem(
        "dbConnectionData",
        JSON.stringify({
          connectionUrl: connectionUrl,
          apiKey: apiKey,
          accessToken: accessToken,
        })
      );
    } catch (error) {
      console.log("API call failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Set the appropriate error based on the current step
      if (analysisStep === "connecting") {
        setConnectionError(`Connection failed: ${errorMessage}`);
      } else if (analysisStep === "validating-data") {
        setDataValidationError(`Data validation failed: ${errorMessage}`);
      } else {
        setConnectionError(`Processing failed: ${errorMessage}`);
      }

      // Stay on the analyzing step to display error state
      setStep("analyzing");
      setIsAnalyzing(false);
    }
  };
  const handleConnect = async () => {
    if (!connectionUrl) return;

    setStep("analyzing");
    setAnalysisStep("connecting");
    setConnectionError(null); // Reset connection error
    setDataValidationError(null); // Reset data validation error

    // If already validated, skip the validation steps
    if (hasValidated) {
      // Proceed directly to later stages
      setTimeout(() => {
        const initialResults: AnalysisResultItem[] = [
          // E-commerce Platform Operators - 10 problems
          {
            id: "1-1",
            userProfile: "E-commerce Platform Operators",
            problem: "Order Management and Tracking System",
            marketValue:
              "High Value - Can improve operational efficiency by 50%, reduce customer service inquiries",
            implementationMethod: "Metadata Supported",
            implementationDifficulty: 1,
          },
          {
            id: "1-2",
            userProfile: "E-commerce Platform Operators",
            problem: "Real-time Inventory Monitoring Dashboard",
            marketValue:
              "High Value - Prevent overselling, improve inventory turnover by 30%",
            implementationMethod: "Metadata Supported",
            implementationDifficulty: 1,
          },
          {
            id: "1-3",
            userProfile: "E-commerce Platform Operators",
            problem: "Return and Refund Process Management",
            marketValue:
              "Medium Value - Simplify return process, improve customer satisfaction",
            implementationMethod: "Metadata Supported",
            implementationDifficulty: 2,
          },
          {
            id: "1-4",
            userProfile: "E-commerce Platform Operators",
            problem: "Supplier Performance Analysis",
            marketValue:
              "Medium Value - Optimize supply chain, reduce procurement costs by 15%",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 3,
          },
          {
            id: "1-5",
            userProfile: "E-commerce Platform Operators",
            problem: "Logistics Delivery Optimization Recommendations",
            marketValue:
              "High Value - Reduce delivery costs by 20%, improve delivery efficiency",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 4,
          },
          {
            id: "1-6",
            userProfile: "E-commerce Platform Operators",
            problem: "Promotional Campaign Effectiveness Analysis",
            marketValue:
              "High Value - Improve ROI by 40%, precise marketing targeting",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 3,
          },
          {
            id: "1-7",
            userProfile: "E-commerce Platform Operators",
            problem: "Customer Lifetime Value Prediction",
            marketValue:
              "High Value - Identify high-value customers, improve repeat purchase rate by 25%",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 4,
          },
          {
            id: "1-8",
            userProfile: "E-commerce Platform Operators",
            problem: "Product Recommendation Engine",
            marketValue:
              "High Value - Increase average order value by 30%, boost cross-selling",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 5,
          },
          {
            id: "1-9",
            userProfile: "E-commerce Platform Operators",
            problem: "Price Competitiveness Analysis",
            marketValue:
              "Medium Value - Optimize pricing strategy, maintain market competitiveness",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 3,
          },
          {
            id: "1-10",
            userProfile: "E-commerce Platform Operators",
            problem: "Seasonal Demand Forecasting",
            marketValue:
              "High Value - Optimize inventory planning, reduce stock accumulation",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 4,
          },
          // Product Managers - 10 problems
          {
            id: "2-1",
            userProfile: "Product Managers",
            problem: "Product Catalog and Inventory Display",
            marketValue:
              "High Value - Improve product visibility, increase conversion rate",
            implementationMethod: "Metadata Supported",
            implementationDifficulty: 1,
          },
          {
            id: "2-2",
            userProfile: "Product Managers",
            problem: "User Feedback Collection and Analysis",
            marketValue:
              "High Value - Rapid product iteration, improve user satisfaction",
            implementationMethod: "Metadata Supported",
            implementationDifficulty: 2,
          },
          {
            id: "2-3",
            userProfile: "Product Managers",
            problem: "Feature Usage Statistics",
            marketValue:
              "Medium Value - Identify core features, optimize product roadmap",
            implementationMethod: "Metadata Supported",
            implementationDifficulty: 2,
          },
          {
            id: "2-4",
            userProfile: "Product Managers",
            problem: "A/B Testing Results Analysis",
            marketValue:
              "High Value - Data-driven decisions, improve product effectiveness",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 3,
          },
          {
            id: "2-5",
            userProfile: "Product Managers",
            problem: "User Churn Early Warning System",
            marketValue:
              "High Value - Early intervention, reduce churn rate by 30%",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 4,
          },
          {
            id: "2-6",
            userProfile: "Product Managers",
            problem: "Competitor Feature Comparison Analysis",
            marketValue:
              "Medium Value - Maintain competitive advantage, respond quickly to market",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 3,
          },
          {
            id: "2-7",
            userProfile: "Product Managers",
            problem: "Target User Segmentation",
            marketValue:
              "High Value - Precise target user positioning, improve conversion",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 3,
          },
          {
            id: "2-8",
            userProfile: "Product Managers",
            problem: "Product Roadmap Priority Ranking",
            marketValue:
              "Medium Value - Optimize resource allocation, accelerate product iteration",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 4,
          },
          {
            id: "2-9",
            userProfile: "Product Managers",
            problem: "New Feature Adoption Rate Prediction",
            marketValue:
              "Medium Value - Evaluate feature value, reduce development risk",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 4,
          },
          {
            id: "2-10",
            userProfile: "Product Managers",
            problem: "User Journey Visualization",
            marketValue:
              "High Value - Discover pain points, optimize user experience",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 3,
          },
          // Data Analysts - 10 problems
          {
            id: "3-1",
            userProfile: "Data Analysts",
            problem: "Sales Trend Visualization Dashboard",
            marketValue:
              "High Value - Real-time business performance insights, quick decision making",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 3,
          },
          {
            id: "3-2",
            userProfile: "Data Analysts",
            problem: "Multi-dimensional Data Drill-down Analysis",
            marketValue:
              "High Value - Deep data value mining, discover hidden opportunities",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 4,
          },
          {
            id: "3-3",
            userProfile: "Data Analysts",
            problem: "Anomaly Data Detection and Alerting",
            marketValue:
              "Medium Value - Timely problem detection, reduce losses",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 3,
          },
          {
            id: "3-4",
            userProfile: "Data Analysts",
            problem: "Automated Report Generation",
            marketValue:
              "Medium Value - Save 80% report time, improve efficiency",
            implementationMethod: "Metadata Supported",
            implementationDifficulty: 2,
          },
          {
            id: "3-5",
            userProfile: "Data Analysts",
            problem: "Prediction Model Accuracy Monitoring",
            marketValue:
              "High Value - Continuously optimize models, improve prediction accuracy",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 4,
          },
          {
            id: "3-6",
            userProfile: "Data Analysts",
            problem: "Customer Segmentation and Clustering Analysis",
            marketValue:
              "High Value - Precisely identify customer groups, improve marketing effectiveness",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 3,
          },
          {
            id: "3-7",
            userProfile: "Data Analysts",
            problem: "Key Metrics Real-time Monitoring",
            marketValue:
              "High Value - Quick response to business changes, seize opportunities",
            implementationMethod: "Metadata Supported",
            implementationDifficulty: 2,
          },
          {
            id: "3-8",
            userProfile: "Data Analysts",
            problem: "Data Quality Assessment Report",
            marketValue:
              "Medium Value - Ensure data reliability, improve analysis accuracy",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 3,
          },
          {
            id: "3-9",
            userProfile: "Data Analysts",
            problem: "Business Attribution Analysis",
            marketValue:
              "High Value - Find growth drivers, optimize resource allocation",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 4,
          },
          {
            id: "3-10",
            userProfile: "Data Analysts",
            problem: "Competitor Data Comparison",
            marketValue:
              "Medium Value - Understand market positioning, develop competitive strategies",
            implementationMethod: "Requires Modeling",
            implementationDifficulty: 3,
          },
        ];

        const sorted = initialResults.sort((a, b) => {
          // First, group by user profile
          if (a.userProfile !== b.userProfile) {
            return a.userProfile.localeCompare(b.userProfile, "en-US");
          }

          // Within same profile, sort by market value (high->low)
          const getValueLevel = (text: string) => {
            if (text.startsWith("High Value")) return 3;
            if (text.startsWith("Medium Value")) return 2;
            return 1;
          };

          const aValue = getValueLevel(a.marketValue);
          const bValue = getValueLevel(b.marketValue);

          if (aValue !== bValue) {
            return bValue - aValue;
          }
          // Then by implementation difficulty (easy->hard)
          return a.implementationDifficulty - b.implementationDifficulty;
        });

        setAnalysisResults(sorted);
        setStep("results");
      }, 500);
    } else {
      // If validation has not run, perform the real validation
      try {
        await performRealDatabaseValidation(connectionUrl, accessToken);
        // Validation succeeded, mark as verified
        setHasValidated(true);

        // Special case: for the test.supabase.co combo, perform authenticity validation in step two
        if (
          connectionUrl === "https://test.supabase.co" &&
          accessToken === "test-api-key-123456789"
        ) {
          // Simulate data authenticity validation failure
          setTimeout(() => {
            setDataValidationError(
              "Data authenticity validation failed: No available data tables or empty data in database"
            );
          }, 1000); // Half of the original duration
          return;
        }

        // Do not jump ahead here; allow the useEffect step logic to continue
        // This ensures the user can see the full validation progress
        // setTimeout(() => {
        const initialResults: AnalysisResultItem[] = [
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
            marketValue:
              "High Value - Improve ROI by 40%, precise marketing targeting",
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
            problem: "Product Performance Analytics Dashboard",
            marketValue:
              "High Value - Data-driven product decisions, improve product success rate",
            implementationMethod: "Metadata Supported" as const,
            implementationDifficulty: 2,
          },
          {
            id: "2-3",
            userProfile: "Product Managers",
            problem: "User Behavior Analysis and Heatmaps",
            marketValue:
              "High Value - Optimize user experience, increase user engagement by 35%",
            implementationMethod: "Requires Modeling" as const,
            implementationDifficulty: 3,
          },
          {
            id: "2-4",
            userProfile: "Product Managers",
            problem: "A/B Testing Results Analysis",
            marketValue:
              "Medium Value - Improve conversion rates, optimize product features",
            implementationMethod: "Requires Modeling" as const,
            implementationDifficulty: 2,
          },
          {
            id: "2-5",
            userProfile: "Product Managers",
            problem: "Feature Usage Statistics and Insights",
            marketValue:
              "High Value - Identify popular features, guide product roadmap",
            implementationMethod: "Metadata Supported" as const,
            implementationDifficulty: 1,
          },
          {
            id: "2-6",
            userProfile: "Product Managers",
            problem: "Competitor Analysis and Market Positioning",
            marketValue:
              "Medium Value - Maintain competitive advantage, identify market opportunities",
            implementationMethod: "Requires Modeling" as const,
            implementationDifficulty: 4,
          },
          {
            id: "2-7",
            userProfile: "Product Managers",
            problem: "Product Lifecycle Management",
            marketValue:
              "High Value - Optimize product launch timing, improve lifecycle efficiency",
            implementationMethod: "Requires Modeling" as const,
            implementationDifficulty: 3,
          },
          {
            id: "2-8",
            userProfile: "Product Managers",
            problem: "Customer Feedback Sentiment Analysis",
            marketValue:
              "High Value - Improve product quality, enhance customer satisfaction",
            implementationMethod: "Requires Modeling" as const,
            implementationDifficulty: 4,
          },
          {
            id: "2-9",
            userProfile: "Product Managers",
            problem: "Product Roadmap Optimization",
            marketValue:
              "Medium Value - Align development priorities with business goals",
            implementationMethod: "Requires Modeling" as const,
            implementationDifficulty: 3,
          },
          {
            id: "2-10",
            userProfile: "Product Managers",
            problem: "Technical Debt Assessment and Prioritization",
            marketValue:
              "Medium Value - Improve code quality, reduce maintenance costs",
            implementationMethod: "Requires Modeling" as const,
            implementationDifficulty: 2,
          },
          // Marketing Teams - 10 problems
          {
            id: "3-1",
            userProfile: "Marketing Teams",
            problem: "Campaign Performance Tracking Dashboard",
            marketValue:
              "High Value - Optimize marketing ROI, improve campaign effectiveness",
            implementationMethod: "Metadata Supported" as const,
            implementationDifficulty: 1,
          },
          {
            id: "3-2",
            userProfile: "Marketing Teams",
            problem: "Customer Segmentation and Targeting",
            marketValue:
              "High Value - Improve targeting accuracy, increase conversion rates by 40%",
            implementationMethod: "Requires Modeling" as const,
            implementationDifficulty: 3,
          },
          {
            id: "3-3",
            userProfile: "Marketing Teams",
            problem: "Social Media Analytics and Engagement",
            marketValue:
              "High Value - Enhance brand presence, improve social media ROI",
            implementationMethod: "Requires Modeling" as const,
            implementationDifficulty: 2,
          },
          {
            id: "3-4",
            userProfile: "Marketing Teams",
            problem: "Email Marketing Optimization",
            marketValue:
              "High Value - Increase open rates by 25%, improve email campaign performance",
            implementationMethod: "Requires Modeling" as const,
            implementationDifficulty: 2,
          },
          {
            id: "3-5",
            userProfile: "Marketing Teams",
            problem: "Content Performance Analysis",
            marketValue:
              "Medium Value - Optimize content strategy, improve engagement metrics",
            implementationMethod: "Requires Modeling" as const,
            implementationDifficulty: 3,
          },
          {
            id: "3-6",
            userProfile: "Marketing Teams",
            problem: "Lead Scoring and Qualification",
            marketValue:
              "High Value - Improve lead quality, increase sales conversion by 30%",
            implementationMethod: "Requires Modeling" as const,
            implementationDifficulty: 4,
          },
          {
            id: "3-7",
            userProfile: "Marketing Teams",
            problem: "Marketing Attribution Analysis",
            marketValue:
              "High Value - Optimize marketing spend allocation, improve ROI measurement",
            implementationMethod: "Requires Modeling" as const,
            implementationDifficulty: 4,
          },
          {
            id: "3-8",
            userProfile: "Marketing Teams",
            problem: "Brand Sentiment Monitoring",
            marketValue:
              "Medium Value - Protect brand reputation, improve brand perception",
            implementationMethod: "Requires Modeling" as const,
            implementationDifficulty: 3,
          },
          {
            id: "3-9",
            userProfile: "Marketing Teams",
            problem: "Marketing Budget Optimization",
            marketValue:
              "High Value - Maximize marketing efficiency, reduce wasted spend",
            implementationMethod: "Requires Modeling" as const,
            implementationDifficulty: 3,
          },
          {
            id: "3-10",
            userProfile: "Marketing Teams",
            problem: "Cross-Channel Marketing Coordination",
            marketValue:
              "Medium Value - Improve marketing consistency, enhance customer experience",
            implementationMethod: "Requires Modeling" as const,
            implementationDifficulty: 2,
          },
        ];

        // Sort results by user profile, then by market value, then by implementation difficulty
        const sorted = initialResults.sort((a, b) => {
          // First by user profile
          if (a.userProfile !== b.userProfile) {
            return a.userProfile.localeCompare(b.userProfile);
          }

          // Within same profile, sort by market value (high->low)
          const getValueLevel = (text: string) => {
            if (text.startsWith("High Value")) return 3;
            if (text.startsWith("Medium Value")) return 2;
            return 1;
          };

          const aValue = getValueLevel(a.marketValue);
          const bValue = getValueLevel(b.marketValue);

          if (aValue !== bValue) {
            return bValue - aValue;
          }
          // Then by implementation difficulty (easy->hard)
          return a.implementationDifficulty - b.implementationDifficulty;
        });

        // setAnalysisResults(sorted)
        // setStep("results")
        // }, 1000)
      } catch (error) {
        console.log("Database connection failed:", error);
        setConnectionError(
          `Database connection failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        // Stop the flow when the connection fails
        return;
      }
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

  const getStepStatus = (stepName: AnalysisStep) => {
    const steps: AnalysisStep[] = [
      "connecting",
      "validating-data",
      "reading-schema",
      "sampling-data",
      "evaluating",
      "complete",
    ];
    const currentIndex = steps.indexOf(analysisStep);
    const stepIndex = steps.indexOf(stepName);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "in-progress";
    return "waiting";
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
                  <span>Project ID can be found in "Project Settings → General Settings"</span>
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
                  <span>Access Token can be found in "Account Preferences →
Access Tokens"</span>
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
                  <span>APl Key can be found in "Project Settings → API Keys
→ Publishable key"</span>
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
                     Datail do not modify or upload any of your database content. Access is strictly read-only.
                    </p>
                    <h4 className="font-semibold text-blue-900">
                      Data Access Details
                    </h4>
                    <p className="text-sm text-blue-800 leading-relaxed">
                    Access permissions are used solely to read your database structure and content for generating analysis results.
                    No data will be written to, updated, or deleted from your database.                    </p>
                  </div>
                </div>
              </div>

              {/* Test URL and API Key hints */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-3">
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
                          ⚠️ Connection succeeded but data authenticity validation failed
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
              </div>
            </CardContent>
          </Card>
        )}

        {step === "analyzing" && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-2xl mx-auto w-full">
              <CardHeader>
                <CardTitle>Analyzing Your Database</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 py-8">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {connectionError ? (
                      <XCircle className="size-6 text-red-600" />
                    ) : getStepStatus("connecting") === "completed" ? (
                      <CheckCircle2 className="size-6 text-green-600" />
                    ) : getStepStatus("connecting") === "in-progress" ? (
                      <Loader2 className="size-6 text-primary animate-spin" />
                    ) : (
                      <Clock className="size-6 text-muted-foreground" />
                    )}
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

                {/* Display database connection error details when failure occurs */}
                {connectionError && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="size-6 text-red-600 mt-0.5 shrink-0" />
                      <div className="space-y-3">
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

                {/* Data Availability Validation */}

                {/* Show error details and suggestions when data authenticity validation fails */}
                {dataValidationError && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="size-6 text-red-600 mt-0.5 shrink-0" />
                      <div className="space-y-3">
                        <h4 className="font-bold text-red-900 text-lg">
                          🚨 Data Authenticity Validation Failed
                        </h4>
                        <p className="text-red-800 font-medium">
                          {dataValidationError}
                        </p>
                        <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                          <p className="font-semibold text-red-900 mb-2">
                            🔍 Data Problem Diagnosis:
                          </p>
                        </div>
                        <div className="bg-red-200 border border-red-300 rounded-lg p-4">
                          <p className="font-semibold text-red-900 mb-2">
                            💡 Suggested Solutions:
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // setConnectionUrl("");
                              // setAccessToken("");
                              // setConnectionError(null);
                              // setDataValidationError(null);
                              // setHasValidated(false); // Reset validation status
                              setIsAnalyzing(false);
                              setStep("connect");
                              setConnectionError(null);
                              setDataValidationError(null);
                              setHasValidated(false);
                              setShowInputError(true);
                            }}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Back
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Only show subsequent steps if both connection and data validation are successful */}
                {!connectionError && !dataValidationError && (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {dataValidationError ? (
                          <XCircle className="size-6 text-red-600" />
                        ) : getStepStatus("validating-data") === "completed" ? (
                          <CheckCircle2 className="size-6 text-green-600" />
                        ) : getStepStatus("validating-data") ===
                          "in-progress" ? (
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
                            : "Check data integrity and accessibility"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {connectionError || dataValidationError ? (
                          <XCircle className="size-6 text-red-600" />
                        ) : getStepStatus("reading-schema") === "completed" ? (
                          <CheckCircle2 className="size-6 text-green-600" />
                        ) : getStepStatus("reading-schema") ===
                          "in-progress" ? (
                          <Loader2 className="size-6 text-primary animate-spin" />
                        ) : (
                          <Clock className="size-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            Read Data Table Structure (metadata)
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Analyze table structure, field types and relationships
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {connectionError || dataValidationError ? (
                          <XCircle className="size-6 text-red-600" />
                        ) : getStepStatus("sampling-data") === "completed" ? (
                          <CheckCircle2 className="size-6 text-green-600" />
                        ) : getStepStatus("sampling-data") === "in-progress" ? (
                          <Loader2 className="size-6 text-primary animate-spin" />
                        ) : (
                          <Clock className="size-6 text-muted-foreground" />
                        )}
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
                        {connectionError || dataValidationError ? (
                          <XCircle className="size-6 text-red-600" />
                        ) : getStepStatus("evaluating") === "completed" ? (
                          <CheckCircle2 className="size-6 text-green-600" />
                        ) : getStepStatus("evaluating") === "in-progress" ? (
                          <Loader2 className="size-6 text-primary animate-spin" />
                        ) : (
                          <Clock className="size-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            Evaluate Business Value and Generate Recommendations
                          </span>
                          {getStepStatus("evaluating") === "completed" && (
                            <span className="text-xs text-green-600 font-medium">
                              [✓]
                            </span>
                          )}
                          {getStepStatus("evaluating") === "in-progress" && (
                            <span className="text-xs text-primary font-medium">
                              [In Progress...]
                            </span>
                          )}
                          {getStepStatus("evaluating") === "waiting" && (
                            <span className="text-xs text-muted-foreground font-medium">
                              [Waiting...]
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          AI analyzes data value and recommends best
                          ChatApp templates
                        </p>
                      </div>
                    </div>

                    {/* Progress bar - only show if both connection and data validation are successful */}
                    {!connectionError && !dataValidationError && (
                      <div className="pt-4">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{
                              width: `${
                                analysisStep === "connecting"
                                  ? 20
                                  : analysisStep === "validating-data"
                                  ? 40
                                  : analysisStep === "reading-schema"
                                  ? 60
                                  : analysisStep === "sampling-data"
                                  ? 80
                                  : 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === "results" && analysisResults.length > 0 && (
          <div className="space-y-6">
            <Card className="leading-3 border-muted border-none -mt-12">
              <CardHeader></CardHeader>
              <CardContent className="space-y-6">
                {/* Results Table */}
                <div className="mb-3">
                  <h1 className="text-2xl font-semibold">
                    <span className="text-4xl font-bold">30</span> business
                    opportunities found for you
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select the ones you are interested in
                  </p>
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 gap-8 bg-muted/50 p-4 font-semibold text-sm border-b border-border py-2">
                    <div className="col-span-1 flex items-center justify-center">
                      Select
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      <Users className="size-4" />
                      Target User
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      <Target className="size-4" />
                      Solvable Problems
                    </div>
                    <div className="col-span-4 flex items-center gap-2">
                      <TrendingUp className="size-4" />
                      Market Value Estimation
                    </div>
                    {/* <div className="col-span-2 flex items-center gap-2">
                      <Wrench className="size-4" />
                      Implementation Method
                    </div> */}
                  </div>

                  <div className="divide-y divide-border">
                    {Object.entries(groupedResults).map(
                      ([userProfile, results]) => (
                        <div key={userProfile}>
                          {results.map((result, index) => (
                            <div
                              key={result.id}
                              className="grid grid-cols-12 hover:bg-muted/30 transition-colors leading-[0.8rem] gap-3 px-3 py-3"
                            >
                              <div className="col-span-1 flex items-center justify-center">
                                {index === 0 && (
                                  <Checkbox
                                    checked={selectedUserProfiles.has(
                                      userProfile
                                    )}
                                    onCheckedChange={() =>
                                      toggleUserProfileSelection(userProfile)
                                    }
                                  />
                                )}
                              </div>
                              <div className="col-span-2 text-sm font-medium text-center">
                                {index === 0 ? result.userProfile : ""}
                              </div>
                              <div className="col-span-3 text-sm">
                                {result.problem}
                              </div>
                              <div className="col-span-4 text-sm font-bold text-black">
                                {result.marketValue}
                              </div>
                              {/* <div className="col-span-2">
                                <Badge
                                  variant="outline"
                                  className={getImplementationColor(
                                    result.implementationMethod
                                  )}
                                >
                                  {result.implementationMethod}
                                </Badge>
                              </div> */}
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Exploration Chatbox */}
                <div className="relative">
                  <Textarea
                    placeholder="e.g., Help me analyze user repurchase rate, predict product sales trends..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSubmit();
                      }
                    }}
                    rows={4}
                    className="w-full pr-14 resize-none"
                    disabled={false}
                  />
                  <Button
                    onClick={handleChatSubmit}
                    disabled={!chatInput.trim()}
                    size="icon"
                    className="absolute bottom-2 right-2 h-9 w-9 p-0"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    const selectedIds = Array.from(selectedItems);
                    const selectedResults = analysisResults.filter((r) =>
                      selectedIds.includes(r.id)
                    );
                    // Store in localStorage for the generate page to access
                    localStorage.setItem(
                      "selectedProblems",
                      JSON.stringify(selectedResults)
                    );
                    router.push("/generate");
                  }}
                  disabled={selectedItems.size === 0}
                >
                  {selectedItems.size > 0
                    ? `Generate`
                    : "Please select your target user first"}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
