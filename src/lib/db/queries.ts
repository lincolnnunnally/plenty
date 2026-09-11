import { DEFAULT_PANTRY_SLUG } from "@/lib/app-brand";
import { isSuperAdminEmail } from "@/lib/auth/roles";
import { getSupabase } from "@/lib/db/client";
import { ensurePlentySchema } from "@/lib/db/ensure-schema";
import { newHouseholdPass, normalizePass } from "@/lib/pass";

export type Pantry = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  zip: string;
  address: string;
  hours_text: string;
  about: string;
  phone: string;
  email: string;
  visit_style: string;
  status: string;
  source: string;
  receive_rules: string;
  donation_policy: string;
  donation_note: string;
  residency_rules: string;
  id_required: boolean;
  frequency_rules: string;
  giving_mode: string;
};

export type Household = {
  id: string;
  pantry_id: string;
  user_id: string | null;
  display_name: string;
  household_size: number;
  dietary_notes: string;
  phone: string;
  preferred_contact: string;
  notes: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  adults_count: number;
  children_count: number;
  family_notes: string;
  delivery_ok: boolean;
  porch_leave_ok: boolean;
  porch_notes: string;
  food_waiver_signed_at: string | null;
  food_waiver_version: string;
  pass_code: string;
  reach_ok: boolean;
};

export type InventoryItem = {
  id: string;
  pantry_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  available_this_week: boolean;
  we_need: boolean;
  low_at: number | null;
  notes: string;
  image_url: string;
};

export type Donation = {
  id: string;
  pantry_id: string;
  user_id: string | null;
  kind: string;
  title: string;
  description: string;
  quantity: string;
  amount_cents: number | null;
  available_when: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  status: string;
  steward_notes: string;
  created_at: string;
  received_at?: string | null;
  receipt_sent?: boolean;
  tenure?: string;
  asset_kind?: string;
};

export type Shift = {
  id: string;
  pantry_id: string;
  title: string;
  role: string;
  starts_at: string;
  ends_at: string | null;
  location: string;
  capacity: number | null;
  notes: string;
  status: string;
  signup_count: number;
};

export type Distribution = {
  id: string;
  pantry_id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  notes: string;
  status: string;
};

export type PathRow = {
  id: string;
  pantry_id: string;
  household_id: string | null;
  user_id: string;
  whats_hard: string;
  who_they_want_to_become: string;
  next_step: string;
  handoff_app: string;
  status: string;
  created_at: string;
};

export type Visit = {
  id: string;
  pantry_id: string;
  household_id: string;
  user_id: string | null;
  visited_at: string;
  items_summary: string;
  notes: string;
  location_id?: string | null;
};

export type Membership = {
  pantry_id: string;
  user_id: string;
  role: string;
};

export type VolunteerProfile = {
  id: string;
  pantry_id: string;
  user_id: string;
  roles: string[];
  has_vehicle: boolean;
  notes: string;
};

export type VolunteerRow = VolunteerProfile & { name: string | null; email: string | null; phone: string | null };

export type Promo = {
  id: string;
  pantry_id: string;
  channel: string;
  title: string;
  body: string;
  created_at: string;
};

export type PersonRow = {
  user_id: string;
  email: string | null;
  name: string | null;
  roles: string[];
};

const VOLUNTEER_ROLES = ["pickup", "setup", "serve", "delivery", "store_meet"] as const;
export type VolunteerRole = (typeof VOLUNTEER_ROLES)[number];

export function isVolunteerRole(value: string): value is VolunteerRole {
  return (VOLUNTEER_ROLES as readonly string[]).includes(value);
}

async function sb() {
  const ensured = await ensurePlentySchema();
  if (!ensured.ok) {
    throw new Error(ensured.error || "The pantry database is not ready yet.");
  }
  return getSupabase();
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function missingColumn(error: { message: string } | null, table: string, column: string) {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  return msg.includes(`${table}.${column} does not exist`.toLowerCase())
    || msg.includes(`column "${column.toLowerCase()}" of relation`)
    || (msg.includes(`could not find the '${column.toLowerCase()}' column`) && msg.includes(table.toLowerCase()));
}

function missingTable(error: { message: string } | null, table: string) {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  return msg.includes(`relation "${table.toLowerCase()}" does not exist`)
    || msg.includes(`could not find the table`) && msg.includes(table.toLowerCase());
}

function asRoles(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function getDefaultPantrySafe() {
  try {
    return await getDefaultPantry();
  } catch {
    return null;
  }
}

const PANTRY_COLS = "id, slug, name, city, state, zip, address, hours_text, about, phone, email, visit_style, status, source, receive_rules, donation_policy, donation_note, residency_rules, id_required, frequency_rules, giving_mode";
const HOUSEHOLD_COLS = "id, pantry_id, user_id, display_name, household_size, dietary_notes, phone, preferred_contact, notes, email, address, city, state, zip, adults_count, children_count, family_notes, delivery_ok, porch_leave_ok, porch_notes, food_waiver_signed_at, food_waiver_version, pass_code, reach_ok";
const INV_COLS = "id, pantry_id, name, category, quantity, unit, available_this_week, we_need, low_at, notes, image_url";
const DONATION_COLS = "id, pantry_id, user_id, kind, title, description, quantity, amount_cents, available_when, contact_name, contact_phone, contact_email, status, steward_notes, created_at, received_at, receipt_sent, tenure, asset_kind";
const VISIT_COLS = "id, pantry_id, household_id, user_id, visited_at, items_summary, notes, location_id";
const PATH_COLS = "id, pantry_id, household_id, user_id, whats_hard, who_they_want_to_become, next_step, handoff_app, status, created_at";
const SHIFT_COLS = "id, pantry_id, title, role, starts_at, ends_at, location, capacity, notes, status";
const DIST_COLS = "id, pantry_id, title, starts_at, ends_at, notes, status";
const PROMO_COLS = "id, pantry_id, channel, title, body, created_at";


export async function ensureUserProfile(user: { id: string; email: string; name: string; role: string }) {
  const client = await sb();
  const { data: existing } = await client.from("plenty_user_profiles").select("id, name").eq("id", user.id).maybeSingle();
  const role = isSuperAdminEmail(user.email) ? "owner" : user.role === "owner" || user.role === "admin" ? "member" : user.role || "member";
  const { error } = await client.from("plenty_user_profiles").upsert({
    id: user.id,
    email: user.email,
    name: user.name || existing?.name || null,
    role,
    updated_at: new Date().toISOString()
  });
  fail(error);
  await ensureOwnerMembership(user);
}

export async function userPhone(userId: string): Promise<string> {
  const client = await sb();
  const { data, error } = await client.from("plenty_user_profiles").select("phone").eq("id", userId).maybeSingle();
  fail(error);
  return (data?.phone as string) || "";
}

export async function setUserPhone(userId: string, phone: string): Promise<void> {
  const client = await sb();
  const { error } = await client
    .from("plenty_user_profiles")
    .update({ phone: phone.trim(), updated_at: new Date().toISOString() })
    .eq("id", userId);
  fail(error);
}

export async function ensureOwnerMembership(user: { id: string; email: string }) {
  if (isSuperAdminEmail(user.email)) {
    try {
      const pantry = await getDefaultPantry();
      if (pantry) await addMembership(pantry.id, user.id, "steward");
    } catch {
      // Profile still saved if pantry membership cannot be written yet.
    }
  }
}

export async function getPantryBySlug(slug: string): Promise<Pantry | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_pantries").select(PANTRY_COLS).eq("slug", slug).maybeSingle();
  fail(error);
  return (data as Pantry | null) ?? null;
}

export async function getDefaultPantry(): Promise<Pantry | null> {
  const bySlug = await getPantryBySlug(DEFAULT_PANTRY_SLUG);
  if (bySlug) return bySlug;
  const client = await sb();
  const { data, error } = await client.from("plenty_pantries").select(PANTRY_COLS).order("created_at", { ascending: true }).limit(1);
  fail(error);
  return (data?.[0] as Pantry | undefined) ?? null;
}

export async function listPantries(): Promise<Pantry[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_pantries").select(PANTRY_COLS).order("created_at", { ascending: true });
  fail(error);
  return (data as Pantry[]) || [];
}

export async function upsertPantry(
  id: string | null,
  fields: Partial<Pantry> & { name: string; slug: string; created_by?: string }
): Promise<Pantry> {
  const client = await sb();
  const payload = {
    name: fields.name,
    slug: fields.slug,
    city: fields.city ?? "",
    state: fields.state ?? "",
    zip: fields.zip ?? "",
    address: fields.address ?? "",
    hours_text: fields.hours_text ?? "",
    about: fields.about ?? "",
    phone: fields.phone ?? "",
    email: fields.email ?? "",
    visit_style: fields.visit_style ?? "walk_in",
    status: fields.status ?? "setup",
    receive_rules: fields.receive_rules ?? "",
    donation_policy: fields.donation_policy ?? "welcome",
    donation_note: fields.donation_note ?? "",
    residency_rules: fields.residency_rules ?? "",
    id_required: Boolean(fields.id_required),
    frequency_rules: fields.frequency_rules ?? "",
    giving_mode: fields.giving_mode === "uug" ? "uug" : fields.giving_mode === "own" ? "own" : undefined,
    updated_at: new Date().toISOString()
  };
  const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));
  if (id) {
    const { data, error } = await client.from("plenty_pantries").update(clean).eq("id", id).select(PANTRY_COLS).single();
    fail(error);
    if (!data) throw new Error("Pantry not found.");
    return data as Pantry;
  }
  const { data, error } = await client.from("plenty_pantries").insert({ ...clean, giving_mode: fields.giving_mode === "own" ? "own" : "uug", created_by: fields.created_by ?? null }).select(PANTRY_COLS).single();
  fail(error);
  return data as Pantry;
}

export async function addMembership(pantryId: string, userId: string, role: string) {
  const client = await sb();
  const { error } = await client.from("plenty_memberships").upsert(
    { pantry_id: pantryId, user_id: userId, role },
    { onConflict: "pantry_id,user_id,role", ignoreDuplicates: true }
  );
  fail(error);
}

export async function membershipsForUser(userId: string): Promise<Membership[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_memberships").select("pantry_id, user_id, role").eq("user_id", userId);
  fail(error);
  return (data as Membership[]) || [];
}

export async function isSteward(pantryId: string, userId: string, email?: string | null) {
  if (isSuperAdminEmail(email)) return true;
  const client = await sb();
  if (userId) {
    const { data: profile } = await client.from("plenty_user_profiles").select("email").eq("id", userId).maybeSingle();
    if (isSuperAdminEmail(profile?.email)) return true;
  }
  const { data, error } = await client
    .from("plenty_memberships")
    .select("role")
    .eq("pantry_id", pantryId)
    .eq("user_id", userId)
    .in("role", ["steward", "admin"]);
  fail(error);
  return (data || []).length > 0;
}

export async function listStewardPantries(userId: string, email?: string | null): Promise<Pantry[]> {
  const all = await listPantries();
  if (isSuperAdminEmail(email)) return all;
  const memberships = await membershipsForUser(userId);
  const ids = new Set(memberships.filter((m) => m.role === "steward" || m.role === "admin").map((m) => m.pantry_id));
  return all.filter((p) => ids.has(p.id));
}

export async function getPantryById(id: string): Promise<Pantry | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_pantries").select(PANTRY_COLS).eq("id", id).maybeSingle();
  fail(error);
  return (data as Pantry | null) ?? null;
}

export async function getSetting(key: string): Promise<string> {
  const client = await sb();
  const { data, error } = await client.from("plenty_settings").select("value").eq("key", key).maybeSingle();
  fail(error);
  return (data?.value as string) || "";
}

export async function setSetting(key: string, value: string): Promise<void> {
  const client = await sb();
  const { error } = await client.from("plenty_settings").upsert({
    key,
    value,
    updated_at: new Date().toISOString()
  });
  fail(error);
}

