#!/usr/bin/env node
/* Bulut geçişi uçtan uca (2026-11-06, kullanıcı: «kararsız oluyor, aniden gelip kesiliyor»).
 *
 * Birim testi sayfa değişimini göremez: asıl hatalar orada idi. Ölçümde varış sayfası ilk boyamadan
 * ~620 ms sonra bulut çiziyordu (arada başka renk bir ekran), bulut kaymıyor dikdörtgen bir pencere
 * açılıyordu, perde bulut tam çıkmadan solup kalkıyordu. Bu betik tek dosya sürümüyle (dist, gerçek
 * kullanımdaki) üç modül arasında iki yönde gerçek geçiş yapar ve her ekran karesinde örnek alır:
 *
 *   node tools/bulut_gecis.js        (önce üç build.py; çıkış 0 temiz, 1 bulgu var, 2 koşulamadı)
 *
 * Kapılar 4173/4183/4193 tarayıcı içinde kendi sunucusuna yönlenir: açık LifeOS'a dokunmaz, port tutmaz.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const KOK = path.resolve(__dirname, '..');
const MOD = { ays:{ d:'AYS', html:'rota.html', kapi:4173 }, spi:{ d:'SPI', html:'spi.html', kapi:4183 }, esp:{ d:'ESP', html:'esp.html', kapi:4193 } };
let chromium;
try{ ({ chromium } = require(path.join(KOK, 'ESP', 'node_modules', 'playwright'))); }
catch(e){ console.error('Playwright yok (ESP/node_modules).'); process.exit(2); }

const TUR = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp', '.png':'image/png', '.woff2':'font/woff2', '.json':'application/json', '.svg':'image/svg+xml' };
const sunucu = m => new Promise(ok => {
  const s = http.createServer((q, r) => {
    let y = decodeURIComponent(q.url.split('?')[0]);
    if(y === '/') y = '/' + m.html;
    const dosya = path.join(KOK, m.d, 'dist', y);
    if(!dosya.startsWith(path.join(KOK, m.d, 'dist'))){ r.writeHead(403); r.end(); return; }
    fs.readFile(dosya, (e, b) => {
      if(e){ r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'Content-Type':TUR[path.extname(dosya)] || 'application/octet-stream', 'Cache-Control':'no-store' });
      r.end(b);
    });
  });
  s.listen(0, '127.0.0.1', () => { m.port = s.address().port; ok(s); });
});

/* Sayfaya her açılışta girer: her karede bulutun yeri, perde ve kart hâli; çalan ses katmanları. */
function izleyici(kip){
  try{ localStorage.setItem('lifeos.hareket', kip.hareket); if(kip.sesKapali) localStorage.setItem('lifeos.ses', JSON.stringify({ tik:false, surum:2 })); }catch(e){}
  const k = [], ses = [];
  let boya = 0;
  window.__kare = k; window.__ses = ses;
  const yolla = () => { try{ if(window.__kayit && (k.length || ses.length)) window.__kayit(location.port, k.splice(0), ses.splice(0), boya); }catch(e){} };
  setInterval(yolla, 120); addEventListener('pagehide', yolla);
  try{ new PerformanceObserver(l => l.getEntries().forEach(e => { if(e.name === 'first-paint') boya = performance.timeOrigin + e.startTime; })).observe({ type:'paint', buffered:true }); }catch(e){}
  /* Bulut sesi gürültüden çalar (tampon kaynağı); tıklamanın kendi tik sesi osilatördür, sayılmaz. */
  const S0 = window.AudioBufferSourceNode && AudioBufferSourceNode.prototype.start;
  if(S0) AudioBufferSourceNode.prototype.start = function(){ ses.push(performance.timeOrigin + performance.now()); return S0.apply(this, arguments); };
  const ornek = () => {
    const sol = document.querySelector('.px-bulut__sol'), sag = document.querySelector('.px-bulut__sag'), perde = document.querySelector('.perde--karsilama'), gecis = document.querySelector('.lifeos-gecis'), kart = document.querySelector('.px-bulut__kart');
    const a = sol && sol.getBoundingClientRect(), b = sag && sag.getBoundingClientRect();
    k.push({ t:performance.timeOrigin + performance.now(), sag:a ? a.right : null, sol:b ? b.left : null, vw:innerWidth, perde:!!perde, kapan:!!(perde && perde.classList.contains('perde--kapaniyor')), gecis:!!gecis, kartO:kart ? +getComputedStyle(kart).opacity : null });
    requestAnimationFrame(ornek);
  };
  requestAnimationFrame(ornek);
}

