// Kabuk saf mantık testleri: node kabuk/kabuk.test.js  (✓/✕, çıkış 0/1)
'use strict';
const H = require('./harita.js');
const A = require('./ayar.js');
const K = require('./kabuk.js');

let gecen = 0, kalan = 0;
function t(ad, f) {
  try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); }
}
function esit(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || '') + ' beklenen ' + JSON.stringify(b) + ', gelen ' + JSON.stringify(a)); }
function dogru(x, m) { if (!x) throw new Error(m || 'doğru değil'); }
function sahteDepo(ilk) {
  const v = Object.assign({}, ilk);
  return { v, getItem: k => (k in v ? v[k] : null), setItem: (k, x) => { v[k] = String(x); }, removeItem: k => { delete v[k]; } };
}

// ---- sahibinin kararları (faz2-kabuk.md «Kararlar», 2026-11-13) ----
t('karar: selam adı ekler, adsızsa yalın, saat dilimleri', () => {
  const s = (saat, ad) => K.selam(new Date(2026, 10, 13, saat), ad);
  esit([s(3), s(8), s(13), s(20)], ['İyi geceler.', 'Günaydın.', 'İyi günler.', 'İyi akşamlar.']);
  esit(s(8, 'Altay'), 'Günaydın Altay.'); esit(s(8, '  '), 'Günaydın.'); esit(s(8, null), 'Günaydın.');
});
t('karar: hareket varsayılanı cihaza uyar', () => esit(A.tanim('lifeos.hareket').varsayilan, 'sistem'));

// ---- Felsefe pilotu: sıradaki adım, gerçek içerik ve gerçek Yol motoruyla ----
t('yol: sıradaki adım ders → kapı → sonraki ünite → aşama kapısı → bitti; okumak üniteyi geçirmez', () => {
  const Yol = require('../motor/yol.js'), y = Yol.yukle(require('../alan/felsefe/asama-1.json'));
  let k = Yol.bosKayit(), z = 1;
  const adim = () => K.siradaki(Yol.durum(y, k));
  const dogrular = sahip => Object.fromEntries(y.oge[sahip].kapi.sorular.map(q => [q.id, q.dogru]));
  const iz = [];
  for (const u of y.veri.uniteler) {
    for (const d of u.dersler) { esit(adim(), { tur: 'ders', id: d.id, ad: d.ad }); iz.push(d.id); k = Yol.dersOku(y, k, d.id, z++); }
    esit(adim(), { tur: 'kapi', id: u.id, ad: u.ad });
    k = Yol.kapiDene(y, k, u.id, {}, z++).kayit;                       // boş deneme: kalır, adım değişmez
    esit(adim(), { tur: 'kapi', id: u.id, ad: u.ad }, 'kalınca aynı kapı');
    k = Yol.kapiDene(y, k, u.id, dogrular(u.id), z++).kayit;
  }
  esit(iz.length, 9);
  esit(adim(), { tur: 'kapi', id: y.id, ad: y.veri.ad });
  k = Yol.kapiDene(y, k, y.id, dogrular(y.id), z++).kayit;
  esit(adim(), null);
});

// ---- araç ekranları (kabuk/araclar.js): Not ve Tekrar, gerçek motorlarla ----
const R = require('./araclar.js'), Not = require('../motor/not.js'), Tekrar = require('../motor/tekrar.js');
t('not: yeni not kaydolur; boş not motorun cümlesiyle reddedilir ve liste değişmez', () => {
  const r = R.notKaydet(Not, [], 'yeni', { baslik: ' Erdem ', govde: 'Bilgi mi?', ozel: true }, 1000, 'n1');
  esit(r.id, 'n1'); esit(r.notlar.length, 1); esit(r.notlar[0].baslik, 'Erdem'); esit(r.notlar[0].ozel, true); esit(r.notlar[0].olusturma, 1000);
  let h = ''; try { R.notKaydet(Not, r.notlar, 'yeni', { baslik: '  ', govde: '' }, 2000, 'n2'); } catch (e) { h = e.message; }
  dogru(/boş not kaydedilmez/.test(h), h);
});
t('not: başlık değişince öbür nottaki bağın görünen adı tazelenir, takma ad kalır; gövde ve işaretler güncellenir', () => {
  let l = R.notKaydet(Not, [], 'yeni', { baslik: 'Erdem', govde: 'a' }, 1000, 'n1').notlar;
  l = R.notKaydet(Not, l, 'yeni', { baslik: 'Sokrates', govde: 'Bkz. ' + Not.bagYaz('n1', 'Erdem') + ' ve ' + Not.bagYaz('n1', 'şu fikir') }, 1100, 'n2').notlar;
  const r = R.notKaydet(Not, l, 'n1', { baslik: 'Erdem nedir', govde: 'b', sabit: true }, 2000, 'x');
  const n1 = r.notlar.find(n => n.id === 'n1'), n2 = r.notlar.find(n => n.id === 'n2');
  esit([n1.baslik, n1.govde, n1.sabit, n1.guncelleme], ['Erdem nedir', 'b', true, 2000]);
  esit(Not.baglar(n2.govde).map(b => b.ad), ['Erdem nedir', 'şu fikir']);
  esit(Not.geriBaglar(r.notlar, 'n1').map(b => b.id), ['n2']);
  esit(r.notlar.slice().sort(R.notSira)[0].id, 'n1', 'sabit not üstte');
});
t('tekrar: yeni kart bugünün kuyruğunda; «Yine» kuyrukta tutar, «İyi» yarına atar; sayaç günlüktür', () => {
  const simdi = new Date(2026, 10, 13, 10).getTime();
  let l = [Tekrar.yeniKart('k1', { on: 'S', arka: 'C' })], s = null;
  esit(R.kuyruk(Tekrar, l, simdi, s).sira.map(k => k.id), ['k1']);
  let r = R.kartCevapla(Tekrar, l, 'k1', 1, simdi, s);
  esit([r.ok, r.gun, r.sayac], [true, 0, { gun: '2026-11-13', yeni: 1, tekrar: 0 }]);
  esit(R.kuyruk(Tekrar, r.kartlar, simdi + 60000, r.sayac).sira.map(k => k.id), ['k1'], '«Yine» aynı gün yeniden sorulur');
  r = R.kartCevapla(Tekrar, r.kartlar, 'k1', 3, simdi + 60000, r.sayac);
  esit(r.sayac, { gun: '2026-11-13', yeni: 1, tekrar: 1 });
  esit(R.kuyruk(Tekrar, r.kartlar, simdi + 120000, r.sayac).sira, []);
  esit(R.kuyruk(Tekrar, r.kartlar, simdi + r.gun * 864e5, null).sira.map(k => k.id), ['k1'], 'vadesi gelince döner');
  esit(R.kartCevapla(Tekrar, r.kartlar, 'yok', 3, simdi, null).ok, false);
  esit([R.aralikAdi(0), R.aralikAdi(3), R.aralikAdi(60), R.aralikAdi(730)], ['şimdi', '3 gün', '2 ay', '2 yıl']);
});
t('tekrar: taslak ders alıştırması kart olmaz; onaylanınca cevaplanan alıştırma bir kez kart olur', () => {
  const Yol = require('../motor/yol.js'), veri = JSON.parse(JSON.stringify(require('../alan/felsefe/asama-1.json')));
  const d1 = veri.uniteler[0].dersler[0], a1 = d1.alistirmalar[0];
  let y = Yol.yukle(veri), k = Yol.cevapla(y, Yol.bosKayit(), a1.id, a1.dogru, 1).kayit;
  esit(R.kartlariEsitle(Tekrar, [], Yol.tekrarAdaylari(y, k), y), [], 'taslak');
  d1.durum = 'onayli'; d1.onaylayan = 'sahip'; d1.onayTarihi = '2026-11-13'; a1.durum = 'onayli';
  y = Yol.yukle(veri);
  const l = R.kartlariEsitle(Tekrar, [], Yol.tekrarAdaylari(y, k), y);
  esit(l.map(x => [x.id, x.icerik, x.on, x.arka, x.durum]), [[a1.id, 'onayli', a1.soru, a1.sec['ABCD'.indexOf(a1.dogru)], 'yeni']]);
  dogru(R.kartlariEsitle(Tekrar, l, Yol.tekrarAdaylari(y, k), y) === l, 'ikinci kez eklenmez');
  esit(Tekrar.cevapla(l[0], 3, 1000).ok, true);
});

