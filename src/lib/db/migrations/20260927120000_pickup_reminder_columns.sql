-- Apply on the shared Life Produces Life Supabase (plenty_* tables).
-- Do not run from the app. Nullable so existing pickup rows stay valid.
-- The hourly cron at /api/cron/tick writes these once each, then skips.
-- reminder_morning_at is the 7 AM America/New_York note on the pickup day.

alter table plenty_pickups add column if not exists reminder_24h_at timestamptz;
alter table plenty_pickups add column if not exists reminder_morning_at timestamptz;
alter table plenty_pickups add column if not exists overdue_alert_at timestamptz;

-- After a production qa-delete-me test send, remove that row. Do not run this until the tester has the email:
-- delete from plenty_pickups
-- where notes ilike 'qa-delete-me-%'
--    or address ilike 'qa-delete-me-%'
--    or contact_name ilike 'qa-delete-me-%';
