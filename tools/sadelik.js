#!/usr/bin/env node
/* SADELIK — ekranlar sade mi, OLCULUR.
 *
 * ------------------------------------------------------------------
 * NEDEN BU ARAC VAR
 *
 * Kullanicinin tek tasarimdan istedigi iki sey var: hicbir ozellik
 * kaybolmasin (`envanter.js` olcer) ve ekran sade, anlasilir olsun.
 * Ikincisi «bence sade oldu» ile kanitlanamaz. `ekip/EKIP-PLANI.md`
 * §1.2 bir SADELIK BUTCESI yaziyor; bu arac o butceyi her ekranda
 * olcer ve asani soyler.
 *
 * Olculer `envanter.js`'in gezintisinden gelir (tek gezgin, iki
 * denetim): dolu profil, 1440 piksel. Kaynak taramasi ayrica ham renk
 * sayar.
 *
 * ------------------------------------------------------------------
 * BUTCE (plan §1.2)
 *
 *   her ekran   ekran ici sekme 0 · sekme grubu 0 · 30 kelimeyi asan tek
 *               parca yazi 0 · dolu (birincil) dugme en cok 1 · halka en
 *               cok 1 · resimsi simge (emoji) 0 · XP yazisi 0 (Rutbe haric) ·
 *               kesinligi olmayan sayi 0 (`.sayi[data-etiketsiz]`, katalog 024)
 *   Bugun       sayfa boyu en cok 1800 px · gorunen dugme en cok 14
 *   kaynak      ekran ve kart dosyalarinda jeton disi ham renk 0
 *
 * ------------------------------------------------------------------
 * NE ZAMAN KIRMIZI
 *
 * Bugunku uygulama butcenin cok ustunde (Bugun 4 482 px, 52 dugme);
 * butce ancak bir modul yeni iskelete gecince anlam kazanir. Bu yuzden
 * arac bir modulu yalniz TESLIM EDILMISSE denetler: `ekip/EKIP-DURUM.md`
 * teslim tablosunda o modulun satiri ✅ ise. Digerleri icin olcer ve
 * yazar, cikis kodunu etkilemez. `--denetle AYS` ile elle de istenir.
 *
 *   node tools/sadelik.js                      # olc; teslim edilenleri denetle
 *   node tools/sadelik.js --denetle AYS SPI    # bu modulleri denetle
 *   node tools/sadelik.js --gezinti g.json     # envanter.js --json ciktisini kullan
 *   node tools/sadelik.js AYS                  # tek modul
 *
 * Cikis kodu: 0 butcede (ya da yalniz olcum), 1 denetlenen bir modul
 * butceyi asti, 2 kosum hatasi.
 */
'use strict';

const path = require('path');
const fs = require('fs');
const ENV = require('./envanter.js');

const KOK = path.resolve(__dirname, '..');

const KURAL = [
  { ad:'sekme',        olcu:'sekme',        en:0, yazi:'ekran içi sekme' },
  { ad:'sekmeGrubu',   olcu:'sekmeGrubu',   en:0, yazi:'sekme grubu' },
  { ad:'uzunParagraf', olcu:'uzunParagraf', en:0, yazi:'30+ kelimelik tek parça yazı' },
  { ad:'dolu',         olcu:'dolu',         en:1, yazi:'dolu (birincil) düğme' },
  { ad:'halka',        olcu:'halka',        en:1, yazi:'halka grafiği' },
  { ad:'simge',        olcu:'simge',        en:0, yazi:'resimsi simge (emoji)' },
  { ad:'xp',           olcu:'xp',           en:0, yazi:'XP yazısı', haric:['rutbe'] },
  { ad:'etiketsiz',    olcu:'etiketsiz',    en:0, yazi:'kesinliği olmayan sayı (024)' },
  { ad:'boy',          olcu:'boy',          en:1800, yazi:'sayfa boyu (px)', yalniz:['today'] },
  { ad:'dugme',        olcu:'dugme',        en:14, yazi:'görünen düğme', yalniz:['today'] },
];

/* Jeton disi ham renk: ekran dosyalarinda ve K'nin kart dosyalarinda.
   Jetonlarin kendisi (jeton.css, tokens.css, palettes.css) sayilmaz. */
function hamRenk(ad){
  /* Renk sayilan: 6/8 haneli hex, ya da icinde rakam olan / #fff gibi 3
     haneli hex. `#add`, `#bad` gibi harfli kimlik secicileri renk
     sayilmaz; yorumlar sayilmaz. */
  const RENK = /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
  const renkMi = h => h.length !== 3 || /[0-9]/.test(h) || /^(fff|FFF)$/.test(h);
  const say = t => {
    const temiz = t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');
    let n = 0, m;
    RENK.lastIndex = 0;
    while((m = RENK.exec(temiz))) if(renkMi(m[1])) n++;
    return n;
  };
  const out = {};
  const ekran = path.join(KOK, ad, 'src', 'js', 'screens');
  if(fs.existsSync(ekran)){
    fs.readdirSync(ekran).filter(f => /\.js$/.test(f)).forEach(f => {
      const n = say(fs.readFileSync(path.join(ekran, f), 'utf8'));
      if(n) out['screens/' + f] = n;
    });
  }
  ['kart.css', 'sayi.js', 'grafik.js', 'oneri.js', 'sozluk.js', 'guven.js'].forEach(f => {
    const p = path.join(KOK, 'brand', 'ortak', f);
    if(!fs.existsSync(p)) return;
    const n = say(fs.readFileSync(p, 'utf8'));
    if(n) out['brand/ortak/' + f] = n;
  });
  return out;
}

