"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Sparkles, 
  Database, 
  CheckCircle2, 
  ArrowRight, 
  Plus,
  ReAnalyseCw,
  Trash2,
  Settings,
  Users,
  TrendingUp,
  Target
} from "lucide-react"

type ConnectedDataSource = {
  id: string
  name: string
  type: string
  status: "connected" | "disconnected" | "error"
  lastConnected: string
  userProfiles: string[]
  problemsCount: number
  marketValue: string
}

export default function ConnectedListPage() {
  const router = useRouter()
  const [connectedSources, setConnectedSources] = useState<ConnectedDataSource[]>([])
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 模拟加载已连接的数据源
    const mockConnectedSources: ConnectedDataSource[] = [
      {
        id: "source-1",
        name: "E-commerce Database",
        type: "PostgreSQL",
        status: "connected",
        lastConnected: "2025-01-15 14:30",
        userProfiles: ["E-commerce Platform Operators", "Product Managers"],
        problemsCount: 25,
        marketValue: "High Value - Multiple revenue streams"
      },
      {
        id: "source-2", 
        name: "Customer Analytics DB",
        type: "MySQL",
        status: "connected",
        lastConnected: "2025-01-15 12:15",
        userProfiles: ["Marketing Managers", "Data Analysts"],
        problemsCount: 18,
        marketValue: "Medium Value - Customer insights"
      },
      {
        id: "source-3",
        name: "Sales Performance Data",
        type: "MongoDB", 
        status: "connected",
        lastConnected: "2025-01-14 16:45",
        userProfiles: ["Sales Managers", "Business Analysts"],
        problemsCount: 12,
        marketValue: "High Value - Sales optimization"
      }
    ]
    
    setTimeout(() => {
      setConnectedSources(mockConnectedSources)
      setIsLoading(false)
    }, 1000)
  }, [])

  const handleSelectSource = (sourceId: string) => {
    setSelectedSources(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sourceId)) {
        newSet.delete(sourceId)
      } else {
        newSet.add(sourceId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedSources.size === connectedSources.length) {
      setSelectedSources(new Set())
    } else {
      setSelectedSources(new Set(connectedSources.map(source => source.id)))
    }
  }

  const handleGenerateFromSelected = () => {
    if (selectedSources.size > 0) {
      // 将选中的数据源信息存储到localStorage，供生成流程使用
      const selectedData = connectedSources.filter(source => selectedSources.has(source.id))
      localStorage.setItem("selectedConnectedSources", JSON.stringify(selectedData))
      router.push("/generate")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "disconnected":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <ReAnalyseCw className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading connected data sources...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold"> Datail</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Plus className="mr-2 size-4" />
              Add Data Source
            </Button>
            <Button size="sm" onClick={() => router.push("/connect")}>
              <Database className="mr-2 size-4" />
              Connect New
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Connected Data Sources</h1>
          <p className="text-lg text-muted-foreground">
            Manage your connected databases and generate Applicationpp
s from existing data sources
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Database className="size-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Sources</p>
                  <p className="text-2xl font-bold">{connectedSources.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Connected</p>
                  <p className="text-2xl font-bold">{connectedSources.filter(s => s.status === 'connected').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="size-8 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Problems</p>
                  <p className="text-2xl font-bold">{connectedSources.reduce((sum, s) => sum + s.problemsCount, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="size-8 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">User Profiles</p>
                  <p className="text-2xl font-bold">
                    {new Set(connectedSources.flatMap(s => s.userProfiles)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={selectedSources.size === connectedSources.length && connectedSources.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedSources.size > 0 ? `${selectedSources.size} selected` : 'Select all'}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedSources.size > 0 && (
              <Badge variant="secondary" className="px-3 py-1">
                {selectedSources.size} sources selected
              </Badge>
            )}
            <Button 
              onClick={handleGenerateFromSelected} 
              disabled={selectedSources.size === 0}
            >
              <Sparkles className="mr-2 size-4" />
              Generate App from Selected
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>

        {/* Connected Sources List */}
        <div className="space-y-4">
          {connectedSources.map((source) => (
            <Card key={source.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedSources.has(source.id)}
                    onCheckedChange={() => handleSelectSource(source.id)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {source.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{source.type}</Badge>
                          <Badge className={getStatusColor(source.status)}>
                            {source.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Last connected: {source.lastConnected}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Settings className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">User Profiles</p>
                        <div className="flex flex-wrap gap-1">
                          {source.userProfiles.map((profile, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {profile}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Available Problems</p>
                        <p className="text-lg font-semibold text-foreground">
                          {source.problemsCount} problems
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Market Value</p>
                        <p className="text-sm text-foreground">{source.marketValue}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {connectedSources.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Database className="size-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No Connected Data Sources</CardTitle>
              <CardDescription className="text-center max-w-md mb-6">
                Connect your first database to start generating Applicationpp
s with AI
              </CardDescription>
              <Button onClick={() => router.push("/connect")}>
                <Database className="mr-2 size-4" />
                Connect Your First Database
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
