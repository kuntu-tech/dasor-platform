"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

  const [isPreviewUpdating, setIsPreviewUpdating] = useState(false);
  const inputBarRef = useRef<HTMLDivElement | null>(null);
  const [inputBarHeight, setInputBarHeight] = useState<number>(140);
  const INPUT_BAR_BOTTOM_OFFSET = 8; // tailwind bottom-2 => 8px

  const [currentApp, setCurrentApp] = useState<App | null>(null);
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>("");
  const [contextMenuFeatureId, setContextMenuFeatureId] = useState<
    string | null
  >(null);
  const [featureDesigns, setFeatureDesigns] = useState<
    Record<string, PreviewDesign>
  >({});
  const rightPanelRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [rightPanelLeft, setRightPanelLeft] = useState<number>(256);
  const [panelLayout, setPanelLayout] = useState<number[] | null>(null);
  const [previewMcpParam, setPreviewMcpParam] = useState<string | null>(null);

  // Save dialog states
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveFormData, setSaveFormData] = useState({
    name: "",
    description: "",
  });

  // Predefined question texts for each feature
  const getQuestionText = (featureName: string) => {
    const questionMap: Record<string, string> = {
      "Product Catalog and Inventory Display": "Please show the product catalog and inventory status",
      "User Feedback Collection and Analysis": "Please analyze user feedback data",
      "A/B Testing Results Analysis": "Please show A/B testing results analysis",
      "Target User Segmentation": "Please perform target user segmentation analysis",
      "User Journey Visualization": "Please show user journey visualization",
      "User Churn Early Warning System": "Please analyze user churn early warning",
      "Feature Usage Statistics": "Please show feature usage statistics",
      "Competitor Feature Comparison Analysis": "Please perform competitor feature comparison analysis",
      "Product Roadmap Priority Ranking": "Please show product roadmap priority ranking",
      "New Feature Adoption Rate Prediction": "Please predict new feature adoption rate",
    };
    return questionMap[featureName] || `Please provide information about ${featureName}`;
  };

  // 向iframe发送消息的函数
  const sendMessageToIframe = (message: string) => {
    if (iframeRef.current?.contentWindow) {
      try {
        // 使用MCP Chat Embed API发送消息
        iframeRef.current.contentWindow.postMessage(
          {
            type: "mcp-chat:setInput",
            text: message,
            focus: true,
          },
          "*"
        );
      } catch (error) {
        console.log("Failed to send message to iframe:", error);
      }
    }
  };

  // 简化：不再需要处理 currentApp.features，只使用 selectedProblems
  useEffect(() => {
    const stored = localStorage.getItem("currentApp");
    if (stored) {
      try {
        const app = JSON.parse(stored);
        setCurrentApp(app);
        // 不再处理 features，因为现在使用 selectedProblems
      } catch (e) {
        console.log("Failed to parse current app", e);
      }
    }
  }, [appId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedMcp = localStorage.getItem("currentAppUrl");
    if (storedMcp) {
      setPreviewMcpParam((prev) => prev ?? storedMcp);
    }
  }, []);

  const resolveMcpParam = useCallback((value: any): string | null => {
    if (!value) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        const candidate = resolveMcpParam(entry);
        if (candidate) return candidate;
      }
      return null;
    }
    if (typeof value === "object") {
      if (typeof value.mcp === "string" && value.mcp.trim()) {
        return value.mcp.trim();
      }
      if (typeof value.domain === "string" && value.domain.trim()) {
        return value.domain.trim();
      }
      if (typeof value.serviceId === "string" && value.serviceId.trim()) {
        return value.serviceId.trim();
      }
      if (typeof value.id === "string" && value.id.trim()) {
        return value.id.trim();
      }
      if (Array.isArray(value.ids)) {
        const candidate = resolveMcpParam(value.ids);
        if (candidate) return candidate;
      }
      if (Array.isArray(value.domains)) {
        const candidate = resolveMcpParam(value.domains);
        if (candidate) return candidate;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    if (!appId) return;
    let cancelled = false;
    const controller = new AbortController();

    const fetchAppDetail = async () => {
      try {
        const response = await fetch(`/api/apps/${appId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || `HTTP ${response.status}`);
        }
        if (cancelled) return;

        const record = payload?.data;
        if (record) {
          setCurrentApp((prev) => prev ?? (record as App));
          let nextMcp = resolveMcpParam(record.mcp_server_ids);

          if (!nextMcp && Array.isArray(record.generator_servers)) {
            const preferred =
              record.generator_servers.find(
                (server: any) => server?.status === "running"
              ) || record.generator_servers[0];
            nextMcp = resolveMcpParam(preferred);
          }

          if (!nextMcp && typeof window !== "undefined") {
            nextMcp = localStorage.getItem("currentAppUrl");
          }

          if (nextMcp) {
            setPreviewMcpParam(nextMcp);
            if (typeof window !== "undefined" && nextMcp.startsWith("http")) {
              localStorage.setItem("currentAppUrl", nextMcp);
            }
          }
        }
      } catch (error) {
        if (cancelled || (error as Error).name === "AbortError") {
          return;
        }
        console.warn("Failed to load app detail:", error);
      }
    };

    fetchAppDetail();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [appId, resolveMcpParam]);

  // 从 localStorage 读取 selectedProblems
  useEffect(() => {
    const stored = localStorage.getItem("selectedProblems");
    console.log("localStorage selectedProblems:", stored);
    if (stored) {
      try {
        const problems = JSON.parse(stored);
        console.log("Parsed selectedProblems:", problems);
        setSelectedProblems(problems);
        // if (problems.length > 0) {
        //   setSelectedFeatureId(problems[0]);
        // }
      } catch (e) {
        console.log("Failed to parse selectedProblems", e);
      }
    } else {
      console.log("No selectedProblems found in localStorage");
    }
  }, []);

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

  const handleDeleteFeature = (featureId: string) => {
    if (selectedProblems.length <= 1) {
      alert("Application must retain at least one question");
      return;
    }

    const updatedProblems = selectedProblems.filter((p) => p !== featureId);

    setSelectedProblems(updatedProblems);
    localStorage.setItem("selectedProblems", JSON.stringify(updatedProblems));

    if (selectedFeatureId === featureId) {
      setSelectedFeatureId(updatedProblems[0] || "");
    }
  };

  const selectedFeature = selectedProblems.find((p) => p === selectedFeatureId);

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
    const publishUrl = appId ? `/publish?id=${appId}` : "/publish";
    router.push(publishUrl);
  };

  const iframeSrc = (() => {
    const baseUrl = "https://app-preview.datail.ai/?embed=1";
    if (previewMcpParam) {
      return `${baseUrl}&mcp=${encodeURIComponent(previewMcpParam)}`;
    }
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("currentAppUrl");
      if (stored) {
        return `${baseUrl}&mcp=${encodeURIComponent(stored)}`;
      }
    }
    return baseUrl;
  })();

  const renderPreview = () => {
    if (isPreviewUpdating) {
      return (
        <Card className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="size-8 animate-spin mx-auto mb-4 text-primary border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-muted-foreground">Updating preview...</p>
          </div>
        </Card>
      );
    }

    const currentDesign = "product-list"; // 简化设计，因为现在只有问题文本

    if (currentDesign === "product-list") {
      return (
        <Card className="p-6 px-7">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              {selectedFeature || "Feature Preview"}
            </h1>
            <Badge variant="outline">{"Question"}</Badge>
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
                {selectedFeature || "Feature Preview"}
              </h1>
              <Badge variant="outline" className="ml-4">
                {"Question"}
              </Badge>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-8">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Data Analysis Insights
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Based on your data, we have discovered important business trends and growth opportunities. Through intelligent analysis, we provide actionable insights to help you make better decisions.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-800">+23%</div>
                  <div className="text-sm text-green-600">Monthly Growth</div>
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
              {selectedFeature || "Feature Preview"}
            </h1>
            <Badge variant="outline">{"Question"}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* 饼状图区域 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Data Distribution Analysis</h3>
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
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 图例和数据 */}
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
                  <strong>Key Insight:</strong>{" "}
                  Product A holds the largest market share. It is recommended to focus on its growth strategy.
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
            {selectedFeature || "Feature Preview"}
          </h1>
          <Badge variant="outline">{"Question"}</Badge>
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
        <div className="size-8 animate-spin text-primary border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex bg-white">
      <div className="shape-1"></div>
      <div className="shape-2"></div>
      <div
        className="h-screen flex flex-col bg-background overflow-hidden w-full"
        style={{
          height: "92vh",
          overflow: "hidden",
          position: "fixed",
          top: "80px",
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
        }}
      >
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
                    Valued questions ({selectedProblems.length})
                  </span>
                </div>
              </div>
              <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                {/* 调试信息 */}
                {selectedProblems.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    <p>No questions found in localStorage</p>
                    <p className="text-sm">Check console for debug info</p>
                  </div>
                )}
                {selectedProblems.map((problem, index) => {
                  const isSelected = problem === selectedFeatureId;

                  return (
                    <div key={`${problem}-${index}`} className="relative">
                      <button
                        onClick={() => {
                          setSelectedFeatureId(problem);
                          // 发送问题文本到iframe
                          sendMessageToIframe(problem);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenuFeatureId(problem);
                        }}
                        className={`nav-link flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 w-full text-left ${
                          isSelected
                            ? "active bg-white/90 text-gray-900 shadow-md"
                            : "text-gray-600 hover:bg-white/50"
                        }`}
                      >
                        <Eye className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {problem}
                        </span>
                      </button>

                    <Popover
                      open={contextMenuFeatureId === problem}
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
                            // 从 selectedProblems 中移除这个问题
                            const updatedProblems = selectedProblems.filter(
                              (p) => p !== problem
                            );
                            setSelectedProblems(updatedProblems);
                            localStorage.setItem(
                              "selectedProblems",
                              JSON.stringify(updatedProblems)
                            );
                            setContextMenuFeatureId(null);

                            // 如果删除的是当前选中的问题，选择下一个
                            if (problem === selectedFeatureId) {
                              setSelectedFeatureId(updatedProblems[0] || "");
                            }
                          }}
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete Question
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </div>
                );
              })}
              </nav>
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
              className="h-full bg-muted/30 overflow-hidden relative"
              style={{
                width: "calc(100% - 20px)",
              }}
            >
              <iframe
                ref={iframeRef}
                src={iframeSrc}
                // "https://app-preview.datail.ai/?embed=1&mcp=https://temple-unstrenuous-milena.ngrok-free.dev/mcp"
                // src="http://192.168.30.153:5174/?embed=1&mcp=https://temple-unstrenuous-milena.ngrok-free.dev/mcp"
                className="w-full h-full border-0"
                title="Embedded Chat Interface"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                loading="lazy"
              />
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
