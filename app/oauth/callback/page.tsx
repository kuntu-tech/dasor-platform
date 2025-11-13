"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session: authSession, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-payment">("loading");
  const [message, setMessage] = useState("");
  const hasProcessed = useRef(false);
  const abortControllers = useRef<{ payment?: AbortController; callback?: AbortController }>({});
  const warmupDone = useRef(false);
  const warmupPromiseRef = useRef<Promise<void> | null>(null);

  // Immediate warmup when page loads to prevent cold start timeout
  // Wait for AuthProvider to finish initializing first (especially important in incognito mode)
  useEffect(() => {
    if (warmupDone.current) return;
    
    // Wait for AuthProvider to finish loading before starting warmup
    if (authLoading) {
      console.log("⏳ [OAuth Callback] Waiting for AuthProvider to initialize...");
      return;
    }
    
    warmupDone.current = true;
    
    const warmupSupabase = async () => {
      try {
        console.log("🔥 [OAuth Callback] Immediate Supabase warmup...");
        const startTime = Date.now();
        
        // Use session from AuthProvider if available, otherwise try to get it
        let session = authSession;
        
        if (!session) {
          console.log("📡 [OAuth Callback] No session from AuthProvider, fetching...");
          // Try to get session with longer timeout for warmup (15 seconds)
          // This establishes the connection to Supabase API
          const warmupSessionPromise = supabase.auth.getSession();
          const warmupTimeoutPromise = new Promise<{ data: { session: null }; error: null }>((resolve) =>
            setTimeout(() => resolve({ data: { session: null }, error: null }), 15000)
          );
          
          const sessionResult = await Promise.race([warmupSessionPromise, warmupTimeoutPromise]) as any;
          session = sessionResult?.data?.session;
        }
        
        const elapsed = Date.now() - startTime;
        
        console.log(`📊 [OAuth Callback] Warmup session check completed in ${elapsed}ms`, {
          hasSession: !!session,
          hasAccessToken: !!session?.access_token,
          fromAuthProvider: !!authSession
        });
        
        if (session?.access_token) {
          // Warm up the backend API as well
          const backendStartTime = Date.now();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          
          try {
            await fetch("/api/users/self", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
              },
              signal: controller.signal,
              body: JSON.stringify({}),
            });
            const backendElapsed = Date.now() - backendStartTime;
            console.log(`✅ [OAuth Callback] Backend warmed up in ${backendElapsed}ms`);
          } catch (warmupError: any) {
            if (warmupError.name !== "AbortError") {
              console.log("⚠️ [OAuth Callback] Backend warmup error (non-critical):", warmupError.message);
            }
          } finally {
            clearTimeout(timeoutId);
          }
        } else {
          console.log("⚠️ [OAuth Callback] No session for warmup (will retry in main flow)");
        }
        
        console.log("✅ [OAuth Callback] Warmup completed");
      } catch (error: any) {
        console.log("⚠️ [OAuth Callback] Warmup error (non-critical):", error.message);
      }
    };
    
    // Store the promise so main flow can wait for it
    warmupPromiseRef.current = warmupSupabase();
  }, [authLoading, authSession]);

  useEffect(() => {
    // Prevent duplicate execution
    if (hasProcessed.current) {
      return;
    }

    // Wait for AuthProvider to finish initializing before processing OAuth callback
    // This is critical in incognito mode where session initialization takes longer
    if (authLoading) {
      console.log("⏳ [OAuth Callback] Waiting for AuthProvider to finish loading...");
      return;
    }

    const handleCallback = async () => {
      // Flag as processed
      hasProcessed.current = true;
      try {
        // Stripe OAuth callback parameters
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        
        // Parameters returned after backend processing
        const oauth = searchParams.get("oauth");
        const vendorId = searchParams.get("vendorId");
        const accountId = searchParams.get("accountId");

        let hasPaymentHistory = true;

        // Presence of error indicates Stripe authorization was denied
        if (error) {
          setStatus("error");
          setMessage(decodeURIComponent(error || "Stripe authorization was denied"));
          return;
        }

        // Handle backend-processed result (identified by oauth param)
        if (oauth === "success") {
          setStatus("success");
          setMessage("Account linked successfully!");
          setTimeout(() => {
            // Retrieve stored return path; default to homepage
            const returnPath = typeof window !== "undefined" 
              ? sessionStorage.getItem("oauth_return_path") || "/"
              : "/";
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("oauth_return_path");
            }
            // Return to origin page and append query to open payout tab
            router.push(`${returnPath}${returnPath === "/" ? "?" : "&"}openSettings=payout`);
          }, 3000);
          return;
        }

        if (oauth === "error") {
          setStatus("error");
          setMessage("Authorization failed");
          return;
        }

        // Stripe callback path (when both code and state are provided)
        if (code && state) {
          console.log("🔐 Starting OAuth callback processing...", { code: code.substring(0, 10) + "...", state });
          try {
            // Wait for warmup to complete (or timeout after 3 seconds)
            // This ensures Supabase connection is established before we start
            if (warmupPromiseRef.current) {
              console.log("⏳ Waiting for warmup to complete...");
              try {
                await Promise.race([
                  warmupPromiseRef.current,
                  new Promise(resolve => setTimeout(resolve, 3000)) // Max wait 3 seconds
                ]);
                console.log("✅ Warmup wait completed");
              } catch (warmupWaitError) {
                console.log("⚠️ Warmup wait error (continuing anyway):", warmupWaitError);
              }
            }
            
            // Use session from AuthProvider first (most reliable)
            // If not available, try to get it directly from Supabase
            let session = authSession;
            
            if (!session) {
              console.log("⚠️ [OAuth Callback] No session from AuthProvider, fetching directly...");
              // Retry getSession up to 3 times with exponential backoff to handle cold start
              let sessionResult: { data: { session: any } | null; error: any } | null = null;
              let retryCount = 0;
              const maxRetries = 3;
              
              while (retryCount < maxRetries && !sessionResult?.data?.session) {
                try {
                  console.log(`👤 Checking user session... (attempt ${retryCount + 1}/${maxRetries})`);
                  const sessionStartTime = Date.now();
                  // Increased timeout to 25 seconds per attempt to handle cold start
                  sessionResult = await Promise.race([
                    supabase.auth.getSession(),
                    new Promise<{ data: { session: null }; error: Error }>((_, reject) =>
                      setTimeout(() => reject(new Error("Session check timeout")), 25000)
                    ),
                  ]) as any;
                  const sessionElapsed = Date.now() - sessionStartTime;
                  console.log(`📊 Session check completed in ${sessionElapsed}ms`);
                  
                  console.log("📋 Session result:", { 
                    hasSession: !!sessionResult?.data?.session,
                    hasUser: !!sessionResult?.data?.session?.user?.id,
                    error: sessionResult?.error?.message 
                  });
                  
                  if (sessionResult?.data?.session?.user?.id) {
                    session = sessionResult.data.session;
                    break;
                  }
                } catch (sessionError: any) {
                  console.log(`⚠️ Session check attempt ${retryCount + 1} failed:`, sessionError.message);
                  if (retryCount < maxRetries - 1) {
                    // Longer delay between retries to allow Supabase to warm up
                    const delay = Math.min(2000 * Math.pow(2, retryCount), 8000);
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                  }
                }
                retryCount++;
              }
              
              if (!session && sessionResult?.data?.session) {
                session = sessionResult.data.session;
              }
            }
            
            if (!session?.user?.id) {
              console.error("❌ User not authenticated after retries");
              setStatus("error");
              setMessage("User not authenticated. Please try logging in again.");
              return;
            }
            console.log("✅ User authenticated:", session.user.id, "(from AuthProvider:", !!authSession, ")");

            // Query payment history for the current user
            console.log("💳 Checking payment history...");
            const paymentController = new AbortController();
            abortControllers.current.payment = paymentController;
            const paymentTimeout = window.setTimeout(() => {
              console.warn("⏱️ Payment history check timeout");
              paymentController.abort();
            }, 15000); // Increased timeout to 15 seconds

            let checkResponse: Response | null = null;

            try {
              checkResponse = await fetch(
                `/api/check-payment-history?userId=${session.user.id}`,
                {
                  method: "GET",
                  headers: {
                    Accept: "application/json",
                  },
                  signal: paymentController.signal,
                }
              );
            } finally {
              window.clearTimeout(paymentTimeout);
              abortControllers.current.payment = undefined;
            }

            if (!checkResponse.ok) {
              console.log("Error checking payment history");
              // If the check fails, continue OAuth flow regardless
            } else {
              const checkData = await checkResponse.json();
              
              // Show static messaging if no payment history exists
              if (checkData.success && !checkData.hasPaymentHistory) {
                hasPaymentHistory = false;
                setMessage("No payment history yet. Completing authorization...");
              }
            }

            // Continue the OAuth flow via local proxy when payment history exists
            const callbackUrl = `/api/proxy-oauth-callback?code=${code}&state=${state}`;
            const startTime = Date.now();
            console.log("📡 Calling OAuth callback:", callbackUrl, "at", new Date().toISOString());
            
            const callbackController = new AbortController();
            abortControllers.current.callback = callbackController;
            // Increased timeout to 45 seconds to account for service initialization and network delays
            const callbackTimeout = window.setTimeout(() => {
              const elapsed = Date.now() - startTime;
              console.warn("⏱️ OAuth callback timeout after", elapsed, "ms");
              callbackController.abort();
            }, 45000);

            let response: Response;
            try {
              response = await fetch(callbackUrl, {
                method: "GET",
                headers: {
                  "Accept": "application/json",
                },
                signal: callbackController.signal,
              });
              const elapsed = Date.now() - startTime;
              console.log("✅ OAuth callback response received after", elapsed, "ms");
            } catch (fetchError: any) {
              window.clearTimeout(callbackTimeout);
              abortControllers.current.callback = undefined;
              if (fetchError.name === "AbortError") {
                const elapsed = Date.now() - startTime;
                console.error("❌ OAuth callback fetch timeout after", elapsed, "ms");
                throw new Error("Authorization timed out. The service may be starting up. Please try again.");
              }
              throw fetchError;
            } finally {
              window.clearTimeout(callbackTimeout);
              abortControllers.current.callback = undefined;
            }

            console.log("Response status:", response.status);
            console.log("Response headers:", response.headers.get("content-type"));

            if (!response.ok) {
              const text = await response.text();
              console.log("Error response:", text);
              // Handle timeout specifically
              if (response.status === 504) {
                let errorData: any = { error: "Request timeout" };
                try {
                  errorData = JSON.parse(text);
                } catch {
                  // Use default error message if JSON parsing fails
                }
                throw new Error(errorData.error || "Service timeout - please try again");
              }
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              const text = await response.text();
              console.log("Non-JSON response:", text.substring(0, 500));
              setStatus("error");
              setMessage("Server returned invalid data format");
              return;
            }

            const data = await response.json();

            if (data.success) {
              setStatus("success");
              setMessage(
                hasPaymentHistory
                  ? "Account linked successfully!"
                  : "Account linked successfully! Your payouts will appear here after you receive payments."
              );
              setTimeout(() => {
                // Retrieve the saved origin path or default to home
                const returnPath =
                  typeof window !== "undefined"
                    ? sessionStorage.getItem("oauth_return_path") || "/"
                    : "/";
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem("oauth_return_path");
                }
                // Navigate back with query parameter to open the payout tab
                router.push(
                  `${returnPath}${
                    returnPath === "/" ? "?" : "&"
                  }openSettings=payout`
                );
              }, 3000);
            } else {
              setStatus("error");
              setMessage(data.error || "Failed to link account");
            }
          } catch (err) {
            console.log("OAuth callback processing error:", err);
            setStatus("error");
            if (err instanceof DOMException && err.name === "AbortError") {
              setMessage("Authorization timed out, please try again.");
            } else {
              setMessage("Network error, please try again.");
            }
          }
          return;
        }

        // Invalid scenario: neither Stripe callback nor backend result
        setStatus("error");
        setMessage("Invalid callback parameters");
      } catch (error) {
        console.log("OAuth callback error:", error);
        setStatus("error");
        setMessage("An error occurred while processing the callback");
      }
    };

    handleCallback();
    return () => {
      abortControllers.current.payment?.abort();
      abortControllers.current.callback?.abort();
      abortControllers.current = {};
    };
  }, [searchParams, router, authLoading, authSession]);

  useEffect(() => {
    if (status !== "loading") return;

    const timeoutId = window.setTimeout(() => {
      abortControllers.current.payment?.abort();
      abortControllers.current.callback?.abort();
      abortControllers.current = {};
      setStatus("error");
      setMessage("Authorization timed out, please try again.");
    }, 15000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [status]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing authorization...</p>
          </>
        )}

        {status === "no-payment" && (
          <div className="max-w-lg mx-auto px-6 py-12">
            <div className="mb-8">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                No payment history
              </h1>
              <p className="text-gray-600 text-base leading-relaxed">
                You don't have any payment records yet. Once you receive payments, they will appear here.
              </p>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={() => {
                  const returnPath = typeof window !== "undefined" 
                    ? sessionStorage.getItem("oauth_return_path") || "/"
                    : "/";
                  if (typeof window !== "undefined") {
                    sessionStorage.removeItem("oauth_return_path");
                  }
                  router.push(returnPath || "/");
                }}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Go back
              </button>
            </div>
          </div>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900">{message}</p>
            <p className="mt-2 text-sm text-gray-500">Redirecting to settings page...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900">{message}</p>
            <button
              onClick={() => {
                const returnPath = typeof window !== "undefined" 
                  ? sessionStorage.getItem("oauth_return_path") || "/"
                  : "/";
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem("oauth_return_path");
                }
                router.push(`${returnPath}${returnPath === "/" ? "?" : "&"}openSettings=payout`);
              }}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Return to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}

