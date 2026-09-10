-- Plenty schema — additive-only on the shared Life Produces Life Supabase.
-- Every object carries the plenty_ prefix. Identity is the shared ecosystem
-- GoTrue (auth.users); plenty_user_profiles keys rows by that UUID without a
-- cross-schema FK so the app stays decoupled.

create extension if not exists pgcrypto;

create table if not exists plenty_user_profiles (
  id uuid primary key,
  email text not null unique,
  name text,
  role text not null default 'member',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plenty_user_profiles_email_idx on plenty_user_profiles (lower(email));

create table if not exists plenty_pantries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  city text not null default '',
  state text not null default '',
  zip text not null default '',
  address text not null default '',
  hours_text text not null default '',
  about text not null default '',
  phone text not null default '',
  email text not null default '',
  visit_style text not null default 'walk_in',
  status text not null default 'setup',
  source text not null default 'user',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plenty_pantries_status_idx on plenty_pantries (status);
create index if not exists plenty_pantries_city_idx on plenty_pantries (lower(city));

create table if not exists plenty_memberships (
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'neighbor',
  created_at timestamptz not null default now(),
  primary key (pantry_id, user_id, role)
);
create index if not exists plenty_memberships_user_idx on plenty_memberships (user_id);

create table if not exists plenty_households (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  user_id uuid not null,
  display_name text not null,
  household_size integer not null default 1,
  dietary_notes text not null default '',
  phone text not null default '',
  preferred_contact text not null default 'in_person',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists plenty_households_pantry_user_idx on plenty_households (pantry_id, user_id);

create table if not exists plenty_inventory (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  name text not null,
  category text not null default 'staple',
  quantity integer not null default 0,
  unit text not null default 'item',
  available_this_week boolean not null default true,
  we_need boolean not null default false,
  low_at integer,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plenty_inventory_pantry_idx on plenty_inventory (pantry_id, available_this_week);

create table if not exists plenty_visits (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  household_id uuid not null references plenty_households(id) on delete cascade,
  user_id uuid,
  visited_at timestamptz not null default now(),
  items_summary text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists plenty_visits_pantry_idx on plenty_visits (pantry_id, visited_at desc);

create table if not exists plenty_donations (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  user_id uuid,
  kind text not null,
  title text not null,
  description text not null default '',
  quantity text not null default '',
  amount_cents integer,
  available_when text not null default '',
  contact_name text not null default '',
  contact_phone text not null default '',
  contact_email text not null default '',
  status text not null default 'offered',
  steward_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plenty_donations_pantry_idx on plenty_donations (pantry_id, status, created_at desc);

create table if not exists plenty_volunteer_profiles (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  user_id uuid not null,
  roles jsonb not null default '[]'::jsonb,
  has_vehicle boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists plenty_volunteer_profiles_unique on plenty_volunteer_profiles (pantry_id, user_id);

create table if not exists plenty_shifts (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  title text not null,
  role text not null default 'serve',
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null default '',
  capacity integer,
  notes text not null default '',
  status text not null default 'open',
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists plenty_shifts_upcoming_idx on plenty_shifts (pantry_id, status, starts_at);

create table if not exists plenty_shift_signups (
  shift_id uuid not null references plenty_shifts(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (shift_id, user_id)
);
create index if not exists plenty_shift_signups_user_idx on plenty_shift_signups (user_id);

create table if not exists plenty_distributions (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  notes text not null default '',
  status text not null default 'planned',
  created_at timestamptz not null default now()
);
create index if not exists plenty_distributions_pantry_idx on plenty_distributions (pantry_id, starts_at desc);

create table if not exists plenty_paths (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  household_id uuid,
  user_id uuid not null,
  whats_hard text not null default '',
  who_they_want_to_become text not null default '',
  next_step text not null default '',
  handoff_app text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plenty_paths_user_idx on plenty_paths (user_id, created_at desc);

create table if not exists plenty_promos (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  channel text not null,
  title text not null,
  body text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists plenty_promos_pantry_idx on plenty_promos (pantry_id, created_at desc);

alter table plenty_inventory add column if not exists image_url text not null default '';

create table if not exists plenty_stock_moves (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  inventory_id uuid references plenty_inventory(id) on delete set null,
  direction text not null,
  quantity integer not null default 1,
  item_name text not null default '',
  note text not null default '',
  visit_id uuid,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists plenty_locations (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  name text not null,
  address text not null default '',
  hours_text text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists plenty_pickups (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  location_id uuid,
  kind text not null,
  scheduled_for timestamptz,
  address text not null default '',
  contact_name text not null default '',
  contact_phone text not null default '',
  notes text not null default '',
  status text not null default 'requested',
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists plenty_tax_profiles (
  pantry_id uuid primary key references plenty_pantries(id) on delete cascade,
  legal_name text not null default '',
  ein text not null default '',
  letter_url text not null default '',
  letter_text text not null default '',
  posted boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table plenty_donations add column if not exists received_at timestamptz;
alter table plenty_donations add column if not exists receipt_sent boolean not null default false;
alter table plenty_distributions add column if not exists location_id uuid;

alter table plenty_households add column if not exists email text not null default '';
alter table plenty_households add column if not exists address text not null default '';
alter table plenty_households add column if not exists city text not null default '';
alter table plenty_households add column if not exists state text not null default '';
alter table plenty_households add column if not exists zip text not null default '';
alter table plenty_households add column if not exists adults_count integer not null default 1;
alter table plenty_households add column if not exists children_count integer not null default 0;
alter table plenty_households add column if not exists family_notes text not null default '';
alter table plenty_households add column if not exists delivery_ok boolean not null default false;
alter table plenty_households add column if not exists porch_leave_ok boolean not null default false;
alter table plenty_households add column if not exists porch_notes text not null default '';

alter table plenty_visits add column if not exists location_id uuid;

alter table plenty_shift_signups add column if not exists status text not null default 'signed';
alter table plenty_shift_signups add column if not exists cover_user_id uuid;
alter table plenty_shift_signups add column if not exists confirmed_at timestamptz;

alter table plenty_pickups add column if not exists household_id uuid;
alter table plenty_pickups add column if not exists will_be_home boolean;
alter table plenty_pickups add column if not exists porch_leave_ok boolean not null default false;
alter table plenty_pickups add column if not exists assigned_user_id uuid;
alter table plenty_pickups add column if not exists window_text text not null default '';

alter table plenty_donations add column if not exists tenure text not null default '';
alter table plenty_donations add column if not exists asset_kind text not null default '';

create table if not exists plenty_assets (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  kind text not null,
  title text not null,
  description text not null default '',
  tenure text not null default 'donated',
  donor_user_id uuid,
  donor_name text not null default '',
  status text not null default 'active',
  notes text not null default '',
  donation_id uuid,
  created_at timestamptz not null default now()
);
alter table plenty_households add column if not exists food_waiver_signed_at timestamptz;
alter table plenty_households add column if not exists food_waiver_version text not null default '';

create table if not exists plenty_waivers (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  user_id uuid not null,
  household_id uuid,
  version text not null,
  signed_name text not null default '',
  agreed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists plenty_waivers_user_idx on plenty_waivers (pantry_id, user_id, created_at desc);

alter table plenty_pantries add column if not exists receive_rules text not null default '';
alter table plenty_pantries add column if not exists donation_policy text not null default 'welcome';
alter table plenty_pantries add column if not exists donation_note text not null default '';
alter table plenty_pantries add column if not exists residency_rules text not null default '';
alter table plenty_pantries add column if not exists id_required boolean not null default false;
alter table plenty_pantries add column if not exists frequency_rules text not null default '';

create table if not exists plenty_campaigns (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  audience text not null,
  extra text not null default '',
  kit jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists plenty_campaigns_pantry_idx on plenty_campaigns (pantry_id, created_at desc);

create table if not exists plenty_promo_sends (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  campaign_id uuid,
  channel text not null,
  audience text not null default '',
  to_count integer not null default 0,
  status text not null,
  error text not null default '',
  created_at timestamptz not null default now()
);

alter table plenty_assets add column if not exists description text not null default '';
alter table plenty_assets add column if not exists tenure text not null default 'donated';
alter table plenty_assets add column if not exists status text not null default 'active';
alter table plenty_assets add column if not exists notes text not null default '';
alter table plenty_assets add column if not exists donation_id uuid;
create index if not exists plenty_assets_pantry_idx on plenty_assets (pantry_id, kind, status);

create table if not exists plenty_volunteer_hours (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  user_id uuid not null,
  shift_id uuid,
  hours numeric(6,2) not null,
  worked_on date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists plenty_volunteer_hours_pantry_idx on plenty_volunteer_hours (pantry_id, user_id, worked_on desc);

create table if not exists plenty_contributions (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  household_id uuid,
  user_id uuid,
  amount_cents integer,
  waived boolean not null default false,
  waive_reason text not null default '',
  status text not null default 'received',
  notes text not null default '',
  visit_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists plenty_contributions_pantry_idx on plenty_contributions (pantry_id, created_at desc);
