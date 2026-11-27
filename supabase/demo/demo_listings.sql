-- Two fictional listings (one trip, one parcel request) by the demo user, to preview the Search tabs.
insert into public.listings (id, user_id, departure, arrival, departure_date, arrival_date, available_kg, price_per_kg, currency, status, description, delivery_option)
values ('00000000-0000-4000-a000-00000000d0c1', '00000000-0000-4000-a000-00000000d001', 'Montréal', 'Abidjan',
        current_date + 10, current_date + 11, 23, 9, 'EUR', 'active',
        'Vol direct Montréal → Abidjan. J’accepte vêtements, chaussures, documents et petits appareils. Remise en main propre à Cocody ou Plateau. (démo)',
        'pickup')
on conflict (id) do nothing;

insert into public.transport_requests (id, user_id, departure, arrival, departure_date_start, departure_date_end, requested_kg, budget_max, currency, status, description)
values ('00000000-0000-4000-a000-00000000d0c2', '00000000-0000-4000-a000-00000000d001', 'Paris', 'Dakar',
        current_date + 5, current_date + 20, 5, 60, 'EUR', 'active',
        'Je cherche un voyageur pour envoyer des médicaments (avec ordonnance) et des vêtements pour ma famille à Dakar, quartier Mermoz. (démo)')
on conflict (id) do nothing;
