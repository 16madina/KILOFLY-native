-- KiloFly native: liability contract signed in the app (sender before paying, traveler before
-- accepting / transporting). The old app only checked this in the browser; now the server refuses to
-- accept, pay or start tracking without a signature. Terms text lives here (versioned + hashed).

create or replace function public.contract_terms(p_type text)
returns jsonb
language sql
immutable
as $$
  select case p_type
    when 'sender' then jsonb_build_object(
      'version', '2026-11-26',
      'title', 'Engagement de l''expéditeur',
      'clauses', jsonb_build_array(
        'Je certifie que les articles que j''envoie sont conformes aux réglementations aéroportuaires (IATA/TSA) et ne contiennent aucun objet interdit ou dangereux.',
        'Je comprends que je suis entièrement responsable du contenu des colis que j''envoie et que KiloFly n''est pas responsable des objets transportés.',
        'Je m''engage à fournir une description exacte et honnête des articles envoyés.',
        'Je comprends qu''en cas de fausse déclaration ou d''envoi d''objets interdits, je m''expose à des poursuites légales et à une exclusion définitive de la plateforme.',
        'J''accepte que le voyageur puisse refuser le colis s''il ne correspond pas à la description fournie.'))
    when 'transporter' then jsonb_build_object(
      'version', '2026-11-26',
      'title', 'Engagement du voyageur',
      'clauses', jsonb_build_array(
        'Je suis responsable de vérifier visuellement le contenu des colis avant de les accepter.',
        'Je m''engage à refuser tout colis qui semble contenir des objets interdits ou dangereux selon les réglementations aéroportuaires (IATA/TSA).',
        'Je comprends que je suis responsable des objets que je transporte et que je peux être tenu pour responsable en cas de transport d''objets illégaux.',
        'Je m''engage à prendre soin des articles transportés et à les livrer en bon état au destinataire.',
        'Je comprends que KiloFly n''assume aucune responsabilité quant au contenu des colis transportés.',
        'J''accepte de signaler tout comportement suspect ou toute tentative de transport d''objets interdits.'))
  end
$$;

create or replace function public.has_signed_contract(p_reservation_id uuid, p_user uuid, p_type text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists (select 1 from public.legal_signatures
                     where reservation_id = p_reservation_id and user_id = p_user and signature_type = p_type) $$;

create or replace function public.sign_contract(p_reservation_id uuid, p_type text, p_signature_svg text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r public.reservations;
  v_terms jsonb := public.contract_terms(p_type);
  v_headers json;
begin
  select * into r from public.reservations where id = p_reservation_id;
  if not found then raise exception 'not allowed'; end if;
  if (p_type = 'sender' and r.buyer_id <> v_uid) or (p_type = 'transporter' and r.seller_id <> v_uid) or v_terms is null then
    raise exception 'not allowed';
  end if;
  if coalesce(p_signature_svg, '') !~ '^<svg' or length(p_signature_svg) > 60000 then raise exception 'signature required'; end if;
  if public.has_signed_contract(r.id, v_uid, p_type) then return; end if;
  begin
    v_headers := current_setting('request.headers', true)::json;
  exception when others then v_headers := null;
  end;
  insert into public.legal_signatures (user_id, reservation_id, signature_type, signature_data, ip_address, user_agent, conditions_accepted, signed_at)
  values (v_uid, r.id, p_type, p_signature_svg,
          split_part(coalesce(v_headers ->> 'x-forwarded-for', v_headers ->> 'x-real-ip', ''), ',', 1),
          left(coalesce(v_headers ->> 'user-agent', ''), 300),
          v_terms || jsonb_build_object('sha256', encode(extensions.digest(v_terms::text, 'sha256'), 'hex')),
          now());
end $$;

-- Signed contract (for either party of the reservation, or an admin).
create or replace function public.get_contracts(p_reservation_id uuid)
returns table (signature_type text, signer_name text, signed_at timestamptz, terms jsonb, signature_svg text)
language sql
stable
security definer
set search_path = public
as $$
  select s.signature_type, p.full_name, s.signed_at, s.conditions_accepted, s.signature_data
  from public.legal_signatures s
  join public.reservations r on r.id = s.reservation_id
  left join public.profiles p on p.id = s.user_id
  where s.reservation_id = p_reservation_id
    and (auth.uid() in (r.buyer_id, r.seller_id) or public.has_role(auth.uid(), 'admin'))
  order by s.signed_at
$$;

-- Signatures are written only by sign_contract().
drop policy if exists "Users can insert their own signatures" on public.legal_signatures;
drop policy if exists "Users can create their own signatures" on public.legal_signatures;

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
    if not public.has_signed_contract(r.id, auth.uid(), 'transporter') then raise exception 'contract not signed'; end if;
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
  if not public.has_signed_contract(r.id, p_buyer, 'sender') then raise exception 'contract not signed'; end if;
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
  if not public.has_signed_contract(r.id, v_uid, 'transporter') then raise exception 'contract not signed'; end if;

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

do $$
declare f text;
begin
  foreach f in array array['sign_contract(uuid, text, text)', 'get_contracts(uuid)', 'contract_terms(text)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke all on function public.has_signed_contract(uuid, uuid, text) from public, anon, authenticated;

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261126190000', 'legal_contract', array[]::text[]) on conflict do nothing;
