#!/usr/bin/env node
/* KING SINAVI (King 4.0 A5, belgeler/ekip/KING-4.md): gerçek Türkçe cümleler ve
   her biri için beklenen karar. Bugünkü King'e karşı koşar, puanı yazdırır.

     node tools/king_sinav.js            # üç modül, puan ve kalan cümleler
     node tools/king_sinav.js --araclar  # modüllerin araç kaydını dök (beklenen yazarken)

   Cümleler tools/king_sinav.json'da: { m: söylendiği modül, c: cümle, b: kabul
   edilen kararlar, a?: araç argümanlarından beklenen alt küme }. Karar biçimi:
     git:<modül>:<rota>   sayfaya götürür (aynı modül ya da #king= adresi; «açayım mı?» da sayılır)
     veri                 modülün ayrıştırıcısıyla önizleme (kayıt yalnız onayla)
     arac:<ad>            araç kaydından araç seçer (yalnız seçim yakalanır, çalıştırılmaz)
     merkez               HKM'deki King'e sorar (açık soru, sohbet)
     tur:<tür>            yerel araç kutusu ve komutlar (hesap, birim, odak, hatirlat…)

   Sınav yalnız ölçer: hiçbir cümle kayıt yazmaz, HKM'ye gitmez (HKM bağlı sayılır,
   Merkez çağrısı yakalanır), sayfa değiştirmez. Çıkış her zaman 0; koşulamazsa 2.
   Modül sayfası tarayıcıda açılır (Playwright, runtests.js gibi). */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const KOK = path.resolve(__dirname, '..');
const MODUL = { ays:['AYS', 4176], spi:['SPI', 4186], esp:['ESP', 4196] };
const ARACLAR = process.argv.includes('--araclar');

let chromium;
try{ ({ chromium } = require(path.join(KOK, 'SPI', 'node_modules', 'playwright'))); }
catch(e){ console.error('Playwright yok (SPI/node_modules). Kurulum: cd SPI && npm i -D playwright'); process.exit(2); }

const bekle = url => new Promise((ok, red) => {
  const dene = n => fetch(url).then(r => r.arrayBuffer()).then(() => ok(), () => n ? setTimeout(() => dene(n - 1), 200) : red(new Error('sunucu açılmadı: ' + url)));
  dene(50);
});

