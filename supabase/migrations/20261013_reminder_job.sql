-- Languago lesson reminders: Supabase calls the site every 10 minutes.
-- Applied to production on 2026-10-10 (SQL editor, approved by the owner).
-- The endpoint is safe to call (each reminder is handed out once) and holds
-- no secrets; it needs SUPABASE_SERVICE_ROLE_KEY in Vercel to send anything.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.unschedule(jobid) from cron.job where jobname = 'languago-lesson-reminders';
select cron.schedule('languago-lesson-reminders', '*/10 * * * *', $$ select net.http_get('https://www.languago.site/api/cron/reminders') $$);
