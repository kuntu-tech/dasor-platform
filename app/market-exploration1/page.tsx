"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Loader2, Send } from "lucide-react"

interface MarketSegment {
  id: string
  title: string
  valueAnalysis: string[]
  capabilities: string[]
  isNew?: boolean
  hasNewContent?: boolean
}

const initialMarkets: MarketSegment[] = [
  {
    id: "high-value-customers",
    title: "High-Value Customer Segment",
    valueAnalysis: [
      "Contributes over 60% of enterprise revenue",
      "Customer Lifetime Value (LTV) is 5x that of regular customers",
      "Referral conversion rate reaches 35%, bringing significant word-of-mouth effects",
      "Low price sensitivity, more focused on service quality and experience",
    ],
    capabilities: [
      "How to identify and predict purchase timing for high-value customers?",
      "How to design personalized product recommendation strategies?",
      "How to establish an effective customer loyalty program?",
      "How to optimize service experience processes for premium customers?",
      "How to enhance customer lifetime value through data analysis?",
      "How to design exclusive benefits to strengthen customer stickiness?",
      "How to leverage customer feedback to improve products and services?",
      "How to incentivize high-value customers for word-of-mouth marketing?",
      "How to prevent high-value customers from churning to competitors?",
      "How to increase order value through cross-category recommendations?",
    ],
  },
  {
    id: "sme-customers",
    title: "SME Customer Segment",
    valueAnalysis: [
      "Large market size with significant growth potential",
      "Short decision cycle with high conversion efficiency",
      "High acceptance of digital tools, easy to promote SaaS products",
      "Renewal rate stable above 70%",
    ],
    capabilities: [
      "How to simplify enterprise procurement processes to improve conversion rates?",
      "How to design flexible pricing strategies for different-sized enterprises?",
      "How to provide efficient multi-user collaboration features?",
      "How to help enterprises quickly achieve system integration?",
      "How to demonstrate business value through data dashboards?",
      "How to reduce enterprise learning and usage costs?",
      "How to design effective renewal reminders and incentive mechanisms?",
      "How to provide timely technical support and training services?",
      "How to prove product ROI through case studies?",
      "How to establish a referral reward system for enterprise customers?",
    ],
  },
  {
    id: "individual-users",
    title: "Individual User Segment",
    valueAnalysis: [
      "Large user base with wide coverage",
      "Strong social propagation power, easy to form viral growth",
      "High acceptance of new features, suitable for rapid iteration validation",
      "Mobile usage accounts for over 85%",
    ],
    capabilities: [
      "How to design a simple and intuitive mobile interaction experience?",
      "How to incentivize users for social sharing and propagation?",
      "How to enhance user engagement through gamification mechanisms?",
      "How to optimize first-time user experience to improve retention?",
      "How to design an attractive points reward system?",
      "How to leverage push notifications to increase user return rates?",
      "How to create personalized user interfaces and themes?",
      "How to build a user community to enhance sense of belonging?",
      "How to extend usage duration through content recommendations?",
      "How to design low-barrier paid conversion paths?",
    ],
  },
]

const mockExplorationResults: Record<string, Partial<MarketSegment>> = {
  churn: {
    id: "churn-riREDACTED",
    title: "Potential Churn User Segment",
    valueAnalysis: [
      "Retention cost is far lower than acquisition cost",
      "Churn warning can identify at-risk users 30 days in advance",
      "Precise retention strategies can improve retention rate by 15-20%",
      "30% of churned users can be reactivated through incentive measures",
    ],
    capabilities: [
      "How to accurately identify user churn warning signals?",
      "How to design effective user retention strategies?",
      "How to understand real reasons for user churn through surveys?",
      "How to design personalized win-back incentive programs?",
      "How to optimize product features to address churn pain points?",
      "How to monitor competitor dynamics to prevent user churn?",
      "How to establish user feedback collection and response mechanisms?",
      "How to predict churn trends through data analysis?",
      "How to design tiered win-back outreach strategies?",
      "How to evaluate ROI and effectiveness of retention campaigns?",
    ],
  },
  new: {
    id: "new-users",
    title: "New Registered Users",
    valueAnalysis: [
      "First experience determines long-term retention",
      "7-day retention rate of new users directly impacts overall growth",
      "Onboarding process optimization can improve conversion rate by 25%",
      "New user referral success rate is 2x that of existing users",
    ],
    capabilities: [
      "How to design a clear onboarding process?",
      "How to quickly demonstrate the core value of the product?",
      "How to lower the usage barrier for new users?",
      "How to promote first conversion through first-order discounts?",
      "How to design an attractive beginner task system?",
      "How to provide personalized recommendations based on user characteristics?",
      "How to establish exclusive communication communities for new users?",
      "How to collect usage feedback from new users?",
      "How to optimize registration process to reduce churn?",
      "How to improve onboarding experience through data analysis?",
    ],
  },
  active: {
    id: "active-users",
    title: "Highly Active Users",
    valueAnalysis: [
      "Loyal product users with high brand recognition",
      "High-quality feedback, important source for product optimization",
      "High community contribution, driving other users' engagement",
      "Paid conversion rate is 3x that of regular users",
    ],
    capabilities: [
      "How to identify and cultivate core active users?",
      "How to design an effective user incentive system?",
      "How to invite active users to participate in product co-creation?",
      "How to enhance user sense of belonging through exclusive benefits?",
      "How to incentivize active users to create quality content?",
      "How to organize online and offline user events?",
      "How to establish user level and achievement systems?",
      "How to collect and respond to suggestions from active users?",
      "How to guide active users to become opinion leaders?",
      "How to drive overall community atmosphere through active users?",
    ],
  },
}

