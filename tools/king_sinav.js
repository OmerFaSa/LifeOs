#!/usr/bin/env node
/* KING SINAVI (King 4.0 A5, belgeler/ekip/KING-4.md): gerçek Türkçe cümleler ve
   her biri için beklenen karar. Bugünkü King'e karşı koşar, puanı yazdırır.

     node tools/king_sinav.js            # üç modül, puan ve kalan cümleler
     node tools/king_sinav.js --araclar  # modüllerin araç kaydını dök (beklenen yazarken)
     node tools/king_sinav.js --port=4379  # AYS 4379, SPİ 4389, ESP 4399 (ofis portları; varsayılan 4176)
     node tools/king_sinav.js --adlar    # araç adları ve rotalar, JSON { modül: { araclar, rotalar } } (kabul testleri)
     node tools/king_sinav.js --modul=ays --json   # tek modül; sonuç JSON [{ c, ok, karar }] (kabul testleri)

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
const PORT = Number((process.argv.find(x => x.startsWith('--port=')) || '').slice(7)) || 4176;   // ofis: --port=4379
const MODUL = { ays:['AYS', PORT], spi:['SPI', PORT + 10], esp:['ESP', PORT + 20] };
const ADLAR = process.argv.includes('--adlar');
const ARACLAR = ADLAR || process.argv.includes('--araclar');
const YALNIZ = (process.argv.find(x => x.startsWith('--modul=')) || '').slice(8);
const JSON_CIKTI = process.argv.includes('--json');
const adlar = {};

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
    /* Gerçek aracIsle gibi: doğrulamayı geçmeyen seçim (eksik parametreli yazma) karar
       değildir, akış sürer (3a: önceden parametresiz yazma aracı da puan alıyordu). */
    KI.aracIsle = async r => {
      const l = (r.arac || []).filter(a => LIFEOS.ARAC.dogrula(a.ad, a.param || a.arg || {}).ok);
      if(!l.length) return null;
      l.forEach(a => S.kayit.push({ arac:a.ad, a:a.param || a.arg || {} }));
      return { tur:'arac' };
    };
    KI.baglanti = () => ({ url:'http://127.0.0.1:1', token:'sinav' });
    const tasima = KI.tasimaYaz;
    KI.tasimaYaz = (x, h) => { S.tasima = h && h.route; return tasima(x, h); };
    /* Yetki kataloğunun anladığı iş yakalanır, uygulanmaz (tema, eylem). */
    const yk = KI.yetkiKatalog;
    KI.yetkiKatalog = () => { const Y = yk(); return Y && Object.assign(Object.create(Y), { anla:m => (S.yetki = Y.anla(m)) }); };
    KI.yetkiUygula = async () => {};
    /* Anlatımdaki kayıtlar kartı (söz 35) bir veri önizlemesidir. */
    const bg = KI.bulunanGoster;
    KI.bulunanGoster = (o, b) => { S.kayit.push('veri'); return bg(o, b); };
  }
  const S = window.__sinav;
  S.kayit = []; S.tasima = null; S.yetki = null;
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
  /* İlk karar kayıttaki ilk olaydır: Merkez'e sorulup cevap gelmeyince açılan
     sayfa yedektir, karar değil. */
  const ilk = S.kayit[0];
  const arac = ilk && ilk.arac ? ilk : null;
  const eylem = S.yetki && S.yetki.tur === 'eylem' && 'eylem_' + String(S.yetki.id).replace(/[^a-z0-9]+/g, '_');
  let karar;
  if(arac) karar = 'arac:' + arac.arac;
  else if(ilk === 'komut') karar = 'arac:merkez_raporu';   // Merkez'in hafta/çapraz raporu
  else if(ilk) karar = ilk;                                 // git:… ya da merkez
  else if(KI.bekleyenGit) karar = 'git:' + KI.bekleyenGit.modul + ':' + KI.bekleyenGit.route;
  else if(KI.bekleyen) karar = 'veri';
  else if(eylem && LIFEOS.ARAC.liste().some(a => a.ad === eylem)) karar = 'arac:' + eylem;   // yetki eylemi = eylem_ aracı
  else if(r && r.tur === 'arac-sor') karar = 'arac:' + r.ad;   // araç seçildi, eksik parametresi soruldu (§1.7)
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

/* PORT MUHAFIZI: tools/nerede.js ile ayni; port doluysa denetim hic baslamaz (cikis 2). */
function portDolu(port){
  const dene = host => new Promise(r => {
    const s = require('net').connect({ host, port });
    s.setTimeout(1000, () => { s.destroy(); r(false); });
    s.once('connect', () => { s.destroy(); r(true); });
    s.once('error', () => r(false));
  });
  return Promise.all([dene('127.0.0.1'), dene('::1')]).then(x => x.some(Boolean));
}
async function portMuhafizi(portlar){
  const dolu = [];
  for(const p of portlar) if(await portDolu(p)) dolu.push(p);
  if(!dolu.length) return;
  console.error('Port dolu: ' + dolu.join(', ') + ' — baska bir kosu kullaniyor; o bitince yeniden kos ya da --port= ver.');
  process.exit(2);
}

(async () => {
  await portMuhafizi(Object.keys(MODUL).filter(m => !YALNIZ || m === YALNIZ).map(m => MODUL[m][1]));
  const sinav = JSON.parse(fs.readFileSync(path.join(__dirname, 'king_sinav.json'), 'utf8'));
  const sonuc = [];
  let browser;
  try{
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath:process.env.CHROMIUM_PATH } : {});
    for(const [m, [dizin, port]] of Object.entries(MODUL)){
      if(YALNIZ && YALNIZ !== m) continue;
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
        if(ADLAR) adlar[m] = await page.evaluate(() => ({ araclar:LIFEOS.ARAC.liste().map(a => a.ad),
          rotalar:LIFEOS.KING_IC.SAYFALAR.map(s => s.modul + ':' + s.route) }));
        else if(ARACLAR) console.log('== ' + m + '\n' + await page.evaluate(() => {
          const A = LIFEOS.ARAC, h = A && A.harita ? A.harita([]) : null;
          return typeof h === 'string' ? h : JSON.stringify(h, null, 1);
        }));
        for(const s of ARACLAR ? [] : liste){
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
  if(ADLAR) console.log(JSON.stringify(adlar));
  if(ARACLAR) return;

  if(JSON_CIKTI){ console.log(JSON.stringify(sonuc.map(s => ({ c:s.c, ok:s.ok, karar:s.karar })))); return; }
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
