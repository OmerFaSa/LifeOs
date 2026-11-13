/* LIFEOS.Kabuk araç ekranları — Not, Tekrar ve Yol haritası listesi (sadeleşme Faz 2/3).
 * Kural motorlardadır (motor/not.js, motor/tekrar.js, motor/yol.js); burası çizer ve kaydeder.
 * Sayfalar Kabuk.ek[yerId](yer, alt) ile kaydolur; kabuk.js rota() onları çağırır. Bu dosya kabuk.js'ten ÖNCE yüklenir.
 * shortcut: kayıtlar bu tarayıcının deposunda durur (lifeos.not.kayit, lifeos.tekrar.kartlar, lifeos.kayit.kayitlar, lifeos.plan.durum, lifeos.soru.*), cihazlar arası eşitlenmez; tek depoya (sistem/veri.py) P6 göçünden sonra bağlanır.
 * Sıfır bağımlılık; tarayıcıda window.LIFEOS.Kabuk.Arac, Node'da module.exports (yalnız saf kısım). */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  var HARF = 'ABCDEFGH';

  /* ---------------- saf ---------------- */
  function kimlik(onek, simdi, rast) { return onek + simdi.toString(36) + Math.floor(rast * 1679616).toString(36); }
  function notSira(a, b) { return (b.sabit - a.sabit) || (b.guncelleme - a.guncelleme) || (a.id < b.id ? -1 : 1); }

  // Formdan kayıt: yeni not ya da var olanın güncellenmişi. Geçersizse motorun Türkçe cümlesiyle hata fırlatır; liste değişmez.
  function notKaydet(Not, notlar, id, form, simdi, yeniId) {
    var baslik = String(form.baslik || '').trim(), govde = String(form.govde || '');
    var eski = notlar.filter(function (n) { return n.id === id; })[0];
    if (!eski) {
      return { id: yeniId, notlar: notlar.concat([Not.yeni({ id: yeniId, baslik: baslik, govde: govde, ozel: !!form.ozel, sabit: !!form.sabit, olusturma: simdi })]) };
    }
    var l = notlar;
    if (baslik !== eski.baslik) l = Not.yenidenAdlandir(l, id, baslik, simdi).notlar; // bu nota verilen bağların görünen adı da tazelenir
    l = l.map(function (n) {
      if (n.id !== id) return n;
      var y = Object.assign({}, n, { govde: govde, ozel: !!form.ozel, sabit: !!form.sabit, guncelleme: Math.max(simdi, n.guncelleme) });
      var h = Not.dogrula(y);
      if (h) throw new Error(h);
      return y;
    });
    return { id: id, notlar: l };
  }

  // Yol'un tekrar adayları (yalnız onaylı içerik) için eksik kartları ekler; var olan karta dokunmaz.
  function kartlariEsitle(Tekrar, kartlar, adaylar, y) {
    var varMi = {};
    kartlar.forEach(function (k) { varMi[k.id] = true; });
    var ek = adaylar.filter(function (a) { return !varMi[a.id]; }).map(function (a) {
      var o = y.oge[a.id];
      return Tekrar.yeniKart(a.id, { icerik: a.icerik, on: o.soru, arka: o.sec[HARF.indexOf(o.dogru)], kaynak: 'yol' });
    });
    return ek.length ? kartlar.concat(ek) : kartlar;
  }
  function gunSonu(simdi) { var d = new Date(simdi); d.setHours(23, 59, 59, 999); return d.getTime(); }
  function gunAdi(simdi) { var d = new Date(simdi), iki = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + iki(d.getMonth() + 1) + '-' + iki(d.getDate()); }
  // Bugünün kuyruğu: önce vadesi gelen tekrarlar, sonra yeni kartlar; sıra ve tavanlar motorun planından.
  function kuyruk(Tekrar, kartlar, simdi, yapilan) {
    var p = Tekrar.plan(kartlar, simdi, { gunSonu: gunSonu(simdi), yapilan: yapilan });
    return { sira: p.tekrar.concat(p.yeni), plan: p };
  }
  // Bir cevap: kartı günceller, günün sayacını artırır. Motor reddederse (taslak içerik) hiçbir şey değişmez.
  function kartCevapla(Tekrar, kartlar, id, not, simdi, sayac) {
    var k = kartlar.filter(function (x) { return x.id === id; })[0], r = k && Tekrar.cevapla(k, not, simdi);
    if (!r || !r.ok) return { kartlar: kartlar, sayac: sayac, ok: false, neden: r ? r.neden : 'kart yok' };
    var s = sayac && sayac.gun === gunAdi(simdi) ? { gun: sayac.gun, yeni: sayac.yeni, tekrar: sayac.tekrar } : { gun: gunAdi(simdi), yeni: 0, tekrar: 0 };
    s[k.durum === 'yeni' ? 'yeni' : 'tekrar']++;
    return { kartlar: kartlar.map(function (x) { return x.id === id ? r.kart : x; }), sayac: s, ok: true, gun: r.gun };
  }
  function aralikAdi(gun) { return gun === 0 ? 'şimdi' : gun < 30 ? gun + ' gün' : gun < 365 ? Math.round(gun / 30) + ' ay' : (Math.round(gun / 36.5) / 10) + ' yıl'; }

  /* ---- Kayıt (motor/kayit.js) ---- */
  // Formdan kayıt: boş bırakılan alan yollanmaz; «tahmin» işaretliyse sayılar tahmin etiketiyle gider (AGENTS §1.2).
  // Geçersizse motorun Türkçe cümleleri döner, liste değişmez.
  function kayitEkle(Kayit, kayitlar, tur, form, tahmin, gun, zaman) {
    var t = Kayit.TURLER[tur], girdi = {};
    if (!t) return { ok: false, hatalar: ['Bilinmeyen kayıt türü.'] };
    Object.keys(t.sayilar || {}).forEach(function (a) {
      var v = form[a] == null ? '' : String(form[a]).trim();
      if (v) girdi[a] = tahmin ? { v: v, k: 'estimated' } : v;
    });
    Object.keys(t.metinler || {}).forEach(function (a) {
      var v = form[a] == null ? '' : String(form[a]).trim();
      if (v) girdi[a] = v;
    });
    var r = Kayit.kaydet(tur, girdi, { gun: gun, zaman: zaman, mevcut: kayitlar });
    return r.ok ? { ok: true, kayit: r.kayit, kayitlar: kayitlar.concat([r.kayit]) } : { ok: false, hatalar: r.hatalar };
  }
  function sayiYaz(v) { return String(Math.round(v * 100) / 100).replace('.', ','); }
  // Günün özeti: yalnız verisi olan satırlar; her sayı kesinlik etiketiyle. Eksik veri sıfır diye gösterilmez.
  function gunOzeti(Kayit, kayitlar, gun) {
    var g = Kayit.gunluk(kayitlar, gun), E = Kayit.ETIKET, l = [];
    var ekle = function (ad, d, birim) { if (d && d.v != null) l.push({ ad: ad, metin: sayiYaz(d.v) + (birim ? ' ' + birim : ''), etiket: E[d.k] }); };
    ekle('Su', g.su, 'ml');
    ekle('Gece uykusu', g.uyku.gece, 'saat');
    ekle('Kısa uyku', g.uyku.kestirmeDk, 'dk');
    ekle('Hareket', g.hareket.dk, 'dk');
    ekle('Çalışma', g.calisma.dk, 'dk');
    ekle('Öğün', g.ogun.sayi, '');
    ekle('Enerji (öğünlerden)', g.ogun.kcal, 'kcal');
    ekle('Enerji ve ruh hâli', g.enerji, '/ 5');
    ekle('Mola', g.mola, 'dk');
    Object.keys(g.olcum).forEach(function (t) {
      var tablo = Kayit.TURLER[t].sayilar;
      Object.keys(g.olcum[t]).forEach(function (a) { ekle(tablo[a].ad, g.olcum[t][a], tablo[a].birim); });
    });
    return l;
  }
  /* Kural satırları (Kayit.Kural, SPİ'nin güvenlik sınırlarıyla): enerji hedefi ve günün antrenman kararı.
     profil: Ayarlar › Beden (cinsiyet, boy, doğum yılı, hedef); kilo son tartıdan. Eksik girdi adıyla söylenir. */
  var EMIR = { full: 'Tam yük', reduced: 'Azaltılmış yük', light: 'Hafif', rest: 'Dinlenme' };
  function kuralOzeti(Kayit, kayitlar, gun, profil, yil) {
    var K = Kayit.Kural, E = Kayit.ETIKET, l = [], eksik = null;
    var e = K.enerjiHedefi(profil, kayitlar, gun, yil);
    if (e.deger && e.deger.v != null) {
      l.push({ ad: 'Enerji hedefi', metin: sayiYaz(e.deger.v) + ' kcal' + (e.bmrTaban ? ' (bazal tabanı)' : ''), etiket: E[e.deger.k] });
      l.push({ ad: 'Bazal metabolizma', metin: sayiYaz(e.bmr.v) + ' kcal', etiket: E[e.bmr.k] });
    } else eksik = e.eksik;
    var g = K.gununEmri(kayitlar, gun), veriYok = g.gerekce.indexOf('veri-yok') >= 0;
    if (!veriYok) l.push({ ad: 'Bugünkü antrenman', metin: EMIR[g.tur] + ' · çarpan ' + sayiYaz(g.carpan.v), etiket: E[g.carpan.k] });
    return { satirlar: l, eksik: eksik, emirVeriYok: veriYok };
  }
  // Bir kaydın tek satırlık okunuşu: «Su · 500 ml (ölçüldü)»
  function kayitMetni(Kayit, r) {
    var t = Kayit.TURLER[r.tur], p = [];
    Object.keys(r.deger || {}).forEach(function (a) { var f = t.sayilar[a]; p.push(sayiYaz(r.deger[a].v) + (f.birim && f.birim !== '1-5' ? ' ' + f.birim : '') + ' (' + Kayit.ETIKET[r.deger[a].k] + ')'); });
    Object.keys(r.ek || {}).forEach(function (a) { p.push(r.ek[a]); });
    return t.ad + ' · ' + p.join(' · ');
  }

  /* ---- Plan (motor/plan.js) ---- */
  // durum: { ayar: { musait: [{bas, bit}], gunlukDakika? }, isler: [{id, ad, dk, son?}], gunPlan: { gun, plan } | null }
  function planBos() { return { ayar: { musait: [] }, isler: [], gunPlan: null }; }
  // Günün planını kurar; aynı günün planı varsa ilerlemesi başlamış bloklar yerinde kalır (Plan.yenidenKur).
  // ek: { dersler: [{id, ad, dk}], tekrar: Tekrar.plan() çıktısı }. Sıra, mola ve sığmayanlar motorun kuralıdır.
  function planKur(Plan, durum, gun, ek) {
    var girdi = { gun: gun, bugun: gun, musait: durum.ayar.musait, isler: durum.isler, dersler: (ek && ek.dersler) || [], tekrar: ek && ek.tekrar };
    if (durum.ayar.gunlukDakika) girdi.gunlukDakika = durum.ayar.gunlukDakika;
    var eski = durum.gunPlan && durum.gunPlan.gun === gun ? durum.gunPlan.plan : null;
    return eski ? Plan.yenidenKur(eski, girdi) : Plan.gunPlani(girdi);
  }
  // Gün değiştiyse: yapılan işler listeden çıkar, bitmeyenler motorun devir kuralıyla (kalan süre, devir sayısı) kalır, eski plan silinir.
  function planGunDevri(Plan, durum, gun) {
    if (!durum.gunPlan || durum.gunPlan.gun >= gun) return durum;
    var devir = {}, yapilan = {};
    Plan.devret(durum.gunPlan.plan).forEach(function (x) { devir[x.id] = x; });
    durum.gunPlan.plan.bloklar.forEach(function (b) { if (b.tur === 'is' && b.durum === 'yapildi') yapilan[b.kaynakId || b.id] = true; });
    return { ayar: durum.ayar, gunPlan: null, isler: durum.isler.filter(function (x) { return !yapilan[x.id] || devir[x.id]; }).map(function (x) {
      return devir[x.id] ? Object.assign({}, x, { dk: devir[x.id].dk, devir: devir[x.id].devir }) : x;
    }) };
  }
  // Yeni iş ya da boş zaman aralığı: geçerliliğe motor karar verir (aynı cümleler); geçersizse durum değişmez.
  function planEkle(Plan, durum, ne, veri, gun) {
    var aday = ne === 'is' ? { gun: gun, musait: [], isler: durum.isler.concat([veri]) } : { gun: gun, musait: durum.ayar.musait.concat([veri]) };
    var r = Plan.gunPlani(aday);
    if (!r.ok) return { ok: false, hatalar: r.hatalar };
    return { ok: true, durum: ne === 'is' ? { ayar: durum.ayar, gunPlan: durum.gunPlan, isler: aday.isler }
      : { ayar: Object.assign({}, durum.ayar, { musait: aday.musait.slice().sort(function (a, b) { return a.bas < b.bas ? -1 : 1; }) }), isler: durum.isler, gunPlan: durum.gunPlan } };
  }

  /* ---- Soru (motor/soru.js) ---- */
  // Bir alanın karma test havuzu: seçmeli alıştırmalar; konu = ders (aynı dersten iki soru ard arda gelmesin diye).
  // sozluk: { id: soru } (soruya `konu` ders adı olarak eklenir; içerik değişmez). Yalnız açık ünitelerin soruları girer.
  function soruHavuzu(Yol, y, kayit) {
    var havuz = [], sozluk = {};
    y.veri.uniteler.forEach(function (u) {
      if (!Yol.acikMi(y, kayit, u.id)) return;
      u.dersler.forEach(function (ders) {
        ders.alistirmalar.forEach(function (a) {
          if (a.tur !== 'secmeli') return;
          havuz.push({ id: a.id, konu: ders.id });
          sozluk[a.id] = Object.assign({}, a, { konu: ders.ad });
        });
      });
    });
    return { havuz: havuz, sozluk: sozluk };
  }
  // Oturumda sıradaki cevapsız sorunun sırası; hepsi cevaplandıysa -1.
  function soruSirasi(oturum) {
    for (var i = 0; i < oturum.sorular.length; i++) if (!oturum.cevaplar[i]) return i;
    return -1;
  }

  var Arac = { kimlik: kimlik, soruHavuzu: soruHavuzu, soruSirasi: soruSirasi, planBos: planBos, planKur: planKur, planGunDevri: planGunDevri, planEkle: planEkle, kayitEkle: kayitEkle, gunOzeti: gunOzeti, kuralOzeti: kuralOzeti, kayitMetni: kayitMetni, notSira: notSira, notKaydet: notKaydet, kartlariEsitle: kartlariEsitle, gunSonu: gunSonu, gunAdi: gunAdi,
    kuyruk: kuyruk, kartCevapla: kartCevapla, aralikAdi: aralikAdi };
  Kabuk.Arac = Arac;
  if (typeof module !== 'undefined' && module.exports) module.exports = Arac;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var d = document, Not = L.Motor && L.Motor.Not, Tekrar = L.Motor && L.Motor.Tekrar;
  var NOT_ANAHTAR = 'lifeos.not.kayit', KART_ANAHTAR = 'lifeos.tekrar.kartlar', SAYAC_ANAHTAR = 'lifeos.tekrar.bugun';
  var ic = function () { return Kabuk.ic; }; // kabuk.js sonra yüklenir; çizim anında hazırdır
  function oku(anahtar, bos) {
    try { var v = JSON.parse(ic().depo.getItem(anahtar)); if (v && typeof v === 'object' && Array.isArray(v) === Array.isArray(bos)) return v; } catch (e) { /* bozuk kayıt: boş başla */ }
    return bos;
  }
  function yaz(anahtar, v) { ic().depo.setItem(anahtar, JSON.stringify(v)); }
  function tarih(ms) { return new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function eksik(ad) { return '<div class="yuva" role="note"><b>' + ad + ' aracı yüklenemedi.</b><span>Sayfayı yenile; sürerse LifeOS sunucusundan aç.</span></div>'; }

  /* ---- Not ---- */
  var notDurum = null; // { id, metin, hata? }: son kaydın iletisi, yalnız hemen ardından gösterilir
  function notSatiri(n, parca) {
    var k = ic().kac, et = Not.etiketleri(n);
    return '<a class="satir" href="#/motor/not/' + n.id + '"><span class="satir__ad">' + k(Not.ad(n)) + '</span><span class="satir__not">' +
      (parca ? k(parca) : tarih(n.guncelleme) + (et.length ? ' · ' + et.map(function (e) { return '#' + k(e); }).join(' ') : '')) + '</span>' +
      (n.ozel ? '<span class="pul">özel</span>' : n.sabit ? '<span class="pul pul--pilot">sabit</span>' : '') + '<span class="satir__ok" aria-hidden="true">›</span></a>';
  }
  function notListesi(notlar, sorgu) {
    if (!notlar.length) return '<p class="soluk">Henüz not yok. «Yeni not» ile ilkini yaz.</p>';
    if (!sorgu.trim()) return notlar.slice().sort(notSira).map(function (n) { return notSatiri(n); }).join('');
    var harita = {}; notlar.forEach(function (n) { harita[n.id] = n; });
    var s = Not.ara(notlar, sorgu, { sinir: 50 });
    return s.length ? s.map(function (x) { return notSatiri(harita[x.id], x.parca); }).join('') : '<p class="soluk">Bu aramaya uyan not yok.</p>';
  }
  function sayfaNot(yer, alt) {
    var I = ic(), k = I.kac;
    if (!Not) return I.ust(I.kirinti(yer)) + '<div class="govde"><h1>Not</h1>' + eksik('Not') + '</div>';
    var notlar = oku(NOT_ANAHTAR, []);
    if (!alt) {
      return I.ust(I.kirinti(yer)) + '<div class="govde" data-arac="not"><h1>Not</h1>' +
        '<div class="aracust"><input type="search" class="giris" data-not-ara aria-label="Notlarda ara" placeholder="Notlarda ara (#etiket de olur)" autocomplete="off">' +
        '<a class="dugme dugme--ana" href="#/motor/not/yeni">Yeni not</a></div>' +
        '<div id="not-liste" class="liste" aria-live="polite">' + notListesi(notlar, '') + '</div>' +
        '<p class="soluk">' + notlar.length + ' not · bu cihazda durur</p></div>';
    }
    var n = alt === 'yeni' ? null : notlar.filter(function (x) { return x.id === alt; })[0];
    var geri = '<a class="kirinti" href="#/motor/not"><span aria-hidden="true">‹ </span>Not</a><span class="kirinti__ayrac" aria-hidden="true">/</span><span>' + k(n ? Not.ad(n) : 'Yeni not') + '</span>';
    if (alt !== 'yeni' && !n) {
      return I.ust(geri) + '<div class="govde"><div class="yuva" role="note"><b>Bu not bulunamadı.</b><span>Silinmiş ya da başka bir cihazda yazılmış olabilir.</span></div>' +
        '<div class="eylemler"><a class="dugme dugme--ana" href="#/motor/not">Notlara dön</a></div></div>';
    }
    var durum = notDurum && notDurum.id === alt ? notDurum : null; notDurum = null;
    var f = durum && durum.form || n || { baslik: '', govde: '', ozel: false, sabit: false };
    var oteki = notlar.filter(function (x) { return !n || x.id !== n.id; }).sort(notSira);
    var adlar = {}; notlar.forEach(function (x) { adlar[x.id] = Not.ad(x); });
    var giden = n ? Not.baglar(n.govde) : [], gelen = n ? Not.geriBaglar(notlar, n.id) : [];
    var bagSatiri = function (b) {
      var varMi = adlar[b.id] != null;
      return '<li>' + (varMi ? '<a href="#/motor/not/' + b.id + '">' + k(b.ad || adlar[b.id]) + '</a>' : '<span class="soluk">' + k(b.ad || 'silinmiş not') + ' (silinmiş)</span>') +
        (b.celiski ? ' <span class="pul">çelişki</span>' : '') + '</li>';
    };
    return I.ust(geri) + '<div class="govde" data-arac="not"><h1>' + (n ? 'Notu düzenle' : 'Yeni not') + '</h1>' +
      '<form class="notform" data-not="' + k(alt) + '" novalidate>' +
      '<div class="notform__ileti" role="alert" tabindex="-1">' + (durum ? k(durum.metin) : '') + '</div>' +
      '<label class="alanet">Başlık<input type="text" class="giris" name="baslik" maxlength="120" value="' + k(f.baslik) + '" autocomplete="off"></label>' +
      '<label class="alanet">Not<textarea class="giris" name="govde" rows="12">' + k(f.govde) + '</textarea></label>' +
      (oteki.length ? '<label class="alanet">Başka bir nota bağ ekle<select class="giris" data-bag-ekle><option value="">Not seç…</option>' +
        oteki.map(function (x) { return '<option value="' + k(x.id) + '">' + k(Not.ad(x)) + '</option>'; }).join('') + '</select></label>' : '') +
      '<div class="eylemler"><label class="isaret"><input type="checkbox" name="ozel"' + (f.ozel ? ' checked' : '') + '> Özel (King görmez)</label>' +
      '<label class="isaret"><input type="checkbox" name="sabit"' + (f.sabit ? ' checked' : '') + '> Üstte tut</label></div>' +
      '<div class="eylemler"><button type="submit" class="dugme dugme--ana">Kaydet</button>' +
      (n ? '<button type="button" class="dugme dugme--sade" data-arac-ac="not-sil" data-id="' + k(n.id) + '">Sil</button>' : '') +
      '<a class="dugme dugme--sade" href="#/motor/not">Notlara dön</a></div></form>' +
      (giden.length ? '<section><h2>Bu nottaki bağlar</h2><ul class="baglar">' + giden.map(bagSatiri).join('') + '</ul></section>' : '') +
      (gelen.length ? '<section><h2>Bu nota bağlananlar</h2><ul class="baglar">' + gelen.map(bagSatiri).join('') + '</ul></section>' : '') +
      (n ? '<p class="soluk">Son değişiklik ' + tarih(n.guncelleme) + '</p>' : '') + '</div>';
  }
  function notFormKaydet(form) {
    var id = form.getAttribute('data-not'), simdi = Date.now();
    var veri = { baslik: form.elements.baslik.value, govde: form.elements.govde.value, ozel: form.elements.ozel.checked, sabit: form.elements.sabit.checked };
    try {
      var r = notKaydet(Not, oku(NOT_ANAHTAR, []), id, veri, simdi, kimlik('n', simdi, Math.random()));
      yaz(NOT_ANAHTAR, r.notlar);
      notDurum = { id: r.id, metin: 'Kaydedildi.' };
      ic().git('#/motor/not/' + r.id);
    } catch (e) {
      notDurum = { id: id, metin: e.message, form: veri }; // yazılan kaybolmasın
      ic().rota();
    }
    setTimeout(function () { var il = d.querySelector('.notform__ileti'); if (il && il.textContent) il.focus(); }, 0); // çizimden sonra: ileti ekran okuyucuya da ulaşsın
  }

  /* ---- Tekrar ---- */
  var gosterilen = null; // arkası açılmış kartın kimliği
  function kartlar() {
    var l = oku(KART_ANAHTAR, []), I = ic(), ilk = l;
    // yüklenmiş her alanın her aşamasının onaylı ders alıştırmaları kendiliğinden kart olur (taslak içerik aday çıkarmaz)
    I.tasinanlar().forEach(function (yer) {
      (I.asamalar(yer.id) || []).forEach(function (y, j) { l = kartlariEsitle(Tekrar, l, I.Yol.tekrarAdaylari(y, I.kayitOku(yer.id, j + 1)), y); });
    });
    if (l !== ilk) yaz(KART_ANAHTAR, l);
    return l;
  }
  function sayac(simdi) { var s = oku(SAYAC_ANAHTAR, {}); return s.gun === gunAdi(simdi) ? s : { gun: gunAdi(simdi), yeni: 0, tekrar: 0 }; }
  function sayfaTekrar(yer) {
    var I = ic(), k = I.kac;
    if (!Tekrar) return I.ust(I.kirinti(yer)) + '<div class="govde"><h1>Tekrar</h1>' + eksik('Tekrar') + '</div>';
    var simdi = Date.now(), l = kartlar(), s = sayac(simdi), q = kuyruk(Tekrar, l, simdi, s), kart = q.sira[0], govde;
    if (!l.length) govde = '<p class="soluk">Henüz kart yok. Aşağıdan ilk kartını ekle; onaylanmış derslerin alıştırmaları da buraya kendiliğinden gelir.</p>';
    else if (!kart) govde = '<div class="kapisonuc kapisonuc--gecti" role="status"><b>Bugünlük bitti.</b> ' + (s.yeni + s.tekrar) + ' cevap verdin.' +
      (q.plan.bekleyen.yeni + q.plan.bekleyen.tekrar ? ' <span class="soluk">Günlük tavan doldu; ' + (q.plan.bekleyen.yeni + q.plan.bekleyen.tekrar) + ' kart yarına kaldı.</span>' : '') + '</div>';
    else {
      var acik = gosterilen === kart.id;
      govde = '<p class="soluk">Bugün ' + q.plan.tekrar.length + ' tekrar, ' + q.plan.yeni.length + ' yeni kart</p>' +
        '<div class="kart" data-kart="' + k(kart.id) + '"><p class="kart__on">' + k(kart.on) + '</p>' +
        (acik ? '<p class="kart__arka" tabindex="-1">' + k(kart.arka) + '</p><div class="notlar" role="group" aria-label="Ne kadar hatırladın?">' +
          [[1, 'Yine'], [2, 'Zor'], [3, 'İyi'], [4, 'Kolay']].map(function (n) {
            return '<button type="button" class="dugme" data-arac-ac="kart-not" data-not="' + n[0] + '"><span>' + n[1] + '</span><small>' + aralikAdi(Tekrar.cevapla(kart, n[0], simdi).gun) + '</small></button>';
          }).join('') + '</div>'
          : '<div class="eylemler"><button type="button" class="dugme dugme--ana" data-arac-ac="kart-goster">Cevabı göster</button></div>') + '</div>';
    }
    var liste = l.length ? '<details class="kaynak"><summary>Bütün kartlar (' + l.length + ')</summary><ul class="kartliste">' + l.map(function (x) {
      var h = Tekrar.hatirlama(x, simdi), vade = x.sonraki == null ? 'yeni' : x.sonraki <= gunSonu(simdi) ? 'bugün' : tarih(x.sonraki);
      return '<li><span>' + k(x.on) + '</span><span class="soluk">' + vade + ' · hatırlama ' + (h.deger == null ? '—' : '%' + Math.round(h.deger * 100)) + ' (' + h.etiket + ')</span>' +
        (x.kaynak === 'yol' ? '' : '<button type="button" class="dugme dugme--sade" data-arac-ac="kart-sil" data-id="' + k(x.id) + '" aria-label="Kartı sil: ' + k(x.on) + '">Sil</button>') + '</li>';
    }).join('') + '</ul></details>' : '';
    return I.ust(I.kirinti(yer)) + '<div class="govde" data-arac="tekrar"><h1>Tekrar</h1>' + govde +
      '<form class="kartform" novalidate><h2>Kart ekle</h2><div class="notform__ileti" role="alert" tabindex="-1"></div>' +
      '<label class="alanet">Ön yüz (soru)<input type="text" class="giris" name="on" maxlength="300" autocomplete="off"></label>' +
      '<label class="alanet">Arka yüz (cevap)<textarea class="giris" name="arka" rows="3" maxlength="2000"></textarea></label>' +
      '<div class="eylemler"><button type="submit" class="dugme">Kartı ekle</button></div></form>' + liste + '</div>';
  }
  function kartEkle(form) {
    var on = form.elements.on.value.trim(), arka = form.elements.arka.value.trim(), simdi = Date.now();
    if (!on || !arka) { var il = form.querySelector('.notform__ileti'); il.textContent = 'Kartın iki yüzü de dolu olmalı.'; il.focus(); return; }
    yaz(KART_ANAHTAR, oku(KART_ANAHTAR, []).concat([Tekrar.yeniKart(kimlik('k', simdi, Math.random()), { on: on, arka: arka, kaynak: 'elle', olusturma: simdi })]));
    ic().rota();
  }

  /* ---- Yol haritası listesi ---- */
  function sayfaYol(yer) {
    var I = ic(), k = I.kac, alanlar = I.tasinanlar(), eksik_ = alanlar.filter(function (a) { return !I.al(a.id); });
    // ilerleme içerik yüklenince hesaplanır; eksik olanlar istenir, gelince sayfa bir kez daha çizilir
    if (eksik_.length) Promise.all(eksik_.map(function (a) { return I.alanYukle(a.id); })).then(function () { if (d.querySelector('[data-arac="yol"]')) I.rota(); });
    return I.ust(I.kirinti(yer)) + '<div class="govde" data-arac="yol"><h1>Yol haritası</h1><p class="soluk">Her alanın aşama, ünite, ders ve kapıları. ' + alanlar.length + ' alan taşındı.</p>' +
      '<div class="liste">' + alanlar.map(function (a) {
        var dr = I.fDurum(a.id), il = dr && dr.ilerleme;
        return '<a class="satir" href="' + a.yol + '"><span class="satir__ad">' + k(a.ad) + '</span><span class="satir__not">' +
          (il ? 'Aşama ' + I.al(a.id).n + ' · ' + k(dr.asama.ad) + ' · ' + il.okunanDers.deger + '/' + il.okunanDers.toplam + ' ders okundu · ' + il.gecilenUnite.deger + '/' + il.gecilenUnite.toplam + ' kapı geçildi' : 'Aşama 1') +
          '</span><span class="pul pul--pilot">taşınıyor</span><span class="satir__ok" aria-hidden="true">›</span></a>';
      }).join('') + '</div></div>';
  }

  /* ---- Kayıt ---- */
  var KAYIT_ANAHTAR = 'lifeos.kayit.kayitlar', Kayit = L.Motor && L.Motor.Kayit;
  var kayitTur = 'su', kayitIleti = null; // seçili tür; son gönderimin iletisi { hatalar?, tamam?, form?, tahmin? }
  function kayitAlanlari(t, f) {
    var k = ic().kac;
    return Object.keys(t.sayilar || {}).map(function (a) {
      var x = t.sayilar[a], birim = x.birim && x.birim !== '1-5' ? ' (' + x.birim + ')' : '';
      return '<label class="alanet">' + k(x.ad + birim) + (x.zorunlu ? '' : ' · isteğe bağlı') +
        '<input type="text" inputmode="decimal" class="giris" name="' + a + '" autocomplete="off" value="' + k(f[a] || '') + '" placeholder="' + k(String(x.min).replace('.', ',') + ' – ' + String(x.max).replace('.', ',')) + '"></label>';
    }).join('') + Object.keys(t.metinler || {}).map(function (a) {
      var x = t.metinler[a], et = k(x.ad) + (x.zorunlu ? '' : ' · isteğe bağlı');
      if (x.secim) return '<label class="alanet">' + et + '<select class="giris" name="' + a + '"><option value="">Seç…</option>' +
        x.secim.map(function (o) { return '<option value="' + k(o) + '"' + (f[a] === o ? ' selected' : '') + '>' + k(o) + '</option>'; }).join('') + '</select></label>';
      return '<label class="alanet">' + et + '<input type="text" class="giris" name="' + a + '" autocomplete="off" value="' + k(f[a] || '') + '"' + (x.desenMetni ? ' placeholder="12:30"' : '') + '></label>';
    }).join('');
  }
  function sayfaKayit(yer) {
    var I = ic(), k = I.kac;
    if (!Kayit) return I.ust(I.kirinti(yer)) + '<div class="govde"><h1>Kayıt</h1>' + eksik('Kayıt') + '</div>';
    var simdi = Date.now(), gun = gunAdi(simdi), l = oku(KAYIT_ANAHTAR, []), T = Kayit.TURLER, t = T[kayitTur] || T.su;
    var il = kayitIleti; kayitIleti = null;
    var f = il && il.form || {}, gruplar = {};
    Object.keys(T).forEach(function (id) { var a = T[id].alan === '*' ? 'Genel' : T[id].alan; (gruplar[a] = gruplar[a] || []).push(id); });
    var ozet = gunOzeti(Kayit, l, gun), bugun = l.filter(function (r) { return r.gun === gun; }).reverse();
    var Ay = L.Kabuk && L.Kabuk.Ayar, ay = function (a) { return Ay ? Ay.oku(I.depo, a) : null; };
    var cins = ay('lifeos.beden.cinsiyet');
    var kural = kuralOzeti(Kayit, l, gun, { cinsiyet: cins === 'belirtilmedi' ? null : cins, boy: ay('lifeos.beden.boy'),
      dogumYili: ay('lifeos.beden.dogumYili'), hedef: ay('lifeos.beden.hedef') }, new Date(simdi).getFullYear());
    return I.ust(I.kirinti(yer)) + '<div class="govde" data-arac="kayit"><h1>Kayıt</h1>' +
      '<form class="kayitform" novalidate>' +
      '<div class="notform__ileti" role="alert" tabindex="-1">' + (il ? (il.hatalar ? il.hatalar.map(k).join('<br>') : k(il.tamam)) : '') + '</div>' +
      '<label class="alanet">Ne kaydediyorsun?<select class="giris" data-kayit-tur>' + Object.keys(gruplar).map(function (g) {
        return '<optgroup label="' + k(g) + '">' + gruplar[g].map(function (id) { return '<option value="' + id + '"' + (id === kayitTur ? ' selected' : '') + '>' + k(T[id].ad) + '</option>'; }).join('') + '</optgroup>';
      }).join('') + '</select></label>' + kayitAlanlari(t, f) +
      (Object.keys(t.sayilar || {}).length ? '<label class="isaret"><input type="checkbox" name="tahmin"' + (il && il.tahmin ? ' checked' : '') + '> Sayılar tahmin (ölçmedim)</label>' : '') +
      '<div class="eylemler"><button type="submit" class="dugme dugme--ana">Kaydet</button></div></form>' +
      '<section><h2>Bugün</h2>' + (ozet.length ? '<ul class="ozet">' + ozet.map(function (o) {
        return '<li><span>' + k(o.ad) + '</span><b>' + k(o.metin) + '</b><span class="pul">' + k(o.etiket) + '</span></li>';
      }).join('') + '</ul>' : '<p class="soluk">Bugün için kayıt yok. Veri olmayan satır gösterilmez; boş, sıfır demek değildir.</p>') + '</section>' +
      '<section data-kural><h2>Kurallar</h2>' + (kural.satirlar.length ? '<ul class="ozet">' + kural.satirlar.map(function (o) {
        return '<li><span>' + k(o.ad) + '</span><b>' + k(o.metin) + '</b><span class="pul">' + k(o.etiket) + '</span></li>';
      }).join('') + '</ul>' : '') +
      (kural.eksik ? '<p class="soluk">Enerji hedefi için eksik: ' + k(kural.eksik.join(', ')) + '. <a href="#/ayarlar">Ayarlar › Beden</a>; kilo, Kayıt › Kilo kaydından gelir.</p>' : '') +
      (kural.emirVeriYok ? '<p class="soluk">Antrenman kararı için toparlanma verisi yok: uyku, nabız ya da enerji kaydı girince hesaplanır.</p>' : '') + '</section>' +
      (bugun.length ? '<details class="kaynak" open><summary>Bugünün kayıtları (' + bugun.length + ')</summary><ul class="kartliste">' + bugun.map(function (r) {
        return '<li><span>' + k(kayitMetni(Kayit, r)) + '</span><span class="soluk">' + (r.zaman ? new Date(r.zaman).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '') + '</span>' +
          '<button type="button" class="dugme dugme--sade" data-arac-ac="kayit-sil" data-id="' + k(r.id) + '" aria-label="Kaydı sil: ' + k(kayitMetni(Kayit, r)) + '">Sil</button></li>';
      }).join('') + '</ul></details>' : '') +
      '<p class="soluk">' + l.length + ' kayıt · bu cihazda durur</p></div>';
  }
  function kayitGonder(form) {
    var veri = {}, simdi = Date.now();
    [].forEach.call(form.elements, function (e) { if (e.name && e.name !== 'tahmin') veri[e.name] = e.value; });
    var tahmin = !!(form.elements.tahmin && form.elements.tahmin.checked);
    var r = kayitEkle(Kayit, oku(KAYIT_ANAHTAR, []), kayitTur, veri, tahmin, gunAdi(simdi), simdi);
    if (r.ok) { yaz(KAYIT_ANAHTAR, r.kayitlar); kayitIleti = { tamam: 'Kaydedildi: ' + kayitMetni(Kayit, r.kayit) }; }
    else kayitIleti = { hatalar: r.hatalar, form: veri, tahmin: tahmin }; // yazılan kaybolmasın
    ic().rota();
    var ileti = d.querySelector('.kayitform .notform__ileti'); if (ileti) ileti.focus();
  }

  /* ---- Plan ---- */
  var PLAN_ANAHTAR = 'lifeos.plan.durum', Plan = L.Motor && L.Motor.Plan, planIleti = null;
  var DERS_DK = 20; // shortcut: içerik şemasında ders süresi yok, 20 dk varsayım; şemaya süre gelince oradan okunur
  var SINIF_AD = { temel: 'temel', sureli: 'süreli', vadeli: 'tekrar', sentez: 'sentez', yeni: 'yeni' };
  function planDurum(simdi) {
    var v = oku(PLAN_ANAHTAR, {}), dr = v && v.ayar && Array.isArray(v.ayar.musait) && Array.isArray(v.isler) ? v : planBos();
    var y = planGunDevri(Plan, dr, gunAdi(simdi));
    if (y !== dr) yaz(PLAN_ANAHTAR, y);
    return y;
  }
  function planEk(simdi) { // motorun girdileri: etkin alanın sıradaki dersi ve Tekrar'ın günlük planı
    var I = ic(), dersler = [];
    I.tasinanlar().filter(function (a) { return a.id === I.etkin(); }).forEach(function (a) { // yalnız üzerinde çalışılan alan: plan neyin yüklü olduğuna göre değişmesin
      var dr = I.fDurum(a.id), adim = dr && Kabuk.siradaki(dr);
      if (adim && adim.tur === 'ders') dersler.push({ id: adim.id, ad: a.ad + ': ' + adim.ad, dk: DERS_DK, alan: a.id });
    });
    return { dersler: dersler, tekrar: Tekrar ? kuyruk(Tekrar, kartlar(), simdi, sayac(simdi)).plan : null };
  }
  function blokSatiri(b) {
    var k = ic().kac, eylem = '';
    if (b.tur !== 'mola' && b.tur !== 'sabit') {
      eylem = b.durum === 'bekliyor'
        ? '<button type="button" class="dugme dugme--sade" data-arac-ac="plan-durum" data-id="' + k(b.id) + '" data-durum="yapildi">Yapıldı</button>' +
          '<button type="button" class="dugme dugme--sade" data-arac-ac="plan-durum" data-id="' + k(b.id) + '" data-durum="atlandi">Atla</button>'
        : '<span class="pul' + (b.durum === 'yapildi' ? ' pul--pilot' : '') + '">' + (b.durum === 'yapildi' ? 'yapıldı' : b.durum === 'atlandi' ? 'atlandı' : 'kısmen') + '</span>' +
          '<button type="button" class="dugme dugme--sade" data-arac-ac="plan-durum" data-id="' + k(b.id) + '" data-durum="bekliyor">Geri al</button>';
    }
    return '<li class="blok blok--' + b.tur + (b.durum !== 'bekliyor' ? ' blok--bitti' : '') + '"><span class="blok__saat">' + k(b.bas) + '–' + k(b.bit) + '</span><span class="blok__ad">' + k(b.ad) +
      (b.neden ? ' <span class="soluk">(' + k(b.neden) + ')</span>' : '') + '</span><span class="soluk">' + b.dk + ' dk' +
      (b.dkEtiket === 'estimated' ? ' · tahmin' : '') + (b.sinif ? ' · ' + SINIF_AD[b.sinif] : '') + (b.devir ? ' · ' + b.devir + '. gün' : '') + '</span><span class="blok__eylem">' + eylem + '</span></li>';
  }
  function sayfaPlan(yer) {
    var I = ic(), k = I.kac;
    if (!Plan) return I.ust(I.kirinti(yer)) + '<div class="govde"><h1>Plan</h1>' + eksik('Plan') + '</div>';
    var simdi = Date.now(), gun = gunAdi(simdi), dr = planDurum(simdi), p = dr.gunPlan && dr.gunPlan.plan, il = planIleti; planIleti = null;
    var E = { computed: 'hesaplandı', estimated: 'tahmin', missing: 'veri yok' };
    var planHtml = !dr.ayar.musait.length ? '<p class="soluk">Önce aşağıya bugün çalışabileceğin saat aralığını yaz; plan o boşluğa kurulur.</p>'
      : !p ? '<p class="soluk">Bugün için plan kurulmadı.</p>'
      : (p.bloklar.length ? '<ol class="bloklar">' + p.bloklar.map(blokSatiri).join('') + '</ol>' : '<p class="soluk">Plana girecek iş yok: iş ekle ya da bir alanda derse başla.</p>') +
        '<p class="soluk">Planlanan ' + (p.ozet.planlananDk.v || 0) + ' dk (' + E[p.ozet.planlananDk.k] + ') · boş kalan ' + p.ozet.bosDk.v + ' dk (' + E[p.ozet.bosDk.k] + ')' +
        (p.ozet.molaSayisi ? ' · ' + p.ozet.molaSayisi + ' mola' : '') + '</p>' +
        (p.sigmayan.length ? '<div class="yuva" role="note"><b>Sığmayanlar (' + p.sigmayan.length + ')</b>' + p.sigmayan.map(function (x) {
          return '<span>' + k(x.ad) + ' · ' + x.dk + ' dk · ' + k(x.neden) + '</span>';
        }).join('') + '</div>' : '');
    return I.ust(I.kirinti(yer)) + '<div class="govde" data-arac="plan"><h1>Plan</h1>' +
      '<div class="notform__ileti" role="alert" tabindex="-1">' + (il ? il.map(k).join('<br>') : '') + '</div>' +
      '<section><h2>Bugünün planı</h2>' + planHtml +
      (dr.ayar.musait.length ? '<div class="eylemler"><button type="button" class="dugme dugme--ana" data-arac-ac="plan-kur">' + (p ? 'Yeniden kur' : 'Planı kur') + '</button></div>' : '') + '</section>' +
      '<section><h2>Boş zamanım</h2>' + (dr.ayar.musait.length ? '<ul class="kartliste">' + dr.ayar.musait.map(function (m, i) {
        return '<li><span>' + k(m.bas) + '–' + k(m.bit) + '</span><button type="button" class="dugme dugme--sade" data-arac-ac="plan-aralik-sil" data-i="' + i + '" aria-label="Aralığı sil: ' + k(m.bas) + '–' + k(m.bit) + '">Sil</button></li>';
      }).join('') + '</ul>' : '') +
      '<form class="planform" data-plan="aralik" novalidate><div class="ikili"><label class="alanet">Başlangıç<input type="time" class="giris" name="bas"></label>' +
      '<label class="alanet">Bitiş<input type="time" class="giris" name="bit"></label></div><div class="eylemler"><button type="submit" class="dugme">Aralık ekle</button></div></form></section>' +
      '<section><h2>İşler</h2>' + (dr.isler.length ? '<ul class="kartliste">' + dr.isler.map(function (x) {
        return '<li><span>' + k(x.ad) + '</span><span class="soluk">' + x.dk + ' dk' + (x.son ? ' · son ' + k(x.son) : '') + (x.devir ? ' · ' + x.devir + ' kez devretti' : '') + '</span>' +
          '<button type="button" class="dugme dugme--sade" data-arac-ac="plan-is-sil" data-id="' + k(x.id) + '" aria-label="İşi sil: ' + k(x.ad) + '">Sil</button></li>';
      }).join('') + '</ul>' : '<p class="soluk">İş yok. Dersler ve tekrar kartları plana kendiliğinden girer.</p>') +
      '<form class="planform" data-plan="is" novalidate><label class="alanet">İş<input type="text" class="giris" name="ad" maxlength="120" autocomplete="off"></label>' +
      '<div class="ikili"><label class="alanet">Süre (dk)<input type="text" inputmode="numeric" class="giris" name="dk" autocomplete="off"></label>' +
      '<label class="alanet">Son tarih · isteğe bağlı<input type="date" class="giris" name="son"></label></div>' +
      '<div class="eylemler"><button type="submit" class="dugme">İş ekle</button></div></form></section></div>';
  }
  function planYaz(dr, ileti) { yaz(PLAN_ANAHTAR, dr); planIleti = ileti || null; ic().rota(); if (ileti) { var el = d.querySelector('[data-arac="plan"] .notform__ileti'); if (el) el.focus(); } }
  function planHata(hatalar) { planIleti = hatalar; ic().rota(); var el = d.querySelector('[data-arac="plan"] .notform__ileti'); if (el) el.focus(); }
  function planFormu(form) {
    var simdi = Date.now(), dr = planDurum(simdi), ne = form.getAttribute('data-plan'), e = form.elements, veri;
    if (ne === 'is') {
      if (!e.ad.value.trim()) return planHata(['İşin adı yazılmalı.']);
      veri = { id: kimlik('i', simdi, Math.random()), ad: e.ad.value.trim(), dk: Number(e.dk.value.trim()) };
      if (e.son.value) veri.son = e.son.value;
    } else veri = { bas: e.bas.value, bit: e.bit.value };
    var r = planEkle(Plan, dr, ne, veri, gunAdi(simdi));
    return r.ok ? planYaz(r.durum) : planHata(r.hatalar);
  }
  // Bugün sayfasının alt satırı: plan varsa sıradaki blok, yoksa plana davet
  Kabuk.bugunEk = function () {
    if (!Plan) return '';
    var k = ic().kac, simdi = Date.now(), dr = planDurum(simdi), p = dr.gunPlan && dr.gunPlan.plan;
    var sira = p && p.bloklar.filter(function (b) { return b.durum === 'bekliyor' && b.tur !== 'mola' && b.tur !== 'sabit'; });
    if (!p) return '<a class="karsila__plan" href="#/motor/plan">Günü planla</a>';
    return '<a class="karsila__plan" href="#/motor/plan">' + (sira.length ? 'Planda sırada: ' + k(sira[0].bas) + ' ' + k(sira[0].ad) + (sira.length > 1 ? ' · ' + (sira.length - 1) + ' blok daha' : '') : 'Bugünün planı bitti') + '</a>';
  };

  /* ---- Soru: karma test ---- */
  var SORU_ANAHTAR = 'lifeos.soru.oturum', SORU_GECMIS = 'lifeos.soru.gecmis', Soru = L.Motor && L.Motor.Soru;
  var soruGoster = -1; // cevabı az önce verilen sorunun sırası: sonucu ekranda kalır, «Sonraki» ile geçilir
  function soruBaglam() { // etkin alanın içeriği ve havuzu; içerik yüklenmediyse null
    var I = ic(), id = I.etkin(), f = I.al(id);
    if (!f || !f.y) return null;
    var h = soruHavuzu(I.Yol, f.y, I.kayitOku(id));
    return { alan: I.tasinanlar().filter(function (a) { return a.id === id; })[0], havuz: h.havuz, sozluk: h.sozluk };
  }
  function sayfaSoru(yer) {
    var I = ic(), k = I.kac;
    if (!Soru) return I.ust(I.kirinti(yer)) + '<div class="govde"><h1>Soru</h1>' + eksik('Soru') + '</div>';
    var b = soruBaglam(), bas = I.ust(I.kirinti(yer)) + '<div class="govde" data-arac="soru"><h1>Soru</h1>';
    if (!b) {
      if (!I.al(I.etkin())) I.alanYukle(I.etkin()).then(function () { if (d.querySelector('[data-arac="soru"]')) I.rota(); });
      return bas + (I.al(I.etkin()) ? '<div class="yuva" role="note"><b>Sorular bu açılışta yüklenemedi.</b><span>Sayfa dosyadan açıldıysa LifeOS sunucusundan aç.</span></div>'
        : '<p class="soluk" aria-busy="true">Yükleniyor…</p>') + '</div>';
    }
    var kayit = oku(SORU_ANAHTAR, {}), o = kayit.oturum && kayit.alan === b.alan.id ? kayit.oturum : null, gecmis = oku(SORU_GECMIS, []);
    if (!o) {
      var son = gecmis.slice(-5).reverse();
      return bas + '<p class="soluk">' + k(b.alan.ad) + ' alanının açık ünitelerinden karma test. Havuzda ' + b.havuz.length + ' soru var. Alanı değiştirmek için o alanın sayfasını aç.</p>' +
        (b.havuz.length < Soru.EN_AZ ? '<div class="yuva" role="note"><b>Test için en az ' + Soru.EN_AZ + ' soru gerekir.</b></div>'
          : '<div class="eylemler">' + Soru.BOYLAR.filter(function (n, i) { return !i || b.havuz.length > Soru.BOYLAR[i - 1]; }).map(function (n, i) { // havuz küçükse aynı boyda iki düğme çıkmasın
            return '<button type="button" class="dugme' + (i ? '' : ' dugme--ana') + '" data-arac-ac="soru-basla" data-boy="' + n + '">' + Math.min(n, b.havuz.length) + ' soruluk test</button>';
          }).join('') + '</div>') +
        '<div class="eylemler"><a class="dugme" href="#/motor/soru/deneme">Süreli deneme' + (oku('lifeos.soru.deneme', {}).oturum ? ' · sürüyor' : '') + '</a></div>' +
        (son.length ? '<section><h2>Son testler</h2><ul class="ozet">' + son.map(function (g) {
          var r = g.sayilar;
          return '<li><span>' + k(g.alanAd) + ' · ' + tarih(g.bitti) + '</span><b>' + r.dogru + ' doğru · ' + r.yanlis + ' yanlış · ' + (r.bos + r.bakildi) + ' boş</b><span class="pul">ölçüldü</span></li>';
        }).join('') + '</ul></section>' : '') + '</div>';
    }
    var sira = soruGoster >= 0 ? soruGoster : soruSirasi(o);
    if (sira < 0) sira = o.sorular.length - 1;
    var q = b.sozluk[o.sorular[sira]], cv = o.cevaplar[sira], bitti = soruSirasi(o) < 0;
    if (!q) return bas + '<div class="yuva" role="note"><b>Bu testin sorusu artık içerikte yok.</b></div><div class="eylemler"><button type="button" class="dugme dugme--ana" data-arac-ac="soru-birak">Testi kapat</button></div></div>';
    return bas + '<p class="soluk">' + k(b.alan.ad) + ' · soru ' + (sira + 1) + ' / ' + o.sorular.length + ' · ' + k(q.konu) + '</p>' +
      '<fieldset class="soru" data-sira="' + sira + '"><legend>' + k(q.soru) + '</legend><div class="secenekler">' + q.sec.map(function (m, i) {
        var h = HARF[i], cls = !cv ? '' : h === q.dogru ? ' secenek--dogru' : h === cv.h ? ' secenek--yanlis' : '';
        return '<button type="button" class="secenek' + cls + '" data-arac-ac="soru-cevap" data-h="' + h + '"' + (cv ? ' disabled' : '') + ' aria-pressed="' + (!!cv && cv.h === h) + '"><b>' + h + '</b><span>' + k(m) + '</span>' +
          (cls ? '<span class="secenek__im">' + (h === q.dogru ? '✓ doğru' : '✕ senin cevabın') + '</span>' : '') + '</button>';
      }).join('') + '</div><div class="soru__sonuc" tabindex="-1" role="status">' +
      (cv ? '<b>' + (cv.bak ? 'Çözüme baktın; bu soru doğru sayılmaz.' : cv.h === q.dogru ? 'Doğru.' : 'Yanlış.') + '</b>' + (q.cozum ? ' ' + q.cozum.map(k).join(' ') : '') : '') + '</div></fieldset>' +
      '<div class="eylemler">' + (cv ? '<button type="button" class="dugme dugme--ana" data-arac-ac="' + (bitti ? 'soru-bitir' : 'soru-sonraki') + '">' + (bitti ? 'Sonucu gör' : 'Sonraki') + '</button>'
        : '<button type="button" class="dugme dugme--sade" data-arac-ac="soru-bak">Çözüme bak</button>') +
      '<button type="button" class="dugme dugme--sade" data-arac-ac="soru-bitir">Testi bitir</button></div></div>';
  }
  var soruSonuc = null; // biten testin özeti, yalnız hemen ardından gösterilir
  function sayfaSoruSonuc(yer) {
    var I = ic(), k = I.kac, g = soruSonuc, r = g.sayilar;
    return I.ust(I.kirinti(yer)) + '<div class="govde" data-arac="soru"><h1>Test bitti</h1>' +
      '<div class="kapisonuc" tabindex="-1" role="status"><b>' + r.dogru + ' / ' + r.toplam + ' doğru.</b> ' + r.yanlis + ' yanlış, ' + r.bos + ' boş, ' + r.bakildi + ' çözüme bakıldı. <span class="soluk">ölçüldü</span></div>' +
      (g.konular.length ? '<section><h2>Derslere göre</h2><ul class="ozet">' + g.konular.map(function (x) {
        return '<li><span>' + k(x.konu) + '</span><b>' + x.dogru + ' / ' + x.n + '</b><span class="pul">ölçüldü</span></li>';
      }).join('') + '</ul></section>' : '') +
      '<div class="eylemler"><button type="button" class="dugme dugme--ana" data-arac-ac="soru-yeni">Yeni test</button><a class="dugme dugme--sade" href="' + k(g.alanYol) + '">' + k(g.alanAd) + ' sayfası</a></div></div>';
  }
  function soruEylem(ne, b) {
    var I = ic(), bg = soruBaglam(), simdi = Date.now();
    if (ne === 'soru-yeni') return I.rota(); // sonuç sayfası aynı adreste: bağlantı değil, yeniden çizim
    if (!bg) return;
    var kayit = oku(SORU_ANAHTAR, {}), o = kayit.oturum;
    if (ne === 'soru-basla') {
      var r = Soru.alistirmaKur(bg.havuz, +b.getAttribute('data-boy'), simdi, Math.random);
      if (r.ok) { yaz(SORU_ANAHTAR, { alan: bg.alan.id, oturum: r.oturum }); soruGoster = -1; }
      return I.rota();
    }
    if (!o) return I.rota();
    var sira = +(d.querySelector('.soru[data-sira]') || { getAttribute: function () { return -1; } }).getAttribute('data-sira');
    if (ne === 'soru-cevap' || ne === 'soru-bak') {
      var c = ne === 'soru-bak' ? Soru.bak(o, sira, simdi) : Soru.cevapla(o, sira, b.getAttribute('data-h'), bg.sozluk, simdi);
      if (c.ok) { yaz(SORU_ANAHTAR, { alan: kayit.alan, oturum: c.oturum }); soruGoster = sira; }
      I.rota();
      var s = d.querySelector('.soru__sonuc'); if (s) s.focus({ preventScroll: true });
      return;
    }
    if (ne === 'soru-sonraki') { soruGoster = -1; return I.rota(); }
    if (ne === 'soru-birak') { yaz(SORU_ANAHTAR, {}); soruGoster = -1; return I.rota(); }
    if (ne === 'soru-bitir') {
      var bit = Soru.oturumBitir(o, bg.sozluk, simdi);
      soruSonuc = { bitti: simdi, alan: bg.alan.id, alanAd: bg.alan.ad, alanYol: bg.alan.yol, sayilar: bit.ozet.sayilar, konular: bit.ozet.konular };
      yaz(SORU_GECMIS, oku(SORU_GECMIS, []).concat([{ bitti: simdi, alan: bg.alan.id, alanAd: bg.alan.ad, sayilar: bit.ozet.sayilar, sonuc: bit.sonuc }]).slice(-50));
      yaz(SORU_ANAHTAR, {}); soruGoster = -1;
      I.rota();
      var ks = d.querySelector('.kapisonuc'); if (ks) ks.focus({ preventScroll: true });
    }
  }

  Kabuk.ek = Kabuk.ek || {};
  Kabuk.ek.soru = function (yer) { if (soruSonuc) { var h = sayfaSoruSonuc(yer); soruSonuc = null; return h; } return sayfaSoru(yer); };
  Kabuk.ek.plan = sayfaPlan;
  Kabuk.ek.kayit = sayfaKayit;
  Kabuk.ek.not = sayfaNot; Kabuk.ek.tekrar = sayfaTekrar; Kabuk.ek.yol = sayfaYol;

  /* ---- olaylar (yalnız bu dosyanın çizdiği öğeler) ---- */
  d.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.matches('form.notform')) { e.preventDefault(); notFormKaydet(f); }
    else if (f.matches('form.kartform')) { e.preventDefault(); kartEkle(f); }
    else if (f.matches('form.kayitform')) { e.preventDefault(); kayitGonder(f); }
    else if (f.matches('form.planform')) { e.preventDefault(); planFormu(f); }
  });
  d.addEventListener('input', function (e) {
    if (e.target.matches('[data-not-ara]')) d.getElementById('not-liste').innerHTML = notListesi(oku(NOT_ANAHTAR, []), e.target.value);
  });
  d.addEventListener('change', function (e) {
    var s = e.target;
    if (s.matches('select[data-kayit-tur]')) { kayitTur = s.value; ic().rota(); var ys = d.querySelector('select[data-kayit-tur]'); if (ys) ys.focus(); return; }
    if (!s.matches('select[data-bag-ekle]') || !s.value) return;
    var n = oku(NOT_ANAHTAR, []).filter(function (x) { return x.id === s.value; })[0], t = s.form.elements.govde;
    if (n) { var bag = Not.bagYaz(n.id, Not.ad(n)), i = t.selectionStart == null ? t.value.length : t.selectionStart; t.value = t.value.slice(0, i) + bag + t.value.slice(t.selectionEnd == null ? i : t.selectionEnd); }
    s.value = ''; t.focus();
  });
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-arac-ac]');
    if (!b) return;
    var ne = b.getAttribute('data-arac-ac'), I = ic();
    if (ne === 'not-sil') {
      if (!confirm('Bu not silinsin mi? Geri alınamaz.')) return;
      yaz(NOT_ANAHTAR, oku(NOT_ANAHTAR, []).filter(function (n) { return n.id !== b.getAttribute('data-id'); }));
      return I.git('#/motor/not');
    }
    if (ne.indexOf('soru-') === 0) return soruEylem(ne, b);
    if (ne.indexOf('plan-') === 0) {
      var simdiP = Date.now(), dr = planDurum(simdiP), gunP = gunAdi(simdiP);
      if (ne === 'plan-kur') {
        var r = planKur(Plan, dr, gunP, planEk(simdiP));
        return r.ok ? planYaz({ ayar: dr.ayar, isler: dr.isler, gunPlan: { gun: gunP, plan: r.plan } }) : planHata(r.hatalar);
      }
      if (ne === 'plan-durum') {
        var hedef = b.getAttribute('data-durum'), veriD = { durum: hedef };
        if (hedef === 'atlandi') { veriD.neden = prompt('Neden atlıyorsun? (kısa bir not)'); if (veriD.neden == null) return; }
        var rd = Plan.durumYaz(dr.gunPlan.plan, b.getAttribute('data-id'), veriD);
        return rd.ok ? planYaz({ ayar: dr.ayar, isler: dr.isler, gunPlan: { gun: dr.gunPlan.gun, plan: rd.plan } }) : planHata([rd.neden]);
      }
      if (ne === 'plan-aralik-sil') return planYaz({ ayar: Object.assign({}, dr.ayar, { musait: dr.ayar.musait.filter(function (_, i) { return i !== +b.getAttribute('data-i'); }) }), isler: dr.isler, gunPlan: dr.gunPlan });
      if (ne === 'plan-is-sil') return planYaz({ ayar: dr.ayar, gunPlan: dr.gunPlan, isler: dr.isler.filter(function (x) { return x.id !== b.getAttribute('data-id'); }) });
    }
    if (ne === 'kayit-sil') {
      if (!confirm('Bu kayıt silinsin mi?')) return;
      yaz(KAYIT_ANAHTAR, oku(KAYIT_ANAHTAR, []).filter(function (r) { return r.id !== b.getAttribute('data-id'); }));
      return I.rota();
    }
    if (ne === 'kart-goster') { gosterilen = b.closest('[data-kart]').getAttribute('data-kart'); I.rota(); var a = d.querySelector('.kart__arka'); if (a) a.focus({ preventScroll: true }); return; }
    if (ne === 'kart-not') {
      var simdi = Date.now(), r = kartCevapla(Tekrar, oku(KART_ANAHTAR, []), b.closest('[data-kart]').getAttribute('data-kart'), +b.getAttribute('data-not'), simdi, sayac(simdi));
      if (r.ok) { yaz(KART_ANAHTAR, r.kartlar); yaz(SAYAC_ANAHTAR, r.sayac); }
      gosterilen = null; return I.rota();
    }
    if (ne === 'kart-sil') {
      if (!confirm('Bu kart silinsin mi? Tekrar geçmişi de gider.')) return;
      yaz(KART_ANAHTAR, oku(KART_ANAHTAR, []).filter(function (x) { return x.id !== b.getAttribute('data-id'); }));
      return I.rota();
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
