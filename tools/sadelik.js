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
 *   node tools/sadelik.js --onay               # yalniz 022 kaynak kurali (tarayicisiz)
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
  /* Asagidaki iki kural once OLCUMDU (`olcum:true`: kirmizi yapmaz,
     sayar). K'nin istegiyle sifira inince zorunlu oldular (2026-09-25:
     uc modulde ikisi de 0). Yeni bir olcu once `olcum:true` ile gelir. */
  { ad:'mor',          olcu:'mor',          en:0, yazi:'Merkez dışında mor (110)' },
  { ad:'evetTamam',    olcu:'evetTamam',    en:0, yazi:'«Evet/Tamam» onay düğmesi (022)' },
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

/* VARSAYILAN ETIKETLI ONAY (katalog 022, statik). `confirmSheet(baslik,
   mesaj, fn, tehlikeli, onay)` besinci arguman verilmezse dugme «Evet,
   devam et» yazar. Gezinti pencereleri acmaz; bu yuzden cagrilar kaynakta
   sayilir: ust duzey virgulleri sayan kucuk bir tarayici (dize, sablon ve
   yorum atlanir). */
/* Bir kaynak metinde besinci argumani (etiketi) olmayan confirmSheet
   cagrilarinin satir numaralari. Tanimin kendisi sayilmaz. */
function onaySay(t){
  const out = [];
  const re = /confirmSheet\s*\(/g;
  let m;
  while((m = re.exec(t))){
    const once = t.slice(Math.max(0, m.index - 12), m.index);
    if(/function\s+$/.test(once)) continue;         // tanimin kendisi
    let i = re.lastIndex, derin = 0, virgul = 0, bos = true;
    for(; i < t.length; i++){
      const c = t[i];
      if(c === '"' || c === "'" || c === '`'){
        const q = c; i++;
        while(i < t.length && t[i] !== q){ if(t[i] === '\\') i++; i++; }
        bos = false; continue;
      }
      if(c === '/' && t[i + 1] === '*'){ i = t.indexOf('*/', i + 2) + 1; continue; }
      if(c === '/' && t[i + 1] === '/'){ i = t.indexOf('\n', i); continue; }
      if('([{'.indexOf(c) >= 0){ derin++; bos = false; continue; }
      if(')]}'.indexOf(c) >= 0){ if(derin === 0) break; derin--; continue; }
      if(c === ',' && derin === 0) virgul++;
      else if(!/\s/.test(c)) bos = false;
    }
    const arguman = bos ? 0 : virgul + 1;
    if(arguman < 5) out.push(t.slice(0, m.index).split('\n').length);
  }
  return out;
}

function varsayilanOnaylar(ad){
  const kok = path.join(KOK, ad, 'src', 'js');
  const out = [];
  const gez = d => fs.readdirSync(d, { withFileTypes:true }).forEach(e => {
    const p = path.join(d, e.name);
    if(e.isDirectory()) return gez(p);
    if(!/\.js$/.test(e.name)) return;
    onaySay(fs.readFileSync(p, 'utf8'))
      .forEach(satir => out.push(path.relative(path.join(KOK, ad), p) + ':' + satir));
  });
  gez(kok);
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
      ihlal.push({ rota, kural:k.yazi, deger:v, en:k.en, taban:t, olcum:!!k.olcum });
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
    let ihlal = degerlendir(ad, olcu, tb);
    const renk = hamRenk(ad);
    const renkToplam = Object.values(renk).reduce((a, b) => a + b, 0);
    const denetlenir = zorunlu.has(ad);
    const olcumler = ihlal.filter(x => x.olcum);
    ihlal = ihlal.filter(x => !x.olcum);
    const onay = varsayilanOnaylar(ad);
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
    /* Olcum (kirmizi yapmaz): `olcum:true` tasiyan kural varsa yazilir. */
    olcumler.forEach(x => console.log('   ölçüm · ' + x.rota + ' · ' + x.kural + ' ' + x.deger));
    /* 022 ZORUNLU (2026-09-25): 35 cagrinin hepsi sonucu soyleyen
       etiketi tasiyor; yeni bir varsayilan etiketli onay her modulde
       kirmizidir (teslim beklemez: kaynak kurali, ekran olcusu degil). */
    if(onay.length){
      kirmizi += onay.length;
      console.log('   ✕ varsayılan «Evet, devam et» onayı (katalog 022) ' + onay.length + ': ' + onay.join(', '));
    }
  });

  if(kirmizi){
    console.log('\n' + kirmizi + ' aşım (teslim edilmiş modülde ya da kaynak kuralında). Eşik ancak gerekçesi '
      + 'EKIP-DURUM\'a yazılıp kullanıcı onay verince değişir (plan §1.2).');
    return 1;
  }
  console.log('\nTeslim edilen modüller bütçede'
    + (zorunlu.size ? ' (' + Array.from(zorunlu).join(', ') + ').' : ' (henüz teslim yok; yalnız ölçüm).'));
  return 0;
}

/* `--onay`: yalniz kaynak kurali (tarayici acmaz; saniyenin altinda). */
function yalnizOnay(){
  let n = 0;
  Object.keys(ENV.MODUL).forEach(ad => {
    const onay = varsayilanOnaylar(ad);
    n += onay.length;
    console.log(ad + ': ' + (onay.length ? '✕ ' + onay.length + ' varsayılan etiketli onay: ' + onay.join(', ')
      : 'her onay sonucu söylüyor'));
  });
  return n ? 1 : 0;
}

module.exports = { onaySay };

if(require.main === module){
  (process.argv.indexOf('--onay') >= 0 ? Promise.resolve(yalnizOnay()) : main())
    .then(k => process.exit(k)).catch(e => {
      console.error('Koşum hatası:', e && e.stack || e);
      process.exit(2);
    });
}