export async function removeMembership(pantryId: string, userId: string, role: string) {
  const client = await sb();
  const { error } = await client.from("plenty_memberships").delete().eq("pantry_id", pantryId).eq("user_id", userId).eq("role", role);
  fail(error);
}

export async function listPeople(pantryId: string): Promise<PersonRow[]> {
  const client = await sb();
  const { data: memberships, error } = await client.from("plenty_memberships").select("user_id, role").eq("pantry_id", pantryId);
  fail(error);
  const ids = [...new Set((memberships || []).map((m) => m.user_id))];
  const { data: profiles, error: pErr } = ids.length
    ? await client.from("plenty_user_profiles").select("id, email, name").in("id", ids)
    : { data: [], error: null };
  fail(pErr);
  const byId = new Map((profiles || []).map((p) => [p.id, p]));
  const grouped = new Map<string, PersonRow>();
  for (const m of memberships || []) {
    const row = grouped.get(m.user_id) || {
      user_id: m.user_id,
      email: byId.get(m.user_id)?.email ?? null,
      name: byId.get(m.user_id)?.name ?? null,
      roles: [] as string[]
    };
    row.roles.push(String(m.role));
    grouped.set(m.user_id, row);
  }
  return [...grouped.values()].sort((a, b) => (a.name || a.email || "").localeCompare(b.name || b.email || ""));
}

export async function upsertHousehold(input: {
  pantryId: string;
  userId: string;
  displayName: string;
  householdSize: number;
  dietaryNotes: string;
  phone: string;
  preferredContact: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  adultsCount?: number;
  childrenCount?: number;
  familyNotes?: string;
  deliveryOk?: boolean;
  porchLeaveOk?: boolean;
  porchNotes?: string;
  reachOk?: boolean;
  notes?: string;
}): Promise<Household> {
  const client = await sb();
  const row: Record<string, unknown> = {
    pantry_id: input.pantryId,
    user_id: input.userId,
    display_name: input.displayName,
    household_size: input.householdSize,
    dietary_notes: input.dietaryNotes,
    phone: input.phone,
    preferred_contact: input.preferredContact,
    email: input.email ?? "",
    address: input.address ?? "",
    city: input.city ?? "",
    state: input.state ?? "",
    zip: input.zip ?? "",
    adults_count: input.adultsCount ?? 1,
    children_count: input.childrenCount ?? 0,
    family_notes: input.familyNotes ?? "",
    delivery_ok: Boolean(input.deliveryOk),
    porch_leave_ok: Boolean(input.porchLeaveOk),
    porch_notes: input.porchNotes ?? "",
    reach_ok: Boolean(input.reachOk),
    updated_at: new Date().toISOString()
  };
  if (input.notes != null) row.notes = input.notes;
  const { data, error } = await client.from("plenty_households").upsert(row, { onConflict: "pantry_id,user_id" }).select(HOUSEHOLD_COLS).single();
  fail(error);
  await addMembership(input.pantryId, input.userId, "neighbor");
  return ensureHouseholdPass(data as Household);
}

export async function householdForUser(pantryId: string, userId: string): Promise<Household | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_households").select(HOUSEHOLD_COLS).eq("pantry_id", pantryId).eq("user_id", userId).maybeSingle();
  fail(error);
  return data ? ensureHouseholdPass(data as Household) : null;
}

export async function listHouseholds(pantryId: string): Promise<Household[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_households").select(HOUSEHOLD_COLS).eq("pantry_id", pantryId).order("display_name");
  fail(error);
  return (data as Household[]) || [];
}

function phoneDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function findHouseholdByPhone(pantryId: string, phone: string): Promise<Household | null> {
  const want = phoneDigits(phone);
  if (want.length < 7) return null;
  const rows = await listHouseholds(pantryId);
  return rows.find((h) => phoneDigits(h.phone) === want || phoneDigits(h.phone).endsWith(want.slice(-10))) || null;
}

export async function searchHouseholds(pantryId: string, query: string): Promise<Household[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const rows = await listHouseholds(pantryId);
  const digits = phoneDigits(q);
  return rows
    .filter((h) => {
      if (h.display_name.toLowerCase().includes(q)) return true;
      if (digits.length >= 4 && phoneDigits(h.phone).includes(digits)) return true;
      return false;
    })
    .slice(0, 20);
}

export async function addWalkInHousehold(input: {
  pantryId: string;
  displayName: string;
  householdSize: number;
  phone: string;
  notes?: string;
}): Promise<Household> {
  if (input.phone) {
    const existing = await findHouseholdByPhone(input.pantryId, input.phone);
    if (existing) {
      const client = await sb();
      const { data, error } = await client
        .from("plenty_households")
        .update({
          display_name: input.displayName || existing.display_name,
          household_size: input.householdSize || existing.household_size,
          notes: input.notes ?? existing.notes,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id)
        .select(HOUSEHOLD_COLS)
        .single();
      fail(error);
      return data as Household;
    }
  }
  const client = await sb();
  const { data, error } = await client
    .from("plenty_households")
    .insert({
      pantry_id: input.pantryId,
      user_id: null,
      display_name: input.displayName,
      household_size: input.householdSize,
      phone: input.phone,
      preferred_contact: input.phone ? "phone" : "in_person",
      notes: input.notes || "Walk-in at the line",
      pass_code: newHouseholdPass()
    })
    .select(HOUSEHOLD_COLS)
    .single();
  fail(error);
  return ensureHouseholdPass(data as Household);
}

export async function getHousehold(id: string, pantryId: string): Promise<Household | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_households").select(HOUSEHOLD_COLS).eq("id", id).eq("pantry_id", pantryId).maybeSingle();
  fail(error);
  return data ? ensureHouseholdPass(data as Household) : null;
}

export async function ensureHouseholdPass(household: Household): Promise<Household> {
  if (household.pass_code) return household;
  const client = await sb();
  for (let i = 0; i < 5; i++) {
    const code = newHouseholdPass();
    const { data, error } = await client
      .from("plenty_households")
      .update({ pass_code: code, updated_at: new Date().toISOString() })
      .eq("id", household.id)
      .select(HOUSEHOLD_COLS)
      .maybeSingle();
    if (!error && data) return data as Household;
  }
  return household;
}

export async function householdByPass(code: string): Promise<Household | null> {
  const pass = normalizePass(code);
  if (!pass) return null;
  const client = await sb();
  const { data, error } = await client.from("plenty_households").select(HOUSEHOLD_COLS).eq("pass_code", pass).maybeSingle();
  fail(error);
  return data ? ensureHouseholdPass(data as Household) : null;
}

export async function unusedHandling(householdId: string): Promise<Contribution[]> {
  const client = await sb();
  const { data, error } = await client
    .from("plenty_contributions")
    .select(CONTRIB_COLS)
    .eq("household_id", householdId)
    .eq("waived", false)
    .is("visit_id", null)
    .gt("amount_cents", 0)
    .in("status", ["received", "pledged"])
    .order("created_at", { ascending: true });
  fail(error);
  return (data as Contribution[]) || [];
}

export async function applyHandlingToVisit(householdId: string, visitId: string): Promise<Contribution | null> {
  const unused = await unusedHandling(householdId);
  const credit = unused[0];
  if (!credit) return null;
  const client = await sb();
  const { data, error } = await client
    .from("plenty_contributions")
    .update({ visit_id: visitId, notes: `${credit.notes || ""} applied at pickup`.trim() })
    .eq("id", credit.id)
    .is("visit_id", null)
    .select(CONTRIB_COLS)
    .maybeSingle();
  fail(error);
  return (data as Contribution | null) ?? null;
}

export async function openDeliveriesForHousehold(pantryId: string, householdId: string): Promise<Pickup[]> {
  const rows = await listPickups(pantryId);
  return rows.filter((p) => p.household_id === householdId && p.kind === "household_delivery" && p.status !== "done" && p.status !== "cancelled");
}

export async function listInventory(pantryId: string): Promise<InventoryItem[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_inventory").select(INV_COLS).eq("pantry_id", pantryId).order("name");
  fail(error);
  return ((data as InventoryItem[]) || []).sort((a, b) => Number(b.we_need) - Number(a.we_need) || a.name.localeCompare(b.name));
}

export async function availableThisWeek(pantryId: string): Promise<InventoryItem[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_inventory").select(INV_COLS).eq("pantry_id", pantryId).eq("available_this_week", true).eq("we_need", false).order("category").order("name");
  fail(error);
  return (data as InventoryItem[]) || [];
}

export async function weNeedList(pantryId: string): Promise<InventoryItem[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_inventory").select(INV_COLS).eq("pantry_id", pantryId).eq("we_need", true).order("name");
  fail(error);
  return (data as InventoryItem[]) || [];
}

export async function addInventory(input: {
  pantryId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  availableThisWeek: boolean;
  weNeed: boolean;
  lowAt: number | null;
  notes: string;
  imageUrl?: string;
}): Promise<InventoryItem> {
  const client = await sb();
  const { data, error } = await client.from("plenty_inventory").insert({
    pantry_id: input.pantryId,
    name: input.name,
    category: input.category,
    quantity: input.quantity,
    unit: input.unit,
    available_this_week: input.availableThisWeek,
    we_need: input.weNeed,
    low_at: input.lowAt,
    notes: input.notes,
    image_url: input.imageUrl || ""
  }).select(INV_COLS).single();
  fail(error);
  return data as InventoryItem;
}

export async function updateInventory(
  id: string,
  fields: { quantity?: number; availableThisWeek?: boolean; weNeed?: boolean; imageUrl?: string }
): Promise<InventoryItem | null> {
  const client = await sb();
  const { data: current, error: cErr } = await client.from("plenty_inventory").select(INV_COLS).eq("id", id).maybeSingle();
  fail(cErr);
  if (!current) return null;
  const { data, error } = await client.from("plenty_inventory").update({
    quantity: fields.quantity ?? current.quantity,
    available_this_week: fields.availableThisWeek ?? current.available_this_week,
    we_need: fields.weNeed ?? current.we_need,
    image_url: fields.imageUrl ?? current.image_url,
    updated_at: new Date().toISOString()
  }).eq("id", id).select(INV_COLS).single();
  fail(error);
  return data as InventoryItem;
}

export async function recordVisit(input: {
  pantryId: string;
  householdId: string;
  userId: string | null;
  itemsSummary: string;
  notes: string;
  locationId?: string | null;
}): Promise<Visit> {
  const client = await sb();
  const { data, error } = await client.from("plenty_visits").insert({
    pantry_id: input.pantryId,
    household_id: input.householdId,
    user_id: input.userId,
    items_summary: input.itemsSummary,
    notes: input.notes,
    location_id: input.locationId || null
  }).select(VISIT_COLS).single();
  fail(error);
  return data as Visit;
}

export async function listVisits(pantryId: string, limit = 40): Promise<(Visit & { household_name: string })[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_visits").select(`${VISIT_COLS}, plenty_households(display_name)`).eq("pantry_id", pantryId).order("visited_at", { ascending: false }).limit(limit);
  fail(error);
  return ((data as Array<Visit & { plenty_households?: { display_name?: string } | { display_name?: string }[] }>) || []).map((row) => {
    const hh = row.plenty_households;
    const name = Array.isArray(hh) ? hh[0]?.display_name : hh?.display_name;
    return { ...row, household_name: name || "—" };
  });
}

export async function visitsForUser(pantryId: string, userId: string): Promise<Visit[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_visits").select(VISIT_COLS).eq("pantry_id", pantryId).eq("user_id", userId).order("visited_at", { ascending: false });
  fail(error);
  return (data as Visit[]) || [];
}

