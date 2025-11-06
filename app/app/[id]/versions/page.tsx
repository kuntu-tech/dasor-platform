"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Copy, ExternalLink, Calendar, Tag, Globe, FileText, Users, DollarSign } from "lucide-react"

// Mock data for app versions
const mockVersions = [
  {
    id: "v1.2.0",
    version: "1.2.0",
    releaseDate: "2025-01-15",
    status: "Published",
    url: "https://chatgpt.com/g/g-abc123def456",
    name: "E-commerce Operations Assistant Pro",
    description: "Advanced e-commerce analytics with AI-powered insights, revenue forecasting, and comprehensive customer segmentation tools",
    features: [
      "AI-powered revenue forecasting",
      "Advanced customer segmentation",
      "Real-time sales performance tracking",
      "Inventory optimization recommendations",
      "Predictive analytics dashboard"
    ],
    paidUsers: 1247,
    totalRevenue: 15680
  },
  {
    id: "v1.1.0",
    version: "1.1.0",
    releaseDate: "2025-01-10",
    status: "Published",
    url: "https://chatgpt.com/g/g-abc123def456",
    name: "E-commerce Operations Assistant Plus",
    description: "Enhanced e-commerce management with customer segmentation, improved analytics, and better user experience",
    features: [
      "Customer segmentation analysis",
      "Enhanced sales performance tracking",
      "Improved inventory management",
      "User behavior analytics",
      "Modern UI components"
    ],
    paidUsers: 892,
    totalRevenue: 10704
  },
  {
    id: "v1.0.0",
    version: "1.0.0",
    releaseDate: "2025-01-05",
    status: "Published",
    url: "https://chatgpt.com/g/g-abc123def456",
    name: "E-commerce Operations Assistant",
    description: "Basic e-commerce operations tool with core functionality for sales tracking and inventory management",
    features: [
      "Basic sales performance tracking",
      "Inventory management queries",
      "User behavior analysis dashboard",
      "Simple reporting tools"
    ],
    paidUsers: 456,
    totalRevenue: 5472
  }
]

export default function AppVersionsPage({ params }: { params: { id: string } }) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const handleCopy = async (text: string, itemType: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(itemType)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.log('Failed to copy text: ', err)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 max-w-4xl">


        {/* Versions List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Version History</h2>
          
          {mockVersions.map((version, index) => (
            <Card key={version.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Tag className="size-3" />
                      v{version.version}
                    </Badge>
                    <Badge variant={version.status === "Published" ? "default" : "secondary"}>
                      {version.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="size-4" />
                    {version.releaseDate}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Revenue Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-blue-500 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="size-4 text-muted-foreground" />
                      <label className="text-sm font-medium text-muted-foreground">付费人数</label>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{version.paidUsers.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">Active Subscribers</div>
                  </div>
                  
                  <div className="border border-blue-500 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="size-4 text-muted-foreground" />
                      <label className="text-sm font-medium text-muted-foreground">总收入额</label>
                    </div>
                    <div className="text-2xl font-bold text-foreground">¥{version.totalRevenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">Total Revenue</div>
                  </div>
                </div>

                <Separator />

                {/* App Name */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="size-4" />
                    App Name
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-medium">{version.name}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(version.name, `name-${version.id}`)}
                    >
                      <Copy className="size-3" />
                      {copiedItem === `name-${version.id}` ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <div className="flex items-start gap-2 mt-1">
                    <p className="text-sm text-muted-foreground flex-1">{version.description}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(version.description, `description-${version.id}`)}
                    >
                      <Copy className="size-3" />
                      {copiedItem === `description-${version.id}` ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {/* URL */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Globe className="size-4" />
                    URL
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1 font-mono">
                      {version.url}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(version.url, `url-${version.id}`)}
                    >
                      <Copy className="size-3" />
                      {copiedItem === `url-${version.id}` ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={version.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3" />
                      </a>
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Features */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Features</h4>
                  <ul className="space-y-1">
                    {version.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
     
      </div>
    </div>
  )
}
