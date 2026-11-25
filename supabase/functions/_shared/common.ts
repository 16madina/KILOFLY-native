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

/** Stripe uses whole units for zero-decimal currencies such as XOF. */
export const ZERO_DECIMAL = new Set(['XOF', 'XAF', 'JPY', 'KRW', 'GNF', 'RWF']);
export const toMinor = (amount: number, currency: string) =>
  ZERO_DECIMAL.has(currency.toUpperCase()) ? Math.round(amount) : Math.round(amount * 100);
export const fromMinor = (amount: number, currency: string) =>
  ZERO_DECIMAL.has(currency.toUpperCase()) ? amount : amount / 100;
