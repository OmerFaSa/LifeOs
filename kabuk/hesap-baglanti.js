/* kabuk/hesap-baglanti.js — Hesap ekranı uzantısı (Kabuk.hesapUzanti, sira 20; belgeler/ekip/sadelesme/faz7-hesap-baglanti.md).
 * «Bağlantılar»: takvim aboneliği (aç, adresi kopyala, onaylı yenile ve kapat, .ics indir) ve erişim anahtarları (şifreyle oluştur, bir kez göster,
 * hazır tarifler, son kullanım, onaylı sil). «Her yerden erişim»: Merkez'in hâli herkese salt okunur; Tailscale aç/kapat ve açılışta başlama
 * yalnız bu bilgisayarda, admin için (sunucu da denetler). Akış ve sözler eski panelden (brand/ortak/hesap.js baglantilar/takvim/anahtarlar/uzak).
 * Jeton bu dosyaya gelmez: istekler LIFEOS.HESAP'tan. Yeni anahtar yalnız bellekte durur ve bir kez görünür; sayfadan çıkınca düşer, depoya girmez.
 * Tarayıcıda window.LIFEOS.Kabuk.HesapBaglanti, Node'da module.exports (yalnız saf kısım; sonMetni için önce kabuk/hesap.js yüklenir). */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  var YER_TUTUCU = 'lifeos_…', KAPI = 443; // KAPI: Tailscale serve'in tek kapısı (sistem/uzak.py HESAP_KAPI)
  var YUKLENIYOR = '<p class="soluk" aria-busy="true">Yükleniyor…</p>';
  function p(m) { return '<p class="soluk">' + Kabuk.Bilesen.kac(m) + '</p>'; }
  function son(ms, simdi) { return Kabuk.Hesap.sonMetni(ms, simdi); }

  /* Bu cihazdan bilgisayara giden adres (eski panelin evAdresleri): oturumun sunucusu, https kökeni, yoksa ev ağı / Tailscale adı.
   * pc: bilgisayarın kendisinde açıldıysa yerel köken (Thunderbird, bu bilgisayardaki uygulamalar); ev adresiyle aynıysa yok. */
  function adresler(bag, konum) {
    var o = bag.oturum || {}, sv = bag.sunucu || {}, ev = '';
    if (o.sunucu) ev = String(o.sunucu).replace(/\/$/, '');
    else if (konum && konum.protocol === 'https:') ev = konum.origin;
    else if (Array.isArray(sv.ev_agi) && sv.ev_agi[0]) ev = 'https://' + sv.ev_agi[0] + ':' + KAPI;
    var pc = sv.yerel && konum && konum.protocol === 'http:' ? konum.origin : '';
    return { ev: ev, pc: pc !== ev ? pc : '' };
  }
  // Tariflerdeki istek: anahtar az önce açıldıysa içine yazılır, yoksa yer tutucu
  function tarifIstek(adr, yeni) {
    return { url: (adr.ev || 'https://BİLGİSAYARIN-IP:' + KAPI) + '/api/hesap/gelen', pc: adr.pc ? adr.pc + '/api/hesap/gelen' : '', a: yeni ? yeni.anahtar : YER_TUTUCU };
  }
  // salt okunur alan + yanında «Kopyala» (kopyalanan metin alanın kendisinden okunur; data-* içine sır yazılmaz)
  function kopyaAlani(B, ad, isim, deger, ipucu, cok) {
    return B.alan({ ad: ad, isim: isim, tur: cok ? 'cok' : 'metin', deger: deger, salt: true, ipucu: ipucu }) +
      B.eylemler([{ metin: 'Kopyala', tur: 'sade', etiket: ad + ' kopyala', veri: { 'hb-ac': 'kopyala', 'hb-hedef': 'b-alan-' + isim } }]);
  }
  // shortcut: Bilesen.alan'da parola türü yok; metin alanı parolaya çevrilir. Katalog parola türü alınca ona geçilir.
  function parolaAlani(B, isim) {
    return B.alan({ ad: 'Şifren', isim: isim, zorunlu: true }).replace('type="text"', 'type="password"').replace('autocomplete="off"', 'autocomplete="current-password"');
  }
  function ileti(s, yer, B) {
    return (s.ileti && s.ileti.yer === yer ? B.uyari({ tur: 'tamam', metin: s.ileti.metin }) : '') +
      (s.hata && s.hata.yer === yer ? B.uyari({ tur: 'hata', metin: s.hata.metin }) : '');
  }

  /* ---- takvim aboneliği (sunucu sözü 17) ---- */
  function takvimHtml(s, B, adr, simdi) {
    var t = s.bag.takvim || {}, ays = (t.yayinlar || []).filter(function (y) { return y.ad === 'ays/takvim'; })[0];
    var ust = B.ayar({ id: 'hb-takvim', ad: 'Takvim aboneliği', deger: t.acik ? 'Açık' : 'Kapalı',
      not: 'iPhone Takvim, Outlook, Thunderbird. İçinde AYS: sınav günleri, istisnalar, hedef son günleri' +
        (ays ? (ays.adet == null ? '.' : ' · ' + ays.adet + ' etkinlik.') : ' · AYS’yi bir kez aç.') });
    if (!t.acik) return ust + p('Sınav günlerin takviminde: takvim uygulaman bu adrese abone olur; AYS’de bir tarih değişince takvimin de kendiliğinden güncellenir.') +
      B.eylemler([{ metin: 'Aboneliği aç', tur: 'ana', veri: { 'hb-ac': 'takvim-ac' } }]);
    var sor = s.takvimSor === 'yenile' ? { metin: 'Adres yenilensin mi?', alt: 'Eski adres hemen çalışmaz; takvim uygulamalarına yenisini eklemen gerekir.', dugme: 'Adresi yenile', ac: 'takvim-yenile' }
      : s.takvimSor === 'kapat' ? { metin: 'Abonelik kapansın mı?', alt: 'Adres artık çalışmaz; yeniden açınca yeni bir adres gelir.', dugme: 'Aboneliği kapat', ac: 'takvim-kapat' } : null;
    return ust +
      (adr.ev ? kopyaAlani(B, 'iPhone ve iPad adresi', 'hb-takvim-ev', adr.ev + t.yol, 'Ayarlar › Takvim › Hesaplar › Hesap Ekle › Diğer › «Abone Olunan Takvim Ekle»ye bu adresi yapıştır.') : '') +
      (adr.pc ? kopyaAlani(B, 'Bu bilgisayarın adresi', 'hb-takvim-pc', adr.pc + t.yol, 'Thunderbird ya da klasik Outlook’ta «İnternet takvimi ekle».') : '') +
      p('Google Takvim adresi internetten çeker; evdeki bilgisayarına ulaşamaz. Dosyayı indirip Google Takvim’de «İçe aktar»la bir kez ekleyebilirsin.') +
      (sor ? B.uyari({ tur: 'dikkat', metin: sor.metin, alt: sor.alt, eylem: [{ metin: sor.dugme, tur: 'ana', veri: { 'hb-ac': sor.ac } }, { metin: 'Vazgeç', tur: 'sade', veri: { 'hb-ac': 'vazgec' } }] })
        : B.eylemler([{ metin: 'Dosyayı indir (.ics)', tur: 'sade', veri: { 'hb-ac': 'takvim-indir' } }, { metin: 'Adresi yenile', tur: 'sade', veri: { 'hb-ac': 'takvim-yenile-sor' } },
          { metin: 'Aboneliği kapat', tur: 'sade', veri: { 'hb-ac': 'takvim-kapat-sor' } }])) +
      p((t.son ? 'Takvim en son ' + son(t.son, simdi) + ' baktı.' : 'Henüz hiçbir takvim bakmadı.') + ' Adres bir anahtardır: yalnız kendi cihazlarına ekle.');
  }

  /* ---- erişim anahtarları (sunucu sözü 16, söz 19) ---- */
  function anahtarSatiri(x, simdi, sorulan) {
    var ad = String(x.ad || 'Anahtar'), id = String(x.id), etiket = '«' + ad + '» anahtarını sil';
    if (sorulan === x.id) return { ad: ad, uzun: true, not: 'Silinsin mi? Onu kullanan kısayol artık çalışmaz.',
      eylemler: [{ metin: 'Evet, sil', tur: 'ana', etiket: etiket, veri: { 'hb-ac': 'sil', id: id } }, { metin: 'Vazgeç', tur: 'sade', veri: { 'hb-ac': 'vazgec' } }] };
    return { ad: ad, not: String(x.on_ek || '') + '… · ' + (String(x.yetki || '').split(',').indexOf('oku') >= 0 ? 'özeti de okur · ' : '') +
      (x.son ? 'son kullanım ' + son(x.son, simdi) : 'hiç kullanılmadı'), eylemler: [{ metin: 'Sil', tur: 'sade', etiket: etiket, veri: { 'hb-ac': 'sil-sor', id: id } }] };
  }
  function adimlar(B, ad, l) { return B.liste({ ad: ad, ogeler: l.map(function (x, j) { return { ad: (j + 1) + '. ' + x, uzun: true }; }) }); }
  function tariflerHtml(B, t) {
    var bearer = 'Bearer ' + t.a, ozet = t.url.replace(/\/gelen$/, '/ozet.txt');
    return B.acilir({ baslik: 'İstek', duzey: 3, not: 'Her tarif bu tek isteği gönderir', govde: [
      t.a === YER_TUTUCU ? p('Anahtar oluşturunca burada görünür.') : '',
      kopyaAlani(B, 'Adres', 'hb-istek-adres', t.url, 'Yöntem POST. Önce dene: aynı adrese aynı başlıkla gövdesiz GET «Bağlantı tamam» döner, satır bırakmaz.'),
      kopyaAlani(B, 'Başlık: Authorization', 'hb-istek-baslik', bearer),
      B.ayar({ id: 'hb-istek-govde', ad: 'Gövde (JSON)', not: 'AYS ya da ESP için "modul": "ays" ya da "esp" ekle; yazılmazsa SPİ.', deger: '{"metin": "su 250"}' }),
      t.pc ? B.ayar({ id: 'hb-istek-pc', ad: 'Bu bilgisayardaki bir uygulama için adres', deger: t.pc }) : ''] }) +
      B.acilir({ baslik: 'iPhone Kısayollar', duzey: 3, govde: adimlar(B, 'iPhone Kısayollar adımları', [
        'Kısayollar’da yeni kısayol › «Girdi İste» (Ask for Input) ekle.',
        '«URL’nin İçeriğini Al» (Get Contents of URL) ekle; adres, POST, başlık ve gövde yukarıdaki «İstek»teki gibi; «metin» alanına «Sağlanan Girdi»yi koy.',
        'Adını «LifeOS’a yaz» koy. Siri’ye «LifeOS’a yaz» deyip «su 250» söyle.']) }) +
      B.acilir({ baslik: 'Siri: «Bugün ne var?»', duzey: 3, govde: [adimlar(B, 'Siri adımları', [
        'Anahtarı «Günün özetini de okuyabilsin» seçerek oluştur.',
        'Kısayollar’da yeni kısayol › «URL’nin İçeriğini Al»: adres ' + ozet + ', yöntem GET, başlık Authorization = ' + bearer + '.',
        '«Metni Konuş» (Speak Text) ekle; girdi önceki adımın sonucu.',
        'Adını «Bugün ne var» koy. Siri’ye «Bugün ne var» de.']),
        p('Özeti her sistem kendi kuralıyla yazar. Bugün hiç açılmamış bir sistemin dünkü sayısı bugünmüş gibi okunmaz: «bugün henüz açılmadı» denir.')] }) +
      B.acilir({ baslik: 'AYS ve ESP’ye', duzey: 3, govde: [adimlar(B, 'AYS ve ESP adımları', [
        'Aynı istek; gövdeye "modul" ekle: {"metin": "paragraf 20", "modul": "ays"}.',
        'AYS anlar: soru 40 matematik, 2 saat fizik, paragraf 20, uyku 7.',
        'ESP anlar: 30 dk gitar, 45 dakika felsefe okudum, 20 dk diksiyon.',
        'Kısayollar’da her sistem için ayrı kısayol aç: «AYS’ye yaz», «ESP’ye yaz».']),
        p('Her satırı yalnız kendi sistemi alır; o gün o dersin bloğu yoksa ya da süre yazılmadıysa satır «anlaşılmadı» diye nedeniyle döner, uydurulmaz.')] }) +
      B.acilir({ baslik: 'Apple Sağlık’tan her sabah', duzey: 3, govde: [adimlar(B, 'Apple Sağlık adımları', [
        'Kısayollar › Otomasyon › Günün Saati (ör. 08:00) › Hemen Çalıştır.',
        '«Sağlık Örneklerini Bul» (Find Health Samples): Kilo, son 1 gün, en yeni 1 örnek.',
        '«Metin»: kilo ve bulunan değer; sonra «URL’nin İçeriğini Al» ile gönder.',
        'Uyku için «Uyku Analizi»nin süresi toplanır; SPİ uyku 7,2 gibi saat bekler.']),
        p('Gelenler SPİ › Onaylar’da bekler; tek dokunuşla kaydedersin. Ölçüm onaysız yazılmaz.')] }) +
      B.acilir({ baslik: 'Android: HTTP Shortcuts', duzey: 3, govde: adimlar(B, 'Android adımları', [
        'Ücretsiz «HTTP Shortcuts» uygulamasında yeni kısayol › Normal.',
        'Yöntem POST, adres yukarıdaki; Başlıklar’a Authorization = ' + bearer + '.',
        'Gövde: Özel metin, tür application/json, içerik {"metin": "{metin}"}; «metin»i soran bir değişken ekle.']) }) +
      B.acilir({ baslik: 'Home Assistant', duzey: 3, govde: [kopyaAlani(B, 'configuration.yaml', 'hb-tarif-ha', 'rest_command:\n  lifeos_yaz:\n    url: "' + t.url +
        '"\n    method: POST\n    headers:\n      Authorization: "' + bearer + '"\n    content_type: "application/json"\n    payload: \'{"metin": "{{ metin }}"}\'\n', '', true),
        p('Home Assistant LifeOS kök sertifikasını tanımazsa sertifikayı ona ekle.')] });
  }
  function anahtarHtml(s, B, adr, simdi) {
    var l = s.bag.anahtarlar || [], y = s.yeni;
    var form = s.form ? B.satir({ form: { veri: { 'hb-form': 'anahtar' }, govde: [
      B.alan({ ad: 'Ad', isim: 'hb-ad', deger: s.formAd, zorunlu: true, enCok: 40, yerTutucu: 'iPhone Kısayollar' }),
      B.alan({ ad: 'Günün özetini de okuyabilsin', isim: 'hb-oku', tur: 'onay', deger: !!s.formOku, ipucu: 'Siri: «Bugün ne var?» — AYS, SPİ ve ESP’nin bugün cümlesi' }),
      parolaAlani(B, 'hb-parola'), s.formHata ? B.uyari({ tur: 'hata', metin: s.formHata }) : '',
      B.eylemler([{ metin: 'Oluştur', tur: 'ana', tip: 'submit' }, { metin: 'Vazgeç', tur: 'sade', veri: { 'hb-ac': 'form-kapat' } }])] } })
      : B.eylemler([{ metin: 'Anahtar oluştur', veri: { 'hb-ac': 'form' } }]);
    return B.ayar({ id: 'hb-anahtar', ad: 'Erişim anahtarları', not: 'iPhone Kısayollar, Apple Sağlık, Home Assistant', deger: l.length ? String(l.length) : 'yok' }) +
      (y ? B.uyari({ tur: 'tamam', metin: '«' + y.ad + '» hazır.', alt: 'Şimdi kopyala; bir daha gösterilmez.' }) + kopyaAlani(B, 'Yeni anahtar', 'hb-yeni-anahtar', y.anahtar) : '') +
      (l.length ? B.liste({ ad: 'Erişim anahtarları', canli: true, ogeler: l.map(function (x) { return anahtarSatiri(x, simdi, s.silSor); }) })
        : y ? '' : B.bos({ baslik: 'Telefonundan tek satır', metin: 'iPhone Kısayollar, Android ya da Home Assistant tek satır gönderir: SPİ’ye «su 250», AYS’ye «paragraf 20», ESP’ye «30 dk gitar». O sistem satırı Onaylar’a bırakır, sen onaylayınca yazılır.' })) +
      form + tariflerHtml(B, tarifIstek(adr, y)) +
      p('Anahtar yalnız satır bırakır; verini okuyamaz, hesabına giremez. Kaybolursa sil, yenisini aç.');
  }

  /* ---- gelen kutusu (eski panelin gelen sayfası): dışarıdan gelen satırlar ve onları alan sistemin ne yaptığı.
   * Satırı yalnız gönderildiği sistem alır (sistem/hesap.py GELEN_MODULLER); burası yalnız gösterir. ---- */
  var MODUL_AD = { ays: 'AYS', spi: 'SPİ', esp: 'ESP' };
  function gelenSatiri(o, simdi) {
    var mod = MODUL_AD[o.modul] || 'SPİ';
    var ne = o.sonuc || (o.durum === 'anlasilmadi' ? 'Anlaşılmadı' : o.durum === 'onayda' ? mod + ' › Onaylar’da' : mod + ' açılınca işlenir');
    return { ad: String(o.metin || ''), uzun: true, not: [o.kaynak, ne, o.zaman ? son(o.zaman, simdi) : ''].filter(Boolean).join(' · '),
      pul: o.durum === 'anlasilmadi' ? { metin: 'anlaşılmadı', tur: 'vurgu' } : null };
  }
  function gelenHtml(s, B, simdi) {
    var l = s.bag.gelen || [], bek = l.filter(function (o) { return !o.durum || o.durum === 'bekliyor'; }).length;
    return B.acilir({ baslik: 'Gelen kutusu', duzey: 3, not: l.length ? l.length + ' satır' + (bek ? ' · ' + bek + ' bekliyor' : '') : 'boş', govde: l.length
      ? B.liste({ ad: 'Gelen satırlar', ogeler: l.map(function (o) { return gelenSatiri(o, simdi); }) })
      : B.bos({ baslik: 'Henüz bir satır gelmedi.', metin: 'Kısayol ya da otomasyon bir satır gönderince burada görünür.' }) });
  }

  /* ---- her yerden erişim (sistem/uzak.py) ---- */
  var HAL_TUR = { bagli: 'tamam', 'merkez-kapali': 'dikkat', 'bilgisayar-kapali': 'dikkat' };
  function uzakHtml(s, B, bag) {
    var yerel = !!(bag.sunucu && bag.sunucu.yerel), admin = bag.oturum && bag.oturum.rol === 'admin', pc = s.uzak, yonet;
    var hal = s.merkezMetin ? B.uyari({ tur: HAL_TUR[s.merkezHal] || 'bilgi', metin: s.merkezMetin,
      alt: s.merkezHal === 'bilgisayar-kapali' && s.android ? 'Bilgisayar açıksa bu cihazda Tailscale açık olsun, Özel DNS «Otomatik» ya da «Kapalı» olsun, Tailscale pil kısıtlamasından çıkarılsın.' : null,
      eylem: { metin: 'Yeniden dene', tur: 'sade', veri: { 'hb-ac': 'uzak-bak' } } }) : YUKLENIYOR;
    if (!yerel) yonet = p('Her yerden erişim bilgisayarın kendisinden, admin hesabıyla açılıp kapatılır.');
    else if (!admin) yonet = p('Her yerden erişimi bu bilgisayarın sahibi (admin) açıp kapatır.');
    else if (s.uzakHata && !pc) yonet = B.uyari({ tur: 'hata', metin: s.uzakHata, eylem: { metin: 'Yeniden dene', tur: 'sade', veri: { 'hb-ac': 'uzak-bak' } } });
    else if (!pc) yonet = YUKLENIYOR;
    else yonet = (!pc.kurulu ? B.uyari({ tur: 'dikkat', metin: 'Bu bilgisayarda Tailscale kurulu değil.' })
      : !pc.bagli ? B.uyari({ tur: 'dikkat', metin: 'Tailscale kurulu ama giriş yapılmamış.' })
      : pc.funnel ? B.uyari({ tur: 'dikkat', metin: 'Bu bilgisayarda funnel açık, yani internete açık bir kapı var.', alt: 'Önce kapat: tailscale funnel reset' })
      : B.ayar({ id: 'hb-uzak', ad: 'Her yerden erişim · ' + (pc.acik ? 'açık' : 'kapalı'),
        not: (pc.acik && pc.ad ? pc.ad + '. ' : '') + 'LifeOS ve bilgisayar açık kalmalı. Kapalıyken modüller ve kurallar çalışır, model cevap vermez.',
        govde: B.dugme({ metin: pc.acik ? 'Kapat' : 'Aç', tur: pc.acik ? 'ikincil' : 'ana', etiket: pc.acik ? 'Her yerden erişimi kapat' : 'Her yerden erişimi aç', veri: { 'hb-ac': pc.acik ? 'uzak-kapat' : 'uzak-ac' } }) })) +
      B.ayar({ id: 'hb-acilis', ad: 'Bilgisayar açılınca LifeOS başlasın', not: 'Pencere açılmaz, oturum açınca arkada başlar. Uyku ve güç ayarına dokunulmaz; bilgisayar uyursa telefon erişemez.',
        govde: B.dugme({ metin: 'Açılışta başlat', basili: !!pc.acilis, veri: { 'hb-ac': 'acilis' } }) });
    return B.bolum({ baslik: 'Her yerden erişim', id: 'hb-uzak-bolum', govde: [ileti(s, 'uzak', B), hal, yonet] });
  }

  /* Uzantının çizdiği bölümler (saf). s: { bag (/api/hesap/baglantilar), bagHata, takvimSor, form, formAd, formOku, formHata, yeni, silSor, ileti, hata,
   * merkezHal, merkezMetin, android, uzak (/api/hesap/uzak-durum), uzakHata }; bag: Hesap ekranının baglam'ı; adr: adresler(). */
  function bolumler(s, B, bag, adr) {
    var g = s.bagHata ? B.uyari({ tur: 'hata', metin: s.bagHata, eylem: { metin: 'Yeniden dene', veri: { 'hb-ac': 'yenile' } } })
      : !s.bag ? YUKLENIYOR
      : [ileti(s, 'bag', B), takvimHtml(s, B, adr, bag.simdi), anahtarHtml(s, B, adr, bag.simdi), gelenHtml(s, B, bag.simdi),
        p('Hepsi bilgisayarındaki LifeOS’ta çalışır: şirket hesabı, ücret ya da internet gerekmez.')];
    return B.bolum({ baslik: 'Bağlantılar', id: 'hb-baglantilar', govde: g }) + uzakHtml(s, B, bag);
  }

  var Baglanti = { adresler: adresler, tarifIstek: tarifIstek, anahtarSatiri: anahtarSatiri, gelenSatiri: gelenSatiri, bolumler: bolumler, YER_TUTUCU: YER_TUTUCU };
  Kabuk.HesapBaglanti = Baglanti;
  if (typeof module !== 'undefined' && module.exports) module.exports = Baglanti;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var d = document, s = yeni();
  function yeni() { return { kim: '', baglam: null, yuk: false, uzakYuk: false, mesgul: false, bag: null, bagHata: '', takvimSor: null, form: false, formAd: '', formOku: false, formHata: '',
    yeni: null, silSor: null, ileti: null, hata: null, merkezHal: '', merkezMetin: '', android: false, uzak: null, uzakHata: '' }; }
  function H() { return L.HESAP; }
  function burada() { return location.hash.split('?')[0] === '#/hesap'; }
  function tazele() { if (burada()) Kabuk.ic.rota(); }
  function hataMetni(e) { return Kabuk.Hesap.hataMetni(e); }
  // söz: yeni anahtar sayfadan çıkınca bellekten de düşer (eski panelin sayfaCik'ı)
  kok.addEventListener('hashchange', function () { if (!burada()) s = yeni(); });

  function bagYukle() {
    var b = s;
    H().baglantilar().then(function (v) { if (s === b) { s.bag = v; s.bagHata = ''; tazele(); } }, function (e) { if (s === b) { s.bagHata = hataMetni(e); tazele(); } });
  }
  function merkezBak() {
    var b = s;
    Promise.resolve(H().merkezHali(true)).then(function (h) {
      if (s !== b) return;
      s.merkezHal = (h && h.hal) || ''; s.merkezMetin = H().merkezHalMetni(h); s.android = !!(L.Pwa && L.Pwa.androidMi && L.Pwa.androidMi()); tazele();
    }, function () { /* hâl okunamadı: satır «yükleniyor»da kalmasın */ if (s === b) { s.merkezMetin = H().merkezHalMetni({ hal: 'yok' }); tazele(); } });
  }
  function uzakYukle() {
    var b = s; s.uzakYuk = true;
    H().uzakDurum().then(function (v) { if (s === b) { s.uzak = v; s.uzakHata = ''; tazele(); } }, function (e) { if (s === b) { s.uzakHata = (e && e.message) || hataMetni(e); tazele(); } });
  }
  function ciz(bag, B) {
    var el = d.getElementById('sayfa');
    if (!el || el.getAttribute('data-yer') !== 'hesap' || s.kim !== bag.oturum.ad) { s = yeni(); s.kim = bag.oturum.ad; } // sayfaya her girişte taze
    s.baglam = bag;
    if (H() && !s.yuk) { s.yuk = true; bagYukle(); merkezBak(); }
    if (H() && !s.uzakYuk && bag.sunucu && bag.sunucu.yerel && bag.oturum.rol === 'admin') uzakYukle();
    try { return bolumler(s, B, bag, adresler(bag, location)); }
    catch (e) { return B.bolum({ baslik: 'Bağlantılar', id: 'hb-baglantilar', govde: B.uyari({ tur: 'hata', metin: 'Bağlantılar çizilemedi.', alt: String(e.message || e) }) }); }
  }
  (Kabuk.hesapUzanti = Kabuk.hesapUzanti || []).push({ ad: 'baglanti', sira: 20, ciz: ciz });

  // İş bitince ileti ilgili bölümde (yer: bag | uzak); hata da orada. Aynı anda tek iş.
  function is(yer, f) {
    var b = s; s.mesgul = true;
    f().then(function (m) { if (s === b) { s.mesgul = false; s.ileti = m ? { yer: yer, metin: m } : null; tazele(); } },
      function (e) { if (s === b) { s.mesgul = false; s.hata = { yer: yer, metin: (e && e.message) || hataMetni(e) }; tazele(); } });
  }
  function takvimYaz(t) { s.takvimSor = null; s.bag = Object.assign({}, s.bag, { takvim: t }); }
  function takvimIndir() {
    var t = s.bag && s.bag.takvim, kokAdr = (s.baglam && s.baglam.oturum.sunucu) || '';
    if (!t || !t.yol) return;
    is('bag', function () {
      return fetch(kokAdr + t.yol, { cache: 'no-store', credentials: 'omit' }).then(function (r) { if (!r.ok) throw new Error('Takvim alınamadı (' + r.status + ').'); return r.text(); },
        function () { throw new Error('Sunucuya ulaşılamadı.'); }).then(function (m) {
        var u = URL.createObjectURL(new Blob([m], { type: 'text/calendar' })), a = d.createElement('a');
        a.href = u; a.download = 'lifeos-takvim.ics'; d.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
        return 'Takvim dosyası hazır. Google Takvim › Ayarlar › İçe aktar.';
      });
    });
  }
  function kopyala(b) {
    var el = d.getElementById(b.getAttribute('data-hb-hedef') || '');
    if (!el) return;
    var bitti = function (ok) { b.textContent = ok ? 'Kopyalandı' : 'Kopyalanamadı'; setTimeout(function () { b.textContent = 'Kopyala'; }, 1600); };
    var eski = function () { try { el.select(); return d.execCommand('copy'); } catch (e) { return false; } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(el.value).then(function () { bitti(true); }, function () { bitti(eski()); });
    else bitti(eski());
  }

  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-hb-ac]');
    if (!b || b.getAttribute('aria-disabled') === 'true' || !burada() || !H()) return;
    var ne = b.getAttribute('data-hb-ac'), id = +b.getAttribute('data-id'), odak = null;
    if (ne === 'kopyala') return kopyala(b);
    if (s.mesgul) return;
    s.ileti = s.hata = null;
    if (ne === 'takvim-ac' || ne === 'takvim-yenile') {
      return is('bag', function () { return H().takvimAc(ne === 'takvim-yenile').then(function (t) { takvimYaz(t); return ne === 'takvim-ac' ? 'Abonelik açık. Adresi takvim uygulamana ekle.' : 'Adres yenilendi; eskisi artık çalışmaz.'; }); });
    }
    if (ne === 'takvim-kapat') return is('bag', function () { return H().takvimKapat().then(function (t) { takvimYaz(t); return 'Abonelik kapandı; adres artık çalışmaz.'; }); });
    if (ne === 'takvim-indir') return takvimIndir();
    if (ne === 'sil') {
      return is('bag', function () {
        return H().anahtarSil(id).then(function () { return H().baglantilar(); }).then(function (v) { s.bag = v; s.yeni = null; s.silSor = null; return 'Anahtar silindi; onu kullanan kısayol artık çalışmaz.'; });
      });
    }
    if (ne === 'uzak-ac' || ne === 'uzak-kapat') {
      return is('uzak', function () { return H()[ne === 'uzak-ac' ? 'uzakAc' : 'uzakKapat']().then(function (v) { return H().uzakDurum().then(function (u) { s.uzak = u; return v && v.mesaj; }); }); });
    }
    if (ne === 'acilis') {
      return is('uzak', function () {
        return H().uzakAcilis(!(s.uzak && s.uzak.acilis)).then(function (v) { s.uzak = Object.assign({}, s.uzak, { acilis: !!v.acilis }); if (v.ok === false) throw new Error(v.mesaj || 'Ayar yazılamadı.'); return v.mesaj; });
      });
    }
    if (ne === 'takvim-yenile-sor' || ne === 'takvim-kapat-sor') { s.takvimSor = ne === 'takvim-yenile-sor' ? 'yenile' : 'kapat'; odak = '[data-hb-ac="takvim-' + s.takvimSor + '"]'; }
    else if (ne === 'sil-sor') { s.silSor = id; odak = '[data-hb-ac="sil"]'; }
    else if (ne === 'vazgec') { s.silSor = null; s.takvimSor = null; }
    else if (ne === 'form') { s.form = true; s.formHata = ''; odak = '#b-alan-hb-ad'; }
    else if (ne === 'form-kapat') { s.form = false; s.formHata = ''; s.formAd = ''; s.formOku = false; }
    else if (ne === 'yenile') { s.bag = null; s.bagHata = ''; bagYukle(); }
    else if (ne === 'uzak-bak') { s.merkezMetin = ''; merkezBak(); if (s.uzakYuk) { s.uzak = null; s.uzakHata = ''; uzakYukle(); } }
    else return;
    tazele();
    var f = odak && d.querySelector(odak); if (f) f.focus({ preventScroll: true });
  });
  d.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f.matches || !f.matches('form[data-hb-form="anahtar"]') || !burada() || !H()) return;
    e.preventDefault();
    if (s.mesgul) return;
    var ad = f.elements['hb-ad'].value.trim(), oku = f.elements['hb-oku'].checked, parola = f.elements['hb-parola'].value, b = s, acildi = false;
    s.formAd = ad; s.formOku = oku; s.ileti = s.hata = null;
    if (!ad || !parola) { s.formHata = 'Ad ve şifre gerekli.'; tazele(); return; }
    s.mesgul = true;
    H().anahtarAc(parola, ad, oku).then(function (a) {
      if (s !== b) return;
      acildi = true;
      s.yeni = { anahtar: a.anahtar, ad: a.ad }; s.form = false; s.formHata = ''; s.formAd = ''; s.formOku = false;
      return H().baglantilar().then(function (v) { if (s === b) s.bag = v; });
    }).then(function () {
      if (s !== b) return;
      s.mesgul = false; tazele();
      var k = d.getElementById('b-alan-hb-yeni-anahtar'); if (k) { k.focus({ preventScroll: true }); k.select(); }
    }, function (x) {
      if (s !== b) return;
      s.mesgul = false;
      if (acildi) s.hata = { yer: 'bag', metin: hataMetni(x) }; else s.formHata = (x && x.message) || hataMetni(x); // 401 burada «Şifre yanlış.»
      tazele();
      var h = d.querySelector('[data-hb-form] .b-uyari--hata'); if (h) h.focus({ preventScroll: true });
    });
  });
})(typeof window !== 'undefined' ? window : globalThis);
