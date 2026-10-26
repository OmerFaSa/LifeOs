/* PUSULA ÖLÇÜMÜ — Kolay LifeOS planının yardımcı ölçüleri (belgeler/ekip/KOLAY-PLANI.md §1).

   Y1 · İyi gün kaydı: plana uyan bir günü kaydetmek için gereken EYLEM sayısı
        (dokunuş, alan doldurma, Enter) ve yazılan karakter. Her modülde bugün
        uygulamanın sunduğu EN KISA yol gerçekten yürütülür ve kaydın yazıldığı
        DOĞRULANIR — doğrulanmayan senaryo sayılmaz (ölçülmemiş şey «temiz»
        diye raporlanmaz, AGENTS §1.7).
        SÜRE (2026-10-25, Faz 1 kabulü «≤ 30 sn»): tahmin = eylem × 1,5 sn +
        karakter × 0,3 sn. Kişinin süresi değil, yolun yükü; çıktıda «tahmin»
        diye yazılır. Gerçek süre P1'dir (cihazda ölçülür).
        Modülün birden çok yolu olabilir (Faz 1 yeni yolu ekler, eskisini
        silmez); Y1 doğrulanan en kısa yoldur.
   Y2 · Bugün yoğunluğu: Bugün ekranında açık kart (sadelik.js kuralı) + görünen
        pano kartı ve kapak kutucuğu (2026-10-26: yalnız bölüm sayılıyordu, 11 kutu 2 görünüyordu).
   Y3 · Menü öğesi: kenar çubuğundaki çekmece sayısı.

   P1 ve P2 kullanıcının cihazındaki veriden gelir; bu araç onları ölçmez,
   uygulama içinde Ayarlar › Genel'deki pusula satırı gösterir.

   «İyi gün» tanımları (modülün kendi işi):
     AYS  günün blokları «Tamamlandı», her birinde soru ve doğru; uyku.
     SPİ  günün ölçümü (uyku, nabız, HRV, kilo); 8 bardak su; 3 öğün.
     ESP  günün oturumu (bir disiplin, dakikasıyla).

     node tools/pusula.js              # tablo
     node tools/pusula.js --json       # makinece okunur
     node tools/pusula.js --denetle    # hedefin gerisindeyse çıkış 1 (Y1 ≤ 3 ve ≤ 30 sn tahmin, Y2 ≤ 3, Y3 ≤ 4)

   Sunucu gerekmez: dist/*.html dosyadan açılır; sabit port yok. Önce build.py. */

const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'ESP', 'node_modules', 'playwright'));

const KOK = path.join(__dirname, '..');
const HEDEF = { y1:3, sure:30, y2:3, y3:4 };
/* Tahmini süre (sn): eylem başına 1,5, yazılan karakter başına 0,3. */
const sureTahmini = (adim, karakter) => Math.round(adim * 1.5 + karakter * 0.3);
const BEKLE = 300;

const MODUL = {
  AYS:{ dosya:'AYS/dist/rota.html', ns:'R', menu:'(R.App.NAV || []).length' },
  SPI:{ dosya:'SPI/dist/spi.html', ns:'SP', menu:'(SP.App.SECTIONS || []).length' },
  ESP:{ dosya:'ESP/dist/esp.html', ns:'ESP', menu:'(ESP.Nav.sections() || []).length' },
};

function sayac(p){
  const s = { adim:0, karakter:0, gunluk:[] };
  s.tikla = async (sec, ad) => { await p.click(sec); s.adim++; s.gunluk.push('dokun · ' + (ad || sec)); await p.waitForTimeout(BEKLE); };
  s.yaz = async (sec, v, ad) => {
    await p.fill(sec, String(v));
    await p.dispatchEvent(sec, 'change');
    s.adim++; s.karakter += String(v).length; s.gunluk.push('yaz · ' + (ad || sec) + ' = ' + v);
    await p.waitForTimeout(BEKLE);
  };
  s.enter = async (sec, ad) => { await p.press(sec, 'Enter'); s.adim++; s.gunluk.push('Enter · ' + (ad || sec)); await p.waitForTimeout(BEKLE + 200); };
  return s;
}

/* ---------- senaryolar: bugünkü en kısa yol ---------- */

