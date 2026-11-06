#!/usr/bin/env node
/* PATRON TURU KOSUSU — yeni hesapla gercek tur, gercek sunucu, uc kapi, gercek tiklama.

     node tools/patrontur_kosu.js [--goruntu klasor]

   Birim testi tek sayfadir; bu kosu portlar arasi durumu, kurulum penceresiyle
   bulusmayi, 1280 ve 390 pikseli, klavyeyi ve azaltilmis hareketi yurur.
   Hesap klasoru gecicidir (LIFEOS_HESAP_KLASOR); kullanicinin kaydina dokunmaz.
   Ses DUYULAMAZ: konusma cagrilari sayilir, kulak degildir.
   Cikis: 0 temiz, 1 sorun, 2 kosulamadi (port dolu). */
const path = require('path'), os = require('os'), fs = require('fs'), net = require('net'), { spawn, execSync } = require('child_process');
const KOK = path.resolve(__dirname, '..');
const anaKok = path.resolve(KOK, execSync('git rev-parse --git-common-dir', { cwd:KOK, encoding:'utf8' }).trim(), '..');
let pw;
try{ pw = require(path.join(KOK, 'ESP', 'node_modules', 'playwright')); }catch(e){ pw = require(path.join(anaKok, 'ESP', 'node_modules', 'playwright')); }
const PORTLAR = [4180, 4173, 4183, 4193];
const ia = process.argv.indexOf('--goruntu'), GORUNTU = ia > 0 ? path.resolve(process.argv[ia + 1]) : null;
if(GORUNTU) fs.mkdirSync(GORUNTU, { recursive:true });

