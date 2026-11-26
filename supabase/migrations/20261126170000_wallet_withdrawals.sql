-- KiloFly native: real wallet + withdrawals.
--
-- Fixed from the old app:
--   * any user could create their own wallet row (with any balance) -> policy removed;
--   * delivery credits were always written to an XOF wallet even when the trip was paid in EUR/CAD
--     (an EUR amount was added as if it were francs) -> amounts are now converted to the wallet's
--     currency, and a new wallet takes the currency of its first payment;
--   * withdrawals were requested by an edge function trusting the client -> now a checked function that
--     holds the money immediately; an admin marks it paid (or refuses it, which gives the money back).

drop policy if exists "System can create wallets" on public.wallets;

alter table public.wallet_transactions drop constraint if exists wallet_transactions_payout_method_check;
alter table public.wallet_transactions add constraint wallet_transactions_payout_method_check
  check (payout_method is null or payout_method in ('wave', 'orange_money', 'mtn_momo', 'moov_money', 'free_money', 'bank_transfer', 'interac'));

-- Units of p_to for one unit of p_from (EUR-based table, CFA francs pegged to the euro).
create or replace function public.fx_rate(p_from text, p_to text)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  a numeric; b numeric;
begin
  if upper(p_from) = upper(p_to) then return 1; end if;
  a := case upper(p_from) when 'EUR' then 1 when 'XOF' then 655.957 when 'XAF' then 655.957 else
         (select rate from public.exchange_rates where base_currency = 'EUR' and target_currency = upper(p_from) limit 1) end;
  b := case upper(p_to) when 'EUR' then 1 when 'XOF' then 655.957 when 'XAF' then 655.957 else
         (select rate from public.exchange_rates where base_currency = 'EUR' and target_currency = upper(p_to) limit 1) end;
  if a is null then a := case upper(p_from) when 'CAD' then 1.5 when 'USD' then 1.08 end; end if;
  if b is null then b := case upper(p_to) when 'CAD' then 1.5 when 'USD' then 1.08 end; end if;
  if a is null or b is null or a = 0 then raise exception 'no exchange rate % -> %', p_from, p_to; end if;
  return b / a;
end $$;

create or replace function public.credit_seller_wallet_on_delivery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.transactions;
  w public.wallets;
  v_amount numeric;
begin
  if old.status is distinct from new.status and new.status = 'delivered' then
    select * into t from public.transactions
    where reservation_id = new.id and (payment_status in ('paid', 'captured', 'completed') or status = 'completed')
    limit 1;
    if t.id is null then return new; end if;
    if exists (select 1 from public.wallet_transactions where reservation_id = new.id and type = 'credit' and status = 'completed') then
      return new;
    end if;

    select * into w from public.wallets where user_id = new.seller_id for update;
    if w.id is null then
      insert into public.wallets (user_id, currency, balance) values (new.seller_id, coalesce(t.currency, 'EUR'), 0) returning * into w;
    end if;
    v_amount := round(t.seller_amount * public.fx_rate(coalesce(t.currency, w.currency), w.currency),
                      case when w.currency in ('XOF', 'XAF') then 0 else 2 end);

    update public.wallets set balance = balance + v_amount, updated_at = now() where id = w.id;
    insert into public.wallet_transactions (wallet_id, type, amount, status, provider, reservation_id, description, metadata)
    values (w.id, 'credit', v_amount, 'completed', 'platform', new.id, 'Livraison confirmée',
            jsonb_build_object('original_amount', t.seller_amount, 'original_currency', t.currency));

    perform public.send_notification(new.seller_id, '💰 Paiement reçu !',
      v_amount || ' ' || w.currency || ' ont été ajoutés à votre portefeuille.', 'success', null, new.id, null);
  end if;
  return new;
end $$;

create or replace function public.min_withdrawal(p_currency text)
returns numeric
language sql
immutable
as $$ select case upper(p_currency) when 'XOF' then 5000 when 'XAF' then 5000 when 'CAD' then 15 when 'USD' then 10 else 10 end $$;