t('not ağı: yerleşim belirlenimci, çerçeve içinde; bağlı notlar bağsızlardan yakın; 300 not akıcı', () => {
  let l = [];
  for (let i = 0; i < 300; i++) l.push(Not.yeni({ id: 'n' + String(i).padStart(3, '0'), baslik: 'Not ' + i, govde: i % 3 ? Not.bagYaz('n' + String(i - 1).padStart(3, '0'), 'x') : 'yalnız', olusturma: 1 }));
  const ag = Not.ag(l), bas = Date.now(), p = R.agYerlesim(ag, 640, 400), sure = Date.now() - bas;
  esit(p.length, 300); dogru(p.every(q => q.x >= 24 && q.x <= 616 && q.y >= 24 && q.y <= 376), 'çerçeve içinde');
  esit(R.agYerlesim(ag, 640, 400), p, 'aynı girdi aynı yerleşim');
  dogru(sure < 1500, 'yerleşim ' + sure + ' ms (ölçüldü)');
  console.log('    300 not, ' + ag.kenar.length + ' bağ: yerleşim ' + sure + ' ms');
  const kucuk = Not.ag(l.slice(0, 6)), q = R.agYerlesim(kucuk, 640, 400), ix = Object.fromEntries(q.map(x => [x.id, x]));
  const uz = (a, b) => Math.hypot(ix[a].x - ix[b].x, ix[a].y - ix[b].y);
  dogru(uz('n001', 'n002') < uz('n000', 'n003'), 'bağlı çift (n001–n002) bağsız çiftten (n000–n003) yakın');
  esit(R.agYerlesim({ dugum: [{ id: 'a' }], kenar: [] }, 640, 400), [{ id: 'a', x: 320, y: 200 }]);
});
t('kayıt: formdan kayıt; virgüllü sayı, tahmin etiketi, boş alan yollanmaz; hata motorun cümlesi ve liste değişmez', () => {
  const Kayit = require('../motor/kayit.js'), gun = '2026-11-13';
  let r = R.kayitEkle(Kayit, [], 'su', { ml: '500' }, false, gun, 1000);
  esit([r.ok, r.kayit.deger.ml], [true, { v: 500, k: 'measured' }]);
  r = R.kayitEkle(Kayit, r.kayitlar, 'uyku', { saat: '7,5' }, true, gun, 2000);
  esit(r.kayit.deger.saat, { v: 7.5, k: 'estimated' });
  const l = R.kayitEkle(Kayit, r.kayitlar, 'ogun', { icerik: 'Mercimek çorbası', kcal: '', protein: ' ', ogun: 'ogle' }, false, gun, 3000);
  esit([l.ok, l.kayit.deger, l.kayit.ek], [true, {}, { icerik: 'Mercimek çorbası', ogun: 'ogle' }]);
  const kotu = R.kayitEkle(Kayit, l.kayitlar, 'su', { ml: '99999' }, false, gun, 4000);
  esit(kotu.ok, false); dogru(/Su 1 ile 8000 ml arasında olmalı/.test(kotu.hatalar[0]), kotu.hatalar[0]);
  esit(R.kayitEkle(Kayit, [], 'yok', {}, false, gun, 1).ok, false);
  esit(R.gunOzeti(Kayit, l.kayitlar, gun), [
    { ad: 'Su', metin: '500 ml', etiket: 'hesaplandı' }, { ad: 'Gece uykusu', metin: '7,5 saat', etiket: 'tahmin' }, { ad: 'Öğün', metin: '1', etiket: 'hesaplandı' }]);
  esit(R.gunOzeti(Kayit, l.kayitlar, '2026-11-14'), [], 'veri olmayan gün boş: sıfır gösterilmez');
  esit(R.kayitMetni(Kayit, l.kayitlar[1]), 'Gece uykusu · 7,5 saat (tahmin)');
});

t('plan: boş zamana iş, ders ve mola yerleşir; geçersiz iş ve aralık motorun cümlesiyle reddedilir', () => {
  const Plan = require('../motor/plan.js'), gun = '2026-11-13';
  let dr = R.planBos();
  esit(R.planEkle(Plan, dr, 'aralik', { bas: '12:00', bit: '09:00' }, gun).ok, false);
  let r = R.planEkle(Plan, dr, 'aralik', { bas: '14:00', bit: '15:00' }, gun); dr = r.durum;
  dr = R.planEkle(Plan, dr, 'aralik', { bas: '09:00', bit: '10:00' }, gun).durum;
  esit(dr.ayar.musait.map(m => m.bas), ['09:00', '14:00'], 'aralıklar saate göre sıralı');
  const kotu = R.planEkle(Plan, dr, 'is', { id: 'i1', ad: 'Rapor', dk: 0 }, gun);
  esit(kotu.ok, false); dogru(/süresi 1–720 dakika/.test(kotu.hatalar[0]), kotu.hatalar[0]);
  dr = R.planEkle(Plan, dr, 'is', { id: 'i1', ad: 'Rapor', dk: 30 }, gun).durum;
  r = R.planKur(Plan, dr, gun, { dersler: [{ id: 'd1', ad: 'Felsefe: Ders', dk: 20 }], tekrar: null });
  esit(r.ok, true);
  esit(r.plan.bloklar.map(b => [b.tur, b.bas, b.dk]), [['is', '09:00', 30], ['mola', '09:30', 5], ['ders', '09:35', 20]]);
  esit([r.plan.ozet.planlananDk, r.plan.sigmayan.length], [{ v: 50, k: 'computed' }, 0]);
});
t('plan: yeniden kurunca yapılan blok yerinde kalır; ertesi gün yapılan iş listeden çıkar, bitmeyen devreder', () => {
  const Plan = require('../motor/plan.js'), gun = '2026-11-13';
  let dr = { ayar: { musait: [{ bas: '09:00', bit: '10:00' }] }, isler: [{ id: 'a', ad: 'A', dk: 30 }, { id: 'b', ad: 'B', dk: 40 }], gunPlan: null };
  let p = R.planKur(Plan, dr, gun, {}).plan;
  esit(p.sigmayan.map(x => [x.id, x.neden]), [['b', 'boş zaman yetmedi']]);
  p = Plan.durumYaz(p, 'a', { durum: 'yapildi' }).plan;
  dr = { ayar: dr.ayar, isler: dr.isler, gunPlan: { gun, plan: p } };
  const y = R.planKur(Plan, dr, gun, {}).plan;
  esit(y.bloklar.filter(b => b.kaynakId === 'a' || b.id === 'a').map(b => b.durum), ['yapildi']);
  dogru(R.planGunDevri(Plan, dr, gun) === dr, 'aynı gün: durum aynen');
  const ertesi = R.planGunDevri(Plan, dr, '2026-11-14');
  esit([ertesi.gunPlan, ertesi.isler.map(x => [x.id, x.dk, x.devir])], [null, [['b', 40, 1]]]);
});

