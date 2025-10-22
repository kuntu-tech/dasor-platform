"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
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
    `📅 创建时间: ${new Date(user.created_at).toLocaleString("zh-CN")}`
  );
  console.log(
    `🕐 最后登录: ${
      user.last_sign_in_at
        ? new Date(user.last_sign_in_at).toLocaleString("zh-CN")
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

  useEffect(() => {
    console.log("AuthProvider useEffect");
    // 获取初始会话
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // 如果已有会话，打印用户信息并检查是否为新用户
      if (session?.user) {
        printUserInfo(session.user, "初始会话");
        await checkAndSaveNewUser(session.user, "初始会话");
      }
    };

    getInitialSession();

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
        }

        // 登出时打印信息并清理处理状态
        if (event === "SIGNED_OUT") {
          console.log("用户已登出");
          // 清理处理状态，允许下次登录时重新处理
          processedUsers.clear();
        }
      }
    );

    return () => subscription.unsubscribe();
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
      // 登录成功，状态会通过 onAuthStateChange 自动更新
    } catch (error) {
      console.log("❌ 邮箱登录失败:", error);
      setLoading(false);
      alert((error as any).message);
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
    setLoading(true);
    console.log("🚪 开始登出流程...");

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log("❌ 登出错误:", error);
        throw error;
      }
      console.log("✅ 登出成功");
    } catch (error) {
      console.log("❌ 登出失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
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
