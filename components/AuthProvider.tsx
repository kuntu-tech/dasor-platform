"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAuthDebugOverlay } from "@/hooks/useAuthDebugOverlay";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
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

// 打印用户信息的辅助函数
function printUserInfo(user: User, context: string) {
  console.log(`\n🎉 ${context} - 用户信息:`);
  console.log("=====================================");
  console.log(`📧 邮箱: ${user.email}`);
  console.log(`🆔 用户ID: ${user.id}`);
  console.log(`👤 显示名称: ${user.user_metadata?.full_name || "未设置"}`);
  console.log(`🖼️ 头像URL: ${user.user_metadata?.avatar_url || "未设置"}`);
  console.log(`📱 手机号: ${user.phone || "未设置"}`);
  console.log(`✅ 邮箱确认: ${user.email_confirmed_at ? "已确认" : "未确认"}`);
  console.log(
    `📅 创建时间: ${new Date(user.created_at).toLocaleString("en-US")}`
  );
  console.log(
    `🕐 最后登录: ${
      user.last_sign_in_at
        ? new Date(user.last_sign_in_at).toLocaleString("en-US")
        : "未记录"
    }`
  );
  console.log(`🔐 认证方式: ${user.app_metadata?.provider || "未知"}`);
  console.log(`🌐 用户元数据:`, user.user_metadata);
  console.log(`⚙️ 应用元数据:`, user.app_metadata);
  console.log("=====================================\n");
}

// 用户处理状态跟踪，避免重复处理
const processedUsers = new Set<string>();

// 本地缓存清理工具
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
    console.warn("清理本地缓存失败", error);
  }

  try {
    const authStorageKey = resolveAuthStorageKey();
    localStorage.removeItem(authStorageKey);
  } catch (error) {
    console.warn("清理 Supabase 会话缓存失败", error);
  }
}

