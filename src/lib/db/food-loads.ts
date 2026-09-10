import { getSupabase } from "@/lib/db/client";
import { ensurePlentySchema } from "@/lib/db/ensure-schema";
import { addPickup, addShift, listAllies, listDistributions, type Ally } from "@/lib/db/queries";

async function sb() {
  const ensured = await ensurePlentySchema();
  if (!ensured.ok) throw new Error(ensured.error || "The pantry database is not ready yet.");
  return getSupabase();
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export const FOOD_CATEGORIES = ["dry", "refrigerated", "frozen", "produce"] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export type FoodLoadItem = {
  id: string;
  load_id: string;
  category: string;
  title: string;
  quantity: string;
  must_use_by: string | null;
  status: string;
};

export type FoodLoad = {
  id: string;
  pantry_id: string;
  partner_id: string;
  mode: string;
  leftover: boolean;
  status: string;
  pickup_at: string | null;
  hold_until: string | null;
  dest_ally_id: string | null;
  dest_note: string;
  route_reason: string;
  pickup_id: string | null;
  shift_id: string | null;
  notes: string;
  created_at: string;
  partner_name?: string;
  dest_name?: string;
  items?: FoodLoadItem[];
};

const LOAD_COLS =
  "id, pantry_id, partner_id, mode, leftover, status, pickup_at, hold_until, dest_ally_id, dest_note, route_reason, pickup_id, shift_id, notes, created_at";
const ITEM_COLS = "id, load_id, category, title, quantity, must_use_by, status";

export type RouteSuggestion = {
  ally: Ally | null;
  destNote: string;
  reason: string;
  humanFood: boolean;
};

function soonestDistribution(ally: Ally, distributions: { starts_at: string }[]) {
  if (ally.next_distribution_at) return new Date(ally.next_distribution_at).getTime();
  const next = distributions.map((d) => new Date(d.starts_at).getTime()).filter((t) => t >= Date.now() - 6 * 3600000).sort((a, b) => a - b)[0];
  return next || 0;
}

export function suggestRoute(input: {
  items: { category: string; must_use_by?: string | null }[];
  allies: Ally[];
  distributions: { starts_at: string }[];
  plentyName: string;
}): RouteSuggestion {
  const cats = new Set(input.items.map((i) => i.category));
  const produceUrgent = input.items.some((i) => {
    if (i.category !== "produce") return false;
    if (!i.must_use_by) return true;
    return new Date(i.must_use_by).getTime() - Date.now() < 36 * 3600000;
  });
  const cold = cats.has("frozen") || cats.has("refrigerated");
  const pantries = input.allies.filter(
    (a) =>
      (a.kind === "pantry" || a.kind === "church") &&
      a.relationship !== "paused" &&
      (a.wants_food || a.can_pickup || a.can_host_distribution || a.relationship === "we_supply" || a.relationship === "they_distribute")
  );
  const compost = input.allies.filter((a) => a.kind === "farm" || a.kind === "compost");

  function canTake(a: Ally) {
    if (cats.has("frozen") && !(a.accepts_frozen || a.has_freezer)) return false;
    if (cats.has("refrigerated") && !(a.accepts_refrigerated || a.has_freezer)) return false;
    if (cats.has("produce") && !a.accepts_produce && a.kind !== "pantry") return false;
    if (cats.has("dry") && !(a.accepts_dry || a.has_space || a.kind === "pantry")) return false;
    return true;
  }

  const able = pantries.filter(canTake);
  if (produceUrgent) {
    const today = able
      .map((a) => ({ a, t: soonestDistribution(a, input.distributions) }))
      .filter((x) => x.t && x.t - Date.now() < 36 * 3600000)
      .sort((x, y) => x.t - y.t);
    if (today[0]) {
      return {
        ally: today[0].a,
        destNote: today[0].a.name,
        reason: "Produce needs a distribution today or tomorrow.",
        humanFood: true
      };
    }
    if (compost[0]) {
      return {
        ally: compost[0],
        destNote: compost[0].name,
        reason: "No pantry can use this produce in time. Compost or farm.",
        humanFood: false
      };
    }
    return {
      ally: null,
      destNote: "No compost or farm listed yet",
      reason: "Produce is urgent and no pantry has a distribution soon. Add a farm or compost destination.",
      humanFood: false
    };
  }

  if (able[0]) {
    const ranked = [...able].sort((a, b) => {
      if (cold) return Number(b.has_freezer) - Number(a.has_freezer);
      return Number(b.can_pickup) - Number(a.can_pickup);
    });
    return {
      ally: ranked[0],
      destNote: ranked[0].name,
      reason: cold ? "Needs cold storage." : "Can take this load.",
      humanFood: true
    };
  }

  return {
    ally: null,
    destNote: input.plentyName,
    reason: "No allied pantry is set to take this yet. Plenty can take it if we have space, or add a destination.",
    humanFood: true
  };
}

export async function listFoodLoads(pantryId: string, opts?: { partnerId?: string; allyId?: string }): Promise<FoodLoad[]> {
  const client = await sb();
  let q = client.from("plenty_food_loads").select(LOAD_COLS).eq("pantry_id", pantryId).order("created_at", { ascending: false }).limit(80);
  if (opts?.partnerId) q = q.eq("partner_id", opts.partnerId);
  if (opts?.allyId) q = q.eq("dest_ally_id", opts.allyId);
  const { data, error } = await q;
  fail(error);
  const rows = (data as FoodLoad[]) || [];
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const { data: items } = await client.from("plenty_food_load_items").select(ITEM_COLS).in("load_id", ids);
  const byLoad = new Map<string, FoodLoadItem[]>();
  for (const item of (items as FoodLoadItem[]) || []) {
    const list = byLoad.get(item.load_id) || [];
    list.push(item);
    byLoad.set(item.load_id, list);
  }
  const allies = await listAllies(pantryId);
  const allyMap = new Map(allies.map((a) => [a.id, a.name]));
  const { data: partners } = await client.from("plenty_store_partners").select("id, name").eq("pantry_id", pantryId);
  const partnerMap = new Map(((partners as { id: string; name: string }[]) || []).map((p) => [p.id, p.name]));
  return rows.map((row) => ({
    ...row,
    items: byLoad.get(row.id) || [],
    partner_name: partnerMap.get(row.partner_id),
    dest_name: row.dest_ally_id ? allyMap.get(row.dest_ally_id) : row.dest_note || "Plenty"
  }));
}

export async function getFoodLoad(id: string): Promise<FoodLoad | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_food_loads").select(LOAD_COLS).eq("id", id).maybeSingle();
  fail(error);
  if (!data) return null;
  const { data: items } = await client.from("plenty_food_load_items").select(ITEM_COLS).eq("load_id", id);
  return { ...(data as FoodLoad), items: (items as FoodLoadItem[]) || [] };
}

