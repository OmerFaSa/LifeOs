#!/usr/bin/env node
/* KAPSAM — birim testleri hangi işlevleri GERÇEKTEN çalıştırdı.
 *
 * ------------------------------------------------------------------
 * NEDEN BU ARAÇ VAR
 *
 * `NOTLAR.md` §13.3 bir kapsam tablosu taşıyor ve o tablo ELLE
 * yazılmıştı: «office.js %59», «state.js %73». Sayılar bir kez
 * ölçülmüş, sonra kod değişmeye devam etmişti. Bu deponun kendi
 * kuralı ise açık — sayılar elle yazılmaz, bir araç üretir
 * (`tools/sayilar.py`). Kapsam o kuralın dışında kalmıştı.
 *
 * Tablo bir de KARAR dayanağıydı: açık borçlar listesinde
 * «`AYS/core/office.js` 2049 satır · kapsam %59» yazıyor ve §19'un
 * sonu şöyle diyor: «Büyük dosyaları bölmek, testi olan bir hatayı
 * düzeltmekten daha risklidir. Önce kapsam, sonra bölme.» Ölçülmeyen
 * bir kapsamla o karar verilemez.
 *
 * ------------------------------------------------------------------
 * NASIL ÖLÇER
 *
 * Yeni bir bağımlılık YOK ve kaynak kod DEĞİŞTİRİLMEZ: Chromium'un
 * kendi kapsam sayacı (V8 precise coverage) kullanılır. Playwright
 * zaten denetim betikleri için kurulu.
 *
 *   1. `devserver.py` ayağa kalkar, `/tests/` sayfası açılır.
 *   2. Sayfa açılmadan ÖNCE `page.coverage.startJSCoverage` başlar.
 *   3. Testler biter (`window.__ROTA_TESTS__`).
 *   4. Kapsam durur; V8 her betik için işlev işlev sayaç verir.
 *
 * Ölçülen şey İŞLEV sayısıdır, satır değil. Sebebi: bu depoda bir
 * işlev bir karardır; «şu işlev hiç çağrılmadı» cümlesi «şu satıra
 * uğranmadı»dan daha çok şey söyler. Satır kapsamı ayrıca yanıltır —
 * uzun bir yorum bloğu kapsamı yükseltmez ama oranı değiştirir.
 *
 * ------------------------------------------------------------------
 * NE SAYILMAZ
 *
 *   · `js/data/` — katalog dosyaları. Orada işlev yok denecek kadar az
 *     ve olanlar da veri erişimcisi; kapsamları bir şey anlatmaz.
 *   · `tests/` — kendini ölçmek.
 *   · Anonim ve adsız işlevler SAYILIR ama adları «(anonim)» geçer:
 *     bir geri çağrının hiç koşmaması da bir bilgidir.
 *
 * ------------------------------------------------------------------
 * NASIL KULLANILIR
 *
 *   node tools/kapsam.js                # üç arayüz
 *   node tools/kapsam.js AYS            # tek arayüz
 *   node tools/kapsam.js AYS --ayrinti  # koşmamış işlevleri de yaz
 *   node tools/kapsam.js --esik 40      # eşiğin altı KIRMIZI (çıkış 1)
 *
 * Eşik verilmezse araç bir ÖLÇÜMDÜR, denetim değil: çıkış kodu 0.
 * Kırmızıya dönmeyen bir denetim denetim değildir (bkz. CI yorumu),
 * o yüzden eşik AÇIKÇA istenir — bugünkü kapsamı bir gecede eşiğe
 * çevirmek, bugünü yarının ölçütü yapmak olurdu.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const KOK = path.resolve(__dirname, '..');
const SISTEMLER = ['AYS', 'SPI', 'ESP'];

let chromium;
try{
  ({ chromium } = require(path.join(KOK, 'ESP', 'node_modules', 'playwright')));
}catch(e){
  try{ ({ chromium } = require('playwright')); }
  catch(e2){
    console.error('Playwright bulunamadi. Kurulum: <APP> icinde  npm ci');
    process.exit(2);
  }
}

function bekle(url, kalan){
  return new Promise((coz, red) => {
    const dene = n => {
      fetch(url).then(() => coz()).catch(() => {
        if(n <= 0) return red(new Error('sunucu acilmadi: ' + url));
        setTimeout(() => dene(n - 1), 200);
      });
    };
    dene(kalan == null ? 60 : kalan);
  });
}

/* Ölçülen dosya mı? `js/core/` ve `js/screens/` — biri motor, öteki
   ekran; ikisinin kapsamı ayrı ayrı anlamlı. */
