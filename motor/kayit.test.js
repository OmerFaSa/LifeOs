/* Kayıt motoru testi — `node motor/kayit.test.js`. Her satır ✓ ya da ✕; kırmızıda çıkış 1.

   Kural testleri eski SPİ kural motorlarının GERÇEK kaynağını yükler (core/move.js, core/nutri.js,
   data/movement.js, data/nutrients.js, data/biomarkers.js, core/uyku.js, core/kotugun.js), aynı
   rastgele geçmişi hem eski duruma hem (göç bağdaştırıcılarıyla) tipli kayıtlara koyar ve
   sonuçları gün gün karşılaştırır. Eski kodun tarayıcı/depo bağımlılıkları (SP.Model) burada
   kaynaktaki tanımına göre elle kurulur; satırları yanlarında. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const K = require('./kayit.js');
const R = K.Kural;

const KOK = path.join(__dirname, '..');
const ESKI = path.join(__dirname, 'eski');   // kapanis: esitlik icin donmus eski modul kaynaklari (belgeler/ekip/sadelesme/faz7-kapanis.md)
const kaynak = f => fs.readFileSync(path.join(/^(AYS|SPI|ESP)\//.test(f) ? ESKI : KOK, f), 'utf8');

/* Eski kaynakların tarayıcı küreselleri (yalnız yüklemek için; motor bunlara bakmaz). */
globalThis.window = globalThis;
globalThis.yz = s => s;
globalThis.LIFEOS = { PARCA:{ yazilar(){} } };
require(path.join(KOK, 'brand/ortak/tarih.js'));
require(path.join(KOK, 'brand/ortak/bicim.js'));
['core/utils.js', 'data/biomarkers.js', 'data/movement.js', 'data/nutrients.js', 'core/move.js', 'core/nutri.js',
  'core/uyku.js', 'core/kotugun.js'].forEach(f => require(path.join(ESKI, 'SPI/src/js', f)));
const SP = globalThis.SP;

let n = 0, kirmizi = 0;
function it(ad, f){
  n++;
  try{ f(); console.log('✓ ' + ad); }
  catch(e){ kirmizi++; console.log('✕ ' + ad + '\n    ' + (e && e.message)); }
}
const yakin = (a, b, e, m) => assert.ok(Math.abs(a - b) <= e, (m || '') + ' ' + a + ' ≉ ' + b);
const G0 = '2026-09-01', YIL = 2026;
const gunEkle = K.yardimci.gunEkle;
const kay = (tur, girdi, gun, ek) => { const r = K.kaydet(tur, girdi, Object.assign({ gun:gun || G0 }, ek)); assert.ok(r.ok, (r.hatalar || []).join(' ')); return r.kayit; };

