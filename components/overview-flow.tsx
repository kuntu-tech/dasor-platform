"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Eye, Settings, Rocket, Trash2, Clock, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type GeneratedApp = {
  id: string
  name: string
  userProfile: string
  problem: string
  templateType: string
  templateName: string
  status: "draft" | "published"
  createdAt: string
  thumbnail: string
}

export function OverviewFlow() {
  const router = useRouter()
  const [generatedApps, setGeneratedApps] = useState<GeneratedApp[]>([])
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set())
  const [filterProfile, setFilterProfile] = useState<string>("all")
  const [filterTemplate, setFilterTemplate] = useState<string>("all")

  useEffect(() => {
    // Load generated apps from localStorage or generate mock data
    const mockApps: GeneratedApp[] = [
      {
        id: "app-1",
        name: "User Purchase Behavior Analyzer",
        userProfile: "E-commerce Platform Operator",
        problem: "Analyze user purchase behavior and preferences",
        templateType: "metrics",
        templateName: "Dashboard",
        status: "draft",
        createdAt: "2025-10-15",
        thumbnail: "📊",
      },
      {
        id: "app-2",
        name: "Product Recommendation System",
        userProfile: "E-commerce Platform Operator",
        problem: "Recommend products based on user history",
        templateType: "list-filter",
        templateName: "List",
        status: "draft",
        createdAt: "2025-10-15",
        thumbnail: "🛍️",
      },
      {
        id: "app-3",
        name: "User Retention Rate Analysis",
        userProfile: "Product Manager",
        problem: "Analyze user retention and churn reasons",
        templateType: "metrics",
        templateName: "Dashboard",
        status: "draft",
        createdAt: "2025-10-15",
        thumbnail: "📈",
      },
    ]
    setGeneratedApps(mockApps)
  }, [])

  const handleSelectApp = (appId: string) => {
    setSelectedApps((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(appId)) {
        newSet.delete(appId)
      } else {
        newSet.add(appId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedApps.size === filteredApps.length) {
      setSelectedApps(new Set())
    } else {
      setSelectedApps(new Set(filteredApps.map((app) => app.id)))
    }
  }

  const handlePreview = (appId: string) => {
    const app = generatedApps.find(app => app.id === appId)
    const appName = app ? encodeURIComponent(app.name) : ''
    router.push(`/preview?id=${appId}&appName=${appName}`)
  }

  const handlePublishSelected = () => {
    if (selectedApps.size === 0) return
    router.push(`/publish?apps=${Array.from(selectedApps).join(",")}`)
  }

  const handleDeleteApp = (appId: string) => {
    setGeneratedApps((prev) => prev.filter((app) => app.id !== appId))
    setSelectedApps((prev) => {
      const newSet = new Set(prev)
      newSet.delete(appId)
      return newSet
    })
  }

  // Filter apps
  const filteredApps = generatedApps.filter((app) => {
    if (filterProfile !== "all" && app.userProfile !== filterProfile) return false
    if (filterTemplate !== "all" && app.templateType !== filterTemplate) return false
    return true
  })

  const uniqueProfiles = Array.from(new Set(generatedApps.map((app) => app.userProfile)))

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
          <Button onClick={() => router.push("/connect")}>
            <Sparkles className="mr-2 size-4" />
            Create New Applicationpp

          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Applicationpp
s</h1>
          <p className="text-muted-foreground">Manage and publish all your generated Applicationpp
s</p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              <Checkbox
                checked={selectedApps.size === filteredApps.length && filteredApps.length > 0}
                className="mr-2"
              />
              Select All
            </Button>
            <Select value={filterProfile} onValueChange={setFilterProfile}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 size-4" />
                <SelectValue placeholder="Target User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Target Users</SelectItem>
                {uniqueProfiles.map((profile) => (
                  <SelectItem key={profile} value={profile}>
                    {profile}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTemplate} onValueChange={setFilterTemplate}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 size-4" />
                <SelectValue placeholder="Template Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                <SelectItem value="list-filter">List</SelectItem>
                <SelectItem value="metrics">Dashboard</SelectItem>
                <SelectItem value="query">Information Display</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {selectedApps.size > 0 && (
              <Badge variant="secondary" className="px-3 py-1">
                {selectedApps.size} selected
              </Badge>
            )}
            <Button onClick={handlePublishSelected} disabled={selectedApps.size === 0}>
              <Rocket className="mr-2 size-4" />
              Publish Selected Apps
            </Button>
          </div>
        </div>

        {/* Apps Grid */}
        {filteredApps.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Sparkles className="size-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No Generated Applicationpp
s Yet</CardTitle>
              <CardDescription className="text-center max-w-md mb-6">
                Connect your database and let AI help you generate your first Applicationpp

              </CardDescription>
              <Button onClick={() => router.push("/connect")}>
                <Sparkles className="mr-2 size-4" />
                Start Creating
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <Card
                key={app.id}
                className={`relative transition-all ${selectedApps.has(app.id) ? "ring-2 ring-primary" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Checkbox checked={selectedApps.has(app.id)} onCheckedChange={() => handleSelectApp(app.id)} />
                    <Badge variant={app.status === "published" ? "default" : "secondary"}>
                      {app.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg mb-4">
                    <span className="text-6xl">{app.thumbnail}</span>
                  </div>
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                  <CardDescription className="text-sm">{app.problem}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {app.userProfile}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {app.templateName}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    Created on {app.createdAt}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => handlePreview(app.id)}
                    >
                      <Eye className="mr-1 size-3" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => handlePreview(app.id)}
                    >
                      <Settings className="mr-1 size-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 bg-transparent"
                      onClick={() => handleDeleteApp(app.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