/* Teslim tablosunda ✅ olan moduller (T yazar). */
function teslimEdilenler(){
  const p = path.join(KOK, 'ekip', 'EKIP-DURUM.md');
  if(!fs.existsSync(p)) return [];
  const t = fs.readFileSync(p, 'utf8');
  const out = [];
  t.split('\n').forEach(satir => {
    const m = satir.match(/^\|\s*(AYS|SPİ|SPI|ESP)\s*\|\s*✅/);
    if(m) out.push(m[1] === 'SPİ' ? 'SPI' : m[1]);
  });
  return out;
}

function degerlendir(ad, olcu, taban){
  const ihlal = [];
  Object.keys(olcu).forEach(rota => {
    const o = olcu[rota];
    KURAL.forEach(k => {
      if(k.yalniz && k.yalniz.indexOf(rota) < 0) return;
      if(k.haric && k.haric.indexOf(rota) >= 0) return;
      const v = o[k.olcu];
      if(v == null || v <= k.en) return;
      const t = taban && taban[rota] ? taban[rota][k.olcu] : null;
      ihlal.push({ rota, kural:k.yazi, deger:v, en:k.en, taban:t });
    });
  });
  return ihlal;
}

async function main(){
  const argv = process.argv.slice(2);
  const di = argv.indexOf('--denetle');
  const zorunlu = new Set(di >= 0 ? argv.slice(di + 1).filter(a => ENV.MODUL[a]) : teslimEdilenler());
  const gi = argv.indexOf('--gezinti');
  const secilen = argv.filter((a, i) => ENV.MODUL[a] && !(di >= 0 && i > di));
  const moduller = secilen.length ? secilen : Object.keys(ENV.MODUL);

  let gezinti;
  if(gi >= 0){
    gezinti = JSON.parse(fs.readFileSync(argv[gi + 1], 'utf8')).moduller;
  }else{
    console.log('Sadelik — gezinti (' + moduller.join(', ') + ')');
    gezinti = await ENV.gez(moduller);
  }

  const tabanYol = ENV.sonTaban();
  const taban = tabanYol ? JSON.parse(fs.readFileSync(tabanYol, 'utf8')).moduller : {};

  let kirmizi = 0;
  console.log('');
  moduller.forEach(ad => {
    if(!gezinti[ad]){ console.log(ad + ': gezintide yok'); return; }
    const olcu = ((gezinti[ad].olcu || {}).dolu || {})['1440'] || {};
    const tb = taban[ad] ? ((taban[ad].olcu || {}).dolu || {})['1440'] : null;
    const ihlal = degerlendir(ad, olcu, tb);
    const renk = hamRenk(ad);
    const renkToplam = Object.values(renk).reduce((a, b) => a + b, 0);
    const denetlenir = zorunlu.has(ad);
    const n = ihlal.length + (renkToplam ? 1 : 0);
    if(denetlenir && n) kirmizi += n;
    console.log(ad + (denetlenir ? ' (DENETLENİR — teslim edildi)' : ' (yalnız ölçüm)') + ': '
      + (n ? n + ' bütçe aşımı' : 'bütçede') + ' · ' + Object.keys(olcu).length + ' ekran');
    ihlal.forEach(x => console.log('   ' + (denetlenir ? '✕' : '·') + ' ' + x.rota + ' · ' + x.kural
      + ' ' + x.deger + ' (en çok ' + x.en + (x.taban != null ? ', taban ' + x.taban : '') + ')'));
    if(renkToplam){
      console.log('   ' + (denetlenir ? '✕' : '·') + ' jeton dışı ham renk ' + renkToplam + ': '
        + Object.keys(renk).map(f => f + ' ' + renk[f]).join(', '));
    }
  });

  if(kirmizi){
    console.log('\n' + kirmizi + ' aşım teslim edilmiş modülde. Eşik ancak gerekçesi '
      + 'EKIP-DURUM\'a yazılıp kullanıcı onay verince değişir (plan §1.2).');
    return 1;
  }
  console.log('\nTeslim edilen modüller bütçede'
    + (zorunlu.size ? ' (' + Array.from(zorunlu).join(', ') + ').' : ' (henüz teslim yok; yalnız ölçüm).'));
  return 0;
}

main().then(k => process.exit(k)).catch(e => {
  console.error('Koşum hatası:', e && e.stack || e);
  process.exit(2);
});