t('hafta: sabit blok şablonu; gece yarısını geçen blok ikiye bölünür; geçersiz blok motorun cümlesiyle reddedilir', () => {
  const Plan = require('../motor/plan.js'), gun = '2026-11-16';                          // Pazartesi
  esit(R.sabitEkle(Plan, null, { id: 's0', ad: ' ', bas: '08:00', bit: '15:00', gunler: [0] }, gun).ok, false);
  esit(R.sabitEkle(Plan, null, { id: 's0', ad: 'Okul', bas: '08:00', bit: '15:00', gunler: [] }, gun).hatalar, ['En az bir gün seçilmeli.']);
  const ters = R.sabitEkle(Plan, null, { id: 's0', ad: 'Okul', bas: '08:00', bit: '08:00', gunler: [0] }, gun);
  dogru(!ters.ok && /saatleri geçersiz/.test(ters.hatalar[0]), JSON.stringify(ters));
  let s = R.sabitEkle(Plan, null, { id: 'okul', ad: 'Okul', bas: '08:00', bit: '15:00', gunler: [4, 0, 1, 2, 3] }, gun).sablon;
  s = R.sabitEkle(Plan, s, { id: 'uyku', ad: 'Uyku', bas: '23:00', bit: '07:00', gunler: [0, 1, 2, 3, 4, 5, 6] }, gun).sablon;
  esit(s.sabitler[0].gunler, [0, 1, 2, 3, 4], 'günler sıralı');
  esit(R.sabitlerGunu(s, 0).map(x => [x.ad, x.bas, x.bit]), [['Uyku', '00:00', '07:00'], ['Okul', '08:00', '15:00'], ['Uyku', '23:00', '23:59']]);
  esit(R.sabitlerGunu(s, 5).map(x => x.ad), ['Uyku', 'Uyku'], 'cumartesi okul yok');
  const yalniz = { sabitler: [{ id: 'g', ad: 'Gece işi', bas: '22:00', bit: '02:00', gunler: [4] }] };   // yalnız cuma gecesi
  esit([R.sabitlerGunu(yalniz, 4).map(x => x.bas), R.sabitlerGunu(yalniz, 5).map(x => x.bas), R.sabitlerGunu(yalniz, 0)], [['22:00'], ['00:00'], []]);
  esit(R.sabitlerGunu(undefined, 0), []);
});
t('hafta: yedi gün motorun haftaPlani\'nden; sabitler her güne, sığmayan ertesi güne devreder, hafta sonunda en çok 2 iş gelecek haftaya', () => {
  const Plan = require('../motor/plan.js'), bugun = '2026-11-14';                       // Cumartesi
  const s = { sabitler: [{ id: 'okul', ad: 'Okul', bas: '09:00', bit: '10:00', gunler: [0, 1, 2, 3, 4] }] };
  const dr = { ayar: { musait: [{ bas: '09:00', bit: '11:00' }] }, gunPlan: null,
    isler: [60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60].map((dk, i) => ({ id: 'i' + i, ad: 'İş ' + i, dk })) };
  const r = R.haftaKur(Plan, dr, s, bugun, { dersler: [{ id: 'd1', ad: 'Ders', dk: 20 }] });
  esit(r.ok, true);
  const h = r.hafta;
  esit([h.bas, h.bitis, h.gunler.length], [bugun, '2026-11-20', 7]);
  const pzt = h.gunler[2];                                                              // 16 Kasım Pazartesi
  esit(pzt.bloklar.filter(b => b.tur === 'sabit').map(b => [b.ad, b.bas]), [['Okul', '09:00']]);
  dogru(pzt.bloklar.every(b => b.tur === 'sabit' || b.bas >= '10:00'), 'pazartesi okulun dışına kurulur');
  esit(h.gunler[0].bloklar.filter(b => b.tur === 'sabit').length, 0, 'cumartesi okul yok');
  const tum = [].concat(...h.gunler.map(p => p.bloklar.filter(b => b.tur === 'is').map(b => b.kaynakId)));
  esit(new Set(tum).size, tum.length, 'bir iş haftada iki kez planlanmaz');
  dogru(h.gunler[1].bloklar.some(b => b.tur === 'is' && b.devir === 1), 'pazar günü cumartesiden devreden iş var');
  esit(tum.length + h.devir.length + h.bekleyen.length, 12, 'hiçbir iş kaybolmaz');
  dogru(h.devir.length <= 2, 'gelecek haftaya en çok 2');
  esit(h.ozet.planlananDk.k, 'computed');
  const bitti = R.haftaKur(Plan, Object.assign({}, dr, { gunPlan: { gun: bugun, plan: { bloklar: [{ tur: 'is', id: 'i0', kaynakId: 'i0', durum: 'yapildi' }] } } }), s, bugun, {});
  dogru(![].concat(...bitti.hafta.gunler.map(p => p.bloklar)).some(b => b.kaynakId === 'i0'), 'bugün yapılan iş öngörüye girmez');
  const gun = R.planKur(Plan, { ayar: dr.ayar, isler: [], gunPlan: null }, '2026-11-16', { sablon: s }).plan;
  esit(gun.bloklar.filter(b => b.tur === 'sabit').map(b => b.ad), ['Okul'], 'günün planı da şablonun sabitlerini alır');
});

t('soru: havuz yalnız açık ünitelerin seçmeli alıştırmalarından; karma test motorla kurulur ve puanlanır', () => {
  const Soru = require('../motor/soru.js'), Yol = require('../motor/yol.js'), y = Yol.yukle(require('../alan/felsefe/asama-1.json'));
  const bos = R.soruHavuzu(Yol, y, Yol.bosKayit()), u1 = y.veri.uniteler[0];
  const beklenen = u1.dersler.reduce((n, d) => n + d.alistirmalar.filter(a => a.tur === 'secmeli').length, 0);
  esit(bos.havuz.length, beklenen, 'ilk ünite açık, ötekiler kilitli');
  dogru(bos.havuz.every(h => bos.sozluk[h.id] && y.tur[h.konu] === 'ders'), 'her soru sözlükte, konu = ders');
  esit(bos.sozluk[bos.havuz[0].id].konu, u1.dersler[0].ad, 'sözlükte konu ders adıdır');
  let k = Yol.bosKayit();
  k = Yol.kapiDene(y, k, u1.id, Object.fromEntries(u1.kapi.sorular.map(q => [q.id, q.dogru])), 1).kayit;
  dogru(R.soruHavuzu(Yol, y, k).havuz.length > beklenen, 'kapı geçilince ikinci ünitenin soruları da girer');
  let i = 0; const rnd = () => (i++ * 0.37) % 1;
  const r = Soru.alistirmaKur(bos.havuz, 10, 1000, rnd);
  esit([r.ok, r.oturum.sorular.length], [true, Math.min(10, beklenen)]);
  let o = r.oturum;
  esit(R.soruSirasi(o), 0);
  const q0 = bos.sozluk[o.sorular[0]];
  o = Soru.cevapla(o, 0, q0.dogru, bos.sozluk, 2000).oturum;
  o = Soru.bak(o, 1, 3000).oturum;
  esit(R.soruSirasi(o), 2);
  const ozet = Soru.oturumBitir(o, bos.sozluk, 4000).ozet.sayilar;
  esit([ozet.dogru, ozet.bakildi, ozet.yanlis, ozet.bos, ozet.toplam], [1, 1, 0, o.sorular.length - 2, o.sorular.length]);
});

