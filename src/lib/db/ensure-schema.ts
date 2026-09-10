import { getSupabase, hasDatabase } from "@/lib/db/client";

let ensurePromise: Promise<EnsureResult> | null = null;

export type EnsureResult = {
  ok: boolean;
  database: boolean;
  schemaReady: boolean;
  seeded: boolean;
  pantryCount: number;
  pantrySlug?: string;
  pantryStatus?: string;
  error?: string;
};

async function runEnsure(): Promise<EnsureResult> {
  if (!hasDatabase()) {
    return {
      ok: false,
      database: false,
      schemaReady: false,
      seeded: false,
      pantryCount: 0,
      error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured"
    };
  }

  try {
    const sb = getSupabase();
    const { data, error, count } = await sb
      .from("plenty_pantries")
      .select("slug, status", { count: "exact" })
      .order("created_at", { ascending: true })
      .limit(1);
    if (error) {
      return {
        ok: false,
        database: true,
        schemaReady: false,
        seeded: false,
        pantryCount: 0,
        error: error.message
      };
    }
    const row = data?.[0];
    const pantryCount = count ?? data?.length ?? 0;
    return {
      ok: true,
      database: true,
      schemaReady: true,
      seeded: pantryCount > 0,
      pantryCount,
      pantrySlug: row?.slug,
      pantryStatus: row?.status
    };
  } catch (error) {
    return {
      ok: false,
      database: true,
      schemaReady: false,
      seeded: false,
      pantryCount: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export function ensurePlentySchema(): Promise<EnsureResult> {
  if (!ensurePromise) {
    ensurePromise = runEnsure().then((result) => {
      if (!result.ok) ensurePromise = null;
      return result;
    });
  }
  return ensurePromise;
}
