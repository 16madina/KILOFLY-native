import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { findCity } from '@/lib/cities';
import { supabase } from '@/lib/supabase';

/* ---------- Types ---------- */

export type Currency = 'EUR' | 'USD' | 'XOF';

export type ListingCard = {
  id: string;
  userId: string;
  from: string;
  to: string;
  departDate: string; // YYYY-MM-DD
  arriveDate: string;
  totalKg: number;
  remainingKg: number;
  pricePerKg: number;
  currency: Currency;
  description: string | null;
  allowed: string[];
  prohibited: string[];
  deliveryOption: string;
  status: string;
  traveler: {
    name: string;
    avatar: string | null;
    verified: boolean;
    since: string | null;
    trips: number;
    rating: number | null;
    reviews: number;
  };
  isFavorite: boolean;
};

export type RequestCard = {
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
  requester: { name: string; avatar: string | null; verified: boolean };
};

/* ---------- Formatting ---------- */

const SYMBOL: Record<string, string> = { EUR: '€', USD: '$', XOF: 'FCFA' };
export const currencySymbol = (c: string) => SYMBOL[c] ?? c;

export function money(amount: number, currency: string) {
  if (currency === 'XOF') return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
  const n = Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace('.', ',');
  return `${n} ${currencySymbol(currency)}`;
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const parseDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
/** "5 déc." */
export const shortDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = parseDay(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
/** "ven. 5 déc. 2026" */
export const longDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = parseDay(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
export const toIsoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const daysBetween = (a: string, b: string) => Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86400000);

export const DELIVERY_OPTIONS: Record<string, { label: string; description: string }> = {
  pickup: { label: 'Récupération chez le voyageur', description: 'L’expéditeur dépose le colis au point de rencontre du voyageur.' },
  handover: { label: 'Remise en main propre', description: 'Rencontre dans un lieu public pour la remise du colis.' },
  airport: { label: 'À l’aéroport uniquement', description: 'Remise du colis uniquement à l’aéroport.' },
  delivery_free: { label: 'Livraison gratuite', description: 'Le voyageur livre gratuitement dans un rayon proche.' },
  delivery_paid: { label: 'Livraison payante', description: 'Livraison possible avec frais à convenir.' },
};

export const ITEM_OPTIONS = [
  'Vêtements',
  'Chaussures',
  'Documents',
  'Livres',
  'Cosmétiques',
  'Électronique',
  'Tissus',
  'Épices emballées',
  'Artisanat',
  'Médicaments (ordonnance)',
];
export const PROHIBITED_DEFAULTS = ['Liquides > 100 ml', 'Nourriture fraîche', 'Batteries seules', 'Produits dangereux'];

/* ---------- Mapping ---------- */

type ListingRow = {
  id: string;
  user_id: string;
  departure: string;
  arrival: string;
  departure_date: string;
  arrival_date: string;
  total_kg: number;
  remaining_kg: number;
  price_per_kg: number;
  currency: Currency;
  description: string | null;
  allowed_items: string[] | null;
  prohibited_items: string[] | null;
  delivery_option: string;
  status: string;
  traveler_name: string | null;
  traveler_avatar: string | null;
  traveler_id_verified: boolean;
  traveler_since: string | null;
  traveler_trips: number;
  rating: number | null;
  reviews_count: number;
  is_favorite: boolean;
};

const toListing = (r: ListingRow): ListingCard => ({
  id: r.id,
  userId: r.user_id,
  from: r.departure,
  to: r.arrival,
  departDate: r.departure_date,
  arriveDate: r.arrival_date,
  totalKg: Number(r.total_kg),
  remainingKg: Number(r.remaining_kg),
  pricePerKg: Number(r.price_per_kg),
  currency: r.currency,
  description: r.description,
  allowed: r.allowed_items ?? [],
  prohibited: r.prohibited_items ?? [],
  deliveryOption: r.delivery_option,
  status: r.status,
  traveler: {
    name: r.traveler_name || 'Voyageur',
    avatar: r.traveler_avatar,
    verified: r.traveler_id_verified,
    since: r.traveler_since,
    trips: r.traveler_trips,
    rating: r.rating === null ? null : Number(r.rating),
    reviews: r.reviews_count,
  },
  isFavorite: r.is_favorite,
});

type RequestRow = {
  id: string;
  user_id: string;
  departure: string;
  arrival: string;
  departure_date_start: string;
  departure_date_end: string | null;
  requested_kg: number;
  description: string | null;
  budget_max: number | null;
  currency: Currency;
  status: string;
  requester_name: string | null;
  requester_avatar: string | null;
  requester_id_verified: boolean;
};

const toRequest = (r: RequestRow): RequestCard => ({
  id: r.id,
  userId: r.user_id,
  from: r.departure,
  to: r.arrival,
  dateStart: r.departure_date_start,
  dateEnd: r.departure_date_end,
  kg: Number(r.requested_kg),
  description: r.description,
  budgetMax: r.budget_max === null ? null : Number(r.budget_max),
  currency: r.currency,
  status: r.status,
  requester: { name: r.requester_name || 'Expéditeur', avatar: r.requester_avatar, verified: r.requester_id_verified },
});

/* ---------- Queries ---------- */

type ListingQuery = { id?: string; from?: string; to?: string; mine?: boolean; favorites?: boolean; limit?: number };

export async function fetchListings(q: ListingQuery = {}): Promise<ListingCard[]> {
  const { data, error } = await supabase.rpc('get_listing_cards', {
    p_listing_id: q.id ?? null,
    p_departure: q.from?.trim() || null,
    p_arrival: q.to?.trim() || null,
    p_mine: !!q.mine,
    p_favorites: !!q.favorites,
    p_limit: q.limit ?? 50,
  });
  if (error) throw error;
  return ((data as ListingRow[]) ?? []).map(toListing);
}

export async function fetchRequests(mine = false): Promise<RequestCard[]> {
  const { data, error } = await supabase.rpc('get_request_cards', { p_mine: mine, p_limit: 50 });
  if (error) throw error;
  return ((data as RequestRow[]) ?? []).map(toRequest);
}

/** Generic loader hook: data, loading, error, reload. Re-runs when `deps` change. */
function useLoader<T>(load: () => Promise<T>, initial: T, deps: unknown[]) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await run());
    } catch (e) {
      setError((e as Error).message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, loading, error, reload };
}

