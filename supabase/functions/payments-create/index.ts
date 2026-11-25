// POST { reservation_id, provider: 'stripe' | 'feexpay', return_url, network?, phone? }
// Starts the payment of an approved reservation for the signed-in sender.
// The amount always comes from the database (begin_payment), never from the client.
import {
  admin,
  callerId,
  cors,
  FEEXPAY_NETWORKS,
  feexpayBase,
  json,
  safeReturnUrl,
  toMinor,
  toXof,
  withParams,
} from '../_shared/common.ts';

async function stripeCheckout(opts: {
  transactionId: string;
  reservationId: string;
  amount: number;
  currency: string;
  item: string;
  email?: string;
  returnUrl: string;
}) {
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  if (!key) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY missing)');

  const f = new URLSearchParams();
  f.set('mode', 'payment');
  f.set('line_items[0][quantity]', '1');
  f.set('line_items[0][price_data][currency]', opts.currency.toLowerCase());
  f.set('line_items[0][price_data][unit_amount]', String(toMinor(opts.amount, opts.currency)));
  f.set('line_items[0][price_data][product_data][name]', `KiloFly · ${opts.item}`);
  f.set('line_items[0][price_data][product_data][description]', 'Transport de colis — paiement bloqué jusqu’à la livraison');
  f.set('success_url', withParams(opts.returnUrl, { status: 'success', reservation: opts.reservationId }));
  f.set('cancel_url', withParams(opts.returnUrl, { status: 'cancel', reservation: opts.reservationId }));
  f.set('client_reference_id', opts.transactionId);
  f.set('metadata[transaction_id]', opts.transactionId);
  f.set('metadata[reservation_id]', opts.reservationId);
  f.set('payment_intent_data[metadata][transaction_id]', opts.transactionId);
  f.set('locale', 'fr');
  if (opts.email) f.set('customer_email', opts.email);

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': `kf-${opts.transactionId}-${Math.floor(Date.now() / 60000)}`,
    },
    body: f,
  });
  const session = await res.json();
  if (!res.ok) throw new Error(session?.error?.message ?? 'Stripe error');
  return { url: session.url as string, reference: session.id as string };
}

async function feexpayRequest(opts: {
  transactionId: string;
  reservationId: string;
  amountXof: number;
  network: string;
  phone: string;
  returnUrl: string;
}) {
  const key = Deno.env.get('FEEXPAY_API_KEY');
  const shop = Deno.env.get('FEEXPAY_SHOP_ID');
  if (!key || !shop) throw new Error('FeexPay is not configured (FEEXPAY_API_KEY / FEEXPAY_SHOP_ID missing)');

  const res = await fetch(`${feexpayBase()}/api/transactions/public/requesttopay/${opts.network}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shop,
      amount: opts.amountXof,
      phoneNumber: Number(opts.phone),
      description: 'KiloFly transport de colis',
      callback_info: opts.transactionId,
      return_url: withParams(opts.returnUrl, { status: 'success', reservation: opts.reservationId }),
      cancel_url: withParams(opts.returnUrl, { status: 'cancel', reservation: opts.reservationId }),
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.reference) throw new Error(body?.message ?? `FeexPay error ${res.status}`);
  return { reference: String(body.reference), url: (body.payment_url as string | undefined) ?? undefined };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  try {
    const uid = await callerId(req);
    if (!uid) return json({ error: 'not signed in' }, 401);

    const body = await req.json().catch(() => ({}));
    const reservationId = String(body.reservation_id ?? '');
    const provider = body.provider === 'feexpay' ? 'feexpay' : 'stripe';
    const returnUrl = safeReturnUrl(body.return_url);
    if (!/^[0-9a-f-]{36}$/i.test(reservationId)) return json({ error: 'invalid reservation' }, 400);
    if (!returnUrl) return json({ error: 'invalid return url' }, 400);

    // FeexPay input is validated before touching the database.
    let network = '';
    let phone = '';
    if (provider === 'feexpay') {
      network = String(body.network ?? '');
      phone = String(body.phone ?? '').replace(/\D/g, '');
      const cc = FEEXPAY_NETWORKS[network];
      if (!cc) return json({ error: 'Réseau mobile money non pris en charge.' }, 400);
      if (!phone.startsWith(cc) || phone.length < cc.length + 8 || phone.length > cc.length + 10) {
        return json({ error: `Numéro invalide : il doit commencer par l’indicatif ${cc}.` }, 400);
      }
    }

    const db = admin();
    const { data, error } = await db.rpc('begin_payment', { p_reservation_id: reservationId, p_buyer: uid, p_provider: provider });
    if (error) return json({ error: error.message }, 409);
    const tx = (data as { transaction_id: string; amount: number; currency: string; item: string }[])[0];

    if (provider === 'feexpay') {
      const xof = toXof(Number(tx.amount), tx.currency);
      if (xof === null) return json({ error: 'Le mobile money n’accepte que les trajets en FCFA ou en euros. Payez par carte.' }, 400);
      if (xof < 100) return json({ error: 'Montant trop faible pour le mobile money (minimum 100 FCFA).' }, 400);
      const out = await feexpayRequest({ transactionId: tx.transaction_id, reservationId, amountXof: xof, network, phone, returnUrl });
      await db.rpc('set_payment_reference', { p_transaction_id: tx.transaction_id, p_reference: out.reference });
      return json({ reference: out.reference, url: out.url, mode: out.url ? 'redirect' : 'push', amount_xof: xof });
    }

    const { data: u } = await db.auth.admin.getUserById(uid);
    const out = await stripeCheckout({
      transactionId: tx.transaction_id,
      reservationId,
      amount: Number(tx.amount),
      currency: tx.currency,
      item: tx.item,
      email: u.user?.email ?? undefined,
      returnUrl,
    });
    await db.rpc('set_payment_reference', { p_transaction_id: tx.transaction_id, p_reference: out.reference });
    return json({ ...out, mode: 'redirect' });
  } catch (e) {
    console.error('payments-create', e);
    return json({ error: (e as Error).message ?? 'server error' }, 500);
  }
});
