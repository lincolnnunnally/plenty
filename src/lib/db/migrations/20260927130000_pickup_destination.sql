-- Deliver-to, items, and pounds on plenty_pickups.
-- Apply one statement at a time and read it back before the next.
-- Do not run this from the app. Existing rows stay valid.

alter table plenty_pickups add column if not exists dest_ally_id uuid;

alter table plenty_pickups add column if not exists dest_location_id uuid;

alter table plenty_pickups add column if not exists dest_note text not null default '';

alter table plenty_pickups add column if not exists items_text text not null default '';

alter table plenty_pickups add column if not exists pounds numeric;

alter table plenty_pickups add column if not exists source_inquiry_id text not null default '';