export async function addDonation(input: {
  pantryId: string;
  userId: string | null;
  kind: string;
  title: string;
  description: string;
  quantity: string;
  amountCents: number | null;
  availableWhen: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  tenure?: string;
  assetKind?: string;
}): Promise<Donation> {
  const client = await sb();
  const { data, error } = await client.from("plenty_donations").insert({
    pantry_id: input.pantryId,
    user_id: input.userId,
    kind: input.kind,
    title: input.title,
    description: input.description,
    quantity: input.quantity,
    amount_cents: input.amountCents,
    available_when: input.availableWhen,
    contact_name: input.contactName,
    contact_phone: input.contactPhone,
    contact_email: input.contactEmail,
    tenure: input.tenure || "",
    asset_kind: input.assetKind || ""
  }).select(DONATION_COLS).single();
  fail(error);
  if (input.userId) await addMembership(input.pantryId, input.userId, "donor");
  return data as Donation;
}

export async function listDonations(pantryId: string): Promise<Donation[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_donations").select(DONATION_COLS).eq("pantry_id", pantryId).order("created_at", { ascending: false });
  fail(error);
  return (data as Donation[]) || [];
}

export async function setDonationStatus(id: string, status: string, stewardNotes: string): Promise<Donation | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_donations").update({
    status,
    steward_notes: stewardNotes,
    received_at: status === "received" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  }).eq("id", id).select(DONATION_COLS).maybeSingle();
  fail(error);
  return (data as Donation | null) ?? null;
}

export async function upsertVolunteer(input: {
  pantryId: string;
  userId: string;
  roles: string[];
  hasVehicle: boolean;
  notes: string;
}): Promise<VolunteerProfile> {
  const client = await sb();
  const { data, error } = await client.from("plenty_volunteer_profiles").upsert({
    pantry_id: input.pantryId,
    user_id: input.userId,
    roles: input.roles,
    has_vehicle: input.hasVehicle,
    notes: input.notes,
    updated_at: new Date().toISOString()
  }, { onConflict: "pantry_id,user_id" }).select("id, pantry_id, user_id, roles, has_vehicle, notes").single();
  fail(error);
  if (!data) throw new Error("Could not save the volunteer profile.");
  await addMembership(input.pantryId, input.userId, "volunteer");
  return { ...data, roles: asRoles(data.roles) } as VolunteerProfile;
}

export async function volunteerForUser(pantryId: string, userId: string): Promise<VolunteerProfile | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_volunteer_profiles").select("id, pantry_id, user_id, roles, has_vehicle, notes").eq("pantry_id", pantryId).eq("user_id", userId).maybeSingle();
  fail(error);
  if (!data) return null;
  return { ...data, roles: asRoles(data.roles) } as VolunteerProfile;
}

export async function listVolunteers(pantryId: string): Promise<VolunteerRow[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_volunteer_profiles").select("id, pantry_id, user_id, roles, has_vehicle, notes").eq("pantry_id", pantryId);
  fail(error);
  const rows = data || [];
  const ids = rows.map((r) => r.user_id);
  const { data: profiles } = ids.length
    ? await client.from("plenty_user_profiles").select("id, name, email, phone").in("id", ids)
    : { data: [] };
  const byId = new Map((profiles || []).map((p) => [p.id, p]));
  return rows.map((row) => ({
    ...row,
    roles: asRoles(row.roles),
    name: byId.get(row.user_id)?.name ?? null,
    email: byId.get(row.user_id)?.email ?? null,
    phone: byId.get(row.user_id)?.phone ?? null
  }));
}

export async function addShift(input: {
  pantryId: string;
  title: string;
  role: string;
  startsAt: string;
  endsAt: string | null;
  location: string;
  capacity: number | null;
  notes: string;
  createdBy: string | null;
}): Promise<Shift> {
  const client = await sb();
  const { data, error } = await client.from("plenty_shifts").insert({
    pantry_id: input.pantryId,
    title: input.title,
    role: input.role,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    location: input.location,
    capacity: input.capacity,
    notes: input.notes,
    created_by: input.createdBy
  }).select(SHIFT_COLS).single();
  fail(error);
  return { ...(data as Omit<Shift, "signup_count">), signup_count: 0 };
}

export async function listShifts(pantryId: string): Promise<Shift[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_shifts").select(SHIFT_COLS).eq("pantry_id", pantryId).eq("status", "open").order("starts_at", { ascending: true });
  fail(error);
  const shifts = (data as Omit<Shift, "signup_count">[]) || [];
  if (!shifts.length) return [];
  const { data: signups } = await client.from("plenty_shift_signups").select("shift_id, status").in("shift_id", shifts.map((s) => s.id));
  const counts = new Map<string, number>();
  for (const row of signups || []) {
    if (["cancelled", "covered"].includes(String(row.status || "signed"))) continue;
    counts.set(row.shift_id, (counts.get(row.shift_id) || 0) + 1);
  }
  return shifts.map((s) => ({ ...s, signup_count: counts.get(s.id) || 0 }));
}

export async function signupForShift(shiftId: string, userId: string) {
  const client = await sb();
  const { data: shift, error } = await client.from("plenty_shifts").select("pantry_id, capacity, status").eq("id", shiftId).maybeSingle();
  fail(error);
  if (!shift) throw new Error("That shift is not on the board.");
  if (shift.status !== "open") throw new Error("That shift is no longer open.");
  const { count, error: cErr } = await client.from("plenty_shift_signups").select("user_id", { count: "exact", head: true }).eq("shift_id", shiftId);
  fail(cErr);
  if (shift.capacity != null && (count || 0) >= shift.capacity) throw new Error("That shift is full.");
  const { error: sErr } = await client.from("plenty_shift_signups").upsert(
    { shift_id: shiftId, user_id: userId, status: "signed" },
    { onConflict: "shift_id,user_id" }
  );
  fail(sErr);
  await addMembership(shift.pantry_id, userId, "volunteer");
}

export async function myShiftIds(userId: string): Promise<string[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_shift_signups").select("shift_id").eq("user_id", userId);
  fail(error);
  return (data || []).map((r) => r.shift_id);
}

export async function addDistribution(input: {
  pantryId: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  notes: string;
}): Promise<Distribution> {
  const client = await sb();
  const { data, error } = await client.from("plenty_distributions").insert({
    pantry_id: input.pantryId,
    title: input.title,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    notes: input.notes
  }).select(DIST_COLS).single();
  fail(error);
  return data as Distribution;
}

export async function listDistributions(pantryId: string): Promise<Distribution[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_distributions").select(DIST_COLS).eq("pantry_id", pantryId).order("starts_at", { ascending: false });
  fail(error);
  return (data as Distribution[]) || [];
}

export async function setDistributionStatus(id: string, status: string): Promise<Distribution | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_distributions").update({ status }).eq("id", id).select(DIST_COLS).maybeSingle();
  fail(error);
  return (data as Distribution | null) ?? null;
}

export async function addPath(input: {
  pantryId: string;
  householdId: string | null;
  userId: string;
  whatsHard: string;
  whoTheyWantToBecome: string;
  nextStep: string;
  handoffApp: string;
}): Promise<PathRow> {
  const client = await sb();
  const { data, error } = await client.from("plenty_paths").insert({
    pantry_id: input.pantryId,
    household_id: input.householdId,
    user_id: input.userId,
    whats_hard: input.whatsHard,
    who_they_want_to_become: input.whoTheyWantToBecome,
    next_step: input.nextStep,
    handoff_app: input.handoffApp
  }).select(PATH_COLS).single();
  fail(error);
  return data as PathRow;
}

export async function pathsForUser(userId: string): Promise<PathRow[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_paths").select(PATH_COLS).eq("user_id", userId).order("created_at", { ascending: false });
  fail(error);
  return (data as PathRow[]) || [];
}

export async function listPaths(pantryId: string): Promise<PathRow[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_paths").select(PATH_COLS).eq("pantry_id", pantryId).order("created_at", { ascending: false });
  fail(error);
  return (data as PathRow[]) || [];
}

export async function addPromo(input: {
  pantryId: string;
  channel: string;
  title: string;
  body: string;
  createdBy: string | null;
}): Promise<Promo> {
  const client = await sb();
  const { data, error } = await client.from("plenty_promos").insert({
    pantry_id: input.pantryId,
    channel: input.channel,
    title: input.title,
    body: input.body,
    created_by: input.createdBy
  }).select(PROMO_COLS).single();
  fail(error);
  return data as Promo;
}

export async function listPromos(pantryId: string): Promise<Promo[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_promos").select(PROMO_COLS).eq("pantry_id", pantryId).order("created_at", { ascending: false });
  fail(error);
  return (data as Promo[]) || [];
}

export async function pantryStats(pantryId: string) {
  const client = await sb();
  const { count: households, error: e1 } = await client.from("plenty_households").select("id", { count: "exact", head: true }).eq("pantry_id", pantryId);
  fail(e1);
  const { count: visits, error: e2 } = await client.from("plenty_visits").select("id", { count: "exact", head: true }).eq("pantry_id", pantryId);
  fail(e2);
  const { count: volunteers, error: e3 } = await client.from("plenty_volunteer_profiles").select("id", { count: "exact", head: true }).eq("pantry_id", pantryId);
  fail(e3);
  const { count: open_offers, error: e4 } = await client.from("plenty_donations").select("id", { count: "exact", head: true }).eq("pantry_id", pantryId).eq("status", "offered");
  fail(e4);
  const { count: available_items, error: e5 } = await client.from("plenty_inventory").select("id", { count: "exact", head: true }).eq("pantry_id", pantryId).eq("available_this_week", true).eq("we_need", false);
  fail(e5);
  const { count: we_need, error: e6 } = await client.from("plenty_inventory").select("id", { count: "exact", head: true }).eq("pantry_id", pantryId).eq("we_need", true);
  fail(e6);
  return {
    households: households || 0,
    visits: visits || 0,
    volunteers: volunteers || 0,
    open_offers: open_offers || 0,
    available_items: available_items || 0,
    we_need: we_need || 0
  };
}

export type StockMove = {
  id: string;
  pantry_id: string;
  inventory_id: string | null;
  direction: string;
  quantity: number;
  item_name: string;
  note: string;
  created_at: string;
};

export type LocationRow = {
  id: string;
  pantry_id: string;
  name: string;
  address: string;
  hours_text: string;
  notes: string;
};

export type Pickup = {
  id: string;
  pantry_id: string;
  kind: string;
  scheduled_for: string | null;
  address: string;
  contact_name: string;
  contact_phone: string;
  notes: string;
  status: string;
  created_at: string;
  household_id: string | null;
  will_be_home: boolean | null;
  porch_leave_ok: boolean;
  assigned_user_id: string | null;
  window_text: string;
};

export type TaxProfile = {
  pantry_id: string;
  legal_name: string;
  ein: string;
  letter_url: string;
  letter_text: string;
  posted: boolean;
};

export async function takeBagFromShelves(
  pantryId: string,
  items: { id: string; qty: number }[],
  createdBy: string | null
): Promise<string> {
  const shelves = await listInventory(pantryId);
  const taken: string[] = [];
  for (const item of items) {
    const row = shelves.find((s) => s.id === item.id);
    const qty = Math.min(Math.max(0, Math.round(item.qty)), Math.max(0, Number(row?.quantity || 0)));
    if (!row || qty < 1) continue;
    await recordStockMove({
      pantryId,
      inventoryId: row.id,
      direction: "out",
      quantity: qty,
      itemName: row.name,
      note: "Line",
      createdBy
    });
    row.quantity = Number(row.quantity) - qty;
    if (row.quantity <= 0) {
      await updateInventory(row.id, { availableThisWeek: false, quantity: 0 });
    }
    taken.push(`${qty} ${row.unit || "item"} ${row.name}`);
  }
  return taken.join(", ");
}

