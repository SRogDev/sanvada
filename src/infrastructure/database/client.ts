import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/shared/errors";
import { getEnv } from "@/shared/schemas/env";

// NOTE: typed Database generics land once `supabase gen types` runs against
// the live project (Phase 1 acceptance). Until then the untyped client is
// correct — table names are validated by the migration files, not by types.

function requireSupabaseEnv(): { url: string; anonKey: string } {
  const env = getEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new ValidationError(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example).",
    );
  }
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/** Client components. Never touches the service-role key. */
export function createBrowserSupabaseClient(): SupabaseClient {
  const { url, anonKey } = requireSupabaseEnv();
  return createBrowserClient(url, anonKey);
}

/**
 * Server components / route handlers / server actions.
 * Uses cookie-based session storage. Dynamically imports next/headers so
 * this module stays import-safe outside a request scope (e.g. tests).
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const { url, anonKey } = requireSupabaseEnv();
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        for (const { name, value, options } of toSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}