const dolu = p => new Promise(r => { const s = net.connect({ host:'127.0.0.1', port:p }); s.setTimeout(600, () => { s.destroy(); r(false); }); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
const uyu = ms => new Promise(r => setTimeout(r, ms));
const hatalar = [];
const dogrula = (kosul, m) => { if(!kosul){ hatalar.push(m); console.log('  ✕ ' + m); } };

const durum = p => p.evaluate(() => {
  const T = window.LIFEOS && LIFEOS.PATRONTUR, d = T && T._durum();
  if(!d || !d.adim) return { acik:false, modulVar:!!T };
  const b = d.delik.getBoundingClientRect(), kart = d.kart.getBoundingClientRect();
  return { acik:true, id:d.adim.id, gizli:!!d.gizli, gorunur:!d.kok.hidden, tikla:!!d.adim.tikla, son:!!d.adim.son, bitti:d.kart.classList.contains('is-bitti'),
    devam:!d.kok.querySelector('[data-ptur="devam"]').hidden, yazi:d.yazi.textContent, bekle:d.kok.classList.contains('is-bekle'), kim:d.kok.querySelector('.ptur__ad').textContent,
    delik:{ x:b.left, y:b.top, w:b.width, h:b.height }, bos:d.delik.classList.contains('is-bos'), kart:{ x:kart.left, y:kart.top, w:kart.width, h:kart.height },
    genislik:document.documentElement.scrollWidth, pencere:innerWidth, odak:document.activeElement ? document.activeElement.className : '' };
}).catch(() => ({ acik:false, gidiyor:true }));

/* Hesabi on yuzden kur: gercek kullanicinin yolu. */
async function hesapKur(p, ad){
  await p.goto('http://127.0.0.1:4180/', { waitUntil:'load' });
  await p.click('button:has-text("Hesap oluştur")', { timeout:15000 });
  await uyu(500);
  const kutular = [];
  for(const x of await p.$$('input')) if(await x.isVisible()) kutular.push(x);
  await kutular[0].fill(ad); await kutular[1].fill('sinama-parola-12345'); await kutular[2].fill('sinama-parola-12345'); await kutular[3].fill('Sinama sorusu?'); await kutular[4].fill('cevap');
  await p.click('.hesap__ana');
  await uyu(2000);
}

async function aysKurulum(p){
  /* Bes adim: ad, hedef (basari sirasi zorunlu), takvim, kapasite, seviye. Bos kutulari doldurur. */
  for(let i = 0; i < 8; i++){
    await p.evaluate(() => {
      document.querySelectorAll('.sheet input').forEach(e => {
        if(e.value || e.type === 'date' || e.type === 'checkbox' || e.type === 'radio' || e.offsetParent === null) return;
        e.value = e.type === 'number' ? '20000' : 'Sınama';
        e.dispatchEvent(new Event('input', { bubbles:true }));
      });
    });
    const kaydet = await p.$('.sheet [data-act="setup-save"]');
    if(kaydet && await kaydet.isVisible()){ await kaydet.click(); await uyu(1200); return; }
    const ileri = await p.$('.sheet [data-act="setup-next"]');
    if(!ileri || !await ileri.isVisible()) break;
    await ileri.click();
    await uyu(300);
  }
  const k = await p.$('.sheet [data-act="sheet-close"]');
  if(k) await k.click();
}

async function kurulumKapat(p){
  const atla = await p.$('.sheet [data-act="setup-skip"]');
  if(atla && await atla.isVisible()){ await atla.click(); return; }
  if(await p.$('.sheet [data-act="setup-next"]')) return aysKurulum(p);
  const k = await p.$('.sheet [data-act="sheet-close"]');
  if(k) await k.click();
}

/* Ana dongu: her adimda gercek kullanici gibi davranir. */
async function yuru(p, o){
  const gorulen = [];
  let son = null, bosDur = 0;
  const bitis = Date.now() + (o.sure || 900000);
  while(Date.now() < bitis){
    const s = await durum(p);
    if(!s.acik){
      if(s.gidiyor){ await uyu(250); continue; }
      /* Kapanmis: bitti mi yoksa acilisi mi bekliyoruz? */
      const pencere = await p.$('.overlay .sheet [data-kurulum], .overlay .sheet [data-tanitim]');
      if(pencere && await pencere.isVisible()) await kurulumKapat(p);
      if(gorulen.length && gorulen[gorulen.length - 1] === 'son.is' && (++bosDur > 4)) return gorulen;
      if(++bosDur > 120) break;
      await uyu(250);
      continue;
    }
    bosDur = 0;
    if(s.bekle && s.gorunur){
      if(!o.bandGoruldu){
        o.bandGoruldu = true;
        await goruntu(p, o.ad + '-kurulum-band');
        dogrula(/patronuyum/.test(s.yazi), 'kurulum bandi patronu soylemiyor: ' + s.yazi);
      }
      await uyu(200);
      await kurulumKapat(p);
      await uyu(500);
      continue;
    }
    const pencere = await p.$('.overlay .sheet [data-kurulum], .overlay .sheet [data-tanitim]');
    if(pencere && await pencere.isVisible()){ await uyu(300); await kurulumKapat(p); await uyu(500); continue; }
    if(!s.gorunur || s.gizli){ await uyu(200); continue; }
    if(s.id !== son){
      await uyu(1100);   // ekran cizilsin, spot yerine otursun
      const t = await durum(p);
      if(!t.acik || t.id !== s.id) continue;
      son = t.id;
      gorulen.push(t.id);
      console.log('  · ' + String(gorulen.length).padStart(2) + ' ' + t.id.padEnd(18) + ' ' + t.kim.padEnd(12) + ' «' + t.yazi.slice(0, 60) + '»');
      await goruntu(p, o.ad + '-' + String(gorulen.length).padStart(2, '0') + '-' + t.id);
      dogrula(t.genislik <= t.pencere + 1, t.id + ': yatay tasma ' + t.genislik + ' > ' + t.pencere);
      if(!t.bos && t.tikla) dogrula(!(t.kart.x < t.delik.x + t.delik.w && t.kart.x + t.kart.w > t.delik.x && t.kart.y < t.delik.y + t.delik.h && t.kart.y + t.kart.h > t.delik.y), t.id + ': kart spotun ustune biniyor');
      dogrula(t.kart.y >= 0 && t.kart.y + t.kart.h <= (await p.evaluate(() => innerHeight)) + 1, t.id + ': kart ekrandan tasiyor');
      if(t.tikla && !t.devam) dogrula(!t.bos, t.id + ': tiklama adiminda spot yok');
    }
    if(o.bekleBitsin) { const b = Date.now(); while(Date.now() - b < 30000 && !(await durum(p)).bitti) await uyu(200); }
    const u = await durum(p);
    if(!u.acik || u.id !== son) continue;
    if(u.tikla && !u.devam){
      /* Once karanliga bas: ilerlememeli. */
      const vp = await p.evaluate(() => ({ w:innerWidth, h:innerHeight }));
      const kx = u.delik.x > vp.w / 2 ? 5 : vp.w - 5, ky = u.delik.y > vp.h / 2 ? 5 : vp.h - 5;
      await p.mouse.click(kx, ky);
      await uyu(80);
      dogrula((await durum(p)).id === u.id, u.id + ': karanliga basinca ilerledi');
      if(o.klavye){
        dogrula(/kenar__|altbant|menusayfa/.test(u.odak), u.id + ': odak spotta degil: ' + u.odak);
        await p.keyboard.press('Enter');
      }else if(o.dokun) await p.touchscreen.tap(u.delik.x + u.delik.w / 2, u.delik.y + u.delik.h / 2);
      else await p.mouse.click(u.delik.x + u.delik.w / 2, u.delik.y + u.delik.h / 2);
      await uyu(450);
      continue;
    }
    if(o.yenidenYukle === u.id){
      o.yenidenYukle = null;
      await p.reload({ waitUntil:'load' });
      await uyu(3500);
      const y = await durum(p);
      dogrula(y.acik && y.id === u.id, 'yeniden yukleyince adim korunmadi: ' + u.id + ' > ' + y.id);
      son = null; gorulen.pop();
      continue;
    }
    await p.click('.ptur [data-ptur="devam"]');
    await uyu(250);
  }
  hatalar.push('sure doldu: ' + o.ad + ' son adim ' + son);
  return gorulen;
}
async function goruntu(p, ad){ if(GORUNTU) await p.screenshot({ path:path.join(GORUNTU, ad + '.png') }).catch(() => {}); }

async function baglam(t, vp, ek){
  const c = await t.newContext(Object.assign({ viewport:vp }, ek));
  const soylenen = [];
  await c.exposeBinding('__soylenen', (_, m) => { soylenen.push(m); });
  /* Merkez acik olsa bile sunucu sesi kapali: konusma cihaz yoluna duser, sayilir ve sure belirsizligi kalmaz. */
  await c.route('**/api/ses**', r => r.abort());
  await c.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get:() => false });
    if(window.SpeechSynthesis) window.SpeechSynthesis.prototype.speak = function(u){ window.__soylenen(u.text); setTimeout(() => { if(u.onend) u.onend({}); }, 40); };
  });
  return { c, soylenen };
}