export async function getShift(id: string): Promise<Shift | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_shifts").select(SHIFT_COLS).eq("id", id).maybeSingle();
  fail(error);
  return data ? { ...(data as Omit<Shift, "signup_count">), signup_count: 0 } : null;
}

export async function getDonation(id: string, pantryId: string): Promise<Donation | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_donations").select(DONATION_COLS).eq("id", id).eq("pantry_id", pantryId).maybeSingle();
  fail(error);
  return (data as Donation | null) ?? null;
}

export async function getPickup(id: string, pantryId: string): Promise<Pickup | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_pickups").select(PICKUP_COLS).eq("id", id).eq("pantry_id", pantryId).maybeSingle();
  fail(error);
  return (data as Pickup | null) ?? null;
}

export async function visitsTodayCount(pantryId: string): Promise<number> {
  const rows = await listVisits(pantryId, 80);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  return rows.filter((v) => {
    const d = new Date(v.visited_at).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    return d === today;
  }).length;
}

export async function recordStockMove(input: {
  pantryId: string;
  inventoryId: string | null;
  direction: "in" | "out";
  quantity: number;
  itemName: string;
  note: string;
  createdBy: string | null;
}): Promise<StockMove> {
  const client = await sb();
  const qty = Math.max(1, input.quantity);
  if (input.inventoryId) {
    const { data: item } = await client.from("plenty_inventory").select("id, quantity, low_at, we_need").eq("id", input.inventoryId).maybeSingle();
    if (item) {
      const next = input.direction === "in" ? Number(item.quantity) + qty : Math.max(0, Number(item.quantity) - qty);
      const lowAt = item.low_at == null ? null : Number(item.low_at);
      const patch: Record<string, unknown> = {
        quantity: next,
        we_need: lowAt != null ? next <= lowAt : Boolean(item.we_need),
        updated_at: new Date().toISOString()
      };
      if (next <= 0) patch.available_this_week = false;
      await client.from("plenty_inventory").update(patch).eq("id", item.id);
    }
  }
  const { data, error } = await client.from("plenty_stock_moves").insert({
    pantry_id: input.pantryId,
    inventory_id: input.inventoryId,
    direction: input.direction,
    quantity: qty,
    item_name: input.itemName,
    note: input.note,
    created_by: input.createdBy
  }).select("id, pantry_id, inventory_id, direction, quantity, item_name, note, created_at").single();
  fail(error);
  return data as StockMove;
}

export async function listStockMoves(pantryId: string, limit = 40): Promise<StockMove[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_stock_moves").select("id, pantry_id, inventory_id, direction, quantity, item_name, note, created_at").eq("pantry_id", pantryId).order("created_at", { ascending: false }).limit(limit);
  fail(error);
  return (data as StockMove[]) || [];
}

export async function addLocation(input: { pantryId: string; name: string; address: string; hoursText: string; notes: string }): Promise<LocationRow> {
  const client = await sb();
  const { data, error } = await client.from("plenty_locations").insert({
    pantry_id: input.pantryId,
    name: input.name,
    address: input.address,
    hours_text: input.hoursText,
    notes: input.notes
  }).select("id, pantry_id, name, address, hours_text, notes").single();
  fail(error);
  return data as LocationRow;
}

export async function listLocations(pantryId: string): Promise<LocationRow[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_locations").select("id, pantry_id, name, address, hours_text, notes").eq("pantry_id", pantryId).order("name");
  fail(error);
  return (data as LocationRow[]) || [];
}

const PICKUP_COLS = "id, pantry_id, kind, scheduled_for, address, contact_name, contact_phone, notes, status, created_at, household_id, will_be_home, porch_leave_ok, assigned_user_id, window_text";

export async function addPickup(input: {
  pantryId: string;
  kind: string;
  scheduledFor: string | null;
  address: string;
  contactName: string;
  contactPhone: string;
  notes: string;
  createdBy: string | null;
  householdId?: string | null;
  willBeHome?: boolean | null;
  porchLeaveOk?: boolean;
  windowText?: string;
}): Promise<Pickup> {
  const client = await sb();
  const { data, error } = await client.from("plenty_pickups").insert({
    pantry_id: input.pantryId,
    kind: input.kind,
    scheduled_for: input.scheduledFor,
    address: input.address,
    contact_name: input.contactName,
    contact_phone: input.contactPhone,
    notes: input.notes,
    created_by: input.createdBy,
    household_id: input.householdId ?? null,
    will_be_home: input.willBeHome ?? null,
    porch_leave_ok: Boolean(input.porchLeaveOk),
    window_text: input.windowText ?? ""
  }).select(PICKUP_COLS).single();
  fail(error);
  return data as Pickup;
}

export async function listPickups(pantryId: string): Promise<Pickup[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_pickups").select(PICKUP_COLS).eq("pantry_id", pantryId).order("created_at", { ascending: false });
  fail(error);
  return (data as Pickup[]) || [];
}

export async function setPickupStatus(id: string, status: string, extra?: { assignedUserId?: string; scheduledFor?: string | null }): Promise<Pickup | null> {
  const client = await sb();
  const payload: Record<string, unknown> = { status };
  if (extra?.assignedUserId) payload.assigned_user_id = extra.assignedUserId;
  if (extra?.scheduledFor !== undefined) payload.scheduled_for = extra.scheduledFor;
  const { data, error } = await client.from("plenty_pickups").update(payload).eq("id", id).select(PICKUP_COLS).maybeSingle();
  fail(error);
  return (data as Pickup | null) ?? null;
}

export async function patchPickup(
  id: string,
  patch: { address?: string; notes?: string; scheduledFor?: string | null; windowText?: string }
): Promise<void> {
  const client = await sb();
  const payload: Record<string, unknown> = {};
  if (patch.address != null) payload.address = patch.address;
  if (patch.notes != null) payload.notes = patch.notes;
  if (patch.scheduledFor !== undefined) payload.scheduled_for = patch.scheduledFor;
  if (patch.windowText != null) payload.window_text = patch.windowText;
  if (!Object.keys(payload).length) return;
  const { error } = await client.from("plenty_pickups").update(payload).eq("id", id);
  fail(error);
}

export async function patchShift(
  id: string,
  patch: { location?: string; notes?: string; startsAt?: string; endsAt?: string | null; title?: string }
): Promise<void> {
  const client = await sb();
  const payload: Record<string, unknown> = {};
  if (patch.location != null) payload.location = patch.location;
  if (patch.notes != null) payload.notes = patch.notes;
  if (patch.startsAt != null) payload.starts_at = patch.startsAt;
  if (patch.endsAt !== undefined) payload.ends_at = patch.endsAt;
  if (patch.title != null) payload.title = patch.title;
  if (!Object.keys(payload).length) return;
  const { error } = await client.from("plenty_shifts").update(payload).eq("id", id);
  fail(error);
}

export async function getTaxProfile(pantryId: string): Promise<TaxProfile | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_tax_profiles").select("pantry_id, legal_name, ein, letter_url, letter_text, posted").eq("pantry_id", pantryId).maybeSingle();
  fail(error);
  return (data as TaxProfile | null) ?? null;
}

export async function upsertTaxProfile(input: TaxProfile): Promise<TaxProfile> {
  const client = await sb();
  const { data, error } = await client.from("plenty_tax_profiles").upsert({
    ...input,
    updated_at: new Date().toISOString()
  }).select("pantry_id, legal_name, ein, letter_url, letter_text, posted").single();
  fail(error);
  return data as TaxProfile;
}

export async function receivedMoneyGifts(pantryId: string, year?: number): Promise<Donation[]> {
  const client = await sb();
  let q = client.from("plenty_donations").select(DONATION_COLS).eq("pantry_id", pantryId).eq("kind", "money").eq("status", "received").order("created_at", { ascending: false });
  const { data, error } = await q;
  fail(error);
  const rows = (data as Donation[]) || [];
  if (!year) return rows;
  return rows.filter((row) => new Date(row.received_at || row.created_at).getFullYear() === year);
}

export async function giftsForUser(userId: string): Promise<Donation[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_donations").select(DONATION_COLS).eq("user_id", userId).order("created_at", { ascending: false });
  fail(error);
  return (data as Donation[]) || [];
}

export async function markReceiptSent(id: string) {
  const client = await sb();
  const { error } = await client.from("plenty_donations").update({ receipt_sent: true }).eq("id", id);
  fail(error);
}

