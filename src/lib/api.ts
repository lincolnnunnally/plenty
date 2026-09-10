import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getDefaultPantry, isSteward } from "@/lib/db/queries";

export async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export function ok(extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, ...extra });
}

export function str(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user || !user.id) return { error: fail("Sign in first.", 401), user: null };
  try {
    const { ensureUserProfile } = await import("@/lib/db/queries");
    await ensureUserProfile(user);
  } catch (err) {
    return { error: fail(err instanceof Error ? err.message : "Could not open your profile.", 503), user: null };
  }
  return { error: null, user };
}

export async function pantryFromBody(body: Record<string, unknown>) {
  const pantry = await getDefaultPantry();
  if (!pantry) throw new Error("No pantry is set up yet.");
  const id = str(body.pantryId) || pantry.id;
  return { ...pantry, id: id || pantry.id };
}

export async function requireStewardFor(pantryId: string) {
  const { error, user } = await requireUser();
  if (error || !user) return { error: error || fail("Sign in first.", 401), user: null };
  const allowed = await isSteward(pantryId, user.id, user.role);
  if (!allowed) return { error: fail("Only a pantry steward can do that.", 403), user };
  return { error: null, user };
}
