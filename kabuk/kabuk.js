/* LIFEOS.Kabuk — tam ekran çerçeve, gezinme (basılı tut halkası + komut çubuğu), sayfalar.
 * Kabuk içerik bilmez: yerler harita.js'ten, ayarlar ayar.js'ten gelir. Sıfır bağımlılık, derleme yok.
 * Saf kısım (katla, puan, ara, komutOgeleri) Node'da test edilir; DOM kısmı yalnız tarayıcıda başlar. */
(function (kok) {
  'use strict';

  /* ---------------- saf: Türkçe katlama ve komut sıralaması ---------------- */
  var KATLA = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };
  function katla(s) {
    return String(s == null ? '' : s).toLocaleLowerCase('tr').replace(/̇/g, '')
      .replace(/[çğıöşüâîû]/g, function (c) { return KATLA[c]; }).replace(/\s+/g, ' ').trim();
  }
  // tek parça için puan: tam ad 100, ad başı 80, kelime başı 60, ad içinde 40, açıklamada 20, yok 0
  function parcaPuani(p, ad, ek) {
    if (ad === p) return 100;
    if (ad.indexOf(p) === 0) return 80;
    if (ad.split(' ').some(function (k) { return k.indexOf(p) === 0; })) return 60;
    if (ad.indexOf(p) >= 0) return 40;
    if (ek.indexOf(p) >= 0) return 20;
    return 0;
  }
  function puan(sorgu, oge) {
    var q = katla(sorgu);
    if (!q) return 1;
    var ad = katla(oge.ad), ek = katla(oge.ek), parcalar = q.split(' ');
    var top = 0;
    for (var i = 0; i < parcalar.length; i++) {
      var p = parcaPuani(parcalar[i], ad, ek);
      if (!p) return 0;
      top += p;
    }
    return top / parcalar.length + (q === ad ? 1 : 0);
  }
  var TUR_SIRA = { yer: 0, ayar: 1, eylem: 2 };
  function ara(sorgu, ogeler, en) {
    return ogeler.map(function (o) { return { o: o, p: puan(sorgu, o) }; })
      .filter(function (x) { return x.p > 0; })
      .sort(function (a, b) {
        return b.p - a.p || TUR_SIRA[a.o.tur] - TUR_SIRA[b.o.tur] || a.o.ad.length - b.o.ad.length || a.o.ad.localeCompare(b.o.ad, 'tr');
      })
      .slice(0, en || 8).map(function (x) { return x.o; });
  }
  var KATMAN_AD = { kabuk: 'sayfa', alan: 'alan', motor: 'araç', king: 'King' };
  // komut çubuğunun bütün öğeleri haritadan ve şemadan türetilir; elle liste yok
  function komutOgeleri(H, A) {
    var dalAd = {}; H.DALLAR.forEach(function (d) { dalAd[d.id] = d.ad; });
    var grupAd = {}; A.GRUPLAR.forEach(function (g) { grupAd[g.id] = g.ad; });
    var yerler = H.YERLER.map(function (y) {
      return { tur: 'yer', id: y.id, ad: y.ad, etiket: KATMAN_AD[y.katman], yol: y.yol, ek: [y.aciklama, dalAd[y.dal], KATMAN_AD[y.katman]].join(' ') };
    });
    var ayarlar = A.SEMA.map(function (t) {
      return { tur: 'ayar', id: t.anahtar, ad: t.ad, etiket: 'ayar', yol: '#/ayarlar?' + t.anahtar,
        ek: [t.aciklama, grupAd[t.grup], 'ayar'].concat(t.secenekler ? Object.keys(t.secenekler).map(function (k) { return t.secenekler[k]; }) : []).join(' ') };
    });
    var eylemler = [
      { tur: 'eylem', id: 'tema-koyu', ad: 'Koyu temaya geç', etiket: 'eylem', eylem: ['lifeos.tema.secim', 'dark'], ek: 'tema karanlık gece renk' },
      { tur: 'eylem', id: 'tema-acik', ad: 'Açık temaya geç', etiket: 'eylem', eylem: ['lifeos.tema.secim', 'light'], ek: 'tema aydınlık gündüz renk' },
      { tur: 'eylem', id: 'tema-sistem', ad: 'Tema cihaza uysun', etiket: 'eylem', eylem: ['lifeos.tema.secim', 'system'], ek: 'tema otomatik renk' },
      { tur: 'eylem', id: 'halka', ad: 'Yerler halkasını aç', etiket: 'eylem', eylem: 'halka', ek: 'gezinme menü git' },
      { tur: 'eylem', id: 'yeni-not', ad: 'Yeni not', etiket: 'eylem', yol: '#/motor/not/yeni', ek: 'not yaz defter' }
    ];
    return yerler.concat(ayarlar, eylemler);
  }

  function selam(t, ad) {
    var s = t.getHours(), soz = s < 5 ? 'İyi geceler' : s < 12 ? 'Günaydın' : s < 18 ? 'İyi günler' : 'İyi akşamlar';
    ad = String(ad || '').trim();
    return soz + (ad ? ' ' + ad : '') + '.';
  }
  // Yol durumundan (motor/yol.js durum()) sıradaki adım: geçilmemiş ilk açık ünitede okunmamış ilk ders,
  // dersler bittiyse o ünitenin kapısı; bütün üniteler geçildiyse aşama kapısı; o da geçildiyse null.
  // Okumak hiçbir şeyi geçirmez (AGENTS 0.1): ünite ancak kapısıyla biter.
  function siradaki(dr) {
    for (var i = 0; i < dr.uniteler.length; i++) {
      var u = dr.uniteler[i];
      if (u.gecti) continue;
      if (!u.acik) return null;
      for (var j = 0; j < u.dersler.length; j++) if (u.dersler[j].acik && !u.dersler[j].okundu) return { tur: 'ders', id: u.dersler[j].id, ad: u.dersler[j].ad };
      return { tur: 'kapi', id: u.id, ad: u.ad };
    }
    return dr.asama.gecti ? null : { tur: 'kapi', id: dr.asama.id, ad: dr.asama.ad };
  }
  var HARF = 'ABCDEFGH';

  /* ---------------- saf: aşamalar (alan/<id>/asama-N.json, N = 1, 2, …) ---------------- */
  // Kayıt aşama başına ayrı. Birinci aşamanın anahtarı eski anahtarın kendisidir: eski kayıt olduğu gibi okunur.
  function kayitAnahtari(alan, n) { return 'lifeos.yol.' + alan + '.' + n; }
  // Yüklenen aşama verisi Yol'a girer; kimliği <alan>.<n> değilse ya da bozuksa gösterilmez (null).
  // N ≥ 2'de önceki aşama önkoşulda yoksa eklenir: aşama ancak öncekinin ustalık kapısı geçilince açılır (AGENTS §0.1); kuralı Yol uygular.
  function asamaHazirla(Yol, alan, n, veri) {
    if (!veri || veri.id !== alan + '.' + n) return null;
    var onceki = alan + '.' + (n - 1), ok = veri.onKosul || [];
    try { return Yol.yukle(n > 1 && ok.indexOf(onceki) < 0 ? Object.assign({}, veri, { onKosul: ok.concat([onceki]) }) : veri); } catch (e) { return null; }
  }
  // Sırayla gelen aşama verilerinden yüklenebilenler; ilk eksik ya da bozuk aşamada durur (sonrası zaten açılamaz).
  function asamalariKur(Yol, alan, veriler) {
    var ys = [];
    for (var i = 0; i < veriler.length; i++) { var y = asamaHazirla(Yol, alan, i + 1, veriler[i]); if (!y) break; ys.push(y); }
    return ys;
  }
  // Aşama n'nin kaydı (bozuksa boş). Öteki aşamaların «geçildi» bilgisi salt okunur eklenir ki Yol aşama önkoşulunu görsün.
  function asamaKaydi(depo, Yol, alan, n, sayi) {
    var k = null;
    try { k = JSON.parse(depo.getItem(kayitAnahtari(alan, n))); } catch (e) { /* bozuk kayıt: boş başla */ }
    if (!(k && k.dersler && k.cevaplar && k.kapilar && k.asamalar)) k = Yol.bosKayit();
    for (var m = 1; m <= sayi; m++) {
      var id = alan + '.' + m, o = null;
      if (m === n || k.asamalar[id]) continue;
      try { o = JSON.parse(depo.getItem(kayitAnahtari(alan, m))); } catch (e) { /* yok */ }
      if (o && o.asamalar && o.asamalar[id]) k.asamalar[id] = o.asamalar[id];
    }
    return k;
  }
  // Yazarken öteki aşamaların eklenmiş bilgisi çıkar (kendi kaydında durur); geri kalan her alan aynen yazılır.
  function asamaYaz(depo, alan, n, k) {
    var y = Object.assign({}, k, { asamalar: {} });
    Object.keys(k.asamalar).forEach(function (id) { if (!/^[a-z]+\.\d+$/.test(id) || id.indexOf(alan + '.') !== 0 || id === alan + '.' + n) y.asamalar[id] = k.asamalar[id]; });
    depo.setItem(kayitAnahtari(alan, n), JSON.stringify(y));
  }
  // Aşama listesi [{ n, id, ad, acik, gecti }]; açıklık ve geçiş Yol'un kuralı. kayit(n): o aşamanın kaydı.
  function asamaListesi(Yol, ys, kayit) {
    return ys.map(function (y, j) { var k = kayit(j + 1); return { n: j + 1, id: y.id, ad: y.veri.ad, acik: Yol.acikMi(y, k, y.id), gecti: Yol.asamaGectiMi(y, k) }; });
  }
  // Üzerinde çalışılan aşama: açık olanların sonuncusu (hiçbiri açık değilse birinci).
  function calisilanAsama(liste) { var a = liste.filter(function (x) { return x.acik; }); return a.length ? a[a.length - 1].n : 1; }
  // Alanda hiç kayıt yok mu: «Seviyemi bul» yalnız o zaman önerilir (kural Yol.bosMu).
  function alanYeniMi(Yol, depo, alan, sayi) {
    for (var n = 1; n <= sayi; n++) if (!Yol.bosMu(asamaKaydi(depo, Yol, alan, n, sayi))) return false;
    return true;
  }
  // «Seviyemi bul» sonucu: Yol.yerlestir ölçülen aşamaların kaydını verir, burada yazılır. Kayıt boş değilse Yol hata fırlatır, hiçbir şey yazılmaz.
  function yerlestirYaz(Yol, depo, alan, ys, cevaplar, zaman, uretim) {
    var r = Yol.yerlestir(ys, ys.map(function (_, j) { return asamaKaydi(depo, Yol, alan, j + 1, ys.length); }), cevaplar, zaman, uretim ? { uretim: true } : undefined);
    r.sonuclar.forEach(function (_, j) { asamaYaz(depo, alan, j + 1, r.kayitlar[j]); });
    return r;
  }
  // İlk ölçülen ünite kapısı geçilince alanın bütün aşamalarındaki yerleştirme tahmini silinir (icerik-hatti §4.3/4).
  function tahminSilHepsi(Yol, depo, alan, sayi, zaman) {
    for (var n = 1; n <= sayi; n++) { var k = asamaKaydi(depo, Yol, alan, n, sayi), s = Yol.tahminSil(k, zaman); if (s !== k) asamaYaz(depo, alan, n, s); }
  }

  var Kabuk = kok.LIFEOS && kok.LIFEOS.Kabuk || {};
  Kabuk.katla = katla; Kabuk.puan = puan; Kabuk.ara = ara; Kabuk.komutOgeleri = komutOgeleri; Kabuk.selam = selam; Kabuk.siradaki = siradaki;
  Kabuk.Asama = { kayitAnahtari: kayitAnahtari, hazirla: asamaHazirla, kur: asamalariKur, kayit: asamaKaydi, yaz: asamaYaz, liste: asamaListesi, calisilan: calisilanAsama,
    yeniMi: alanYeniMi, yerlestir: yerlestirYaz, tahminSil: tahminSilHepsi };
  kok.LIFEOS = kok.LIFEOS || {}; kok.LIFEOS.Kabuk = Kabuk;
  if (typeof module !== 'undefined' && module.exports) module.exports = Kabuk;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var H = Kabuk.Harita, A = Kabuk.Ayar, d = document, kokEl = d.documentElement;
  var bellek = {};
  var yerel = (function () {
    try { var t = '__k'; localStorage.setItem(t, t); localStorage.removeItem(t); return localStorage; } catch (e) {
      return { getItem: function (k) { return k in bellek ? bellek[k] : null; }, setItem: function (k, v) { bellek[k] = String(v); }, removeItem: function (k) { delete bellek[k]; } };
    }
  })();
  // kayıtlar IndexedDB'de (depo.js: kayıt/ayar ayrımı orada), ayarlar yerel depoda; sayfa kayıtlar belleğe yüklenince çizilir
  var depo = Kabuk.Depo, hazir = depo.ac(yerel), B = Kabuk.Bilesen; // B: ekranlar yalnız bileşen kataloğundan (kabuk/bilesen.js) kurulur
  var $ = function (s, k) { return (k || d).querySelector(s); };
  function kac(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function uygula() {
    var n = A.kokNitelikleri(depo);
    if (A.oku(depo, 'lifeos.tema.oto') === 'acik') { var s = new Date().getHours(); n['data-theme'] = (s >= 19 || s < 7) ? 'dark' : 'light'; }
    Object.keys(n).forEach(function (k) { if (n[k] == null) kokEl.removeAttribute(k); else kokEl.setAttribute(k, n[k]); });
  }

  var GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  var AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function tarih(t) { return GUN[t.getDay()] + ' · ' + t.getDate() + ' ' + AY[t.getMonth()]; }
  // ad Hesap oturumundan (hitap, yoksa görünen ad); Hesap yüklü değilse ya da oturum yoksa adsız selam
  function hesapAdi() {
    try { var o = kok.LIFEOS.HESAP.durum().oturum; return o ? (o.hitap || o.gorunen_ad || '') : ''; } catch (e) { return ''; }
  }
  var DURUM_AD = { eski: 'eski sayfada', pilot: 'taşınıyor', plan: 'hazırlanıyor', yeni: '' };

  /* ---- Felsefe: Yol motoru salt okunur yüklenir; içerik dosyası file:// üzerinden okunamazsa yuva boş kalır ---- */
  var alanlar = {}; // alan kimliği → { ys: [aşama 1, 2, … (Yol.yukle çıktısı)] } ya da { hata }
  var Yol = kok.LIFEOS.Motor && kok.LIFEOS.Motor.Yol;
  function tasinan(id) { var y = H.bul(id); return y && y.katman === 'alan' && y.asama ? y : null; }
  // etkinAlan alan: üzerinde çalışılan (son açılan) alan; Bugün sayfası onunla karşılar
  var etkinAlan = tasinan(depo.getItem('lifeos.yol.son')) ? depo.getItem('lifeos.yol.son') : 'felsefe';
  function etkinYap(id) { if (id !== etkinAlan) { etkinAlan = id; depo.setItem('lifeos.yol.son', id); } }
  // seçili aşama (alan → n): aşama sayfası, ders ya da kapı açılınca o aşama; yoksa açık olanların sonuncusu
  var seciliAsama = {};
  function asamaSayisi(id) { var a = alanlar[id]; return a && a.ys ? a.ys.length : 1; }
  function asamaListe(id) { return Kabuk.Asama.liste(Yol, alanlar[id].ys, function (n) { return kayitOku(id, n); }); }
  function asamaNo(id) {
    id = id || etkinAlan;
    var a = alanlar[id];
    if (!a || !a.ys) return 1;
    return seciliAsama[id] >= 1 && seciliAsama[id] <= a.ys.length ? seciliAsama[id] : Kabuk.Asama.calisilan(asamaListe(id));
  }
  // seçili aşamanın içeriği: { y, n } ya da { hata }; yüklenmediyse undefined
  function al(id) { var a = alanlar[id || etkinAlan]; return !a || a.hata ? a : { y: a.ys[asamaNo(id) - 1], n: asamaNo(id) }; }
  // shortcut: öğrenme kaydı bu tarayıcının deposunda durur, cihazlar arası eşitlenmez; tek depoya (sistem/veri.py) P6 göçünden sonra bağlanır
  function kayitOku(id, n) { id = id || etkinAlan; return Kabuk.Asama.kayit(depo, Yol, id, n || asamaNo(id), asamaSayisi(id)); }
  function kayitYaz(k) { Kabuk.Asama.yaz(depo, etkinAlan, asamaNo(), k); }
  function fDurum(id) { var a = al(id); return a && a.y ? Yol.durum(a.y, kayitOku(id)) : null; }
  function eskiYol(e) { return location.protocol === 'file:' ? e : '/' + e.split('/')[1].toLowerCase() + '/'; } // tek kapıda modül /ays/ /esp/ /spi/ yolunda
  function F() { return '#/alan/' + etkinAlan; }
  function adimYolu(a) { return F() + '/' + a.tur + '/' + a.id; }
  var bekleyen = {}; // aynı içerik iki kez istenmesin
  // Haritadaki `asama` sayısı kadar aşama istenir; dosyası olmayan ya da bozuk aşama (ve sonrası) gösterilmez.
  function alanYukle(id) {
    if (alanlar[id]) return Promise.resolve(alanlar[id]);
    if (bekleyen[id]) return bekleyen[id];
    if (!Yol) return Promise.resolve(alanlar[id] = { hata: 'motor' });
    if (location.protocol === 'file:') return Promise.resolve(alanlar[id] = { hata: 'icerik' }); // tarayıcı file:// fetch'ini engeller
    var istek = [];
    for (var n = 1; n <= ((H.bul(id) || {}).asama || 1); n++) {
      istek.push(fetch('../alan/' + id + '/asama-' + n + '.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(function () { return null; }));
    }
    return (bekleyen[id] = Promise.all(istek).then(function (vs) {
      var ys = Kabuk.Asama.kur(Yol, id, vs);
      return (alanlar[id] = ys.length ? { ys: ys } : { hata: 'icerik' });
    }));
  }
  function asamaYolu(n) { return F() + '/asama/' + n; }
  // «Seviyemi bul»: beceri alanında soru yetmez, üretim görevi de ister (icerik-hatti §4.3/5)
  var BECERI = { dil: 1, muzik: 1 }, yerCevap = {}, yerSonuc = null; // yerCevap: alan → aşama başına cevaplar (yalnız akış boyunca bellekte)
  function alanYeni(id) { return Kabuk.Asama.yeniMi(Yol, depo, id, asamaSayisi(id)); }

  /* ---------------- sayfalar ---------------- */
  function ust(sol) {
    return '<header class="ust"><div class="ust__sol">' + sol + '</div><div class="ust__sag">' +
      B.dugme({ metin: 'Ara', tur: 'sade', veri: { ac: 'komut' }, kisayol: 'Control+K /', tus: 'Ctrl K' }) +
      B.dugme({ metin: 'Yerler', tur: 'sade', veri: { ac: 'halka' }, kisayol: 'Control+.' }) + '</div></header>';
  }
  function kirinti(yer) {
    var ustYer = H.bul(H.DAL_SAYFASI[yer.dal]);
    if (!ustYer || ustYer.id === yer.id) ustYer = H.bul('bugun');
    return '<a class="kirinti" href="' + ustYer.yol + '"><span aria-hidden="true">‹ </span>' + kac(ustYer.ad) + '</a><span class="kirinti__ayrac" aria-hidden="true">/</span><span>' + kac(yer.ad) + '</span>';
  }
  // yerin taşınma durumu rozeti (yeni yerde yok; «taşınıyor» altın)
  function durumPul(y) { var a = DURUM_AD[y.durum]; return a ? { metin: a, tur: y.durum === 'pilot' ? 'altin' : 'normal' } : null; }

  function sayfaBugun() {
    var t = new Date(), ipucu = depo.getItem('lifeos.kabuk.ipucu') !== 'goruldu';
    var f = fDurum(), a = f && siradaki(f);
    return ust('<span class="ust__tarih">' + tarih(t) + '</span>') +
      '<div class="karsila"><h1 class="karsila__selam">' + kac(selam(t, hesapAdi())) + '</h1>' +
      '<p class="karsila__sira"><span class="soluk">Sırada</span><br>' + kac(H.bul(etkinAlan).ad) + ' · ' + (f ? kac(f.asama.ad) : 'ilk aşama') + '</p>' +
      (a ? '<p class="soluk">' + (a.tur === 'ders' ? 'Ders: ' : 'Kapı: ') + kac(a.ad) + '</p>' : '') +
      B.dugme({ metin: f && f.ilerleme.okunanDers.deger ? 'Devam et' : 'Başla', tur: 'ana', href: a ? adimYolu(a) : F() }) +
      '<p class="karsila__sonra soluk">' + (Kabuk.bugunEk ? Kabuk.bugunEk() : '') + '</p>' +
      // depo «bellek» kipinde (faz2-indexeddb.md, taşıma kuralı 4) bu oturumun yazdıkları yenilemede kalmaz
      (depo.kip() === 'bellek' ? B.uyari({ tur: 'dikkat', metin: 'Kayıtlarına bu açılışta ulaşılamadı. Önceki kayıtların silinmedi, ama bu oturumda yaptıkların sayfa yenilenince kaybolur.' }) : '') +
      (Kabuk.baslangicDavet ? Kabuk.baslangicDavet() : '') + // araclar.js: eski sistemdeki kayıtları getirme teklifi (göçten sonra)
      (Kabuk.tanismaDavet ? Kabuk.tanismaDavet() : '') + // tanisma.js: kayıt yoksa tek satırlık davet
      (ipucu ? B.uyari({ tur: 'bilgi', metin: 'Bir yere gitmek için boş bir yerde basılı tut ya da Ctrl K ile ara.', eylem: { metin: 'Anladım', tur: 'sade', veri: { ac: 'ipucu' } } }) : '') + '</div>';
  }
  function sayfaDal(yer) {
    var ys = H.dalinYerleri(yer.dal);
    return ust(kirinti(yer)) + '<div class="govde">' + B.baslik({ metin: yer.ad, alt: yer.aciklama }) +
      (ys.length ? B.liste({ ad: yer.ad, ogeler: ys.map(function (y) { return { ad: y.ad, not: y.aciklama, pul: durumPul(y), href: y.yol }; }) }) : '') + '</div>';
  }
  function sayfaHarita(yer) {
    var dallar = H.DALLAR.map(function (dl) {
      var ys = H.YERLER.filter(function (y) { return y.dal === dl.id; });
      // katman yazıyla da söylenir (eskiden yalnız sol çizginin rengiydi)
      return B.panel({ baslik: dl.ad + ' · ' + ys.length, govde: ys.length ? B.liste({ ad: dl.ad, ogeler: ys.map(function (y) {
        return { ad: y.ad, not: KATMAN_AD[y.katman] + (y.halka ? ' · halkada' : ''), pul: durumPul(y), href: y.yol };
      }) }) : '' });
    }).join('');
    return ust(kirinti(yer)) + '<div class="govde govde--genis">' + B.baslik({ metin: 'Sistem haritası', alt: H.YERLER.length + ' yer; her biri halkadan ya da aramadan en çok iki adımda.' }) +
      '<div class="harita">' + dallar + '</div></div>';
  }
  function sayfaAyarlar(yer, odak) {
    var gruplar = A.GRUPLAR.map(function (g) {
      return B.bolum({ baslik: g.ad, id: 'grup-' + g.id, govde: A.SEMA.filter(function (t) { return t.grup === g.id; }).map(function (t) { return A.ciz(t, A.oku(depo, t.anahtar)); }) });
    }).join('');
    var nav = '<nav class="ayarnav" aria-label="Ayar grupları">' + A.GRUPLAR.map(function (g) { return '<a href="#/ayarlar?grup-' + g.id + '">' + kac(g.ad) + '</a>'; }).join('') + '</nav>';
    setTimeout(function () {
      if (!odak) return;
      var el = d.getElementById(odak) || $('[data-ayar-satir="' + odak + '"]');
      if (el) { el.scrollIntoView({ block: 'center' }); var f = $('[aria-checked="true"], input', el) || el; f.focus(); el.classList.add('ayar--isik'); }
    }, 0);
    return ust(kirinti(yer)) + '<div class="govde govde--genis">' + B.baslik({ metin: 'Ayarlar' }) + '<div class="ayarlar">' + nav + '<div class="ayarlar__govde">' + gruplar +
      B.eylemler([{ metin: 'Hepsini varsayılana döndür', tur: 'sade', veri: { ac: 'sifirla' } }]) + '</div></div></div>';
  }
  function yuzde(x) { return Math.round(x * 100); }
  var GECILDI = { metin: 'geçildi', tur: 'altin' };
  // kapı satırı (liste öğesi): açıksa bağlantı ve son denemesi, kilitliyse rozet
  function kapiSatiri(id, ad, acik, kp) {
    var son = kp.deneme ? kp.son.dogruSayisi + '/' + kp.son.toplam + ' doğru · eşik %' + yuzde(kp.son.esik) + (kp.gecti ? ' · geçildi' : ' · geçilmedi') : 'denenmedi';
    return acik ? { ad: ad, not: son, pul: kp.gecti ? GECILDI : null, href: F() + '/kapi/' + id } : { ad: ad, durum: 'kilitli' };
  }
  // Aşama listesi (iki ya da daha çok aşama varsa): açık olan bağlantıdır, kilitli olan nedenini söyler.
  function asamalarHtml(n) {
    var l = asamaListe(etkinAlan);
    if (l.length < 2) return '';
    return B.bolum({ baslik: 'Aşamalar', id: 'asamalar-baslik', govde: B.liste({ ad: 'Aşamalar', ogeler: l.map(function (x) {
      var da = Yol.durum(alanlar[etkinAlan].ys[x.n - 1], kayitOku(etkinAlan, x.n)).asama, ad = 'Aşama ' + x.n + ' · ' + x.ad;
      var not = x.gecti ? 'geçildi' : da.atlandi ? 'atlandı' + (da.yerlestirme.etiket ? ' · ' + da.yerlestirme.etiket : '') : x.acik ? 'açık' : 'önce Aşama ' + (x.n - 1) + ' kapısı';
      return x.acik ? { ad: ad, not: not + (x.n === n ? ' · şu an burada' : ''), pul: x.gecti ? GECILDI : null, href: asamaYolu(x.n), durum: x.n === n ? 'secili' : 'acik' }
        : { ad: ad, not: not, durum: 'kilitli' };
    }) }) });
  }
  function asamaBasligi(ust, ad) { return B.baslik({ metin: ust + ' · ' + ad, duzey: 2, id: 'asama-ad' }); }
  function ilerle(ad, x) { return x && x.toplam ? B.ilerleme({ ad: ad, deger: x.deger, toplam: x.toplam }) : ''; }
  var KILITLI_ASAMA = 'Bu aşama kilitli: önce önceki aşamanın kapısını geç.';
  function sayfaAlan(yer) {
    var f = al(), dr = fDurum(), ic, a = dr && siradaki(dr), sonraki = null, yeni = false;
    if (!f) ic = '<p class="soluk" aria-busy="true">Yükleniyor…</p>';
    else if (f.hata) ic = B.bos({ baslik: 'Yol haritası bu açılışta gösterilemiyor.', metin: f.hata === 'motor' ? 'Yol aracı yüklenemedi.' : 'Sayfa dosyadan açıldı; içerik LifeOS sunucusuyla açılınca yüklenir.' });
    else if (!dr.asama.acik) ic = asamalarHtml(f.n) + asamaBasligi('Aşama ' + f.n, dr.asama.ad) + B.bos({ baslik: KILITLI_ASAMA });
    else {
      var il = dr.ilerleme, hepsiAcik = dr.uniteler.length <= 4, simdiki = a && (a.tur === 'kapi' ? a.id : f.y.ust[a.id]), yer_ = dr.asama.yerlestirme;
      if (dr.asama.gecti) sonraki = asamaListe(etkinAlan).filter(function (x) { return x.n === f.n + 1 && x.acik; })[0] || null;
      yeni = a && alanYeni(etkinAlan);
      ic = (yeni ? B.panel({ baslik: 'Nereden başlayalım?', id: 'yer-baslik', govde: ['<p>Konuyu biliyorsan «Seviyemi bul»: aşama başına 5–8 soru, bildiğin aşamalar atlanır.</p>',
          B.eylemler([{ metin: 'Baştan başla', tur: 'ana', href: adimYolu(a) }, { metin: 'Seviyemi bul', href: F() + '/yer/1' }])] }) : '') +
        asamalarHtml(f.n) + asamaBasligi('Aşama ' + f.n, dr.asama.ad) + ilerle('Okunan ders', il.okunanDers) + ilerle('Geçilen ünite kapısı', il.gecilenUnite) +
        (il.atlananUnite ? '<p class="soluk">' + il.atlananUnite.deger + ' ünite atlandı (' + il.atlananUnite.etiket + ')</p>' : '') +
        (yer_ && yer_.uretim === 'bekliyor' ? B.uyari({ tur: 'dikkat', metin: 'Yerleştirme tahmini; üretim görevi bekliyor.' }) : '') +
        dr.uniteler.map(function (u) {
          var okunan = u.dersler.filter(function (x) { return x.okundu; }).length;
          // kalabalık alanda (Akademik: 30 ünite) yalnız üzerinde çalışılan ünite açık gelir
          return B.acilir({ baslik: u.ad, acik: hepsiAcik || u.id === simdiki,
            not: u.gecti ? 'geçildi' : u.atlandi ? 'atlandı' + (yer_.etiket ? ' (' + yer_.etiket + ')' : '') + ' · ' + okunan + '/' + u.dersler.length + ' ders' : u.acik ? okunan + '/' + u.dersler.length + ' ders' : 'kilitli',
            govde: [u.dersler.length ? B.liste({ ad: u.ad + ' dersleri', tur: 'ders', ogeler: u.dersler.map(function (x) {
              var oz = (f.y.oge[x.id] || {}).ozet;
              return x.acik ? { baslik: x.ad, ozet: oz, durum: x.okundu ? 'okundu' : 'yeni', taslak: x.etiket === 'taslak', href: F() + '/ders/' + x.id } : { baslik: x.ad, ozet: oz, durum: 'kilitli' };
            }) }) : '', B.liste({ ad: u.ad + ' kapısı', ogeler: [kapiSatiri(u.id, 'Ünite kapısı', u.acik, u.kapi)] })] });
        }).join('') +
        B.bolum({ baslik: 'Aşama kapısı', govde: B.liste({ ad: 'Aşama kapısı', ogeler: [kapiSatiri(dr.asama.id, 'Aşama kapısı', dr.uniteler.every(function (u) { return u.gecti; }), dr.asama.kapi)] }) });
    }
    var bitti = !yeni && !a && dr && dr.asama.gecti;
    return ust(kirinti(yer)) + '<div class="govde">' + B.baslik({ metin: yer.ad }) + ic + (bitti ? B.uyari({ tur: 'tamam', metin: 'Aşama tamamlandı.' }) : '') +
      B.eylemler([!yeni && a ? { metin: dr.ilerleme.okunanDers.deger ? 'Devam et' : 'Başla', tur: 'ana', href: adimYolu(a) } : null,
        bitti && sonraki ? { metin: 'Sonraki aşama', tur: 'ana', href: asamaYolu(sonraki.n) } : null,
        yer.eski ? { metin: 'Eski ' + yer.ad + ' sayfası', tur: 'sade', href: eskiYol(yer.eski) } : null]) + '</div>';
  }
  function altKirinti(ad) {
    return '<a class="kirinti" href="' + F() + '"><span aria-hidden="true">‹ </span>' + kac(H.bul(etkinAlan).ad) + '</a><span class="kirinti__ayrac" aria-hidden="true">/</span><span>' + kac(ad) + '</span>';
  }
  function yok(metin) {
    return ust(altKirinti('Bulunamadı')) + '<div class="govde">' + B.bos({ baslik: metin, eylem: { metin: H.bul(etkinAlan).ad + ' sayfasına dön', tur: 'ana', href: F() } }) + '</div>';
  }
  function kaynaklar(y, idler) {
    var ad = {}; (y.veri.kaynaklar || []).forEach(function (k) { ad[k.id] = k; });
    var l = (idler || []).filter(function (i) { return ad[i]; });
    // künye kısaltılmasın diye düz liste (satır taşı tek satıra keser)
    return l.length ? B.acilir({ baslik: 'Kaynaklar (' + l.length + ')', govde: '<ul>' + l.map(function (i) {
      return '<li>' + kac(ad[i].ad) + (ad[i].dogrulama === 'dogrulanmamis' ? ' <span class="soluk">· doğrulanmamış</span>' : '') + '</li>';
    }).join('') + '</ul>' }) : '';
  }
  function soruHtml(a, kayit) {
    var c = kayit.cevaplar[a.id], son = c && c[c.length - 1];
    if (a.tur !== 'secmeli') {
      return B.soru({ soru: a.soru, veri: { soru: a.id }, govde: [B.alan({ ad: 'Cevabın', isim: 'cevap-' + a.id.replace(/[^\w-]/g, '-'), tur: 'cok', deger: son ? son.cevap : '' }),
        B.eylemler([{ metin: 'Kaydet', veri: { ac: 'acik-kaydet' } }, { yazi: 'Puanlanmaz; kendin değerlendirirsin.' }])],
        sonuc: son ? { baslik: 'Kaydedildi.', maddeler: a.olcut, not: a.dogru ? 'Örnek cevap: ' + a.dogru : '' } : null });
    }
    return B.soru({ soru: a.soru, veri: { soru: a.id }, secenekler: a.sec, secili: son ? son.cevap : null, dogru: son ? a.dogru : null,
      sonuc: son ? { baslik: son.dogru ? 'Doğru.' : 'Yanlış.', metin: a.cozum ? a.cozum.join(' ') : '' } : null });
  }
  function sayfaDers(id) {
    if (!al()) return ust(altKirinti('Ders')) + '<div class="govde"><p class="soluk" aria-busy="true">Yükleniyor…</p></div>';
    var y = al().y, x = y && y.tur[id] === 'ders' && y.oge[id];
    if (!x) return yok(al().hata ? 'Ders içeriği bu açılışta yüklenemedi.' : 'Böyle bir ders yok.');
    var kayit = kayitOku();
    if (!Yol.acikMi(y, kayit, id)) return yok(Yol.acikMi(y, kayit, y.id) ? 'Bu ders kilitli: önce önceki dersi oku ya da ünite kapısını geç.' : KILITLI_ASAMA);
    var okundu = !!kayit.dersler[id];
    return ust(altKirinti(x.ad)) + '<article class="govde ders">' + B.baslik({ metin: x.ad }) +
      (Yol.etiket(x) === 'taslak' ? B.uyari({ tur: 'dikkat', metin: 'Taslak: bu ders henüz onaylanmadı; tekrara girmez.' }) : '') +
      '<p class="ders__ozet">' + kac(x.ozet) + '</p>' + (x.metin || []).map(function (m) { return '<p>' + kac(m) + '</p>'; }).join('') +
      (x.not ? B.uyari({ tur: 'bilgi', metin: 'Kaynak notu: ' + x.not }) : '') + kaynaklar(y, x.kaynak) +
      B.bolum({ baslik: 'Alıştırmalar', govde: x.alistirmalar.map(function (a) { return soruHtml(a, kayit); }) }) +
      B.eylemler([{ metin: okundu ? 'Sıradaki' : 'Okudum, sıradaki', tur: 'ana', veri: { ac: 'okudum', ders: id } }, { metin: 'Yol haritası', tur: 'sade', href: F() }]) + '</article>';
  }
  var kapiSonuc = null; // son denemenin sonucu, yalnız hemen ardından gösterilir
  function sayfaKapi(id) {
    if (!al()) return ust(altKirinti('Kapı')) + '<div class="govde"><p class="soluk" aria-busy="true">Yükleniyor…</p></div>';
    var y = al().y, t = y && y.tur[id], o = y && (t === 'unite' || t === 'asama') && y.oge[id];
    if (!o) return yok(al().hata ? 'Kapı bu açılışta yüklenemedi.' : 'Böyle bir kapı yok.');
    var kayit = kayitOku(), dr = Yol.durum(y, kayit), ad = t === 'asama' ? 'Aşama kapısı' : o.ad + ' · kapı';
    if (!dr.asama.acik) return yok(KILITLI_ASAMA);
    if (!Yol.acikMi(y, kayit, id) || (t === 'asama' && !dr.uniteler.every(function (u) { return u.gecti; }))) {
      return yok(t === 'asama' ? 'Aşama kapısı, bütün ünite kapıları geçilince açılır.' : 'Bu ünite kilitli: önce önceki ünitenin kapısını geç.');
    }
    var s = kapiSonuc && kapiSonuc.id === id ? kapiSonuc.sonuc : null, tekrarda = s ? kapiSonuc.tekrar : 0, a = siradaki(dr), n = al().n;
    kapiSonuc = null;
    // aşama kapısı geçilince sıradaki adım bir sonraki aşamadadır (varsa; Yol onu bu geçişle açar)
    var ileri = s && s.gecti ? (a ? adimYolu(a) : t === 'asama' && asamaSayisi(etkinAlan) > n ? asamaYolu(n + 1) : null) : null;
    var sonuc = s ? B.panel({ tur: s.gecti ? 'basari' : 'guclu', durum: true, veri: { sonuc: s.gecti ? 'gecti' : 'kaldi' }, govde: [
      '<p><b>' + (s.gecti ? 'Geçtin.' : 'Bu kez olmadı.') + '</b> ' + s.dogruSayisi + '/' + s.toplam + ' doğru (%' + yuzde(s.oran) + '), eşik %' + yuzde(s.esik) + '. <span class="soluk">ölçüldü' + (s.taslak ? ' · sorular taslak' : '') + '</span></p>',
      // doğru cevap kapıda gösterilmez; yanlışlar Tekrar'a düşer, cevap orada açılınca görünür
      tekrarda ? '<p>' + tekrarda + ' soru Tekrar\'a düştü; doğru cevabı orada görürsün.</p>' : '',
      B.eylemler([ileri ? { metin: a ? 'Sıradaki' : 'Sonraki aşama', tur: 'ana', href: ileri } : null, tekrarda ? { metin: 'Tekrar\'a git', href: '#/motor/tekrar' } : null, { metin: 'Yol haritası', tur: 'sade', href: F() }])] }) : '';
    return ust(altKirinti(ad)) + '<div class="govde">' + B.baslik({ metin: ad }) + sonuc +
      '<p class="soluk">' + o.kapi.sorular.length + ' soru. Geçmek için en az %' + yuzde(o.kapi.esik) + ' doğru gerekir; boş bırakılan yanlış sayılır. Doğru cevaplar gösterilmez.</p>' +
      '<form class="kapi" data-kapi="' + id + '">' + kapiSorulari(o.kapi.sorular) + B.eylemler([{ metin: 'Bitir', tur: 'ana', tip: 'submit' }]) + '</form></div>';
  }
  function kapiSorulari(sorular) {
    return sorular.map(function (q) { return B.soru({ kip: 'radyo', isim: q.id, soru: q.soru, secenekler: q.sec }); }).join('');
  }
  // «Seviyemi bul» (icerik-hatti §4.3): alt «1», «2»… aşama sırası, «sonuc» son ekran. Kural Yol'da; burada çizim ve kayıt.
  function sayfaYerlestir(alt) {
    var ad = 'Seviyemi bul', f = al();
    if (!f) return ust(altKirinti(ad)) + '<div class="govde"><p class="soluk" aria-busy="true">Yükleniyor…</p></div>';
    if (f.hata) return yok('İçerik bu açılışta yüklenemedi.');
    var ys = alanlar[etkinAlan].ys;
    if (alt === 'sonuc') {
      var r = yerSonuc && yerSonuc.alan === etkinAlan ? yerSonuc.r : null;
      if (!r) return yok('Gösterilecek yerleştirme sonucu yok.');
      var hepsi = r.seviye > ys.length, a = siradaki(fDurum()), uretim = BECERI[etkinAlan] && r.sonuclar.some(function (x) { return x.gecti; });
      return ust(altKirinti(ad)) + '<div class="govde">' + B.baslik({ metin: ad }) +
        B.panel({ tur: r.seviye > 1 ? 'basari' : 'guclu', durum: true, veri: { sonuc: r.seviye > 1 ? 'gecti' : 'kaldi' }, govde: '<p><b>' +
          (hepsi ? 'Bütün aşamalar atlandı; son aşamada devam.' : r.seviye > 1 ? 'Başlangıç: Aşama ' + r.seviye + '.' : 'Baştan başlıyorsun.') + '</b> <span class="soluk">tahmin</span></p>' }) +
        B.liste({ ad: 'Yerleştirme sonucu', ogeler: r.sonuclar.map(function (s, j) {
          return { ad: 'Aşama ' + (j + 1) + ' · ' + ys[j].veri.ad, not: s.dogruSayisi + '/' + s.toplam + ' doğru', pul: { metin: s.gecti ? 'atlandı' : 'buradan', tur: s.gecti ? 'altin' : 'normal' } };
        }) }) +
        (r.sonuclar.some(function (x) { return x.gecti; }) ? '<p class="soluk">Atlanan üniteler «öğrenildi» sayılmaz ve tekrar listesine girmez; istersen açıp çalışırsın. İlk ünite kapısını geçince tahmin silinir.</p>' : '') +
        (uretim ? B.uyari({ tur: 'dikkat', metin: 'Yerleştirme tahmini; üretim görevi bekliyor. Beceri alanında soru yetmez: atlanan aşamada yazma ya da çalma görevi de gerekir. Bu görev henüz yok.' }) : '') +
        B.eylemler([a ? { metin: 'Başla', tur: 'ana', href: adimYolu(a) } : null, { metin: 'Yol haritası', tur: 'sade', href: F() }]) + '</div>';
    }
    if (!alanYeni(etkinAlan)) return yok('Seviye yalnız hiç başlanmamış alanda bulunur; bu alanda kaydın var.');
    var n = Math.max(1, Math.min(+alt || 1, (yerCevap[etkinAlan] || []).length + 1, ys.length)), y = ys[n - 1], ids = Yol.yerlestirmeSorulari(y);
    return ust(altKirinti(ad)) + '<div class="govde">' + B.baslik({ metin: ad }) + asamaBasligi('Aşama ' + n + ' / ' + ys.length, y.veri.ad) +
      '<p class="soluk">' + ids.length + ' soru, kolaydan zora. Üçte ikisi doğruysa bu aşama atlanır' + (n < ys.length ? ' ve sonrakine geçersin' : '') +
      '; değilse buradan başlarsın. Boş bırakılan yanlış sayılır. Doğru cevaplar gösterilmez.</p>' +
      '<form class="kapi" data-yer="' + n + '">' + kapiSorulari(ids.map(function (id) { return y.oge[id]; })) +
      B.eylemler([{ metin: n < ys.length ? 'Devam' : 'Bitir', tur: 'ana', tip: 'submit' }, { metin: 'Vazgeç', tur: 'sade', href: F() }]) + '</form></div>';
  }
  function sayfaYer(yer) {
    var metin = yer.durum === 'eski' ? 'Bu alan henüz yeni sisteme taşınmadı. Şimdilik eski sayfasında çalışıyor.'
      : yer.durum === 'plan' ? 'Bu bölüm hazırlanıyor.' : 'Bu bölümün sayfası sonraki adımda bağlanır.';
    return ust(kirinti(yer)) + '<div class="govde">' + B.baslik({ metin: yer.ad, alt: yer.aciklama }) + '<p>' + metin + '</p>' +
      B.eylemler([yer.eski ? { metin: 'Eski sayfada aç', tur: 'ana', href: eskiYol(yer.eski) } : null]) + '</div>';
  }

  var sayfaEl;
  function rota() {
    // «#/alan/tarih/ders/x», «#/motor/not/yeni»: ilk üç parça yerin yolu, kalanı o sayfanın alt yolu
    var h = location.hash || '#/bugun', parca = h.split('?'), alt = /^(#\/(?:alan|motor)\/[a-z-]+)\/([\w./-]+)$/.exec(parca[0]), taban = alt ? alt[1] : parca[0];
    var yer = H.YERLER.filter(function (y) { return y.yol === taban; })[0] || H.bul('bugun');
    var html, tasindi = yer.katman === 'alan' && yer.asama, fa = alt && tasindi && /^(ders|kapi|asama|yer)\/([\w.-]+)$/.exec(alt[2]), ek = Kabuk.ek && Kabuk.ek[yer.id];
    if (tasindi) { etkinYap(yer.id); if (!al()) alanYukle(yer.id).then(function () { if (sayfaEl.getAttribute('data-yer') === yer.id) rota(); }); }
    // aşama: «asama/2» ya da ders/kapı kimliğinin ikinci parçası (felsefe.2.1.3 → 2)
    if (fa) { var an = +(fa[1] === 'asama' ? fa[2] : fa[2].split('.')[1]); if (an >= 1) seciliAsama[yer.id] = an; }
    if (fa && fa[1] === 'asama') html = sayfaAlan(yer);
    else if (fa && fa[1] === 'yer') html = sayfaYerlestir(fa[2]);
    else if (fa) html = fa[1] === 'ders' ? sayfaDers(fa[2]) : sayfaKapi(fa[2]);
    else if (ek) html = ek(yer, alt ? alt[2] : '');
    else if (yer.id === 'bugun') html = sayfaBugun();
    else if (yer.id === 'harita') html = sayfaHarita(yer);
    else if (yer.id === 'ayarlar') html = sayfaAyarlar(yer, parca[1] && decodeURIComponent(parca[1]));
    else if (tasindi) html = sayfaAlan(yer);
    else if (H.DAL_SAYFASI[yer.dal] === yer.id && yer.dal !== 'king') html = sayfaDal(yer);
    else html = sayfaYer(yer);
    sayfaEl.innerHTML = html;
    sayfaEl.setAttribute('data-yer', yer.id);
    d.title = yer.ad + ' · LifeOS';
    return yer;
  }
  function git(yol) { if (location.hash === yol) rota(); else location.hash = yol; }

  /* ---------------- halka ---------------- */
  var halkaEl, perdeEl, komutEl, oncekiOdak = null, secili = -1, basili = null;
  function halkaKur() {
    var ys = H.halka();
    halkaEl.innerHTML = '<span class="halka__merkez" aria-hidden="true"></span>' + ys.map(function (y, i) {
      var a = -90 + i * 360 / ys.length;
      return '<button type="button" role="menuitem" class="halka__oge" data-yol="' + y.yol + '" style="--a:' + a + 'deg">' + kac(y.ad) + '</button>';
    }).join('');
  }
  function halkaAc(x, y) {
    oncekiOdak = d.activeElement;
    var w = innerWidth, hh = innerHeight, r = Math.max(84, Math.min(150, Math.min(w, hh) / 2 - 64));
    x = x == null ? w / 2 : Math.min(Math.max(x, r + 56), w - r - 56);
    y = y == null ? hh / 2 : Math.min(Math.max(y, r + 40), hh - r - 40);
    halkaEl.style.setProperty('--x', x + 'px'); halkaEl.style.setProperty('--y', y + 'px'); halkaEl.style.setProperty('--r', r + 'px');
    perdeEl.hidden = false; halkaEl.hidden = false; secili = -1;
    try { getSelection().removeAllRanges(); } catch (e) { /* yok */ }
    requestAnimationFrame(function () { halkaEl.classList.add('acik'); perdeEl.classList.add('acik'); });
  }
  function halkaKapat(odakDon) {
    if (halkaEl.hidden) return;
    halkaEl.classList.remove('acik'); perdeEl.classList.remove('acik'); halkaEl.hidden = true; perdeEl.hidden = true;
    halkaSec(-1);
    if (odakDon !== false && oncekiOdak && oncekiOdak.focus) oncekiOdak.focus();
  }
  function halkaOgeleri() { return [].slice.call(halkaEl.querySelectorAll('.halka__oge')); }
  function halkaSec(i) { secili = i; halkaOgeleri().forEach(function (b, j) { b.classList.toggle('secili', j === i); }); }

  // basılı tut: boş yerde, kıpırdamadan; sürükleyip bırakınca seçer
  var ETKILESIMLI = 'a,button,input,select,textarea,label,summary,[contenteditable],[role="dialog"],.halka';
  function basBasla(e) {
    if (e.button !== 0 || !halkaEl.hidden || !komutEl.hidden || e.target.closest(ETKILESIMLI)) return;
    var sx = e.clientX, sy = e.clientY;
    basili = { x: sx, y: sy, acildi: false, zaman: setTimeout(function () { basili.acildi = true; halkaAc(sx, sy); }, e.pointerType === 'mouse' ? 380 : 480) };
  }
  function basHareket(e) {
    if (!basili) return;
    if (!basili.acildi) { if (Math.abs(e.clientX - basili.x) + Math.abs(e.clientY - basili.y) > 10) { clearTimeout(basili.zaman); basili = null; } return; }
    var cx = parseFloat(halkaEl.style.getPropertyValue('--x')), cy = parseFloat(halkaEl.style.getPropertyValue('--y'));
    var dx = e.clientX - cx, dy = e.clientY - cy, n = halkaOgeleri().length;
    if (Math.hypot(dx, dy) < 32) return halkaSec(-1);
    // açı 0 = tepe (ilk öğe), saat yönünde; her öğe kendi diliminin ortasında
    var aci = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360 + 180 / n) % 360;
    halkaSec(Math.floor(aci / (360 / n)));
  }
  function basBitir() {
    if (!basili) return;
    clearTimeout(basili.zaman);
    var acildi = basili.acildi; basili = null;
    if (acildi && secili >= 0) { var yol = halkaOgeleri()[secili].getAttribute('data-yol'); halkaKapat(false); git(yol); }
    else if (acildi) { var b = halkaOgeleri()[0]; if (b) b.focus(); }
  }

  /* ---------------- komut çubuğu ---------------- */
  var ogeler = [], sonuc = [], etkin = 0;
  function komutAc() {
    if (!halkaEl.hidden) halkaKapat(false);
    oncekiOdak = d.activeElement;
    komutEl.hidden = false; perdeEl.hidden = false; perdeEl.classList.add('acik');
    var g = $('input', komutEl); g.value = ''; komutCiz(''); g.focus();
  }
  function komutKapat(odakDon) {
    if (komutEl.hidden) return;
    komutEl.hidden = true; perdeEl.hidden = true; perdeEl.classList.remove('acik');
    $('input', komutEl).setAttribute('aria-expanded', 'false');
    if (odakDon !== false && oncekiOdak && oncekiOdak.focus) oncekiOdak.focus();
  }
  function komutCiz(q) {
    // boş sorgu: halkadaki yerler ve Ayarlar
    sonuc = q ? ara(q, ogeler, 8) : ogeler.filter(function (o) { var y = o.tur === 'yer' && H.bul(o.id); return y && (y.halka || y.id === 'ayarlar'); });
    etkin = 0;
    var liste = $('#komut-liste'), g = $('input', komutEl);
    liste.innerHTML = sonuc.length ? sonuc.map(function (o, i) {
      return '<li role="option" id="komut-' + i + '" aria-selected="' + (i === 0) + '" data-i="' + i + '"><span>' + kac(o.ad) + '</span><span class="soluk">' + kac(o.etiket) + '</span></li>';
    }).join('') : '<li class="komut__bos" role="presentation">Sonuç yok</li>';
    g.setAttribute('aria-expanded', String(sonuc.length > 0));
    if (sonuc.length) g.setAttribute('aria-activedescendant', 'komut-0'); else g.removeAttribute('aria-activedescendant');
    $('#komut-durum').textContent = sonuc.length ? sonuc.length + ' sonuç' : 'Sonuç yok';
  }
  function komutEtkin(i) {
    if (!sonuc.length) return;
    etkin = (i + sonuc.length) % sonuc.length;
    [].forEach.call($('#komut-liste').children, function (li, j) { li.setAttribute('aria-selected', String(j === etkin)); });
    $('input', komutEl).setAttribute('aria-activedescendant', 'komut-' + etkin);
    var li = $('#komut-' + etkin); if (li && li.scrollIntoView) li.scrollIntoView({ block: 'nearest' });
  }
  function calistir(o) {
    komutKapat(false);
    if (o.eylem === 'halka') return halkaAcOdakli();
    if (o.eylem) { A.yaz(depo, o.eylem[0], o.eylem[1]); uygula(); rota(); return; }
    git(o.yol);
  }
  function halkaAcOdakli() { halkaAc(); var b = halkaOgeleri()[0]; if (b) b.focus(); }

  /* ---------------- olaylar ---------------- */
  function yazilanYerde(e) { var t = e.target; return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); }
  function tus(e) {
    var k = e.key;
    if ((e.ctrlKey || e.metaKey) && (k === 'k' || k === 'K')) { e.preventDefault(); return komutEl.hidden ? komutAc() : komutKapat(); }
    if ((e.ctrlKey || e.metaKey) && k === '.') { e.preventDefault(); return halkaEl.hidden ? halkaAcOdakli() : halkaKapat(); }
    if (!komutEl.hidden) {
      if (k === 'Escape') { e.preventDefault(); return komutKapat(); }
      if (k === 'ArrowDown') { e.preventDefault(); return komutEtkin(etkin + 1); }
      if (k === 'ArrowUp') { e.preventDefault(); return komutEtkin(etkin - 1); }
      if (k === 'Enter' && sonuc[etkin]) { e.preventDefault(); return calistir(sonuc[etkin]); }
      if (k === 'Tab') { e.preventDefault(); return; }
      return;
    }
    if (!halkaEl.hidden) {
      var bs = halkaOgeleri(), i = bs.indexOf(d.activeElement);
      if (k === 'Escape') { e.preventDefault(); return halkaKapat(); }
      if (k === 'ArrowRight' || k === 'ArrowDown' || (k === 'Tab' && !e.shiftKey)) { e.preventDefault(); return bs[(i + 1) % bs.length].focus(); }
      if (k === 'ArrowLeft' || k === 'ArrowUp' || (k === 'Tab' && e.shiftKey)) { e.preventDefault(); return bs[(i - 1 + bs.length) % bs.length].focus(); }
      if (k === 'Home') { e.preventDefault(); return bs[0].focus(); }
      if (k === 'End') { e.preventDefault(); return bs[bs.length - 1].focus(); }
      return;
    }
    if (k === '/' && !yazilanYerde(e) && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); return komutAc(); }
    // ayar seçimi: radyo grubunda ok tuşları
    var r = e.target.closest && e.target.closest('[role="radio"]');
    if (r && /^Arrow(Left|Right|Up|Down)$/.test(k)) {
      e.preventDefault();
      var grup = [].slice.call(r.parentNode.children), j = grup.indexOf(r) + (/Right|Down/.test(k) ? 1 : -1);
      ayarSec(grup[(j + grup.length) % grup.length]);
    }
  }
  function ayarSec(b) {
    var a = b.getAttribute('data-ayar'), v = b.getAttribute('data-deger');
    if (!A.yaz(depo, a, v)) return;
    uygula();
    var satirEl = b.closest('.ayar'); satirEl.outerHTML = A.ciz(A.tanim(a), A.oku(depo, a));
    var yeni = $('[data-ayar-satir="' + a + '"] [data-deger="' + v + '"]'); if (yeni) yeni.focus();
  }
  // Boş = girilmedi (null); aralık dışı yazılmaz ve alan geçersiz işaretlenir, eski değer depoda kalır.
  function sayiYaz(el) {
    var ham = el.value.trim(), v = ham === '' ? null : Number(ham.replace(',', '.'));
    var ok = A.yaz(depo, el.getAttribute('data-ayar'), v);
    if (ok) el.removeAttribute('aria-invalid'); else el.setAttribute('aria-invalid', 'true');
  }
  function aralikYaz(el) {
    var a = el.getAttribute('data-ayar'), s = el.closest('.ayar'), v = A.oku(depo, a);
    v.acik = $('[data-parca="acik"]', s).checked; v.bas = $('[data-parca="bas"]', s).value; v.bit = $('[data-parca="bit"]', s).value;
    A.yaz(depo, a, v);
  }
  function tik(e) {
    var t = e.target;
    var ac = t.closest('[data-ac]');
    if (ac) {
      var n = ac.getAttribute('data-ac');
      if (n === 'komut') return komutAc();
      if (n === 'halka') return halkaAcOdakli();
      if (n === 'ipucu') { depo.setItem('lifeos.kabuk.ipucu', 'goruldu'); var ip = ac.closest('.b-uyari'); if (ip) ip.remove(); return; }
      if (n === 'okudum') return dersBitir(ac.getAttribute('data-ders'));
      if (n === 'acik-kaydet') { var sk = ac.closest('.b-soru'); return soruCevapla(sk.getAttribute('data-soru'), $('textarea', sk).value.trim()); }
      if (n === 'sifirla') { if (confirm('Bütün ayarlar varsayılana dönsün mü?')) { A.sifirla(depo); uygula(); rota(); } return; }
    }
    var cv = t.closest('.b-soru[data-soru] [data-h]'); if (cv) return soruCevapla(cv.closest('.b-soru').getAttribute('data-soru'), cv.getAttribute('data-h'));
    var hb = t.closest('.halka__oge'); if (hb) { var y = hb.getAttribute('data-yol'); halkaKapat(false); return git(y); }
    var li = t.closest('#komut-liste [data-i]'); if (li) return calistir(sonuc[+li.getAttribute('data-i')]);
    if (t === perdeEl) { halkaKapat(); komutKapat(); return; }
    var sec = t.closest('[role="radio"][data-ayar]'); if (sec) return ayarSec(sec);
    var dis = t.closest('[aria-disabled="true"]'); if (dis) e.preventDefault();
  }

  // Yol motoru kilitli ya da bilinmeyen öğede hata fırlatır; kayıt o zaman değişmez, sayfa yeniden çizilir
  function soruCevapla(id, cevap) {
    if (!cevap) return;
    try { kayitYaz(Yol.cevapla(al().y, kayitOku(), id, cevap, Date.now()).kayit); } catch (e) { /* kilitli: kayıt aynı */ }
    rota();
    var s = $('.b-soru[data-soru="' + id + '"] .b-soru__sonuc'); if (s) s.focus({ preventScroll: true });
  }
  function dersBitir(id) {
    try { kayitYaz(Yol.dersOku(al().y, kayitOku(), id, Date.now())); } catch (e) { /* kilitli */ }
    var a = siradaki(fDurum());
    git(a ? adimYolu(a) : F());
  }
  function formCevaplari(form) {
    var c = {};
    [].forEach.call(form.querySelectorAll('input[type="radio"]:checked'), function (r) { c[r.name] = r.value; });
    return c;
  }
  function kapiBitir(form) {
    var id = form.getAttribute('data-kapi'), cevaplar = formCevaplari(form), y = al().y, z = Date.now();
    try {
      var r = Yol.kapiDene(y, kayitOku(), id, cevaplar, z); kayitYaz(r.kayit);
      if (r.sonuc.gecti && y.tur[id] === 'unite') Kabuk.Asama.tahminSil(Yol, depo, etkinAlan, asamaSayisi(etkinAlan), z);
      kapiSonuc = { id: id, sonuc: r.sonuc, tekrar: Kabuk.kapiTekrar ? Kabuk.kapiTekrar(y, id, cevaplar) : 0 };
    } catch (e) { /* kilitli */ }
    rota(); scrollTo(0, 0);
    var s = $('[data-sonuc]'); if (s) s.focus({ preventScroll: true });
  }
  // Bir aşamanın yerleştirme soruları bitti: eşik tutarsa sonraki aşama, tutmazsa (ya da son aşamaysa) sonuç yazılır.
  function yerBitir(form) {
    var n = +form.getAttribute('data-yer'), ys = alanlar[etkinAlan].ys, c = formCevaplari(form), cv = (yerCevap[etkinAlan] || []).slice(0, n - 1);
    cv[n - 1] = c; yerCevap[etkinAlan] = cv;
    if (n < ys.length && Yol.yerlestirmeDegerlendir(ys[n - 1], c).gecti) return git(F() + '/yer/' + (n + 1));
    try { yerSonuc = { alan: etkinAlan, r: Kabuk.Asama.yerlestir(Yol, depo, etkinAlan, ys, cv, Date.now(), !!BECERI[etkinAlan]) }; } catch (e) { yerSonuc = null; }
    delete yerCevap[etkinAlan]; delete seciliAsama[etkinAlan];
    git(F() + '/yer/sonuc');
  }

  function baslat() {
    uygula();
    sayfaEl = $('#sayfa'); halkaEl = $('#halka'); perdeEl = $('#perde'); komutEl = $('#komut');
    ogeler = komutOgeleri(H, A);
    halkaKur();
    addEventListener('hashchange', function () { halkaKapat(false); komutKapat(false); rota(); sayfaEl.focus({ preventScroll: true }); scrollTo(0, 0); });
    d.addEventListener('keydown', tus);
    d.addEventListener('click', tik);
    d.addEventListener('submit', function (e) { var f = e.target.closest('form.kapi'); if (f) { e.preventDefault(); if (f.hasAttribute('data-yer')) yerBitir(f); else kapiBitir(f); } });
    d.addEventListener('change', function (e) {
      if (e.target.closest('.aralik [data-ayar]')) aralikYaz(e.target);
      else if (e.target.matches('.sayiayar [data-ayar]')) sayiYaz(e.target);
    });
    d.addEventListener('pointerdown', basBasla);
    d.addEventListener('pointermove', basHareket);
    d.addEventListener('pointerup', basBitir);
    d.addEventListener('pointercancel', function () { if (basili) { clearTimeout(basili.zaman); basili = null; } });
    d.addEventListener('contextmenu', function (e) { if (basili || !halkaEl.hidden) e.preventDefault(); });
    $('input', komutEl).addEventListener('input', function (e) { komutCiz(e.target.value); });
    if (matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', uygula);
    rota();
    if (location.protocol !== 'file:' && !kok.LIFEOS.HESAP) {
      // hesap.js yazılarını parça kaydına yazar: önce /parca.js, sonra /hesap.js (giriş sayfasındaki sıra)
      var betik = function (yol, sonra) { var b = d.createElement('script'); b.src = yol; b.onload = sonra; d.head.appendChild(b); };
      betik('/parca.js', function () { betik('/hesap.js', function () { if (sayfaEl.getAttribute('data-yer') === 'bugun' && hesapAdi()) rota(); }); });
    }
    alanYukle(etkinAlan).then(function () { if (sayfaEl.getAttribute('data-yer') === 'bugun') rota(); }); // Bugün'ün «sırada» satırı için
  }
  Kabuk.ic = { kac: kac, ust: ust, kirinti: kirinti, depo: depo, git: git, rota: rota, Yol: Yol, kayitOku: kayitOku, fDurum: fDurum, al: al, alanYukle: alanYukle, etkin: function () { return etkinAlan; },
    asamalar: function (id) { var a = alanlar[id]; return a && a.ys ? a.ys : null; },
    asamaY: function (id, asamaId) { var a = alanlar[id]; return a && a.ys ? a.ys.filter(function (y) { return y.id === asamaId; })[0] || null : null; },
    tasinanlar: function () { return H.YERLER.filter(function (y) { return tasinan(y.id); }); } };
  Kabuk.ac = { halka: halkaAcOdakli, komut: function () { komutAc(); }, git: function (y) { git(y); } };
  function basla() { uygula(); hazir.then(baslat); } // tema ilk boyamadan önce (ayar eşzamanlı okunur), sayfa depo hazır olunca
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', basla); else basla();
})(typeof window !== 'undefined' ? window : globalThis);
