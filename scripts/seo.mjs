// After `expo export`, give the single-page index.html a real title, description, social preview
// and crawlable links (Google and link previews read these).
import { readFileSync, writeFileSync } from 'node:fs';
const f = 'dist/index.html';
let h = readFileSync(f, 'utf8');
const title = 'KiloFly — Envoyez vos colis avec des voyageurs';
const desc = 'KiloFly met en relation les voyageurs qui ont des kilos libres dans leurs bagages et les personnes qui veulent envoyer un colis à l’étranger : Europe, Amérique du Nord, Afrique. Paiement sécurisé, suivi et code de livraison.';
const img = 'https://www.kiloflyapp.com/brand/og-image.png';
h = h.replace('<html lang="en">', '<html lang="fr">').replace('<title>KiloFly</title>', `<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://www.kiloflyapp.com/">
<meta property="og:type" content="website"><meta property="og:site_name" content="KiloFly">
<meta property="og:title" content="${title}"><meta property="og:description" content="${desc}">
<meta property="og:url" content="https://www.kiloflyapp.com/"><meta property="og:image" content="${img}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${img}">
<meta name="apple-itunes-app" content="app-id=6757349482">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'MobileApplication', name: 'KiloFly', operatingSystem: 'iOS, Android', applicationCategory: 'TravelApplication', description: desc, url: 'https://www.kiloflyapp.com/', offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, publisher: { '@type': 'Organization', name: 'Dee Digital' } })}</script>`);
h = h.replace(/<noscript>[\s\S]*?<\/noscript>/, `<noscript><h1>${title}</h1><p>${desc}</p><p><a href="/a-propos.html">À propos de KiloFly</a> · <a href="https://apps.apple.com/app/id6757349482">App Store</a> · <a href="https://play.google.com/store/apps/details?id=com.kilofly.app">Google Play</a> · <a href="/confidentialite.html">Confidentialité</a> · <a href="/conditions.html">Conditions</a></p></noscript>`);
writeFileSync(f, h);
console.log('seo ok');
