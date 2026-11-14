/* Tekrar motoru testi — `node motor/tekrar.test.js`. Her satır ✓ ya da ✕; kırmızıda çıkış 1.

   Göç testleri eski zamanlayıcıların GERÇEK kaynağını yükler (usta.js, ogret.js, ESP srs.js)
   ve onların ürettiği kaydı bağdaştırıcıya verir; yüklenemeyenlerin (AYS state.js, king-devrim,
   hedefplan) kaydı kaynak koddaki kurala göre elle kurulur, sabitleri kaynak dosyadan okunur. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const T = require('./tekrar.js');

const KOK = path.join(__dirname, '..');
const ESKI = path.join(__dirname, 'eski');   // kapanis: esitlik icin donmus eski modul kaynaklari (belgeler/ekip/sadelesme/faz7-kapanis.md)
const kaynak = f => fs.readFileSync(path.join(/^(AYS|SPI|ESP)\//.test(f) ? ESKI : KOK, f), 'utf8');
const GUN = 864e5, T0 = Date.UTC(2026, 10, 13, 9);
const gunStr = ms => new Date(ms).toISOString().slice(0, 10);
const yakin = (a, b, e, m) => assert.ok(Math.abs(a - b) <= e, (m || '') + ' ' + a + ' ≉ ' + b);

/* Eski kaynakların tarayıcı küreselleri (yalnız yüklemek için; motor bunlara bakmaz). */
globalThis.window = globalThis;
globalThis.yz = s => s;
globalThis.LIFEOS = { PARCA:{ yazilar(){} } };
require(path.join(KOK, 'brand/ortak/tarih.js'));
require(path.join(KOK, 'brand/ortak/usta.js'));
require(path.join(KOK, 'brand/ortak/ogret.js'));
globalThis.ESP = { U:LIFEOS.TARIH, S:{ cards:[] } };
require(path.join(ESKI, 'ESP/src/js/core/srs.js'));
const USTA = LIFEOS.USTA, OGRET = LIFEOS.OGRET, SRS = ESP.SRS;

let n = 0, kirmizi = 0;
function it(ad, f){
  n++;
  try{ f(); console.log('✓ ' + ad); }
  catch(e){ kirmizi++; console.log('✕ ' + ad + '\n    ' + (e && e.message)); }
}
/* Her cevap vadesinde verilir; Yine'de vade aynı an. */
function zincir(notlar, ayar){
  let k = T.yeniKart('k'), t = T0;
  const adim = [];
  notlar.forEach(g => {
    const r = T.cevapla(k, g, t, ayar);
    assert.ok(r.ok, r.neden);
    k = r.kart; t = k.sonraki; adim.push(r);
  });
  return { k, adim };
}
const gunler = (k, t, ayar) => [1, 2, 3, 4].map(g => T.cevapla(k, g, t, ayar).gun);

/* ------------------------------------------------------------ FSRS */

it('aralık sırası: Yine < Zor < İyi < Kolay (yeni, taze, olgun, unutulmuş kart; üç hedef)', () => {
  [0.8, 0.9, 0.95].forEach(hedef => {
    const ayar = { hedef };
    [[], [3], [3, 3, 3], [3, 3, 1], [3, 3, 3, 3, 3, 3, 3, 3], [2, 2, 2], [4, 4]].forEach(l => {
      const { k } = zincir(l, ayar), g = gunler(k, k.sonraki == null ? T0 : k.sonraki, ayar);
      // en uzun aralık tavanında (36500 gün) eşitlik kaçınılmaz; altında sıra kesin
      const kesin = (a, b) => a < b || b === T.VARSAYILAN.enUzun;
      assert.ok(kesin(g[0], g[1]) && kesin(g[1], g[2]) && kesin(g[2], g[3]), 'hedef ' + hedef + ' zincir [' + l + ']: ' + g);
    });
  });
});

it('vadede tahmini hatırlama hedef orana eşit (±0,01), her adımda', () => {
  [0.8, 0.9, 0.95].forEach(hedef => {
    const ayar = { hedef };
    const adim = zincir([3, 3, 3, 3, 3, 3, 4, 2, 3], ayar).adim.filter(r => r.gun < T.VARSAYILAN.enUzun);
    assert.ok(adim.length >= 5, 'tavana erken çarptı');
    adim.forEach((r, i) => {
      yakin(T.hatirlama(r.kart, r.kart.sonraki, ayar).deger, hedef, 0.01, 'hedef ' + hedef + ' adım ' + i);
    });
  });
  // yuvarlanmamış FSRS aralığında birebir: 0,9'da I = S
  const { k } = zincir([3, 3]);
  yakin(T.hatirlama(k, k.son + k.kararlilik * GUN).deger, 0.9, 1e-12);
});