t('ayar: sayı türü boş (null) ya da aralıkta; dışı ve metin reddedilir; gidiş-dönüş', () => {
  const b = A.tanim('lifeos.beden.boy'), dp = {}, depo = { getItem: k => (k in dp ? dp[k] : null), setItem: (k, v) => { dp[k] = String(v); }, removeItem: k => { delete dp[k]; } };
  esit([A.dogrula(b, null), A.dogrula(b, 175), A.dogrula(b, 99), A.dogrula(b, 231), A.dogrula(b, '175'), A.dogrula(b, NaN)], [true, true, false, false, false, false]);
  esit([A.yaz(depo, 'lifeos.beden.boy', 182.5), A.oku(depo, 'lifeos.beden.boy'), A.yaz(depo, 'lifeos.beden.boy', 500), A.oku(depo, 'lifeos.beden.boy')], [true, 182.5, false, 182.5]);
  dogru(/type="number"/.test(A.ciz(b, 175)) && /value="175"/.test(A.ciz(b, 175)) && /value=""/.test(A.ciz(b, null)), 'sayı alanı çizilir');
});
t('kayıt kuralları: profil tamsa enerji hedefi ve bazal hesaplanır; eksikse adıyla söylenir; hedef bazalın altına inmez', () => {
  const Kayit = require('../motor/kayit.js'), gun = '2026-11-13';
  const r = Kayit.kaydet('kilo', { kg: '70' }, { gun, zaman: 1 });
  dogru(r.ok, 'kilo kaydı kurulur');
  const tam = R.kuralOzeti(Kayit, [r.kayit], gun, { cinsiyet: 'erkek', boy: 175, dogumYili: 1996, hedef: 'ver' }, 2026);
  const enerji = tam.satirlar.find(s => s.ad === 'Enerji hedefi'), bazal = tam.satirlar.find(s => s.ad === 'Bazal metabolizma');
  dogru(enerji && bazal && enerji.etiket === 'hesaplandı', 'enerji ve bazal etiketli');
  esit(bazal.metin, '1649 kcal');                       // 10·70 + 6,25·175 − 5·30 + 5 (Mifflin-St Jeor, erkek)
  dogru(Number(enerji.metin.split(' ')[0]) >= 1649, 'hedef bazalın altına inmez (kilo verme hedefinde bile)');
  const eks = R.kuralOzeti(Kayit, [], gun, { cinsiyet: null, boy: null, dogumYili: null, hedef: 'saglik' }, 2026);
  esit(eks.eksik.slice().sort(), ['boy', 'cinsiyet', 'doğum yılı', 'kilo'].sort());
  dogru(eks.emirVeriYok && !eks.satirlar.some(s => s.ad === 'Bugünkü antrenman'), 'toparlanma verisi yoksa karar sayısı gösterilmez');
});
t('kayıt geçmiş gün: motorun penceresi (bugün ve 7 gün geri), gelecek yok; geçmiş güne kayıt o günün özetine girer', () => {
  const Kayit = require('../motor/kayit.js'), bugun = '2026-11-14';
  const gunler = R.kayitGunleri(Kayit, bugun);
  esit([gunler.length, gunler[0], gunler[gunler.length - 1]], [8, bugun, '2026-11-07']);
  dogru(gunler.every(g => g <= bugun), 'gelecek gün listede yok');
  const r = R.kayitEkle(Kayit, [], 'su', { ml: '400' }, false, '2026-11-12', 5000, bugun);
  esit([r.ok, r.kayit.gun], [true, '2026-11-12']);
  esit(R.gunOzeti(Kayit, r.kayitlar, '2026-11-12')[0].metin, '400 ml');
  esit(R.kayitEkle(Kayit, [], 'su', { ml: '400' }, false, '2026-11-15', 5000, bugun).hatalar, ['Gelecek bir güne kayıt yazılmaz.']);
  esit(R.kayitEkle(Kayit, [], 'su', { ml: '400' }, false, '2026-11-06', 5000, bugun).hatalar, ['En çok 7 gün geriye kayıt yazılır.']);
});
t('kayıt haftası: tür başına yedi gün motorun haftalik çıktısından; boş gün null (nokta), sıfır değil; tek etiket satırda, karışık etiket hücrede', () => {
  const Kayit = require('../motor/kayit.js'), bugun = '2026-11-14';
  let l = [], ekle = (tur, f, tahmin, gun, z) => { l = R.kayitEkle(Kayit, l, tur, f, tahmin, gun, z, bugun).kayitlar; };
  ekle('su', { ml: '500' }, false, '2026-11-08', 1); ekle('su', { ml: '700' }, false, bugun, 2);
  ekle('uyku', { saat: '7' }, true, '2026-11-13', 3); ekle('uyku', { saat: '8' }, false, bugun, 4);
  const h = R.haftaOzeti(Kayit, l, bugun);
  esit([h.bas, h.bitis, h.gunler.length, h.veriGunu], ['2026-11-08', bugun, 7, 3]);
  const su = h.satirlar.find(x => x.ad === 'Su'), uyku = h.satirlar.find(x => x.ad === 'Gece uykusu');
  esit(su.hucreler.map(c => c && c.v), [500, null, null, null, null, null, 700], 'boş gün null');
  esit([su.etiket, uyku.etiket], ['hesaplandı', null], 'su hep toplam (hesaplandı); uyku tahmin + ölçüldü karışık');
  esit(uyku.hucreler.filter(Boolean).map(c => c.etiket), ['tahmin', 'ölçüldü']);
  dogru(!h.satirlar.some(x => x.ad === 'Hareket'), 'verisi olmayan tür satırı yok');
  const suOrt = h.toplam.find(x => x.ad === 'Su');
  esit([suOrt.metin, suOrt.etiket], ['600 ml · 2 günün ortalaması', 'hesaplandı']);
  esit(R.haftaOzeti(Kayit, [], bugun).satirlar, []);
});
t('kayıt haftası: toparlanma ve yük motorun döndürdüğü gibi; veri yoksa motorun cümlesi; teşhis ve doz dili yok', () => {
  const Kayit = require('../motor/kayit.js'), K = Kayit.Kural, bugun = '2026-11-14';
  const bos = R.yukOzeti(Kayit, [], bugun);
  esit(bos.satirlar, [], 'veri yokken sayı yok');
  dogru(bos.notlar.includes(K.akutKronik([], bugun).neden) && bos.notlar.some(n => /toparlanma için kayıt yok/.test(n)), bos.notlar.join(' | '));
  let l = [], z = 1;
  const ekle = (tur, f, gun) => { const r = Kayit.kaydet(tur, f, { gun, zaman: z++ }); dogru(r.ok, JSON.stringify(r.hatalar)); l.push(r.kayit); };
  for (let i = 0; i < 28; i += 2) ekle('hareket', { dk: '40', rpe: String(5 + (i % 3)) }, Kayit.yardimci.gunEkle(bugun, -i));
  ekle('uyku', { saat: '7,5' }, bugun); ekle('enerji', { puan: '4' }, bugun); ekle('ates', { derece: '38,6' }, bugun);
  const y = R.yukOzeti(Kayit, l, bugun), tp = K.toparlanma(l, bugun), a = K.akutKronik(l, bugun), b = K.haftalikBuyume(l, bugun);
  esit(y.satirlar.find(s => s.ad === 'Toparlanma puanı').metin, tp.puan.v + ' / 100 · dinlenme', 'ateş bayrağı bandı dinlenmeye çeker');
  dogru(y.notlar.some(n => /Ateş kaydı 38,5 °C ya da üstünde/.test(n)), 'bayrak gerekçesi yazılır');
  esit(y.satirlar.find(s => /^Son hafta/.test(s.ad)).metin.split(' · ')[0], String(a.oran.v).replace('.', ','));
  esit(y.satirlar.find(s => s.ad === 'Bu haftaya en çok yük').metin, String(b.enCok.v));
  dogru(y.satirlar.every(s => ['hesaplandı', 'tahmin', 'ölçüldü'].includes(s.etiket)), 'her sayı etiketli');
  const metin = JSON.stringify([bos, y]);
  const yasak = /(^|[^a-zçğıöşü])(teşhis|tanı|hastalık|doz|ilaç|tedavi|reçete)/i;   // kelime başı: «haftanın» içindeki «tanı» sayılmaz
  dogru(!yasak.test(metin), 'teşhis/doz dili: ' + metin.match(yasak));
});
t('sisteme not: yeni araç King okumaz (varsayılan); kapalı aracın ve özel notun King yolundan geçmediği motorun süzgeciyle; klasör sonradan değişmez', () => {
  const T0 = 1700000000000;
  let r = R.aracKaydet(Not, [], 'yeni', { ad: 'Düşünce defteri', klasor: '', gorunum: 'ag', anlam: ' Fikirlerim. ', kullanim: 'Yalnız bağla.' }, T0, 'a1');
  const a1 = r.araclar[0];
  esit([r.id, a1.klasor, a1.gorunum, a1.sistemNotu], ['a1', 'Düşünce defteri', 'ag', { kingOkur: false, anlam: 'Fikirlerim.', kullanim: 'Yalnız bağla.' }]);
  r = R.aracKaydet(Not, r.araclar, 'yeni', { ad: 'Okuma', kingOkur: true, anlam: 'Alıntılar', kullanim: '' }, T0, 'a2');
  let hata = ''; try { R.aracKaydet(Not, r.araclar, 'yeni', { ad: 'Başka', klasor: 'Okuma' }, T0, 'a3'); } catch (e) { hata = e.message; }
  dogru(/«Okuma» aracı kullanıyor/.test(hata), hata);
  hata = ''; try { R.aracKaydet(Not, r.araclar, 'yeni', { ad: '  ' }, T0, 'a3'); } catch (e) { hata = e.message; }
  dogru(/adı yazılmalı/.test(hata), 'motorun cümlesi: ' + hata);
  const duz = R.aracKaydet(Not, r.araclar, 'a1', { ad: 'Defter', klasor: 'Başka yer', gorunum: 'liste', kingOkur: false, anlam: 'x', kullanim: 'y' }, T0 + 5, 'yok');
  esit([duz.araclar[0].ad, duz.araclar[0].klasor, duz.araclar[0].guncelleme, duz.araclar.length], ['Defter', 'Düşünce defteri', T0 + 5, 2], 'klasör değişmez');
  let notlar = [];
  [['g', { baslik: 'Gizli fikir', govde: 'iç', klasor: 'Düşünce defteri' }], ['o', { baslik: 'Alıntı', govde: '[[not:g|Gizli fikir]] [[not:p|Özel]]', klasor: 'Okuma' }],
    ['p', { baslik: 'Özel', govde: 'x', klasor: 'Okuma', ozel: true }]].forEach(([id, f]) => { notlar = R.notKaydet(Not, notlar, 'yeni', f, T0, id).notlar; });
  esit(R.aracNotlari(Not, notlar, r.araclar[1]).map(n => n.id), ['o', 'p']);
  const king = Not.kingOkur(notlar, { araclar: r.araclar });
  esit(king.map(n => n.id), ['o'], 'King yalnız açık aracın özel olmayan notunu okur');
  dogru(!/Gizli|Özel/.test(JSON.stringify(king)), 'kapalı ve özel notun adı bağ yoluyla da sızmaz');
  esit(Not.kingAraclar(r.araclar).map(a => a.id), ['a2'], 'King yalnız izinli aracın sistem notunu okur');
});

