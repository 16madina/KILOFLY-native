// Stripe → KiloFly. Confirms payments only after verifying Stripe's signature.
// Deployed with --no-verify-jwt (Stripe has no Supabase token); STRIPE_WEBHOOK_SECRET is mandatory.
import { admin, fromMinor } from '../_shared/common.ts';

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

async function verify(payload: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(',').map((kv) => {
      const [k, ...v] = kv.split('=');
      return [k.trim(), v.join('=')];
    }),
  );
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false; // 5-minute tolerance
  const expected = await hmacHex(secret, `${t}.${payload}`);
  return header
    .split(',')
    .filter((kv) => kv.trim().startsWith('v1='))
    .some((kv) => safeEqual(kv.trim().slice(3), expected));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secret) return new Response('webhook secret not configured', { status: 500 });

  const payload = await req.text();
  if (!(await verify(payload, req.headers.get('Stripe-Signature'), secret))) {
    return new Response('invalid signature', { status: 400 });
  }

  const event = JSON.parse(payload);
  const s = event.data?.object ?? {};
  const txId: string | undefined = s.metadata?.transaction_id ?? s.client_reference_id;
  const db = admin();

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        if (s.payment_status !== 'paid' || !txId) break;
        const amount = fromMinor(Number(s.amount_total), String(s.currency));
        const { error } = await db.rpc('confirm_payment', {
          p_transaction_id: txId,
          p_provider_ref: s.payment_intent ?? s.id,
          p_amount: amount,
        });
        if (error) throw error;
        break;
      }
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        if (txId) await db.rpc('fail_payment', { p_transaction_id: txId, p_reason: event.type.split('.').pop() });
        break;
      }
    }
  } catch (e) {
    console.error('stripe-webhook', event.type, e);
    return new Response('error', { status: 500 }); // Stripe retries
  }
  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});