/* ------------------------------------------------------------ eski durum */
/* SP.Model'in kural motorlarının okuduğu dört işlevi (SPI core/state.js). */
function eskiDurum(vitals, workouts, profil){
  SP.S = { vitals, workouts:workouts.slice().sort((a, b) => a.date < b.date ? -1 : 1), profile:profil, labs:[], kotuGun:{} };
  SP.Model = {
    workoutsOf:d => SP.S.workouts.filter(w => w.date === d),             // state.js workoutsOf
    latestOf:() => null,                                                  // tahlil yok
    ageOf:p => p && p.birthYear ? YIL - Number(p.birthYear) : null,      // state.js:202-206, yıl sabit
    kiloOf:p => {                                                         // state.js:588-594
      const g = Object.keys(SP.S.vitals).filter(d => SP.S.vitals[d].weight > 0).sort().pop();
      if(g) return { kg:SP.S.vitals[g].weight, date:g };
      return Number(p.weightKg) > 0 ? { kg:Number(p.weightKg), date:null } : null;
    },
  };
}
/* Tohumlu rastgele (mulberry32): her koşu aynı geçmiş. */
function rastgele(tohum){
  let a = tohum >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const KATALOG = SP.EXERCISES.filter(e => e.met > 0).map(e => e.id);
const metOf = id => SP.EX_BY_ID[id] ? SP.EX_BY_ID[id].met : null;

function senaryo(tohum, gunSay){
  const r = rastgele(tohum), vitals = {}, workouts = [];
  for(let i = 0; i < gunSay; i++){
    const gun = gunEkle(G0, i), v = { date:gun };
    if(r() < 0.8) v.sleep = Math.round((4 + r() * 6) * 2) / 2;
    if(r() < 0.6) v.hrv = Math.round(40 + r() * 40);
    if(r() < 0.6) v.rhr = Math.round(50 + r() * 20);
    if(r() < 0.5) v.soreness = 1 + Math.floor(r() * 5);
    if(r() < 0.06) v.temp = 38 + Math.round(r() * 15) / 10;
    if(r() < 0.04) v.spo2 = 88 + Math.floor(r() * 10);
    if(i === 0) v.weight = 78;
    if(Object.keys(v).length > 1) vitals[gun] = v;
    const seans = r() < 0.55 ? (r() < 0.2 ? 2 : 1) : 0;
    for(let s = 0; s < seans; s++){
      const kalem = () => ({ exId:r() < 0.1 ? 'yuzme-bilinmez' : KATALOG[Math.floor(r() * KATALOG.length)], minutes:r() < 0.4 ? 10 + Math.floor(r() * 30) : null });
      workouts.push({ id:'w' + i + '-' + s, date:gun, name:'Seans', kind:'strength', minutes:20 + Math.floor(r() * 60),
        rpe:r() < 0.5 ? 1 + Math.floor(r() * 10) : null, items:Array.from({ length:1 + Math.floor(r() * 3) }, kalem), createdAt:gun + 'T08:00:00Z' });
    }
  }
  const kayitlar = [], red = [];
  Object.keys(vitals).forEach(g => { const o = K.GOC.spiVitals(vitals[g]); kayitlar.push(...o.kayitlar); red.push(...o.reddedilen); });
  workouts.forEach(w => { const o = K.GOC.spiAntrenman(w, metOf); kayitlar.push(...o.kayitlar); red.push(...o.reddedilen); });
  return { vitals, workouts, kayitlar, red };
}

/* ============================================================ tür tablosu ve doğrulama */

it('her tür tek satırda: ad, alan ve en az bir sayı ya da metin alanı; her sayı alanının adı, birimi, sınırı var', () => {
  Object.keys(K.TURLER).forEach(t => {
    const x = K.TURLER[t];
    assert.ok(x.ad && x.alan && (x.sayilar || x.metinler), t);
    Object.keys(x.sayilar || {}).forEach(a => { const f = x.sayilar[a]; assert.ok(f.ad && typeof f.min === 'number' && f.max > f.min && 'birim' in f, t + '.' + a); });
  });
  ['ogun', 'uyku', 'hareket', 'kilo', 'nabiz', 'calisma', 'enerji', 'su'].forEach(t => assert.ok(K.TURLER[t], t));
});

it('sınırlar eski giriş ekranıyla aynı (SPI screens/today.js:298-309) ve kestirme sınırları SP.Uyku ile aynı', () => {
  const src = kaynak('SPI/src/js/screens/today.js');
  const es = { sleep:['uyku', 'saat'], rhr:['nabiz', 'atim'], hrv:['hrv', 'ms'], sbp:['tansiyon', 'buyuk'], dbp:['tansiyon', 'kucuk'],
    spo2:['spo2', 'yuzde'], temp:['ates', 'derece'], weight:['kilo', 'kg'], waist:['bel', 'cm'], bodyfat:['yagOrani', 'yuzde'], water:['su', 'ml'] };
  Object.keys(es).forEach(id => {
    const m = src.match(new RegExp("\\{ id:'" + id + "',[^}]*min:(\\d+),\\s*max:(\\d+)"));
    assert.ok(m, id + ' kaynakta yok');
    const f = K.TURLER[es[id][0]].sayilar[es[id][1]];
    assert.strictEqual(f.max, +m[2], id + ' üst');
    // su: 0 ml ölçüm değildir (state.js:624-629), bu yüzden alt sınır 1
    assert.strictEqual(f.min, id === 'water' ? 1 : +m[1], id + ' alt');
  });
  assert.strictEqual(K.TURLER.kestirme.sayilar.dk.max, SP.Uyku.EN_COK_DK);
  assert.strictEqual(K.TURLER.kestirme.gunTavani, +kaynak('SPI/src/js/core/uyku.js').match(/EN_COK_ADET = (\d+)/)[1]);
});

it('doğrulama Türkçe cümle döndürür; geçerli kayıt kurulur', () => {
  const h = g => K.kaydet('kilo', g, { gun:G0 });
  assert.deepStrictEqual(h({}).hatalar, ['Kilo yazılmalı.']);
  assert.deepStrictEqual(h({ kg:'abc' }).hatalar, ['Kilo sayı olmalı.']);
  assert.deepStrictEqual(h({ kg:300 }).hatalar, ['Kilo 20 ile 250 kg arasında olmalı.']);
  assert.deepStrictEqual(h({ kg:70, boy:180 }).hatalar, ['Kilo kaydında «boy» alanı yok.']);
  assert.deepStrictEqual(K.kaydet('yagOrani', { yuzde:80 }, { gun:G0 }).hatalar, ['Yağ oranı %3 ile %60 arasında olmalı.']);
  assert.deepStrictEqual(K.kaydet('nabiz', { atim:60.5 }, { gun:G0 }).hatalar, ['İstirahat nabzı tam sayı olmalı.']);
  assert.deepStrictEqual(K.kaydet('kestirme', { dk:300 }, { gun:G0 }).hatalar, ['300 dakika kısa uyku için fazla; gece uykusuysa «Gece uykusu» kaydını kullan.']);
  assert.deepStrictEqual(K.kaydet('kestirme', { dk:30, bas:'25:00' }, { gun:G0 }).hatalar, ['Saat 00:00–23:59 biçiminde olur.']);
  assert.deepStrictEqual(K.kaydet('hareket', { dk:30, tur:'yoga' }, { gun:G0 }).hatalar, ['Tür şunlardan biri olmalı: kuvvet, kardiyo, mobilite.']);
  assert.deepStrictEqual(K.kaydet('calisma', { dk:30 }, { gun:G0 }).hatalar, ['Alan yazılmalı.']);
  assert.deepStrictEqual(K.kaydet('kilo', { kg:70 }, { gun:'1.9.2026' }).hatalar, ['Gün YYYY-AA-GG biçiminde olmalı.']);
  assert.deepStrictEqual(K.kaydet('yok', {}, { gun:G0 }).hatalar, ['Bilinmeyen kayıt türü: yok.']);
  const ok = K.kaydet('kilo', { kg:'72,5' }, { gun:G0, zaman:5 });
  assert.ok(ok.ok);
  assert.deepStrictEqual(ok.kayit, { id:'kilo:' + G0 + ':5', tur:'kilo', gun:G0, zaman:5, kaynak:'kullanici', deger:{ kg:{ v:72.5, k:'measured' } }, ek:{} });
});

it('kestirme günde en çok 6 (SPI core/uyku.js:51)', () => {
  const mevcut = Array.from({ length:6 }, (_, i) => kay('kestirme', { dk:10 }, G0, { zaman:i }));
  assert.deepStrictEqual(K.kaydet('kestirme', { dk:10 }, { gun:G0, mevcut }).hatalar, ['Bir günde en çok 6 kısa uyku yazılır.']);
  assert.ok(K.kaydet('kestirme', { dk:10 }, { gun:gunEkle(G0, 1), mevcut }).ok);
});

/* ============================================================ etiketler */

it('etiket: yazılan sayı measured, «tahmin» estimated; kullanıcı computed ya da eski yazamaz', () => {
  assert.strictEqual(kay('su', { ml:500 }).deger.ml.k, 'measured');
  assert.strictEqual(kay('su', { ml:{ v:500, k:'estimated' } }).deger.ml.k, 'estimated');
  ['computed', 'eski', 'missing', 'uydurma'].forEach(k =>
    assert.deepStrictEqual(K.kaydet('su', { ml:{ v:500, k } }, { gun:G0 }).hatalar, ['Su için etiket «ölçüldü» ya da «tahmin» olabilir.'], k));
  assert.deepStrictEqual(K.deger(kay('ogun', { icerik:'çorba' }), 'kcal'), { v:null, k:'missing' });
  assert.deepStrictEqual(Object.keys(K.ETIKET), ['measured', 'estimated', 'computed', 'missing', 'eski']);
});

it('toplamın etiketi en zayıf parçadan: ölçülmüşlerin toplamı computed, tahmin karışırsa estimated, boşsa missing', () => {
  assert.strictEqual(K.birlesik(['measured', 'measured']), 'computed');
  assert.strictEqual(K.birlesik(['measured', 'estimated']), 'estimated');
  assert.strictEqual(K.birlesik(['measured', 'eski']), 'eski');
  assert.strictEqual(K.birlesik(['eski', 'estimated']), 'estimated');
  assert.strictEqual(K.birlesik([]), 'missing');
});

/* ============================================================ toplamlar */

it('günlük toplam: su, uyku (gece + kestirme), hareket, çalışma alanları, öğün, ölçüm; eksik veri sıfır değil', () => {
  const g = G0, l = [
    kay('su', { ml:500 }, g, { zaman:1 }), kay('su', { ml:{ v:250, k:'estimated' } }, g, { zaman:2 }),
    kay('uyku', { saat:7 }, g), kay('kestirme', { dk:30 }, g, { zaman:3 }),
    kay('hareket', { dk:40, rpe:6 }, g, { zaman:4 }), kay('hareket', { dk:20 }, g, { zaman:5 }),
    kay('calisma', { dk:50, alan:'akademik' }, g, { zaman:6 }), kay('calisma', { dk:25, alan:'esp' }, g, { zaman:7 }),
    kay('ogun', { icerik:'yumurta', kcal:300 }, g, { zaman:8 }), kay('ogun', { icerik:'salata' }, g, { zaman:9 }),
    kay('kilo', { kg:80 }, g, { zaman:10 }), kay('kilo', { kg:79.5 }, g, { zaman:11 }), kay('enerji', { puan:4 }, g),
  ];
  const d = K.gunluk(l, g);
  assert.deepStrictEqual(d.su, { v:750, k:'estimated' });
  assert.deepStrictEqual(d.uyku.toplamDk, { v:450, k:'computed' });
  assert.strictEqual(d.uyku.kestirmeSayisi, 1);
  assert.deepStrictEqual(d.hareket.dk, { v:60, k:'computed' });
  assert.deepStrictEqual(d.hareket.yuk, { v:240, k:'computed', bilinmeyen:1 });   // ikinci seansın yükü bilinmiyor
  assert.deepStrictEqual(d.calisma.alanlar, { akademik:{ v:50, k:'computed' }, esp:{ v:25, k:'computed' } });
  assert.deepStrictEqual(d.ogun.kcal, { v:300, k:'computed', eksik:1 });          // kcal'siz öğün sıfır sayılmaz
  assert.deepStrictEqual(d.olcum.kilo.kg, { v:79.5, k:'measured' });             // günün son ölçümü
  assert.deepStrictEqual(d.enerji, { v:4, k:'measured' });
  const bos = K.gunluk(l, gunEkle(g, 1));
  assert.deepStrictEqual([bos.su, bos.uyku.toplamDk, bos.hareket.yuk.v, bos.mola], [{ v:null, k:'missing' }, { v:null, k:'missing' }, null, { v:null, k:'missing' }]);
});

it('gece uykusu yoksa günün toplam uykusu «veri yok» (SPI core/uyku.js:71-77)', () => {
  const d = K.gunluk([kay('kestirme', { dk:30 })], G0);
  assert.deepStrictEqual(d.uyku.toplamDk, { v:null, k:'missing' });
  assert.strictEqual(d.uyku.kestirmeDk.v, 30);
});

it('haftalık: ortalama yalnız verisi olan günlerden; 0 saatlik gece ortalamaya girmez; toplamlar ve son kilo', () => {
  const l = [kay('uyku', { saat:6 }, '2026-09-01'), kay('uyku', { saat:8 }, '2026-09-03'), kay('uyku', { saat:0 }, '2026-09-04'),
    kay('su', { ml:1000 }, '2026-09-02'), kay('hareket', { dk:30, rpe:5 }, '2026-09-05'), kay('kilo', { kg:81 }, '2026-08-20')];
  const h = K.haftalik(l, '2026-09-07');
  assert.strictEqual(h.bas, '2026-09-01');
  assert.deepStrictEqual(h.uykuOrt, { v:7, k:'computed', gun:2 });
  assert.deepStrictEqual(h.suOrt, { v:1000, k:'computed', gun:1 });
  assert.deepStrictEqual(h.yuk, { v:150, k:'computed', gun:1 });
  assert.deepStrictEqual(h.enerjiOrt, { v:null, k:'missing' });
  assert.strictEqual(h.kilo.v, 81);
  assert.strictEqual(h.veriGunu, 5);
});

/* ============================================================ kurallar: sabitler eski kaynakta */

it('sabitler eski kaynaktan: hedef oranları, toparlanma ağırlıkları, bantlar, yük kuralları, ideal uyku, kötü gün', () => {
  SP.GOALS.forEach(g => assert.strictEqual(R.HEDEF_ORANI[{ health:'saglik', maintain:'koru', cut:'ver', gain:'al' }[g.id]], g.deficit, g.id));
  const harita = { sleep:'uyku', hrv:'hrv', rhr:'nabiz', soreness:'enerji' };
  SP.READINESS_INPUTS.forEach(x => assert.strictEqual(R.TOPARLANMA[harita[x.id]].agirlik, x.weight, x.id));
  assert.deepStrictEqual(R.BANTLAR.map(b => [b.id, b.min, b.carpan]), SP.READINESS_BANDS.map(b => [b.id, b.min, b.factor]));
  const L = SP.LOAD_RULES;
  assert.deepStrictEqual([R.YUK.acwrAlt, R.YUK.acwrUst, R.YUK.buyume, R.YUK.indirmeHafta, R.YUK.indirmeCarpan, R.YUK.asgariDk],
    [L.acwr.low, L.acwr.high, L.weeklyGrowth.max, L.deload.everyWeeks, L.deload.factor, L.minDay.minutes]);
  assert.deepStrictEqual(R.UYKU_IDEAL, SP.BIO_BY_ID.sleep.optimal);
  const mv = kaynak('SPI/src/js/core/move.js');
  assert.strictEqual(R.INCE_ESIK, +mv.match(/const INCE_ESIK = ([\d.]+)/)[1]);
  assert.strictEqual(R.ACWR_UST_CARPAN, +mv.match(/a\.zone === 'high'\)\{\s*factor = Math\.min\(factor, ([\d.]+)\)/)[1]);
  assert.strictEqual(R.ATES_ESIK, +mv.match(/v\.temp >= ([\d.]+)/)[1]);
  assert.strictEqual(R.SPO2_ESIK, +mv.match(/v\.spo2 < (\d+)/)[1]);
  assert.strictEqual(R.KOTU_GUN_CARPAN, +kaynak('SPI/src/js/core/kotugun.js').match(/const CARPAN = ([\d.]+)/)[1]);
});

/* ============================================================ kurallar: eski motorla gün gün aynı */

const SENARYOLAR = [11, 23, 37, 58].map(t => Object.assign({ tohum:t }, senaryo(t, 50)));

it('göç: rastgele SPİ geçmişinin hiçbir değeri reddedilmez (sınırlar eski girişle aynı)', () => {
  SENARYOLAR.forEach(s => assert.deepStrictEqual(s.red, [], 'tohum ' + s.tohum));
});

it('toparlanma eski readiness ile aynı: ok, puan, bant, ince, kapsam (4 geçmiş × 50 gün)', () => {
  let k = 0;
  SENARYOLAR.forEach(s => {
    eskiDurum(s.vitals, s.workouts, {});
    for(let i = 0; i < 50; i++){
      const g = gunEkle(G0, i), e = SP.Move.readiness(g), y = R.toparlanma(s.kayitlar, g);
      assert.strictEqual(y.ok, e.ok, g);
      if(!e.ok) continue;
      k++;
      assert.deepStrictEqual([y.puan.v, y.bant.id, y.ince, y.kapsam], [e.score, e.band.id, e.thin, e.coverage], 'tohum ' + s.tohum + ' ' + g);
    }
  });
  assert.ok(k > 100, 'karşılaştırılan gün az: ' + k);
});

it('yük: ACWR, indirme haftası, haftalık büyüme eski acwr/deloadWeek/weeklyGrowth ile aynı', () => {
  let k = 0;
  SENARYOLAR.forEach(s => {
    eskiDurum(s.vitals, s.workouts, {});
    for(let i = 0; i < 50; i++){
      const g = gunEkle(G0, i);
      const ea = SP.Move.acwr(g), ya = R.akutKronik(s.kayitlar, g);
      assert.strictEqual(ya.ok, ea.ok, 'acwr ok ' + g);
      if(ea.ok){ k++; assert.deepStrictEqual([ya.oran.v, ya.bolge, ya.kronikGun, ya.bilinmeyen, ya.akut, ya.kronik], [ea.ratio, ea.zone, ea.chronicDays, ea.unknown, ea.acute, ea.chronic], g); }
      const ed = SP.Move.deloadWeek(g), yd = R.indirmeHaftasi(s.kayitlar, g);
      assert.deepStrictEqual([yd.due, yd.hafta], [ed.due, ed.week], 'indirme ' + g);
      const ew = SP.Move.weeklyGrowth(g), yw = R.haftalikBuyume(s.kayitlar, g);
      assert.deepStrictEqual([yw.ok, yw.buHafta, yw.gecenHafta], [ew.ok, ew.thisWeek, ew.lastWeek], 'büyüme ' + g);
      if(ew.ok) assert.deepStrictEqual([yw.buyume.v, yw.asti], [ew.growth, ew.over], g);
    }
  });
  assert.ok(k > 40, 'ACWR karşılaştırılan gün az: ' + k);
});

it('günün emri eski prescription ile aynı çarpan ve tür (bayrak + veri yok günleri hariç: bilinçli sapma, aşağıda)', () => {
  SENARYOLAR.forEach(s => {
    eskiDurum(s.vitals, s.workouts, {});
    for(let i = 0; i < 50; i++){
      const g = gunEkle(G0, i), e = SP.Move.prescription(g), y = R.gununEmri(s.kayitlar, g);
      if(!e.readiness.ok && y.toparlanma.bayrak) continue;
      assert.deepStrictEqual([y.carpan.v, y.tur], [e.factor, e.kind], 'tohum ' + s.tohum + ' ' + g);
    }
  });
});

it('kötü gün eski KotuGun ile aynı biçimde yalnız hafifletir', () => {
  const s = SENARYOLAR[0];
  eskiDurum(s.vitals, s.workouts, {});
  for(let i = 0; i < 50; i++){
    const g = gunEkle(G0, i);
    SP.S.kotuGun = { [g]:{ at:0 } };
    const e = SP.Move.prescription(g), y = R.gununEmri(s.kayitlar, g, { kotuGun:true });
    if(!e.readiness.ok && y.toparlanma.bayrak) continue;
    assert.strictEqual(y.carpan.v, e.factor, g);
    assert.ok(y.carpan.v <= R.KOTU_GUN_CARPAN && y.carpan.v <= R.gununEmri(s.kayitlar, g).carpan.v, g);
  }
});

it('enerji hedefi eski targets ile aynı: kcal, BMR, bazal tabanı (4 hedef × plan farkı × 4 geçmiş)', () => {
  const profiller = [];
  ['health', 'maintain', 'cut', 'gain'].forEach(goal => [null, { fark:-500 }, { fark:-3000 }, { kcal:1200 }, { kcal:2600 }].forEach(kh =>
    ['male', 'female'].forEach(sex => profiller.push({ id:'p', heightCm:178, birthYear:1996, sex, goal, weightKg:90, kcalHedef:kh }))));
  SENARYOLAR.forEach(s => {
    profiller.forEach(p => {
      eskiDurum(s.vitals, s.workouts, p);
      for(let i = 40; i < 50; i++){
        const g = gunEkle(G0, i), e = SP.Nutri.targets(p, g), y = R.enerjiHedefi(K.GOC.spiProfil(p), s.kayitlar, g, YIL);
        assert.deepStrictEqual([y.deger.v, y.bmr.v, y.ihtiyac.v, !!y.bmrTaban, y.kaynak === 'plan'], [e.kcal, e.bmr, e.tdee, !!e.bmrTaban, e.kcalKaynak === 'plan'],
          'tohum ' + s.tohum + ' ' + g + ' ' + JSON.stringify(p));
        assert.strictEqual(y.hareket.kcal, e.need.hareket, 'hareket enerjisi ' + g);
      }
    });
  });
});

it('enerji hedefi: profil eksikse sayı yok, eksikler adıyla (nutri.js:283-287); yıl verilmezse hata', () => {
  const y = R.enerjiHedefi({ boy:170 }, [], G0, YIL);
  assert.deepStrictEqual(y.deger, { v:null, k:'missing' });
  assert.deepStrictEqual(y.eksik, ['kilo', 'doğum yılı', 'cinsiyet']);
  assert.throws(() => R.bmr({ kilo:70, boy:170, cinsiyet:'erkek', dogumYili:1990 }), /yil verilmeli/);
});

/* ============================================================ güvenlik sınırları (AGENTS §1.3) */

it('GÜVENLİK: enerji hedefi hiçbir hedef ve planda bazal metabolizmanın altına inmez', () => {
  ['saglik', 'koru', 'ver', 'al'].forEach(hedef => [null, { fark:-5000 }, { kcal:500 }].forEach(kcalHedef => {
    const y = R.enerjiHedefi({ kilo:55, boy:160, dogumYili:2000, cinsiyet:'kadin', hedef, kcalHedef }, [], G0, YIL);
    assert.ok(y.deger.v >= y.bmr.v, hedef + ' ' + JSON.stringify(kcalHedef) + ': ' + y.deger.v + ' < ' + y.bmr.v);
  }));
  const t = R.enerjiHedefi({ kilo:55, boy:160, dogumYili:2000, cinsiyet:'kadin', hedef:'ver', kcalHedef:{ fark:-5000 } }, [], G0, YIL);
  assert.ok(t.bmrTaban && t.deger.v === t.bmr.v);
});

it('GÜVENLİK: haftalık yük ve süre tavanı geçen haftanın en çok %10 fazlası; aşan hafta işaretlenir', () => {
  const l = [];
  for(let i = 0; i < 7; i++) l.push(kay('hareket', { dk:30, rpe:5 }, gunEkle('2026-09-01', i)));
  for(let i = 7; i < 14; i++) l.push(kay('hareket', { dk:40, rpe:5 }, gunEkle('2026-09-01', i)));
  const w = R.haftalikBuyume(l, '2026-09-14');
  assert.deepStrictEqual([w.gecenHafta, w.buHafta, w.enCok.v, w.dkEnCok.v, w.asti], [1050, 1400, 1155, 231, true]);
  const bos = R.haftalikBuyume([], '2026-09-14');
  assert.deepStrictEqual([bos.ok, bos.enCok.k], [false, 'missing']);   // geçen hafta yoksa tavan uydurulmaz
});

it('GÜVENLİK: sistem yükü yalnız azaltır; ateş ≥ 38,5 ya da oksijen < %92 dinlenme; ince ölçüm artıramaz', () => {
  SENARYOLAR.forEach(s => {
    for(let i = 0; i < 50; i++){
      const g = gunEkle(G0, i), y = R.gununEmri(s.kayitlar, g);
      assert.ok(y.carpan.v <= (y.toparlanma.bant ? y.toparlanma.bant.carpan : 1), g);
      if(y.toparlanma.bayrak) assert.strictEqual(y.carpan.v, 0, g);
      if(y.toparlanma.ince) assert.ok(y.carpan.v <= 1, g);
    }
  });
  const yalniz = [kay('enerji', { puan:5 })];
  assert.strictEqual(R.gununEmri(yalniz, G0).carpan.v, 1);   // yalnız enerji=5: bant 1,1 ama ince → 1
});

it('SAPMA (bilinçli, daha temkinli): veri yokken de ateş günü dinlenme günüdür (eski kod tam yük veriyordu)', () => {
  const l = [kay('ates', { derece:39 })];
  eskiDurum({ [G0]:{ date:G0, temp:39 } }, [], {});
  assert.strictEqual(SP.Move.prescription(G0).factor, 1);
  assert.deepStrictEqual([R.gununEmri(l, G0).carpan.v, R.gununEmri(l, G0).tur], [0, 'rest']);
});

it('GÜVENLİK: katalogda teşhis ya da ilaç/doz alanı yok', () => {
  const metin = JSON.stringify(K.TURLER, (k, v) => v instanceof RegExp ? String(v) : v).toLocaleLowerCase('tr');
  ['ilac', 'ilaç', 'doz', 'teshis', 'teşhis', 'tani', 'tanı'].forEach(s => assert.ok(!metin.includes(s), s));
});

/* ============================================================ göç bağdaştırıcıları */

it('göç SPİ vitals: her ölçü kendi türüne, etiketsiz sayı «eski»; 0 ml su atlanır; beyan su tahmin; kestirmeler ayrı', () => {
  const o = K.GOC.spiVitals({ date:G0, weight:80, rhr:58, sbp:120, dbp:80, water:0, soreness:3, sleep:7.5,
    kestirmeler:[{ id:'a', dk:20, bas:'13:00', at:'2026-09-01T13:30:00Z' }, { id:'b', dk:15, bas:null }] });
  assert.deepStrictEqual(o.reddedilen, []);
  assert.deepStrictEqual(o.kayitlar.map(r => r.tur).sort(), ['enerji', 'kestirme', 'kestirme', 'kilo', 'nabiz', 'tansiyon', 'uyku']);
  assert.ok(o.kayitlar.every(r => Object.values(r.deger).every(d => d.k === 'eski')));
  assert.strictEqual(o.kayitlar.find(r => r.id === 'spi:kestirme:a').zaman, Date.parse('2026-09-01T13:30:00Z'));
  const su = K.GOC.spiVitals({ date:G0, water:1500, waterSrc:'beyan' }).kayitlar[0];
  assert.deepStrictEqual(su.deger.ml, { v:1500, k:'estimated' });
});

it('göç: sınırı aşan eski değer sessizce atılmaz, nedeniyle reddedilir', () => {
  const o = K.GOC.spiVitals({ date:G0, weight:400, rhr:60 });
  assert.strictEqual(o.kayitlar.length, 1);
  assert.deepStrictEqual(o.reddedilen, [{ tur:'kilo', id:'spi:vitals:' + G0 + ':kilo', hatalar:['Kilo 20 ile 250 kg arasında olmalı.'] }]);
});

it('göç SPİ öğün, antrenman ve profil', () => {
  const og = K.GOC.spiOgun({ date:G0, rows:[{ id:'m1', slot:'ogle', note:'', items:[{ foodId:'yumurta', g:100, cert:'measured' }, { foodId:'ekmek', g:50 }], at:'2026-09-01T12:00:00Z' }] });
  assert.deepStrictEqual(og.kayitlar[0].ek, { icerik:'yumurta, ekmek', ogun:'ogle' });
  assert.deepStrictEqual(og.kayitlar[0].kalemler.map(k => k.g.k), ['measured', 'estimated']);
  const w = K.GOC.spiAntrenman({ id:'w1', date:G0, kind:'cardio', minutes:30, rpe:null, name:'Koşu', items:[{ exId:'squat', minutes:10 }] }, metOf).kayitlar[0];
  assert.deepStrictEqual([w.ek.tur, w.deger.dk, w.kalemler[0].met], ['kardiyo', { v:30, k:'eski' }, SP.EX_BY_ID.squat.met]);
  assert.deepStrictEqual(K.GOC.spiProfil({ weightKg:80, heightCm:180, birthYear:1990, sex:'female', goal:'cut' }),
    { kilo:80, boy:180, dogumYili:1990, cinsiyet:'kadin', hedef:'ver', kcalHedef:null });
});

it('göç AYS gün, ruh hâli, mola; ESP oturum etiketleri korunur', () => {
  const ag = K.GOC.aysGun({ date:G0, sleepHours:6.5, blocks:[
    { id:'b1', slot:'Sabah', status:'done', actualMin:50, actualQ:30, subject:'Matematik', startedAt:'2026-09-01T07:00:00Z' },
    { id:'b2', slot:'Öğle', status:'skipped', actualMin:null }, { id:'b3', slot:'Dinlenme', status:'done', actualMin:20 }] });
  assert.deepStrictEqual(ag.kayitlar.map(r => [r.tur, r.ek.konu || null]), [['calisma', 'Matematik'], ['uyku', null]]);
  assert.strictEqual(K.GOC.aysMood({ date:G0, energy:3, note:'iyi' }).kayitlar[0].ek.not, 'iyi');
  assert.strictEqual(K.GOC.aysMola({ id:'m', dayISO:G0, minutes:5 }).kayitlar[0].deger.dk.k, 'eski');
  const es = K.GOC.espGun({ date:G0, sessions:[{ id:'s', minutes:40, minutesCert:'measured', count:3, countCert:'derived', quality:7, disc:'kitap' }] }).kayitlar[0];
  assert.deepStrictEqual([es.deger.dk.k, es.deger.sayi.k, es.deger.kalite.k, es.ek.alan, es.ek.konu], ['measured', 'computed', 'estimated', 'esp', 'kitap']);
});

/* Gerçek koşu (tools/gercek_kosu.py, 2026-11-13): canlı SPİ profilinin bütün alanları, değerler uydurma.
   Her alan ya bağdaştırıcıda okunur ya EKSIK listesinde adıyla söylenir: sessizce düşen alan kalmaz. */
it('göç SPİ profili, gerçek biçim: okunmayan her alan EKSIK listesinde adıyla', () => {
  const p = { id:'p1', name:'Ad', role:'sahip', createdAt:'2026-01-01T00:00:00.000Z', design:'d', theme:'t', pinned:[], conditions:[],
    activity:'orta', goal:'maintain', sex:'male', birthYear:1990, heightCm:180, weightKg:80 };
  assert.deepStrictEqual([K.GOC.spiProfil(p).hedef, K.GOC.spiProfil(p).kilo], ['koru', 80]);
  const bilinen = String(K.GOC.spiProfil) + ' ' + K.EKSIK.spiProfil.join(' ');
  assert.deepStrictEqual(Object.keys(p).filter(a => !new RegExp('[^\\w$]' + a + '[^\\w$]').test(bilinen)), []);
});

it('her bağdaştırıcının taşınamayanlar listesi var', () => {
  Object.keys(K.GOC).forEach(a => assert.ok(Array.isArray(K.EKSIK[a]) && K.EKSIK[a].length, a));
});

it('geriye yazma penceresi: bugün verilirse gelecek ve 7 günden eskisi reddedilir; göç (bugünsüz) etkilenmez', () => {
  const b = { bugun:'2026-11-14', zaman:1 };
  assert.ok(K.kaydet('su', { ml:'300' }, Object.assign({ gun:'2026-11-14' }, b)).ok);
  assert.ok(K.kaydet('su', { ml:'300' }, Object.assign({ gun:'2026-11-07' }, b)).ok, '7 gün geri');
  assert.deepStrictEqual(K.kaydet('su', { ml:'300' }, Object.assign({ gun:'2026-11-06' }, b)).hatalar, ['En çok 7 gün geriye kayıt yazılır.']);
  assert.deepStrictEqual(K.kaydet('su', { ml:'300' }, Object.assign({ gun:'2026-11-15' }, b)).hatalar, ['Gelecek bir güne kayıt yazılmaz.']);
  assert.ok(K.kaydet('su', { ml:'300' }, { gun:'2020-01-01', zaman:1 }).ok, 'bugün verilmezse pencere yok (göç)');
  assert.strictEqual(K.GERI_GUN, 7);
});

it('saflık: motor saat okumaz (Date.now / new Date() yok)', () => {
  const src = kaynak('motor/kayit.js');
  assert.ok(!/Date\.now\(|new Date\(\)/.test(src));
});

console.log((kirmizi ? '✕ ' : '✓ ') + (n - kirmizi) + '/' + n + ' test geçti');
process.exit(kirmizi ? 1 : 0);
