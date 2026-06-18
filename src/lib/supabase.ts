import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { buildEnv } from "@/lib/build-env";

/**
 * Reads Supabase config from environment, falling back to build-time baked
 * values (for Amplify SSR bundles). Throws on misconfiguration so the
 * caller fails fast with a clear message.
 *
 * IMPORTANT: SUPABASE_SERVICE_ROLE_KEY bypasses RLS — never expose it to
 * the browser. This module must only be imported in server-side code.
 */
function getSupabaseConfig(): { url: string; serviceRoleKey: string } {
  const url =
    process.env.SUPABASE_URL || buildEnv.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || buildEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL in .env.local.",
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  return { url, serviceRoleKey };
}

let cachedClient: SupabaseClient | null = null;

/**
 * Returns a cached server-side Supabase client using the service role key.
 * Call this only from API routes and server actions — never from client
 * components.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!cachedClient) {
    const { url, serviceRoleKey } = getSupabaseConfig();
    cachedClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return cachedClient;
}
