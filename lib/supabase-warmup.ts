/**
 * Server-side Supabase warmup utility
 * Prevents cold start timeouts by establishing connection early
 */

import { supabaseAdmin } from "./supabase";

let warmupInProgress = false;
let warmupCompleted = false;
let warmupPromise: Promise<void> | null = null;

/**
 * Warm up Supabase connection by making a lightweight API call
 * This should be called early in API routes to prevent cold start timeouts
 */
export async function warmupSupabase(): Promise<void> {
  // If already completed, return immediately
  if (warmupCompleted) {
    return;
  }

  // If warmup is in progress, wait for it
  if (warmupInProgress && warmupPromise) {
    try {
      await warmupPromise;
    } catch {
      // Ignore errors, just wait for completion
    }
    return;
  }

  // Start new warmup
  warmupInProgress = true;
  warmupPromise = (async () => {
    try {
      console.log("🔥 [Server] Warming up Supabase connection...");
      
      // Make a lightweight call to Supabase to establish connection
      // Using auth.getUser with a dummy token will fail but establish the connection
      // Alternatively, we can use a simple query
      const startTime = Date.now();
      
      // Try a simple operation that establishes the HTTP connection to Supabase
      // Using a query that will likely fail but establishes the connection pool
      // The actual query result doesn't matter - we just need to make a network call
      const queryPromise = supabaseAdmin
        .from("users")
        .select("id")
        .limit(0)
        .maybeSingle();
      
      const wrappedPromise = Promise.resolve(queryPromise)
        .then(() => ({ success: true }))
        .catch(() => ({ success: false })); // Even errors establish connection
      
      const warmupPromise = Promise.race([
        wrappedPromise,
        new Promise<{ success: boolean }>((resolve) =>
          setTimeout(() => resolve({ success: false }), 8000)
        ),
      ]);
      
      try {
        await warmupPromise;
        const elapsed = Date.now() - startTime;
        console.log(`✅ [Server] Supabase warmed up in ${elapsed}ms`);
        warmupCompleted = true;
      } catch (error: any) {
        // Even if it fails, the connection attempt helps warm up
        const elapsed = Date.now() - startTime;
        console.log(`⚠️ [Server] Supabase warmup completed in ${elapsed}ms (connection pool established)`);
        // Still mark as completed to avoid repeated attempts
        warmupCompleted = true;
      }
    } catch (error: any) {
      console.log("⚠️ [Server] Supabase warmup error (non-critical):", error.message);
      // Mark as completed even on error to avoid infinite retries
      warmupCompleted = true;
    } finally {
      warmupInProgress = false;
    }
  })();

  try {
    await warmupPromise;
  } catch {
    // Ignore errors
  }
}

/**
 * Reset warmup state (useful for testing or after errors)
 */
export function resetWarmup(): void {
  warmupInProgress = false;
  warmupCompleted = false;
  warmupPromise = null;
}

