/* LIFEOS.Kabuk araç ekranları — Not, Tekrar ve Yol haritası listesi (sadeleşme Faz 2/3).
 * Kural motorlardadır (motor/not.js, motor/tekrar.js, motor/yol.js); burası çizer ve kaydeder.
 * Sayfalar Kabuk.ek[yerId](yer, alt) ile kaydolur; kabuk.js rota() onları çağırır. Bu dosya kabuk.js'ten ÖNCE yüklenir.
 * shortcut: kayıtlar bu tarayıcının deposunda durur (lifeos.not.kayit, lifeos.tekrar.kartlar, lifeos.kayit.kayitlar), cihazlar arası eşitlenmez; tek depoya (sistem/veri.py) P6 göçünden sonra bağlanır.
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
  // Bir kaydın tek satırlık okunuşu: «Su · 500 ml (ölçüldü)»
  function kayitMetni(Kayit, r) {
    var t = Kayit.TURLER[r.tur], p = [];
    Object.keys(r.deger || {}).forEach(function (a) { var f = t.sayilar[a]; p.push(sayiYaz(r.deger[a].v) + (f.birim && f.birim !== '1-5' ? ' ' + f.birim : '') + ' (' + Kayit.ETIKET[r.deger[a].k] + ')'); });
    Object.keys(r.ek || {}).forEach(function (a) { p.push(r.ek[a]); });
    return t.ad + ' · ' + p.join(' · ');
  }

  var Arac = { kimlik: kimlik, kayitEkle: kayitEkle, gunOzeti: gunOzeti, kayitMetni: kayitMetni, notSira: notSira, notKaydet: notKaydet, kartlariEsitle: kartlariEsitle, gunSonu: gunSonu, gunAdi: gunAdi,
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
    // yüklenmiş her alanın onaylı ders alıştırmaları kendiliğinden kart olur (taslak içerik aday çıkarmaz)
    I.tasinanlar().forEach(function (yer) {
      var f = I.al(yer.id);
      if (f && f.y) l = kartlariEsitle(Tekrar, l, I.Yol.tekrarAdaylari(f.y, I.kayitOku(yer.id)), f.y);
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
          (il ? k(dr.asama.ad) + ' · ' + il.okunanDers.deger + '/' + il.okunanDers.toplam + ' ders okundu · ' + il.gecilenUnite.deger + '/' + il.gecilenUnite.toplam + ' kapı geçildi' : 'Aşama 1') +
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

  Kabuk.ek = Kabuk.ek || {};
  Kabuk.ek.kayit = sayfaKayit;
  Kabuk.ek.not = sayfaNot; Kabuk.ek.tekrar = sayfaTekrar; Kabuk.ek.yol = sayfaYol;

  /* ---- olaylar (yalnız bu dosyanın çizdiği öğeler) ---- */
  d.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.matches('form.notform')) { e.preventDefault(); notFormKaydet(f); }
    else if (f.matches('form.kartform')) { e.preventDefault(); kartEkle(f); }
    else if (f.matches('form.kayitform')) { e.preventDefault(); kayitGonder(f); }
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
