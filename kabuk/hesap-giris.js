/* kabuk/hesap-giris.js — Hesap ekranının giriş ve güvenlik uzantısı (Kabuk.hesapUzanti; belgeler/ekip/sadelesme/faz7-hesap-giris.md).
 * giris (oturum yokken Oturum bölümünün yerine): giriş (iki adım açıksa kod adımı), ilk hesabı kurma, şifremi unuttum, kodla bağlan.
 * ciz (oturumda, Cihazlar'ın ardından): «Güvenlik» — şifre, kurtarma sorusu, iki adımlı doğrulama (aç, kapat, yeni yedek kodlar).
 * Akış ve sözler eski panelden (brand/ortak/hesap.js kapiGovde, guvenlik, ikiadim, formIsle). Bütün istekler eski istemciden geçer
 * (window.LIFEOS.HESAP): jeton onun çerezinde kalır, buraya gelmez. Şifre, kod ve kurtarma cevabı ekran durumuna hiç girmez (yalnız
 * gönderilen istekte yaşar; yeniden çizimde alanlar boş gelir); iki adımın sırrı, giriş bileti ve yedek kodlar yalnız bellekte,
 * ekrandan çıkınca silinir. Depoya hiçbir şey yazılmaz. Tarayıcıda Kabuk.HesapGiris, Node'da module.exports (yalnız saf kısım). */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};

  // eski panelin sifreGucu'su: 0 = 8'den kısa, 1 zayıf, 2 iyi, 3 güçlü
  function guc(s) {
    s = String(s || '');
    if (s.length < 8) return 0;
    var tur = [/[a-zçğıöşü]/, /[A-ZÇĞİÖŞÜ]/, /[0-9]/, /[^0-9A-Za-zÇĞİÖŞÜçğıöşü]/].filter(function (r) { return r.test(s); }).length;
    if (s.length >= 16 || (s.length >= 12 && tur >= 3)) return 3;
    return s.length >= 12 || tur >= 3 ? 2 : 1;
  }
  var GUC = ['En az 8 karakter.', 'Güç: zayıf.', 'Güç: iyi.', 'Güç: güçlü.'];
  function sirYaz(s) { return String(s || '').replace(/(.{4})(?=.)/g, '$1 '); }
  function rakam(x) { return String(x || '').replace(/\s/g, ''); }

  /* İstemci denetimi (sunucu yine denetler; sözler sistem/hesap.py'ninkiler). Form → sırayla bakılan alanlar; ilk hata döner. */
  var AD = /^[0-9A-Za-zÇĞİÖŞÜçğıöşü_.-]{2,32}$/, YEDEK = /^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/;
  var SINA = {
    ad: function (v) { return AD.test(String(v.ad || '').trim()) ? '' : 'Kullanıcı adı 2–32 karakter olmalı: harf, rakam, nokta, tire, alt çizgi.'; },
    parola: function (v) { return v.parola ? '' : 'Şifreni yaz.'; },
    eski: function (v) { return v.eski ? '' : 'Şimdiki şifreni yaz.'; },
    yeni: function (v) { return String(v.yeni || '').length >= 8 ? '' : 'Şifre en az 8 karakter olmalı.'; },
    tekrar: function (v) { return (v.tekrar || '') === (v.yeni || '') ? '' : 'İki şifre aynı değil.'; },
    soru: function (v) { var n = String(v.soru || '').trim().length; return n >= 4 && n <= 120 ? '' : 'Kurtarma sorusu 4–120 karakter olmalı.'; },
    cevap: function (v) { return String(v.cevap || '').trim().length >= 2 ? '' : 'Kurtarma cevabı en az 2 karakter olmalı.'; },
    kod: function (v) { return /^\d{6}$/.test(rakam(v.kod)) ? '' : 'Altı haneli kodu yaz.'; },
    yedekkod: function (v) { return YEDEK.test(rakam(v.yedekkod)) ? '' : 'Yedek kod XXXX-XXXX biçiminde.'; },
    kodya: function (v) { var k = rakam(v.kodya); return /^\d{6}$/.test(k) || YEDEK.test(k) ? '' : 'Uygulamadaki altı haneli kodu ya da bir yedek kodu yaz.'; }
  };
  var FORM = { giris: ['ad', 'parola'], kur: ['ad', 'yeni', 'tekrar', 'soru', 'cevap'], kod: ['kod'], yedekkod: ['yedekkod'], soru: ['ad'],
    kurtar: ['cevap', 'yeni', 'tekrar'], bagla: ['kod'], parola: ['eski', 'yeni', 'tekrar'], 'soru-ayarla': ['soru', 'cevap', 'parola'],
    'iki-ac': ['parola'], 'iki-onay': ['kod'], yedek: ['parola'], 'iki-kapat': ['parola', 'kodya'] };
  var GIRIS_FORM = ['giris', 'kur', 'kod', 'yedekkod', 'soru', 'kurtar', 'bagla'];
  function denetle(form, v) {
    var l = FORM[form] || [];
    for (var i = 0; i < l.length; i++) { var m = SINA[l[i]](v || {}); if (m) return { alan: l[i], metin: m }; }
    return null;
  }
  // Yeniden çizimde geri yazılabilen alanlar; geri kalanı (şifreler, kodlar, kurtarma cevabı) hiç saklanmaz.
  var KALIR = ['ad', 'soru', 'adres'];
  function sakla(v) { var t = {}; KALIR.forEach(function (k) { if (v && v[k]) t[k] = String(v[k]); }); return t; }

  /* Alan: Bilesen.alan (metin kutusu) + türe göre giriş nitelikleri. Bileşende şifre türü yok: aynı kutu type=password olur. */
  var NIT = {
    ad: { ac: 'username', ek: ' autocapitalize="none" spellcheck="false"' },
    parola: { tip: 'password', ac: 'current-password' }, eski: { tip: 'password', ac: 'current-password' },
    yeni: { tip: 'password', ac: 'new-password' }, tekrar: { tip: 'password', ac: 'new-password' },
    kod: { ac: 'one-time-code', ek: ' inputmode="numeric" spellcheck="false"' },
    yedekkod: { ac: 'one-time-code', ek: ' autocapitalize="characters" spellcheck="false"' },
    kodya: { ac: 'one-time-code', ek: ' autocapitalize="characters" spellcheck="false"' },
    adres: { ac: 'off', ek: ' inputmode="url" autocapitalize="none" spellcheck="false"' }
  };
  function alan(B, st, k, o) {
    var n = NIT[k] || {}, h = st.hata && st.hata.alan === k ? st.hata.metin : '';
    var x = B.alan(Object.assign({ tur: 'metin', isim: 'hg-' + k, hata: h, deger: KALIR.indexOf(k) >= 0 ? (st.taslak || {})[k] || '' : '' }, o));
    return x.replace('type="text"', 'type="' + (n.tip || 'text') + '"').replace(' autocomplete="off"', ' autocomplete="' + (n.ac || 'off') + '"' + (n.ek || ''));
  }
  function yeniAlan(B, st, k, ad) { return alan(B, st, k, { ad: ad, ipucu: GUC[0], veri: { 'hg-guc': '1' } }); }
  function form(ad, ic) { return '<form class="kapi" data-hg-form="' + ad + '" novalidate>' + ic.join('') + '</form>'; }
  function ileti(B, st) { return st.ileti ? B.uyari({ tur: st.ileti.tur, metin: st.ileti.metin, veri: { 'hg-ileti': '1' } }) : ''; }
  function soluk(B, m, ek) { return '<p class="soluk' + (ek ? ' ' + ek : '') + '">' + B.kac(m) + '</p>'; }
  // oturum yokken her görünüm bir karşılama kartı: simgeli kısa başlık, arayüz yazısıyla açıklama, form (stil araclar.css .hg-kart)
  function kart(B, baslik, m, ic) { return '<div class="hg-kart">' + (baslik ? '<p class="hg-kart__baslik"><span class="b-simge" aria-hidden="true"><svg><use href="#i-kisi"/></svg></span>' + B.kac(baslik) + '</p>' : '') + (m ? soluk(B, m) : '') + ic + '</div>'; }
  function gonderDugme(st, metin) { return st.is ? { metin: 'Bekle…', tur: 'ana', kapali: true } : { metin: metin, tur: 'ana', tip: 'submit' }; }
  function geri(metin, ne) { return { metin: metin || 'Girişe dön', tur: 'sade', veri: { 'hg-ac': 'gorunum', 'hg-ne': ne || 'giris' } }; }

  /* Giriş (oturum yok). s: { gorunum: giris|kod|unuttum|bagla, taslak, hata {alan, metin}, ileti {tur, metin}, is, soru, yedekKip,
   * kuruldu (bu açılışta ilk hesap kuruldu: sunucunun eski «kurulum» bilgisi geçersiz), uygulama (telefon uygulaması: adres sorulur) }. */
  function girisHtml(s, bag, B) {
    var sv = bag.sunucu || {}, adres = s.uygulama ? alan(B, s, 'adres', { ad: 'Bilgisayarın adresi', yerTutucu: '192.168.0.10',
      ipucu: 'Bilgisayardaki Başbuğ’da Hesap › Cihazlar’da yazar. Boş bırakırsan son kullanılan adres.' }) : '';
    if (bag.dosya && !s.uygulama) return B.bos({ baslik: 'Hesap bu açılışta yok.', metin: 'Sayfa dosyadan açıldı; giriş Başbuğ’la açılınca yapılır.' });
    if (sv.kurulum && !s.kuruldu) {
      if (!sv.yerel) return B.uyari({ tur: 'bilgi', simge: 'kisi', metin: 'Bu bilgisayarda henüz hesap yok.', alt: 'İlk hesap (yönetici) bilgisayarın kendisinde açılır: Başbuğ’u bilgisayarda aç, Hesap ekranından kur.' });
      return kart(B, 'Bu bilgisayarda henüz hesap yok.', 'İlk hesap yönetici olur: güncelleme ve yönetim onda. Kayıtların girişsiz de bilgisayardaki depoya gider; hesap telefon ve öteki cihazlar için.',
        form('kur', [ileti(B, s), alan(B, s, 'ad', { ad: 'Kullanıcı adı' }), yeniAlan(B, s, 'yeni', 'Şifre'), alan(B, s, 'tekrar', { ad: 'Şifre tekrar' }),
          soluk(B, 'Şifreni unutursan kendine soracağın bir soru ve cevabı:', 'hg-ara'),
          alan(B, s, 'soru', { ad: 'Kurtarma sorusu', yerTutucu: 'Örn. İlk öğretmenimin adı?', enCok: 120 }), alan(B, s, 'cevap', { ad: 'Cevabın', enCok: 120 }),
          B.eylemler([gonderDugme(s, 'Hesap kur')])]));
    }
    if (s.gorunum === 'kod') {
      return kart(B, null, s.yedekKip ? 'Kaydettiğin yedek kodlardan birini yaz; her biri bir kez geçer.' : 'İki adımlı doğrulama açık. Doğrulayıcı uygulamandaki 6 haneli kodu yaz.',
        form(s.yedekKip ? 'yedekkod' : 'kod', [ileti(B, s), s.yedekKip ? alan(B, s, 'yedekkod', { ad: 'Yedek kod', yerTutucu: 'XXXX-XXXX', enCok: 9 })
          : alan(B, s, 'kod', { ad: 'Kod', yerTutucu: '000 000', enCok: 7 }),
          B.eylemler([gonderDugme(s, 'Doğrula'), { metin: s.yedekKip ? 'Uygulamadaki kodu kullan' : 'Yedek kod kullan', tur: 'sade', veri: { 'hg-ac': 'yedek-kip' } }, geri()])]));
    }
    if (s.gorunum === 'unuttum' && !s.soru) {
      return kart(B, null, 'Şifreni yenile: kullanıcı adını yaz, sonra kendi kurtarma sorunu cevapla.',
        form('soru', [ileti(B, s), adres, alan(B, s, 'ad', { ad: 'Kullanıcı adı' }), B.eylemler([gonderDugme(s, 'Devam'), geri()])]));
    }
    if (s.gorunum === 'unuttum') {
      return kart(B, null, null, B.ayar({ id: 'hg-soru-metin', ad: 'Kendi sorun', deger: s.soru }) +
        form('kurtar', [ileti(B, s), alan(B, s, 'cevap', { ad: 'Cevabın', enCok: 120 }), yeniAlan(B, s, 'yeni', 'Yeni şifre'), alan(B, s, 'tekrar', { ad: 'Yeni şifre tekrar' }),
          B.eylemler([gonderDugme(s, 'Şifreyi yenile'), geri()])]));
    }
    if (s.gorunum === 'bagla') {
      return kart(B, null, 'Girişli cihazında Hesap › Cihazlar › Yeni cihaz bağla\'ya dokun; çıkan altı haneli kodu buraya yaz. Şifre gerekmez.',
        form('bagla', [ileti(B, s), adres, alan(B, s, 'kod', { ad: 'Bağlama kodu', yerTutucu: '000 000', enCok: 7, ipucu: 'Kod 5 dakika geçerli ve tek kullanımlık.' }),
          B.eylemler([gonderDugme(s, 'Bağlan'), geri()])]));
    }
    return kart(B, 'Bu cihazda giriş yapılmadı.', sv.yerel ? 'Bu bilgisayarda kayıtların girişsiz de bilgisayardaki depoya gider; giriş telefon ve öteki cihazlar için.' : null,
      form('giris', [ileti(B, s), adres, alan(B, s, 'ad', { ad: 'Kullanıcı adı' }), alan(B, s, 'parola', { ad: 'Şifre' }),
        B.eylemler([gonderDugme(s, 'Giriş yap'), geri('Şifremi unuttum', 'unuttum'), geri('Kodla bağlan', 'bagla')])]));
  }

  /* Güvenlik (oturumda). g: { ben (/api/hesap/ben: soru_var, iki_adim {acik, yedek_kalan}), benHata, acik (açık form: parola | soru-ayarla |
   * iki-ac | yedek | iki-kapat), kurulum {sir, uri}, qr (SVG), tel, yedekler [kod], kopya, taslak, hata, ileti, is, rol }. */
  var YUKLENIYOR = '<div class="b-iskelet" aria-busy="true"><span class="gizli">Yükleniyor…</span><i></i><i></i><i></i></div>';
  function dugme(metin, ac, ne, tur) { return { metin: metin, tur: tur || 'sade', veri: ne ? { 'hg-ac': ac, 'hg-ne': ne } : { 'hg-ac': ac } }; }
  function vazgec(ac) { return dugme('Vazgeç', ac || 'kapat'); }
  function acikHtml(g, B) {
    var a = g.acik, ic = function (baslik, govde) { return B.panel({ tur: 'guclu', baslik: baslik, id: 'hg-panel', govde: govde }); };
    if (a === 'parola') return ic('Şifreyi değiştir', [form('parola', [ileti(B, g), alan(B, g, 'eski', { ad: 'Şimdiki şifre' }), yeniAlan(B, g, 'yeni', 'Yeni şifre'),
      alan(B, g, 'tekrar', { ad: 'Yeni şifre tekrar' }), soluk(B, 'Şifre değişince öteki cihazlarda yeniden giriş gerekir.'), B.eylemler([gonderDugme(g, 'Şifreyi değiştir'), vazgec()])])]);
    if (a === 'soru-ayarla') return ic('Kurtarma sorusu', [form('soru-ayarla', [ileti(B, g), alan(B, g, 'soru', { ad: 'Soru (kendin yaz)', yerTutucu: 'Örn. İlk öğretmenimin adı?', enCok: 120 }),
      alan(B, g, 'cevap', { ad: 'Cevabın', enCok: 120 }), alan(B, g, 'parola', { ad: 'Şifren' }), B.eylemler([gonderDugme(g, 'Kaydet'), vazgec()])])]);
    if (a === 'iki-ac') return ic('İki adımlı doğrulamayı aç', [soluk(B, 'Şifreye ikinci bir kilit: girişte şifreden sonra telefonundaki doğrulayıcı uygulamanın 6 haneli kodu sorulur. Şifren başkasına geçse bile hesabın açılmaz.'),
      form('iki-ac', [ileti(B, g), alan(B, g, 'parola', { ad: 'Başlamak için şifren' }), B.eylemler([gonderDugme(g, 'Kurulumu başlat'), vazgec()])])]);
    if (a === 'yedek') return ic('Yeni yedek kodlar', [form('yedek', [ileti(B, g), B.uyari({ tur: 'dikkat', metin: 'Eski yedek kodlar hemen geçersiz olur.' }),
      alan(B, g, 'parola', { ad: 'Şifren' }), B.eylemler([gonderDugme(g, 'Yeni kodları göster'), vazgec()])])]);
    if (a === 'iki-kapat') return ic('İki adımı kapat', [form('iki-kapat', [ileti(B, g), B.uyari({ tur: 'dikkat', metin: 'Kapatınca girişte yalnız şifre sorulur.', alt: 'Kapatmak için şifren ve uygulamadaki kod (ya da bir yedek kod) gerekir.' }),
      alan(B, g, 'parola', { ad: 'Şifren' }), alan(B, g, 'kodya', { ad: 'Uygulamadaki kod ya da bir yedek kod', enCok: 9 }), B.eylemler([gonderDugme(g, 'İki adımı kapat'), vazgec()])])]);
    return '';
  }
  function kurulumHtml(g, B) {
    var k = g.kurulum;
    // otpauth: bağlantısı Bilesen.dugme'nin izinli yollarında yok; aynı sınıflarla elle (adres kaçışlı)
    var okut = g.tel ? '<p><a class="b-dugme b-dugme--ikincil" href="' + B.kac(k.uri) + '">Doğrulayıcıda aç</a></p>' + soluk(B, 'Açılmazsa uygulamada «anahtarı elle gir» ile bunu yaz:')
      : (g.qr ? '<div>' + g.qr + '</div>' : '') + soluk(B, g.qr ? 'Okutamıyorsan anahtarı elle yaz:' : 'Uygulamada «anahtarı elle gir» ile bunu yaz:');
    return B.panel({ tur: 'guclu', baslik: 'İki adımlı doğrulamayı aç', id: 'hg-kurulum', govde: [
      soluk(B, '1. Doğrulayıcı uygulamayı aç: Google Authenticator, Microsoft Authenticator ya da iPhone\'da Ayarlar › Şifreler. Hepsi ücretsiz.'),
      soluk(B, g.tel ? '2. Başbuğ’u uygulamaya ekle.' : '2. QR kodunu uygulamayla okut.'), okut,
      '<p><code data-hg-sir>' + B.kac(sirYaz(k.sir)) + '</code></p>', B.eylemler([g.kopya === 'sir' ? { yazi: 'Kopyalandı.' } : dugme('Anahtarı kopyala', 'kopyala', 'sir')]),
      soluk(B, '3. Uygulamadaki kodu yaz.'),
      form('iki-onay', [ileti(B, g), alan(B, g, 'kod', { ad: 'Kod', yerTutucu: '000 000', enCok: 7 }), B.eylemler([gonderDugme(g, 'Doğrula ve aç'), vazgec('kur-vazgec')])])] });
  }
  function yedekHtml(g, B) {
    return B.panel({ tur: 'basari', baslik: 'Yedek kodların', id: 'hg-yedek', durum: true, govde: [
      B.uyari({ tur: 'dikkat', metin: 'Bu kodlar yalnız bir kez gösterilir.', alt: 'Telefonun yanında değilken her biri girişi bir kez açar. Şimdi bir yere yaz ya da kopyala; bu ekrandan çıkınca bir daha gösterilmez.' }),
      '<p aria-label="Yedek kodlar">' + g.yedekler.map(function (x) { return '<code data-hg-yedek>' + B.kac(String(x)) + '</code>'; }).join(' · ') + '</p>',
      B.eylemler([g.kopya === 'kodlar' ? { yazi: 'Kopyalandı.' } : dugme('Kodları kopyala', 'kopyala', 'kodlar'), dugme('Kaydettim', 'kaydettim', null, 'ana')])] });
  }
  function guvenlikHtml(g, bag, B) {
    var govde;
    if (!g.ben) govde = g.benHata ? B.uyari({ tur: 'hata', metin: g.benHata, eylem: dugme('Yeniden dene', 'ben-yenile') }) : YUKLENIYOR;
    else {
      var ia = g.ben.iki_adim || {}, acik = !!ia.acik, n = Number(ia.yedek_kalan) || 0, bos = !g.acik && !g.kurulum && !g.yedekler;
      var dg = function (l) { return bos ? B.eylemler(l) : ''; }; // bir iş açıkken öteki düğmeler gizli: tek seferde tek form
      govde = [
        B.ayar({ id: 'hg-sifre', ad: 'Şifre', not: 'Şifre değişince öteki cihazlarda yeniden giriş gerekir.', govde: dg([dugme('Değiştir', 'ac', 'parola')]) }),
        B.ayar({ id: 'hg-soru', ad: 'Kurtarma sorusu', not: g.ben.soru_var ? 'Ayarlı: şifreni unutursan bu soruyla yenilersin.' : 'Ayarlı değil: şifreni unutursan hesabı kendin geri açamazsın.',
          govde: dg([dugme(g.ben.soru_var ? 'Değiştir' : 'Ayarla', 'ac', 'soru-ayarla', g.ben.soru_var ? 'sade' : 'ana')]) }),
        B.ayar({ id: 'hg-iki', ad: 'İki adımlı doğrulama', not: acik ? 'Açık · ' + n + ' yedek kod kaldı' + (n <= 2 ? ' · yenilerini al' : '') : 'Kapalı: girişte yalnız şifre sorulur.',
          govde: dg(acik ? [dugme('Yeni yedek kodlar', 'ac', 'yedek'), dugme('Kapat', 'ac', 'iki-kapat')] : [dugme('Aç', 'ac', 'iki-ac', 'ana')]) }),
        g.ileti && bos ? ileti(B, g) : '',
        g.yedekler ? yedekHtml(g, B) : g.kurulum ? kurulumHtml(g, B) : acikHtml(g, B),
        acik && bos ? soluk(B, 'Telefonunu ve yedek kodlarını birlikte kaybedersen ' + (g.rol === 'admin' ? 'hesabın bilgisayarın kendisinden kurtarılır. Yedek kodlarını güvenli bir yerde sakla.' : 'yönetici Hesap › Kullanıcılar’dan kapatır.')) : ''];
    }
    return B.bolum({ baslik: 'Güvenlik', id: 'hg-guvenlik', govde: govde });
  }
  function hataMetni(e, uygulama) {
    if (e && e.kod === 0) return uygulama ? 'Bilgisayara ulaşılamadı. Aynı Wi-Fi’da mısınız, Başbuğ açık mı, adres doğru mu?' : 'Bilgisayara ulaşılamadı; Başbuğ açık mı?';
    return (e && e.message) || 'İstek yapılamadı.';
  }

  var HesapGiris = { guc: guc, GUC: GUC, sirYaz: sirYaz, denetle: denetle, sakla: sakla, girisHtml: girisHtml, guvenlikHtml: guvenlikHtml, hataMetni: hataMetni, GIRIS_FORM: GIRIS_FORM };
  Kabuk.HesapGiris = HesapGiris;
  if (typeof module !== 'undefined' && module.exports) module.exports = HesapGiris;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var d = document, kuruldu = false, s = yeniS(), g = yeniG();
  function yeniS() { return { gorunum: 'giris', taslak: {}, hata: null, ileti: null, is: false, bilet: null, adres: null, soru: '', kad: '', adresYazi: null, yedekKip: false, kuruldu: kuruldu, uygulama: !!kok.LIFEOS_YEREL }; }
  function yeniG() { return { kim: null, rol: '', ben: null, benHata: '', benIs: false, acik: null, kurulum: null, qr: '', tel: /iPhone|iPad|Android/.test(navigator.userAgent || ''),
    yedekler: null, kopya: '', taslak: {}, hata: null, ileti: null, is: false }; }
  function H() { return L.HESAP; }
  function burada() { return location.hash.split('?')[0] === '#/hesap'; }
  function ciz(odak) {
    if (!burada()) return;
    Kabuk.ic.rota();
    var f = odak && d.querySelector(odak); if (f) f.focus();
  }
  var ILK = '[data-hg-form] input:not([type=hidden])';
  // ekrandan çıkınca sır, bilet ve yedek kodlar bellekten de gider
  kok.addEventListener('hashchange', function () { if (!burada()) { s = yeniS(); g = yeniG(); } });

  function benYukle() {
    var g0 = g; g0.benIs = true; g0.benHata = '';
    H().ben().then(function (v) { g0.benIs = false; g0.ben = { soru_var: !!(v && v.soru_var), iki_adim: (v && v.iki_adim) || { acik: false } }; if (g === g0) ciz(); },
      function (e) { g0.benIs = false; g0.benHata = hataMetni(e); if (g === g0) ciz(); });
  }
  function qrYukle(sonra) {
    if (L.QR) return sonra();
    var b = d.createElement('script'); b.src = '/qr.js'; b.onload = b.onerror = sonra; d.head.appendChild(b);
  }
  function bitti() { s = yeniS(); ciz(); } // oturum çerezde: kabuk/hesap.js yeniden çizimde görür
  function kodAdimi(r) { s = Object.assign(yeniS(), { gorunum: 'kod', bilet: r.bilet, adres: r.adres }); ciz(ILK); }

  // Form işleri: v alan değerleri (şifreler dahil) yalnız bu çağrıda yaşar.
  function is(ne, v) {
    var A = H(), adres = s.uygulama ? v.adres || '' : null;
    if (ne === 'giris') return A.girisYap(v.ad.trim(), v.parola, adres).then(function (r) { if (r && r.iki_adim) kodAdimi(r); else bitti(); });
    if (ne === 'kod' || ne === 'yedekkod') return A.girisKod(s.bilet, rakam(ne === 'kod' ? v.kod : v.yedekkod), s.adres).then(bitti);
    if (ne === 'kur') return A.kayitOl(v.ad.trim(), v.yeni, v.soru.trim(), v.cevap, adres).then(function () { kuruldu = true; bitti(); });
    if (ne === 'soru') return A.soruGetir(v.ad.trim(), adres).then(function (soru) { s.is = false; s.soru = String(soru || ''); s.kad = v.ad.trim(); s.adresYazi = adres; ciz(ILK); });
    if (ne === 'kurtar') return A.kurtar(s.kad, v.cevap, v.yeni, s.adresYazi).then(function (r) { if (r && r.iki_adim) kodAdimi(r); else bitti(); });
    if (ne === 'bagla') return A.baglaKod(rakam(v.kod), adres).then(bitti);
    var tamam = function (m) { g.is = false; g.acik = null; g.taslak = {}; g.ileti = { tur: 'tamam', metin: m }; ciz('[data-hg-ileti]'); };
    if (ne === 'parola') return A.parolaDegistir(v.eski, v.yeni).then(function () { tamam('Şifre değişti. Öteki cihazlarda yeniden giriş gerekir.'); });
    if (ne === 'soru-ayarla') return A.soruAyarla(v.parola, v.soru.trim(), v.cevap).then(function () { if (g.ben) g.ben.soru_var = true; tamam('Kurtarma sorusu kaydedildi.'); });
    if (ne === 'iki-ac') return A.ikiAdimBaslat(v.parola).then(function (k) {
      var g0 = g;
      g.is = false; g.acik = null; g.kurulum = { sir: String(k.sir || ''), uri: String(k.uri || '') }; g.kopya = '';
      qrYukle(function () {
        if (g !== g0 || !g.kurulum) return;
        g.qr = L.QR && !g.tel ? L.QR.svg(g.kurulum.uri, { etiket: 'Doğrulayıcı uygulama için QR kodu' }).replace('<svg ', '<svg width="176" height="176" ') : '';
        ciz('#b-alan-hg-kod');
      });
    });
    if (ne === 'iki-onay') return A.ikiAdimOnayla(rakam(v.kod)).then(function (y) {
      g.is = false; g.kurulum = null; g.qr = ''; g.yedekler = y; g.kopya = ''; g.ben.iki_adim = { acik: true, yedek_kalan: y.length };
      g.ileti = { tur: 'tamam', metin: 'İki adımlı doğrulama açıldı.' }; ciz('[aria-labelledby="hg-yedek"]');
    });
    if (ne === 'yedek') return A.yedekYenile(v.parola).then(function (y) {
      g.is = false; g.acik = null; g.yedekler = y; g.kopya = ''; g.ben.iki_adim.yedek_kalan = y.length; ciz('[aria-labelledby="hg-yedek"]');
    });
    if (ne === 'iki-kapat') return A.ikiAdimKapat(v.parola, rakam(v.kodya)).then(function () { g.ben.iki_adim = { acik: false, yedek_kalan: 0 }; tamam('İki adımlı doğrulama kapandı.'); });
    return Promise.reject(new Error('Bilinmeyen form.'));
  }

  d.addEventListener('submit', function (e) {
    var f = e.target.closest && e.target.closest('form[data-hg-form]');
    if (!f || !burada()) return;
    e.preventDefault();
    var ne = f.getAttribute('data-hg-form'), st = GIRIS_FORM.indexOf(ne) >= 0 ? s : g, v = {};
    if (st.is || !H()) return;
    [].forEach.call(f.querySelectorAll('[name^="hg-"]'), function (x) { v[x.name.slice(3)] = x.value; });
    var h = denetle(ne, v);
    st.taslak = sakla(v); st.ileti = null; st.hata = h;
    if (h) { v = null; return ciz('#b-alan-hg-' + h.alan); }
    st.is = true; ciz();
    Promise.resolve().then(function () { return is(ne, v); }).catch(function (x) {
      if (st !== s && st !== g) return; // ekrandan çıkıldı ya da durum yenilendi
      st.is = false; st.ileti = { tur: 'hata', metin: hataMetni(x, s.uygulama) }; ciz('[data-hg-ileti]');
    }).then(function () { v = null; });
  });
  d.addEventListener('input', function (e) {
    var x = e.target;
    if (!x.hasAttribute || !x.hasAttribute('data-hg-guc')) return;
    var p = d.getElementById(x.id + '-ipucu'); if (p) p.textContent = GUC[guc(x.value)];
  });
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-hg-ac]');
    if (!b || b.getAttribute('aria-disabled') === 'true' || !burada()) return;
    var ne = b.getAttribute('data-hg-ac'), arg = b.getAttribute('data-hg-ne'), odak = null;
    if (ne === 'gorunum') { s = Object.assign(yeniS(), { gorunum: arg, taslak: { ad: s.taslak.ad, adres: s.taslak.adres } }); odak = ILK; }
    else if (ne === 'yedek-kip') { s.yedekKip = !s.yedekKip; s.hata = s.ileti = null; odak = ILK; }
    else if (ne === 'ac') { g.acik = arg; g.hata = g.ileti = null; g.taslak = {}; odak = ILK; }
    else if (ne === 'kapat') { g.acik = null; g.hata = g.ileti = null; g.taslak = {}; }
    else if (ne === 'kur-vazgec') { g.kurulum = null; g.qr = ''; g.hata = g.ileti = null; }
    else if (ne === 'kaydettim') { g.yedekler = null; g.kopya = ''; }
    else if (ne === 'ben-yenile') { g.benHata = ''; return benYukle(); }
    else if (ne === 'kopyala') {
      var t = arg === 'sir' ? g.kurulum && g.kurulum.sir : (g.yedekler || []).join('\n');
      if (!t || !navigator.clipboard) return;
      return navigator.clipboard.writeText(t).then(function () { g.kopya = arg; ciz(); }, function () { /* izin yok: kod ekranda */ });
    }
    else return;
    ciz(odak);
  });

  (Kabuk.hesapUzanti = Kabuk.hesapUzanti || []).push({ ad: 'giris', sira: 10,
    giris: function (bag, B) { if (g.kim) g = yeniG(); return girisHtml(s, bag, B); }, // çıkıştan sonra sır ve kodlar kalmasın
    ciz: function (bag, B) {
      var kim = bag.oturum && bag.oturum.ad;
      if (g.kim !== kim) { g = yeniG(); g.kim = kim; }
      g.rol = bag.oturum && bag.oturum.rol;
      if (!g.ben && !g.benIs && !g.benHata && H()) benYukle();
      return guvenlikHtml(g, bag, B);
    } });
})(typeof window !== 'undefined' ? window : globalThis);
