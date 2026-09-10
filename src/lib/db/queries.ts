import { DEFAULT_PANTRY_SLUG } from "@/lib/app-brand";
import { getDatabase } from "@/lib/db/client";
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

async function sqlReady() {
  await ensurePlentySchema();
  return getDatabase();
}

export async function ensureUserProfile(user: { id: string; email: string; name: string; role: string }) {
  const sql = await sqlReady();
  await sql`
    insert into plenty_user_profiles (id, email, name, role)
    values (${user.id}, ${user.email}, ${user.name || null}, ${user.role})
    on conflict (id) do update set
      email = excluded.email,
      name = coalesce(excluded.name, plenty_user_profiles.name),
      updated_at = now()
  `;
}

export async function getPantryBySlug(slug: string): Promise<Pantry | null> {
  const sql = await sqlReady();
  const rows = await sql<Pantry>`
    select id, slug, name, city, state, zip, address, hours_text, about, phone, email, visit_style, status, source
    from plenty_pantries where slug = ${slug} limit 1
  `;
  return rows[0] ?? null;
}

export async function getDefaultPantry(): Promise<Pantry | null> {
  const bySlug = await getPantryBySlug(DEFAULT_PANTRY_SLUG);
  if (bySlug) return bySlug;
  const sql = await sqlReady();
  const rows = await sql<Pantry>`
    select id, slug, name, city, state, zip, address, hours_text, about, phone, email, visit_style, status, source
    from plenty_pantries order by created_at asc limit 1
  `;
  return rows[0] ?? null;
}

export async function listPantries(): Promise<Pantry[]> {
  const sql = await sqlReady();
  return sql<Pantry>`
    select id, slug, name, city, state, zip, address, hours_text, about, phone, email, visit_style, status, source
    from plenty_pantries order by created_at asc
  `;
}

export async function upsertPantry(
  id: string | null,
  fields: Partial<Pantry> & { name: string; slug: string; created_by?: string }
): Promise<Pantry> {
  const sql = await sqlReady();
  if (id) {
    const rows = await sql<Pantry>`
      update plenty_pantries set
        name = ${fields.name},
        slug = ${fields.slug},
        city = ${fields.city ?? ""},
        state = ${fields.state ?? ""},
        zip = ${fields.zip ?? ""},
        address = ${fields.address ?? ""},
        hours_text = ${fields.hours_text ?? ""},
        about = ${fields.about ?? ""},
        phone = ${fields.phone ?? ""},
        email = ${fields.email ?? ""},
        visit_style = ${fields.visit_style ?? "walk_in"},
        status = ${fields.status ?? "setup"},
        updated_at = now()
      where id = ${id}
      returning id, slug, name, city, state, zip, address, hours_text, about, phone, email, visit_style, status, source
    `;
    if (!rows[0]) throw new Error("Pantry not found.");
    return rows[0];
  }
  const rows = await sql<Pantry>`
    insert into plenty_pantries (
      slug, name, city, state, zip, address, hours_text, about, phone, email, visit_style, status, created_by
    ) values (
      ${fields.slug}, ${fields.name}, ${fields.city ?? ""}, ${fields.state ?? ""}, ${fields.zip ?? ""},
      ${fields.address ?? ""}, ${fields.hours_text ?? ""}, ${fields.about ?? ""}, ${fields.phone ?? ""},
      ${fields.email ?? ""}, ${fields.visit_style ?? "walk_in"}, ${fields.status ?? "setup"}, ${fields.created_by ?? null}
    )
    returning id, slug, name, city, state, zip, address, hours_text, about, phone, email, visit_style, status, source
  `;
  return rows[0];
}

export async function addMembership(pantryId: string, userId: string, role: string) {
  const sql = await sqlReady();
  await sql`
    insert into plenty_memberships (pantry_id, user_id, role)
    values (${pantryId}, ${userId}, ${role})
    on conflict do nothing
  `;
}

export async function membershipsForUser(userId: string): Promise<Membership[]> {
  const sql = await sqlReady();
  return sql<Membership>`
    select pantry_id, user_id, role from plenty_memberships where user_id = ${userId}
  `;
}

