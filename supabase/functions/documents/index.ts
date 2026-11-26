// KiloFly documents: signed engagement (contract) and payment receipt (facture), as PDF.
// POST { kind: 'contract' | 'invoice', reservation_id, type?: 'sender'|'transporter', email?: boolean }
//  -> { pdf: base64, filename, emailed: boolean }
// Everything is rebuilt from the database (never from what the phone sends), and the e-mail only goes
// to the signed-in user's own address. Self-contained so it can be deployed from the dashboard editor.
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'npm:pdf-lib@1.17.1';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const db = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

const NAVY = rgb(0.012, 0.059, 0.118);
const GOLD = rgb(0.78, 0.6, 0.35);
const GREY = rgb(0.35, 0.37, 0.42);

// pdf-lib standard fonts only speak WinAnsi: replace characters they can't draw.
const clean = (s: unknown) =>
  String(s ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/→/g, '->')
    .replace(/ | /g, ' ')
    .replace(/[^\x20-\x7E -ÿ€•]/g, '');

const money = (n: number, c: string) => {
  const cur = (c || 'EUR').toUpperCase();
  if (cur === 'XOF' || cur === 'XAF') return `${Math.round(n).toLocaleString('fr-FR')} FCFA`;
  return `${n.toFixed(2).replace('.', ',')} ${cur === 'EUR' ? '€' : cur === 'CAD' ? '$ CA' : cur}`;
};
const date = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' UTC';

class Doc {
  pdf!: PDFDocument;
  page!: PDFPage;
  font!: PDFFont;
  bold!: PDFFont;
  y = 0;
  static async create(title: string, subtitle: string) {
    const d = new Doc();
    d.pdf = await PDFDocument.create();
    d.font = await d.pdf.embedFont(StandardFonts.Helvetica);
    d.bold = await d.pdf.embedFont(StandardFonts.HelveticaBold);
    d.newPage();
    d.page.drawRectangle({ x: 0, y: 762, width: 595, height: 80, color: NAVY });
    d.page.drawText('KiloFly', { x: 40, y: 800, size: 26, font: d.bold, color: GOLD });
    d.page.drawText('Expédiez malin, voyagez utile · kiloflyapp.com', { x: 40, y: 780, size: 9, font: d.font, color: rgb(0.85, 0.85, 0.85) });
    d.y = 730;
    d.text(clean(title), { size: 18, bold: true });
    d.text(clean(subtitle), { size: 10, color: GREY });
    d.y -= 8;
    return d;
  }
  newPage() {
    this.page = this.pdf.addPage([595, 842]);
    this.y = 800;
  }
  ensure(h: number) {
    if (this.y - h < 60) this.newPage();
  }
  text(s: string, o: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; width?: number } = {}) {
    const size = o.size ?? 11;
    const f = o.bold ? this.bold : this.font;
    const x = o.x ?? 40;
    const width = o.width ?? 515 - (x - 40);
    const words = clean(s).split(/\s+/);
    let line = '';
    const lines: string[] = [];
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(t, size) > width && line) {
        lines.push(line);
        line = w;
      } else line = t;
    }
    if (line) lines.push(line);
    for (const l of lines) {
      this.ensure(size + 4);
      this.page.drawText(l, { x, y: this.y, size, font: f, color: o.color ?? NAVY });
      this.y -= size + 4;
    }
  }
  row(label: string, value: string, strong = false) {
    this.ensure(18);
    this.page.drawText(clean(label), { x: 40, y: this.y, size: 11, font: this.font, color: GREY });
    const v = clean(value);
    const f = strong ? this.bold : this.font;
    this.page.drawText(v, { x: 555 - f.widthOfTextAtSize(v, 11), y: this.y, size: 11, font: f, color: NAVY });
    this.y -= 18;
  }
  line() {
    this.page.drawLine({ start: { x: 40, y: this.y + 6 }, end: { x: 555, y: this.y + 6 }, thickness: 0.6, color: rgb(0.85, 0.85, 0.85) });
    this.y -= 8;
  }
  /** Draws the stored finger signature (SVG paths) in a box. */
  signature(svg: string, label: string) {
    this.ensure(130);
    const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
    const w = vb ? Number(vb[1]) : 300;
    const h = vb ? Number(vb[2]) : 180;
    const boxW = 240;
    const boxH = 100;
    const scale = Math.min(boxW / w, boxH / h);
    this.page.drawRectangle({ x: 40, y: this.y - boxH, width: boxW, height: boxH, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.8 });
    for (const m of svg.matchAll(/ d="([^"]+)"/g)) {
      this.page.drawSvgPath(m[1], { x: 40, y: this.y, scale, borderColor: NAVY, borderWidth: 1.4 / scale });
    }
    this.page.drawText(clean(label), { x: 40, y: this.y - boxH - 14, size: 9, font: this.font, color: GREY });
    this.y -= boxH + 30;
  }
  async base64() {
    const bytes = await this.pdf.save();
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
}


