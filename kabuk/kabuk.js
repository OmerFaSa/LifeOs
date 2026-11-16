/* LIFEOS.Kabuk — tam ekran çerçeve, gezinme (üst çubuk, telefonda alt çubuk, halka, komut çubuğu), sayfalar.
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
  // Komut çubuğunun sonuçları: yazılı sorguda en çok 8 öğe ve en sonda «Her şeyde ara: <sorgu>» (kabuk/arama.js sayfası).
  function komutSonucu(sorgu, ogeler) {
    var q = String(sorgu || '').trim(), s = ara(q, ogeler, 8);
    return katla(q) ? s.concat([{ tur: 'arama', id: 'her-sey', ad: 'Her şeyde ara: ' + q, etiket: 'arama', yol: '#/motor/arama?' + encodeURIComponent(q) }]) : s;
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
  // Selamın altındaki cümle: yalnız bilinen sayılar; son öğe iyelik alır («bir ders, 3 tekrar ve 2 bekleyen işin var»)
  function ozetCumle(a, tekrar, bekleyen) {
    var l = [];
    if (a) l.push(a.tur === 'ders' ? ['bir ders', 'bir dersin'] : ['bir kapı sınavı', 'bir kapı sınavın']);
    if (tekrar > 0) l.push([(tekrar === 1 ? 'bir' : tekrar) + ' tekrar', (tekrar === 1 ? 'bir' : tekrar) + ' tekrarın']);
    if (bekleyen > 0) l.push([(bekleyen === 1 ? 'bir' : bekleyen) + ' bekleyen iş', (bekleyen === 1 ? 'bir' : bekleyen) + ' bekleyen işin']);
    if (!l.length) return 'Bugün için bekleyen bir şey yok.';
    var s = l.map(function (x, i) { return x[i === l.length - 1 ? 1 : 0]; });
    return 'Bugün ' + (s.length > 1 ? s.slice(0, -1).join(', ') + ' ve ' : '') + s[s.length - 1] + ' var.';
  }
  // Yol durumundan (motor/yol.js durum()) sıradaki adım: geçilmemiş ilk açık ünitede okunmamış ilk ders,
  // dersler bittiyse o ünitenin kapısı; bütün üniteler geçildiyse aşama kapısı; o da geçildiyse null.
  // Okumak hiçbir şeyi geçirmez (AGENTS 0.1): ünite ancak kapısıyla biter.
  function siradaki(dr) {
    for (var i = 0; i < dr.uniteler.length; i++) {
      var u = dr.uniteler[i];
      if (u.gecti) continue;
      if (!u.acik) return null;
      for (var j = 0; j < u.dersler.length; j++) if (u.dersler[j].acik && !u.dersler[j].okundu) return { tur: 'ders', id: u.dersler[j].id, ad: u.dersler[j].ad, unite: i + 1, sira: j + 1, toplam: u.dersler.length, okunan: u.dersler.filter(function (x) { return x.okundu; }).length };
      return { tur: 'kapi', id: u.id, ad: u.ad, unite: i + 1 };
    }
    return dr.asama.gecti ? null : { tur: 'kapi', id: dr.asama.id, ad: dr.asama.ad };
  }
  // Ünite grupları (2026-11-17, sahip: «Akademik'te konu listelerini göremiyorum»): «TYT Türkçe · Anlam» (ya da « — ») gibi adlar ayraç
  // öncesine göre ardışık gruplara ayrılır (veri değişmez). Her ünite böyle adlanmamışsa ya da tek grup çıkıyorsa null: düz liste kalır.
  var GRUP_AYRAC = / [·—] /;
  function uniteGruplari(uniteler) {
    if (!uniteler.length || !uniteler.every(function (u) { return GRUP_AYRAC.test(String(u.ad)); })) return null;
    var l = [];
    uniteler.forEach(function (u, i) {
      var m = GRUP_AYRAC.exec(u.ad), ad = u.ad.slice(0, m.index), son = l[l.length - 1];
      if (!son || son.ad !== ad) l.push(son = { ad: ad, uniteler: [] });
      son.uniteler.push({ u: u, i: i, kisa: u.ad.slice(m.index + m[0].length) });
    });
    return l.length > 1 ? l : null;
  }
  // Konu haritası (alan/<alan>/harita.json, biçim alan/SEMA.md «Konu haritası»): dosyadan gelir, güvenilmez; bozuk dal/bölüm/konu atılır,
  // geçerli dal kalmazsa null (sayfa yalnız üniteleri gösterir). ders/unite yalnız o alanın kimliği biçimindeyse tutulur.
  function haritaSuz(h, alan) {
    var yazi = function (x, n) { return typeof x === 'string' && x.trim() ? x.trim().slice(0, n) : null; };
    var kim = new RegExp('^' + alan + '\\.\\d+(\\.\\d+)+$');
    if (!h || h.sema !== 1 || !Array.isArray(h.dallar)) return null;
    var gor = {}, dallar = h.dallar.map(function (d) {
      if (!d || !/^[a-z0-9-]{1,40}$/.test(d.id) || gor[d.id] || !yazi(d.ad, 120) || !Array.isArray(d.bolumler)) return null;
      var bolumler = d.bolumler.map(function (b) {
        if (!b || !yazi(b.ad, 120) || !Array.isArray(b.konular)) return null;
        var konular = b.konular.map(function (k) {
          if (!k || !yazi(k.ad, 160)) return null;
          var o = { ad: yazi(k.ad, 160) };
          if (typeof k.ders === 'string' && kim.test(k.ders)) o.ders = k.ders; else if (typeof k.unite === 'string' && kim.test(k.unite)) o.unite = k.unite;
          return o;
        }).filter(Boolean);
        return konular.length ? { ad: yazi(b.ad, 120), konular: konular } : null;
      }).filter(Boolean);
      if (!bolumler.length) return null;
      gor[d.id] = 1;
      return { id: d.id, ad: yazi(d.ad, 120), ozet: yazi(d.ozet, 300) || '', bolumler: bolumler };
    }).filter(Boolean);
    return dallar.length ? { alan: alan, dallar: dallar } : null;
  }
  // Seçilen dal öğrenme kaydıdır (lifeos.yol.<alan>.dal: depo.js KAYIT → IndexedDB + tek depo, cihazlar arası eşitlenir), değer JSON metni.
  // Önceki tur yalnız bu cihazda tutuyordu (lifeos.alan.<alan>.dal, localStorage): ilk okumada kayda taşınır.
  function dalAnahtari(alan) { return 'lifeos.yol.' + alan + '.dal'; }
  function dalOku(depo, alan) {
    var k = dalAnahtari(alan), v = depo.getItem(k), eski = 'lifeos.alan.' + alan + '.dal';
    if (v == null) { var e = depo.getItem(eski); if (e) { depo.setItem(k, JSON.stringify(e)); v = depo.getItem(k); } }
    if (depo.getItem(eski) != null) depo.removeItem(eski);
    try { v = JSON.parse(v); } catch (x) { /* düz metin: olduğu gibi */ }
    return typeof v === 'string' && v ? v : null;
  }
  function dalYaz(depo, alan, dal) { if (dal) depo.setItem(dalAnahtari(alan), JSON.stringify(dal)); else depo.removeItem(dalAnahtari(alan)); }
  var HARF = 'ABCDEFGH';
  /* King sayfasının gövdesi (#/king). King Claude masaüstü uygulamasında konuşur, LifeOS'u salt okur; LifeOS'ta dil modeli ve
   * sohbet yok (AGENTS §0.1). Metin king/KURULUM.md'nin sahibe dönük kısmı; dış bağlantı yok. B: bileşen kataloğu (kabuk/bilesen.js). */
  function kingGovde(B) {
    var l = function (ad, ogeler) { return B.liste({ ad: ad, ogeler: ogeler.map(function (x) { return { ad: x[0], not: x[1], uzun: true }; }) }); };
    // Sayfanın tek işi sohbet (king-sohbet.js başlığın altına ekler); açıklamalar sohbetin altında tek kapalı bölümde (2026-11-16, sahip: «ekranda daha az şey»).
    var k = function (baslik, govde) { return '<p class="king-hakkinda__ara">' + kac(baslik) + '</p>' + govde; };
    return B.baslik({ metin: 'King' }) +
      B.acilir({ baslik: 'King hakkında', veri: { 'king-hakkinda': '' }, govde: [
        k('Ne görür', l('King ne görür', [
          ['Bugün, plan ve sistem haritası', 'Bugüne ait olmayanı bugünmüş gibi sunmaz'],
          ['Kayıtların, notların, yol haritan', 'Her sayı kesinlik etiketiyle; olmayan veri için «veri yok» der'],
          ['Araştırma', "Notlarında, ders içeriğinde ve Vikipedi'de kaynaklı cevap arar"]])),
        k('Ne yapmaz', l('King ne yapmaz', [
          ['Yalnız okur', "Kayıt, not, onay ya da ayar yazmaz; kaydı Başbuğ'da sen yaparsın"],
          ['Özel notlarını görmez', 'Parola, anahtar ve jeton da hiç verilmez'],
          ["King'e kapalı araçların notlarını görmez", 'Araçta «King okuyabilsin» kapalıysa']])),
        k('Claude uygulamasında', "<p class=\"soluk\">King'le Claude masaüstü uygulamasında da konuşursun.</p>" + l('King için adımlar', [
          ['Claude uygulamasını tamamen kapat', 'Görev çubuğundaki simgeden «Çık»'],
          ["Claude'u yeniden aç", 'Araç menüsünde «lifeos-king» görünür'],
          ['Bir şey sor', '«Bugün ne var?»; Claude okumadan önce izin ister']])),
        '<p class="king-dipnot">' + kac("Yazdığın ve King'in okuduğu şeyler cevaplayan modelin sunucusuna gider (Antigravity'de Google, Claude'da Anthropic). Özel notların ve sırların gitmez.") + '</p>'] });
  }
  // Yerin durum rozeti: yalnız eski sayfaya giden ve henüz yazılmamış yerde. «pilot» (kabuğa taşınmış alan) ekranda rozet almaz:
  // iç göç durumu sahibe bir şey söylemez (faz3-arama-king-sayfa.md); taslak içeriği Onaylar ve ders kartındaki «taslak» söyler.
  var DURUM_AD = { eski: 'eski sayfada', plan: 'hazırlanıyor' };
  function durumPul(y) { var a = DURUM_AD[y.durum]; return a ? { metin: a, tur: 'normal' } : null; }

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
  Kabuk.katla = katla; Kabuk.puan = puan; Kabuk.ara = ara; Kabuk.komutOgeleri = komutOgeleri; Kabuk.komutSonucu = komutSonucu; Kabuk.selam = selam; Kabuk.ozetCumle = ozetCumle; Kabuk.siradaki = siradaki; Kabuk.durumPul = durumPul; Kabuk.kingGovde = kingGovde; Kabuk.uniteGruplari = uniteGruplari; Kabuk.haritaSuz = haritaSuz; Kabuk.dalOku = dalOku; Kabuk.dalYaz = dalYaz;
  Kabuk.Asama = { kayitAnahtari: kayitAnahtari, hazirla: asamaHazirla, kur: asamalariKur, kayit: asamaKaydi, yaz: asamaYaz, liste: asamaListesi, calisilan: calisilanAsama,
    yeniMi: alanYeniMi, yerlestir: yerlestirYaz, tahminSil: tahminSilHepsi };
  kok.LIFEOS = kok.LIFEOS || {}; kok.LIFEOS.Kabuk = Kabuk;
  if (typeof module !== 'undefined' && module.exports) module.exports = Kabuk;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var H = Kabuk.Harita, A = Kabuk.Ayar, d = document, kokEl = d.documentElement;
  // Ekran hataları bu bilgisayardaki tek kapının günlüğüne (sistem/tekkapi.py /api/kabuk/hata, gövde ≤ 4 KB): yalnız yerelde,
  // açılış başına en çok 5, sessiz başarısızlık (hata bildirimi kendisi hata üretmesin).
  var hataSay = 0;
  function hataGonder(tur, ileti, yigin) {
    if (hataSay++ >= 5) return;
    try {
      var v = { tur: tur, ileti: String(ileti || '').slice(0, 500), sayfa: location.hash.slice(0, 200), yigin: String(yigin || '').slice(0, 1500) };
      var g = JSON.stringify(v);
      if (new Blob([g]).size > 4000) { v.yigin = v.yigin.slice(0, 300); g = JSON.stringify(v); } // sunucu 4096 baytı aşanı reddeder
      fetch('/api/kabuk/hata', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-LifeOS': 'kabuk-hata' }, body: g, keepalive: true }).catch(function () {});
    } catch (x) { /* sessiz */ }
  }
  if (/^(127\.0\.0\.1|localhost)$/.test(location.hostname) && kok.fetch) {
    kok.addEventListener('error', function (e) {
      hataGonder('hata', e.message, e.error && e.error.stack || (e.filename ? e.filename + ':' + e.lineno + ':' + e.colno : ''));
    });
    // yakalanmamış söz reddi (fetch, IndexedDB…): aynı sınır ve sayaç; neden Error değilse metni ileti olur
    kok.addEventListener('unhandledrejection', function (e) {
      var r = e.reason; hataGonder('soz', r && r.message || r, r && r.stack);
    });
  }
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
    return (bekleyen[id] = Promise.all(istek).then(function (vs) { hamlar[id] = vs; return alanKur(id); }));
  }
  // Konu haritası: aşama dosyalarıyla aynı yoldan, yalnız alan sayfası (ya da dalı seçilmiş alanın Bugün kartı) isteyince; 404 = harita yok
  var haritalar = {}, haritaBekleyen = {};
  function haritaYukle(id) {
    if (id in haritalar) return Promise.resolve(haritalar[id]);
    // yalnız harita dosyası olan alan ister (YERLER «harita: true»): öbürleri her açılışta konsola 404 düşürüyordu
    if (location.protocol === 'file:' || !H.YERLER.some(function (y) { return y.id === id && y.harita; })) return Promise.resolve(haritalar[id] = null);
    return haritaBekleyen[id] || (haritaBekleyen[id] = fetch('../alan/' + id + '/harita.json').then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; }).then(function (h) { return (haritalar[id] = haritaSuz(h, id)); }));
  }
  // harita gelince yalnız aynı adres hâlâ açıksa yeniden çizilir (ders sayfasındaki yazılmış cevaplar silinmesin)
  function haritaIste(id) { var h = location.hash; haritaYukle(id).then(function () { if (location.hash === h) rota(); }); }
  function seciliDal(id) { var h = haritalar[id], k = dalOku(depo, id); return h && k ? h.dallar.filter(function (d) { return d.id === k; })[0] || null : null; }
  // Sahibin onay kaydı (kabuk/onay.js) dosya içeriğinin üstüne Yol.yukle'den ÖNCE bindirilir; onay değişince ham içerikten yeniden kurulur
  var hamlar = {};
  function alanKur(id) {
    var On = Kabuk.Onay, onay = On ? On.oku(depo) : null;
    var ys = Kabuk.Asama.kur(Yol, id, hamlar[id].map(function (v, i) { return On ? On.uygula(v, id, i + 1, onay) : v; }));
    return (alanlar[id] = ys.length ? { ys: ys } : { hata: 'icerik' });
  }
  function asamaYolu(n) { return F() + '/asama/' + n; }
  // «Seviyemi bul»: beceri alanında soru yetmez, üretim görevi de ister (icerik-hatti §4.3/5)
  var BECERI = { dil: 1, muzik: 1 }, yerCevap = {}, yerSonuc = null; // yerCevap: alan → aşama başına cevaplar (yalnız akış boyunca bellekte)
  function alanYeni(id) { return Kabuk.Asama.yeniMi(Yol, depo, id, asamaSayisi(id)); }

  /* ---------------- sayfalar ---------------- */
  // Her sayfanın üst çubuğu: logo, ana bölümler, arama (komut çubuğu), hesap. Manzaralı sayfada sahnenin üstünde saydam (ust--sahne),
  // öbürlerinde yapışkan şerit (ust--duz); aşağı kaydırınca gizlenir, yukarı kaydırınca döner (kaydir). Sayfanın konumu başlığın üstünde küçük satır.
  // Ana bölümler halkanın kendisidir (harita.js tek liste, Sistem haritası hariç): üst çubuk, telefondaki alt çubuk, halka ve Ctrl K aynı yerleri aynı adla gösterir.
  // Sekme yalnız simge; seçili sekmede adı da yazar (2026-11-16b, sahip: «sekmeler küçülebilir»), öbürlerinin adı ekran okuyucuda ve ipucunda.
  function sekmeler() { return H.halka().filter(function (y) { return y.id !== 'harita'; }); }
  var simdiYer = null; // rota çizerken seçili sekme için
  function sekmeOf(yer) {
    if (!yer) return 'bugun';
    if (yer.id === 'plan') return 'bugun'; // günün planı Bugün'ün parçası
    if (sekmeler().some(function (y) { return y.id === yer.id; })) return yer.id;
    return yer.dal === 'ogren' || yer.dal === 'saglik' || yer.dal === 'king' ? yer.dal : '';
  }
  function sekmeHtml(sinif, se) {
    return sekmeler().map(function (y) {
      var s = y.id === se;
      return '<a class="' + sinif + '" href="' + y.yol + '" data-yer="' + y.id + '"' + (s ? ' aria-current="page"' : '') + ' title="' + kac(y.ad) + '">' + (s && sinif === 'ust__sekme' ? '<span class="ust__isaret" aria-hidden="true"></span>' : '') +
        '<svg aria-hidden="true"><use href="#i-' + (HALKA_SIMGE[y.id] || 'harita') + '"/></svg><span class="' + sinif + '-ad">' + kac(y.ad) + '</span></a>';
    }).join('');
  }
  function cubuk(sahne) {
    var ad = hesapAdi(), se = sekmeOf(simdiYer);
    return '<header class="ust ' + (sahne ? 'ust--sahne' : 'ust--duz') + '"><a class="ust__logo" href="#/bugun"><span class="ust__kare" aria-hidden="true">B</span>Başbuğ</a>' +
      '<nav class="ust__sekmeler" aria-label="Ana bölümler">' + sekmeHtml('ust__sekme', se) + '</nav>' +
      '<button type="button" class="ust__ara" data-ac="komut" aria-keyshortcuts="Control+K /" aria-label="Ara"><svg aria-hidden="true"><use href="#i-ara"/></svg><span aria-hidden="true">Ara</span><kbd>Ctrl K</kbd></button>' +
      '<a class="ust__hesap" href="#/ayarlar" aria-label="Ayarlar">' + (ad ? kac(ad.charAt(0).toLocaleUpperCase('tr')) : '<svg aria-hidden="true"><use href="#i-kisi"/></svg>') + '</a></header>';
  }
  // Kapak: ana sayfaların başında kendi piksel sahnesinden ince şerit ve üstüne binen renkli simge (okuma ve form sayfalarında yok).
  // [sahne (brand/ortak/piksel-doga.js TUR_LISTE), renk]; simge index.html'deki #i-<yer kimliği>
  var KAPAK = { felsefe: ['medrese', 'turuncu'], akademik: ['kitaplik', 'mavi'], dil: ['kervansaray', 'yesil'], tarih: ['kale', 'pembe'], muzik: ['ates', 'mor'],
    okuma: ['hattat', 'sari'], beslenme: ['pinar', 'yesil'], hareket: ['yaylak', 'deniz'], uyku: ['cadir', 'gok'], tahlil: ['sifahane', 'pembe'],
    ogren: ['medrese', 'mavi'], saglik: ['yaylak', 'yesil'], motorlar: ['ufuk', 'deniz'], yol: ['kervansaray', 'mavi'], tekrar: ['kitaplik', 'mor'], soru: ['kale', 'turuncu'],
    kayit: ['pinar', 'deniz'], plan: ['ufuk', 'yesil'], not: ['yazi', 'sari'], arama: ['ufuk', 'gok'], onay: ['kale', 'mavi'], king: ['taht', 'sari'], harita: ['otuken', 'mavi'] };
  var kapakYer = null; // rota çizerken: bu sayfa kapaklı mı
  function ust(sol) {
    var k = kapakYer && KAPAK[kapakYer.id];
    return cubuk(!!k) + (k ? '<div class="kapak" aria-hidden="true"><canvas class="kapak__sahne" width="480" height="72" data-sahne="' + k[0] + '"></canvas></div>' +
      '<div class="kapak-alt" aria-hidden="true"><span class="kapak__simge"><span class="b-simge b-simge--' + k[1] + '"><svg><use href="#i-' + kapakYer.id + '"/></svg></span></span></div>' : '') +
      '<nav class="konum" aria-label="Konum">' + sol + '</nav>';
  }
  function kirinti(yer) {
    var ustYer = H.bul(H.DAL_SAYFASI[yer.dal]);
    if (!ustYer || ustYer.id === yer.id) ustYer = H.bul('bugun');
    return '<a class="kirinti" href="' + ustYer.yol + '"><span aria-hidden="true">‹ </span>' + kac(ustYer.ad) + '</a><span class="kirinti__ayrac" aria-hidden="true">/</span><span>' + kac(yer.ad) + '</span>';
  }

  // Bekleyenler satırlarından «iş» sayılanlar (ipucu, uyarı ve bitti iletisi sayılmaz); onay satırı geç gelir (onay.js ozetYenile çağırır)
  var BEKLEYEN = '[data-baslangic="teklif"],[data-tn-davet],[data-onay-bekleyen]', BEKLEYEN_RE = /data-(baslangic="teklif"|tn-davet|onay-bekleyen)/, sonOzet = null;
  function ozetYenile() {
    var el = sayfaEl.querySelector('.b-karsilama__ozet');
    if (el && sonOzet) el.textContent = ozetCumle(sonOzet.a, sonOzet.tekrar, sayfaEl.querySelectorAll(BEKLEYEN).length);
  }

  function sayfaBugun() {
    var t = new Date();
    var f = fDurum(), a = f && siradaki(f), alan = H.bul(etkinAlan);
    var od = f && f.ilerleme && f.ilerleme.okunanDers, v = Kabuk.bugunVeri ? Kabuk.bugunVeri() : { plan: null, tekrar: 0 }; // araclar.js
    var ekler = [
      // depo «bellek» kipinde (faz2-indexeddb.md, taşıma kuralı 4) bu oturumun yazdıkları yenilemede kalmaz
      depo.kip() === 'bellek' ? B.uyari({ tur: 'dikkat', simge: 'dikkat', renk: 'turuncu', metin: 'Kayıtlarına bu açılışta ulaşılamadı', alt: 'Önceki kayıtların silinmedi, ama bu oturumda yaptıkların sayfa yenilenince kaybolur.' }) : '',
      Kabuk.baslangicDavet ? Kabuk.baslangicDavet() : '', // araclar.js: eski sistemdeki kayıtları getirme teklifi (göçten sonra)
      Kabuk.tanismaDavet ? Kabuk.tanismaDavet() : '', // tanisma.js: kayıt yoksa tek satırlık davet
      Kabuk.onayBugun ? Kabuk.onayBugun() : '']; // onay.js: «N ders onayını bekliyor», yalnız N > 0 iken
    // «Her yere iki adımda» ipucu kalktı (2026-11-16b): gezinme artık görünür çubukta; sağ tık, Ctrl . ve Ctrl K ek yollardır, öğretilmesi gerekmez
    sonOzet = { a: a, tekrar: v.tekrar };
    return cubuk(true) + B.karsilama({ tarih: tarih(t), selam: selam(t, hesapAdi()),
      ozet: ozetCumle(a, v.tekrar, ekler.filter(function (s) { return BEKLEYEN_RE.test(s); }).length),
      ilerleme: od && od.toplam && od.deger ? { deger: od.deger, toplam: od.toplam } : null, alanlar: alanKartlari(f, od, a), // %0 halkası bilgi vermez, gizli
      sira: { simge: etkinAlan, ust: alan.ad + (a && a.unite ? ' · Ünite ' + a.unite : ''), metin: !f ? alan.ad : !a ? f.asama.ad + ' tamamlandı' : a.tur === 'kapi' ? a.ad + ' · kapı' : a.ad },
      adim: !a ? null : a.tur === 'ders' ? 'Ders ' + a.sira + ' / ' + a.toplam : a.unite ? 'Ünitenin dersleri bitti; kapıdan geçince sonraki ünite açılır' : 'Aşamanın son kapısı',
      eylem: { metin: !a ? 'Aç' : a.tur === 'kapi' ? 'Kapıya git' : od.deger ? 'Derse devam et' : 'Derse başla', href: a ? adimYolu(a) : F() },
      baglanti: v.plan ? { metin: 'Başka bir şey seç', href: '#/ogren' } : { metin: 'Günü planla', href: '#/motor/plan' },
      plan: v.plan ? { href: '#/motor/plan', satirlar: v.plan } : null, ekler: ekler });
  }
  // Bugün'ün alan ızgarası: haritadaki taşınmış alanlar; simge index.html'deki #i-<alan>, ilerleme yalnız açık alan için bilinir
  var ALAN_RENK = { felsefe: 'turuncu', akademik: 'mavi', dil: 'yesil', tarih: 'pembe', okuma: 'sari', hareket: 'deniz', muzik: 'mor', beslenme: 'yesil', uyku: 'gok', tahlil: 'pembe',
    yol: 'mavi', tekrar: 'mor', soru: 'turuncu', kayit: 'deniz', plan: 'yesil', not: 'sari', arama: 'gok' }; // index.html sprite'ında #i-<id> olanlar
  function alanKartlari(f, od, a) {
    return H.YERLER.filter(function (y) { return y.katman === 'alan' && y.asama; }).map(function (y) {
      var bu = y.id === etkinAlan && od && od.toplam, dal = null;
      if (dalOku(depo, y.id)) { if (y.id in haritalar) dal = seciliDal(y.id); else haritaIste(y.id); } // dalı seçilmiş alanın kartında dalın adı
      var ilerleme_ = bu && a && a.tur === 'ders' ? 'Ünite ' + a.unite + ' · ' + a.okunan + '/' + a.toplam + ' ders' : '';
      return { ad: y.ad, not: dal ? dal.ad + (ilerleme_ ? ' · ' + ilerleme_ : '') : ilerleme_ || y.aciklama, href: y.yol, simge: y.id, renk: ALAN_RENK[y.id],
        yuzde: bu && od.deger ? Math.round(100 * od.deger / od.toplam) : null };
    });
  }
  // manzara: sahibin piksel sahnesi (brand/ortak/piksel-doga.js, sunucu /piksel-doga.js verir); süstür, çizilmezse gök rengi kalır.
  // Ambiyans (ay) düğmesi üst çubuktan kalktı (2026-11-16b: tema sanılıyordu); aç/kapa Ayarlar › Ses'te.
  // Geniş ekranda başlık manzaranın içinde: başlıktan sonraki ilk blok sahnenin solan kenarına düşmesin diye sahnenin altına itilir
  // (Plan'daki «Bugünün planı» etiketi sahnenin üstünde okunmuyordu). Kart değil ölçü: içerik ne olursa olsun aynı kural.
  function kapakPay() {
    var k = sayfaEl.querySelector(':scope > .kapak'), b = sayfaEl.querySelector(':scope > .govde > .b-baslik:first-child'), s = b && b.nextElementSibling;
    if (!k || !s) return;
    s.style.marginTop = '';
    if (innerWidth < 641) return;
    var fark = k.getBoundingClientRect().bottom + 8 - s.getBoundingClientRect().top;
    if (fark > 0) s.style.marginTop = Math.round(parseFloat(getComputedStyle(s).marginTop) + fark) + 'px';
  }
  var manzaraIstendi = false;
  // sahne çizimi önbellekte: aynı sahne, saat ve boy bir kez çizilir, sonraki sayfa çizimlerinde kopyalanır
  var sahneOnbellek = {};
  function manzara() {
    var c = sayfaEl.querySelector('.b-karsilama__manzara, .kapak__sahne'), D = kok.LIFEOS && kok.LIFEOS.PIKSEL_DOGA;
    if (!c) return;
    if (!D) {
      if (location.protocol !== 'file:' && !manzaraIstendi) { manzaraIstendi = true; var b = d.createElement('script'); b.src = '/piksel-doga.js'; b.onload = manzara; d.head.appendChild(b); }
      return;
    }
    // tuval görünen kutunun oranında çizilir (eskiden 480×72 tuval 300 px yüksekliğe gerilip pikseller dikine uzuyordu): her piksel kare, 3 (telefonda 2) ekran pikseli
    var kutu = c.getBoundingClientRect(), olc = innerWidth < 640 ? 2 : 3;
    if (kutu.width > 0 && kutu.height > 0) { c.width = Math.max(120, Math.round(kutu.width / olc)); c.height = Math.max(40, Math.round(kutu.height / olc)); }
    var saat = new Date().getHours(), tur = c.getAttribute('data-sahne') || 'yayla', ad = [tur, saat, c.width, c.height].join();
    try {
      var o = sahneOnbellek[ad];
      // önbellekte yoksa çizim (yavaş makinede 100–300 ms) geçişin ortasında yapılmaz: boşta çizilir, tuval o ana dek gök renginde
      // geri çağrı o anki tuvali yeniden bulur: bekleyen çizim sırasında sayfa yeniden çizilirse (veri geldi) eski tuvale bağlı kalıp kayboluyordu
      if (!o) { bostaCiz(D, tur, saat, c.width, c.height, manzara); return; }
      o.yer.imza = ''; // yeni tuval: sakinler ilk karede çizilsin
      canli = { c: c, g: c.getContext('2d'), arka: o, D: D };
      canli.g.drawImage(o, 0, 0); D.kare(canli.g, o, o.yer, Date.now() / 1000);
      if (!canliSaat) canliSaat = setInterval(canlandir, 125);
      setTimeout(function () { sahneleriHazirla(D); }, 1500);
    } catch (e) { /* süs */ }
  }
  // Sahneyi önbelleğe çizer; boşta (requestIdleCallback), yoksa kısa bir gecikmeyle. Aynı sahne iki kez sıraya girmez.
  var cizilecek = {};
  function sahneYap(D, tur, saat, w, h) {
    var ad = [tur, saat, w, h].join(); if (sahneOnbellek[ad]) return;
    var o = d.createElement('canvas'); o.width = w; o.height = h; o.yer = D.yerlesim(w, h, D.vakit(saat), tur); D.binaCiz(o.getContext('2d'), o.yer); sahneOnbellek[ad] = o;
  }
  // Önceden çizim (sonra yok: ekranda bekleyen tuval yok) yalnız gerçek boşlukta: süzülme ya da geçiş sürerken kalan süre kısaysa ertelenir.
  // Eskiden zaman aşımıyla (400 ms) hareketin ortasında koşup 4× yavaş CPU'da 130-170 ms'lik kareler bırakıyordu (2026-11-17b ölçümü).
  function bostaCiz(D, tur, saat, w, h, sonra) {
    var ad = [tur, saat, w, h].join(); if (cizilecek[ad]) return; cizilecek[ad] = 1;
    var is = function (dl) {
      if (!sonra && dl && dl.timeRemaining && dl.timeRemaining() < 20) return requestIdleCallback(is);
      try { sahneYap(D, tur, saat, w, h); } catch (e) { /* süs */ } delete cizilecek[ad]; if (sonra) sonra();
    };
    if (kok.requestIdleCallback) requestIdleCallback(is, sonra ? { timeout: 400 } : undefined); else setTimeout(is, 60);
  }
  // Açılıştan sonra bütün kapak sahneleri (ve Bugün'ün sahnesi) boşta önceden çizilir: bir bölüme ilk girişte çizim beklenmez
  var onCizildi = false;
  function sahneleriHazirla(D) {
    if (onCizildi || !D) return; onCizildi = true;
    var olc = innerWidth < 640 ? 2 : 3, w = Math.max(120, Math.round(innerWidth / olc)), saat = new Date().getHours();
    var kh = Math.max(40, Math.round((innerWidth < 641 ? 144 : 300) / olc)), turler = {};
    Object.keys(KAPAK).forEach(function (k) { turler[KAPAK[k][0]] = 1; });
    Object.keys(turler).forEach(function (t) { bostaCiz(D, t, saat, w, kh); });
  }
  // Sahnenin sakinleri (süzülen bulut, kuş sürüsü, düşen yaprak, ördek, yıldız) kitaplığın kendi rutinleriyle yürür; kare değişmedikçe çizilmez.
  var canli = null, canliSaat = null;
  function canlandir() {
    if (!canli || !canli.c.isConnected) { clearInterval(canliSaat); canliSaat = null; canli = null; return; }
    if (d.hidden || !hareketVar() || d.documentElement.hasAttribute('data-gecis')) return; // geçiş sürerken sahne kıpırdamaz (kare bütçesi)
    try { canli.D.kare(canli.g, canli.arka, canli.arka.yer, Date.now() / 1000); } catch (e) { clearInterval(canliSaat); canliSaat = null; }
  }
  function sayfaDal(yer) {
    var ys = H.dalinYerleri(yer.dal), devam = '';
    // Öğren: «hemen öğreneyim» (sahip, 2026-11-16b): en üstte kaldığın ders tek düğmeyle; alana tıklamak önce genel bakışı açar
    if (yer.id === 'ogren') {
      var f = al(), dr = fDurum(), a = dr && siradaki(dr);
      if (!f) alanYukle(etkinAlan).then(function () { if (sayfaEl.getAttribute('data-yer') === 'ogren') rota(); });
      else if (a) devam = siraKarti(f, dr, a, { alan: true });
    }
    return ust(kirinti(yer)) + '<div class="govde">' + B.baslik({ metin: yer.ad, alt: yer.aciklama }) + devam +
      (ys.length ? B.liste({ ad: yer.ad, ogeler: ys.map(function (y) { return { ad: y.ad, not: y.aciklama, pul: durumPul(y), href: y.yol, simge: ALAN_RENK[y.id] ? y.id : null, renk: ALAN_RENK[y.id] }; }) }) : '') + '</div>';
  }
  function sayfaHarita(yer) {
    var dallar = H.DALLAR.map(function (dl) {
      var ys = H.YERLER.filter(function (y) { return y.dal === dl.id; });
      // katman yazıyla da söylenir (eskiden yalnız sol çizginin rengiydi)
      return B.panel({ baslik: dl.ad + ' · ' + ys.length, govde: ys.length ? B.liste({ ad: dl.ad, ogeler: ys.map(function (y) {
        return { ad: y.ad, pul: durumPul(y), href: y.yol }; // tür ve «halkada» notu yok (kural 10, 2026-11-16b); dal başlığı yeterli
      }) }) : '' });
    }).join('');
    return ust(kirinti(yer)) + '<div class="govde govde--genis">' + B.baslik({ metin: 'Sistem haritası', alt: 'Başbuğ\'daki ' + H.YERLER.length + ' yer, tek sayfada.' }) +
      '<div class="harita">' + dallar + '</div></div>';
  }
  function sayfaAyarlar(yer, odak) {
    var gruplar = A.GRUPLAR.map(function (g) {
      return B.bolum({ baslik: g.ad, id: 'grup-' + g.id, eylem: g.id === 'hesap' ? { metin: 'Hesap ve cihazlar', tur: 'sade', href: '#/hesap' } : null, govde: A.SEMA.filter(function (t) { return t.grup === g.id; }).map(function (t) { return A.ciz(t, A.oku(depo, t.anahtar)); }) });
    }).join('');
    setTimeout(function () {
      ayarIzle();
      if (!odak) return;
      var el = d.getElementById(odak) || $('[data-ayar-satir="' + odak + '"]');
      if (el) { el.scrollIntoView({ block: 'center' }); var f = $('[aria-checked="true"], input', el) || el; f.focus(); el.classList.add('b-ayar--isik'); }
    }, 0);
    // sol menü: her grubun simgesi; kaydırdıkça bulunduğun grup işaretlenir (ayarIzle)
    var menu = '<nav class="b-gezinme ayar-menu" aria-label="Ayar grupları">' + A.GRUPLAR.map(function (g) {
      return '<a class="b-gezinme__oge" href="#/ayarlar?grup-' + g.id + '" data-grup="' + g.id + '"><svg aria-hidden="true"><use href="#i-' + (AYAR_SIMGE[g.id] || 'ayar') + '"/></svg>' + kac(g.ad) + '</a>';
    }).join('') + '</nav>';
    var ara = '<div class="ayar-ara">' + B.alan({ ad: 'Ayarlarda ara', isim: 'ayarAra', tur: 'arama', yerTutucu: 'Ayar ara: tema, yazı boyu, ses, beden…', veri: { 'ayar-ara': '' } }) +
      '<p class="soluk ayar-ara__yok" hidden>Bu sözcükle bir ayar yok.</p></div>';
    return ust(kirinti(yer)) + '<div class="govde govde--genis ayarlar">' + B.baslik({ metin: 'Ayarlar', alt: 'Değişiklikler hemen uygulanır.' }) + ara + B.yanli({ taraf: 'sol',
      yan: menu,
      ana: [gruplar, B.eylemler([{ metin: 'Hepsini varsayılana döndür', tur: 'sade', veri: { ac: 'sifirla' } }])] }) + '</div>';
  }
  // Ayarlarda ara: satırın adı ve açıklamasında geçen sözcüğe göre süzer; eşleşmesi olmayan grup gizlenir (Türkçe küçük harf)
  function ayarSuz(q) {
    q = String(q || '').trim().toLocaleLowerCase('tr');
    var bulunan = 0;
    [].forEach.call(d.querySelectorAll('.ayarlar .b-bolum'), function (s) {
      var gor = 0;
      [].forEach.call(s.querySelectorAll('[data-ayar-satir]'), function (r) {
        var e = !q || r.textContent.toLocaleLowerCase('tr').indexOf(q) >= 0;
        r.hidden = !e; if (e) gor++;
      });
      s.hidden = !gor; bulunan += gor;
    });
    var y = d.querySelector('.ayar-ara__yok'); if (y) y.hidden = bulunan > 0;
  }
  d.addEventListener('input', function (e) { if (e.target.matches && e.target.matches('[data-ayar-ara]')) ayarSuz(e.target.value); });
  // ayar grubu simgeleri (index.html sprite): ses nota (ay tema sanılıyordu), hesap kişi, erişilebilirlik bilgi, King taç
  var AYAR_SIMGE = { gorunum: 'gunes', erisim: 'ipucu', bildirim: 'saat', ses: 'muzik', beden: 'saglik', king: 'king', hesap: 'kisi' };
  var ayarGozcu = null;
  function ayarIzle() {
    if (ayarGozcu) { ayarGozcu.disconnect(); ayarGozcu = null; }
    var menu = $('.ayar-menu'); if (!menu || !kok.IntersectionObserver) return;
    var gorunen = {};
    ayarGozcu = new IntersectionObserver(function (l) {
      l.forEach(function (g) { gorunen[g.target.getAttribute('aria-labelledby')] = g.isIntersecting; });
      var ilk = A.GRUPLAR.filter(function (g) { return gorunen['grup-' + g.id]; })[0];
      if (ilk) [].forEach.call(menu.children, function (a) { if (a.getAttribute('data-grup') === ilk.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }, { rootMargin: '-80px 0px -55% 0px' });
    A.GRUPLAR.forEach(function (g) { var s = d.getElementById('grup-' + g.id); if (s) ayarGozcu.observe(s.closest('section') || s); });
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
  var KILITLI_ASAMA = 'Bu aşama kilitli: önce önceki aşamanın kapısını geç.';
  // Alanın genel bakışı (2026-11-16b, sahip: «bir alana tıklayınca önce neler var, ne yapıyorum göreyim; çok minimalist»).
  // 2026-11-17 (sahip: «nerede olduğumu ve konu listelerini göremiyorum; minimalistlik uğruna ihmal etme»): dört bölüm:
  // (1) nerede olduğun: sıradaki ders, tek ince ilerleme çizgisi, tek ana düğme. (2) Konu haritası (alan/<alan>/harita.json varsa):
  // dallar açılır-kapanır, seçili dal en üstte açık; konular derse bağlıysa bağlantı, değilse «henüz ders yok» + «King'le çalış».
  // (3) Aşamanın üniteleri: adlar « · » ile gruplanmışsa (Akademik: TYT Türkçe …) grup → ünite → dersler; telefonda yalnız şu anki grup açık.
  // (4) Aşamalar (birden çoksa).
  function dar() { return !!(kok.matchMedia && kok.matchMedia('(max-width:640px)').matches); }
  // pencere telefon sınırını geçince grupların varsayılanı yeniden uygulanır (çizim anındaki genişlikte kalmasın)
  if (kok.matchMedia) kok.matchMedia('(max-width:640px)').addEventListener('change', function (e) {
    [].forEach.call(d.querySelectorAll('.konu-gruplari > [data-grup]'), function (g) { g.open = !e.matches || g.getAttribute('data-grup') === 'simdi'; });
  });
  function uniteAcilir(u, ui, ad, simdiki, hepsiAcik, yer_) {
    var okunan = u.dersler.filter(function (x) { return x.okundu; }).length;
    var adim = u.gecti ? 'bitti' : u.id === simdiki ? 'simdi' : u.atlandi ? 'atlandi' : u.acik ? 'acik' : 'kilitli';
    // kilitli üniteler kapalı gelir: ekranda yalnız şimdi işe yarayan dersler görünür (sahibin isteği 2026-11-16: daha az şey)
    return B.acilir({ baslik: ad, acik: u.id === simdiki || (hepsiAcik && u.acik && !u.gecti), veri: { adim: adim, no: String(ui + 1) },
      not: u.gecti ? 'geçildi' : u.atlandi ? 'atlandı' + (yer_ && yer_.etiket ? ' (' + yer_.etiket + ')' : '') + ' · ' + okunan + '/' + u.dersler.length + ' ders' : u.acik ? okunan + '/' + u.dersler.length + ' ders' : 'kilitli',
      // konu başlığı ve ders adları: kısa, özetsiz (özet dersin kendi sayfasında); bir sonraki ders sıradaki kartında
      govde: [u.dersler.length ? B.liste({ ad: u.ad + ' dersleri', tur: 'ders', ogeler: u.dersler.map(function (x, i) {
        return x.acik ? { no: i + 1, baslik: x.ad, durum: x.okundu ? 'okundu' : 'yeni', taslak: x.etiket === 'taslak', href: F() + '/ders/' + x.id } : { no: i + 1, baslik: x.ad, durum: 'kilitli' };
      }) }) : '', B.liste({ ad: u.ad + ' kapısı', ogeler: [kapiSatiri(u.id, 'Ünite kapısı', u.acik, u.kapi)] })] });
  }
  function unitelerHtml(dr, simdiki, yer_) {
    var hepsiAcik = dr.uniteler.length <= 4, gr = uniteGruplari(dr.uniteler), telefon = dar();
    var son = '<div class="yol__son" data-adim="' + (dr.asama.gecti ? 'bitti' : 'kilitli') + '">' + B.bolum({ baslik: 'Aşama kapısı', govde: B.liste({ ad: 'Aşama kapısı', ogeler: [kapiSatiri(dr.asama.id, 'Aşama kapısı', dr.uniteler.every(function (u) { return u.gecti; }), dr.asama.kapi)] }) }) + '</div>';
    if (!gr) return '<div class="yol">' + dr.uniteler.map(function (u, ui) { return uniteAcilir(u, ui, u.ad, simdiki, hepsiAcik, yer_); }).join('') + son + '</div>';
    return '<div class="konu-gruplari">' + gr.map(function (g) {
      var us = g.uniteler.map(function (x) { return x.u; }), simdi = us.some(function (u) { return u.id === simdiki; });
      var ok = 0, top = 0; us.forEach(function (u) { top += u.dersler.length; ok += u.dersler.filter(function (x) { return x.okundu; }).length; });
      var gecti = us.every(function (u) { return u.gecti; });
      // masaüstünde gruplar açık (ünite adları görünür, üniteler kapalı); telefonda yalnız şu anki grup açık
      return B.acilir({ baslik: g.ad, duzey: 3, acik: simdi || !telefon, veri: { grup: gecti ? 'bitti' : simdi ? 'simdi' : 'acik' },
        not: (gecti ? 'geçildi · ' : '') + us.length + ' ünite · ' + ok + '/' + top + ' ders',
        govde: '<div class="yol">' + g.uniteler.map(function (x) { return uniteAcilir(x.u, x.i, x.kisa, simdiki, false, yer_); }).join('') + '</div>' });
    }).join('') + '</div><div class="yol">' + son + '</div>';
  }
  // Ders kimliği → durum (bütün aşamalarda): konu haritasındaki bağlı konular için
  function dersDurumlari(id) {
    var m = {}, a = alanlar[id];
    if (!a || !a.ys) return m;
    a.ys.forEach(function (y, j) {
      Yol.durum(y, kayitOku(id, j + 1)).uniteler.forEach(function (u) { m[u.id] = { unite: true, acik: u.acik, gecti: u.gecti, n: j + 1 }; u.dersler.forEach(function (x) { m[x.id] = x; }); });
    });
    return m;
  }
  function konuSatiri(k, dm, siradakiId) {
    var x = k.ders ? dm[k.ders] : k.unite ? dm[k.unite] : null, ad = '<span class="konu__ad">' + kac(k.ad) + '</span>';
    if (x && x.unite) return x.acik ? '<li><a class="konu konu--bagli" href="' + asamaYolu(x.n) + '">' + ad + '<span class="konu__not">' + (x.gecti ? 'ünite geçildi' : 'ünite') + '</span></a></li>'
      : '<li class="konu konu--kilitli">' + ad + '<span class="konu__not">kilitli ünite</span></li>';
    if (x) return x.acik ? '<li><a class="konu konu--bagli' + (x.okundu ? ' konu--okundu' : '') + '" href="' + F() + '/ders/' + kac(x.id) + '"' + (x.id === siradakiId ? ' aria-current="step"' : '') + '>' + ad +
      '<span class="konu__not">' + (x.okundu ? 'okundu' : x.id === siradakiId ? 'sıradaki ders' : 'ders') + '</span></a></li>'
      : '<li class="konu konu--kilitli">' + ad + '<span class="konu__not">kilitli ders</span></li>';
    return '<li class="konu">' + ad + '<span class="konu__not">henüz ders yok · <a href="#/king" data-king-konu="' + kac(k.ad) + '" data-alan="' + kac(etkinAlan) + '">King’le çalış</a></span></li>';
  }
  function dallarHtml(h, a) {
    var sec = dalOku(depo, etkinAlan), dm = dersDurumlari(etkinAlan), sid = a && a.tur === 'ders' ? a.id : null;
    var l = h.dallar.slice().sort(function (x, y) { return (y.id === sec) - (x.id === sec); });
    return B.bolum({ baslik: 'Konu haritası', id: 'dallar-baslik', govde: '<div class="dallar">' + l.map(function (d) {
      var say = 0, bagli = 0;
      d.bolumler.forEach(function (b) { say += b.konular.length; bagli += b.konular.filter(function (k) { return k.ders || k.unite; }).length; });
      var bu = d.id === sec;
      return B.acilir({ baslik: d.ad, duzey: 3, acik: bu, veri: bu ? { dal: d.id, secili: 'evet' } : { dal: d.id },
        not: (bu ? 'Çalıştığın dal · ' : '') + say + ' konu' + (bagli ? ' · ' + bagli + ' ders' : ''),
        govde: '<div class="dal__ust">' + (d.ozet ? '<p class="dal__ozet">' + kac(d.ozet) + '</p>' : '') +
          (bu ? '<button type="button" class="b-dugme b-dugme--sade dal__sec" data-ac="dal-birak">Dal seçimini kaldır</button>'
            : '<button type="button" class="b-dugme dal__sec" data-ac="dal-sec" data-dal="' + kac(d.id) + '">Bu dalı çalış</button>') + '</div>' +
          d.bolumler.map(function (b) { return '<section class="dal__bolum"><h4 class="dal__bolum-ad">' + kac(b.ad) + '</h4><ul class="dal__konular">' + b.konular.map(function (k) { return konuSatiri(k, dm, sid); }).join('') + '</ul></section>'; }).join('') });
    }).join('') + '</div>' });
  }
  function sayfaAlan(yer) {
    var f = al(), dr = fDurum(), ic, a = dr && siradaki(dr), sonraki = null, yeni = false;
    if (!(etkinAlan in haritalar)) haritaIste(etkinAlan);
    var hr = haritalar[etkinAlan] || null;
    if (!f) ic = '<div class="b-iskelet" aria-busy="true"><span class="gizli">Yükleniyor…</span><i></i><i></i><i></i></div>';
    else if (f.hata) ic = B.bos({ baslik: 'Yol haritası bu açılışta gösterilemiyor.', metin: f.hata === 'motor' ? 'Yol aracı yüklenemedi.' : 'Sayfa dosyadan açıldı; içerik Başbuğ sunucusuyla açılınca yüklenir.' });
    else if (!dr.asama.acik) ic = asamaBasligi('Aşama ' + f.n, dr.asama.ad) + B.bos({ baslik: KILITLI_ASAMA }) + (hr ? dallarHtml(hr, null) : '') + asamalarHtml(f.n);
    else {
      var il = dr.ilerleme, simdiki = a && (a.tur === 'kapi' ? a.id : f.y.ust[a.id]), yer_ = dr.asama.yerlestirme;
      if (dr.asama.gecti) sonraki = asamaListe(etkinAlan).filter(function (x) { return x.n === f.n + 1 && x.acik; })[0] || null;
      yeni = a && alanYeni(etkinAlan);
      ic = siraKarti(f, dr, a, { yeni: yeni, sonraki: sonraki }) + (hr ? dallarHtml(hr, a) : '') +
        B.bolum({ baslik: (hr ? 'Dersler · ' : '') + 'Aşama ' + f.n + ' · ' + dr.asama.ad, id: 'asama-ad', govde: [
          f.y.veri.hedef ? '<p class="konular__hedef">' + kac(f.y.veri.hedef) + '</p>' : '',
          il.atlananUnite ? '<p class="soluk">' + il.atlananUnite.deger + ' ünite atlandı (' + il.atlananUnite.etiket + ')</p>' : '',
          yer_ && yer_.uretim === 'bekliyor' ? B.uyari({ tur: 'dikkat', metin: 'Yerleştirme tahmini; üretim görevi bekliyor.' }) : '',
          unitelerHtml(dr, simdiki, yer_)] }) +
        asamalarHtml(f.n);
    }
    var dal = seciliDal(etkinAlan);
    return ust(kirinti(yer)) + '<div class="govde">' + B.baslik({ metin: yer.ad, alt: dal ? 'Çalıştığın dal: ' + dal.ad : yer.aciklama }) + ic +
      B.eylemler([yer.eski ? { metin: 'Eski ' + yer.ad + ' sayfası', tur: 'sade', href: eskiYol(yer.eski) } : null]) + '</div>';
  }
  // Nerede olduğun: konum satırı (ünite, ders n/N), sıradaki dersin adı, tek ince ilerleme çizgisi ve tek ana düğme.
  // o.alan: Öğren sayfasında alanın adı da yazılır. o.yeni: hiç başlanmamış alanda «Seviyemi bul» küçük ikincil bağlantı (kendiliğinden açılmaz).
  // Adım yoksa (aşama bitti) «Aşama tamamlandı» ve varsa sonraki aşamaya düğme.
  function siraKarti(f, dr, a, o) {
    o = o || {};
    var il = dr.ilerleme.okunanDers, kapi = a && a.tur === 'kapi', og = a ? f.y.oge[a.id] || {} : {}, u = kapi ? og : a ? f.y.oge[f.y.ust[a.id]] || {} : {};
    var ud = (u.dersler || []).map(function (x) { return x && x.id || x; }), alanAd = o.alan ? H.bul(etkinAlan).ad + ' · ' : '';
    var konum = !a ? alanAd + 'Aşama ' + f.n : kapi ? alanAd + (u.ad || 'Ünite') + ' · ünite kapısı' : alanAd + (u.ad || '') + (ud.length ? ' · ders ' + (ud.indexOf(a.id) + 1) + '/' + ud.length : '');
    var baslik = !a ? (dr.asama.gecti ? 'Aşama tamamlandı' : dr.asama.ad) : kapi ? 'Ünitenin kapı sınavı' : og.ad || '';
    var eylem = a ? { metin: il && il.deger ? 'Devam et' : 'Başla', tur: 'ana', href: adimYolu(a) } : o.sonraki ? { metin: 'Sonraki aşama', tur: 'ana', href: asamaYolu(o.sonraki.n) } : null;
    return '<section class="sira" aria-labelledby="alan-sira"><p class="sira__ust">' + kac(konum) + '</p>' +
      '<h2 class="sira__baslik" id="alan-sira">' + kac(baslik) + '</h2>' +
      (il && il.toplam ? '<div class="sira__cizgi">' + B.ilerleme({ ad: 'Okunan ders', deger: il.deger, toplam: il.toplam }) + '</div>' : '') +
      '<div class="sira__eylem">' + B.eylemler([eylem]) + (o.yeni ? '<a class="sira__ikincil" href="' + F() + '/yer/1" data-yer-bul="">Biliyorsan: seviyemi bul</a>' : '') + '</div></section>';
  }
  // Ders sayfasının konumu: Alan › Ünite › ders n/N (alan bağlantı, ünite ve sıra düz yazı)
  function dersKirinti(y, id) {
    var u = y.oge[y.ust[id]] || {}, l = (u.dersler || []).map(function (x) { return x && x.id || x; }), ay = '<span class="kirinti__ayrac" aria-hidden="true">/</span>';
    return '<a class="kirinti" href="' + F() + '"><span aria-hidden="true">‹ </span>' + kac(H.bul(etkinAlan).ad) + '</a>' + ay +
      (u.ad ? '<span class="konum__ara">' + kac(u.ad) + '</span>' + ay : '') + '<span>Ders ' + (l.indexOf(id) + 1) + ' / ' + l.length + '</span>';
  }
  function altKirinti(ad) {
    return '<a class="kirinti" href="' + F() + '"><span aria-hidden="true">‹ </span>' + kac(H.bul(etkinAlan).ad) + '</a><span class="kirinti__ayrac" aria-hidden="true">/</span><span>' + kac(ad) + '</span>';
  }
  // kırıntı ad: kilitli sayfada «Kilitli ders/kapı/aşama», bulunamayanda «Bulunamadı» (2026-11-16b: «Bulunamadı» kilitli derste yanıltıyordu)
  function yok(metin, kad) {
    return ust(altKirinti(kad || 'Bulunamadı')) + '<div class="govde">' + B.bos({ baslik: metin, eylem: { metin: H.bul(etkinAlan).ad + ' sayfasına dön', tur: 'ana', href: F() } }) + '</div>';
  }
  // inceleme (Onaylar ekranı): kaynaklar açık, yolu ve satırıyla; doğrulanmamış kaynak varsa «kaynaklar doğrulanmadı» notu
  function kaynaklar(y, idler, inceleme, not) {
    var ad = {}; (y.veri.kaynaklar || []).forEach(function (k) { ad[k.id] = k; });
    var l = (idler || []).filter(function (i) { return ad[i]; }), dg = l.filter(function (i) { return ad[i].dogrulama === 'dogrulanmamis'; }).length;
    // künye kısaltılmasın diye düz liste (satır taşı tek satıra keser)
    return (inceleme && dg ? B.uyari({ tur: 'dikkat', metin: 'Kaynaklar doğrulanmadı: ' + l.length + ' kaynaktan ' + dg + ' tanesi henüz kontrol edilmedi.' }) : '') +
      (l.length || not ? B.acilir({ baslik: l.length ? 'Kaynaklar (' + l.length + ')' : 'Kaynak notu', acik: !!inceleme, govde: (not ? '<p class="soluk">' + kac(not) + '</p>' : '') + '<ul>' + l.map(function (i) {
        var k = ad[i], yer = inceleme ? [k.yol, k.bolum, k.satir ? 'satır ' + k.satir : ''].filter(Boolean).join(' · ') : '';
        return '<li>' + kac(k.ad) + (k.dogrulama === 'dogrulanmamis' ? ' <span class="soluk">· doğrulanmamış</span>' : '') + (yer ? '<br><span class="soluk">' + kac(yer) + '</span>' : '') + '</li>';
      }).join('') + '</ul>' }) : '');
  }
  function soruHtml(a, kayit) {
    var c = kayit.cevaplar[a.id], son = c && c[c.length - 1];
    if (a.tur !== 'secmeli') {
      return B.soru({ soru: a.soru, veri: { soru: a.id }, govde: [B.alan({ ad: 'Cevabın', isim: 'cevap-' + a.id.replace(/[^\w-]/g, '-'), tur: 'cok', deger: son ? son.cevap : '', yerTutucu: 'Kendi cümlelerinle birkaç satır yaz' }),
        B.eylemler([{ metin: 'Kaydet', veri: { ac: 'acik-kaydet' } }, { yazi: 'Puanlanmaz; kendin değerlendirirsin.' }])],
        sonuc: son ? { baslik: 'Kaydedildi.', maddeler: a.olcut, not: a.dogru ? 'Örnek cevap: ' + a.dogru : '' } : null });
    }
    return B.soru({ soru: a.soru, veri: { soru: a.id }, secenekler: a.sec, secili: son ? son.cevap : null, dogru: son ? a.dogru : null,
      sonuc: son ? { baslik: son.dogru ? 'Doğru.' : 'Yanlış.', metin: a.cozum ? a.cozum.join(' ') : '' } : null });
  }
  // dersin öğrenenin gördüğü metni (Onaylar ekranı da bunu çizer; inceleme: kaynaklar açık)
  function dersMetni(y, x, inceleme) {
    return B.baslik({ metin: x.ad }) +
      (Yol.etiket(x) === 'taslak' ? B.uyari({ tur: 'dikkat', metin: 'Taslak: bu ders henüz onaylanmadı; tekrara girmez.' }) : '') +
      '<p class="ders__ozet">' + kac(x.ozet) + '</p>' + (x.metin || []).map(function (m) { return '<p>' + kac(m) + '</p>'; }).join('') +
      (x.not && inceleme ? B.uyari({ tur: 'bilgi', metin: 'Kaynak notu: ' + x.not }) : '') + kaynaklar(y, x.kaynak, inceleme, inceleme ? '' : x.not);
  }
  function sayfaDers(id) {
    if (!al()) return ust(altKirinti('Ders')) + '<div class="govde"><div class="b-iskelet" aria-busy="true"><span class="gizli">Yükleniyor…</span><i></i><i></i><i></i></div></div>';
    var y = al().y, x = y && y.tur[id] === 'ders' && y.oge[id];
    if (!x) return yok(al().hata ? 'Ders içeriği bu açılışta yüklenemedi.' : 'Böyle bir ders yok.');
    var kayit = kayitOku();
    if (!Yol.acikMi(y, kayit, id)) return yok(Yol.acikMi(y, kayit, y.id) ? 'Bu ders kilitli: önce önceki dersi oku ya da ünite kapısını geç.' : KILITLI_ASAMA, Yol.acikMi(y, kayit, y.id) ? 'Kilitli ders' : 'Kilitli aşama');
    var okundu = !!kayit.dersler[id], n = x.alistirmalar.length;
    var cevap = x.alistirmalar.filter(function (a) { var c = kayit.cevaplar[a.id]; return c && c.length; }).length;
    var adim = okundu ? 3 : n && cevap >= n ? 2 : n && cevap ? 1 : 0; // 0 oku, 1 alıştır, 2 bitir, 3 bitti
    return ust(dersKirinti(y, id)) + '<article class="govde ders">' + dersAdimlari(adim, n) + dersMetni(y, x) +
      (n ? B.bolum({ baslik: 'Kendini dene', id: 'ders-alistir',
        govde: ['<p class="soluk ders__sayac">Okuduğunu ' + n + ' soruyla dene · ' + cevap + ' / ' + n + ' cevaplandı</p>'].concat(x.alistirmalar.map(function (a, i) { return '<div class="ders__soru" data-no="' + (i + 1) + '/' + n + '">' + soruHtml(a, kayit) + '</div>'; })) }) : '') +
      // bos: cevaplanmamış alıştırma sayısı; Bitir önce yumuşakça sorar (tik › okudum). Konum satırı alana döner: ayrı «Yol haritası» düğmesi yok.
      '<div class="ders__bitir">' + B.eylemler([{ metin: okundu ? 'Sıradaki' : 'Bitir, sıradakine geç', tur: 'ana', veri: { ac: 'okudum', ders: id, bos: okundu ? '0' : String(n - cevap) } }, { metin: "King'le çalış", tur: 'sade', href: '#/king', veri: { 'king-calis': id } }]) + '</div></article>'; // king-sohbet.js: ders bağlamıyla açar
  }
  // Dersin üç adımı: oku, alıştır, bitir. Şimdiki adım vurgulu, geçilenler ✓ (renk tek başına değil).
  function dersAdimlari(adim, n) {
    var l = n ? ['Oku', 'Alıştır', 'Bitir'] : ['Oku', 'Bitir'], k = n ? adim : Math.min(adim, 1) + (adim === 3 ? 1 : 0);
    return '<ol class="ders-adim" aria-label="Dersin adımları">' + l.map(function (ad, i) {
      var d = i < k ? 'bitti' : i === k ? 'simdi' : 'sonra';
      return '<li class="ders-adim__oge" data-adim="' + d + '"' + (d === 'simdi' ? ' aria-current="step"' : '') + '><span class="ders-adim__no" aria-hidden="true">' + (d === 'bitti' ? '✓' : i + 1) + '</span>' + ad + (d === 'bitti' ? '<span class="gizli"> (tamam)</span>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  var kapiSonuc = null; // son denemenin sonucu, yalnız hemen ardından gösterilir
  function sayfaKapi(id) {
    if (!al()) return ust(altKirinti('Kapı')) + '<div class="govde"><div class="b-iskelet" aria-busy="true"><span class="gizli">Yükleniyor…</span><i></i><i></i><i></i></div></div>';
    var y = al().y, t = y && y.tur[id], o = y && (t === 'unite' || t === 'asama') && y.oge[id];
    if (!o) return yok(al().hata ? 'Kapı bu açılışta yüklenemedi.' : 'Böyle bir kapı yok.');
    var kayit = kayitOku(), dr = Yol.durum(y, kayit), ad = t === 'asama' ? 'Aşama kapısı' : o.ad + ' · kapı';
    if (!dr.asama.acik) return yok(KILITLI_ASAMA, 'Kilitli aşama');
    if (!Yol.acikMi(y, kayit, id) || (t === 'asama' && !dr.uniteler.every(function (u) { return u.gecti; }))) {
      return yok(t === 'asama' ? 'Aşama kapısı, bütün ünite kapıları geçilince açılır.' : 'Bu ünite kilitli: önce önceki ünitenin kapısını geç.', 'Kilitli kapı');
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
    if (!f) return ust(altKirinti(ad)) + '<div class="govde"><div class="b-iskelet" aria-busy="true"><span class="gizli">Yükleniyor…</span><i></i><i></i><i></i></div></div>';
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
    if (!alanYeni(etkinAlan)) return yok('Seviye yalnız hiç başlanmamış alanda bulunur; bu alanda kaydın var.', ad);
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

  var sayfaEl, YOK_YER = { id: 'yok', ad: 'Bu sayfa yok', katman: 'kabuk', dal: 'ana', yol: '' };
  function rota() {
    // «#/alan/tarih/ders/x», «#/motor/not/yeni»: ilk üç parça yerin yolu, kalanı o sayfanın alt yolu
    var h = location.hash || '#/bugun', parca = h.split('?'), alt = /^(#\/(?:(?:alan|motor)\/[a-z-]+|onay))\/([\w./-]+)$/.exec(parca[0]), taban = alt ? alt[1] : parca[0];
    var bilinen = H.YERLER.filter(function (y) { return y.yol === taban; })[0], yok_ = !bilinen && /^#\/./.test(taban);
    // bilinmeyen adres sessizce Bugün'e düşmez (2026-11-16b): sade «Bu sayfa yok»; adressiz ya da «#/» Bugün'dür
    var yer = bilinen || (yok_ ? YOK_YER : H.bul('bugun'));
    simdiYer = yer;
    var html, tasindi = yer.katman === 'alan' && yer.asama, fa = alt && tasindi && /^(ders|kapi|asama|yer)\/([\w.-]+)$/.exec(alt[2]), ek = Kabuk.ek && Kabuk.ek[yer.id];
    kapakYer = KAPAK[yer.id] && (!alt || (fa && fa[1] === 'asama')) ? yer : null;
    if (tasindi) { etkinYap(yer.id); if (!al()) alanYukle(yer.id).then(function () { if (sayfaEl.getAttribute('data-yer') === yer.id) rota(); }); }
    // aşama: «asama/2» ya da ders/kapı kimliğinin ikinci parçası (felsefe.2.1.3 → 2)
    if (fa) { var an = +(fa[1] === 'asama' ? fa[2] : fa[2].split('.')[1]); if (an >= 1) seciliAsama[yer.id] = an; }
    if (yok_) html = cubuk(false) + '<div class="govde govde--yok">' + B.bos({ baslik: 'Bu sayfa yok', metin: 'Adres değişmiş ya da yanlış yazılmış olabilir.', eylem: { metin: 'Bugün\'e dön', tur: 'ana', href: '#/bugun' } }) + '</div>';
    else if (fa && fa[1] === 'asama') html = sayfaAlan(yer);
    else if (fa && fa[1] === 'yer') html = sayfaYerlestir(fa[2]);
    else if (fa) html = fa[1] === 'ders' ? sayfaDers(fa[2]) : sayfaKapi(fa[2]);
    else if (ek) html = ek(yer, alt ? alt[2] : '');
    else if (yer.id === 'bugun') html = sayfaBugun();
    else if (yer.id === 'harita') html = sayfaHarita(yer);
    else if (yer.id === 'king') html = ust(kirinti(yer)) + '<div class="govde" data-sayfa="king">' + kingGovde(B) + '</div>';
    else if (yer.id === 'ayarlar') html = sayfaAyarlar(yer, parca[1] && decodeURIComponent(parca[1]));
    else if (tasindi) html = sayfaAlan(yer);
    else if (H.DAL_SAYFASI[yer.dal] === yer.id && yer.dal !== 'king') html = sayfaDal(yer);
    else html = sayfaYer(yer);
    var once = sayfaEl.getAttribute('data-yer'), onceYol = sayfaEl.getAttribute('data-yol'), yeniSayfa = once !== yer.id || onceYol !== parca[0];
    // data-yer hemen yazılır (eşzamansız yüklemeler «hâlâ bu sayfa mı?» diye ona bakar); görünüm işareti data-ciz çizimle birlikte.
    // data-yol: sayfanın adresi (sorgusuz); aynı yerde başka sayfaya geçmek (alan → ders) de yeni sayfadır.
    sayfaEl.setAttribute('data-yer', yer.id); sayfaEl.setAttribute('data-yol', parca[0]);
    var sira = ++cizSira;
    function yaz() {
      if (sira !== cizSira) return; // geçişin bekleyen çizimi, ondan sonra gelen daha yeni çizimin üstüne yazmaz
      var yukleniyordu = !yeniSayfa && !!sayfaEl.querySelector('[aria-busy="true"]'); // «Yükleniyor…»un yerine gelen asıl içerik bir kez süzülür
      var gecen = !yeniSayfa && !yukleniyordu && sayfaEl.classList.contains('canlan') ? canlanAni() : null;
      // geçişle gelen yeni sayfa: süzülme sınıfı içerik yazılmadan önce konur, böylece stil bir kez hesaplanır (sonradan konunca
      // bütün sayfa ikinci kez hesaplanıyordu: 4× yavaş CPU'da ~45 ms). Bu kipte kapak ve başlık bloğu hareket etmez, kapakPay ölçüsü bozulmaz.
      var erken = gecisli && yeniSayfa;
      if (erken) canlan(true);
      sayfaEl.innerHTML = html;
      if (pay) { var ph = sayfaEl.querySelector(pay.hedef); if (ph) ph.style.viewTransitionName = 'paylasilan'; }
      sayfaEl.setAttribute('data-ciz', yer.id);
      d.title = yer.ad + ' · Başbuğ';
      altCubukYaz(yer);
      kapakPay(); manzara();
      // Yeni sayfa bir kez süzülür. Aynı sayfanın yeniden çizimi (veri geldi, hesap yüklendi, tıklandı) süzülmeyi baştan oynatmaz:
      // yeni öğelerin hareketleri kaldığı ana sarılır (innerHTML öğeleri yeniler, CSS hareketi sıfırdan başlardı: «animasyon tekrarlıyor»).
      if (yeniSayfa || yukleniyordu) { if (!erken) canlan(gecisli && yeniSayfa); } else if (gecen != null) surdur(gecen);
    }
    // Bölüm değişince görünüm geçişi (tarayıcı destekliyorsa ve hareket açıksa): içerik gidilen yöne kayarak söner, üst çubuk yerinde kalır,
    // seçili sekmenin işareti yenisine akar. Aynı sayfanın yeniden çizimi (tıklama, yazma) anında olur.
    var gecisli = !!(once && yeniSayfa && d.startViewTransition && !d.hidden && hareketVar()); // gizli sekme çizmez: geçiş zaman aşımına düşerdi
    var pay = null; paylas = null; // paylaşılan öğe (uçan simge) kapalı: sahibin isteği 2026-11-16, geçiş tek ve sakin; ikinci hareket yavaş makinede takılıyordu
    if (gecisli) {
      if (pay) pay.el.style.viewTransitionName = 'paylasilan';
      d.documentElement.setAttribute('data-gecis', once === yer.id ? (parca[0].split('/').length >= String(onceYol).split('/').length ? 'ileri' : 'geri') : yon(once, yer));
      d.documentElement.setAttribute('data-gecis-tur', gecisTuru(once, onceYol, yer, parca[0]));
      var g = d.startViewTransition(yaz), u = bekleyenCizim = g.updateCallbackDone.catch(function () {});
      u.then(function () { if (bekleyenCizim === u) bekleyenCizim = null; });
      g.ready.catch(function () { /* üst üste gelen geçişte öncekinin atlanması olağan */ });
      g.finished.then(gecisBitti, gecisBitti);
    } else yaz();
    return yer;
  }
  var cizSira = 0, bekleyenCizim = null;
  // Ekranlara verilen alan yüklemesi, bekleyen geçişin çizimi bitince çözülür: «sayfa hâlâ açık mı?» diye ekrana bakan
  // eşzamansız yeniden çizimler (deneme, araçlar, onay) yeni sayfanın öğelerini görür.
  function alanYukleCizimle(id) { return alanYukle(id).then(function (v) { return bekleyenCizim ? bekleyenCizim.then(function () { return v; }) : v; }); }
  // Geçişin türü: derse başlamak («ders»: sayfa öne açılır), ana bölüm değişimi («buyuk»), bölüm içinde derinleşme/dönüş («kucuk»)
  function gecisTuru(onceId, onceYol, yer, yol) {
    var dersYeni = /\/ders\//.test(yol), dersOnce = /\/ders\//.test(String(onceYol || ''));
    if (dersYeni && !dersOnce) return 'ders';
    var a = sekmeOf(H.YERLER.filter(function (y) { return y.id === onceId; })[0]), b = sekmeOf(yer);
    return onceId !== yer.id && a !== b ? 'buyuk' : 'kucuk';
  }
  function gecisBitti() {
    d.documentElement.removeAttribute('data-gecis'); d.documentElement.removeAttribute('data-gecis-tur');
    var p = sayfaEl.querySelector('[style*="view-transition-name"]'); if (p) p.style.viewTransitionName = '';
  }
  // Paylaşılan öğe: tıklanan kart açtığı sayfanın başına akar (kabuk.css ::view-transition-group(paylasilan)). Alan kartı ya da simgeli
  // satır → kapak simgesi; «Sıradaki»nin ve Bugün karşılamasının ana düğmesi → açılan dersin (kapının) başlığı. Ad yalnız geçiş boyunca durur.
  var paylas = null;
  function paylasKaynak(a) {
    var s = a.matches('.b-karsilama__alan, a.b-satir') && a.querySelector('.b-simge');
    if (s) return { el: s, hedef: '.kapak__simge .b-simge' };
    var k = a.classList.contains('b-dugme--ana') && a.closest('.sira, .b-karsilama'), b = k && k.querySelector('.sira__baslik, .b-karsilama__sira');
    return b ? { el: b, hedef: '.govde h1' } : null;
  }
  // kabuk.css'teki --sure kuralının aynısı (data-hareket az; sistem + «hareketi azalt»). getComputedStyle değil: her geçişte ve sahnenin
  // her karesinde (125 ms) bütün stili zorla yeniden hesaplatıyordu (2026-11-17b ölçümü)
  function hareketVar() { var h = kokEl.getAttribute('data-hareket'); return h !== 'az' && !(h === 'sistem' && !!kok.matchMedia && kok.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  // Yön: üst sekmelerde sağa giderken ileri, sola geri; sekme dışı yerlerde (ders, ayarlar…) derinleşme ileri, sekmeye dönüş geri
  function yon(onceId, yer) {
    var sira = sekmeler().map(function (y) { return y.id; }), a = sira.indexOf(sekmeOf(H.YERLER.filter(function (y) { return y.id === onceId; })[0])), b = sira.indexOf(sekmeOf(yer));
    if (a >= 0 && b >= 0 && a !== b) return b > a ? 'ileri' : 'geri';
    return sira.indexOf(yer.id) >= 0 ? 'geri' : 'ileri';
  }
  // Yeni sayfaya girişte listeler sırayla süzülür (kabuk.css .canlan); aynı sayfanın yeniden çizimi süzülmez.
  // Görünüm geçişiyle gelindiyse sayfanın kendisi zaten kayarak geldi; yalnız listeler süzülür (canlan--gecis), sayfa ikinci kez belirmez.
  var canlanSaat = null;
  function sonlu(a) { var t = a.effect && a.effect.getComputedTiming && a.effect.getComputedTiming(); return !!t && t.iterations !== Infinity; } // gece nefesi gibi sürekli hareketler hariç
  // Süzülmenin şimdiki anı: eski öğelerin hareketlerinden okunur (hepsi canlan sınıfıyla aynı anda başladı). Saat farkı değil, çünkü
  // görünüm geçişi ya da gizli sekme hareketin başlamasını geciktirir; okunamazsa (eski tarayıcı) -1: hiç oynatmamak, baştan oynatmaktan iyi.
  function canlanAni() {
    if (!sayfaEl.getAnimations) return -1;
    return sayfaEl.getAnimations({ subtree: true }).filter(sonlu).reduce(function (m, a) { return Math.max(m, a.currentTime || 0); }, 0);
  }
  function surdur(gecen) {
    if (gecen < 0) return sayfaEl.classList.remove('canlan', 'canlan--gecis');
    sayfaEl.getAnimations({ subtree: true }).filter(sonlu).forEach(function (a) { if (a.currentTime != null && a.currentTime < gecen) a.currentTime = gecen; });
  }
  function canlan(gecisli) {
    clearTimeout(canlanSaat); sayfaEl.classList.add('canlan'); sayfaEl.classList.toggle('canlan--gecis', !!gecisli);
    canlanSaat = setTimeout(function () { sayfaEl.classList.remove('canlan', 'canlan--gecis'); }, 1000);
  }
  function git(yol) { if (location.hash === yol) rota(); else location.hash = yol; }
  function sesCal(tur) { if (Kabuk.Ses && Kabuk.Ses.cal) try { Kabuk.Ses.cal(tur); } catch (e) { /* ses yoksa sessiz */ } }

  /* ---------------- halka ---------------- */
  var HALKA_SIMGE = { bugun: 'gunes', ogren: 'ogren', saglik: 'saglik', not: 'not', king: 'king', harita: 'harita', plan: 'plan', ayarlar: 'kisi' };
  var halkaEl, perdeEl, komutEl, oncekiOdak = null, secili = -1;
  function halkaAc(x, y) {
    oncekiOdak = d.activeElement;
    // dikey yarıçap r, yatay rx (hap düğmeler geniş: yatayda daha açık durur); ikisi de ekrana sığar, hap yarı genişliği ~70 px
    var w = innerWidth, hh = innerHeight, r = Math.max(80, Math.min(140, hh / 2 - 60)), rx = Math.max(90, Math.min(r * 1.35, w / 2 - 80));
    x = x == null ? w / 2 : Math.min(Math.max(x, rx + 74), w - rx - 74);
    y = y == null ? hh / 2 : Math.min(Math.max(y, r + 34), hh - r - 34);
    if (w < 2 * rx + 148) x = w / 2;
    halkaEl.style.setProperty('--x', x + 'px'); halkaEl.style.setProperty('--y', y + 'px'); halkaEl.style.setProperty('--r', r + 'px'); halkaEl.style.setProperty('--rx', rx + 'px');
    perdeEl.hidden = false; halkaEl.hidden = false; secili = -1;
    try { getSelection().removeAllRanges(); } catch (e) { /* yok */ }
    requestAnimationFrame(function () { halkaEl.classList.add('b-halka--acik'); perdeEl.classList.add('acik'); });
    sesCal('ac');
  }
  function halkaKapat(odakDon) {
    if (halkaEl.hidden) return;
    halkaEl.classList.remove('b-halka--acik'); perdeEl.classList.remove('acik'); halkaEl.hidden = true; perdeEl.hidden = true;
    halkaSec(-1);
    if (odakDon !== false && oncekiOdak && oncekiOdak.focus) oncekiOdak.focus();
  }
  function halkaOgeleri() { return [].slice.call(halkaEl.querySelectorAll('.b-halka__oge')); }
  function halkaSec(i) {
    secili = i; halkaOgeleri().forEach(function (b, j) { b.classList.toggle('b-halka__oge--secili', j === i); });
    halkaEl.classList.toggle('b-halka--secili', i >= 0); // merkez seçili yöne bakar
    if (i >= 0) halkaEl.style.setProperty('--sa', halkaOgeleri()[i].style.getPropertyValue('--a'));
  }
  // halka açıkken fare yalnız gezinse de (basılı değil) yönü seçer; ortadaysa seçim yok
  function halkaYon(e) {
    if (halkaEl.hidden || e.pointerType !== 'mouse') return;
    var cx = parseFloat(halkaEl.style.getPropertyValue('--x')), cy = parseFloat(halkaEl.style.getPropertyValue('--y'));
    var dx = e.clientX - cx, dy = e.clientY - cy, n = halkaOgeleri().length;
    if (Math.hypot(dx, dy) < 32) return halkaSec(-1);
    halkaSec(Math.floor(((Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360 + 180 / n) % 360) / (360 / n)));
  }
  // Boş bir yere sağ tık da halkayı imlecin yerinde açar (yazı, bağlantı, alan üstünde tarayıcının kendi menüsü kalır)
  function sagTik(e) {
    if (!halkaEl.hidden) return e.preventDefault();
    if (kok.matchMedia && matchMedia('(hover: none)').matches) return; // dokunmatikte uzun basış tarayıcınındır; gezinme alt çubukta
    if (!komutEl.hidden || e.target.closest(ETKILESIMLI + ',p,h1,h2,h3,li,img,canvas,svg,pre,code,dd,dt,td,th')) return;
    var s = ''; try { s = String(getSelection()); } catch (x) { /* yok */ }
    if (s) return;
    e.preventDefault(); halkaAc(e.clientX, e.clientY);
  }

  /* ---------------- telefonda alt çubuk ---------------- */
  // Dar ekranda (≤ 640 px) üst sekmelerin yerine kalıcı alt çubuk: halkanın beş yeri, büyük dokunma hedefi, güvenli alan payı (kabuk.css).
  // Masaüstündeki alttan çıkan rıhtım ve boş yerde basılı tutma kalktı (2026-11-16b, sahip: «çok fazla özellik»): halka sağ tık ve Ctrl . ile açılır.
  var altEl = null;
  function altCubukYaz(yer) {
    if (!altEl) return;
    var se = yer && yer.id !== 'yok' ? sekmeOf(yer) : '';
    [].forEach.call(altEl.children, function (a) { if (a.getAttribute('data-yer') === se) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  }
  // Kaydırınca üst çubuk gizlenir, yukarı kaydırınca döner; sayfa başında hep görünür. Telefonda alt çubuk aynı anda küçülür.
  // Eşik 6 px: yavaş kaydırmada titremesin. Hareket azsa geçiş süresi 0 (CSS --sure), çubuk anında gider gelir.
  var kayY = 0;
  function kaydir() {
    var y = scrollY, k = kokEl.classList;
    k.toggle('ust-kaydi', y > 8);
    if (y < 64) { k.remove('ust-gizli'); kayY = y; return; }
    if (Math.abs(y - kayY) < 6) return;
    k.toggle('ust-gizli', y > kayY); kayY = y;
  }
  var ETKILESIMLI = 'a,button,input,select,textarea,label,summary,[contenteditable],[role="dialog"],.b-halka';

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
    sonuc = katla(q) ? komutSonucu(q, ogeler) : ogeler.filter(function (o) { var y = o.tur === 'yer' && H.bul(o.id); return y && (y.halka || y.id === 'ayarlar'); });
    etkin = 0;
    var liste = $('#komut-liste'), g = $('input', komutEl);
    liste.innerHTML = B.komutListe({ id: 'komut', ogeler: sonuc });
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
    var satirEl = b.closest('.b-ayar'); satirEl.outerHTML = A.ciz(A.tanim(a), A.oku(depo, a));
    var yeni = $('[data-ayar-satir="' + a + '"] [data-deger="' + v + '"]'); if (yeni) yeni.focus();
  }
  // Boş = girilmedi (null); aralık dışı yazılmaz ve alan geçersiz işaretlenir, eski değer depoda kalır.
  function sayiYaz(el) {
    var ham = el.value.trim(), v = ham === '' ? null : Number(ham.replace(',', '.'));
    var ok = A.yaz(depo, el.getAttribute('data-ayar'), v);
    if (ok) el.removeAttribute('aria-invalid'); else el.setAttribute('aria-invalid', 'true');
  }
  function aralikYaz(el) {
    var a = el.getAttribute('data-ayar'), s = el.closest('.b-ayar'), v = A.oku(depo, a);
    v.acik = $('[data-parca="acik"]', s).checked; v.bas = $('[data-parca="bas"]', s).value; v.bit = $('[data-parca="bit"]', s).value;
    A.yaz(depo, a, v);
  }
  function tik(e) {
    var t = e.target;
    var ac = t.closest('[data-ac]');
    if (ac) {
      var n = ac.getAttribute('data-ac');
      if (n === 'komut') return komutAc();
      if (n === 'dal-sec' || n === 'dal-birak') { dalYaz(depo, etkinAlan, n === 'dal-sec' && ac.getAttribute('data-dal')); rota(); return; }
      if (n === 'halka') return halkaAcOdakli();
      if (n === 'okudum') return +ac.getAttribute('data-bos') && !ac.hasAttribute('data-yine') ? bitirSor(ac) : dersBitir(ac.getAttribute('data-ders'));
      if (n === 'alistirmaya') { rota(); var al_ = $('#ders-alistir'); if (al_) al_.scrollIntoView({ block: 'start' }); return; }
      if (n === 'acik-kaydet') { var sk = ac.closest('.b-soru'); return soruCevapla(sk.getAttribute('data-soru'), $('textarea', sk).value.trim()); }
      if (n === 'sifirla') { if (confirm('Bütün ayarlar varsayılana dönsün mü?')) { A.sifirla(depo); uygula(); rota(); } return; }
    }
    var cv = t.closest('.b-soru[data-soru] [data-h]:not([aria-disabled="true"])'); if (cv) return soruCevapla(cv.closest('.b-soru').getAttribute('data-soru'), cv.getAttribute('data-h'));
    var hb = t.closest('.b-halka__oge'); if (hb) { var y = hb.getAttribute('data-yol'); halkaKapat(false); return git(y); }
    var li = t.closest('#komut-liste [data-i]'); if (li) return calistir(sonuc[+li.getAttribute('data-i')]);
    if (t === perdeEl || t === halkaEl) {
      // halkada bir yön seçiliyken diskin içine tıklamak o yere gider; dışarı tıklamak kapatır
      if (!halkaEl.hidden && secili >= 0 && Math.hypot(e.clientX - parseFloat(halkaEl.style.getPropertyValue('--x')), e.clientY - parseFloat(halkaEl.style.getPropertyValue('--y'))) <= parseFloat(halkaEl.style.getPropertyValue('--r')) + 38) {
        var sy = halkaOgeleri()[secili].getAttribute('data-yol'); halkaKapat(false); return git(sy);
      }
      halkaKapat(); komutKapat(); return;
    }
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
  // Alıştırmalar cevaplanmadan «Bitir»: yumuşak onay (2026-11-16b). Yerinde tek satır ve iki düğme; ikincisi alıştırmalara döner.
  function bitirSor(ac) {
    var bos = +ac.getAttribute('data-bos'), id = ac.getAttribute('data-ders'), k = ac.closest('.ders__bitir');
    k.innerHTML = '<p class="ders__sor" role="status">' + (bos === 1 ? 'Bir alıştırma' : bos + ' alıştırma') + ' henüz cevaplanmadı. Yine de bitirilsin mi?</p>' +
      B.eylemler([{ metin: 'Yine de bitir', tur: 'ana', veri: { ac: 'okudum', ders: id, bos: String(bos), yine: '1' } }, { metin: 'Alıştırmalara dön', tur: 'sade', veri: { ac: 'alistirmaya' } }]);
    var b = $('[data-yine]', k); if (b) b.focus();
  }
  // Kapı ve yerleştirme: boş soruyla gönderirken bir kez «Yine de gönder?» (boş bırakılan yanlış sayılır). Aynı sayıda boşla ikinci basış gönderir.
  function bosSor(f) {
    var ad = {}; [].forEach.call(f.querySelectorAll('input[type="radio"]'), function (r) { ad[r.name] = ad[r.name] || r.checked; });
    var bos = Object.keys(ad).filter(function (k) { return !ad[k]; });
    if (!bos.length || f.getAttribute('data-bos') === String(bos.length)) return false;
    f.setAttribute('data-bos', String(bos.length));
    var g = f.querySelector('button[type="submit"]'), not = f.querySelector('.kapi__bos');
    if (!not) { not = d.createElement('p'); not.className = 'kapi__bos'; not.setAttribute('role', 'status'); g.parentNode.parentNode.insertBefore(not, g.parentNode); }
    not.textContent = (bos.length === 1 ? 'Bir soru' : bos.length + ' soru') + ' boş; boş bırakılan yanlış sayılır.';
    g.textContent = 'Yine de gönder'; g.focus();
    return true;
  }
  function dersBitir(id) {
    try { kayitYaz(Yol.dersOku(al().y, kayitOku(), id, Date.now())); sesCal('tamam'); } catch (e) { /* kilitli */ }
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
      var r = Yol.kapiDene(y, kayitOku(), id, cevaplar, z); kayitYaz(r.kayit); if (r.sonuc.gecti) sesCal('tamam');
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
    // açılır katmanlar (bilesen.js 24 halka, 25 komut çubuğu) gizli çizilir; perde index.html'de
    d.body.insertAdjacentHTML('beforeend', B.halka({ id: 'halka', ad: 'Yerler', ogeler: H.halka().map(function (y) { return { ad: y.ad, yol: y.yol, simge: HALKA_SIMGE[y.id] }; }) }) +
      '<nav id="alt-cubuk" class="alt-cubuk" aria-label="Ana bölümler">' + sekmeHtml('alt-cubuk__oge', '') + '</nav>' +
      B.komut({ id: 'komut', ad: 'Ara', yerTutucu: 'Bir yer, ayar ya da eylem ara' }));
    sayfaEl = $('#sayfa'); halkaEl = $('#halka'); perdeEl = $('#perde'); komutEl = $('#komut');
    ogeler = komutOgeleri(H, A);
    var boyutSaat = null; // pencere boyu değişince manzara yeni oranda çizilir (önbellek boyuta göre)
    addEventListener('resize', function () { clearTimeout(boyutSaat); boyutSaat = setTimeout(function () { kapakPay(); manzara(); }, 200); });
    addEventListener('hashchange', function () { halkaKapat(false); komutKapat(false); rota(); sayfaEl.focus({ preventScroll: true }); scrollTo(0, 0); kaydir(); });
    addEventListener('scroll', kaydir, { passive: true });
    d.addEventListener('keydown', tus);
    d.addEventListener('click', tik);
    d.addEventListener('click', function (e) { if (e.isTrusted && e.target.closest && e.target.closest('a[href^="#/"], [data-yol]:not(#sayfa)')) sesCal('tik'); }, true); // #sayfa da data-yol taşır: sayfadaki her tık ses istemesin
    d.addEventListener('click', function (e) { var a = !e.defaultPrevented && e.target.closest && e.target.closest('#sayfa a[href^="#/"]'); paylas = a ? paylasKaynak(a) : null; }, true);
    d.addEventListener('submit', function (e) { var f = e.target.closest('form.kapi'); if (f) { e.preventDefault(); if (bosSor(f)) return; if (f.hasAttribute('data-yer')) yerBitir(f); else kapiBitir(f); } });
    d.addEventListener('change', function (e) {
      if (e.target.matches('[data-ayar][data-parca]')) aralikYaz(e.target);
      else if (e.target.matches('input[data-ayar]')) sayiYaz(e.target);
    });
    d.addEventListener('contextmenu', sagTik);
    altEl = $('#alt-cubuk');
    d.addEventListener('pointermove', halkaYon);
    $('input', komutEl).addEventListener('input', function (e) { komutCiz(e.target.value); });
    if (matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', uygula);
    // öbür cihazdan kayıt geldi (depo.js eşitleme): sayfa yeniden çizilir; yazı alanı odaktaysa yazılan silinmesin diye beklenir
    depo.dinle(function () { if (!/^(INPUT|TEXTAREA|SELECT)$/.test((d.activeElement || {}).tagName || '')) rota(); });
    rota();
    if (location.protocol !== 'file:' && !kok.LIFEOS.HESAP) {
      // hesap.js yazılarını parça kaydına yazar: önce /parca.js, sonra /hesap.js (giriş sayfasındaki sıra). async=false: ikisi
      // birlikte iner, eklenme sırasıyla çalışır (biri ötekini beklemez; telefonda bir gidiş-dönüş kazanılır)
      var betik = function (yol, sonra) { var b = d.createElement('script'); b.src = yol; b.async = false; if (sonra) b.onload = sonra; d.head.appendChild(b); };
      betik('/parca.js'); betik('/hesap.js', function () { if (sayfaEl.getAttribute('data-yer') === 'bugun' && hesapAdi()) rota(); });
    }
    if (Kabuk.Tasima && Kabuk.Tasima.calis) Kabuk.Tasima.calis(); // tek kapıya geçişte eski modüllerin deposu bu kökene geri yazılır
    alanYukle(etkinAlan).then(function () { if (sayfaEl.getAttribute('data-yer') === 'bugun') rota(); }); // Bugün'ün «sırada» satırı için
  }
  Kabuk.ic = { canlan: canlan, kac: kac, ust: ust, kirinti: kirinti, depo: depo, git: git, rota: rota, Yol: Yol, kayitOku: kayitOku, fDurum: fDurum, al: al, alanYukle: alanYukleCizimle, etkin: function () { return etkinAlan; },
    dersMetni: dersMetni, onayDegisti: function (id) { if (hamlar[id]) alanKur(id); },
    asamalar: function (id) { var a = alanlar[id]; return a && a.ys ? a.ys : null; },
    asamaY: function (id, asamaId) { var a = alanlar[id]; return a && a.ys ? a.ys.filter(function (y) { return y.id === asamaId; })[0] || null : null; },
    tasinanlar: function () { return H.YERLER.filter(function (y) { return tasinan(y.id); }); }, ozetYenile: ozetYenile, alanRenk: ALAN_RENK };
  Kabuk.ac = { halka: halkaAcOdakli, komut: function () { komutAc(); }, git: function (y) { git(y); } };
  function basla() { uygula(); hazir.then(baslat); } // tema ilk boyamadan önce (ayar eşzamanlı okunur), sayfa depo hazır olunca
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', basla); else basla();
})(typeof window !== 'undefined' ? window : globalThis);
