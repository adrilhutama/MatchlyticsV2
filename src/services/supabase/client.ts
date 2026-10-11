/**
 * Supabase client singleton.
 *
 * Exported for use by the service layer (queries.ts) and React Query hooks.
 * In test environments (where env vars may be absent) a no-op client with
 * stub methods is returned so tests can still exercise sanitization logic.
 */

import { createClient } from "@supabase/supabase-js";

type ImportMetaEnv = Record<string, string | undefined>;

const env = typeof import.meta !== "undefined" ? ((import.meta as unknown as { env: ImportMetaEnv })).env : {};

const supabaseUrl = env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY ?? "";

let client;

if (supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey);
} else {
  /**
   * Final resolution methods return a Promise so that .await
   * on the chained result gives { data, error }.
   */
  const q = {
    // Chainable — keep building
    select: (...args: unknown[]) => q,
    order: (...args: unknown[]) => q,
    eq: (...args: unknown[]) => q,
    gte: (...args: unknown[]) => q,
    lte: (...args: unknown[]) => q,
    lt: (...args: unknown[]) => q,
    inFilter: (...args: unknown[]) => q,
    // Terminal — resolve to { data, error }
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: () => Promise.resolve({ data: null, error: null }),
    // Write ops
    upsert: () => Promise.resolve({ data: null, error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    throwOnError: () => q,
  };

  const stub = {
    from: () => q,
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signOut: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithOtp: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () =>
        ({ data: { subscription: { unsubscribe: () => {} } } } as unknown),
    },
  };
  // eslint-disable-next-line no-console
  console.warn(
    "[Matchlytics] Supabase client initialised without credentials — queries will return null. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
  client = stub as unknown as ReturnType<typeof createClient>;
}

export const supabase = client;