const bulgular = [];
const bulgu = (ad, m) => { bulgular.push(ad + ': ' + m); console.log('  KIRMIZI ' + m); };

async function kos(ctx, nereden, nereye, kip){
  const kareler = [], sesler = [], boyalar = {};
  const p = await ctx.newPage();
  await p.exposeBinding('__kayit', (s, port, k, se, b) => { k.forEach(x => kareler.push(Object.assign(x, { port:Number(port) }))); sesler.push(...se); if(b) boyalar[port] = b; });
  p.on('pageerror', e => bulgu(nereden + '→' + nereye, 'sayfa hatası: ' + e.message.slice(0, 160)));
  await p.addInitScript(izleyici, kip);
  await p.goto('http://127.0.0.1:' + MOD[nereden].kapi + '/', { waitUntil:'load' });
  await p.waitForFunction(() => !document.querySelector('.perde--karsilama'), null, { timeout:25000 }).catch(() => {});
  for(let i = 0; i < 3; i++) await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  const t0 = Date.now();
  const tiklandi = await p.evaluate(n => { const a = document.querySelector('[data-modul-gecis="' + n + '"]'); if(!a) return false; a.click(); return true; }, nereye);
  if(!tiklandi){ bulgu(nereden + '→' + nereye, 'modül bağlantısı yok'); await p.close(); return null; }
  return { p, t0, kareler, sesler, boyalar };
}

function denetle(ad, n, kapiV){
  const { t0, kareler, boyalar } = n, kaynakPort = kareler.find(k => k.t >= t0).port;
  const gid = kareler.filter(k => k.port === kaynakPort && k.t >= t0 && k.gecis), var_ = kareler.filter(k => k.port === kapiV).sort((a, b) => a.t - b.t);
  /* Gidiş: bulut ekranın dışından başlar, sıçramadan kapanır, kart sayfa değişmeden söner. */
  const gel = gid.filter(k => k.sag != null);
  if(!gel.length) return bulgu(ad, 'kalkışta bulut yok');
  if(gel[0].sag > 1) bulgu(ad, 'bulut ekranın içinde başladı: sol yarımın sağ kenarı ' + Math.round(gel[0].sag));
  const ilkKapanis = gel.findIndex(k => k.sag > k.vw / 2);
  if(ilkKapanis < 0) bulgu(ad, 'bulut ekranın ortasına hiç varmadı');
  let enHiz = 0;
  for(let i = 1; i <= ilkKapanis; i++){ const dt = gel[i].t - gel[i - 1].t; if(dt > 1) enHiz = Math.max(enHiz, (gel[i].sag - gel[i - 1].sag) / gel[i].vw / Math.max(dt, 16) * 1000); }
  if(enHiz > 2.4) bulgu(ad, 'bulut sıçradı: saniyede ekranın ' + enHiz.toFixed(1) + ' katı');
  const son = gid[gid.length - 1];
  if(son.kartO != null && son.kartO > 0.05) bulgu(ad, 'kart sayfa değişirken hâlâ görünür (saydamlık ' + son.kartO + ')');
  /* Varış: bulut ilk karede ortayı örter, perde kalkana dek kapalıdır, bulut tam çıkmadan perde kalkmaz. */
  if(!var_.length) return bulgu(ad, 'varış sayfası örneklenemedi');
  const ilk = var_[0];
  if(ilk.sag == null || ilk.sag <= ilk.vw / 2 || ilk.sol >= ilk.vw / 2) bulgu(ad, 'varışın ilk karesinde bulut ortayı örtmüyor');
  const kapali = var_.filter(k => k.perde && !k.kapan);
  if(kapali.some(k => k.sag == null || k.sag <= k.vw / 2 || k.sol >= k.vw / 2)) bulgu(ad, 'perde dururken bulut açıldı');
  const kalkis = var_.filter(k => k.perde && k.kapan);
  if(!kalkis.length) return bulgu(ad, 'perde hiç kalkmadı');
  const sonK = kalkis[kalkis.length - 1];
  if(sonK.sag > 0.1 * sonK.vw || sonK.sol < 0.9 * sonK.vw) bulgu(ad, 'perde bulut çıkmadan kalktı: sol yarım ' + Math.round(sonK.sag) + ' px içeride');
  const sure = kalkis[kalkis.length - 1].t - kalkis[0].t;
  if(sure < 500) bulgu(ad, 'bulut çok kısa sürede kalktı: ' + Math.round(sure) + ' ms');
  /* İlk boyamada bulutun yeri: boyadan önce bulut örneği olmayan kare kalmamalı (markup + CSS). */
  const b = boyalar[String(kapiV)];
  if(b && var_.some(k => k.t <= b + 16 && k.sag == null)) bulgu(ad, 'ilk boyamada bulut yok');
}

