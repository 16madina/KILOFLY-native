-- KiloFly native: "Continuer avec Google / Apple".
-- New accounts created through Google or Apple get their name (when given) and their e-mail,
-- and the e-mail counts as verified (Google/Apple already checked it), which also sends the welcome e-mail.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_provider text := coalesce(new.raw_app_meta_data->>'provider', 'email');
begin
  insert into public.profiles (
    id, full_name, avatar_url, phone, country, city, user_type, terms_accepted, terms_accepted_at, preferred_currency, email
  ) values (
    new.id,
    coalesce(nullif(trim(m->>'full_name'), ''), nullif(trim(m->>'name'), ''), 'Utilisateur'),
    coalesce(m->>'avatar_url', m->>'picture', ''),
    coalesce(m->>'phone', ''),
    coalesce(m->>'country', ''),
    coalesce(m->>'city', ''),
    coalesce(m->>'user_type', 'traveler'),
    coalesce((m->>'terms_accepted')::boolean, v_provider in ('google', 'apple')),
    case when coalesce((m->>'terms_accepted')::boolean, v_provider in ('google', 'apple')) then now() end,
    coalesce(m->>'preferred_currency', 'EUR'),
    new.email
  );
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  if v_provider in ('google', 'apple') and new.email is not null then
    update public.profiles set email_verified = true where id = new.id;
  end if;
  return new;
exception when others then
  raise warning 'Error in handle_new_user: %', sqlerrm;
  return new;
end;
$function$;

-- Apple only sends the person's name the first time, to the app itself: let the app fill it in once.
create or replace function public.set_my_name_if_missing(p_name text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set full_name = left(trim(p_name), 80), updated_at = now()
  where id = auth.uid() and length(trim(coalesce(p_name, ''))) >= 2
    and (full_name is null or full_name in ('', 'Utilisateur'));
$$;
revoke all on function public.set_my_name_if_missing(text) from public, anon;
grant execute on function public.set_my_name_if_missing(text) to authenticated;

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261126230000', 'social_login', array[]::text[]) on conflict do nothing;
