-- Who is emailed for a pickup kind and weekday. The owner edits rows in the desk.
-- 'any' is a valid kind and a valid weekday. Many rows mean many recipients.
-- Apply one statement at a time. Do not run this from the app.
-- notify_routes stays United Under God's charity router.

create table if not exists plenty_pickup_routes (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  kind text not null default 'any',
  weekday text not null default 'any',
  email text not null,
  label text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists plenty_pickup_routes_pantry_idx on plenty_pickup_routes (pantry_id, kind, weekday);

create unique index if not exists plenty_pickup_routes_recipient_idx on plenty_pickup_routes (pantry_id, kind, weekday, lower(email));

alter table plenty_pickup_routes enable row level security;
