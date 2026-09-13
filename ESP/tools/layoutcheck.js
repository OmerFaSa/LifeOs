#!/usr/bin/env node
/* Telefon düzeni denetimi — 390 pikselde yatay taşma ve küçük dokunma hedefi.
 *
 * Veri girişinin çoğu telefonda yapılıyor. Yatay kaydırma telefonda bir
 * hata değil bir ENGELDİR: sayfa sağa kayınca sol kenardaki künye sütunu
 * ekrandan çıkar ve kullanıcı ne okuduğunu kaybeder. Masaüstünde hiç
 * görünmez — bu yüzden ayrı bir denetim.
 *
 * İki şey ölçülür:
 *
 *   TAŞMA          belgenin kaydırma genişliği pencereden büyük mü?
 *                  Hangi öğenin taştığı da yazılır; "bir yerde taşma var"
 *                  demek, olmayan bir hatayı aramaya göndermektir.
 *   DOKUNMA HEDEFI 24 pikselden küçük tıklanabilir öğe. (WCAG 2.2 AA asgari
 *                  24×24; 44 önerilir ama bu depodaki yoğun defter düzeninde
 *                  gerçekçi taban 24'tür ve öyle ölçülür.)
 *
 *   node tools/layoutcheck.js [port]
 */

const { spawn } = require('child_process');
const path = require('path');

const PORT = Number(process.argv[2]) || 4186;
const ROOT = path.resolve(__dirname, '..');
const WIDTH = 390, HEIGHT = 780;
const MIN_TAP = 24;

/* Bilerek kucuk birakilan hedefler: ipucu dugmesi bir metnin icinde durur
   ve buyutmek satiri bozar. Liste KISA kalmali; uzadigi an denetim isini
   yapmiyor demektir. */
const TAP_ALLOW = ['.hint'];

let chromium;
try{ ({ chromium } = require('playwright')); }
catch(e){ console.error('Playwright kurulu değil: npm i -D playwright'); process.exit(0); }

function waitForServer(url, tries){
  return new Promise((resolve, reject) => {
    let n = tries || 40;
    const dene = () => {
      fetch(url).then(() => resolve()).catch(() => {
        if(n-- <= 0) return reject(new Error('sunucu açılmadı: ' + url));
        setTimeout(dene, 250);
      });
    };
    dene();
  });
}

