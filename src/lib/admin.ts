// Admin data layer. Every call goes through a server function that checks the 'admin' role,
// so a non-admin calling these just gets an error.
import { supabase } from '@/lib/supabase';

export type AdminStats = {
  users: number;
  users_7d: number;
  banned: number;
  id_pending: number;
  listings_active: number;
  requests_active: number;
  reservations_pending: number;
  reports_pending: number;
  tx_paid: number;
  revenue: Record<string, number>;
  volume: Record<string, number>;
};

export type AdminUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  created_at: string;
  id_verified: boolean;
  email_verified: boolean;
  is_admin: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  listings_count: number;
};

export type AdminListing = {
  id: string;
  user_id: string;
  owner_name: string | null;
  departure: string;
  arrival: string;
  departure_date: string;
  available_kg: number;
  price_per_kg: number;
  currency: string | null;
  status: string;
  created_at: string;
  reservations_count: number;
};

export type AdminTransaction = {
  id: string;
  created_at: string;
  paid_at: string | null;
  buyer_name: string | null;
  seller_name: string | null;
  route: string;
  amount: number | null;
  platform_commission: number | null;
  seller_amount: number | null;
  currency: string | null;
  status: string | null;
  payment_status: string | null;
  provider: string | null;
};

export type AdminAction = {
  created_at: string;
  admin_name: string | null;
  action_type: string;
  target_name: string | null;
  details: string | null;
};

function fail(error: { message: string } | null): never | void {
  if (error) throw new Error(error.message.includes('admin only') ? 'Accès réservé aux administrateurs.' : error.message);
}

export async function getStats() {
  const { data, error } = await supabase.rpc('admin_stats');
  fail(error);
  return data as AdminStats;
}

export async function listUsers(search: string) {
  const { data, error } = await supabase.rpc('admin_list_users', { p_search: search || null, p_limit: 200 });
  fail(error);
  return (data ?? []) as AdminUser[];
}

export async function setBan(userId: string, ban: boolean, reason?: string) {
  const { error } = await supabase.rpc('admin_set_ban', { p_user_id: userId, p_ban: ban, p_reason: reason ?? null });
  fail(error);
}

export async function listListings(search: string, status: string) {
  const { data, error } = await supabase.rpc('admin_list_listings', { p_search: search || null, p_status: status || null, p_limit: 200 });
  fail(error);
  return (data ?? []) as AdminListing[];
}

export async function setListingStatus(listingId: string, status: 'active' | 'cancelled', reason?: string) {
  const { error } = await supabase.rpc('admin_set_listing_status', { p_listing_id: listingId, p_status: status, p_reason: reason ?? null });
  fail(error);
}

export async function listTransactions() {
  const { data, error } = await supabase.rpc('admin_list_transactions', { p_limit: 200 });
  fail(error);
  return (data ?? []) as AdminTransaction[];
}

export async function recentActions() {
  const { data, error } = await supabase.rpc('admin_recent_actions', { p_limit: 20 });
  fail(error);
  return (data ?? []) as AdminAction[];
}

export const money = (n: number | null | undefined, currency?: string | null) => {
  const c = (currency || 'EUR').toUpperCase();
  const v = Number(n ?? 0);
  if (c === 'XOF' || c === 'XAF') return `${Math.round(v).toLocaleString('fr-FR')} FCFA`;
  return `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c === 'EUR' ? '€' : c === 'CAD' ? '$ CA' : c === 'USD' ? '$' : c}`;
};

export const shortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