t('başlangıç paketi: kimlikle eklenir, var olana dokunmaz, geçersizi almaz; ikinci kez getirmek bir şey eklemez', () => {
  const Kayit = require('../motor/kayit.js');
  const n1 = Not.yeni({ id: 'eski1', baslik: 'Eski not', govde: 'x', olusturma: 5, kaynak: { yapi: 'defter' } });
  const benim = Not.yeni({ id: 'eski1', baslik: 'Benim sürümüm', govde: 'y', olusturma: 9 });
  const k1 = Kayit.kaydet('su', { ml: 500 }, { gun: '2026-11-01', zaman: 1 }).kayit;
  const paket = { notlar: [n1, { id: 'bozuk', baslik: '', govde: '' }, null], kayitlar: [k1, { id: 'k2', tur: 'yok', gun: '2026-11-01', deger: {} }], kartlar: [{ id: 'c1', on: 'S', arka: 'C' }, { id: 'c2', on: 'S' }] };
  const r = R.baslangicBirlestir(Not, Kayit, { notlar: [], kayitlar: [], kartlar: [] }, paket);
  esit([r.notlar.map(n => n.id), r.kayitlar.map(k => k.id), r.kartlar.map(k => k.id), r.say], [['eski1'], [k1.id], ['c1'], { not: 1, kayit: 1, kart: 1, atlanan: 4 }]);
  const iki = R.baslangicBirlestir(Not, Kayit, r, paket);
  esit([iki.say.not, iki.say.kayit, iki.say.kart, iki.notlar.length], [0, 0, 0, 1]);
  const korur = R.baslangicBirlestir(Not, Kayit, { notlar: [benim], kayitlar: [], kartlar: [] }, paket);
  esit(korur.notlar[0].baslik, 'Benim sürümüm', 'aynı kimlikte buradaki sürüm kalır');
  esit([R.baslangicMetni({ notlar: 5, kayitlar: 5, kartlar: 0 }), R.baslangicMetni({ not: 1, kayit: 0, kart: 2 })], ['5 not, 5 kayıt', '1 not, 2 kart']);
});

t('köken taşıması: paket yeni kökenin deposuna geri yazılır; var olan anahtarın üstüne yazılmaz; aynı paket iki kez işlenmez', () => {
  const T = require('./tasima.js'), d = sahteDepo({ 'lifeos.tema.secim': 'dark' });
  const paketler = [
    { ad: 'ays-c-1.json', kaynak: 'ays', profiller: { main: { data: { days: { a: 1 } } }, ikinci: { data: { x: 2 } } }, anahtarlar: { 'lifeos.tema.secim': 'light', 'lifeos.king.bas.ays': { a: 1 }, 'lifeos.ses': 'acik', bos: null } },
    { ad: 'spi-c-1.json', kaynak: 'spi', profiller: { ben: { data: { meta: 1 } } }, anahtarlar: {} },
    { ad: 'esp-c-1.json', kaynak: 'esp', profiller: { ben: { data: { p: 1 } } }, anahtarlar: {} },
    { ad: 'gun-c-1.json', kaynak: 'gun', profiller: {}, anahtarlar: { 'lifeos.gun.2026-11-01': { not: 'x' } } },
    null, { kaynak: 'ays' },
  ];
  const r = T.geriYukle(paketler, d, {});
  esit([d.v['rota84285.v2'], d.v['rota84285.v2.ikinci'], d.v['spi.v1.ben'], d.v['esp.v1.ben']], ['{"days":{"a":1}}', '{"x":2}', '{"meta":1}', '{"p":1}'], 'ana depo anahtarları modülün kendi adıyla');
  esit([d.v['lifeos.tema.secim'], d.v['lifeos.king.bas.ays'], d.v['lifeos.ses'], 'bos' in d.v], ['dark', '{"a":1}', 'acik', false], 'buradaki ayar kalır; metin aynen, nesne JSON');
  esit([r.yazilan, r.atlanan, r.iz], [7, 1, { ays: 'ays-c-1.json', spi: 'spi-c-1.json', esp: 'esp-c-1.json', gun: 'gun-c-1.json' }]);
  d.v['rota84285.v2'] = '{"benim":true}';
  const iki = T.geriYukle(paketler, d, r.iz);
  esit([iki.yazilan, iki.atlanan, d.v['rota84285.v2']], [0, 0, '{"benim":true}'], 'işlenmiş paket atlanır');
  const yeni = T.geriYukle([{ ad: 'ays-c-2.json', kaynak: 'ays', profiller: { main: { data: { eski: 1 } } }, anahtarlar: { yeniAnahtar: 5 } }], d, r.iz);
  esit([yeni.yazilan, d.v['rota84285.v2'], d.v.yeniAnahtar, yeni.iz.ays], [1, '{"benim":true}', '5', 'ays-c-2.json'], 'yeni pakette yalnız eksik anahtar yazılır');
});

