-- Fix: two versions of send_notification existed (4 args, and 7 args with defaults), so any
-- 4-argument call was ambiguous and failed. That broke the "new reservation" trigger, i.e. creating
-- a reservation. Keep only the 7-argument version (its defaults cover the 4-argument calls).
drop function if exists public.send_notification(uuid, text, text, text);

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261126150000', 'fix_send_notification_overload', array[]::text[]) on conflict do nothing;
