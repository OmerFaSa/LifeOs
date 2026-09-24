#!/usr/bin/env node
/* ENVANTER — tek tasarima gecerken HICBIR SEY kaybolmasin.
 *
 * ------------------------------------------------------------------
 * NEDEN BU ARAC VAR
 *
 * `ekip/EKIP-PLANI.md` bugunku uc arayuzu yeni iskelete tasiyor:
 * menuler sekiz cekmeceye iner, ekran ici sekmeler karta doner, ayni
 * sey iki yerde durmaz. Kullanicinin tek sarti var: «hicbir ozellik
 * kaybolmasin». Bu soz ancak OLCULURSE tutulur. Bir dugmenin tasinirken
 * dusmesi ne birim testine ne duman testine gorunur: ekran cizilir,
 * hata yoktur, yalniz bir is artik yapilamaz.
 *
 * Arac iki is yapar:
 *
 *   1. TABAN — bugunku uygulamanin kaydi. Uc arayuz acilir, her ekran
 *      ve her ekran ici sekme gezilir; ekrandaki her eylem (`data-act`),
 *      her giris alani, her ekranin isleyici adlari ve kaynakta yazili
 *      her eylem adi kaydedilir. Taban BIR KEZ uretilir ve kayit olarak
 *      durur (`ekip/envanter/taban-<tarih>.json`): uretilmis bir belge
 *      degil, bir andan alinmis olcumdur, yeniden uretilmez.
 *
 *   2. KARSILASTIRMA (varsayilan) — ayni gezinti bugunku kodla yapilir
 *      ve tabanla karsilastirilir. Tabandaki her eylem hala ya ekranda
 *      (herhangi bir ekranda, herhangi bir katmanda) ya da kaynaktaki
 *      bir sablonda (acilir pencere, alt cekmece) durmali; her isleyici
 *      hala bir ekranin isleyicisi olmali; her giris alani hala bir
 *      ekranda bulunmali. Bulunmayan ve `ekip/envanter/kaldirilan.json`
 *      icinde kullanici onayiyla yazilmamis her sey KAYIPTIR: cikis 1.
 *
 * Ayrica katalog kapsamini sayar: `ekip/TASARIM-OZELLIKLERI.md`
 * 183 ozellik tanimliyor; ekrandaki `data-oz="042"` isaretleri ve
 * testlerdeki `oz-042` adlari «183'ten N'i yerinde» sayisini verir.
 *
 * ------------------------------------------------------------------
 * IKI PROFIL, IKI GENISLIK
 *
 * Bos profilde liste satirlarinin eylemleri (sil, duzenle, ac) hic
 * cizilmez; yalniz bos bir profille alinan taban onlari hic bilmezdi.
 * Bu yuzden her arayuz iki kez gezilir: kurulumu gecilmis BOS profil
 * ve bellekte kurulan kucuk bir DOLU profil (birkac hafta kayit,
 * birkac deneme, kart, ogun). Dolu profil depoya yazilmaz.
 *
 * Her gezinti 1440 ve 390 piksel genislikte yapilir: telefon alt
 * bandindaki eylemler de envantere girer.
 *
 * Ekran olculeri (kelime, gorunen dugme, sekme, uzun paragraf, sayfa
 * boyu…) de ayni gezintide toplanir ve tabana yazilir; `sadelik.js`
 * bunlari kullanir. Tek gezgin, iki denetim.
 *
 * ------------------------------------------------------------------
 * NASIL KULLANILIR
 *
 *   node tools/envanter.js                 # karsilastir (uc arayuz)
 *   node tools/envanter.js AYS             # tek arayuz
 *   node tools/envanter.js --ayrinti       # kayiplarin yaninda katman degisimi
 *   node tools/envanter.js --taban         # TABANI yaz (bir kez; varsa reddeder)
 *   node tools/envanter.js --json <dosya>  # gezinti sonucunu dosyaya yaz
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/envanter.js
 *
 * Cikis kodu: 0 kayip yok, 1 kayip var, 2 kosum hatasi.
 */
'use strict';

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const KOK = path.resolve(__dirname, '..');
const ENV_KLASOR = path.join(KOK, 'ekip', 'envanter');
const KALDIRILAN = path.join(ENV_KLASOR, 'kaldirilan.json');
const GENISLIK = [1440, 390];
const PROFIL = ['bos', 'dolu'];

/* Uc arayuzun ad alani ve portu. Portlar duman testlerininkiyle
   (417x-418x) cakismaz; ayni makinede yan yana kosabilirler. */
