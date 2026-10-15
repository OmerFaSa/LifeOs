/* SADELİK ÖLÇÜMÜ — üç arayüzün bütün ekranlarında kalabalık ölçülür.

   Depo sahibi (2026-10-16): «yüzeysel değil, çok daha derin; sistemin her
   yerini çok daha anlaşılır ve minimalist yap». Kalabalık tahminle değil
   ÖLÇÜLEREK bulunur: her ekran gerçek tarayıcıda açılır ve şunlar sayılır:

     açık     — açık (küçültülmemiş, gizlenmemiş) kart sayısı; bölümlü
                ekranda EN KALABALIK bölümünkü (gizle.js bolumler)
     söz      — ekranda görünen sözcük sayısı
     düğme    — görünen düğme sayısı
     boy      — sayfanın piksel boyu (1280 genişlikte)

   KURAL (sadelik sözleşmesi): bir ekranın (bölümlü ekranda her bölümün)
   açık kartı en çok ESIK_ACIK'tır; ara sıra kullanılan kart küçük başlar
   (ekranın kucukVarsayilan listesi), hiçbir kart kaldırılmaz.

     node tools/sadelik.js              # tablo, en kalabalık ekran önce
     node tools/sadelik.js --denetle    # kuralı aşan ekran varsa çıkış 1
     node tools/sadelik.js AYS          # yalnız bir modül
     node tools/sadelik.js --ornek      # örnek veri kipinde (dolu hesap)

   Sunucu gerekmez: modülün derlenmiş tek dosyası (dist/*.html) açılır;
   sabit port yoktur, öteki denetimlerle çakışmaz. Önce build.py koşar. */

const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'ESP', 'node_modules', 'playwright'));

const ESIK_ACIK = 3;
const KOK = path.join(__dirname, '..');
const MODULLER = {
  AYS:{ dosya:'AYS/dist/rota.html', ns:'R', profil:'rota.activeProfile',
    rotalar:'(R.App.NAV || []).reduce((l, g) => l.concat((g.items || []).map(i => i.id)), [])', git:'r => R.App.go(r)' },
  SPI:{ dosya:'SPI/dist/spi.html', ns:'SP', profil:'spi.activeProfile',
    rotalar:'(SP.App.SECTIONS || []).reduce((l, s) => l.concat(s.views.map(v => v.route)), [])', git:'r => SP.App.go(r)' },
  ESP:{ dosya:'ESP/dist/esp.html', ns:'ESP', profil:'esp.activeProfile',
    rotalar:'(ESP.Nav.sections() || []).reduce((l, s) => l.concat(s.views.map(v => v.route)), [])', git:'r => ESP.App.go(r)' },
};

/* --ornek: modülün örnek veri kipi (brand/ortak/ornekkip.js) — boş profil
   kalabalığı gizler; dolu bir hesapta ekran nasıl görünür, o ölçülür. */
const ORNEK = process.argv.includes('--ornek');

async function olc(ad, m){
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{ width:1280, height:900 } });
  if(ORNEK) await p.addInitScript(k => { try{ localStorage.setItem(k, 'ornek'); }catch(e){} }, m.profil);
  const hata = [];
  p.on('pageerror', e => hata.push(e.message));
  await p.goto('file:///' + path.join(KOK, m.dosya).replace(/\\/g, '/'));
  await p.waitForFunction(ns => window[ns] && window[ns].App && window.LIFEOS && window.LIFEOS.Gizle, m.ns, { timeout:30000 });
  await p.waitForTimeout(2500);
  for(const t of ['Escape', 'Escape']){ await p.keyboard.press(t); await p.waitForTimeout(150); }
  const rotalar = [...new Set(await p.evaluate(m.rotalar))];
  const sonuc = [];
  for(const r of rotalar){
    try{ await p.evaluate(`(${m.git})(${JSON.stringify(r)})`); }
    catch(e){ sonuc.push({ ad, r, hata:'açılamadı' }); continue; }
    await p.waitForTimeout(500);
    const o = await p.evaluate(() => {
      const kok = document.getElementById('app') || document.body;
      const G = window.LIFEOS.Gizle;
      const gorunur = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent !== null; };
      const bl = Array.from(kok.querySelectorAll('section.sayfabolum'));
      const parca = bl.length ? bl : [kok];
      const bolumAcik = parca.map(b => ({ id:b.id || '', acik:G.bolumler(b).filter(x => !x.el.classList.contains('gizle-kucuk')
        && !x.el.classList.contains('gizle-gizli') && gorunur(x.el)).map(x => x.anahtar) }));
      const en = bolumAcik.reduce((a, x) => x.acik.length > a.acik.length ? x : a, { id:'', acik:[] });
      const metin = (kok.innerText || '').replace(/\s+/g, ' ').trim();
      return {
        acik:en.acik.length, acikBolum:en.id, acikKartlar:en.acik,
        soz:metin ? metin.split(' ').length : 0,
        dugme:Array.from(kok.querySelectorAll('button, a.btn')).filter(gorunur).length,
        boy:document.documentElement.scrollHeight,
      };
    });
    sonuc.push(Object.assign({ ad, r }, o));
  }
  await b.close();
  return { sonuc, hata };
}

(async () => {
  const sec = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const denetle = process.argv.includes('--denetle');
  const hepsi = [], hatalar = [];
  for(const ad of Object.keys(MODULLER)){
    if(sec.length && sec.indexOf(ad) < 0) continue;
    const r = await olc(ad, MODULLER[ad]);
    hepsi.push(...r.sonuc);
    r.hata.forEach(h => hatalar.push(ad + ': ' + h));
  }
  hepsi.sort((a, b) => (b.acik - a.acik) || (b.soz - a.soz));
  const pad = (s, n) => String(s).padEnd(n);
  console.log(pad('modül', 6) + pad('ekran', 14) + pad('açık', 6) + pad('söz', 7) + pad('düğme', 7) + pad('boy', 7) + 'açık kartlar');
  hepsi.forEach(x => console.log(pad(x.ad, 6) + pad(x.r, 14) + pad(x.hata ? '—' : x.acik, 6) + pad(x.soz || '', 7) + pad(x.dugme || '', 7)
    + pad(x.boy || '', 7) + (x.hata || ((x.acikBolum ? '[' + x.acikBolum + '] ' : '') + (x.acikKartlar || []).join(', ')))));
  const asan = hepsi.filter(x => x.acik > ESIK_ACIK);
  console.log('\n' + hepsi.length + ' ekran · kuralı aşan (açık > ' + ESIK_ACIK + '): ' + asan.length
    + (hatalar.length ? ' · sayfa hatası: ' + hatalar.length : ''));
  hatalar.slice(0, 5).forEach(h => console.log('  ' + h));
  process.exit(denetle && (asan.length || hatalar.length) ? 1 : 0);
})();
