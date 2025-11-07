"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type FREQUENCY = "monthly" | "yearly"

const frequencies: FREQUENCY[] = ["monthly", "yearly"]

export interface Plan {
  name: string
  info: string
  price: {
    monthly: number
    yearly: number
  }
  features: {
    text: string
    tooltip?: string
  }[]
  btn: {
    text: string
    href?: string
    onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
    variant?: React.ComponentProps<typeof Button>["variant"]
    disabled?: boolean
    loadingText?: string
  }
}

export interface PricingSectionProps extends React.ComponentProps<"div"> {
  plans: Plan[]
  heading: string
  description?: string
}

export function PricingSection({
  plans,
  heading,
  description,
  ...props
}: PricingSectionProps) {
  const [frequency, setFrequency] = React.useState<FREQUENCY>("monthly")

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center space-y-5 p-4",
        props.className,
      )}
      {...props}
    >
      <div className="mx-auto max-w-xl space-y-2">
        <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
          {heading}
        </h2>
        {description && (
          <p className="text-muted-foreground text-center text-sm md:text-base">
            {description}
          </p>
        )}
      </div>
      <PricingFrequencyToggle frequency={frequency} setFrequency={setFrequency} />
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard plan={plan} key={plan.name} frequency={frequency} />
        ))}
      </div>
    </div>
  )
}

type PricingFrequencyToggleProps = React.ComponentProps<"div"> & {
  frequency: FREQUENCY
  setFrequency: React.Dispatch<React.SetStateAction<FREQUENCY>>
}

export function PricingFrequencyToggle({
  frequency,
  setFrequency,
  ...props
}: PricingFrequencyToggleProps) {
  return (
    <div
      className={cn(
        "bg-muted/30 mx-auto flex w-fit rounded-full border p-1",
        props.className,
      )}
      {...props}
    >
      {frequencies.map((freq) => (
        <button
          key={freq}
          type="button"
          onClick={() => setFrequency(freq)}
          className={cn(
            "relative rounded-full px-4 py-1 text-sm capitalize transition-colors",
            frequency === freq ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <span className="relative z-10">{freq}</span>
          {frequency === freq && (
            <motion.span
              layoutId="frequency"
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-foreground absolute inset-0 z-10 rounded-full mix-blend-difference"
            />
          )}
        </button>
      ))}
    </div>
  )
}

type PricingCardProps = React.ComponentProps<"div"> & {
  plan: Plan
  frequency?: FREQUENCY
}

export function PricingCard({
  plan,
  className,
  frequency = frequencies[0],
  ...props
}: PricingCardProps) {
  const buttonText = plan.btn.disabled && plan.btn.loadingText ? plan.btn.loadingText : plan.btn.text
  const useLink = Boolean(plan.btn.href)

  return (
    <div
      key={plan.name}
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#121317] text-zinc-100 shadow-[0_0_40px_rgba(0,0,0,0.45)]",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "relative rounded-t-2xl border-b border-white/5 bg-white/5 p-6 backdrop-blur-sm",
        )}
      >
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {frequency === "yearly" && (
            <p className="bg-emerald-500/20 text-emerald-200 flex items-center gap-1 rounded-md border border-emerald-500/30 px-2 py-0.5 text-xs">
              {Math.round(
                ((plan.price.monthly * 12 - plan.price.yearly) /
                  plan.price.monthly /
                  12) *
                  100,
              )}
              % off
            </p>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-lg font-semibold text-white">{plan.name}</div>
          <p className="text-sm font-normal text-zinc-300">{plan.info}</p>
        </div>
        <h3 className="mt-4 flex items-end gap-1">
          <span className="text-4xl font-bold tracking-tight text-white">
            ${plan.price[frequency]}
          </span>
          <span className="text-sm font-medium text-zinc-400">
            {plan.name !== "Free"
              ? "/" + (frequency === "monthly" ? "month" : "year")
              : ""}
          </span>
        </h3>
      </div>
      <TooltipProvider>
        <div className="space-y-3 px-6 py-8 text-sm text-zinc-200">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <p
                    className={cn(
                      feature.tooltip &&
                        "cursor-pointer border-b border-dashed border-zinc-500/60",
                    )}
                  >
                    {feature.text}
                  </p>
                </TooltipTrigger>
                {feature.tooltip && (
                  <TooltipContent>
                    <p>{feature.tooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          ))}
        </div>
      </TooltipProvider>
      <div className="w-full border-t border-white/5 p-4">
        {useLink ? (
          <Button
            className="w-full"
            variant={plan.btn.variant ?? "outline"}
            asChild
            disabled={plan.btn.disabled}
          >
            <Link href={plan.btn.href!} onClick={plan.btn.onClick}>
              {buttonText}
            </Link>
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={plan.btn.variant ?? "outline"}
            disabled={plan.btn.disabled}
            onClick={plan.btn.onClick}
          >
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  )
}

