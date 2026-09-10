import { DEFAULT_PANTRY_SLUG } from "@/lib/app-brand";
import { getSupabase } from "@/lib/db/client";
import { ensurePlentySchema } from "@/lib/db/ensure-schema";

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
};

export type Household = {
  id: string;
  pantry_id: string;
  user_id: string;
  display_name: string;
  household_size: number;
  dietary_notes: string;
  phone: string;
  preferred_contact: string;
  notes: string;
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

const VOLUNTEER_ROLES = ["pickup", "setup", "serve", "delivery"] as const;
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

const PANTRY_COLS = "id, slug, name, city, state, zip, address, hours_text, about, phone, email, visit_style, status, source";
const HOUSEHOLD_COLS = "id, pantry_id, user_id, display_name, household_size, dietary_notes, phone, preferred_contact, notes";
const INV_COLS = "id, pantry_id, name, category, quantity, unit, available_this_week, we_need, low_at, notes";
const DONATION_COLS = "id, pantry_id, user_id, kind, title, description, quantity, amount_cents, available_when, contact_name, contact_phone, contact_email, status, steward_notes, created_at";
const VISIT_COLS = "id, pantry_id, household_id, user_id, visited_at, items_summary, notes";
const PATH_COLS = "id, pantry_id, household_id, user_id, whats_hard, who_they_want_to_become, next_step, handoff_app, status, created_at";
const SHIFT_COLS = "id, pantry_id, title, role, starts_at, ends_at, location, capacity, notes, status";
const DIST_COLS = "id, pantry_id, title, starts_at, ends_at, notes, status";
const PROMO_COLS = "id, pantry_id, channel, title, body, created_at";


export async function ensureUserProfile(user: { id: string; email: string; name: string; role: string }) {
  const client = await sb();
  const { data: existing } = await client.from("plenty_user_profiles").select("id, name").eq("id", user.id).maybeSingle();
  const { error } = await client.from("plenty_user_profiles").upsert({
    id: user.id,
    email: user.email,
    name: user.name || existing?.name || null,
    role: user.role,
    updated_at: new Date().toISOString()
  });
  fail(error);
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
    updated_at: new Date().toISOString()
  };
  if (id) {
    const { data, error } = await client.from("plenty_pantries").update(payload).eq("id", id).select(PANTRY_COLS).single();
    fail(error);
    if (!data) throw new Error("Pantry not found.");
    return data as Pantry;
  }
  const { data, error } = await client.from("plenty_pantries").insert({ ...payload, created_by: fields.created_by ?? null }).select(PANTRY_COLS).single();
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

export async function isSteward(pantryId: string, userId: string, appRole?: string | null) {
  if (appRole === "owner" || appRole === "admin") return true;
  const client = await sb();
  const { count, error } = await client
    .from("plenty_memberships")
    .select("user_id", { count: "exact", head: true })
    .eq("pantry_id", pantryId)
    .eq("user_id", userId)
    .eq("role", "steward");
  fail(error);
  return (count || 0) > 0;
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
}): Promise<Household> {
  const client = await sb();
  const { data, error } = await client.from("plenty_households").upsert({
    pantry_id: input.pantryId,
    user_id: input.userId,
    display_name: input.displayName,
    household_size: input.householdSize,
    dietary_notes: input.dietaryNotes,
    phone: input.phone,
    preferred_contact: input.preferredContact,
    updated_at: new Date().toISOString()
  }, { onConflict: "pantry_id,user_id" }).select(HOUSEHOLD_COLS).single();
  fail(error);
  await addMembership(input.pantryId, input.userId, "neighbor");
  return data as Household;
}

export async function householdForUser(pantryId: string, userId: string): Promise<Household | null> {
  const client = await sb();
  const { data, error } = await client.from("plenty_households").select(HOUSEHOLD_COLS).eq("pantry_id", pantryId).eq("user_id", userId).maybeSingle();
  fail(error);
  return (data as Household | null) ?? null;
}

export async function listHouseholds(pantryId: string): Promise<Household[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_households").select(HOUSEHOLD_COLS).eq("pantry_id", pantryId).order("display_name");
  fail(error);
  return (data as Household[]) || [];
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
    notes: input.notes
  }).select(INV_COLS).single();
  fail(error);
  return data as InventoryItem;
}

export async function updateInventory(
  id: string,
  fields: { quantity?: number; availableThisWeek?: boolean; weNeed?: boolean }
): Promise<InventoryItem | null> {
  const client = await sb();
  const { data: current, error: cErr } = await client.from("plenty_inventory").select(INV_COLS).eq("id", id).maybeSingle();
  fail(cErr);
  if (!current) return null;
  const { data, error } = await client.from("plenty_inventory").update({
    quantity: fields.quantity ?? current.quantity,
    available_this_week: fields.availableThisWeek ?? current.available_this_week,
    we_need: fields.weNeed ?? current.we_need,
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
}): Promise<Visit> {
  const client = await sb();
  const { data, error } = await client.from("plenty_visits").insert({
    pantry_id: input.pantryId,
    household_id: input.householdId,
    user_id: input.userId,
    items_summary: input.itemsSummary,
    notes: input.notes
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
    contact_email: input.contactEmail
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

export async function listVolunteers(pantryId: string): Promise<(VolunteerProfile & { name: string | null; email: string | null })[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_volunteer_profiles").select("id, pantry_id, user_id, roles, has_vehicle, notes").eq("pantry_id", pantryId);
  fail(error);
  const rows = data || [];
  const ids = rows.map((r) => r.user_id);
  const { data: profiles } = ids.length
    ? await client.from("plenty_user_profiles").select("id, name, email").in("id", ids)
    : { data: [] };
  const byId = new Map((profiles || []).map((p) => [p.id, p]));
  return rows.map((row) => ({
    ...row,
    roles: asRoles(row.roles),
    name: byId.get(row.user_id)?.name ?? null,
    email: byId.get(row.user_id)?.email ?? null
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
  const { data: signups } = await client.from("plenty_shift_signups").select("shift_id").in("shift_id", shifts.map((s) => s.id));
  const counts = new Map<string, number>();
  for (const row of signups || []) counts.set(row.shift_id, (counts.get(row.shift_id) || 0) + 1);
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
  const { error: sErr } = await client.from("plenty_shift_signups").upsert({ shift_id: shiftId, user_id: userId }, { onConflict: "shift_id,user_id", ignoreDuplicates: true });
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
