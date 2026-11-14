/* LIFEOS.Kabuk.Hesap — Hesap ekranı (#/hesap; belgeler/ekip/sadelesme/faz7-hesap-kabuk.md).
 * İlk sürüm: oturum (kim, hangi cihaz, çıkış), cihazlar (liste, kodla + QR'la yeni cihaz bağlama, onaylı çıkarma), güncelleme
 * (kurulu sürüm, denetle, güncelle). Geri kalanı (giriş, iki adım, bağlantılar, yedek, yönetim) şimdilik /kartlar/ panelinde.
 * Jeton bu dosyaya hiç gelmez: hesap işleri kabuğun zaten yüklediği eski istemciden (brand/ortak/hesap.js, window.LIFEOS.HESAP)
 * geçer, jeton onun çerezinde kalır; burada yalnız jetonsuz uçlar doğrudan çağrılır (/api/hesap/durum, /api/guncelleme, /api/guncelle).
 * Depoya hiçbir şey yazılmaz (yeni lifeos.* anahtarı yok); ekran durumu bellekte, sayfaya her girişte tazelenir.
 * Sıfır bağımlılık; tarayıcıda window.LIFEOS.Kabuk.Hesap, Node'da module.exports (yalnız saf kısım). kabuk.js'ten ÖNCE yüklenir. */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};

  var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function iki(n) { return (n < 10 ? '0' : '') + n; }
  // «bugün 14:20», «dün 09:05», «12 Kasım» (başka yılsa yılıyla); eski panelin sonMetni'si
  function sonMetni(ms, simdi) {
    if (!ms) return 'hiç';
    var t = new Date(ms), b = new Date(simdi), saat = iki(t.getHours()) + ':' + iki(t.getMinutes());
    var gun = function (x) { return new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(); };
    var fark = Math.round((gun(b) - gun(t)) / 86400000);
    if (fark <= 0) return 'bugün ' + saat;
    if (fark === 1) return 'dün ' + saat;
    return t.getDate() + ' ' + AYLAR[t.getMonth()] + (t.getFullYear() !== b.getFullYear() ? ' ' + t.getFullYear() : '');
  }
  function kalanMetni(bitis, simdi) {
    var s = Math.max(0, Math.ceil((Number(bitis) - simdi) / 1000));
    return Math.floor(s / 60) + ':' + iki(s % 60) + ' kaldı';
  }
  function kodYaz(kod) { var k = String(kod || ''); return k.length === 6 ? k.slice(0, 3) + ' ' + k.slice(3) : k; }
  /* QR'ın açacağı adres (eski panelin evAdresleri'yle aynı sıra): oturumun sunucusu, https kökeni, yoksa Tailscale adı.
   * Bilgisayarın 127.0.0.1'i telefonda açılmaz: o zaman QR yok, kod elle yazılır. */
  function bagAdresi(kod, oturumSunucu, konum, evAgi) {
    var kokAdr = oturumSunucu || (konum && konum.protocol === 'https:' ? konum.origin : '') ||
      (Array.isArray(evAgi) && evAgi[0] ? 'https://' + evAgi[0] + ':443' : '');
    return kokAdr && /^\d{6}$/.test(String(kod)) ? kokAdr + '/?bagla=' + kod : '';
  }
  function hataMetni(e) {
    if (e && e.kod === 401) return 'Oturumun süresi doldu ya da bu cihaz çıkarıldı; yeniden giriş yap.';
    if (e && e.kod === 0) return 'Bilgisayara ulaşılamıyor.';
    return (e && e.message) || 'İstek yapılamadı.';
  }
  // Cihaz satırı (Bilesen.satir seçenekleri). Bu cihaz çıkarılmaz (o çıkıştır); öteki cihaz onaylı iki adımda çıkarılır.
  function cihazSatiri(c, simdi, sorulan) {
    var ad = String(c.cihaz_ad || 'Cihaz'), id = String(c.id);
    if (c.bu) return { ad: ad, not: 'giriş ' + sonMetni(c.olusturma, simdi), pul: { metin: 'bu cihaz', tur: 'vurgu' } };
    if (sorulan === c.id) return { ad: ad, uzun: true, not: 'Çıkarılsın mı? Orada yeniden giriş gerekir; kayıtlar silinmez.',
      eylemler: [{ metin: 'Evet, çıkar', tur: 'ana', etiket: ad + ' cihazını çıkar', veri: { 'hs-ac': 'cikar', id: id } },
        { metin: 'Vazgeç', tur: 'sade', veri: { 'hs-ac': 'vazgec' } }] };
    return { ad: ad, not: 'son görülme ' + sonMetni(c.son, simdi),
      eylemler: [{ metin: 'Çıkar', tur: 'sade', etiket: ad + ' cihazını çıkar', veri: { 'hs-ac': 'cikar-sor', id: id } }] };
  }
  function surumMetni(s) { return s && s.tarih ? s.tarih + (s.kisa ? ' · ' + s.kisa : '') : 'zip sürümü (git yok)'; }
  /* /api/guncelleme cevabı → { tur (Bilesen.uyari), metin, alt, eylem: null | 'guncelle' | 'yedekle' } (eski panelin ciz'i) */
  function guncelOzet(v) {
    if (!v || typeof v !== 'object') return { tur: 'hata', metin: 'Güncelleme durumu okunamadı.', alt: '', eylem: null };
    if (v.durum === 'git-yok') return { tur: 'dikkat', metin: 'Güncelleme için git gerekli.', alt: v.mesaj || '', eylem: null };
    if (v.durum === 'git-degil') return { tur: 'bilgi', metin: 'Bu klasör zip ile indirilmiş.', alt: 'Güncelle, klasörü GitHub\'daki sürüme bağlar ve en yenisini kurar. Verin korunur.', eylem: 'guncelle' };
    if (v.durum !== 'ok') return { tur: 'dikkat', metin: 'Güncelleme durumu okunamadı.', alt: v.mesaj || '', eylem: null };
    var n = Number(v.geride) || 0;
    if (n > 0 && v.yedeklenebilir) return { tur: 'bilgi', metin: n + ' yenilik var.', alt: 'Bu klasörde GitHub\'da olmayan ' + (Number(v.ileride) || 0) +
      ' kayıt var; önce onlar bir yedek dala konur, sonra en yeni sürüm kurulur. Hiçbir kayıt silinmez.', eylem: 'yedekle' };
    if (n > 0) return { tur: 'bilgi', metin: n + ' yenilik var.', alt: 'İndirmek bir dakikadan kısa sürer; verin korunur.', eylem: 'guncelle' };
    return { tur: 'tamam', metin: 'Sistem güncel.', alt: v.ag ? 'En yeni sürümü kullanıyorsun.' : 'GitHub\'a ulaşılamadı; son bilinen duruma göre.', eylem: null };
  }

  /* Ekran gövdesi (saf: durum + Bilesen → HTML). s: { hesap, dosya, oturum, sunucu, cihazlar, hata, cikisSor, cikarSor, bag, bagHata, qr,
   * ileti, guncel, guncelHata, guncelIs }. Oturum nesnesinden yalnız ad, görünen ad ve rol okunur. */
  var ESKI = 'Giriş ve hesap açma, iki adımlı doğrulama, bağlantılar (takvim, erişim anahtarları), profil, yedekler, kullanıcılar ve her yerden erişim şimdilik eski panelde.';
  var YUKLENIYOR = '<p class="soluk" aria-busy="true">Yükleniyor…</p>';
  function oturumHtml(s, B, bu) {
    var o = s.oturum;
    if (!s.hesap) return s.dosya ? B.bos({ baslik: 'Hesap bu açılışta yok.', metin: 'Sayfa dosyadan açıldı; hesap LifeOS sunucusuyla açılınca görünür.' })
      : s.hesapYok ? B.bos({ baslik: 'Hesap istemcisi yüklenemedi.', metin: 'Sayfayı yenile; olmazsa eski panelden gir.', eylem: { metin: 'Hesap ve sistem paneli', tur: 'sade', href: '/kartlar/' } }) : YUKLENIYOR;
    if (!o) {
      var kur = s.sunucu && s.sunucu.kurulum;
      return B.uyari({ tur: 'bilgi', simge: 'kisi', metin: kur ? 'Bu bilgisayarda henüz hesap yok.' : 'Bu cihazda giriş yapılmadı.',
        alt: (s.sunucu && s.sunucu.yerel ? 'Bu bilgisayarda kayıtların girişsiz de bilgisayardaki depoya gider; giriş telefon ve öteki cihazlar için. ' : '') +
          (kur ? 'Hesap kurmak' : 'Giriş') + ' şimdilik eski panelde.',
        eylem: { metin: kur ? 'Hesap kur' : 'Giriş yap', tur: 'ana', href: '/kartlar/' } });
    }
    var ad = String(o.gorunen_ad || o.ad), sat = [
      B.ayar({ id: 'hs-ad', ad: 'Hesap', deger: ad + (o.ad && o.ad !== ad ? ' · @' + o.ad : '') }),
      B.ayar({ id: 'hs-rol', ad: 'Rol', not: o.rol === 'admin' ? 'Bu bilgisayarın sahibi: güncelleme ve yönetim onda.' : '', deger: o.rol === 'admin' ? 'Admin' : 'Üye' }),
      B.ayar({ id: 'hs-cihaz', ad: 'Bu cihaz', deger: bu ? String(bu.cihaz_ad || 'Cihaz') : s.cihazlar ? 'listede yok' : '…' })];
    return sat.join('') + (s.cikisSor
      ? B.uyari({ tur: 'dikkat', metin: 'Bu cihazda oturum kapansın mı?', alt: 'Kayıtların bu cihazda kalır; eşitleme için yeniden giriş gerekir.',
        eylem: [{ metin: 'Çıkış yap', tur: 'ana', veri: { 'hs-ac': 'cikis' } }, { metin: 'Vazgeç', tur: 'sade', veri: { 'hs-ac': 'vazgec' } }] })
      : B.eylemler([{ metin: 'Çıkış yap', tur: 'sade', veri: { 'hs-ac': 'cikis-sor' } }]));
  }
  function bagHtml(s, B, simdi) {
    var b = s.bag;
    if (!b) return s.bagHata ? B.uyari({ tur: 'hata', metin: s.bagHata }) : '';
    if (b.durum === 'aciliyor') return YUKLENIYOR;
    if (b.durum === 'baglandi') return B.uyari({ tur: 'tamam', metin: String(b.cihaz_ad || 'Cihaz') + ' bağlandı.', alt: 'Orada girilen kayıtlar ilk eşitlemeyle gelir.',
      eylem: { metin: 'Tamam', veri: { 'hs-ac': 'bag-kapat' } } });
    if (b.durum === 'bitti') return B.uyari({ tur: 'dikkat', metin: 'Kodun süresi doldu.', alt: 'Güvenlik için kod beş dakika geçerli.',
      eylem: [{ metin: 'Yeni kod', tur: 'ana', veri: { 'hs-ac': 'bag' } }, { metin: 'Kapat', tur: 'sade', veri: { 'hs-ac': 'bag-kapat' } }] });
    return B.panel({ tur: 'guclu', baslik: 'Yeni cihaz bağla', id: 'hs-bag', govde: [
      B.ayar({ id: 'hs-kod', ad: 'Bağlama kodu', not: 'Yeni cihazda LifeOS\'u aç, «Kodla bağlan»a dokun ve bu kodu yaz. Kod tek kullanımlık.', deger: kodYaz(b.kod), veri: { 'hs-kod': b.kod } }),
      '<p class="soluk" data-hs-sure aria-live="off">' + kalanMetni(b.bitis, simdi) + '</p>',
      s.qr ? '<div>' + s.qr + '</div><p class="soluk">Tailscale açıksa QR\'ı yeni cihazın kamerasıyla okutmak da olur.</p>' : '',
      s.qr ? '' : '<p class="soluk">QR için telefonun bu bilgisayara her yerden erişimle (Tailscale) ulaşması gerekir; açmak şimdilik eski panelde.</p>',
      B.eylemler([{ metin: 'Vazgeç', tur: 'sade', veri: { 'hs-ac': 'bag-kapat' } }])] });
  }
  function cihazlarHtml(s, B, simdi) {
    var liste = s.hata ? B.uyari({ tur: 'hata', metin: s.hata, eylem: { metin: 'Yeniden dene', veri: { 'hs-ac': 'yenile' } } })
      : !s.cihazlar ? YUKLENIYOR
      : !s.cihazlar.length ? B.bos({ baslik: 'Listede cihaz yok.' })
      : B.liste({ ad: 'Bağlı cihazlar', canli: true, ogeler: s.cihazlar.map(function (c) { return cihazSatiri(c, simdi, s.cikarSor); }) });
    return B.bolum({ baslik: 'Cihazlar', id: 'hs-cihazlar', eylem: s.bag ? null : { metin: 'Yeni cihaz bağla', veri: { 'hs-ac': 'bag' } },
      govde: [s.ileti ? B.uyari({ tur: 'tamam', metin: s.ileti }) : '', bagHtml(s, B, simdi), liste] });
  }
  function guncelHtml(s, B) {
    if (s.dosya) return B.bos({ baslik: 'Güncelleme bu açılışta yok.', metin: 'Sayfa dosyadan açıldı; güncelleme LifeOS sunucusuyla açılınca denetlenir.' });
    var g = s.guncel, is = s.guncelIs, ust = g ? B.ayar({ id: 'hs-surum', ad: 'Kurulu sürüm', deger: surumMetni(g.surum) }) : '';
    if (is && is.durum) return ust + B.uyari(is);
    if (is) return ust + YUKLENIYOR.replace('Yükleniyor…', is === 'yeniden' ? 'Sistem yeniden başlatılıyor…' : 'İndiriliyor…');
    if (s.guncelHata) return B.uyari({ tur: 'hata', metin: s.guncelHata, eylem: { metin: 'Yeniden dene', veri: { 'hs-ac': 'denetle' } } });
    if (g === 'bekle') return YUKLENIYOR.replace('Yükleniyor…', 'Güncelleme denetleniyor…');
    if (!g) return '<p class="soluk">Denetlemek GitHub\'a bakar; birkaç saniye sürer.</p>' + B.eylemler([{ metin: 'Güncellemeyi denetle', veri: { 'hs-ac': 'denetle' } }]);
    var oz = guncelOzet(g), yer = s.sunucu && s.sunucu.yerel, yeni = Array.isArray(g.yeni) ? g.yeni.filter(Boolean).slice(0, 5) : [];
    var eylem = oz.eylem && yer ? { metin: oz.eylem === 'yedekle' ? 'Yedekle ve güncelle' : 'Güncelle', tur: 'ana', veri: { 'hs-ac': oz.eylem } } : null;
    return ust + B.uyari({ tur: oz.tur, metin: oz.metin, alt: oz.eylem && !yer ? oz.alt + ' Güncelleme bu bilgisayardan başlatılır.' : oz.alt || null, eylem: eylem }) +
      (yeni.length ? B.liste({ ad: 'Yenilikler', ogeler: yeni.map(function (x) { return { ad: String(x), uzun: true }; }) }) : '') +
      B.eylemler([{ metin: 'Yeniden denetle', tur: 'sade', veri: { 'hs-ac': 'denetle' } }]);
  }
  function ekran(s, B, simdi) {
    var bu = (s.cihazlar || []).filter(function (c) { return c.bu; })[0] || null;
    return B.baslik({ metin: 'Hesap', alt: 'Oturumun, bağlı cihazların ve sistemin güncelliği.' }) +
      B.bolum({ baslik: 'Oturum', id: 'hs-oturum', govde: oturumHtml(s, B, bu) }) +
      (s.oturum ? cihazlarHtml(s, B, simdi) : '') +
      B.bolum({ baslik: 'Güncelleme', id: 'hs-guncel', govde: guncelHtml(s, B) }) +
      B.bolum({ baslik: 'Eski panelde kalanlar', id: 'hs-eski', govde: ['<p class="soluk">' + ESKI + '</p>',
        B.eylemler([{ metin: 'Hesap ve sistem paneli', tur: 'sade', href: '/kartlar/' }])] });
  }

  var Hesap = { sonMetni: sonMetni, kalanMetni: kalanMetni, kodYaz: kodYaz, bagAdresi: bagAdresi, hataMetni: hataMetni, cihazSatiri: cihazSatiri,
    surumMetni: surumMetni, guncelOzet: guncelOzet, ekran: ekran };
  Kabuk.Hesap = Hesap;
  if (typeof module !== 'undefined' && module.exports) module.exports = Hesap;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var d = document, ic = function () { return Kabuk.ic; }, B = Kabuk.Bilesen;
  var BAG_YOKLA = 2500, s = yeni(), bagZaman = null, saniye = null, hesapBekle = null;
  function yeni() { return { hesap: false, dosya: location.protocol === 'file:', oturum: null, sunucu: null, cihazlar: null, hata: '', cikisSor: false, cikarSor: null, hesapYok: false,
    bag: null, bagHata: '', qr: '', ileti: '', guncel: null, guncelHata: '', guncelIs: null, yuk: false }; }
  function H() { return L.HESAP || null; }
  function burada() { return location.hash.split('?')[0] === '#/hesap'; }
  function ciz() { if (burada()) ic().rota(); }
  function oturum() { try { var o = H().durum().oturum; return o ? { ad: o.ad, gorunen_ad: o.gorunen_ad, rol: o.rol, sunucu: o.sunucu } : null; } catch (e) { return null; } }
  function cihazYukle() {
    if (!s.oturum) return;
    H().cihazlar().then(function (l) { s.cihazlar = l; s.hata = ''; ciz(); }, function (e) { s.hata = hataMetni(e); if (e && e.kod === 401) s.oturum = oturum(); ciz(); });
  }
  function yukle() {
    s.yuk = true;
    if (s.dosya) return;
    fetch('/api/hesap/durum', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
      .then(function (v) { s.sunucu = v; ciz(); });
    cihazYukle();
  }
  function bagDur() { clearTimeout(bagZaman); clearInterval(saniye); bagZaman = saniye = null; }
  function bagYokla(b) {
    bagZaman = setTimeout(function () {
      if (s.bag !== b) return;
      if (!burada()) { s.bag = null; return bagDur(); } // shortcut: kod sunucuda beş dakikada kendiliğinden biter (bag-kapat istemcide dışa açık değil)
      H().bagDurum(b.id).then(function (v) {
        if (s.bag !== b) return;
        if (v && (v.durum === 'baglandi' || v.durum === 'bitti' || v.durum === 'yok')) {
          b.durum = v.durum === 'yok' ? 'bitti' : v.durum; b.cihaz_ad = v.cihaz_ad || ''; bagDur();
          if (v.durum === 'baglandi') cihazYukle();
          return ciz();
        }
        if (Date.now() > b.bitis + 1000) { b.durum = 'bitti'; bagDur(); return ciz(); }
        bagYokla(b);
      }, function () { if (s.bag === b) bagYokla(b); });
    }, BAG_YOKLA);
  }
  function qrYukle(sonra) {
    if (L.QR || s.dosya) return sonra();
    var b = d.createElement('script'); b.src = '/qr.js'; b.onload = b.onerror = sonra; d.head.appendChild(b);
  }
  function bagAc() {
    bagDur(); s.bagHata = ''; s.ileti = ''; s.bag = { durum: 'aciliyor' }; s.qr = ''; ciz();
    H().bagKoduAc().then(function (v) {
      var b = s.bag = { kod: v.kod, id: v.id, bitis: v.bitis, durum: 'bekliyor' };
      qrYukle(function () {
        var adr = bagAdresi(v.kod, s.oturum && s.oturum.sunucu, location, s.sunucu && s.sunucu.ev_agi);
        s.qr = adr && L.QR && !kok.LIFEOS_YEREL ? L.QR.svg(adr, { etiket: 'Yeni cihazın kamerasıyla okutulacak bağlama adresi' }).replace('<svg ', '<svg width="176" height="176" ') : '';
        ciz();
        saniye = setInterval(function () { var e = d.querySelector('[data-hs-sure]'); if (e && s.bag === b) e.textContent = kalanMetni(b.bitis, Date.now()); }, 1000);
        bagYokla(b);
      });
    }, function (e) { s.bag = null; s.bagHata = hataMetni(e); ciz(); });
  }
  function guncelDenetle() {
    s.guncel = 'bekle'; s.guncelHata = ''; s.guncelIs = null; ciz();
    fetch('/api/guncelleme?taze=1', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (v) { s.guncel = v; ciz(); }, function () { s.guncel = null; s.guncelHata = 'Güncelleme durumu okunamadı.'; ciz(); });
  }
  function post(yol) { return fetch(yol, { method: 'POST', headers: { 'X-LifeOS': 'guncelle' }, cache: 'no-store' }).then(function (r) { return r.json(); }); }
  // Eski paneldeki akış (sistem/sunucu.py giris_html guncelle/yeniden): indir; sunucu dosyası değiştiyse yeniden başlat ve dönmesini bekle.
  function guncelle(yedekle) {
    s.guncelIs = 'indiriliyor'; ciz();
    post('/api/guncelle' + (yedekle ? '?yedekle=1' : '')).then(function (v) {
      if (v.durum === 'guncellendi' && v.yeniden_baslat) { s.guncelIs = 'yeniden'; ciz(); return post('/api/yeniden').then(dondumu); }
      s.guncelIs = v.durum === 'guncellendi' ? { tur: 'tamam', metin: v.mesaj || 'Güncellendi.', alt: 'Açık sayfaları yenile.', eylem: { metin: 'Sayfayı yenile', tur: 'ana', veri: { 'hs-ac': 'yenile-sayfa' } } }
        : v.durum === 'guncel' ? { tur: 'tamam', metin: 'Sistem güncel.' }
        : { tur: 'dikkat', metin: 'Güncelleme yapılmadı.', alt: v.mesaj || null, eylem: { metin: 'Yeniden denetle', tur: 'sade', veri: { 'hs-ac': 'denetle' } } };
      ciz();
    }).catch(function () { s.guncelIs = { tur: 'hata', metin: 'Güncelleme isteği gönderilemedi.', eylem: { metin: 'Yeniden denetle', tur: 'sade', veri: { 'hs-ac': 'denetle' } } }; ciz(); });
  }
  function dondumu() {
    var bitis = Date.now() + 60000;
    (function bekle() {
      setTimeout(function () {
        fetch('/api/durum', { cache: 'no-store' }).then(function (r) { if (r.ok) location.reload(); else throw 0; }).catch(function () {
          if (Date.now() < bitis) return bekle();
          s.guncelIs = { tur: 'dikkat', metin: 'Sistem geri gelmedi.', alt: 'Klasördeki BASLAT.bat dosyasını çift tıkla.' }; ciz();
        });
      }, 1500);
    })();
  }

  function sayfa(yer) {
    var I = ic(), el = d.getElementById('sayfa');
    if (!el || el.getAttribute('data-yer') !== 'hesap') { bagDur(); s = yeni(); } // sayfaya her girişte taze
    s.hesap = !!H();
    if (s.hesap) { var o = oturum(); if (!o !== !s.oturum || (o && s.oturum && o.ad !== s.oturum.ad)) { s.oturum = o; s.cihazlar = null; s.hata = ''; if (s.yuk) cihazYukle(); } }
    else if (!s.dosya && !hesapBekle) { // hesap.js kabuğun açılışında arkadan yüklenir (kabuk.js baslat)
      var son = Date.now() + 10000;
      hesapBekle = setInterval(function () { if (H() || Date.now() > son) { clearInterval(hesapBekle); hesapBekle = null; s.hesapYok = !H(); ciz(); } }, 150);
    }
    if (!s.yuk) yukle();
    return I.ust(I.kirinti(yer)) + '<div class="govde" data-arac="hesap">' + ekran(s, B, Date.now()) + '</div>';
  }
  Kabuk.ek = Kabuk.ek || {};
  Kabuk.ek.hesap = sayfa;

  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-hs-ac]');
    if (!b || b.getAttribute('aria-disabled') === 'true' || !burada()) return;
    var ne = b.getAttribute('data-hs-ac'), id = +b.getAttribute('data-id'), odak = null;
    if (ne !== 'vazgec' && ne !== 'cikar') s.ileti = '';
    if (ne === 'cikis-sor') { s.cikisSor = true; odak = '[data-hs-ac="cikis"]'; }
    else if (ne === 'cikar-sor') { s.cikarSor = id; odak = '[data-hs-ac="cikar"]'; }
    else if (ne === 'vazgec') { s.cikisSor = false; s.cikarSor = null; }
    else if (ne === 'cikis') { s.cikisSor = false; H().cikisYap().then(function () { s.oturum = oturum(); s.cihazlar = null; s.bag = null; bagDur(); ciz(); }); }
    else if (ne === 'cikar') {
      var c = (s.cihazlar || []).filter(function (x) { return x.id === id && !x.bu; })[0];
      if (!c) return;
      s.cikarSor = null;
      H().cihazCikar(id).then(function () { s.ileti = String(c.cihaz_ad || 'Cihaz') + ' çıkarıldı.'; cihazYukle(); }, function (x) { s.hata = hataMetni(x); ciz(); });
    }
    else if (ne === 'yenile') { s.hata = ''; s.cihazlar = null; cihazYukle(); }
    else if (ne === 'bag') return bagAc();
    else if (ne === 'bag-kapat') { bagDur(); s.bag = null; }
    else if (ne === 'denetle') return guncelDenetle();
    else if (ne === 'guncelle' || ne === 'yedekle') return guncelle(ne === 'yedekle');
    else if (ne === 'yenile-sayfa') return location.reload();
    ciz();
    var f = odak && d.querySelector(odak); if (f) f.focus({ preventScroll: true });
  });
})(typeof window !== 'undefined' ? window : globalThis);
