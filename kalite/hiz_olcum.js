// KABUK HIZ OLCUMU (Faz 8 P3): kabugun soguk ve sicak acilisini yalitilmis ortamda (gecici LOCALAPPDATA, HKM'siz,
// deneme portu 4398) gercek Chromium'la olcer. Tekrar edilebilir: ayni komut ayni kosullari kurar, medyan verir.
//   soguk = yeni tarayici baglami (bos onbellek, bos depo); sicak = ayni baglamda yeniden yukleme (onbellek + depo dolu).
//   Olculen: ilk boyama (FP), ilk anlamli cizim (FCP; ilk sayfa cizilince LCP), etkilesime hazir (#sayfa ilk kez
//   data-yer alir: kabuk.js baslat dinleyicileri bagladi ve ilk rotayi cizdi), uzun gorevler (>50 ms), JS yigini,
//   istek sayisi ve aktarilan bayt, alan JSON istekleri, IndexedDB islemleri, /api/kabuk/baslangic durumu.
//   --iz: bir soguk + bir sicak acilisin Chromium izinden (CDP Tracing) betik degerlendirme/derleme, CSS ayristirma,
//   stil hesabi ve yerlesim sureleri (iz olcumu sisirir; sureler yalniz kiyas icindir).
// Kullanim: node kalite/hiz_olcum.js [--tekrar 5] [--yavas 4] [--iz] [--json <dosya>]
//   --css: kabugun yerlerini (harita.js YERLER, iki gorunum) gezip CSS kapsamini (kullanilan kural baytlari) ve Bugun'de
//   bosta 3 sn'lik stil hesabi / betik maliyetini (surekli animasyonlar, manzara tuvali) olcer.
//   --denetle: sayilan (sureden bagimsiz, CI'da oynamayan) butceyi denetler, asilirsa cikis 1: BUTCE asagida.
//   --yavas N: CPU N kat yavaslatilir (telefon benzetimi, CDP Emulation.setCPUThrottlingRate).
//   --gecikme MS: her istege MS gidis-donus gecikmesi (Tailscale'den telefon benzetimi, CDP Network.emulateNetworkConditions).
const kok = require('path').resolve(__dirname, '..');
const { chromium } = require(kok + '/tools/node_modules/playwright');
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');

const arg = (ad, vars) => { const i = process.argv.indexOf(ad); return i < 0 ? vars : process.argv[i + 1]; };
const TEKRAR = +arg('--tekrar', 5), YAVAS = +arg('--yavas', 1), GECIKME = +arg('--gecikme', 0), IZ = process.argv.includes('--iz'), CSS = process.argv.includes('--css'), DENETLE = process.argv.includes('--denetle'), JSON_CIKTI = arg('--json', null);
const PORT = 4398, T = 'http://127.0.0.1:' + PORT, ADRES = T + '/kabuk/#/bugun';
const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'kabuk-hiz-'));
const env = Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE: '1', LOCALAPPDATA: gecici, APPDATA: gecici,
  LIFEOS_HESAP_KLASOR: path.join(gecici, 'LifeOS', 'hesap') });
const srv = spawn(process.platform === 'win32' ? 'python' : 'python3', [path.join(kok, 'sistem/tekkapi.py'), '--port', String(PORT), '--hkm-ayri'], { env, stdio: 'ignore' });
const bekle = () => new Promise((res, rej) => {
  const son = Date.now() + 40000;
  (function dene() { http.get(T + '/kabuk/', r => { r.resume(); res(); }).on('error', () => Date.now() > son ? rej(new Error('sunucu açılmadı')) : setTimeout(dene, 300)); })();
});