const MODUL = {
  AYS: { ns:'R',   port:4391 },
  SPI: { ns:'SP',  port:4392 },
  ESP: { ns:'ESP', port:4393 },
};

/* Ekran ici sekme. Uc arayuz uc ayri sinif kullaniyor; yeni iskelette
   sekme kalmayacak (plan §1.2) ama rol `tab` kalirsa o da sayilir. */
const SEKME = '.subtabs [data-act], .subtabs .subtab, .segmented [data-act], [role="tab"]';
const SEKME_GRUBU = '.subtabs, .segmented, [role="tablist"]';

let chromium;
try{
  ({ chromium } = require(path.join(KOK, 'ESP', 'node_modules', 'playwright')));
}catch(e){
  try{ ({ chromium } = require('playwright')); }
  catch(e2){
    console.error('Playwright bulunamadi. Kurulum: ESP icinde  npm ci');
    process.exit(2);
  }
}

const bekle = ms => new Promise(r => setTimeout(r, ms));

function sunucuBekle(url, kalan){
  return new Promise((coz, red) => {
    const dene = n => {
      fetch(url).then(() => coz()).catch(() => {
        if(n <= 0) return red(new Error('sunucu acilmadi: ' + url));
        setTimeout(() => dene(n - 1), 200);
      });
    };
    dene(kalan == null ? 60 : kalan);
  });
}

/* ------------------------------------------------------------------
   DOLU PROFIL — bellekte, depoya yazilmadan.

   Amac performans degil (onu perfcheck.js dokuz aylik veriyle yapar);
   amac her listenin EN AZ BIR satirinin cizilmesi, boylece satir
   eylemleri envantere girer. Sayilar bu yuzden kucuk. */