// ---- harita ----
t('harita: kayıt geçerli (denetle boş liste)', () => esit(H.denetle(), []));
t('harita: id ve yol tekil', () => {
  const ids = H.YERLER.map(y => y.id), yollar = H.YERLER.map(y => y.yol);
  esit(new Set(ids).size, ids.length); esit(new Set(yollar).size, yollar.length);
});
t('harita: plandaki on alan var', () => {
  const alanlar = H.YERLER.filter(y => y.katman === 'alan').map(y => y.ad);
  esit(alanlar, ['Akademik', 'Dil', 'Felsefe', 'Tarih', 'Müzik', 'Okuma ve yazı', 'Beslenme', 'Hareket', 'Uyku', 'Tahlil']);
});
t('harita: yedi motor ve King var', () => {
  esit(H.YERLER.filter(y => y.katman === 'motor').map(y => y.id), ['yol', 'tekrar', 'soru', 'kayit', 'plan', 'not', 'arama']);
  esit(H.YERLER.filter(y => y.katman === 'king').length, 1);
});
t('harita: on alanın onu da taşındı: pilot ve aşamalı, içerik dosyası yerinde, eski sayfa bağlantısı duruyor', () => {
  const fs = require('fs'), path = require('path');
  const alanlar = H.YERLER.filter(y => y.katman === 'alan'), tasinan = alanlar.filter(y => y.asama);
  esit(tasinan.map(y => y.id), ['akademik', 'dil', 'felsefe', 'tarih', 'muzik', 'okuma', 'beslenme', 'hareket', 'uyku', 'tahlil']);
  tasinan.forEach(y => {
    esit(y.durum, 'pilot', y.id);
    dogru(Number.isInteger(y.asama) && y.asama >= 1, y.id + ' aşama numarası');
    dogru(fs.existsSync(path.join(__dirname, '..', 'alan', y.id, 'asama-1.json')), y.id + ' içeriği yok');
    esit(require('../alan/' + y.id + '/asama-1.json').id, y.id + '.1', y.id + ' aşama kimliği (kayıt anahtarı buna dayanır)');
    // haritadaki sayıdan sonraki aşama dosyası yazıldıysa kabuk onu istemez: sayı artırılmalı
    dogru(!fs.existsSync(path.join(__dirname, '..', 'alan', y.id, 'asama-' + (y.asama + 1) + '.json')), y.id + ': asama-' + (y.asama + 1) + '.json var ama haritada asama ' + y.asama);
  });
  alanlar.filter(y => !y.asama).forEach(y => { esit(y.durum, 'eski', y.id); dogru(/\.html$/.test(y.eski), y.id + ' bağlantı'); });
  alanlar.forEach(y => dogru(/\.html$/.test(y.eski), y.id + ' eski sayfa bağlantısı'));
});
// ---- aşamalar: asama-N.json, aşama başına kayıt, eski birinci aşama kaydı ----
const As = K.Asama;
// Felsefe'nin birinci aşamasından türetilen yapay ikinci aşama (gerçek asama-2.json olsa da olmasa da test aynı çalışsın)
const ikinci = onKosul => Object.assign(JSON.parse(JSON.stringify(require('../alan/felsefe/asama-1.json')).replace(/"felsefe\.1/g, '"felsefe.2')), { sira: 2, onKosul });
t('aşama: kimliği tutmayan, bozuk ya da eksik aşama gösterilmez; ilk eksikte durulur', () => {
  const Yol = require('../motor/yol.js'), v1 = require('../alan/felsefe/asama-1.json');
  esit(As.kur(Yol, 'felsefe', [v1, null, ikinci([])]).length, 1, 'ikinci yoksa üçüncüye bakılmaz');
  esit(As.kur(Yol, 'felsefe', [v1, Object.assign(ikinci([]), { id: 'felsefe.9' })]).length, 1, 'kimlik felsefe.2 değil');
  esit(As.kur(Yol, 'felsefe', [v1, { id: 'felsefe.2', uniteler: [] }]).length, 1, 'Yol yükleyemiyor');
  esit(As.kur(Yol, 'felsefe', [null]).length, 0);
  esit(As.kur(Yol, 'felsefe', [v1, ikinci(['felsefe.1'])]).map(y => y.id), ['felsefe.1', 'felsefe.2']);
});
t('aşama: ikinci aşama ancak birincinin kapısı geçilince açılır (önkoşulu boş yazılmış olsa da); kayıtlar ayrı', () => {
  const Yol = require('../motor/yol.js'), ys = As.kur(Yol, 'felsefe', [require('../alan/felsefe/asama-1.json'), ikinci([])]), [y1, y2] = ys, depo = sahteDepo();
  esit(y2.veri.onKosul, ['felsefe.1'], 'önceki aşama önkoşula eklendi');
  const liste = () => As.liste(Yol, ys, n => As.kayit(depo, Yol, 'felsefe', n, 2));
  esit(liste().map(x => [x.n, x.acik, x.gecti]), [[1, true, false], [2, false, false]]);
  esit(As.calisilan(liste()), 1);
  dogru(!Yol.acikMi(y2, As.kayit(depo, Yol, 'felsefe', 2, 2), y2.veri.uniteler[0].dersler[0].id), 'kilitli aşamanın dersi de kilitli');
  // birinci aşamayı baştan sona geç: bütün ünite kapıları, sonra aşama kapısı
  const dogrular = (y, id) => Object.fromEntries(y.oge[id].kapi.sorular.map(q => [q.id, q.dogru]));
  let k = As.kayit(depo, Yol, 'felsefe', 1, 2);
  y1.veri.uniteler.forEach(u => { k = Yol.kapiDene(y1, k, u.id, dogrular(y1, u.id), 5).kayit; });
  k = Yol.kapiDene(y1, k, y1.id, dogrular(y1, y1.id), 6).kayit;
  As.yaz(depo, 'felsefe', 1, k);
  esit(liste().map(x => [x.n, x.acik, x.gecti]), [[1, true, true], [2, true, false]]);
  esit(As.calisilan(liste()), 2, 'çalışılan aşama ikinciye geçti');
  // ikinci aşamada ilerle ve yaz: birinci aşamanın kaydı değişmez, ikincinin kaydı birincinin geçişini taşımaz
  const once = depo.v['lifeos.yol.felsefe.1'];
  let k2 = As.kayit(depo, Yol, 'felsefe', 2, 2);
  k2 = Yol.dersOku(y2, k2, y2.veri.uniteler[0].dersler[0].id, 7);
  As.yaz(depo, 'felsefe', 2, k2);
  esit(depo.v['lifeos.yol.felsefe.1'], once, 'birinci aşama kaydı aynen');
  esit(JSON.parse(depo.v['lifeos.yol.felsefe.2']).asamalar, {}, 'ikinci kayıtta yalnız kendi aşaması');
  esit(Object.keys(JSON.parse(depo.v['lifeos.yol.felsefe.2']).dersler), [y2.veri.uniteler[0].dersler[0].id]);
  esit(Yol.durum(y1, As.kayit(depo, Yol, 'felsefe', 1, 2)).ilerleme.gecilenUnite.deger, 3, 'birinci aşamanın ilerlemesi yerinde');
});
t('eski kayıt: tek aşamalı dönemde yazılmış lifeos.yol.felsefe.1 aynen okunur, yazılınca hiçbir alanı kaybolmaz', () => {
  const Yol = require('../motor/yol.js'), y1 = Yol.yukle(require('../alan/felsefe/asama-1.json')), u1 = y1.veri.uniteler[0];
  // eski kabuğun (68e721aa) yazdığı biçim: dört alan + göçten gelen «eski», bilinmeyen bir alan da korunur
  const eski = { dersler: { [u1.dersler[0].id]: { okundu: 1731400000000 }, [u1.dersler[1].id]: { okundu: 1731400100000 } },
    cevaplar: { [u1.dersler[0].alistirmalar[0].id]: [{ cevap: 'B', dogru: false, zaman: 1731400050000 }] },
    kapilar: { [u1.id]: [{ zaman: 1731400200000, dogruSayisi: 4, toplam: 4, oran: 1, esik: 0.75, gecti: true, taslak: true }] }, asamalar: {},
    eski: { 'ays:x/y': { konu: 'y', durum: 'closed', etiket: 'eski kayıt' } }, gelecekAlan: 1 };
  const ham = JSON.stringify(eski), depo = sahteDepo({ 'lifeos.yol.felsefe.1': ham });
  esit(As.kayitAnahtari('felsefe', 1), 'lifeos.yol.felsefe.1', 'birinci aşamanın anahtarı eskisinin aynısı');
  esit(As.kayit(depo, Yol, 'felsefe', 1, 1), eski, 'tek aşamayla okunan kayıt eskisinin aynısı');
  esit(As.kayit(depo, Yol, 'felsefe', 1, 2), eski, 'ikinci aşama eklenince de aynısı');
  const dr = Yol.durum(y1, As.kayit(depo, Yol, 'felsefe', 1, 2));
  esit([dr.ilerleme.okunanDers.deger, dr.ilerleme.gecilenUnite.deger, dr.uniteler[1].acik], [2, 1, true], 'ilerleme ve açılan ünite yerinde');
  As.yaz(depo, 'felsefe', 1, As.kayit(depo, Yol, 'felsefe', 1, 2));
  esit(depo.v['lifeos.yol.felsefe.1'], ham, 'okuyup yazınca bayt bayt aynı');
  const k = Yol.dersOku(y1, As.kayit(depo, Yol, 'felsefe', 1, 2), u1.dersler[2].id, 1731400300000);
  As.yaz(depo, 'felsefe', 1, k);
  const son = JSON.parse(depo.v['lifeos.yol.felsefe.1']);
  esit([son.eski, son.gelecekAlan, son.kapilar, son.cevaplar], [eski.eski, 1, eski.kapilar, eski.cevaplar], 'yeni dersle birlikte eski her şey duruyor');
  esit(Object.keys(son.dersler).length, 3);
  dogru(depo.v['lifeos.yol.felsefe.2'] === undefined, 'ikinci aşamaya kendiliğinden kayıt yazılmaz');
});
t('yerleştirme: yalnız boş alanda; geçilen aşama atlandı (tahmin), sonraki açılır; ünite kapısı geçilince tahmin bütün aşamalarda silinir', () => {
  const Yol = require('../motor/yol.js'), ys = As.kur(Yol, 'felsefe', [require('../alan/felsefe/asama-1.json'), ikinci([])]), [y1, y2] = ys, depo = sahteDepo();
  const cevap = (y, n) => Object.fromEntries(Yol.yerlestirmeSorulari(y).map((id, i) => [id, i < n ? y.oge[id].dogru : 'X']));
  dogru(As.yeniMi(Yol, depo, 'felsefe', 2), 'boş alan yeni');
  const r = As.yerlestir(Yol, depo, 'felsefe', ys, [cevap(y1, 6), cevap(y2, 1)], 10, false);
  esit([r.seviye, r.sonuclar.map(s => s.gecti)], [2, [true, false]]);
  dogru(!As.yeniMi(Yol, depo, 'felsefe', 2), 'yerleştirmeden sonra yeni değil');
  const liste = As.liste(Yol, ys, n => As.kayit(depo, Yol, 'felsefe', n, 2));
  esit(liste.map(x => [x.acik, x.gecti]), [[true, false], [true, false]], 'birinci atlandı (geçilmedi), ikinci açık');
  esit(As.calisilan(liste), 2);
  esit(Yol.durum(y1, As.kayit(depo, Yol, 'felsefe', 1, 2)).ilerleme.atlananUnite.etiket, 'tahmin');
  let h = ''; try { As.yerlestir(Yol, depo, 'felsefe', ys, [cevap(y1, 6)], 11, false); } catch (e) { h = e.message; }
  dogru(/hiç kaydı olmayan/.test(h), 'ikinci yerleştirme reddedilir');
  // ikinci aşamanın ilk ünite kapısı ölçülerek geçilir: iki aşamada da tahmin silinir
  const u = y2.veri.uniteler[0], k2 = Yol.kapiDene(y2, As.kayit(depo, Yol, 'felsefe', 2, 2), u.id, Object.fromEntries(u.kapi.sorular.map(q => [q.id, q.dogru])), 12).kayit;
  As.yaz(depo, 'felsefe', 2, k2);
  As.tahminSil(Yol, depo, 'felsefe', 2, 12);
  esit([1, 2].map(n => JSON.parse(depo.v['lifeos.yol.felsefe.' + n]).yerlestirme.etiket), [undefined, undefined]);
  esit(Yol.durum(y1, As.kayit(depo, Yol, 'felsefe', 1, 2)).ilerleme.atlananUnite.etiket, 'hesaplandı');
  // eski kayıt: yerleştirmesiz dolu kayıt yeni sayılmaz
  dogru(!As.yeniMi(Yol, sahteDepo({ 'lifeos.yol.felsefe.1': JSON.stringify(Yol.dersOku(y1, Yol.bosKayit(), y1.veri.uniteler[0].dersler[0].id, 1)) }), 'felsefe', 2));
});
t('kapıda kalınca: yanlış ve boş kapı soruları kaynağıyla bir kez kart olur; taslak kart planlanmaz', () => {
  const Yol = require('../motor/yol.js'), y = Yol.yukle(require('../alan/felsefe/asama-1.json')), u = y.veri.uniteler[0];
  const c = { [u.kapi.sorular[0].id]: u.kapi.sorular[0].dogru, [u.kapi.sorular[1].id]: 'X' };
  const a = Yol.kapiTekrarAdaylari(y, u.id, c), l = R.kartlariEsitle(Tekrar, [], a, y);
  esit(l.map(x => x.id), u.kapi.sorular.slice(1).map(q => q.id), 'yanlış ve boş olanlar');
  const q = u.kapi.sorular[1];
  esit([l[0].kaynak, l[0].alan, l[0].asama, l[0].unite, l[0].kapi, l[0].icerik, l[0].on, l[0].arka], ['kapi', 'felsefe', 'felsefe.1', u.id, u.id, 'taslak', q.soru, q.sec['ABCD'.indexOf(q.dogru)]]);
  dogru(R.kartlariEsitle(Tekrar, l, Yol.kapiTekrarAdaylari(y, u.id, c), y) === l, 'aynı soru ikinci kez eklenmez');
  esit(R.kartlariEsitle(Tekrar, l, Yol.kapiTekrarAdaylari(y, u.id, {}), y).length, 4, 'yalnız yeni yanlış eklenir');
  esit(Tekrar.plan(l, 1000, {}).yeni.length, 0, 'taslak tekrara girmez');
});
t('yol: on alanın içeriği Yol motoruna yüklenir ve ilk adım bir derstir', () => {
  const Yol = require('../motor/yol.js');
  H.YERLER.filter(y => y.asama).forEach(a => {
    const y = Yol.yukle(require('../alan/' + a.id + '/asama-1.json')), adim = K.siradaki(Yol.durum(y, Yol.bosKayit()));
    esit(adim && adim.tur, 'ders', a.id);
    dogru(y.tur[adim.id] === 'ders' && Yol.acikMi(y, Yol.bosKayit(), adim.id), a.id + ' ilk ders açık');
  });
});
t('harita: her yer halkadan en çok iki adımda', () => {
  H.YERLER.forEach(y => dogru(H.halkaAdimi(y.id) <= 2, y.id + ' ' + H.halkaAdimi(y.id)));
  esit(H.halkaAdimi('bugun'), 1); esit(H.halkaAdimi('felsefe'), 2);
});
t('harita: her yer komut çubuğundan bir adımda (adıyla aranınca ilk sırada)', () => {
  const og = K.komutOgeleri(H, A);
  H.YERLER.forEach(y => esit(K.ara(y.ad, og, 1)[0].id, y.id, y.ad));
});
t('harita: halka 3-6 yer; halkadan çıkarılınca denetim yakalar', () => {
  const n = H.halka().length; dogru(n >= 3 && n <= 6, String(n));
  const bozuk = H.YERLER.map(y => Object.assign({}, y, y.id === 'harita' || y.id === 'ogren' ? { halka: undefined } : {}));
  dogru(H.denetle(bozuk).some(h => /iki adımda/.test(h)), 'yakalamadı');
});
t('harita: bozuk satırları yakalar (tekrar id, eski bağlantısız, yanlış katman)', () => {
  const b = H.YERLER.concat([{ id: 'bugun', ad: 'X', katman: 'oda', dal: 'ana', yol: '#/x', durum: 'eski' }]);
  const h = H.denetle(b).join('|');
  dogru(/tekrar ediyor/.test(h) && /bağlantısı yok/.test(h) && /katman/.test(h), h);
});

// ---- ayar şeması ----
t('ayar: her satırın zorunlu alanları var ve varsayılan geçerli', () => {
  const g = A.GRUPLAR.map(x => x.id), gor = {};
  A.SEMA.forEach(s => {
    ['anahtar', 'ad', 'tur', 'aciklama', 'kaynak'].forEach(k => dogru(s[k], s.anahtar + ' ' + k));
    dogru(typeof s.esitlenir === 'boolean', s.anahtar + ' esitlenir');
    dogru(g.indexOf(s.grup) >= 0, s.anahtar + ' grup');
    dogru(A.dogrula(s, s.varsayilan), s.anahtar + ' varsayılan');
    dogru(!gor[s.anahtar], s.anahtar + ' tekrar'); gor[s.anahtar] = 1;
    dogru(/envanter-kabuk-sunucu\.md §3[bc]|envanter-spi\.md §|faz2-indexeddb\.md §/.test(s.kaynak), s.anahtar + ' kaynak');
  });
});
t('ayar: salt bilgi satırı (kalıcı depolama) okunur, yazılmaz, üç durumu da yazıyla çizer', () => {
  const t = A.tanim('depo.kalici'), d = sahteDepo({});
  esit(A.yaz(d, 'depo.kalici', true), false); esit(d.v['depo.kalici'], undefined);
  esit(A.oku(d, 'depo.kalici'), null, 'depo yokken bilinmiyor');
  dogru(/Kalıcı</.test(A.ciz(t, true)) && /Tarayıcı silebilir</.test(A.ciz(t, false)) && /Bilinmiyor</.test(A.ciz(t, null)) && !/<button|<input/.test(A.ciz(t, true)));
  esit(Object.keys(A.disaAktar(d)).indexOf('depo.kalici'), -1, 'eşitlenmez');
});
t('ayar: doğrulama yanlış değeri reddeder', () => {
  dogru(!A.dogrula(A.tanim('lifeos.boyut'), 'dev'));
  dogru(!A.dogrula(A.tanim('lifeos.sessiz'), { acik: true, bas: '25:00', bit: '07:00' }));
  dogru(A.dogrula(A.tanim('lifeos.sessiz'), { acik: true, bas: '23:30', bit: '06:00' }));
});
t('ayar: oku boş, bozuk ya da geçersiz değerde varsayılana düşer', () => {
  const d = sahteDepo({ 'lifeos.boyut': 'dev', 'lifeos.sessiz': '{bozuk', 'lifeos.satir': 'genis' });
  esit(A.oku(d, 'lifeos.boyut'), 'normal'); esit(A.oku(d, 'lifeos.sessiz').bas, '22:00');
  esit(A.oku(d, 'lifeos.satir'), 'genis'); esit(A.oku(d, 'lifeos.kontrast'), 'normal');
});
t('ayar: yaz geçersizi yazmaz; nesne JSON olarak yazılır', () => {
  const d = sahteDepo();
  esit(A.yaz(d, 'lifeos.boyut', 'dev'), false); esit(d.v['lifeos.boyut'], undefined);
  esit(A.yaz(d, 'lifeos.sessiz', { acik: true, bas: '21:00', bit: '06:30' }), true);
  esit(A.oku(d, 'lifeos.sessiz'), { acik: true, bas: '21:00', bit: '06:30' });
  esit(A.yaz(d, 'lifeos.yok', 'x'), false);
});
t('ayar: sıfırlama tek anahtarı ya da hepsini siler, şema dışına dokunmaz', () => {
  const d = sahteDepo({ 'lifeos.boyut': 'buyuk', 'lifeos.satir': 'genis', 'baska': '1' });
  A.sifirla(d, 'lifeos.boyut'); esit(d.v['lifeos.boyut'], undefined); esit(d.v['lifeos.satir'], 'genis');
  A.sifirla(d); esit(Object.keys(d.v), ['baska']);
});
t('ayar: dışa aktarım yalnız eşitlenenleri verir; içe alım süzer', () => {
  const d = sahteDepo({ 'lifeos.kilit.odeme': 'acik' });
  const p = A.disaAktar(d);
  dogru(!('lifeos.kilit.odeme' in p), 'eşitlenmeyen gitti');
  esit(Object.keys(p).length, A.SEMA.filter(s => s.esitlenir).length);
  const d2 = sahteDepo();
  esit(A.iceAl(d2, { 'lifeos.boyut': 'buyuk', 'lifeos.kontrast': 'cok', 'lifeos.kilit.odeme': 'acik', 'yabanci': 'x' }), ['lifeos.boyut']);
  esit(d2.v, { 'lifeos.boyut': 'buyuk' });
});
t('ayar: kök nitelikleri; Cihaza uy temada niteliği kaldırır', () => {
  const n = A.kokNitelikleri(sahteDepo({ 'lifeos.boyut': 'buyuk' }));
  esit(n['data-boyut'], 'buyuk'); esit(n['data-theme'], null);
  esit(A.kokNitelikleri(sahteDepo({ 'lifeos.tema.secim': 'dark' }))['data-theme'], 'dark');
});
t('ayar: ciz her seçeneği bir radyo düğmesi yapar, seçili tek, metin kaçışlı', () => {
  const s = A.tanim('lifeos.boyut'), h = A.ciz(s, 'buyuk');
  esit((h.match(/role="radio"/g) || []).length, 4);
  esit((h.match(/aria-checked="true"/g) || []).length, 1);
  dogru(/data-deger="buyuk"[^>]*>Büyük/.test(h.replace('aria-checked="true" tabindex="0" ', '')) || /aria-checked="true"[^>]*data-deger="buyuk"/.test(h));
  dogru(!/<script/.test(A.ciz(Object.assign({}, s, { ad: '<script>' }), 'normal')));
  dogru(/type="time"/.test(A.ciz(A.tanim('lifeos.sessiz'), A.tanim('lifeos.sessiz').varsayilan)));
});

// ---- komut çubuğu sıralaması ----
t('katla: Türkçe harfler (ç ğ ı İ ö ş ü) ve büyük/küçük', () => {
  esit(K.katla('ÇĞIİÖŞÜ çğıiöşü'), 'cgiiosu cgiiosu');
  esit(K.katla('  Okuma   ve YAZI '), 'okuma ve yazi');
  esit(K.katla('İstanbul'), K.katla('istanbul'));
});
const og = K.komutOgeleri(H, A);
t('ara: aksansız yazınca bulur (muzik → Müzik, saglik → Sağlık, uyku)', () => {
  esit(K.ara('muzik', og, 1)[0].id, 'muzik');
  esit(K.ara('saglik', og, 1)[0].id, 'saglik');
  esit(K.ara('UYKU', og, 1)[0].id, 'uyku');
});
t('ara: büyük İ ve I doğru katlanır (YAZI → yazı, DİKSİYON → diksiyon)', () => {
  const y = K.ara('YAZI', og, 3).map(o => o.id);
  esit(y.slice(0, 2).sort(), ['lifeos.boyut', 'lifeos.yazi'], 'ad başı (Yazı …) önce'); esit(y[2], 'okuma', 'kelime başı sonra');
  esit(K.ara('SATIN', og, 1)[0].id, 'lifeos.kilit.odeme');
  esit(K.ara('DİLLER DİKSİYON', og, 1)[0].id, 'dil');
});
t('ara: ad başı önce, eşit puanda kısa ad önce, ad içi sonra', () => {
  const r = K.ara('fel', og, 3).map(o => o.id);
  esit(r[0], 'felsefe');
  const s = K.ara('ta', og, 99).map(o => o.id);
  esit(s.slice(0, 2), ['tarih', 'tahlil'], 'eşit puanda kısa ad önce');
  dogru(s.indexOf('yol') > 1, 'açıklamada geçen sonra: ' + s.join(','));
});
t('ara: eşit puanda yer, ayardan; ayar, eylemden önce', () => {
  const r = K.ara('tema', og).map(o => o.tur);
  dogru(r.indexOf('ayar') < r.indexOf('eylem'), r.join(','));
});
t('ara: çok kelimede her kelime tutmalı', () => {
  esit(K.ara('okuma yazı', og, 1)[0].id, 'okuma');
  esit(K.ara('felsefe uçak', og).length, 0);
});
t('ara: ayarlar ve eylemler de aranır (koyu, sessiz)', () => {
  esit(K.ara('koyu', og, 1)[0].id, 'tema-koyu');
  esit(K.ara('sessiz', og, 1)[0].id, 'lifeos.sessiz');
});
t('ara: boş sorgu hepsine 1 puan, sonuç sınırı uygulanır', () => {
  esit(K.puan('', og[0]), 1); esit(K.ara('', og, 5).length, 5); esit(K.ara('zzzz', og).length, 0);
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
