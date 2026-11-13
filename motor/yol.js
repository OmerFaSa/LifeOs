/* LIFEOS.Motor.Yol — ogrenme yolu motoru. Sifir bagimlilik, saf fonksiyonlar (zaman disaridan gelir).
 * Veri bicimi: alan/SEMA.md. Icerik once `python alan/denetle.py` ile denetlenir; yukle() yalniz ucuz
 * yapisal denetim yapar ve bozuk veride hata firlatir.
 * Kayit (ogrenenin durumu) duz JSON'dur; her yazan fonksiyon yeni kayit dondurur, eskisine dokunmaz:
 *   { dersler: {id: {okundu}}, cevaplar: {id: [{cevap, dogru, zaman}]},
 *     kapilar: {sahipId: [{zaman, dogruSayisi, toplam, oran, esik, gecti, taslak}]}, asamalar: {id: {gecti}},
 *     eski?: {anahtar: {durum, etiket:'eski kayıt', ...}} }  (eski: yalniz gocten; hicbir seyi gecirmez, bkz. GOC)
 *     yerlestirme?: {zaman, sonuc:'atlandi'|'burada', dogruSayisi, toplam, oran, esik, etiket?:'tahmin', uretim?:'bekliyor', olcum?}
 *   («Seviyemi bul», icerik-hatti.md §4.3; atlanan asamada ayrica asamalar[id] = {yerlestirme: zaman}, gecti YOK:
 *   atlanan «ogrenildi» degildir, yalniz sonraki asamayi acar. Ilk olculen unite kapisi gecilince etiket silinir.)
 * Kural (AGENTS 0.1): asama/unite yalniz bilgi olcen kapi esigi tutunca gecer; okumak ve alistirma
 * cozmek (hacim) tek basina hicbir seyi gecirmez. Taslak icerik tekrara girmez.
 */