export type ShiftSignup = {
  shift_id: string;
  user_id: string;
  status: string;
  cover_user_id: string | null;
  created_at: string;
  confirmed_at: string | null;
  title?: string;
  role?: string;
  starts_at?: string;
  ends_at?: string | null;
  location?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type Asset = {
  id: string;
  pantry_id: string;
  kind: string;
  title: string;
  description: string;
  tenure: string;
  donor_user_id: string | null;
  donor_name: string;
  status: string;
  notes: string;
  created_at: string;
};

export type VolunteerHour = {
  id: string;
  pantry_id: string;
  user_id: string;
  shift_id: string | null;
  hours: number;
  worked_on: string;
  notes: string;
  created_at: string;
  name?: string | null;
  email?: string | null;
};

export type Contribution = {
  id: string;
  pantry_id: string;
  household_id: string | null;
  user_id: string | null;
  amount_cents: number | null;
  waived: boolean;
  waive_reason: string;
  status: string;
  notes: string;
  visit_id: string | null;
  created_at: string;
  timing: string;
  household_name?: string;
};

const ASSET_COLS = "id, pantry_id, kind, title, description, tenure, donor_user_id, donor_name, status, notes, created_at";
const HOUR_COLS = "id, pantry_id, user_id, shift_id, hours, worked_on, notes, created_at";
const HOUR_COLS_WITHOUT_HOURS = "id, pantry_id, user_id, shift_id, worked_on, notes, created_at";
const CONTRIB_COLS = "id, pantry_id, household_id, user_id, amount_cents, waived, waive_reason, status, notes, visit_id, created_at, timing";

function asVolunteerHour(row: Record<string, unknown>): VolunteerHour {
  return {
    id: String(row.id),
    pantry_id: String(row.pantry_id),
    user_id: String(row.user_id),
    shift_id: row.shift_id ? String(row.shift_id) : null,
    hours: Number(row.hours ?? 0) || 0,
    worked_on: String(row.worked_on ?? ""),
    notes: String(row.notes ?? ""),
    created_at: String(row.created_at ?? "")
  };
}

async function selectVolunteerHours(pantryId: string, userId?: string): Promise<VolunteerHour[]> {
  const client = await sb();
  const limit = userId ? 200 : 80;
  let query = client.from("plenty_volunteer_hours").select(HOUR_COLS).eq("pantry_id", pantryId);
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query.order("worked_on", { ascending: false }).limit(limit);
  if (error && missingTable(error, "plenty_volunteer_hours")) return [];
  if (error && missingColumn(error, "plenty_volunteer_hours", "hours")) {
    let fallback = client.from("plenty_volunteer_hours").select(HOUR_COLS_WITHOUT_HOURS).eq("pantry_id", pantryId);
    if (userId) fallback = fallback.eq("user_id", userId);
    const retry = await fallback.order("worked_on", { ascending: false }).limit(limit);
    if (retry.error) {
      if (missingTable(retry.error, "plenty_volunteer_hours")) return [];
      fail(retry.error);
    }
    return ((retry.data as Record<string, unknown>[]) || []).map(asVolunteerHour);
  }
  fail(error);
  return ((data as VolunteerHour[]) || []).map((row) => asVolunteerHour(row as unknown as Record<string, unknown>));
}

export async function myShiftSignups(userId: string): Promise<ShiftSignup[]> {
  const client = await sb();
  const { data, error } = await client
    .from("plenty_shift_signups")
    .select("shift_id, user_id, status, cover_user_id, created_at, confirmed_at, plenty_shifts(title, role, starts_at, ends_at, location, status)")
    .eq("user_id", userId);
  fail(error);
  return ((data as Array<ShiftSignup & { plenty_shifts?: Record<string, unknown> | Record<string, unknown>[] }>) || []).map((row) => {
    const shift = Array.isArray(row.plenty_shifts) ? row.plenty_shifts[0] : row.plenty_shifts;
    return {
      shift_id: row.shift_id,
      user_id: row.user_id,
      status: row.status || "signed",
      cover_user_id: row.cover_user_id,
      created_at: row.created_at,
      confirmed_at: row.confirmed_at,
      title: shift ? String(shift.title || "") : "",
      role: shift ? String(shift.role || "") : "",
      starts_at: shift ? String(shift.starts_at || "") : "",
      ends_at: shift?.ends_at ? String(shift.ends_at) : null,
      location: shift ? String(shift.location || "") : ""
    };
  });
}

export async function listShiftSignups(pantryId: string): Promise<ShiftSignup[]> {
  const client = await sb();
  const shifts = await listShifts(pantryId);
  if (!shifts.length) return [];
  const { data, error } = await client
    .from("plenty_shift_signups")
    .select("shift_id, user_id, status, cover_user_id, created_at, confirmed_at")
    .in("shift_id", shifts.map((s) => s.id));
  fail(error);
  const ids = [...new Set((data || []).map((r) => r.user_id))];
  const { data: profiles } = ids.length
    ? await client.from("plenty_user_profiles").select("id, name, email, phone").in("id", ids)
    : { data: [] };
  const byId = new Map((profiles || []).map((p) => [p.id, p]));
  const byShift = new Map(shifts.map((s) => [s.id, s]));
  return ((data as ShiftSignup[]) || []).map((row) => ({
    ...row,
    status: row.status || "signed",
    title: byShift.get(row.shift_id)?.title,
    role: byShift.get(row.shift_id)?.role,
    starts_at: byShift.get(row.shift_id)?.starts_at,
    location: byShift.get(row.shift_id)?.location,
    name: byId.get(row.user_id)?.name ?? null,
    email: byId.get(row.user_id)?.email ?? null,
    phone: byId.get(row.user_id)?.phone ?? null
  }));
}

export async function listCoverRequests(pantryId: string): Promise<ShiftSignup[]> {
  const rows = await listShiftSignups(pantryId);
  return rows.filter((row) => row.status === "needs_cover");
}

export async function updateShiftSignup(input: {
  shiftId: string;
  userId: string;
  action: "confirm" | "need_cover" | "take_cover" | "cancel" | "no_show";
  actorId: string;
}) {
  const client = await sb();
  const { data: existing, error } = await client
    .from("plenty_shift_signups")
    .select("shift_id, user_id, status, cover_user_id")
    .eq("shift_id", input.shiftId)
    .eq("user_id", input.userId)
    .maybeSingle();
  fail(error);
  if (!existing) throw new Error("You are not on that shift.");

  if (input.action === "confirm") {
    if (existing.user_id !== input.actorId) throw new Error("Only the volunteer on this shift can confirm.");
    const { error: uErr } = await client.from("plenty_shift_signups").update({
      status: "confirmed",
      confirmed_at: new Date().toISOString()
    }).eq("shift_id", input.shiftId).eq("user_id", input.userId);
    fail(uErr);
    return;
  }

  if (input.action === "need_cover") {
    if (existing.user_id !== input.actorId) throw new Error("Only the volunteer on this shift can ask for cover.");
    const { error: uErr } = await client.from("plenty_shift_signups").update({
      status: "needs_cover"
    }).eq("shift_id", input.shiftId).eq("user_id", input.userId);
    fail(uErr);
    return;
  }

  if (input.action === "cancel") {
    if (existing.user_id !== input.actorId) throw new Error("Only the volunteer on this shift can cancel.");
    const { error: uErr } = await client.from("plenty_shift_signups").update({
      status: "cancelled"
    }).eq("shift_id", input.shiftId).eq("user_id", input.userId);
    fail(uErr);
    return;
  }

  if (input.action === "take_cover") {
    if (existing.status !== "needs_cover") throw new Error("That shift does not need cover.");
    if (existing.user_id === input.actorId) throw new Error("You are already on this shift.");
    const { error: uErr } = await client.from("plenty_shift_signups").update({
      status: "covered",
      cover_user_id: input.actorId
    }).eq("shift_id", input.shiftId).eq("user_id", input.userId);
    fail(uErr);
    await signupForShift(input.shiftId, input.actorId);
    return;
  }

  if (input.action === "no_show") {
    const { error: uErr } = await client.from("plenty_shift_signups").update({
      status: "no_show"
    }).eq("shift_id", input.shiftId).eq("user_id", input.userId);
    fail(uErr);
  }
}

export async function addAsset(input: {
  pantryId: string;
  kind: string;
  title: string;
  description: string;
  tenure: string;
  donorUserId: string | null;
  donorName: string;
  notes: string;
}): Promise<Asset> {
  const client = await sb();
  const { data, error } = await client.from("plenty_assets").insert({
    pantry_id: input.pantryId,
    kind: input.kind,
    title: input.title,
    description: input.description,
    tenure: input.tenure,
    donor_user_id: input.donorUserId,
    donor_name: input.donorName,
    notes: input.notes
  }).select(ASSET_COLS).single();
  fail(error);
  return data as Asset;
}

export async function listAssets(pantryId: string): Promise<Asset[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_assets").select(ASSET_COLS).eq("pantry_id", pantryId).order("created_at", { ascending: false });
  fail(error);
  return (data as Asset[]) || [];
}

export async function setAssetStatus(id: string, status: string): Promise<Asset | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_assets").update({ status }).eq("id", id).select(ASSET_COLS).maybeSingle();
  fail(error);
  return (data as Asset | null) ?? null;
}

export async function addVolunteerHours(input: {
  pantryId: string;
  userId: string;
  shiftId: string | null;
  hours: number;
  workedOn: string;
  notes: string;
}): Promise<VolunteerHour> {
  const client = await sb();
  const hours = Math.max(0.25, Number(input.hours) || 0);
  const payload: Record<string, unknown> = {
    pantry_id: input.pantryId,
    user_id: input.userId,
    shift_id: input.shiftId,
    hours,
    worked_on: input.workedOn,
    notes: input.notes
  };
  const { data, error } = await client.from("plenty_volunteer_hours").insert(payload).select(HOUR_COLS).single();
  if (error && missingColumn(error, "plenty_volunteer_hours", "hours")) {
    const withoutHours = {
      pantry_id: input.pantryId,
      user_id: input.userId,
      shift_id: input.shiftId,
      worked_on: input.workedOn,
      notes: input.notes
    };
    const retry = await client.from("plenty_volunteer_hours").insert(withoutHours).select(HOUR_COLS_WITHOUT_HOURS).single();
    fail(retry.error);
    return asVolunteerHour({ ...(retry.data as Record<string, unknown>), hours });
  }
  fail(error);
  return asVolunteerHour(data as unknown as Record<string, unknown>);
}

export async function listVolunteerHours(pantryId: string): Promise<VolunteerHour[]> {
  const client = await sb();
  const rows = await selectVolunteerHours(pantryId);
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = ids.length
    ? await client.from("plenty_user_profiles").select("id, name, email").in("id", ids)
    : { data: [] };
  const byId = new Map((profiles || []).map((p) => [p.id, p]));
  return rows.map((row) => ({
    ...row,
    name: byId.get(row.user_id)?.name ?? null,
    email: byId.get(row.user_id)?.email ?? null
  }));
}

export async function hoursForUser(pantryId: string, userId: string): Promise<VolunteerHour[]> {
  return selectVolunteerHours(pantryId, userId);
}

export async function hoursTotals(pantryId: string): Promise<Map<string, number>> {
  const rows = await listVolunteerHours(pantryId);
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.user_id, (totals.get(row.user_id) || 0) + Number(row.hours));
  return totals;
}

export async function addContribution(input: {
  pantryId: string;
  householdId: string | null;
  userId: string | null;
  amountCents: number | null;
  waived: boolean;
  waiveReason: string;
  notes: string;
  visitId?: string | null;
  timing?: string;
  status?: string;
}): Promise<Contribution> {
  const client = await sb();
  const status = input.waived ? "waived" : input.amountCents && input.amountCents > 0 ? "received" : "pledged";
  const { data, error } = await client.from("plenty_contributions").insert({
    pantry_id: input.pantryId,
    household_id: input.householdId,
    user_id: input.userId,
    amount_cents: input.waived ? 0 : input.amountCents,
    waived: input.waived,
    waive_reason: input.waiveReason,
    notes: input.notes,
    visit_id: input.visitId ?? null,
    timing: input.timing || (input.visitId ? "at_receipt" : "upfront"),
    status: input.status || status
  }).select(CONTRIB_COLS).single();
  fail(error);
  return data as Contribution;
}

export async function listContributions(pantryId: string): Promise<Contribution[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_contributions").select(`${CONTRIB_COLS}, plenty_households(display_name)`).eq("pantry_id", pantryId).order("created_at", { ascending: false }).limit(80);
  fail(error);
  return ((data as Array<Contribution & { plenty_households?: { display_name?: string } | { display_name?: string }[] }>) || []).map((row) => {
    const hh = row.plenty_households;
    const name = Array.isArray(hh) ? hh[0]?.display_name : hh?.display_name;
    return { ...row, household_name: name || "—" };
  });
}

export async function visitCountsByHousehold(pantryId: string): Promise<Map<string, { count: number; lastVisit: string | null }>> {
  const visits = await listVisits(pantryId, 400);
  const map = new Map<string, { count: number; lastVisit: string | null }>();
  for (const visit of visits) {
    const current = map.get(visit.household_id) || { count: 0, lastVisit: null as string | null };
    current.count += 1;
    if (!current.lastVisit || visit.visited_at > current.lastVisit) current.lastVisit = visit.visited_at;
    map.set(visit.household_id, current);
  }
  return map;
}

export type Campaign = {
  id: string;
  pantry_id: string;
  audience: string;
  extra: string;
  kit: Record<string, unknown>;
  created_at: string;
};

export type PromoSend = {
  id: string;
  pantry_id: string;
  channel: string;
  audience: string;
  to_count: number;
  status: string;
  error: string;
  created_at: string;
};

export async function saveCampaign(input: {
  pantryId: string;
  audience: string;
  extra: string;
  kit: Record<string, unknown>;
  createdBy: string | null;
}): Promise<Campaign> {
  const client = await sb();
  const { data, error } = await client.from("plenty_campaigns").insert({
    pantry_id: input.pantryId,
    audience: input.audience,
    extra: input.extra,
    kit: input.kit,
    created_by: input.createdBy
  }).select("id, pantry_id, audience, extra, kit, created_at").single();
  fail(error);
  return data as Campaign;
}

export async function listCampaigns(pantryId: string): Promise<Campaign[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_campaigns").select("id, pantry_id, audience, extra, kit, created_at").eq("pantry_id", pantryId).order("created_at", { ascending: false }).limit(20);
  fail(error);
  return (data as Campaign[]) || [];
}

export async function recordPromoSend(input: {
  pantryId: string;
  campaignId?: string | null;
  channel: string;
  audience: string;
  toCount: number;
  status: string;
  error?: string;
}): Promise<void> {
  const client = await sb();
  const { error } = await client.from("plenty_promo_sends").insert({
    pantry_id: input.pantryId,
    campaign_id: input.campaignId || null,
    channel: input.channel,
    audience: input.audience,
    to_count: input.toCount,
    status: input.status,
    error: input.error || ""
  });
  fail(error);
}

