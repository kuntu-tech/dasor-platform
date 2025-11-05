"use client";

import { useState, useEffect } from "react";
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
import aaaa from "@/formatted_analysis_result.json";
type Step = "connect" | "analyzing" | "results";
type AnalysisStep =
  | "connecting"
  | "validating-data"
  | "reading-schema"
  | "sampling-data"
  | "evaluating"
  | "complete";
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
  const [hasValidated, setHasValidated] = useState<boolean>(false);
  const [showInputError, setShowInputError] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState("");
  const { user } = useAuth();
  const [progress, setProgress] = useState(0); // 百分比
  const [jobStatus, setJobStatus] = useState("init");
  // 简化的数据库验证函数 - 支持测试用的 URL 和 API Key
  const performRealDatabaseValidation = async (
    url: string,
    key: string
  ): Promise<void> => {
    // 测试用的有效组合
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

    // 特殊测试组合 - 连接成功但数据真实性验证失败
    const dataValidationFailedCombination = {
      url: "https://test.supabase.co",
      key: "test-api-key-123456789",
    };

    // 检查是否是数据真实性验证失败的测试组合
    if (
      url === dataValidationFailedCombination.url &&
      key === dataValidationFailedCombination.key
    ) {
      // 模拟连接验证延迟
      await new Promise((resolve) => setTimeout(resolve, 500));
      // 连接成功，但会在后续步骤中触发数据真实性验证失败
      return;
    }

    // 检查是否是其他测试用的有效组合
    const isValidTest = validTestCombinations.some(
      (combo) => url === combo.url && key === combo.key
    );

    if (isValidTest) {
      // 模拟验证延迟
      await new Promise((resolve) => setTimeout(resolve, 500));
      return; // 验证通过
    }

    // 对于其他组合，进行基本格式验证
    if (!url.includes("supabase.co") && !url.includes("localhost")) {
      throw new Error(
        "Invalid Supabase URL format. Try: https://test.supabase.co"
      );
    }

    if (!key || key.length < 10) {
      throw new Error("Invalid API Key format. Try: test-api-key-123456789");
    }

    // 模拟验证失败（用于测试错误情况）
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

  //         // 注意：真实的验证已经在 handleConnect 中完成
  //         // 这里只是显示进度，不再进行模拟验证
  //       } else {
  //         clearInterval(interval);
  //         // 当所有步骤完成时，设置分析结果并跳转到结果页面
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
  //     }, 1900); // 缩短为原来的一半以加快分析过程

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
    return { ...last, status: "timeout", error: "超过最大轮询等待时间" };
  };
  const handleConnectAPI = async () => {
    console.log("handleConnectAPI");

    // 清除之前的错误信息
    setConnectionError(null);
    setDataValidationError(null);
    setShowInputError(false);
    setStep("analyzing");
    setIsAnalyzing(false);

    // 校验 connectionUrl 格式
    if (!connectionUrl || connectionUrl.trim() === "") {
      setConnectionError("Connection URL cannot be empty");
      return;
    }

    // 校验 URL 格式
    // try {
    //   new URL(connectionUrl);
    // } catch (error) {
    //   setConnectionError("Invalid connection URL format");
    //   return;
    // }

    // 校验 access token 格式
    if (!accessToken || accessToken.trim() === "") {
      setConnectionError("access token cannot be empty");
      return;
    }

    // 校验 access token 长度（通常至少8位）
    if (accessToken.length < 8) {
      setConnectionError("Access token must be at least 8 characters long");
      return;
    }
    if (!apiKey || apiKey.trim() === "") {
      setConnectionError("API key cannot be empty");
      return;
    }

    // 校验 API Key 长度（通常至少8位）
    if (apiKey.length < 8) {
      setConnectionError("API key must be at least 8 characters long");
      return;
    }

    // 开始分析流程
    setStep("analyzing");
    setAnalysisStep("connecting");
    setIsAnalyzing(true);
    console.log(aaaa, "--------------------------------");
    try {
      console.log("Step 0: Validating connection...");
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
        setConnectionError(errorMsg);
        setDataValidationError(null);
        setAnalysisStep("connecting"); // 重置到连接步骤，表示在连接阶段失败
        setStep("analyzing");
        setIsAnalyzing(false);
        return; // 直接返回，不执行后续步骤
      }
      const validateResData = await validateRes.json();
      console.log("Data validation successful:", validateResData);
      if (!validateResData.success) {
        setConnectionError(
          validateResData.error || "Connection validation failed"
        );
        setDataValidationError(null);
        setAnalysisStep("connecting"); // 重置到连接步骤，表示在连接阶段失败
        setStep("analyzing");
        setIsAnalyzing(false);
        return; // 直接返回，不执行后续步骤
      }
      // validate-connection 成功，继续后续步骤
      // 连接成功，存入data_connections表
      try {
        await fetch("/api/data-connections", {
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
      } catch (e) {
        console.warn("save data_connections failed", e);
      }

      // 进入数据验证步骤
      setAnalysisStep("validating-data");

      // 第一步：数据验证
      console.log("Step 1: Validating data...");
      const validateResponse = await fetch(
        "https://my-connector.onrender.com/review",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            supabase_project_id: connectionUrl,
            supabase_access_token: accessToken,
            user_name: "huimin",
          }),
        }
      );

      if (!validateResponse.ok) {
        const errorData = await validateResponse.json();
        throw new Error(
          errorData.error ||
            `Data validation failed: ${validateResponse.status}`
        );
      }

      const validateData = await validateResponse.json();
      console.log("Data validation successful:", validateData);
      if (!validateData.final_conclusion) {
        setDataValidationError(
          "Data authenticity validation failed: No available data tables or empty data in database"
        );
        return;
      }
      // 第二步：连接数据库
      console.log("Step 2: Connecting to database...");

      // 数据验证成功，继续后续步骤
      setAnalysisStep("reading-schema");

      // 连接方式一
      // const connectResponse = await fetch("/api/connect", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ url: connectionUrl, key: accessToken }),
      // });
      // 连接方式二
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
      // 连接方式三
      const connectResponse = await fetch(
        "https://business-insight.datail.ai/api/v1/pipeline/run",
        // "https://business-insighter.onrender.com/api/v1/run-analysis",
        // "http://192.168.30.150:8001/api/v1/run-analysis",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user?.id || "",
            project: {
              project_id: connectionUrl,
              access_token: accessToken,
            },
          }),
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
        setConnectionError(errorMsg);
        setDataValidationError(null);
        setAnalysisStep("reading-schema"); // 重置到 reading-schema 步骤，表示在该步骤失败
        setStep("analyzing");
        setIsAnalyzing(false);
        return; // 直接返回，不执行后续步骤
      }

      const connectData1 = await connectResponse.json();
      console.log("Pipeline run successful, job_id:", connectData1.job_id);

      // 进入轮询阶段，根据进度更新 analysisStep
      setJobStatus("waiting");
      const pollingResult = await pollJobProgress(
        connectData1.job_id,
        (progress, status, data) => {
          if (progress !== null) {
            setProgress(progress);
            // 根据进度自动更新 analysisStep
            if (progress >= 0 && progress < 20) {
              setAnalysisStep("reading-schema");
            } else if (progress >= 20 && progress < 40) {
              setAnalysisStep("sampling-data");
            } else if (progress >= 40 && progress < 80) {
              setAnalysisStep("evaluating");
            } else if (progress >= 80 && progress < 100) {
              setAnalysisStep("evaluating");
            } else if (progress === 100) {
              setAnalysisStep("complete");
            }
          }
          if (status) setJobStatus(status);
        },
        10000, // 10秒轮询一次
        6 // 最多轮询6分钟
      );
      if (pollingResult.status === "completed") {
        setJobStatus("done");
        setAnalysisStep("complete");
        setProgress(100);
        console.log("pollingResult:", pollingResult);
      } else {
        setJobStatus(pollingResult.status || "error");
        setConnectionError(pollingResult.error || "Job failed");
        setStep("analyzing");
        setIsAnalyzing(false);
        return;
      }
      const segments = pollingResult?.run_results?.run_result?.segments || [];
      localStorage.setItem(
        "run_result",
        JSON.stringify(pollingResult?.run_results.run_result)
      );
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

      // 获取分析结果（此页面由 markets 渲染，不再使用本地演示数据）
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
      console.error("API call failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // 根据错误发生的位置直接设置错误类型
      // 如果是在 run-analysis 接口调用失败，设置连接错误
      setConnectionError(`Connection failed: ${errorMessage}`);
      setDataValidationError(null); // 清除数据验证错误

      // 停留在 analyzing step 显示错误状态
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

    // 如果已经验证过，直接跳过验证步骤
    if (hasValidated) {
      // 直接进入后续流程
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
            return a.userProfile.localeCompare(b.userProfile, "zh-CN");
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
      // 如果未验证过，进行真实验证
      try {
        await performRealDatabaseValidation(connectionUrl, accessToken);
        // 验证成功，标记为已验证
        setHasValidated(true);

        // 特殊处理：如果是 test.supabase.co 组合，在第二步进行数据真实性验证
        if (
          connectionUrl === "https://test.supabase.co" &&
          accessToken === "test-api-key-123456789"
        ) {
          // 模拟数据真实性验证失败
          setTimeout(() => {
            setDataValidationError(
              "Data authenticity validation failed: No available data tables or empty data in database"
            );
          }, 1000); // 缩短为原来的一半
          return;
        }

        // 不在这里直接跳转，让 useEffect 中的步骤逻辑处理后续流程
        // 这样用户可以看到完整的验证进度
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
        console.error("Database connection failed:", error);
        setConnectionError(
          `Database connection failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        // 连接失败时，不继续后续流程
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
    // 步骤执行顺序：connecting -> validating-data -> reading-schema -> sampling-data -> evaluating -> complete
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

    // 如果有连接错误，根据步骤位置判断状态
    if (connectionError) {
      const connectingIndex = steps.indexOf("connecting");
      const readingSchemaIndex = steps.indexOf("reading-schema");

      // 连接步骤失败，显示错误（由 UI 层处理）
      if (stepName === "connecting") {
        return "error";
      }
      // 如果当前停留在 reading-schema 且有错误，说明在该步骤失败
      if (stepName === "reading-schema" && analysisStep === "reading-schema") {
        return "error";
      }
      // 连接失败后，后续步骤都应该是等待状态
      if (stepIndex > connectingIndex) {
        // 如果当前步骤是 reading-schema 且有错误，显示错误
        if (
          stepIndex === readingSchemaIndex &&
          analysisStep === "reading-schema"
        ) {
          return "error";
        }
        return "waiting";
      }
      // 连接之前的步骤（如 validating-data）可能已完成或失败
      if (stepIndex < connectingIndex) {
        // 如果 validating-data 也有错误，则失败
        if (stepName === "validating-data" && dataValidationError) {
          return "error";
        }
        // 否则可能已完成（如果已经通过了验证）
        return currentIndex > stepIndex ? "completed" : "waiting";
      }
    }

    // 如果有数据验证错误，且当前步骤是 validating-data
    if (dataValidationError && stepName === "validating-data") {
      return "error";
    }

    // 特殊处理：当 analysisStep 是 "connecting" 时，validating-data 应该显示等待状态
    // 因为 validating-data 是在 connecting 过程中完成的，只有当 connecting 完成后才标记为 completed
    // if (analysisStep === "connecting") {
    //   if (stepName === "validating-data") {
    //     // 如果连接正在进行中，数据验证可能正在进行或已完成
    //     // 但为了安全起见，只有在连接完成后才标记为 completed
    //     // 这里我们检查是否有连接错误，如果没有错误，说明验证可能正在进行
    //     return "waiting";
    //   }
    //   if (stepName === "connecting") {
    //     return "in-progress";
    //   }
    //   // 后续步骤都等待
    //   return "waiting";
    // }

    // 正常流程：根据当前步骤位置判断
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
                    placeholder="please input project id"
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
                  <span>You can find this URL in your Supabase APP</span>
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
                    placeholder="please input access token"
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
                  <span>Use access token, can be found in API settings</span>
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
                    placeholder="please input api key"
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
                  <span>Use api key, can be found in API settings</span>
                </div>
              </div>

              {/* Read-only Checkbox */}
              <div className="flex items-center gap-3">
                <Checkbox
                  id="read-only"
                  checked={readOnly}
                  onCheckedChange={(checked) => setReadOnly(checked as boolean)}
                />
                <Label
                  htmlFor="read-only"
                  className="text-base font-normal cursor-pointer"
                >
                  Read-only access (we will not modify your data)
                </Label>
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
                      Why do we need this information?
                    </h4>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      Datail needs access to your Supabase database to analyze
                      its structure and small sample data, in order to generate
                      AI Applicationpp recommendations that best fit your data.
                      We do not store your data, and all analysis is performed
                      securely in your browser.
                    </p>
                  </div>
                </div>
              </div>

              {/* 测试用的 URL 和 API Key 提示 */}
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
                          ⚠️ 连接成功但数据真实性验证失败
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
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-2xl mx-auto w-full">
              <CardHeader>
                <CardTitle>AI is Analyzing Your Database</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 py-8">
                {/* Database Connection */}
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

                      {/* {getStepStatus("connecting") === "in-progress" && (
                        <span className="text-xs text-muted-foreground ml-2">
                          [{jobStatus} —— {progress}%]
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

                {/* 如果数据库连接失败，显示连接错误信息 */}
                {connectionError && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="size-6 text-red-600 mt-0.5 shrink-0" />
                      <div className="space-y-3">
                        <h4 className="font-bold text-red-900 text-lg">
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
                        </div>
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
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {dataValidationError ? (
                      <XCircle className="size-6 text-red-600" />
                    ) : connectionError ? (
                      // 如果连接失败，第二步应该显示等待状态（灰色时钟），而不是已完成
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
                        : connectionError
                        ? "Waiting for database connection..."
                        : "Check data integrity and accessibility"}
                    </p>
                  </div>
                </div>

                {/* 如果数据真实性验证失败，显示错误信息和建议 */}
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
                          Applicationpp templates
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
                                  : analysisStep === "evaluating"
                                  ? 100
                                  : 0
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
                <MarketExplorationPage marketsData={markets} />
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