async function aysIyiGun(p, s){
  await s.tikla('[data-act="go"][data-route="gun"]', 'Blokları ve sayaçları aç');
  const bloklar = await p.evaluate(() => {
    const d = R.S.days[R.U.todayISO()];
    return ((d && d.blocks) || []).filter(b => b.slot !== 'Dinlenme').map(b => ({ id:b.id, q:b.targetQ || 20 }));
  });
  for(const b of bloklar){
    await s.tikla('[data-act="block-status"][data-block="' + b.id + '"][data-value="done"]', 'Tamamlandı');
    await s.yaz('[data-change="block-num"][data-field="actualQ"][data-block="' + b.id + '"]', b.q, 'Soru');
    await s.yaz('[data-change="block-num"][data-field="correctQ"][data-block="' + b.id + '"]', Math.round(b.q * 0.75), 'Doğru');
  }
  /* Uyku «Öbür kayıtlar» kartında; kart baştan küçük — önce açılır (gerçek yol). */
  if(await p.$('[data-ac="öbür-kayıtlar"]')) await s.tikla('[data-ac="öbür-kayıtlar"]', 'Öbür kayıtlar kartını aç');
  await s.yaz('.sleep__input', 7, 'Uyku');
  return p.evaluate(n => {
    const d = R.S.days[R.U.todayISO()];
    const l = ((d && d.blocks) || []).filter(b => b.slot !== 'Dinlenme');
    const ok = l.length === n && l.every(b => b.status === 'done' && b.actualQ > 0 && b.correctQ != null) && d.sleepHours === 7;
    return { ok, not:l.length + ' blok' };
  }, bloklar.length);
}

/* AYS GÜNÜ KAPAT (Faz 1): bekleyen bloklar «Hepsi doğru» ile tamamlanır
   (dakika plandan, «tahmin» etiketli); soru/doğru ve uyku ölçümdür, tek
   satıra yazılır. Satır blok adlarıyla kurulur: çok blokta adsız toplam
   reddedilir. Kısa ad (konunun ilk sözcüğü) anlaşılmazsa tam ad. */
async function aysGunuKapat(p, s){
  await s.tikla('[data-act="gunu-kapat"]', 'Günü kapat');
  const satir = await p.evaluate(() => {
    const gun = R.U.todayISO(), d = R.S.days[gun];
    const l = ((d && d.blocks) || []).filter(b => b.slot !== 'Dinlenme');
    const kur = ad => l.map(b => ad(b) + ' ' + (b.targetQ || 20) + ' soru ' + Math.round((b.targetQ || 20) * 0.75) + ' doğru')
      .concat(['7 saat uyudum']).join(', ');
    const ad = b => String(b.topic || b.subject || b.slot).toLocaleLowerCase('tr');
    const kisa = kur(b => ad(b).split(/\s+/)[0]);
    return R.Screens.today.gunuKapat.denetle(kisa, gun).red ? kur(ad) : kisa;
  });
  await s.yaz('#gk-olcum', satir, 'Ölçümler');
  await s.tikla('.gk__kapat', 'Kaydet');
  await p.waitForTimeout(BEKLE);
  return p.evaluate(() => {
    const d = R.S.days[R.U.todayISO()];
    const l = ((d && d.blocks) || []).filter(b => b.slot !== 'Dinlenme');
    const ok = l.length > 0 && l.every(b => b.status === 'done' && b.actualQ > 0 && b.correctQ != null) && d.sleepHours === 7;
    return { ok, not:l.length + ' blok' };
  });
}

async function spiIyiGun(p, s){
  /* EN KISA YOL (2026-10-25): «Ne yaptın?» kutusu bütün günü tek cümlede
     kayıpsız okur: dört ölçüm, su ekleme ve öğün sözleriyle üç ayrı öğün.
     Eskisi: dört alan + Kaydet + 8 bardak + 3 × (cümle, önizle, kaydet) =
     22 eylem. Doğrulama her alanı ve üç ayrı öğün yuvasını arar. */
  await s.yaz('#giris-girdi', 'uyku 7.5, nabız 56, hrv 55, kilo 72, su 2 litre, '
    + 'kahvaltıda 2 yumurta 1 çay, öğlen 1 tabak mercimek çorbası, akşam 1 tabak etli kuru fasulye', 'Ne yaptın?');
  await s.enter('#giris-girdi', 'önizle');
  await s.enter('#giris-girdi', 'kaydet');
  return p.evaluate(() => {
    const t = SP.U.todayISO(), v = SP.S.vitals[t] || {};
    const ogunler = SP.S.meals[t] || [];
    const yuva = new Set(ogunler.map(m => m.slot)).size;
    const ok = v.sleep === 7.5 && v.rhr === 56 && v.hrv === 55 && v.weight === 72 && Number(v.water) >= 2000
      && ogunler.length >= 3 && yuva >= 3;
    return { ok, not:'su ' + v.water + ' ml · ' + ogunler.length + ' öğün, ' + yuva + ' ayrı yuva' };
  });
}