export async function offerFoodLoad(input: {
  pantryId: string;
  partnerId: string;
  mode: string;
  leftover: boolean;
  pickupAt: string | null;
  holdUntil: string | null;
  notes: string;
  items: { category: string; title: string; quantity: string; mustUseBy: string | null }[];
  partnerName: string;
  partnerAddress: string;
  partnerPhone: string;
}): Promise<FoodLoad> {
  const client = await sb();
  const allies = await listAllies(input.pantryId);
  const distributions = await listDistributions(input.pantryId);
  const suggestion = suggestRoute({
    items: input.items,
    allies,
    distributions,
    plentyName: "Plenty"
  });
  const { data, error } = await client
    .from("plenty_food_loads")
    .insert({
      pantry_id: input.pantryId,
      partner_id: input.partnerId,
      mode: input.mode,
      leftover: input.leftover,
      status: "offered",
      pickup_at: input.pickupAt,
      hold_until: input.holdUntil,
      dest_ally_id: suggestion.ally?.id || null,
      dest_note: suggestion.destNote,
      route_reason: suggestion.reason,
      notes: input.notes
    })
    .select(LOAD_COLS)
    .single();
  fail(error);
  const load = data as FoodLoad;
  if (input.items.length) {
    const { error: iErr } = await client.from("plenty_food_load_items").insert(
      input.items.map((item) => ({
        load_id: load.id,
        category: item.category,
        title: item.title,
        quantity: item.quantity,
        must_use_by: item.mustUseBy,
        status: "pending"
      }))
    );
    fail(iErr);
  }
  return fulfillLoad(load.id, input.pantryId, {
    partnerName: input.partnerName,
    partnerAddress: input.partnerAddress,
    partnerPhone: input.partnerPhone
  });
}