it('İyi cevaplarla kararlılık ve aralık büyür', () => {
  const { adim } = zincir([3, 3, 3, 3, 3, 3]);
  for(let i = 1; i < adim.length; i++){
    assert.ok(adim[i].kart.kararlilik > adim[i - 1].kart.kararlilik, 'S ' + i);
    assert.ok(adim[i].gun > adim[i - 1].gun, 'gün ' + i);
  }
  assert.strictEqual(adim[0].gun, 4);              // S0(İyi) = 3,7145 → 4 gün
  assert.strictEqual(adim[5].kart.durum, 'tekrar');
});

it('unutma: Yine S\'yi düşürür, D\'yi artırır, unutma +1, aynı oturumda yeniden sorar', () => {
  const { k } = zincir([3, 3, 3]);
  const r = T.cevapla(k, 1, k.sonraki);
  assert.ok(r.kart.kararlilik < k.kararlilik && r.kart.kararlilik > 0);
  assert.ok(r.kart.zorluk > k.zorluk);
  assert.strictEqual(r.kart.unutma, 1);
  assert.strictEqual(r.kart.tekrar, 4);
  assert.strictEqual(r.kart.durum, 'yeniden');
  assert.strictEqual(r.gun, 0);
  assert.strictEqual(r.kart.sonraki, k.sonraki);
  const s = T.cevapla(r.kart, 3, r.kart.sonraki).kart;   // yeniden öğrenmede ikinci Yine unutma sayılmaz
  assert.strictEqual(s.durum, 'tekrar');
  assert.strictEqual(T.cevapla(r.kart, 1, r.kart.sonraki).kart.unutma, 1);
  assert.strictEqual(T.cevapla(T.yeniKart('y'), 1, T0).kart.unutma, 0);   // hiç öğrenilmemiş kart unutulmaz
  // çok geç kalınmış kartta bile unutma S'yi artırmaz
  const g = T.cevapla({ id:'g', zorluk:1, kararlilik:1, son:T0, sonraki:T0 + GUN, tekrar:3, unutma:0, durum:'tekrar' }, 1, T0 + 400 * GUN);
  assert.ok(g.kart.kararlilik <= 1);
});

it('belirlenimci: aynı girdi aynı çıktı; girdi kart değişmez', () => {
  const { k } = zincir([3, 2, 4, 1, 3]);
  const once = JSON.stringify(k);
  const a = T.cevapla(k, 3, k.sonraki + 2 * GUN), b = T.cevapla(k, 3, k.sonraki + 2 * GUN);
  assert.deepStrictEqual(a, b);
  assert.strictEqual(JSON.stringify(k), once);
  const l = [k, T.yeniKart('y1'), a.kart];
  assert.deepStrictEqual(T.plan(l, T0 + 90 * GUN), T.plan(l, T0 + 90 * GUN));
  assert.strictEqual(JSON.stringify(zincir([3, 3, 1, 3]).k), JSON.stringify(zincir([3, 3, 1, 3]).k));
});

