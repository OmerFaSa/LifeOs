/* Plan motoru testi — `node motor/plan.test.js`. Her satır ✓ ya da ✕; kırmızıda çıkış 1.

   Eski kurallar AYS'nin GERÇEK kaynağından karşılaştırılır (core/istisna.js olcekle, data/curriculum.js
   R.WEEKDAYS, data/activities.js R.BREAK_RULE); ESP sırası planner.js'teki yorumdan okunur.
   Takım arkadaşlarının motorları (Kayıt, Tekrar) VARSA ve kendi testleri geçiyorsa bağ testi koşar. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), cp = require('child_process');
const P = require('./plan.js');

const KOK = path.join(__dirname, '..');
const kaynak = f => fs.readFileSync(path.join(KOK, f), 'utf8');

globalThis.window = globalThis;
globalThis.yz = s => s;
globalThis.LIFEOS = { PARCA:{ yazilar(){} } };
globalThis.R = { U:{} };
['data/curriculum.js', 'data/activities.js', 'core/istisna.js'].forEach(f => require(path.join(KOK, 'AYS/src/js', f)));
const AYS = globalThis.R;

let n = 0, kirmizi = 0;
function it(ad, f){
  n++;
  try{ f(); console.log('✓ ' + ad); }
  catch(e){ kirmizi++; console.log('✕ ' + ad + '\n    ' + (e && e.message)); }
}
const PZT = '2026-11-16';
const dk = P.yardimci.dakika;
const plan = g => { const r = P.gunPlani(Object.assign({ gun:PZT, musait:[{ bas:'09:00', bit:'17:00' }] }, g)); assert.ok(r.ok, (r.hatalar || []).join(' ')); return r.plan; };
const isler = p => p.bloklar.filter(b => b.tur !== 'mola' && b.tur !== 'sabit');
const sira = p => isler(p).map(b => b.kaynakId);

/* ============================================================ eski kurallar */

it('ölçekleme eski istisna.js olcekle ile aynı (7 gün şablonu × 8 hedef)', () => {
  const sab = P.GOC.aysSablon(AYS.WEEKDAYS);
  [30, 45, 90, 120, 180, 240, 400, 720].forEach(h => AYS.WEEKDAYS.forEach((w, i) => {
    const eski = AYS.Istisna.olcekle(w.blocks.map(b => ({ slot:b.slot, targetMin:b.min })), h).map(b => b.targetMin);
    assert.deepStrictEqual(P.olcekle(sab[i].bloklar, h).map(b => b.dk), eski, w.label + ' ' + h);
  }));
});

