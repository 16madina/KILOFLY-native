// POST { withdrawal_id, action?: 'send' | 'check' } — automatic mobile-money withdrawal with FeexPay.
// Called by the app right after a withdrawal request (owner) or from the admin panel.
// The money is already held (taken off the balance) by request_withdrawal; here we only send it.
// Anything we cannot send automatically goes back to the admin queue.
import { admin, callerId, cors, feexpayBase, json } from '../_shared/common.ts';

const XOF_PER_EUR = 655.957;

// FeexPay only accepts payouts from allowed IP addresses. Edge functions have no fixed IP, so payouts
// go through the Dee Digital relay (fixed IP, already allowed in FeexPay) when it is configured.
const RELAY = (Deno.env.get('FEEXPAY_RELAY_URL') ?? '').trim().replace(/\/+$/, '');
const RELAY_SECRET = (Deno.env.get('FEEXPAY_RELAY_SECRET') ?? '').trim();
const payoutBase = () => (RELAY && RELAY_SECRET ? RELAY : feexpayBase());
const relayHeaders = (): Record<string, string> => (RELAY && RELAY_SECRET ? { 'X-Kotiz-Relay': RELAY_SECRET } : {});

/** App method + phone country code → FeexPay payout path (and network field when the path is shared). */
function route(method: string, phone: string): { path: string; network?: string } | null {
  const cc = ['225', '221', '229', '228', '226', '242'].find((c) => phone.startsWith(c));
  const t: Record<string, Record<string, { path: string; network?: string }>> = {
    wave: { '225': { path: 'wave_ci' }, '221': { path: 'wave_sn' }, '226': { path: 'wave_bf' } },
    orange_money: { '225': { path: 'orange_ci' }, '221': { path: 'orange_sn' }, '226': { path: 'orange_bf' } },
    mtn_momo: { '225': { path: 'mtn_ci' }, '229': { path: 'transfer/global', network: 'MTN' }, '242': { path: 'mtn_cg' } },
    moov_money: { '225': { path: 'moov_ci' }, '229': { path: 'transfer/global', network: 'MOOV' }, '226': { path: 'moov_bf' }, '228': { path: 'togo', network: 'MOOV TG' } },
    free_money: { '221': { path: 'free_sn' } },
  };
  return cc ? t[method]?.[cc] ?? null : null;
}

async function status(ref: string) {
  const key = Deno.env.get('FEEXPAY_API_KEY')!;
  const res = await fetch(`${payoutBase()}/api/payouts/status/public/${encodeURIComponent(ref)}`, { headers: { Authorization: `Bearer ${key}`, ...relayHeaders() } });
  const b = await res.json().catch(() => ({}));
  return { status: String(b?.status ?? '').toUpperCase(), reason: (b?.reason as string) || (b?.responsemsg as string) || '' };
}

async function waitResult(db: ReturnType<typeof admin>, id: string, ref: string, tries = 6) {
  for (let i = 0; i < tries; i++) {
    const s = await status(ref).catch(() => ({ status: '', reason: '' }));
    if (s.status === 'SUCCESSFUL') {
      await db.rpc('payout_settle', { p_id: id, p_success: true, p_reason: null });
      return 'completed';
    }
    if (s.status === 'FAILED') {
      await db.rpc('payout_settle', { p_id: id, p_success: false, p_reason: s.reason || null });
      return 'failed';
    }
    await new Promise((r) => setTimeout(r, 4000));
  }
  return 'processing';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  try {
    const uid = await callerId(req);
    if (!uid) return json({ error: 'not signed in' }, 401);
    const body = await req.json().catch(() => ({}));
    const id = String(body.withdrawal_id ?? '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'invalid id' }, 400);
    const db = admin();

    // Re-check a withdrawal already sent (owner or admin).
    if (body.action === 'check') {
      const { data: wt } = await db.from('wallet_transactions').select('id, status, reference, wallet_id').eq('id', id).maybeSingle();
      if (!wt) return json({ status: 'none' });
      const { data: w } = await db.from('wallets').select('user_id').eq('id', wt.wallet_id).maybeSingle();
      const { data: isAdmin } = await db.rpc('is_admin_user', { p_uid: uid });
      if (w?.user_id !== uid && isAdmin !== true) return json({ error: 'not allowed' }, 403);
      if (wt.status !== 'processing' || !wt.reference) return json({ status: wt.status });
      return json({ status: await waitResult(db, id, wt.reference, 1) });
    }

    const key = Deno.env.get('FEEXPAY_API_KEY');
    const shop = Deno.env.get('FEEXPAY_SHOP_ID');
    if (!key || !shop) return json({ status: 'manual', reason: 'FeexPay non configuré' });

    const { data: rows, error } = await db.rpc('payout_claim', { p_id: id, p_uid: uid });
    if (error) return json({ error: error.message }, 400);
    const wt = (rows as { id: string; amount: number; currency: string; method: string; phone: string | null }[] | null)?.[0];
    if (!wt) return json({ status: 'manual' });

    const phone = String(wt.phone ?? '').replace(/\D/g, '');
    const r = route(wt.method, phone);
    const cur = wt.currency.toUpperCase();
    const amount = cur === 'XOF' || cur === 'XAF' ? Math.floor(Number(wt.amount)) : cur === 'EUR' ? Math.floor(Number(wt.amount) * XOF_PER_EUR) : null;
    if (!r || amount === null || amount < 100) {
      await db.rpc('payout_release', { p_id: id, p_reason: !r ? 'pays ou opérateur non pris en charge' : 'devise ou montant non pris en charge' });
      return json({ status: 'manual' });
    }

    const res = await fetch(`${payoutBase()}/api/payouts/public/${r.path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...relayHeaders() },
      body: JSON.stringify({ shop, amount, phoneNumber: Number(phone), motif: 'Retrait KiloFly', callback_info: id, ...(r.network ? { network: r.network } : {}) }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || !out?.reference) {
      await db.rpc('payout_release', { p_id: id, p_reason: `FeexPay: ${out?.message ?? res.status}` });
      return json({ status: 'manual', reason: out?.message ?? null });
    }
    await db.rpc('payout_set_reference', { p_id: id, p_reference: String(out.reference), p_amount_xof: amount, p_network: r.path });
    return json({ status: await waitResult(db, id, String(out.reference)) });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
