/* LIFEOS.Kabuk.Depo — kabuğun kayıt deposu (sadeleşme Faz 2; plan riski «tek kökende 5 MB tarayıcı sınırı»).
 * Kayıt (kullanıcı verisi) IndexedDB'dedir: «lifeos-kabuk» veritabanı, tek tablo «kayit», değer localStorage'daki dizginin aynısı.
 * Ayar localStorage'da kalır, çünkü ilk boyamadan önce eşzamanlı okunur. Hangi anahtarın kayıt olduğunu yalnız KAYIT söyler.
 * İki yüz: eşzamanlı getItem/setItem/removeItem (kabuk ve ayar.js böyle bir depo bekler; kayıtlar açılışta belleğe yüklenir,
 * yazı önce belleğe sonra IndexedDB'ye gider) ve eşzamansız al/yaz/sil/hepsi. P6'da kayıtlar veri/lifeos.db'ye geçince
 * değişen tek dosya budur.
 * Kip: idb (olağan) · yerel (IndexedDB yok ya da açılamadı: kayıtlar localStorage'da kalır, eskisi gibi) · bellek (kayıtlar
 * daha önce IndexedDB'ye taşındı ama bu açılışta ulaşılamadı: localStorage'a yazılan eski kaydın üstüne taşınmasın diye bu
 * oturumun yazdıkları yalnız bellekte durur). Kurallar ve anahtar listesi: belgeler/ekip/sadelesme/faz2-indexeddb.md */
