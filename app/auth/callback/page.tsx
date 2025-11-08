"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let didFinish = false;
    const redirectTo = (path: string) => {
      if (didFinish) return;
      didFinish = true;
      router.replace(path);
    };

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        redirectTo("/");
      } else if (event === "SIGNED_OUT") {
        redirectTo("/auth/login");
      }
    });

    const timeoutId = setTimeout(() => {
      console.warn("Auth callback timed out, redirecting to login");
      redirectTo("/auth/login?error=timeout");
    }, 7000);

    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.log("Callback processing error:", error);
          redirectTo("/auth/login?error=auth_failed");
          return;
        }

        if (data.session) {
          console.log("Login successful, redirecting to homepage");
          redirectTo("/");
        }
      } catch (error) {
        console.log("Callback processing error:", error);
        redirectTo("/auth/login?error=callback_error");
      }
    };

    handleAuthCallback();

    return () => {
      clearTimeout(timeoutId);
      data.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Logging in...</p>
      </div>
    </div>
  );
}
