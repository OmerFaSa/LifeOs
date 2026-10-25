/* PUSULA ÖLÇÜMÜ — Kolay LifeOS planının yardımcı ölçüleri (belgeler/ekip/KOLAY-PLANI.md §1).

   Y1 · İyi gün kaydı: plana uyan bir günü kaydetmek için gereken EYLEM sayısı
        (dokunuş, alan doldurma, Enter) ve yazılan karakter. Her modülde bugün
        uygulamanın sunduğu EN KISA yol gerçekten yürütülür ve kaydın yazıldığı
        DOĞRULANIR — doğrulanmayan senaryo sayılmaz (ölçülmemiş şey «temiz»
        diye raporlanmaz, AGENTS §1.7).
   Y2 · Bugün yoğunluğu: Bugün ekranında açık kart (sadelik.js ile aynı kural).
   Y3 · Menü öğesi: kenar çubuğundaki çekmece sayısı.

   P1 ve P2 kullanıcının cihazındaki veriden gelir; bu araç onları ölçmez,
   uygulama içinde Ayarlar › Genel'deki pusula satırı gösterir.

   «İyi gün» tanımları (modülün kendi işi):
     AYS  günün blokları «Tamamlandı», her birinde soru ve doğru; uyku.
     SPİ  günün ölçümü (uyku, nabız, HRV, kilo); 8 bardak su; 3 öğün.
     ESP  günün oturumu (bir disiplin, dakikasıyla).

     node tools/pusula.js              # tablo
     node tools/pusula.js --json       # makinece okunur
     node tools/pusula.js --denetle    # hedefin gerisindeyse çıkış 1 (Y1 ≤ 3, Y2 ≤ 3, Y3 ≤ 4)

   Sunucu gerekmez: dist/*.html dosyadan açılır; sabit port yok. Önce build.py. */

const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'ESP', 'node_modules', 'playwright'));

const KOK = path.join(__dirname, '..');
const HEDEF = { y1:3, y2:3, y3:4 };
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

const SENARYO = { AYS:aysIyiGun, SPI:spiIyiGun, ESP:espIyiGun };

async function olc(ad, m, b){
  const p = await b.newPage({ viewport:{ width:1280, height:900 }, reducedMotion:'reduce' });
  const hata = [];
  p.on('pageerror', e => hata.push(e.message));
  await p.goto('file:///' + path.join(KOK, m.dosya).replace(/\\/g, '/'));
  await p.waitForFunction(ns => window[ns] && window[ns].App && window.LIFEOS && window.LIFEOS.Gizle, m.ns, { timeout:30000 });
  await p.waitForTimeout(2500);
  for(let i = 0; i < 3; i++){ await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
  await p.evaluate(ns => window[ns].App.go('today'), m.ns);
  await p.waitForTimeout(800);
  /* Y2: Bugün'de açık kart (sadelik.js kuralı). */
  const y2 = await p.evaluate(() => {
    const kok = document.getElementById('app') || document.body, G = window.LIFEOS.Gizle;
    const gor = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent !== null; };
    const bl = Array.from(kok.querySelectorAll('section.sayfabolum'));
    return (bl.length ? bl : [kok]).reduce((en, x) => Math.max(en, G.bolumler(x)
      .filter(y => !y.el.classList.contains('gizle-kucuk') && !y.el.classList.contains('gizle-gizli') && gor(y.el)).length), 0);
  });
  const y3 = await p.evaluate(m.menu);
  const s = sayac(p);
  let sonuc;
  try{ sonuc = await SENARYO[ad](p, s); }
  catch(e){ sonuc = { ok:false, not:'senaryo yürümedi: ' + String(e.message).split('\n')[0] }; }
  await p.close();
  return { ad, y1:sonuc.ok ? s.adim : null, karakter:sonuc.ok ? s.karakter : null, dogrulandi:sonuc.ok, not:sonuc.not,
    y2, y3, adimlar:s.gunluk, hata };
}

(async () => {
  const json = process.argv.includes('--json'), denetle = process.argv.includes('--denetle');
  const b = await chromium.launch();
  const sonuc = [];
  for(const ad of Object.keys(MODUL)) sonuc.push(await olc(ad, MODUL[ad], b));
  await b.close();
  if(json){ process.stdout.write(JSON.stringify(sonuc, null, 1) + '\n'); }
  else{
    const pad = (x, n) => String(x).padEnd(n);
    console.log(pad('modül', 7) + pad('Y1 eylem', 10) + pad('karakter', 10) + pad('Y2 kart', 9) + pad('Y3 menü', 9) + 'doğrulama');
    sonuc.forEach(r => console.log(pad(r.ad, 7) + pad(r.y1 == null ? '—' : r.y1, 10) + pad(r.karakter == null ? '—' : r.karakter, 10)
      + pad(r.y2, 9) + pad(r.y3, 9) + (r.dogrulandi ? 'kayıt yazıldı (' + r.not + ')' : 'DOĞRULANMADI — ' + r.not)));
    console.log('\nHedef: Y1 ≤ ' + HEDEF.y1 + ' eylem · Y2 ≤ ' + HEDEF.y2 + ' kart · Y3 ≤ ' + HEDEF.y3 + ' çekmece');
    sonuc.filter(r => r.hata.length).forEach(r => console.log('  ' + r.ad + ' sayfa hatası: ' + r.hata[0]));
  }
  const geride = sonuc.some(r => !r.dogrulandi || r.y1 > HEDEF.y1 || r.y2 > HEDEF.y2 || r.y3 > HEDEF.y3);
  process.exit(denetle && geride ? 1 : 0);
})();