// 检查并保存新用户信息到users表
async function checkAndSaveNewUser(user: User, context: string = "unknown") {
  try {
    // 避免重复处理同一个用户
    if (processedUsers.has(user.id)) {
      console.log(`⏭️ 用户 ${user.id} 已处理过，跳过 ${context}`);
      return;
    }

    console.log(`🔍 检查用户是否为新用户 (${context})...`);

    // 检查用户是否已存在于users表中
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.log("❌ 检查用户存在性时出错:", checkError);
      return;
    }

    // 如果用户已存在，只更新最后登录时间
    if (existingUser) {
      console.log("👤 用户已存在，更新最后登录时间");
      const { error: updateError } = await supabase
        .from("users")
        .update({
          last_login_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.log("❌ 更新用户登录时间失败:", updateError);
      } else {
        console.log("✅ 用户登录时间更新成功");
      }
    } else {
      // 如果是新用户，创建用户记录
      console.log("🆕 检测到新用户，开始创建用户记录...");

      const userData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar_url:
          user.user_metadata?.avatar_url || user.user_metadata?.picture,
        auth_provider: user.app_metadata?.provider || "email",
        last_login_at: new Date().toISOString(),
      };

      console.log("📝 新用户数据:", userData);

      const { error: insertError } = await supabase
        .from("users")
        .insert([userData]);

      if (insertError) {
        console.log("❌ 创建新用户失败:", insertError);
      } else {
        console.log("✅ 新用户创建成功！");
      }
    }

    // 标记用户已处理
    processedUsers.add(user.id);
  } catch (error) {
    console.log("❌ 检查并保存用户信息时发生错误:", error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
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
    // 获取初始会话
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.log("获取会话错误:", error);
        }

        if (!session) {
          console.log(
            "⚠️ 首次 getSession 返回为空，等待 Supabase 从 IndexedDB 恢复..."
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 500 + Math.random() * 500)
          );

          const {
            data: { session: retrySession },
            error: retryError,
          } = await supabase.auth.getSession();

          if (retryError) {
            console.log("二次获取会话错误:", retryError);
          }

          if (retrySession?.user) {
            console.log("✅ 二次尝试成功恢复会话");
            setSession(retrySession);
            setUser(retrySession.user);
            setLoading(false);
            printUserInfo(retrySession.user, "延迟恢复");
            await checkAndSaveNewUser(retrySession.user, "延迟恢复");
            return;
          }

          console.log("❌ 二次尝试仍为空，继续进入正常逻辑");
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // 如果已有会话，打印用户信息并检查是否为新用户
        if (session?.user) {
          printUserInfo(session.user, "初始会话");
          await checkAndSaveNewUser(session.user, "初始会话");
        }
      } catch (error) {
        console.log("获取初始会话异常:", error);
        // 即使出错也要设置 loading 为 false，避免页面一直加载
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

    // 添加超时保护，避免无限等待
    let loadingFinished = false;
    const timeoutId = setTimeout(() => {
      if (!loadingFinished) {
        console.warn("获取会话超时，强制设置 loading 为 false");
        setLoading(false);
      }
    }, 10000); // 10秒超时

    getInitialSession().then(() => {
      loadingFinished = true;
      clearTimeout(timeoutId);
    });

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      console.log("认证状态变化:", event, nextSession);

      if (event === "SIGNED_IN" && nextSession?.user) {
        if (signOutVerifyTimerRef.current) {
          clearTimeout(signOutVerifyTimerRef.current);
          signOutVerifyTimerRef.current = null;
        }

        setSession(nextSession);
        setUser(nextSession.user);
        setLoading(false);

        printUserInfo(nextSession.user, "登录成功");
        await checkAndSaveNewUser(nextSession.user, "登录成功");
        processedUsers.add(nextSession.user.id);
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

        const verifySignOut = async (attempt = 0) => {
          if (syncGuardRef.current === "signing-out") {
            console.log("检测到显式登出流程进行中，跳过延迟校验清理");
            setIsVerifyingSignOut(false);
            return;
          }

          const {
            data: { session: latestSession },
          } = await supabase.auth.getSession();

          if (latestSession?.user) {
            console.log("✅ 检测到会话仍然有效，恢复用户状态");
            setSession(latestSession);
            setUser(latestSession.user);
            processedUsers.add(latestSession.user.id);
            setLoading(false);
            syncGuardRef.current = "idle";
            signOutVerifyTimerRef.current = null;
            setIsVerifyingSignOut(false);
            return;
          }

          if (attempt < 3) {
            console.log(`第 ${attempt + 1} 次延迟校验无效，重试中...`);
            signOutVerifyTimerRef.current = window.setTimeout(
              () => verifySignOut(attempt + 1),
              700
            );
            return;
          }

          console.log("🧹 三次校验后仍无会话，执行本地清理");
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
          `跨标签同步：当前状态为 ${syncGuardRef.current}，暂不执行同步`
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
          console.warn("跨标签同步 Supabase 会话失败:", error);
          return;
        }

        if (latestSession?.user) {
          setSession(latestSession);
          setUser(latestSession.user);
          setLoading(false);
          processedUsers.add(latestSession.user.id);
        } else {
          console.log("跨标签同步：检测到会话已清除，执行本地登出逻辑");
          performLocalSignOut();
        }
      } catch (error) {
        console.warn("跨标签同步 Supabase 会话异常:", error);
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
        console.log("检测到 Supabase 认证存储变化，尝试解析存储值");
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
              "存储同步：currentSession 为空，触发 getSession 兜底检查"
            );
          } catch (error) {
            console.warn("解析 Supabase 认证存储失败，回退到 getSession", error);
          }
          void syncSessionFromStorage();
        } else {
          console.log(
            "存储同步：检测到认证信息被移除，触发 getSession 验证会话状态"
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
        console.log("检测到缓存键被移除，执行同步更新", event.key);
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
      console.log("🚫 页面卸载中，暂停跨标签同步清理逻辑");
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

  const signInWithGoogle = async () => {
    setLoading(true);
    console.log("🚀 开始Google登录流程...");
    console.log(`📍 重定向URL: ${window.location.origin}/auth/callback`);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        console.log("❌ Google登录错误:", error);
        throw error;
      }

      console.log("✅ OAuth请求发送成功，等待重定向...");
    } catch (error) {
      console.log("❌ Google登录失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    console.log("🔐 开始邮箱登录流程...");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log("❌ 邮箱登录错误:", error);
        setLoading(false);
        throw error;
      }

      console.log("✅ 邮箱登录成功:", data);

      // 登录成功后立即更新状态，确保状态同步
      // onAuthStateChange 会稍后触发，但为了确保及时响应，我们立即更新状态
      // 业务逻辑（如 checkAndSaveNewUser）由 onAuthStateChange 统一处理
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setLoading(false);
        // 注意：checkAndSaveNewUser 会在 onAuthStateChange 中调用，避免重复处理
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.log("❌ 邮箱登录失败:", error);
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
    console.log("📝 开始邮箱注册流程...");

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
        console.log("❌ 邮箱注册错误:", error);
        throw error;
      }

      console.log("✅ 邮箱注册成功:", data);

      if (data.user && !data.session) {
        console.log("📧 请检查邮箱验证链接");
      }
    } catch (error) {
      console.log("❌ 邮箱注册失败:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log("🚪 开始登出流程...");
    setLoading(true);

    const currentUserId = user?.id;
    syncGuardRef.current = "signing-out";
    setIsVerifyingSignOut(false);

    // 立即更新本地状态，避免界面长时间停留在受保护页面
    setSession(null);
    setUser(null);
    clearLocalAuthArtifacts(currentUserId);

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
          console.warn("⚠️ 清理本地 Supabase 会话失败:", localError);
        } else {
          console.log("🧹 本地 Supabase 会话已清理");
        }
      } catch (localError) {
        console.warn("⚠️ 清理本地 Supabase 会话异常:", localError);
      }
    };

    let signOutError: unknown = null;
    let didTimeout = false;

    try {
      const result = await Promise.race([
        supabase.auth.signOut({ scope: "global" }),
        new Promise<"timeout">((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn("⚠️ Supabase signOut 超时，继续本地登出流程");
            resolve("timeout");
          }, SIGN_OUT_REQUEST_TIMEOUT);
        }),
      ]);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (result !== "timeout") {
        if (result.error) {
          console.log("❌ 登出错误:", result.error);
          signOutError = result.error;
        }

        console.log("✅ 登出成功");
      } else {
        didTimeout = true;
        console.info(
          "[AuthProvider] Supabase signOut timed out; local session cleared and redirecting."
        );
      }
    } catch (error) {
      console.log("❌ 登出失败:", error);
      signOutError = error;
    } finally {
      clearTimeout(loadingFallbackTimer);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      await clearLocalSession();
      if (signOutError) {
        console.warn(
          "登出过程中出现异常，已完成本地清理，可忽略：",
          signOutError
        );
      }
      if (didTimeout) {
        supabase.auth
          .signOut({ scope: "global" })
          .catch((err) => console.warn("超时后再次尝试全局登出失败", err));
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
