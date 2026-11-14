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
  var KAYIT = /^lifeos\.(yol\.(?!son$)|not\.|tekrar\.|kayit\.kayitlar$|plan\.|soru\.|tanisma\.(kayit|taslak)$|beden\.|onay$)/;
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

  /* ---- Eşitleme: kayıtlar bilgisayardaki tek depoya da gider (sunucu /api/hesap/kabuk, sistem/veri.py kabuk_*) ----
   * Durum localStorage'da (ES): son (sunucu imleci), taban (anahtar → sunucuda gördüğüm sürüm), bekleyen (bu cihazda
   * yazılıp henüz gönderilmemiş anahtarlar), sakla (ilk katılışta sunucununkiyle çakışan yerel değerler), katil.
   * Kurallar: bekleyen yerel yazı sunucudakinden yenidir (gönderilince sunucu üstüne yazılanı kabuk-cakisma'da saklar);
   * cihaz ilk katılışta sunucudaki değeri alır, kendi farklı değeri kaybolmasın diye sunucuya «sakla» olarak gider;
   * sunucuda hiç olmayan yerel kayıt gönderilir. Sunucu yoksa (404, file://) eşitleme bu açılışta kapanır, kabuk eskisi gibi çalışır. */
  var ES = 'lifeos.kabuk.esitle', calisiyor = null, yine = false, erte = null, dinleyen = [];
  var esDurum = { son: 0, hata: '', kapali: false };
  function ag() {
    if (esDurum.kapali) return null;
    if (Depo.ag) return Depo.ag;
    var l = kok.location;
    return kok.fetch && l && /^https?:$/.test(l.protocol) ? kok.fetch.bind(kok) : null;
  }
  function yeniDurum() { return { son: 0, taban: {}, bekleyen: {}, sakla: [], katil: true }; }
  function esOku() { try { var s = JSON.parse(ls.getItem(ES)); return s && s.taban && s.bekleyen ? s : null; } catch (e) { return null; } }
  function esYaz(s) { try { ls.setItem(ES, JSON.stringify(s)); } catch (e) { /* dolu: sonraki yazıda yeniden denenir */ } }
  function jeton() { // telefonda sahibin oturumu (hesap.js çerezi); bilgisayar oturumsuz, yerel olduğu için girer
    try {
      var m = String(kok.document.cookie || '').match(/(?:^|;\s*)lifeos_hesap=([^;]*)/), o = m && JSON.parse(decodeURIComponent(m[1]));
      return o && typeof o.j === 'string' ? o.j : '';
    } catch (e) { return ''; }
  }
  function iste(yol, govde) {
    var b = { 'X-LifeOS': 'kabuk' }, j = jeton();
    if (j) b.Authorization = 'Bearer ' + j;
    if (govde) b['Content-Type'] = 'application/json';
    return ag()(Depo.adres + yol, { method: govde ? 'POST' : 'GET', headers: b, body: govde ? JSON.stringify(govde) : undefined,
      cache: 'no-store', credentials: 'omit' }).then(function (r) {
      if (!r.ok) { var e = new Error('LifeOS depo: eşitleme ' + r.status); e.kod = r.status; throw e; }
      return r.json();
    });
  }
  function yerelAnahtarlar() { return kip === 'yerel' ? yereldekiler().map(function (x) { return x[0]; }) : Object.keys(bellek); }
  function isaretle(k) {
    if (!KAYIT.test(k) || !ag()) return;
    var s = esOku() || yeniDurum();
    s.bekleyen[k] = 1; esYaz(s);
    clearTimeout(erte);
    erte = setTimeout(esitle, Depo.bekle);
    if (erte && erte.unref) erte.unref();
  }
  function cek() {
    var s = esOku() || yeniDurum(), degisen = [];
    function tur(son) {
      return iste('/api/hesap/kabuk?son=' + son).then(function (r) {
        var b = (esOku() || s).bekleyen; // tazesi: çekiş sürerken yazılan da bekleyen sayılsın
        r.kayitlar.forEach(function (x) {
          if (b[x.k]) return; // bu cihazın gönderilmemiş yazısı: tabanı eski kalsın ki sunucu üstüne yazdığını saklasın
          s.taban[x.k] = x.surum;
          var v = oku(x.k);
          if (v === x.v) return;
          if (s.katil && v != null) s.sakla.push({ k: x.k, v: v });
          koy(x.k, x.v); degisen.push(x.k);
        });
        return r.daha ? tur(r.son) : r.son;
      });
    }
    return tur(s.son).then(function (son) {
      var t = esOku() || yeniDurum();
      Object.keys(s.taban).forEach(function (k) { if (!t.bekleyen[k]) t.taban[k] = s.taban[k]; });
      t.son = son;
      if (t.katil) { // ilk katılış: sunucuda hiç olmayan yerel kayıtlar gönderilecek
        yerelAnahtarlar().forEach(function (k) { if (!(k in t.taban) && oku(k) != null) t.bekleyen[k] = 1; });
        t.sakla = (t.sakla || []).concat(s.sakla); t.katil = false;
      }
      esYaz(t);
      if (degisen.length) dinleyen.forEach(function (f) { try { f(degisen); } catch (e) { /* bir dinleyici ötekini durdurmasın */ } });
    });
  }
  function gonder() {
    var s = esOku();
    if (!s) return;
    var l = Object.keys(s.bekleyen).map(function (k) { return { k: k, v: oku(k), taban: s.taban[k] || 0 }; })
      .concat((s.sakla || []).map(function (x) { return { k: x.k, v: x.v, taban: 0, sakla: true }; }));
    var partiler = [], p = [], boy = 0; // en çok 50 kayıt ya da ~4 MB bir istekte
    l.forEach(function (y) {
      var n = (y.v || '').length;
      if (p.length && (p.length >= 50 || boy + n > 4e6)) { partiler.push(p); p = []; boy = 0; }
      p.push(y); boy += n;
    });
    if (p.length) partiler.push(p);
    return partiler.reduce(function (z, p) {
      return z.then(function () {
        return iste('/api/hesap/kabuk', { yazimlar: p }).then(function (r) {
          var t = esOku() || s;
          p.forEach(function (y) {
            if (y.sakla) { t.sakla = (t.sakla || []).filter(function (x) { return !(x.k === y.k && x.v === y.v); }); return; }
            if (y.k in r.surumler) t.taban[y.k] = r.surumler[y.k];
            if (oku(y.k) === y.v) delete t.bekleyen[y.k]; // gönderilirken yeniden yazıldıysa bekler
          });
          esYaz(t);
        });
      });
    }, Promise.resolve());
  }
  // Çek, sonra gönder. Aynı anda bir eşitleme; sürerken istenen bir tane daha arkasından koşar. Hiç reddetmez.
  function esitle() {
    if (!ag()) return Promise.resolve(Depo.esitleme());
    if (calisiyor) { yine = true; return calisiyor; }
    calisiyor = cek().then(gonder).then(function () { esDurum.son = Date.now(); esDurum.hata = ''; }, function (e) {
      esDurum.hata = e && e.kod ? 'Sunucu ' + e.kod : 'Sunucuya ulaşılamadı';
      if (e && e.kod === 404) esDurum.kapali = true; // tek depo ya da uç yok (eski sunucu): bu açılışta yeniden denenmez
    }).then(function () {
      calisiyor = null;
      if (yine) { yine = false; return esitle(); }
      return Depo.esitleme();
    });
    return calisiyor;
  }

  // açılış: ayar deposunu bağlar (eşzamanlı), sonra IndexedDB'yi açıp kayıtları belleğe yükler ve taşır. Hiç reddetmez; kipi verir.
  function ac(yerel, idb) {
    ls = yerel;
    sor();
    var izli = ls.getItem(IZ) === 'idb', gecti = false, zaman;
    if (kok.addEventListener && kok.document) { // cihaza dönünce ve ağ gelince öbür cihazın yazdıkları çekilsin
      kok.addEventListener('online', function () { esitle(); });
      kok.document.addEventListener('visibilitychange', function () { if (kok.document.visibilityState === 'visible') esitle(); });
    }
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
    var acildi = Promise.race([is, sinir]).then(function () {
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
    acildi.then(function () { if (ag()) esitle(); }); // açılışı beklemez: sayfa yerel kayıtla çizilir, çekilen gelince dinleyen yeniler
    return acildi;
  }

  function yazVeIsaretle(k, v) { var r = koy(k, v); isaretle(k); return r; }

  var Depo = {
    getItem: oku,
    setItem: function (k, v) { yazVeIsaretle(k, String(v)); },
    removeItem: function (k) { yazVeIsaretle(k, null); },
    ac: ac,
    al: function (k) { return soz(function () { return oku(k); }); },
    yaz: function (k, v) { return soz(function () { return yazVeIsaretle(k, String(v)); }); },
    sil: function (k) { return soz(function () { return yazVeIsaretle(k, null); }); },
    esitle: esitle,
    esitleme: function () { // durum: Ayarlar › Hesap ve testler için
      var s = esOku();
      return { acik: !!ag(), son: esDurum.son, hata: esDurum.hata, bekleyen: s ? Object.keys(s.bekleyen).length : 0 };
    },
    dinle: function (f) { dinleyen.push(f); }, // f(değişen anahtarlar): öbür cihazdan gelen kayıt belleğe yazıldı
    adres: '',
    bekle: 800,
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
