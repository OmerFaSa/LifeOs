#!/usr/bin/env node
/* TIKLAMA TARAMASI — ekrandaki her eylem dugmesine bir kez basilir.
 *
 * ------------------------------------------------------------------
 * NEDEN BU ARAC VAR
 *
 * Uc arayuzde 600'den fazla ekran isleyicisi var (`Screens.<ekran>.handle`)
 * ve birim testleri bunlarin cok azini cagiriyor: kapsam olcumunde en
 * dusuk dosyalar ekran dosyalari (%6–8). Duman testi ekranlari ve
 * sekmeleri gezer ama dugmelere BASMAZ. Yani «bu dugmeye basinca bir
 * sey patliyor mu» sorusunu bugun hicbir denetim sormuyor.
 *
 * Tek tasarima gecis (ekip/EKIP-PLANI.md, T3) tam bu dosyalari yeniden
 * yaziyor: sekmeler karta doner, bolumler tasinir. Bir isleyici
 * `el.closest('.blok')` gibi bir yapiya bagliysa ve yapi degisirse,
 * dugme cizilir ama basinca hata verir. Bu arac o sinifi yakalar:
 *
 *   Her arayuz dolu (bellekte kurulan) profille acilir. Her ekranin ve
 *   her ekran ici sekmenin gorunen `data-act` dugmeleri toplanir. Her
 *   dugme icin sayfa TEMIZ yeniden acilir (depo bosaltilir), ekran ve
 *   sekme acilir, dugmeye basilir. Sonra bakilir:
 *     · sayfa hatasi (yakalanmamis istisna, reddedilmis soz) var mi
 *     · «ters gitti / çizilemedi» hata paneli cikti mi
 *     · ekranda ya da acilan pencerede undefined / NaN / [object Object]
 *   Basinca bir pencere (sheet) aciliyorsa, pencerenin kendi dugmeleri
 *   bir kat daha basilir (yine her biri temiz sayfada).
 *
 * Onay pencereleri uygulamanin kendi pencereleridir; tarayici
 * `confirm()` cikarsa REDDEDILIR. Silme gibi eylemler bu yuzden
 * onay penceresinde durur, bir sey silinmez.
 *
 * ------------------------------------------------------------------
 * NE BASILMAZ
 *
 *   hard-reload           sayfayi yeniden yukler, tarama kendini keser
 *   ses / mikrofon        izin ister; basliksiz tarayicida anlami yok
 *
 * ------------------------------------------------------------------
 *   node tools/tiklama.js                 # uc arayuz
 *   node tools/tiklama.js AYS             # tek arayuz
 *   node tools/tiklama.js AYS --ekran today   # tek ekran
 *   node tools/tiklama.js --sig           # pencere ikinci katini atla (hizli)
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/tiklama.js
 *
 * Cikis kodu: 0 temiz, 1 en az bir dugme hata verdi, 2 kosum hatasi.
 */
'use strict';

const { spawn } = require('child_process');
const path = require('path');

const KOK = path.resolve(__dirname, '..');
const ENV = require('./envanter.js');

const PORT = { AYS:4394, SPI:4395, ESP:4396 };
const ATLA = /^(hard-reload|dictate|note-voice|voice|mic|.*-voice|.*-mic|record|.*-record)$/;
const SIZINTI = [/\bundefined\b/, /\bNaN\b/, /\[object Object\]/];
const PANEL = /çizilemedi|başlatılamadı|ters gitti/;
const SEKME = '.subtabs [data-act], .subtabs .subtab, .segmented [data-act], [role="tab"]';

let chromium;
try{
  ({ chromium } = require(path.join(KOK, 'ESP', 'node_modules', 'playwright')));
}catch(e){
  try{ ({ chromium } = require('playwright')); }
  catch(e2){ console.error('Playwright bulunamadi. Kurulum: ESP icinde  npm ci'); process.exit(2); }
}

const bekle = ms => new Promise(r => setTimeout(r, ms));

function sunucuBekle(url){
  return new Promise((coz, red) => {
    const dene = n => fetch(url).then(() => coz()).catch(() => {
      if(n <= 0) return red(new Error('sunucu acilmadi: ' + url));
      setTimeout(() => dene(n - 1), 200);
    });
    dene(60);
  });
}

/* Bir dugmenin IMZASI: eylem + kayit kimligi olmayan data-* nitelikleri.
   `data-id="e3"` gibi kayda bagli degerler imzaya girmez (her profilde
   baska); `data-tab`, `data-route`, `data-value` gibi secenekler girer. */