export async function isSteward(pantryId: string, userId: string, appRole?: string | null) {
  if (appRole === "owner" || appRole === "admin") return true;
  const sql = await sqlReady();
  const rows = await sql<{ c: number }>`
    select count(*)::int as c from plenty_memberships
    where pantry_id = ${pantryId} and user_id = ${userId} and role = 'steward'
  `;
  return Number(rows[0]?.c || 0) > 0;
}

export async function listPeople(pantryId: string): Promise<PersonRow[]> {
  const sql = await sqlReady();
  const rows = await sql<{ user_id: string; email: string | null; name: string | null; roles: string }>`
    select m.user_id,
           p.email,
           p.name,
           string_agg(m.role, ',' order by m.role) as roles
    from plenty_memberships m
    left join plenty_user_profiles p on p.id = m.user_id
    where m.pantry_id = ${pantryId}
    group by m.user_id, p.email, p.name
    order by p.name nulls last, p.email
  `;
  return rows.map((row) => ({
    user_id: row.user_id,
    email: row.email,
    name: row.name,
    roles: row.roles ? row.roles.split(",") : []
  }));
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
  const sql = await sqlReady();
  const rows = await sql<Household>`
    insert into plenty_households (
      pantry_id, user_id, display_name, household_size, dietary_notes, phone, preferred_contact
    ) values (
      ${input.pantryId}, ${input.userId}, ${input.displayName}, ${input.householdSize},
      ${input.dietaryNotes}, ${input.phone}, ${input.preferredContact}
    )
    on conflict (pantry_id, user_id) do update set
      display_name = excluded.display_name,
      household_size = excluded.household_size,
      dietary_notes = excluded.dietary_notes,
      phone = excluded.phone,
      preferred_contact = excluded.preferred_contact,
      updated_at = now()
    returning id, pantry_id, user_id, display_name, household_size, dietary_notes, phone, preferred_contact, notes
  `;
  await addMembership(input.pantryId, input.userId, "neighbor");
  return rows[0];
}

export async function householdForUser(pantryId: string, userId: string): Promise<Household | null> {
  const sql = await sqlReady();
  const rows = await sql<Household>`
    select id, pantry_id, user_id, display_name, household_size, dietary_notes, phone, preferred_contact, notes
    from plenty_households where pantry_id = ${pantryId} and user_id = ${userId} limit 1
  `;
  return rows[0] ?? null;
}

export async function listHouseholds(pantryId: string): Promise<Household[]> {
  const sql = await sqlReady();
  return sql<Household>`
    select id, pantry_id, user_id, display_name, household_size, dietary_notes, phone, preferred_contact, notes
    from plenty_households where pantry_id = ${pantryId} order by display_name
  `;
}

export async function listInventory(pantryId: string): Promise<InventoryItem[]> {
  const sql = await sqlReady();
  return sql<InventoryItem>`
    select id, pantry_id, name, category, quantity, unit, available_this_week, we_need, low_at, notes
    from plenty_inventory where pantry_id = ${pantryId} order by we_need desc, name
  `;
}

export async function availableThisWeek(pantryId: string): Promise<InventoryItem[]> {
  const sql = await sqlReady();
  return sql<InventoryItem>`
    select id, pantry_id, name, category, quantity, unit, available_this_week, we_need, low_at, notes
    from plenty_inventory
    where pantry_id = ${pantryId} and available_this_week = true and we_need = false
    order by category, name
  `;
}

export async function weNeedList(pantryId: string): Promise<InventoryItem[]> {
  const sql = await sqlReady();
  return sql<InventoryItem>`
    select id, pantry_id, name, category, quantity, unit, available_this_week, we_need, low_at, notes
    from plenty_inventory where pantry_id = ${pantryId} and we_need = true
    order by name
  `;
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
  const sql = await sqlReady();
  const rows = await sql<InventoryItem>`
    insert into plenty_inventory (
      pantry_id, name, category, quantity, unit, available_this_week, we_need, low_at, notes
    ) values (
      ${input.pantryId}, ${input.name}, ${input.category}, ${input.quantity}, ${input.unit},
      ${input.availableThisWeek}, ${input.weNeed}, ${input.lowAt}, ${input.notes}
    )
    returning id, pantry_id, name, category, quantity, unit, available_this_week, we_need, low_at, notes
  `;
  return rows[0];
}

