import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db/client";
import { ensurePlentySchema } from "@/lib/db/ensure-schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const ensured = await ensurePlentySchema();
  const status = ensured.ok ? 200 : 503;
  return NextResponse.json(
    {
      ok: ensured.ok,
      app: "Plenty",
      job: "Food for today. A next step toward the person you want to become.",
      database: ensured.database,
      schemaReady: ensured.schemaReady,
      seeded: ensured.seeded,
      pantryCount: ensured.pantryCount,
      pantrySlug: ensured.pantrySlug || null,
      pantryStatus: ensured.pantryStatus || null,
      ...(ensured.error ? { error: ensured.error } : {}),
      ...(!hasDatabase() && !ensured.error ? { error: "DATABASE_URL not configured" } : {})
    },
    { status }
  );
}
