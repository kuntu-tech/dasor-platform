"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react"

type SelectedProblem = {
  id: string
  userProfile: string
  problem: string
  marketValue: string
  implementationMethod: string
  implementationDifficulty: number
}

const templates = [
  { id: "query", name: "Information Display" },
  { id: "carousel", name: "Carousel" },
  { id: "metrics", name: "Dashboard" },
  { id: "list-filter", name: "List" },
]

export function GenerateFlow() {
  const router = useRouter()
  const [selectedProblems, setSelectedProblems] = useState<SelectedProblem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState<string>("")
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem("selectedProblems")
    if (stored) {
      try {
        const problems = JSON.parse(stored)
        setSelectedProblems(problems)
        // Auto-start generation process
        startGeneration(problems)
      } catch (e) {
        console.error("Failed to parse selected problems", e)
      }
    }
  }, [])

  const startGeneration = (problems: SelectedProblem[]) => {
    setIsGenerating(true)
    
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
      "Marketing ROI": "metrics"
    }

    // Generate steps for the generation process
    const steps = [
      "Initializing AI models...",
      "Analyzing selected features...",
      "Generating GPTApp architecture...",
      "Creating user interface components...",
      "Implementing data integration...",
      "Optimizing performance...",
      "Finalizing GPTApp..."
    ]

    let currentStep = 0
    setGenerationStep(steps[0])
    
    const stepInterval = setInterval(() => {
      currentStep++
      if (currentStep < steps.length) {
        setGenerationStep(steps[currentStep])
        setCurrentStepIndex(currentStep)
      } else {
        clearInterval(stepInterval)
        // Complete generation
        const features = problems.map((problem, index) => {
          const templateId = defaultTemplateMapping[problem.problem] || "query"
          return {
            id: `feature-${index + 1}`,
            name: problem.problem,
            userProfile: problem.userProfile,
            marketValue: problem.marketValue,
            templateType: templateId,
            templateName: templates.find((t) => t.id === templateId)?.name || "Information Display",
            implementationMethod: problem.implementationMethod,
            implementationDifficulty: problem.implementationDifficulty,
          }
        })

        const app = {
          id: `app-${Date.now()}`,
          name: "MY First APP Hello GPT1",
          features: features,
          status: "draft",
          createdAt: new Date().toISOString().split("T")[0],
          featureCount: features.length,
        }

        localStorage.setItem("currentApp", JSON.stringify(app))
        router.push(`/preview?id=${app.id}`)
      }
    }, 1500) // Each step takes 1.5 seconds
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation removed on generate page */}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold mb-2">Generating Your Applicationpp
</h1>
          <p className="text-muted-foreground">
            AI is creating your Applicationpp
 with {selectedProblems.length} selected features
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="size-12 text-primary animate-spin mb-6" />
            
            <CardTitle className="mb-4 text-xl">Generating Applicationpp
</CardTitle>
            
            <div className="w-full max-w-md space-y-4">
              {/* Current Step */}
              <div className="text-center">
                <p className="text-lg font-medium text-primary mb-2">{generationStep}</p>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStepIndex + 1) / 7) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Step {currentStepIndex + 1} of 7
                </p>
              </div>

              {/* Selected Features Preview */}
              <div className="mt-8">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Selected Features:</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedProblems.map((problem, index) => (
                    <div key={problem.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                      <span className="truncate">{problem.problem}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <CardDescription className="text-center max-w-md mt-6">
              This process typically takes 10-15 seconds. Please wait while we generate your Applicationpp
...
            </CardDescription>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}