-- KiloFly native: admin panel (dashboard, users, listings, transactions).
-- Every admin action goes through a security definer function that first checks the caller
-- has the 'admin' role. Clients never get direct write access to roles, bans or other users' data.

create or replace function public.admin_assert()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.has_role(v_uid, 'admin') then
    raise exception 'admin only' using errcode = '42501';
  end if;
  return v_uid;
end $$;

-- Lets the app know whether to show the admin entry. Returns false for everyone else.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select auth.uid() is not null and public.has_role(auth.uid(), 'admin') $$;

create or replace function public.is_banned(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists (select 1 from public.banned_users where user_id = p_user_id and is_active) $$;

-- Caller's own ban status (used by the app at sign-in).
create or replace function public.my_ban_status()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select auth.uid() is not null and public.is_banned(auth.uid()) $$;

create or replace function public.admin_stats()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();
  return json_build_object(
    'users', (select count(*) from public.profiles),
    'users_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'banned', (select count(*) from public.banned_users where is_active),
    'id_pending', (select count(*) from public.profiles where id_document_url is not null and not coalesce(id_verified, false)),
    'listings_active', (select count(*) from public.listings where status = 'active'),
    'requests_active', (select count(*) from public.transport_requests where status = 'active'),
    'reservations_pending', (select count(*) from public.reservations where status = 'pending'),
    'reports_pending', (select count(*) from public.reports where status = 'pending'),
    'tx_paid', (select count(*) from public.transactions where paid_at is not null),
    'revenue', (select coalesce(json_object_agg(currency, total), '{}'::json) from (
        select coalesce(currency, 'EUR') as currency, sum(coalesce(platform_commission, 0)) as total
        from public.transactions where paid_at is not null group by 1) r),
    'volume', (select coalesce(json_object_agg(currency, total), '{}'::json) from (
        select coalesce(currency, 'EUR') as currency, sum(coalesce(amount, 0)) as total
        from public.transactions where paid_at is not null group by 1) v)
  );
end $$;

create or replace function public.admin_list_users(p_search text default null, p_limit int default 100)
returns table (
  id uuid, full_name text, email text, phone text, city text, country text, avatar_url text,
  created_at timestamptz, id_verified boolean, email_verified boolean,
  is_admin boolean, is_banned boolean, ban_reason text, listings_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();
  return query
  select p.id, p.full_name, coalesce(p.email, u.email::text), p.phone, p.city, p.country, p.avatar_url,
         p.created_at, coalesce(p.id_verified, false), coalesce(p.email_verified, false),
         public.has_role(p.id, 'admin'),
         b.user_id is not null, b.reason,
         (select count(*) from public.listings l where l.user_id = p.id)
  from public.profiles p
  left join auth.users u on u.id = p.id
  left join lateral (select bu.user_id, bu.reason from public.banned_users bu
                     where bu.user_id = p.id and bu.is_active limit 1) b on true
  where p_search is null or p_search = ''
     or p.full_name ilike '%' || p_search || '%'
     or coalesce(p.email, u.email::text) ilike '%' || p_search || '%'
     or p.phone ilike '%' || p_search || '%'
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 500);
end $$;

create or replace function public.admin_set_ban(p_user_id uuid, p_ban boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_admin uuid := public.admin_assert();
begin
  if p_user_id = v_admin then raise exception 'cannot ban yourself'; end if;
  if p_ban then
    if public.has_role(p_user_id, 'admin') then raise exception 'cannot ban an admin'; end if;
    if not public.is_banned(p_user_id) then
      insert into public.banned_users (user_id, banned_by, reason) values (p_user_id, v_admin, nullif(trim(p_reason), ''));
    end if;
    -- A banned traveler's trips stop showing in search.
    update public.listings set status = 'cancelled', updated_at = now() where user_id = p_user_id and status = 'active';
    update public.transport_requests set status = 'cancelled', updated_at = now() where user_id = p_user_id and status = 'active';
  else
    update public.banned_users set is_active = false, unbanned_at = now() where user_id = p_user_id and is_active;
  end if;
  insert into public.admin_actions (admin_id, action_type, target_user_id, details)
  values (v_admin, case when p_ban then 'ban' else 'unban' end, p_user_id, nullif(trim(p_reason), ''));
end $$;

create or replace function public.admin_list_listings(p_search text default null, p_status text default null, p_limit int default 100)
returns table (
  id uuid, user_id uuid, owner_name text, departure text, arrival text, departure_date date,
  available_kg numeric, price_per_kg numeric, currency text, status text, created_at timestamptz,
  reservations_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();
  return query
  select l.id, l.user_id, p.full_name, l.departure, l.arrival, l.departure_date,
         l.available_kg, l.price_per_kg, l.currency, l.status, l.created_at,
         (select count(*) from public.reservations r where r.listing_id = l.id)
  from public.listings l
  left join public.profiles p on p.id = l.user_id
  where (p_status is null or p_status = '' or l.status = p_status)
    and (p_search is null or p_search = ''
         or l.departure ilike '%' || p_search || '%'
         or l.arrival ilike '%' || p_search || '%'
         or p.full_name ilike '%' || p_search || '%')
  order by l.created_at desc
  limit least(greatest(p_limit, 1), 500);
end $$;

-- Suspend ('cancelled') or reactivate ('active') a listing.
create or replace function public.admin_set_listing_status(p_listing_id uuid, p_status text, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := public.admin_assert();
  v_owner uuid;
begin
  if p_status not in ('active', 'cancelled') then raise exception 'invalid status'; end if;
  update public.listings set status = p_status, updated_at = now() where id = p_listing_id returning user_id into v_owner;
  if v_owner is null then raise exception 'listing not found'; end if;
  if p_status = 'active' and public.is_banned(v_owner) then raise exception 'owner is banned'; end if;
  insert into public.admin_actions (admin_id, action_type, target_user_id, details)
  values (v_admin, case when p_status = 'active' then 'listing_reactivate' else 'listing_suspend' end, v_owner,
          'listing ' || p_listing_id || coalesce(': ' || nullif(trim(p_reason), ''), ''));
end $$;

create or replace function public.admin_list_transactions(p_limit int default 100)
returns table (
  id uuid, created_at timestamptz, paid_at timestamptz, buyer_name text, seller_name text,
  route text, amount numeric, platform_commission numeric, seller_amount numeric, currency text,
  status text, payment_status text, provider text, reservation_id uuid
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();
  return query
  select t.id, t.created_at, t.paid_at, b.full_name, s.full_name,
         coalesce(l.departure || ' → ' || l.arrival, ''),
         t.amount, t.platform_commission, t.seller_amount, t.currency,
         t.status, t.payment_status, t.provider, t.reservation_id
  from public.transactions t
  left join public.profiles b on b.id = t.buyer_id
  left join public.profiles s on s.id = t.seller_id
  left join public.listings l on l.id = t.listing_id
  order by t.created_at desc
  limit least(greatest(p_limit, 1), 500);
end $$;

create or replace function public.admin_recent_actions(p_limit int default 30)
returns table (created_at timestamptz, admin_name text, action_type text, target_name text, details text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();
  return query
  select a.created_at, ap.full_name, a.action_type, tp.full_name, a.details
  from public.admin_actions a
  left join public.profiles ap on ap.id = a.admin_id
  left join public.profiles tp on tp.id = a.target_user_id
  order by a.created_at desc
  limit least(greatest(p_limit, 1), 200);
end $$;

-- Only signed-in users may call these; each admin_* function checks the role itself.
do $$
declare f text;
begin
  foreach f in array array[
    'admin_assert()', 'is_admin()', 'my_ban_status()', 'admin_stats()',
    'admin_list_users(text, int)', 'admin_set_ban(uuid, boolean, text)',
    'admin_list_listings(text, text, int)', 'admin_set_listing_status(uuid, text, text)',
    'admin_list_transactions(int)', 'admin_recent_actions(int)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke all on function public.is_banned(uuid) from public, anon, authenticated;

-- Roles are never writable from the app; only the database owner (SQL editor) grants admin.
alter table public.user_roles enable row level security;
