"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Stripe OAuth 回调参数
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        
        // 后端处理后的结果参数
        const oauth = searchParams.get("oauth");
        const vendorId = searchParams.get("vendorId");
        const accountId = searchParams.get("accountId");

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
            // 通过本地 API 代理转发请求，绕过浏览器限制
            const callbackUrl = `/api/proxy-oauth-callback?code=${code}&state=${state}`;
            console.log("Calling OAuth callback:", callbackUrl);
            
            const response = await fetch(callbackUrl, {
              method: "GET",
              headers: {
                "Accept": "application/json",
              },
            });

            console.log("Response status:", response.status);
            console.log("Response headers:", response.headers.get("content-type"));

            if (!response.ok) {
              const text = await response.text();
              console.error("Error response:", text);
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              const text = await response.text();
              console.error("Non-JSON response:", text.substring(0, 500));
              setStatus("error");
              setMessage("Server returned invalid data format");
              return;
            }

            const data = await response.json();

            if (data.success) {
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
            } else {
              setStatus("error");
              setMessage(data.error || "Failed to link account");
            }
          } catch (err) {
            console.error("OAuth callback processing error:", err);
            setStatus("error");
            setMessage("Network error, please try again");
          }
          return;
        }

        // 既不是 Stripe 回调也不是后端结果
        setStatus("error");
        setMessage("Invalid callback parameters");
      } catch (error) {
        console.error("OAuth callback error:", error);
        setStatus("error");
        setMessage("An error occurred while processing the callback");
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing authorization...</p>
          </>
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

