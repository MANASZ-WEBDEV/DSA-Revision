import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

const rawClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Safe mock client fallback to prevent crashes if Supabase environment variables are missing
export const supabase: SupabaseClient<any, "public", any> = rawClient || (new Proxy({}, {
  get(target, prop) {
    if (prop === "auth") {
      return {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: (cb: any) => {
          // Immediately trigger callback with null session to prevent loading hang
          cb("SIGNED_OUT", null);
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
        signInWithOAuth: async () => ({ error: new Error("Supabase is not configured") }),
        signInWithOtp: async () => ({ error: new Error("Supabase is not configured") }),
        signOut: async () => ({ error: null }),
      };
    }
    // Return dummy chains for db operations (e.g. supabase.from().upsert())
    const chainable = () => ({
      select: chainable,
      order: chainable,
      eq: chainable,
      upsert: async () => ({ error: null }),
      insert: async () => ({ error: null }),
      delete: async () => ({ error: null }),
      then: (resolve: any) => resolve({ data: [], error: null }),
    });
    return chainable;
  }
}) as any);

