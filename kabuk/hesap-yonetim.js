/* kabuk/hesap-yonetim.js — Hesap ekranı uzantısı (kabuk/hesap.js Kabuk.hesapUzanti; belgeler/ekip/sadelesme/faz7-hesap-yonetim.md).
 * Bölümler: Profil, Güvenlik kontrolü ve etkinlik, Yedekler (admin), Kullanıcılar (admin), Dışa aktar ve hesabı sil, Güncelleme (telefondan; admin).
 * Akışlar ve cümleler eski panelden (brand/ortak/hesap.js SAYFALAR.profil/guvenlik/etkinlik/yonetim/kisi/verin/yedek, sistemHtml).
 * Bütün istekler eski istemciden (window.LIFEOS.HESAP) geçer: jeton onun çerezinde kalır, buraya gelmez. Şifre alanları yeniden çizimde
 * hiç taşınmaz, gönderilince boşaltılır; yeni lifeos.* anahtarı yok, durum bellekte. Tarayıcıda Kabuk.hesapUzanti'ya eklenir,
 * Node'da module.exports (yalnız saf kısım). hesap.js'ten SONRA yüklenir. */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  var Hs = Kabuk.Hesap || (typeof require === 'function' ? require('./hesap.js') : {});

  var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function iki(n) { return (n < 10 ? '0' : '') + n; }
  function tarihSaat(ms) { if (!ms) return ''; var d = new Date(ms); return d.getDate() + ' ' + AYLAR[d.getMonth()] + ' ' + d.getFullYear() + ' · ' + iki(d.getHours()) + ':' + iki(d.getMinutes()); }
  function boyut(b) {
    if (b == null) return '';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return Math.max(1, Math.round(b / 1024)) + ' KB';
    return (b / 1048576).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' MB';
  }
  function say(n) { return Number(n || 0).toLocaleString('tr-TR'); }
  function kac(x) { return String(x).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function adresAd(ip) { return !ip ? '' : ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' ? 'Bu bilgisayar' : ip; }
  var RENK_AD = { mavi: 'Mavi', turkuaz: 'Turkuaz', turuncu: 'Turuncu', mor: 'Mor', pembe: 'Pembe', yesil: 'Yeşil', grafit: 'Grafit' };
  function rolAd(r) { return r === 'admin' ? 'Admin' : 'Üye'; }
  var UYARI_TUR = { giris: 'Yeni giriş', bag: 'Kodla bağlanan cihaz', kurtar: 'Şifre kurtarıldı', yanlis: 'Yanlış şifre denemesi',
    'kurtar-yanlis': 'Yanlış kurtarma cevabı', 'kod-yanlis': 'Yanlış doğrulama kodu', parola: 'Şifre değişti', 'iki-adim-kapat': 'İki adımlı doğrulama kapandı' };
  var OLAY = { giris: 'Giriş', yanlis: 'Yanlış şifre', kayit: 'Hesap açıldı', kurtar: 'Şifre soruyla yenilendi', 'kurtar-yanlis': 'Kurtarma cevabı yanlış',
    parola: 'Şifre değişti', soru: 'Kurtarma sorusu değişti', cikis: 'Çıkış', cihaz: 'Cihazdan çıkıldı', otekiler: 'Öteki cihazlardan çıkıldı',
    yonetim: 'Admin değişikliği', 'iki-adim': 'İki adımlı doğrulama açıldı', 'iki-adim-kapat': 'İki adımlı doğrulama kapandı', yedek: 'Yedek kodlar yenilendi',
    'kod-yanlis': 'Yanlış doğrulama kodu', bag: 'Kodla cihaz bağlandı', anahtar: 'Erişim anahtarı açıldı', 'anahtar-sil': 'Erişim anahtarı silindi',
    takvim: 'Takvim aboneliği', 'takvim-kapat': 'Takvim aboneliği kapandı', 'geri-yukle': 'Depo yedekten geri yüklendi', sistem: 'Sistem güncellendi',
    'yedek-indir': 'Yedek dosya olarak indirildi', 'yedek-yukle': 'Yedek dosyadan yüklendi' };
  var YANLIS = { yanlis: 1, 'kurtar-yanlis': 1, 'kod-yanlis': 1 };
  var YEDEK_TUR = { gunluk: 'Günlük', elle: 'Elle alındı', once: 'Geri yüklemeden önce', dis: 'Dosyadan yüklendi' };
  var HAFTA_MS = 7 * 86400000, AY_MS = 30 * 86400000, YEDEK_ESKI_MS = 2 * 86400000;

  function yanlisSayisi(l, simdi) { return (l || []).filter(function (o) { return YANLIS[o.tur] && o.zaman >= simdi - HAFTA_MS; }).length; }
  // Yedek henüz hiç alınmadıysa dikkat değildir; alınamadıysa ya da iki günden eskiyse dikkat (eski panelin yedekHatasi'sı).
  function yedekHatasi(yd, simdi) {
    if (!yd) return '';
    if (yd.hata) return 'Son yedek alınamadı';
    if (yd.son && simdi - yd.son > YEDEK_ESKI_MS) return Math.floor((simdi - yd.son) / 86400000) + ' gündür yedek yok';
    if (yd.ikinci_hata) return 'İkinci yere yazılamadı';
    return '';
  }
  /* GÜVENLİK KONTROLÜ (eski panelin kontrol'ü): hesabın kilitleri birer satır. Sunucu cevabı gelmeyen kilit hiç yazılmaz:
   * bilinmeyen «tamam» da «dikkat» de sayılmaz (AGENTS §1.7). */
  function kontrol(s, simdi) {
    var ben = s.ben || {}, ik = ben.iki_adim, l = [];
    if (ik) {
      var az = ik.acik && ik.yedek_kalan <= 2;
      l.push({ ad: 'İki adımlı doğrulama', dikkat: !ik.acik || az, not: !ik.acik ? 'Kapalı' : az ? ik.yedek_kalan + ' yedek kod kaldı' : 'Açık' });
    }
    if (typeof ben.soru_var === 'boolean') l.push({ ad: 'Kurtarma sorusu', dikkat: !ben.soru_var && !(ik && ik.acik), not: ben.soru_var ? 'Ayarlı' : 'Ayarlı değil' });
    if (s.cihazlar) {
      var eski = s.cihazlar.filter(function (c) { return !c.bu && simdi - (Number(c.son) || 0) > AY_MS; }).length;
      l.push({ ad: 'Oturum açık cihazlar', dikkat: eski > 0, not: eski ? eski + ' cihaz 30 gündür görünmedi' : String(s.cihazlar.length) });
    }
    if (s.etkinlik) { var y = yanlisSayisi(s.etkinlik, simdi); l.push({ ad: 'Son 7 gün', dikkat: y > 0, not: y ? y + ' yanlış deneme' : 'Yanlış deneme yok' }); }
    var yd = ben.yedek;
    if (yd && ben.kullanici && ben.kullanici.rol === 'admin') {
      var h = yedekHatasi(yd, simdi);
      l.push({ ad: 'Hesap deposunun yedeği', dikkat: !!h, not: h || (yd.son ? Hs.sonMetni(yd.son, simdi) : 'Henüz yok') });
    }
    return l;
  }
  function olaySatiri(o, simdi) {
    var alt = (o.tur === 'cihaz' ? [o.ayrinti, o.cihaz_ad ? 'ile: ' + o.cihaz_ad : ''] : o.tur === 'otekiler' ? [o.ayrinti + ' cihaz', o.cihaz_ad]
      : o.tur === 'yonetim' ? [o.ayrinti] : [o.cihaz_ad, adresAd(o.ip), o.ayrinti]).filter(Boolean);
    return { ad: OLAY[o.tur] || String(o.tur), not: [Hs.sonMetni(o.zaman, simdi)].concat(alt).join(' · '), pul: YANLIS[o.tur] ? { metin: 'dikkat', tur: 'vurgu' } : null };
  }
  /* /api/hesap/sistem cevabı → { tur, metin, alt, form (şifreli güncelle), yeniden } (eski panelin sistemHtml'i). Bilgi yokken «güncel» denmez. */
  function sistemOzet(v) {
    var surum = v.surum && v.surum.tarih ? 'sürüm ' + v.surum.tarih : '';
    if (v.calisiyor) return { tur: 'bilgi', metin: 'Güncelleniyor; bilgisayar gerekirse kendini yeniden başlatır…', alt: surum };
    if (v.durum === 'ok' && v.ag !== false && !v.geride) return { tur: 'tamam', metin: 'Güncel', alt: surum };
    if (v.durum !== 'ok' || !v.geride) return { tur: 'dikkat', metin: v.mesaj || 'Yenilik olup olmadığına bakılamadı; bilgisayarın internet bağlantısını denetle.', alt: surum, yeniden: true };
    var baslik = Number(v.geride) + ' yenilik var';
    if (v.engel) return { tur: 'dikkat', metin: baslik, alt: String(v.engel), yeniden: true };
    return { tur: 'bilgi', metin: baslik, alt: (v.yeni || []).slice(0, 3).join(' · ') || surum, form: true };
  }

  /* ---------------- çizim (saf: durum + bağlam + Bilesen → HTML) ---------------- */
  var YUK = '<p class="soluk" aria-busy="true">Yükleniyor…</p>';
  // iletinin hangi bölümde çıktığı (odak oraya gider)
  var BOLUM = { profil: 'hy-profil', guvenlik: 'hy-guvenlik', yedek: 'hy-yedek', kullanici: 'hy-kullanicilar', kisi: 'hy-kullanicilar', veri: 'hy-veri', sistem: 'hy-sistem' };
  function ac(ne, ek) { var v = { 'hy-ac': ne }; for (var k in ek || {}) v[k] = String(ek[k]); return v; }
  function form(ad, ic) { return '<form data-hy-form="' + ad + '" novalidate>' + ic.join('') + '</form>'; }
  // Bilesen.alan'da şifre ve dosya türü yok: metin alanının çıktısı türü değiştirilerek kullanılır (etiket, ipucu, kimlik aynı kalır).
  // shortcut: Bilesen'e «parola»/«dosya» türü gelince bu iki yardımcı ona geçer
  function sifre(B, isim, ad, yeni) {
    return B.alan({ tur: 'metin', isim: isim, ad: ad, zorunlu: true }).replace('type="text"', 'type="password"')
      .replace('autocomplete="off"', 'autocomplete="' + (yeni ? 'new-password' : 'current-password') + '"');
  }
  function dosya(B, isim, ad, ipucu) {
    return B.alan({ tur: 'metin', isim: isim, ad: ad, ipucu: ipucu, zorunlu: true }).replace('type="text"', 'type="file" accept=".db,application/octet-stream"').replace(' value=""', '');
  }
  function gonder(B, s, metin) { return B.eylemler([{ metin: metin, tur: 'ana', tip: 'submit', kapali: !!s.is }]); }
  function ileti(s, yer, B) { var i = s.ileti; return i && i.yer === yer ? B.uyari({ tur: i.tur, metin: i.metin }) : ''; }
  function hataKutu(B, metin) { return B.uyari({ tur: 'hata', metin: metin, eylem: { metin: 'Yeniden dene', veri: ac('yeniden') } }); }
  function taslak(s, isim, yedek) { return s.taslak && s.taslak[isim] != null ? s.taslak[isim] : yedek == null ? '' : String(yedek); }
  function maddeler(B, ad, l) { return B.liste({ ad: ad, ogeler: l.map(function (x) { return { ad: x, uzun: true }; }) }); }

  function profilHtml(s, B) {
    var k = s.ben.kullanici || {}, renkler = (s.ben.renkler || Object.keys(RENK_AD)).filter(function (r) { return RENK_AD[r]; }), sec = {};
    renkler.forEach(function (r) { sec[r] = RENK_AD[r]; });
    var renk = taslak(s, 'hy-renk', k.renk);
    return form('profil', [
      B.alan({ tur: 'metin', isim: 'hy-gorunen', ad: 'Görünen ad', deger: taslak(s, 'hy-gorunen', k.gorunen_ad), enCok: 40 }),
      renkler.length ? B.alan({ tur: 'radyo', isim: 'hy-renk', ad: 'Renk', secenekler: sec, deger: sec[renk] ? renk : '' }) : '',
      B.acilir({ baslik: 'Kişisel bilgiler', not: 'isteğe bağlı', duzey: 3, acik: !!s.acik.kisisel, veri: { 'hy-acilir': 'kisisel' }, govde: [
        B.alan({ tur: 'metin', isim: 'hy-hitap', ad: 'King sana nasıl seslensin', deger: taslak(s, 'hy-hitap', k.hitap), yerTutucu: k.gorunen_ad || null, enCok: 30 }),
        B.alan({ tur: 'tarih', isim: 'hy-dogum', ad: 'Doğum günü', deger: taslak(s, 'hy-dogum', k.dogum) }),
        B.alan({ tur: 'metin', isim: 'hy-eposta', ad: 'E-posta', deger: taslak(s, 'hy-eposta', k.eposta), enCok: 200 }).replace('type="text"', 'type="email"').replace('autocomplete="off"', 'autocomplete="email"'),
        '<p class="soluk">Hiçbiri bir yere gönderilmez; yalnız bilgisayarındaki LifeOS’ta durur.</p>'] }),
      gonder(B, s, 'Kaydet')]);
  }
  function guvenlikHtml(s, B, simdi) {
    var out = [ileti(s, 'guvenlik', B)], u = s.uyari && s.uyari.yeni && s.uyari.yeni[0];
    if (u) out.push(B.uyari({ tur: /yanlis/.test(u.tur) ? 'dikkat' : 'bilgi', metin: (UYARI_TUR[u.tur] || 'Güvenlik olayı') + (u.cihaz_ad ? ': ' + u.cihaz_ad : ''),
      alt: [Hs.sonMetni(u.zaman, simdi), adresAd(u.ip)].filter(Boolean).join(' · ') + (s.uyari.yeni.length > 1 ? ' · ' + (s.uyari.yeni.length - 1) + ' olay daha' : ''),
      eylem: [{ metin: 'Bendim', tur: 'sade', veri: ac('uyari-gordum') }, { metin: 'İncele', tur: 'sade', veri: ac('uyari-incele') }] }));
    var l = kontrol(s, simdi), n = l.filter(function (x) { return x.dikkat; }).length;
    if (l.length) {
      out.push(B.uyari(n ? { tur: 'dikkat', metin: n === 1 ? 'Bir öneri var' : n + ' öneri var', alt: '«öneri» işaretli satırlara bir bak.' }
        : { tur: 'tamam', metin: 'Hesabın iyi korunuyor', alt: 'Kontrol listesindeki her şey yolunda.' }));
      out.push(B.liste({ ad: 'Güvenlik kontrolü', ogeler: l.map(function (x) { return { ad: x.ad, not: x.not, pul: x.dikkat ? { metin: 'öneri', tur: 'vurgu' } : null }; }) }));
    } else if (!s.benHata) out.push(YUK);
    if (s.etkinlikHata) out.push(hataKutu(B, s.etkinlikHata));
    else if (s.etkinlik) out.push(B.acilir({ baslik: 'Etkinlik', not: s.etkinlik.length ? 'son ' + s.etkinlik.length + ' olay' : 'kayıt yok', duzey: 3, acik: !!s.acik.etkinlik,
      veri: { 'hy-acilir': 'etkinlik' }, govde: s.etkinlik.length ? [B.liste({ ad: 'Son etkinlik', ogeler: s.etkinlik.map(function (o) { return olaySatiri(o, simdi); }) }),
        '<p class="soluk">Şifre ve cevaplar deftere hiç yazılmaz.</p>'] : '<p class="soluk">Henüz kayıtlı etkinlik yok.</p>' }));
    var oteki = (s.cihazlar || []).filter(function (c) { return !c.bu; }).length;
    if (oteki) out.push(s.otekiSor
      ? B.uyari({ tur: 'dikkat', metin: 'Öteki ' + oteki + ' cihazda oturum kapanır; orada yeniden giriş gerekir. Kayıtlar silinmez.',
        eylem: [{ metin: 'Hepsinden çık', tur: 'ana', veri: ac('oteki'), kapali: !!s.is }, { metin: 'Vazgeç', tur: 'sade', veri: ac('vazgec') }] })
      : B.eylemler([{ metin: 'Öteki cihazların hepsinden çık', tur: 'sade', veri: ac('oteki-sor') }]));
    return out;
  }
  /* YEDEKLER (sunucu sözü 20, admin). Geri yükleme büyük aksiyondur: önizleme, şifre; sunucu önce şimdiki hâlin yedeğini alır
   * (sistem/hesap.py _geri_yukle: kopya_al("once")). İndirme, dosyadan yükleme, ikinci yer ve geri yükleme yalnız bilgisayarın kendisinden. */
  function yedekHtml(s, B, simdi) {
    if (s.yedekHata) return hataKutu(B, s.yedekHata);
    var v = s.yedek;
    if (!v) return YUK;
    var l = v.yedekler || [], son = l[0], ik = v.ikinci || {}, pc = !!v.yerel, ind = s.indirOnay, g = s.geriOnay;
    if (ind) return B.panel({ tur: 'guclu', baslik: tarihSaat(ind.zaman) + ' yedeğini indir', govde: [ileti(s, 'yedek', B),
      maddeler(B, 'İndirmeden önce', ['Dosya bütün hesapları, şifre özetlerini ve iki adım sırlarını taşır; güvendiğin bir yerde sakla (şifreli disk, kendi bulutun).',
        'Geri yüklemek için bu bölümdeki «Dosyadan yükle»yi kullan.']),
      form('indir', [sifre(B, 'hy-indir-sifre', 'Onay için şifren'), B.eylemler([{ metin: 'İndir', tur: 'ana', tip: 'submit', kapali: !!s.is }, { metin: 'Vazgeç', tur: 'sade', veri: ac('onay-vazgec') }])])] });
    if (g) return B.panel({ tur: 'guclu', baslik: 'Hesap deposu ' + tarihSaat(g.zaman) + ' hâline döner', govde: [ileti(s, 'yedek', B),
      maddeler(B, 'Geri yüklemeden önce', [
        'Yedekte ' + say(g.yedek && g.yedek.kullanici) + ' kullanıcı, ' + say(g.yedek && g.yedek.kayit) + ' kayıt; şimdi ' + say(g.simdi && g.simdi.kullanici) + ' kullanıcı, ' + say(g.simdi && g.simdi.kayit) + ' kayıt.',
        'Önce şimdiki hâlin yedeği alınır; istersen ona geri dönersin.',
        'Bütün cihazlar (bu cihaz da) yeniden giriş yapar. Yedekten sonra değişen şifre ve ayarlar eski hâline döner.',
        'Cihazlardaki kayıtlar silinmez: yedekten sonraki değişiklikler eşitlemeyle geri gelir. Yedekten sonra silinen bir kayıt geri gelebilir.']),
      form('geri', [sifre(B, 'hy-geri-sifre', 'Onay için şifren'), B.eylemler([{ metin: 'Geri yükle', tur: 'ana', tip: 'submit', kapali: !!s.is }, { metin: 'Vazgeç', tur: 'sade', veri: ac('onay-vazgec') }])])] });
    var ikinciAlt = !ik.acik ? 'Kapalı · başka bir disk ya da USB seç' : ik.hata ? ik.hata : (ik.son ? 'Son kopya ' + Hs.sonMetni(ik.son, simdi) : 'Henüz kopya yok') + (ik.yol ? ' · ' + ik.yol : '');
    var gun = (v.saklama && v.saklama.gunluk) || 7;
    return [ileti(s, 'yedek', B),
      B.liste({ ad: 'Yedek durumu', ogeler: [
        { ad: son ? 'Son yedek' : 'Henüz yedek yok', uzun: true, pul: v.hata ? { metin: 'dikkat', tur: 'vurgu' } : null,
          not: v.hata || ((son ? Hs.sonMetni(son.zaman, simdi) + ' · ' : '') + 'her gün kendiliğinden, son ' + gun + ' gün'),
          eylemler: [{ metin: 'Şimdi yedekle', tur: 'sade', veri: ac('yedekle'), kapali: !!s.is }] },
        { ad: 'İkinci yer', not: ikinciAlt, uzun: true, pul: ik.acik && ik.hata ? { metin: 'dikkat', tur: 'vurgu' } : null,
          eylemler: ik.acik && pc ? [{ metin: 'Kapat', tur: 'sade', etiket: 'İkinci yeri kapat', veri: ac('ikinci-kapat'), kapali: !!s.is }] : null }] }),
      ik.ayni_disk ? B.uyari({ tur: 'dikkat', metin: 'İkinci yer asıl yedekle aynı diskte: disk bozulursa ikisi birden gider.' }) : '',
      B.liste({ ad: 'Tek depoya taşıma', ogeler: [{ ad: 'Bu cihazdakileri tek depoya taşı', uzun: true,
        not: s.goc ? gocMakbuz(s.goc) : 'Fotoğraflar, açılmamış profiller ve bekleyen değişiklikler dahil. Hiçbir şey silinmez.',
        eylemler: [{ metin: s.goc ? 'Yeniden gönder' : 'Bilgisayara gönder', tur: 'sade', veri: ac('goc'), kapali: !!s.is }] }] }),
      pc ? B.acilir({ baslik: ik.acik ? 'İkinci yeri değiştir' : 'İkinci yeri ayarla', duzey: 3, acik: !!s.acik.ikinci, veri: { 'hy-acilir': 'ikinci' }, govde: form('ikinci', [
        B.alan({ tur: 'metin', isim: 'hy-ikinci', ad: 'Klasör (örnek: E:\\LifeOS-yedek)', deger: taslak(s, 'hy-ikinci', ik.yol), enCok: 260, zorunlu: true,
          ipucu: 'Her yedek oraya da yazılır; son 7 kopya kalır. Bilgisayarın diski bozulursa geri dönüş buradan.' }),
        gonder(B, s, 'Kaydet ve kopyala')]) }) : '',
      pc ? B.acilir({ baslik: 'Dosyadan yükle', duzey: 3, acik: !!s.acik.yukle, veri: { 'hy-acilir': 'yukle' }, govde: form('yukle', [
        dosya(B, 'hy-dosya', 'Yedek dosyası (.db)', 'Dosya önce denetlenir; bozuksa ya da LifeOS yedeği değilse alınmaz. Yüklenen yedek listeye girer; geri yüklemek için yanındaki «Geri yükle…».'),
        gonder(B, s, 'Yükle')]) }) : '',
      l.length ? B.liste({ ad: 'Yedekler', ogeler: l.map(function (x) {
        return { ad: tarihSaat(x.zaman), uzun: true, not: (YEDEK_TUR[x.tur] || x.tur) + ' · ' + boyut(x.bayt), eylemler: pc ? [
          { metin: 'İndir', tur: 'sade', etiket: tarihSaat(x.zaman) + ' yedeğini indir', veri: ac('indir-sor', { ad: x.ad }) },
          { metin: 'Geri yükle…', tur: 'sade', etiket: tarihSaat(x.zaman) + ' yedeğini geri yükle', veri: ac('geri-sor', { ad: x.ad }), kapali: !!s.is }] : null };
      }) }) : '',
      '<p class="soluk">' + (pc ? 'Yedekler bu bilgisayarda: ' + kac(v.klasor || '') + '. Sunucu açılamazsa: python sistem/hesap.py --geri-yukle.'
        : 'İkinci yer, indirme ve geri yükleme yalnız bilgisayarın kendisinden yapılır.') + '</p>'];
  }
  // Göç paketinin makbuzu (eski panelin gocMakbuz'u): ne kadarı bilgisayara gitti.
  function gocMakbuz(v) {
    var bek = Object.keys(v.bekleyen || {}).reduce(function (n, k) { return n + (v.bekleyen[k] || 0); }, 0);
    return 'Gönderildi · ' + say(v.profil) + ' profil, ' + say(v.kayit) + ' kayıt, ' + say(v.anahtar) + ' yan kayıt, ' + say(v.medya) + ' dosya · bekleyen ' + bek;
  }
  function kisiHtml(s, B, u, benId) {
    var planlar = (s.ben && s.ben.planlar) || [];
    var sec = function (alan, l, simdiki) { return B.eylemler(l.map(function (p) {
      return { metin: p[1], tur: 'sade', basili: p[0] === simdiki, veri: ac('yonet', { id: u.id, alan: alan, deger: p[0] }) }; })); };
    return B.panel({ tur: 'guclu', baslik: (u.gorunen_ad || u.ad) + ' · @' + u.ad, govde: [ileti(s, 'kisi', B),
      B.ayar({ id: 'hy-kisi-rol', ad: 'Rol', govde: sec('rol', [['uye', 'Üye'], ['admin', 'Admin']], u.rol) }),
      planlar.length ? B.ayar({ id: 'hy-kisi-plan', ad: 'Plan', govde: sec('plan', planlar.map(function (p) { return [p.id, p.ad]; }), u.plan) }) : '',
      u.iki_adim && u.id !== benId ? B.ayar({ id: 'hy-kisi-iki', ad: 'İki adımlı doğrulama açık', not: 'Telefonunu kaybettiyse kapat; sonra yeniden kurar.',
        govde: B.dugme({ metin: 'Kapat', tur: 'sade', etiket: u.ad + ' için iki adımlı doğrulamayı kapat', veri: ac('iki-kapat', { id: u.id }) }) }) : '',
      B.eylemler([{ metin: 'Bitti', tur: 'sade', veri: ac('kisi', { id: u.id }) }])] });
  }
  function kullaniciHtml(s, B, simdi) {
    if (s.kulHata) return hataKutu(B, s.kulHata);
    if (!s.kul) return YUK;
    var benId = s.ben && s.ben.kullanici && s.ben.kullanici.id, acik = s.kul.filter(function (u) { return u.id === s.kisi; })[0];
    return [ileti(s, 'kullanici', B),
      B.ayar({ id: 'hy-kayit', ad: 'Yeni hesap açılabilir', not: s.kayit ? 'Herkes kendi hesabını açar.' : 'Kapalı: hesabı sen eklersin.',
        govde: B.dugme({ metin: s.kayit ? 'Kapat' : 'Aç', tur: 'sade', etiket: s.kayit ? 'Yeni hesap açmayı kapat' : 'Yeni hesap açmayı aç', veri: ac('kayit'), kapali: !!s.is }) }),
      s.kul.length ? B.liste({ ad: 'Kullanıcılar', ogeler: s.kul.map(function (u) {
        return { ad: String(u.gorunen_ad || u.ad), uzun: true, not: '@' + u.ad + ' · ' + rolAd(u.rol) + (u.plan_ad ? ' · ' + u.plan_ad : '') + ' · son görülme ' + Hs.sonMetni(u.son, simdi),
          pul: u.id === benId ? { metin: 'sen', tur: 'vurgu' } : null,
          eylemler: [{ metin: s.kisi === u.id ? 'Bitti' : 'Yönet', tur: 'sade', etiket: (u.gorunen_ad || u.ad) + ' kullanıcısını yönet', veri: ac('kisi', { id: u.id }) }] };
      }) }) : B.bos({ baslik: 'Listede kullanıcı yok.' }),
      acik ? kisiHtml(s, B, acik, benId) : '',
      B.acilir({ baslik: 'Kullanıcı ekle', duzey: 3, acik: !!s.acik.ekle, veri: { 'hy-acilir': 'ekle' }, govde: form('ekle', [
        B.alan({ tur: 'metin', isim: 'hy-yeni-ad', ad: 'Kullanıcı adı', deger: taslak(s, 'hy-yeni-ad'), enCok: 32, zorunlu: true }),
        sifre(B, 'hy-yeni-sifre', 'Geçici şifre', true), gonder(B, s, 'Ekle')]) })];
  }
  /* VERİN (sunucu sözü 13): indir ya da hesabı sil. Silme geri alınamaz: önce ne gideceği ve ne kalacağı yazılır, şifre sorulur. */
  function veriHtml(s, B) {
    var ay = s.ben && s.ben.ayrinti, n = 0, b = 0, c = s.cihazlar ? s.cihazlar.length : null;
    if (ay) Object.keys(ay).forEach(function (a) { n += Number(ay[a].n) || 0; b += Number(ay[a].bayt) || 0; });
    var t = ay ? ' · ' + say(n) + ' kayıt' + (b ? ' · ' + boyut(b) : '') : '';
    return [ileti(s, 'veri', B),
      B.liste({ ad: 'Verin', ogeler: [{ ad: 'Verimi indir', not: 'Bilgisayardaki kopyanın tamamı' + t + ' · tek JSON dosyası', uzun: true,
        eylemler: [{ metin: 'İndir', tur: 'sade', etiket: 'Verimi indir', veri: ac('disa'), kapali: !!s.is }] }] }),
      s.silSor ? B.panel({ tur: 'guclu', baslik: 'Hesabın kalıcı olarak silinir', govde: [
        B.uyari({ tur: 'dikkat', metin: 'Geri alınamaz.', alt: 'İstersen önce verini indir.' }),
        maddeler(B, 'Silinen ve kalan', ['Silinir: bilgisayardaki kopya' + (ay ? ' (' + say(n) + ' kayıt)' : '') + ', ' + (c == null ? 'oturumlar' : c + ' cihazdaki oturum') + ', etkinlik ve kişisel bilgiler.',
          'Kalır: her cihazdaki veri, o cihazın kendi deposunda.']),
        form('sil', [sifre(B, 'hy-sil-sifre', 'Onay için şifren'),
          B.eylemler([{ metin: 'Hesabı kalıcı olarak sil', tur: 'ana', tip: 'submit', kapali: !!s.is }, { metin: 'Vazgeç', tur: 'sade', veri: ac('vazgec') }])])] })
        : B.eylemler([{ metin: 'Hesabı sil', tur: 'sade', veri: ac('sil-sor') }, { yazi: 'Geri alınamaz; önce ne gideceği yazılır, şifre sorulur.' }])];
  }
  // BİLGİSAYARI TELEFONDAN GÜNCELLE (sunucu sözü 28): admin ve şifre; defterde kim, hangi cihazdan görünür.
  function sistemHtml(s, B) {
    if (s.sistemHata) return hataKutu(B, s.sistemHata);
    if (!s.sistem) return YUK;
    var o = sistemOzet(s.sistem), son = s.sistem.sonuc && s.sistem.sonuc.durum !== 'guncellendi' && s.sistem.sonuc.durum !== 'guncel' ? s.sistem.sonuc.mesaj || '' : '';
    return [ileti(s, 'sistem', B), B.uyari({ tur: o.tur, metin: o.metin, alt: o.alt || null }),
      son && !s.sistem.calisiyor ? B.uyari({ tur: 'hata', metin: son }) : '',
      o.form ? form('sistem', [sifre(B, 'hy-sistem-sifre', 'Şifre'), gonder(B, s, 'Bilgisayarı güncelle'), '<p class="soluk">Kayıtlarına dokunmaz; yalnız programı ileri sarar.</p>']) : '',
      o.yeniden ? B.eylemler([{ metin: 'Yeniden kontrol et', tur: 'sade', veri: ac('sistem-bak') }]) : ''];
  }
  function sistemGorunur(bag) { return !!(bag.oturum && bag.oturum.rol === 'admin' && bag.sunucu && bag.sunucu.yerel === false); }
  /* s: { ben, benHata, etkinlik, etkinlikHata, uyari {liste, yeni}, cihazlar, kul, kayit, kulHata, yedek, yedekHata, sistem, sistemHata,
   * ileti {yer, tur, metin}, is, otekiSor, silSor, indirOnay, geriOnay, kisi, acik {}, taslak {} }. bag: Kabuk.hesapUzanti bağlamı.
   * Yönetim bölümleri oturumun rolüne göre çizilir; yetkiyi sunucu denetler (üye isteğine 403). */
  function ekran(s, bag, B, simdi) {
    var o = bag.oturum;
    if (!o) return '';
    s.acik = s.acik || {};
    var admin = o.rol === 'admin';
    return [
      B.bolum({ baslik: 'Profil', id: 'hy-profil', govde: [ileti(s, 'profil', B), s.benHata ? hataKutu(B, s.benHata) : s.ben ? profilHtml(s, B) : YUK] }),
      B.bolum({ baslik: 'Güvenlik kontrolü ve etkinlik', id: 'hy-guvenlik', govde: guvenlikHtml(s, B, simdi) }),
      admin ? B.bolum({ baslik: 'Yedekler', id: 'hy-yedek', govde: yedekHtml(s, B, simdi) }) : '',
      admin ? B.bolum({ baslik: 'Kullanıcılar', id: 'hy-kullanicilar', govde: kullaniciHtml(s, B, simdi) }) : '',
      B.bolum({ baslik: 'Dışa aktar ve hesabı sil', id: 'hy-veri', govde: veriHtml(s, B) }),
      sistemGorunur(bag) ? B.bolum({ baslik: 'Güncelleme (telefondan)', id: 'hy-sistem', govde: sistemHtml(s, B) }) : ''].join('');
  }

  var Yonetim = { tarihSaat: tarihSaat, boyut: boyut, yanlisSayisi: yanlisSayisi, yedekHatasi: yedekHatasi, kontrol: kontrol, olaySatiri: olaySatiri,
    gocMakbuz: gocMakbuz, sistemOzet: sistemOzet, sistemGorunur: sistemGorunur, ekran: ekran };
  Kabuk.HesapYonetim = Yonetim;
  if (typeof module !== 'undefined' && module.exports) module.exports = Yonetim;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var d = document, s = yeni(null), sistemZaman = null;
  function yeni(ad) { return { ad: ad, rol: '', ben: null, benHata: '', etkinlik: null, etkinlikHata: '', uyari: null, cihazlar: null, kul: null, kayit: false, kulHata: '',
    yedek: null, yedekHata: '', sistem: null, sistemHata: '', sistemIstendi: false, ileti: null, is: '', otekiSor: false, silSor: false, indirOnay: null, geriOnay: null,
    kisi: null, acik: {}, taslak: {} }; }
  function H() { return L.HESAP; }
  function burada() { return location.hash.split('?')[0] === '#/hesap'; }
  function ciz() { if (burada() && Kabuk.ic) Kabuk.ic.rota(); }
  function hm(e) { return Hs.hataMetni(e); }
  // Yeniden çizimden önce: yazılmış (şifre ve dosya olmayan) alanlar ve açık bölümler korunur; şifre hiç taşınmaz.
  function yerindeTopla() {
    var el = d.getElementById('sayfa');
    if (!el) return;
    el.querySelectorAll('form[data-hy-form] input').forEach(function (i) {
      if (i.type === 'password' || i.type === 'file') return;
      if (i.type === 'radio') { if (i.checked) s.taslak[i.name] = i.value; } else s.taslak[i.name] = i.value;
    });
    el.querySelectorAll('details[data-hy-acilir]').forEach(function (x) { s.acik[x.getAttribute('data-hy-acilir')] = x.open; });
  }
  function al(b, alan, hataAlan, p) { p.then(function (v) { if (s !== b) return; s[alan] = v; s[hataAlan] = ''; ciz(); }, function (e) { if (s !== b) return; s[hataAlan] = hm(e); ciz(); }); }
  function yukle() {
    var h = H(), b = s;
    if (!h) return;
    al(b, 'ben', 'benHata', h.ben());
    al(b, 'etkinlik', 'etkinlikHata', h.etkinlik());
    h.cihazlar().then(function (l) { if (s === b) { s.cihazlar = l; ciz(); } }, function () { /* Cihazlar bölümü hatayı kendi söyler */ });
    h.uyarilar().then(function (u) { if (s === b) { s.uyari = u; ciz(); } }, function () { /* uyarı yoklaması ekranı bozmaz */ });
    if (s.rol !== 'admin') return;
    h.kullanicilar().then(function (v) { if (s !== b) return; s.kul = v.kullanicilar || []; s.kayit = !!v.kayit; s.kulHata = ''; ciz(); }, function (e) { if (s === b) { s.kulHata = hm(e); ciz(); } });
    al(b, 'yedek', 'yedekHata', h.yedekDurum());
  }
  function sistemYukle(taze) {
    var b = s; s.sistemIstendi = true;
    H().sistemDurum(taze).then(function (v) { if (s !== b) return; s.sistem = v; s.sistemHata = ''; ciz(); if (v.calisiyor) sistemIzle(); },
      function (e) { if (s === b) { s.sistemHata = hm(e); ciz(); } });
  }
  // Kurulum sürerken bilgisayar yeniden başlayabilir: kısa cevapsızlık hata sayılmaz (eski panelin sistemIzle'si; 3 sn, en çok 15 dk).
  function sistemIzle() {
    clearTimeout(sistemZaman);
    var b = s, bitis = Date.now() + 900000;
    (function tur() {
      sistemZaman = setTimeout(function () {
        if (s !== b || !burada()) return;
        H().sistemDurum(true).then(function (v) { if (s !== b) return; s.sistem = v; ciz(); if (v.calisiyor) tur(); }, function () { if (s === b && Date.now() < bitis) tur(); });
      }, 3000);
    })();
  }
  function uzanti(bag, B) {
    var o = bag.oturum;
    if (!o) return '';
    var el = d.getElementById('sayfa'), giris = !el || el.getAttribute('data-yer') !== 'hesap';
    if (giris || s.ad !== o.ad) { clearTimeout(sistemZaman); s = yeni(o.ad); s.rol = o.rol; yukle(); } // sayfaya her girişte taze
    else if (s.atla) s.atla = false; else yerindeTopla();
    if (sistemGorunur(bag) && !s.sistemIstendi && H()) sistemYukle(false);
    return ekran(s, bag, B, bag.simdi);
  }
  Kabuk.hesapUzanti = Kabuk.hesapUzanti || [];
  Kabuk.hesapUzanti.push({ ad: 'yonetim', sira: 30, ciz: uzanti });

  function odakla(sec) { var f = d.querySelector(sec); if (f) try { f.focus(); } catch (e) { /* yok */ } }
  /* Bir iş: düğmeler kilitlenir, sonucu bölümün iletisi söyler (başarı «Tamam», hata «Hata»; odak ona). */
  function is(yer, fn, sonra) {
    if (s.is) return;
    var b = s;
    s.is = yer; s.ileti = null; ciz();
    Promise.resolve().then(fn).then(function (m) {
      if (s !== b) return;
      s.is = ''; s.ileti = m ? { yer: yer, tur: 'tamam', metin: m } : null; s.atla = true; ciz(); // başarıda gönderilen form DOM'dan geri toplanmaz
      if (s.ad) al(b, 'etkinlik', 'etkinlikHata', H().etkinlik()); // iş deftere olay yazmış olabilir (yedek indirildi, rol değişti…)
      if (sonra) sonra(true); else if (m) odakla('[aria-labelledby="' + BOLUM[yer] + '"] .b-uyari--tamam');
    }, function (e) {
      if (s !== b) return;
      s.is = ''; s.ileti = { yer: yer, tur: 'hata', metin: e && e.kod === 0 ? 'Bilgisayara ulaşılamıyor.' : (e && e.message) || 'İşlem yapılamadı.' }; ciz();
      odakla('[aria-labelledby="' + BOLUM[yer] + '"] .b-uyari--hata');
    });
  }
  function deger(f, ad) { var i = f.elements[ad]; return i ? i.value : ''; }
  function unut(l) { l.forEach(function (k) { delete s.taslak[k]; }); }
  // Göç paketini toplayan betik (brand/ortak/gocpaket.js) yalnız düğmeye basılınca yüklenir.
  function gocBetik() {
    if (L.GocPaket) return Promise.resolve();
    return new Promise(function (tamam, red) {
      var e = d.createElement('script'); e.src = '/gocpaket.js';
      e.onload = function () { if (L.GocPaket) tamam(); else red(new Error('Göç paketi yüklenemedi.')); };
      e.onerror = function () { red(new Error('Göç paketi yüklenemedi.')); };
      d.head.appendChild(e);
    });
  }

  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-hy-ac]');
    if (!b || b.getAttribute('aria-disabled') === 'true' || !burada() || !H()) return;
    var ne = b.getAttribute('data-hy-ac'), id = +b.getAttribute('data-id'), h = H();
    if (ne === 'yeniden') { var ad = s.ad, rol = s.rol; s = yeni(ad); s.rol = rol; yukle(); return ciz(); }
    if (ne === 'uyari-gordum' || ne === 'uyari-incele') {
      h.uyariGordum(); s.uyari = { liste: (s.uyari && s.uyari.liste) || [], yeni: [] };
      if (ne === 'uyari-incele') s.acik.etkinlik = true;
      ciz(); return ne === 'uyari-incele' && odakla('details[data-hy-acilir="etkinlik"] summary');
    }
    if (ne === 'oteki-sor') { s.otekiSor = true; ciz(); return odakla('[data-hy-ac="oteki"]'); }
    if (ne === 'vazgec') { s.otekiSor = false; s.silSor = false; s.ileti = null; return ciz(); }
    if (ne === 'oteki') return is('guvenlik', function () {
      return h.otekilerdenCik().then(function (n) { s.otekiSor = false; return h.cihazlar().then(function (l) { s.cihazlar = l; return n ? n + ' cihazda oturum kapandı.' : 'Öteki cihaz yoktu.'; }); });
    });
    if (ne === 'yedekle') return is('yedek', function () {
      return h.yedekle().then(function (v) {
        s.yedek = v;
        if (s.ben && s.ben.yedek) s.ben.yedek = Object.assign({}, s.ben.yedek, { son: Date.now(), hata: '' });
        var x = (v.yedekler || []).filter(function (y) { return y.ad === v.alinan; })[0];
        return 'Yedek alındı' + (x ? ' · ' + boyut(x.bayt) : '') + (v.ikinci && v.ikinci.acik && !v.ikinci.hata ? '; ikinci yere de yazıldı.' : '.');
      });
    });
    if (ne === 'ikinci-kapat') return is('yedek', function () { return h.yedekAyar('').then(function (v) { s.yedek = v; return 'İkinci yer kapandı; yedekler yalnız bu bilgisayarda.'; }); });
    if (ne === 'indir-sor') {
      s.indirOnay = ((s.yedek && s.yedek.yedekler) || []).filter(function (y) { return y.ad === b.getAttribute('data-ad'); })[0] || null; s.ileti = null;
      ciz(); return odakla('#b-alan-hy-indir-sifre');
    }
    if (ne === 'geri-sor') return is('yedek', function () { return h.yedekOnizle(b.getAttribute('data-ad')).then(function (g) { s.geriOnay = g; return ''; }); },
      function () { odakla('#b-alan-hy-geri-sifre'); });
    if (ne === 'onay-vazgec') { s.indirOnay = null; s.geriOnay = null; s.ileti = null; return ciz(); }
    if (ne === 'kayit') return is('kullanici', function () { return h.kayitAyarla(!s.kayit).then(function (v) { s.kayit = !!v; return v ? 'Yeni hesap açma açık.' : 'Yeni hesap açma kapalı.'; }); });
    if (ne === 'kisi') { s.kisi = s.kisi === id ? null : id; s.ileti = null; return ciz(); }
    if (ne === 'yonet' || ne === 'iki-kapat') {
      if (b.getAttribute('aria-pressed') === 'true') return;
      var deg = ne === 'iki-kapat' ? { iki_adim: false } : {};
      if (ne === 'yonet') deg[b.getAttribute('data-alan')] = b.getAttribute('data-deger');
      return is('kisi', function () {
        return h.yonet(id, deg).then(function (u) {
          s.kul = s.kul.map(function (x) { return x.id === u.id ? Object.assign({}, x, u, ne === 'iki-kapat' ? { iki_adim: false } : {}) : x; });
          return ne === 'iki-kapat' ? 'İki adımlı doğrulaması kapandı.' : 'Kaydedildi.';
        });
      });
    }
    if (ne === 'goc') return is('yedek', function () { return gocBetik().then(function () { return h.gocGonder(); }).then(function (v) { s.goc = v; return gocMakbuz(v) + '.'; }); });
    if (ne === 'disa') return is('veri', function () { return h.disaAktar().then(function (v) { return v.ad + ' hazır · ' + say(v.kayit) + ' kayıt.'; }); });
    if (ne === 'sil-sor') { s.silSor = true; s.ileti = null; ciz(); return odakla('#b-alan-hy-sil-sifre'); }
    if (ne === 'sistem-bak') { s.sistem = null; s.sistemHata = ''; ciz(); return sistemYukle(true); }
  });

  d.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f.matches || !f.matches('form[data-hy-form]') || !burada() || !H()) return;
    e.preventDefault();
    var ne = f.getAttribute('data-hy-form'), h = H(), p = null;
    if (ne === 'profil') {
      var r = f.querySelector('input[name="hy-renk"]:checked');
      var pv = [deger(f, 'hy-gorunen'), r ? r.value : null, { hitap: deger(f, 'hy-hitap'), dogum: deger(f, 'hy-dogum'), eposta: deger(f, 'hy-eposta') }];
      p = ['profil', function () {
        return h.profilAyarla(pv[0], pv[1], pv[2]).then(function (k) { if (s.ben) s.ben.kullanici = k; unut(['hy-gorunen', 'hy-renk', 'hy-hitap', 'hy-dogum', 'hy-eposta']); return 'Profil kaydedildi.'; });
      }];
    } else if (ne === 'ekle') {
      var yad = deger(f, 'hy-yeni-ad').trim(), ysf = deger(f, 'hy-yeni-sifre');
      p = ['kullanici', function () {
        return h.kullaniciEkle(yad, ysf).then(function (u) {
          unut(['hy-yeni-ad']); s.acik.ekle = false;
          return h.kullanicilar().then(function (v) { s.kul = v.kullanicilar || []; return '«' + u.ad + '» eklendi. Geçici şifreyi ona sen söyle.'; });
        });
      }];
    } else if (ne === 'ikinci') {
      var yol = deger(f, 'hy-ikinci').trim();
      p = ['yedek', function () {
        return h.yedekAyar(yol).then(function (v) { s.yedek = v; if (v.ikinci && v.ikinci.hata) throw new Error(v.ikinci.hata); unut(['hy-ikinci']); s.acik.ikinci = false; return 'İkinci yer ayarlandı; son yedek oraya da yazıldı.'; });
      }];
    } else if (ne === 'yukle') {
      var dos = f.elements['hy-dosya'] && f.elements['hy-dosya'].files[0];
      p = ['yedek', function () { return h.yedekYukle(dos).then(function (v) { s.yedek = v; s.acik.yukle = false; return 'Yedek eklendi (' + v.eklenen + '). Geri yüklemek için listeden «Geri yükle…».'; }); }];
    } else if (ne === 'indir' && s.indirOnay) {
      var x = s.indirOnay, si = deger(f, 'hy-indir-sifre');
      p = ['yedek', function () { return h.yedekIndir(x.ad, si).then(function (v) { s.indirOnay = null; return v.ad + ' hazır · ' + boyut(v.bayt) + '. Güvendiğin bir yerde sakla.'; }); }];
    } else if (ne === 'geri' && s.geriOnay) {
      var g = s.geriOnay, sg = deger(f, 'hy-geri-sifre');
      // Başarıda istemci bütün oturumları kapatır (bu cihazınki de): ekran giriş durumuna döner, bu durum bir sonraki girişte tazelenir.
      p = ['yedek', function () { return h.geriYukle(g.ad, sg).then(function () { s.ad = null; return ''; }); }];
    } else if (ne === 'sil') {
      var ss = deger(f, 'hy-sil-sifre');
      p = ['veri', function () { return h.hesabiSil(ss).then(function () { s.ad = null; return ''; }); }];
    } else if (ne === 'sistem') {
      var sy = deger(f, 'hy-sistem-sifre');
      p = ['sistem', function () { return h.sistemGuncelle(sy).then(function () { s.sistem = Object.assign({}, s.sistem, { calisiyor: true, sonuc: null }); sistemIzle(); return ''; }); }];
    }
    f.querySelectorAll('input[type=password]').forEach(function (i) { i.value = ''; }); // şifre yalnız bu istekte; alan hemen boşalır
    if (p) is(p[0], p[1]);
  });
})(typeof window !== 'undefined' ? window : globalThis);
