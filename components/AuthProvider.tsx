"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
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
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionCheckResponse | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // 订阅状态缓存键和过期时间（5分钟）
  const SUBSCRIPTION_CACHE_KEY = (userId: string) =>
    `subscription_status_${userId}`;
  const SUBSCRIPTION_CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟

  // 从缓存获取订阅状态
  const getCachedSubscriptionStatus = useCallback(
    (userId: string): SubscriptionCheckResponse | null => {
      if (typeof window === "undefined") return null;

      try {
        const cacheKey = SUBSCRIPTION_CACHE_KEY(userId);
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // 检查是否过期
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

  // 保存订阅状态到缓存
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

  // 清除订阅状态缓存
  const clearSubscriptionCache = useCallback((userId: string) => {
    if (typeof window === "undefined") return;
    const cacheKey = SUBSCRIPTION_CACHE_KEY(userId);
    localStorage.removeItem(cacheKey);
  }, []);

  // 检查订阅状态（带缓存）
  const checkSubscriptionStatus = useCallback(
    async (userId: string, useCache: boolean = true) => {
      // 如果使用缓存，先检查缓存
      if (useCache) {
        const cachedStatus = getCachedSubscriptionStatus(userId);
        if (cachedStatus) {
          setSubscriptionStatus(cachedStatus);
          // 在后台刷新（不使用缓存）
          checkSubscriptionStatus(userId, false).catch(console.error);
          return cachedStatus;
        }
      }

      // 没有缓存或强制刷新，从API获取
      try {
        setSubscriptionLoading(true);
        const status = await fetchSubscriptionStatus(userId);
        setSubscriptionStatus(status);
        setCachedSubscriptionStatus(userId, status);
        return status;
      } catch (error) {
        console.error("Failed to fetch subscription status:", error);
        // 如果请求失败，尝试使用缓存
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

  // 刷新订阅状态（强制从API获取）
  const refreshSubscriptionStatus = useCallback(async () => {
    if (!user?.id) return;
    await checkSubscriptionStatus(user.id, false);
  }, [user?.id, checkSubscriptionStatus]);

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

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // 如果已有会话，打印用户信息并检查是否为新用户
        if (session?.user) {
          printUserInfo(session.user, "初始会话");
          await checkAndSaveNewUser(session.user, "初始会话");
          // 自动检查订阅状态
          checkSubscriptionStatus(session.user.id).catch(console.error);
        }
      } catch (error) {
        console.log("获取初始会话异常:", error);
        // 即使出错也要设置 loading 为 false，避免页面一直加载
        setLoading(false);
      }
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
    } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log("认证状态变化:", event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // 登录成功后打印用户信息并检查是否为新用户
        if (event === "SIGNED_IN" && session?.user) {
          printUserInfo(session.user, "登录成功");
          // 检查并保存新用户信息
          await checkAndSaveNewUser(session.user, "登录成功");
          // 自动检查订阅状态
          checkSubscriptionStatus(session.user.id).catch(console.error);
        }

        // 登出时打印信息并清理处理状态
        if (event === "SIGNED_OUT") {
          console.log("用户已登出");
          // 清理处理状态，允许下次登录时重新处理
          processedUsers.clear();
          // 清除订阅状态
          setSubscriptionStatus(null);
          if (user?.id) {
            clearSubscriptionCache(user.id);
          }
        }
      }
    );

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [checkSubscriptionStatus, clearSubscriptionCache]);

  // 当用户变化时，检查订阅状态
  useEffect(() => {
    if (user?.id && !subscriptionStatus) {
      // 如果用户存在但没有订阅状态，检查订阅状态
      checkSubscriptionStatus(user.id).catch(console.error);
    } else if (!user) {
      // 如果用户不存在，清除订阅状态
      setSubscriptionStatus(null);
    }
  }, [user?.id, subscriptionStatus, checkSubscriptionStatus]);

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

    // 立即更新本地状态，避免界面长时间停留在受保护页面
    setSession(null);
    setUser(null);

    if (typeof window !== "undefined") {
      try {
        const keysToRemove = [
          "run_result",
          "run_result_publish",
          "marketsData",
          "standalJson",
          "selectedProblems",
          "selectedQuestionsWithSql",
          "dbConnectionData",
          "originalTaskId",
        ];
        if (currentUserId) {
          keysToRemove.push(`cached_avatar_${currentUserId}`);
          // 清除订阅状态缓存
          clearSubscriptionCache(currentUserId);
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
        // 清除订阅状态
        setSubscriptionStatus(null);
      } catch (error) {
        console.warn("清理本地缓存失败", error);
      }
    }

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

    try {
      const result = await Promise.race([
        supabase.auth.signOut({ scope: "global" }),
        new Promise<"timeout">((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn("⚠️ Supabase signOut 超时，继续本地登出流程");
            resolve("timeout");
          }, 10000);
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
      }
    } catch (error) {
      console.log("❌ 登出失败:", error);
      signOutError = error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      await clearLocalSession();
      if (typeof window !== "undefined") {
        try {
          const authStorageKey =
            // @ts-expect-error storageKey is not in types but exists in runtime
            supabase.auth?.storageKey ??
            (() => {
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
            })();
          localStorage.removeItem(authStorageKey);
        } catch (error) {
          console.warn("清理 Supabase 会话缓存失败", error);
        }
      }
      if (signOutError) {
        console.warn(
          "登出过程中出现异常，已完成本地清理，可忽略：",
          signOutError
        );
      }
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
