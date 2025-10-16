"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, CheckCircle2, ArrowRight, Home } from "lucide-react"

export default function SaveSuccessPage() {
  const router = useRouter()

  const handleGenerateMore = () => {
    router.push("/connect?results=1")
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="size-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="size-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Save Successful!
          </h1>
          <p className="text-lg text-muted-foreground">
            Your Applicationpp
 has been saved successfully. You can now generate more apps or return to the homepage.
          </p>
        </div>

       
            <Button 
              onClick={handleGenerateMore}
              className="w-full h-14 text-base"
              size="lg"
            >
              <Sparkles className="mr-2 size-5" />
              Continue generate 
              <ArrowRight className="ml-2 size-4" />
            </Button>

            <Button 
              onClick={handleGoHome}
              variant="outline"
              className="w-full h-14 text-base"
              size="lg"
            >
              <Home className="mr-2 size-5" />
              Homepage
            </Button>
       

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Your saved Applicationpp
 is available in your dashboard for future editing and publishing.
          </p>
        </div>
      </main>
    </div>
  )
}
