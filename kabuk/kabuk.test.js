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
t('harita: içeriği taşınan dört alan pilot ve aşamalı, içerik dosyası yerinde; kalanlar eski ve bağlantılı', () => {
  const fs = require('fs'), path = require('path');
  const alanlar = H.YERLER.filter(y => y.katman === 'alan'), tasinan = alanlar.filter(y => y.asama);
  esit(tasinan.map(y => y.id), ['akademik', 'dil', 'felsefe', 'tarih']);
  tasinan.forEach(y => {
    esit([y.durum, y.asama], ['pilot', 1], y.id);
    dogru(fs.existsSync(path.join(__dirname, '..', 'alan', y.id, 'asama-1.json')), y.id + ' içeriği yok');
    esit(require('../alan/' + y.id + '/asama-1.json').id, y.id + '.1', y.id + ' aşama kimliği (kayıt anahtarı buna dayanır)');
  });
  alanlar.filter(y => !y.asama).forEach(y => { esit(y.durum, 'eski', y.id); dogru(/\.html$/.test(y.eski), y.id + ' bağlantı'); });
  alanlar.forEach(y => dogru(/\.html$/.test(y.eski), y.id + ' eski sayfa bağlantısı'));
});
t('yol: dört alanın içeriği Yol motoruna yüklenir ve ilk adım bir derstir', () => {
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
    dogru(/envanter-kabuk-sunucu\.md §3[bc]/.test(s.kaynak), s.anahtar + ' kaynak');
  });
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
