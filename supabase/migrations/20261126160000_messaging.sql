-- KiloFly native: real messaging (one conversation per listing between a sender and a traveler).
-- Old rules let a participant edit or delete the other person's messages, start a conversation on
-- any listing with anyone, and ignored blocks. Writes now go through checked functions; reading
-- (and realtime) still uses the existing "participants only" select policies.

drop policy if exists "Users can create conversations" on public.conversations;
drop policy if exists "Users can send messages in their conversations" on public.messages;
drop policy if exists "Users can update their own messages" on public.messages;
drop policy if exists "Users can delete their own messages" on public.messages;

create unique index if not exists conversations_unique_triplet on public.conversations (listing_id, buyer_id, seller_id);
create index if not exists messages_conversation_created on public.messages (conversation_id, created_at);

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists (select 1 from public.blocked_users
                     where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)) $$;

-- Opens (or reuses) the conversation about a listing.
--   * sender side: p_other_user is null -> talk to the listing's traveler
--   * traveler side: p_other_user = the sender, allowed only if they have a reservation on that listing
create or replace function public.start_conversation(p_listing_id uuid, p_other_user uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  l public.listings;
  v_buyer uuid;
  v_seller uuid;
  v_id uuid;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select * into l from public.listings where id = p_listing_id;
  if not found then raise exception 'listing not found'; end if;

  if l.user_id = v_uid then
    if p_other_user is null or p_other_user = v_uid then raise exception 'choose who to write to'; end if;
    if not exists (select 1 from public.reservations where listing_id = l.id and buyer_id = p_other_user and seller_id = v_uid)
       and not exists (select 1 from public.conversations where listing_id = l.id and buyer_id = p_other_user and seller_id = v_uid) then
      raise exception 'not allowed';
    end if;
    v_buyer := p_other_user; v_seller := v_uid;
  else
    v_buyer := v_uid; v_seller := l.user_id;
  end if;

  if public.is_blocked_between(v_buyer, v_seller) then raise exception 'blocked'; end if;

  select id into v_id from public.conversations where listing_id = l.id and buyer_id = v_buyer and seller_id = v_seller;
  if v_id is null then
    insert into public.conversations (listing_id, buyer_id, seller_id) values (l.id, v_buyer, v_seller)
    on conflict (listing_id, buyer_id, seller_id) do nothing
    returning id into v_id;
    if v_id is null then
      select id into v_id from public.conversations where listing_id = l.id and buyer_id = v_buyer and seller_id = v_seller;
    end if;
  end if;
  return v_id;
end $$;

create or replace function public.send_message(p_conversation_id uuid, p_content text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  c public.conversations;
  v_id uuid;
  v_text text := trim(coalesce(p_content, ''));
begin
  select * into c from public.conversations where id = p_conversation_id;
  if not found or v_uid not in (c.buyer_id, c.seller_id) then raise exception 'not allowed'; end if;
  if v_text = '' then raise exception 'empty message'; end if;
  if length(v_text) > 2000 then raise exception 'message too long'; end if;
  if public.is_blocked_between(c.buyer_id, c.seller_id) then raise exception 'blocked'; end if;
  if public.is_banned(v_uid) then raise exception 'not allowed'; end if;
  insert into public.messages (conversation_id, sender_id, content, read) values (c.id, v_uid, v_text, false)
  returning id into v_id;
  update public.conversations set updated_at = now() where id = c.id;
  return v_id;
end $$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.messages m set read = true
  from public.conversations c
  where m.conversation_id = c.id and c.id = p_conversation_id
    and auth.uid() in (c.buyer_id, c.seller_id)
    and m.sender_id <> auth.uid() and not m.read
$$;

-- Inbox: one row per conversation, newest first.
create or replace function public.get_conversations()
returns table (
  id uuid, listing_id uuid, other_id uuid, other_name text, other_avatar text, other_verified boolean,
  i_am_traveler boolean, departure text, arrival text, departure_date date,
  last_message text, last_from_me boolean, last_at timestamptz, unread bigint, blocked boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.listing_id,
         o.id, o.full_name, nullif(o.avatar_url, ''), coalesce(o.id_verified, false),
         c.seller_id = auth.uid(),
         l.departure, l.arrival, l.departure_date,
         lm.content, lm.sender_id = auth.uid(), coalesce(lm.created_at, c.created_at),
         (select count(*) from public.messages m where m.conversation_id = c.id and m.sender_id <> auth.uid() and not m.read),
         public.is_blocked_between(c.buyer_id, c.seller_id)
  from public.conversations c
  join public.profiles o on o.id = case when c.buyer_id = auth.uid() then c.seller_id else c.buyer_id end
  left join public.listings l on l.id = c.listing_id
  left join lateral (select m.content, m.sender_id, m.created_at from public.messages m
                     where m.conversation_id = c.id order by m.created_at desc limit 1) lm on true
  where auth.uid() in (c.buyer_id, c.seller_id)
  order by coalesce(lm.created_at, c.created_at) desc
$$;

create or replace function public.unread_messages_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.messages m join public.conversations c on c.id = m.conversation_id
  where auth.uid() in (c.buyer_id, c.seller_id) and m.sender_id <> auth.uid() and not m.read
$$;

create or replace function public.block_user(p_user_id uuid, p_block boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or p_user_id = auth.uid() then raise exception 'not allowed'; end if;
  if p_block then
    insert into public.blocked_users (blocker_id, blocked_id)
    select auth.uid(), p_user_id
    where not exists (select 1 from public.blocked_users where blocker_id = auth.uid() and blocked_id = p_user_id);
  else
    delete from public.blocked_users where blocker_id = auth.uid() and blocked_id = p_user_id;
  end if;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'start_conversation(uuid, uuid)', 'send_message(uuid, text)', 'mark_conversation_read(uuid)',
    'get_conversations()', 'unread_messages_count()', 'block_user(uuid, boolean)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke all on function public.is_blocked_between(uuid, uuid) from public, anon, authenticated;

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261126160000', 'messaging', array[]::text[]) on conflict do nothing;