(async () => {
  const server = spawn('python3', [path.join(ROOT, 'devserver.py'), String(PORT)],
    { cwd:ROOT, stdio:'ignore' });
  let browser;
  const errors = [];
  try{
    await waitForServer('http://127.0.0.1:' + PORT + '/index.html');
    browser = await chromium.launch(process.env.CHROMIUM_PATH
      ? { executablePath:process.env.CHROMIUM_PATH } : {});
    const page = await browser.newPage({ viewport:{ width:WIDTH, height:HEIGHT } });
    await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil:'load' });
    await page.waitForSelector('.site', { timeout:15000 });
    /* Sihirbaz gecikmeyle aciliyor ve acikken bütün tiklamalari yutuyor:
       once beklenir, sonra kapatilir. */
    await page.waitForTimeout(600);
    for(let i = 0; i < 3; i++){
      const skip = await page.$('[data-act="setup-skip"]');
      if(!skip) break;
      await skip.click({ force:true }).catch(() => {});
      await page.waitForTimeout(300);
    }

    /* Bos ekran tasmaz; tasma VERIYLE gelir. */
    await page.evaluate(() => {
      const M = ESP.Model, U = ESP.U;
      for(let i = 0; i < 40; i++){
        ESP.S.cards.push(M.newCard({ front:'çok uzun bir kelime öbeği ' + i,
          back:'bunun da epeyce uzun bir karşılığı var ' + i, lang:'en' }));
      }
      for(let i = 0; i < 12; i++){
        ESP.S.notes.push(M.newNote({ text:'Uzun bir atomik not cümlesi, '
          + 'kırılmadan yazıldığında satırı taşırabilir ' + i, concepts:['zaman'] }));
        ESP.S.events.push(M.newEvent({ title:'Uzun başlıklı bir tarih olayı ' + i,
          year:1000 + i * 50, why:'Neden dönüm noktası olduğunu anlatan cümle.' }));
        ESP.S.pieces.push(M.newPiece({ name:'Uzun parça adı ' + i, cleanBpm:90 + i }));
        ESP.S.drafts.push(M.newDraft({ title:'Taslak ' + i,
          text:'Bir cümle. '.repeat(30), revisions:i % 3 }));
      }
      ESP.S.assets.push(M.newAsset({ disc:'lang', kind:'link',
        title:'Kırılmayan çok uzun bir bağlantı',
        url:'https://example.com/' + 'a'.repeat(120) }));
      ESP.S.reminders.push(M.newReminder({ disc:'lang',
        text:'Uzun bir hatırlatma metni, bölümden bölüme taşınabilir' }));
      const g = M.ensureDay(U.todayISO());
      g.sessions.push({ id:'s1', disc:'lang', minutes:45, minutesCert:'measured',
        count:null, countCert:'missing', quality:null, qualityCert:'missing',
        ref:null, note:'Uzunca bir oturum notu', at:new Date().toISOString() });
    });

    const routes = await page.evaluate(() =>
      ESP.Nav.sections().reduce((a, s) => a.concat(s.views.map(v => v.route)), []));

    const rows = [];
    for(const r of routes){
      await page.evaluate(id => ESP.App.go(id), r);
      await page.waitForTimeout(160);

      /* Sekmeleri de gez: tasma cogu zaman ikinci sekmede. */
      const tabs = await page.$$eval('.subtabs .subtab',
        els => els.map(e => e.getAttribute('data-tab')).filter(Boolean));
      const yerler = [null].concat(tabs);

      for(const t of yerler){
        if(t){
          const btn = await page.$('.subtabs .subtab[data-tab="' + t + '"]');
          if(!btn) continue;
          await btn.click();
          await page.waitForTimeout(120);
        }
        const sonuc = await page.evaluate(({ minTap, allow }) => {
          const doc = document.documentElement;
          const tasma = doc.scrollWidth - window.innerWidth;
          const sucluler = [];
          if(tasma > 1){
            document.querySelectorAll('#main *').forEach(el => {
              const r = el.getBoundingClientRect();
              if(r.width > window.innerWidth + 1 || r.right > window.innerWidth + 1){
                /* Kendi icinde kaydirilan kap (tablo sarmalayici) tasma
                   sayilmaz: orada yatay kaydirma KASITLIDIR. */
                let p = el, kasitli = false;
                while(p && p !== document.body){
                  const st = getComputedStyle(p);
                  if(st.overflowX === 'auto' || st.overflowX === 'scroll'){ kasitli = true; break; }
                  p = p.parentElement;
                }
                if(!kasitli){
                  const ad = el.tagName.toLowerCase()
                    + (el.className ? '.' + String(el.className).split(' ').filter(Boolean).slice(0, 2).join('.') : '');
                  if(sucluler.indexOf(ad) < 0) sucluler.push(ad);
                }
              }
            });
          }
          const kucuk = [];
          document.querySelectorAll('#main [data-act], #main button, #main a[href]')
            .forEach(el => {
              if(allow.some(sel => el.matches(sel))) return;
              /* Onay kutusu ETIKETIN icinde durur ve etikete dokunmak kutuyu
                 isaretler: kullanicinin dokundugu hedef kutu degil etikettir.
                 Olculmesi gereken de odur — kutunun kendi 18 pikselini
                 "kucuk hedef" saymak, olmayan bir hatayi raporlamak olurdu. */
              const etiket = el.closest('label');
              if(etiket && etiket.contains(el)) el = etiket;
              const r = el.getBoundingClientRect();
              if(r.width === 0 && r.height === 0) return;
              if(r.width < minTap || r.height < minTap){
                const ad = (el.getAttribute('data-act') || el.tagName.toLowerCase())
                  + ' ' + Math.round(r.width) + '×' + Math.round(r.height);
                if(kucuk.indexOf(ad) < 0) kucuk.push(ad);
              }
            });
          return { tasma, sucluler:sucluler.slice(0, 4), kucuk:kucuk.slice(0, 4) };
        }, { minTap:MIN_TAP, allow:TAP_ALLOW });

        const yer = r + (t ? '/' + t : '');
        rows.push({ yer, tasma:sonuc.tasma });
        if(sonuc.tasma > 1){
          errors.push(yer + ': yatay taşma ' + sonuc.tasma + 'px'
            + (sonuc.sucluler.length ? ' — ' + sonuc.sucluler.join(', ') : ''));
        }
        sonuc.kucuk.forEach(k => errors.push(yer + ': küçük dokunma hedefi — ' + k));
      }
    }

    console.log('\nTelefon düzeni — ' + WIDTH + '×' + HEIGHT + ', '
      + rows.length + ' yer gezildi, dokunma tabanı ' + MIN_TAP + 'px.');
    if(errors.length){
      console.log('\n' + errors.length + ' sorun:');
      errors.slice(0, 30).forEach(e => console.log('  ✕ ' + e));
      if(errors.length > 30) console.log('  … ve ' + (errors.length - 30) + ' tane daha');
      process.exitCode = 1;
    }else{
      console.log('\nTelefon düzeni temiz: taşma yok, bütün hedefler '
        + MIN_TAP + 'px ve üstü.');
    }
  }catch(err){
    console.error('Koşum hatası:', err.message);
    process.exitCode = 1;
  }finally{
    if(browser) await browser.close();
    server.kill();
  }
})();