export async function updateInventory(
  id: string,
  fields: { quantity?: number; availableThisWeek?: boolean; weNeed?: boolean }
): Promise<InventoryItem | null> {
  const sql = await sqlReady();
  const current = await sql<InventoryItem>`
    select id, pantry_id, name, category, quantity, unit, available_this_week, we_need, low_at, notes
    from plenty_inventory where id = ${id} limit 1
  `;
  if (!current[0]) return null;
  const quantity = fields.quantity ?? current[0].quantity;
  const available = fields.availableThisWeek ?? current[0].available_this_week;
  const weNeed = fields.weNeed ?? current[0].we_need;
  const rows = await sql<InventoryItem>`
    update plenty_inventory set
      quantity = ${quantity},
      available_this_week = ${available},
      we_need = ${weNeed},
      updated_at = now()
    where id = ${id}
    returning id, pantry_id, name, category, quantity, unit, available_this_week, we_need, low_at, notes
  `;
  return rows[0] ?? null;
}

export async function recordVisit(input: {
  pantryId: string;
  householdId: string;
  userId: string | null;
  itemsSummary: string;
  notes: string;
}): Promise<Visit> {
  const sql = await sqlReady();
  const rows = await sql<Visit>`
    insert into plenty_visits (pantry_id, household_id, user_id, items_summary, notes)
    values (${input.pantryId}, ${input.householdId}, ${input.userId}, ${input.itemsSummary}, ${input.notes})
    returning id, pantry_id, household_id, user_id, visited_at, items_summary, notes
  `;
  return rows[0];
}

export async function listVisits(pantryId: string, limit = 40): Promise<(Visit & { household_name: string })[]> {
  const sql = await sqlReady();
  return sql<Visit & { household_name: string }>`
    select v.id, v.pantry_id, v.household_id, v.user_id, v.visited_at, v.items_summary, v.notes,
           h.display_name as household_name
    from plenty_visits v
    join plenty_households h on h.id = v.household_id
    where v.pantry_id = ${pantryId}
    order by v.visited_at desc
    limit ${limit}
  `;
}

export async function visitsForUser(pantryId: string, userId: string): Promise<Visit[]> {
  const sql = await sqlReady();
  return sql<Visit>`
    select id, pantry_id, household_id, user_id, visited_at, items_summary, notes
    from plenty_visits where pantry_id = ${pantryId} and user_id = ${userId}
    order by visited_at desc
  `;
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
  const sql = await sqlReady();
  const rows = await sql<Donation>`
    insert into plenty_donations (
      pantry_id, user_id, kind, title, description, quantity, amount_cents,
      available_when, contact_name, contact_phone, contact_email
    ) values (
      ${input.pantryId}, ${input.userId}, ${input.kind}, ${input.title}, ${input.description},
      ${input.quantity}, ${input.amountCents}, ${input.availableWhen}, ${input.contactName},
      ${input.contactPhone}, ${input.contactEmail}
    )
    returning id, pantry_id, user_id, kind, title, description, quantity, amount_cents,
              available_when, contact_name, contact_phone, contact_email, status, steward_notes, created_at
  `;
  if (input.userId) await addMembership(input.pantryId, input.userId, "donor");
  return rows[0];
}

export async function listDonations(pantryId: string): Promise<Donation[]> {
  const sql = await sqlReady();
  return sql<Donation>`
    select id, pantry_id, user_id, kind, title, description, quantity, amount_cents,
           available_when, contact_name, contact_phone, contact_email, status, steward_notes, created_at
    from plenty_donations where pantry_id = ${pantryId}
    order by created_at desc
  `;
}

export async function setDonationStatus(id: string, status: string, stewardNotes: string): Promise<Donation | null> {
  const sql = await sqlReady();
  const rows = await sql<Donation>`
    update plenty_donations set status = ${status}, steward_notes = ${stewardNotes}, updated_at = now()
    where id = ${id}
    returning id, pantry_id, user_id, kind, title, description, quantity, amount_cents,
              available_when, contact_name, contact_phone, contact_email, status, steward_notes, created_at
  `;
  return rows[0] ?? null;
}

