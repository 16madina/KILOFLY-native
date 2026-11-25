import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import type { Currency } from '@/lib/listings';
import { supabase } from '@/lib/supabase';

export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_progress' | 'delivered';

export type Reservation = {
  id: string;
  role: 'buyer' | 'seller';
  status: ReservationStatus;
  kg: number;
  totalPrice: number;
  item: string;
  recipientPhone: string | null;
  notes: string | null;
  createdAt: string;
  listingId: string;
  from: string;
  to: string;
  departDate: string;
  arriveDate: string;
  pricePerKg: number;
  currency: Currency;
  other: { id: string; name: string; avatar: string | null; verified: boolean };
  buyerFee: number;
  buyerTotal: number;
  sellerAmount: number;
  paymentStatus: string | null;
  paid: boolean;
};

type Row = {
  id: string;
  role: 'buyer' | 'seller';
  status: ReservationStatus;
  requested_kg: number;
  total_price: number;
  item_description: string;
  recipient_phone: string | null;
  pickup_notes: string | null;
  created_at: string;
  listing_id: string;
  departure: string;
  arrival: string;
  departure_date: string;
  arrival_date: string;
  price_per_kg: number;
  currency: Currency;
  other_id: string;
  other_name: string | null;
  other_avatar: string | null;
  other_verified: boolean;
  buyer_fee: number;
  buyer_total: number;
  seller_amount: number;
  payment_status: string | null;
  paid: boolean;
};

const toReservation = (r: Row): Reservation => ({
  id: r.id,
  role: r.role,
  status: r.status,
  kg: Number(r.requested_kg),
  totalPrice: Number(r.total_price),
  item: r.item_description,
  recipientPhone: r.recipient_phone,
  notes: r.pickup_notes,
  createdAt: r.created_at,
  listingId: r.listing_id,
  from: r.departure,
  to: r.arrival,
  departDate: r.departure_date,
  arriveDate: r.arrival_date,
  pricePerKg: Number(r.price_per_kg),
  currency: r.currency,
  other: { id: r.other_id, name: r.other_name || (r.role === 'buyer' ? 'Voyageur' : 'Expéditeur'), avatar: r.other_avatar, verified: r.other_verified },
  buyerFee: Number(r.buyer_fee),
  buyerTotal: Number(r.buyer_total),
  sellerAmount: Number(r.seller_amount),
  paymentStatus: r.payment_status,
  paid: r.paid,
});

/** What each side sees for a given status. */
export const STATUS_LABEL: Record<ReservationStatus, { buyer: string; seller: string; tone: 'gold' | 'success' | 'muted' | 'danger' }> = {
  pending: { buyer: 'En attente du voyageur', seller: 'Nouvelle demande', tone: 'gold' },
  approved: { buyer: 'Acceptée · à payer', seller: 'Acceptée · paiement en attente', tone: 'gold' },
  in_progress: { buyer: 'Payée · en cours', seller: 'Payée · à transporter', tone: 'success' },
  delivered: { buyer: 'Livrée', seller: 'Livrée', tone: 'success' },
  rejected: { buyer: 'Refusée', seller: 'Refusée', tone: 'danger' },
  cancelled: { buyer: 'Annulée', seller: 'Annulée', tone: 'muted' },
};

/** Turn database exceptions into French messages. */
export function reservationError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('not enough kg')) return 'Il ne reste plus assez de kilos sur ce trajet.';
  if (m.includes('already open')) return 'Vous avez déjà une réservation en cours sur ce trajet.';
  if (m.includes('own listing')) return 'Vous ne pouvez pas réserver votre propre trajet.';
  if (m.includes('listing unavailable')) return 'Ce trajet n’est plus disponible.';
  if (m.includes('already departed')) return 'Ce voyageur est déjà parti.';
  if (m.includes('description required')) return 'Décrivez le contenu du colis.';
  if (m.includes('already paid')) return 'Cette réservation est déjà payée.';
  if (m.includes('reservation is')) return 'Cette réservation a changé de statut. Actualisez la page.';
  if (m.includes('not allowed')) return 'Action non autorisée.';
  return message;
}

export async function fetchReservations(role: 'buyer' | 'seller'): Promise<Reservation[]> {
  const { data, error } = await supabase.rpc('get_my_reservations', { p_role: role, p_reservation_id: null });
  if (error) throw error;
  return ((data as Row[]) ?? []).map(toReservation);
}