/** Reservation + trip + both names, without relying on foreign-key names. */
async function reservationInfo(id: string) {
  const s = db();
  const { data: r } = await s.from('reservations').select('id, listing_id, buyer_id, seller_id, requested_kg, total_price, item_description').eq('id', id).single();
  const { data: l } = await s.from('listings').select('departure, arrival, departure_date').eq('id', r!.listing_id).maybeSingle();
  const { data: ps } = await s.from('profiles').select('id, full_name').in('id', [r!.buyer_id, r!.seller_id]);
  const name = (uid: string) => ps?.find((p) => p.id === uid)?.full_name ?? '';
  return { ...r!, listing: l ?? {}, buyer: { full_name: name(r!.buyer_id) }, seller: { full_name: name(r!.seller_id) } };
}

async function contractPdf(reservationId: string, type: 'sender' | 'transporter') {
  const s = db();
  const { data: sig } = await s
    .from('legal_signatures')
    .select('user_id, signature_type, signature_data, conditions_accepted, signed_at, ip_address')
    .eq('reservation_id', reservationId)
    .eq('signature_type', type)
    .maybeSingle();
  if (!sig) throw new Error('not signed');
  const r: any = await reservationInfo(reservationId);
  const terms = sig.conditions_accepted as { title: string; version: string; clauses: string[]; sha256?: string };
  const l = (r as any)?.listing ?? {};
  const signer = type === 'sender' ? (r as any)?.buyer?.full_name : (r as any)?.seller?.full_name;
  const d = await Doc.create(terms.title, `Réservation ${reservationId.slice(0, 8).toUpperCase()} · ${l.departure ?? ''} -> ${l.arrival ?? ''} · départ le ${l.departure_date ?? ''}`);
  d.row('Signataire', signer ?? '');
  d.row('Rôle', type === 'sender' ? 'Expéditeur' : 'Voyageur');
  d.row('Colis', `${r?.requested_kg ?? ''} kg · ${r?.item_description ?? ''}`.slice(0, 80));
  d.row('Signé le', date(sig.signed_at));
  d.line();
  d.text('Engagements acceptés', { size: 13, bold: true });
  d.y -= 2;
  for (const c of terms.clauses ?? []) {
    d.text(`•  ${c}`, { size: 10.5, x: 48 });
    d.y -= 3;
  }
  d.y -= 6;
  d.text("J'ai lu et j'accepte ces conditions. Je confirme être entièrement responsable des articles " + (type === 'sender' ? "que j'envoie." : 'que je transporte.'), { size: 10.5, bold: true });
  d.y -= 10;
  d.signature(sig.signature_data, `Signature de ${signer ?? ''}`);
  d.text(`Version des conditions : ${terms.version} · empreinte SHA-256 : ${terms.sha256 ?? '-'}`, { size: 8, color: GREY });
  d.text(`Adresse IP : ${sig.ip_address || '-'} · Document généré par KiloFly à partir de la signature enregistrée.`, { size: 8, color: GREY });
  return { pdf: await d.base64(), filename: `KiloFly-engagement-${type === 'sender' ? 'expediteur' : 'voyageur'}-${reservationId.slice(0, 8)}.pdf`, subject: terms.title };
}