(async () => {
  for(const p of PORTLAR) if(await dolu(p)){ console.error('Port dolu: ' + p); process.exit(2); }
  const klasor = fs.mkdtempSync(path.join(os.tmpdir(), 'patrontur-'));
  const sunucu = spawn('python3', ['sistem/sunucu.py'], { cwd:KOK, stdio:'ignore', env:Object.assign({}, process.env, { PYTHONUTF8:'1', LIFEOS_HESAP_KLASOR:klasor }) });
  const t = await pw.chromium.launch();
  try{
    for(let i = 0; i < 80 && !await dolu(4180); i++) await uyu(250);

    /* ---------- A: 1280 piksel, fare, AYS'den baslar, kurulumu tamamlar ---------- */
    console.log('A · 1280 piksel, fare ve klavye');
    const A = await baglam(t, { width:1280, height:800 });
    const pa = await A.c.newPage();
    const sayfaHata = []; pa.on('pageerror', e => sayfaHata.push(e.message));
    await hesapKur(pa, 'tura' + Date.now().toString(36));
    await pa.click('a.kart[href*="4173"]');
    await pa.waitForSelector('.sinematik', { timeout:20000 });
    dogrula(!(await durum(pa)).acik, 'film acikken tur baslamis');
    await goruntu(pa, 'A-00-film');
    await pa.click('[data-sinematik="gec"]');
    await uyu(800);
    await goruntu(pa, 'A-00-kurulum');
    dogrula(!(await durum(pa)).acik, 'kurulum acikken tur baslamis');
    await aysKurulum(pa);
    const adimA = await yuru(pa, { ad:'A', bekleBitsin:true, yenidenYukle:'spi.giris', klavyeModul:'esp' });
    dogrula(adimA.length === (await pa.evaluate(() => LIFEOS.PATRONTUR._akis('ays').length)), 'A: eksik adim ' + adimA.length);
    dogrula(adimA[0] === 'king.ac' && adimA[adimA.length - 1] === 'son.is', 'A: acilis ya da kapanis yanlis');
    const beklenen = await pa.evaluate(() => { const T = LIFEOS.PATRONTUR; return T._akis('ays').reduce((l, a) => l.concat(T._sozler(a)), []); });
    const soyl = A.soylenen.join(' ');
    const eksik = beklenen.filter(c => soyl.indexOf(c) < 0);
    dogrula(!eksik.length, 'A: soylenmeyen cumle ' + eksik.length + ': ' + eksik.slice(0, 2).join(' | '));
    console.log('  konusma cagrisi: ' + A.soylenen.length + ', cumle: ' + beklenen.length);
    await uyu(500);
    dogrula(await pa.evaluate(() => /giris__girdi/.test(document.activeElement.className)), 'A: tur bitince odak ilk cumle kutusunda degil');
    await goruntu(pa, 'A-99-bitti');
    /* Bir kez: yeniden yuklenince acilmaz */
    await pa.reload({ waitUntil:'load' });
    await uyu(3500);
    dogrula(!(await durum(pa)).acik, 'biten tur yeniden acildi');
    /* Ayarlar > Kilavuz'dan baslar */
    await pa.evaluate(() => (window.R || window.SP || window.ESP).App.go('kilavuz'));
    await uyu(700);
    await pa.click('[data-patrontur-ac]');
    await uyu(900);
    const yeni = await durum(pa);
    dogrula(yeni.acik && yeni.id === 'king.ac', 'Kilavuz turu baslatmadi');
    await goruntu(pa, 'A-a0-yeniden');
    /* Esc gecer, bir daha acilmaz */
    await pa.keyboard.press('Escape');
    await uyu(300);
    dogrula(!(await durum(pa)).acik, 'Esc turu kapatmadi');
    await pa.reload({ waitUntil:'load' });
    await uyu(3500);
    dogrula(!(await durum(pa)).acik, 'gecilen tur yeniden acildi');
    dogrula(!sayfaHata.length, 'A: sayfa hatasi: ' + sayfaHata[0]);
    await A.c.close();

    /* ---------- B: 390 piksel, dokunma, SPI'den baslar, azaltilmis hareket ---------- */
    console.log('B · 390 piksel, dokunma, azaltilmis hareket');
    const B = await baglam(t, { width:390, height:844 }, { hasTouch:true, isMobile:true, deviceScaleFactor:2, reducedMotion:'reduce' });
    const pb = await B.c.newPage();
    const hataB = []; pb.on('pageerror', e => hataB.push(e.message));
    await hesapKur(pb, 'turb' + Date.now().toString(36));
    await pb.evaluate(() => { try{ localStorage.setItem('lifeos.hareket', 'az'); }catch(e){} });
    await pb.goto('http://127.0.0.1:4183/', { waitUntil:'load' });
    await uyu(2500);
    await pb.evaluate(() => { const s = document.querySelector('.sinematik [data-sinematik="gec"]'); if(s) s.click(); });
    const adimB = await yuru(pb, { ad:'B', dokun:true });
    dogrula(adimB[2] === 'spi.tanis', 'B: ilk patron SPI degil: ' + adimB[2]);
    dogrula(adimB[adimB.length - 1] === 'son.is', 'B: kapanis yok');
    dogrula(await pb.evaluate(() => !LIFEOS.PATRONTUR.acikMi()), 'B: tur acik kaldi');
    dogrula(!hataB.length, 'B: sayfa hatasi: ' + hataB[0]);
    await B.c.close();

    /* ---------- C: yalniz klavye, ESP'den baslar ---------- */
    console.log('C · 1280 piksel, yalniz klavye');
    const C = await baglam(t, { width:1280, height:800 });
    const pc = await C.c.newPage();
    await hesapKur(pc, 'turc' + Date.now().toString(36));
    await pc.goto('http://127.0.0.1:4193/', { waitUntil:'load' });
    await uyu(2500);
    await pc.keyboard.press('Escape');
    const adimC = await yuru(pc, { ad:'C', klavye:true });
    dogrula(adimC[2] === 'esp.tanis' && adimC[adimC.length - 1] === 'son.is', 'C: akis yanlis');
    await C.c.close();
  } finally {
    await t.close();
    sunucu.kill();
    try{ fs.rmSync(klasor, { recursive:true, force:true }); }catch(e){ /* kilitli kalabilir */ }
  }
  console.log(hatalar.length ? hatalar.length + ' sorun' : 'Patron turu temiz');
  process.exit(hatalar.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
