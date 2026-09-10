import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDatabase, hasDatabase } from "@/lib/db/client";

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
      error: "DATABASE_URL not configured"
    };
  }

  const sql = getDatabase();
  const root = process.cwd();

  try {
    const schemaSql = await readFile(join(root, "src/lib/db/schema.sql"), "utf8");
    await sql.query(schemaSql);

    const seedSql = await readFile(join(root, "src/lib/db/seed.sql"), "utf8");
    await sql.query(seedSql);

    const rows = await sql<{ c: number; slug: string; status: string }>`
      select count(*)::int as c,
             (select slug from plenty_pantries order by created_at asc limit 1) as slug,
             (select status from plenty_pantries order by created_at asc limit 1) as status
      from plenty_pantries
    `;
    const pantryCount = Number(rows[0]?.c || 0);
    return {
      ok: true,
      database: true,
      schemaReady: true,
      seeded: pantryCount > 0,
      pantryCount,
      pantrySlug: rows[0]?.slug,
      pantryStatus: rows[0]?.status
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      database: true,
      schemaReady: false,
      seeded: false,
      pantryCount: 0,
      error: message
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
