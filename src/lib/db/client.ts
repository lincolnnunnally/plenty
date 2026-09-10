import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Plenty uses the shared Life Produces Life Supabase the same way Immerse,
// Best Life, and Pulse do: URL + service-role key. Direct DATABASE_URL is not
// required. Tables are plenty_* in public.

function supabaseUrl() {
  return (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function hasDatabase() {
  return Boolean(supabaseUrl() && serviceKey());
}

let singleton: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!hasDatabase()) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  if (!singleton) {
    singleton = createClient(supabaseUrl(), serviceKey(), {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return singleton;
}