/* GÜNÜ KAPAT (Faz 1, 2026-10-25). Senaryo KOLAY-PLANI'nın hedeflediği
   kullanıcıdır: son 4 günde aynı üç öğün (kalıp, KOLAY §2.4: son 7 günün
   ≥ 4'ü). Kurulum sayılmaz; yalnız bugünün eylemleri sayılır. Ölçümler
   toplu onaylanmaz: tek satıra yazılır; su hedefi, «her zamanki» öğünler
   ve vadesi gelen hatırlatmalar «Hepsi doğru» ile. */
async function spiGunuKapat(p, s){
  await p.evaluate(async () => {
    const ogun = { kahvalti:'2 yumurta 1 çay', ogle:'1 tabak mercimek çorbası', aksam:'1 tabak etli kuru fasulye' };
    const bugun = SP.U.parse(SP.U.todayISO());
    for(let i = 1; i <= 4; i++){
      const d = SP.U.iso(SP.U.addDays(bugun, -i));
      for(const slot of Object.keys(ogun)){
        const meal = SP.Model.newMeal(slot);
        meal.items = SP.Quick.parse(ogun[slot]).data.items.map(x => ({ foodId:x.food.id, g:x.g, cert:'estimated' }));
        await SP.Model.addMeal(d, meal);
      }
    }
    SP.App.render();
  });
  await p.waitForTimeout(BEKLE);
  await s.tikla('.kapak__eylem [data-act="gunu-kapat"]', 'Günü kapat');
  await s.yaz('#gk-olcum', 'uyku 7.5, nabız 56, hrv 55, kilo 72', 'Ölçümler');
  await s.tikla('.gk__kapat', 'Hepsi doğru');
  await p.waitForTimeout(BEKLE);
  return p.evaluate(() => {
    const t = SP.U.todayISO(), v = SP.S.vitals[t] || {};
    const ogunler = SP.S.meals[t] || [];
    const yuva = new Set(ogunler.map(m => m.slot)).size;
    const ok = v.sleep === 7.5 && v.rhr === 56 && v.hrv === 55 && v.weight === 72 && Number(v.water) >= 2000
      && ogunler.length >= 3 && yuva >= 3;
    return { ok, not:'su ' + v.water + ' ml · ' + ogunler.length + ' öğün, ' + yuva + ' ayrı yuva' };
  });
}

async function espGunuKapat(p, s){
  await s.tikla('[data-act="gunu-kapat"]', 'Günü kapat');
  await s.yaz('#gk-olcum', '45 dk ingilizce', 'Ölçümler');
  await s.tikla('.gk__kapat', 'Kaydet');
  await p.waitForTimeout(BEKLE);
  return p.evaluate(() => {
    const l = ((ESP.S.days[ESP.U.todayISO()] || {}).sessions) || [];
    return { ok:l.some(x => Number(x.minutes) === 45), not:l.length + ' oturum' };
  });
}

async function espIyiGun(p, s){
  /* «45 dk ingilizce» Faz 0'da anlaşılmıyordu; dil adları takma ada eklendi (parse.js). */
  await s.yaz('#giris-girdi', '45 dk ingilizce', 'Ne yaptın?');
  await s.enter('#giris-girdi', 'önizle');
  await s.enter('#giris-girdi', 'kaydet');
  return p.evaluate(() => {
    const l = ((ESP.S.days[ESP.U.todayISO()] || {}).sessions) || [];
    return { ok:l.some(x => Number(x.minutes) === 45), not:l.length + ' oturum' };
  });
}

/* Modül başına yollar: Faz 1 «Günü kapat» yolunu ekler, eskisini silmez. */
const SENARYO = {
  AYS:[{ yol:'Günü düzenle', fn:aysIyiGun }, { yol:'Günü kapat', fn:aysGunuKapat }],
  SPI:[{ yol:'Ne yaptın? (tek cümle)', fn:spiIyiGun }, { yol:'Günü kapat (alışkanlıklı kullanıcı)', fn:spiGunuKapat }],
  ESP:[{ yol:'Ne yaptın?', fn:espIyiGun }, { yol:'Günü kapat', fn:espGunuKapat }],
};

