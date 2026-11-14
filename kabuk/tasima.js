/* LIFEOS.Kabuk.Tasima — köken taşıması (sadeleşme Faz 1 P6): tek kapıya geçince üç eski modül aynı kökenin
 * /ays/ /spi/ /esp/ yolunda açılır; tarayıcı deposu köken başına olduğu için eski adresteki (4173/4183/4193)
 * verileri orada görünmez. Göç paketi o eski kökenin deposunun tam kopyasıdır: burada yeni kökenin
 * localStorage'ına geri yazılır, modül eski verisiyle açılır. Oturum ya da şifre gerekmez.
 * Kurallar: var olan anahtarın ÜSTÜNE YAZILMAZ (yalnız eksik olan yazılır); paketi sunucu yalnız bu bilgisayara ve
 * yalnız tek kapı devredeyken verir (sistem/hesap.py); sır adlı anahtar ve eşitleme düzeneği pakette zaten yoktur.
 * shortcut: IndexedDB medyası (fotoğraf) geri yazılmaz, bugün hiçbir pakette medya yok; medya gelirse aynı yoldan eklenir.
 * Ana depo anahtarları modüllerin donmuş kodundandır (AYS/SPI/ESP src/js/core/store.js `yerelAnahtar`).
 * Sıfır bağımlılık; tarayıcıda window.LIFEOS.Kabuk.Tasima, Node'da module.exports. */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  var ANA = {
    ays: function (p) { return p === 'main' ? 'rota84285.v2' : 'rota84285.v2.' + p; },
    spi: function (p) { return 'spi.v1.' + p; },
    esp: function (p) { return 'esp.v1.' + p; }
  };
  var IZ = 'lifeos.tasima';

  // paketler: [{ ad, kaynak, profiller: { profil: { data } }, anahtarlar: { anahtar: değer } }]. ls: getItem/setItem.
  // once: { kaynak: paket adı } (daha önce işlenen paketler). Döner: { yazilan, atlanan, iz } ; ls dışında hiçbir şeye dokunmaz.
  function geriYukle(paketler, ls, once) {
    var say = { yazilan: 0, atlanan: 0 }, iz = {};
    Object.keys(once || {}).forEach(function (k) { iz[k] = once[k]; });
    var yaz = function (k, dizgi) {
      if (ls.getItem(k) != null) { say.atlanan++; return; } // buradaki sürüm kalır
      ls.setItem(k, dizgi); say.yazilan++;
    };
    (paketler || []).forEach(function (p) {
      if (!p || typeof p.kaynak !== 'string' || !p.ad || iz[p.kaynak] === p.ad) return;
      var ana = ANA[p.kaynak];
      Object.keys(p.profiller || {}).forEach(function (profil) {
        var d = p.profiller[profil];
        if (ana && d && d.data && typeof d.data === 'object') yaz(ana(profil), JSON.stringify(d.data));
      });
      Object.keys(p.anahtarlar || {}).forEach(function (k) {
        var v = p.anahtarlar[k];
        if (v == null) return;
        yaz(k, typeof v === 'string' ? v : JSON.stringify(v)); // paket değeri çözülmüş tutar: metin aynen, kalanı JSON
      });
      iz[p.kaynak] = p.ad;
    });
    return { yazilan: say.yazilan, atlanan: say.atlanan, iz: iz };
  }

  var Tasima = { ANA: ANA, IZ: IZ, geriYukle: geriYukle };
  Kabuk.Tasima = Tasima;
  if (typeof module !== 'undefined' && module.exports) module.exports = Tasima;
  if (typeof document === 'undefined') return;

  // Tarayıcı: kabuk açılınca bir kez sorar. Sunucu tek kapı devrede değilse 404 verir, hiçbir şey olmaz.
  Tasima.calis = function () {
    if (location.protocol === 'file:' || !window.fetch) return Promise.resolve(null);
    var ls = window.localStorage, once = {};
    try { once = JSON.parse(ls.getItem(IZ)) || {}; } catch (e) { once = {}; }
    return fetch('/api/hesap/goc-paket/son', { cache: 'no-store', headers: { 'X-LifeOS': 'goc' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (v) {
        if (!v || !Array.isArray(v.paketler)) return null;
        var r = geriYukle(v.paketler, ls, once);
        ls.setItem(IZ, JSON.stringify(r.iz));
        return r;
      }).catch(function () { return null; });
  };
})(typeof window !== 'undefined' ? window : globalThis);
