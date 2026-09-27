-- One row per recipient of a pickup email. status starts as accepted or failed.
-- A Resend webhook later sets delivered, bounced, failed, or delayed using provider_id.
-- Apply one statement at a time. Do not run this from the app.

create table if not exists plenty_pickup_emails (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references plenty_pantries(id) on delete cascade,
  pickup_id uuid references plenty_pickups(id) on delete cascade,
  to_email text not null,
  kind text not null,
  provider_id text not null default '',
  status text not null,
  error text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists plenty_pickup_emails_pickup_idx on plenty_pickup_emails (pickup_id, created_at desc);

create index if not exists plenty_pickup_emails_provider_idx on plenty_pickup_emails (provider_id);

alter table plenty_pickup_emails enable row level security;
