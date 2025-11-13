"use client";

import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, Send, TrendingUp, Users, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useRouter } from "next/navigation";

interface MarketAnalysis {
  market_size_and_growth: {
    period: string;
    tam_usd: number;
    sam_usd: number;
    som_usd: number;
    cagr: string;
    growth_sustainability: string;
    data_monetization_value: string;
    service_monetization_value: string;
    top_segments: Array<{
      segment: string;
      roi_rank: number;
      barrier: string;
    }>;
    key_assumptions: string[];
  };
  market_structure_and_competition: {
    hhi: number;
    control_nodes: string[];
    major_players: Array<{
      name: string;
      share: number;
      model: string;
    }>;
    entry_barriers: string[];
    competitive_pressure: string;
    recommended_entry_mode: string;
  };
  demand_and_drivers: {
    drivers: Array<{
      driver: string;
      impact: number;
      probability: number;
      net_effect: string;
      horizon: string;
    }>;
    inhibitors: Array<{
      factor: string;
      impact: number;
    }>;
    dominant_driver: string;
  };
  value_chain_and_ecosystem: {
    profit_distribution: {
      upstream: string;
      midstream: string;
      downstream: string;
    };
    margin_drivers: string[];
    integration_opportunities: Array<{
      target: string;
      roi_score: number;
      priority: string;
    }>;
  };
  trends_and_risks: {
    emerging_trends: Array<{
      trend: string;
      impact_index: number;
    }>;
    risk_matrix: Array<{
      event: string;
      probability: number;
      impact: number;
      type: string;
    }>;
    scenarios: {
      best_case: string;
      base_case: string;
      worst_case: string;
    };
    response_plan: string[];
  };
  strategic_summary: {
    market_attractiveness: string;
    opportunity_zone: string;
    strategy_timeline: {
      short_term: string;
      mid_term: string;
      long_term: string;
    };
    decision_triggers: string[];
  };
  market_summary: {
    headline: string;
    core_insight: string;
    risk_outlook: string;
    strategic_call: string;
  };
  customer_analysis: {
    target_customers: Array<{
      customer_name: string;
      valued_questions: Array<{
        question: string;
      }>;
    }>;
  };
}

interface MarketSegment {
  id: string;
  title: string;
  analysis?: MarketAnalysis;
  isNew?: boolean;
  hasNewContent?: boolean;
}

