import { DEFAULT_PANTRY_SLUG } from "@/lib/app-brand";
import { isSuperAdminEmail } from "@/lib/auth/roles";
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
const HOUSEHOLD_COLS = "id, pantry_id, user_id, display_name, household_size, dietary_notes, phone, preferred_contact, notes, email, address, city, state, zip, adults_count, children_count, family_notes, delivery_ok, porch_leave_ok, porch_notes";
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
    const { data: item } = await client.from("plenty_inventory").select("id, quantity").eq("id", input.inventoryId).maybeSingle();
    if (item) {
      const next = input.direction === "in" ? Number(item.quantity) + qty : Math.max(0, Number(item.quantity) - qty);
      await client.from("plenty_inventory").update({ quantity: next, updated_at: new Date().toISOString() }).eq("id", item.id);
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
  household_name?: string;
};

const ASSET_COLS = "id, pantry_id, kind, title, description, tenure, donor_user_id, donor_name, status, notes, created_at";
const HOUR_COLS = "id, pantry_id, user_id, shift_id, hours, worked_on, notes, created_at";
const CONTRIB_COLS = "id, pantry_id, household_id, user_id, amount_cents, waived, waive_reason, status, notes, visit_id, created_at";

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
    ? await client.from("plenty_user_profiles").select("id, name, email").in("id", ids)
    : { data: [] };
  const byId = new Map((profiles || []).map((p) => [p.id, p]));
  const byShift = new Map(shifts.map((s) => [s.id, s]));
  return ((data as ShiftSignup[]) || []).map((row) => ({
    ...row,
    status: row.status || "signed",
    title: byShift.get(row.shift_id)?.title,
    role: byShift.get(row.shift_id)?.role,
    starts_at: byShift.get(row.shift_id)?.starts_at,
    name: byId.get(row.user_id)?.name ?? null,
    email: byId.get(row.user_id)?.email ?? null
  }));
}

export async function listCoverRequests(pantryId: string): Promise<ShiftSignup[]> {
  const rows = await listShiftSignups(pantryId);
  return rows.filter((row) => row.status === "needs_cover");
}

export async function updateShiftSignup(input: {
  shiftId: string;
  userId: string;
  action: "confirm" | "need_cover" | "take_cover" | "cancel";
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
  const { data, error } = await client.from("plenty_volunteer_hours").insert({
    pantry_id: input.pantryId,
    user_id: input.userId,
    shift_id: input.shiftId,
    hours,
    worked_on: input.workedOn,
    notes: input.notes
  }).select(HOUR_COLS).single();
  fail(error);
  return data as VolunteerHour;
}

export async function listVolunteerHours(pantryId: string): Promise<VolunteerHour[]> {
  const client = await sb();
  const { data, error } = await client.from("plenty_volunteer_hours").select(HOUR_COLS).eq("pantry_id", pantryId).order("worked_on", { ascending: false }).limit(80);
  fail(error);
  const rows = (data as VolunteerHour[]) || [];
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
  const client = await sb();
  const { data, error } = await client.from("plenty_volunteer_hours").select(HOUR_COLS).eq("pantry_id", pantryId).eq("user_id", userId).order("worked_on", { ascending: false });
  fail(error);
  return (data as VolunteerHour[]) || [];
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
    status,
    notes: input.notes,
    visit_id: input.visitId ?? null
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