function olculur(url){
  return /\/js\/(core|screens)\/[a-z0-9_]+\.js(\?|$)/i.test(url);
}

function dosyaAdi(url){
  const m = url.match(/\/js\/(core|screens)\/([a-z0-9_]+\.js)/i);
  return m ? (m[1] + '/' + m[2]) : url;
}

async function olc(sistem, port){
  const kok = path.join(KOK, sistem);
  const sunucu = spawn('python3', [path.join(kok, 'devserver.py'), String(port)],
    { cwd:kok, stdio:'ignore' });
  let tarayici;
  try{
    await bekle('http://127.0.0.1:' + port + '/tests/');
    tarayici = await chromium.launch(process.env.CHROMIUM_PATH
      ? { executablePath:process.env.CHROMIUM_PATH } : {});
    const sayfa = await tarayici.newPage({ reducedMotion:'reduce' });

    /* SAYFAYI AÇMADAN ÖNCE başlar: betikler yüklenirken koşan üst
       düzey kod da sayılsın. Sonra başlatılsaydı her modülün kendini
       kuran IIFE'si «koşmadı» görünürdü. */
    await sayfa.coverage.startJSCoverage();
    await sayfa.goto('http://127.0.0.1:' + port + '/tests/', { waitUntil:'load' });
    /* ÖZETİN ADI HER UYGULAMADA BAŞKA — ve bu bir tuzak oldu.

       AYS `window.__ROTA_TESTS__` yazıyor (ürün adı «Rota»), SPİ
       `__SPI_TESTS__`, ESP `__ESP_TESTS__`. Araç ilk hâlinde yalnız
       AYS'ninkini bekledi: SPİ'de testler BİTİYOR (sayfada «1047
       geçti» yazıyor) ama bekleme yedi dakika sonra zaman aşımına
       düşüyordu. Hata ölçümde değil, ölçenin varsayımındaydı. */
    const ozet = await sayfa.waitForFunction(() => window.__ROTA_TESTS__
      || window.__SPI_TESTS__ || window.__ESP_TESTS__, null,
      /* Kapsam sayaci acikken testler yavaslar: SPI'nin bin ekli testi
         120 saniyeyi asti. Sure denetimin kendisi degil, olcumun
         maliyeti — cömert tutuluyor. */
      { timeout:420000 }).then(h => h.jsonValue());
    const kapsam = await sayfa.coverage.stopJSCoverage();

    const dosyalar = new Map();
    for(const giris of kapsam){
      if(!olculur(giris.url || '')) continue;
      const ad = dosyaAdi(giris.url);
      const kayit = dosyalar.get(ad)
        || { ad, toplam:0, kosan:0, kosmayan:[] };
      for(const f of giris.functions || []){
        /* V8 her betik için bir de dosyanın KENDİSİNİ (üst düzey)
           işlev sayar; adı boştur. Onu ayrı saymak, her dosyaya
           bedava bir «koştu» eklemek olurdu. */
        if(!f.functionName) continue;
        kayit.toplam++;
        const say = (f.ranges && f.ranges[0] && f.ranges[0].count) || 0;
        if(say > 0) kayit.kosan++;
        else kayit.kosmayan.push(f.functionName);
      }
      /* İŞLEVİ OLMAYAN DOSYA ÖLÇÜLMEZ. `medya.js` üretilmiş bir künye:
         içinde tek bir işlev yok, yalnız bir nesne var. «%0» yazmak
         orada bir eksik değil bir YANLIŞ ANLAMA üretirdi — kapsanacak
         bir şey yok ki kapsanmamış olsun. */
      if(kayit.toplam > 0) dosyalar.set(ad, kayit);
    }
    await tarayici.close();
    return { sistem, test:ozet, dosyalar:[...dosyalar.values()] };
  }finally{
    if(tarayici) try{ await tarayici.close(); }catch(e){}
    sunucu.kill();
  }
}

