-- KiloFly native: package tracking and proof of delivery.
--
-- Old app problems fixed here: the traveler could mark a parcel "delivered" on their own (and get
-- paid), any user could insert fake tracking events, and the delivery photo sat next to ID documents.
--
-- New flow (all through checked functions):
--   * only the traveler of a PAID reservation (status in_progress) advances the steps, forward only:
--       picked_up -> in_transit -> arrived -> delivered
--   * "delivered" needs the 6-digit delivery code that only the sender sees (they pass it to the
--     recipient), the recipient's name and their signature drawn on the traveler's phone; a photo is
--     optional. Then the reservation becomes 'delivered' and the existing trigger credits the
--     traveler's wallet.
--   * photos go to a private 'delivery-proofs' bucket, readable only by the two parties (and admins).

alter table public.tracking_events
  add column if not exists photo_path text,
  add column if not exists recipient_name text,
  add column if not exists signature_svg text;

-- Delivery codes live apart from reservations so the traveler can never read them.
create table if not exists public.reservation_secrets (
  reservation_id uuid primary key references public.reservations(id) on delete cascade,
  delivery_code text not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.reservation_secrets enable row level security;
-- no policies: only security definer functions touch it.

-- Tracking events are only written by functions / triggers now.
drop policy if exists "Sellers can create tracking events" on public.tracking_events;

create or replace function public.tracking_step_rank(p_status text)
returns int
language sql
immutable
as $$ select case p_status
  when 'picked_up' then 1 when 'in_transit' then 2 when 'arrived' then 3 when 'delivered' then 4 else 0 end $$;

-- Sender only: the code to give to the person who receives the parcel.
create or replace function public.get_delivery_code(p_reservation_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations;
  v_code text;
begin
  select * into r from public.reservations where id = p_reservation_id;
  if not found or r.buyer_id <> auth.uid() then raise exception 'not allowed'; end if;
  if r.status not in ('in_progress', 'delivered') then return null; end if;
  select delivery_code into v_code from public.reservation_secrets where reservation_id = r.id;
  if v_code is null then
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    insert into public.reservation_secrets (reservation_id, delivery_code) values (r.id, v_code)
    on conflict (reservation_id) do nothing;
    select delivery_code into v_code from public.reservation_secrets where reservation_id = r.id;
  end if;
  return v_code;
end $$;

create or replace function public.advance_tracking(
  p_reservation_id uuid,
  p_step text,
  p_note text default null,
  p_location text default null,
  p_photo_path text default null,
  p_recipient_name text default null,
  p_signature_svg text default null,
  p_code text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r public.reservations;
  v_current int;
  v_secret public.reservation_secrets;
  v_label text;
begin
  select * into r from public.reservations where id = p_reservation_id for update;
  if not found or r.seller_id <> v_uid then raise exception 'not allowed'; end if;
  if r.status <> 'in_progress' then raise exception 'reservation not in progress'; end if;
  if public.tracking_step_rank(p_step) = 0 then raise exception 'invalid step'; end if;

  select coalesce(max(public.tracking_step_rank(status)), 0) into v_current
  from public.tracking_events where reservation_id = r.id and not coalesce(is_automatic, false);
  if public.tracking_step_rank(p_step) <= v_current then raise exception 'step already done'; end if;

  if p_photo_path is not null and p_photo_path not like r.id::text || '/%' then raise exception 'invalid photo'; end if;
  if length(coalesce(p_note, '')) > 500 or length(coalesce(p_location, '')) > 120 then raise exception 'text too long'; end if;

  if p_step = 'delivered' then
    if coalesce(trim(p_recipient_name), '') = '' then raise exception 'recipient name required'; end if;
    if coalesce(p_signature_svg, '') = '' or length(p_signature_svg) > 60000 or p_signature_svg !~ '^<svg' then
      raise exception 'signature required';
    end if;
    select * into v_secret from public.reservation_secrets where reservation_id = r.id for update;
    if not found then raise exception 'sender has not opened the delivery code yet'; end if;
    if v_secret.attempts >= 5 then raise exception 'too many attempts'; end if;
    if coalesce(trim(p_code), '') <> v_secret.delivery_code then
      update public.reservation_secrets set attempts = attempts + 1 where reservation_id = r.id;
      raise exception 'wrong delivery code';
    end if;
  else
    p_signature_svg := null;
    p_recipient_name := null;
  end if;

  v_label := case p_step
    when 'picked_up' then 'Colis remis au voyageur'
    when 'in_transit' then 'Colis en route'
    when 'arrived' then 'Arrivé à destination'
    when 'delivered' then 'Livré à ' || trim(p_recipient_name) end;

  insert into public.tracking_events (reservation_id, status, description, location_name, created_by, is_automatic,
                                      photo_path, recipient_name, signature_svg)
  values (r.id, p_step, coalesce(nullif(trim(p_note), ''), v_label), nullif(trim(p_location), ''), v_uid, false,
          p_photo_path, nullif(trim(p_recipient_name), ''), p_signature_svg);

  if p_step = 'delivered' then
    -- Fires the wallet credit and the "delivered" notification triggers.
    update public.reservations set status = 'delivered', updated_at = now() where id = r.id;
  end if;
end $$;

-- Timeline for either party (and admins).
create or replace function public.get_tracking(p_reservation_id uuid)
returns table (
  id uuid, status text, description text, location_name text, is_automatic boolean,
  photo_path text, recipient_name text, has_signature boolean, created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.reservations
                 where id = p_reservation_id and (buyer_id = auth.uid() or seller_id = auth.uid()))
     and not public.has_role(auth.uid(), 'admin') then
    raise exception 'not allowed';
  end if;
  return query
  select e.id, e.status, e.description, e.location_name, coalesce(e.is_automatic, false),
         e.photo_path, e.recipient_name, e.signature_svg is not null, e.created_at
  from public.tracking_events e
  where e.reservation_id = p_reservation_id
  order by e.created_at;
end $$;

create or replace function public.get_delivery_signature(p_event_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select e.signature_svg from public.tracking_events e
  join public.reservations r on r.id = e.reservation_id
  where e.id = p_event_id
    and (r.buyer_id = auth.uid() or r.seller_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'get_delivery_code(uuid)', 'advance_tracking(uuid, text, text, text, text, text, text, text)',
    'get_tracking(uuid)', 'get_delivery_signature(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- Private bucket for delivery photos: <reservation_id>/<file>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('delivery-proofs', 'delivery-proofs', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

drop policy if exists "Travelers upload delivery proofs" on storage.objects;
create policy "Travelers upload delivery proofs" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'delivery-proofs'
    and exists (select 1 from public.reservations r
                where r.id::text = (storage.foldername(name))[1]
                  and r.seller_id = auth.uid() and r.status = 'in_progress')
  );

drop policy if exists "Parties read delivery proofs" on storage.objects;
create policy "Parties read delivery proofs" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'delivery-proofs'
    and (exists (select 1 from public.reservations r
                 where r.id::text = (storage.foldername(name))[1]
                   and (r.buyer_id = auth.uid() or r.seller_id = auth.uid()))
         or public.has_role(auth.uid(), 'admin'))
  );

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261126120000', 'tracking_delivery', array[]::text[]) on conflict do nothing;
