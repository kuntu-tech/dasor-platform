"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAuthDebugOverlay } from "@/hooks/useAuthDebugOverlay";
import {
  fetchSubscriptionStatus,
  type SubscriptionCheckResponse,
} from "@/lib/subscription/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isVerifyingSignOut: boolean;
  subscriptionStatus: SubscriptionCheckResponse | null;
  subscriptionLoading: boolean;
  refreshSubscriptionStatus: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function printUserInfo(user: User, context: string) {
  console.log(`\n🎉 ${context} - 用户信息:`);
  console.log("=====================================");
  console.log(`📧 邮箱: ${user.email}`);
  console.log(`🆔 用户ID: ${user.id}`);
  console.log(`👤 显示名称: ${user.user_metadata?.full_name || "未设置"}`);
  console.log(`🖼️ 头像URL: ${user.user_metadata?.avatar_url || "未设置"}`);
  console.log(`📅 创建时间: ${new Date(user.created_at).toLocaleString("en-US")}`);
  console.log("=====================================\n");
}

const processedUsers = new Set<string>();
const CLEAR_CACHE_KEYS_BASE = [
  "run_result",
  "run_result_publish",
  "marketsData",
  "standalJson",
  "selectedProblems",
  "selectedQuestionsWithSql",
  "dbConnectionData",
  "originalTaskId",
];

function resolveAuthStorageKey() {
  // @ts-expect-error runtime key
  const runtimeKey = supabase.auth?.storageKey;
  if (runtimeKey) return runtimeKey as string;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const projectRef = new URL(url).host.split(".")[0];
    return `sb-${projectRef}-auth-token`;
  } catch {
    return "sb-auth-token";
  }
}

const SIGN_OUT_REQUEST_TIMEOUT = 4000;
const SIGN_OUT_LOADING_FALLBACK = 3000;

// ---------------------- 🔹 Subscription State ----------------------

const SUBSCRIPTION_CACHE_KEY = (userId: string) =>
  `subscription_status_${userId}`;
const SUBSCRIPTION_CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟

function useSubscriptionState(user: User | null) {
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionCheckResponse | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const getCached = useCallback((userId: string) => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(SUBSCRIPTION_CACHE_KEY(userId));
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > SUBSCRIPTION_CACHE_EXPIRY) {
        localStorage.removeItem(SUBSCRIPTION_CACHE_KEY(userId));
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }, []);

  const setCached = useCallback((userId: string, data: SubscriptionCheckResponse) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      SUBSCRIPTION_CACHE_KEY(userId),
      JSON.stringify({ data, timestamp: Date.now() })
    );
  }, []);

  const clearCache = useCallback((userId: string) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(SUBSCRIPTION_CACHE_KEY(userId));
  }, []);

  const checkSubscriptionStatus = useCallback(
    async (userId: string, useCache = true) => {
      if (useCache) {
        const cached = getCached(userId);
        if (cached) {
          setSubscriptionStatus(cached);
          checkSubscriptionStatus(userId, false).catch(console.error);
          return cached;
        }
      }
      try {
        setSubscriptionLoading(true);
        const status = await fetchSubscriptionStatus(userId);
        setSubscriptionStatus(status);
        setCached(userId, status);
        return status;
      } catch (err) {
        console.error("❌ 获取订阅状态失败:", err);
        const cached = getCached(userId);
        if (cached) setSubscriptionStatus(cached);
        throw err;
      } finally {
        setSubscriptionLoading(false);
      }
    },
    [getCached, setCached]
  );

  const refreshSubscriptionStatus = useCallback(async () => {
    if (!user?.id) return;
    await checkSubscriptionStatus(user.id, false);
  }, [user?.id, checkSubscriptionStatus]);

  return {
    subscriptionStatus,
    subscriptionLoading,
    refreshSubscriptionStatus,
    clearCache,
    checkSubscriptionStatus,
    setSubscriptionStatus,
  };
}

// ---------------------- 🔹 AuthProvider ----------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerifyingSignOut, setIsVerifyingSignOut] = useState(false);

  const {
    subscriptionStatus,
    subscriptionLoading,
    refreshSubscriptionStatus,
    clearCache: clearSubscriptionCache,
    checkSubscriptionStatus,
    setSubscriptionStatus,
  } = useSubscriptionState(user);

  const latestUserIdRef = useRef<string | undefined>(undefined);
  const syncGuardRef = useRef<"idle" | "syncing" | "signing-out">("idle");
  const signOutVerifyTimerRef = useRef<number | null>(null);

  const debugOverlayEnabled =
    typeof window !== "undefined" &&
    (process.env.NEXT_PUBLIC_ENABLE_AUTH_DEBUG === "true" ||
      window.localStorage.getItem("__auth_debug_overlay__") === "true");

  useAuthDebugOverlay({
    enabled: debugOverlayEnabled,
    loading,
    session,
    user,
    isVerifyingSignOut,
    syncGuardRef,
  });

  useEffect(() => {
    latestUserIdRef.current = user?.id;
  }, [user?.id]);

  // 🚀 初始化会话
  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        printUserInfo(data.session.user, "初始会话");
        await checkSubscriptionStatus(data.session.user.id);
      } else {
        console.log("等待 Supabase IndexedDB 恢复会话...");
        await new Promise((r) => setTimeout(r, 700));
        const retry = await supabase.auth.getSession();
        if (retry.data.session?.user) {
          setSession(retry.data.session);
          setUser(retry.data.session.user);
          await checkSubscriptionStatus(retry.data.session.user.id);
        }
      }
      setLoading(false);
    };
    initSession();
  }, [checkSubscriptionStatus]);

  // ✅ 状态变化监听
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      console.log("🔄 Auth State Changed:", event);
      if (event === "SIGNED_IN" && nextSession?.user) {
        setUser(nextSession.user);
        setSession(nextSession);
        await checkSubscriptionStatus(nextSession.user.id);
      }
      if (event === "SIGNED_OUT") {
        setUser(null);
        setSession(null);
        setSubscriptionStatus(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [checkSubscriptionStatus, setSubscriptionStatus]);

  // 🚪 登出逻辑
  const signOut = async () => {
    const userId = user?.id;
    setLoading(true);
    await supabase.auth.signOut({ scope: "global" });
    setUser(null);
    setSession(null);
    if (userId) clearSubscriptionCache(userId);
    setSubscriptionStatus(null);
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName?: string
  ) => {
    setLoading(true);
    await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName || "" } },
    });
    setLoading(false);
  };

  const value = {
    user,
    session,
    loading,
    isVerifyingSignOut,
    subscriptionStatus,
    subscriptionLoading,
    refreshSubscriptionStatus,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
