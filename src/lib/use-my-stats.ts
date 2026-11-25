import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export type MyStats = {
  reviews: number;
  rating: number | null;
  shipments: number;
  listings: number;
};

/** Counters for the profile screen, computed from real data. */
export function useMyStats() {
  const { session } = useAuth();
  const [stats, setStats] = useState<MyStats | null>(null);

  useEffect(() => {
    const uid = session?.user.id;
    if (!uid) {
      setStats(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const [reviews, shipments, listings] = await Promise.all([
        supabase.from('reviews').select('rating').eq('reviewed_id', uid),
        supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('buyer_id', uid),
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      ]);
      if (cancelled) return;
      const ratings = (reviews.data ?? []).map((r) => r.rating as number);
      setStats({
        reviews: ratings.length,
        rating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
        shipments: shipments.count ?? 0,
        listings: listings.count ?? 0,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  return stats;
}

const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export const memberSince = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};