export async function listPromoSends(pantryId: string): Promise<PromoSend[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_promo_sends").select("id, pantry_id, channel, audience, to_count, status, error, created_at").eq("pantry_id", pantryId).order("created_at", { ascending: false }).limit(30);
  fail(error);
  return (data as PromoSend[]) || [];
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function emailsForAudience(pantryId: string, audience: string): Promise<{ email: string; name: string }[]> {
  const client = await sb();
  const found = new Map<string, string>();
  function add(email: string, name: string) {
    const key = email.trim().toLowerCase();
    if (!validEmail(key)) return;
    if (!found.has(key)) found.set(key, name || key);
  }

  if (audience === "families" || audience === "all") {
    const households = await listHouseholds(pantryId);
    for (const h of households) add(h.email, h.display_name);
  }
  if (audience === "volunteers" || audience === "all") {
    const volunteers = await listVolunteers(pantryId);
    for (const v of volunteers) if (v.email) add(v.email, v.name || v.email);
  }
  if (audience === "donors" || audience === "all") {
    const gifts = await listDonations(pantryId);
    for (const g of gifts) add(g.contact_email, g.contact_name);
  }

  const { data: memberships } = await client.from("plenty_memberships").select("user_id, role").eq("pantry_id", pantryId);
  const roleWanted = audience === "families" ? "neighbor" : audience === "volunteers" ? "volunteer" : audience === "donors" ? "donor" : null;
  const ids = [...new Set((memberships || []).filter((m) => !roleWanted || m.role === roleWanted || audience === "all").map((m) => m.user_id))];
  if (ids.length) {
    const { data: profiles } = await client.from("plenty_user_profiles").select("id, email, name").in("id", ids);
    for (const p of profiles || []) if (p.email) add(p.email, p.name || p.email);
  }
  return [...found.entries()].map(([email, name]) => ({ email, name }));
}

export type WaiverRow = {
  id: string;
  pantry_id: string;
  user_id: string;
  household_id: string | null;
  version: string;
  signed_name: string;
  agreed: boolean;
  created_at: string;
};

export async function signFoodWaiver(input: {
  pantryId: string;
  userId: string;
  householdId: string | null;
  version: string;
  signedName: string;
}): Promise<WaiverRow> {
  const client = await sb();
  const { data, error } = await client.from("plenty_waivers").insert({
    pantry_id: input.pantryId,
    user_id: input.userId,
    household_id: input.householdId,
    version: input.version,
    signed_name: input.signedName,
    agreed: true
  }).select("id, pantry_id, user_id, household_id, version, signed_name, agreed, created_at").single();
  fail(error);
  if (input.householdId) {
    const { error: hErr } = await client.from("plenty_households").update({
      food_waiver_signed_at: new Date().toISOString(),
      food_waiver_version: input.version,
      updated_at: new Date().toISOString()
    }).eq("id", input.householdId);
    fail(hErr);
  }
  return data as WaiverRow;
}

export async function latestWaiverForUser(pantryId: string, userId: string, version?: string): Promise<WaiverRow | null> {
  const client = await sb();
  let q = client
    .from("plenty_waivers")
    .select("id, pantry_id, user_id, household_id, version, signed_name, agreed, created_at")
    .eq("pantry_id", pantryId)
    .eq("user_id", userId)
    .eq("agreed", true);
  if (version) q = q.eq("version", version);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(8);
  fail(error);
  const rows = (data as WaiverRow[]) || [];
  if (version) return rows[0] || null;
  return rows.find((r) => !r.version.startsWith("vol-")) || null;
}

export async function lastVisitForHousehold(pantryId: string, householdId: string): Promise<Visit | null> {
  const client = await sb();
  const { data, error } = await client
    .from("plenty_visits")
    .select(VISIT_COLS)
    .eq("pantry_id", pantryId)
    .eq("household_id", householdId)
    .order("visited_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  fail(error);
  return (data as Visit | null) ?? null;
}

const STORE_PARTNER_COLS =
  "id, pantry_id, name, address, city, state, zip, phone, contact_name, contact_email, pickup_mode, hold_desk, hours_text, pin_hash, notes, status, extra_purchase_required, volunteers_on_site, meet_note, created_at";
const STORE_VOUCHER_COLS =
  "id, pantry_id, partner_id, household_id, code, items_text, still_need_text, status, issued_at, expires_at, redeemed_at, redeemed_note, created_by, created_at";

export type StorePartner = {
  id: string;
  pantry_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  contact_name: string;
  contact_email: string;
  pickup_mode: string;
  hold_desk: string;
  hours_text: string;
  pin_set: boolean;
  notes: string;
  status: string;
  extra_purchase_required: boolean;
  volunteers_on_site: boolean;
  meet_note: string;
  created_at: string;
};

type StorePartnerRow = Omit<StorePartner, "pin_set"> & { pin_hash: string };

export type StoreVoucher = {
  id: string;
  pantry_id: string;
  partner_id: string;
  household_id: string;
  code: string;
  items_text: string;
  still_need_text: string;
  status: string;
  issued_at: string;
  expires_at: string | null;
  redeemed_at: string | null;
  redeemed_note: string;
  created_by: string | null;
  created_at: string;
  partner_name?: string;
  household_name?: string;
  hold_desk?: string;
  hours_text?: string;
  pickup_mode?: string;
  partner_address?: string;
  volunteers_on_site?: boolean;
  meet_note?: string;
};

export type PublicStoreCard = {
  code: string;
  status: string;
  items_text: string;
  still_need_text: string;
  expires_at: string | null;
  redeemed_at: string | null;
  household_name: string;
  partner_name: string;
  hold_desk: string;
  hours_text: string;
  pickup_mode: string;
  partner_address: string;
  extra_purchase_required: false;
  volunteers_on_site: boolean;
  meet_note: string;
};

function toPartner(row: StorePartnerRow): StorePartner {
  const { pin_hash, ...rest } = row;
  return { ...rest, pin_set: Boolean(pin_hash), extra_purchase_required: false };
}

export async function householdById(id: string): Promise<Household | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_households").select(HOUSEHOLD_COLS).eq("id", id).maybeSingle();
  fail(error);
  return (data as Household | null) ?? null;
}

export async function listStorePartners(pantryId: string): Promise<StorePartner[]> {
  const client = await sb();
  const { data, error } = await client
    .from("plenty_store_partners")
    .select(STORE_PARTNER_COLS)
    .eq("pantry_id", pantryId)
    .order("name");
  fail(error);
  return ((data as StorePartnerRow[]) || []).map(toPartner);
}

export async function addStorePartner(input: {
  pantryId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  contactName: string;
  contactEmail: string;
  pickupMode: string;
  holdDesk: string;
  hoursText: string;
  notes: string;
  status: string;
  pin?: string;
  volunteersOnSite?: boolean;
  meetNote?: string;
}): Promise<StorePartner> {
  const { hashStaffPin } = await import("@/lib/store-card/code");
  const client = await sb();
  const { data, error } = await client
    .from("plenty_store_partners")
    .insert({
      pantry_id: input.pantryId,
      name: input.name,
      address: input.address,
      city: input.city,
      state: input.state,
      zip: input.zip,
      phone: input.phone,
      contact_name: input.contactName,
      contact_email: input.contactEmail,
      pickup_mode: input.pickupMode,
      hold_desk: input.holdDesk || "Customer service",
      hours_text: input.hoursText,
      notes: input.notes,
      status: input.status,
      extra_purchase_required: false,
      volunteers_on_site: Boolean(input.volunteersOnSite),
      meet_note: input.meetNote || "",
      pin_hash: input.pin ? hashStaffPin(input.pin) : ""
    })
    .select(STORE_PARTNER_COLS)
    .single();
  fail(error);
  return toPartner(data as StorePartnerRow);
}

export async function updateStorePartner(
  id: string,
  pantryId: string,
  patch: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    contactName?: string;
    contactEmail?: string;
    pickupMode?: string;
    holdDesk?: string;
    hoursText?: string;
    notes?: string;
    status?: string;
    pin?: string;
    volunteersOnSite?: boolean;
    meetNote?: string;
  }
): Promise<StorePartner | null> {
  const client = await sb();
  const row: Record<string, unknown> = {
    extra_purchase_required: false,
    updated_at: new Date().toISOString()
  };
  if (patch.name != null) row.name = patch.name;
  if (patch.address != null) row.address = patch.address;
  if (patch.city != null) row.city = patch.city;
  if (patch.state != null) row.state = patch.state;
  if (patch.zip != null) row.zip = patch.zip;
  if (patch.phone != null) row.phone = patch.phone;
  if (patch.contactName != null) row.contact_name = patch.contactName;
  if (patch.contactEmail != null) row.contact_email = patch.contactEmail;
  if (patch.pickupMode != null) row.pickup_mode = patch.pickupMode;
  if (patch.holdDesk != null) row.hold_desk = patch.holdDesk;
  if (patch.hoursText != null) row.hours_text = patch.hoursText;
  if (patch.notes != null) row.notes = patch.notes;
  if (patch.status != null) row.status = patch.status;
  if (patch.volunteersOnSite != null) row.volunteers_on_site = patch.volunteersOnSite;
  if (patch.meetNote != null) row.meet_note = patch.meetNote;
  if (patch.pin) {
    const { hashStaffPin } = await import("@/lib/store-card/code");
    row.pin_hash = hashStaffPin(patch.pin);
  }
  const { data, error } = await client
    .from("plenty_store_partners")
    .update(row)
    .eq("id", id)
    .eq("pantry_id", pantryId)
    .select(STORE_PARTNER_COLS)
    .maybeSingle();
  fail(error);
  return data ? toPartner(data as StorePartnerRow) : null;
}

export async function partnerWithPin(id: string): Promise<(StorePartnerRow & { pin_hash: string }) | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_store_partners").select(STORE_PARTNER_COLS).eq("id", id).maybeSingle();
  fail(error);
  return (data as StorePartnerRow | null) ?? null;
}

export async function listStoreVouchers(pantryId: string, opts?: { householdId?: string; partnerId?: string }): Promise<StoreVoucher[]> {
  const client = await sb();
  let q = client.from("plenty_store_vouchers").select(STORE_VOUCHER_COLS).eq("pantry_id", pantryId).order("issued_at", { ascending: false }).limit(200);
  if (opts?.householdId) q = q.eq("household_id", opts.householdId);
  if (opts?.partnerId) q = q.eq("partner_id", opts.partnerId);
  const { data, error } = await q;
  fail(error);
  const rows = (data as StoreVoucher[]) || [];
  if (!rows.length) return [];
  const [partners, households] = await Promise.all([listStorePartners(pantryId), listHouseholds(pantryId)]);
  const partnerMap = new Map(partners.map((p) => [p.id, p]));
  const householdMap = new Map(households.map((h) => [h.id, h]));
  return rows.map((row) => {
    const partner = partnerMap.get(row.partner_id);
    const household = householdMap.get(row.household_id);
    return {
      ...row,
      partner_name: partner?.name,
      household_name: household?.display_name,
      hold_desk: partner?.hold_desk,
      hours_text: partner?.hours_text,
      pickup_mode: partner?.pickup_mode,
      partner_address: [partner?.address, partner?.city, partner?.state].filter(Boolean).join(", "),
      volunteers_on_site: Boolean(partner?.volunteers_on_site),
      meet_note: partner?.meet_note
    };
  });
}

export async function getStoreVoucher(id: string): Promise<StoreVoucher | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_store_vouchers").select(STORE_VOUCHER_COLS).eq("id", id).maybeSingle();
  fail(error);
  if (!data) return null;
  const row = data as StoreVoucher;
  const [partner, household] = await Promise.all([
    client.from("plenty_store_partners").select(STORE_PARTNER_COLS).eq("id", row.partner_id).maybeSingle(),
    householdById(row.household_id)
  ]);
  const p = partner.data as StorePartnerRow | null;
  return {
    ...row,
    partner_name: p?.name,
    household_name: household?.display_name,
    hold_desk: p?.hold_desk,
    hours_text: p?.hours_text,
    pickup_mode: p?.pickup_mode,
    partner_address: p ? [p.address, p.city, p.state].filter(Boolean).join(", ") : "",
    volunteers_on_site: Boolean(p?.volunteers_on_site),
    meet_note: p?.meet_note || ""
  };
}

