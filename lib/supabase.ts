import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase配置
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key";

// 单例模式，避免创建多个客户端实例
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // @ts-expect-error broadcastChannel is supported at runtime but not typed yet
        broadcastChannel: "supabase-auth",
      },
    });
  }
  return supabaseInstance;
})();

const createSupabaseAdminClient = () => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdminInstance;
};

export const supabaseAdmin =
  typeof window === "undefined"
    ? createSupabaseAdminClient()
    : (undefined as unknown as SupabaseClient);