const mockMarketAnalysis: MarketAnalysis = {
  market_size_and_growth: {
    period: "2022–2028",
    tam_usd: 1200000000,
    sam_usd: 450000000,
    som_usd: 150000000,
    cagr: "12%",
    growth_sustainability:
      "Moderate-high (linked to tourism recovery and AI adoption)",
    data_monetization_value: "$50M",
    service_monetization_value: "$100M",
    top_segments: [
      { segment: "Dynamic pricing analytics", roi_rank: 1, barrier: "medium" },
      {
        segment: "Remote work accommodation insights",
        roi_rank: 2,
        barrier: "low",
      },
      {
        segment: "Regulatory compliance solutions",
        roi_rank: 3,
        barrier: "high",
      },
    ],
    key_assumptions: [
      "Stable regulatory environment",
      "Continued growth in remote work",
      "Moderate competition intensity",
    ],
  },
  market_structure_and_competition: {
    hhi: 0.38,
    control_nodes: ["Booking platforms", "Institutional hosts"],
    major_players: [
      {
        name: "Institutional Host Group A",
        share: 25,
        model: "Multi-property management",
      },
      { name: "Individual Hosts", share: 35, model: "Single property rentals" },
      {
        name: "Booking Platform X",
        share: 20,
        model: "Commission-based platform",
      },
      { name: "Others", share: 20, model: "Various models" },
    ],
    entry_barriers: [
      "Regulatory compliance",
      "Capital investment in listings",
      "Network effects of platform adoption",
    ],
    competitive_pressure:
      "High rivalry; moderate buyer power; low supplier power",
    recommended_entry_mode:
      "Partnership with midstream API aggregators and property managers",
  },
  demand_and_drivers: {
    drivers: [
      {
        driver: "Tourism recovery post-pandemic",
        impact: 0.85,
        probability: 0.9,
        net_effect: "+15%",
        horizon: "short",
      },
      {
        driver: "Growth of remote work enabling longer stays",
        impact: 0.7,
        probability: 0.8,
        net_effect: "+10%",
        horizon: "mid",
      },
      {
        driver: "Adoption of AI for pricing optimization",
        impact: 0.9,
        probability: 0.85,
        net_effect: "+20%",
        horizon: "short",
      },
    ],
    inhibitors: [
      { factor: "Regulatory uncertainty", impact: -0.5 },
      { factor: "Market saturation in prime neighborhoods", impact: -0.3 },
    ],
    dominant_driver:
      "Tourism recovery combined with AI-driven automation (high persistence)",
  },
  value_chain_and_ecosystem: {
    profit_distribution: {
      upstream: "30%",
      midstream: "45%",
      downstream: "25%",
    },
    margin_drivers: [
      "Data ownership and exclusivity",
      "API lock-in and integration depth",
      "Operational scale and automation",
    ],
    integration_opportunities: [
      { target: "Midstream API aggregators", roi_score: 9.0, priority: "high" },
      {
        target: "Property management firms",
        roi_score: 7.0,
        priority: "medium",
      },
      {
        target: "Regulatory compliance tech providers",
        roi_score: 6.5,
        priority: "medium",
      },
    ],
  },
  trends_and_risks: {
    emerging_trends: [
      { trend: "AI-enabled dynamic pricing", impact_index: 0.9 },
      { trend: "Long-term accommodations", impact_index: 0.7 },
      { trend: "Regulatory scrutiny", impact_index: 0.8 },
    ],
    risk_matrix: [
      {
        event: "Regulatory tightening",
        probability: 0.8,
        impact: 0.9,
        type: "external",
      },
      {
        event: "Economic downturn",
        probability: 0.5,
        impact: 0.7,
        type: "market",
      },
      {
        event: "Market saturation",
        probability: 0.6,
        impact: 0.6,
        type: "market",
      },
    ],
    scenarios: {
      best_case:
        "Rapid AI adoption and tourism rebound lead to +30% market expansion",
      base_case: "Moderate 12% CAGR with manageable regulatory constraints",
      worst_case: "Regulatory freeze and economic slowdown cause –10% growth",
    },
    response_plan: [
      "Invest in compliance automation and monitoring",
      "Develop flexible API services for diverse client needs",
      "Target emerging markets and long-stay segments",
    ],
  },
  strategic_summary: {
    market_attractiveness:
      "Moderate to high growth with strong midstream margin concentration and manageable risk profile",
    opportunity_zone:
      "Midstream API analytics and compliance automation services targeting institutional hosts and booking platforms",
    strategy_timeline: {
      short_term:
        "Build regulatory compliance data connectors and basic analytics",
      mid_term: "Launch AI-powered dynamic pricing and forecasting APIs",
      long_term:
        "Form multi-dataset ecosystem alliances for predictive and operational insights",
    },
    decision_triggers: [
      "Regulatory clarity index > 0.7",
      "API adoption surpasses 60% of target SAM",
      "Emerging partnerships with key platform players",
    ],
  },
  market_summary: {
    headline:
      "A $1.2B growing market with dominant midstream profit pools and strong AI-driven monetization potential.",
    core_insight:
      "Control is shifting towards API aggregators and institutional hosts; firms enabling integration and compliance automation will capture disproportionate value.",
    risk_outlook:
      "Regulatory uncertainty remains the largest threat; diversification and early compliance investment mitigate risk.",
    strategic_call:
      "Prioritize partnerships with midstream platforms and property managers; focus on compliance and AI-driven pricing solutions.",
  },
  customer_analysis: {
    target_customers: [
      {
        customer_name: "High-Value Customers",
        valued_questions: [
          { question: "What is the average revenue per customer?" },
        ],
      },
    ],
  },
};