function imzalar(kokSecici){
  const kok = document.querySelector(kokSecici);
  if(!kok) return [];
  const gorunur = el => el.checkVisibility ? el.checkVisibility() : !!(el.offsetWidth || el.offsetHeight);
  const KAYIT = /^(id|i|idx|index|key|date|block|t|n|at|ref|card|exam|note|seg|item|meal|lab|med|w|s|row)$/i;
  const out = [];
  const gorulen = new Set();
  kok.querySelectorAll('[data-act]').forEach(el => {
    if(!gorunur(el) || el.disabled) return;
    const nit = [];
    Object.keys(el.dataset).sort().forEach(k => {
      if(k === 'act') return;
      if(KAYIT.test(k)) return;
      const v = el.dataset[k];
      if(v.length > 40) return;
      nit.push('[data-' + k.replace(/[A-Z]/g, m => '-' + m.toLowerCase()) + '="' + v.replace(/"/g, '\\"') + '"]');
    });
    const sec = '[data-act="' + el.dataset.act + '"]' + nit.join('');
    if(gorulen.has(sec)) return;
    gorulen.add(sec);
    out.push({ act:el.dataset.act, sec, etiket:((el.getAttribute('aria-label') || el.textContent || '')
      .trim().replace(/\s+/g, ' ').slice(0, 40)) });
  });
  return out;
}

/* Her basis TEMIZ bir tarayici baglaminda: bos depo, bos oturum. Ayni
   baglamda depoyu silip yeniden yuklemek iki kat surerdi. Sayfa
   kapaninca baglami da kapanir. */
async function sayfaAc(tarayici, ad, base, rota, sekme){
  const { ns } = ENV.MODUL[ad];
  const ctx = await tarayici.newContext({ reducedMotion:'reduce', viewport:{ width:1440, height:900 } });
  const sayfa = await ctx.newPage();
  sayfa.on('close', () => { ctx.close().catch(() => {}); });
  const hatalar = [];
  sayfa.on('pageerror', e => hatalar.push('sayfa hatası: ' + String(e && e.message || e).slice(0, 160)));
  sayfa.on('dialog', d => d.dismiss().catch(() => {}));
  sayfa.on('filechooser', () => {});
  await sayfa.goto(base + '/index.html', { waitUntil:'load' });
  await sayfa.waitForSelector('.site', { timeout:15000 });
  await bekle(350);
  const gec = await sayfa.$('[data-act="setup-skip"]');
  if(gec){ await gec.click().catch(() => {}); await bekle(200); }
  await sayfa.evaluate(ENV.DOLDUR_KAYNAK[ad]);
  await sayfa.evaluate(a => { window[a.ns].App.go(a.rota); }, { ns, rota });
  await bekle(250);
  if(sekme){
    await sayfa.evaluate(a => {
      const el = Array.from(document.querySelectorAll(a.SEKME)).find(e =>
        [e.getAttribute('data-act') || '', e.getAttribute('data-tab') || '',
          (e.textContent || '').trim().slice(0, 30)].join('|') === a.sekme);
      if(el) el.click();
    }, { SEKME, sekme });
    await bekle(250);
  }
  return { sayfa, hatalar };
}

async function durum(sayfa, hatalar){
  const out = hatalar.slice();
  const r = await sayfa.evaluate(a => {
    const panel = Array.from(document.querySelectorAll('.notice--danger'))
      .map(e => e.textContent || '').find(t => new RegExp(a.PANEL).test(t));
    const metin = ((document.querySelector('#main') || {}).innerText || '')
      + '\n' + ((document.querySelector('#sheet') || {}).innerText || '');
    return { panel:panel ? panel.trim().slice(0, 120) : null, metin };
  }, { PANEL:PANEL.source });
  if(r.panel) out.push('hata paneli: ' + r.panel);
  SIZINTI.forEach(re => {
    if(re.test(r.metin)){
      const m = r.metin.match(new RegExp('.{0,40}' + re.source + '.{0,40}'));
      out.push('sızıntı: ' + (m ? m[0].trim() : re.source));
    }
  });
  return out;
}

async function sekmeler(sayfa){
  return sayfa.$$eval(SEKME, els => els.map(e => [e.getAttribute('data-act') || '',
    e.getAttribute('data-tab') || '', (e.textContent || '').trim().slice(0, 30)].join('|')));
}

async function tara(tarayici, ad, secilenEkran, ikinciKat){
  const base = 'http://127.0.0.1:' + PORT[ad];
  const kok = path.join(KOK, ad);
  const sunucu = spawn('python3', [path.join(kok, 'devserver.py'), String(PORT[ad])],
    { cwd:kok, stdio:'ignore' });
  const bulgular = [];
  let basilan = 0;
  try{
    await sunucuBekle(base + '/index.html');
    /* Rotalar ve her rotanin sekmeleri. */
    const { sayfa:s0 } = await sayfaAc(tarayici, ad, base, 'today', null);
    const rotalar = (await s0.evaluate(ENV.rotalariBul, ENV.MODUL[ad].ns))
      .filter(r => !secilenEkran || r === secilenEkran);
    await s0.close();

    const gorulen = new Set();
    for(const rota of rotalar){
      if(process.env.TIKLAMA_AYRINTI) process.stderr.write('    ' + ad + ' · ' + rota + ' (' + basilan + ')\n');
      const { sayfa:s1 } = await sayfaAc(tarayici, ad, base, rota, null);
      const sekmeListesi = [null].concat(await sekmeler(s1));
      await s1.close();
      for(const sekme of sekmeListesi){
        const { sayfa:s2 } = await sayfaAc(tarayici, ad, base, rota, sekme);
        const hedefler = (await s2.evaluate(imzalar, '#main'))
          .filter(h => !ATLA.test(h.act) && !gorulen.has(h.sec));
        await s2.close();
        for(const h of hedefler){
          gorulen.add(h.sec);
          const { sayfa, hatalar } = await sayfaAc(tarayici, ad, base, rota, sekme);
          try{
            const el = await sayfa.$('#main ' + h.sec);
            if(!el) continue;
            const once = new Set((await sayfa.evaluate(imzalar, '#main')).map(x => x.sec)
              .concat((await sayfa.evaluate(imzalar, '#sheet')).map(x => '#sheet ' + x.sec)));
            await el.click({ timeout:3000 }).catch(() => el.evaluate(e => e.click()));
            await bekle(350);
            basilan++;
            const d = await durum(sayfa, hatalar);
            const yer = ad + ' · ' + rota + (sekme ? '/' + sekme.split('|')[2] : '');
            if(d.length){
              bulgular.push({ yer, act:h.act, etiket:h.etiket, sec:h.sec, sorun:d });
            }else if(ikinciKat){
              /* Basis yeni dugmeler getirdiyse (acilan pencere, satir ici
                 form, acilan bolum) onlar da bir kat daha basilir. */
              const pencere = (await sayfa.evaluate(imzalar, '#sheet'))
                .map(p => Object.assign(p, { kok:'#sheet' }))
                .concat((await sayfa.evaluate(imzalar, '#main'))
                  .map(p => Object.assign(p, { kok:'#main' })))
                .filter(p => !ATLA.test(p.act))
                .filter(p => !once.has(p.kok === '#sheet' ? '#sheet ' + p.sec : p.sec));
              for(const p of pencere){
                /* Ikinci kat dugmesi de BIR KEZ basilir: ayni «Kaydet»
                   on ayri dugmenin actigi formda durabilir; her birinde
                   yeniden basmak taramayi saatlere cikariyordu. */
                const anahtar = p.kok + ' ' + p.sec;
                if(gorulen.has(anahtar)) continue;
                gorulen.add(anahtar);
                const y = await sayfaAc(tarayici, ad, base, rota, sekme);
                try{
                  const e1 = await y.sayfa.$('#main ' + h.sec);
                  if(!e1) continue;
                  await e1.click({ timeout:3000 }).catch(() => e1.evaluate(e => e.click()));
                  await bekle(300);
                  const e2 = await y.sayfa.$(p.kok + ' ' + p.sec);
                  if(!e2) continue;
                  await e2.click({ timeout:3000 }).catch(() => e2.evaluate(e => e.click()));
                  await bekle(350);
                  basilan++;
                  const d2 = await durum(y.sayfa, y.hatalar);
                  if(d2.length){
                    bulgular.push({ yer, act:h.act + ' › ' + p.act,
                      etiket:h.etiket + ' › ' + p.etiket, sec:h.sec + ' > ' + anahtar, sorun:d2 });
                  }
                }finally{ await y.sayfa.close(); }
              }
            }
          }finally{
            await sayfa.close();
          }
        }
      }
    }
  }finally{
    sunucu.kill();
  }
  return { basilan, bulgular };
}

async function main(){
  const argv = process.argv.slice(2);
  const secilen = argv.filter(a => ENV.MODUL[a]);
  const moduller = secilen.length ? secilen : Object.keys(ENV.MODUL);
  const ei = argv.indexOf('--ekran');
  const ekran = ei >= 0 ? argv[ei + 1] : null;
  const ikinciKat = !argv.includes('--sig');

  const tarayici = await chromium.launch(process.env.CHROMIUM_PATH
    ? { executablePath:process.env.CHROMIUM_PATH } : {});
  let toplam = 0;
  try{
    for(const ad of moduller){
      const t0 = Date.now();
      process.stdout.write('  ' + ad + ' taranıyor… ');
      const { basilan, bulgular } = await tara(tarayici, ad, ekran, ikinciKat);
      console.log(basilan + ' düğmeye basıldı, ' + bulgular.length + ' sorun ('
        + Math.round((Date.now() - t0) / 1000) + ' sn)');
      bulgular.forEach(b => {
        console.log('    ✕ ' + b.yer + ' · ' + b.act + ' («' + b.etiket + '»)');
        b.sorun.forEach(s => console.log('        ' + s));
      });
      toplam += bulgular.length;
    }
  }finally{
    await tarayici.close();
  }
  console.log(toplam ? '\n' + toplam + ' düğme sorunlu.' : '\nTıklama taraması temiz.');
  return toplam ? 1 : 0;
}

main().then(k => process.exit(k)).catch(e => {
  console.error('Koşum hatası:', e && e.stack || e);
  process.exit(2);
});
