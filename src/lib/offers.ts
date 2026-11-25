import type { Currency } from '@/lib/listings';
import { reservationError } from '@/lib/reservations';
import { supabase } from '@/lib/supabase';

export type Offer = {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  price: number;
  message: string | null;
  createdAt: string;
  reservationId: string | null;
  traveler: { id: string; name: string; avatar: string | null; verified: boolean };
  listing: { id: string; from: string; to: string; departDate: string; currency: Currency } | null;
  isMine: boolean;
};

export type RequestDetail = {
  id: string;
  userId: string;
  from: string;
  to: string;
  dateStart: string;
  dateEnd: string | null;
  kg: number;
  description: string | null;
  budgetMax: number | null;
  currency: Currency;
  status: string;
};

const offerError = (m: string) => {
  const s = m.toLowerCase();
  if (s.includes('own request')) return 'C’est votre propre demande.';
  if (s.includes('request unavailable')) return 'Cette demande n’est plus disponible.';
  if (s.includes('invalid price')) return 'Indiquez un prix valide.';
  if (s.includes('offer already accepted')) return 'Votre offre a déjà été acceptée.';
  return reservationError(m);
};

export async function fetchRequest(id: string): Promise<RequestDetail | null> {
  const { data, error } = await supabase.rpc('get_request_card', { p_request_id: id });
  if (error) throw error;
  const r = ((data as Record<string, unknown>[]) ?? [])[0];
  if (!r) return null;
  return {
    id: r.id as string,
    userId: r.user_id as string,
    from: r.departure as string,
    to: r.arrival as string,
    dateStart: r.departure_date_start as string,
    dateEnd: (r.departure_date_end as string) ?? null,
    kg: Number(r.requested_kg),
    description: (r.description as string) ?? null,
    budgetMax: r.budget_max === null ? null : Number(r.budget_max),
    currency: r.currency as Currency,
    status: r.status as string,
  };
}

export async function fetchOffers(requestId: string): Promise<Offer[]> {
  const { data, error } = await supabase.rpc('get_offers', { p_request_id: requestId });
  if (error) throw error;
  return ((data as Record<string, unknown>[]) ?? []).map((o) => ({
    id: o.id as string,
    status: o.status as Offer['status'],
    price: Number(o.proposed_price),
    message: (o.message as string) ?? null,
    createdAt: o.created_at as string,
    reservationId: (o.reservation_id as string) ?? null,
    traveler: {
      id: o.traveler_id as string,
      name: (o.traveler_name as string) || 'Voyageur',
      avatar: (o.traveler_avatar as string) ?? null,
      verified: !!o.traveler_verified,
    },
    listing: o.listing_id
      ? {
          id: o.listing_id as string,
          from: o.departure as string,
          to: o.arrival as string,
          departDate: o.departure_date as string,
          currency: o.currency as Currency,
        }
      : null,
    isMine: !!o.is_mine,
  }));
}

export async function makeOffer(requestId: string, listingId: string, price: number, message: string) {
  const { error } = await supabase.rpc('make_offer', {
    p_request_id: requestId,
    p_listing_id: listingId,
    p_price: price,
    p_message: message || null,
  });
  return error ? { error: offerError(error.message) } : {};
}

export async function respondOffer(offerId: string, accept: boolean): Promise<{ reservationId?: string | null; error?: string }> {
  const { data, error } = await supabase.rpc('respond_offer', { p_offer_id: offerId, p_accept: accept });
  if (error) return { error: offerError(error.message) };
  return { reservationId: (data as string | null) ?? null };
}
