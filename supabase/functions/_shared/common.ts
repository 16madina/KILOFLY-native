// Shared helpers for KiloFly edge functions (Deno).
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

/** Service-role client: bypasses RLS, only used server-side. */
export const admin = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

/** Returns the signed-in user from the request's Authorization header, or null. */
export async function callerId(req: Request): Promise<string | null> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  return error ? null : data.user?.id ?? null;
}

/** Return URLs must point back to the app (deep link) or a known web origin. */
export function safeReturnUrl(url: unknown): string | null {
  if (typeof url !== 'string' || url.length > 500) return null;
  const allowed = (Deno.env.get('ALLOWED_RETURN_PREFIXES') ?? 'kilofly://,exp://,http://localhost:8081')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return allowed.some((p) => url.startsWith(p)) ? url : null;
}

export const withParams = (url: string, params: Record<string, string>) =>
  url + (url.includes('?') ? '&' : '?') + new URLSearchParams(params).toString();

/* ---------- FeexPay (mobile money, amounts in XOF) ---------- */

/** Networks enabled in the app: slug used in FeexPay's URL → phone country code. */
export const FEEXPAY_NETWORKS: Record<string, string> = {
  mtn: '229', moov: '229', celtiis_bj: '229', // Bénin
  moov_tg: '228', togocom_tg: '228', // Togo
  mtn_ci: '225', moov_ci: '225', orange_ci: '225', wave_ci: '225', // Côte d'Ivoire
  orange_sn: '221', wave_sn: '221', free_sn: '221', // Sénégal
  moov_bf: '226', wave_bf: '226', // Burkina Faso
  mtn_cg: '242', // Congo Brazzaville
};

export const feexpayBase = () => (Deno.env.get('FEEXPAY_API_BASE') ?? 'https://api-v2.feexpay.me').replace(/\/$/, '');

/** XOF amount for a price in the listing currency (EUR is pegged: 1 € = 655,957 FCFA). */
export function toXof(amount: number, currency: string): number | null {
  const c = currency.toUpperCase();
  if (c === 'XOF') return Math.round(amount);
  if (c === 'EUR') return Math.round(amount * 655.957);
  return null; // USD etc.: card only
}

export async function feexpayStatus(reference: string) {
  const key = Deno.env.get('FEEXPAY_API_KEY');
  if (!key) throw new Error('FeexPay is not configured (FEEXPAY_API_KEY missing)');
  const res = await fetch(`${feexpayBase()}/api/transactions/public/single/status/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `FeexPay status error ${res.status}`);
  return body as { reference: string; amount: number; status: string; callback_info?: string | null; reason?: string };
}

/** Stripe uses whole units for zero-decimal currencies such as XOF. */
export const ZERO_DECIMAL = new Set(['XOF', 'XAF', 'JPY', 'KRW', 'GNF', 'RWF']);
export const toMinor = (amount: number, currency: string) =>
  ZERO_DECIMAL.has(currency.toUpperCase()) ? Math.round(amount) : Math.round(amount * 100);
export const fromMinor = (amount: number, currency: string) =>
  ZERO_DECIMAL.has(currency.toUpperCase()) ? amount : amount / 100;
