import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { getDefaultPantry, getPantryById, getPantryBySlug, isSteward } from "@/lib/db/queries";

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
  const pantry = await resolvePantry(body);
  if (!pantry) throw new Error("No pantry is set up yet.");
  return pantry;
}

export async function resolvePantry(body?: Record<string, unknown> | null) {
  const slug = str(body?.pantrySlug);
  if (slug) {
    const bySlug = await getPantryBySlug(slug);
    if (bySlug) return bySlug;
  }
  const id = str(body?.pantryId);
  if (id) {
    const byId = await getPantryById(id);
    if (byId) return byId;
  }
  const jar = await cookies();
  const desk = jar.get("plenty_desk")?.value || "";
  if (desk) {
    const byDesk = await getPantryById(desk);
    if (byDesk) return byDesk;
  }
  return getDefaultPantry();
}

export async function requireStewardFor(pantryId: string) {
  const { error, user } = await requireUser();
  if (error || !user) return { error: error || fail("Sign in first.", 401), user: null };
  const allowed = await isSteward(pantryId, user.id, user.email);
  if (!allowed) return { error: fail("Only a pantry admin can do that.", 403), user };
  return { error: null, user };
}
