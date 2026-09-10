import { getSupabase } from "@/lib/db/client";
import type { Household, Pantry } from "@/lib/db/queries";

async function expressionId(key: string, name: string) {
  const sb = getSupabase();
  const { data } = await sb.from("expression").select("id").eq("key", key).maybeSingle();
  if (data?.id) return data.id as string;
  const { data: created, error } = await sb
    .from("expression")
    .insert({ key, name, group_type: "service", faith_posture: "faith-present" })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message || "Could not open the Plenty expression.");
  return created.id as string;
}

async function upsertPerson(input: { authUserId?: string | null; displayName: string }) {
  const sb = getSupabase();
  if (input.authUserId) {
    const { data: existing } = await sb.from("person").select("id").eq("auth_user_id", input.authUserId).maybeSingle();
    if (existing?.id) {
      await sb.from("person").update({ display_name: input.displayName }).eq("id", existing.id);
      return existing.id as string;
    }
  }
  const { data, error } = await sb
    .from("person")
    .insert({ auth_user_id: input.authUserId || null, display_name: input.displayName })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message || "Could not save the person.");
  return data.id as string;
}

async function upsertLplPeople(input: {
  authUserId?: string | null;
  displayName: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;
}) {
  const sb = getSupabase();
  const email = (input.email || "").trim().toLowerCase();
  const phone = (input.phone || "").replace(/\D/g, "");
  let row: { id: string } | null = null;
  if (input.authUserId) {
    const { data } = await sb.from("lpl_people").select("id").eq("auth_user_id", input.authUserId).maybeSingle();
    if (data?.id) row = data as { id: string };
  }
  if (!row && email) {
    const { data } = await sb.from("lpl_people").select("id").ilike("email", email).maybeSingle();
    if (data?.id) row = data as { id: string };
  }
  if (!row && phone.length >= 10) {
    const { data } = await sb.from("lpl_people").select("id, phone").not("phone", "is", null);
    const match = ((data as { id: string; phone: string }[]) || []).find((p) => (p.phone || "").replace(/\D/g, "").endsWith(phone.slice(-10)));
    if (match) row = match;
  }
  const payload = {
    auth_user_id: input.authUserId || null,
    full_name: input.displayName,
    preferred_name: input.displayName,
    email: email || null,
    phone: input.phone || null,
    location_city: input.city || null,
    location_state: input.state || null,
    location_zip: input.zip || null,
    updated_at: new Date().toISOString()
  };
  if (row) {
    await sb.from("lpl_people").update(payload).eq("id", row.id);
    return;
  }
  await sb.from("lpl_people").insert(payload);
}

/** One person, many expressions. Does not enroll them in a church. */
export async function shareHouseholdToEcosystem(input: {
  household: Household;
  pantry: Pantry;
  event: "registered" | "visit";
}): Promise<{ ok: boolean; error: string }> {
  try {
    const personId = await upsertPerson({
      authUserId: input.household.user_id,
      displayName: input.household.display_name
    });
    await upsertLplPeople({
      authUserId: input.household.user_id,
      displayName: input.household.display_name,
      email: input.household.email,
      phone: input.household.phone,
      city: input.household.city || input.pantry.city,
      state: input.household.state || input.pantry.state,
      zip: input.household.zip || input.pantry.zip
    });
    const plentyId = await expressionId("plenty", "Plenty");
    const sb = getSupabase();
    const { data: part } = await sb
      .from("participation")
      .select("id")
      .eq("person_id", personId)
      .eq("expression_id", plentyId)
      .maybeSingle();
    if (!part) {
      await sb.from("participation").insert({
        person_id: personId,
        expression_id: plentyId,
        role: "neighbor",
        status: "active"
      });
    }
    await sb.from("ecosystem_event").insert({
      person_id: personId,
      event_type: input.event === "visit" ? "plenty_visit" : "plenty_registered",
      event_source: "plenty",
      metadata: {
        pantry_id: input.pantry.id,
        pantry_slug: input.pantry.slug,
        household_id: input.household.id
      }
    });
    await sb.from("plenty_households").update({ person_id: personId, updated_at: new Date().toISOString() }).eq("id", input.household.id);
    return { ok: true, error: "" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not share this person to the shared directory." };
  }
}
