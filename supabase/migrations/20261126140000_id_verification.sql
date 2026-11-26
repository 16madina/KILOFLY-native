-- KiloFly native: identity verification (document + selfie), reviewed by an admin.
-- Files go to the private 'id-documents' bucket under <user_id>/ (existing policies: owner + admins).
-- id_verified can only be set by an admin through admin_review_identity().

alter table public.profiles add column if not exists id_selfie_path text;

create or replace function public.submit_identity(p_document_path text, p_selfie_path text, p_document_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if p_document_path not like v_uid::text || '/%' or p_selfie_path not like v_uid::text || '/%' then
    raise exception 'invalid files';
  end if;
  if p_document_type not in ('passport', 'id_card', 'residence_permit', 'driving_license') then
    raise exception 'invalid document type';
  end if;
  if exists (select 1 from public.profiles where id = v_uid and id_verified) then
    raise exception 'already verified';
  end if;
  update public.profiles
     set id_document_url = p_document_path,
         id_selfie_path = p_selfie_path,
         id_submitted_at = now(),
         verification_method = 'pending',
         verification_notes = p_document_type,
         updated_at = now()
   where id = v_uid;
end $$;

-- Own verification status.
create or replace function public.my_identity_status()
returns table (status text, submitted_at timestamptz, note text)
language sql
stable
security definer
set search_path = public
as $$
  select case
           when id_verified then 'verified'
           when verification_method = 'pending' then 'pending'
           when verification_method = 'rejected' then 'rejected'
           else 'none' end,
         id_submitted_at,
         case when verification_method = 'rejected' then verification_notes end
  from public.profiles where id = auth.uid()
$$;

create or replace function public.admin_list_identity_requests()
returns table (user_id uuid, full_name text, email text, document_path text, selfie_path text,
               document_type text, submitted_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();
  return query
  select p.id, p.full_name, coalesce(p.email, u.email::text), p.id_document_url, p.id_selfie_path,
         p.verification_notes, p.id_submitted_at
  from public.profiles p left join auth.users u on u.id = p.id
  where p.verification_method = 'pending' and not coalesce(p.id_verified, false)
  order by p.id_submitted_at;
end $$;

create or replace function public.admin_review_identity(p_user_id uuid, p_approve boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_admin uuid := public.admin_assert();
begin
  update public.profiles
     set id_verified = p_approve,
         verified_at = case when p_approve then now() else null end,
         verification_method = case when p_approve then 'manual' else 'rejected' end,
         verification_notes = case when p_approve then null else coalesce(nullif(trim(p_reason), ''), 'Document illisible ou non conforme') end,
         updated_at = now()
   where id = p_user_id and verification_method = 'pending';
  if not found then raise exception 'no pending request'; end if;

  insert into public.notifications (user_id, title, message, type)
  values (p_user_id,
          case when p_approve then 'Identité vérifiée ✅' else 'Vérification refusée' end,
          case when p_approve then 'Votre badge « Identité vérifiée » est maintenant visible sur votre profil.'
               else 'Motif : ' || coalesce(nullif(trim(p_reason), ''), 'document illisible ou non conforme') || '. Vous pouvez renvoyer vos documents.' end,
          case when p_approve then 'success' else 'warning' end);

  insert into public.admin_actions (admin_id, action_type, target_user_id, details)
  values (v_admin, case when p_approve then 'id_approve' else 'id_reject' end, p_user_id, nullif(trim(p_reason), ''));
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'submit_identity(text, text, text)', 'my_identity_status()',
    'admin_list_identity_requests()', 'admin_review_identity(uuid, boolean, text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261126140000', 'id_verification', array[]::text[]) on conflict do nothing;