const DOLDUR = {
  AYS: () => {
    const U = R.U;
    for(let i = 0; i < 21; i++){
      const d = U.iso(U.addDays(U.today(), -i));
      R.S.days[d] = { date:d, dow:i % 7, ritual:null,
        paragraphTarget:18, paragraphActual:15 + (i % 5),
        freeQ:20, freeCorrect:15, problemTarget:18, problemActual:16,
        sleepHours:7 + (i % 3) * 0.5, checklist:{},
        blocks:[
          { id:'b0', slot:'Sabah', subject:'TYT Matematik', topic:'Türev',
            targetMin:70, targetQ:25, status:i ? 'done' : 'planned',
            actualMin:i ? 65 : null, actualQ:i ? 24 : null, correctQ:i ? 18 : null },
          { id:'b1', slot:'Akşam', subject:'TYT Türkçe', topic:'Paragraf',
            targetMin:70, targetQ:30, status:i ? 'done' : 'planned',
            actualMin:i ? 68 : null, actualQ:i ? 28 : null, correctQ:i ? 22 : null },
        ], note:'' };
    }
    for(let i = 0; i < 4; i++){
      R.S.exams.push({ id:'e' + i, date:U.iso(U.addDays(U.today(), -(i * 7))),
        type:'Tam TYT', family:'TYT', kind:'full', publisher:'345', duration:165,
        tests:[
          { name:'Türkçe', correct:28 + i, wrong:6, blank:6, minutes:null },
          { name:'Matematik', correct:18 + i, wrong:8, blank:14, minutes:null },
        ],
        protocol:{}, createdAt:new Date().toISOString(),
        analysisCompletedAt:i ? new Date().toISOString() : null });
    }
    for(let i = 0; i < 12; i++){
      R.S.cards.push({ id:'c' + i, front:'soru ' + i, back:'cevap ' + i,
        subjectId:'tyt-matematik', stage:1 + (i % 4),
        dueAt:U.iso(U.addDays(U.today(), (i % 6) - 3)),
        lastReviewedAt:U.iso(U.addDays(U.today(), -(i % 5))),
        history:[{ at:U.todayISO(), rating:'remembered', result:'remembered',
          stage:2, gapDays:3 }] });
    }
    for(let i = 0; i < 8; i++){
      R.S.errors.push({ id:'er' + i, examId:'e' + (i % 4),
        createdAt:new Date().toISOString(), tag:['K', 'İ', 'Y', 'S', 'D'][i % 5],
        subject:'TYT Matematik', topic:'Türev', note:'Kök neden ' + i,
        closedAt:i % 3 ? new Date().toISOString() : null });
    }
  },
  SPI: () => {
    const U = SP.U;
    for(let i = 0; i < 21; i++){
      const d = U.iso(U.addDays(U.today(), -i));
      SP.S.vitals[d] = { sleep:7 + (i % 3) * 0.5, hrv:55 + (i % 15),
        rhr:56 + (i % 8), soreness:2 + (i % 4), weight:78 - (i % 10) * 0.1 };
      SP.S.meals[d] = [
        { id:'m' + i + 'a', slot:'kahvalti',
          items:[{ foodId:'yumurta', grams:100 }, { foodId:'ekmek-tam-bugday', grams:60 }] },
        { id:'m' + i + 'b', slot:'ogle',
          items:[{ foodId:'mercimek-corbasi', grams:300 }, { foodId:'pilav', grams:150 }] },
      ];
      if(i % 2 === 0){
        SP.S.workouts.push({ id:'w' + i, date:d, name:'Seans ' + i,
          kind:i % 4 ? 'strength' : 'cardio', items:[], minutes:45,
          rpe:6 + (i % 3), note:'', createdAt:new Date().toISOString() });
      }
    }
    for(let i = 0; i < 3; i++){
      SP.S.labs.push({ id:'l' + i, date:U.iso(U.addDays(U.today(), -(i * 30))),
        lab:'Laboratuvar ' + i,
        values:{ hgb:{ v:14 + i * 0.2, cert:'measured' },
          ferritin:{ v:50 + i * 2, cert:'measured' },
          glucose:{ v:88 + i, cert:'measured' } } });
    }
    SP.S.meds.push({ id:'med0', kindId:'diger', name:'Kayıt', dose:'1x1',
      startDate:U.iso(U.addDays(U.today(), -20)), endDate:null, note:'',
      createdAt:new Date().toISOString() });
  },
  ESP: () => {
    const M = ESP.Model, U = ESP.U;
    for(let i = 0; i < 24; i++){
      ESP.S.cards.push(M.newCard({ front:'kelime' + i, back:'karşılık' + i,
        lang:i % 9 === 0 ? ESP.HISTORY_DECK : 'en', box:1 + (i % 5), reps:i % 7,
        interval:1 + (i % 10), due:U.iso(U.addDays(U.today(), (i % 8) - 4)),
        history:[{ at:new Date().toISOString(), grade:'good', box:2, interval:3 }] }));
    }
    for(let i = 0; i < 6; i++){
      ESP.S.notes.push(M.newNote({ text:'not ' + i, concepts:[['zaman', 'adalet'][i % 2]],
        bookId:'b' + (i % 3) }));
      ESP.S.books.push(M.newBook({ title:'kitap' + i, author:'yazar' + i }));
      ESP.S.events.push(M.newEvent({ title:'olay' + i, year:-500 + i * 300 }));
      ESP.S.drafts.push(M.newDraft({ title:'taslak' + i,
        text:'Bu bir deneme cümlesidir. '.repeat(20), revisions:i % 3 }));
      ESP.S.pieces.push(M.newPiece({ name:'parça' + i, cleanBpm:80 + i, targetBpm:140,
        attempts:[{ date:U.iso(U.addDays(U.today(), -i)), bpm:80 + i, clean:true }] }));
    }
    for(let i = 0; i < 14; i++){
      const g = M.ensureDay(U.iso(U.addDays(U.today(), -i)));
      g.sessions.push({ id:'s' + i,
        disc:['lang', 'music', 'reading', 'writing', 'history'][i % 5],
        minutes:30, minutesCert:'measured', count:null, countCert:'missing',
        quality:null, qualityCert:'missing', ref:null, note:'', at:new Date().toISOString() });
    }
  },
};

/* ------------------------------------------------------------------
   SAYFA ICINDE KOSAN PARCALAR */

/* Rotalar: once arayuzun kendi menu listesi, sonra menudeki
   `data-act="go"` dugmeleri. Yeni iskelet menu nesnesinin adini
   degistirse de dugmeler kalir; ikisinin birlesimi gezilir. */
function rotalariBul(ns){
  const N = window[ns] || {};
  const r = [];
  const ekle = x => { if(x && r.indexOf(x) < 0) r.push(x); };
  try{ (N.App.NAV || []).forEach(s => (s.items || []).forEach(i => ekle(i.id))); }catch(e){}
  try{ (N.App.SECTIONS || []).forEach(s => (s.views || []).forEach(v => ekle(v.route))); }catch(e){}
  try{ (N.Nav.sections() || []).forEach(s => (s.views || []).forEach(v => ekle(v.route))); }catch(e){}
  document.querySelectorAll('[data-act="go"][data-route]').forEach(b => ekle(b.dataset.route));
  return r;
}

function ekranKaydi(ns){
  const N = window[ns] || {};
  const S = N.Screens || {};
  const kayit = {};
  Object.keys(S).sort().forEach(k => {
    const h = S[k] && S[k].handle;
    kayit[k] = h ? Object.keys(h).sort() : [];
  });
  return kayit;
}