async function invoicePdf(reservationId: string, uid: string) {
  const s = db();
  const { data: t } = await s
    .from('transactions')
    .select('id, amount, platform_commission, seller_amount, currency, provider, paid_at, created_at, buyer_id, seller_id, status')
    .eq('reservation_id', reservationId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!t) throw new Error('not paid');
  const r: any = await reservationInfo(reservationId);
  const l = (r as any)?.listing ?? {};
  const isBuyer = uid === t.buyer_id;
  const cur = t.currency || 'EUR';
  const base = Number(r?.total_price ?? 0);
  const fee = Number(t.amount) - base;
  const d = await Doc.create(isBuyer ? 'Reçu de paiement' : 'Relevé de transport', `N° ${t.id.slice(0, 8).toUpperCase()} · ${date(t.paid_at ?? t.created_at)}`);
  d.row('Expéditeur', (r as any)?.buyer?.full_name ?? '');
  d.row('Voyageur', (r as any)?.seller?.full_name ?? '');
  d.row('Trajet', `${l.departure ?? ''} -> ${l.arrival ?? ''}`);
  d.row('Départ', String(l.departure_date ?? ''));
  d.row('Colis', `${r?.requested_kg ?? ''} kg · ${r?.item_description ?? ''}`.slice(0, 80));
  d.line();
  if (isBuyer) {
    d.row('Transport', money(base, cur));
    d.row('Frais de service KiloFly (5 %)', money(fee, cur));
    d.line();
    d.row('Total payé', money(Number(t.amount), cur), true);
    d.row('Moyen de paiement', t.provider === 'feexpay' ? 'Mobile money (FeexPay)' : 'Carte bancaire (Stripe)');
  } else {
    d.row('Prix du transport', money(base, cur));
    d.row('Commission KiloFly (5 %)', `- ${money(base - Number(t.seller_amount), cur)}`);
    d.line();
    d.row('Montant pour vous', money(Number(t.seller_amount), cur), true);
    d.text('Crédité sur votre portefeuille KiloFly après confirmation de la livraison.', { size: 9, color: GREY });
  }
  d.y -= 16;
  d.text("Le paiement est conservé par KiloFly jusqu'à la livraison confirmée par le code du destinataire.", { size: 9, color: GREY });
  d.text('KiloFly · kiloflyapp.com · kiloflyapp@hotmail.com', { size: 9, color: GREY });
  return { pdf: await d.base64(), filename: `KiloFly-${isBuyer ? 'recu' : 'releve'}-${t.id.slice(0, 8)}.pdf`, subject: isBuyer ? 'Votre reçu KiloFly' : 'Votre relevé de transport KiloFly' };
}

async function sendEmail(to: string, subject: string, filename: string, pdf: string) {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return false;
  const from = Deno.env.get('MAIL_FROM') ?? 'KiloFly <noreply@kiloflyapp.com>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: `<div style="font-family:Arial,sans-serif;color:#030F1E"><h2 style="color:#C79A58">KiloFly</h2><p>Bonjour,</p><p>Vous trouverez en pièce jointe votre document : <b>${subject}</b>.</p><p>Il est aussi disponible à tout moment dans l'application, sur la réservation.</p><p style="color:#666;font-size:12px">KiloFly · Expédiez malin, voyagez utile</p></div>`,
      attachments: [{ filename, content: pdf }],
    }),
  });
  if (!res.ok) console.error('resend', res.status, await res.text());
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  try {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    const { data: u } = token ? await db().auth.getUser(token) : { data: { user: null } };
    const user = u?.user;
    if (!user) return json({ error: 'not signed in' }, 401);

    const body = await req.json().catch(() => ({}));
    const reservationId = String(body.reservation_id ?? '');
    if (!/^[0-9a-f-]{36}$/i.test(reservationId)) return json({ error: 'invalid reservation' }, 400);

    const { data: r } = await db().from('reservations').select('buyer_id, seller_id').eq('id', reservationId).maybeSingle();
    if (!r || (r.buyer_id !== user.id && r.seller_id !== user.id)) return json({ error: 'not allowed' }, 403);

    let out: { pdf: string; filename: string; subject: string };
    if (body.kind === 'contract') {
      const type = body.type === 'transporter' ? 'transporter' : 'sender';
      out = await contractPdf(reservationId, type);
    } else if (body.kind === 'invoice') {
      out = await invoicePdf(reservationId, user.id);
    } else return json({ error: 'invalid kind' }, 400);

    const emailed = body.email === true && !!user.email ? await sendEmail(user.email, out.subject, out.filename, out.pdf) : false;
    return json({ pdf: out.pdf, filename: out.filename, emailed, email: body.email === true ? user.email : undefined });
  } catch (e) {
    const m = (e as Error).message;
    return json({ error: m === 'not signed' || m === 'not paid' ? m : 'server error' }, m.startsWith('not') ? 400 : 500);
  }
});
