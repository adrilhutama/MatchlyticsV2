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
  /** Helper: returns an object whose methods can be chained infinitely. */
  const chain = () => {
    const obj: Record<string, unknown> = {};
    const methods = ["select", "order", "eq", "gte", "lte", "lt", "inFilter", "single", "maybeSingle", "then", "upsert", "insert", "update", "delete"];
    for (const m of methods) {
      obj[m] = (...args: unknown[]) => {
        // If called as the final resolver (single/maybeSingle/then), return resolved promise
        if (m === "single" || m === "maybeSingle" || m === "then") {
          return Promise.resolve({ data: null, error: null });
        }
        return chain();
      };
    }
    return obj;
  };

  const stub = {
    from: () => chain(),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signOut: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithOtp: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  };
  // eslint-disable-next-line no-console
  console.warn(
    "[Matchlytics] Supabase client initialised without credentials — queries will return null. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
  client = stub as unknown as ReturnType<typeof createClient>;
}

export const supabase = client;
