import { MutableRefObject, useEffect } from "react";
import type { Session, User } from "@supabase/supabase-js";

interface UseAuthDebugOverlayOptions {
  enabled: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  isVerifyingSignOut: boolean;
  syncGuardRef: MutableRefObject<"idle" | "syncing" | "signing-out">;
}

const OVERLAY_ID = "__auth_debug_overlay_dom__";

export function useAuthDebugOverlay({
  enabled,
  loading,
  session,
  user,
  syncGuardRef,
  isVerifyingSignOut,
}: UseAuthDebugOverlayOptions) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const removeOverlay = () => {
      const existing = document.getElementById(OVERLAY_ID);
      if (existing) {
        existing.remove();
      }
    };

    if (!enabled) {
      removeOverlay();
      return;
    }

    const container = document.createElement("div");
    container.id = OVERLAY_ID;
    container.style.position = "fixed";
    container.style.bottom = "12px";
    container.style.right = "12px";
    container.style.zIndex = "2147483647";
    container.style.padding = "10px 12px";
    container.style.borderRadius = "8px";
    container.style.fontSize = "12px";
    container.style.fontFamily = "monospace";
    container.style.background = "rgba(17, 24, 39, 0.85)";
    container.style.color = "#fef3c7";
    container.style.pointerEvents = "none";
    container.style.whiteSpace = "pre-wrap";
    container.style.maxWidth = "320px";
    container.style.lineHeight = "1.4";
    container.style.boxShadow = "0 10px 25px rgba(15, 23, 42, 0.35)";

    const render = () => {
      const lines = [
        "Auth Debug Overlay",
        "────────────────────",
        `syncGuard: ${syncGuardRef.current}`,
        `loading: ${loading}`,
        `verifyingSignOut: ${isVerifyingSignOut}`,
        `session: ${session ? "✅" : "❌"}`,
        `userId: ${user?.id ?? "-"}`,
        `email: ${user?.email ?? "-"}`,
        `refreshToken: ${session?.refresh_token ? "present" : "missing"}`,
        `expiresAt: ${
          session?.expires_at
            ? new Date(session.expires_at * 1000).toLocaleTimeString()
            : "-"
        }`,
        "",
        "Hide overlay:",
        "- Call localStorage.removeItem('__auth_debug_overlay__')",
        "- Or set NEXT_PUBLIC_ENABLE_AUTH_DEBUG != 'true'",
      ];
      container.textContent = lines.join("\n");
    };

    render();
    const interval = window.setInterval(render, 500);
    document.body.appendChild(container);

    return () => {
      window.clearInterval(interval);
      removeOverlay();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, loading, session, user, isVerifyingSignOut]);
}

