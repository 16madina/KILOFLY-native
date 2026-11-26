-- KiloFly native: reviews after delivery + public profiles.
-- Old rule let anyone insert a review about anyone (fake 5-star reviews). Now a review can only be
-- left by the sender or the traveler of a DELIVERED reservation, once each, about the other person.

drop policy if exists "Users can create reviews for completed transactions" on public.reviews;
drop policy if exists "Users can update their own reviews" on public.reviews;

alter table public.reviews add column if not exists reservation_id uuid references public.reservations(id) on delete set null;
alter table public.reviews drop constraint if exists reviews_reviewer_id_listing_id_key;
create unique index if not exists reviews_one_per_reservation on public.reviews (reviewer_id, reservation_id);
create index if not exists reviews_reviewed on public.reviews (reviewed_id, created_at desc);

create or replace function public.submit_review(p_reservation_id uuid, p_rating int, p_comment text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r public.reservations;
  v_other uuid;
  v_name text;
begin
  select * into r from public.reservations where id = p_reservation_id;
  if not found or v_uid not in (r.buyer_id, r.seller_id) then raise exception 'not allowed'; end if;
  if r.status <> 'delivered' then raise exception 'not delivered yet'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'invalid rating'; end if;
  if length(coalesce(p_comment, '')) > 1000 then raise exception 'comment too long'; end if;
  if exists (select 1 from public.reviews where reviewer_id = v_uid and reservation_id = r.id) then raise exception 'already reviewed'; end if;
  v_other := case when v_uid = r.buyer_id then r.seller_id else r.buyer_id end;

  insert into public.reviews (reviewer_id, reviewed_id, listing_id, reservation_id, rating, comment)
  values (v_uid, v_other, r.listing_id, r.id, p_rating, nullif(trim(p_comment), ''));

  select full_name into v_name from public.profiles where id = v_uid;
  perform public.send_notification(v_other, 'Nouvel avis ⭐',
    coalesce(v_name, 'Un utilisateur') || ' vous a donné ' || p_rating || '/5.', 'info', null, r.id, null);
end $$;

-- Has the signed-in user already reviewed this reservation?
create or replace function public.my_review_for(p_reservation_id uuid)
returns table (rating int, comment text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$ select rating, comment, created_at from public.reviews where reviewer_id = auth.uid() and reservation_id = p_reservation_id $$;

create or replace function public.get_public_profile(p_user_id uuid)
returns table (
  id uuid, full_name text, avatar_url text, bio text, city text, country text, user_type text,
  id_verified boolean, member_since timestamptz, completed_trips bigint, shipments bigint,
  rating numeric, reviews bigint, active_listings bigint, is_me boolean, blocked_by_me boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, nullif(p.avatar_url, ''), p.bio, p.city, p.country, p.user_type,
         coalesce(p.id_verified, false), p.created_at,
         (select count(*) from public.reservations x where x.seller_id = p.id and x.status = 'delivered'),
         (select count(*) from public.reservations x where x.buyer_id = p.id and x.status = 'delivered'),
         (select round(avg(rating)::numeric, 1) from public.reviews where reviewed_id = p.id),
         (select count(*) from public.reviews where reviewed_id = p.id),
         (select count(*) from public.listings l where l.user_id = p.id and l.status = 'active' and l.departure_date >= current_date),
         p.id = auth.uid(),
         exists (select 1 from public.blocked_users b where b.blocker_id = auth.uid() and b.blocked_id = p.id)
  from public.profiles p
  where p.id = p_user_id and not public.is_banned(p.id)
$$;

create or replace function public.get_user_reviews(p_user_id uuid, p_limit int default 30)
returns table (id uuid, rating int, comment text, created_at timestamptz,
               reviewer_name text, reviewer_avatar text, route text, as_traveler boolean)
language sql
stable
security definer
set search_path = public
as $$
  select rv.id, rv.rating, rv.comment, rv.created_at, p.full_name, nullif(p.avatar_url, ''),
         l.departure || ' → ' || l.arrival,
         l.user_id = rv.reviewed_id
  from public.reviews rv
  left join public.profiles p on p.id = rv.reviewer_id
  left join public.listings l on l.id = rv.listing_id
  where rv.reviewed_id = p_user_id
  order by rv.created_at desc
  limit least(greatest(p_limit, 1), 100)
$$;

do $$
declare f text;
begin
  foreach f in array array['submit_review(uuid, integer, text)', 'my_review_for(uuid)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  foreach f in array array['get_public_profile(uuid)', 'get_user_reviews(uuid, integer)'] loop
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261126180000', 'reviews_public_profile', array[]::text[]) on conflict do nothing;