-- Wallet summary for the signed-in user.
create or replace function public.get_my_wallet()
returns table (balance numeric, currency text, pending numeric, withdrawing numeric, total_earned numeric, min_withdrawal numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  w public.wallets;
  v_cur text;
begin
  select * into w from public.wallets where user_id = auth.uid();
  v_cur := coalesce(w.currency, (select coalesce(preferred_currency, 'EUR') from public.profiles where id = auth.uid()), 'EUR');
  return query select
    coalesce(w.balance, 0),
    v_cur,
    -- paid, not yet delivered: will be credited after delivery
    coalesce((select sum(round(t.seller_amount * public.fx_rate(coalesce(t.currency, v_cur), v_cur), 2))
              from public.reservations r join public.transactions t on t.reservation_id = r.id
              where r.seller_id = auth.uid() and r.status = 'in_progress'
                and (t.payment_status in ('paid', 'captured', 'completed') or t.status = 'completed')), 0),
    coalesce((select sum(amount) from public.wallet_transactions where wallet_id = w.id and type = 'debit' and status = 'pending'), 0),
    coalesce((select sum(amount) from public.wallet_transactions where wallet_id = w.id and type = 'credit' and status = 'completed' and reservation_id is not null), 0),
    public.min_withdrawal(v_cur);
end $$;

create or replace function public.get_my_wallet_history()
returns table (id uuid, type text, amount numeric, status text, description text, payout_method text,
               reservation_id uuid, route text, created_at timestamptz, note text)
language sql
stable
security definer
set search_path = public
as $$
  select wt.id, wt.type, wt.amount, wt.status, wt.description, wt.payout_method, wt.reservation_id,
         case when l.id is not null then l.departure || ' → ' || l.arrival end,
         wt.created_at, wt.metadata ->> 'admin_note'
  from public.wallet_transactions wt
  join public.wallets w on w.id = wt.wallet_id and w.user_id = auth.uid()
  left join public.reservations r on r.id = wt.reservation_id
  left join public.listings l on l.id = r.listing_id
  order by wt.created_at desc
  limit 200
$$;

-- Request a payout. The amount leaves the balance at once (held), an admin then pays it.
create or replace function public.request_withdrawal(p_amount numeric, p_method text, p_phone text default null, p_details jsonb default '{}'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  w public.wallets;
  v_id uuid;
  v_name text;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if public.is_banned(v_uid) then raise exception 'not allowed'; end if;
  select * into w from public.wallets where user_id = v_uid for update;
  if w.id is null then raise exception 'insufficient balance'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid amount'; end if;
  if p_amount < public.min_withdrawal(w.currency) then raise exception 'below minimum'; end if;
  if p_amount > w.balance then raise exception 'insufficient balance'; end if;
  if p_method not in ('wave', 'orange_money', 'mtn_momo', 'moov_money', 'free_money', 'bank_transfer', 'interac') then
    raise exception 'invalid method';
  end if;
  if p_method in ('wave', 'orange_money', 'mtn_momo', 'moov_money', 'free_money') and coalesce(trim(p_phone), '') !~ '^\+?[0-9 ]{8,20}$' then
    raise exception 'invalid phone';
  end if;
  if p_method = 'bank_transfer' and coalesce(trim(p_details ->> 'iban'), '') = '' then raise exception 'iban required'; end if;
  if p_method = 'interac' and coalesce(trim(p_details ->> 'email'), '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'email required'; end if;
  if exists (select 1 from public.wallet_transactions where wallet_id = w.id and type = 'debit' and status = 'pending') then
    raise exception 'withdrawal already pending';
  end if;

  update public.wallets set balance = balance - p_amount, updated_at = now() where id = w.id;
  insert into public.wallet_transactions (wallet_id, type, amount, status, provider, payout_method, phone_number, description, metadata)
  values (w.id, 'debit', p_amount, 'pending', 'manual', p_method, nullif(trim(p_phone), ''), 'Demande de retrait',
          jsonb_strip_nulls(jsonb_build_object(
            'account_name', nullif(trim(p_details ->> 'account_name'), ''),
            'iban', nullif(trim(p_details ->> 'iban'), ''),
            'email', nullif(trim(p_details ->> 'email'), ''))))
  returning id into v_id;

  -- Tell the admins.
  select full_name into v_name from public.profiles where id = v_uid;
  insert into public.notifications (user_id, title, message, type)
  select r.user_id, 'Demande de retrait', coalesce(v_name, 'Un utilisateur') || ' demande ' || p_amount || ' ' || w.currency || '.', 'info'
  from public.user_roles r where r.role = 'admin';
  return v_id;
end $$;

create or replace function public.cancel_my_withdrawal(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare wt public.wallet_transactions;
begin
  select wt2.* into wt from public.wallet_transactions wt2 join public.wallets w on w.id = wt2.wallet_id
  where wt2.id = p_id and w.user_id = auth.uid() and wt2.type = 'debit' and wt2.status = 'pending' for update;
  if wt.id is null then raise exception 'not allowed'; end if;
  update public.wallet_transactions set status = 'cancelled', updated_at = now() where id = wt.id;
  update public.wallets set balance = balance + wt.amount, updated_at = now() where id = wt.wallet_id;
end $$;

-- Admin side.
create or replace function public.admin_list_withdrawals(p_status text default 'pending')
returns table (id uuid, user_id uuid, full_name text, email text, amount numeric, currency text, payout_method text,
               phone_number text, details jsonb, status text, created_at timestamptz, balance_after numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();
  return query
  select wt.id, w.user_id, p.full_name, coalesce(p.email, u.email::text), wt.amount, w.currency, wt.payout_method,
         wt.phone_number, wt.metadata, wt.status, wt.created_at, w.balance
  from public.wallet_transactions wt
  join public.wallets w on w.id = wt.wallet_id
  left join public.profiles p on p.id = w.user_id
  left join auth.users u on u.id = w.user_id
  where wt.type = 'debit' and (p_status is null or p_status = '' or wt.status = p_status)
  order by wt.created_at desc
  limit 200;
end $$;

create or replace function public.admin_process_withdrawal(p_id uuid, p_paid boolean, p_reference text default null, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := public.admin_assert();
  wt public.wallet_transactions;
  w public.wallets;
begin
  select * into wt from public.wallet_transactions where id = p_id and type = 'debit' and status = 'pending' for update;
  if wt.id is null then raise exception 'not pending'; end if;
  select * into w from public.wallets where id = wt.wallet_id for update;
  if p_paid then
    update public.wallet_transactions
       set status = 'completed', reference = nullif(trim(p_reference), ''), updated_at = now(),
           metadata = coalesce(metadata, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object('admin_note', nullif(trim(p_note), ''), 'paid_by', v_admin))
     where id = wt.id;
    perform public.send_notification(w.user_id, 'Retrait envoyé ✅', wt.amount || ' ' || w.currency || ' ont été envoyés sur votre compte.', 'success', null, null, null);
  else
    update public.wallet_transactions
       set status = 'failed', updated_at = now(),
           metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('admin_note', coalesce(nullif(trim(p_note), ''), 'Informations de paiement incorrectes'))
     where id = wt.id;
    update public.wallets set balance = balance + wt.amount, updated_at = now() where id = w.id;
    perform public.send_notification(w.user_id, 'Retrait refusé',
      'Le montant a été remis sur votre portefeuille. Motif : ' || coalesce(nullif(trim(p_note), ''), 'informations de paiement incorrectes') || '.', 'warning', null, null, null);
  end if;
  insert into public.admin_actions (admin_id, action_type, target_user_id, details)
  values (v_admin, case when p_paid then 'withdrawal_paid' else 'withdrawal_refused' end, w.user_id, wt.amount || ' ' || w.currency);
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'get_my_wallet()', 'get_my_wallet_history()', 'request_withdrawal(numeric, text, text, jsonb)',
    'cancel_my_withdrawal(uuid)', 'admin_list_withdrawals(text)', 'admin_process_withdrawal(uuid, boolean, text, text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke all on function public.fx_rate(text, text) from public, anon, authenticated;

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261126170000', 'wallet_withdrawals', array[]::text[]) on conflict do nothing;