const initialMarkets: MarketSegment[] = [
  {
    id: "high-value-customers",
    title: "High-Value Customer Segment",
    analysis: mockMarketAnalysis,
  },
  {
    id: "sme-customers",
    title: "SME Customer Segment",
    analysis: mockMarketAnalysis,
  },
  {
    id: "individual-users",
    title: "Individual User Segment",
    analysis: mockMarketAnalysis,
  },
];

const mockExplorationResults: Record<string, Partial<MarketSegment>> = {
  churn: {
    id: "churn-riREDACTED",
    title: "Potential Churn User Segment",
    analysis: mockMarketAnalysis,
  },
  new: {
    id: "new-users",
    title: "New Registered Users",
    analysis: mockMarketAnalysis,
  },
  active: {
    id: "active-users",
    title: "Highly Active Users",
    analysis: mockMarketAnalysis,
  },
};

const formatCurrency = (value: number): string => {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(0)}M`;
  }
  return `$${value.toLocaleString()}`;
};

const highlightNumbers = (text: string) => {
  const parts = text.split(/(\$[\d.]+[BMK]?|\d+%)/g);
  return parts.map((part, index) => {
    if (/(\$[\d.]+[BMK]?|\d+%)/.test(part)) {
      return (
        <span key={index} className="text-3xl font-extrabold text-yellow-300">
          {part}
        </span>
      );
    }
    return part;
  });
};

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
];

interface MarketExplorationPageProps {
  marketsData?: { id: string; title: string; analysis: any }[];
}

export default function MarketExplorationPage({
  marketsData,
}: MarketExplorationPageProps) {
  const [markets, setMarkets] = useState<MarketSegment[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [explorationInput, setExplorationInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedPanels, setExpandedPanels] = useState<string[]>(
    markets.map((m) => m.id)
  );
  const [highlightedMarkets, setHighlightedMarkets] = useState<string[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const router = useRouter();
  // Handle incoming marketsData
  useEffect(() => {
    if (marketsData && marketsData.length > 0) {
      console.log("Received marketsData:", marketsData);
      const convertedMarkets: MarketSegment[] = marketsData.map(
        (marketData) => ({
          id: marketData.id,
          title: marketData.title,
          analysis: marketData.analysis,
        })
      );
      setMarkets(convertedMarkets);
      setExpandedPanels(convertedMarkets.map((m) => m.id));
      console.log("Converted markets:", convertedMarkets);
    }
  }, [marketsData]);

  const valuedQuestions: string[] = [
    "Which segment delivers the highest ROI?",
    "What are the TAM, SAM, and SOM for the target period?",
    "What is the expected CAGR and its time horizon?",
    "Which growth drivers have the strongest net effect?",
    "What are the major entry barriers to capture value?",
    "Who are the top three competitors by market share?",
    "How sustainable is the projected growth?",
    "Which integration opportunities should be prioritized?",
    "What is the recommended market entry mode?",
    "Which risks require active monitoring in the next 12 months?",
  ];

  const handleMarketSelection = (marketId: string) => {
    setSelectedMarket(marketId);
  };
  useEffect(() => {
    console.log(mockMarketAnalysis, "mockMarketAnalysis");
    // getDatabaseData();
  }, []);
  // const getDatabaseData = async () => {
  //   const validateResponse = await fetch(
  //     "https://my-connector.onrender.com/analyze",
  //     {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         analysis_type: "all",
  //         supabase_project_id: "yzcdbefleociqdpxsqjt",
  //         supabase_access_token:
  //           process.env.NEXT_PUBLIC_SUPABASE_ACCESS_TOKEN || "",
  //         user_name: "huimin",
  //         data_review_result: true,
  //         openai_api_key: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
  //       }),
  //       signal: AbortSignal.timeout(180000),
  //     }
  //   );

  //   if (!validateResponse.ok) {
  //     const errorData = await validateResponse.json();
  //     throw new Error(
  //       errorData.error || `Data validation failed: ${validateResponse.status}`
  //     );
  //   }

  //   const validateData = await validateResponse.json();
  //   console.log("Data validation successful:", validateData);
  // };
  const getDatabaseData = async () => {
    const validateResponse = await fetch(
      "http://192.168.30.150:8001/api/v1/run-analysis",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supabase_project_id: "yzcdbefleociqdpxsqjt",
          supabase_access_token: "sbp_82dc8d631fde6e235ec5b7d4792b8d6fb66ad5cf",
          user_name: "huimin",
        }),
      }
    );

    if (!validateResponse.ok) {
      const errorData = await validateResponse.json();
      throw new Error(
        errorData.error || `Data validation failed: ${validateResponse}`
      );
    }

    const validateData = await validateResponse.json();
    console.log("Data validation successful:", validateData);
    setMarkets([
      {
        id: validateData.integrated_analysis.markets.market_segments[0]
          .market_name,
        title:
          validateData.integrated_analysis.markets.market_segments[0]
            .market_name,
        analysis: validateData.integrated_analysis.markets.market_segments[0],
      },
    ]);
  };
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const validateResponse = await fetch(
      "http://192.168.30.150:8001/api/v1/run-analysis",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supabase_project_id: "yzcdbefleociqdpxsqjt",
          supabase_access_token: "sbp_82dc8d631fde6e235ec5b7d4792b8d6fb66ad5cf",
          user_name: "huimin",
          user_feedback: "More detailed analysis for the market segments ",
        }),
      }
    );

    if (!validateResponse.ok) {
      const errorData = await validateResponse.json();
      setIsAnalyzing(false);
      throw new Error(
        errorData.error || `Data validation failed: ${validateResponse}`
      );
    }

    const validateData = await validateResponse.json();
    setIsAnalyzing(false);
    console.log("Data validation successful:", validateData);
    setMarkets([
      {
        id: validateData.integrated_analysis.markets.market_segments[0]
          .market_name,
        title:
          validateData.integrated_analysis.markets.market_segments[0]
            .market_name,
        analysis: validateData.integrated_analysis.markets.market_segments[0],
      },
    ]);
  };

  const handleAnalyze1 = async () => {
    if (!explorationInput.trim()) return;

    // setIsAnalyzing(true);
    const response = await fetch("http://192.168.30.150:8000/api/v1/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: "demo_user",
        message: explorationInput,
        agent_type: "general",
        supabase_access_token: "sbp_82dc8d631fde6e235ec5b7d4792b8d6fb66ad5cf",
        supbase_project_id: "yzcdbefleociqdpxsqjt",
        historical_insights: {
          metadata: {
            analysis_type: "integrated_market_and_customer",
            analysis_timestamp: "20251023202555",
            analysis_date: "2025-10-23T20:27:29.726795",
          },
          markets: {
            market_segments: [
              {
                market_name: "Short-Term Vacation Rentals",
                market_overview: {
                  description:
                    "The short-term vacation rentals market is characterized by digital platform-driven bookings with high seasonality and regional clusters in Apollo Bay and Mounts Bay.",
                  relevance_score: 0.93,
                  evidence_fields: [
                    "listings",
                    "calendar",
                    "reviews",
                    "listingsdetails",
                  ],
                },
              },
            ],
          },
        },
      }),
    });
    const responseData = await response.json();
    console.log(responseData, "responseData");

    // await new Promise((resolve) => setTimeout(resolve, 2500));

    // const keyword = Object.keys(mockExplorationResults).find((key) =>
    //   explorationInput.toLowerCase().includes(key)
    // );

    // if (keyword) {
    //   const newMarket = mockExplorationResults[keyword] as MarketSegment;

    //   const existingIndex = markets.findIndex((m) => m.id === newMarket.id);

    //   if (existingIndex >= 0) {
    //     setMarkets((prev) =>
    //       prev.map((m, idx) =>
    //         idx === existingIndex ? { ...m, hasNewContent: true } : m
    //       )
    //     );
    //     setHighlightedMarkets([newMarket.id]);
    //   } else {
    //     setMarkets((prev) => [...prev, { ...newMarket, isNew: true }]);
    //     setExpandedPanels((prev) => [...prev, newMarket.id]);
    //     setHighlightedMarkets([newMarket.id]);
    //   }

    //   setTimeout(() => {
    //     setHighlightedMarkets([]);
    //     setMarkets((prev) =>
    //       prev.map((m) => ({ ...m, isNew: false, hasNewContent: false }))
    //     );
    //   }, 3000);
    // }

    // setIsAnalyzing(false);
    // setExplorationInput("");
  };

  const handleGenerate = () => {
    // console.log(analysisResults);
    // const selectedIds = Array.from(selectedMarket);
    // const selectedResults = markets.filter((r) => selectedIds.includes(r.id));
    // console.log(selectedResults, "selectedResults");

    localStorage.setItem("selectedProblems", JSON.stringify(selectedMarkets));
    router.push("/generate");
  };

  const radioChange = (value: string) => {
    console.log(value);
    // console.log(markets, "markets");
    const marketCheck = markets.find((m) => m.id === value);
    console.log(marketCheck, "marketCheck");
    const allQuestions =
      marketCheck?.analysis?.customer_analysis?.target_customers?.flatMap(
        (customer: any) =>
          customer.valued_questions.map((question: any) => question.question)
      ) || [];

    console.log(allQuestions, "allQuestions");

    if (marketCheck) {
      setSelectedMarket(marketCheck?.id || "");
      setSelectedMarkets(allQuestions);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold text-black mb-6">
          Market Segmentation Exploration & Builder
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed">
          We've recommended 3 initial market segments for you! You can select
          segments of interest, or explore more possibilities in the input box
          below. Once you've made your selections, click "Generate Application"
          to create your ChatAPP.
        </p>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-32">
        <RadioGroup
          value={selectedMarket}
          onValueChange={radioChange}
          className="space-y-4"
        >
          <Accordion
            type="multiple"
            value={expandedPanels}
            onValueChange={setExpandedPanels}
            className="space-y-4"
          >
            {markets.map((market) => {
              const isSelected = selectedMarket === market.id;
              const isHighlighted = highlightedMarkets.includes(market.id);
              const analysis = market.analysis;

              return (
                <AccordionItem
                  key={market.id}
                  value={market.id}
                  className={`
                  rounded-lg overflow-hidden transition-all duration-300 border-2
                  ${
                    isSelected
                      ? "border-gray-600 bg-gray-50"
                      : "border-gray-200 bg-white"
                  }
                  ${isHighlighted ? "ring-4 ring-gray-600 ring-opacity-20" : ""}
                `}
                >
                  <div
                    className={`flex items-center gap-3 px-6 py-4 transition-colors border-b-2 ${
                      isSelected
                        ? "bg-gray-600 text-white border-gray-500"
                        : "bg-white text-black border-gray-200"
                    }`}
                  >
                    <RadioGroupItem
                      value={market.id}
                      className={`${
                        isSelected
                          ? "border-white data-[state=checked]:bg-white data-[state=checked]:text-gray-600"
                          : ""
                      }`}
                    />

                    <AccordionTrigger className="flex-1 hover:no-underline p-0">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg">
                          {market.title}
                        </span>
                        {market.hasNewContent && (
                          <span
                            className={`text-xs font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-full ${
                              isSelected
                                ? "bg-white text-gray-600"
                                : "bg-gray-600 text-white"
                            }`}
                          >
                            <span
                              className={`inline-block w-1.5 h-1.5 rounded-full ${
                                isSelected ? "bg-gray-600" : "bg-white"
                              }`}
                            />
                            NEW
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                  </div>

                  {analysis && (
                    <AccordionContent className="px-6 pb-6 pt-8 bg-white">
                      <div className="space-y-8">
                        {/* Summary - Moved to the top */}
                        <section className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-2xl text-black-600/70">
                              Summary
                            </h3>
                          </div>
                          <div className="bg-linear-to-br from-gray-900 to-gray-700 text-white rounded-lg p-6 space-y-4">
                            <div>
                              <div className="text-xs font-semibold text-gray-300 mb-2">
                                HEADLINE
                              </div>
                              <div className="text-lg font-bold leading-relaxed">
                                {highlightNumbers(
                                  analysis.market_summary?.headline || ""
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-300 mb-2">
                                CORE INSIGHT
                              </div>
                              <div className="text-sm">
                                {analysis.market_summary?.core_insight || ""}
                              </div>
                            </div>
                          </div>
                        </section>

                        <div className="border-t-2 border-gray-100 pt-6">
                          <h2 className="text-3xl font-bold text-gray-900 mb-6">
                            Market Values
                          </h2>
                        </div>

                        {/* ① Market Overview - Funnel Chart + CAGR Card + Bar Chart */}
                        <section className="space-y-4">
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-6 h-6 text-blue-600/70" />
                              <h3 className="font-bold text-2xl text-blue-600/70">
                                ① Market Overview
                              </h3>
                            </div>
                            <p className="text-xl font-semibold text-gray-800 leading-relaxed ml-8">
                              {formatCurrency(
                                analysis.market_size_and_growth?.tam_usd || 0
                              )}{" "}
                              total market growing at{" "}
                              {analysis.market_size_and_growth?.cagr || ""} CAGR
                              with strong monetization potential
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-linear-to-br from-orange-50 to-red-50 rounded-lg p-6 text-center">
                                <div className="text-sm text-orange-600 font-semibold mb-2">
                                  Compound Annual Growth Rate
                                </div>
                                <div className="text-5xl font-bold text-orange-900 mb-2">
                                  {analysis.market_size_and_growth?.cagr || ""}
                                </div>
                                <div className="text-xs text-orange-700">
                                  {analysis.market_size_and_growth.period}
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-6">
                                <div className="text-sm font-semibold text-gray-700 mb-2">
                                  Growth Sustainability
                                </div>
                                <div className="text-sm text-gray-600 leading-relaxed">
                                  {analysis.market_size_and_growth
                                    ?.growth_sustainability || ""}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                              <div className="bg-linear-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                                <h4 className="text-sm font-semibold text-gray-700 mb-4">
                                  Market Size Funnel
                                </h4>
                                <div className="relative w-full h-[300px] flex flex-col items-center justify-center">
                                  <svg
                                    width="100%"
                                    height="100%"
                                    viewBox="0 0 300 300"
                                    className="overflow-visible"
                                  >
                                    {/* TAM - Top layer */}
                                    <path
                                      d="M 50 40 L 250 40 L 220 100 L 80 100 Z"
                                      fill="#3b82f6"
                                      stroke="#2563eb"
                                      strokeWidth="2"
                                    />
                                    <text
                                      x="150"
                                      y="65"
                                      textAnchor="middle"
                                      fill="white"
                                      fontSize="14"
                                      fontWeight="bold"
                                    >
                                      TAM
                                    </text>
                                    <text
                                      x="150"
                                      y="85"
                                      textAnchor="middle"
                                      fill="white"
                                      fontSize="12"
                                    >
                                      {formatCurrency(
                                        analysis.market_size_and_growth
                                          ?.tam_usd || 0
                                      )}
                                    </text>

                                    {/* SAM - Middle layer */}
                                    <path
                                      d="M 80 100 L 220 100 L 190 160 L 110 160 Z"
                                      fill="#6366f1"
                                      stroke="#4f46e5"
                                      strokeWidth="2"
                                    />
                                    <text
                                      x="150"
                                      y="125"
                                      textAnchor="middle"
                                      fill="white"
                                      fontSize="14"
                                      fontWeight="bold"
                                    >
                                      SAM
                                    </text>
                                    <text
                                      x="150"
                                      y="145"
                                      textAnchor="middle"
                                      fill="white"
                                      fontSize="12"
                                    >
                                      {formatCurrency(
                                        analysis.market_size_and_growth
                                          ?.sam_usd || 0
                                      )}
                                    </text>

                                    {/* SOM - Bottom layer */}
                                    <path
                                      d="M 110 160 L 190 160 L 170 220 L 130 220 Z"
                                      fill="#8b5cf6"
                                      stroke="#7c3aed"
                                      strokeWidth="2"
                                    />
                                    <text
                                      x="150"
                                      y="185"
                                      textAnchor="middle"
                                      fill="white"
                                      fontSize="14"
                                      fontWeight="bold"
                                    >
                                      SOM
                                    </text>
                                    <text
                                      x="150"
                                      y="205"
                                      textAnchor="middle"
                                      fill="white"
                                      fontSize="12"
                                    >
                                      {formatCurrency(
                                        analysis.market_size_and_growth
                                          ?.som_usd || 0
                                      )}
                                    </text>

                                    {/* Labels */}
                                    <text
                                      x="150"
                                      y="250"
                                      textAnchor="middle"
                                      fill="#6b7280"
                                      fontSize="11"
                                    >
                                      Total Addressable → Serviceable Available
                                      → Serviceable Obtainable
                                    </text>
                                  </svg>
                                </div>
                              </div>

                              <div className="bg-white rounded-lg p-6">
                                <h4 className="text-sm font-semibold text-gray-700 mb-4">
                                  Top Segments by ROI Rank
                                </h4>
                                <ResponsiveContainer width="100%" height={260}>
                                  <BarChart
                                    data={analysis.market_size_and_growth.top_segments.map(
                                      (seg) => ({
                                        name: seg.segment,
                                        rank: 4 - seg.roi_rank,
                                        barrier: seg.barrier,
                                      })
                                    )}
                                    margin={{
                                      top: 5,
                                      right: 30,
                                      left: 20,
                                      bottom: 60,
                                    }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                      dataKey="name"
                                      angle={-15}
                                      textAnchor="end"
                                      height={80}
                                    />
                                    <YAxis
                                      label={{
                                        value: "ROI Score",
                                        angle: -90,
                                        position: "insideLeft",
                                      }}
                                    />
                                    <Tooltip />
                                    <Bar
                                      dataKey="rank"
                                      fill="#10b981"
                                      radius={[8, 8, 0, 0]}
                                      barSize={30}
                                    />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* ② Market Structure - Pie Chart + Gauge Chart */}
                        <section className="space-y-4 border-t-2 border-gray-100 pt-6">
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-6 h-6 text-purple-600/70" />
                              <h3 className="font-bold text-2xl text-purple-600/70">
                                ② Market Structure & Competition
                              </h3>
                            </div>
                            <p className="text-xl font-semibold text-gray-800 leading-relaxed ml-8">
                              Moderate concentration (HHI:{" "}
                              {analysis.market_structure_and_competition?.hhi ||
                                0}
                              ) with{" "}
                              {analysis.market_structure_and_competition
                                ?.major_players?.length || 0}{" "}
                              major players competing across multiple segments
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-6">
                              <h4 className="text-sm font-semibold text-gray-700 mb-4">
                                Market Share Distribution
                              </h4>
                              <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                  <Pie
                                    data={
                                      analysis.market_structure_and_competition
                                        ?.major_players || []
                                    }
                                    dataKey="share"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={(entry) =>
                                      `${entry.name}: ${entry.share}%`
                                    }
                                  >
                                    {analysis.market_structure_and_competition?.major_players?.map(
                                      (entry, index) => (
                                        <Cell
                                          key={`cell-${index}`}
                                          fill={COLORS[index % COLORS.length]}
                                        />
                                      )
                                    )}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>

                            <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-lg p-6">
                              <h4 className="text-sm font-semibold text-gray-700 mb-4">
                                Market Concentration (HHI Index)
                              </h4>
                              <div className="flex items-center justify-center">
                                <div className="relative w-48 h-48">
                                  <svg
                                    viewBox="0 0 200 200"
                                    className="transform -rotate-90"
                                  >
                                    <circle
                                      cx="100"
                                      cy="100"
                                      r="80"
                                      fill="none"
                                      stroke="#e5e7eb"
                                      strokeWidth="20"
                                    />
                                    <circle
                                      cx="100"
                                      cy="100"
                                      r="80"
                                      fill="none"
                                      stroke="#8b5cf6"
                                      strokeWidth="20"
                                      strokeDasharray={`${
                                        analysis
                                          .market_structure_and_competition
                                          .hhi * 502.4
                                      } 502.4`}
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-4xl font-bold text-purple-900">
                                      {analysis.market_structure_and_competition
                                        ?.hhi || 0}
                                    </div>
                                    <div className="text-xs text-purple-600">
                                      Moderate
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                {analysis.market_structure_and_competition?.control_nodes?.map(
                                  (node, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs font-medium px-3 py-1 bg-purple-100 text-purple-700 rounded-full"
                                    >
                                      {node}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* ⑤ Trends & Risks - Radar Chart + Heatmap */}
                        {/* <section className="space-y-4 border-t-2 border-gray-100 pt-6">
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-6 h-6 text-red-600/70" />
                              <h3 className="font-bold text-2xl text-red-600/70">
                                {" "}
                                ③ Trends & Risks
                              </h3>
                            </div>
                            <p className="text-xl font-semibold text-gray-800 leading-relaxed ml-8">
                              {analysis.trends_and_risks?.emerging_trends
                                ?.length || 0}{" "}
                              emerging trends tracked with{" "}
                              {analysis.trends_and_risks?.risk_matrix?.length ||
                                0}{" "}
                              critical risks requiring active monitoring
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-6">
                              <h4 className="text-sm font-semibold text-gray-700 mb-4">
                                Emerging Trends Impact
                              </h4>
                              <ResponsiveContainer width="100%" height={300}>
                                <RadarChart
                                  data={
                                    analysis.trends_and_risks
                                      ?.emerging_trends || []
                                  }
                                >
                                  <PolarGrid />
                                  <PolarAngleAxis dataKey="trend" />
                                  <PolarRadiusAxis domain={[0, 1]} />
                                  <Radar
                                    name="Impact Index"
                                    dataKey="impact_index"
                                    stroke="#3b82f6"
                                    fill="#3b82f6"
                                    fillOpacity={0.6}
                                  />
                                  <Tooltip />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </section> */}
                        {/* Valued Questions */}
                        <section className="space-y-4 border-t-2 border-gray-100 pt-6">
                          <div className="mb-2">
                            <h3 className="font-bold text-2xl text-gray-800">
                              Valued Questions
                            </h3>
                          </div>
                          <div className="bg-white rounded-lg p-6">
                            <ul className="list-decimal pl-6 space-y-3 text-gray-900">
                              {analysis.customer_analysis?.target_customers.flatMap(
                                (customer: any, customerIdx: number) =>
                                  customer.valued_questions?.map(
                                    (question: any, questionIdx: number) => (
                                      <li
                                        key={`${customerIdx}-${questionIdx}`}
                                        className="text-lg md:text-xl font-semibold leading-8"
                                      >
                                        {question.question}
                                      </li>
                                    )
                                  ) || []
                              )}
                            </ul>
                          </div>
                        </section>
                        {/* ⑥ Strategic Summary - Timeline + Text Cards */}
                      </div>
                    </AccordionContent>
                  )}
                </AccordionItem>
              );
            })}
          </Accordion>
        </RadioGroup>

        {/* <div className="mt-8 w-full">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden relative">
            <Textarea
              placeholder="Enter the market direction you want to explore, e.g.: churn risk users, new user growth..."
              value={explorationInput}
              onChange={(e) => setExplorationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isAnalyzing) {
                  e.preventDefault();
                  handleAnalyze();
                }
              }}
              disabled={isAnalyzing}
              className="min-h-[80px] max-h-[160px] resize-none border-0 focus-visible:ring-0 text-black placeholder:text-gray-400 pr-14 text-base leading-relaxed"
              rows={2}
            />
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !explorationInput.trim()}
              size="icon"
              className="absolute bottom-3 right-3 h-10 w-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-all"
            >
              {isAnalyzing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div> */}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t-2 border-gray-200 shadow-2xl z-50">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex flex-col items-start gap-2 flex-1 min-w-0">
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                Selected Markets
              </span>
              <div className="text-sm text-gray-700 leading-relaxed">
                {selectedMarket === "" ? (
                  <span className="text-gray-400 italic">
                    No markets selected
                  </span>
                ) : (
                  <span className="font-bold">
                    {markets.find((m) => m.id === selectedMarket)?.title}
                  </span>
                )}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={selectedMarket === ""}
              size="lg"
              className="min-w-[160px] h-14 bg-white text-blue-600 hover:bg-gray-100 font-bold text-base disabled:bg-gray-700 disabled:text-gray-500 rounded-xl shadow-lg transition-all"
            >
              Generate Application
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
