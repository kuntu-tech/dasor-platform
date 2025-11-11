"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-payment">("loading");
  const [message, setMessage] = useState("");
  const hasProcessed = useRef(false);
  const abortControllers = useRef<{ payment?: AbortController; callback?: AbortController }>({});

  useEffect(() => {
    // 防止重复执行
    if (hasProcessed.current) {
      return;
    }

    const handleCallback = async () => {
      // 标记为已处理
      hasProcessed.current = true;
      try {
        // Stripe OAuth 回调参数
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        
        // 后端处理后的结果参数
        const oauth = searchParams.get("oauth");
        const vendorId = searchParams.get("vendorId");
        const accountId = searchParams.get("accountId");

        let hasPaymentHistory = true;

        // 如果有 error，说明 Stripe 授权被拒绝
        if (error) {
          setStatus("error");
          setMessage(decodeURIComponent(error || "Stripe authorization was denied"));
          return;
        }

        // 如果已经是后端处理后的结果（有 oauth 参数）
        if (oauth === "success") {
          setStatus("success");
          setMessage("Account linked successfully!");
          setTimeout(() => {
            // 获取保存的来源页面，如果没有则使用首页
            const returnPath = typeof window !== "undefined" 
              ? sessionStorage.getItem("oauth_return_path") || "/"
              : "/";
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("oauth_return_path");
            }
            // 返回到来源页面，并带上参数打开设置对话框的 payout 标签页
            router.push(`${returnPath}${returnPath === "/" ? "?" : "&"}openSettings=payout`);
          }, 3000);
          return;
        }

        if (oauth === "error") {
          setStatus("error");
          setMessage("Authorization failed");
          return;
        }

        // 如果是 Stripe 回调（有 code 和 state）
        if (code && state) {
          try {
            // 先检查当前用户是否有支付记录
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) {
              setStatus("error");
              setMessage("User not authenticated");
              return;
            }

            // 检查用户是否有支付记录
            const paymentController = new AbortController();
            abortControllers.current.payment = paymentController;
            const paymentTimeout = window.setTimeout(() => {
              paymentController.abort();
            }, 8000);

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
              // 如果检查失败，继续执行 OAuth 流程
            } else {
              const checkData = await checkResponse.json();
              
              // 如果没有支付记录，显示静态页面
              if (checkData.success && !checkData.hasPaymentHistory) {
                hasPaymentHistory = false;
                setMessage("No payment history yet. Completing authorization...");
              }
            }

            // 如果有支付记录，继续执行 OAuth 流程
            // 通过本地 API 代理转发请求，绕过浏览器限制
            const callbackUrl = `/api/proxy-oauth-callback?code=${code}&state=${state}`;
            console.log("Calling OAuth callback:", callbackUrl);
            
            const callbackController = new AbortController();
            abortControllers.current.callback = callbackController;
            const callbackTimeout = window.setTimeout(() => {
              callbackController.abort();
            }, 12000);

            let response: Response;
            try {
              response = await fetch(callbackUrl, {
                method: "GET",
                headers: {
                  "Accept": "application/json",
                },
                signal: callbackController.signal,
              });
            } finally {
              window.clearTimeout(callbackTimeout);
              abortControllers.current.callback = undefined;
            }

            console.log("Response status:", response.status);
            console.log("Response headers:", response.headers.get("content-type"));

            if (!response.ok) {
              const text = await response.text();
              console.log("Error response:", text);
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
                // 获取保存的来源页面，如果没有则使用首页
                const returnPath = typeof window !== "undefined" 
                  ? sessionStorage.getItem("oauth_return_path") || "/"
                  : "/";
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem("oauth_return_path");
                }
                // 返回到来源页面，并带上参数打开设置对话框的 payout 标签页
                router.push(`${returnPath}${returnPath === "/" ? "?" : "&"}openSettings=payout`);
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

        // 既不是 Stripe 回调也不是后端结果
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
  }, [searchParams, router]);

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

