"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
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

// Helper function to print user information
function printUserInfo(user: User, context: string) {
  console.log(`\n🎉 ${context} - User Information:`);
  console.log("=====================================");
  console.log(`📧 Email: ${user.email}`);
  console.log(`🆔 User ID: ${user.id}`);
  console.log(`👤 Display Name: ${user.user_metadata?.full_name || "Not set"}`);
  console.log(`🖼️ Avatar URL: ${user.user_metadata?.avatar_url || "Not set"}`);
  console.log(`📱 Phone: ${user.phone || "Not set"}`);
  console.log(
    `✅ Email Confirmed: ${
      user.email_confirmed_at ? "Confirmed" : "Not confirmed"
    }`
  );
  console.log(
    `📅 Created At: ${new Date(user.created_at).toLocaleString("en-US")}`
  );
  console.log(
    `🕐 Last Sign In: ${
      user.last_sign_in_at
        ? new Date(user.last_sign_in_at).toLocaleString("en-US")
        : "Not recorded"
    }`
  );
  console.log(`🔐 Auth Provider: ${user.app_metadata?.provider || "Unknown"}`);
  console.log(`🌐 User Metadata:`, user.user_metadata);
  console.log(`⚙️ App Metadata:`, user.app_metadata);
  console.log("=====================================\n");
}

// Track processed users to avoid duplicate processing
const processedUsers = new Set<string>();

// Local cache cleanup utility
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
  // @ts-expect-error storageKey is not in types but exists in runtime
  const runtimeKey = supabase.auth?.storageKey;
  if (runtimeKey) return runtimeKey as string;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    return "sb-auth-token";
  }
  try {
    const projectRef = new URL(url).host.split(".")[0];
    return `sb-${projectRef}-auth-token`;
  } catch {
    return "sb-auth-token";
  }
}

const SIGN_OUT_REQUEST_TIMEOUT = 4000;
const SIGN_OUT_LOADING_FALLBACK = 3000;

function clearLocalAuthArtifacts(userId?: string) {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove = [...CLEAR_CACHE_KEYS_BASE];
    if (userId) {
      keysToRemove.push(`cached_avatar_${userId}`);
    }
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn("Failed to clear local cache", error);
  }

  try {
    const authStorageKey = resolveAuthStorageKey();
    localStorage.removeItem(authStorageKey);
  } catch (error) {
    console.warn("Failed to clear Supabase session cache", error);
  }
}

