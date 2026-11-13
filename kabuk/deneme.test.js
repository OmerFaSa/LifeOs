// Süreli deneme ve prova ekranının saf mantığı, gerçek içerik ve gerçek motorlarla: node kabuk/deneme.test.js  (✓/✕, çıkış 0/1)
'use strict';
const D = require('./deneme.js'), Soru = require('../motor/soru.js'), Yol = require('../motor/yol.js');

let gecen = 0, kalan = 0;
function t(ad, f) {
  try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); }
}
function esit(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || '') + ' beklenen ' + JSON.stringify(b) + ', gelen ' + JSON.stringify(a)); }
function dogru(x, m) { if (!x) throw new Error(m || 'doğru değil'); }
const rnd = (() => { let i = 0; return () => (i++ * 0.37) % 1; })();
const fel = Yol.yukle(require('../alan/felsefe/asama-1.json'));
const gec = (y, k, id) => Yol.kapiDene(y, k, id, Object.fromEntries(y.oge[id].kapi.sorular.map(q => [q.id, q.dogru])), 1).kayit;
const yanlisi = q => 'ABCDE'[('ABCDE'.indexOf(q.dogru) + 1) % q.sec.length];

t('deneme: açık ünite bir test; soru seçimi karma testten; süre ÖSYM ölçeğinde; kesit deneme', () => {
  const r = D.denemeKur(Soru, Yol, fel, Yol.bosKayit(), 'Felsefe', 1000, rnd), o = r.durum.oturum, u1 = fel.veri.uniteler[0];
  const secmeli = u1.dersler.flatMap(d => d.alistirmalar.filter(a => a.tur === 'secmeli').map(a => a.id));
  esit([r.ok, o.testler.length, o.testler[0].ad, o.tur, o.aile], [true, 1, u1.ad, 'kesit', null]);
  esit(r.durum.sorular[0].slice().sort(), secmeli.slice().sort(), 'ilk ünitenin bütün seçmeli soruları (10\'dan az)');
  esit(o.sure, Math.max(1, Math.round(165 * secmeli.length / 120)), 'süre = 165 dk × soru / 120');
  const k = gec(fel, Yol.bosKayit(), u1.id), r2 = D.denemeKur(Soru, Yol, fel, k, 'Felsefe', 1000, rnd);
  esit(r2.durum.oturum.testler.length, 2, 'kapı geçilince ikinci ünite ikinci test olur');
  dogru(!D.provaVar(fel), 'Felsefe\'de prova yok');
});

t('deneme: cevap değişir, testler arası geçişte motorun test saati geçer, bitince net ve etiketler motordan', () => {
  const k = gec(fel, Yol.bosKayit(), fel.veri.uniteler[0].id), sz = D.sozluk(fel);
  let dr = D.denemeKur(Soru, Yol, fel, k, 'Felsefe', 0, rnd).durum, z = 0;
  const l = D.duz(dr), n0 = dr.sorular[0].length;
  dr = D.cevapVer(Soru, dr, yanlisi(sz[l[0].id]), sz, z += 1000).durum;
  dr = D.cevapVer(Soru, dr, sz[l[0].id].dogru, sz, z += 1000).durum;            // denemede cevap değişebilir
  esit(D.cevabi(dr, 0), sz[l[0].id].dogru);
  dr = D.git(Soru, dr, 1, z += 1000); dr = D.cevapVer(Soru, dr, yanlisi(sz[l[1].id]), sz, z).durum;
  dr = D.git(Soru, dr, n0, z += 60000);                                         // ikinci testin ilk sorusu
  esit([dr.i, dr.oturum.sira], [n0, 1], 'motorun test sırası da geçti');
  dr = D.cevapVer(Soru, dr, sz[l[n0].id].dogru, sz, z += 1000).durum;
  const b = D.bitir(Soru, dr, sz, z += 30000), an = b.analiz;
  esit([an.testler[0].dogru.deger, an.testler[0].yanlis.deger, an.testler[0].bos.deger, an.testler[0].bos.etiket], [1, 1, n0 - 2, 'hesaplandı']);
  esit([an.testler[1].dogru.deger, an.testler[1].yanlis.deger], [1, 0]);
  esit([an.net.deger, an.net.etiket], [1.75, 'hesaplandı'], 'net = 2 − 1/4');
  esit([an.testler[0].dakika.etiket, an.testler[0].dakika.deger, b.sureDoldu, b.toplamSn], ['ölçüldü', 1, false, 94]);
  esit(b.sorular.filter(x => x.h).length, 3, 'soru soru listesi cevapları taşır');
  const tp = Soru.puanTahmini([b.deneme], {});
  esit([tp.ok, tp.etiket], [false, 'veri yok'], 'kesit deneme puan tahminine girmez');
});