export default function MarketExplorationPage() {
  const [markets, setMarkets] = useState<MarketSegment[]>(initialMarkets)
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([])
  const [explorationInput, setExplorationInput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [expandedPanels, setExpandedPanels] = useState<string[]>(initialMarkets.map((m) => m.id))
  const [highlightedMarkets, setHighlightedMarkets] = useState<string[]>([])

  const toggleMarketSelection = (marketId: string) => {
    setSelectedMarkets((prev) => (prev.includes(marketId) ? prev.filter((id) => id !== marketId) : [...prev, marketId]))
  }

  const handleAnalyze = async () => {
    if (!explorationInput.trim()) return

    setIsAnalyzing(true)

    await new Promise((resolve) => setTimeout(resolve, 2500))

    const keyword = Object.keys(mockExplorationResults).find((key) => explorationInput.toLowerCase().includes(key))

    if (keyword) {
      const newMarket = mockExplorationResults[keyword] as MarketSegment

      const existingIndex = markets.findIndex((m) => m.id === newMarket.id)

      if (existingIndex >= 0) {
        setMarkets((prev) => prev.map((m, idx) => (idx === existingIndex ? { ...m, hasNewContent: true } : m)))
        setHighlightedMarkets([newMarket.id])
      } else {
        setMarkets((prev) => [...prev, { ...newMarket, isNew: true }])
        setExpandedPanels((prev) => [...prev, newMarket.id])
        setHighlightedMarkets([newMarket.id])
      }

      setTimeout(() => {
        setHighlightedMarkets([])
        setMarkets((prev) => prev.map((m) => ({ ...m, isNew: false, hasNewContent: false })))
      }, 3000)
    }

    setIsAnalyzing(false)
    setExplorationInput("")
  }

  const handleGenerate = () => {
    window.open("/application-generated", "_blank")
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold text-black mb-6">Market Segmentation Exploration & Builder</h1>
        <p className="text-gray-600 text-lg leading-relaxed">
          We've recommended 3 initial market segments for you! You can select segments of interest, or explore more
          possibilities in the input box below. Once you've made your selections, click "Generate Application" to create
          your ChatAPP.
        </p>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-32">
        <Accordion type="multiple" value={expandedPanels} onValueChange={setExpandedPanels} className="space-y-4">
          {markets.map((market) => {
            const isSelected = selectedMarkets.includes(market.id)
            const isHighlighted = highlightedMarkets.includes(market.id)

            return (
              <AccordionItem
                key={market.id}
                value={market.id}
                className={`
                  rounded-lg overflow-hidden transition-all duration-300 border-2
                  ${isSelected ? "border-gray-600 bg-gray-50" : "border-gray-200 bg-white"}
                  ${isHighlighted ? "ring-4 ring-gray-600 ring-opacity-20" : ""}
                `}
              >
                <div
                  className={`
                  flex items-start gap-3 px-6 py-4 transition-colors
                  ${isSelected ? "bg-gray-600 text-white" : "bg-white text-black"}
                `}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleMarketSelection(market.id)}
                    className={`${isSelected ? "border-white data-[state=checked]:bg-white data-[state=checked]:text-gray-600" : ""}`}
                  />

                  <AccordionTrigger className="flex-1 hover:no-underline p-0">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">{market.title}</span>
                      {market.hasNewContent && (
                        <span
                          className={`text-xs font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-full ${
                            isSelected ? "bg-white text-gray-600" : "bg-gray-600 text-white"
                          }`}
                        >
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full ${isSelected ? "bg-gray-600" : "bg-white"}`}
                          />
                          NEW
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                </div>

                <AccordionContent className="px-6 pb-6 pt-8 bg-white">
                  <div className="pl-9 space-y-6">
                    <div>
                      <h3 className="font-bold text-base mb-3 text-black">Market Values</h3>
                      <ul className="space-y-2">
                        {market.valueAnalysis.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-3 leading-relaxed">
                            <span className="text-black font-bold mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-gray-50 -mx-6 px-6 py-4 border-t-2 border-gray-200">
                      <h3 className="font-bold text-base mb-3 text-black">Valued Questions</h3>
                      <ul className="space-y-2">
                        {market.capabilities.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-3 leading-relaxed">
                            <span className="text-black font-bold mt-0.5">{idx + 1}.</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>

        <div className="mt-8 w-full">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden relative">
            <Textarea
              placeholder="Enter the market direction you want to explore, e.g.: churn risk users, new user growth..."
              value={explorationInput}
              onChange={(e) => setExplorationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isAnalyzing) {
                  e.preventDefault()
                  handleAnalyze()
                }
              }}
              disabled={isAnalyzing}
              className="min-h-[80px] max-h-[160px] resize-none border-0 focus-visible:ring-0 text-black placeholder:text-gray-400 pr-14 text-base leading-relaxed"
              rows={2}
            />
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !explorationInput.trim()}
              size="icon"
              className="absolute bottom-3 right-3 h-10 w-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-all"
            >
              {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t-2 border-gray-200 shadow-2xl z-50">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex flex-col items-start gap-1 min-w-[140px]">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Selected Markets</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-black">{selectedMarkets.length}</span>
                <span className="text-sm text-gray-600">items</span>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={selectedMarkets.length === 0}
              size="lg"
              className="min-w-[160px] h-14 bg-white text-blue-600 hover:bg-gray-100 font-bold text-base disabled:bg-gray-700 disabled:text-gray-500 rounded-xl shadow-lg transition-all"
            >
              Generate Application
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