// Check and save new user information to users table
async function checkAndSaveNewUser(user: User, context: string = "unknown") {
  try {
    // Avoid processing the same user multiple times
    if (processedUsers.has(user.id)) {
      console.log(`⏭️ User ${user.id} already processed, skipping ${context}`);
      return;
    }

    console.log(`🔍 Checking if user is new (${context})...`);

    // Check if user already exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.log("❌ Error checking user existence:", checkError);
      return;
    }

    // If user exists, only update last login time
    if (existingUser) {
      console.log("👤 User exists, updating last login time");
      const { error: updateError } = await supabase
        .from("users")
        .update({
          last_login_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.log("❌ Failed to update user login time:", updateError);
      } else {
        console.log("✅ User login time updated successfully");
      }
    } else {
      // If new user, create user record
      console.log("🆕 New user detected, creating user record...");

      const userData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar_url:
          user.user_metadata?.avatar_url || user.user_metadata?.picture,
        auth_provider: user.app_metadata?.provider || "email",
        last_login_at: new Date().toISOString(),
      };

      console.log("📝 New user data:", userData);

      const { error: insertError } = await supabase
        .from("users")
        .insert([userData]);

      if (insertError) {
        console.log("❌ Failed to create new user:", insertError);
      } else {
        console.log("✅ New user created successfully!");
      }
    }

    // Mark user as processed
    processedUsers.add(user.id);
  } catch (error) {
    console.log("❌ Error checking and saving user information:", error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionCheckResponse | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Subscription status cache key and expiry time (5 minutes)
  const SUBSCRIPTION_CACHE_KEY = (userId: string) =>
    `subscription_status_${userId}`;
  const SUBSCRIPTION_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  // Get subscription status from cache
  const getCachedSubscriptionStatus = useCallback(
    (userId: string): SubscriptionCheckResponse | null => {
      if (typeof window === "undefined") return null;

      try {
        const cacheKey = SUBSCRIPTION_CACHE_KEY(userId);
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // Check if expired
        if (now - timestamp > SUBSCRIPTION_CACHE_EXPIRY) {
          localStorage.removeItem(cacheKey);
          return null;
        }

        return data;
      } catch (e) {
        console.log("Failed to parse cached subscription status:", e);
        return null;
      }
    },
    []
  );

  // Save subscription status to cache
  const setCachedSubscriptionStatus = useCallback(
    (userId: string, data: SubscriptionCheckResponse) => {
      if (typeof window === "undefined") return;

      try {
        const cacheKey = SUBSCRIPTION_CACHE_KEY(userId);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        console.log("Failed to cache subscription status:", e);
      }
    },
    []
  );

  // Clear subscription status cache
  const clearSubscriptionCache = useCallback((userId: string) => {
    if (typeof window === "undefined") return;
    const cacheKey = SUBSCRIPTION_CACHE_KEY(userId);
    localStorage.removeItem(cacheKey);
  }, []);

  // Check subscription status (with cache)
  const checkSubscriptionStatus = useCallback(
    async (userId: string, useCache: boolean = true) => {
      // If using cache, check cache first
      if (useCache) {
        const cachedStatus = getCachedSubscriptionStatus(userId);
        if (cachedStatus) {
          setSubscriptionStatus(cachedStatus);
          // Refresh in background (without cache)
          checkSubscriptionStatus(userId, false).catch(console.error);
          return cachedStatus;
        }
      }

      // No cache or force refresh, fetch from API
      try {
        setSubscriptionLoading(true);
        const status = await fetchSubscriptionStatus(userId);
        setSubscriptionStatus(status);
        setCachedSubscriptionStatus(userId, status);
        return status;
      } catch (error) {
        console.error("Failed to fetch subscription status:", error);
        // If request fails, try using cache
        const cachedStatus = getCachedSubscriptionStatus(userId);
        if (cachedStatus) {
          setSubscriptionStatus(cachedStatus);
        }
        throw error;
      } finally {
        setSubscriptionLoading(false);
      }
    },
    [getCachedSubscriptionStatus, setCachedSubscriptionStatus]
  );

  // Refresh subscription status (force fetch from API)
  const refreshSubscriptionStatus = useCallback(async () => {
    if (!user?.id) return;
    await checkSubscriptionStatus(user.id, false);
  }, [user?.id, checkSubscriptionStatus]);
  const [isVerifyingSignOut, setIsVerifyingSignOut] = useState(false);

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
    console.log("AuthProvider useEffect");
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.log("Error getting session:", error);
        }

        if (!session) {
          console.log(
            "⚠️ First getSession returned empty, waiting for Supabase to recover from IndexedDB..."
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 500 + Math.random() * 500)
          );

          const {
            data: { session: retrySession },
            error: retryError,
          } = await supabase.auth.getSession();

          if (retryError) {
            console.log("Error getting session on retry:", retryError);
          }

          if (retrySession?.user) {
            console.log("✅ Successfully recovered session on retry");
            setSession(retrySession);
            setUser(retrySession.user);
            setLoading(false);
            printUserInfo(retrySession.user, "Delayed Recovery");
            await checkAndSaveNewUser(retrySession.user, "Delayed Recovery");
            return;
          }

          console.log(
            "❌ Retry still returned empty, continuing with normal logic"
          );
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // If session exists, print user info and check if new user
        if (session?.user) {
          printUserInfo(session.user, "Initial Session");
          await checkAndSaveNewUser(session.user, "Initial Session");
          // Automatically check subscription status
          checkSubscriptionStatus(session.user.id).catch(console.error);
        }
      } catch (error) {
        console.log("Exception getting initial session:", error);
        // Even if error occurs, set loading to false to avoid infinite loading
        setLoading(false);
      }
    };

    const performLocalSignOut = () => {
      processedUsers.clear();
      clearLocalAuthArtifacts(latestUserIdRef.current);
      setSession(null);
      setUser(null);
      setLoading(false);
    };

    // Add timeout protection to avoid infinite waiting
    let loadingFinished = false;
    const timeoutId = setTimeout(() => {
      if (!loadingFinished) {
        console.warn("Session fetch timeout, forcing loading to false");
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    getInitialSession().then(() => {
      loadingFinished = true;
      clearTimeout(timeoutId);
    });

    // Listen to auth state changes
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

        // After successful login, print user info and check if new user
        printUserInfo(nextSession.user, "Sign In Success");
        await checkAndSaveNewUser(nextSession.user, "Sign In Success");
        processedUsers.add(nextSession.user.id);
        // Automatically check subscription status
        checkSubscriptionStatus(nextSession.user.id).catch(console.error);
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
        if (signOutVerifyTimerRef.current) {
          clearTimeout(signOutVerifyTimerRef.current);
          signOutVerifyTimerRef.current = null;
        }

        // Clear processed state, allow reprocessing on next login
        processedUsers.clear();
        // Clear subscription status
        setSubscriptionStatus(null);
        const currentUserId = latestUserIdRef.current;
        if (currentUserId) {
          clearSubscriptionCache(currentUserId);
        }

        const verifySignOut = async (attempt = 0) => {
          if (syncGuardRef.current === "signing-out") {
            console.log(
              "Explicit sign out flow detected, skipping delayed verification cleanup"
            );
            setIsVerifyingSignOut(false);
            return;
          }

          const {
            data: { session: latestSession },
          } = await supabase.auth.getSession();

          if (latestSession?.user) {
            console.log(
              "✅ Session still valid detected, restoring user state"
            );
            setSession(latestSession);
            setUser(latestSession.user);
            processedUsers.add(latestSession.user.id);
            setLoading(false);
            syncGuardRef.current = "idle";
            signOutVerifyTimerRef.current = null;
            setIsVerifyingSignOut(false);
            // Restore subscription status check
            checkSubscriptionStatus(latestSession.user.id).catch(console.error);
            return;
          }

          if (attempt < 3) {
            console.log(
              `Attempt ${attempt + 1} delayed verification invalid, retrying...`
            );
            signOutVerifyTimerRef.current = window.setTimeout(
              () => verifySignOut(attempt + 1),
              700
            );
            return;
          }

          console.log(
            "🧹 After 3 verifications still no session, performing local cleanup"
          );
          performLocalSignOut();
          syncGuardRef.current = "idle";
          signOutVerifyTimerRef.current = null;
          setIsVerifyingSignOut(false);
        };

        syncGuardRef.current = "syncing";
        setIsVerifyingSignOut(true);
        verifySignOut();

        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      if (nextSession?.user) {
        processedUsers.add(nextSession.user.id);
      }
    });

    const syncSessionFromStorage = async () => {
      if (syncGuardRef.current !== "idle") {
        console.log(
          `Cross-tab sync: Current state is ${syncGuardRef.current}, skipping sync`
        );
        return;
      }

      syncGuardRef.current = "syncing";
      try {
        const {
          data: { session: latestSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.warn("Cross-tab sync Supabase session failed:", error);
          return;
        }

        if (latestSession?.user) {
          setSession(latestSession);
          setUser(latestSession.user);
          setLoading(false);
          processedUsers.add(latestSession.user.id);
        } else {
          console.log(
            "Cross-tab sync: Session cleared detected, performing local sign out"
          );
          performLocalSignOut();
        }
      } catch (error) {
        console.warn("Cross-tab sync Supabase session exception:", error);
      } finally {
        if (syncGuardRef.current === "syncing") {
          syncGuardRef.current = "idle";
        }
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key) return;
      const authStorageKey = resolveAuthStorageKey();
      if (event.key === authStorageKey) {
        console.log(
          "Supabase auth storage change detected, attempting to parse storage value"
        );
        if (event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue);
            const latestSession = parsed?.currentSession ?? null;

            if (latestSession?.user) {
              setSession(latestSession);
              setUser(latestSession.user);
              setLoading(false);
              processedUsers.add(latestSession.user.id);
              return;
            }
            console.log(
              "Storage sync: currentSession is empty, triggering getSession fallback check"
            );
          } catch (error) {
            console.warn(
              "Failed to parse Supabase auth storage, falling back to getSession",
              error
            );
          }
          void syncSessionFromStorage();
        } else {
          console.log(
            "Storage sync: Auth info removal detected, triggering getSession to verify session state"
          );
          void syncSessionFromStorage();
        }
        return;
      }
      if (
        CLEAR_CACHE_KEYS_BASE.includes(event.key) ||
        (latestUserIdRef.current &&
          event.key === `cached_avatar_${latestUserIdRef.current}`)
      ) {
        console.log(
          "Cache key removal detected, performing sync update",
          event.key
        );
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorage);
      if (signOutVerifyTimerRef.current) {
        clearTimeout(signOutVerifyTimerRef.current);
        signOutVerifyTimerRef.current = null;
      }
      setIsVerifyingSignOut(false);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log("🚫 Page unloading, pausing cross-tab sync cleanup logic");
      syncGuardRef.current = "signing-out";
      setTimeout(() => {
        if (syncGuardRef.current === "signing-out") {
          syncGuardRef.current = "idle";
        }
      }, 3000);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Check subscription status when user changes
  useEffect(() => {
    if (user?.id && !subscriptionStatus) {
      // If user exists but no subscription status, check subscription status
      checkSubscriptionStatus(user.id).catch(console.error);
    } else if (!user) {
      // If user doesn't exist, clear subscription status
      setSubscriptionStatus(null);
    }
  }, [user?.id, subscriptionStatus, checkSubscriptionStatus]);

  const signInWithGoogle = async () => {
    setLoading(true);
    console.log("🚀 Starting Google sign in flow...");
    console.log(`📍 Redirect URL: ${window.location.origin}/auth/callback`);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        console.log("❌ Google sign in error:", error);
        throw error;
      }

      console.log(
        "✅ OAuth request sent successfully, waiting for redirect..."
      );
    } catch (error) {
      console.log("❌ Google sign in failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    console.log("🔐 Starting email sign in flow...");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log("❌ Email sign in error:", error);
        setLoading(false);
        throw error;
      }

      console.log("✅ Email sign in successful:", data);

      // Immediately update state after successful login to ensure state sync
      // onAuthStateChange will trigger later, but we update state immediately for timely response
      // Business logic (like checkAndSaveNewUser) is handled uniformly by onAuthStateChange
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setLoading(false);
        // Note: checkAndSaveNewUser will be called in onAuthStateChange to avoid duplicate processing
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.log("❌ Email sign in failed:", error);
      setLoading(false);
      throw error;
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName?: string
  ) => {
    setLoading(true);
    console.log("📝 Starting email sign up flow...");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || "",
          },
        },
      });

      if (error) {
        console.log("❌ Email sign up error:", error);
        throw error;
      }

      console.log("✅ Email sign up successful:", data);

      if (data.user && !data.session) {
        console.log("📧 Please check your email for verification link");
      }
    } catch (error) {
      console.log("❌ Email sign up failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log("🚪 Starting sign out flow...");
    setLoading(true);

    const currentUserId = user?.id;
    syncGuardRef.current = "signing-out";
    setIsVerifyingSignOut(false);

    // Immediately update local state to avoid staying on protected pages for too long
    setSession(null);
    setUser(null);
    clearLocalAuthArtifacts(currentUserId);

    // Clear subscription status cache
    if (currentUserId) {
      clearSubscriptionCache(currentUserId);
    }
    // Clear subscription status
    setSubscriptionStatus(null);

    const loadingFallbackTimer = setTimeout(() => {
      console.info(
        "[AuthProvider] Sign out is taking longer than expected. Local session has already been cleared."
      );
      setLoading(false);
    }, SIGN_OUT_LOADING_FALLBACK);

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const clearLocalSession = async () => {
      try {
        const { error: localError } = await supabase.auth.signOut({
          scope: "local",
        });
        if (localError) {
          console.warn(
            "⚠️ Failed to clear local Supabase session:",
            localError
          );
        } else {
          console.log("🧹 Local Supabase session cleared");
        }
      } catch (localError) {
        console.warn(
          "⚠️ Exception clearing local Supabase session:",
          localError
        );
      }
    };

    let signOutError: unknown = null;
    let didTimeout = false;

    try {
      const result = await Promise.race([
        supabase.auth.signOut({ scope: "global" }),
        new Promise<"timeout">((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn(
              "⚠️ Supabase signOut timeout, continuing local sign out flow"
            );
            resolve("timeout");
          }, SIGN_OUT_REQUEST_TIMEOUT);
        }),
      ]);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (result !== "timeout") {
        if (result.error) {
          console.log("❌ Sign out error:", result.error);
          signOutError = result.error;
        }

        console.log("✅ Sign out successful");
      } else {
        didTimeout = true;
        console.info(
          "[AuthProvider] Supabase signOut timed out; local session cleared and redirecting."
        );
      }
    } catch (error) {
      console.log("❌ Sign out failed:", error);
      signOutError = error;
    } finally {
      clearTimeout(loadingFallbackTimer);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      await clearLocalSession();
      if (signOutError) {
        console.warn(
          "Exception occurred during sign out, local cleanup completed, can be ignored:",
          signOutError
        );
      }
      if (didTimeout) {
        supabase.auth
          .signOut({ scope: "global" })
          .catch((err) =>
            console.warn("Failed to retry global sign out after timeout", err)
          );
      }
      if ((didTimeout || signOutError) && typeof window !== "undefined") {
        window.location.replace("/auth/login");
      }
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
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