t('deneme: süre dolunca cevap alınmaz, bitiş anı sınırın kendisidir (sekme kapalıyken dolsa da)', () => {
  const sz = D.sozluk(fel);
  let dr = D.denemeKur(Soru, Yol, fel, Yol.bosKayit(), 'Felsefe', 0, rnd).durum;
  const sure = dr.oturum.sure * 60, gec2 = (sure + 3600) * 1000;               // bir saat sonra açıldı
  esit(D.kalan(Soru, dr, gec2), 0);
  esit(D.cevapVer(Soru, dr, 'A', sz, gec2), { ok: false, neden: 'sure' });
  const b = D.bitir(Soru, dr, sz, gec2);
  esit([b.sureDoldu, b.toplamSn], [true, sure], 'ölçülen süre denemenin süresi, bir saat eklenmez');
});

t('prova: Akademik açık ünitelerden TYT dağılımı, ilk cevap kilitlenir, sonuç ders ders net', () => {
  const ak = Yol.yukle(require('../alan/akademik/asama-1.json'));
  dogru(D.provaVar(ak), 'Akademik\'te prova var');
  const az = D.provaKur(Soru, Yol, ak, Yol.bosKayit(), 'AYT', 20, 0, rnd);
  esit([az.ok, az.neden, az.n], [false, 'az', 0], 'AYT üniteleri kilitliyken AYT provası kurulmaz, motorun nedeniyle');
  esit(D.provaKur(Soru, Yol, ak, Yol.bosKayit(), 'TYT', 20, 0, rnd).ok, true, 'TYT ünitelerinin ilkleri baştan açık');
  const k = Yol.bosKayit();
  ak.veri.uniteler.forEach(u => { k.kapilar[u.id] = [{ gecti: true }]; });     // bütün üniteler açık
  const r = D.provaKur(Soru, Yol, ak, k, 'TYT', 20, 0, rnd), o = r.durum.oturum, sz = D.sozluk(ak);
  esit([r.ok, o.tur, o.sinav, o.sorular.length, o.sureDk], [true, 'prova', 'TYT', 20, 28]);
  const say = {}; o.sorular.forEach(id => { say[sz[id].ders] = (say[sz[id].ders] || 0) + 1; });
  esit(say, { 'tyt-turkce': 7, 'tyt-sosyal': 3, 'tyt-matematik': 7, 'tyt-fen': 3 }, 'kota motorun planından');
  let dr = r.durum;
  dr = D.cevapVer(Soru, dr, sz[o.sorular[0]].dogru, sz, 1000).durum;
  esit(D.cevapVer(Soru, dr, yanlisi(sz[o.sorular[0]]), sz, 2000), { ok: false, neden: 'kilitli' });
  dr = D.git(Soru, dr, 1, 3000); dr = D.cevapVer(Soru, dr, yanlisi(sz[o.sorular[1]]), sz, 3000).durum;
  const b = D.bitir(Soru, dr, sz, 120000), p = b.ozet.prova;
  esit([b.ozet.sayilar.dogru, b.ozet.sayilar.yanlis, b.ozet.sayilar.bos], [1, 1, 18]);
  esit([p.net.deger, p.net.etiket, p.kullanilanDk.deger, p.kullanilanDk.etiket], [0.75, 'hesaplandı', 2, 'ölçüldü']);
  esit(p.dersler.map(x => x.ders), ['tyt-turkce', 'tyt-sosyal', 'tyt-matematik', 'tyt-fen'], 'dersler sınav sırasında');
  dogru(p.dersler.every(x => x.net.etiket === 'hesaplandı'), 'ders netleri etiketli');
  const ayt = D.provaKur(Soru, Yol, ak, k, 'AYT', 40, 0, rnd);
  esit([ayt.ok, ayt.durum.oturum.sureDk], [true, 90]);
});

t('puan ve sıra: motorun döndürdüğü gibi; tahmin hep tahmin, veri yoksa nedeniyle', () => {
  const yok = D.tahminSatirlari(Soru.puanTahmini([], {}));
  esit([yok[0].metin, yok[0].etiket], ['tahmin yok', 'veri yok']);
  dogru(/En az 3 tam TYT/.test(yok[1].not) && /0 \(ölçüldü\)/.test(yok[1].not), yok[1].not);
  const tam = (tarih, d) => ({ tarih, aile: 'TYT', tur: 'tam', testler: [{ ad: 'Türkçe', dogru: d, yanlis: 4 }] });
  const tp = Soru.puanTahmini([tam('2026-10-01', 60), tam('2026-10-08', 70), tam('2026-10-15', 80)], {}), l = D.tahminSatirlari(tp);
  esit([l[0].etiket, l[1].etiket], ['tahmin', 'tahmin']);
  dogru(l[0].metin.indexOf(String(tp.puan.deger).replace('.', ',')) === 0, 'puan motorun sayısı: ' + l[0].metin);
  dogru(l[1].metin.indexOf(String(tp.sira.deger).replace(/\B(?=(\d{3})+(?!\d))/g, '.')) === 0, 'sıra motorun sayısı: ' + l[1].metin);
  dogru(l.some(x => x.not && /okul puanı/.test(x.not)) && l.some(x => x.not === tp.varsayim), 'okul puanı yok ve varsayım cümlesi');
});

t('saat: dakika:saniye', () => esit([D.sureYaz(0), D.sureYaz(65), D.sureYaz(28 * 60)], ['00:00', '01:05', '28:00']));

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