export async function upsertVolunteer(input: {
  pantryId: string;
  userId: string;
  roles: string[];
  hasVehicle: boolean;
  notes: string;
}): Promise<VolunteerProfile> {
  const sql = await sqlReady();
  const rows = await sql<{
    id: string;
    pantry_id: string;
    user_id: string;
    roles: string[] | string;
    has_vehicle: boolean;
    notes: string;
  }>`
    insert into plenty_volunteer_profiles (pantry_id, user_id, roles, has_vehicle, notes)
    values (${input.pantryId}, ${input.userId}, ${JSON.stringify(input.roles)}::jsonb, ${input.hasVehicle}, ${input.notes})
    on conflict (pantry_id, user_id) do update set
      roles = excluded.roles,
      has_vehicle = excluded.has_vehicle,
      notes = excluded.notes,
      updated_at = now()
    returning id, pantry_id, user_id, roles, has_vehicle, notes
  `;
  await addMembership(input.pantryId, input.userId, "volunteer");
  const row = rows[0];
  return {
    ...row,
    roles: Array.isArray(row.roles) ? row.roles : JSON.parse(String(row.roles || "[]"))
  };
}

export async function volunteerForUser(pantryId: string, userId: string): Promise<VolunteerProfile | null> {
  const sql = await sqlReady();
  const rows = await sql<{
    id: string;
    pantry_id: string;
    user_id: string;
    roles: string[] | string;
    has_vehicle: boolean;
    notes: string;
  }>`
    select id, pantry_id, user_id, roles, has_vehicle, notes
    from plenty_volunteer_profiles where pantry_id = ${pantryId} and user_id = ${userId} limit 1
  `;
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    ...row,
    roles: Array.isArray(row.roles) ? row.roles : JSON.parse(String(row.roles || "[]"))
  };
}