async function olc(ad, m, b, yol){
  const p = await b.newPage({ viewport:{ width:1280, height:900 }, reducedMotion:'reduce' });
  const hata = [];
  p.on('pageerror', e => hata.push(e.message));
  await p.goto('file:///' + path.join(KOK, m.dosya).replace(/\\/g, '/'));
  await p.waitForFunction(ns => window[ns] && window[ns].App && window.LIFEOS && window.LIFEOS.Gizle, m.ns, { timeout:30000 });
  await p.waitForTimeout(2500);
  for(let i = 0; i < 3; i++){ await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
  await p.evaluate(ns => window[ns].App.go('today'), m.ns);
  await p.waitForTimeout(800);
  /* Y2: Bugün'de açık kart (sadelik.js kuralı) + pano kartı + kapak kutucuğu. */
  const y2 = await p.evaluate(() => {
    const kok = document.getElementById('app') || document.body, G = window.LIFEOS.Gizle;
    const gor = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent !== null; };
    const bl = Array.from(kok.querySelectorAll('section.sayfabolum'));
    const bolum = (bl.length ? bl : [kok]).reduce((en, x) => Math.max(en, G.bolumler(x)
      .filter(y => !y.el.classList.contains('gizle-kucuk') && !y.el.classList.contains('gizle-gizli') && gor(y.el)).length), 0);
    const kutu = Array.from(kok.querySelectorAll('section.pk, .kapak__sayilar > *')).filter(gor).length;
    return bolum + kutu;
  });
  const y3 = await p.evaluate(m.menu);
  const s = sayac(p);
  let sonuc;
  try{ sonuc = await yol.fn(p, s); }
  catch(e){ sonuc = { ok:false, not:'senaryo yürümedi: ' + String(e.message).split('\n')[0] }; }
  await p.close();
  return { ad, yol:yol.yol, y1:sonuc.ok ? s.adim : null, karakter:sonuc.ok ? s.karakter : null,
    sure:sonuc.ok ? sureTahmini(s.adim, s.karakter) : null, dogrulandi:sonuc.ok, not:sonuc.not,
    y2, y3, adimlar:s.gunluk, hata };
}
/* Modülün özeti: doğrulanan en kısa yol (önce eylem, sonra tahmini süre). */
function enKisa(l){
  const ok = l.filter(r => r.dogrulandi).sort((a, c) => a.y1 - c.y1 || a.sure - c.sure);
  return ok[0] || l[0];
}

(async () => {
  const json = process.argv.includes('--json'), denetle = process.argv.includes('--denetle');
  const b = await chromium.launch();
  const yollar = [];
  for(const ad of Object.keys(MODUL)) for(const yol of SENARYO[ad]) yollar.push(await olc(ad, MODUL[ad], b, yol));
  await b.close();
  const sonuc = Object.keys(MODUL).map(ad => Object.assign({}, enKisa(yollar.filter(r => r.ad === ad)),
    { yollar:yollar.filter(r => r.ad === ad).map(r => ({ yol:r.yol, y1:r.y1, karakter:r.karakter, sure:r.sure, dogrulandi:r.dogrulandi, not:r.not })) }));
  if(json){ process.stdout.write(JSON.stringify(sonuc, null, 1) + '\n'); }
  else{
    const pad = (x, n) => String(x).padEnd(n);
    const bos = x => x == null ? '—' : x;
    console.log(pad('modül', 7) + pad('Y1 eylem', 10) + pad('karakter', 10) + pad('süre*', 8) + pad('Y2 kart', 9) + pad('Y3 menü', 9) + 'en kısa yol · doğrulama');
    sonuc.forEach(r => {
      console.log(pad(r.ad, 7) + pad(bos(r.y1), 10) + pad(bos(r.karakter), 10) + pad(r.sure == null ? '—' : r.sure + ' sn', 8)
        + pad(r.y2, 9) + pad(r.y3, 9) + r.yol + ' · ' + (r.dogrulandi ? 'kayıt yazıldı (' + r.not + ')' : 'DOĞRULANMADI — ' + r.not));
      r.yollar.filter(y => y.yol !== r.yol).forEach(y => console.log(pad('', 7) + pad(bos(y.y1), 10) + pad(bos(y.karakter), 10)
        + pad(y.sure == null ? '—' : y.sure + ' sn', 8) + pad('', 18) + 'öbür yol: ' + y.yol + (y.dogrulandi ? '' : ' · DOĞRULANMADI — ' + y.not)));
    });
    console.log('\n* süre tahmindir: eylem × 1,5 sn + karakter × 0,3 sn (gerçek süre P1, cihazda).');
    console.log('Hedef: Y1 ≤ ' + HEDEF.y1 + ' eylem ve ≤ ' + HEDEF.sure + ' sn · Y2 ≤ ' + HEDEF.y2 + ' kart · Y3 ≤ ' + HEDEF.y3 + ' çekmece');
    yollar.filter(r => r.hata.length).forEach(r => console.log('  ' + r.ad + ' (' + r.yol + ') sayfa hatası: ' + r.hata[0]));
  }
  const geride = sonuc.some(r => !r.dogrulandi || r.y1 > HEDEF.y1 || r.sure > HEDEF.sure || r.y2 > HEDEF.y2 || r.y3 > HEDEF.y3);
  process.exit(denetle && geride ? 1 : 0);
})();
