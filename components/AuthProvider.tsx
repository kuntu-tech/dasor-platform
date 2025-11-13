"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
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
  subscriptionStatus: SubscriptionCheckResponse | null;
  subscriptionLoading: boolean;
  refreshSubscriptionStatus: () => Promise<void>;
  isVerifyingSignOut: boolean;
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
  console.log(`\n🎉 ${context} - User Info:`);
  console.log("=====================================");
  console.log(`📧 Email: ${user.email}`);
  console.log(`🆔 ID: ${user.id}`);
  console.log(`👤 Name: ${user.user_metadata?.full_name || "N/A"}`);
  console.log(`🖼️ Avatar: ${user.user_metadata?.avatar_url || "N/A"}`);
  console.log(`✅ Email Confirmed: ${user.email_confirmed_at ? "Yes" : "No"}`);
  console.log(
    `📅 Created: ${new Date(user.created_at).toLocaleString("en-US")}`
  );
  console.log(
    `🕐 Last Sign-in: ${
      user.last_sign_in_at
        ? new Date(user.last_sign_in_at).toLocaleString("en-US")
        : "N/A"
    }`
  );
  console.log(`🔐 Provider: ${user.app_metadata?.provider || "unknown"}`);
  console.log(`🌐 User Metadata:`, user.user_metadata);
  console.log(`⚙️ App Metadata:`, user.app_metadata);
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
  // @ts-expect-error exists at runtime
  const runtimeKey = supabase.auth?.storageKey;
  if (runtimeKey) return runtimeKey as string;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "sb-auth-token";
  try {
    const projectRef = new URL(url).host.split(".")[0];
    return `sb-${projectRef}-auth-token`;
  } catch {
    return "sb-auth-token";
  }
}

const SIGN_OUT_REQUEST_TIMEOUT = 4000;

function clearLocalAuthArtifacts(userId?: string) {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove = [...CLEAR_CACHE_KEYS_BASE];
    if (userId) keysToRemove.push(`cached_avatar_${userId}`);
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn("Failed to clear local cache", e);
  }

  try {
    const key = resolveAuthStorageKey();
    localStorage.removeItem(key);
  } catch (e) {
    console.warn("Failed to clear Supabase auth cache", e);
  }
}

