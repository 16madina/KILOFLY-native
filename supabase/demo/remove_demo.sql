-- Removes the demo data created by demo_delivery.sql (the fictional user and everything linked to it).
delete from public.wallet_transactions where reservation_id in ('00000000-0000-4000-a000-00000000d0a2', '00000000-0000-4000-a000-00000000d0b2');
delete from public.transactions where reservation_id in ('00000000-0000-4000-a000-00000000d0a2', '00000000-0000-4000-a000-00000000d0b2');
delete from public.reservations where id in ('00000000-0000-4000-a000-00000000d0a2', '00000000-0000-4000-a000-00000000d0b2');
delete from public.listings where id = '00000000-0000-4000-a000-00000000d0a1';
delete from public.notifications where user_id = '00000000-0000-4000-a000-00000000d001'
   or message ilike '%(démo)%';
delete from auth.users where id = '00000000-0000-4000-a000-00000000d001';
delete from public.conversations where id = '00000000-0000-4000-a000-00000000dc01';
