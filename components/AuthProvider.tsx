"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
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

      // 如果已有会话，打印用户信息
      // if (session?.user) {
      //   printUserInfo(session.user, "初始会话");
      // }
    };

    getInitialSession();

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: string, session: Session | null) => {
        console.log("认证状态变化:", event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // 登录成功后打印用户信息
        if (event === "SIGNED_IN" && session?.user) {
          printUserInfo(session.user, "登录成功");
        }

        // 登出时打印信息
        if (event === "SIGNED_OUT") {
          console.log("用户已登出");
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
        console.error("❌ Google登录错误:", error);
        throw error;
      }

      console.log("✅ OAuth请求发送成功，等待重定向...");
    } catch (error) {
      console.error("❌ Google登录失败:", error);
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
        console.error("❌ 登出错误:", error);
        throw error;
      }
      console.log("✅ 登出成功");
    } catch (error) {
      console.error("❌ 登出失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
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