/* O anki gorunumun envanteri ve olculeri. `#main` ekrandir; ondan
   disari kalan eylemler kabugun (ust cubuk, menu, alt bant) eylemleridir. */
function topla(arg){
  const SEKME = arg.SEKME, SEKME_GRUBU = arg.SEKME_GRUBU;
  const main = document.querySelector('#main') || document.body;
  const gorunur = el => {
    if(el.checkVisibility) return el.checkVisibility({ checkOpacity:false, checkVisibilityCSS:true });
    return !!(el.offsetWidth || el.offsetHeight);
  };
  const etiket = el => ((el.getAttribute('aria-label') || el.textContent || '')
    .trim().replace(/\s+/g, ' ').slice(0, 48));
  const kelimeSay = t => ((t || '').match(/[\p{L}\p{N}]+/gu) || []).length;

  const eylem = (kok, disla) => {
    const out = {};
    kok.querySelectorAll('[data-act]').forEach(el => {
      if(disla && disla.contains(el)) return;
      const a = el.dataset.act;
      const k = out[a] || (out[a] = { n:0, gorunur:false, etiket:'' });
      k.n++;
      if(gorunur(el)){
        k.gorunur = true;
        if(!k.etiket) k.etiket = etiket(el);
      }else if(!k.etiket){
        k.etiket = etiket(el);
      }
    });
    return out;
  };

  const alanlar = [];
  main.querySelectorAll('input, select, textarea').forEach(el => {
    const ad = el.id || el.name || el.dataset.key || el.dataset.field || el.dataset.change || '';
    if(ad && alanlar.indexOf(ad) < 0) alanlar.push(ad);
  });

  const oz = [];
  document.querySelectorAll('[data-oz]').forEach(el => {
    String(el.dataset.oz).split(/[\s,]+/).forEach(n => { if(n && oz.indexOf(n) < 0) oz.push(n); });
  });

  const metin = main.innerText || '';
  const gorunenler = sel => Array.from(main.querySelectorAll(sel)).filter(gorunur);
  /* UZUN PARAGRAF: 30 kelimeyi asan TEK PARCA yazi. Sinif adina
     bakilmaz (uc arayuz aciklamayi p, div.sub, small… ile yaziyor);
     bakilan sey, blok duzeninde duran ve icinde baska blok olmayan bir
     ogenin 30 kelimeyi gecmesidir. On kisa satirli bir kart sayilmaz,
     tek bir aciklama paragrafi sayilir. */
  const BLOK = /^(block|flex|grid|list-item|table|flow-root)$/;
  let uzun = 0;
  main.querySelectorAll('*').forEach(el => {
    if(kelimeSay(el.textContent) <= 30) return;
    if(!BLOK.test(getComputedStyle(el).display) || !gorunur(el)) return;
    const blokCocuk = Array.from(el.children).some(c => BLOK.test(getComputedStyle(c).display));
    if(!blokCocuk && kelimeSay(el.innerText) > 30) uzun++;
  });
  const halka = gorunenler('svg').filter(s =>
    s.querySelector('circle[stroke-dasharray], circle[style*="dasharray"]')).length;

  return {
    ekran: eylem(main, null),
    kabuk: eylem(document.body, main),
    alanlar,
    oz,
    baslik: ((document.querySelector('.hero__title') || {}).textContent || '').trim(),
    olcu: {
      kelime: kelimeSay(metin),
      dugme: gorunenler('button, [role="button"], a.btn').length,
      dolu: gorunenler('.btn--primary').length,
      sekme: gorunenler(SEKME).length,
      sekmeGrubu: gorunenler(SEKME_GRUBU).length,
      uzunParagraf: uzun,
      halka,
      simge: (metin.match(/\p{Extended_Pictographic}/gu) || []).length,
      xp: (metin.match(/\bXP\b/g) || []).length,
      boy: document.documentElement.scrollHeight,
    },
  };
}

/* ------------------------------------------------------------------
   GEZGIN */

async function kurulumuGec(sayfa){
  await bekle(600);
  const gec = await sayfa.$('[data-act="setup-skip"]');
  if(gec){ await gec.click().catch(() => {}); await bekle(250); }
}

async function kapat(sayfa){
  const acik = await sayfa.$('#sheet > *');
  if(!acik) return;
  await sayfa.keyboard.press('Escape');
  await bekle(120);
  if(await sayfa.$('#sheet > *')){
    await sayfa.evaluate(() => {
      const N = window.R || window.SP || window.ESP;
      try{ if(N && N.UI && N.UI.closeSheet) N.UI.closeSheet(); }catch(e){}
    });
    await bekle(100);
  }
}