function yuzde(k){ return k.toplam ? Math.round(100 * k.kosan / k.toplam) : 0; }

/* EŞİK KÜÇÜK DOSYAYA UYGULANMAZ. Üç işlevli bir dosyada bir işlevin
   koşmaması %33 eder ve o sayı bir şey anlatmaz; aynı oran yüz işlevli
   bir dosyada bir facia olurdu. Gürültüyü eşikten uzak tutmak, eşiğin
   söylediği şeye güvenilmesini sağlar. */
var ASGARI_ISLEV = 5;

function yaz(sonuc, ayrinti, esik){
  const { sistem, dosyalar } = sonuc;
  const core = dosyalar.filter(d => d.ad.startsWith('core/'));
  const scr = dosyalar.filter(d => d.ad.startsWith('screens/'));
  const topla = liste => liste.reduce((a, d) => ({
    toplam:a.toplam + d.toplam, kosan:a.kosan + d.kosan }), { toplam:0, kosan:0 });

  console.log('\n=== ' + sistem + ' ===');
  for(const [baslik, liste] of [['core', core], ['screens', scr]]){
    if(!liste.length) continue;
    const t = topla(liste);
    console.log('\n  ' + baslik + '  —  %' + yuzde(t)
      + '  (' + t.kosan + '/' + t.toplam + ' işlev)');
    liste.sort((a, b) => yuzde(a) - yuzde(b) || b.toplam - a.toplam);
    for(const d of liste){
      const p = yuzde(d);
      const isaret = esik != null && d.toplam >= ASGARI_ISLEV && p < esik ? '✕' : ' ';
      console.log('   ' + isaret + ' '
        + d.ad.replace(/^[a-z]+\//, '').padEnd(24)
        + ('%' + p).padStart(5) + '   '
        + (String(d.kosan) + '/' + String(d.toplam)).padStart(7));
      if(ayrinti && d.kosmayan.length){
        const ilk = d.kosmayan.slice(0, 12).join(', ');
        console.log('        koşmayan: ' + ilk
          + (d.kosmayan.length > 12 ? ' … (+' + (d.kosmayan.length - 12) + ')' : ''));
      }
    }
  }
  return topla(core);
}

(async () => {
  const arg = process.argv.slice(2);
  const ayrinti = arg.includes('--ayrinti');
  let esik = null;
  const ei = arg.indexOf('--esik');
  if(ei >= 0 && arg[ei + 1]) esik = Number(arg[ei + 1]);
  const hedef = arg.filter(a => !a.startsWith('--') && SISTEMLER.includes(a.toUpperCase()))
    .map(a => a.toUpperCase());
  const liste = hedef.length ? hedef : SISTEMLER;

  let kod = 0;
  let port = 4601;
  const ozetler = [];
  for(const s of liste){
    if(!fs.existsSync(path.join(KOK, s, 'devserver.py'))){
      console.log('atlandi: ' + s + ' (devserver.py yok)');
      continue;
    }
    const sonuc = await olc(s, port++);
    const t = yaz(sonuc, ayrinti, esik);
    ozetler.push({ sistem:s, ...t, test:sonuc.test });
    if(esik != null){
      const dusuk = sonuc.dosyalar.filter(d => d.ad.startsWith('core/')
        && d.toplam >= ASGARI_ISLEV && yuzde(d) < esik);
      if(dusuk.length) kod = 1;
    }
  }

  console.log('\n--- özet ---');
  for(const o of ozetler){
    const p = o.toplam ? Math.round(100 * o.kosan / o.toplam) : 0;
    console.log('  ' + o.sistem.padEnd(4)
      + ' core ' + ('%' + p).padStart(5)
      + '  ' + (o.kosan + '/' + o.toplam).padStart(9) + ' işlev'
      + '  ·  ' + (o.test && o.test.results ? o.test.results.length : 0) + ' test');
  }
  if(esik != null){
    console.log(esik + ' eşiğinin altında kalan (en az 5 işlevli) core dosyası '
      + (kod ? 'VAR' : 'yok') + '.');
  }else{
    console.log('Eşik verilmedi: bu bir ÖLÇÜMDÜR, denetim değil.');
  }
  process.exit(kod);
})().catch(e => {
  console.error('Koşum hatası:', e && e.message ? e.message : e);
  process.exit(2);
});