export async function issueStoreVoucher(input: {
  pantryId: string;
  partnerId: string;
  householdId: string;
  itemsText: string;
  stillNeedText: string;
  expiresAt: string | null;
  createdBy: string | null;
}): Promise<StoreVoucher> {
  const { newCardCode } = await import("@/lib/store-card/code");
  const client = await sb();
  const partner = await partnerWithPin(input.partnerId);
  if (!partner || partner.pantry_id !== input.pantryId) throw new Error("That store is not on this pantry.");
  if (partner.status !== "active") throw new Error("Activate the store partner before issuing a card.");
  if (partner.pickup_mode === "dock_pickup") throw new Error("This store asked us to pick up at the dock — not in-store cards.");
  const household = await householdById(input.householdId);
  if (!household || household.pantry_id !== input.pantryId) throw new Error("That household is not registered here.");

  const { error: voidErr } = await client
    .from("plenty_store_vouchers")
    .update({ status: "void", redeemed_note: "Replaced by a new card" })
    .eq("pantry_id", input.pantryId)
    .eq("partner_id", input.partnerId)
    .eq("household_id", input.householdId)
    .eq("status", "issued");
  fail(voidErr);

  let lastError: Error | null = null;
  for (let i = 0; i < 6; i++) {
    const code = newCardCode();
    const { data, error } = await client
      .from("plenty_store_vouchers")
      .insert({
        pantry_id: input.pantryId,
        partner_id: input.partnerId,
        household_id: input.householdId,
        code,
        items_text: input.itemsText,
        still_need_text: input.stillNeedText,
        status: "issued",
        expires_at: input.expiresAt,
        created_by: input.createdBy
      })
      .select(STORE_VOUCHER_COLS)
      .single();
    if (!error && data) {
      return {
        ...(data as StoreVoucher),
        partner_name: partner.name,
        household_name: household.display_name,
        hold_desk: partner.hold_desk,
        hours_text: partner.hours_text,
        pickup_mode: partner.pickup_mode,
        volunteers_on_site: Boolean(partner.volunteers_on_site),
        meet_note: partner.meet_note || ""
      };
    }
    lastError = new Error(error?.message || "Could not issue the card.");
    if (error && !/duplicate|unique/i.test(error.message)) throw lastError;
  }
  throw lastError || new Error("Could not issue a unique card code.");
}

export async function setStoreVoucherStatus(id: string, pantryId: string, status: string, note = ""): Promise<StoreVoucher | null> {
  const client = await sb();
  const patch: Record<string, unknown> = { status, redeemed_note: note };
  if (status === "redeemed") patch.redeemed_at = new Date().toISOString();
  const { data, error } = await client
    .from("plenty_store_vouchers")
    .update(patch)
    .eq("id", id)
    .eq("pantry_id", pantryId)
    .select(STORE_VOUCHER_COLS)
    .maybeSingle();
  fail(error);
  return (data as StoreVoucher | null) ?? null;
}

export async function publicStoreCardByCode(code: string): Promise<PublicStoreCard | null> {
  const { normalizeCardCode } = await import("@/lib/store-card/code");
  const client = await sb();
  const { data, error } = await client
    .from("plenty_store_vouchers")
    .select(STORE_VOUCHER_COLS)
    .eq("code", normalizeCardCode(code))
    .maybeSingle();
  fail(error);
  if (!data) return null;
  const row = data as StoreVoucher;
  const [partnerRes, household] = await Promise.all([
    client.from("plenty_store_partners").select(STORE_PARTNER_COLS).eq("id", row.partner_id).maybeSingle(),
    householdById(row.household_id)
  ]);
  const partner = partnerRes.data as StorePartnerRow | null;
  if (!partner) return null;
  let status = row.status;
  if (status === "issued" && row.expires_at && new Date(row.expires_at).getTime() < Date.now()) status = "expired";
  return {
    code: row.code,
    status,
    items_text: row.items_text,
    still_need_text: row.still_need_text || "",
    expires_at: row.expires_at,
    redeemed_at: row.redeemed_at,
    household_name: household?.display_name || "Household",
    partner_name: partner.name,
    hold_desk: partner.hold_desk || "Customer service",
    hours_text: partner.hours_text,
    pickup_mode: partner.pickup_mode,
    partner_address: [partner.address, partner.city, partner.state].filter(Boolean).join(", "),
    extra_purchase_required: false,
    volunteers_on_site: Boolean(partner.volunteers_on_site),
    meet_note: partner.meet_note || ""
  };
}

export async function redeemStoreCardWithPin(code: string, pin: string, note: string): Promise<StoreVoucher> {
  const { normalizeCardCode, staffPinMatches } = await import("@/lib/store-card/code");
  const client = await sb();
  const { data, error } = await client
    .from("plenty_store_vouchers")
    .select(STORE_VOUCHER_COLS)
    .eq("code", normalizeCardCode(code))
    .maybeSingle();
  fail(error);
  if (!data) throw new Error("This is not a Plenty card.");
  const row = data as StoreVoucher;
  if (row.status === "redeemed") throw new Error("This card was already collected.");
  if (row.status === "void") throw new Error("This card is no longer valid.");
  if (row.status === "expired" || (row.expires_at && new Date(row.expires_at).getTime() < Date.now())) {
    throw new Error("This card has expired. The pantry can issue a new one.");
  }
  if (row.status !== "issued") throw new Error("This card cannot be collected.");
  const partner = await partnerWithPin(row.partner_id);
  if (!partner || partner.status !== "active") throw new Error("This store is not collecting Plenty cards right now.");
  if (!partner.pin_hash) throw new Error("This store does not have a pickup PIN yet. Call the pantry.");
  if (!staffPinMatches(pin, partner.pin_hash)) throw new Error("That store PIN did not match.");
  const { data: updated, error: upErr } = await client
    .from("plenty_store_vouchers")
    .update({
      status: "redeemed",
      redeemed_at: new Date().toISOString(),
      redeemed_note: note || "Collected in store"
    })
    .eq("id", row.id)
    .eq("status", "issued")
    .select(STORE_VOUCHER_COLS)
    .maybeSingle();
  fail(upErr);
  if (!updated) throw new Error("This card was already collected.");
  return updated as StoreVoucher;
}

const ALLY_COLS =
  "id, pantry_id, kind, name, address, city, state, zip, phone, contact_name, contact_email, hours_hint, hours_text, website, relationship, listed_publicly, wants_food, can_host_distribution, can_pickup, wants_volunteers, has_freezer, has_space, visit_notes, last_visited_at, source_note, accepts_dry, accepts_refrigerated, accepts_frozen, accepts_produce, next_distribution_at, operator_pantry_id, created_at";

export type Ally = {
  id: string;
  pantry_id: string;
  kind: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  contact_name: string;
  contact_email: string;
  hours_hint: string;
  hours_text: string;
  website: string;
  relationship: string;
  listed_publicly: boolean;
  wants_food: boolean;
  can_host_distribution: boolean;
  can_pickup: boolean;
  wants_volunteers: boolean;
  has_freezer: boolean;
  has_space: boolean;
  visit_notes: string;
  last_visited_at: string | null;
  source_note: string;
  accepts_dry: boolean;
  accepts_refrigerated: boolean;
  accepts_frozen: boolean;
  accepts_produce: boolean;
  next_distribution_at: string | null;
  operator_pantry_id: string | null;
  created_at: string;
};

export type OpsNeed = {
  id: string;
  pantry_id: string;
  kind: string;
  title: string;
  details: string;
  status: string;
  created_at: string;
};

export async function getAlly(id: string, pantryId: string): Promise<Ally | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_allies").select(ALLY_COLS).eq("id", id).eq("pantry_id", pantryId).maybeSingle();
  fail(error);
  return (data as Ally | null) ?? null;
}

export async function listAllies(pantryId: string): Promise<Ally[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_allies").select(ALLY_COLS).eq("pantry_id", pantryId).order("city").order("name");
  fail(error);
  return (data as Ally[]) || [];
}

export async function listedAllies(pantryId: string): Promise<Ally[]> {
  const client = await sb();
  const { data, error } = await client
    .from("plenty_allies")
    .select(ALLY_COLS)
    .eq("pantry_id", pantryId)
    .eq("listed_publicly", true)
    .order("city")
    .order("name");
  fail(error);
  return (data as Ally[]) || [];
}

export async function addAlly(input: {
  pantryId: string;
  kind: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  contactName: string;
  contactEmail: string;
  hoursHint: string;
  hoursText: string;
  website: string;
  relationship: string;
  listedPublicly: boolean;
  wantsFood: boolean;
  canHostDistribution: boolean;
  canPickup: boolean;
  wantsVolunteers: boolean;
  hasFreezer: boolean;
  hasSpace: boolean;
  visitNotes: string;
  sourceNote: string;
}): Promise<Ally> {
  const client = await sb();
  const { data, error } = await client
    .from("plenty_allies")
    .insert({
      pantry_id: input.pantryId,
      kind: input.kind,
      name: input.name,
      address: input.address,
      city: input.city,
      state: input.state || "GA",
      zip: input.zip,
      phone: input.phone,
      contact_name: input.contactName,
      contact_email: input.contactEmail,
      hours_hint: input.hoursHint,
      hours_text: input.hoursText,
      website: input.website,
      relationship: input.relationship,
      listed_publicly: Boolean(input.listedPublicly),
      wants_food: Boolean(input.wantsFood),
      can_host_distribution: Boolean(input.canHostDistribution),
      can_pickup: Boolean(input.canPickup),
      wants_volunteers: Boolean(input.wantsVolunteers),
      has_freezer: Boolean(input.hasFreezer),
      has_space: Boolean(input.hasSpace),
      visit_notes: input.visitNotes,
      source_note: input.sourceNote
    })
    .select(ALLY_COLS)
    .single();
  fail(error);
  return data as Ally;
}

export async function updateAlly(
  id: string,
  pantryId: string,
  patch: Partial<{
    kind: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    contactName: string;
    contactEmail: string;
    hoursHint: string;
    hoursText: string;
    website: string;
    relationship: string;
    listedPublicly: boolean;
    wantsFood: boolean;
    canHostDistribution: boolean;
    canPickup: boolean;
    wantsVolunteers: boolean;
    hasFreezer: boolean;
    hasSpace: boolean;
    visitNotes: string;
    lastVisitedAt: string | null;
    sourceNote: string;
    acceptsDry: boolean;
    acceptsRefrigerated: boolean;
    acceptsFrozen: boolean;
    acceptsProduce: boolean;
    nextDistributionAt: string | null;
    operatorPantryId: string | null;
  }>
): Promise<Ally | null> {
  const client = await sb();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.kind != null) row.kind = patch.kind;
  if (patch.name != null) row.name = patch.name;
  if (patch.address != null) row.address = patch.address;
  if (patch.city != null) row.city = patch.city;
  if (patch.state != null) row.state = patch.state;
  if (patch.zip != null) row.zip = patch.zip;
  if (patch.phone != null) row.phone = patch.phone;
  if (patch.contactName != null) row.contact_name = patch.contactName;
  if (patch.contactEmail != null) row.contact_email = patch.contactEmail;
  if (patch.hoursHint != null) row.hours_hint = patch.hoursHint;
  if (patch.hoursText != null) row.hours_text = patch.hoursText;
  if (patch.website != null) row.website = patch.website;
  if (patch.relationship != null) row.relationship = patch.relationship;
  if (patch.listedPublicly != null) row.listed_publicly = patch.listedPublicly;
  if (patch.wantsFood != null) row.wants_food = patch.wantsFood;
  if (patch.canHostDistribution != null) row.can_host_distribution = patch.canHostDistribution;
  if (patch.canPickup != null) row.can_pickup = patch.canPickup;
  if (patch.wantsVolunteers != null) row.wants_volunteers = patch.wantsVolunteers;
  if (patch.hasFreezer != null) row.has_freezer = patch.hasFreezer;
  if (patch.hasSpace != null) row.has_space = patch.hasSpace;
  if (patch.acceptsDry != null) row.accepts_dry = patch.acceptsDry;
  if (patch.acceptsRefrigerated != null) row.accepts_refrigerated = patch.acceptsRefrigerated;
  if (patch.acceptsFrozen != null) row.accepts_frozen = patch.acceptsFrozen;
  if (patch.acceptsProduce != null) row.accepts_produce = patch.acceptsProduce;
  if (patch.nextDistributionAt !== undefined) row.next_distribution_at = patch.nextDistributionAt;
  if (patch.visitNotes != null) row.visit_notes = patch.visitNotes;
  if (patch.lastVisitedAt !== undefined) row.last_visited_at = patch.lastVisitedAt;
  if (patch.sourceNote != null) row.source_note = patch.sourceNote;
  if (patch.operatorPantryId !== undefined) row.operator_pantry_id = patch.operatorPantryId;
  const { data, error } = await client
    .from("plenty_allies")
    .update(row)
    .eq("id", id)
    .eq("pantry_id", pantryId)
    .select(ALLY_COLS)
    .maybeSingle();
  fail(error);
  return (data as Ally | null) ?? null;
}