(function (kok) {
  'use strict';

  var AD = 'lifeos-kabuk', TABLO = 'kayit', IZ = 'lifeos.kabuk.depo';
  var KAYIT = /^lifeos\.(yol\.(?!son$)|not\.|tekrar\.|kayit\.kayitlar$|plan\.|soru\.|tanisma\.(kayit|taslak)$|beden\.)/;
  var ls = null, db = null, kip = 'yerel', bellek = {}, kalici = null, kanal = null;

  function bizde(k) { return kip !== 'yerel' && KAYIT.test(k); }
  function oku(k) { return bizde(k) ? (k in bellek ? bellek[k] : null) : ls.getItem(k); }
  function yereldekiler() { // localStorage'daki kayıtlar: [[anahtar, değer], …]
    var l = [];
    for (var i = 0; i < (ls.length || 0); i++) { var k = ls.key(i); if (KAYIT.test(k)) l.push([k, ls.getItem(k)]); }
    return l;
  }
  function soz(f) { try { return Promise.resolve(f()); } catch (e) { return Promise.reject(e); } }

  function islem(tur, is) { // tek IndexedDB işlemi; işlem kalıcı olunca is()'in döndürdüğüyle çözülür
    return new Promise(function (ok, red) {
      var t = db.transaction(TABLO, tur), r = is(t.objectStore(TABLO));
      t.oncomplete = function () { ok(r); };
      t.onerror = t.onabort = function () { red(t.error || new Error('IndexedDB işlemi durdu')); };
      if (t.commit) t.commit(); // sayfa hemen yenilenirse yazı beklemede kalmasın
    });
  }

  // bellek önce, IndexedDB sonra. IndexedDB yazamazsa değer localStorage'a kurtarılır; sonraki açılışta taşınır.
  function kaydet(k, v) {
    if (v == null) delete bellek[k]; else bellek[k] = v;
    if (kanal) kanal.postMessage([k, v]);
    if (kip !== 'idb') return Promise.resolve();
    return islem('readwrite', function (s) { if (v == null) s.delete(k); else s.put(v, k); }).then(function () {
      ls.removeItem(k); // daha önce kurtarılmış eski değer varsa sonraki açılışta bunun üstüne taşınmasın
    }, function (e) {
      if (typeof console !== 'undefined') console.error('LifeOS depo: IndexedDB yazamadı, kayıt localStorage\'a kurtarıldı: ' + k, e);
      if (k in bellek) ls.setItem(k, bellek[k]); else ls.removeItem(k);
    });
  }
  function koy(k, v) { return bizde(k) ? kaydet(k, v) : v == null ? ls.removeItem(k) : ls.setItem(k, v); }

  // localStorage'daki kayıtları IndexedDB'ye yazar; hepsi geri okunup aynı çıkınca localStorage'dan siler (hepsi ya da hiçbiri).
  // Her açılışta bakar: ilk taşımadan sonra localStorage'da yalnız kurtarılmış yazı bulunabilir, o da daha yenidir.
  function tasi(gecti) {
    var l = yereldekiler();
    if (!l.length) return;
    return islem('readwrite', function (s) { l.forEach(function (x) { s.put(x[1], x[0]); }); })
      .then(function () { return islem('readonly', function (s) { return l.map(function (x) { return s.get(x[0]); }); }); })
      .then(function (r) {
        if (gecti() || r.some(function (q, i) { return q.result !== l[i][1]; })) throw new Error('LifeOS depo: taşıma doğrulanamadı');
        l.forEach(function (x) { bellek[x[0]] = x[1]; ls.removeItem(x[0]); });
      });
  }

  function sor() { // kalıcı depolama bir kez istenir; verilmişse yeniden sorulmaz
    var s = kok.navigator && kok.navigator.storage;
    if (!s || !s.persist) return;
    Promise.resolve(s.persisted ? s.persisted() : false).then(function (p) { return p || s.persist(); })
      .then(function (p) { kalici = !!p; }, function () { kalici = false; });
  }

  // açılış: ayar deposunu bağlar (eşzamanlı), sonra IndexedDB'yi açıp kayıtları belleğe yükler ve taşır. Hiç reddetmez; kipi verir.
  function ac(yerel, idb) {
    ls = yerel;
    sor();
    var izli = ls.getItem(IZ) === 'idb', gecti = false, zaman;
    var is = new Promise(function (ok, red) {
      var r = (idb || kok.indexedDB).open(AD, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(TABLO); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { red(r.error || new Error('IndexedDB açılmadı')); };
    }).then(function (v) {
      db = v;
      return islem('readonly', function (s) { return [s.getAllKeys(), s.getAll()]; });
    }).then(function (r) {
      r[0].result.forEach(function (k, i) { bellek[k] = r[1].result[i]; });
      return tasi(function () { return gecti; });
    });
    // shortcut: takılan IndexedDB (eski Safari/WKWebView) kabuğu boş bırakmasın diye süre sınırı; süre ayarı gerekirse Depo.sure
    var sinir = new Promise(function (ok, red) { zaman = setTimeout(function () { gecti = true; red(new Error('IndexedDB yanıt vermedi')); }, Depo.sure); });
    return Promise.race([is, sinir]).then(function () {
      clearTimeout(zaman); kip = 'idb';
      try { if (!izli) ls.setItem(IZ, 'idb'); } catch (e) { /* iz yazılamazsa sonraki arızada yerel kipe düşer */ }
      if (kok.BroadcastChannel) { // öteki sekmenin yazdığı bu sekmenin belleğine de düşsün (localStorage gibi taze okunsun)
        kanal = new kok.BroadcastChannel(AD);
        kanal.onmessage = function (e) { var k = e.data[0], v = e.data[1]; if (v == null) delete bellek[k]; else bellek[k] = v; };
        if (kanal.unref) kanal.unref(); // Node testinde süreci açık tutmasın
      }
      return kip;
    }, function (e) {
      clearTimeout(zaman); gecti = true;
      kip = izli ? 'bellek' : 'yerel';
      if (izli) yereldekiler().forEach(function (x) { bellek[x[0]] = x[1]; });
      if (typeof console !== 'undefined') console.warn('LifeOS depo: IndexedDB kullanılamıyor, kip ' + kip, e);
      return kip;
    });
  }

  var Depo = {
    getItem: oku,
    setItem: function (k, v) { koy(k, String(v)); },
    removeItem: function (k) { koy(k, null); },
    ac: ac,
    al: function (k) { return soz(function () { return oku(k); }); },
    yaz: function (k, v) { return soz(function () { return koy(k, String(v)); }); },
    sil: function (k) { return soz(function () { return koy(k, null); }); },
    hepsi: function (onek) {
      return soz(function () {
        var o = {}, l = kip === 'yerel' ? yereldekiler().map(function (x) { return x[0]; }) : Object.keys(bellek);
        l.forEach(function (k) { if (KAYIT.test(k) && k.indexOf(onek || '') === 0) o[k] = oku(k); });
        return o;
      });
    },
    kayitMi: function (k) { return KAYIT.test(k); },
    kalici: function () { return kalici; },
    kip: function () { return kip; },
    sure: 3000
  };

  kok.LIFEOS = kok.LIFEOS || {};
  kok.LIFEOS.Kabuk = kok.LIFEOS.Kabuk || {};
  kok.LIFEOS.Kabuk.Depo = Depo;
  if (typeof module !== 'undefined' && module.exports) module.exports = Depo;
})(typeof window !== 'undefined' ? window : globalThis);
