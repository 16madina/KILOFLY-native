-- KiloFly native: onboarding e-mails.
--   * e-mail address confirmed  -> "Dernière étape : vérifiez votre identité"
--   * identity approved          -> "Bienvenue sur KiloFly"
-- The trigger only pings the "documents" function with the user id; the function re-reads the
-- profile, e-mails the account owner, and logs each kind so it is never sent twice.

create table if not exists public.email_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind)
);
alter table public.email_log enable row level security;
-- no policies: server only.

create or replace function public.trigger_onboarding_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (coalesce(new.email_verified, false) and not coalesce(old.email_verified, false))
     or (coalesce(new.id_verified, false) and not coalesce(old.id_verified, false)) then
    begin
      perform net.http_post(
        url := 'https://biogcqkjpaqvncfpgoki.supabase.co/functions/v1/documents',
        body := jsonb_build_object('kind', 'lifecycle', 'user_id', new.id),
        headers := jsonb_build_object('Content-Type', 'application/json')
      );
    exception when others then
      raise warning 'onboarding e-mail failed: %', sqlerrm;
    end;
  end if;
  return new;
end $$;

drop trigger if exists on_profile_verified_send_email on public.profiles;
create trigger on_profile_verified_send_email
  after update of email_verified, id_verified on public.profiles
  for each row execute function public.trigger_onboarding_email();

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261126200000', 'onboarding_emails', array[]::text[]) on conflict do nothing;