async function checkAndSaveNewUser(user: User, context = "unknown") {
  try {
    if (processedUsers.has(user.id)) {
      console.log(`⏭️ User ${user.id} already processed (${context})`);
      return;
    }

    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.log("Error checking user existence:", checkError);
      return;
    }

    if (existingUser) {
      const { error } = await supabase
        .from("users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) console.log("Failed to update login time:", error);
    } else {
      const newUser = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar_url:
          user.user_metadata?.avatar_url || user.user_metadata?.picture,
        auth_provider: user.app_metadata?.provider || "email",
        last_login_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("users").insert([newUser]);
      if (error) console.log("Failed to insert user:", error);
    }

    processedUsers.add(user.id);
  } catch (e) {
    console.log("Error saving user info:", e);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerifyingSignOut, setIsVerifyingSignOut] = useState(false);

  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionCheckResponse | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const SUBSCRIPTION_CACHE_KEY = (id: string) => `subscription_status_${id}`;
  const SUBSCRIPTION_CACHE_EXPIRY = 5 * 60 * 1000;

  const getCachedSubscription = useCallback((id: string) => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(SUBSCRIPTION_CACHE_KEY(id));
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > SUBSCRIPTION_CACHE_EXPIRY) {
        localStorage.removeItem(SUBSCRIPTION_CACHE_KEY(id));
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }, []);

  const setCachedSubscription = useCallback((id: string, data: any) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      SUBSCRIPTION_CACHE_KEY(id),
      JSON.stringify({ data, timestamp: Date.now() })
    );
  }, []);

  const clearSubscriptionCache = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(SUBSCRIPTION_CACHE_KEY(id));
  }, []);

  const checkSubscriptionStatus = useCallback(
    async (id: string, useCache = true) => {
      if (useCache) {
        const cached = getCachedSubscription(id);
        if (cached) {
          setSubscriptionStatus(cached);
          void checkSubscriptionStatus(id, false).catch(console.log);
          return cached;
        }
      }
      try {
        setSubscriptionLoading(true);
        const status = await fetchSubscriptionStatus(id);
        setSubscriptionStatus(status);
        setCachedSubscription(id, status);
        return status;
      } catch (e) {
        console.log("Failed to fetch subscription:", e);
        const cached = getCachedSubscription(id);
        if (cached) setSubscriptionStatus(cached);
        throw e;
      } finally {
        setSubscriptionLoading(false);
      }
    },
    [getCachedSubscription, setCachedSubscription]
  );

  const refreshSubscriptionStatus = useCallback(async () => {
    if (!user?.id) return;
    await checkSubscriptionStatus(user.id, false);
  }, [user?.id, checkSubscriptionStatus]);

  // Warm up Supabase connection to prevent first-time timeout
  const warmupSupabaseConnection = useCallback(async (accessToken: string) => {
    try {
      console.log("🔥 Warming up Supabase connection...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch("/api/users/self", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({}),
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log("✅ Supabase connection warmed up successfully");
      } else {
        console.log("⚠️ Supabase warmup returned non-OK status:", response.status);
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("⚠️ Supabase warmup timeout (non-critical)");
      } else {
        console.log("⚠️ Supabase warmup error (non-critical):", error.message);
      }
      // Don't throw - this is a non-critical optimization
    }
  }, []);

  const latestUserIdRef = useRef<string | undefined>(undefined);
  const syncGuardRef = useRef<"idle" | "syncing" | "signing-out">("idle");
  const signOutVerifyTimerRef = useRef<number | null>(null);

  useAuthDebugOverlay({
    enabled:
      process.env.NEXT_PUBLIC_ENABLE_AUTH_DEBUG === "true" ||
      (typeof window !== "undefined" &&
        window.localStorage.getItem("__auth_debug_overlay__") === "true"),
    loading,
    session,
    user,
    isVerifyingSignOut,
    syncGuardRef,
  });

  useEffect(() => {
    latestUserIdRef.current = user?.id ?? undefined;
  }, [user?.id]);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        console.log("🔄 [AuthProvider] Starting initial session fetch...");
        const startTime = Date.now();
        
        // Add timeout wrapper for getSession to handle VPN/proxy delays
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null }; error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error("getSession timeout")), 25000)
        );
        
        let sessionResult;
        try {
          sessionResult = await Promise.race([sessionPromise, timeoutPromise]) as any;
        } catch (timeoutError: any) {
          if (timeoutError.message === "getSession timeout") {
            console.warn("⚠️ [AuthProvider] getSession timeout, retrying...");
            // Retry once with a fresh attempt
            try {
              sessionResult = await Promise.race([
                supabase.auth.getSession(),
                new Promise<{ data: { session: null }; error: Error }>((_, reject) =>
                  setTimeout(() => reject(new Error("getSession retry timeout")), 25000)
                )
              ]) as any;
            } catch (retryError) {
              console.error("❌ [AuthProvider] getSession retry also failed:", retryError);
              throw retryError;
            }
          } else {
            throw timeoutError;
          }
        }
        
        const elapsed = Date.now() - startTime;
        console.log(`📊 [AuthProvider] getSession completed in ${elapsed}ms`);
        
        const { data: { session } } = sessionResult;
        
        if (!session) {
          console.log("⚠️ [AuthProvider] No session on first attempt, retrying after delay...");
          await new Promise((r) => setTimeout(r, 1000)); // Increased delay to 1 second
          const {
            data: { session: retry },
          } = await supabase.auth.getSession();
          if (retry?.user) {
            setSession(retry);
            setUser(retry.user);
            setLoading(false);
            printUserInfo(retry.user, "Recovered");
            await checkAndSaveNewUser(retry.user, "Recovered");
            void checkSubscriptionStatus(retry.user.id);
            return;
          }
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        console.log("🔄 Initial auth state loaded:", { session });
        if (session?.user) {
          printUserInfo(session.user, "Initial");
          await checkAndSaveNewUser(session.user, "Initial");
          void checkSubscriptionStatus(session.user.id);
        }
      } catch (e) {
        console.log("❌ [AuthProvider] Error initializing session:", e);
        setLoading(false);
        console.log("🔄 Initial auth state loaded:", { session: null });
      }
    };

    const performLocalSignOut = () => {
      if (syncGuardRef.current !== "idle") {
        console.log("Skipping redundant sign-out cleanup");
        return;
      }
      processedUsers.clear();
      clearLocalAuthArtifacts(latestUserIdRef.current);
      setSession(null);
      setUser(null);
      setLoading(false);
    };

    let loadingFinished = false;
    // Increased timeout to 30 seconds to handle VPN/proxy delays and cold starts
    const timeoutId = setTimeout(() => {
      if (!loadingFinished) {
        console.warn("Session fetch timeout, forcing loading to false");
        setLoading(false);
      }
    }, 30000);

    getInitialSession().then(() => {
      loadingFinished = true;
      clearTimeout(timeoutId);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      console.log("Auth state changed:", event, nextSession);

      if (event === "SIGNED_IN" && nextSession?.user) {
        if (signOutVerifyTimerRef.current) {
          clearTimeout(signOutVerifyTimerRef.current);
          signOutVerifyTimerRef.current = null;
        }

        setSession(nextSession);
        setUser(nextSession.user);
        setLoading(false);

        printUserInfo(nextSession.user, "Sign In Success");
        await checkAndSaveNewUser(nextSession.user, "Sign In Success");
        processedUsers.add(nextSession.user.id);
        checkSubscriptionStatus(nextSession.user.id).catch(console.log);
        
        // Warm up Supabase connection to prevent first-time timeout
        warmupSupabaseConnection(nextSession.access_token).catch((err) => {
          console.log("⚠️ Supabase warmup failed (non-critical):", err);
        });
        
        return;
      }

      if (event === "TOKEN_REFRESHED" && nextSession?.user) {
        setSession(nextSession);
        setUser(nextSession.user);
        setLoading(false);
        processedUsers.add(nextSession.user.id);
        return;
      }

      if (event === "SIGNED_OUT") {
        processedUsers.clear();
        setSubscriptionStatus(null);
        const currentUserId = latestUserIdRef.current;
        if (currentUserId) {
          clearSubscriptionCache(currentUserId);
          // Clear subscription check session flags
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(`subscription_checked_${currentUserId}`);
            sessionStorage.removeItem(
              `subscription_popup_shown_${currentUserId}`
            );
          }
        }
        performLocalSignOut();
        syncGuardRef.current = "idle";
        setIsVerifyingSignOut(false);
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      if (nextSession?.user) processedUsers.add(nextSession.user.id);
    });

    window.addEventListener("storage", (e) => {
      const authKey = resolveAuthStorageKey();
      if (e.key === authKey) getInitialSession();
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      if (signOutVerifyTimerRef.current)
        clearTimeout(signOutVerifyTimerRef.current);
      setIsVerifyingSignOut(false);
    };
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (error) {
      console.log("❌ Google sign in failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        await checkAndSaveNewUser(data.session.user, "Fallback Email SignIn");
      }
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName?: string
  ) => {
    setLoading(true);
    try {
      await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName || "" } },
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    const id = user?.id;
    processedUsers.clear();
    syncGuardRef.current = "signing-out";
    setIsVerifyingSignOut(false);
    setSession(null);
    setUser(null);
    clearLocalAuthArtifacts(id);
    if (id) {
      clearSubscriptionCache(id);
      // Clear subscription check session flags
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`subscription_checked_${id}`);
        sessionStorage.removeItem(`subscription_popup_shown_${id}`);
      }
    }
    setSubscriptionStatus(null);

    try {
      await Promise.race([
        supabase.auth.signOut({ scope: "global" }),
        new Promise((r) => setTimeout(r, SIGN_OUT_REQUEST_TIMEOUT, "timeout")),
      ]);
    } catch (e) {
      console.warn("Sign out failed:", e);
    } finally {
      setLoading(false);
      syncGuardRef.current = "idle";
      setIsVerifyingSignOut(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    subscriptionStatus,
    subscriptionLoading,
    refreshSubscriptionStatus,
    isVerifyingSignOut,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
