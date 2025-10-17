"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Callback processing error:", error);
          router.push("/auth/login?error=auth_failed");
          return;
        }

        if (data.session) {
          console.log("Login successful, redirecting to homepage");
          router.push("/");
        } else {
          console.log("No session, redirecting to login page");
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Callback processing error:", error);
        router.push("/auth/login?error=callback_error");
      }
    };

    handleAuthCallback();
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
