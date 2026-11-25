// POST { reservation_id } — the sender asks "is my payment through?".
// The server checks directly with Stripe / FeexPay (never trusts the client) and confirms if paid.
// This is the safety net when a webhook is late or not configured.
import { admin, callerId, cors, feexpayStatus, fromMinor, json, toXof } from '../_shared/common.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  try {
    const uid = await callerId(req);
    if (!uid) return json({ error: 'not signed in' }, 401);
    const { reservation_id } = await req.json().catch(() => ({}));
    if (!/^[0-9a-f-]{36}$/i.test(String(reservation_id ?? ''))) return json({ error: 'invalid reservation' }, 400);

    const db = admin();
    const { data: tx } = await db
      .from('transactions')
      .select('id, buyer_id, status, provider, currency, amount, stripe_payment_intent_id')
      .eq('reservation_id', reservation_id)
      .in('status', ['pending', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!tx || tx.buyer_id !== uid) return json({ status: 'none' });
    if (tx.status === 'completed') return json({ status: 'paid' });
    const ref = tx.stripe_payment_intent_id as string | null;
    if (!ref) return json({ status: 'pending' });

    if (tx.provider === 'feexpay') {
      const s = await feexpayStatus(ref);
      const expected = toXof(Number(tx.amount), String(tx.currency));
      if (s.status === 'SUCCESSFUL') {
        if (expected !== null && Math.round(Number(s.amount)) !== expected) return json({ status: 'mismatch' }, 409);
        await db.rpc('confirm_payment', { p_transaction_id: tx.id, p_provider_ref: ref, p_amount: null });
        return json({ status: 'paid' });
      }
      if (s.status === 'FAILED') {
        await db.rpc('fail_payment', { p_transaction_id: tx.id, p_reason: s.reason || 'failed' });
        return json({ status: 'failed', reason: s.reason ?? null });
      }
      return json({ status: 'pending' });
    }

    // Stripe Checkout session
    const key = Deno.env.get('STRIPE_SECRET_KEY');
    if (!key) return json({ status: 'pending' });
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(ref)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const s = await res.json();
    if (res.ok && s.payment_status === 'paid' && s.metadata?.transaction_id === tx.id) {
      await db.rpc('confirm_payment', {
        p_transaction_id: tx.id,
        p_provider_ref: s.payment_intent ?? s.id,
        p_amount: fromMinor(Number(s.amount_total), String(s.currency)),
      });
      return json({ status: 'paid' });
    }
    if (res.ok && s.status === 'expired') return json({ status: 'failed' });
    return json({ status: 'pending' });
  } catch (e) {
    console.error('payments-check', e);
    return json({ error: (e as Error).message ?? 'server error' }, 500);
  }
});
