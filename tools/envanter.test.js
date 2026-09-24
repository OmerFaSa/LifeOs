#!/usr/bin/env node
/* envanter.js OLCUSUNUN testi — «30+ kelimelik tek parca yazi».
 *
 * v5 raf duzeni defterin bantlarini ve yiginlarini `display:contents` ile
 * acar: kutu cizmezler, cocuklari ebeveynin kutusuna gecer. Olcu bu
 * cocuklari «blok degil» sayiyordu ve on kisa kutulu bir defteri TEK
 * PARCA yazi goruyordu (AYS'nin 19 ekraninin hepsi kirmiziydi). Bu test
 * iki yonu birden tutar: kutulara bolunmus uzun defter SAYILMAZ, gercek
 * tek parca paragraf — `display:contents` icinde bile — SAYILIR.
 *
 *   node tools/envanter.test.js      (cikis 0 temiz, 1 kirmizi, 2 arac yok)
 */
const path = require('path');
const { topla, SEKME, SEKME_GRUBU } = require('./envanter.js');

const KOK = path.resolve(__dirname, '..');
let chromium;
try{ ({ chromium } = require(path.join(KOK, 'ESP', 'node_modules', 'playwright'))); }
catch(e){
  try{ ({ chromium } = require('playwright')); }
  catch(e2){ console.error('Playwright yok (ESP/ içinde npm ci).'); process.exit(2); }
}

const kelime = n => Array.from({ length:n }, (_, i) => 'kelime' + i).join(' ');
const kutu = n => '<section class="lrow"><div class="lrow__main"><p>' + kelime(n) + '</p></div></section>';

const DURUMLAR = [
  { ad:'raf: bantlar display:contents, on kısa kutu → 0',
    govde:'<div class="ledger" style="display:grid"><div class="lband" style="display:contents">'
      + '<div class="stack" style="display:contents">' + Array.from({ length:10 }, () => kutu(6)).join('')
      + '</div></div></div>', beklenen:0 },
  { ad:'tek parça 31 kelimelik paragraf → 1',
    govde:'<p>' + kelime(31) + '</p>', beklenen:1 },
  { ad:'display:contents içindeki tek parça paragraf da sayılır → 1',
    govde:'<div class="ledger" style="display:grid"><div class="lband" style="display:contents">'
      + '<p>' + kelime(31) + '</p></div></div>', beklenen:1 },
  { ad:'satır içi öğelerle bölünmüş uzun yazı yine tek parçadır → 1',
    govde:'<div style="display:block"><span>' + kelime(20) + '</span> <b>' + kelime(15) + '</b></div>', beklenen:1 },
];

(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath:process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport:{ width:1280, height:900 } });
  let kirmizi = 0;
  for(const d of DURUMLAR){
    await p.setContent('<main id="main">' + d.govde + '</main>');
    const r = await p.evaluate(topla, { SEKME, SEKME_GRUBU });
    const gelen = r.olcu.uzunParagraf;
    const ok = gelen === d.beklenen;
    if(!ok) kirmizi++;
    console.log((ok ? '  ✓ ' : '  ✕ ') + d.ad + (ok ? '' : ' (gelen ' + gelen + ')'));
  }
  await b.close();
  console.log(kirmizi ? '\n' + kirmizi + ' durum kırmızı.' : '\nÖlçü testi temiz — ' + DURUMLAR.length + ' durum.');
  process.exit(kirmizi ? 1 : 0);
})().catch(e => { console.error('Koşum hatası:', e && e.stack || e); process.exit(2); });
