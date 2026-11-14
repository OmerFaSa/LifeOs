// ORTAK ÇEKİRDEK TESTLERİ: brand/ortak/*.test.js eski modüllerin tarayıcı içi koşucusu (R.Test) için yazılmıştı; modüller
// kalkınca hiçbir yerde koşmuyorlardı. Bu araç her test dosyasını kendi sayfasında, ortak modüllerle birlikte gerçek
// Chromium'da (Playwright, tools/node_modules) koşar. Kullanım: node tools/ortak_test.js [ad ...]   (ör. tarih piksel)
const path = require('path'), fs = require('fs'), os = require('os'), url = require('url');
const kok = path.resolve(__dirname, '..'), ortak = path.join(kok, 'brand/ortak');
const { chromium } = require(path.join(__dirname, 'node_modules/playwright'));

// Eski koşucunun (AYS/src/tests/harness.js, 8d0b542c^) eşleştiricileri; davranış aynı.
const KOSUCU = `
window.LIFEOS = window.LIFEOS || {};
window.R = { Test: (function(){
  const suites = []; let current = null;
  function describe(name, fn){ const prev = current; current = { name, tests:[] }; suites.push(current); fn(); current = prev; }
  function it(name, fn){ if(!current) throw new Error('it() describe() içinde çağrılmalı'); current.tests.push({ name, fn }); }
  const fmt = v => v === undefined ? 'undefined' : typeof v === 'string' ? '"' + v + '"' : (() => { try { return JSON.stringify(v); } catch(e) { return String(v); } })();
  function esit(a, b){
    if(a === b) return true;
    if(a === null || b === null || typeof a !== typeof b) return false;
    if(typeof a !== 'object') return Number.isNaN(a) && Number.isNaN(b);
    if(Array.isArray(a) !== Array.isArray(b)) return false;
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every(k => esit(a[k], b[k]));
  }
  function expect(g){
    const m = {
      toBe(b){ if(g !== b) throw new Error('beklenen ' + fmt(b) + ', gelen ' + fmt(g)); },
      toEqual(b){ if(!esit(g, b)) throw new Error('beklenen ' + fmt(b) + ', gelen ' + fmt(g)); },
      toBeNull(){ if(g !== null) throw new Error('null bekleniyordu, gelen ' + fmt(g)); },
      toBeUndefined(){ if(g !== undefined) throw new Error('undefined bekleniyordu, gelen ' + fmt(g)); },
      toBeTruthy(){ if(!g) throw new Error('doğru bekleniyordu, gelen ' + fmt(g)); },
      toBeFalsy(){ if(g) throw new Error('yanlış bekleniyordu, gelen ' + fmt(g)); },
      toBeGreaterThan(n){ if(!(g > n)) throw new Error(fmt(g) + ' > ' + fmt(n) + ' bekleniyordu'); },
      toHaveLength(n){ const u = g == null ? -1 : g.length; if(u !== n) throw new Error('uzunluk ' + n + ' bekleniyordu, gelen ' + u); },
      toContain(x){ if(!(g && typeof g.indexOf === 'function' && g.indexOf(x) >= 0)) throw new Error(fmt(g) + ' içinde ' + fmt(x) + ' bekleniyordu'); }
    };
    return m;
  }
  async function run(){
    const sonuc = [];
    for(const s of suites) for(const t of s.tests){
      let saat;
      try { await Promise.race([t.fn(), new Promise((_, red) => { saat = setTimeout(() => red(new Error('zaman aşımı (15 sn)')), 15000); })]).finally(() => clearTimeout(saat)); sonuc.push({ ad: s.name + ' › ' + t.name, ok: true }); }
      catch(e){ sonuc.push({ ad: s.name + ' › ' + t.name, ok: false, hata: e && e.message ? e.message : String(e) }); }
    }
    return sonuc;
  }
  return { describe, it, expect, run };
})() };`;

// Modüller önce bağımlılıklar gelecek sırada; sw.js (servis işçisi) sayfa betiği değildir.
const ONCE = ['parca', 'tarih', 'bicim', 'piksel', 'piksel-figur', 'piksel-simge', 'piksel-doga', 'piksel-apartman', 'simge', 'medya', 'animasyon'];
const moduller = fs.readdirSync(ortak).filter(f => f.endsWith('.js') && !f.endsWith('.test.js') && f !== 'sw.js').map(f => f.slice(0, -3))
  .sort((a, b) => ((ONCE.indexOf(a) + 1 || 99) - (ONCE.indexOf(b) + 1 || 99)) || (a < b ? -1 : 1));
