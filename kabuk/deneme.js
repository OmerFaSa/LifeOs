/* LIFEOS.Kabuk süreli deneme ve sınav provası (sadeleşme Faz 3, Soru aracının ikinci ekranı). Yol: #/motor/soru/deneme.
 * Kural motor/soru.js'tedir; burası soruyu seçer, çizer ve kaydeder:
 *   süreli deneme : denemeBaslat, testeGit, kalanSure, gecenSn, kontrol, denemeBitir, denemeAnalizi
 *   sınav provası : provaPlani, provaKur, kalanSn, cevapla, oturumBitir (provada ilk cevap kilitlenir, doğru/yanlış sonda)
 *   puan ve sıra  : puanTahmini (yalnız Akademik; her sayı motorun etiketiyle, tahmin hep tahmin)
 * Kayıt (karma testle aynı yol): lifeos.soru.deneme (süren), lifeos.soru.denemeler (biten denemeler, motorun Deneme biçimi),
 * prova sonucu lifeos.soru.gecmis'e karma testle aynı biçimde. Süre duvar saatinden (sahibin 2026-11-01 kararı): sekme kapalıyken de akar.
 * araclar.js'ten SONRA, kabuk.js'ten ÖNCE yüklenir. Sıfır bağımlılık; Node'da module.exports (yalnız saf kısım). */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  var HARF = 'ABCDE';
  var TEST_SORU = 10, EN_COK_TEST = 4; // shortcut: deneme son 4 açık ünite × en çok 10 soru; ünite seçmek istenirse seçim ekranı gelir

  /* ---------------- saf ---------------- */
  // Akademik ünite adı («TYT Türkçe — Anlam») → sınav dersi (Soru.PROVA sırasındaki kimlik) ve ekrandaki adı.
  var DERS = [['TYT Türkçe', 'tyt-turkce', 'Türkçe'], ['TYT Sosyal', 'tyt-sosyal', 'Sosyal bilimler'], ['TYT Temel Matematik', 'tyt-matematik', 'Temel matematik'],
    ['TYT Fen', 'tyt-fen', 'Fen bilimleri'], ['AYT Matematik', 'ayt-matematik', 'Matematik'], ['AYT Fizik', 'ayt-fizik', 'Fizik'],
    ['AYT Kimya', 'ayt-kimya', 'Kimya'], ['AYT Biyoloji', 'ayt-biyoloji', 'Biyoloji']];
  // Sınavdaki soru sayıları (AYS/src/js/data/subjects.js `questions`): prova kotası bunlara göre bölünür (Soru.provaPlani).
  var DERS_SORU = { 'tyt-turkce': 40, 'tyt-sosyal': 20, 'tyt-matematik': 40, 'tyt-fen': 20, 'ayt-matematik': 40, 'ayt-fizik': 14, 'ayt-kimya': 13, 'ayt-biyoloji': 13 };
  function dersOf(u) { for (var i = 0; i < DERS.length; i++) if (u.ad.indexOf(DERS[i][0]) === 0) return DERS[i]; return null; }
  function dersAdi(id) { for (var i = 0; i < DERS.length; i++) if (DERS[i][1] === id) return DERS[i][2]; return id || '—'; }

  // Aşamanın bütün seçmeli alıştırmaları: kimlik → soru (konu: ders adı, ders: sınav dersi ya da null). Süren denemenin soruları buradan okunur.
  function sozluk(y) {
    var s = {};
    y.veri.uniteler.forEach(function (u) {
      var dd = dersOf(u);
      u.dersler.forEach(function (d) { d.alistirmalar.forEach(function (a) { if (a.tur === 'secmeli') s[a.id] = Object.assign({}, a, { konu: d.ad, ders: dd ? dd[1] : null }); }); });
    });
    return s;
  }
  function acikUniteler(Yol, y, kayit) { return y.veri.uniteler.filter(function (u) { return Yol.acikMi(y, kayit, u.id); }); }
  function uniteHavuzu(u) {
    var h = [];
    u.dersler.forEach(function (d) { d.alistirmalar.forEach(function (a) { if (a.tur === 'secmeli') h.push({ id: a.id, konu: d.id, seviye: a.seviye }); }); });
    return h;
  }
  // Süreli deneme: açık ünitelerin her biri bir test. Soru seçimi motorun karma testiyle (karıştır, aynı ders ard arda gelmesin);
  // ünitede karma test için az soru varsa hepsi sırasıyla. Süre ÖSYM TYT ölçeğiyle, provaKur'un formülü (165 dk / 120 soru).
  // Alan denemesi kısa olduğu için `tur: 'kesit'`: puan ve sıra tahminine girmez (motor yalnız tam denemeyle konuşur).
  function denemeKur(Soru, Yol, y, kayit, ad, simdi, rnd) {
    var testler = [], sorular = [];
    acikUniteler(Yol, y, kayit).slice(-EN_COK_TEST).forEach(function (u) {
      var h = uniteHavuzu(u);
      if (!h.length) return;
      var r = Soru.alistirmaKur(h, TEST_SORU, simdi, rnd), ids = r.ok ? r.oturum.sorular : h.map(function (x) { return x.id; });
      testler.push({ ad: u.ad, q: ids.length }); sorular.push(ids);
    });
    if (!testler.length) return { ok: false, neden: 'Açık ünitelerde seçmeli soru yok.' };
    var n = sorular.reduce(function (a, l) { return a + l.length; }, 0), P = Soru.PROVA.TYT;
    var b = Soru.denemeBaslat({ id: y.id, ad: ad + ' denemesi', aile: null, tur: 'kesit', sure: Math.max(1, Math.round(P.dk * n / P.soru)), testler: testler }, simdi);
    return b.ok ? { ok: true, durum: { mod: 'deneme', asama: y.id, oturum: b.oturum, sorular: sorular, cevaplar: {}, i: 0 } } : { ok: false, neden: b.neden };
  }
  // Prova havuzu: açık ünitelerin seçmeli alıştırmaları sınav dersine göre. Akademik dışında boş.
  function provaHavuzu(Yol, y, kayit) {
    var h = {};
    acikUniteler(Yol, y, kayit).forEach(function (u) { var dd = dersOf(u); if (dd) h[dd[1]] = (h[dd[1]] || []).concat(uniteHavuzu(u)); });
    return h;
  }
  function provaVar(y) { return y.veri.uniteler.some(dersOf); }
  function provaKur(Soru, Yol, y, kayit, sinav, boy, simdi, rnd) {
    var r = Soru.provaKur(Soru.provaPlani(sinav, DERS_SORU, boy), provaHavuzu(Yol, y, kayit), simdi, rnd);
    return r.ok ? { ok: true, durum: { mod: 'prova', asama: y.id, oturum: r.oturum, i: 0 } } : { ok: false, neden: r.neden, n: r.n };
  }

  // Sorular tek sırada: [{ id, t (test sırası) }]. Provada tek test.
  function duz(dr) {
    if (dr.mod === 'prova') return dr.oturum.sorular.map(function (id) { return { id: id, t: 0 }; });
    var l = [];
    dr.sorular.forEach(function (ids, t) { ids.forEach(function (id) { l.push({ id: id, t: t }); }); });
    return l;
  }
  function cevabi(dr, i) {
    if (dr.mod === 'prova') { var c = dr.oturum.cevaplar[i]; return c ? c.h : null; }
    return dr.cevaplar[duz(dr)[i].id] || null;
  }
  function kalan(Soru, dr, simdi) { return dr.mod === 'prova' ? Soru.kalanSn(dr.oturum, simdi) : Soru.kalanSure(dr.oturum, simdi); }
  // Soruya git: deneme başka teste geçiyorsa motorun test saati de geçer (testeGit). Dönen yeni durumdur.
  function git(Soru, dr, i, simdi) {
    var l = duz(dr);
    if (!(i >= 0 && i < l.length)) return dr;
    var y = Object.assign({}, dr, { i: i });
    if (dr.mod === 'deneme' && l[i].t !== dr.oturum.sira) y.oturum = Soru.testeGit(dr.oturum, l[i].t, simdi);
    return y;
  }
  // Cevap: denemede bitirene kadar değişir; provada motorun kuralıyla ilk cevap kilitlenir, süre dolunca alınmaz.
  function cevapVer(Soru, dr, h, sz, simdi) {
    if (kalan(Soru, dr, simdi) === 0) return { ok: false, neden: 'sure' };
    if (dr.mod === 'prova') {
      var r = Soru.cevapla(dr.oturum, dr.i, h, sz, simdi);
      return r.ok ? { ok: true, durum: Object.assign({}, dr, { oturum: r.oturum }) } : { ok: false, neden: r.neden };
    }
    var id = duz(dr)[dr.i].id, k = Soru.kontrol(sz[id], h);
    if (!k.ok) return { ok: false, neden: 'gecersiz' };
    var c = Object.assign({}, dr.cevaplar); c[id] = h;
    return { ok: true, durum: Object.assign({}, dr, { cevaplar: c }) };
  }
  // Testlerin doğru/yanlışı; boş yazılmaz, motor sorudan türetir (Soru.bosBelirle: hesaplandı).
  function skorlar(Soru, dr, sz) {
    return dr.sorular.map(function (ids) {
      var s = { dogru: 0, yanlis: 0 };
      ids.forEach(function (id) { var h = dr.cevaplar[id], k = h && sz[id] ? Soru.kontrol(sz[id], h) : null; if (k && k.ok) s[k.dogru ? 'dogru' : 'yanlis']++; });
      return s;
    });
  }
  // Bitir: deneme → { deneme (motorun Deneme kaydı), analiz, toplamSn, sureDoldu, sorular }; prova → { sonuc, ozet } (oturumBitir).
  function bitir(Soru, dr, sz, simdi) {
    var doldu = kalan(Soru, dr, simdi) === 0, o = dr.oturum;
    // süre dolduysa bitiş anı sınırın kendisidir: sekme kapalıyken dolduysa sonradan açılınca ölçüm şişmesin
    var an = !doldu ? simdi : dr.mod === 'prova' ? o.bitis : o.bas + o.durakMs + o.sure * 60000;
    if (dr.mod === 'prova') { var p = Soru.oturumBitir(dr.oturum, sz, an); return { mod: 'prova', sureDoldu: doldu, sonuc: p.sonuc, ozet: p.ozet }; }
    var b = Soru.denemeBitir(dr.oturum, skorlar(Soru, dr, sz), an);
    return { mod: 'deneme', sureDoldu: doldu, deneme: b.deneme, toplamSn: b.oturum.toplamSn, analiz: Soru.denemeAnalizi(b.deneme),
      sorular: duz(dr).map(function (x) { var h = dr.cevaplar[x.id] || null; return { id: x.id, t: x.t, h: h, dogru: sz[x.id] ? sz[x.id].dogru : null }; }) };
  }
  function virgul(v, basamak) { var f = Math.pow(10, basamak == null ? 2 : basamak); return String(Math.round(v * f) / f).replace('.', ','); }
  function binlik(v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function sureYaz(sn) { var d = Math.floor(sn / 60), s = sn % 60; return (d < 10 ? '0' : '') + d + ':' + (s < 10 ? '0' : '') + s; }
  function dakikaYaz(sn) { var d = Math.floor(sn / 60), s = sn % 60; return d && s ? d + ' dk ' + s + ' sn' : d ? d + ' dk' : s + ' sn'; }
  // Puan ve sıra tahmini satırları, motorun döndürdüğü gibi: { ad, metin, etiket } ya da { not } (açıklama cümlesi).
  function tahminSatirlari(t) {
    if (!t.ok) return [{ ad: 'Puan ve sıra', metin: 'tahmin yok', etiket: t.etiket }, { not: t.neden + ' Kayıtlı tam TYT denemesi: ' + t.ornek.deger + ' (' + t.ornek.etiket + '). Alan denemeleri ve provalar kısa olduğu için bu sayıya girmez.' }];
    var l = [
      { ad: 'Puan (' + t.tur + ')', metin: virgul(t.puan.deger, 1) + ' · bant ' + virgul(t.puan.alt, 1) + '–' + virgul(t.puan.ust, 1), etiket: t.puan.etiket },
      { ad: 'Sıra', metin: binlik(t.sira.deger) + ' · bant ' + binlik(t.sira.enIyi) + '–' + binlik(t.sira.enKotu), etiket: t.sira.etiket },
      { ad: 'Hedef sıra ' + binlik(t.hedefSira), metin: t.konumAd, etiket: t.etiket },
      { ad: 'Dayandığı tam TYT denemesi', metin: String(t.ornek.deger), etiket: t.ornek.etiket }
    ];
    if (t.obp.etiket === 'veri yok') l.push({ not: 'Diploma notu girilmediği için okul puanı eklenmedi.' });
    if (t.varsayim) l.push({ not: t.varsayim });
    return l;
  }

  var Deneme = { DERS_SORU: DERS_SORU, dersOf: dersOf, sozluk: sozluk, denemeKur: denemeKur, provaHavuzu: provaHavuzu, provaVar: provaVar, provaKur: provaKur,
    duz: duz, cevabi: cevabi, kalan: kalan, git: git, cevapVer: cevapVer, skorlar: skorlar, bitir: bitir, tahminSatirlari: tahminSatirlari, sureYaz: sureYaz };
  Kabuk.Deneme = Deneme;
  if (typeof module !== 'undefined' && module.exports) module.exports = Deneme;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var d = document, Soru = L.Motor && L.Motor.Soru, B = Kabuk.Bilesen;
  var DURUM = 'lifeos.soru.deneme', BITEN = 'lifeos.soru.denemeler', GECMIS = 'lifeos.soru.gecmis';
  var ic = function () { return Kabuk.ic; };
  function oku(a, bos) {
    try { var v = JSON.parse(ic().depo.getItem(a)); if (v && typeof v === 'object' && Array.isArray(v) === Array.isArray(bos)) return v; } catch (e) { /* bozuk kayıt: boş başla */ }
    return bos;
  }
  function yaz(a, v) { ic().depo.setItem(a, JSON.stringify(v)); }
  function tarih(ms) { return new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }); }
  // Süren durumun aşama içeriği (sözlük için): yüklü değilse null; yükleme istenir, gelince sayfa yeniden çizilir.
  function asamaY(alan, asamaId) {
    var I = ic(), y = I.asamaY ? I.asamaY(alan, asamaId) : (I.al(alan) && I.al(alan).y && I.al(alan).y.id === asamaId ? I.al(alan).y : null);
    if (!y && !I.al(alan)) I.alanYukle(alan).then(function () { if (d.querySelector('[data-deneme-sayfa]')) I.rota(); });
    return y;
  }
  function durumOku() { var v = oku(DURUM, {}); return v.mod && v.oturum ? v : null; }

  var son = null, saat = null, duyurulan = {}; // son: biten sınavın sonucu, yalnız hemen ardından gösterilir
  function kirinti() {
    return '<a class="kirinti" href="#/motor/soru"><span aria-hidden="true">‹ </span>Soru</a><span class="kirinti__ayrac" aria-hidden="true">/</span><span>Süreli deneme</span>';
  }
  function sayfa(yer) {
    var I = ic(), k = I.kac, bas = I.ust(kirinti()) + '<div class="govde" data-deneme-sayfa>';
    if (!Soru) return bas + B.baslik({ metin: 'Süreli deneme' }) + B.bos({ baslik: 'Soru aracı yüklenemedi.', metin: 'Sayfayı yenile; sürerse LifeOS sunucusundan aç.' }) + '</div>';
    if (son) { var h = sonucHtml(son); son = null; return bas + h + '</div>'; }
    var dr = durumOku();
    if (dr) {
      var y = asamaY(dr.alan, dr.asama);
      if (!y) return bas + B.baslik({ metin: 'Süreli deneme' }) + (I.al(dr.alan) ? B.bos({ baslik: 'Bu denemenin soruları bu açılışta yüklenemedi.', metin: 'LifeOS sunucusundan aç.' }) : '<p class="soluk" aria-busy="true">Yükleniyor…</p>') + '</div>';
      var sz = sozluk(y), simdi = Date.now();
      if (kalan(Soru, dr, simdi) === 0) { sonlandir(dr, y, simdi); var h2 = sonucHtml(son); son = null; return bas + h2 + '</div>'; }
      saatKur();
      return bas + canliHtml(dr, sz, simdi) + '</div>';
    }
    return bas + baslangicHtml() + '</div>';
  }

  function baslangicHtml() {
    var I = ic(), k = I.kac, id = I.etkin(), f = I.al(id), yer = I.tasinanlar().filter(function (a) { return a.id === id; })[0];
    var h = B.baslik({ metin: 'Süreli deneme' });
    if (!f) { I.alanYukle(id).then(function () { if (d.querySelector('[data-deneme-sayfa]')) I.rota(); }); return h + '<p class="soluk" aria-busy="true">Yükleniyor…</p>'; }
    if (!f.y) return h + B.bos({ baslik: 'Sorular bu açılışta yüklenemedi.', metin: 'Sayfa dosyadan açıldıysa LifeOS sunucusundan aç.' });
    var y = f.y, kayit = I.kayitOku(id), simdi = Date.now(), r = denemeKur(Soru, I.Yol, y, kayit, yer.ad, simdi, Math.random);
    h += '<p class="soluk">' + k(yer.ad) + ' · ' + k(y.veri.ad) + '. Açık ünitelerden süreli bir deneme: her ünite bir test, süre sınav ölçeğinde. ' +
      'Cevaplar bitirene kadar değişebilir; doğrular sonda görünür. Alanı değiştirmek için o alanın sayfasını aç.</p>';
    if (r.ok) {
      var o = r.durum.oturum, n = o.testler.reduce(function (a, t) { return a + t.q; }, 0);
      h += B.liste({ ad: 'Deneme testleri', ogeler: o.testler.map(function (t) { return { ad: t.ad, not: t.q + ' soru' }; }).concat([{ ad: 'Süre', not: o.sure + ' dk', pul: 'hesaplandı' }]) }) +
        B.eylemler([{ metin: n + ' soruluk denemeyi başlat', tur: 'ana', veri: { deneme: 'basla' } }]);
    } else h += B.bos({ baslik: r.neden });
    if (provaVar(y)) {
      h += B.bolum({ baslik: 'Sınav provası', govde: ['<p class="soluk">TYT ya da AYT dağılımında, süreli, cevap anında kilitlenir; sonuç sonda. Açık ünitelerin sorularından kurulur.</p>',
        B.eylemler([].concat.apply([], [['TYT', 20], ['TYT', 40], ['AYT', 20], ['AYT', 40]].map(function (x) {
          var p = provaKur(Soru, I.Yol, y, kayit, x[0], x[1], simdi, Math.random), et = x[0] + ' · ' + x[1] + ' soru';
          return p.ok ? [{ metin: et + ' · ' + p.durum.oturum.sureDk + ' dk', veri: { deneme: 'prova', sinav: x[0], boy: x[1] } }]
            : [{ metin: et, tur: 'sade', kapali: true, etiket: et + ', açık soru yetmiyor' }, { yazi: 'açık soru yetmiyor (' + p.n + ')' }];
        })))] });
    }
    var gecmis = oku(BITEN, []).slice(-5).reverse();
    if (gecmis.length) h += B.bolum({ baslik: 'Son denemeler', govde: B.liste({ ad: 'Son denemeler', ogeler: gecmis.map(function (g) {
      var an = Soru.denemeAnalizi(g.deneme);
      return { ad: g.alanAd + ' · ' + tarih(g.bitti), not: virgul(an.net.deger) + ' net', pul: an.net.etiket };
    }) }) });
    return h;
  }

  function canliHtml(dr, sz, simdi) {
    var k = ic().kac, l = duz(dr), i = Math.min(dr.i || 0, l.length - 1), x = l[i], q = sz[x.id], h = cevabi(dr, i), o = dr.oturum;
    var kal = kalan(Soru, dr, simdi), prova = dr.mod === 'prova', baslik = prova ? o.sinav + ' provası' : o.ad;
    var testAd = prova ? '' : ' · Test ' + (x.t + 1) + '/' + o.testler.length + ' · ' + o.testler[x.t].ad;
    var cevapli = l.filter(function (_, j) { return cevabi(dr, j); }).length;
    return '<div class="deneme__ust"><span class="deneme__baslik">' + k(baslik) + '<span class="soluk">' + k(testAd) + '</span></span>' +
      '<span class="sayac' + (kal <= 60 ? ' sayac--az' : '') + '" role="timer" aria-label="Kalan süre">' + sureYaz(kal) + '</span></div>' +
      '<p class="gizli" aria-live="polite" id="deneme-duyuru"></p>' +
      '<nav class="deneme__no" aria-label="Sorular · ' + cevapli + ' / ' + l.length + ' cevaplandı">' + l.map(function (y, j) {
        return '<button type="button" class="deneme__nobt' + (cevabi(dr, j) ? ' deneme__nobt--cevapli' : '') + '" data-deneme="git" data-i="' + j + '"' + (j === i ? ' aria-current="step"' : '') +
          ' aria-label="Soru ' + (j + 1) + (cevabi(dr, j) ? ', cevaplandı' : '') + '">' + (j + 1) + '</button>';
      }).join('') + '</nav>' +
      (!q ? B.bos({ baslik: 'Bu soru artık içerikte yok; boş sayılır.' })
        : B.soru({ soru: q.soru, ust: 'Soru ' + (i + 1) + ' / ' + l.length + ' · ' + q.konu, secenekler: q.sec, secili: h || null, kilitli: prova && !!h,
          sikVeri: { deneme: 'cevap' }, veri: { 'deneme-soru': x.id }, sonuc: prova && h ? { baslik: 'Cevabın kaydedildi;', metin: 'provada değişmez. Doğrusu sonda görünür.' } : null })) +
      B.eylemler([i > 0 ? { metin: 'Önceki', veri: { deneme: 'git', yon: -1, i: i - 1 } } : null,
        i < l.length - 1 ? { metin: 'Sonraki', tur: 'ana', veri: { deneme: 'git', yon: 1, i: i + 1 } } : null,
        { metin: 'Bitir', tur: i === l.length - 1 ? 'ana' : 'sade', veri: { deneme: 'bitir' } }]) +
      '<p class="soluk">' + (prova ? 'Provada ilk cevap kilitlenir.' : 'Cevabını bitirene kadar değiştirebilirsin.') + ' Süre dolunca deneme kendiliğinden biter; sekmeyi kapatsan da süre akar. Klavye: A–E seçer, ← → gezer.</p>';
  }

  function sonucHtml(s) {
    var k = ic().kac, alanAkademik = s.akademik, h;
    if (s.mod === 'prova') {
      var p = s.ozet.prova, r = s.ozet.sayilar;
      h = B.baslik({ metin: p.sinav + ' provası bitti' }) + B.panel({ tur: 'guclu', durum: true, veri: { sonuc: 'bitti' }, govde: [
        '<p><b>' + virgul(p.net.deger) + ' net</b> <span class="soluk">' + k(p.net.etiket) + '</span></p>',
        '<p>' + r.dogru + ' doğru, ' + r.yanlis + ' yanlış, ' + r.bos + ' boş <span class="soluk">(' + k(s.ozet.etiket) + ')</span> · ' +
        (s.sureDoldu ? 'süre doldu (' + p.sureDk + ' dk)' : 'kullanılan ' + p.kullanilanDk.deger + ' dk / ' + p.sureDk + ' dk') + ' <span class="soluk">(' + k(p.kullanilanDk.etiket) + ')</span></p>'] }) +
        B.bolum({ baslik: 'Derslere göre', govde: B.liste({ ad: 'Derslere göre', ogeler: p.dersler.map(function (x) {
          return { ad: dersAdi(x.ders) + ' · ' + virgul(x.net.deger) + ' net', pul: x.net.etiket, uzun: true, not: x.dogru + ' doğru · ' + x.yanlis + ' yanlış · ' + x.bos + ' boş (' + s.ozet.etiket + ')' };
        }) }) });
    } else {
      var an = s.analiz, top = { d: 0, y: 0 };
      an.testler.forEach(function (t) { top.d += t.dogru.deger; top.y += t.yanlis.deger; });
      h = B.baslik({ metin: 'Deneme bitti' }) + B.panel({ tur: 'guclu', durum: true, veri: { sonuc: 'bitti' }, govde: [
        '<p><b>' + virgul(an.net.deger) + ' net</b> <span class="soluk">' + k(an.net.etiket) + '</span></p>',
        '<p>' + top.d + ' doğru, ' + top.y + ' yanlış <span class="soluk">(ölçüldü)</span> · ' +
        (s.sureDoldu ? 'süre doldu (' + s.deneme.sure + ' dk)' : 'süre ' + dakikaYaz(s.toplamSn) + ' / ' + s.deneme.sure + ' dk') + ' <span class="soluk">(ölçüldü)</span></p>'] }) +
        B.bolum({ baslik: 'Testlere göre', govde: B.liste({ ad: 'Testlere göre', ogeler: an.testler.map(function (t) {
          return { ad: t.ad + ' · ' + virgul(t.net.deger) + ' net', pul: t.net.etiket, uzun: true, not: t.dogru.deger + ' doğru · ' + t.yanlis.deger + ' yanlış (' + t.dogru.etiket + ') · ' +
            (t.bos.deger == null ? 'boş: ' + t.bos.etiket : t.bos.deger + ' boş (' + t.bos.etiket + ')') + ' · ' + (t.dakika.deger == null ? 'süre: ' + t.dakika.etiket : t.dakika.deger + ' dk (' + t.dakika.etiket + ')') };
        }) }) }) +
        B.acilir({ baslik: 'Cevap anahtarı (' + s.sorular.length + ' soru)', govde: '<ol class="deneme__anahtar">' + s.sorular.map(function (x) {
          return '<li>' + (x.h ? 'Cevabın ' + x.h : 'Boş') + ' · doğrusu ' + k(x.dogru || '—') + (x.h ? (x.h === x.dogru ? ' · doğru' : ' · yanlış') : '') + '</li>';
        }).join('') + '</ol>' });
    }
    if (alanAkademik) {
      var ts = tahminSatirlari(Soru.puanTahmini(oku(BITEN, []).map(function (g) { return g.deneme; }), {})), sat = ts.filter(function (x) { return !x.not; });
      h += B.bolum({ baslik: 'Puan ve sıra tahmini', govde: [sat.length ? B.liste({ ad: 'Puan ve sıra tahmini', ogeler: sat.map(function (x) { return { ad: x.ad, not: x.metin, pul: x.etiket, uzun: true }; }) }) : '']
        .concat(ts.filter(function (x) { return x.not; }).map(function (x) { return '<p class="soluk">' + k(x.not) + '</p>'; })) });
    }
    return h + B.eylemler([{ metin: 'Yeni deneme', tur: 'ana', veri: { deneme: 'yeni' } }, { metin: 'Soru', tur: 'sade', href: '#/motor/soru' }]);
  }

  // Bitir ve kaydet: deneme lifeos.soru.denemeler'e (motorun Deneme kaydı), prova lifeos.soru.gecmis'e (karma testle aynı biçim).
  function sonlandir(dr, y, simdi) {
    var I = ic(), yer = I.tasinanlar().filter(function (a) { return a.id === dr.alan; })[0], ad = yer ? yer.ad : dr.alan, b = bitir(Soru, dr, sozluk(y), simdi);
    if (b.mod === 'prova') yaz(GECMIS, oku(GECMIS, []).concat([{ bitti: b.sonuc.bitti, alan: dr.alan, alanAd: ad + ' · ' + b.sonuc.sinav + ' provası', tur: 'prova', sayilar: b.ozet.sayilar, net: b.ozet.prova.net, sonuc: b.sonuc }]).slice(-50));
    else yaz(BITEN, oku(BITEN, []).concat([{ id: 'd' + simdi.toString(36), bitti: simdi, alan: dr.alan, alanAd: ad, asama: dr.asama, sureDoldu: b.sureDoldu, toplamSn: b.toplamSn, deneme: b.deneme }]).slice(-50));
    I.depo.removeItem(DURUM);
    son = Object.assign(b, { akademik: provaVar(y) });
    duyurulan = {};
  }
  function saatKur() {
    clearInterval(saat);
    saat = setInterval(function () {
      var el = d.querySelector('[data-deneme-sayfa] .sayac'), dr = el && durumOku();
      if (!dr) { clearInterval(saat); saat = null; return; }
      var kal = kalan(Soru, dr, Date.now());
      if (kal === 0) { clearInterval(saat); saat = null; ic().rota(); var ks = d.querySelector('[data-sonuc]'); if (ks) ks.focus(); return; } // sayfa çizilirken biter ve kaydolur
      el.textContent = sureYaz(kal);
      el.classList.toggle('sayac--az', kal <= 60);
      [[300, '5 dakika kaldı.'], [60, '1 dakika kaldı.']].forEach(function (e) {
        if (kal <= e[0] && !duyurulan[e[0]]) { duyurulan[e[0]] = true; var du = d.getElementById('deneme-duyuru'); if (du && kal > e[0] - 5) du.textContent = e[1]; }
      });
    }, 1000);
  }
  function odak(secici) { var el = d.querySelector(secici); if (el) el.focus(); }
  function eylem(b) {
    var I = ic(), ne = b.getAttribute('data-deneme'), simdi = Date.now();
    if (ne === 'yeni') return I.rota();
    if (ne === 'basla' || ne === 'prova') {
      var id = I.etkin(), f = I.al(id), yer = I.tasinanlar().filter(function (a) { return a.id === id; })[0];
      if (!f || !f.y) return I.rota();
      var r = ne === 'basla' ? denemeKur(Soru, I.Yol, f.y, I.kayitOku(id), yer.ad, simdi, Math.random)
        : provaKur(Soru, I.Yol, f.y, I.kayitOku(id), b.getAttribute('data-sinav'), +b.getAttribute('data-boy'), simdi, Math.random);
      if (r.ok) { yaz(DURUM, Object.assign({ alan: id }, r.durum)); duyurulan = {}; }
      I.rota(); return odak('[data-deneme-soru]');
    }
    var dr = durumOku(), y = dr && asamaY(dr.alan, dr.asama);
    if (!y) return I.rota();
    var sz = sozluk(y);
    if (ne === 'git') { yaz(DURUM, git(Soru, dr, +b.getAttribute('data-i'), simdi)); I.rota(); return odak('[data-deneme-soru]'); }
    if (ne === 'cevap') {
      var c = cevapVer(Soru, dr, b.getAttribute('data-h'), sz, simdi);
      if (c.ok) yaz(DURUM, c.durum);
      I.rota(); return odak('[data-deneme="cevap"][data-h="' + b.getAttribute('data-h') + '"]');
    }
    if (ne === 'bitir') {
      var bos = duz(dr).filter(function (_, j) { return !cevabi(dr, j); }).length;
      if (kalan(Soru, dr, simdi) > 0 && !confirm(bos ? 'Deneme bitsin mi? Cevaplanmamış ' + bos + ' soru boş sayılır.' : 'Deneme bitsin mi?')) return;
      sonlandir(dr, y, simdi); I.rota(); scrollTo(0, 0); return odak('[data-sonuc]');
    }
  }

  var onceki = Kabuk.ek && Kabuk.ek.soru;
  Kabuk.ek = Kabuk.ek || {};
  Kabuk.ek.soru = function (yer, alt) { return alt === 'deneme' ? sayfa(yer) : onceki(yer, alt); };
  d.addEventListener('click', function (e) { var b = e.target.closest('[data-deneme]'); if (b && !b.disabled) eylem(b); });
  d.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || !d.querySelector('[data-deneme-sayfa] .sayac')) return;
    var km = d.getElementById('komut'), hl = d.getElementById('halka'), t = e.target;
    if ((km && !km.hidden) || (hl && !hl.hidden) || (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var h = e.key.length === 1 ? e.key.toUpperCase() : '', b;
    if (h && HARF.indexOf(h) >= 0) b = d.querySelector('[data-deneme="cevap"][data-h="' + h + '"]:not([disabled])');
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') b = d.querySelector('[data-deneme="git"][data-yon="' + (e.key === 'ArrowRight' ? 1 : -1) + '"]');
    if (b) { e.preventDefault(); b.click(); }
  });
})(typeof window !== 'undefined' ? window : globalThis);
