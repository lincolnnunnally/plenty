import { NextResponse } from "next/server";
import { passwordSignInConfigured } from "@/auth";
import { getDatabase, hasDatabase } from "@/lib/db/client";
import { roleForEmail } from "@/lib/auth/roles";
import { addMembership, getDefaultPantry } from "@/lib/db/queries";
import { ensurePlentySchema } from "@/lib/db/ensure-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!passwordSignInConfigured()) {
    return NextResponse.json({ ok: false, message: "Sign-up isn't configured yet." }, { status: 503 });
  }

  let body: { name?: unknown; email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Send a JSON body." }, { status: 400 });
  }

  const name = String(body.name || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, message: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ ok: false, message: "Use a password of at least 8 characters." }, { status: 400 });
  }

  const base = process.env.SUPABASE_URL!.replace(/\/$/, "") + "/auth/v1";
  const apikey = process.env.SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const metadata = { ...(name ? { name } : {}), signup_source: "plenty" };

  const signupResponse = serviceKey
    ? await fetch(`${base}/admin/users`, {
        method: "POST",
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, email_confirm: true, user_metadata: metadata }),
        cache: "no-store"
      })
    : await fetch(`${base}/signup`, {
        method: "POST",
        headers: { apikey, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, data: metadata }),
        cache: "no-store"
      });
  const signupPayload = (await signupResponse.json().catch(() => ({}))) as {
    id?: string;
    user?: { id?: string };
    msg?: string;
    error_description?: string;
  };

  let userId = signupPayload.user?.id || signupPayload.id;

  if (!signupResponse.ok || !userId) {
    const grant = await fetch(`${base}/token?grant_type=password`, {
      method: "POST",
      headers: { apikey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store"
    });
    if (grant.ok) {
      const grantPayload = (await grant.json()) as { user?: { id?: string } };
      userId = grantPayload.user?.id;
    }
    if (!userId) {
      const detail = signupPayload.msg || signupPayload.error_description;
      const message = detail?.toLowerCase().includes("already")
        ? "That email already has an account. Sign in with your existing password."
        : detail || "Could not create the account. Please try again.";
      return NextResponse.json({ ok: false, message }, { status: 400 });
    }
  }

  if (hasDatabase()) {
    try {
      await ensurePlentySchema();
      const sql = getDatabase();
      const role = roleForEmail(email);
      await sql`
        insert into plenty_user_profiles (id, email, name, role)
        values (${userId}, ${email}, ${name || null}, ${role})
        on conflict (id) do update set
          email = excluded.email,
          name = coalesce(excluded.name, plenty_user_profiles.name),
          updated_at = now()
      `;
      if (role === "owner") {
        const pantry = await getDefaultPantry();
        if (pantry) await addMembership(pantry.id, userId, "steward");
      }
    } catch (error) {
      console.error("plenty_user_profiles upsert failed", error);
      return NextResponse.json(
        { ok: false, message: "Account created, but we could not finish your profile. Please try signing in again." },
        { status: 503 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
