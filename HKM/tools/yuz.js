#!/usr/bin/env node
/* HKM yuzu — erisilebilirlik, telefon duzeni ve kontrast denetimi.
 *
 * Uc arayuz a11ycheck, layoutcheck ve palettecheck'ten geciyor; HKM'nin
 * yuzu hicbirinden gecmiyordu. «Sade bir sayfa» olmasi onu denetimden muaf
 * kilmaz: dort sekme, tablolar, formlar ve bir dosya secici tasiyor.
 *
 * Olculen dort sey:
 *   TASMA           390 pikselde yatay kaydirma (telefonda ENGELDIR)
 *   DOKUNMA HEDEFI  24x24'ten kucuk tiklanabilir oge (WCAG 2.2 AA asgari)
 *   ETIKET          adsiz dugme/alan (ekran okuyucuda «dugme» diye anilir)
 *   KONTRAST        metin/zemin orani, iki temada da (WCAG AA 4.5)
 *
 *   node tools/yuz.js
 *
 * Cikis kodu: 0 temiz, 1 sorun, 2 kosulamadi (arac eksik ya da port dolu).
 */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEPO = path.resolve(ROOT, '..');
const PORT = 4296;
const TOKEN = 'yuz-denetimi-icin-gecici-jeton';
/* Ana gorunumler ve Ayarlar'in alt sekmeleri AYRI gezilir: teknik
 * yonetim artik gunluk ekranin icinde degil, kendi sayfasinda. Liste
 * yuzun GORUNUMLER'iyle ayni olmali (ayarlar asagida sekme sekme);
 * Motto ve Hedefler K7'den beri yuzdeydi ama burada yoktu, hic
 * olculmuyordu (2026-09-25; test_yuz iki listeyi karsilastirir). */
const GORUNUMLER = ['bugun', 'sohbet', 'sistemler', 'profil', 'motto', 'hedefler', 'ofis', 'teklifler', 'para'];
/* K7 (belgeler/ekip/EKIP-PLANI §8-9): Ayarlar'ın yedi paneli dört bölümde; bölüm
   bütün panellerini alt alta gösterir, yani yedi panelin hepsi ölçülür. */
const AYAR_SEKMELERI = ['yapayzeka', 'kanallar', 'esikler', 'sunucu'];
/* K7: Profil, Motto ve Para artık bir çekmecenin BÖLÜMÜ: üstte çekmece,
   altta bölüm çubuğu (#bolumcubugu). */
const CEKMECE = { profil:'ayarlar', motto:'ayarlar', para:'sistemler' };
/* Tohumlu veriyle DOLU cizilmesi gereken kartlar: kart gorunmezse olculen
   sey bos bir kutu olurdu. Gorunum verisini acildiktan SONRA ister (para:
   yuklePara tek istek atar, 082 ile 087'yi ayni cevaptan tek seferde
   cizer). Sabit bir bekleyis yetmez: 2026-10-03'te yuk altinda para
   gorunumu tiktan 835-927 ms sonra cizildi, denetim ~980 ms'de bakiyordu
   ve arada bir «katalog 087 tohumlu veriyle cizilmedi» verdi. Kart gelene
   kadar beklenir — en cok DOLU_SURE; gelmezse denetim yine kirmizidir. */
const DOLU = {
  profil:[['[data-aday-onayla]', 'hafıza adayı']],
  para:[['[data-oz="082"]', 'katalog 082'], ['[data-oz="087"]', 'katalog 087']],
};
const DOLU_SURE = 8000;
const MIN_TAP = 24;
const MIN_KONTRAST = 4.5;

let chromium;
try{ ({ chromium } = require(path.join(DEPO, 'ESP', 'node_modules', 'playwright'))); }
catch(e){
  console.error('Playwright bulunamadi (ESP/node_modules).');
  process.exit(2);
}

const wait = ms => new Promise(r => setTimeout(r, ms));

async function bekle(url, kere){
  for(let i = 0; i < (kere || 60); i++){
    try{ await fetch(url); return true; }catch(e){ await wait(200); }
  }
  return false;
}

function api(yol, opt){
  return fetch('http://127.0.0.1:' + PORT + yol, Object.assign({
    headers:{ 'Authorization':'Bearer ' + TOKEN, 'Content-Type':'application/json' },
  }, opt || {}));
}

/* Denetim VERIYLE yapilir: bos bir sayfa her denetimden gecer ve hicbir
   sey kanitlamaz. */
