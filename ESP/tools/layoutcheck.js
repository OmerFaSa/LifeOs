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
/* İki genişlik: telefon (390) ve dikey tablet (820). Tablette ayrıca açık
   çekmecenin HER bölümüne görünür bir bağlantı aranır: o aralıkta kenar
   çubuğu bölümleri göstermez, sayfanın üstündeki bölüm çubuğu gösterir
   (brand/ortak/kabuk.css). Önce tablette Bugün › Ayrıntı gibi bölümlere
   kenardan ulaşılamıyordu ve hiçbir denetim tableti ölçmüyordu. */
const GENISLIKLER = [{ ad:'telefon', w:390, h:780 }, { ad:'tablet', w:820, h:1180 }];
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
    const rows = [];
    for(const G of GENISLIKLER){
      const page = await browser.newPage({ reducedMotion:'reduce', viewport:{ width:G.w, height:G.h } });
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
            /* PENCERE KENARINA YAPIŞIK: taşmıyor ama kenara 4 pikselden
               yakın biten öğe. Sayfanın 16 px'lik kenar boşluğu var; oraya
               giren bir düğme sığmıyor demektir ve başka bir tarayıcının
               yazı çizimiyle birkaç piksel genişleyince taşar. Nitekim SPİ
               Rehber › Veri'deki düğme satırı yerelde 387 px'te bitip
               geçiyor, CI'da 11 px taşıyordu (ekip/HATALAR.md T2-06).
               Yalnız yapraklar ve düğmeler sayılır; kasıtlı kaydırma kabı
               sayılmaz. */
            const yapisik = [];
            document.querySelectorAll('#main *').forEach(el => {
              const r = el.getBoundingClientRect();
              if(!r.width || r.right <= window.innerWidth - 4 || r.right > window.innerWidth + 1) return;
              if(el.firstElementChild && !/^(BUTTON|A|INPUT|SELECT|TEXTAREA|SPAN|P|H[1-6]|LABEL|IMG|SVG)$/i.test(el.tagName)) return;
              let p = el;
              while(p && p !== document.body){
                const st = getComputedStyle(p);
                if(st.overflowX === 'auto' || st.overflowX === 'scroll') return;
                p = p.parentElement;
              }
              const ad = el.tagName.toLowerCase()
                + (el.className ? '.' + String(el.className).split(' ').filter(Boolean).slice(0, 2).join('.') : '')
                + ' ' + Math.round(r.right) + 'px';
              if(yapisik.indexOf(ad) < 0) yapisik.push(ad);
            });
            /* KUTUDAN DİKEY TAŞMA: kenarlığı olan bir kutunun içeriği kutudan
               uzunsa ve kutu kırpmıyorsa (overflow: visible) taşan satır
               komşusunun ÜSTÜNE biner. Yatay taşmayı arayan denetim bunu
               görmez: Hafta'da telefonda «Tamamını göster» rafı ızgaraya tavan
               koyuyor, satırlar 120 px'e iniyor, «2/2 tamam» bir sonraki günün
               adıyla çakışıyordu. */
            const dikey = [];
            document.querySelectorAll('#main *').forEach(el => {
              if(!el.firstElementChild) return;          // kutu, yaprak değil
              const st = getComputedStyle(el);
              if(st.overflowY !== 'visible' || !(parseFloat(st.borderTopWidth) > 0 && parseFloat(st.borderBottomWidth) > 0)) return;
              const fark = el.scrollHeight - el.clientHeight;
              if(fark <= 2 || !el.clientHeight) return;
              const ad = el.tagName.toLowerCase()
                + (el.className ? '.' + String(el.className).split(' ').filter(Boolean).slice(0, 2).join('.') : '')
                + ' ' + fark + 'px';
              if(dikey.indexOf(ad) < 0) dikey.push(ad);
            });
            /* KARDEŞ KUTULAR ÜST ÜSTE: kutu kendi içeriğine sığsa da ızgara
               satırı ondan kısa kalırsa bir sonraki kutu onun üstüne çizilir.
               Kenarlıklı, aynı ebeveynli ve konumlanmamış kutular karşılaştırılır. */
            const kutu = el => { const st = getComputedStyle(el);
              return st.position === 'static' && parseFloat(st.borderTopWidth) > 0 && el.getClientRects().length; };
            document.querySelectorAll('#main *').forEach(ata => {
              const kutular = [...ata.children].filter(kutu);
              if(kutular.length < 2) return;
              const r = kutular.map(k => k.getBoundingClientRect());
              for(let i = 0; i < r.length; i++) for(let j = i + 1; j < r.length; j++){
                const x = Math.min(r[i].right, r[j].right) - Math.max(r[i].left, r[j].left);
                const y = Math.min(r[i].bottom, r[j].bottom) - Math.max(r[i].top, r[j].top);
                if(x > 2 && y > 2){
                  const ad = kutular[i].tagName.toLowerCase()
                    + (kutular[i].className ? '.' + String(kutular[i].className).split(' ').filter(Boolean).slice(0, 2).join('.') : '')
                    + ' ↔ komşusu ' + Math.round(y) + 'px';
                  if(dikey.indexOf(ad) < 0) dikey.push(ad);
                }
              }
            });
            return { tasma, sucluler:sucluler.slice(0, 4), kucuk:kucuk.slice(0, 4), yapisik:yapisik.slice(0, 4),
              dikey:dikey.slice(0, 4) };
          }, { minTap:MIN_TAP, allow:TAP_ALLOW });

          const yer = (G.ad === 'tablet' ? 'tablet ' : '') + r + (t ? '/' + t : '');
          rows.push({ yer, tasma:sonuc.tasma });
          if(sonuc.tasma > 1){
            errors.push(yer + ': yatay taşma ' + sonuc.tasma + 'px'
              + (sonuc.sucluler.length ? ' — ' + sonuc.sucluler.join(', ') : ''));
          }
          sonuc.kucuk.forEach(k => errors.push(yer + ': küçük dokunma hedefi — ' + k));
          sonuc.dikey.forEach(k => errors.push(yer + ': içerik kutusundan taşıp komşusuna biniyor — ' + k));
          if(sonuc.tasma <= 1){
            sonuc.yapisik.forEach(k => errors.push(yer + ': pencere kenarına yapışık (başka tarayıcıda taşar) — ' + k));
          }
        }
        /* Tablet: açık çekmecenin bölümleri (kenar çubuğunun kendi listesi,
           orada gizli) sayfada görünür bir bağlantıyla ulaşılır olmalı. */
        if(G.ad === 'tablet'){
          const eksik = await page.evaluate(() => {
            const gor = el => { const q = el.getBoundingClientRect(); return q.width > 0 && q.height > 0
              && getComputedStyle(el).visibility !== 'hidden'; };
            return [...document.querySelectorAll('.kenar__bolumler [data-route]')].map(e => e.dataset.route)
              .filter(x => ![...document.querySelectorAll('[data-route="' + x + '"]')].some(gor));
          });
          eksik.forEach(x => errors.push('tablet ' + r + ': «' + x + '» bölümüne görünür bağlantı yok'));
        }
      }
      await page.close();
    }

    console.log('\nTelefon ve tablet düzeni — ' + GENISLIKLER.map(g => g.w + '×' + g.h).join(' ve ') + ', '
      + rows.length + ' yer gezildi, dokunma tabanı ' + MIN_TAP + 'px.');
    if(errors.length){
      console.log('\n' + errors.length + ' sorun:');
      errors.slice(0, 30).forEach(e => console.log('  ✕ ' + e));
      if(errors.length > 30) console.log('  … ve ' + (errors.length - 30) + ' tane daha');
      process.exitCode = 1;
    }else{
      console.log('\nTelefon ve tablet düzeni temiz — ' + GENISLIKLER.map(g => g.w).join(' ve ') + ' pikselde ' + rows.length
        + ' yerde taşma yok, bütün dokunma hedefleri ' + MIN_TAP + 'px ve üstü.');
    }
  }catch(err){
    console.error('Koşum hatası:', err.message);
    process.exitCode = 1;
  }finally{
    if(browser) await browser.close();
    server.kill();
  }
})();