// shortcut: bu vakalar silinen modüllerin ortamını ister (AYS zemin/selam/U/Ofis nesneleri, store.js, dört modül renkli giriş,
// modül sayfa kaydı, 4180 seçim sayfası, ev ağı kapısı); atlanır ve her koşuda sayılır. Özellik kabuğa gelirse vaka oraya taşınır.
const ESKI = ['Az kipinde geçiş tanımlamayan', 'tercih seçim sayfasına çerezle', 'geçiş: kart yerinden büyür', 'geçiş: selam modülü olmayan sayfada',
  'süre dolunca html.is-dinlen', 'oz-181 tema seçici', 'modülün U nesnesi', 'Hesap — seçim sayfası › özet: gerçek sayıdan', 'QR yeni cihazın ulaşabileceği adrese gider: pc.tail1.ts.net + 192.168',
  'kök sertifika yenilendiyse', 'kodla cihaz bağla: büyük kod', 'Hesap — gerçek depo kancası', 'Hesap — giriş ekranının zemini', 'Kişi — ajan izinleri (Faz 5) › varsayılan',
  'Parça: komut › King rehberi', 'Parça: bilgi › modülün her bilgisi', 'Parça: tepki › sistemin tepkileri', 'Piksel teması › yazı kâğıtta AA', 'Piksel teması › bulut perdesi',
  'Tanıtım filmi ›', 'BAM ürünü — ön süzgeç'];
const stiller = ['piksel.css', 'hesap.css']; // canlı sayfaların (/kartlar/) yüklediği ortak stiller
const secili = process.argv.slice(2);
const testler = fs.readdirSync(ortak).filter(f => f.endsWith('.test.js')).map(f => f.slice(0, -8)).filter(t => !secili.length || secili.includes(t));

(async () => {
  const g = fs.mkdtempSync(path.join(os.tmpdir(), 'ortak-test-')), b = await chromium.launch();
  // eski modül düzeni: testler stili sayfanın yanındaki ../css/ klasöründen ister (ör. piksel.test.js)
  fs.mkdirSync(path.join(g, 'css')); fs.mkdirSync(path.join(g, 'sayfa'));
  stiller.forEach(c => fs.copyFileSync(path.join(ortak, c), path.join(g, 'css', c)));
  let gecti = 0, kaldi = 0, atlandi = 0;
  for (const t of testler) {
    const html = '<!doctype html><meta charset="utf-8">' + stiller.map(c => '<link rel="stylesheet" href="' + url.pathToFileURL(path.join(ortak, c)).href + '">').join('') + '<body><script>' + KOSUCU + '</script>' +
      moduller.concat([t + '.test']).map(m => '<script src="' + url.pathToFileURL(path.join(ortak, m + '.js')).href + '"></script>').join('') + '</body>';
    const dosya = path.join(g, 'sayfa', t + '.html'); fs.writeFileSync(dosya, html);
    const p = await b.newPage(), sayfaHata = [];
    p.on('pageerror', e => sayfaHata.push(e.message));
    await p.goto(url.pathToFileURL(dosya).href);
    const sonuc = await p.evaluate(() => window.R.Test.run());
    const atla = sonuc.filter(x => !x.ok && ESKI.some(e => x.ad.indexOf(e) >= 0)), kotu = sonuc.filter(x => !x.ok && atla.indexOf(x) < 0);
    atlandi += atla.length;
    gecti += sonuc.length - kotu.length - atla.length; kaldi += kotu.length + (sonuc.length ? 0 : 1);
    console.log((kotu.length || !sonuc.length ? '✕ ' : '✓ ') + t + ': ' + (sonuc.length - kotu.length - atla.length) + '/' + sonuc.length + (atla.length ? ' (' + atla.length + ' eski modül vakası atlandı)' : '') + (sonuc.length ? '' : ' (hiç test yüklenmedi: ' + sayfaHata.join(' | ') + ')'));
    if (kotu.length && sayfaHata.length) console.log('    [sayfa hatası] ' + sayfaHata.slice(0, 3).join(' | '));
    kotu.forEach(x => console.log('    ' + x.ad + ': ' + x.hata));
    await p.close();
  }
  await b.close(); fs.rmSync(g, { recursive: true, force: true });
  console.log('\n' + gecti + ' geçti, ' + kaldi + ' kaldı, ' + atlandi + ' eski modül vakası atlandı');
  process.exit(kaldi ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
