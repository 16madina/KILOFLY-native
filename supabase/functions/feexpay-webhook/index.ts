// FeexPay → KiloFly webhook. Two independent checks before confirming a payment:
// 1. HMAC-SHA256 signature over "{timestamp}.{delivery_id}.{raw_body}" with FEEXPAY_WEBHOOK_SECRET (5-min window);
// 2. the transaction status is re-read from FeexPay's API (the payload itself is never trusted).
// Deployed with --no-verify-jwt.
import { admin, feexpayStatus, toXof } from '../_shared/common.ts';

const enc = new TextEncoder();

async function hmacHex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  const secret = Deno.env.get('FEEXPAY_WEBHOOK_SECRET');
  if (!secret) return new Response('webhook secret not configured', { status: 500 });

  const raw = await req.text();
  const ts = req.headers.get('x-feexpay-timestamp') ?? '';
  const delivery = req.headers.get('x-feexpay-delivery-id') ?? '';
  const sigHeader = req.headers.get('x-feexpay-signature') ?? '';
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(ts));
  if (!ts || !delivery || !sigHeader || !Number.isFinite(age) || age > 300) return new Response('unauthorized', { status: 401 });
  const expected = await hmacHex(secret, `${ts}.${delivery}.${raw}`);
  const ok = sigHeader.split(',').some((p) => {
    const [v, value] = p.trim().split('=');
    return v === 'v1' && !!value && safeEqual(value, expected);
  });
  if (!ok) return new Response('unauthorized', { status: 401 });

  let payload: { reference?: string; callback_info?: string };
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response('bad request', { status: 400 });
  }
  if (!payload.reference) return new Response('ok');

  const db = admin();
  try {
    const { data: tx } = await db
      .from('transactions')
      .select('id, status, amount, currency, provider, stripe_payment_intent_id')
      .eq('stripe_payment_intent_id', payload.reference)
      .eq('provider', 'feexpay')
      .maybeSingle();
    if (!tx || tx.status !== 'pending') return new Response('ok'); // unknown or already processed (idempotent)

    const s = await feexpayStatus(payload.reference);
    if (s.status === 'SUCCESSFUL') {
      const xof = toXof(Number(tx.amount), String(tx.currency));
      if (xof !== null && Math.round(Number(s.amount)) !== xof) {
        console.error('feexpay amount mismatch', tx.id, s.amount, xof);
        return new Response('ok');
      }
      await db.rpc('confirm_payment', { p_transaction_id: tx.id, p_provider_ref: payload.reference, p_amount: null });
    } else if (s.status === 'FAILED') {
      await db.rpc('fail_payment', { p_transaction_id: tx.id, p_reason: s.reason || 'failed' });
    }
  } catch (e) {
    console.error('feexpay-webhook', e);
    return new Response('error', { status: 500 }); // FeexPay retries
  }
  return new Response('ok');
});
