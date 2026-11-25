-- KiloFly native, step 2: listings & search on real data.

-- 1. The archiving job sets status = 'archived', which the old check constraint rejected.
alter table public.listings drop constraint if exists listings_status_check;
alter table public.listings
  add constraint listings_status_check check (status = any (array['active', 'completed', 'cancelled', 'archived']));

-- 2. Owners can see all their own listings (not only active ones) in "Mes annonces".
drop policy if exists "Owners can view their own listings" on public.listings;
create policy "Owners can view their own listings" on public.listings
  for select using (auth.uid() = user_id);

-- 3. One call returns everything a listing card shows: trip, remaining kilos,
--    traveler's public profile and rating. Only public profile columns are exposed.
create or replace function public.get_listing_cards(
  p_listing_id uuid default null,
  p_departure text default null,
  p_arrival text default null,
  p_mine boolean default false,
  p_favorites boolean default false,
  p_limit int default 50
)
returns table (
  id uuid,
  user_id uuid,
  departure text,
  arrival text,
  departure_date date,
  arrival_date date,
  total_kg numeric,
  remaining_kg numeric,
  price_per_kg numeric,
  currency text,
  description text,
  allowed_items text[],
  prohibited_items text[],
  delivery_option text,
  status text,
  created_at timestamptz,
  traveler_name text,
  traveler_avatar text,
  traveler_id_verified boolean,
  traveler_since timestamptz,
  traveler_trips int,
  rating numeric,
  reviews_count int,
  is_favorite boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.id, l.user_id, l.departure, l.arrival, l.departure_date, l.arrival_date,
    l.available_kg as total_kg,
    public.get_available_kg(l.id) as remaining_kg,
    l.price_per_kg, l.currency, l.description,
    coalesce(l.allowed_items, '{}'), coalesce(l.prohibited_items, '{}'),
    l.delivery_option, l.status, l.created_at,
    p.full_name, nullif(p.avatar_url, ''), coalesce(p.id_verified, false), p.created_at,
    coalesce(p.completed_trips, 0),
    r.avg_rating, coalesce(r.n, 0)::int,
    exists (select 1 from public.favorites f where f.listing_id = l.id and f.user_id = auth.uid())
  from public.listings l
  left join public.profiles p on p.id = l.user_id
  left join lateral (
    select round(avg(rv.rating)::numeric, 1) as avg_rating, count(*) as n
    from public.reviews rv where rv.reviewed_id = l.user_id
  ) r on true
  where
    case
      when p_listing_id is not null then l.id = p_listing_id and (l.status = 'active' or l.user_id = auth.uid())
      when p_mine then l.user_id = auth.uid()
      when p_favorites then exists (select 1 from public.favorites f where f.listing_id = l.id and f.user_id = auth.uid())
      else l.status = 'active' and l.departure_date >= current_date
    end
    and (p_departure is null or l.departure ilike '%' || p_departure || '%')
    and (p_arrival is null or l.arrival ilike '%' || p_arrival || '%')
  order by
    case when p_mine then l.created_at end desc,
    l.departure_date asc
  limit least(greatest(p_limit, 1), 200);
$$;
revoke execute on function public.get_listing_cards(uuid, text, text, boolean, boolean, int) from public;
grant execute on function public.get_listing_cards(uuid, text, text, boolean, boolean, int) to anon, authenticated, service_role;

-- 4. Shipping requests with the requester's public name/avatar (signed-in users only,
--    same rule as the table policy).
create or replace function public.get_request_cards(p_mine boolean default false, p_limit int default 50)
returns table (
  id uuid,
  user_id uuid,
  departure text,
  arrival text,
  departure_date_start date,
  departure_date_end date,
  requested_kg numeric,
  description text,
  budget_max numeric,
  currency text,
  status text,
  created_at timestamptz,
  requester_name text,
  requester_avatar text,
  requester_id_verified boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id, t.user_id, t.departure, t.arrival, t.departure_date_start, t.departure_date_end,
    t.requested_kg, t.description, t.budget_max, t.currency, t.status, t.created_at,
    p.full_name, nullif(p.avatar_url, ''), coalesce(p.id_verified, false)
  from public.transport_requests t
  left join public.profiles p on p.id = t.user_id
  where auth.uid() is not null
    and case
      when p_mine then t.user_id = auth.uid()
      else t.status = 'active' and coalesce(t.departure_date_end, t.departure_date_start) >= current_date
    end
  order by case when p_mine then t.created_at end desc, t.departure_date_start asc
  limit least(greatest(p_limit, 1), 200);
$$;
revoke execute on function public.get_request_cards(boolean, int) from public, anon;
grant execute on function public.get_request_cards(boolean, int) to authenticated, service_role;
