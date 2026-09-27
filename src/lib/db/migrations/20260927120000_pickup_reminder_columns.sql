-- Apply on the shared Life Produces Life Supabase (plenty_* tables).
-- Do not run from the app. Nullable so existing pickup rows stay valid.
-- The hourly cron at /api/cron/tick writes these once each, then skips.

alter table plenty_pickups add column if not exists reminder_24h_at timestamptz;
alter table plenty_pickups add column if not exists reminder_2h_at timestamptz;
alter table plenty_pickups add column if not exists overdue_alert_at timestamptz;