it('sabitler eski kaynakla aynı: süre sınırı, en kısa blok, öne alma, ritüel, mola, hafta devri, son tarih', () => {
  assert.deepStrictEqual(P.SABIT.DAKIKA, AYS.Istisna.DAKIKA);
  assert.strictEqual(P.SABIT.ONE_ALMA_MIN, AYS.Istisna.ONE_ALMA_MIN);
  const ist = kaynak('AYS/src/js/core/istisna.js');
  assert.strictEqual(P.SABIT.MIN_BLOK, +ist.match(/const MIN_BLOK = (\d+)/)[1]);
  assert.deepStrictEqual(P.SABIT.SABIT_RITUEL, JSON.parse(ist.match(/const SABIT_RITUEL = (\[[^\]]+\])/)[1].replace(/'/g, '"')));
  const M = P.SABIT.MOLA, B = AYS.BREAK_RULE;
  assert.deepStrictEqual([M.kisaSinir, M.kisa, M.uzun, M.gunTavani], [B.shortAfterMin, B.shortMin, B.longMin, B.maxPerDay]);
  assert.strictEqual(P.SABIT.HAFTA_DEVIR, +kaynak('AYS/src/js/core/auto.js').match(/carry\.length < (\d+)\) carry\.push/)[1]);
  assert.strictEqual(P.SABIT.SON_TARIH_GUN, +kaynak('ESP/src/js/core/planner.js').match(/DEADLINE_DAYS = (\d+)/)[1]);
});

it('sıra ESP PRECEDENCE ile aynı: temel > zamana bağlı > vadeli tekrar > sentez > yeni', () => {
  const src = kaynak('ESP/src/js/core/planner.js');
  const l = ['Tikanmis temel', 'Zamana bagli hedef', 'Vadesi gecmis SRS', 'Sentopik sentez', 'Yeni icerik'].map(s => src.indexOf(s));
  assert.ok(l.every((x, i) => x > 0 && (i === 0 || x > l[i - 1])), 'kaynakta sıra değişmiş');
  const p = plan({ isler:[{ id:'y', ad:'Yeni', dk:20 }, { id:'s', ad:'Sentez', dk:20, sinif:'sentez' }, { id:'z', ad:'Süreli', dk:20, son:'2026-11-30' },
    { id:'t', ad:'Temel', dk:20, sinif:'temel' }], tekrar:{ tekrar:[{ id:'k1' }], yeni:[] }, mola:false });
  assert.deepStrictEqual(sira(p), ['t', 'z', 'tekrar:' + PZT, 's', 'y']);
});

it('son tarihi 14 günden uzak iş yeni kalır, 14 gün içi ya da geçmiş zamana bağlı olur; aynı sınıfta devreden ve yakın son tarih önde', () => {
  const s = P.sirala([{ id:'a', son:'2026-12-01' }, { id:'b', son:'2026-11-30' }, { id:'c', son:'2026-11-01' }, { id:'d' }, { id:'e', devir:2 }], PZT);
  assert.deepStrictEqual(s.map(x => [x.id, x.sinif]), [['c', 'sureli'], ['b', 'sureli'], ['e', 'yeni'], ['a', 'yeni'], ['d', 'yeni']]);
});

it('hafifletme eski kural: oranla, en az 30 dk; oransız yarısı; deneme/kapanış günü kısaltılmaz', () => {
  assert.deepStrictEqual(P.hafiflet(180, 0.5), { ok:true, dakika:90 });
  assert.deepStrictEqual(P.hafiflet(180), { ok:true, dakika:90 });
  assert.deepStrictEqual(P.hafiflet(40), { ok:true, dakika:30 });
  assert.deepStrictEqual(P.hafiflet(180, 0.9), { ok:false, neden:'Bu oran günü 18 dakikaya indirir; en az 30 dakika. O günü ara yapabilirsin.' });
  assert.ok(!P.hafiflet(180, 0.5, 'exam').ok && !P.hafiflet(180, 0.5, 'review').ok);
});

/* ============================================================ gün planı */

it('doğrulama Türkçe cümle döndürür', () => {
  const h = g => P.gunPlani(Object.assign({ gun:PZT, musait:[] }, g)).hatalar;
  assert.deepStrictEqual(h({ gun:'16.11.2026' }), ['Gün YYYY-AA-GG biçiminde olmalı.']);
  assert.deepStrictEqual(h({ musait:[{ bas:'12:00', bit:'10:00' }] }), ['1. boş zaman aralığı başlamadan bitiyor.']);
  assert.deepStrictEqual(h({ musait:[{ bas:'9:00', bit:'10:00' }] }), ['1. boş zaman aralığının saatleri SS:DD biçiminde olmalı.']);
  assert.deepStrictEqual(h({ gunlukDakika:800 }), ['Günlük süre 30–720 dakika arasında olmalı.']);
  assert.deepStrictEqual(h({ isler:[{ id:'a', ad:'A', dk:0 }] }), ['«A» süresi 1–720 dakika arası tam sayı olmalı.']);
  assert.deepStrictEqual(h({ isler:[{ id:'a', ad:'A', dk:10 }, { id:'a', ad:'A', dk:10 }] }), ['«A» iki kez verildi.']);
  assert.deepStrictEqual(h({ isler:[{ id:'a', ad:'A', dk:10, sinif:'acil' }] }), ['«A» sınıfı şunlardan biri olmalı: temel, sureli, vadeli, sentez, yeni.']);
  assert.deepStrictEqual(h({ gun:'2026-11-10', bugun:'2026-11-13' }), ['Geçmiş gün yeniden planlanmaz.']);
});

it('yerleştirme: sabit bloklar yerinde, iş boş zamana, en erken uygun boşluğa; sığmayan nedeniyle', () => {
  const p = plan({ musait:[{ bas:'09:00', bit:'11:00' }], sabitler:[{ id:'top', ad:'Toplantı', bas:'09:30', bit:'10:00' }],
    isler:[{ id:'a', ad:'A', dk:60 }, { id:'b', ad:'B', dk:30 }, { id:'c', ad:'C', dk:45 }], mola:false });
  assert.deepStrictEqual(p.bloklar.map(b => [b.id, b.bas, b.bit]), [['b', '09:00', '09:30'], ['top', '09:30', '10:00'], ['a', '10:00', '11:00']]);
  assert.deepStrictEqual(p.sigmayan.map(s => [s.id, s.neden]), [['c', 'boş zaman yetmedi']]);
  assert.deepStrictEqual(p.ozet.planlananDk, { v:90, k:'computed' });
  assert.deepStrictEqual(p.ozet.bosDk, { v:0, k:'computed' });
});

it('mola: 50 dk altı bloktan sonra 5, üstü 15 dk; aynı boşlukta iki blok arasına; günde en çok 6', () => {
  const p = plan({ isler:[{ id:'a', ad:'A', dk:30 }, { id:'b', ad:'B', dk:60 }, { id:'c', ad:'C', dk:20 }] });
  assert.deepStrictEqual(p.bloklar.map(b => [b.tur, b.bas, b.dk]), [['is', '09:00', 30], ['mola', '09:30', 5], ['is', '09:35', 60], ['mola', '10:35', 15], ['is', '10:50', 20]]);
  const cok = plan({ isler:Array.from({ length:12 }, (_, i) => ({ id:'i' + i, ad:'İ' + i, dk:10 })) });
  assert.strictEqual(cok.ozet.molaSayisi, 6);
});

it('günlük süre bütçesi: aşan iş sığmaz, bölünebilir iş bütçe kadar parçalanır (en az 10 dk)', () => {
  const p = plan({ gunlukDakika:60, mola:false, isler:[{ id:'a', ad:'A', dk:40 }, { id:'b', ad:'B', dk:30 }, { id:'c', ad:'C', dk:45, bolunebilir:true }] });
  assert.deepStrictEqual(isler(p).map(b => [b.id, b.dk]), [['a', 40], ['c#1', 20]]);
  assert.deepStrictEqual(p.sigmayan.map(s => [s.id, s.neden, s.kalanDk]), [['b', 'günlük süre doldu', undefined], ['c', 'kısmen sığdı', 25]]);
  const parca = plan({ musait:[{ bas:'09:00', bit:'09:30' }, { bas:'10:00', bit:'10:20' }], mola:false, isler:[{ id:'u', ad:'Uzun', dk:50, bolunebilir:true }] });
  assert.deepStrictEqual(isler(parca).map(b => [b.bas, b.dk, b.parca]), [['09:00', 30, 1], ['10:00', 20, 2]]);
});

it('değişmez (rastgele 300 gün): bloklar çakışmaz, boş zaman dışına ve sabitlerin üstüne taşmaz, bütçe aşılmaz, dakika kaybolmaz', () => {
  let a = 7;
  const r = () => (a = (a * 1103515245 + 12345) % 2147483648) / 2147483648;
  for(let t = 0; t < 300; t++){
    const musait = [], sabitler = [];
    let s = 6 * 60 + Math.floor(r() * 120);
    for(let i = 0; i < 3; i++){ const e = s + 30 + Math.floor(r() * 200); if(e > 1439) break; musait.push({ bas:P.yardimci.saat(s), bit:P.yardimci.saat(e) }); s = e + 10 + Math.floor(r() * 60); }
    if(musait.length && r() < 0.5){ const b = dk(musait[0].bas) + 10; sabitler.push({ id:'s', ad:'Sabit', bas:P.yardimci.saat(b), bit:P.yardimci.saat(b + 20) }); }
    const isl = Array.from({ length:1 + Math.floor(r() * 8) }, (_, i) => ({ id:'i' + i, ad:'İş ' + i, dk:5 + Math.floor(r() * 120), bolunebilir:r() < 0.3,
      sinif:P.SIRA[Math.floor(r() * 5)], alan:r() < 0.2 ? 'hareket' : undefined }));
    const g = { gun:PZT, musait, sabitler, isler:isl, gunlukDakika:r() < 0.5 ? 30 + Math.floor(r() * 300) : undefined, hareketCarpani:r() < 0.3 ? r() : undefined };
    const out = P.gunPlani(g);
    assert.ok(out.ok, JSON.stringify(out.hatalar));
    const p = out.plan, zaman = p.bloklar.filter(b => b.bas).map(b => [dk(b.bas), dk(b.bit), b]).sort((x, y) => x[0] - y[0]);
    zaman.forEach((z, i) => {
      assert.strictEqual(z[1] - z[0], z[2].dk, 'süre');
      if(i) assert.ok(z[0] >= zaman[i - 1][1], 'çakışma ' + t);
      if(z[2].tur !== 'sabit') assert.ok(musait.some(m => z[0] >= dk(m.bas) && z[1] <= dk(m.bit)), 'boş zaman dışında ' + t);
    });
    const is = isler(p);
    if(g.gunlukDakika) assert.ok(is.reduce((x, b) => x + b.dk, 0) <= g.gunlukDakika, 'bütçe ' + t);
    isl.forEach(x => {
      const konan = is.filter(b => b.kaynakId === x.id).reduce((q, b) => q + b.dk, 0), sg = p.sigmayan.find(y => y.id === x.id);
      if(x.alan === 'hareket' && g.hareketCarpani != null && g.hareketCarpani < 1){ assert.ok(konan <= x.dk, 'hareket arttı ' + t); return; }
      assert.strictEqual(konan + (sg ? (sg.kalanDk != null ? sg.kalanDk : sg.dk) : 0), x.dk, 'dakika kayboldu ' + t + ' ' + x.id);
    });
  }
});

it('şablon: ders günü günlük süreye ölçeklenir; deneme (Cmt) ve kapanış (Paz) ölçeklenmez; Dinlenme doldurulmaz', () => {
  const sab = P.GOC.aysSablon(AYS.WEEKDAYS), uzun = [{ bas:'08:00', bit:'22:00' }];
  assert.strictEqual(P.yardimci.haftaGunu(PZT), 0);
  assert.strictEqual(AYS.WEEKDAYS[P.yardimci.haftaGunu(PZT)].label, 'Pazartesi');
  const sali = plan({ gun:'2026-11-17', musait:uzun, sablon:sab[1], gunlukDakika:90, mola:false });
  assert.deepStrictEqual(isler(sali).map(b => b.dk), P.olcekle(sab[1].bloklar, 90).map(b => b.dk));
  const cmt = plan({ gun:'2026-11-21', musait:uzun, sablon:sab[5], gunlukDakika:90, mola:false });
  assert.deepStrictEqual(isler(cmt).map(b => b.dk), [165, 60, 40]);
  const paz = plan({ gun:'2026-11-22', musait:uzun, sablon:sab[6], gunlukDakika:90, mola:false });
  assert.deepStrictEqual(isler(paz).map(b => b.slot), ['Değerlendirme', 'Kart']);
});

it('ara günü: blok yok, işler «ara günü» nedeniyle bekler (kaçırılmış sayılmaz) ve devreder', () => {
  const p = plan({ ara:true, araNeden:'tatil', isler:[{ id:'a', ad:'A', dk:30 }], dersler:[{ id:'d', ad:'D', dk:20 }] });
  assert.deepStrictEqual([p.ara, p.bloklar.length, p.araNeden], [true, 0, 'tatil']);
  assert.deepStrictEqual(p.sigmayan.map(s => [s.id, s.neden]), [['a', 'ara günü']]);
  assert.deepStrictEqual(P.devret(p).map(x => [x.id, x.devir]), [['a', 1]]);
});

it('hareket bloğu toparlanma çarpanıyla yalnız kısalır; 0 ise planlanmaz; 1,1 artırmaz', () => {
  const h = c => plan({ hareketCarpani:c, mola:false, isler:[{ id:'k', ad:'Koşu', dk:60, alan:'hareket' }, { id:'o', ad:'Okuma', dk:60 }] });
  assert.deepStrictEqual(isler(h(0.5)).map(b => [b.id, b.dk]), [['k', 30], ['o', 60]]);
  assert.deepStrictEqual(h(0).sigmayan.map(s => [s.id, s.neden]), [['k', 'toparlanma günü']]);
  assert.strictEqual(isler(h(1.1)).find(b => b.id === 'k').dk, 60);
  assert.deepStrictEqual(P.devret(h(0)).map(x => x.id), ['o']);   // toparlanma günü devretmez: yarın çarpan yeniden hesaplanır
});

/* ============================================================ durum, devir, yeniden kurma */

it('durum yazma: yapıldı, kısmen (süre şart), atlandı (neden şart); girdi plan değişmez', () => {
  const p = plan({ isler:[{ id:'a', ad:'A', dk:30 }] });
  assert.deepStrictEqual(P.durumYaz(p, 'a', { durum:'kismen', dk:30 }), { ok:false, neden:'Kısmen yapılan süre 1 ile 29 dakika arasında olmalı.' });
  assert.deepStrictEqual(P.durumYaz(p, 'a', { durum:'atlandi' }), { ok:false, neden:'Atlanan blok için neden yazılmalı.' });
  assert.deepStrictEqual(P.durumYaz(p, 'a', { durum:'bitti' }), { ok:false, neden:'Durum şunlardan biri olmalı: bekliyor, yapildi, kismen, atlandi.' });
  assert.deepStrictEqual(P.durumYaz(p, 'x', { durum:'yapildi' }), { ok:false, neden:'Blok bulunamadı: x.' });
  const y = P.durumYaz(p, 'a', { durum:'kismen', dk:10 });
  assert.deepStrictEqual([y.plan.bloklar[0].durum, y.plan.bloklar[0].yapilanDk, p.bloklar[0].durum], ['kismen', 10, 'bekliyor']);
});

it('devir: bekleyen ve atlanan iş devreder, kısmen yapılanın kalanı; yapılan, bırakılan, tekrar, Yol dersi ve şablon devretmez', () => {
  let p = plan({ musait:[{ bas:'09:00', bit:'11:00' }], mola:false,
    isler:[{ id:'a', ad:'A', dk:30 }, { id:'b', ad:'B', dk:30 }, { id:'c', ad:'C', dk:30 }, { id:'e', ad:'E', dk:20 }, { id:'f', ad:'F', dk:90 }],
    dersler:[{ id:'d', ad:'D', dk:10 }], tekrar:{ tekrar:[{ id:'k' }], yeni:[] } });
  p = P.durumYaz(p, 'a', { durum:'yapildi' }).plan;
  p = P.durumYaz(p, 'b', { durum:'kismen', dk:12 }).plan;
  p = P.durumYaz(p, 'c', { durum:'atlandi', neden:'yorgundum' }).plan;
  p = P.durumYaz(p, 'e', { durum:'atlandi', neden:'gerek kalmadı', birak:true }).plan;
  assert.deepStrictEqual(P.devret(p).map(x => [x.id, x.dk, x.devir]), [['b', 18, 1], ['c', 30, 1], ['f', 90, 1]]);
  const yarin = plan({ gun:'2026-11-17', isler:P.devret(p).concat([{ id:'n', ad:'Yeni iş', dk:20 }]), mola:false });
  assert.deepStrictEqual(sira(yarin), ['b', 'c', 'f', 'n']);   // devreden aynı sınıfta önde (AYS auto.js:71)
});

it('yeniden kurma: ilerlemesi başlamış blok saatinde kalır, bekleyenler yeniden yerleşir; geçmiş gün kurulmaz', () => {
  let p = plan({ musait:[{ bas:'09:00', bit:'12:00' }], mola:false, isler:[{ id:'a', ad:'A', dk:30 }, { id:'b', ad:'B', dk:30 }] });
  p = P.durumYaz(p, 'b', { durum:'kismen', dk:10 }).plan;
  const r = P.yenidenKur(p, { musait:[{ bas:'09:00', bit:'12:00' }], mola:false, isler:[{ id:'z', ad:'Z', dk:20, sinif:'temel' }, { id:'a', ad:'A', dk:30 }, { id:'b', ad:'B', dk:30 }] });
  assert.ok(r.ok);
  assert.deepStrictEqual(r.plan.bloklar.map(b => [b.id, b.bas, b.durum]), [['z', '09:00', 'bekliyor'], ['b', '09:30', 'kismen'], ['a', '10:00', 'bekliyor']]);
  assert.deepStrictEqual(P.yenidenKur(p, { bugun:'2026-11-20' }).hatalar, ['Geçmiş gün yeniden planlanmaz.']);
});

/* ============================================================ hafta */

it('hafta: Yol dersleri sırayla tükenir, iş verildiği günden başlar, sığmayan ertesi güne devreder', () => {
  const gun = { musait:[{ bas:'18:00', bit:'19:00' }], mola:false };
  const r = P.haftaPlani({ bas:PZT, gunler:Array(7).fill(gun), dersler:[1, 2, 3, 4, 5].map(i => ({ id:'d' + i, ad:'Ders ' + i, dk:25 })),
    isler:[{ id:'a', ad:'A', dk:50, gun:PZT }, { id:'b', ad:'B', dk:40, gun:'2026-11-18' }] });
  assert.ok(r.ok, (r.hatalar || []).join(' '));
  const g = r.hafta.gunler.map(p => isler(p).map(b => b.kaynakId));
  assert.deepStrictEqual(g, [['a'], ['d1', 'd2'], ['b'], ['d3', 'd4'], ['d5'], [], []]);
  assert.deepStrictEqual(r.hafta.kalanDersler, []);
  assert.deepStrictEqual(r.hafta.ozet.planlananDk, { v:215, k:'computed' });
});

it('hafta sonu: sığmayanların en öncelikli 2\'si gelecek haftaya devreder, gerisi bekler (AYS auto.js:311-316)', () => {
  const r = P.haftaPlani({ bas:PZT, gunler:Array(7).fill({ ara:true }),
    isler:[{ id:'a', ad:'A', dk:20 }, { id:'b', ad:'B', dk:20, sinif:'temel' }, { id:'c', ad:'C', dk:20 }, { id:'d', ad:'D', dk:20, son:'2026-11-25' }] });
  assert.deepStrictEqual(r.hafta.devir.map(x => x.id), ['b', 'd']);
  assert.deepStrictEqual(r.hafta.bekleyen.map(x => [x.id, x.devir]), [['a', 7], ['c', 7]]);
  assert.strictEqual(r.hafta.ozet.araGunu, 7);
});

/* ============================================================ takım arkadaşlarının motorlarıyla bağ */

const gecer = f => fs.existsSync(path.join(__dirname, f)) && cp.spawnSync(process.execPath, [path.join(__dirname, f.replace('.js', '.test.js'))], { encoding:'utf8' }).status === 0;

it('Tekrar bağı: Tekrar.plan() çıktısı tek tekrar bloğu olur, süresi «tahmin» etiketli; yeni kartlar yeni sınıfında', () => {
  if(!gecer('tekrar.js')) return console.log('    (tekrar.js yok ya da testi kırmızı: atlandı)');
  const T = require('./tekrar.js'), simdi = Date.UTC(2026, 10, 16, 8);
  const kartlar = Array.from({ length:30 }, (_, i) => Object.assign(T.yeniKart('y' + i)))
    .concat(Array.from({ length:40 }, (_, i) => Object.assign(T.yeniKart('t' + i), { durum:'tekrar', kararlilik:3, zorluk:5, son:simdi - 4 * 864e5, sonraki:simdi - 864e5 })));
  const tp = T.plan(kartlar, simdi);
  const p = plan({ tekrar:tp, mola:false });
  const tb = isler(p).find(b => b.tur === 'tekrar'), yb = isler(p).find(b => b.tur === 'yeni-kart');
  assert.deepStrictEqual([tb.kartlar.length, tb.dk, tb.sinif, tb.dkEtiket], [40, 10, 'vadeli', 'estimated']);   // 40 × 12 sn = 8 dk → 10
  assert.deepStrictEqual([yb.kartlar.length, yb.sinif], [tp.yeni.length, 'yeni']);
  assert.strictEqual(p.ozet.planlananDk.k, 'estimated');
});

it('Kayıt bağı: ateşli günde Kayit.Kural.gununEmri çarpanı 0, hareket planlanmaz; ölçümsüz gün 1, hareket olduğu gibi', () => {
  if(!gecer('kayit.js')) return console.log('    (kayit.js yok ya da testi kırmızı: atlandı)');
  const K = require('./kayit.js'), ates = K.kaydet('ates', { derece:39 }, { gun:PZT }).kayit;
  const is = [{ id:'y', ad:'Yürüyüş', dk:40, alan:'hareket' }];
  assert.deepStrictEqual(plan({ isler:is, hareketCarpani:K.Kural.gununEmri([ates], PZT).carpan.v }).sigmayan.map(s => s.neden), ['toparlanma günü']);
  assert.strictEqual(isler(plan({ isler:is, hareketCarpani:K.Kural.gununEmri([], PZT).carpan.v }))[0].dk, 40);
});

/* ============================================================ göç */

it('göç AYS gün: bloklar plana, durum ve atlama nedeni korunur, Dinlenme düşer, öne alınan işaretli', () => {
  const p = P.GOC.aysGun({ date:PZT, blocks:[
    { id:'b0', slot:'Ana ders', subject:'TYT Matematik', topic:'Problemler', targetMin:75, targetQ:15, status:'done', actualMin:70 },
    { id:'b1', slot:'İkinci ders', subject:'Biyoloji', topic:'Biyoloji', targetMin:65, status:'skipped', skipReason:'yorgunluk' },
    { id:'b2', slot:'Dinlenme', subject:'Dinlenme', targetMin:0, status:'pending' },
    { id:'b3', slot:'Öne alınan', subject:'Kimya', topic:'Mol', targetMin:30, status:'partial', actualMin:10, oneAlindi:true }] });
  assert.deepStrictEqual(p.bloklar.map(b => [b.ad, b.dk, b.durum, b.yapilanDk, b.neden, b.konu]),
    [['Problemler', 75, 'yapildi', 70, undefined, 'TYT Matematik'], ['Biyoloji', 65, 'atlandi', undefined, 'yorgunluk', undefined], ['Mol', 30, 'kismen', 10, undefined, 'Kimya']]);
  assert.ok(p.bloklar[2].oneAlindi);
  assert.deepStrictEqual(P.devret(p).map(x => [x.ad, x.dk]), [['Biyoloji', 65], ['Mol', 20]]);
});

it('göç AYS şablonu: 7 gün, Pazartesi başta, ritüeller korunur; her bağdaştırıcının taşınamayanlar listesi var', () => {
  const s = P.GOC.aysSablon(AYS.WEEKDAYS);
  assert.deepStrictEqual(s.map(g => g.ritual), ['contract', null, null, null, null, 'exam', 'review']);
  assert.strictEqual(s[0].ad, 'Pazartesi');
  Object.keys(P.GOC).forEach(a => assert.ok(K_EKSIK(a), a));
});
function K_EKSIK(a){ return Array.isArray(P.EKSIK[a]) && P.EKSIK[a].length; }

it('saflık: motor saat okumaz (Date.now / new Date() yok)', () => {
  assert.ok(!/Date\.now\(|new Date\(\)/.test(kaynak('motor/plan.js')));
});

console.log((kirmizi ? '✕ ' : '✓ ') + (n - kirmizi) + '/' + n + ' test geçti');
process.exit(kirmizi ? 1 : 0);
