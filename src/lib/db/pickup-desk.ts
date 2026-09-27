import { getSupabase } from "@/lib/db/client";
import { ensurePlentySchema } from "@/lib/db/ensure-schema";
import { schemaGap } from "@/lib/db/schema-gap";
import { listLocations } from "@/lib/db/queries";
import { rowsForEmailEvent } from "@/lib/resend-webhook";

async function sb() {
  const ensured = await ensurePlentySchema();
  if (!ensured.ok) throw new Error(ensured.error || "The pantry database is not ready yet.");
  return getSupabase();
}

export type PickupRouteRow = {
  id: string;
  pantry_id: string;
  kind: string;
  weekday: string;
  email: string;
  label: string;
};

export type PickupEmailRow = {
  id: string;
  pantry_id: string;
  pickup_id: string | null;
  to_email: string;
  kind: string;
  provider_id: string;
  status: string;
  error: string;
  created_at: string;
};

export async function listPickupRoutes(pantryId: string): Promise<{ ready: boolean; rows: PickupRouteRow[] }> {
  try {
    const client = await sb();
    const { data, error } = await client
      .from("plenty_pickup_routes")
      .select("id, pantry_id, kind, weekday, email, label")
      .eq("pantry_id", pantryId)
      .order("kind")
      .order("weekday");
    if (schemaGap(error)) return { ready: false, rows: [] };
    if (error) throw new Error(error.message);
    return { ready: true, rows: (data as PickupRouteRow[]) || [] };
  } catch (err) {
    if (schemaGap(err as { message?: string })) return { ready: false, rows: [] };
    throw err;
  }
}

export async function savePickupRoute(input: {
  pantryId: string;
  kind: string;
  weekday: string;
  email: string;
  label: string;
}): Promise<{ ready: boolean }> {
  const client = await sb();
  const { error } = await client.from("plenty_pickup_routes").insert({
    pantry_id: input.pantryId,
    kind: input.kind,
    weekday: input.weekday,
    email: input.email,
    label: input.label
  });
  if (schemaGap(error)) return { ready: false };
  if (error) throw new Error(error.message);
  return { ready: true };
}

export async function deletePickupRoute(pantryId: string, id: string): Promise<{ ready: boolean }> {
  const client = await sb();
  const { error } = await client.from("plenty_pickup_routes").delete().eq("pantry_id", pantryId).eq("id", id);
  if (schemaGap(error)) return { ready: false };
  if (error) throw new Error(error.message);
  return { ready: true };
}

export async function listPickupEmails(pantryId: string): Promise<{ ready: boolean; rows: PickupEmailRow[] }> {
  try {
    const client = await sb();
    const { data, error } = await client
      .from("plenty_pickup_emails")
      .select("id, pantry_id, pickup_id, to_email, kind, provider_id, status, error, created_at")
      .eq("pantry_id", pantryId)
      .order("created_at", { ascending: false })
      .limit(300);
    if (schemaGap(error)) return { ready: false, rows: [] };
    if (error) throw new Error(error.message);
    return { ready: true, rows: (data as PickupEmailRow[]) || [] };
  } catch (err) {
    if (schemaGap(err as { message?: string })) return { ready: false, rows: [] };
    throw err;
  }
}

export async function logPickupEmail(input: {
  pantryId: string;
  pickupId: string | null;
  to: string;
  kind: string;
  providerId: string;
  status: string;
  error: string;
}): Promise<void> {
  try {
    const client = await sb();
    const { error } = await client.from("plenty_pickup_emails").insert({
      pantry_id: input.pantryId,
      pickup_id: input.pickupId,
      to_email: input.to,
      kind: input.kind,
      provider_id: input.providerId,
      status: input.status,
      error: input.error.slice(0, 400)
    });
    if (error && !schemaGap(error)) console.error("[plenty] pickup email log failed");
  } catch {
    console.error("[plenty] pickup email log failed");
  }
}

export async function updatePickupEmailsByProvider(input: {
  providerId: string;
  status: "delivered" | "bounced" | "failed" | "delayed";
  recipients: string[];
  reason?: string;
}): Promise<number> {
  if (!input.providerId) return 0;
  try {
    const client = await sb();
    const { data, error } = await client
      .from("plenty_pickup_emails")
      .select("id, to_email, status")
      .eq("provider_id", input.providerId);
    if (schemaGap(error) || error) return 0;
    const rows = rowsForEmailEvent((data || []) as { id: string; to_email: string; status: string }[], input.status, input.recipients);
    const reason = input.status === "bounced" || input.status === "failed" ? (input.reason || input.status).slice(0, 400) : "";
    let updated = 0;
    for (const row of rows) {
      const { error: writeError } = await client.from("plenty_pickup_emails").update({ status: input.status, error: reason }).eq("id", row.id);
      if (!writeError) updated += 1;
    }
    return updated;
  } catch {
    return 0;
  }
}

export async function defaultPantryDestination(pantry: { id: string; name: string; address: string }): Promise<{ destLocationId: string | null; destNote: string }> {
  try {
    const locations = await listLocations(pantry.id);
    if (locations.length === 1) {
      const place = locations[0];
      const note = [place.name, place.address].filter(Boolean).join(" · ") || pantry.name;
      return { destLocationId: place.id, destNote: note };
    }
  } catch {
    /* Locations are optional. The pantry name still works as the destination. */
  }
  return { destLocationId: null, destNote: [pantry.name, pantry.address].filter(Boolean).join(" · ") };
}
