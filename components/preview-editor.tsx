"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Sparkles,
  Send,
  Loader2,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  Trash2,
} from "lucide-react"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

type PreviewDesign = "product-list" | "metrics-dashboard" | "simple-text" | "pie-chart"

type Feature = {
  id: string
  name: string
  userProfile: string
  templateType: string
  templateName: string
}

type App = {
  id: string
  name: string
  features: Feature[]
  status: string
  createdAt: string
  featureCount: number
}

export function PreviewEditor() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const appId = searchParams.get("id")

  const [searchMessage, setSearchMessage] = useState("")
  const [isSearchProcessing, setIsSearchProcessing] = useState(false)
  const [isPreviewUpdating, setIsPreviewUpdating] = useState(false)
  const inputBarRef = useRef<HTMLDivElement | null>(null)
  const [inputBarHeight, setInputBarHeight] = useState<number>(140)
  const INPUT_BAR_BOTTOM_OFFSET = 8 // tailwind bottom-2 => 8px

  const [currentApp, setCurrentApp] = useState<App | null>(null)
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>("")
  const [contextMenuFeatureId, setContextMenuFeatureId] = useState<string | null>(null)
  const [featureDesigns, setFeatureDesigns] = useState<Record<string, PreviewDesign>>({})
  const rightPanelRef = useRef<HTMLDivElement | null>(null)
  const [rightPanelLeft, setRightPanelLeft] = useState<number>(256)
  const [panelLayout, setPanelLayout] = useState<number[] | null>(null)

  const [searchHistory, setSearchHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])

  useEffect(() => {
    const stored = localStorage.getItem("currentApp")
    if (stored) {
      try {
        const app = JSON.parse(stored)
        setCurrentApp(app)
        if (app.features && app.features.length > 0) {
          setSelectedFeatureId(app.features[0].id)
          
          // 为每个功能分配预览设计
          const designs: PreviewDesign[] = ["product-list", "metrics-dashboard", "simple-text", "pie-chart"]
          const newFeatureDesigns: Record<string, PreviewDesign> = {}
          
          app.features.forEach((feature: Feature) => {
            // 为特定功能分配指定样式
            if (feature.name.includes("Product Recommendation")) {
              newFeatureDesigns[feature.id] = "pie-chart"
            } else if (feature.name.includes("Promotional Campaign Effectiveness")) {
              newFeatureDesigns[feature.id] = "metrics-dashboard"
            } else if (feature.name.includes("Price Competitiveness")) {
              newFeatureDesigns[feature.id] = "simple-text"
            } else {
              // 其他功能随机分配
              const randomDesign = designs[Math.floor(Math.random() * designs.length)]
              newFeatureDesigns[feature.id] = randomDesign
            }
          })
          
          setFeatureDesigns(newFeatureDesigns)
        }
      } catch (e) {
        console.error("Failed to parse current app", e)
      }
    }
  }, [appId])

  useEffect(() => {
    const measure = () => {
      if (inputBarRef.current) {
        // offsetHeight already includes padding and border
        setInputBarHeight(inputBarRef.current.offsetHeight)
      }
      if (rightPanelRef.current) {
        const rect = rightPanelRef.current.getBoundingClientRect()
        setRightPanelLeft(rect.left)
      }
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  const handleSearchMessage = () => {
    if (!searchMessage.trim()) return

    const userMessage = searchMessage.trim()
    setSearchMessage("") // Clear input immediately
    setIsSearchProcessing(true)
    setIsPreviewUpdating(true)

    // Add user message to search history (for middle preview area)
    setSearchHistory((prev) => [...prev, { role: "user", content: userMessage }])

    setTimeout(() => {
      // Add assistant response to search history (for middle preview area)
      setSearchHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Good, I have updated the application's style and content. You can see the latest preview effects in the middle. Do you need any other adjustments?",
        },
      ])
      setIsSearchProcessing(false)
      setIsPreviewUpdating(false)
    }, 1500)
  }


  const handleDeleteFeature = (featureId: string) => {
    if (!currentApp) return

    if (currentApp.features.length <= 1) {
      alert("Application must retain at least one feature")
      return
    }

    const updatedFeatures = currentApp.features.filter((f) => f.id !== featureId)
    const updatedApp = {
      ...currentApp,
      features: updatedFeatures,
      featureCount: updatedFeatures.length,
    }

    setCurrentApp(updatedApp)
    localStorage.setItem("currentApp", JSON.stringify(updatedApp))

    if (selectedFeatureId === featureId) {
      setSelectedFeatureId(updatedFeatures[0].id)
    }
  }

  const selectedFeature = currentApp?.features.find((f) => f.id === selectedFeatureId)

  const renderPreview = () => {
    if (isPreviewUpdating) {
      return (
        <Card className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="size-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Updating preview...</p>
          </div>
        </Card>
      )
    }

    const selectedFeature = currentApp?.features.find(f => f.id === selectedFeatureId)
    const currentDesign = selectedFeature ? featureDesigns[selectedFeature.id] : "product-list"
    
    if (currentDesign === "product-list") {
      return (
        <Card className="p-6 px-7">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{selectedFeature?.name || "Feature Preview"}</h1>
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
              <label className="text-sm font-medium mb-2 block">Price Range</label>
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
              <div key={i} className="border border-border rounded-lg p-4 flex gap-4">
                <div className="size-20 bg-muted rounded-md shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Product Name {i}</h3>
                  <p className="text-sm text-muted-foreground mb-2">This is a brief description of the product</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">¥{99 * i}</span>
                    <Button size="sm">View Details</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )
    }

    if (currentDesign === "simple-text") {
      return (
        <Card className="p-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center mb-6">
              <h1 className="text-3xl font-bold">{selectedFeature?.name || "Feature Preview"}</h1>
              <Badge variant="outline" className="ml-4">{selectedFeature?.templateName}</Badge>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-8">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">数据分析洞察</h2>
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
      )
    }

    if (currentDesign === "pie-chart") {
      return (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{selectedFeature?.name || "Feature Preview"}</h1>
            <Badge variant="outline">{selectedFeature?.templateName}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* 饼状图区域 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">数据分布分析</h3>
              <div className="relative w-64 h-64 mx-auto">
                {/* 模拟饼状图 */}
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 rounded-full border-8 border-blue-500" style={{clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)'}}></div>
                  <div className="absolute inset-0 rounded-full border-8 border-green-500" style={{clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)'}}></div>
                  <div className="absolute inset-0 rounded-full border-8 border-yellow-500" style={{clipPath: 'polygon(50% 50%, 50% 100%, 0% 100%, 0% 50%)'}}></div>
                  <div className="absolute inset-0 rounded-full border-8 border-red-500" style={{clipPath: 'polygon(50% 50%, 0% 50%, 0% 0%, 50% 0%)'}}></div>
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
                  { label: "产品A", value: 35, color: "bg-blue-500", percentage: "35%" },
                  { label: "产品B", value: 28, color: "bg-green-500", percentage: "28%" },
                  { label: "产品C", value: 22, color: "bg-yellow-500", percentage: "22%" },
                  { label: "产品D", value: 15, color: "bg-red-500", percentage: "15%" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{item.value} 项</span>
                      <span className="font-semibold">{item.percentage}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>关键洞察：</strong> 产品A占据最大市场份额，建议重点关注其增长策略。
                </div>
              </div>
            </div>
          </div>
        </Card>
      )
    }

    return (
      <Card className="p-6 px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{selectedFeature?.name || "Feature Preview"}</h1>
          <Badge variant="outline">{selectedFeature?.templateName}</Badge>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Sales</span>
              <DollarSign className="size-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900">¥128,450</div>
            <div className="text-xs text-green-600 mt-1">↑ 12.5% vs last month</div>
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Order Count</span>
              <ShoppingCart className="size-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-900">1,234</div>
            <div className="text-xs text-green-600 mt-1">↑ 8.3% vs last month</div>
          </Card>

          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Active Users</span>
              <Users className="size-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900">8,567</div>
            <div className="text-xs text-green-600 mt-1">↑ 15.2% vs last month</div>
          </Card>

          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
              <TrendingUp className="size-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-900">3.8%</div>
            <div className="text-xs text-red-600 mt-1">↓ 0.5% vs last month</div>
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
              { name: "Wireless Bluetooth Headphones", sales: 456, revenue: "$456.00" },
              { name: "Smart Watch", sales: 389, revenue: "$389.00" },
              { name: "Portable Power Bank", sales: 312, revenue: "$312.00" },
              { name: "Phone Case", sales: 278, revenue: "$278.00" },
              { name: "Cable Set", sales: 234, revenue: "$234.00" },
            ].map((product, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-muted-foreground">#{i + 1}</span>
                  <span className="font-medium">{product.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-muted-foreground">{product.sales} units</span>
                  <span className="font-semibold">{product.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Card>
    )
  }

  if (!currentApp) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={(sizes) => {
            setPanelLayout(sizes)
            try { localStorage.setItem("previewSplitLayout", JSON.stringify(sizes)) } catch {}
            if (rightPanelRef.current) {
              const rect = rightPanelRef.current.getBoundingClientRect()
              setRightPanelLeft(rect.left)
            }
          }}
          className="w-full h-full"
        >
        <ResizablePanel defaultSize={(panelLayout && panelLayout[0]) || 24} minSize={16} maxSize={40} className="flex flex-col bg-muted/30">
          <div className="px-4 py-2">
            <h2 className="font-semibold text-2xl text-muted-foreground mb-1">Commercial questions</h2>
          </div>
          <div className="flex-1 overflow-y-auto pt-0 px-2 pb-2">
            {currentApp.features.map((feature) => {
              const isSelected = feature.id === selectedFeatureId

              return (
                <div key={feature.id} className="relative">
                  <button
                    onClick={() => setSelectedFeatureId(feature.id)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setContextMenuFeatureId(feature.id)
                    }}
                    className={`w-full text-left p-4 rounded-lg mb-3 transition-colors ${
                      isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{feature.name}</div>
                      </div>
                    </div>
                  </button>
                  
                  <Popover open={contextMenuFeatureId === feature.id} onOpenChange={(open) => !open && setContextMenuFeatureId(null)}>
                    <PopoverTrigger asChild>
                      <div className="absolute inset-0 pointer-events-none" />
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" side="right" align="start">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          handleDeleteFeature(feature.id)
                          setContextMenuFeatureId(null)
                        }}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete Feature
                      </Button>
                    </PopoverContent>
                  </Popover>
                </div>
              )
            })}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-transparent after:bg-transparent hover:after:bg-transparent focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 opacity-0" />
        <ResizablePanel defaultSize={(panelLayout && panelLayout[1]) || 76} minSize={40} className="relative">
        <div
          ref={rightPanelRef}
          className="h-full bg-muted/30 overflow-y-auto relative leading-[0rem] px-0.5 pt-0"
          style={{ height: `calc(100vh - ${inputBarHeight + INPUT_BAR_BOTTOM_OFFSET}px)`, width: "calc(100% - 20px)" }}
        >
          {/* Right-pane toolbar: Preview / Save / Publish */}
          <div className="sticky top-0 z-40 bg-muted/30 py-2">
            <div className="max-w-4xl mx-auto px-2">
              <div className="flex items-center justify-between">
                {/* Left: Preview */}
                <div className="inline-flex items-center gap-2 rounded-lg bg-transparent p-1">
                  <Button size="sm" variant="ghost" className="h-8 px-3 border-2 border-blue-500 bg-transparent text-blue-600">Preview</Button>
                </div>
                {/* Right: Save / Publish */}
                <div className="inline-flex items-center gap-2 rounded-lg bg-transparent p-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3 border-0"
                    onClick={() => router.push("/save-success")}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 px-3 border-0"
                    onClick={() => router.push("/publish")}
                  >
                    Publish
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div
            className="max-w-4xl mx-auto"
            style={{ paddingBottom: inputBarHeight + INPUT_BAR_BOTTOM_OFFSET + 16 }}
          >
            {searchHistory.length > 0 && (
              <div className="mb-6 space-y-3">
                {searchHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-lg p-3 leading-[0em] border-none ${
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-background border shadow-sm"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isSearchProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-background border shadow-sm rounded-lg p-3">
                      <Loader2 className="size-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="relative pb-12">
              {renderPreview()}
              <div className="absolute bottom-2 left-2 flex items-center gap-2">
                <button
                  aria-label="Like preview"
                  className="size-9 rounded-full border border-border bg-background shadow hover:bg-muted flex items-center justify-center"
                >
                  <ThumbsUp className="size-4" />
                </button>
                <button
                  aria-label="Dislike preview"
                  className="size-9 rounded-full border border-border bg-background shadow hover:bg-muted flex items-center justify-center"
                >
                  <ThumbsDown className="size-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="fixed bottom-2 right-0 px-8 z-50" ref={inputBarRef} style={{ left: `${rightPanelLeft}px` }}>
            <div className="max-w-4xl mx-auto">
              <div className="bg-background border-border rounded-3xl shadow-lg p-4 py-4 border-2">
                <input
                  type="text"
                  placeholder="Search webpage"
                  value={searchMessage}
                  onChange={(e) => setSearchMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSearchMessage()
                    }
                  }}
                  disabled={isSearchProcessing}
                  className="w-full bg-transparent border-none outline-none text-lg mb-3 px-2"
                />
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <button className="hover:bg-muted rounded-full p-1">
                      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 rounded-full px-3 py-1">
                      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <p className="text-center text-xs text-muted-foreground mt-3">ChatGPT may make mistakes. Please verify important information.</p>
            </div>
          </div>
        </div>
        </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