export async function fetchReservation(id: string): Promise<Reservation | null> {
  const { data, error } = await supabase.rpc('get_my_reservations', { p_role: 'buyer', p_reservation_id: id });
  if (error) throw error;
  const row = ((data as Row[]) ?? [])[0];
  return row ? toReservation(row) : null;
}

export async function createReservation(input: {
  listingId: string;
  kg: number;
  item: string;
  recipientPhone?: string;
  notes?: string;
}): Promise<{ id?: string; error?: string }> {
  const { data, error } = await supabase.rpc('create_reservation', {
    p_listing_id: input.listingId,
    p_kg: input.kg,
    p_item_description: input.item,
    p_recipient_phone: input.recipientPhone ?? null,
    p_pickup_notes: input.notes ?? null,
  });
  if (error) return { error: reservationError(error.message) };
  return { id: data as string };
}

export async function respondReservation(id: string, accept: boolean) {
  const { error } = await supabase.rpc('respond_reservation', { p_reservation_id: id, p_accept: accept });
  return error ? { error: reservationError(error.message) } : {};
}

export async function cancelReservation(id: string) {
  const { error } = await supabase.rpc('cancel_reservation', { p_reservation_id: id });
  return error ? { error: reservationError(error.message) } : {};
}

/** Asks the server to start a payment; returns the provider page to open. */
export async function startPayment(
  reservationId: string,
  provider: 'stripe' | 'feexpay',
  returnUrl: string,
  extra?: Record<string, string>,
): Promise<{ url?: string; reference?: string; mode?: 'redirect' | 'push'; amount_xof?: number; error?: string }> {
  const { data, error } = await supabase.functions.invoke('payments-create', {
    body: { reservation_id: reservationId, provider, return_url: returnUrl, ...extra },
  });
  if (error) {
    let msg = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) msg = ((await ctx.json()) as { error?: string }).error ?? msg;
    } catch {
      /* keep generic message */
    }
    return { error: reservationError(msg) };
  }
  return data as { url?: string; reference?: string; mode?: 'redirect' | 'push'; amount_xof?: number };
}

/** Asks the server to check the payment with Stripe/FeexPay (and confirm it if paid). */
export async function checkPayment(reservationId: string): Promise<'paid' | 'pending' | 'failed' | 'none' | 'error'> {
  const { data, error } = await supabase.functions.invoke('payments-check', { body: { reservation_id: reservationId } });
  if (error) return 'error';
  return ((data as { status?: string })?.status as 'paid' | 'pending' | 'failed' | 'none') ?? 'error';
}

/** Mobile-money networks offered with FeexPay (slug → label), grouped by country with dialing code. */
export const MOBILE_MONEY: { country: string; flag: string; code: string; networks: [string, string][] }[] = [
  { country: 'Sénégal', flag: '🇸🇳', code: '221', networks: [['wave_sn', 'Wave'], ['orange_sn', 'Orange Money'], ['free_sn', 'Free Money']] },
  { country: 'Côte d’Ivoire', flag: '🇨🇮', code: '225', networks: [['wave_ci', 'Wave'], ['orange_ci', 'Orange Money'], ['mtn_ci', 'MTN'], ['moov_ci', 'Moov']] },
  { country: 'Bénin', flag: '🇧🇯', code: '229', networks: [['mtn', 'MTN'], ['moov', 'Moov'], ['celtiis_bj', 'Celtiis']] },
  { country: 'Togo', flag: '🇹🇬', code: '228', networks: [['moov_tg', 'Moov'], ['togocom_tg', 'Togocom']] },
  { country: 'Burkina Faso', flag: '🇧🇫', code: '226', networks: [['wave_bf', 'Wave'], ['moov_bf', 'Moov']] },
  { country: 'Congo', flag: '🇨🇬', code: '242', networks: [['mtn_cg', 'MTN']] },
];

/* ---------- Hooks ---------- */

export function useReservations(role: 'buyer' | 'seller') {
  const { session } = useAuth();
  const [data, setData] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!session) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await fetchReservations(role));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [role, session]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function useReservation(id?: string) {
  const { session } = useAuth();
  const [data, setData] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!id || !session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setData(await fetchReservation(id));
    } finally {
      setLoading(false);
    }
  }, [id, session]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, reload };
}
