-- DEMO DATA (not a migration). Creates a fictional traveler "Moussa Diop (démo)" and two paid
-- reservations with Madina, to try the tracking + delivery code screens.
--   A) Madina = sender   : Moussa carries her parcel Paris -> Dakar (in transit). Madina sees the code.
--   B) Madina = traveler : Moussa sends a parcel on Madina's trip. Delivery code = 123456.
-- Remove everything with supabase/demo/remove_demo.sql.
do $$
declare
  v_me uuid := (select id from public.profiles where full_name ilike 'madina%' order by created_at limit 1);
  v_moussa uuid := '00000000-0000-4000-a000-00000000d001';
  v_listing_a uuid := '00000000-0000-4000-a000-00000000d0a1';
  v_res_a uuid := '00000000-0000-4000-a000-00000000d0a2';
  v_res_b uuid := '00000000-0000-4000-a000-00000000d0b2';
  v_my_listing uuid;
begin
  if v_me is null then raise exception 'Madina profile not found'; end if;
  select id into v_my_listing from public.listings where user_id = v_me order by created_at desc limit 1;

  -- Fictional account (no password: nobody can sign in with it).
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, email_confirmed_at)
  values (v_moussa, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'moussa.demo@kiloflyapp.test',
          '{"full_name":"Moussa Diop (démo)","user_type":"traveler"}', '{"provider":"email","providers":["email"]}', now(), now(), now())
  on conflict (id) do nothing;
  insert into public.profiles (id, full_name, avatar_url, phone, country, city) values (v_moussa, 'Moussa Diop (démo)', '', '+33600000000', 'France', 'Paris') on conflict (id) do nothing;
  update public.profiles set full_name = 'Moussa Diop (démo)', city = 'Paris', country = 'France',
         id_verified = true, verification_method = 'demo', completed_trips = 12 where id = v_moussa;

  -- A) Moussa's trip, Madina's parcel, paid, picked up and in transit.
  insert into public.listings (id, user_id, departure, arrival, departure_date, arrival_date, available_kg, price_per_kg, currency, status, description)
  values (v_listing_a, v_moussa, 'Paris', 'Dakar', current_date - 1, current_date, 15, 10, 'EUR', 'active', 'Trajet de démonstration')
  on conflict (id) do nothing;
  insert into public.reservations (id, listing_id, buyer_id, seller_id, requested_kg, total_price, item_description, status, recipient_phone, pickup_notes)
  values (v_res_a, v_listing_a, v_me, v_moussa, 3, 30, 'Vêtements et produits de beauté (démo)', 'in_progress', '+221 77 123 45 67', 'Pour Fatou, ma mère')
  on conflict (id) do nothing;
  insert into public.transactions (listing_id, buyer_id, seller_id, amount, platform_commission, seller_amount, status, payment_status, reservation_id, provider, currency, paid_at)
  select v_listing_a, v_me, v_moussa, 31.5, 3, 28.5, 'completed', 'paid', v_res_a, 'stripe', 'EUR', now() - interval '2 days'
  where not exists (select 1 from public.transactions where reservation_id = v_res_a);
  insert into public.tracking_events (reservation_id, status, description, location_name, created_by, is_automatic, created_at)
  select v_res_a, s, d, l, v_moussa, false, t from (values
    ('picked_up', 'Colis bien reçu, bien emballé 👍', 'Paris 18e', now() - interval '26 hours'),
    ('in_transit', 'Embarquement à CDG, vol AF718', 'Aéroport Paris-CDG', now() - interval '5 hours')) v(s, d, l, t)
  where not exists (select 1 from public.tracking_events where reservation_id = v_res_a and not coalesce(is_automatic, false));

  -- B) Madina's trip, Moussa's parcel, paid and picked up. Code 123456.
  if v_my_listing is not null then
    insert into public.reservations (id, listing_id, buyer_id, seller_id, requested_kg, total_price, item_description, status, recipient_phone, pickup_notes)
    select v_res_b, v_my_listing, v_moussa, v_me, 2, 2 * l.price_per_kg, 'Documents et médicaments (démo)', 'in_progress', '+225 07 00 00 00', 'Destinataire : Awa Koné'
    from public.listings l where l.id = v_my_listing
    on conflict (id) do nothing;
    insert into public.transactions (listing_id, buyer_id, seller_id, amount, platform_commission, seller_amount, status, payment_status, reservation_id, provider, currency, paid_at)
    select v_my_listing, v_moussa, v_me, r.total_price * 1.05, r.total_price * 0.10, r.total_price * 0.95, 'completed', 'paid', v_res_b, 'stripe', coalesce(l.currency, 'EUR'), now() - interval '1 day'
    from public.reservations r join public.listings l on l.id = r.listing_id
    where r.id = v_res_b and not exists (select 1 from public.transactions where reservation_id = v_res_b);
    insert into public.reservation_secrets (reservation_id, delivery_code) values (v_res_b, '123456') on conflict do nothing;
  end if;
end $$;

select r.id, r.item_description, case when r.buyer_id = p.id then 'Madina expéditrice' else 'Madina voyageuse' end as role
from public.reservations r, public.profiles p
where p.full_name ilike 'madina%' and r.id::text like '00000000-0000-4000-a000-00000000d%';

-- Demo conversation with Moussa about trip A.
do $$
declare
  v_me uuid := (select id from public.profiles where full_name ilike 'madina%' order by created_at limit 1);
  v_moussa uuid := '00000000-0000-4000-a000-00000000d001';
  v_conv uuid := '00000000-0000-4000-a000-00000000dc01';
begin
  insert into public.conversations (id, listing_id, buyer_id, seller_id, created_at, updated_at)
  values (v_conv, '00000000-0000-4000-a000-00000000d0a1', v_me, v_moussa, now() - interval '3 days', now() - interval '2 hours')
  on conflict do nothing;
  if not exists (select 1 from public.messages where conversation_id = v_conv) then
    insert into public.messages (conversation_id, sender_id, content, read, created_at) values
      (v_conv, v_me, 'Bonjour Moussa, il vous reste de la place pour 3 kg vers Dakar ?', true, now() - interval '3 days'),
      (v_conv, v_moussa, 'Bonjour ! Oui sans problème. C''est quoi comme colis ?', true, now() - interval '3 days' + interval '20 minutes'),
      (v_conv, v_me, 'Des vêtements et des produits de beauté pour ma mère.', true, now() - interval '3 days' + interval '25 minutes'),
      (v_conv, v_moussa, 'Parfait. Je passe le récupérer demain vers 18 h, ça vous va ?', true, now() - interval '2 days'),
      (v_conv, v_moussa, 'Je viens d''atterrir à Dakar ✈️ Je vous écris quand je suis chez votre maman.', false, now() - interval '2 hours');
  end if;
end $$;