it('saat içeride okunmaz: Date.now ve argümansız new Date kapalıyken çalışır; simdi yoksa TypeError', () => {
  const kaynakMetni = fs.readFileSync(path.join(__dirname, 'tekrar.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/Date\.now|new Date\(|performance\.now|Math\.random/.test(kaynakMetni), 'kaynakta saat/rastgele okuması var');
  const Gercek = Date, now = Date.now;
  globalThis.Date = new Proxy(Gercek, { construct(h, a){ if(!a.length) throw new Error('saat okundu'); return new h(...a); } });
  Date.now = () => { throw new Error('saat okundu'); };
  try{
    const { k } = zincir([3, 3, 1]);
    T.plan([k, T.yeniKart('y')], T0 + 30 * GUN);
    T.hatirlama(k, T0 + 30 * GUN);
    T.GOC.meydan({ anahtar:'m', vade:'2026-12-01T00:00:00+00:00', tekrar:1 }, T0);
    T.GOC.aysKart({ id:'c', dueAt:'2026-11-20', lastReviewedAt:'2026-11-13', history:[{}] });
  }finally{ globalThis.Date = Gercek; Gercek.now = now; }
  const k = T.yeniKart('k');
  assert.throws(() => T.plan([k]), TypeError);
  assert.throws(() => T.cevapla(k, 3), TypeError);
  assert.throws(() => T.hatirlama(k), TypeError);
  assert.throws(() => T.GOC.meydan({ anahtar:'m', vade:'2026-12-01' }), TypeError);
});

it('hatırlama tahmin etiketli; sorulmamış kartta veri yok', () => {
  const { k } = zincir([3]);
  const h = T.hatirlama(k, k.sonraki);
  assert.strictEqual(h.etiket, 'tahmin');
  assert.ok(h.deger > 0 && h.deger < 1);
  assert.deepStrictEqual(T.hatirlama(T.yeniKart('y'), T0), { deger:null, etiket:'veri yok' });
});

it('günlük plan: gecikme/S sırası, yeni kart sırası, tavanlar, bugün yapılan, gün sonu', () => {
  const kart = (id, S, gecikme, ek) => Object.assign({ id, zorluk:5, kararlilik:S, son:T0 - (S + gecikme) * GUN,
    sonraki:T0 - gecikme * GUN, tekrar:2, unutma:0, durum:'tekrar' }, ek || {});
  const l = [
    kart('a', 10, 5), kart('b', 2, 2), kart('c', 100, 10), kart('c2', 100, 10),
    { id:'d', zorluk:null, kararlilik:null, son:null, sonraki:null, tekrar:3, unutma:1, durum:'yeniden' },
    kart('ileri', 10, -3), kart('aksam', 10, -0.25),
    T.yeniKart('y3'), T.yeniKart('y1'), T.yeniKart('y2', { sonraki:T0 + 5 * GUN }), T.yeniKart('y4'),
  ];
  const p = T.plan(l, T0);
  assert.deepStrictEqual(p.tekrar.map(k => k.id), ['d', 'b', 'a', 'c', 'c2']);
  assert.deepStrictEqual(p.yeni.map(k => k.id), ['y3', 'y1', 'y4']);
  const s = T.plan(l, T0, { tekrarTavan:2, yeniTavan:3, yapilan:{ yeni:1 } });
  assert.deepStrictEqual(s.tekrar.map(k => k.id), ['d', 'b']);
  assert.deepStrictEqual(s.yeni.map(k => k.id), ['y3', 'y1']);
  assert.deepStrictEqual(s.bekleyen, { tekrar:3, yeni:1 });
  assert.deepStrictEqual(T.plan(l, T0, { yapilan:{ tekrar:500 } }).tekrar, []);
  assert.ok(T.plan(l, T0, { gunSonu:T0 + 0.5 * GUN }).tekrar.some(k => k.id === 'aksam'));
  assert.ok(!p.tekrar.some(k => k.id === 'aksam' || k.id === 'ileri'));
});

it('taslak içerik planlanmaz ve cevaplanmaz; onaylı ve kişinin kendi kartı girer', () => {
  const taslak = T.yeniKart('t', { icerik:'taslak' }), iskelet = T.yeniKart('i', { icerik:'iskelet' });
  const onayli = T.yeniKart('o', { icerik:'onayli' }), kendi = T.yeniKart('k');
  const p = T.plan([taslak, iskelet, onayli, kendi], T0);
  assert.deepStrictEqual(p.yeni.map(k => k.id), ['o', 'k']);
  assert.deepStrictEqual(p.disarida.map(x => x.id), ['t', 'i']);
  assert.ok(/taslak/.test(p.disarida[0].neden));
  const r = T.cevapla(taslak, 3, T0);
  assert.strictEqual(r.ok, false);
  assert.ok(/taslak/.test(r.neden));
  assert.ok(T.cevapla(onayli, 3, T0).ok);
  // kapanan kart planlanmaz; Yine onu yeniden açar
  const kapali = Object.assign(zincir([3, 3]).k, { kapandi:'2026-11-01' });
  assert.deepStrictEqual(T.plan([kapali], kapali.sonraki + GUN).disarida, [{ id:'k', neden:'kapandı' }]);
  assert.ok(!('kapandi' in T.cevapla(kapali, 1, kapali.sonraki).kart));
  assert.strictEqual(T.cevapla(kapali, 9, T0).ok, false);
});

/* ------------------------------------------------------------- göç */

/* Vade aynen + vadede hatırlama hedef oranda (S, kalan aralıktan seçildi). */
function vadeKorundu(k, gun, ayar, oranYok){
  assert.ok(k, 'kart döndü');
  assert.strictEqual(gunStr(k.sonraki), gun, k.id);
  if(k.kararlilik != null && !oranYok) yakin(T.hatirlama(k, k.sonraki, ayar).deger, (ayar && ayar.hedef) || 0.9, 1e-9, k.id);
}

it('göç 1 · AYS kartı: vade, tekrar ve unutma sayısı aynen; yeni kart yeni kalır', () => {
  assert.ok(/R\.SRS_INTERVALS = \[1, 3, 7, 30\]/.test(kaynak('AYS/src/js/data/reference.js')));
  // state.js schedule: «hatırladım» stage 2 → +3 gün; history'ye {at, rating, result, stage, gapDays}
  const c = { id:'c1', front:'ön', back:'arka', stage:2, dueAt:'2026-11-16', lastReviewedAt:'2026-11-13', lastResult:'remembered',
    history:[{ at:'2026-11-12', rating:'forgot', stage:1 }, { at:'2026-11-13', rating:'remembered', stage:2 }] };
  [0.8, 0.9, 0.95].forEach(hedef => vadeKorundu(T.GOC.aysKart(c, null, { hedef }), '2026-11-16', { hedef }));
  const k = T.GOC.aysKart(c);
  assert.strictEqual(k.tekrar, 2); assert.strictEqual(k.unutma, 1);
  yakin(k.kararlilik, 3, 1e-9);
  assert.strictEqual(k.kaynak, 'ays:cards/c1'); assert.strictEqual(k.goc, 'aysKart');
  const y = T.GOC.aysKart({ id:'c2', stage:0, dueAt:'2026-11-14', lastReviewedAt:null, history:[] });
  vadeKorundu(y, '2026-11-14');
  assert.strictEqual(y.durum, 'yeni');
  assert.strictEqual(T.GOC.aysKart({ id:'c3', dueAt:'bozuk' }), null);
});

it('göç 2 · AYS yanlış defteri kartı: vade aynen, yanlış kaydına bağ', () => {
  assert.ok(/source:'error', sourceRef:err\.id/.test(kaynak('AYS/src/js/screens/exams.js')));
  const k = T.GOC.aysYanlis({ id:'c9', source:'error', sourceRef:'e4', stage:1, dueAt:'2026-11-14', lastReviewedAt:'2026-11-13', history:[{ rating:'forgot' }] });
  vadeKorundu(k, '2026-11-14');
  assert.strictEqual(k.yanlis, 'ays:errors/e4');
  assert.strictEqual(T.GOC.aysYanlis({ id:'c8', source:'manual', dueAt:'2026-11-14' }), null);
});

it('göç 3 · AYS kapanış ölçümü: vade = ilk ölçüm + gapDays (kaynaktan okunur)', () => {
  const m = /CLOSURE_RULE = \{[^}]*gapDays:(\d+)/.exec(kaynak('AYS/src/js/data/subjects.js'));
  assert.ok(m && Number(m[1]) === 7, 'gapDays kaynakta 7 değil: motor sabiti güncellenmeli');
  assert.ok(/U\.addDays\(U\.parse\(st\.firstAt\), R\.CLOSURE_RULE\.gapDays\)/.test(kaynak('AYS/src/js/core/calc.js')));
  vadeKorundu(T.GOC.aysKapanis({ first:80, firstAt:'2026-11-08', second:null }, 'mat:t1'), '2026-11-15');
  const kapali = T.GOC.aysKapanis({ first:80, firstAt:'2026-10-01', second:72, secondAt:'2026-10-08' }, 'mat:t2');
  assert.strictEqual(kapali.sonraki, null); assert.strictEqual(kapali.kapandi, '2026-10-08');
  assert.strictEqual(T.GOC.aysKapanis({ first:null, firstAt:null }, 'mat:t3'), null);
});

it('göç 4 · AYS hedef planı tekrar blokları: vade = haftanın başı, yalnız aktif plan', () => {
  assert.ok(/TEKRAR_ARALIK = \[1, 3\]/.test(kaynak('AYS/src/js/core/hedefplan.js')));
  const p = { id:'p1', durum:'aktif', haftalar:[
    { n:1, bas:'2026-11-16', bit:'2026-11-22', tekrar:[] },
    { n:2, bas:'2026-11-23', bit:'2026-11-29', tekrar:['Türev'] },
    { n:4, bas:'2026-12-07', bit:'2026-12-13', tekrar:['Türev', 'İntegral'] }] };
  const l = T.GOC.aysHedefTekrar(p);
  assert.deepStrictEqual(l.map(k => gunStr(k.sonraki)), ['2026-11-23', '2026-12-07', '2026-12-07']);
  assert.deepStrictEqual(l.map(k => k.on), ['Türev', 'Türev', 'İntegral']);
  assert.ok(l.every(k => k.durum === 'yeni'));
  assert.deepStrictEqual(T.GOC.aysHedefTekrar(Object.assign({}, p, { durum:'taslak' })), []);
});

it('göç 5 · ESP kartı (gerçek srs.js schedule): vade, reps, lapses aynen; Yine sonrası S0(Yine)', () => {
  let c = { id:'e1', front:'apple', back:'elma', lang:'en', box:1, ease:2.5, interval:0, due:'2026-11-01', reps:0, lapses:0 };
  const y = T.GOC.espKart(c);
  vadeKorundu(y, '2026-11-01'); assert.strictEqual(y.durum, 'yeni');
  let gun = '2026-11-01';
  ['good', 'good', 'easy', 'hard', 'again', 'good'].forEach(g => {
    c = Object.assign({}, c, SRS.schedule(c, g, gun));
    const k = T.GOC.espKart(c);
    vadeKorundu(k, c.due, null, g === 'again');   // Yine: vade bugün (aralık 0), oran 1
    assert.strictEqual(k.tekrar, c.reps); assert.strictEqual(k.unutma, c.lapses);
    assert.strictEqual(k.deste, 'en');
    if(g === 'again') assert.strictEqual(k.kararlilik, T.W[0]);
    gun = c.due;
  });
  assert.strictEqual(c.lapses, 1);
});

it('göç 6 · Öğretme motoru (gerçek ogret.js isle): vade aynen, yanlış sayısı unutma, «bitti» kapanır', () => {
  assert.deepStrictEqual(OGRET.ARALIK, [1, 3, 7]);
  const ls = (m => ({ getItem:k => (k in m ? m[k] : null), setItem:(k, v) => { m[k] = v; } }))({});
  const d = OGRET.depo('ays.king.tekrar', ls);
  OGRET.isle(d, 'turev', false, '2026-11-10', 's1');
  let k = T.GOC.ogret(d.oku().turev, 'turev', 'ays.king.tekrar');
  vadeKorundu(k, '2026-11-11'); assert.strictEqual(k.unutma, 1);
  OGRET.isle(d, 'turev', true, '2026-11-11', 's2');
  k = T.GOC.ogret(d.oku().turev, 'turev', 'ays.king.tekrar');
  vadeKorundu(k, '2026-11-14'); yakin(k.kararlilik, 3, 1e-9);
  assert.deepStrictEqual(k.ogeler, ['s1']);
  OGRET.isle(d, 'turev', true, '2026-11-14');
  vadeKorundu(T.GOC.ogret(d.oku().turev, 'turev', 'ays.king.tekrar'), '2026-11-21');
  OGRET.isle(d, 'turev', true, '2026-11-21');
  k = T.GOC.ogret(d.oku().turev, 'turev', 'ays.king.tekrar');
  assert.strictEqual(k.kapandi, '2026-11-21'); assert.strictEqual(k.sonraki, null);
  assert.strictEqual(T.plan([k], T0 + 30 * GUN).disarida[0].neden, 'kapandı');
});

it('göç 7 · King dersleri: vade aynen, bitti kapanır, sorulmamış yeni; hepsi taslak, tekrara girmez', () => {
  const src = fs.readFileSync(path.join(ESKI, 'brand/ortak/king-devrim.js'), 'utf8');
  assert.ok(/KD_ARALIK = \[1, 3, 7\]/.test(src));
  assert.ok(/d\.tekrar\[i\] = \{ n, sonraki:gunIleri\(KD_ARALIK\[n\]\) \}/.test(src));
  const ders = { id:'kd1', sorular:[{ soru:'a' }, { soru:'b' }, { soru:'c' }, { soru:'d' }],
    tekrar:{ 0:{ n:1, sonraki:'2026-11-16' }, 1:{ n:0, sonraki:'2026-11-14' }, 2:{ n:3, bitti:true } } };
  const l = T.GOC.kingDers(ders);
  vadeKorundu(l[0], '2026-11-16'); vadeKorundu(l[1], '2026-11-14');
  yakin(l[0].kararlilik, 3, 1e-9); yakin(l[1].kararlilik, 1, 1e-9);
  assert.strictEqual(l[2].kapandi, true); assert.strictEqual(l[3].durum, 'yeni');
  assert.ok(l.every(k => k.icerik === 'taslak'));
  const p = T.plan(l, T0 + 30 * GUN);
  assert.strictEqual(p.tekrar.length + p.yeni.length, 0);
  assert.strictEqual(T.GOC.kingDers(ders, { icerik:'onayli' })[0].icerik, 'onayli');
});

const uSonraki = (bugun) => k => USTA.asama(k, bugun).sonraki;

it('göç 8 · Ustalık kanıtı (gerçek usta.js asama): vade = USTA\'nın sonrakisi; yanlışta hemen', () => {
  const k = [{ g:'2026-10-01', isabet:true }, { g:'2026-10-08', isabet:true }, { g:'2026-10-09', isabet:false, ipucu:true }];
  const s = USTA.asama(k, '2026-10-20').sonraki;
  assert.strictEqual(s, '2026-10-29');
  const c = T.GOC.usta('u1', k, s);
  vadeKorundu(c, '2026-10-29'); yakin(c.kararlilik, 21, 1e-9);
  assert.strictEqual(c.tekrar, 3); assert.strictEqual(c.unutma, 1);
  const yanlis = [{ g:'2026-10-01', isabet:true }, { g:'2026-10-05', isabet:false }];
  assert.strictEqual(USTA.asama(yanlis, '2026-10-06').sonraki, null);
  const y = T.GOC.usta('u2', yanlis, null);
  assert.strictEqual(y.sonraki, null); assert.strictEqual(y.durum, 'yeniden');
  assert.deepStrictEqual(T.plan([y], T0).tekrar.map(x => x.id), ['u2']);
  assert.strictEqual(T.GOC.usta('u3', [], null), null);
});

it('göç 9a · Kavrat kanıt deposu: her kartın vadesi USTA\'nınkiyle aynı', () => {
  const v = { 'turev': {
    'Türevin tanımı': [{ g:'2026-11-01', isabet:true }],
    'Zincir kuralı': [{ g:'2026-10-01', isabet:true }, { g:'2026-10-09', isabet:true }],
    'Boş': [] } };
  const l = T.GOC.kavrat(v, 'ays', uSonraki('2026-11-13'));
  assert.strictEqual(l.length, 2);
  vadeKorundu(l[0], '2026-11-02'); vadeKorundu(l[1], '2026-10-30');
  assert.strictEqual(l[0].goc, 'kavrat'); assert.strictEqual(l[1].on, 'Zincir kuralı');
  assert.ok(T.EKSIK.kavrat.length > T.EKSIK.usta.length);
});

it('göç 9b · Öğrenme motoru kanıtı (kayit.k): her konunun vadesi USTA\'nınkiyle aynı', () => {
  const l = T.GOC.ogrenmotor({ 'felsefe-1':[{ g:'2026-11-05', isabet:true }, { g:'2026-11-12', isabet:true }] }, 'esp', uSonraki('2026-11-13'));
  vadeKorundu(l[0], '2026-12-03');
  assert.strictEqual(l[0].id, 'ogren:esp:felsefe-1'); assert.strictEqual(l[0].goc, 'ogrenmotor');
});

it('göç · HKM meydan destesi (yetim): vade anı aynen; geçmişse S bilinmez, silinen alınmaz', () => {
  assert.ok(/vade\s+TEXT NOT NULL/.test(kaynak('HKM/core/db.py')));
  const r = { anahtar:'esp:42', kaynak:'esp', on_yuz:'dog', arka_yuz:'köpek', dil:'en', vade:'2026-11-20T10:00:00+00:00', tekrar:4 };
  const k = T.GOC.meydan(r, T0);
  assert.strictEqual(k.sonraki, Date.parse(r.vade));
  yakin(T.hatirlama(k, k.sonraki).deger, 0.9, 1e-9);
  assert.strictEqual(k.son, null); assert.strictEqual(k.tekrar, 4);
  const g = T.GOC.meydan(Object.assign({}, r, { vade:'2026-11-01T10:00:00+00:00' }), T0);
  assert.strictEqual(g.kararlilik, null); assert.strictEqual(g.durum, 'yeniden');
  assert.strictEqual(T.GOC.meydan(Object.assign({}, r, { silindi:1 }), T0), null);
});

it('her bağdaştırıcının taşıyamadıkları yazılı', () => {
  Object.keys(T.GOC).forEach(a => assert.ok(Array.isArray(T.EKSIK[a]) && T.EKSIK[a].length, a));
});

console.log((kirmizi ? '✕ ' : '✓ ') + (n - kirmizi) + '/' + n + ' test geçti');
process.exit(kirmizi ? 1 : 0);