async function tohum(){
  const bugun = new Date();
  for(let i = 20; i >= 0; i--){
    const t = new Date(bugun.getTime() - i * 86400000).toISOString().slice(0, 10);
    await api('/api/sync/spi', { method:'POST', body:JSON.stringify({
      date:t, metrics:{ sleep_hours:{ value:4 + (i % 4), cert:'measured' },
        recovery:{ value:40 + (i % 30), cert:'computed' } } }) });
    await api('/api/sync/ays', { method:'POST', body:JSON.stringify({
      date:t, metrics:{ questions:{ value:40 + (i % 60), cert:'measured' },
        study_minutes:{ value:60 + (i % 90), cert:'measured' } } }) });
  }
  /* Hafiza: Profil'deki «King senin hakkında ne biliyor?» kartı dolu
     haliyle ölçülsün — boş kart düğme ve uzun satır taşımaz. */
  await api('/api/memory', { method:'POST', body:JSON.stringify({
    text:'Sabahları daha verimliyim; akşam 10’dan sonra ağır konu çalışmam.' }) });
  await api('/api/memory/sync/ays', { method:'POST', body:JSON.stringify({ items:[
    { id:'h1', metin:'Pazar günleri çalışmam', katman:'soz', kaynak:'kullanici' },
    { id:'h2', metin:'Deneme haftalarında uyku düşüyor', katman:'cikarim', kaynak:'kural' }] }) });
  /* BAM: bir is (kayit adimi tamam, arastirma model bekliyor) — Ofis
     ekranindaki dugmeler ve uzun talep satiri olculsun. */
  await api('/api/bam/is', { method:'POST', body:JSON.stringify({
    talep:'Ferritin neden düşer, demir emilimini neler etkiler? Araştır', hedef_modul:'spi' }) });
  await api('/api/bam/ilerlet', { method:'POST', body:'{}' });
  await api('/api/bam/ilerlet', { method:'POST', body:'{}' });
  /* Hafıza adayı: onay bekleyen satır ve iki düğmesi ölçülsün. Aday
     yalnız sohbetin model cevabından doğar; denetimde model yok, o yüzden
     doğrudan veritabanına tek satır yazılır (yüz yalnız okur). */
  try{
    const { execFileSync } = require('child_process');
    execFileSync('python3', ['-c', 'import sys; sys.path.insert(0, ".");from core import db, memory;'
      + 'c = db.connect(sys.argv[1]); memory.aday_ekle(c, "Hafta sonları erken kalkıyor."); c.commit()', DB_YOLU],
      { cwd:ROOT });
  }catch(e){ /* aday yazılamazsa kart boş ölçülür; yüz yine gezilir */ }
  /* Para: 082 günlük gider takvimi ve 087 düzenli gider kartları dolu
     haliyle ölçülsün (iki geçmiş ayda kira, bu ay birkaç gider). */
  const ay = n => { const d = new Date(bugun.getFullYear(), bugun.getMonth() + n, 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
  const gun = new Date().toISOString().slice(0, 10);
  for(const [g, tutar, kategori, aciklama] of [[ay(-2) + '-05', '12.000', 'Konut', 'kira'],
    [ay(-1) + '-04', '12.000', 'Konut', 'kira'], [ay(-2) + '-20', '300', 'Fatura', 'internet'],
    [ay(-1) + '-21', '310', 'Fatura', 'internet'], [ay(0) + '-01', '450', 'Gıda', 'market'],
    [gun, '85,50', 'Dışarıda yemek', 'kahve']]){
    await api('/api/para', { method:'POST', body:JSON.stringify({ gun:g, yon:'gider', tutar, kategori, aciklama }) });
  }
}

/* Kontrast: WCAG bagil parlaklik. Ayristirmak yerine tarayicinin cozdugu
   rgb() degerleri okunur — «renk temasi degisince ne oluyor» sorusunun
   cevabi ancak boyle alinir. */
const OLC = `(() => {
  const luminans = (r, g, b) => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92
      : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const oku = s => (s || '').match(/\\d+(\\.\\d+)?/g) || [];
  const zemin = el => {
    let p = el;
    while(p && p !== document.documentElement){
      const c = oku(getComputedStyle(p).backgroundColor);
      const a = c.length > 3 ? Number(c[3]) : 1;
      if(c.length >= 3 && a > 0.1) return c.slice(0, 3).map(Number);
      p = p.parentElement;
    }
    /* Gövde saydamsa (masaüstünde cam kabuk: zemin kökte ve sabit katmanda,
       yazı buzlu levhanın üstünde) zemin kökün rengidir; saydam gövde
       «siyah» sayılmaz. */
    for(const k of [document.body, document.documentElement]){
      const c = oku(getComputedStyle(k).backgroundColor);
      const a = c.length > 3 ? Number(c[3]) : 1;
      if(c.length >= 3 && a > 0.1) return c.slice(0, 3).map(Number);
    }
    return [255, 255, 255];
  };
  const oran = (a, b) => {
    const la = luminans(a[0], a[1], a[2]), lb = luminans(b[0], b[1], b[2]);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };

  const sonuc = { tasma:0, sucluler:[], kucuk:[], etiketsiz:[], kontrast:[] };
  sonuc.tasma = document.documentElement.scrollWidth - window.innerWidth;
  if(sonuc.tasma > 1){
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect();
      if(r.right > window.innerWidth + 1 && sonuc.sucluler.length < 4){
        let p = el, kasitli = false;
        while(p && p !== document.body){
          const ox = getComputedStyle(p).overflowX;
          if(ox === 'auto' || ox === 'scroll'){ kasitli = true; break; }
          p = p.parentElement;
        }
        if(!kasitli) sonuc.sucluler.push(el.tagName.toLowerCase()
          + (el.id ? '#' + el.id : '') + (el.className ? '.' + String(el.className).split(' ')[0] : ''));
      }
    });
  }

  document.querySelectorAll('button, a[href], input, select, [role="button"]')
    .forEach(el => {
      const r = el.getBoundingClientRect();
      if(r.width === 0 && r.height === 0) return;
      if(r.width < ${MIN_TAP} || r.height < ${MIN_TAP}){
        const ad = (el.id || el.textContent || el.tagName).trim().slice(0, 24);
        if(sonuc.kucuk.length < 6) sonuc.kucuk.push(ad + ' '
          + Math.round(r.width) + '×' + Math.round(r.height));
      }
      const etiket = (el.getAttribute('aria-label') || el.textContent || '').trim()
        || (el.labels && el.labels.length ? 'label' : '')
        || el.getAttribute('placeholder') || '';
      if(!etiket && sonuc.etiketsiz.length < 6){
        sonuc.etiketsiz.push((el.id || el.tagName).toString());
      }
    });

  const gorulen = new Set();
  document.querySelectorAll('p, td, th, h1, h2, .tag, .muted, .line, button')
    .forEach(el => {
      const metin = (el.textContent || '').trim();
      if(!metin || el.children.length > 2) return;
      const st = getComputedStyle(el);
      const renk = oku(st.color).slice(0, 3).map(Number);
      if(renk.length < 3) return;
      const o = oran(renk, zemin(el));
      const ad = el.tagName.toLowerCase() + '.' + (String(el.className).split(' ')[0] || '-');
      if(gorulen.has(ad)) return;
      gorulen.add(ad);
      if(o < ${MIN_KONTRAST} && sonuc.kontrast.length < 8){
        sonuc.kontrast.push(ad + ' ' + o.toFixed(2));
      }
    });
  return sonuc;
})()`;

/* Kenar sekmeleri ortmesin (W6, 2026-10-03): masaustunde dar cam kenar
   uzerine gelince icerigin USTUNDE acilir. Ayarlar'a kenardan gidilince fare
   kenarda kalir; kenar acik kalirsa 1024-1440 px'te Ayarlar'in ilk sekmesini
   orter ve tiklama kenardaki «Onaylar»a gider (entegre.js W6 boyle kirildi).
   Olcu kullanicinin yerinden yapilir: fare kenardan CEKILMEDEN, her sekmenin
   ortasindaki oge kenara mi ait? */
const ORTUSME = `(() => {
  const ust = document.querySelector('header.ust');
  const sonuc = { bakilan:0, ortulen:[] };
  document.querySelectorAll('[data-ayar]').forEach(b => {
    const r = b.getBoundingClientRect();
    if(!r.width || !r.height) return;
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    if(x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return;
    sonuc.bakilan++;
    const e = document.elementFromPoint(x, y);
    if(e && ust && ust.contains(e)){
      sonuc.ortulen.push(b.dataset.ayar + ' (üstündeki: ' + ((e.dataset && e.dataset.yol) || e.id || e.tagName.toLowerCase()) + ')');
    }
  });
  return sonuc;
})()`;

/* PORT MUHAFIZI (2026-10-03). Port ve jeton sabittir: ikinci bir yuz.js
   (baska bir worktree'de) ayni anda kosarsa onun HKM'si portu alamaz ama
   saglik denetimi BU kosunun HKM'sinden cevap alir — ayni jetonla oteki
   kosunun veritabanina tohum yazar ve oteki kopyanin yuzunu olcer. Port
   doluysa denetim HIC baslamaz — config yazmaz, HKM acmaz: cikis 2
   (kirmizi degil, kosulamadi). Desen tools/entegre.js'ten;
   tools/portmuhafiz.test.js sinar. */
function portDolu(port){
  const dene = host => new Promise(r => {
    const s = require('net').connect({ host, port });
    s.setTimeout(1000, () => { s.destroy(); r(false); });
    s.once('connect', () => { s.destroy(); r(true); });
    s.once('error', () => r(false));
  });
  return Promise.all([dene('127.0.0.1'), dene('::1')]).then(x => x.some(Boolean));
}
async function portMuhafizi(portlar, ipucu){
  const dolu = [];
  for(const p of portlar) if(await portDolu(p)) dolu.push(p);
  if(!dolu.length) return;
  console.error('Port dolu: ' + dolu.join(', ') + ' — başka bir koşu (belki başka bir worktree\'de) '
    + 'ya da açık bir sunucu kullanıyor.\nBu koşu kendi sunucusunu açamaz, ötekini ölçerdi; '
    + 'o bitince yeniden koş' + (ipucu ? ' ya da boş bir port ver: ' + ipucu : '') + '.');
  process.exit(2);
}

let DB_YOLU = null;
async function main(){
  await portMuhafizi([PORT]);
  const hatalar = [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hkm-yuz-'));
  DB_YOLU = path.join(tmp, 'hkm.db');
  const cfgYol = path.join(ROOT, 'config.json');
  const vardi = fs.existsSync(cfgYol);
  const yedek = vardi ? fs.readFileSync(cfgYol, 'utf8') : null;
  fs.writeFileSync(cfgYol, JSON.stringify({ host:'127.0.0.1', port:PORT,
    local_token:TOKEN, db_path:path.join(tmp, 'hkm.db') }, null, 2));

  const daemon = spawn('python3', [path.join(ROOT, 'daemon.py')],
    { cwd:ROOT, stdio:'ignore' });
  let browser;
  const kapat = () => {
    try{ daemon.kill(); }catch(e){}
    if(vardi) fs.writeFileSync(cfgYol, yedek); else { try{ fs.unlinkSync(cfgYol); }catch(e){} }
    try{ fs.rmSync(tmp, { recursive:true, force:true }); }catch(e){}
  };

  let bakilan = 0;
  try{
    if(!await bekle('http://127.0.0.1:' + PORT + '/api/health')){
      console.error('HKM ayaga kalkmadi.'); kapat(); process.exit(1);
    }
    await tohum();
    browser = await chromium.launch(process.env.CHROMIUM_PATH
      ? { executablePath:process.env.CHROMIUM_PATH } : {});

    for(const [ad, genislik, yukseklik] of [['telefon', 390, 780],
                                            ['masaüstü', 1280, 900]]){
      for(const tema of ['light', 'dark']){
        const page = await browser.newPage({
          viewport:{ width:genislik, height:yukseklik },
          colorScheme:tema });
        const konsol = [];
        page.on('pageerror', e => konsol.push(String(e.message)));
        await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil:'load' });
        await page.waitForSelector('#giris');
        await page.fill('#token', TOKEN);
        await page.click('#gir');
        await wait(1500);
        /* Masaüstünde kenar dar camdır ve üzerine gelince içeriğin ÜSTÜNDE
           açılır (cam kabuk, 2026-10-03): kenardan gezinen kullanıcı gibi fare
           içeriğe döner, kenar kapanır; yoksa açık kenar sayfadaki düğmenin
           üstünü örter ve ölçüm de açık kenarla yapılırdı. */
        const kenardanCik = async () => {
          await page.mouse.move(genislik - 20, Math.round(yukseklik / 2));
          await wait(420);
        };
        /* Kenar seçimden sonra çekilir (.ust--dinlen): bölüm çubuğunu arayan
           kullanıcı gibi fare kenarda biraz gezinir, kenar yeniden açılır. */
        const bolumeUzan = async cekmece => {
          const k = await page.locator('#gez a[data-yol="' + cekmece + '"]').boundingBox();
          if(k) await page.mouse.move(k.x + 22, k.y + k.height / 2 + 8);
          await wait(700);
        };
        /* Kenar açılınca çekmeceler yerinden kaymaz (2026-10-03): kapalı
           şeritte bir simgenin üst kenarına gelen fare, açılan kenarda bir
           üstteki çekmeceye düşmemeli. Her çekmecenin üst kenarı iki hâlde. */
        if(genislik >= 1024){
          const satirlar = () => page.evaluate(() => [...document.querySelectorAll('#gez a')]
            .map(a => a.dataset.yol + ' ' + Math.round(a.getBoundingClientRect().top)).join(', '));
          await kenardanCik();
          const kapali = await satirlar();
          await page.mouse.move(32, Math.round(yukseklik / 2));
          await wait(620);
          const acik = await satirlar();
          await kenardanCik();
          if(kapali !== acik) hatalar.push(ad + '/' + tema + ': kenar açılınca çekmeceler kaydı — ' + kapali + ' → ' + acik);
        }
        const duraklar = GORUNUMLER.map(g => ({ ad:g, git:async () => {
          if(CEKMECE[g]){
            await page.click('#gez a[data-yol="' + CEKMECE[g] + '"]');
            await bolumeUzan(CEKMECE[g]);
            await page.click('#bolumcubugu a[data-yol="' + g + '"]');
          }else{
            await page.click('#gez a[data-yol="' + g + '"]');
          }
          await kenardanCik();
        }}));
        for(const a of AYAR_SEKMELERI){
          duraklar.push({ ad:'ayarlar/' + a, git:async () => {
            await page.click('#ayar-bag');
            await wait(450);                      /* kenarın kapanış geçişi 340 ms */
            const o = await page.evaluate(ORTUSME);
            const yer = ad + '/' + tema + '/ayarlar/' + a;
            if(!o.bakilan) hatalar.push(yer + ': Ayarlar sekmeleri ekranda bulunamadı');
            if(o.ortulen.length){
              hatalar.push(yer + ': kenar, kenardan Ayarlar açılınca sekmeyi örtüyor — ' + o.ortulen.join(', '));
              await kenardanCik();                /* koşu sürsün, sorun yukarıda yazıldı */
            }
            await page.click('[data-ayar="' + a + '"]');
            await kenardanCik();
          }});
        }
        for(const durak of duraklar){
          await durak.git();
          await wait(350);
          const dolu = DOLU[durak.ad] || [];
          if(dolu.length){
            await page.waitForFunction(s => s.every(q => document.querySelector(q)),
              dolu.map(x => x[0]), { timeout:DOLU_SURE }).catch(() => {});
          }
          bakilan++;
          const r = await page.evaluate(OLC);
          const yer = ad + '/' + tema + '/' + durak.ad;
          if(genislik === 390 && r.tasma > 1){
            hatalar.push(yer + ': yatay taşma ' + r.tasma + 'px'
              + (r.sucluler.length ? ' — ' + r.sucluler.join(', ') : ''));
          }
          r.kucuk.forEach(k => hatalar.push(yer + ': küçük dokunma hedefi — ' + k));
          r.etiketsiz.forEach(k => hatalar.push(yer + ': etiketsiz öge — ' + k));
          r.kontrast.forEach(k => hatalar.push(yer + ': düşük kontrast — ' + k));
          for(const [q, adi] of dolu){
            if(!(await page.$(q))) hatalar.push(yer + ': ' + adi + ' tohumlu veriyle çizilmedi');
          }
        }
        if(konsol.length) hatalar.push(ad + '/' + tema + ': sayfa hatası — ' + konsol[0]);
        await page.close();
      }
    }
  }catch(err){
    hatalar.push('kosum hatasi: ' + (err && err.message ? err.message : err));
  }finally{
    if(browser) await browser.close().catch(() => {});
    kapat();
  }

  const tekil = Array.from(new Set(hatalar));
  if(tekil.length){
    console.log('\n' + tekil.length + ' sorun:');
    tekil.slice(0, 25).forEach(h => console.log('  ✕ ' + h));
    if(tekil.length > 25) console.log('  … ve ' + (tekil.length - 25) + ' tane daha');
    process.exit(1);
  }
  console.log('\nHKM yüzü temiz — ' + bakilan + ' görünümde taşma yok, bütün '
    + 'hedefler ' + MIN_TAP + 'px ve üstü, etiketler yerinde, kontrast AA.');
  process.exit(0);
}

main();
