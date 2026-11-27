-- KiloFly native: automatic mobile-money withdrawals through FeexPay.
-- The traveler's money only reaches the wallet once the parcel is delivered (delivery code), so a
-- withdrawal can only spend delivered money. The edge function `payouts` claims a pending request,
-- sends it with FeexPay, then settles it. Anything it cannot send (bank, Interac, unsupported country)
-- stays 'pending' for an admin, as before.

alter table public.wallet_transactions drop constraint if exists wallet_transactions_status_check;
alter table public.wallet_transactions add constraint wallet_transactions_status_check
  check (status = any (array['pending', 'processing', 'completed', 'failed', 'cancelled']));

-- Claim a pending mobile-money withdrawal for automatic sending (service role only).
create or replace function public.payout_claim(p_id uuid, p_uid uuid)
returns table (id uuid, amount numeric, currency text, method text, phone text)
language plpgsql
security definer
set search_path = public
as $$
declare wt public.wallet_transactions; w public.wallets;
begin
  select * into wt from public.wallet_transactions t where t.id = p_id and t.type = 'debit' and t.status = 'pending' for update;
  if wt.id is null then return; end if;
  select * into w from public.wallets where wallets.id = wt.wallet_id;
  if p_uid is not null and w.user_id <> p_uid and not public.is_admin_user(p_uid) then return; end if;
  if wt.payout_method not in ('wave', 'orange_money', 'mtn_momo', 'moov_money', 'free_money') then return; end if;
  update public.wallet_transactions set status = 'processing', provider = 'feexpay', updated_at = now() where wallet_transactions.id = wt.id;
  return query select wt.id, wt.amount, w.currency, wt.payout_method, wt.phone_number;
end $$;

-- Give a claimed withdrawal back to the manual queue (FeexPay unavailable, unsupported number…).
create or replace function public.payout_release(p_id uuid, p_reason text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.wallet_transactions
     set status = 'pending', provider = 'manual', updated_at = now(),
         metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('auto_payout_skipped', left(coalesce(p_reason, ''), 200))
   where id = p_id and status = 'processing' and coalesce(reference, '') = '';
$$;

create or replace function public.payout_set_reference(p_id uuid, p_reference text, p_amount_xof numeric, p_network text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.wallet_transactions
     set reference = p_reference, updated_at = now(),
         metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('feexpay_amount_xof', p_amount_xof, 'feexpay_network', p_network)
   where id = p_id and status = 'processing';
$$;

-- Final result from FeexPay.
create or replace function public.payout_settle(p_id uuid, p_success boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare wt public.wallet_transactions; w public.wallets;
begin
  select * into wt from public.wallet_transactions where id = p_id and status = 'processing' for update;
  if wt.id is null then return; end if;
  select * into w from public.wallets where id = wt.wallet_id for update;
  if p_success then
    update public.wallet_transactions set status = 'completed', updated_at = now() where id = wt.id;
    perform public.send_notification(w.user_id, 'Retrait envoyé ✅',
      wt.amount || ' ' || w.currency || ' ont été envoyés sur votre compte mobile money.', 'success', null, null, null);
  else
    update public.wallet_transactions set status = 'failed', updated_at = now(),
           metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('admin_note', coalesce(nullif(trim(p_reason), ''), 'Envoi refusé par l’opérateur'))
     where id = wt.id;
    update public.wallets set balance = balance + wt.amount, updated_at = now() where id = w.id;
    perform public.send_notification(w.user_id, 'Retrait non abouti',
      'L’envoi n’a pas pu être fait (' || coalesce(nullif(trim(p_reason), ''), 'refusé par l’opérateur') || '). Le montant est de retour sur votre portefeuille.', 'warning', null, null, null);
  end if;
end $$;

create or replace function public.is_admin_user(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = p_uid and role = 'admin') $$;

-- Money being sent counts as "withdrawing".
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
    coalesce((select sum(amount) from public.wallet_transactions where wallet_id = w.id and type = 'debit' and status in ('pending', 'processing')), 0),
    coalesce((select sum(amount) from public.wallet_transactions where wallet_id = w.id and type = 'credit' and status = 'completed' and reservation_id is not null), 0),
    public.min_withdrawal(v_cur);
end $$;

-- One withdrawal at a time, including one being sent.
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
  if exists (select 1 from public.wallet_transactions where wallet_id = w.id and type = 'debit' and status in ('pending', 'processing')) then
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

do $$
declare f text;
begin
  foreach f in array array['payout_claim(uuid, uuid)', 'payout_release(uuid, text)', 'payout_set_reference(uuid, text, numeric, text)',
                           'payout_settle(uuid, boolean, text)', 'is_admin_user(uuid)'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
  end loop;
end $$;

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261127110000', 'feexpay_payouts', array[]::text[]) on conflict do nothing;
