-- KiloFly native: edit trips and shipping requests safely.
-- Old rules let an owner update ANY column of their listing (re-activate a listing an admin suspended,
-- change the price of a trip already paid…) and DELETE it, which cascaded and erased reservations.
-- Owners now go through checked functions; direct UPDATE/DELETE is removed.

drop policy if exists "Users can update their own listings" on public.listings;
drop policy if exists "Users can delete their own listings" on public.listings;
drop policy if exists "Users can update their own transport requests" on public.transport_requests;
drop policy if exists "Users can delete their own transport requests" on public.transport_requests;

alter table public.listings add column if not exists suspended_by_admin boolean not null default false;

-- Keep the admin flag in sync with admin suspensions.
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
  select user_id into v_owner from public.listings where id = p_listing_id;
  if v_owner is null then raise exception 'listing not found'; end if;
  if p_status = 'active' and public.is_banned(v_owner) then raise exception 'owner is banned'; end if;
  update public.listings set status = p_status, suspended_by_admin = (p_status = 'cancelled'), updated_at = now()
  where id = p_listing_id;
  insert into public.admin_actions (admin_id, action_type, target_user_id, details)
  values (v_admin, case when p_status = 'active' then 'listing_reactivate' else 'listing_suspend' end, v_owner,
          'listing ' || p_listing_id || coalesce(': ' || nullif(trim(p_reason), ''), ''));
end $$;

create or replace function public.listing_open_reservations(p_listing_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$ select count(*)::int from public.reservations where listing_id = p_listing_id and status in ('pending', 'approved', 'in_progress') $$;

create or replace function public.update_listing(
  p_listing_id uuid,
  p_departure text, p_arrival text, p_departure_date date, p_arrival_date date,
  p_available_kg numeric, p_price_per_kg numeric, p_currency text,
  p_allowed text[], p_prohibited text[], p_delivery_option text, p_description text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  l public.listings;
  v_open int;
  v_booked numeric;
begin
  select * into l from public.listings where id = p_listing_id for update;
  if not found or l.user_id <> auth.uid() then raise exception 'not allowed'; end if;
  if public.is_banned(auth.uid()) then raise exception 'not allowed'; end if;
  if p_available_kg is null or p_available_kg <= 0 or p_available_kg > 200 then raise exception 'invalid kg'; end if;
  if p_price_per_kg is null or p_price_per_kg <= 0 then raise exception 'invalid price'; end if;
  if p_arrival_date < p_departure_date then raise exception 'invalid dates'; end if;
  if length(coalesce(p_description, '')) > 2000 then raise exception 'too long'; end if;

  v_open := public.listing_open_reservations(l.id);
  v_booked := l.available_kg - public.get_available_kg(l.id);
  if v_open > 0 and (lower(trim(p_departure)) <> lower(l.departure) or lower(trim(p_arrival)) <> lower(l.arrival)
                     or p_departure_date <> l.departure_date or p_price_per_kg <> l.price_per_kg
                     or upper(p_currency) <> upper(coalesce(l.currency, 'EUR'))) then
    raise exception 'locked by reservations';
  end if;
  if p_available_kg < v_booked then raise exception 'below booked kg'; end if;
  if v_open = 0 and p_departure_date < current_date then raise exception 'date in the past'; end if;

  update public.listings set
    departure = trim(p_departure), arrival = trim(p_arrival),
    departure_date = p_departure_date, arrival_date = p_arrival_date,
    available_kg = p_available_kg, price_per_kg = p_price_per_kg, currency = upper(p_currency),
    allowed_items = p_allowed, prohibited_items = p_prohibited,
    delivery_option = p_delivery_option, description = nullif(trim(p_description), ''),
    updated_at = now()
  where id = l.id;
end $$;

create or replace function public.set_my_listing_status(p_listing_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare l public.listings;
begin
  select * into l from public.listings where id = p_listing_id for update;
  if not found or l.user_id <> auth.uid() then raise exception 'not allowed'; end if;
  if p_status = 'cancelled' then
    if public.listing_open_reservations(l.id) > 0 then raise exception 'active reservations'; end if;
  elsif p_status = 'active' then
    if l.suspended_by_admin then raise exception 'suspended by admin'; end if;
    if public.is_banned(auth.uid()) then raise exception 'not allowed'; end if;
    if l.departure_date < current_date then raise exception 'date in the past'; end if;
  else
    raise exception 'invalid status';
  end if;
  update public.listings set status = p_status, updated_at = now() where id = l.id;
end $$;

create or replace function public.update_request(
  p_request_id uuid, p_departure text, p_arrival text, p_date_start date, p_date_end date,
  p_requested_kg numeric, p_budget_max numeric, p_currency text, p_description text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare q public.transport_requests;
begin
  select * into q from public.transport_requests where id = p_request_id for update;
  if not found or q.user_id <> auth.uid() then raise exception 'not allowed'; end if;
  if q.status not in ('active', 'cancelled') then raise exception 'locked'; end if;
  if p_requested_kg is null or p_requested_kg <= 0 or p_requested_kg > 200 then raise exception 'invalid kg'; end if;
  if p_date_end is not null and p_date_end < p_date_start then raise exception 'invalid dates'; end if;
  if p_date_start < current_date then raise exception 'date in the past'; end if;
  if length(coalesce(p_description, '')) > 2000 then raise exception 'too long'; end if;
  update public.transport_requests set
    departure = trim(p_departure), arrival = trim(p_arrival),
    departure_date_start = p_date_start, departure_date_end = p_date_end,
    requested_kg = p_requested_kg, budget_max = p_budget_max, currency = upper(p_currency),
    description = nullif(trim(p_description), ''), updated_at = now()
  where id = q.id;
end $$;

create or replace function public.set_my_request_status(p_request_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare q public.transport_requests;
begin
  select * into q from public.transport_requests where id = p_request_id for update;
  if not found or q.user_id <> auth.uid() then raise exception 'not allowed'; end if;
  if p_status not in ('active', 'cancelled') or q.status not in ('active', 'cancelled') then raise exception 'invalid status'; end if;
  if p_status = 'active' and coalesce(q.departure_date_end, q.departure_date_start) < current_date then raise exception 'date in the past'; end if;
  update public.transport_requests set status = p_status, updated_at = now() where id = q.id;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'update_listing(uuid, text, text, date, date, numeric, numeric, text, text[], text[], text, text)',
    'set_my_listing_status(uuid, text)',
    'update_request(uuid, text, text, date, date, numeric, numeric, text, text)',
    'set_my_request_status(uuid, text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke all on function public.listing_open_reservations(uuid) from public, anon, authenticated;

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261126220000', 'edit_listings_requests', array[]::text[]) on conflict do nothing;