export async function fulfillLoad(
  loadId: string,
  pantryId: string,
  store: { partnerName: string; partnerAddress: string; partnerPhone: string }
): Promise<FoodLoad> {
  const load = await getFoodLoad(loadId);
  if (!load || load.pantry_id !== pantryId) throw new Error("Load not found.");
  const when = load.pickup_at || load.hold_until || new Date(Date.now() + 2 * 3600000).toISOString();
  const pickup = await addPickup({
    pantryId,
    kind: load.leftover ? "store_collect" : "donation_pickup",
    scheduledFor: when,
    address: store.partnerAddress || store.partnerName,
    contactName: store.partnerName,
    contactPhone: store.partnerPhone,
    notes: `${load.leftover ? "Leftover collect" : "Store pickup"} · ${load.dest_note || "assign a destination"} · ${load.route_reason}`,
    createdBy: null,
    windowText: load.hold_until ? `Hold until ${new Date(load.hold_until).toLocaleString()}` : ""
  });
  const shift = await addShift({
    pantryId,
    title: load.leftover ? `Collect leftover at ${store.partnerName}` : `Pick up food at ${store.partnerName}`,
    role: "pickup",
    startsAt: when,
    endsAt: new Date(new Date(when).getTime() + 2 * 3600000).toISOString(),
    location: store.partnerAddress || store.partnerName,
    capacity: 3,
    notes: `${load.route_reason} Destination: ${load.dest_note || "Plenty"}. Cold chain if frozen or refrigerated.`,
    createdBy: null
  });
  const client = await sb();
  const { data, error } = await client
    .from("plenty_food_loads")
    .update({
      status: load.dest_ally_id || load.dest_note ? "scheduled" : "offered",
      pickup_id: pickup.id,
      shift_id: shift.id,
      pickup_at: when,
      updated_at: new Date().toISOString()
    })
    .eq("id", loadId)
    .select(LOAD_COLS)
    .single();
  fail(error);
  return { ...(data as FoodLoad), items: load.items };
}

export async function updateFoodLoad(
  id: string,
  pantryId: string,
  patch: {
    status?: string;
    destAllyId?: string | null;
    destNote?: string;
    routeReason?: string;
    pickupAt?: string | null;
    holdUntil?: string | null;
    notes?: string;
  }
): Promise<FoodLoad | null> {
  const client = await sb();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status != null) row.status = patch.status;
  if (patch.destAllyId !== undefined) row.dest_ally_id = patch.destAllyId;
  if (patch.destNote != null) row.dest_note = patch.destNote;
  if (patch.routeReason != null) row.route_reason = patch.routeReason;
  if (patch.pickupAt !== undefined) row.pickup_at = patch.pickupAt;
  if (patch.holdUntil !== undefined) row.hold_until = patch.holdUntil;
  if (patch.notes != null) row.notes = patch.notes;
  const { data, error } = await client.from("plenty_food_loads").update(row).eq("id", id).eq("pantry_id", pantryId).select(LOAD_COLS).maybeSingle();
  fail(error);
  return data as FoodLoad | null;
}

export async function listAllyMemberships(userId: string): Promise<{ ally_id: string; role: string }[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_ally_members").select("ally_id, role").eq("user_id", userId);
  fail(error);
  return (data as { ally_id: string; role: string }[]) || [];
}

export async function grantAllyOperator(allyId: string, userId: string): Promise<void> {
  const client = await sb();
  const { error } = await client.from("plenty_ally_members").upsert({ ally_id: allyId, user_id: userId, role: "operator" });
  fail(error);
}

export async function alliesForOperator(pantryId: string, userId: string): Promise<Ally[]> {
  const memberships = await listAllyMemberships(userId);
  if (!memberships.length) return [];
  const all = await listAllies(pantryId);
  const ids = new Set(memberships.map((m) => m.ally_id));
  return all.filter((a) => ids.has(a.id));
}