export async function listVolunteers(pantryId: string): Promise<(VolunteerProfile & { name: string | null; email: string | null })[]> {
  const sql = await sqlReady();
  const rows = await sql<{
    id: string;
    pantry_id: string;
    user_id: string;
    roles: string[] | string;
    has_vehicle: boolean;
    notes: string;
    name: string | null;
    email: string | null;
  }>`
    select v.id, v.pantry_id, v.user_id, v.roles, v.has_vehicle, v.notes, p.name, p.email
    from plenty_volunteer_profiles v
    left join plenty_user_profiles p on p.id = v.user_id
    where v.pantry_id = ${pantryId}
    order by p.name nulls last
  `;
  return rows.map((row) => ({
    ...row,
    roles: Array.isArray(row.roles) ? row.roles : JSON.parse(String(row.roles || "[]"))
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
  const sql = await sqlReady();
  const rows = await sql<Omit<Shift, "signup_count">>`
    insert into plenty_shifts (
      pantry_id, title, role, starts_at, ends_at, location, capacity, notes, created_by
    ) values (
      ${input.pantryId}, ${input.title}, ${input.role}, ${input.startsAt}, ${input.endsAt},
      ${input.location}, ${input.capacity}, ${input.notes}, ${input.createdBy}
    )
    returning id, pantry_id, title, role, starts_at, ends_at, location, capacity, notes, status
  `;
  return { ...rows[0], signup_count: 0 };
}

export async function listShifts(pantryId: string): Promise<Shift[]> {
  const sql = await sqlReady();
  return sql<Shift>`
    select s.id, s.pantry_id, s.title, s.role, s.starts_at, s.ends_at, s.location, s.capacity, s.notes, s.status,
           count(u.user_id)::int as signup_count
    from plenty_shifts s
    left join plenty_shift_signups u on u.shift_id = s.id
    where s.pantry_id = ${pantryId} and s.status = 'open'
    group by s.id
    order by s.starts_at asc
  `;
}

export async function signupForShift(shiftId: string, userId: string) {
  const sql = await sqlReady();
  const shift = await sql<{ pantry_id: string; capacity: number | null; status: string }>`
    select pantry_id, capacity, status from plenty_shifts where id = ${shiftId} limit 1
  `;
  if (!shift[0]) throw new Error("That shift is not on the board.");
  if (shift[0].status !== "open") throw new Error("That shift is no longer open.");
  const count = await sql<{ c: number }>`select count(*)::int as c from plenty_shift_signups where shift_id = ${shiftId}`;
  if (shift[0].capacity != null && Number(count[0]?.c || 0) >= shift[0].capacity) {
    throw new Error("That shift is full.");
  }
  await sql`
    insert into plenty_shift_signups (shift_id, user_id)
    values (${shiftId}, ${userId})
    on conflict do nothing
  `;
  await addMembership(shift[0].pantry_id, userId, "volunteer");
}

export async function myShiftIds(userId: string): Promise<string[]> {
  const sql = await sqlReady();
  const rows = await sql<{ shift_id: string }>`select shift_id from plenty_shift_signups where user_id = ${userId}`;
  return rows.map((r) => r.shift_id);
}

export async function addDistribution(input: {
  pantryId: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  notes: string;
}): Promise<Distribution> {
  const sql = await sqlReady();
  const rows = await sql<Distribution>`
    insert into plenty_distributions (pantry_id, title, starts_at, ends_at, notes)
    values (${input.pantryId}, ${input.title}, ${input.startsAt}, ${input.endsAt}, ${input.notes})
    returning id, pantry_id, title, starts_at, ends_at, notes, status
  `;
  return rows[0];
}

export async function listDistributions(pantryId: string): Promise<Distribution[]> {
  const sql = await sqlReady();
  return sql<Distribution>`
    select id, pantry_id, title, starts_at, ends_at, notes, status
    from plenty_distributions where pantry_id = ${pantryId}
    order by starts_at desc
  `;
}

export async function setDistributionStatus(id: string, status: string): Promise<Distribution | null> {
  const sql = await sqlReady();
  const rows = await sql<Distribution>`
    update plenty_distributions set status = ${status} where id = ${id}
    returning id, pantry_id, title, starts_at, ends_at, notes, status
  `;
  return rows[0] ?? null;
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
  const sql = await sqlReady();
  const rows = await sql<PathRow>`
    insert into plenty_paths (
      pantry_id, household_id, user_id, whats_hard, who_they_want_to_become, next_step, handoff_app
    ) values (
      ${input.pantryId}, ${input.householdId}, ${input.userId}, ${input.whatsHard},
      ${input.whoTheyWantToBecome}, ${input.nextStep}, ${input.handoffApp}
    )
    returning id, pantry_id, household_id, user_id, whats_hard, who_they_want_to_become, next_step, handoff_app, status, created_at
  `;
  return rows[0];
}

export async function pathsForUser(userId: string): Promise<PathRow[]> {
  const sql = await sqlReady();
  return sql<PathRow>`
    select id, pantry_id, household_id, user_id, whats_hard, who_they_want_to_become, next_step, handoff_app, status, created_at
    from plenty_paths where user_id = ${userId} order by created_at desc
  `;
}

export async function listPaths(pantryId: string): Promise<PathRow[]> {
  const sql = await sqlReady();
  return sql<PathRow>`
    select id, pantry_id, household_id, user_id, whats_hard, who_they_want_to_become, next_step, handoff_app, status, created_at
    from plenty_paths where pantry_id = ${pantryId} order by created_at desc
  `;
}

export async function addPromo(input: {
  pantryId: string;
  channel: string;
  title: string;
  body: string;
  createdBy: string | null;
}): Promise<Promo> {
  const sql = await sqlReady();
  const rows = await sql<Promo>`
    insert into plenty_promos (pantry_id, channel, title, body, created_by)
    values (${input.pantryId}, ${input.channel}, ${input.title}, ${input.body}, ${input.createdBy})
    returning id, pantry_id, channel, title, body, created_at
  `;
  return rows[0];
}

export async function listPromos(pantryId: string): Promise<Promo[]> {
  const sql = await sqlReady();
  return sql<Promo>`
    select id, pantry_id, channel, title, body, created_at
    from plenty_promos where pantry_id = ${pantryId} order by created_at desc
  `;
}

export async function pantryStats(pantryId: string) {
  const sql = await sqlReady();
  const rows = await sql<{
    households: number;
    visits: number;
    volunteers: number;
    open_offers: number;
    available_items: number;
    we_need: number;
  }>`
    select
      (select count(*)::int from plenty_households where pantry_id = ${pantryId}) as households,
      (select count(*)::int from plenty_visits where pantry_id = ${pantryId}) as visits,
      (select count(*)::int from plenty_volunteer_profiles where pantry_id = ${pantryId}) as volunteers,
      (select count(*)::int from plenty_donations where pantry_id = ${pantryId} and status = 'offered') as open_offers,
      (select count(*)::int from plenty_inventory where pantry_id = ${pantryId} and available_this_week = true and we_need = false) as available_items,
      (select count(*)::int from plenty_inventory where pantry_id = ${pantryId} and we_need = true) as we_need
  `;
  return rows[0];
}
