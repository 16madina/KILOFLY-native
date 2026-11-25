-- KiloFly native, step 3: reservations & payments, server-authoritative.
-- The old app let clients set prices, insert "paid" transactions, edit wallet balances and
-- change reservation status freely. Here every state change goes through a checked function;
-- payments are written only by server functions (service role).

------------------------------------------------------------------------------------------
-- 1. Lock down direct writes
------------------------------------------------------------------------------------------
drop policy if exists "Buyers can create reservations" on public.reservations;
drop policy if exists "Buyers can cancel their own reservations" on public.reservations;
drop policy if exists "Sellers can update reservation status" on public.reservations;

drop policy if exists "Users can create transactions as buyer" on public.transactions;

drop policy if exists "Users can update their own wallet" on public.wallets;
drop policy if exists "Users can create withdrawal requests" on public.wallet_transactions;

-- Tracking events: only the traveler (seller) of the reservation; "automatic" rows come from
-- security-definer triggers and no longer need a client-side loophole.
drop policy if exists "Sellers can create tracking events" on public.tracking_events;
create policy "Sellers can create tracking events" on public.tracking_events
  for insert with check (
    exists (select 1 from public.reservations r where r.id = tracking_events.reservation_id and r.seller_id = auth.uid())
    and coalesce(is_automatic, false) = false
  );

------------------------------------------------------------------------------------------
-- 2. Transactions: provider, currency, one live payment per reservation, 'failed' allowed
------------------------------------------------------------------------------------------
alter table public.transactions
  add column if not exists provider text,
  add column if not exists currency text,
  add column if not exists paid_at timestamptz;

alter table public.transactions drop constraint if exists transactions_status_check;
alter table public.transactions
  add constraint transactions_status_check check (status = any (array['pending', 'completed', 'cancelled', 'refunded', 'failed']));

create unique index if not exists transactions_one_live_per_reservation
  on public.transactions (reservation_id)
  where status in ('pending', 'completed');

alter table public.wallet_transactions drop constraint if exists wallet_transactions_provider_check;
alter table public.wallet_transactions
  add constraint wallet_transactions_provider_check
  check (provider = any (array['stripe', 'cinetpay', 'feexpay', 'wave', 'orange_money', 'platform', 'manual']));

------------------------------------------------------------------------------------------
-- 3. Fees (single source of truth): 5 % paid by the sender + 5 % taken from the traveler
------------------------------------------------------------------------------------------
create or replace function public.kilofly_fees(p_base numeric, p_currency text)
returns table (buyer_fee numeric, seller_fee numeric, buyer_total numeric, seller_amount numeric, platform_commission numeric)
language sql
immutable
as $$
  with f as (
    select
      case when upper(p_currency) = 'XOF' then round(p_base * 0.05) else round(p_base * 0.05, 2) end as fee
  )
  select f.fee, f.fee, p_base + f.fee, p_base - f.fee, f.fee * 2 from f;
$$;

------------------------------------------------------------------------------------------
-- 4. Reservation actions
------------------------------------------------------------------------------------------

