import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key";

// Custom fetch with increased timeout for VPN/proxy scenarios
// Default timeout is usually 10 seconds, we increase it to 30 seconds
const createFetchWithTimeout = (timeoutMs: number = 30000) => {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  };
};

// Singleton pattern to avoid creating multiple client instances
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
      global: {
        // Use custom fetch with increased timeout for VPN/proxy scenarios
        fetch: createFetchWithTimeout(30000),
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
      global: {
        // Use custom fetch with increased timeout for VPN/proxy scenarios
        fetch: createFetchWithTimeout(30000),
      },
    });
  }
  return supabaseAdminInstance;
};

export const supabaseAdmin =
  typeof window === "undefined"
    ? createSupabaseAdminClient()
    : (undefined as unknown as SupabaseClient);
