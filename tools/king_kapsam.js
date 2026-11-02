#!/usr/bin/env node
/* KING KAPSAM TESTİ (King 4.0 A2, belgeler/ekip/KING-4.md): ekranda yapılan her iş
   King'de bir araçla yapılabiliyor mu?

     node tools/king_kapsam.js             # üç modül; eksik varsa çıkış 1
     node tools/king_kapsam.js --port=4379 # AYS 4379, SPİ 4389, ESP 4399 (ofis portları)
     node tools/king_kapsam.js --modul=spi # yalnız bir modül
     node tools/king_kapsam.js --iskelet   # modüllerin yazma işlevleri ve rotaları (eşleme yazarken)

   Eşleme tools/king_kapsam.json'da: her modül için
     yazma: { "<Model işlevi>": "<araç adı>" | "-: <neden>" }   kullanıcı verisini yazan her işlev
     rotalar: { "<rota>": ["<araç>", …] | "-: <neden>" }         ekranın okuduğu iş
   Kırmızı: modülün Model'inde eşlemesiz bir yazma işlevi ya da gezinmede eşlemesiz bir
   rota var (yeni ekran işi araçsız kalmasın), ya da eşlemedeki araç modülün araç
   kaydında yok. «-» yalnız King'in işi olmayan iç işlevler ve içerik sayfaları içindir. */

const { spawn } = require('child_process');
const fs = require('fs');
const GUVEN = require('./king_guven');
const path = require('path');

const KOK = path.resolve(__dirname, '..');
const PORT = Number((process.argv.find(x => x.startsWith('--port=')) || '').slice(7)) || 4177;
const MODUL = { ays:['AYS', PORT, 'R'], spi:['SPI', PORT + 10, 'SP'], esp:['ESP', PORT + 20, 'ESP'] };
const ISKELET = process.argv.includes('--iskelet');
const TEK = (process.argv.find(x => x.startsWith('--modul=')) || '').slice(8);   // yalnız bir modül (ofis kabul testleri)
const YAZMA_RE = '^(save|add|delete|remove|set|update|toggle|mark|upsert)';

let chromium;
try{ ({ chromium } = require(path.join(KOK, 'SPI', 'node_modules', 'playwright'))); }
catch(e){ console.error('Playwright yok (SPI/node_modules).'); process.exit(2); }

const bekle = url => new Promise((ok, red) => {
  const dene = n => fetch(url).then(r => r.arrayBuffer()).then(() => ok(), () => n ? setTimeout(() => dene(n - 1), 200) : red(new Error('sunucu açılmadı: ' + url)));
  dene(50);
});

/* Sayfada: Model'in yazma işlevleri, gezinmedeki rotalar, araç kaydı. */
function topla([ns, re]){
  const N = window[ns], M = N.Model, R = new RegExp(re);
  const yazma = Object.keys(M).filter(k => typeof M[k] === 'function' && R.test(k)).sort();
  const S = N.App && (N.App.SECTIONS || N.App.NAV);
  const bolumler = typeof S === 'function' ? S() : S || [];
  const rotalar = [].concat.apply([], bolumler.map(b => (b.views || b.items || []).map(v => v.route || v.id))).filter(Boolean);
  return { yazma, rotalar, araclar:LIFEOS.ARAC.liste().map(a => a.ad) };
}

(async () => {
  const esleme = ISKELET ? {} : JSON.parse(fs.readFileSync(path.join(__dirname, 'king_kapsam.json'), 'utf8'));
  const eksik = [], iskelet = {};
  let browser;
  try{
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath:process.env.CHROMIUM_PATH } : {});
    for(const [m, [dizin, port, ns]] of Object.entries(MODUL)){
      if(TEK && m !== TEK) continue;
      const sunucu = spawn('python3', [path.join(KOK, dizin, 'devserver.py'), String(port)], { cwd:path.join(KOK, dizin), stdio:'ignore' });
      try{
        await bekle('http://127.0.0.1:' + port + '/');
        const page = await browser.newPage();
        await page.goto('http://127.0.0.1:' + port + '/', { waitUntil:'load' });
        await page.waitForFunction(() => window.LIFEOS && LIFEOS.ARAC && LIFEOS.KING_IC && LIFEOS.KING_IC.ayar, null, { timeout:60000 });
        const d = await page.evaluate(topla, [ns, YAZMA_RE]);
        const gv = await page.evaluate(GUVEN.sayfadanTopla);                                      // KING-4 §G
        GUVEN.denetle(gv).forEach(b => eksik.push(m + ' güven ' + b));
        console.log(m + ' güven: ' + ['oku', 'yaz', 'dis'].map(k => gv.filter(a => (a.dis ? 'dis' : a.tur) === k).length + ' ' + k).join(', '));
        await page.close();
        if(ISKELET){ iskelet[m] = { yazma:d.yazma, rotalar:d.rotalar }; continue; }
        const e = esleme[m] || {}, yz = e.yazma || {}, rt = e.rotalar || {};
        const var_ = a => d.araclar.indexOf(a) >= 0;
        const neden = x => typeof x === 'string' && /^-:\s*\S/.test(x);
        d.yazma.forEach(f => {
          const a = yz[f];
          if(a == null) eksik.push(m + ' yazma ' + f + ': eşleme yok');
          else if(!neden(a) && !var_(a)) eksik.push(m + ' yazma ' + f + ' → ' + a + ': araç kaydında yok');
        });
        d.rotalar.forEach(r => {
          const l = rt[r];
          if(l == null) eksik.push(m + ' rota ' + r + ': eşleme yok');
          else if(!neden(l)) (Array.isArray(l) && l.length ? l : ['(boş)']).filter(a => !var_(a)).forEach(a => eksik.push(m + ' rota ' + r + ' → ' + a + ': araç kaydında yok'));
        });
        const say = Object.values(yz).filter(a => !neden(a)).length;
        console.log(m + ': ' + d.yazma.length + ' yazma işlevi (' + say + ' araçla), ' + d.rotalar.length + ' rota, ' + d.araclar.length + ' araç');
      }finally{ sunucu.kill(); }
    }
  }catch(e){
    console.error('Koşulamadı:', e && e.message || e);
    process.exit(2);
  }finally{ if(browser) await browser.close(); }
  if(ISKELET){ console.log(JSON.stringify(iskelet, null, 1)); return; }
  eksik.forEach(x => console.log('✕ ' + x));
  console.log(eksik.length ? '\nKing kapsamı: ' + eksik.length + ' eksik' : '\nKing kapsamı: tam');
  process.exit(eksik.length ? 1 : 0);
})();
