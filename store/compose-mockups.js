const p=require('puppeteer-core');const fs=require('fs');const P=process.argv[2];const R=P+'/raw/';
const img=f=>'data:image/png;base64,'+fs.readFileSync(R+f).toString('base64');
const css=`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@500;600&display=block');
*{margin:0;box-sizing:border-box}body{width:__W__;height:__H__;overflow:hidden;font-family:Inter,sans-serif;color:#F4F1EA;
background:radial-gradient(1200px 900px at 80% 10%,rgba(228,188,131,.28),transparent 60%),radial-gradient(900px 900px at 0% 100%,rgba(42,86,160,.35),transparent 60%),linear-gradient(160deg,#071a33 0%,#030F1E 55%,#02080f 100%);position:relative}
.stars{position:absolute;inset:0;background-image:radial-gradient(1.5px 1.5px at 20% 30%,#ffffff55,transparent),radial-gradient(1.5px 1.5px at 70% 15%,#ffffff44,transparent),radial-gradient(1px 1px at 40% 80%,#ffffff44,transparent),radial-gradient(1.5px 1.5px at 85% 60%,#ffffff33,transparent),radial-gradient(1px 1px at 10% 65%,#ffffff44,transparent)}
.brand{display:flex;align-items:center;justify-content:center;gap:14px}.brand img.k{height:70px}.brand img.w{height:64px}
h1{font-family:'Playfair Display',serif;font-weight:700;font-size:92px;line-height:1.05;text-align:center;letter-spacing:-1px}
h1 em{font-style:italic;background:linear-gradient(90deg,#F3D9A8,#D4A35E);-webkit-background-clip:text;color:transparent}
.sub{font-size:38px;color:#B9C3D1;text-align:center;line-height:1.35;margin-top:22px}
.phone{position:absolute;width:640px;height:1386px;border-radius:92px;padding:18px;background:linear-gradient(145deg,#3a3f48,#0d1117 40%,#2a2f37);box-shadow:0 60px 120px rgba(0,0,0,.65),0 0 0 3px #5b5f66 inset,0 0 80px rgba(228,188,131,.18)}
.phone .scr{width:100%;height:100%;border-radius:76px;overflow:hidden;position:relative;background:#030F1E}
.phone .scr img{width:100%;display:block}
.phone .isl{position:absolute;top:34px;left:50%;transform:translateX(-50%);width:170px;height:48px;border-radius:30px;background:#000;z-index:2}
.sb{height:110px;display:flex;justify-content:space-between;align-items:center;padding:20px 64px 0;font:600 30px Inter;color:#fff;background:#030F1E}.sb .ic{font-size:20px;letter-spacing:1px}.glow{position:absolute;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(228,188,131,.25),transparent 65%)}
.chip{display:inline-block;padding:14px 30px;border-radius:999px;border:2px solid rgba(228,188,131,.6);color:#F3D9A8;font-size:30px;font-weight:600;background:rgba(228,188,131,.08)}`;
const phone=(f,style)=>`<div class="phone" style="${style}"><div class="scr"><div class="isl"></div><div class="sb"><span>9:41</span><span class="ic">▂▄▆ &nbsp;◉ &nbsp;▮▮▮▯</span></div><img src="${img(f)}"></div></div>`;
const brand=`<div class="brand"><img class="k" src="${img('logo-k.png')}"><img class="w" src="${img('wordmark.png')}"></div>`;
const top=(t,s,f)=>`<div class="stars"></div><div style="position:absolute;top:90px;width:100%;padding:0 70px">${brand}<h1 style="margin-top:60px">${t}</h1><div class="sub">${s}</div></div><div class="glow" style="left:90px;top:900px"></div>${phone(f,'left:220px;top:720px')}`;
const bottom=(t,s,f)=>`<div class="stars"></div><div class="glow" style="left:90px;top:-150px"></div>${phone(f,'left:220px;top:-560px')}<div style="position:absolute;top:1010px;width:100%;padding:0 70px"><h1>${t}</h1><div class="sub">${s}</div><div style="text-align:center;margin-top:60px">${brand}</div></div>`;
const duo=(t,s,a,b2)=>`<div class="stars"></div><div style="position:absolute;top:90px;width:100%;padding:0 70px">${brand}<h1 style="margin-top:60px">${t}</h1><div class="sub">${s}</div></div><div class="glow" style="left:90px;top:950px"></div>${phone(a,'left:40px;top:820px;transform:rotate(-8deg) scale(.85)')}${phone(b2,'left:400px;top:760px;transform:rotate(7deg) scale(.85)')}`;
const shots=[
['01',top('Envoyez vos colis <em>avec des voyageurs</em>','Des kilos disponibles dans les valises, partout dans le monde.','welcome.png')],
['02',bottom('Trouvez un voyageur <em>en quelques secondes</em>','Cherchez par ville, pays et dates.','home.png')],
['03',top('Comparez les trajets <em>et les prix au kilo</em>','Prix convertis dans votre devise : FCFA, euro, dollar…','search.png')],
['04',bottom('Réservez <em>en toute confiance</em>','Profils vérifiés, avis et contrat signé à chaque envoi.','listing.png')],
['05',duo('Voyageur ou expéditeur, <em>à vous de choisir</em>','Gagnez de l’argent en voyageant, ou envoyez vos colis moins cher.','onboarding.png','home.png')],
['06',top('Suivi, code de livraison <em>et paiement sécurisé</em>','Connexion en un geste avec Google ou Apple.','auth2.png')],
];
(async()=>{const b=await p.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new'});const pg=await b.newPage();
fs.mkdirSync(P+'/final',{recursive:true});
for(const [n,body] of shots){await pg.setViewport({width:1080,height:1920});await pg.setContent(`<style>${css.replace('__W__','1080px').replace('__H__','1920px')}</style>${body}`,{waitUntil:'load',timeout:0});await pg.evaluate(()=>document.fonts.ready);await pg.screenshot({path:`${P}/final/capture-${n}.png`});console.log(n);}
// feature graphic 1024x500
await pg.setViewport({width:1024,height:500});
await pg.setContent(`<style>${css.replace('__W__','1024px').replace('__H__','500px')} .phone{width:300px;height:650px;border-radius:46px;padding:9px}.phone .scr{border-radius:38px}.phone .isl{top:16px;width:80px;height:22px}.sb{height:52px;font-size:14px;padding:8px 30px 0}.sb .ic{font-size:9px}</style><div class="stars"></div>
<div style="position:absolute;left:60px;top:110px;width:520px"><div class="brand" style="justify-content:flex-start"><img class="k" src="${img('logo-k.png')}" style="height:84px"><img class="w" src="${img('wordmark.png')}" style="height:78px"></div>
<div style="font-family:'Playfair Display';font-size:46px;line-height:1.1;margin-top:28px">Envoyez vos colis <em style="font-style:italic;color:#E4BC83">avec des voyageurs</em></div>
<div style="font-size:21px;letter-spacing:5px;color:#E4BC83;margin-top:22px">EXPÉDIEZ MALIN, VOYAGEZ UTILE</div></div>
<div class="glow" style="left:560px;top:-200px"></div>${phone('home.png','left:600px;top:70px;transform:rotate(-6deg)')}${phone('listing.png','left:780px;top:40px;transform:rotate(6deg)')}`,{waitUntil:'load',timeout:0});
await pg.evaluate(()=>document.fonts.ready);await pg.screenshot({path:`${P}/final/banniere-1024x500.png`});
await b.close();})();
