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
      "Product Catalog and Inventory Display": "请显示产品目录和库存情况",
      "User Feedback Collection and Analysis": "请分析用户反馈数据",
      "A/B Testing Results Analysis": "请展示A/B测试结果分析",
      "Target User Segmentation": "请进行目标用户分群分析",
      "User Journey Visualization": "请展示用户旅程可视化",
      "User Churn Early Warning System": "请分析用户流失预警情况",
      "Feature Usage Statistics": "请显示功能使用统计数据",
      "Competitor Feature Comparison Analysis": "请进行竞品功能对比分析",
      "Product Roadmap Priority Ranking": "请展示产品路线图优先级排序",
      "New Feature Adoption Rate Prediction": "请预测新功能采用率",
    };
    return questionMap[featureName] || `请提供关于${featureName}的信息`;
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
              title: "销售趋势图",
              value: "¥128,450 (+12.5%)",
              icon: TrendingUp,
            };
          case "ab-test":
            return {
              title: "A/B测试结果",
              value: "转化率提升15%",
              icon: TrendingUp,
            };
          case "user-segments":
            return { title: "用户分群图", value: "3个主要群体", icon: Users };
          case "inventory-status":
            return {
              title: "库存状态图",
              value: "357个SKU",
              icon: ShoppingCart,
            };
          case "feedback-analysis":
            return {
              title: "反馈分析图",
              value: "满意度4.2分",
              icon: TrendingUp,
            };
          case "user-journey":
            return { title: "用户旅程图", value: "5个关键节点", icon: Users };
          case "campaign-performance":
            return {
              title: "活动效果图",
              value: "销量增长23%",
              icon: TrendingUp,
            };
          case "recommendation-performance":
            return {
              title: "推荐效果图",
              value: "准确率提升18%",
              icon: TrendingUp,
            };
          case "price-comparison":
            return {
              title: "价格对比图",
              value: "竞争优势明显",
              icon: TrendingUp,
            };
          default:
            return { title: "数据分析图", value: "分析完成", icon: TrendingUp };
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
                  数据图表
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
            return { title: "用户分群图", value: "3个主要群体", icon: Users };
          case "user-journey":
            return { title: "用户旅程图", value: "5个关键节点", icon: Users };
          case "sales-analysis":
            return { title: "销售分析图", value: "¥128,450", icon: TrendingUp };
          case "product-catalog":
            return {
              title: "产品目录图",
              value: "357个SKU",
              icon: ShoppingCart,
            };
          case "feedback-visualization":
            return {
              title: "反馈可视化",
              value: "满意度4.2分",
              icon: TrendingUp,
            };
          case "ab-test-results":
            return {
              title: "A/B测试图",
              value: "转化率提升15%",
              icon: TrendingUp,
            };
          case "promotional-analysis":
            return {
              title: "促销分析图",
              value: "销量增长23%",
              icon: TrendingUp,
            };
          case "recommendation-engine":
            return {
              title: "推荐引擎图",
              value: "准确率提升18%",
              icon: TrendingUp,
            };
          case "competitive-pricing":
            return {
              title: "价格对比图",
              value: "竞争优势明显",
              icon: TrendingUp,
            };
          default:
            return { title: "数据可视化", value: "分析完成", icon: Users };
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
                  可视化图表
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
                分析报告
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

          // 为每个功能分配预览设计
          const designs: PreviewDesign[] = [
            "product-list",
            "metrics-dashboard",
            "simple-text",
            "pie-chart",
          ];
          const newFeatureDesigns: Record<string, PreviewDesign> = {};

          app.features.forEach((feature: Feature) => {
            // 为特定功能分配指定样式
            if (feature.name.includes("Product Recommendation")) {
              newFeatureDesigns[feature.id] = "pie-chart";
            } else if (
              feature.name.includes("Promotional Campaign Effectiveness")
            ) {
              newFeatureDesigns[feature.id] = "metrics-dashboard";
            } else if (feature.name.includes("Price Competitiveness")) {
              newFeatureDesigns[feature.id] = "simple-text";
            } else {
              // 其他功能随机分配
              const randomDesign =
                designs[Math.floor(Math.random() * designs.length)];
              newFeatureDesigns[feature.id] = randomDesign;
            }
          });

          setFeatureDesigns(newFeatureDesigns);
        }
      } catch (e) {
        console.error("Failed to parse current app", e);
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
      // 定义所有可能的卡片类型
      const cardTypes = ["text", "chart", "image"] as const;

      // 随机选择一个卡片类型
      const randomType =
        cardTypes[Math.floor(Math.random() * cardTypes.length)];

      // 根据问题类型生成内容，但随机分配展示形式
      if (question.includes("功能使用统计")) {
        return {
          content: "销售趋势分析显示持续增长，转化率需要关注优化。",
          type: randomType,
          data:
            randomType === "chart"
              ? { chartType: "sales-trend" }
              : randomType === "image"
              ? { imageType: "sales-analysis" }
              : undefined,
        };
      } else if (question.includes("用户分群")) {
        return {
          content: "用户分群分析完成，识别出3个主要用户群体。",
          type: randomType,
          data:
            randomType === "chart"
              ? { chartType: "user-segments" }
              : randomType === "image"
              ? { imageType: "user-segmentation" }
              : undefined,
        };
      } else if (question.includes("产品目录和库存")) {
        const textContent =
          "**产品目录统计**\n• 电子产品类：156个SKU\n• 服装类：89个SKU\n• 食品类：67个SKU\n• 家居用品：45个SKU\n\n**库存状态**\n• 正常库存：89%\n• 库存不足：8%\n• 缺货：3%\n\n需要查看具体的产品详情吗？";
        const shortContent =
          "产品目录和库存分析完成，共357个SKU，库存健康度良好。";

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
      } else if (question.includes("用户反馈")) {
        const textContent =
          "**反馈统计**\n• 本月收到反馈：1,247条\n• 满意度评分：4.2/5.0\n• 响应时间：平均2.3小时\n\n**主要反馈类型**\n• 产品质量：35%\n• 配送服务：28%\n• 客服体验：20%\n• 网站功能：17%\n\n**改进建议**\n• 优化配送时效\n• 增强产品描述\n• 改进搜索功能";
        const shortContent =
          "用户反馈分析完成，满意度4.2分，主要关注产品质量和配送服务。";

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
      } else if (question.includes("A/B测试")) {
        return {
          content: "A/B测试结果分析完成，新版本转化率提升15%。",
          type: randomType,
          data:
            randomType === "chart"
              ? { chartType: "ab-test" }
              : randomType === "image"
              ? { imageType: "ab-test-results" }
              : undefined,
        };
      } else if (question.includes("用户旅程")) {
        return {
          content: "用户旅程可视化分析显示关键转化节点。",
          type: randomType,
          data:
            randomType === "chart"
              ? { chartType: "user-journey" }
              : randomType === "image"
              ? { imageType: "user-journey" }
              : undefined,
        };
      } else if (question.includes("促销活动")) {
        return {
          content: "促销活动效果分析完成，活动期间销量增长23%。",
          type: randomType,
          data:
            randomType === "chart"
              ? { chartType: "campaign-performance" }
              : randomType === "image"
              ? { imageType: "promotional-analysis" }
              : undefined,
        };
      } else if (question.includes("产品推荐")) {
        return {
          content: "产品推荐引擎分析完成，推荐准确率提升18%。",
          type: randomType,
          data:
            randomType === "chart"
              ? { chartType: "recommendation-performance" }
              : randomType === "image"
              ? { imageType: "recommendation-engine" }
              : undefined,
        };
      } else if (question.includes("价格竞争力")) {
        return {
          content: "价格竞争力分析完成，与竞品相比价格优势明显。",
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
            "好的，我已经为您分析了相关数据。根据您的问题，我提供了相应的分析结果。如果您需要更详细的信息或有其他问题，请随时告诉我。",
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

  const selectedFeature = currentApp?.features.find(
    (f) => f.id === selectedFeatureId
  );

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

    const selectedFeature = currentApp?.features.find(
      (f) => f.id === selectedFeatureId
    );
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
                  数据分析洞察
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  基于您的数据，我们发现了重要的业务趋势和增长机会。通过智能分析，我们为您提供了可操作的洞察，帮助您做出更明智的决策。
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-800">+23%</div>
                  <div className="text-sm text-green-600">本月增长</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-800">98%</div>
                  <div className="text-sm text-blue-600">准确率</div>
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
            {/* 饼状图区域 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">数据分布分析</h3>
              <div className="relative w-64 h-64 mx-auto">
                {/* 模拟饼状图 */}
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
                      <div className="text-sm text-muted-foreground">总计</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 图例和数据 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">详细数据</h3>
              <div className="space-y-3">
                {[
                  {
                    label: "产品A",
                    value: 35,
                    color: "bg-blue-500",
                    percentage: "35%",
                  },
                  {
                    label: "产品B",
                    value: 28,
                    color: "bg-green-500",
                    percentage: "28%",
                  },
                  {
                    label: "产品C",
                    value: 22,
                    color: "bg-yellow-500",
                    percentage: "22%",
                  },
                  {
                    label: "产品D",
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
                        {item.value} 项
                      </span>
                      <span className="font-semibold">{item.percentage}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>关键洞察：</strong>{" "}
                  产品A占据最大市场份额，建议重点关注其增长策略。
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
    <div className="h-screen flex flex-col bg-background">
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
            className="flex flex-col"
            style={{ backgroundColor: "#F2F2F7" }}
          >
            <div className="px-4 py-3 flex items-center justify-between">
              <h2 className="font-medium text-lg" style={{ color: "#8E8E93" }}>
                Valued questions
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto pt-0 px-3 pb-3">
              {currentApp.features.map((feature) => {
                const isSelected = feature.id === selectedFeatureId;

                return (
                  <div key={feature.id} className="relative">
                    <button
                      onClick={() => {
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
                      className="w-full text-left p-3 rounded-md mb-2 transition-all duration-200 hover:bg-blue-50/50"
                      style={{
                        backgroundColor: "transparent",
                        color: "#8E8E93",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#007AFF";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#8E8E93";
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Business opportunity coin icon */}
                        <div className="flex-shrink-0 w-4 h-4">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                          >
                            <circle
                              cx="8"
                              cy="8"
                              r="6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1"
                            />
                            <path d="M4 6h8v4H4V6zm2 1v2h4V7H6z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-normal text-sm truncate leading-relaxed"
                            style={{
                              fontFamily:
                                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {feature.name}
                          </div>
                        </div>
                      </div>
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
              className="h-full bg-muted/30 overflow-y-auto relative leading-[0rem] px-0.5 pt-0"
              style={{
                height: `calc(100vh - ${
                  inputBarHeight + INPUT_BAR_BOTTOM_OFFSET
                }px)`,
                width: "calc(100% - 20px)",
              }}
            >
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
                              正在分析数据...
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
                      <p className="text-sm">点击左侧感兴趣的问题查看答案</p>
                    </div>
                  </div>
                )}
              </div>

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
  );
}
