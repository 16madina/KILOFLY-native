-- KiloFly native: let a user delete their own account (required by Apple and Google).
-- Refused while a reservation is still open, so nobody disappears with a parcel or money in flight.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if exists (select 1 from public.reservations
             where (buyer_id = v_uid or seller_id = v_uid)
               and status in ('pending', 'approved', 'in_progress')) then
    raise exception 'active reservations';
  end if;
  delete from public.push_tokens where user_id = v_uid;
  delete from auth.users where id = v_uid;
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261126130000', 'delete_account', array[]::text[]) on conflict do nothing;
