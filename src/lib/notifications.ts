// In-app notifications (the same rows are also pushed to the phone).
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  reservation_id: string | null;
  conversation_id: string | null;
  transport_request_id: string | null;
};

export function useNotifications() {
  const { session } = useAuth();
  const [items, setItems] = useState<AppNotification[] | null>(null);

  const reload = useCallback(async () => {
    if (!session) return setItems([]);
    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, type, read, created_at, reservation_id, conversation_id, transport_request_id')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    setItems((data ?? []) as AppNotification[]);
  }, [session]);

  useEffect(() => {
    reload();
  }, [reload]);

  const markAllRead = useCallback(async () => {
    if (!session) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', session.user.id).eq('read', false);
    setItems((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
  }, [session]);

  return { items, reload, markAllRead };
}

/** Unread count, kept live with realtime. */
export function useUnreadCount() {
  const { session } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!session) {
      setCount(0);
      return;
    }
    const uid = session.user.id;
    const load = async () => {
      const { count: c } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('read', false);
      setCount(c ?? 0);
    };
    load();
    const ch = supabase
      .channel(`notif-${uid}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session]);

  return count;
}
