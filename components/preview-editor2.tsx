"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sparkles,
  Send,
  Loader2,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  Trash2,
  Eye,
  LayoutDashboard,
} from "lucide-react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

type PreviewDesign =
  | "product-list"
  | "metrics-dashboard"
  | "simple-text"
  | "pie-chart";

type Feature = {
  id: string;
  name: string;
  userProfile: string;
  templateType: string;
  templateName: string;
};

type App = {
  id: string;
  name: string;
  features: Feature[];
  status: string;
  createdAt: string;
  featureCount: number;
};

export function PreviewEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get("id");

  const [searchMessage, setSearchMessage] = useState("");
  const [isSearchProcessing, setIsSearchProcessing] = useState(false);
  const [isPreviewUpdating, setIsPreviewUpdating] = useState(false);
  const inputBarRef = useRef<HTMLDivElement | null>(null);
  const [inputBarHeight, setInputBarHeight] = useState<number>(140);
  const INPUT_BAR_BOTTOM_OFFSET = 8; // tailwind bottom-2 => 8px

  const [currentApp, setCurrentApp] = useState<App | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>("");
  const [contextMenuFeatureId, setContextMenuFeatureId] = useState<
    string | null
  >(null);
  const [featureDesigns, setFeatureDesigns] = useState<
    Record<string, PreviewDesign>
  >({});
  const rightPanelRef = useRef<HTMLDivElement | null>(null);
  const [rightPanelLeft, setRightPanelLeft] = useState<number>(256);
  const [panelLayout, setPanelLayout] = useState<number[] | null>(null);

  const [searchHistory, setSearchHistory] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
      type?: "text" | "chart" | "image";
      data?: any;
    }>
  >([]);

  // Save dialog states
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveFormData, setSaveFormData] = useState({
    name: "",
    description: "",
  });

  // Predefined question texts for each feature
  const getQuestionText = (featureName: string) => {
    const questionMap: Record<string, string> = {
      "Product Catalog and Inventory Display":
        "Please show the product catalog and inventory status.",
      "User Feedback Collection and Analysis":
        "Please analyze the user feedback data.",
      "A/B Testing Results Analysis":
        "Please present the A/B testing results analysis.",
      "Target User Segmentation":
        "Please perform target user segmentation analysis.",
      "User Journey Visualization":
        "Please provide a user journey visualization.",
      "User Churn Early Warning System":
        "Please analyze the user churn early warning indicators.",
      "Feature Usage Statistics":
        "Please display the feature usage statistics.",
      "Competitor Feature Comparison Analysis":
        "Please conduct a competitive feature comparison analysis.",
      "Product Roadmap Priority Ranking":
        "Please show the product roadmap priority ranking.",
      "New Feature Adoption Rate Prediction":
        "Please forecast the adoption rate of new features.",
    };
    return (
      questionMap[featureName] ||
      `Please provide information about ${featureName}.`
    );
  };

  // Render different types of cards
  const renderCard = (item: {
    role: "user" | "assistant";
    content: string;
    type?: "text" | "chart" | "image";
    data?: any;
  }) => {
    if (item.role === "user") {
      return (
        <div className="flex justify-end">
          <div
            className="max-w-[70%] rounded-lg p-3 text-gray-800"
            style={{ backgroundColor: "#F4F4F4" }}
          >
            <p className="text-sm">{item.content}</p>
          </div>
        </div>
      );
    }

    // Assistant response cards
    if (item.type === "chart") {
      const getChartInfo = (chartType: string) => {
        switch (chartType) {
          case "sales-trend":
            return {
              title: "Sales Trend Chart",
              value: "¥128,450 (+12.5%)",
              icon: TrendingUp,
            };
          case "ab-test":
            return {
              title: "A/B Test Results",
              value: "Conversion rate increased by 15%",
              icon: TrendingUp,
            };
          case "user-segments":
            return {
              title: "User Segmentation Chart",
              value: "3 major segments",
              icon: Users,
            };
          case "inventory-status":
            return {
              title: "Inventory Status Chart",
              value: "357 SKUs",
              icon: ShoppingCart,
            };
          case "feedback-analysis":
            return {
              title: "Feedback Analysis Chart",
              value: "Satisfaction score 4.2",
              icon: TrendingUp,
            };
          case "user-journey":
            return {
              title: "User Journey Diagram",
              value: "5 key stages",
              icon: Users,
            };
          case "campaign-performance":
            return {
              title: "Campaign Performance Chart",
              value: "Sales increased by 23%",
              icon: TrendingUp,
            };
          case "recommendation-performance":
            return {
              title: "Recommendation Performance Chart",
              value: "Accuracy improved by 18%",
              icon: TrendingUp,
            };
          case "price-comparison":
            return {
              title: "Price Comparison Chart",
              value: "Clear competitive advantage",
              icon: TrendingUp,
            };
          default:
            return { title: "Data Analysis Chart", value: "Analysis complete", icon: TrendingUp };
        }
      };

      const chartInfo = getChartInfo(item.data?.chartType || "");
      const IconComponent = chartInfo.icon;

      return (
        <div className="flex justify-start">
          <Card className="max-w-[85%] p-4 shadow-sm border">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-muted-foreground">
                  Data Chart
                </span>
              </div>
              <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-200">
                <div className="text-center">
                  <IconComponent className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-blue-600 font-medium">
                    {chartInfo.title}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    {chartInfo.value}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{item.content}</p>
            </div>
          </Card>
        </div>
      );
    }

    if (item.type === "image") {
      const getImageInfo = (imageType: string) => {
        switch (imageType) {
          case "user-segmentation":
            return {
              title: "User Segmentation Chart",
              value: "3 major segments",
              icon: Users,
            };
          case "user-journey":
            return {
              title: "User Journey Diagram",
              value: "5 key stages",
              icon: Users,
            };
          case "sales-analysis":
            return {
              title: "Sales Analysis Chart",
              value: "¥128,450",
              icon: TrendingUp,
            };
          case "product-catalog":
            return {
              title: "Product Catalog Chart",
              value: "357 SKUs",
              icon: ShoppingCart,
            };
          case "feedback-visualization":
            return {
              title: "Feedback Visualization",
              value: "Satisfaction score 4.2",
              icon: TrendingUp,
            };
          case "ab-test-results":
            return {
              title: "A/B Test Chart",
              value: "Conversion rate increased by 15%",
              icon: TrendingUp,
            };
          case "promotional-analysis":
            return {
              title: "Campaign Analysis Chart",
              value: "Sales increased by 23%",
              icon: TrendingUp,
            };
          case "recommendation-engine":
            return {
              title: "Recommendation Engine Chart",
              value: "Accuracy improved by 18%",
              icon: TrendingUp,
            };
          case "competitive-pricing":
            return {
              title: "Price Comparison Chart",
              value: "Clear competitive advantage",
              icon: TrendingUp,
            };
          default:
            return { title: "Data Visualization", value: "Analysis complete", icon: Users };
        }
      };

      const imageInfo = getImageInfo(item.data?.imageType || "");
      const IconComponent = imageInfo.icon;

      return (
        <div className="flex justify-start">
          <Card className="max-w-[85%] p-4 shadow-sm border">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-muted-foreground">
                  Visualization Chart
                </span>
              </div>
              <div className="h-48 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg flex items-center justify-center border-2 border-dashed border-green-200">
                <div className="text-center">
                  <IconComponent className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-green-600 font-medium">
                    {imageInfo.title}
                  </p>
                  <p className="text-xs text-green-500 mt-1">
                    {imageInfo.value}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{item.content}</p>
            </div>
          </Card>
        </div>
      );
    }

    // Default text card
    return (
      <div className="flex justify-start">
        <Card className="max-w-[85%] p-4 shadow-sm border">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-muted-foreground">
                Analysis Report
              </span>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {item.content}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  useEffect(() => {
    const stored = localStorage.getItem("currentApp");
    if (stored) {
      try {
        const app = JSON.parse(stored);
        setCurrentApp(app);
        if (app.features && app.features.length > 0) {
          setSelectedFeatureId(app.features[0].id);

          // Assign preview designs to each feature
          const designs: PreviewDesign[] = [
            "product-list",
            "metrics-dashboard",
            "simple-text",
            "pie-chart",
          ];
          const newFeatureDesigns: Record<string, PreviewDesign> = {};

          app.features.forEach((feature: Feature) => {
            // Apply specific layouts for certain features
            if (feature.name.includes("Product Recommendation")) {
              newFeatureDesigns[feature.id] = "pie-chart";
            } else if (
              feature.name.includes("Promotional Campaign Effectiveness")
            ) {
              newFeatureDesigns[feature.id] = "metrics-dashboard";
            } else if (feature.name.includes("Price Competitiveness")) {
              newFeatureDesigns[feature.id] = "simple-text";
            } else {
              // Randomly assign layouts for remaining features
              const randomDesign =
                designs[Math.floor(Math.random() * designs.length)];
              newFeatureDesigns[feature.id] = randomDesign;
            }
          });

          setFeatureDesigns(newFeatureDesigns);
        }
      } catch (e) {
        console.log("Failed to parse current app", e);
      }
    }
  }, [appId]);

  useEffect(() => {
    const measure = () => {
      if (inputBarRef.current) {
        // offsetHeight already includes padding and border
        setInputBarHeight(inputBarRef.current.offsetHeight);
      }
      if (rightPanelRef.current) {
        const rect = rightPanelRef.current.getBoundingClientRect();
        setRightPanelLeft(rect.left);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const handleSearchMessage = () => {
    if (!searchMessage.trim()) return;

    const userMessage = searchMessage.trim();
    setSearchMessage(""); // Clear input immediately
    setIsSearchProcessing(true);
    setIsPreviewUpdating(true);

    // Add user message to search history (for middle preview area)
    setSearchHistory((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);

    // Generate context-aware response with random card type
    const generateResponse = (question: string) => {
      const cardTypes = ["text", "chart", "image"] as const;

      const randomType =
        cardTypes[Math.floor(Math.random() * cardTypes.length)];

      const normalizedQuestion = question.toLowerCase();

      if (
        normalizedQuestion.includes("feature usage") ||
        normalizedQuestion.includes("usage statistics")
      ) {
        return {
          content:
            "Sales trend analysis shows continuous growth; focus on conversion rate optimization.",
          type: randomType,
          data:
            randomType === "chart"
              ? { chartType: "sales-trend" }
              : randomType === "image"
              ? { imageType: "sales-analysis" }
              : undefined,
        };
      } else if (
        normalizedQuestion.includes("user segmentation") ||
        normalizedQuestion.includes("audience segment")
      ) {
        return {
          content:
            "User segmentation analysis completed, identifying three primary audience groups.",
          type: randomType,
          data:
            randomType === "chart"
              ? { chartType: "user-segments" }
              : randomType === "image"
              ? { imageType: "user-segmentation" }
              : undefined,
        };
      } else if (
        normalizedQuestion.includes("product catalog") ||
        normalizedQuestion.includes("inventory")
      ) {
        const textContent =
          "**Product Catalog Summary**\n- Electronics: 156 SKUs\n- Apparel: 89 SKUs\n- Food: 67 SKUs\n- Home Goods: 45 SKUs\n\n**Inventory Status**\n- Healthy stock: 89%\n- Low stock: 8%\n- Out of stock: 3%\n\nWould you like to review specific product details?";
        const shortContent =
          "Product catalog and inventory review completed: 357 SKUs with healthy stock levels.";

        return {
          content: randomType === "text" ? textContent : shortContent,
          type: randomType,
          data:
            randomType === "chart"
              ? { chartType: "inventory-status" }
              : randomType === "image"
              ? { imageType: "product-catalog" }
              : undefined,
        };
      } else if (
        normalizedQuestion.includes("user feedback") ||
        normalizedQuestion.includes("customer feedback")
      ) {
        const textContent =
          "**Feedback Summary**\n- Feedback received this month: 1,247 items\n- Satisfaction score: 4.2 / 5.0\n- Average response time: 2.3 hours\n\n**Primary Themes**\n- Product quality: 35%\n- Delivery service: 28%\n- Customer support: 20%\n- Website functionality: 17%\n\n**Recommended Actions**\n- Improve delivery turnaround\n- Enrich product descriptions\n- Enhance search capabilities";
        const shortContent =
          "User feedback analysis completed: satisfaction score 4.2, with key attention on product quality and delivery service.";

        return {
          content: randomType === "text" ? textContent : shortContent,
          type: randomType,
          data:
            randomType === "chart"
              ? { chartType: "feedback-analysis" }
              : randomType === "image"
              ? { imageType: "feedback-visualization" }
              : undefined,
        };
      } else if (
        normalizedQuestion.includes("a/b test") ||
        normalizedQuestion.includes("ab test")
      ) {
        return {
          content:
            "A/B testing results show the new variant improved conversion rate by 15%.",
          type: randomType,
          data:
            randomType === "chart"
              ? { chartType: "ab-test" }
              : randomType === "image"
              ? { imageType: "ab-test-results" }
              : undefined,
        };
      } else if (
        normalizedQuestion.includes("user journey") ||
        normalizedQuestion.includes("customer journey")
      ) {
        return {
          content:
            "User journey visualization highlights the critical conversion touchpoints.",
          type: randomType,
          data:
            randomType === "chart"
              ? { chartType: "user-journey" }
              : randomType === "image"
              ? { imageType: "user-journey" }
              : undefined,
        };
      } else if (
        normalizedQuestion.includes("campaign") ||
        normalizedQuestion.includes("promotion")
      ) {
        return {
          content:
            "Promotional campaign analysis completed: sales increased by 23% during the campaign.",
          type: randomType,
          data:
            randomType === "chart"
              ? { chartType: "campaign-performance" }
              : randomType === "image"
              ? { imageType: "promotional-analysis" }
              : undefined,
        };
      } else if (
        normalizedQuestion.includes("product recommendation") ||
        normalizedQuestion.includes("recommendation engine")
      ) {
        return {
          content:
            "Product recommendation engine analysis shows accuracy improved by 18%.",
          type: randomType,
          data:
            randomType === "chart"
              ? { chartType: "recommendation-performance" }
              : randomType === "image"
              ? { imageType: "recommendation-engine" }
              : undefined,
        };
      } else if (
        normalizedQuestion.includes("price competitiveness") ||
        normalizedQuestion.includes("pricing advantage")
      ) {
        return {
          content:
            "Price competitiveness analysis confirms a clear advantage over competitors.",
          type: randomType,
          data:
            randomType === "chart"
              ? { chartType: "price-comparison" }
              : randomType === "image"
              ? { imageType: "competitive-pricing" }
              : undefined,
        };
      } else {
        return {
          content:
            "The requested data has been analyzed. Let me know if you need deeper insights or additional questions explored.",
          type: randomType,
          data:
            randomType === "chart"
              ? { chartType: "general-analysis" }
              : randomType === "image"
              ? { imageType: "data-visualization" }
              : undefined,
        };
      }
    };

    setTimeout(() => {
      // Add assistant response to search history (for middle preview area)
      const response = generateResponse(userMessage);
      setSearchHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.content,
          type: response.type,
          data: response.data,
        },
      ]);
      setIsSearchProcessing(false);
      setIsPreviewUpdating(false);
    }, 1500);
  };

  const handleDeleteFeature = (featureId: string) => {
    if (!currentApp) return;

    if (currentApp.features.length <= 1) {
      alert("Application must retain at least one feature");
      return;
    }

    const updatedFeatures = currentApp.features.filter(
      (f) => f.id !== featureId
    );
    const updatedApp = {
      ...currentApp,
      features: updatedFeatures,
      featureCount: updatedFeatures.length,
    };

    setCurrentApp(updatedApp);
    localStorage.setItem("currentApp", JSON.stringify(updatedApp));

    if (selectedFeatureId === featureId) {
      setSelectedFeatureId(updatedFeatures[0].id);
    }
  };

  const handleSaveSubmit = () => {
    if (!saveFormData.name.trim()) {
      alert("Please enter a name for your app");
      return;
    }
    if (!saveFormData.description.trim()) {
      alert("Please enter a description for your app");
      return;
    }

    // Here you can add logic to save the app with the provided name and description
    console.log("Saving app:", saveFormData);

    // Close dialog and navigate to success page
    setIsSaveDialogOpen(false);
    setSaveFormData({ name: "", description: "" });
    router.push("/save-success");
  };

  const selectedFeature = currentApp?.features.find(
    (f) => f.id === selectedFeatureId
  );

  const renderPreview = () => {
    if (isPreviewUpdating) {
      return (
        <Card className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="size-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Updating preview...</p>
          </div>
        </Card>
      );
    }

    const currentDesign = selectedFeature
      ? featureDesigns[selectedFeature.id]
      : "product-list";

    if (currentDesign === "product-list") {
      return (
        <Card className="p-6 px-7">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              {selectedFeature?.name || "Feature Preview"}
            </h1>
            <Badge variant="outline">{selectedFeature?.templateName}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select className="w-full border border-input rounded-md px-3 py-2 bg-background">
                <option>All Categories</option>
                <option>Electronics</option>
                <option>Clothing</option>
                <option>Food</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Price Range
              </label>
              <select className="w-full border border-input rounded-md px-3 py-2 bg-background">
                <option>All Prices</option>
                <option>0-100</option>
                <option>100-500</option>
                <option>500+</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Sort</label>
              <select className="w-full border border-input rounded-md px-3 py-2 bg-background">
                <option>Latest</option>
                <option>Price Low to High</option>
                <option>Price High to Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="border border-border rounded-lg p-4 flex gap-4"
              >
                <div className="size-20 bg-muted rounded-md shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Product Name {i}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    This is a brief description of the product
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">¥{99 * i}</span>
                    <Button size="sm">View Details</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      );
    }

    if (currentDesign === "simple-text") {
      return (
        <Card className="p-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center mb-6">
              <h1 className="text-3xl font-bold">
                {selectedFeature?.name || "Feature Preview"}
              </h1>
              <Badge variant="outline" className="ml-4">
                {selectedFeature?.templateName}
              </Badge>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-8">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Data Analysis Insights
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Based on your data, we identified meaningful business trends and
                  growth opportunities. These insights translate into actionable
                  guidance to support confident decision-making.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-800">+23%</div>
                  <div className="text-sm text-green-600">Growth this month</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-800">98%</div>
                  <div className="text-sm text-blue-600">Accuracy</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    if (currentDesign === "pie-chart") {
      return (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              {selectedFeature?.name || "Feature Preview"}
            </h1>
            <Badge variant="outline">{selectedFeature?.templateName}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Data Distribution Analysis</h3>
              <div className="relative w-64 h-64 mx-auto">
                <div className="relative w-full h-full">
                  <div
                    className="absolute inset-0 rounded-full border-8 border-blue-500"
                    style={{
                      clipPath: "polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)",
                    }}
                  ></div>
                  <div
                    className="absolute inset-0 rounded-full border-8 border-green-500"
                    style={{
                      clipPath:
                        "polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)",
                    }}
                  ></div>
                  <div
                    className="absolute inset-0 rounded-full border-8 border-yellow-500"
                    style={{
                      clipPath: "polygon(50% 50%, 50% 100%, 0% 100%, 0% 50%)",
                    }}
                  ></div>
                  <div
                    className="absolute inset-0 rounded-full border-8 border-red-500"
                    style={{
                      clipPath: "polygon(50% 50%, 0% 50%, 0% 0%, 50% 0%)",
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold">100%</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detailed Data</h3>
              <div className="space-y-3">
                {[
                  {
                    label: "Product A",
                    value: 35,
                    color: "bg-blue-500",
                    percentage: "35%",
                  },
                  {
                    label: "Product B",
                    value: 28,
                    color: "bg-green-500",
                    percentage: "28%",
                  },
                  {
                    label: "Product C",
                    value: 22,
                    color: "bg-yellow-500",
                    percentage: "22%",
                  },
                  {
                    label: "Product D",
                    value: 15,
                    color: "bg-red-500",
                    percentage: "15%",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full ${item.color}`}
                      ></div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {item.value} items
                      </span>
                      <span className="font-semibold">{item.percentage}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Key Insight:</strong> Product A holds the largest market
                  share; prioritize growth strategies for this segment.
                </div>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-6 px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {selectedFeature?.name || "Feature Preview"}
          </h1>
          <Badge variant="outline">{selectedFeature?.templateName}</Badge>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Sales</span>
              <DollarSign className="size-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900">¥128,450</div>
            <div className="text-xs text-green-600 mt-1">
              ↑ 12.5% vs last month
            </div>
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Order Count</span>
              <ShoppingCart className="size-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-900">1,234</div>
            <div className="text-xs text-green-600 mt-1">
              ↑ 8.3% vs last month
            </div>
          </Card>

          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Active Users
              </span>
              <Users className="size-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900">8,567</div>
            <div className="text-xs text-green-600 mt-1">
              ↑ 15.2% vs last month
            </div>
          </Card>

          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Conversion Rate
              </span>
              <TrendingUp className="size-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-900">3.8%</div>
            <div className="text-xs text-red-600 mt-1">
              ↓ 0.5% vs last month
            </div>
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4">Sales Trend</h3>
          <div className="h-48 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
            Sales trend chart area
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Top 5 Best-selling Products</h3>
          <div className="space-y-3">
            {[
              {
                name: "Wireless Bluetooth Headphones",
                sales: 456,
                revenue: "$456.00",
              },
              { name: "Smart Watch", sales: 389, revenue: "$389.00" },
              { name: "Portable Power Bank", sales: 312, revenue: "$312.00" },
              { name: "Phone Case", sales: 278, revenue: "$278.00" },
              { name: "Cable Set", sales: 234, revenue: "$234.00" },
            ].map((product, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-muted-foreground">
                    #{i + 1}
                  </span>
                  <span className="font-medium">{product.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-muted-foreground">
                    {product.sales} units
                  </span>
                  <span className="font-semibold">{product.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Card>
    );
  };

  if (!currentApp) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex bg-white">
      <div className="shape-1"></div>
      <div className="shape-2"></div>
      <div className="h-screen flex flex-col w-full">
        <div className="flex-1 flex overflow-hidden">
          <ResizablePanelGroup
            direction="horizontal"
            onLayout={(sizes) => {
              setPanelLayout(sizes);
              try {
                localStorage.setItem("previewSplitLayout", JSON.stringify(sizes));
              } catch {}
              if (rightPanelRef.current) {
                const rect = rightPanelRef.current.getBoundingClientRect();
                setRightPanelLeft(rect.left);
              }
            }}
            className="w-full h-full"
          >
            <ResizablePanel
              defaultSize={(panelLayout && panelLayout[0]) || 24}
              minSize={16}
              maxSize={40}
              className="flex flex-col glass-effect"
            >
              <div className="h-20 flex items-center justify-center border-b border-gray-200/30">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-8 h-8 text-indigo-500" />
                  <span className="text-xl font-bold text-gray-800">
                    Valued questions
                  </span>
                </div>
              </div>
              <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                {currentApp.features.map((feature) => {
                  const isSelected = feature.id === selectedFeatureId;

                  return (
                    <div key={feature.id} className="relative">
                      <button
                        onClick={() => {
                          setSelectedFeatureId(feature.id);
                          // Auto-fill the input with predefined question text
                          const questionText = getQuestionText(feature.name);
                          setSearchMessage(questionText);

                          // Focus the input after auto-filling
                          setTimeout(() => {
                            const input = document.querySelector(
                              'input[placeholder="Search webpage"]'
                            ) as HTMLInputElement;
                            if (input) {
                              input.focus();
                              input.select(); // Select the text so user can easily edit it
                            }
                          }, 100);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenuFeatureId(feature.id);
                        }}
                        className={`nav-link flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 w-full text-left ${
                          isSelected
                            ? "active bg-white/90 text-gray-900 shadow-md"
                            : "text-gray-600 hover:bg-white/50"
                        }`}
                      >
                        <Eye className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {feature.name}
                        </span>
                      </button>

                      <Popover
                        open={contextMenuFeatureId === feature.id}
                        onOpenChange={(open) =>
                          !open && setContextMenuFeatureId(null)
                        }
                      >
                        <PopoverTrigger asChild>
                          <div className="absolute inset-0 pointer-events-none" />
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-48 p-2"
                          side="right"
                          align="start"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              handleDeleteFeature(feature.id);
                              setContextMenuFeatureId(null);
                            }}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete Feature
                          </Button>
                        </PopoverContent>
                      </Popover>
                    </div>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-gray-200/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center border-2 border-indigo-300">
                    <span className="text-white font-semibold text-sm">
                      {currentApp.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">
                      {currentApp.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {currentApp.features.length} questions
                    </p>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          <ResizableHandle
            withHandle
            className="bg-transparent after:bg-transparent hover:after:bg-transparent focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 opacity-0"
          />
          <ResizablePanel
            defaultSize={(panelLayout && panelLayout[1]) || 76}
            minSize={40}
            className="relative"
          >
            <div
              ref={rightPanelRef}
              className="h-full bg-white overflow-y-auto relative leading-[0rem] px-0.5 pt-0"
              style={{
                height: `calc(100vh - ${
                  inputBarHeight + INPUT_BAR_BOTTOM_OFFSET
                }px)`,
                width: "calc(100% - 20px)",
              }}
            >
              <main className="flex-grow p-8">
                <div
                  className="max-w-4xl mx-auto"
                  style={{
                    paddingBottom: inputBarHeight + INPUT_BAR_BOTTOM_OFFSET + 16,
                  }}
                >
                  {searchHistory.length > 0 && (
                    <div className="mb-6 space-y-4">
                      {searchHistory.map((msg, i) => (
                        <div key={i}>{renderCard(msg)}</div>
                      ))}
                      {isSearchProcessing && (
                        <div className="flex justify-start">
                          <Card className="p-4 shadow-sm border">
                            <div className="flex items-center gap-3">
                              <Loader2 className="size-4 animate-spin text-primary" />
                              <span className="text-sm text-muted-foreground">
                                Analyzing data...
                              </span>
                            </div>
                          </Card>
                        </div>
                      )}
                    </div>
                  )}

                  {searchHistory.length === 0 && (
                    <div className="relative pb-12 flex items-center justify-center min-h-[400px]">
                      <div className="text-center text-muted-foreground">
                        <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 mx-auto">
                          <Sparkles className="size-8" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2"></h3>
                        <p className="text-sm">
                          Select a question on the left to view the answer.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </main>

              {/* Bottom right question description box */}
              {selectedFeatureId && selectedFeature && (
                <div className="fixed bottom-24 right-8 max-w-md z-40">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200/50 p-4 backdrop-blur-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Question Description
                      </h3>
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedFeature.name}
                    </p>
                  </div>
                </div>
              )}

              <div
                className="fixed bottom-2 right-0 px-8 z-50"
                ref={inputBarRef}
                style={{ left: `${rightPanelLeft}px` }}
              >
                <div className="max-w-4xl mx-auto">
                  <div className="bg-background border-border rounded-3xl shadow-lg p-4 py-4 border-2">
                    <input
                      type="text"
                      placeholder="Search webpage"
                      value={searchMessage}
                      onChange={(e) => setSearchMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearchMessage();
                        }
                      }}
                      disabled={isSearchProcessing}
                      className="w-full bg-transparent border-none outline-none text-lg mb-3 px-2"
                    />
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                        <button className="hover:bg-muted rounded-full p-1">
                          <svg
                            className="size-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </button>
                        <button className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 rounded-full px-3 py-1">
                          <svg
                            className="size-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="12" cy="12" r="10" strokeWidth={2} />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
                            />
                          </svg>
                          <span className="text-sm font-medium">Search</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={handleSearchMessage}
                          disabled={!searchMessage.trim() || isSearchProcessing}
                          className="hover:bg-muted rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="size-4 mr-2" />
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-xs text-muted-foreground mt-3">
                    ChatGPT may make mistakes. Please verify important
                    information.
                  </p>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Your App</DialogTitle>
            <DialogDescription>
              Please provide a name and description for your app before saving.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="app-name" className="text-sm font-medium">
                App Name
              </label>
              <Input
                id="app-name"
                placeholder="Enter your app name"
                value={saveFormData.name}
                onChange={(e) =>
                  setSaveFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="app-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="app-description"
                placeholder="Enter a description for your app"
                value={saveFormData.description}
                onChange={(e) =>
                  setSaveFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSubmit}>Save App</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}
