/* Akicilik butcesi — uc modulun perfcheck'i cagirir (2026-11-05).
 *
 * Sure degil SAYI olculur: makineden ve yukten bagimsiz, gerileme ilk
 * kosuda gorunur. Iki gerilemeyi tutar:
 *
 *  1. Simge cevirici oku-yaz: piksel.js cizimCevir daire daire okuyup
 *     yaziyordu; her okuma butun sayfanin stilini yeniden hesaplatiyordu
 *     (AYS Analiz gecisinde tek karede 385 ms). Olcu: 40 grafik SVG'si
 *     cevrilirken zorunlu stil hesabi sayisi (eskiden ~160).
 *  2. Fareyi izleyen kart isigi: minik.js her karede kartin --mx/--my'sini
 *     yaziyordu; degisken kalitsal oldugu icin kartin bütün alt ogeleri
 *     (~1500) yeniden stilleniyordu (kaydirmada kare basi 11-16 ms). Olcu:
 *     fare bir kartin ustunde gezinirken yeniden stillenen oge sayisi.
 *
 *   const akicilik = require('../../tools/akicilik.js');
 *   const satirlar = await akicilik(browser, page);   // [{ ad, deger, butce, birim }]
 */

const BUTCE = { stilHesabi:6, fareStil:2500 };

async function simgeCevirici(page, cdp){
  const kuruldu = await page.evaluate(() => {
    const P = window.LIFEOS && window.LIFEOS.PIKSEL;
    /* body disinda: piksel.js'in govde gozcusu kabi kendisi cevirmesin (olcum bos kalirdi). */
    const yer = document.documentElement;
    if(!P || document.documentElement.getAttribute('data-zemin') !== 'piksel') return false;
    const kap = document.createElement('div');
    kap.id = 'akicilik-deney';
    let h = '';
    for(let i = 0; i < 40; i++){
      h += '<svg viewBox="0 0 100 100" width="100" height="100" class="akicilik-svg">';
      for(let j = 0; j < 4; j++) h += '<circle cx="' + (10 + j * 20) + '" cy="50" r="3" fill="currentColor"/>';
      h += '<circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="4"/></svg>';
    }
    kap.innerHTML = h;
    yer.appendChild(kap);
    document.body.offsetHeight;   // stil ve yerlesim temiz baslasin
    return true;
  });
  if(!kuruldu) return null;
  const once = await metrik(cdp);
  await page.evaluate(() => window.LIFEOS.PIKSEL.simgeleriTara([document.getElementById('akicilik-deney')]));
  const sonra = await metrik(cdp);
  const cevrildi = await page.evaluate(() => {
    const k = document.getElementById('akicilik-deney');
    const n = k.querySelectorAll('rect').length;
    k.remove();
    return n;
  });
  /* Cevirici hic calismadiysa sayi anlamsizdir: «temiz» diye raporlanmaz. */
  if(cevrildi < 160) throw new Error('simge cevirici dairelerin ' + cevrildi + '/160 tanesini cevirdi');
  return sonra.RecalcStyleCount - once.RecalcStyleCount;
}

/* Ayri sayfa, TAM hareket: perfcheck sayfasi azaltilmis hareketle acilir ve o kipte
   fareyi izleyen katman hic kurulmaz; gerileme orada gorunmezdi. */
async function fareStil(browser, url){
  const page = await browser.newPage({ viewport:{ width:1440, height:900 }, reducedMotion:'no-preference' });
  try{ return await fareOlc(browser, page, url); }finally{ await page.close(); }
}
async function fareOlc(browser, page, url){
  await page.goto(url, { waitUntil:'load' });
  await page.waitForSelector('.site', { timeout:15000 });
  await page.waitForTimeout(1500);
  /* Ilk acilis sihirbazi ve karsilama perdesi kartin onunu kapatir. */
  for(let i = 0; i < 3; i++){
    await page.evaluate(() => { const s = Array.from(document.querySelectorAll('[data-act="setup-skip"], [data-act="sheet-close"], .perde__gec')).find(x => x.getClientRects().length); if(s) s.click(); });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  const kutu = await page.evaluate(() => {
    /* Kart: minik.js KART listesi; en kalabalik olani (gerileme alt oge sayisiyla buyur). */
    const k = Array.from(document.querySelectorAll('main .kutu, main .card, .bugun__alan, main .pk, main .giris, main .lrow'))
      .filter(e => e.getBoundingClientRect().height > 60)
      .sort((a, b) => b.querySelectorAll('*').length - a.querySelectorAll('*').length)[0];
    if(!k) return null;
    k.scrollIntoView({ block:'center' });
    const r = k.getBoundingClientRect();
    return { x:r.left, y:r.top, w:r.width, h:Math.min(r.height, window.innerHeight - r.top) };
  });
  if(!kutu) return null;
  await page.mouse.move(kutu.x + 4, kutu.y + 4);
  await page.waitForTimeout(300);
  await browser.startTracing(page, { categories:['devtools.timeline'] });
  for(let i = 0; i < 30; i++){
    await page.mouse.move(kutu.x + 4 + (kutu.w - 8) * i / 29, kutu.y + kutu.h / 2);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(300);
  const iz = JSON.parse((await browser.stopTracing()).toString()).traceEvents;
  return iz.filter(e => e.name === 'UpdateLayoutTree' && e.args && e.args.elementCount)
    .reduce((t, e) => t + e.args.elementCount, 0);
}

async function metrik(cdp){
  const o = {};
  (await cdp.send('Performance.getMetrics')).metrics.forEach(m => { o[m.name] = m.value; });
  return o;
}

module.exports = async function akicilik(browser, page){
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const satirlar = [];
  const s = await simgeCevirici(page, cdp);
  if(s != null) satirlar.push({ ad:'simge çevirici: zorunlu stil hesabı', deger:s, butce:BUTCE.stilHesabi, birim:'kez' });
  const f = await fareStil(browser, page.url());
  if(f != null) satirlar.push({ ad:'kartta fare: yeniden stillenen öğe', deger:f, butce:BUTCE.fareStil, birim:'öğe' });
  await cdp.detach();
  return satirlar;
};
module.exports.BUTCE = BUTCE;