/* Sayfada: King'i baştan kurar, dış etkileri yakalar, cümleyi işler, kararı döner. */
async function sor(c){
  const k = LIFEOS.KING, KI = LIFEOS.KING_IC;
  if(!window.__sinav){
    window.__sinav = { ayar:KI.ayar, kayit:[] };
    const S = window.__sinav;
    KI.merkezeSor = async m => { S.kayit.push(m === 'hafta' || m === 'capraz' ? 'komut' : 'merkez'); return { ok:false, neden:'baglanti' }; };
    KI.aracIsle = async r => { (r.arac || []).forEach(a => S.kayit.push({ arac:a.ad, a:a.param || a.arg || {} })); return { tur:'arac' }; };
    KI.baglanti = () => ({ url:'http://127.0.0.1:1', token:'sinav' });
    const tasima = KI.tasimaYaz;
    KI.tasimaYaz = (x, h) => { S.tasima = h && h.route; return tasima(x, h); };
  }
  const S = window.__sinav;
  S.kayit = []; S.tasima = null;
  k._sifirla();
  Object.assign(KI.ortam, {
    zamanla:fn => fn(), hash:() => '', hashSil:() => {},
    adres:m => 'http://' + m + '.sinav/',
    git:u => { const m = /^http:\/\/(\w+)\.sinav\/(?:#king=([^:&]+))?/.exec(u); if(m) S.kayit.push('git:' + m[1] + ':' + (m[2] || S.tasima)); },
  });
  k.kur(Object.assign({}, S.ayar, { git:r => S.kayit.push('git:' + S.ayar.modul + ':' + r) }));
  const t0 = performance.now();
  let r = null, hata = null;
  try{ r = await k.isle(c); }catch(e){ hata = String(e && e.message || e); }
  const ms = Math.round(performance.now() - t0);
  const kayit = S.kayit;
  const arac = kayit.find(x => x && x.arac);
  const git = kayit.find(x => typeof x === 'string' && x.startsWith('git:'));
  let karar;
  if(arac) karar = 'arac:' + arac.arac;
  else if(git) karar = git;
  else if(KI.bekleyenGit) karar = 'git:' + KI.bekleyenGit.modul + ':' + KI.bekleyenGit.route;
  else if(KI.bekleyen) karar = 'veri';
  else if(kayit.includes('komut')) karar = 'arac:merkez_raporu';   // Merkez'in hafta/çapraz raporu
  else if(kayit.includes('merkez')) karar = 'merkez';
  else karar = 'tur:' + (r && r.tur || (hata ? 'hata' : 'yok'));
  k._sifirla();
  k.kur(S.ayar);
  return { karar, arg:arac ? arac.a : null, ms, hata };
}

/* Yerelde çalışan komutlar araç kaydındaki işin aynısıdır: dönüş türü araç adına eşlenir. */
const TUR_ARAC = {
  oncelik:'arac:oncelik_listesi', 'oncelik-bos':'arac:oncelik_listesi', 'oncelik-yok':'arac:oncelik_listesi',
  yuk:'arac:yuk_durumu', 'yuk-yok':'arac:yuk_durumu',
  'not-cevap':'arac:not_ara', 'not-liste':'arac:not_ara', 'not-bos':'arac:not_ara', 'not-yok':'arac:not_ara',
  odak:'arac:odak_baslat', 'odak-dur':'arac:odak_durdur',
  'merkez-komut':'arac:merkez_raporu', 'merkez-yok':'arac:merkez_raporu',
  ozet:'arac:bugun_ozeti', harita:'arac:sistem_haritasi',
  'kart-soru':'arac:soru_sor', soru:'arac:soru_sor', 'kart-istatistik':'arac:istatistikler',
  ayar:'ayar', yetki:'ayar', 'yetki-bekliyor':'ayar', 'yetki-liste':'arac:onaylari_listele',
};
const esle = k => k.startsWith('tur:') && TUR_ARAC[k.slice(4)] || k;

function altKume(a, b){   // a'nın her anahtarı b'de aynı mı (dizgide büyük/küçük harf yok sayılır)
  return Object.keys(a).every(k => {
    const x = a[k], y = b ? b[k] : undefined;
    if(x && typeof x === 'object') return altKume(x, y);
    return String(x).toLocaleLowerCase('tr') === String(y).toLocaleLowerCase('tr');
  });
}

(async () => {
  const sinav = JSON.parse(fs.readFileSync(path.join(__dirname, 'king_sinav.json'), 'utf8'));
  const sonuc = [];
  let browser;
  try{
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath:process.env.CHROMIUM_PATH } : {});
    for(const [m, [dizin, port]] of Object.entries(MODUL)){
      const liste = sinav.cumleler.filter(s => s.m === m);
      if(!liste.length && !ARACLAR) continue;
      const sunucu = spawn('python3', [path.join(KOK, dizin, 'devserver.py'), String(port)], { cwd:path.join(KOK, dizin), stdio:'ignore' });
      try{
        await bekle('http://127.0.0.1:' + port + '/');
        const page = await browser.newPage({ timezoneId:'Europe/Istanbul' });
        const hatalar = [];
        page.on('pageerror', e => hatalar.push(String(e && e.message || e)));
        await page.goto('http://127.0.0.1:' + port + '/', { waitUntil:'load' });
        await page.waitForFunction(() => window.LIFEOS && LIFEOS.KING_IC && LIFEOS.KING_IC.ayar, null, { timeout:60000 })
          .catch(e => { throw new Error(m + ': King kurulmadı (' + e.message.split('\n')[0] + ')' + (hatalar.length ? ' · sayfa hatası: ' + hatalar.slice(0, 3).join(' | ') : '')); });
        if(ARACLAR) console.log('== ' + m + '\n' + await page.evaluate(() => {
          const A = LIFEOS.ARAC, h = A && A.harita ? A.harita([]) : null;
          return typeof h === 'string' ? h : JSON.stringify(h, null, 1);
        }));
        for(const s of liste){
          const r = await page.evaluate(sor, s.c);
          r.ham = r.karar; r.karar = esle(r.karar);
          const ok = s.b.includes(r.karar) && (!s.a || altKume(s.a, r.arg));
          sonuc.push(Object.assign({ ok }, s, r));
        }
        await page.close();
      }finally{ sunucu.kill(); }
    }
  }catch(e){
    console.error('Koşulamadı:', e && e.message || e);
    process.exit(2);
  }finally{ if(browser) await browser.close(); }
  if(ARACLAR) return;

  const gecen = sonuc.filter(s => s.ok).length;
  const grup = {};
  sonuc.forEach(s => { const g = grup[s.g || s.m] = grup[s.g || s.m] || [0, 0]; g[1]++; if(s.ok) g[0]++; });
  const ms = sonuc.map(s => s.ms).sort((a, b) => a - b);
  sonuc.filter(s => !s.ok).forEach(s => console.log('✕ [' + s.m + '] ' + s.c + '\n    beklenen ' + s.b.join(' | ')
    + (s.a ? ' ' + JSON.stringify(s.a) : '') + ' · gelen ' + s.karar + (s.ham !== s.karar ? ' (' + s.ham + ')' : '') + (s.arg ? ' ' + JSON.stringify(s.arg) : '') + (s.hata ? ' · hata ' + s.hata : '')));
  console.log('\nKing sınavı: ' + gecen + '/' + sonuc.length + ' (%' + Math.round(100 * gecen / sonuc.length) + ')');
  console.log(Object.entries(grup).map(([g, [a, b]]) => g + ' ' + a + '/' + b).join(' · '));
  console.log('gecikme (yerel karar): ortanca ' + ms[ms.length >> 1] + ' ms, en çok ' + ms[ms.length - 1] + ' ms');
})();
