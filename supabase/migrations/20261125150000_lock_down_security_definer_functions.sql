-- KiloFly native: tighten access to SECURITY DEFINER functions inherited from the Lovable app.
-- Trigger functions keep working (EXECUTE is not checked when a trigger fires) and
-- edge functions keep full access through the service_role.

-- 1. Nobody calls internal functions through the public API by default.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;

-- 2. Helpers that the app (and row-level security policies) legitimately call.
grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;
grant execute on function public.get_available_kg(uuid) to anon, authenticated;

-- 3. Push tokens: a user may only register tokens for themself.
create or replace function public.upsert_push_token(p_user_id uuid, p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or (p_user_id is not null and p_user_id <> auth.uid()) then
    raise exception 'not allowed';
  end if;
  insert into public.push_tokens (user_id, token, platform)
  values (auth.uid(), p_token, p_platform)
  on conflict (user_id, token)
  do update set platform = excluded.platform, updated_at = now();
end;
$$;
revoke execute on function public.upsert_push_token(uuid, text, text) from public, anon;
grant execute on function public.upsert_push_token(uuid, text, text) to authenticated, service_role;
