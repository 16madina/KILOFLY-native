-- KiloFly native: the wallet uses the user's own currency.
-- Before: every account started in EUR (old default) and a wallet took the currency of its first payment,
-- so a traveler in Abidjan saw euros. Now the currency follows the profile country (FCFA, CAD, USD…)
-- unless the user picked one in Préférences, and an empty wallet follows any change.

alter table public.profiles add column if not exists currency_chosen boolean not null default false;

create or replace function public.currency_for_country(p_country text)
returns text
language plpgsql
immutable
as $$
declare
  c text := upper(trim(coalesce(p_country, '')));
  n text := lower(translate(replace(replace(trim(coalesce(p_country, '')), '’', ' '), '''', ' '),
                  'ÀÂÄÉÈÊËÎÏÔÖÙÛÜÇàâäéèêëîïôöùûüç', 'AAAEEEEIIOOUUUCaaaeeeeiioouuuc'));
begin
  if c = '' then return null; end if;
  if c in ('SN','CI','ML','BF','NE','TG','BJ','GW')
     or n in ('senegal','cote d ivoire','mali','burkina faso','niger','togo','benin','guinee-bissau') then return 'XOF'; end if;
  if c in ('CM','GA','CG','TD','CF','GQ')
     or n in ('cameroun','gabon','congo','tchad','republique centrafricaine','guinee equatoriale') then return 'XAF'; end if;
  if c = 'CA' or n = 'canada' then return 'CAD'; end if;
  if c = 'US' or n in ('etats-unis','usa') then return 'USD'; end if;
  if c = 'GB' or n = 'royaume-uni' then return 'GBP'; end if;
  if c = 'MA' or n = 'maroc' then return 'MAD'; end if;
  if c = 'GN' or n = 'guinee' then return 'GNF'; end if;
  return 'EUR';
end $$;

-- Profile: currency follows the country unless the user chose one in Préférences.
create or replace function public.profile_currency_from_country()
returns trigger
language plpgsql
as $$
begin
  if current_setting('kilofly.backfill', true) = '1' then return new; end if;
  if tg_op = 'UPDATE' and new.preferred_currency is distinct from old.preferred_currency
     and new.country is not distinct from old.country then
    new.currency_chosen := true;  -- explicit choice
  elsif not coalesce(new.currency_chosen, false) and public.currency_for_country(new.country) is not null then
    new.preferred_currency := public.currency_for_country(new.country);
  end if;
  return new;
end $$;

drop trigger if exists profile_currency_from_country on public.profiles;
create trigger profile_currency_from_country
  before insert or update of country, preferred_currency on public.profiles
  for each row execute function public.profile_currency_from_country();

-- An empty wallet (never credited) follows the profile currency.
create or replace function public.empty_wallet_follows_currency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.preferred_currency is distinct from old.preferred_currency and new.preferred_currency is not null then
    update public.wallets w set currency = new.preferred_currency, updated_at = now()
    where w.user_id = new.id and coalesce(w.balance, 0) = 0
      and not exists (select 1 from public.wallet_transactions wt where wt.wallet_id = w.id);
  end if;
  return new;
end $$;

drop trigger if exists empty_wallet_follows_currency on public.profiles;
create trigger empty_wallet_follows_currency
  after update of preferred_currency on public.profiles
  for each row execute function public.empty_wallet_follows_currency();

-- A new wallet opens in the traveler's own currency (payments are converted).
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
      insert into public.wallets (user_id, currency, balance)
      values (new.seller_id, coalesce((select preferred_currency from public.profiles where id = new.seller_id), t.currency, 'EUR'), 0)
      returning * into w;
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

-- Existing accounts: nobody had chosen yet (EUR was only the old default).
select set_config('kilofly.backfill', '1', false);
update public.profiles set preferred_currency = public.currency_for_country(country)
where public.currency_for_country(country) is not null
  and preferred_currency is distinct from public.currency_for_country(country);
select set_config('kilofly.backfill', '0', false);

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261127100000', 'wallet_currency_by_country', array[]::text[]) on conflict do nothing;
