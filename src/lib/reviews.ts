// Reviews after delivery + public profiles.
import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type PublicProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  user_type: string | null;
  id_verified: boolean;
  member_since: string;
  completed_trips: number;
  shipments: number;
  rating: number | null;
  reviews: number;
  active_listings: number;
  is_me: boolean;
  blocked_by_me: boolean;
};

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
  route: string | null;
  as_traveler: boolean | null;
};

export function usePublicProfile(userId?: string) {
  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);

  const reload = useCallback(async () => {
    if (!userId) return;
    const [p, r] = await Promise.all([
      supabase.rpc('get_public_profile', { p_user_id: userId }),
      supabase.rpc('get_user_reviews', { p_user_id: userId, p_limit: 50 }),
    ]);
    const row = ((p.data ?? []) as PublicProfile[])[0];
    setProfile(
      row
        ? {
            ...row,
            rating: row.rating === null ? null : Number(row.rating),
            reviews: Number(row.reviews),
            completed_trips: Number(row.completed_trips),
            shipments: Number(row.shipments),
            active_listings: Number(row.active_listings),
          }
        : null,
    );
    setReviews((r.data ?? []) as Review[]);
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { profile, reviews, reload };
}

export async function myReviewFor(reservationId: string): Promise<{ rating: number; comment: string | null } | null> {
  const { data } = await supabase.rpc('my_review_for', { p_reservation_id: reservationId });
  return ((data ?? []) as { rating: number; comment: string | null }[])[0] ?? null;
}

export async function submitReview(reservationId: string, rating: number, comment: string) {
  const { error } = await supabase.rpc('submit_review', { p_reservation_id: reservationId, p_rating: rating, p_comment: comment || null });
  if (!error) return {};
  if (error.message.includes('already reviewed')) return { error: 'Vous avez déjà laissé un avis.' };
  if (error.message.includes('not delivered')) return { error: 'Vous pourrez noter après la livraison.' };
  return { error: error.message };
}