// Sayfa acilmadan once: uzun gorev ve boyama gozcusu, ilk data-yer ani, IndexedDB islem sayaci.
const ONCE = () => {
  const o = window.__hiz = { uzun: [], idb: {}, hazir: null, lcp: null };
  try { new PerformanceObserver(l => l.getEntries().forEach(e => o.uzun.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  try { new PerformanceObserver(l => l.getEntries().forEach(e => { o.lcp = Math.round(e.startTime); })).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
  const say = ad => { o.idb[ad] = (o.idb[ad] || 0) + 1; };
  const sar = (P, adlar, on) => adlar.forEach(a => { const f = P && P.prototype[a]; if (f) P.prototype[a] = function () { say(on + a); return f.apply(this, arguments); }; });
  sar(window.IDBObjectStore, ['get', 'getAll', 'getAllKeys', 'openCursor', 'count', 'put', 'add', 'delete', 'clear'], '');
  sar(window.IDBFactory, ['open'], 'db.');
  sar(window.IDBDatabase, ['transaction'], 'db.');
  new MutationObserver((m, g) => {
    const s = document.getElementById('sayfa');
    if (s && s.hasAttribute('data-yer')) { o.hazir = Math.round(performance.now()); g.disconnect(); }
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-yer'], childList: true });
};
const TOPLA = () => {
  const o = window.__hiz, p = n => (performance.getEntriesByName(n)[0] || {}).startTime;
  const nav = performance.getEntriesByType('navigation')[0], kay = performance.getEntriesByType('resource');
  const tur = u => /\.css(\?|$)/.test(u) ? 'css' : /\.js(\?|$)/.test(u) ? 'js' : /\/alan\//.test(u) ? 'alan' : /\/api\//.test(u) ? 'api' : 'diger';
  const ist = {}; kay.forEach(k => { const t = tur(k.name); ist[t] = ist[t] || { sayi: 0, bayt: 0 }; ist[t].sayi++; ist[t].bayt += k.transferSize || 0; });
  return { fp: Math.round(p('first-paint')), fcp: Math.round(p('first-contentful-paint')), lcp: o.lcp, hazir: o.hazir,
    dcl: Math.round(nav.domContentLoadedEventEnd), yuk: Math.round(nav.loadEventEnd),
    uzunSayi: o.uzun.length, uzunToplam: o.uzun.reduce((a, b) => a + b, 0), uzunEn: Math.max(0, ...o.uzun),
    istek: kay.length + 1, bayt: kay.reduce((a, k) => a + (k.transferSize || 0), 0) + (nav.transferSize || 0), ist,
    alan: kay.filter(k => /\/alan\//.test(k.name)).map(k => k.name.replace(/^.*\/alan\//, '') + ' ' + (k.transferSize || 0)),
    idb: o.idb, idbOkuma: ['get', 'getAll', 'getAllKeys', 'openCursor', 'count'].reduce((a, k) => a + (o.idb[k] || 0), 0),
    sonIstek: Math.round(Math.max(0, ...kay.map(k => k.responseEnd))) };
};

async function ac(c, yeniden, izle) {
  const p = c.pages()[0] || await c.newPage(), cdp = await c.newCDPSession(p);
  await cdp.send('Performance.enable');
  if (YAVAS > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: YAVAS });
  if (GECIKME > 0) { await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: GECIKME, downloadThroughput: -1, uploadThroughput: -1 }); }
  const durum = {};
  p.on('response', r => { if (/\/api\/kabuk\/baslangic/.test(r.url())) durum.baslangic = r.status(); });
  if (izle) await c.browser().startTracing(p, { categories: ['devtools.timeline', 'v8', 'disabled-by-default-devtools.timeline', 'blink'] });
  if (yeniden) await p.reload({ waitUntil: 'load' }); else await p.goto(ADRES, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__hiz && window.__hiz.hazir != null, null, { timeout: 30000 });
  // ağ durulana dek (yeni kaynak 800 ms gelmez; kabuk sürekli yoklama yapabildiği için networkidle beklenmez, en çok 10 sn)
  for (let n = -1, son = Date.now() + 10000; Date.now() < son;) {
    const m = await p.evaluate(() => performance.getEntriesByType('resource').filter(k => k.responseEnd > 0).length);
    if (m === n) break; n = m; await p.waitForTimeout(800);
  }
  const iz = izle ? await c.browser().stopTracing() : null;
  const v = await p.evaluate(TOPLA), m = (await cdp.send('Performance.getMetrics')).metrics, mm = a => (m.find(x => x.name === a) || {}).value;
  v.yigin = Math.round(mm('JSHeapUsedSize') / 1024); v.dugum = mm('Nodes'); v.betikMs = Math.round(mm('ScriptDuration') * 1000);
  v.stilMs = Math.round(mm('RecalcStyleDuration') * 1000); v.yerlesimMs = Math.round(mm('LayoutDuration') * 1000);
  v.baslangic = durum.baslangic || null;
  await cdp.detach();
  return { v, iz };
}

// İzden ana iş parçacığı kırılımı: X olaylarının (tam süreli) toplamı, iç içe olmayan adlar
function izOzet(buf) {
  const olay = JSON.parse(buf.toString()).traceEvents || [];
  const ana = new Set(olay.filter(e => e.name === 'thread_name' && e.args && e.args.name === 'CrRendererMain').map(e => e.pid + ':' + e.tid));
  const AD = { EvaluateScript: 'betik_degerlendir', 'v8.compile': 'betik_derle', 'v8.compileModule': 'betik_derle', ParseAuthorStyleSheet: 'css_ayristir',
    UpdateLayoutTree: 'stil_hesapla', Layout: 'yerlesim', Paint: 'boya', ParseHTML: 'html_ayristir', FunctionCall: 'olay_isleyici' };
  const t = {}, betik = {};
  olay.forEach(e => {
    if (e.ph !== 'X' || !AD[e.name] || !ana.has(e.pid + ':' + e.tid)) return;
    t[AD[e.name]] = (t[AD[e.name]] || 0) + e.dur / 1000;
    if (e.name === 'EvaluateScript' || e.name === 'v8.compile') {
      const u = ((e.args.data || {}).url || (e.args.fileName) || '').replace(/^.*\/(kabuk|motor|brand\/ortak)\//, '$1/').replace(T, '');
      if (u) betik[u] = (betik[u] || 0) + e.dur / 1000;
    }
  });
  Object.keys(t).forEach(k => { t[k] = Math.round(t[k]); });
  const enPahali = Object.entries(betik).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([u, ms]) => u + ' ' + Math.round(ms));
  return { esik: t, enPahaliBetik: enPahali };
}

// CSS kapsamı: her yer masaüstü ve 390 px'te açılır; kullanılan kural baytı / toplam. Boşta maliyet: Bugün açıkken 3 sn.
async function cssOlc(b) {
  const yerler = [...new Set((fs.readFileSync(path.join(kok, 'kabuk/harita.js'), 'utf8').match(/yol: '#\/[a-z/]+'/g) || []).map(x => x.slice(6, -1)))];
  const c = await b.newContext({ viewport: { width: 1280, height: 800 } }), p = await c.newPage();
  await p.coverage.startCSSCoverage({ resetOnNavigation: false });
  await p.goto(T + '/kabuk/#/bugun'); await p.waitForSelector('#sayfa[data-yer]');
  for (const w of [1280, 390]) {
    await p.setViewportSize({ width: w, height: 800 });
    for (const y of yerler) { await p.evaluate(h => { location.hash = h; }, y); await p.waitForTimeout(150); }
  }
  const kap = await p.coverage.stopCSSCoverage(), dosya = {};
  kap.forEach(k => { const ad = k.url.replace(/^.*\/(kabuk|brand\/ortak)\//, '$1/'), o = dosya[ad] = dosya[ad] || { toplam: 0, kullanilan: 0 };
    o.toplam = k.text.length; o.kullanilan = Math.max(o.kullanilan, k.ranges.reduce((a, r) => a + r.end - r.start, 0)); });
  // boşta: Bugün çizili, 3 sn hiçbir şey yapılmaz
  await p.setViewportSize({ width: 1280, height: 800 }); await p.evaluate(() => { location.hash = '#/bugun'; }); await p.waitForTimeout(1500);
  const cdp = await c.newCDPSession(p); await cdp.send('Performance.enable');
  const m = async () => { const l = (await cdp.send('Performance.getMetrics')).metrics, g = a => (l.find(x => x.name === a) || {}).value; return { sn: g('RecalcStyleCount'), sm: g('RecalcStyleDuration'), bm: g('ScriptDuration'), ly: g('LayoutCount') }; };
  const a = await m(); await p.waitForTimeout(3000); const z = await m();
  const bosta = { stilHesabi: z.sn - a.sn, stilMs: Math.round((z.sm - a.sm) * 1000), betikMs: Math.round((z.bm - a.bm) * 1000), yerlesim: z.ly - a.ly,
    sonsuzAnimasyon: await p.evaluate(() => document.getAnimations().filter(x => x.effect && x.effect.getTiming().iterations === Infinity).map(x => (x.animationName || x.constructor.name) + '@' + ((x.effect.target && x.effect.target.className && x.effect.target.className.baseVal != null ? x.effect.target.className.baseVal : (x.effect.target || {}).className) || '').toString().split(' ')[0])) };
  await c.close();
  return { yer: yerler.length, dosya, bosta };
}

// Hız bütçesi (Faz 8 P3, faz8-hiz-rapor.md): istek ve bayt sayılır, süre değil (CI makinesinde süre oynar).
// Taban 15 Kasım: soğuk 55 istek / 1063 KB (Bugün yirmi alan paketini indiriyordu), sonra 14 istek / 384 KB.
const BUTCE = [['soğuk istek', o => o.S.istek, 20], ['soğuk aktarılan (KB)', o => Math.round(o.S.bayt / 1024), 600],
  ['soğuk alan JSON isteği (Bugün yalnız etkin alan)', o => (o.S.ist.alan || { sayi: 0 }).sayi, 3], ['sıcak aktarılan (KB)', o => Math.round(o.H.bayt / 1024), 40],
  ['soğuk betik isteği', o => (o.S.ist.js || { sayi: 0 }).sayi, 6]];

const medyan = l => { const s = l.filter(x => x != null).sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
const ALAN = ['fp', 'fcp', 'lcp', 'hazir', 'dcl', 'yuk', 'sonIstek', 'uzunSayi', 'uzunToplam', 'uzunEn', 'istek', 'bayt', 'idbOkuma', 'yigin', 'dugum', 'betikMs', 'stilMs', 'yerlesimMs'];
const ozet = kos => { const o = {}; ALAN.forEach(a => { o[a] = medyan(kos.map(k => k[a])); }); o.ist = kos[0].ist; o.alan = kos[0].alan; o.idb = kos[0].idb; o.baslangic = kos[0].baslangic; return o; };

(async () => {
  await bekle();
  const b = await chromium.launch();
  const sonuc = { tarih: new Date().toISOString(), tekrar: TEKRAR, yavas: YAVAS, gecikme: GECIKME, soguk: [], sicak: [] };
  try {
    for (let i = 0; i < TEKRAR; i++) {
      const c = await b.newContext({ viewport: { width: 1280, height: 800 } });
      await c.addInitScript(ONCE);
      sonuc.soguk.push((await ac(c, false)).v);
      sonuc.sicak.push((await ac(c, true)).v);
      await c.close();
    }
    if (IZ) {
      const c = await b.newContext({ viewport: { width: 1280, height: 800 } });
      await c.addInitScript(ONCE);
      sonuc.izSoguk = izOzet((await ac(c, false, true)).iz);
      sonuc.izSicak = izOzet((await ac(c, true, true)).iz);
      await c.close();
    }
    if (CSS) sonuc.css = await cssOlc(b);
  } finally { await b.close(); srv.kill(); }
  const S = ozet(sonuc.soguk), H = ozet(sonuc.sicak);
  const kb = n => n == null ? '—' : (n / 1024).toFixed(1) + ' KB';
  console.log(`Kabuk hız ölçümü · ${TEKRAR} tekrar medyanı · CPU ${YAVAS}× · gecikme ${GECIKME} ms · ${sonuc.tarih.slice(0, 16)}`);
  console.log('| Ölçüt | Soğuk | Sıcak |\n|---|---|---|');
  [['İlk boyama (FP)', 'fp', 'ms'], ['İlk anlamlı çizim (FCP)', 'fcp', 'ms'], ['En büyük çizim (LCP)', 'lcp', 'ms'], ['Etkileşime hazır (ilk rota)', 'hazir', 'ms'],
    ['DOMContentLoaded', 'dcl', 'ms'], ['load', 'yuk', 'ms'], ['Son istek bitti', 'sonIstek', 'ms'], ['Uzun görev (sayı)', 'uzunSayi', ''], ['Uzun görev (toplam)', 'uzunToplam', 'ms'],
    ['En uzun görev', 'uzunEn', 'ms'], ['Betik süresi (CDP)', 'betikMs', 'ms'], ['Stil hesabı (CDP)', 'stilMs', 'ms'], ['Yerleşim (CDP)', 'yerlesimMs', 'ms'],
    ['İstek', 'istek', ''], ['Aktarılan', 'bayt', 'KB'], ['IndexedDB okuma', 'idbOkuma', ''], ['JS yığını', 'yigin', 'KBy'], ['DOM düğümü', 'dugum', '']]
    .forEach(([ad, a, b_]) => console.log(`| ${ad} | ${b_ === 'KB' ? kb(S[a]) : b_ === 'KBy' ? S[a] + ' KB' : S[a] + (b_ ? ' ' + b_ : '')} | ${b_ === 'KB' ? kb(H[a]) : b_ === 'KBy' ? H[a] + ' KB' : H[a] + (b_ ? ' ' + b_ : '')} |`));
  console.log('istek türleri (soğuk): ' + Object.entries(S.ist).map(([t, v]) => `${t} ${v.sayi}/${kb(v.bayt)}`).join(', '));
  console.log('istek türleri (sıcak): ' + Object.entries(H.ist).map(([t, v]) => `${t} ${v.sayi}/${kb(v.bayt)}`).join(', '));
  console.log('alan JSON (soğuk): ' + (S.alan.join(', ') || 'yok') + ' · IndexedDB (soğuk): ' + JSON.stringify(S.idb) + ' · (sıcak): ' + JSON.stringify(H.idb));
  console.log('/api/kabuk/baslangic: ' + S.baslangic + (S.baslangic === 404 ? ' (yalıtılmış ortamda paket dosyası yok: tasarım gereği)' : ''));
  if (sonuc.izSoguk) {
    console.log('iz (soğuk, ms): ' + JSON.stringify(sonuc.izSoguk.esik) + '\n  en pahalı betik: ' + sonuc.izSoguk.enPahaliBetik.join(', '));
    console.log('iz (sıcak, ms): ' + JSON.stringify(sonuc.izSicak.esik) + '\n  en pahalı betik: ' + sonuc.izSicak.enPahaliBetik.join(', '));
  }
  if (sonuc.css) {
    console.log(`CSS kapsamı (${sonuc.css.yer} yer × 1280/390 px): ` + Object.entries(sonuc.css.dosya).map(([ad, o]) => `${ad} ${kb(o.kullanilan)}/${kb(o.toplam)} (%${Math.round(100 * o.kullanilan / o.toplam)})`).join(', '));
    const bo = sonuc.css.bosta;
    console.log(`Bugün boşta 3 sn: ${bo.stilHesabi} stil hesabı (${bo.stilMs} ms), ${bo.yerlesim} yerleşim, betik ${bo.betikMs} ms; sonsuz animasyon: ${bo.sonsuzAnimasyon.join(', ') || 'yok'}`);
  }
  sonuc.medyan = { soguk: S, sicak: H };
  let asim = 0;
  if (DENETLE) BUTCE.forEach(([ad, f, tavan]) => { const v = f({ S, H }), ok = v <= tavan; if (!ok) asim++; console.log((ok ? '✓ ' : '✕ ') + ad + ': ' + v + ' ≤ ' + tavan); });
  if (JSON_CIKTI) { fs.mkdirSync(path.dirname(path.resolve(JSON_CIKTI)), { recursive: true }); fs.writeFileSync(JSON_CIKTI, JSON.stringify(sonuc, null, 1)); console.log('yazıldı: ' + JSON_CIKTI); }
  try { fs.rmSync(gecici, { recursive: true, force: true }); } catch (e) {}
  if (asim) { console.log('KIRMIZI: hız bütçesi aşıldı (' + asim + ')'); process.exit(1); }
})().catch(e => { console.error(e); srv.kill(); process.exit(1); });