-- Sender books kilos on a trip. Price and availability are computed here, never by the client.
create or replace function public.create_reservation(
  p_listing_id uuid,
  p_kg numeric,
  p_item_description text,
  p_recipient_phone text default null,
  p_pickup_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  l public.listings;
  v_left numeric;
  v_id uuid;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select * into l from public.listings where id = p_listing_id for update;
  if not found or l.status <> 'active' then raise exception 'listing unavailable'; end if;
  if l.user_id = v_uid then raise exception 'cannot book own listing'; end if;
  if l.departure_date < current_date then raise exception 'trip already departed'; end if;
  if p_kg is null or p_kg <= 0 then raise exception 'invalid kg'; end if;
  if coalesce(length(trim(p_item_description)), 0) < 3 then raise exception 'description required'; end if;

  v_left := public.get_available_kg(p_listing_id);
  if p_kg > v_left then raise exception 'not enough kg (% left)', v_left; end if;

  if exists (
    select 1 from public.reservations
    where listing_id = p_listing_id and buyer_id = v_uid and status in ('pending', 'approved')
  ) then
    raise exception 'reservation already open';
  end if;

  insert into public.reservations (listing_id, buyer_id, seller_id, requested_kg, total_price, item_description, recipient_phone, pickup_notes, status)
  values (p_listing_id, v_uid, l.user_id, p_kg, round(p_kg * l.price_per_kg, 2), trim(p_item_description),
          nullif(trim(p_recipient_phone), ''), nullif(trim(p_pickup_notes), ''), 'pending')
  returning id into v_id;
  return v_id;
end;
$$;

-- Traveler accepts or refuses a pending request.
create or replace function public.respond_reservation(p_reservation_id uuid, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations;
begin
  select * into r from public.reservations where id = p_reservation_id for update;
  if not found or r.seller_id <> auth.uid() then raise exception 'not allowed'; end if;
  if r.status <> 'pending' then raise exception 'reservation is %', r.status; end if;

  if p_accept then
    perform 1 from public.listings where id = r.listing_id for update;
    if r.requested_kg > public.get_available_kg(r.listing_id) then raise exception 'not enough kg left'; end if;
    update public.reservations set status = 'approved', updated_at = now() where id = r.id;
    return 'approved';
  else
    update public.reservations set status = 'rejected', updated_at = now() where id = r.id;
    return 'rejected';
  end if;
end;
$$;

-- Either party cancels before payment.
create or replace function public.cancel_reservation(p_reservation_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations;
begin
  select * into r from public.reservations where id = p_reservation_id for update;
  if not found or auth.uid() not in (r.buyer_id, r.seller_id) then raise exception 'not allowed'; end if;
  if r.status = 'cancelled' then return 'cancelled'; end if;
  if r.status not in ('pending', 'approved') then raise exception 'reservation is %', r.status; end if;
  if exists (select 1 from public.transactions where reservation_id = r.id and status = 'completed') then
    raise exception 'already paid';
  end if;

  update public.transactions set status = 'cancelled', payment_status = 'cancelled', updated_at = now()
   where reservation_id = r.id and status = 'pending';
  update public.reservations set status = 'cancelled', updated_at = now() where id = r.id;

  insert into public.notifications (user_id, title, message, type, reservation_id)
  values (
    case when auth.uid() = r.buyer_id then r.seller_id else r.buyer_id end,
    'Réservation annulée',
    'Une réservation de ' || r.requested_kg || ' kg a été annulée.',
    'reservation_cancelled',
    r.id
  );
  return 'cancelled';
end;
$$;

------------------------------------------------------------------------------------------
-- 5. Read model: my reservations as sender ("buyer") or traveler ("seller")
------------------------------------------------------------------------------------------
create or replace function public.get_my_reservations(p_role text default 'buyer', p_reservation_id uuid default null)
returns table (
  id uuid,
  role text,
  status text,
  requested_kg numeric,
  total_price numeric,
  item_description text,
  recipient_phone text,
  pickup_notes text,
  created_at timestamptz,
  listing_id uuid,
  departure text,
  arrival text,
  departure_date date,
  arrival_date date,
  price_per_kg numeric,
  currency text,
  other_id uuid,
  other_name text,
  other_avatar text,
  other_verified boolean,
  buyer_fee numeric,
  buyer_total numeric,
  seller_amount numeric,
  payment_status text,
  paid boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    case when r.buyer_id = auth.uid() then 'buyer' else 'seller' end,
    r.status, r.requested_kg, r.total_price, r.item_description, r.recipient_phone, r.pickup_notes, r.created_at,
    l.id, l.departure, l.arrival, l.departure_date, l.arrival_date, l.price_per_kg, l.currency,
    p.id, p.full_name, nullif(p.avatar_url, ''), coalesce(p.id_verified, false),
    f.buyer_fee, f.buyer_total, f.seller_amount,
    t.payment_status,
    coalesce(t.status = 'completed', false)
  from public.reservations r
  join public.listings l on l.id = r.listing_id
  join public.profiles p on p.id = case when r.buyer_id = auth.uid() then r.seller_id else r.buyer_id end
  cross join lateral public.kilofly_fees(r.total_price, l.currency) f
  left join lateral (
    select tx.status, tx.payment_status from public.transactions tx
    where tx.reservation_id = r.id and tx.status in ('pending', 'completed')
    order by tx.created_at desc limit 1
  ) t on true
  where auth.uid() is not null
    and case
      when p_reservation_id is not null then r.id = p_reservation_id and auth.uid() in (r.buyer_id, r.seller_id)
      when p_role = 'seller' then r.seller_id = auth.uid()
      else r.buyer_id = auth.uid()
    end
  order by r.created_at desc;
$$;

------------------------------------------------------------------------------------------
-- 6. Payment bookkeeping, called only by server functions (service role)
------------------------------------------------------------------------------------------

-- Creates (or reuses) the pending transaction for an approved reservation; returns amounts.
create or replace function public.begin_payment(p_reservation_id uuid, p_buyer uuid, p_provider text)
returns table (transaction_id uuid, amount numeric, currency text, item text)
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations;
  l public.listings;
  f record;
  v_tx uuid;
begin
  select * into r from public.reservations where id = p_reservation_id for update;
  if not found or r.buyer_id <> p_buyer then raise exception 'not allowed'; end if;
  if r.status <> 'approved' then raise exception 'reservation is %', r.status; end if;
  if exists (select 1 from public.transactions where reservation_id = r.id and status = 'completed') then
    raise exception 'already paid';
  end if;
  select * into l from public.listings where id = r.listing_id;
  select * into f from public.kilofly_fees(r.total_price, l.currency);

  select id into v_tx from public.transactions where reservation_id = r.id and status = 'pending';
  if v_tx is null then
    insert into public.transactions (listing_id, buyer_id, seller_id, reservation_id, amount, platform_commission, seller_amount,
                                     status, payment_status, provider, currency)
    values (r.listing_id, r.buyer_id, r.seller_id, r.id, f.buyer_total, f.platform_commission, f.seller_amount,
            'pending', 'requires_payment', p_provider, l.currency)
    returning id into v_tx;
  else
    update public.transactions
       set amount = f.buyer_total, platform_commission = f.platform_commission, seller_amount = f.seller_amount,
           provider = p_provider, currency = l.currency, payment_status = 'requires_payment', updated_at = now()
     where id = v_tx;
  end if;

  return query select v_tx, f.buyer_total, l.currency, (r.requested_kg || ' kg · ' || l.departure || ' → ' || l.arrival)::text;
end;
$$;

create or replace function public.set_payment_reference(p_transaction_id uuid, p_reference text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.transactions set stripe_payment_intent_id = p_reference, updated_at = now() where id = p_transaction_id;
$$;

-- Marks a verified payment as received: transaction completed, reservation in progress, both notified.
create or replace function public.confirm_payment(p_transaction_id uuid, p_provider_ref text, p_amount numeric)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.transactions;
  r public.reservations;
begin
  select * into t from public.transactions where id = p_transaction_id for update;
  if not found then raise exception 'unknown transaction'; end if;
  if t.status = 'completed' then return 'already'; end if;
  if p_amount is not null and abs(p_amount - t.amount) > 0.01 then raise exception 'amount mismatch'; end if;

  update public.transactions
     set status = 'completed', payment_status = 'paid', paid_at = now(),
         stripe_payment_intent_id = coalesce(p_provider_ref, stripe_payment_intent_id), updated_at = now()
   where id = t.id;

  select * into r from public.reservations where id = t.reservation_id for update;
  if r.status = 'approved' then
    update public.reservations set status = 'in_progress', updated_at = now() where id = r.id;
  end if;

  insert into public.notifications (user_id, title, message, type, reservation_id) values
    (r.seller_id, 'Paiement reçu 💰', 'L’expéditeur a payé ' || r.requested_kg || ' kg. Vous pouvez organiser la remise du colis.', 'payment_received', r.id),
    (r.buyer_id, 'Paiement confirmé', 'Votre paiement est sécurisé jusqu’à la livraison.', 'payment_confirmed', r.id);
  return 'confirmed';
end;
$$;

create or replace function public.fail_payment(p_transaction_id uuid, p_reason text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.transactions set payment_status = coalesce(p_reason, 'failed'), updated_at = now()
   where id = p_transaction_id and status = 'pending';
$$;

------------------------------------------------------------------------------------------
-- 7. Grants
------------------------------------------------------------------------------------------
revoke execute on function public.kilofly_fees(numeric, text) from public;
grant execute on function public.kilofly_fees(numeric, text) to anon, authenticated, service_role;

revoke execute on function public.create_reservation(uuid, numeric, text, text, text) from public, anon;
revoke execute on function public.respond_reservation(uuid, boolean) from public, anon;
revoke execute on function public.cancel_reservation(uuid) from public, anon;
revoke execute on function public.get_my_reservations(text, uuid) from public, anon;
grant execute on function public.create_reservation(uuid, numeric, text, text, text) to authenticated, service_role;
grant execute on function public.respond_reservation(uuid, boolean) to authenticated, service_role;
grant execute on function public.cancel_reservation(uuid) to authenticated, service_role;
grant execute on function public.get_my_reservations(text, uuid) to authenticated, service_role;

revoke execute on function public.begin_payment(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.set_payment_reference(uuid, text) from public, anon, authenticated;
revoke execute on function public.confirm_payment(uuid, text, numeric) from public, anon, authenticated;
revoke execute on function public.fail_payment(uuid, text) from public, anon, authenticated;
grant execute on function public.begin_payment(uuid, uuid, text) to service_role;
grant execute on function public.set_payment_reference(uuid, text) to service_role;
grant execute on function public.confirm_payment(uuid, text, numeric) to service_role;
grant execute on function public.fail_payment(uuid, text) to service_role;