export async function ensureToombsStartingPoints(pantryId: string): Promise<number> {
  const { TOOMBS_STARTING_POINTS, FIELD_VISITS, allyNameKey } = await import("@/lib/allies/toombs-starting-points");
  const existing = await listAllies(pantryId);
  const names = new Set(existing.map((a) => allyNameKey(a.name)));
  let added = 0;
  for (const row of TOOMBS_STARTING_POINTS) {
    if (names.has(allyNameKey(row.name))) continue;
    await addAlly({
      pantryId,
      kind: row.kind,
      name: row.name,
      address: row.address,
      city: row.city,
      state: "GA",
      zip: row.zip,
      phone: row.phone,
      contactName: "",
      contactEmail: "",
      hoursHint: row.hoursHint,
      hoursText: "",
      website: "",
      relationship: "to_meet",
      listedPublicly: false,
      wantsFood: false,
      canHostDistribution: false,
      canPickup: false,
      wantsVolunteers: false,
      hasFreezer: false,
      hasSpace: false,
      visitNotes: "",
      sourceNote: row.sourceNote
    });
    names.add(allyNameKey(row.name));
    added += 1;
  }

  const latest = await listAllies(pantryId);
  for (const visit of FIELD_VISITS) {
    const keys = new Set(visit.names.map(allyNameKey));
    const row = latest.find((a) => keys.has(allyNameKey(a.name)));
    const visitedAt = `${visit.visitedOn}T16:00:00.000Z`;
    try {
      if (row) {
        const newerDesk = row.last_visited_at && row.last_visited_at.slice(0, 10) > visit.visitedOn;
        const same =
          row.hours_text === visit.hoursText &&
          row.relationship === visit.relationship &&
          row.listed_publicly === visit.listedPublicly &&
          row.address === visit.address &&
          (row.contact_name || "") === (visit.contactName || "") &&
          row.visit_notes === visit.visitNotes;
        if (newerDesk || same) continue;
        await updateAlly(row.id, pantryId, {
          address: visit.address,
          city: visit.city,
          zip: visit.zip,
          phone: visit.phone,
          hoursText: visit.hoursText,
          contactName: visit.contactName,
          relationship: visit.relationship,
          listedPublicly: visit.listedPublicly,
          visitNotes: visit.visitNotes,
          sourceNote: visit.sourceNote,
          lastVisitedAt: visitedAt
        });
      } else {
        const created = await addAlly({
          pantryId,
          kind: visit.kind,
          name: visit.names[0],
          address: visit.address,
          city: visit.city,
          state: "GA",
          zip: visit.zip,
          phone: visit.phone,
          contactName: visit.contactName,
          contactEmail: "",
          hoursHint: "",
          hoursText: visit.hoursText,
          website: "",
          relationship: visit.relationship,
          listedPublicly: visit.listedPublicly,
          wantsFood: false,
          canHostDistribution: false,
          canPickup: false,
          wantsVolunteers: false,
          hasFreezer: false,
          hasSpace: false,
          visitNotes: visit.visitNotes,
          sourceNote: visit.sourceNote
        });
        await updateAlly(created.id, pantryId, { lastVisitedAt: visitedAt }).catch(() => created);
      }
    } catch {
      continue;
    }
  }
  return added;
}

export async function ensureFoodDonors(pantryId: string): Promise<number> {
  const { FOOD_DONOR_STARTING, donorNameKey, encodeDonorMeta } = await import("@/lib/donors/starting");
  const existing = await listStorePartners(pantryId);
  const names = new Set(existing.map((p) => donorNameKey(p.name)));
  let added = 0;
  for (const row of FOOD_DONOR_STARTING) {
    if (row.names.some((n) => names.has(donorNameKey(n)))) continue;
    try {
      const partner = await addStorePartner({
        pantryId,
        name: row.name,
        address: row.address,
        city: row.city,
        state: "GA",
        zip: row.zip,
        phone: row.phone,
        contactName: row.contactName,
        contactEmail: "",
        pickupMode: "dock_pickup",
        holdDesk: row.contactRole || "Dock",
        hoursText: "",
        notes: `${encodeDonorMeta({ kind: row.kind, gives: row.gives })}\n${row.notes}`,
        status: "invited"
      });
      await addDonation({
        pantryId,
        userId: null,
        kind: "donor_note",
        title: partner.name,
        description: row.notes,
        quantity: row.gives.join(", "),
        amountCents: null,
        availableWhen: "",
        contactName: row.contactName,
        contactPhone: row.phone,
        contactEmail: ""
      }).catch(() => null);
      names.add(donorNameKey(row.name));
      added += 1;
    } catch {
      continue;
    }
  }
  return added;
}

export async function listDonorActivity(pantryId: string, donorName?: string): Promise<Donation[]> {
  const { isDonorActivity } = await import("@/lib/donors/starting");
  const all = await listDonations(pantryId).catch(() => []);
  const rows = all.filter((d) => isDonorActivity(d.kind));
  if (!donorName) return rows;
  const { donorNameKey } = await import("@/lib/donors/starting");
  const key = donorNameKey(donorName);
  return rows.filter((d) => donorNameKey(d.title) === key || donorNameKey(d.title).includes(key) || key.includes(donorNameKey(d.title)));
}

export async function listOpsNeeds(pantryId: string): Promise<OpsNeed[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_ops_needs").select("id, pantry_id, kind, title, details, status, created_at").eq("pantry_id", pantryId).order("created_at", { ascending: false });
  fail(error);
  return (data as OpsNeed[]) || [];
}

export async function openOpsNeeds(pantryId: string): Promise<OpsNeed[]> {
  const client = await sb();
  const { data, error } = await client
    .from("plenty_ops_needs")
    .select("id, pantry_id, kind, title, details, status, created_at")
    .eq("pantry_id", pantryId)
    .eq("status", "open")
    .order("created_at", { ascending: false });
  fail(error);
  return (data as OpsNeed[]) || [];
}

export async function addOpsNeed(input: { pantryId: string; kind: string; title: string; details: string }): Promise<OpsNeed> {
  const client = await sb();
  const { data, error } = await client
    .from("plenty_ops_needs")
    .insert({
      pantry_id: input.pantryId,
      kind: input.kind,
      title: input.title,
      details: input.details,
      status: "open"
    })
    .select("id, pantry_id, kind, title, details, status, created_at")
    .single();
  fail(error);
  return data as OpsNeed;
}

export async function setOpsNeedStatus(id: string, pantryId: string, status: string): Promise<OpsNeed | null> {
  const client = await sb();
  const { data, error } = await client
    .from("plenty_ops_needs")
    .update({ status })
    .eq("id", id)
    .eq("pantry_id", pantryId)
    .select("id, pantry_id, kind, title, details, status, created_at")
    .maybeSingle();
  fail(error);
  return (data as OpsNeed | null) ?? null;
}

export type PayMethodRow = {
  pantry_id: string;
  kind: string;
  handle: string;
  posted: boolean;
};

export async function listPayMethods(pantryId: string): Promise<PayMethodRow[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_pay_methods").select("pantry_id, kind, handle, posted").eq("pantry_id", pantryId);
  fail(error);
  return (data as PayMethodRow[]) || [];
}

export async function postedPayMethods(pantryId: string): Promise<PayMethodRow[]> {
  const rows = await listPayMethods(pantryId);
  return rows.filter((r) => r.posted && (r.kind === "cash" || r.handle.trim()));
}

export async function effectivePayMethods(pantry: Pick<Pantry, "id" | "giving_mode">): Promise<PayMethodRow[]> {
  if (pantry.giving_mode === "uug") {
    const home = await getDefaultPantry();
    if (home) return postedPayMethods(home.id);
  }
  return postedPayMethods(pantry.id);
}

export async function upsertPayMethod(input: { pantryId: string; kind: string; handle: string; posted: boolean }): Promise<PayMethodRow> {
  const client = await sb();
  const handle = input.handle.trim();
  const posted = Boolean(input.posted) && (input.kind === "cash" || Boolean(handle));
  const { data, error } = await client
    .from("plenty_pay_methods")
    .upsert({
      pantry_id: input.pantryId,
      kind: input.kind,
      handle,
      posted,
      updated_at: new Date().toISOString()
    })
    .select("pantry_id, kind, handle, posted")
    .single();
  fail(error);
  return data as PayMethodRow;
}

export type RecurringJob = {
  id: string;
  pantry_id: string;
  kind: string;
  title: string;
  weekday: number;
  time_local: string;
  role: string;
  location: string;
  partner_id: string | null;
  notes: string;
  active: boolean;
  last_run_on: string | null;
};

export async function listRecurring(pantryId: string): Promise<RecurringJob[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_recurring").select("id, pantry_id, kind, title, weekday, time_local, role, location, partner_id, notes, active, last_run_on").eq("pantry_id", pantryId).order("weekday");
  fail(error);
  return (data as RecurringJob[]) || [];
}

export async function addRecurring(input: {
  pantryId: string;
  kind: string;
  title: string;
  weekday: number;
  timeLocal: string;
  role: string;
  location: string;
  partnerId: string | null;
  notes: string;
}): Promise<RecurringJob> {
  const client = await sb();
  const { data, error } = await client
    .from("plenty_recurring")
    .insert({
      pantry_id: input.pantryId,
      kind: input.kind,
      title: input.title,
      weekday: input.weekday,
      time_local: input.timeLocal,
      role: input.role,
      location: input.location,
      partner_id: input.partnerId,
      notes: input.notes,
      active: true
    })
    .select("id, pantry_id, kind, title, weekday, time_local, role, location, partner_id, notes, active, last_run_on")
    .single();
  fail(error);
  return data as RecurringJob;
}

export async function setRecurringActive(id: string, pantryId: string, active: boolean): Promise<void> {
  const client = await sb();
  const { error } = await client.from("plenty_recurring").update({ active }).eq("id", id).eq("pantry_id", pantryId);
  fail(error);
}

export async function markRecurringRun(id: string, day: string): Promise<void> {
  const client = await sb();
  const { error } = await client.from("plenty_recurring").update({ last_run_on: day }).eq("id", id);
  fail(error);
}

export async function listActiveRecurring(): Promise<RecurringJob[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_recurring").select("id, pantry_id, kind, title, weekday, time_local, role, location, partner_id, notes, active, last_run_on").eq("active", true);
  fail(error);
  return (data as RecurringJob[]) || [];
}