export function useListings(q: ListingQuery = {}) {
  const { session } = useAuth();
  const uid = session?.user.id;
  return useLoader(() => fetchListings(q), [] as ListingCard[], [q.id, q.from, q.to, q.mine, q.favorites, q.limit, uid]);
}

export function useListing(id?: string) {
  const { session } = useAuth();
  return useLoader(
    async () => (id ? (await fetchListings({ id }))[0] ?? null : null),
    null as ListingCard | null,
    [id, session?.user.id],
  );
}

export function useRequests(mine = false) {
  const { session } = useAuth();
  const uid = session?.user.id;
  return useLoader(async () => (uid ? fetchRequests(mine) : []), [] as RequestCard[], [mine, uid]);
}

/* ---------- Mutations ---------- */

/** "paris" → "Paris" (known city spelling), otherwise capitalise each word. */
export function normalizeCity(input: string) {
  const v = input.trim().replace(/\s+/g, ' ');
  const known = findCity(v);
  if (known) return known.city;
  return v.replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

export type NewListing = {
  from: string;
  to: string;
  departDate: string;
  arriveDate: string;
  kg: number;
  pricePerKg: number;
  currency: Currency;
  allowed: string[];
  prohibited: string[];
  deliveryOption: string;
  description: string;
};

export async function createListing(userId: string, l: NewListing): Promise<{ id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('listings')
    .insert({
      user_id: userId,
      departure: normalizeCity(l.from),
      arrival: normalizeCity(l.to),
      departure_date: l.departDate,
      arrival_date: l.arriveDate,
      available_kg: l.kg,
      price_per_kg: l.pricePerKg,
      currency: l.currency,
      allowed_items: l.allowed,
      prohibited_items: l.prohibited,
      delivery_option: l.deliveryOption,
      description: l.description.trim() || null,
    })
    .select('id')
    .single();
  if (error) {
    if (error.code === '42501' || /row-level security/i.test(error.message))
      return { error: 'identity' };
    return { error: error.message };
  }
  return { id: data.id };
}

export type NewRequest = {
  from: string;
  to: string;
  dateStart: string;
  dateEnd: string | null;
  kg: number;
  budgetMax: number | null;
  currency: Currency;
  description: string;
};

export async function createRequest(userId: string, r: NewRequest): Promise<{ id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('transport_requests')
    .insert({
      user_id: userId,
      departure: normalizeCity(r.from),
      arrival: normalizeCity(r.to),
      departure_date_start: r.dateStart,
      departure_date_end: r.dateEnd,
      requested_kg: r.kg,
      budget_max: r.budgetMax,
      currency: r.currency,
      description: r.description.trim() || null,
    })
    .select('id')
    .single();
  if (error) return { error: error.message };
  return { id: data.id };
}

export async function setListingStatus(id: string, status: 'active' | 'cancelled') {
  const { error } = await supabase.from('listings').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  return error ? { error: error.message } : {};
}

export async function setRequestStatus(id: string, status: 'active' | 'cancelled') {
  const { error } = await supabase.from('transport_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  return error ? { error: error.message } : {};
}

export async function setFavorite(userId: string, listingId: string, on: boolean) {
  const { error } = on
    ? await supabase.from('favorites').insert({ user_id: userId, listing_id: listingId })
    : await supabase.from('favorites').delete().eq('user_id', userId).eq('listing_id', listingId);
  return error ? { error: error.message } : {};
}

export async function createRouteAlert(userId: string, from: string, to: string) {
  const { error } = await supabase.from('route_alerts').insert({ user_id: userId, departure: normalizeCity(from), arrival: normalizeCity(to) });
  return error ? { error: error.message } : {};
}