(function (kok) {
  'use strict';

  var ETIKET = { OLCULDU: 'ölçüldü', TAHMIN: 'tahmin', HESAPLANDI: 'hesaplandı', VERI_YOK: 'veri yok' };

  function hata(m) { throw new Error('Yol: ' + m); }
  function zamanDenetle(z) { if (typeof z !== 'number' || !isFinite(z)) hata('zaman sayı olmalı (ms)'); }
  function kopya(k) { return JSON.parse(JSON.stringify(k)); }
  function onayliMi(o) { return !!o && o.durum === 'onayli'; }
  function etiket(o) { return onayliMi(o) ? 'onayli' : 'taslak'; }

  function bosKayit() { return { dersler: {}, cevaplar: {}, kapilar: {}, asamalar: {} }; }

  // Asama verisini dizinler. Donen nesne salt okunur kabul edilir.
  function yukle(veri) {
    if (!veri || typeof veri !== 'object') hata('aşama verisi yok');
    if (!veri.id || !Array.isArray(veri.uniteler) || !veri.uniteler.length) hata('aşama kimliği ya da ünite listesi eksik');
    var y = { veri: veri, id: veri.id, oge: {}, tur: {}, ust: {} };
    function ekle(o, tur, ust) {
      if (!o || !o.id) hata(tur + ' kimliksiz');
      if (y.oge[o.id]) hata('yinelenen kimlik: ' + o.id);
      y.oge[o.id] = o; y.tur[o.id] = tur; y.ust[o.id] = ust;
    }
    function kapiEkle(k, sahip) {
      if (!k || !Array.isArray(k.sorular) || !k.sorular.length) hata(sahip + ' kapısı soru içermiyor');
      k.sorular.forEach(function (s) {
        if (s.tur !== 'secmeli' || !s.dogru) hata('kapı sorusu puanlanamıyor: ' + s.id);
        ekle(s, 'kapiSorusu', sahip);
      });
    }
    ekle(veri, 'asama', null);
    kapiEkle(veri.kapi, veri.id);
    veri.uniteler.forEach(function (u) {
      ekle(u, 'unite', veri.id);
      kapiEkle(u.kapi, u.id);
      (u.dersler || []).forEach(function (d) {
        ekle(d, 'ders', u.id);
        (d.alistirmalar || []).forEach(function (a) { ekle(a, 'alistirma', d.id); });
      });
    });
    Object.keys(y.oge).forEach(function (id) {
      if (y.tur[id] === 'asama') return; // asama onkosulu baska dosyadaki asamalardir
      (y.oge[id].onKosul || []).forEach(function (x) { if (!y.oge[x]) hata('bilinmeyen önkoşul: ' + id + ' → ' + x); });
    });
    return y;
  }

  function bul(y, id, tur) {
    if (!y.oge[id] || (tur && y.tur[id] !== tur)) hata('bilinmeyen ' + (tur || 'öğe') + ': ' + id);
    return y.oge[id];
  }

  function kapiGectiMi(kayit, id) {
    return (kayit.kapilar[id] || []).some(function (d) { return d.gecti; });
  }

  function asamaGectiMi(y, kayit, id) { return !!(kayit.asamalar[id] && kayit.asamalar[id].gecti != null); }
  // Bu kaydin asamasi yerlestirmeyle atlandi mi (uniteleri «atlandi»; gecildi sayilmaz)
  function atlandiMi(kayit) { return !!(kayit.yerlestirme && kayit.yerlestirme.sonuc === 'atlandi'); }

  // Bir onkosulun karsilanmasi: asama/unite icin kapi, ders icin okuma, alistirma icin dogru cevap.
  // Yerlestirmeyle atlanan asama ve uniteleri onkosul olarak karsilanir (acilir), gecilmis sayilmaz.
  function karsilandi(y, kayit, id) {
    var t = y.tur[id];
    if (t === 'unite') return kapiGectiMi(kayit, id) || atlandiMi(kayit);
    if (t === 'ders') return !!kayit.dersler[id];
    if (t === 'alistirma') return (kayit.cevaplar[id] || []).some(function (c) { return c.dogru === true; });
    // yuklu olmayan asama da kayittan okunur
    return asamaGectiMi(y, kayit, id) || !!(kayit.asamalar[id] && kayit.asamalar[id].yerlestirme != null);
  }

  function hepsi(y, kayit, liste) {
    return (liste || []).every(function (x) { return karsilandi(y, kayit, x); });
  }

  function acikMi(y, kayit, id) {
    var t = y.tur[id], o = bul(y, id);
    if (t === 'asama') return hepsi(y, kayit, o.onKosul);
    if (t === 'unite') return acikMi(y, kayit, y.ust[id]) && hepsi(y, kayit, o.onKosul);
    if (t === 'ders') return acikMi(y, kayit, y.ust[id]) && hepsi(y, kayit, o.onKosul);
    return acikMi(y, kayit, y.ust[id]);
  }

  function uniteGectiMi(y, kayit, id) { bul(y, id, 'unite'); return kapiGectiMi(kayit, id); }

  function dersOku(y, kayit, dersId, zaman) {
    zamanDenetle(zaman);
    bul(y, dersId, 'ders');
    if (!acikMi(y, kayit, dersId)) hata('ders kilitli: ' + dersId);
    var k = kopya(kayit);
    if (!k.dersler[dersId]) k.dersler[dersId] = { okundu: zaman };
    return k;
  }

  // Ders alistirmasi. Kapi sorulari buradan cevaplanmaz (kapiDene). acik alistirma puanlanmaz: dogru null.
  function cevapla(y, kayit, id, cevap, zaman) {
    zamanDenetle(zaman);
    var a = bul(y, id, 'alistirma');
    if (!acikMi(y, kayit, id)) hata('alıştırma kilitli: ' + id);
    var dogru = a.tur === 'secmeli' ? cevap === a.dogru : null;
    var k = kopya(kayit);
    (k.cevaplar[id] = k.cevaplar[id] || []).push({ cevap: cevap, dogru: dogru, zaman: zaman });
    return { kayit: k, dogru: dogru };
  }

  function esikBul(kapi, ayar) {
    var e = ayar && ayar.esik != null ? ayar.esik : kapi.esik;
    if (typeof e !== 'number' || !(e > 0 && e <= 1)) hata('eşik 0 ile 1 arasında olmalı: ' + e);
    return e;
  }

  // Ustalik kapisi. sahipId: unite ya da asama. cevaplar: {soruId: 'A'}; bos birakilan yanlis sayilir.
  // Asama kapisi ancak butun uniteler gecildikten sonra acilir.
  function kapiDene(y, kayit, sahipId, cevaplar, zaman, ayar) {
    zamanDenetle(zaman);
    var t = y.tur[sahipId];
    if (t !== 'unite' && t !== 'asama') hata('kapı sahibi ünite ya da aşama olmalı: ' + sahipId);
    if (!acikMi(y, kayit, sahipId)) hata('kilitli: ' + sahipId);
    if (t === 'asama' && !y.veri.uniteler.every(function (u) { return kapiGectiMi(kayit, u.id); })) {
      hata('aşama kapısı için önce bütün ünitelerin kapısı geçilmeli');
    }
    var kapi = y.oge[sahipId].kapi, esik = esikBul(kapi, ayar);
    cevaplar = cevaplar || {};
    var dogruSayisi = kapi.sorular.filter(function (s) { return cevaplar[s.id] === s.dogru; }).length;
    var toplam = kapi.sorular.length, oran = dogruSayisi / toplam;
    var sonuc = {
      zaman: zaman, dogruSayisi: dogruSayisi, toplam: toplam, oran: oran, esik: esik,
      gecti: oran >= esik - 1e-9, // 3/4 = 0.75 gibi sinirda kayan nokta payi
      taslak: !kapi.sorular.every(onayliMi)
    };
    var k = kopya(kayit);
    (k.kapilar[sahipId] = k.kapilar[sahipId] || []).push(sonuc);
    if (t === 'asama' && sonuc.gecti && !(k.asamalar[sahipId] && k.asamalar[sahipId].gecti != null)) {
      k.asamalar[sahipId] = Object.assign({}, k.asamalar[sahipId], { gecti: zaman }); // yerlestirme izi kalir
    }
    if (t === 'unite' && sonuc.gecti) k = tahminSil(k, zaman); // ilk olculen unite kapisi yerlestirme tahminini siler
    return { kayit: k, sonuc: sonuc };
  }

  // Kapida yanlis ya da bos birakilan sorular: Tekrar karti adayi. Kimlik sorunun kimligidir (tekillestirme
  // cagiranda: ayni kimlikte kart varsa eklenmez). icerik taslaksa Tekrar motoru karti planlamaz (AGENTS 0.1).
  // Dogru cevap burada da donmez; karti kuran cagiran icerikten okur ve yalniz Tekrar'da gosterir.
  function kapiTekrarAdaylari(y, sahipId, cevaplar) {
    var t = y.tur[sahipId];
    if (t !== 'unite' && t !== 'asama') hata('kapı sahibi ünite ya da aşama olmalı: ' + sahipId);
    cevaplar = cevaplar || {};
    return y.oge[sahipId].kapi.sorular.filter(function (s) { return cevaplar[s.id] !== s.dogru; }).map(function (s) {
      return { id: s.id, kapi: sahipId, unite: t === 'unite' ? sahipId : null, asama: y.id, icerik: etiket(s) };
    });
  }

  /* ---- Yerlestirme («Seviyemi bul», icerik-hatti.md §4.3) ----
   * Her asamanin unite kapi sorularindan asama basina 5-8 soru, kolaydan zora (unite sirasi, unite icinde `seviye`).
   * Asamalar sirayla sorulur; esigin (2/3) altina dusulen ilk asamada durulur. Gecilen asamalarin uniteleri
   * «atlandi» olur (ogrenildi degil), sayi etiketi tahmin; bunlar tekrar adayi cikarmaz ama acik kalir. */
  var YER = { ESIK: 2 / 3, EN_AZ: 5, EN_COK: 8 };
  var SEVIYE = { temel: 0, kolay: 0, orta: 1, ileri: 2, zor: 2 };
  function seviyeSira(s) { return s.seviye in SEVIYE ? SEVIYE[s.seviye] : 1; }

  function yerlestirmeSorulari(y) {
    var us = y.veri.uniteler, hedef = Math.min(YER.EN_COK, Math.max(YER.EN_AZ, 2 * us.length));
    // ünite hedeften çoksa eşit aralıklı seçilir (Akademik: 30 üniteden 8'i), sırası korunur
    var secili = us.length <= hedef ? us : Array.apply(null, Array(hedef)).map(function (_, i) { return us[Math.round(i * (us.length - 1) / (hedef - 1))]; });
    var listeler = secili.map(function (u) {
      return u.kapi.sorular.map(function (s, i) { return { s: s, i: i }; })
        .sort(function (a, b) { return seviyeSira(a.s) - seviyeSira(b.s) || a.i - b.i; }).map(function (x) { return x.s; });
    });
    var sec = [];
    for (var tur = 0; sec.length < hedef && listeler.some(function (l) { return l.length > tur; }); tur++) {
      listeler.forEach(function (l, j) { if (sec.length < hedef && l[tur]) sec.push({ s: l[tur], u: j, tur: tur }); });
    }
    // ünitelerden 5'ten az soru çıkarsa aşama kapısından tamamlanır (en zor sayılır, sona)
    y.veri.kapi.sorular.forEach(function (s, i) { if (sec.length < YER.EN_AZ) sec.push({ s: s, u: secili.length, tur: i }); });
    return sec.sort(function (a, b) { return a.u - b.u || a.tur - b.tur; }).map(function (x) { return x.s.id; });
  }

  function yerlestirmeDegerlendir(y, cevaplar) {
    cevaplar = cevaplar || {};
    var ids = yerlestirmeSorulari(y), dogruSayisi = ids.filter(function (id) { return cevaplar[id] === y.oge[id].dogru; }).length;
    var oran = dogruSayisi / ids.length;
    return { asama: y.id, dogruSayisi: dogruSayisi, toplam: ids.length, oran: oran, esik: YER.ESIK, gecti: oran >= YER.ESIK - 1e-9,
      taslak: !ids.every(function (id) { return onayliMi(y.oge[id]); }) };
  }

  function bosMu(k) {
    return !k.yerlestirme && ['dersler', 'cevaplar', 'kapilar', 'asamalar', 'eski'].every(function (a) { return !k[a] || !Object.keys(k[a]).length; });
  }
  // ys: alanin asamalari sirayla (yukle ciktilari); kayitlar: ayni sirayla asama kayitlari (hepsi bos olmali);
  // cevaplar: asama basina {soruId: harf}. Ilk kalinan asamada durur, sonraki cevaplar yok sayilir.
  // ayar.uretim: beceri alani (dil, muzik): soru yetmez, atlanan asamaya «uretim gorevi bekliyor» yazilir.
  // Doner: { kayitlar, sonuclar, seviye (baslanacak asama sirasi; hepsi gecildiyse asama sayisi + 1) }
  function yerlestir(ys, kayitlar, cevaplar, zaman, ayar) {
    zamanDenetle(zaman);
    if (!ys || !ys.length || !kayitlar || kayitlar.length !== ys.length) hata('yerleştirme için aşamalar ve kayıtları eşit sayıda verilmeli');
    if (!kayitlar.every(bosMu)) hata('yerleştirme yalnız hiç kaydı olmayan alanda yapılır');
    var out = kayitlar.map(kopya), sonuclar = [];
    for (var i = 0; i < ys.length && i < (cevaplar || []).length; i++) {
      var s = yerlestirmeDegerlendir(ys[i], cevaplar[i]);
      sonuclar.push(s);
      out[i].yerlestirme = { zaman: zaman, sonuc: s.gecti ? 'atlandi' : 'burada', dogruSayisi: s.dogruSayisi, toplam: s.toplam, oran: s.oran, esik: s.esik, etiket: ETIKET.TAHMIN };
      if (s.gecti && ayar && ayar.uretim) out[i].yerlestirme.uretim = 'bekliyor';
      if (!s.gecti) break;
      out[i].asamalar[ys[i].id] = { yerlestirme: zaman };
    }
    var son = sonuclar[sonuclar.length - 1];
    return { kayitlar: out, sonuclar: sonuclar, seviye: !son ? 1 : son.gecti ? sonuclar.length + 1 : sonuclar.length };
  }

  // Yerlestirme tahmini silinir (ilk olculen unite kapisi gecilince). Degisecek bir sey yoksa ayni kayit doner.
  function tahminSil(kayit, zaman) {
    if (!kayit.yerlestirme || !kayit.yerlestirme.etiket) return kayit;
    var k = kopya(kayit);
    delete k.yerlestirme.etiket;
    k.yerlestirme.olcum = zaman;
    return k;
  }

  // Tekrar kartina donusebilecek ogeler: onayli ders icindeki onayli, puanlanan ve en az bir kez
  // cevaplanmis alistirmalar. Taslak hicbir zaman; kapi sorulari olcum icin saklanir, girmez.
  function tekrarAdaylari(y, kayit) {
    var out = [];
    Object.keys(y.oge).forEach(function (id) {
      if (y.tur[id] !== 'alistirma') return;
      var a = y.oge[id], ders = y.oge[y.ust[id]];
      if (a.tur !== 'secmeli' || !onayliMi(a) || !onayliMi(ders) || !(kayit.cevaplar[id] || []).length) return;
      if (atlandiMi(kayit) && !kapiGectiMi(kayit, y.ust[ders.id])) return; // yerlestirmeyle atlanan unite tekrara girmez
      out.push({ id: id, ders: ders.id, unite: y.ust[ders.id], icerik: 'onayli' }); // icerik: Tekrar kartinin alani
    });
    return out;
  }

  function sayi(deger, etk, ek) {
    var o = { deger: deger, etiket: etk };
    for (var x in ek || {}) o[x] = ek[x];
    return o;
  }

  function kapiOzeti(kayit, id) {
    var d = kayit.kapilar[id] || [];
    if (!d.length) return { gecti: false, deneme: 0, son: sayi(null, ETIKET.VERI_YOK) };
    var son = d[d.length - 1];
    return {
      gecti: d.some(function (x) { return x.gecti; }), deneme: d.length,
      son: sayi(son.oran, ETIKET.OLCULDU, { dogruSayisi: son.dogruSayisi, toplam: son.toplam, esik: son.esik }),
      taslak: d.some(function (x) { return x.gecti && x.taslak; })
    };
  }

  // Butun durum: neyin acik oldugu, neyin gecildigi ve etiketli ilerleme sayilari.
  function durum(y, kayit) {
    var dersSay = 0, okunan = 0, cevapli = 0, dogru = 0, gecilen = 0, atlanan = 0, atla = atlandiMi(kayit), yer = kayit.yerlestirme;
    var uniteler = y.veri.uniteler.map(function (u) {
      var kp = kapiOzeti(kayit, u.id);
      if (kp.gecti) gecilen++; else if (atla) atlanan++;
      return {
        id: u.id, ad: u.ad, acik: acikMi(y, kayit, u.id), gecti: kp.gecti, atlandi: atla && !kp.gecti, kapi: kp,
        dersler: u.dersler.map(function (d) {
          dersSay++;
          if (kayit.dersler[d.id]) okunan++;
          d.alistirmalar.forEach(function (a) {
            if (a.tur !== 'secmeli' || !(kayit.cevaplar[a.id] || []).length) return;
            var c = kayit.cevaplar[a.id];
            cevapli++;
            if (c[c.length - 1].dogru) dogru++;
          });
          return { id: d.id, ad: d.ad, acik: acikMi(y, kayit, d.id), okundu: !!kayit.dersler[d.id], etiket: etiket(d) };
        })
      };
    });
    var ak = kapiOzeti(kayit, y.id), adim = y.veri.uniteler.length + 1, gectiA = asamaGectiMi(y, kayit, y.id);
    var ilerleme = {
        okunanDers: sayi(okunan, ETIKET.OLCULDU, { toplam: dersSay }),
        gecilenUnite: sayi(gecilen, ETIKET.HESAPLANDI, { toplam: y.veri.uniteler.length }),
        // asama ilerlemesi yalniz gecilen kapilardan hesaplanir; okuma ve alistirma sayilmaz
        asama: sayi((gecilen + (asamaGectiMi(y, kayit, y.id) ? 1 : 0)) / adim, ETIKET.HESAPLANDI),
        alistirmaDogruluk: cevapli ? sayi(dogru / cevapli, ETIKET.HESAPLANDI, { cevapli: cevapli })
                                   : sayi(null, ETIKET.VERI_YOK)
    };
    // atlanan unite sayisi ayri satirdir; gecilen uniteye ve asama ilerlemesine girmez
    if (atla) ilerleme.atlananUnite = sayi(atlanan, yer.etiket || ETIKET.HESAPLANDI, { toplam: y.veri.uniteler.length });
    return {
      asama: { id: y.id, ad: y.veri.ad, acik: acikMi(y, kayit, y.id), gecti: gectiA, atlandi: atla && !gectiA, kapi: ak,
        yerlestirme: yer ? { sonuc: yer.sonuc, etiket: yer.etiket || null, uretim: yer.uretim || null, dogruSayisi: yer.dogruSayisi, toplam: yer.toplam, esik: yer.esik } : null },
      uniteler: uniteler,
      ilerleme: ilerleme
    };
  }

  /* ---- Goc: AYS konu durumu → Yol ilerlemesi (Akademik alan) ----
   * Girdi: AYS topics/<ders> = { subjectId, states: { [konu]: { state, okunduAt, ornek, first, firstAt,
   * second, secondAt, note } } } (AYS core/state.js 454-481, core/ogren.js 228-253, core/ogrenyolu.js 132).
   * y: Yol.yukle(alan/akademik/asama-1.json). Konu → ders eslemesi asamanin kaynaklarindan okunur
   * (donustur.js: anlatim dersinin ilk kaynagi «R.KONU_ANLATIM['<konu>']»). Anlatim dersinin alistirmalari
   * AYS'nin taban sorulariyla ayni sirada (184 konunun 184'u, olculdu 2026-11-13), derin sorular sona eklenir.
   * Cikti: { kayit: { dersler, cevaplar, kapilar:{}, asamalar:{}, eski }, red:[{konu, neden}], say:{neden:n} }.
   * kayit.eski['ays:<ders>/<konu>'] = { konu, ders, dersId, durum, etiket:'eski kayıt', kaynak }: durum AYS
   * degeridir, zamansizdir ve hicbir kapiyi gecirmez (AGENTS 0.1). first/second → Tekrar, note → Not. */
  var AYS_DURUM = ['not_started', 'learning', 'practicing', 'provisional', 'closed', 'reopened'];
  var AYS_ALAN = ['state', 'okunduAt', 'ornek', 'first', 'firstAt', 'second', 'secondAt', 'note'];
  var GOC = {
    aysKonu: function (belge, y) {
      var r = { kayit: { dersler: {}, cevaplar: {}, kapilar: {}, asamalar: {}, eski: {} }, red: [], say: {} };
      function red(konu, neden) { r.red.push({ konu: konu, neden: neden }); }
      function say(n) { r.say[n] = (r.say[n] || 0) + 1; }
      if (!belge || typeof belge !== 'object' || !belge.states || typeof belge.states !== 'object') { red(null, 'konu belgesi ya da states yok'); return r; }
      if (!belge.subjectId) { red(null, 'ders kimliği (subjectId) yok: konular eşlenemez'); return r; }
      var dersOf = {};
      if (y) {
        var kb = {};
        (y.veri.kaynaklar || []).forEach(function (k) { var m = /^R\.KONU_ANLATIM\['([^']+)'\]$/.exec(k.bolum || ''); if (m) kb[k.id] = m[1]; });
        y.veri.uniteler.forEach(function (u) { u.dersler.forEach(function (d) { var k = kb[(d.kaynak || [])[0]]; if (k && !dersOf[k]) dersOf[k] = d; }); });
      }
      var ders = String(belge.subjectId);
      Object.keys(belge.states).sort().forEach(function (konu) {
        var st = belge.states[konu];
        if (!st || typeof st !== 'object' || Array.isArray(st)) { red(konu, 'konu durumu nesne değil'); return; }
        Object.keys(st).forEach(function (a) { if (AYS_ALAN.indexOf(a) < 0) say('bilinmeyen konu alanı «' + a + '»: göremedim'); });
        var d = dersOf[konu] || null, tasindi = false, ornek = st.ornek || {};
        var durum = st.state == null || st.state === 'not_started' ? null : st.state;
        if (durum != null && AYS_DURUM.indexOf(durum) < 0) { red(konu, 'bilinmeyen durum: göremedim'); durum = null; }
        if (typeof ornek !== 'object' || Array.isArray(ornek)) { red(konu, 'örnek cevaplar (ornek) nesne değil'); ornek = {}; }
        var veriVar = st.okunduAt || Object.keys(ornek).length;
        if (veriVar && !d) red(konu, y ? 'Yol içeriğinde konunun dersi yok: okuma ve cevaplar taşınamadı' : 'aşama verilmedi: okuma ve cevaplar taşınamadı');
        if (st.okunduAt && d) {
          var z = Date.parse(st.okunduAt);
          if (isNaN(z)) red(konu, 'okuma zamanı (okunduAt) okunamadı'); // tarih uydurulmaz
          else { r.kayit.dersler[d.id] = { okundu: z }; tasindi = true; }
        }
        if (d) Object.keys(ornek).sort(function (a, b) { return a - b; }).forEach(function (i) {
          var c = ornek[i], a = /^\d+$/.test(i) ? d.alistirmalar[+i] : undefined, z = c && Date.parse(c.at);
          if (!/^\d+$/.test(i)) { red(konu, 'örnek cevap anahtarı sıra değil: göremedim'); return; }
          if (!a) { say('derin soru cevabı: Yol\'da kapı sorusu, tek cevap kapı denemesi sayılmaz'); return; }
          if (!c || typeof c !== 'object' || isNaN(z)) { red(konu, 'örnek cevap bozuk ya da zamanı yok'); return; }
          if (!c.bak && (typeof c.h !== 'string' || (c.h === a.dogru) !== (c.d === true))) { red(konu, 'cevap anahtarı tutmuyor (soru yenilenmiş olabilir)'); return; }
          var o = { cevap: c.bak ? null : c.h, dogru: c.bak ? false : c.d === true, zaman: z };
          if (c.bak) o.bakildi = true;  // AYS: çözüme bakıldı, yanlış sayılır
          if (c.ip) o.ipucu = true;
          if (typeof c.sure === 'number') o.sure = c.sure;
          r.kayit.cevaplar[a.id] = [o]; tasindi = true;
        });
        if (durum || tasindi) {
          r.kayit.eski['ays:' + ders + '/' + konu] = { konu: konu, ders: ders, dersId: d ? d.id : null, durum: durum,
            etiket: 'eski kayıt', kaynak: 'ays:topics/' + ders + '#' + konu };
        }
      });
      return r;
    }
  };
  var EKSIK = Object.freeze({
    aysKonu: [
      'ilk ve ikinci ölçüm (first, firstAt, second, secondAt): kapanış ölçümü → Tekrar.GOC.aysKapanis; Yol taşımaz',
      'konu notu (note) → Not.goc.aysKonu; Yol taşımaz',
      'durumun değiştiği an: göremedim (konu durumunda yok); durum zamansız, «eski kayıt» etiketiyle',
      'kapalı (closed) konu kapı geçmiş sayılmaz (AGENTS 0.1 ustalık kapısı): ünite kapısı yeniden ölçülür',
      'derin soru cevabı (ornek sırası anlatım alıştırmalarından büyük): Yol\'da kapı sorusu; taşınmaz',
      'yenilenen sorunun önceki cevabı: Yol içeriğinde yenilenme tarihi yok, yalnız harf tutarlılığı denetlenir'
    ]
  });

  var Yol = {
    ETIKET: ETIKET, yukle: yukle, bosKayit: bosKayit, acikMi: acikMi, uniteGectiMi: uniteGectiMi,
    asamaGectiMi: function (y, kayit) { return asamaGectiMi(y, kayit, y.id); },
    dersOku: dersOku, cevapla: cevapla, kapiDene: kapiDene, tekrarAdaylari: tekrarAdaylari, kapiTekrarAdaylari: kapiTekrarAdaylari,
    YER: YER, yerlestirmeSorulari: yerlestirmeSorulari, yerlestirmeDegerlendir: yerlestirmeDegerlendir, yerlestir: yerlestir, tahminSil: tahminSil, bosMu: bosMu,
    durum: durum, etiket: etiket, GOC: GOC, EKSIK: EKSIK
  };

  kok.LIFEOS = kok.LIFEOS || {};
  kok.LIFEOS.Motor = kok.LIFEOS.Motor || {};
  kok.LIFEOS.Motor.Yol = Yol;
  if (typeof module !== 'undefined' && module.exports) module.exports = Yol;
})(typeof window !== 'undefined' ? window : globalThis);
