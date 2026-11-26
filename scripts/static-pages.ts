// Builds plain HTML pages (readable without JavaScript, for Google and search engines):
// public/a-propos.html, public/confidentialite.html, public/conditions.html.
// Run: npx -y tsx scripts/static-pages.ts
import { writeFileSync } from 'node:fs';
import { INFO_PAGES } from '../src/data/info';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const STORE = `<p class="stores"><a href="https://apps.apple.com/app/id6757349482"><img src="/brand/app-store.png" alt="Télécharger sur l’App Store" height="44"></a>
<a href="https://play.google.com/store/apps/details?id=com.kilofly.app"><img src="/brand/google-play.png" alt="Disponible sur Google Play" height="44"></a></p>`;

function shell(title: string, body: string) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — KiloFly</title><meta name="description" content="KiloFly met en relation les voyageurs qui ont des kilos disponibles dans leurs bagages et les personnes qui veulent envoyer un colis.">
<style>body{margin:0;background:#030F1E;color:#E9EEF5;font:16px/1.6 -apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:760px;margin:0 auto;padding:32px 16px 64px}a{color:#E4BC83}h1,h2{color:#F3D9A8;line-height:1.25}
header{display:flex;align-items:center;gap:12px;margin-bottom:24px}header img{height:40px}nav a{margin-right:16px}
.stores img{margin:8px 8px 0 0}footer{margin-top:48px;font-size:14px;color:#9AA7B8}</style></head><body><main>
<header><a href="/"><img src="/brand/logo-k.png" alt="KiloFly"></a><img src="/brand/wordmark.png" alt="KiloFly"></header>
${body}
<footer><nav><a href="/a-propos.html">À propos</a><a href="/confidentialite.html">Confidentialité</a><a href="/conditions.html">Conditions d’utilisation</a></nav>
<p>Contact : <a href="mailto:kiloflyapp@hotmail.com">kiloflyapp@hotmail.com</a> · © ${new Date().getFullYear()} KiloFly</p></footer></main></body></html>`;
}

function infoPage(slug: 'privacy' | 'terms') {
  const p = INFO_PAGES[slug];
  let h = `<h1>${esc(p.title)}</h1>${p.intro ? `<p><em>${esc(p.intro)}</em></p>` : ''}`;
  for (const s of p.sections) {
    h += `<h2>${esc(s.heading)}</h2>`;
    for (const para of s.paragraphs ?? []) h += `<p>${esc(para)}</p>`;
    if (s.bullets?.length) h += `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`;
    for (const qa of s.qa ?? []) h += `<p><strong>${esc(qa.q)}</strong><br>${esc(qa.a)}</p>`;
  }
  return shell(p.title, h);
}

const about = shell('À propos', `<h1>KiloFly — expédiez malin, voyagez utile</h1>
<p><strong>KiloFly</strong> est une application qui met en relation des <strong>voyageurs</strong> ayant des kilos disponibles dans leurs bagages et des <strong>expéditeurs</strong> qui veulent faire livrer un colis à l’étranger, notamment entre l’Europe, l’Amérique du Nord et l’Afrique.</p>
<h2>Comment ça marche</h2><ul>
<li>Le voyageur publie son trajet (villes, dates, kilos disponibles, prix au kilo).</li>
<li>L’expéditeur cherche un trajet, réserve des kilos et décrit son colis.</li>
<li>Les deux parties signent un contrat électronique ; le paiement est sécurisé et conservé jusqu’à la livraison.</li>
<li>Le colis est suivi étape par étape ; la livraison est confirmée par un code à 6 chiffres, une signature et une photo.</li>
<li>Le voyageur est alors payé sur son portefeuille KiloFly, et chacun peut laisser un avis.</li></ul>
<h2>Confiance et sécurité</h2><ul>
<li>Vérification d’identité des membres.</li><li>Messagerie intégrée, signalement et blocage.</li>
<li>Liste des objets interdits conforme aux règles IATA.</li></ul>
<h2>Connexion</h2><p>Vous pouvez créer un compte avec votre e-mail, ou vous connecter avec Google ou Apple. KiloFly utilise uniquement votre nom, votre adresse e-mail et votre photo de profil pour créer votre compte. Détails dans notre <a href="/confidentialite.html">politique de confidentialité</a>.</p>
<p><a href="/">Ouvrir KiloFly sur le web</a></p>${STORE}`);

writeFileSync('public/a-propos.html', about);
writeFileSync('public/confidentialite.html', infoPage('privacy'));
writeFileSync('public/conditions.html', infoPage('terms'));
console.log('ok');
