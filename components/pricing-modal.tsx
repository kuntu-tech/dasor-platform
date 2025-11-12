"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import {
  getVendorStatus,
  createSubscription,
} from "@/portable-pages/lib/connectApi";
import { ensureVendor } from "@/portable-pages/lib/vendorEnsure";
import { PricingCard, type Plan } from "@/components/ui/pricing";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const stringifyDetail = (detail: unknown): string | undefined => {
    if (!detail) return undefined;
    if (typeof detail === "string") return detail;
    if (detail instanceof Error) return detail.message;
    try {
      const serialized = JSON.stringify(detail);
      return serialized.length > 160
        ? `${serialized.slice(0, 157)}...`
        : serialized;
    } catch {
      return undefined;
    }
  };

  const formatErrorMessage = (message: string, detail?: unknown) => {
    const detailText = stringifyDetail(detail);
    return detailText ? `${message} (${detailText})` : message;
  };

  // Handle ESC key closure and reset error state when opening
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent background scrolling
      document.body.style.overflow = "hidden";
      // Reset any previous error when the modal opens
      setError(null);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle subscription flow
  const handleSubscribe = async () => {
    if (!user?.id) {
      setError("Please log in first");
      return;
    }

    setIsLoading(true);
    setError(null);

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    try {
      let vendorId: number | undefined;

      try {
        const vendorStatus = await getVendorStatus(user.id);
        if (vendorStatus.success && vendorStatus.data?.id) {
          vendorId = vendorStatus.data.id;
        }
      } catch (statusError) {
        console.log(
          "Failed to fetch vendor status, will attempt auto provisioning:",
          statusError
        );
      }

      if (!vendorId) {
        const email = user.email;
        if (!email) {
          setError(
            "We couldn't read your account email. Please sign out and sign back in before subscribing."
          );
          setIsLoading(false);
          return;
        }

        const ensureResponse = await ensureVendor({
          email,
          userId: user.id,
          redirectUri: baseUrl ? `${baseUrl}/oauth/callback` : undefined,
        });

        if (!ensureResponse.success || !ensureResponse.data?.vendorId) {
          setError(
            formatErrorMessage(
              "We couldn't create or locate your vendor profile. Please try again or contact support.",
              ensureResponse.error ?? ensureResponse.details
            )
          );
          setIsLoading(false);
          return;
        }

        vendorId = ensureResponse.data.vendorId;
      }

      if (!vendorId) {
        setError(
          "We couldn't determine your vendor profile after onboarding. Please refresh the page and try again."
        );
        setIsLoading(false);
        return;
      }

      const subscriptionResponse = await createSubscription(vendorId, {
        interval: "month",
        successUrl: `${baseUrl}/subscription/success`,
        cancelUrl: `${baseUrl}/subscription/cancel`,
      });

      if (subscriptionResponse.success && subscriptionResponse.data) {
        const alreadyActive =
          subscriptionResponse.data.alreadySubscribed === true ||
          subscriptionResponse.message
            ?.toLowerCase()
            .includes("already has an active subscription");

        if (alreadyActive) {
          setError(
            "You already have an active subscription. If this is unexpected, please contact support."
          );
          setIsLoading(false);
          return;
        }
      }

      if (
        !subscriptionResponse.success ||
        !subscriptionResponse.data?.checkoutUrl
      ) {
        const subscriptionDetail =
          subscriptionResponse.error ||
          subscriptionResponse.message ||
          subscriptionResponse.data?.message;

        setError(
          formatErrorMessage(
            "Stripe did not return a checkout link. Please try again in a few minutes or contact support.",
            subscriptionDetail
          )
        );
        setIsLoading(false);
        return;
      }

      window.location.href = subscriptionResponse.data.checkoutUrl;
    } catch (err) {
      console.log("Subscription processing error:", err);
      setError(
        formatErrorMessage(
          "We couldn't start your subscription. Please refresh the page and try again.",
          err
        )
      );
      setIsLoading(false);
    }
  };

  const plans = [
    {
      name: "Pro",
      info: "For more projects and usage",
      price: {
        monthly: 35,
        yearly: 35 * 12,
      },
      features: [
        { text: "Unlimited generating ChatAPP" },
        { text: "Unlimited import dasebase" },
        { text: "Unlimited times business analyst" },
        { text: "Unlock McKinsey-level AI analytics" },
      ],
      btn: {
        text: "Subscribe",
        loadingText: "Processing...",
        disabled: isLoading,
        onClick: () => {
          handleSubscribe();
        },
        variant: "default",
        className: "bg-white text-black hover:bg-white/90",
      },
    } satisfies Plan,
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative mx-auto flex w-full max-w-lg flex-col items-center">
        <div className="relative w-full max-w-[19rem]">
          <PricingCard
            plan={plans[0]}
            frequency="monthly"
            className="rounded-[28px] border border-white/10 bg-[#0D0F16] shadow-[0_25px_80px_rgba(0,0,0,0.65)]"
          />

          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-zinc-200 shadow-[0_8px_16px_rgba(0,0,0,0.3)] transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-black/20"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 w-full max-w-sm rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
