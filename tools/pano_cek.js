#!/usr/bin/env node
/* Yeniden kullanilabilir gorsel cekim, arayuz denetimi ve Once/Sonra pano araci.
 *
 * Kullanim:
 *   node tools/pano_cek.js cek --yer=bugun,ayarlar --boy=1280x800:koyu,390x844:acik --cikti=/tmp/a [--tam] [--kati]
 *   node tools/pano_cek.js birlestir --once=/tmp/a --sonra=/tmp/b --cikti=/tmp/pano [--baslik="Tur"]
 *
 * Playwright yalniz `cek` / `birlestir` calistirilinca yuklenir; `--yardim` ve `require('./tools/pano_cek.js')`
 * Playwright'siz calisir (tools/playwrightsiz.test.js kurali).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const KOK = path.resolve(__dirname, '..');
const VARSAYILAN_YER = ['bugun', 'ayarlar'];
const VARSAYILAN_BOY = [
  { w: 1280, h: 800, tema: 'koyu', etiket: '1280x800-koyu' },
  { w: 390, h: 844, tema: 'acik', etiket: '390x844-acik' },
];

const YARDIM = [
  'Kullanım:',
  '  node tools/pano_cek.js cek --yer=bugun,ayarlar --boy=1280x800:koyu,390x844:acik --cikti=<dizin> [--tam] [--kati]',
  '  node tools/pano_cek.js birlestir --once=<dizin> --sonra=<dizin> --cikti=<dizin> [--baslik=<metin>]',
  '',
  'Bayraklar:',
  '  --yer=...     Virgülle ayrılmış kabuk rotaları (varsayılan: bugun,ayarlar)',
  '  --boy=...     GxY:(acik|koyu) listesi (varsayılan: 1280x800:koyu,390x844:acik)',
  '  --cikti=...   PNG ve denetim.json çıktı klasörü (zorunlu)',
  '  --tam         Tam sayfa (fullPage) ekran görüntüsü alır',
  '  --kati        Taşma, <40px mobil dokunma alanı ya da konsol hatasında çıkış 1 verir',
  '  --bekle=MS    Rota sonrası ek bekleme milisaniyesi (varsayılan: 120, en çok: 10000)',
  '  --once=...    birlestir: Önce PNG klasörü',
  '  --sonra=...   birlestir: Sonra PNG klasörü',
  '  --baslik=...  birlestir: Pano başlığı',
].join('\n');

function htmlKacis(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function yerTemizle(ham) {
  const s = String(ham || '').trim().replace(/^#?\/+/, '');
  if (!s || s.includes('..') || /[\x00-\x1f\s]/.test(s)) {
    throw new Error('Geçersiz --yer rotası: ' + ham);
  }
  return s;
}

function yerDosyaAdi(yer) {
  const s = String(yer || '')
    .trim()
    .replace(/^#?\/+/, '')
    .replace(/[/?&=:%]+/g, '-')
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return s || 'ekran';
}

function boyCoz(metin) {
  const parcalar = String(metin || '').split(',').map(x => x.trim()).filter(Boolean);
  if (!parcalar.length) throw new Error('--boy en az bir GxY:(acik|koyu) içermeli.');
  return parcalar.map(p => {
    const m = /^(\d+)x(\d+):(acik|koyu)$/i.exec(p);
    if (!m) throw new Error('Geçersiz --boy biçimi (beklenen GxY:acik|koyu): ' + p);
    const w = Number(m[1]), h = Number(m[2]), tema = m[3].toLowerCase();
    if (w < 200 || w > 4000 || h < 200 || h > 4000) {
      throw new Error('Görünüm boyutu 200..4000 aralığında olmalı: ' + p);
    }
    return { w, h, tema, etiket: `${w}x${h}-${tema}` };
  });
}

function bayraklariOku(args, degerli, bayraksiz) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith('--')) throw new Error('Beklenmeyen argüman: ' + a);
    const eq = a.indexOf('=');
    const ad = (eq >= 0 ? a.slice(2, eq) : a.slice(2));
    if (bayraksiz.has(ad)) {
      if (eq >= 0) throw new Error('--' + ad + ' değer almaz.');
      out[ad] = true;
      continue;
    }
    if (!degerli.has(ad)) throw new Error('Bilinmeyen bayrak: --' + ad);
    let val = eq >= 0 ? a.slice(eq + 1) : args[++i];
    if (val === undefined || (eq < 0 && val.startsWith('--'))) {
      throw new Error('--' + ad + ' bir değer ister.');
    }
    out[ad] = val;
  }
  return out;
}

function ayristirArg(argv) {
  const args = Array.isArray(argv) ? argv.slice() : [];
  if (!args.length || args.includes('--yardim') || args.includes('-h') || args[0] === 'yardim') {
    return { komut: 'yardim' };
  }
  const komut = args.shift();
  if (komut === 'cek') {
    const f = bayraklariOku(args, new Set(['yer', 'boy', 'cikti', 'bekle']), new Set(['tam', 'kati']));
    if (!f.cikti || !String(f.cikti).trim()) throw new Error('cek için --cikti zorunludur.');
    const yerler = f.yer ? f.yer.split(',').map(x => x.trim()).filter(Boolean).map(yerTemizle) : VARSAYILAN_YER.slice();
    if (!yerler.length) throw new Error('--yer boş olamaz.');
    const boylar = f.boy ? boyCoz(f.boy) : VARSAYILAN_BOY.map(b => Object.assign({}, b));
    const bekle = f.bekle !== undefined ? Number(f.bekle) : 120;
    if (!Number.isInteger(bekle) || bekle < 0 || bekle > 10000) {
      throw new Error('--bekle 0..10000 tam sayı olmalı.');
    }
    return {
      komut: 'cek',
      yerler,
      boylar,
      cikti: f.cikti.trim(),
      tam: Boolean(f.tam),
      kati: Boolean(f.kati),
      bekle,
    };
  }
  if (komut === 'birlestir') {
    const f = bayraklariOku(args, new Set(['once', 'sonra', 'cikti', 'baslik']), new Set());
    if (!f.once || !f.sonra || !f.cikti) {
      throw new Error('birlestir için --once, --sonra ve --cikti zorunludur.');
    }
    return {
      komut: 'birlestir',
      once: f.once.trim(),
      sonra: f.sonra.trim(),
      cikti: f.cikti.trim(),
      baslik: (f.baslik || 'Önce / Sonra').trim(),
    };
  }
  throw new Error('Bilinmeyen komut: ' + komut + ' (cek | birlestir)');
}

function eslestir(onceAdlar, sonraAdlar) {
  const temiz = l => Array.from(new Set((l || []).filter(x => typeof x === 'string' && x.toLowerCase().endsWith('.png'))))
    .sort((a, b) => a.localeCompare(b, 'en'));
  const a = temiz(onceAdlar);
  const b = temiz(sonraAdlar);
  const bSet = new Set(b);
  const aSet = new Set(a);
  return {
    eslesen: a.filter(x => bSet.has(x)),
    yalnizOnce: a.filter(x => !bSet.has(x)),
    yalnizSonra: b.filter(x => !aSet.has(x)),
  };
}

function panoHtml({ ad, baslik, onceVeri, sonraVeri }) {
  const kokAd = String(ad || '').replace(/\.png$/i, '');
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 16px; background: #0b0d12; color: #eef2f7; font-family: system-ui, -apple-system, Segoe UI, sans-serif; }
  #pano { display: inline-block; background: #11151d; border: 1px solid #262e3d; border-radius: 10px; padding: 18px; min-width: 640px; }
  .ust { display: flex; justify-content: space-between; align-items: baseline; gap: 24px; padding-bottom: 12px; margin-bottom: 14px; border-bottom: 2px solid #c84b31; }
  .baslik { font-size: 16px; font-weight: 700; letter-spacing: .01em; }
  .ad { font-size: 13px; color: #9aa7bd; font-family: ui-monospace, Consolas, monospace; }
  .izgara { display: grid; grid-template-columns: auto auto; gap: 18px; align-items: start; }
  .kart { background: #171c26; border: 1px solid #2b3547; border-radius: 8px; padding: 10px; }
  .etiket { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: .08em; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px; }
  .once { background: #2d3340; color: #d5dce8; }
  .sonra { background: #1f4d36; color: #c4f3d7; }
  img { display: block; max-width: 960px; height: auto; border: 1px solid #222938; border-radius: 4px; }
</style>
</head>
<body>
  <div id="pano">
    <div class="ust">
      <div class="baslik">${htmlKacis(baslik)}</div>
      <div class="ad">${htmlKacis(kokAd)}</div>
    </div>
    <div class="izgara">
      <div class="kart">
        <div class="etiket once">ÖNCE</div>
        <img src="${htmlKacis(onceVeri)}" alt="Önce">
      </div>
      <div class="kart">
        <div class="etiket sonra">SONRA</div>
        <img src="${htmlKacis(sonraVeri)}" alt="Sonra">
      </div>
    </div>
  </div>
</body>
</html>`;
}

function ozetle(sonuclar) {
  const s = Array.isArray(sonuclar) ? sonuclar : [];
  let tasmali = 0, kucukDokunmali = 0, hatali = 0;
  for (const x of s) {
    if (x.yatayTasma) tasmali++;
    if (x.kucukDokunma && x.kucukDokunma.length) kucukDokunmali++;
    if ((x.sayfaHata && x.sayfaHata.length) || (x.konsolHata && x.konsolHata.length)) hatali++;
  }
  return {
    toplam: s.length,
    tasmali,
    kucukDokunmali,
    hatali,
    temiz: tasmali === 0 && kucukDokunmali === 0 && hatali === 0,
  };
}

function playwrightYukle() {
  try {
    return require(path.join(KOK, 'tools', 'node_modules', 'playwright'));
  } catch (e) {
    throw new Error('Playwright yüklenemedi (tools/node_modules/playwright gerekir): ' + e.message);
  }
}

async function cek(ayar) {
  const { chromium } = playwrightYukle();
  const { sunucuAc } = require('./gez_sunucu.js');
  const ciktiDir = path.resolve(ayar.cikti);
  fs.mkdirSync(ciktiDir, { recursive: true });

  const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'pano-cek-'));
  const env = Object.assign({}, process.env, {
    PYTHONIOENCODING: 'utf-8',
    PYTHONUTF8: '1',
    PYTHONDONTWRITEBYTECODE: '1',
    LOCALAPPDATA: gecici,
    APPDATA: gecici,
    LIFEOS_TASIMA: '1',
    LIFEOS_HESAP_KLASOR: path.join(gecici, 'LifeOS', 'hesap'),
  });

  const S = await sunucuAc({ kok: KOK, env, ad: 'pano-cek' });
  let tarayici = null;
  const sonuclar = [];
  try {
    await S.hazir();
    tarayici = await chromium.launch();
    const adSayac = new Map();
    const yolAdlari = ayar.yerler.map(y => {
      const ham = yerDosyaAdi(y);
      const n = (adSayac.get(ham) || 0) + 1;
      adSayac.set(ham, n);
      return n === 1 ? ham : `${ham}-${n}`;
    });

    for (let i = 0; i < ayar.yerler.length; i++) {
      const yer = ayar.yerler[i];
      const dosyaKok = yolAdlari[i];
      for (const boy of ayar.boylar) {
        const ctx = await tarayici.newContext({
          viewport: { width: boy.w, height: boy.h },
          colorScheme: boy.tema === 'koyu' ? 'dark' : 'light',
        });
        await ctx.addInitScript(() => {
          try { if (!localStorage.getItem('lifeos.hareket')) localStorage.setItem('lifeos.hareket', 'az'); } catch (e) {}
        });
        const p = await ctx.newPage();
        const sayfaHata = [];
        const konsolHata = [];
        p.on('pageerror', e => sayfaHata.push(e.message));
        p.on('console', m => {
          const locUrl = (m.location && m.location().url) || '';
          if (m.type() === 'error' && !/\/alan\/[a-z]+\/(asama-\d+|harita)\.json$|\/api\/hesap\/kabuk|\/api\/kabuk\/baslangic/.test(locUrl)) {
            konsolHata.push((locUrl ? locUrl + ': ' : '') + m.text());
          }
        });
        try {
          await p.goto(`${S.T}/kabuk/#/${yer}`, { waitUntil: 'load' });
          await p.waitForFunction(() => {
            const g = document.querySelector('#govde') || document.body;
            return g && g.innerText.trim().length > 0;
          }, { timeout: 5000 }).catch(() => {});
          await p.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
          await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
          if (ayar.bekle > 0) await p.waitForTimeout(ayar.bekle);

          const olcum = await p.evaluate(w => {
            const scrollWidth = document.documentElement.scrollWidth;
            const innerWidth = window.innerWidth;
            const kucukDokunma = [];
            if (w <= 480) {
              const sec = 'button, [role="button"], [role="tab"], input:not([type="hidden"]), select, a.btn, nav a, .altbar__oge';
              for (const el of document.querySelectorAll(sec)) {
                const hedef = (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio') && el.closest('label')) || el;
                const st = getComputedStyle(hedef);
                if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') continue;
                const r = hedef.getBoundingClientRect();
                if (r.width <= 0 || r.height <= 0) continue;
                if (r.width < 39.5 || r.height < 39.5) {
                  kucukDokunma.push({
                    etiket: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).trim().split(/\s+/).slice(0, 2).join('.') : ''),
                    metin: (hedef.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40),
                    w: Math.round(r.width),
                    h: Math.round(r.height),
                  });
                  if (kucukDokunma.length >= 10) break;
                }
              }
            }
            return { scrollWidth, innerWidth, yatayTasma: scrollWidth > innerWidth, kucukDokunma };
          }, boy.w);

          const dosya = `${dosyaKok}-${boy.etiket}.png`;
          await p.screenshot({ path: path.join(ciktiDir, dosya), fullPage: ayar.tam, animations: 'disabled' });
          const kayit = {
            yer,
            boy: boy.etiket,
            dosya,
            scrollWidth: olcum.scrollWidth,
            innerWidth: olcum.innerWidth,
            yatayTasma: olcum.yatayTasma,
            kucukDokunma: olcum.kucukDokunma,
            sayfaHata,
            konsolHata,
          };
          sonuclar.push(kayit);
          const sorun = olcum.yatayTasma || olcum.kucukDokunma.length || sayfaHata.length || konsolHata.length;
          console.log(`${sorun ? '✕' : '✓'} ${dosya} (genişlik ${olcum.scrollWidth}/${olcum.innerWidth}, dokunma:${olcum.kucukDokunma.length}, hata:${sayfaHata.length + konsolHata.length})`);
        } finally {
          await ctx.close();
        }
      }
    }
    const ozet = ozetle(sonuclar);
    fs.writeFileSync(path.join(ciktiDir, 'denetim.json'), JSON.stringify({ ozet, sonuclar }, null, 2) + '\n', 'utf8');
    return ayar.kati && !ozet.temiz ? 1 : 0;
  } finally {
    if (tarayici) await tarayici.close().catch(() => {});
    S.kapat();
    fs.rmSync(gecici, { recursive: true, force: true });
  }
}

async function birlestir(ayar) {
  const onceDir = path.resolve(ayar.once);
  const sonraDir = path.resolve(ayar.sonra);
  const ciktiDir = path.resolve(ayar.cikti);
  if (!fs.existsSync(onceDir) || !fs.existsSync(sonraDir)) {
    throw new Error('--once ve --sonra klasörleri var olmalı.');
  }
  const grup = eslestir(fs.readdirSync(onceDir), fs.readdirSync(sonraDir));
  if (!grup.eslesen.length) {
    throw new Error('Eşleşen PNG çifti bulunamadı.');
  }
  const { chromium } = playwrightYukle();
  fs.mkdirSync(ciktiDir, { recursive: true });
  const tarayici = await chromium.launch();
  try {
    const p = await tarayici.newPage({ viewport: { width: 2200, height: 1400 } });
    const yazilan = [];
    for (const ad of grup.eslesen) {
      const onceVeri = 'data:image/png;base64,' + fs.readFileSync(path.join(onceDir, ad)).toString('base64');
      const sonraVeri = 'data:image/png;base64,' + fs.readFileSync(path.join(sonraDir, ad)).toString('base64');
      await p.setContent(panoHtml({ ad, baslik: ayar.baslik, onceVeri, sonraVeri }), { waitUntil: 'load' });
      await p.evaluate(() => Promise.all(Array.from(document.images, img => (
        img.complete ? Promise.resolve() : new Promise(r => { img.onload = img.onerror = r; })
      ))));
      const ciktiAd = ad.replace(/\.png$/i, '') + '-pano.png';
      await p.locator('#pano').screenshot({ path: path.join(ciktiDir, ciktiAd), animations: 'disabled' });
      yazilan.push(ciktiAd);
      console.log('✓ ' + ciktiAd);
    }
    if (grup.yalnizOnce.length || grup.yalnizSonra.length) {
      console.log(`Not: eşleşmeyenler -> yalnız önce: ${grup.yalnizOnce.length}, yalnız sonra: ${grup.yalnizSonra.length}`);
    }
    return 0;
  } finally {
    await tarayici.close().catch(() => {});
  }
}

async function main() {
  const ayar = ayristirArg(process.argv.slice(2));
  if (ayar.komut === 'yardim') {
    console.log(YARDIM);
    return 0;
  }
  if (ayar.komut === 'cek') return cek(ayar);
  if (ayar.komut === 'birlestir') return birlestir(ayar);
  return 1;
}

module.exports = { ayristirArg, boyCoz, eslestir, htmlKacis, ozetle, panoHtml, YARDIM, yerDosyaAdi };

if (require.main === module) {
  main().then(kod => process.exit(kod)).catch(e => {
    console.error('✕ ' + (e && e.message ? e.message : e));
    process.exit(1);
  });
}