function birlestir(hedef, kaynak, rota){
  Object.keys(kaynak).forEach(a => {
    const k = kaynak[a];
    const h = hedef[a] || (hedef[a] = { rotalar:[], gorunur:false, etiket:'' });
    if(rota && h.rotalar.indexOf(rota) < 0) h.rotalar.push(rota);
    if(k.gorunur) h.gorunur = true;
    if(!h.etiket && k.etiket) h.etiket = k.etiket;
  });
}

async function git(sayfa, ns, rota){
  return sayfa.evaluate(a => {
    const N = window[a.ns];
    try{ N.App.go(a.rota); return true; }catch(e){ return String(e && e.message || e); }
  }, { ns, rota });
}

async function gezinti(tarayici, ad, base, profil, genislik, sonuc){
  const { ns } = MODUL[ad];
  const sayfa = await tarayici.newPage({ reducedMotion:'reduce',
    viewport:{ width:genislik, height:genislik > 600 ? 900 : 844 } });
  const hatalar = [];
  sayfa.on('pageerror', e => hatalar.push(String(e && e.message || e)));
  try{
    await sayfa.goto(base + '/index.html', { waitUntil:'load' });
    await sayfa.waitForSelector('.site', { timeout:15000 });
    await kurulumuGec(sayfa);
    if(profil === 'dolu'){
      await sayfa.evaluate('(' + DOLDUR[ad].toString() + ')()');
    }

    const rotalar = await sayfa.evaluate(rotalariBul, ns);
    if(!sonuc.ekranKaydi) sonuc.ekranKaydi = await sayfa.evaluate(ekranKaydi, ns);
    const olculer = {};
    const arg = { SEKME, SEKME_GRUBU };

    for(const rota of rotalar){
      await kapat(sayfa);
      const g = await git(sayfa, ns, rota);
      await bekle(220);
      await kapat(sayfa);
      if(g !== true){ hatalar.push(rota + ': ' + g); continue; }

      const ilk = await sayfa.evaluate(topla, arg);
      olculer[rota] = ilk.olcu;
      birlestir(sonuc.eylemler, ilk.ekran, rota);
      birlestir(sonuc.eylemler, ilk.kabuk, '(kabuk)');
      const r = sonuc.rotalar[rota] || (sonuc.rotalar[rota] = { baslik:'', sekmeler:[], alanlar:[] });
      if(!r.baslik && ilk.baslik) r.baslik = ilk.baslik;
      ilk.alanlar.forEach(x => { if(r.alanlar.indexOf(x) < 0) r.alanlar.push(x); });
      ilk.oz.forEach(x => sonuc.oz.add(x));

      /* Sekmeler: ilk listedeki her sekme tiklanir; tiklama yeni bir
         sekme grubu acarsa (SPI Testler gibi) onlar da bir kat daha
         gezilir. Kimlik: eylem + data-tab + yazi. */
      const gorulen = new Set();
      const kuyruk = [];
      const tazele = async () => {
        const liste = await sayfa.$$eval(SEKME, els => els.map(e =>
          [e.getAttribute('data-act') || '', e.getAttribute('data-tab') || '',
            (e.textContent || '').trim().slice(0, 30)].join('|')));
        liste.forEach(k => { if(!gorulen.has(k)){ gorulen.add(k); kuyruk.push(k); } });
      };
      await tazele();
      let tur = 0;
      while(kuyruk.length && tur < 60){
        tur++;
        const k = kuyruk.shift();
        const tamam = await sayfa.evaluate(a => {
          const els = Array.from(document.querySelectorAll(a.SEKME));
          const el = els.find(e => [e.getAttribute('data-act') || '', e.getAttribute('data-tab') || '',
            (e.textContent || '').trim().slice(0, 30)].join('|') === a.k);
          if(!el) return false;
          el.click();
          return true;
        }, { SEKME, k });
        if(!tamam) continue;
        await bekle(200);
        await kapat(sayfa);
        const s = await sayfa.evaluate(topla, arg);
        birlestir(sonuc.eylemler, s.ekran, rota);
        s.alanlar.forEach(x => { if(r.alanlar.indexOf(x) < 0) r.alanlar.push(x); });
        s.oz.forEach(x => sonuc.oz.add(x));
        /* Sekme yazisinin sonundaki sayi bir rozettir («Giriş5»), ad degil. */
        const sekmeAdi = (k.split('|')[2] || k.split('|')[1]).replace(/\s*\d+$/, '');
        if(sekmeAdi && r.sekmeler.indexOf(sekmeAdi) < 0) r.sekmeler.push(sekmeAdi);
        await tazele();
      }
    }
    sonuc.olcu[profil] = sonuc.olcu[profil] || {};
    sonuc.olcu[profil][genislik] = olculer;
    if(hatalar.length) sonuc.hatalar.push(...hatalar.map(h => profil + '/' + genislik + ': ' + h));
  }finally{
    await sayfa.close();
  }
}