(async () => {
  const dist = Object.values(MOD).map(m => path.join(KOK, m.d, 'dist', m.html));
  if(dist.some(d => !fs.existsSync(d))){ console.error('dist yok: önce üç build.py.'); process.exit(2); }
  /* Duruk denetim: bulut ve tema betikten önce gelir. */
  for(const d of dist){
    const h = fs.readFileSync(d, 'utf8'), bulut = h.indexOf('class="px-bulut"'), perdeBetik = h.indexOf('<script', h.indexOf('id="marka-perde"'));
    if(!/<html[^>]*data-zemin="piksel"/.test(h)) bulgu(path.basename(d), '<html> data-zemin taşımıyor: ilk boyama temasız');
    if(bulut < 0 || bulut > perdeBetik) bulgu(path.basename(d), 'bulut perde markupunda değil');
    if(h.indexOf('.px-bulut i{ background-image:url(data:image/png') < 0) bulgu(path.basename(d), 'bulut resmi CSS\'te yok');
  }
  const sv = await Promise.all(Object.values(MOD).map(sunucu));
  const b = await chromium.launch({ args:['--autoplay-policy=no-user-gesture-required'] });
  const baglam = async () => {
    const ctx = await b.newContext({ viewport:{ width:1280, height:720 } });
    await ctx.route(/127\.0\.0\.1:(4173|4183|4193)\//, async route => {
      const u = new URL(route.request().url()), m = Object.values(MOD).find(x => x.kapi === Number(u.port));
      const y = await route.fetch({ url:'http://127.0.0.1:' + m.port + u.pathname + u.search });
      await route.fulfill({ response:y });
    });
    return ctx;
  };
  try{
    const CIFT = [['ays', 'spi'], ['spi', 'esp'], ['esp', 'ays'], ['spi', 'ays'], ['esp', 'spi'], ['ays', 'esp']];
    for(const [x, y] of CIFT){
      const ad = x + '→' + y, ctx = await baglam();
      console.log(ad);
      const n = await kos(ctx, x, y, { hareket:'tam' });
      if(n){
        await n.p.waitForFunction(() => location.port && !document.querySelector('.perde--karsilama') && document.readyState === 'complete' && !document.querySelector('.lifeos-gecis'), null, { timeout:20000 }).catch(() => bulgu(ad, 'varış perdesi 20 sn içinde kalkmadı'));
        await n.p.waitForTimeout(300);
        denetle(ad, n, MOD[y].kapi);
        const gidis = n.sesler.filter(t => t >= n.t0 && t < n.t0 + 3100).length;
        if(!gidis) bulgu(ad, 'bulut sesi çalmadı');
        await n.p.close();
      }
      await ctx.close();
    }
    /* Ses kapalı: geçiş aynı, tek katman çalmaz. Azaltılmış hareket: bulut yok, ses yok, sayfa yine açılır. */
    for(const [baslik, kip, bulutVar] of [['ses kapalı', { hareket:'tam', sesKapali:true }, true], ['azaltılmış hareket', { hareket:'az' }, false]]){
      const ctx = await baglam();
      console.log(baslik);
      const n = await kos(ctx, 'ays', 'spi', kip);
      if(n){
        await n.p.waitForFunction(() => location.port === '4183', null, { timeout:15000 }).catch(() => bulgu(baslik, 'sayfa değişmedi'));
        await n.p.waitForTimeout(bulutVar ? 5200 : 800);
        if(n.sesler.filter(t => t >= n.t0).length) bulgu(baslik, 'ses çaldı: ' + n.sesler.length + ' katman');
        if(!bulutVar && n.kareler.some(k => k.t >= n.t0 && k.gecis)) bulgu(baslik, 'perde oynadı');
        await n.p.close();
      }
      await ctx.close();
    }
  }finally{ await b.close(); sv.forEach(s => s.close()); }
  if(bulgular.length){ console.log('\nBulut geçişi: ' + bulgular.length + ' bulgu'); process.exit(1); }
  console.log('\nBulut geçişi: altı yön, ses kapalı ve azaltılmış hareket temiz.');
})().catch(e => { console.error(e); process.exit(2); });
