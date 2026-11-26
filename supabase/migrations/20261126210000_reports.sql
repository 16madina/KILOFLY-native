-- KiloFly native: report a user / listing / conversation, and handle reports in the admin.
-- Reports are written only through report_content() (checked, rate-limited); admins resolve them
-- through admin_resolve_report().

drop policy if exists "Users can create reports" on public.reports;
drop policy if exists "Admins can update reports" on public.reports;

alter table public.reports
  add column if not exists listing_id uuid references public.listings(id) on delete set null,
  add column if not exists conversation_id uuid references public.conversations(id) on delete set null,
  add column if not exists admin_note text,
  add column if not exists resolved_by uuid references auth.users(id),
  add column if not exists resolved_at timestamptz;

create or replace function public.report_content(
  p_reported_user uuid,
  p_reason text,
  p_details text default null,
  p_listing_id uuid default null,
  p_conversation_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if p_reported_user is null or p_reported_user = v_uid then raise exception 'invalid report'; end if;
  if p_reason not in ('fraud', 'prohibited_items', 'harassment', 'fake_profile', 'no_show', 'inappropriate', 'other') then
    raise exception 'invalid reason';
  end if;
  if length(coalesce(p_details, '')) > 1000 then raise exception 'too long'; end if;
  if p_conversation_id is not null and not exists (
       select 1 from public.conversations where id = p_conversation_id and v_uid in (buyer_id, seller_id)) then
    raise exception 'invalid conversation';
  end if;
  if (select count(*) from public.reports where reporter_id = v_uid and created_at > now() - interval '1 day') >= 10 then
    raise exception 'too many reports';
  end if;
  if exists (select 1 from public.reports where reporter_id = v_uid and reported_id = p_reported_user
             and status = 'pending' and coalesce(listing_id, '00000000-0000-0000-0000-000000000000') =
                                           coalesce(p_listing_id, '00000000-0000-0000-0000-000000000000')) then
    raise exception 'already reported';
  end if;

  insert into public.reports (reporter_id, reported_id, reason, description, status, listing_id, conversation_id)
  values (v_uid, p_reported_user, p_reason, nullif(trim(p_details), ''), 'pending', p_listing_id, p_conversation_id);

  select full_name into v_name from public.profiles where id = p_reported_user;
  insert into public.notifications (user_id, title, message, type)
  select r.user_id, 'Nouveau signalement 🚩', coalesce(v_name, 'Un utilisateur') || ' a été signalé. À traiter dans Admin → Signalements.', 'warning'
  from public.user_roles r where r.role = 'admin';
end $$;

create or replace function public.admin_list_reports(p_status text default 'pending')
returns table (
  id uuid, created_at timestamptz, status text, reason text, description text, admin_note text,
  reporter_id uuid, reporter_name text, reported_id uuid, reported_name text, reported_banned boolean,
  reports_against bigint, listing_id uuid, listing_route text, listing_status text, conversation_id uuid,
  last_messages jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();
  return query
  select r.id, r.created_at, r.status, r.reason, r.description, r.admin_note,
         r.reporter_id, rp.full_name, r.reported_id, dp.full_name, public.is_banned(r.reported_id),
         (select count(distinct x.reporter_id) from public.reports x where x.reported_id = r.reported_id),
         r.listing_id, case when l.id is not null then l.departure || ' → ' || l.arrival end, l.status,
         r.conversation_id,
         -- context for the admin: the last messages of the reported conversation
         (select jsonb_agg(jsonb_build_object('from', case when m.sender_id = r.reported_id then 'signalé' else 'signaleur' end,
                                              'text', left(m.content, 300), 'at', m.created_at) order by m.created_at)
            from (select * from public.messages mm where mm.conversation_id = r.conversation_id
                  order by mm.created_at desc limit 8) m)
  from public.reports r
  left join public.profiles rp on rp.id = r.reporter_id
  left join public.profiles dp on dp.id = r.reported_id
  left join public.listings l on l.id = r.listing_id
  where p_status is null or p_status = '' or r.status = p_status
  order by r.created_at desc
  limit 200;
end $$;

-- p_action: 'dismiss' (nothing wrong), 'warn' (resolved, user notified), 'suspend_listing', 'ban'
create or replace function public.admin_resolve_report(p_report_id uuid, p_action text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := public.admin_assert();
  r public.reports;
begin
  select * into r from public.reports where id = p_report_id for update;
  if not found then raise exception 'not found'; end if;
  if p_action not in ('dismiss', 'warn', 'suspend_listing', 'ban') then raise exception 'invalid action'; end if;

  if p_action = 'ban' then
    perform public.admin_set_ban(r.reported_id, true, coalesce(nullif(trim(p_note), ''), 'Signalement : ' || r.reason));
  elsif p_action = 'suspend_listing' then
    if r.listing_id is null then raise exception 'no listing'; end if;
    perform public.admin_set_listing_status(r.listing_id, 'cancelled', 'Signalement : ' || r.reason);
  elsif p_action = 'warn' then
    perform public.send_notification(r.reported_id, 'Avertissement KiloFly',
      'Un signalement vous concernant a été examiné. Merci de respecter les règles de la communauté. '
      || coalesce(nullif(trim(p_note), ''), ''), 'warning', null, null, null);
  end if;

  update public.reports
     set status = case when p_action = 'dismiss' then 'dismissed' else 'resolved' end,
         admin_note = nullif(trim(p_note), ''), resolved_by = v_admin, resolved_at = now()
   where id = r.id;

  perform public.send_notification(r.reporter_id, 'Merci pour votre signalement',
    'Notre équipe l’a examiné et a pris les mesures nécessaires.', 'info', null, null, null);

  insert into public.admin_actions (admin_id, action_type, target_user_id, details)
  values (v_admin, 'report_' || p_action, r.reported_id, r.reason || coalesce(' · ' || nullif(trim(p_note), ''), ''));
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'report_content(uuid, text, text, uuid, uuid)', 'admin_list_reports(text)', 'admin_resolve_report(uuid, text, text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261126210000', 'reports', array[]::text[]) on conflict do nothing;
