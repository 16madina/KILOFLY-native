-- KiloFly native: close two gaps inherited from the Lovable schema.

-- 1. Profiles were readable in full by anyone (phone, email, ID document link, verification notes)
--    and fully updatable by their owner (including id_verified, completed_trips…).
--    Row policies stay as they are; access is narrowed per column.

revoke select, insert, update on public.profiles from anon, authenticated;

-- Public, non-sensitive columns: readable by everyone (listing cards, public profiles).
grant select (
  id, full_name, avatar_url, country, city, bio, user_type, created_at,
  id_verified, phone_verified, verified_at, completed_trips, response_rate, avg_response_time
) on public.profiles to anon, authenticated;

-- Columns a user may change on their own row (row policy already limits to auth.uid() = id).
grant update (
  full_name, avatar_url, phone, country, city, bio, user_type, preferred_currency,
  terms_accepted, terms_accepted_at, updated_at
) on public.profiles to authenticated;

-- Profile rows are created by the signup trigger; clients never insert them.

-- Full profile of the signed-in user (includes private columns).
create or replace function public.get_my_profile()
returns setof public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from public.profiles where id = auth.uid();
$$;
revoke execute on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated, service_role;

-- Changing the phone number invalidates its verification.
create or replace function public.reset_phone_verification()
returns trigger
language plpgsql
as $$
begin
  if new.phone is distinct from old.phone then
    new.phone_verified := false;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_reset_phone_verification on public.profiles;
create trigger profiles_reset_phone_verification
before update on public.profiles
for each row execute function public.reset_phone_verification();

-- 2. Avatars: three loose policies let any user overwrite or delete anyone's picture.
--    The per-folder policies ("…their own avatar") remain.
drop policy if exists "Users can upload avatars" on storage.objects;
drop policy if exists "Users can update avatars" on storage.objects;
drop policy if exists "Users can delete avatars" on storage.objects;
