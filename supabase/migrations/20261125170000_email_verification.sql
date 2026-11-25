-- KiloFly native: optional e-mail verification done later from the profile.
-- Sign-up no longer requires confirmation, so "verified" is tracked on the profile.
-- The user proves ownership by entering the 6-digit code sent to their address;
-- the code sign-in produces a session whose JWT carries an "otp" authentication method.

alter table public.profiles
  add column if not exists email_verified boolean not null default false,
  add column if not exists email_verified_at timestamptz;

-- Public badge, like id_verified / phone_verified.
grant select (email_verified) on public.profiles to anon, authenticated;

create or replace function public.mark_email_verified()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  -- The current session must come from an e-mail code entered in the last 15 minutes.
  select exists (
    select 1
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) a
    where a ->> 'method' in ('otp', 'magiclink', 'email/signup')
      and to_timestamp((a ->> 'timestamp')::bigint) > now() - interval '15 minutes'
  ) into v_ok;

  if not v_ok then
    raise exception 'e-mail code required';
  end if;

  update public.profiles
     set email_verified = true,
         email_verified_at = coalesce(email_verified_at, now())
   where id = auth.uid();
  return true;
end;
$$;
revoke execute on function public.mark_email_verified() from public, anon;
grant execute on function public.mark_email_verified() to authenticated, service_role;