/* Kaynakta yazili eylem adlari: acilir pencere ve alt cekmece gibi
   yalniz tiklayinca cizilen yerlerdeki eylemler gezintide gorunmez;
   kaynaktaki sablon onlarin «hala var» kanitidir. */
function kaynakEylemleri(ad){
  const kok = path.join(KOK, ad, 'src', 'js');
  const out = new Set();
  const gez = d => fs.readdirSync(d, { withFileTypes:true }).forEach(e => {
    const p = path.join(d, e.name);
    if(e.isDirectory()) return gez(p);
    if(!/\.js$/.test(e.name)) return;
    const t = fs.readFileSync(p, 'utf8');
    const re = /data-act="([a-z0-9][a-z0-9_-]*)"|\bact\s*:\s*['"]([a-z0-9][a-z0-9_-]*)['"]/gi;
    let m;
    while((m = re.exec(t))) out.add(m[1] || m[2]);
  });
  gez(kok);
  return Array.from(out).sort();
}

async function modulGez(tarayici, ad){
  const { port } = MODUL[ad];
  const kok = path.join(KOK, ad);
  const sunucu = spawn('python3', [path.join(kok, 'devserver.py'), String(port)],
    { cwd:kok, stdio:'ignore' });
  const base = 'http://127.0.0.1:' + port;
  const sonuc = { rotalar:{}, eylemler:{}, ekranKaydi:null, olcu:{}, oz:new Set(), hatalar:[] };
  try{
    await sunucuBekle(base + '/index.html');
    for(const profil of PROFIL){
      for(const g of GENISLIK){
        await gezinti(tarayici, ad, base, profil, g, sonuc);
      }
    }
  }finally{
    sunucu.kill();
  }
  Object.keys(sonuc.eylemler).forEach(a => sonuc.eylemler[a].rotalar.sort());
  return {
    rotalar: sonuc.rotalar,
    eylemler: sortObj(sonuc.eylemler),
    ekranKaydi: sonuc.ekranKaydi || {},
    kaynakEylemleri: kaynakEylemleri(ad),
    olcu: sonuc.olcu,
    oz: Array.from(sonuc.oz).sort(),
    hatalar: sonuc.hatalar,
  };
}

function sortObj(o){
  const r = {};
  Object.keys(o).sort().forEach(k => { r[k] = o[k]; });
  return r;
}

/* Testlerdeki `oz-042` adlari: kendi yuzeyi olmayan (B katmani)
   ozellikler ekranda isaret tasimaz, testle sayilir. */
function testOzellikleri(){
  const out = new Set();
  const klasorler = [path.join(KOK, 'brand', 'ortak')]
    .concat(['AYS', 'SPI', 'ESP'].map(s => path.join(KOK, s, 'src', 'tests')));
  klasorler.forEach(d => {
    if(!fs.existsSync(d)) return;
    fs.readdirSync(d).filter(f => /\.js$/.test(f)).forEach(f => {
      const t = fs.readFileSync(path.join(d, f), 'utf8');
      const re = /\boz-(\d{2,3})\b/g;
      let m;
      while((m = re.exec(t))) out.add(String(Number(m[1])).padStart(3, '0'));
    });
  });
  return out;
}

function katalogSayisi(){
  const p = path.join(KOK, 'ekip', 'TASARIM-OZELLIKLERI.md');
  if(!fs.existsSync(p)) return 0;
  const t = fs.readFileSync(p, 'utf8');
  return (t.match(/^\| \d{2,3} \| \*\*/gm) || []).length;
}

/* ------------------------------------------------------------------
   KARSILASTIRMA */

function sonTaban(){
  if(!fs.existsSync(ENV_KLASOR)) return null;
  const f = fs.readdirSync(ENV_KLASOR).filter(x => /^taban-.*\.json$/.test(x)).sort();
  return f.length ? path.join(ENV_KLASOR, f[f.length - 1]) : null;
}

function izinliler(){
  if(!fs.existsSync(KALDIRILAN)) return {};
  try{ return JSON.parse(fs.readFileSync(KALDIRILAN, 'utf8')); }
  catch(e){ throw new Error('kaldirilan.json okunamadi: ' + e.message); }
}

function isleyiciKumesi(kayit){
  const s = new Set();
  Object.keys(kayit || {}).forEach(k => (kayit[k] || []).forEach(h => s.add(h)));
  return s;
}

function alanKumesi(rotalar){
  const s = new Set();
  Object.keys(rotalar || {}).forEach(r => (rotalar[r].alanlar || []).forEach(a => s.add(a)));
  return s;
}

function karsilastir(ad, taban, simdi, izin){
  const iz = (izin && izin[ad]) || {};
  const izinli = (tur, x) => !!(iz[tur] && Object.prototype.hasOwnProperty.call(iz[tur], x));

  const simdiEkran = new Set(Object.keys(simdi.eylemler));
  const simdiKaynak = new Set(simdi.kaynakEylemleri);
  const simdiIsleyici = isleyiciKumesi(simdi.ekranKaydi);
  const simdiAlan = alanKumesi(simdi.rotalar);

  const kayip = { eylem:[], isleyici:[], alan:[] };
  const gizlenen = [];

  Object.keys(taban.eylemler).forEach(a => {
    if(simdiEkran.has(a)){
      if(taban.eylemler[a].gorunur && !simdi.eylemler[a].gorunur) gizlenen.push(a);
      return;
    }
    if(simdiKaynak.has(a)) return;
    if(!izinli('eylem', a)) kayip.eylem.push(a + ' («' + taban.eylemler[a].etiket + '» · '
      + taban.eylemler[a].rotalar.slice(0, 3).join(', ') + ')');
  });
  isleyiciKumesi(taban.ekranKaydi).forEach(h => {
    if(simdiIsleyici.has(h) || simdiKaynak.has(h) || simdiEkran.has(h)) return;
    if(!izinli('isleyici', h)) kayip.isleyici.push(h);
  });
  alanKumesi(taban.rotalar).forEach(a => {
    if(simdiAlan.has(a)) return;
    if(!izinli('alan', a)) kayip.alan.push(a);
  });
  return { kayip, gizlenen };
}

/* ------------------------------------------------------------------
   ANA */

async function gez(moduller){
  const tarayici = await chromium.launch(process.env.CHROMIUM_PATH
    ? { executablePath:process.env.CHROMIUM_PATH } : {});
  const out = {};
  try{
    for(const ad of moduller){
      process.stdout.write('  ' + ad + ' geziliyor… ');
      const t0 = Date.now();
      out[ad] = await modulGez(tarayici, ad);
      const r = out[ad];
      console.log(Object.keys(r.rotalar).length + ' ekran, '
        + Object.keys(r.eylemler).length + ' eylem, '
        + isleyiciKumesi(r.ekranKaydi).size + ' işleyici, '
        + alanKumesi(r.rotalar).size + ' alan ('
        + Math.round((Date.now() - t0) / 1000) + ' sn)');
    }
  }finally{
    await tarayici.close();
  }
  return out;
}

function commitKimligi(){
  try{
    const sha = execSync('git rev-parse --short HEAD', { cwd:KOK }).toString().trim();
    const kirli = execSync('git status --porcelain -- AYS/src SPI/src ESP/src brand', { cwd:KOK })
      .toString().trim();
    return sha + (kirli ? '+' : '');
  }catch(e){ return 'bilinmiyor'; }
}

function bugun(){
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

async function main(){
  const argv = process.argv.slice(2);
  const secilen = argv.filter(a => MODUL[a]);
  const moduller = secilen.length ? secilen : Object.keys(MODUL);
  const tabanYaz = argv.includes('--taban');
  const ayrinti = argv.includes('--ayrinti');
  const ji = argv.indexOf('--json');
  const jsonYol = ji >= 0 ? argv[ji + 1] : null;

  if(tabanYaz){
    const var_ = sonTaban();
    if(var_ && !argv.includes('--zorla')){
      console.error('Taban zaten var: ' + path.relative(KOK, var_)
        + '\nTaban bir kez alinir; yenisi yalniz kullanici karariyla (--zorla).');
      return 2;
    }
    if(secilen.length){
      console.error('Taban uc arayuzle birlikte alinir; modul secilmez.');
      return 2;
    }
  }

  console.log('Envanter — ' + moduller.join(', '));
  const simdi = await gez(moduller);

  if(jsonYol){
    fs.writeFileSync(jsonYol, JSON.stringify({ commit:commitKimligi(), moduller:simdi }, null, 1));
    console.log('Gezinti yazildi: ' + jsonYol);
  }

  if(tabanYaz){
    fs.mkdirSync(ENV_KLASOR, { recursive:true });
    const yol = path.join(ENV_KLASOR, 'taban-' + bugun() + '.json');
    const kayit = {
      surum:1,
      tarih:bugun(),
      commit:commitKimligi(),
      aciklama:'Tek tasarima gecmeden onceki uygulamanin kaydi (ekip/EKIP-PLANI.md, H0). '
        + 'Bir kez alinir, elle degistirilmez. Karsilastirma: node tools/envanter.js',
      genislik:GENISLIK,
      profil:PROFIL,
      moduller:simdi,
    };
    fs.writeFileSync(yol, JSON.stringify(kayit, null, 1) + '\n');
    if(!fs.existsSync(KALDIRILAN)){
      fs.writeFileSync(KALDIRILAN, JSON.stringify({
        _oku:'Tabanda olup bilerek kaldirilan ya da adi degisen seyler. Her satir '
          + 'KULLANICI ONAYIYLA eklenir: anahtar eski ad, deger gerekce ya da yeni ad '
          + '(ör. "yeni ad: plan-open · kullanici onayi 2026-09-25"). Burada olmayan her kayip KIRMIZIDIR.',
        AYS:{ eylem:{}, isleyici:{}, alan:{} },
        SPI:{ eylem:{}, isleyici:{}, alan:{} },
        ESP:{ eylem:{}, isleyici:{}, alan:{} },
      }, null, 2) + '\n');
    }
    console.log('\nTaban yazildi: ' + path.relative(KOK, yol));
    moduller.forEach(ad => {
      const h = simdi[ad].hatalar;
      if(h.length) console.log('  ' + ad + ' gezinti uyarisi: ' + h.slice(0, 3).join(' · '));
    });
    return 0;
  }

  const tabanYol = sonTaban();
  if(!tabanYol){
    console.error('Taban yok. Once: node tools/envanter.js --taban');
    return 2;
  }
  const taban = JSON.parse(fs.readFileSync(tabanYol, 'utf8'));
  const izin = izinliler();
  console.log('\nTaban: ' + path.relative(KOK, tabanYol) + ' (' + taban.commit + ')');

  let toplamKayip = 0;
  moduller.forEach(ad => {
    if(!taban.moduller[ad]){ console.log('  ' + ad + ': tabanda yok'); return; }
    const { kayip, gizlenen } = karsilastir(ad, taban.moduller[ad], simdi[ad], izin);
    const n = kayip.eylem.length + kayip.isleyici.length + kayip.alan.length;
    toplamKayip += n;
    console.log('  ' + ad + ': ' + (n ? n + ' KAYIP' : 'kayıp yok')
      + ' · görünürden gizliye geçen eylem ' + gizlenen.length);
    kayip.eylem.forEach(x => console.log('    ✕ eylem ' + x));
    kayip.isleyici.forEach(x => console.log('    ✕ işleyici ' + x));
    kayip.alan.forEach(x => console.log('    ✕ alan ' + x));
    if(ayrinti && gizlenen.length) console.log('    gizlenen: ' + gizlenen.join(', '));
    if(simdi[ad].hatalar.length){
      console.log('    gezinti uyarısı: ' + simdi[ad].hatalar.slice(0, 5).join(' · '));
    }
  });

  const ekranOz = new Set();
  moduller.forEach(ad => simdi[ad].oz.forEach(x => ekranOz.add(String(Number(x)).padStart(3, '0'))));
  const testOz = testOzellikleri();
  const hepsi = new Set([...ekranOz, ...testOz]);
  console.log('\nKatalog kapsamı: ' + hepsi.size + ' / ' + katalogSayisi() + ' özellik yerinde'
    + ' (ekranda ' + ekranOz.size + ' · testte ' + testOz.size + ')');

  if(toplamKayip){
    console.log('\n' + toplamKayip + ' kayıp. Bilerek kaldırıldıysa kullanıcı onayıyla '
      + 'ekip/envanter/kaldirilan.json dosyasına yazılır.');
    return 1;
  }
  console.log('\nEnvanter temiz: tabandaki her eylem, işleyici ve alan yerinde.');
  return 0;
}

const DOLDUR_KAYNAK = {};
Object.keys(DOLDUR).forEach(ad => { DOLDUR_KAYNAK[ad] = '(' + DOLDUR[ad].toString() + ')()'; });

module.exports = { gez, karsilastir, rotalariBul, DOLDUR_KAYNAK, MODUL, GENISLIK, PROFIL,
  sonTaban, katalogSayisi };

if(require.main === module){
  main().then(k => process.exit(k)).catch(e => {
    console.error('Koşum hatası:', e && e.stack || e);
    process.exit(2);
  });
}
