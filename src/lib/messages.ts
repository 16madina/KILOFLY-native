// Real messaging: conversations per listing, realtime updates, unread counts.
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export type Conversation = {
  id: string;
  listing_id: string;
  other_id: string;
  other_name: string | null;
  other_avatar: string | null;
  other_verified: boolean;
  i_am_traveler: boolean;
  departure: string | null;
  arrival: string | null;
  departure_date: string | null;
  last_message: string | null;
  last_from_me: boolean | null;
  last_at: string;
  unread: number;
  blocked: boolean;
};

export type Message = { id: string; conversation_id: string; sender_id: string; content: string; read: boolean; created_at: string; pending?: boolean };

const ERR: [string, string][] = [
  ['blocked', 'Vous ne pouvez plus échanger avec cette personne.'],
  ['message too long', 'Message trop long (2000 caractères maximum).'],
  ['not signed in', 'Connectez-vous pour envoyer un message.'],
  ['choose who to write to', 'C’est votre propre annonce.'],
];
export const messageError = (m: string) => ERR.find(([k]) => m.includes(k))?.[1] ?? 'Envoi impossible. Réessayez.';

export async function startConversation(listingId: string, otherUserId?: string): Promise<{ id?: string; error?: string }> {
  const { data, error } = await supabase.rpc('start_conversation', { p_listing_id: listingId, p_other_user: otherUserId ?? null });
  if (error) return { error: messageError(error.message) };
  return { id: data as string };
}

export async function blockUser(userId: string, block: boolean) {
  const { error } = await supabase.rpc('block_user', { p_user_id: userId, p_block: block });
  return error ? { error: error.message } : {};
}

/** Inbox, refreshed live when any message arrives. */
export function useConversations() {
  const { session } = useAuth();
  const [items, setItems] = useState<Conversation[] | null>(null);

  const reload = useCallback(async () => {
    if (!session) return setItems([]);
    const { data } = await supabase.rpc('get_conversations');
    setItems(((data ?? []) as Conversation[]).map((c) => ({ ...c, unread: Number(c.unread) })));
  }, [session]);

  useEffect(() => {
    reload();
    if (!session) return;
    const ch = supabase
      .channel(`inbox-${session.user.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => reload())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session, reload]);

  return { items, reload };
}

/** Total unread messages (badge on the Messages tab). */
export function useUnreadMessages() {
  const { session } = useAuth();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!session) return setN(0);
    const load = async () => {
      const { data } = await supabase.rpc('unread_messages_count');
      setN(Number(data ?? 0));
    };
    load();
    const ch = supabase
      .channel(`unread-${session.user.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session]);
  return n;
}

/** One conversation: history + live messages + send. */
export function useChat(conversationId?: string) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const markTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markRead = useCallback(() => {
    if (!conversationId) return;
    if (markTimer.current) clearTimeout(markTimer.current);
    markTimer.current = setTimeout(() => supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId }), 400);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !session) return;
    let alive = true;
    supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, read, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(500)
      .then(({ data, error: e }) => {
        if (!alive) return;
        if (e) setError(e.message);
        setMessages((data ?? []) as Message[]);
        markRead();
      });
    const ch = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (p) => {
        const m = p.new as Message;
        setMessages((prev) => {
          const list = (prev ?? []).filter((x) => !(x.pending && x.sender_id === m.sender_id && x.content === m.content));
          return list.some((x) => x.id === m.id) ? list : [...list, m];
        });
        if (m.sender_id !== session.user.id) markRead();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (p) => {
        const m = p.new as Message;
        setMessages((prev) => (prev ?? []).map((x) => (x.id === m.id ? { ...x, read: m.read } : x)));
      })
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, [conversationId, session, markRead]);

  const send = useCallback(
    async (text: string): Promise<string | null> => {
      const content = text.trim();
      if (!content || !conversationId || !session) return null;
      const temp: Message = {
        id: `tmp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: session.user.id,
        content,
        read: false,
        created_at: new Date().toISOString(),
        pending: true,
      };
      setMessages((prev) => [...(prev ?? []), temp]);
      const { data, error: e } = await supabase.rpc('send_message', { p_conversation_id: conversationId, p_content: content });
      if (e) {
        setMessages((prev) => (prev ?? []).filter((x) => x.id !== temp.id));
        return messageError(e.message);
      }
      // Realtime usually replaces the temp message; make sure it isn't left pending.
      setMessages((prev) =>
        (prev ?? []).some((x) => x.id === data) ? (prev ?? []).filter((x) => x.id !== temp.id) : (prev ?? []).map((x) => (x.id === temp.id ? { ...x, id: data as string, pending: false } : x)),
      );
      return null;
    },
    [conversationId, session],
  );

  return { messages, error, send };
}
