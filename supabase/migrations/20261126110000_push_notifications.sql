-- KiloFly native: push notifications through Expo.
-- Every row inserted into public.notifications (new reservation, status change, payment, message,
-- route alert…) is pushed to the recipient's phones via the Expo push API, using pg_net.
-- Replaces the old trigger that called a Lovable edge function which no longer exists.

create extension if not exists pg_net with schema extensions;

-- Phones register through this function (one phone = one account at a time).
create or replace function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if p_token is null or p_token !~ '^Expo(nent)?PushToken\[.+\]$' then raise exception 'invalid push token'; end if;
  if p_platform not in ('ios', 'android') then raise exception 'invalid platform'; end if;
  delete from public.push_tokens where token = p_token and user_id <> v_uid;
  insert into public.push_tokens (user_id, token, platform)
  values (v_uid, p_token, p_platform)
  on conflict (user_id, token) do update set platform = excluded.platform, updated_at = now();
end $$;

create or replace function public.unregister_push_token(p_token text)
returns void
language sql
security definer
set search_path = public
as $$ delete from public.push_tokens where token = p_token and user_id = auth.uid() $$;

revoke all on function public.register_push_token(text, text) from public, anon;
revoke all on function public.unregister_push_token(text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;

-- Tokens are only written through the functions above.
drop policy if exists "Users can insert their own push tokens" on public.push_tokens;
drop policy if exists "Users can update their own push tokens" on public.push_tokens;

create or replace function public.trigger_push_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_msgs jsonb;
  v_data jsonb;
begin
  -- Respect the user's choice to turn push off.
  if exists (select 1 from public.notification_preferences
             where user_id = new.user_id and push_enabled = false) then
    return new;
  end if;

  v_data := jsonb_strip_nulls(jsonb_build_object(
    'notification_id', new.id,
    'type', new.type,
    'reservation_id', to_jsonb(new) ->> 'reservation_id',
    'conversation_id', to_jsonb(new) ->> 'conversation_id',
    'transport_request_id', to_jsonb(new) ->> 'transport_request_id'
  ));

  select jsonb_agg(jsonb_build_object(
           'to', t.token,
           'title', new.title,
           'body', new.message,
           'data', v_data,
           'sound', 'default',
           'channelId', 'default',
           'priority', 'high'))
    into v_msgs
  from public.push_tokens t
  where t.user_id = new.user_id
    and t.token ~ '^Expo(nent)?PushToken\[';

  if v_msgs is null then return new; end if;

  -- Never block the insert if the push call fails.
  begin
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := v_msgs,
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json')
    );
  exception when others then
    raise warning 'push send failed: %', sqlerrm;
  end;
  return new;
end $$;

drop trigger if exists on_notification_created_send_push on public.notifications;
create trigger on_notification_created_send_push
  after insert on public.notifications
  for each row execute function public.trigger_push_notification();

-- Admin test: send a push to yourself (shows up as a normal notification too).
create or replace function public.admin_test_push()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := public.admin_assert();
begin
  insert into public.notifications (user_id, title, message, type)
  values (v_uid, 'Test KiloFly ✈️', 'Les notifications push fonctionnent !', 'info');
  return (select count(*) from public.push_tokens where user_id = v_uid and token ~ '^Expo(nent)?PushToken\[');
end $$;
revoke all on function public.admin_test_push() from public, anon;
grant execute on function public.admin_test_push() to authenticated;

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261126110000', 'push_notifications', array[]::text[]) on conflict do nothing;
