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
import { Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
type SelectedProblem = {
  id: string;
  userProfile: string;
  problem: string;
  marketValue: string;
  implementationMethod: string;
  implementationDifficulty: number;
};

const templates = [
  { id: "query", name: "Information Display" },
  { id: "carousel", name: "Carousel" },
  { id: "metrics", name: "Dashboard" },
  { id: "list-filter", name: "List" },
];

export function GenerateFlow() {
  const router = useRouter();
  const [selectedProblems, setSelectedProblems] = useState<SelectedProblem[]>(
    []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { user } = useAuth();
  const dbConnectionData = localStorage.getItem("dbConnectionData");
  const dbConnectionDataObj = JSON.parse(dbConnectionData || "{}");
  console.log(dbConnectionDataObj, "dbConnectionDataObj");
  // 防重复调用与首渲染仅触发一次
  const inFlightRef = useRef(false);
  const mountedCalledRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("selectedProblems");
    if (stored) {
      try {
        const problems = JSON.parse(stored);
        setSelectedProblems(problems);
        // Auto-start generation process
        startGeneration(problems);
      } catch (e) {
        console.error("Failed to parse selected problems", e);
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
    let runResultForNext: any = null;

    try {
      // 先调用业务预处理接口：standal_sql
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 600_000);
        let segmentsPayload: any[] = [];
        try {
          const raw = localStorage.getItem("marketsData");
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              segmentsPayload = arr.map((seg: any) => ({
                name: seg.name || seg.title,
                analysis: seg.analysis || undefined,
                valueQuestions: seg.valueQuestions || [],
                segmentId: seg.segmentId || seg.id || undefined,
              }));
            }
          }
        } catch {}

        // const taskId =
        //   (globalThis as any).crypto?.randomUUID?.() || `task_${Date.now()}`;
        const taskId = "66cb45e4-5d87-49f2-a90d-6f4b76b5b0e2";
        const run_result = {
          domain: { primaryDomain: "Hospitality Management" },
          ingest: { schemaHash: "sha256-3c7459f15975eae5" },
          run_id: "r_1",
          status: "complete",
          task_id: taskId,
          segments: segmentsPayload,
          anchIndex: [
            {
              index: 0,
              table: "calendar",
              columns: [
                "listing_id",
                "date",
                "available",
                "price",
                "adjusted_price",
                "minimum_nights",
                "maximum_nights",
              ],
            },
            {
              index: 1,
              table: "listings",
              columns: [
                "id",
                "name",
                "host_id",
                "host_name",
                "neighbourhood_group",
                "neighbourhood",
                "latitude",
                "longitude",
                "room_type",
                "price",
                "minimum_nights",
                "number_of_reviews",
                "last_review",
                "reviews_per_month",
                "calculated_host_listings_count",
                "availability_365",
                "number_of_reviews_ltm",
                "license",
              ],
            },
            {
              index: 2,
              table: "listingsdetails",
              columns: [
                "id",
                "listing_url",
                "scrape_id",
                "last_scraped",
                "source",
                "name",
                "description",
                "neighborhood_overview",
                "picture_url",
                "host_id",
                "host_url",
                "host_name",
                "host_since",
                "host_location",
                "host_about",
                "host_response_time",
                "host_response_rate",
                "host_acceptance_rate",
                "host_is_superhost",
                "host_thumbnail_url",
                "host_picture_url",
                "host_neighbourhood",
                "host_listings_count",
                "host_total_listings_count",
                "host_verifications",
                "host_has_profile_pic",
                "host_identity_verified",
                "neighbourhood",
                "neighbourhood_cleansed",
                "neighbourhood_group_cleansed",
                "latitude",
                "longitude",
                "property_type",
                "room_type",
                "accommodates",
                "bathrooms",
                "bathrooms_text",
                "bedrooms",
                "beds",
                "amenities",
                "price",
                "minimum_nights",
                "maximum_nights",
                "minimum_minimum_nights",
                "maximum_minimum_nights",
                "minimum_maximum_nights",
                "maximum_maximum_nights",
                "minimum_nights_avg_ntm",
                "maximum_nights_avg_ntm",
                "calendar_updated",
                "has_availability",
                "availability_30",
                "availability_60",
                "availability_90",
                "availability_365",
                "calendar_last_scraped",
                "number_of_reviews",
                "number_of_reviews_ltm",
                "number_of_reviews_l30d",
                "availability_eoy",
                "number_of_reviews_ly",
                "estimated_occupancy_l365d",
                "estimated_revenue_l365d",
                "first_review",
                "last_review",
                "review_scores_rating",
                "review_scores_accuracy",
                "review_scores_cleanliness",
                "review_scores_checkin",
                "review_scores_communication",
                "review_scores_location",
                "review_scores_value",
                "license",
                "instant_bookable",
                "calculated_host_listings_count",
                "calculated_host_listings_count_entire_homes",
                "calculated_host_listings_count_private_rooms",
                "calculated_host_listings_count_shared_rooms",
                "reviews_per_month",
              ],
            },
            {
              index: 3,
              table: "neighbourhoods",
              columns: ["neighbourhood_group", "neighbourhood"],
            },
            {
              index: 4,
              table: "reviews",
              columns: ["listing_id", "date"],
            },
            {
              index: 5,
              table: "reviewsdetails",
              columns: [
                "listing_id",
                "id",
                "date",
                "reviewer_id",
                "reviewer_name",
                "comments",
              ],
            },
          ],
          parent_run_id: null,
        };
        runResultForNext = run_result;

        const standalRes = await fetch(
          "https://business-insight.datail.ai/api/v1/standal_sql",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ run_result }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);
        const standalText = await standalRes.text();
        console.log(standalText, "standalText");
        let standalJson: any = standalText;
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
        // 将 standal_sql 成功返回的 queries 作为下一步 batchData.queries
        extractedQueries = Array.isArray((standalJson as any)?.queries)
          ? (standalJson as any).queries
          : Array.isArray((standalJson as any)?.data?.queries)
          ? (standalJson as any).data.queries
          : [];
        if (!Array.isArray(extractedQueries) || extractedQueries.length === 0) {
          throw new Error("standal_sql 未返回有效的 queries 数组");
        }
      } catch (e) {
        console.error("standal_sql 调用失败", e);
        throw e instanceof Error ? e : new Error("standal_sql 调用失败");
      }

      const batchData = {
        queries: extractedQueries,
        anchorIndex:
          '[{"table":"calendar","columns":["listing_id","date","available","price","adjusted_price","minimum_nights","maximum_nights"],"index":0},{"table":"listings","columns":["id","name","host_id","host_name","neighbourhood_group","neighbourhood","latitude","longitude","room_type","price","minimum_nights","number_of_reviews","last_review","reviews_per_month","calculated_host_listings_count","availability_365","number_of_reviews_ltm","license"],"index":1},{"table":"listingsdetails","columns":["id","listing_url","scrape_id","last_scraped","source","name","description","neighborhood_overview","picture_url","host_id","host_url","host_name","host_since","host_location","host_about","host_response_time","host_response_rate","host_acceptance_rate","host_is_superhost","host_thumbnail_url","host_picture_url","host_neighbourhood","host_listings_count","host_total_listings_count","host_verifications","host_has_profile_pic","host_identity_verified","neighbourhood","neighbourhood_cleansed","neighbourhood_group_cleansed","latitude","longitude","property_type","room_type","accommodates","bathrooms","bathrooms_text","bedrooms","beds","amenities","price","minimum_nights","maximum_nights","minimum_minimum_nights","maximum_minimum_nights","minimum_maximum_nights","maximum_maximum_nights","minimum_nights_avg_ntm","maximum_nights_avg_ntm","calendar_updated","has_availability","availability_30","availability_60","availability_90","availability_365","calendar_last_scraped","number_of_reviews","number_of_reviews_ltm","number_of_reviews_l30d","availability_eoy","number_of_reviews_ly","estimated_occupancy_l365d","estimated_revenue_l365d","first_review","last_review","review_scores_rating","review_scores_accuracy","review_scores_cleanliness","review_scores_checkin","review_scores_communication","review_scores_location","review_scores_value","license","instant_bookable","calculated_host_listings_count","calculated_host_listings_count_entire_homes","calculated_host_listings_count_private_rooms","calculated_host_listings_count_shared_rooms","reviews_per_month"],"index":2},{"table":"neighbourhoods","columns":["neighbourhood_group","neighbourhood"],"index":3},{"table":"reviews","columns":["listing_id","date"],"index":4},{"table":"reviewsdetails","columns":["listing_id","id","date","reviewer_id","reviewer_name","comments"],"index":5}]',
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
      localStorage.setItem("currentAppUrl", data.data.domain);
      router.push(`/preview?id=${data.data.serviceId}`);
    } catch (err) {
      console.error("Error generating batch", err);
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

    // Generate steps for the generation process
    const steps = [
      "Initializing AI models...",
      "Analyzing selected features...",
      "Generating ChatApp architecture...",
      "Creating user interface components...",
      "Implementing data integration...",
      "Optimizing performance...",
      "Finalizing ChatApp...",
    ];

    let currentStep = 0;
    setGenerationStep(steps[0]);

    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setGenerationStep(steps[currentStep]);
        setCurrentStepIndex(currentStep);
      } else {
        clearInterval(stepInterval);
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

        localStorage.setItem("currentApp", JSON.stringify(app));
      }
    }, 1500); // Each step takes 1.5 seconds
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation removed on generate page */}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold mb-2">Generating Your ChatAPP</h1>
          <p className="text-muted-foreground">
            AI is creating your ChatAPP with {selectedProblems.length} selected
            features
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            {hasError ? (
              <XCircle className="size-12 text-red-500 mb-6" />
            ) : (
              <Loader2 className="size-12 text-primary animate-spin mb-6" />
            )}

            <CardTitle className="mb-4 text-xl">
              {hasError ? "Generation Failed" : "Generating ChatAPP"}
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
                <div className="text-center">
                  <p className="text-lg font-medium text-primary mb-2">
                    {generationStep}
                  </p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${((currentStepIndex + 1) / 7) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Step {currentStepIndex + 1} of 7
                  </p>
                </div>
              )}

              {/* Selected Features Preview */}
              <div className="mt-8">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Selected Features:
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedProblems.map((problem, index) => (
                    <div
                      key={index + "-" + problem.toString()}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                      <span className="truncate">{problem.toString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <CardDescription className="text-center max-w-md mt-6">
              This process typically takes 10-15 seconds. Please wait while we
              generate your ChatAPP ...
            </CardDescription>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
