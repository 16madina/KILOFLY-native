-- KiloFly native, step 3: offers from travelers on shipping requests.
-- Old policies let a traveler set their own offer to 'accepted' (creating a reservation for the
-- sender). Offers are now made and answered only through checked functions.

drop policy if exists "Authenticated users can create offers" on public.transport_offers;
drop policy if exists "Request owners can update offer status" on public.transport_offers;
drop policy if exists "Travelers can update their own offers" on public.transport_offers;

-- Traveler offers to carry a request, on one of their own active trips, for a total price.
create or replace function public.make_offer(p_request_id uuid, p_listing_id uuid, p_price numeric, p_message text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  q public.transport_requests;
  l public.listings;
  v_id uuid;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select * into q from public.transport_requests where id = p_request_id;
  if not found or q.status <> 'active' then raise exception 'request unavailable'; end if;
  if q.user_id = v_uid then raise exception 'cannot offer on own request'; end if;
  select * into l from public.listings where id = p_listing_id;
  if not found or l.user_id <> v_uid or l.status <> 'active' then raise exception 'listing unavailable'; end if;
  if l.departure_date < current_date then raise exception 'trip already departed'; end if;
  if q.requested_kg > public.get_available_kg(l.id) then raise exception 'not enough kg (% left)', public.get_available_kg(l.id); end if;
  if p_price is null or p_price <= 0 then raise exception 'invalid price'; end if;

  insert into public.transport_offers (request_id, traveler_id, listing_id, proposed_price, message, status)
  values (p_request_id, v_uid, p_listing_id, round(p_price, 2), nullif(trim(p_message), ''), 'pending')
  on conflict (request_id, traveler_id) do update
    set listing_id = excluded.listing_id, proposed_price = excluded.proposed_price, message = excluded.message, status = 'pending'
    where transport_offers.status <> 'accepted'
  returning id into v_id;
  if v_id is null then raise exception 'offer already accepted'; end if;
  return v_id;
end;
$$;

-- Request owner accepts (→ approved reservation via the existing trigger) or refuses an offer.
create or replace function public.respond_offer(p_offer_id uuid, p_accept boolean)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.transport_offers;
  q public.transport_requests;
  v_res uuid;
begin
  select * into o from public.transport_offers where id = p_offer_id for update;
  if not found then raise exception 'not allowed'; end if;
  select * into q from public.transport_requests where id = o.request_id for update;
  if q.user_id <> auth.uid() then raise exception 'not allowed'; end if;
  if o.status <> 'pending' then raise exception 'offer is %', o.status; end if;

  if not p_accept then
    update public.transport_offers set status = 'rejected' where id = o.id;
    return null;
  end if;

  if q.status <> 'active' then raise exception 'request unavailable'; end if;
  perform 1 from public.listings where id = o.listing_id and status = 'active' for update;
  if not found then raise exception 'listing unavailable'; end if;
  if q.requested_kg > public.get_available_kg(o.listing_id) then raise exception 'not enough kg left'; end if;

  update public.transport_offers set status = 'accepted' where id = o.id; -- trigger creates the reservation
  update public.transport_offers set status = 'rejected' where request_id = q.id and id <> o.id and status = 'pending';
  update public.transport_requests set status = 'fulfilled', updated_at = now() where id = q.id;

  select reservation_id into v_res from public.transport_offers where id = o.id;
  return v_res;
end;
$$;

-- Offers on a request: the owner sees all of them, a traveler sees their own.
create or replace function public.get_offers(p_request_id uuid)
returns table (
  id uuid,
  status text,
  proposed_price numeric,
  message text,
  created_at timestamptz,
  reservation_id uuid,
  traveler_id uuid,
  traveler_name text,
  traveler_avatar text,
  traveler_verified boolean,
  listing_id uuid,
  departure text,
  arrival text,
  departure_date date,
  currency text,
  is_mine boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select o.id, o.status, o.proposed_price, o.message, o.created_at, o.reservation_id,
         p.id, p.full_name, nullif(p.avatar_url, ''), coalesce(p.id_verified, false),
         l.id, l.departure, l.arrival, l.departure_date, l.currency,
         o.traveler_id = auth.uid()
  from public.transport_offers o
  join public.transport_requests q on q.id = o.request_id
  left join public.profiles p on p.id = o.traveler_id
  left join public.listings l on l.id = o.listing_id
  where o.request_id = p_request_id
    and auth.uid() is not null
    and (q.user_id = auth.uid() or o.traveler_id = auth.uid())
  order by o.created_at desc;
$$;

-- One request card by id (owner, or any signed-in user while it is active).
create or replace function public.get_request_card(p_request_id uuid)
returns setof public.transport_requests
language sql
stable
security definer
set search_path = public
as $$
  select * from public.transport_requests
  where id = p_request_id and auth.uid() is not null and (status = 'active' or user_id = auth.uid());
$$;

revoke execute on function public.make_offer(uuid, uuid, numeric, text) from public, anon;
revoke execute on function public.respond_offer(uuid, boolean) from public, anon;
revoke execute on function public.get_offers(uuid) from public, anon;
revoke execute on function public.get_request_card(uuid) from public, anon;
grant execute on function public.make_offer(uuid, uuid, numeric, text) to authenticated, service_role;
grant execute on function public.respond_offer(uuid, boolean) to authenticated, service_role;
grant execute on function public.get_offers(uuid) to authenticated, service_role;
grant execute on function public.get_request_card(uuid) to authenticated, service_role;
