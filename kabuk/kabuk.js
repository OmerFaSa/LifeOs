/* LIFEOS.Kabuk — tam ekran çerçeve, gezinme (basılı tut halkası + komut çubuğu), sayfalar.
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
      { tur: 'eylem', id: 'yeni-not', ad: 'Yeni not', etiket: 'eylem', yol: '#/motor/not', ek: 'not yaz defter' }
    ];
    return yerler.concat(ayarlar, eylemler);
  }

  var Kabuk = kok.LIFEOS && kok.LIFEOS.Kabuk || {};
  Kabuk.katla = katla; Kabuk.puan = puan; Kabuk.ara = ara; Kabuk.komutOgeleri = komutOgeleri;
  kok.LIFEOS = kok.LIFEOS || {}; kok.LIFEOS.Kabuk = Kabuk;
  if (typeof module !== 'undefined' && module.exports) module.exports = Kabuk;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var H = Kabuk.Harita, A = Kabuk.Ayar, d = document, kokEl = d.documentElement;
  var bellek = {};
  var depo = (function () {
    try { var t = '__k'; localStorage.setItem(t, t); localStorage.removeItem(t); return localStorage; } catch (e) {
      return { getItem: function (k) { return k in bellek ? bellek[k] : null; }, setItem: function (k, v) { bellek[k] = String(v); }, removeItem: function (k) { delete bellek[k]; } };
    }
  })();
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
  function selam(t) { var s = t.getHours(); return s < 5 ? 'İyi geceler.' : s < 12 ? 'Günaydın.' : s < 18 ? 'İyi günler.' : 'İyi akşamlar.'; }
  var DURUM_AD = { eski: 'eski sayfada', pilot: 'taşınıyor', plan: 'hazırlanıyor', yeni: '' };

  /* ---- Felsefe: Yol motoru salt okunur yüklenir; içerik dosyası file:// üzerinden okunamazsa yuva boş kalır ---- */
  var felsefe = null; // { asama, uniteler } ya da { hata }
  function felsefeYukle() {
    if (felsefe) return Promise.resolve(felsefe);
    var Yol = kok.LIFEOS.Motor && kok.LIFEOS.Motor.Yol;
    if (!Yol) return Promise.resolve(felsefe = { hata: 'motor' });
    if (location.protocol === 'file:') return Promise.resolve(felsefe = { hata: 'icerik' }); // tarayıcı file:// fetch'ini engeller
    return fetch('../alan/felsefe/asama-1.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (v) { var y = Yol.yukle(v); return (felsefe = Yol.durum(y, Yol.bosKayit())); })
      .catch(function () { return (felsefe = { hata: 'icerik' }); });
  }

  /* ---------------- sayfalar ---------------- */
  function ust(sol) {
    return '<header class="ust"><div class="ust__sol">' + sol + '</div><div class="ust__sag">' +
      '<button type="button" class="dugme dugme--sade" data-ac="komut" aria-keyshortcuts="Control+K /"><span>Ara</span><kbd>Ctrl K</kbd></button>' +
      '<button type="button" class="dugme dugme--sade" data-ac="halka" aria-keyshortcuts="Control+.">Yerler</button></div></header>';
  }
  function kirinti(yer) {
    var ustYer = H.bul(H.DAL_SAYFASI[yer.dal]);
    if (!ustYer || ustYer.id === yer.id) ustYer = H.bul('bugun');
    return '<a class="kirinti" href="' + ustYer.yol + '"><span aria-hidden="true">‹ </span>' + kac(ustYer.ad) + '</a><span class="kirinti__ayrac" aria-hidden="true">/</span><span>' + kac(yer.ad) + '</span>';
  }
  function satir(y) {
    var dur = DURUM_AD[y.durum];
    return '<a class="satir" href="' + y.yol + '"><span class="satir__ad">' + kac(y.ad) + '</span><span class="satir__not">' + kac(y.aciklama) +
      '</span>' + (dur ? '<span class="pul pul--' + y.durum + '">' + dur + '</span>' : '') + '<span class="satir__ok" aria-hidden="true">›</span></a>';
  }

  function sayfaBugun() {
    var t = new Date(), ipucu = depo.getItem('lifeos.kabuk.ipucu') !== 'goruldu';
    var f = felsefe && !felsefe.hata ? felsefe : null;
    return ust('<span class="ust__tarih">' + tarih(t) + '</span>') +
      '<div class="karsila"><h1 class="karsila__selam">' + selam(t) + '</h1>' +
      '<p class="karsila__sira"><span class="soluk">Sırada</span><br>Felsefe · ' + (f ? kac(f.asama.ad) : 'ilk aşama') + '</p>' +
      '<a class="dugme dugme--ana" href="#/alan/felsefe">Başla</a>' +
      '<p class="karsila__sonra soluk">Günün geri kalanı plan aracı gelince burada görünür.</p>' +
      (ipucu ? '<div class="ipucu" role="note"><span>Bir yere gitmek için boş bir yerde basılı tut ya da <kbd>Ctrl K</kbd> ile ara.</span>' +
        '<button type="button" class="dugme dugme--sade" data-ac="ipucu">Anladım</button></div>' : '') + '</div>';
  }
  function sayfaDal(yer) {
    return ust(kirinti(yer)) + '<div class="govde"><h1>' + kac(yer.ad) + '</h1><p class="soluk">' + kac(yer.aciklama) + '</p>' +
      '<nav class="liste" aria-label="' + kac(yer.ad) + '">' + H.dalinYerleri(yer.dal).map(satir).join('') + '</nav></div>';
  }
  function sayfaHarita(yer) {
    var dallar = H.DALLAR.map(function (dl) {
      var ys = H.YERLER.filter(function (y) { return y.dal === dl.id; });
      return '<section class="dal" aria-labelledby="dal-' + dl.id + '"><h2 id="dal-' + dl.id + '">' + kac(dl.ad) + '<span class="soluk"> · ' + ys.length + '</span></h2>' +
        '<ul class="dal__yerler">' + ys.map(function (y) {
          var dur = DURUM_AD[y.durum];
          return '<li><a href="' + y.yol + '" class="yer yer--' + y.katman + '"><span>' + kac(y.ad) + '</span>' + (y.halka ? '<span class="yer__halka" title="Halkada">halkada</span>' : '') +
            (dur ? '<span class="pul pul--' + y.durum + '">' + dur + '</span>' : '') + '</a></li>';
        }).join('') + '</ul></section>';
    }).join('');
    return ust(kirinti(yer)) + '<div class="govde govde--genis"><h1>Sistem haritası</h1><p class="soluk">' + H.YERLER.length +
      ' yer; her biri halkadan ya da aramadan en çok iki adımda.</p><div class="harita">' + dallar + '</div></div>';
  }
  function sayfaAyarlar(yer, odak) {
    var gruplar = A.GRUPLAR.map(function (g) {
      return '<section class="ayargrup" id="grup-' + g.id + '" aria-labelledby="baslik-' + g.id + '"><h2 id="baslik-' + g.id + '">' + kac(g.ad) + '</h2>' +
        A.SEMA.filter(function (t) { return t.grup === g.id; }).map(function (t) { return A.ciz(t, A.oku(depo, t.anahtar)); }).join('') + '</section>';
    }).join('');
    var nav = '<nav class="ayarnav" aria-label="Ayar grupları">' + A.GRUPLAR.map(function (g) { return '<a href="#/ayarlar?grup-' + g.id + '">' + kac(g.ad) + '</a>'; }).join('') + '</nav>';
    setTimeout(function () {
      if (!odak) return;
      var el = d.getElementById(odak) || $('[data-ayar-satir="' + odak + '"]');
      if (el) { el.scrollIntoView({ block: 'center' }); var f = $('[aria-checked="true"], input', el) || el; f.focus(); el.classList.add('ayar--isik'); }
    }, 0);
    return ust(kirinti(yer)) + '<div class="govde govde--genis"><h1>Ayarlar</h1><div class="ayarlar">' + nav + '<div class="ayarlar__govde">' + gruplar +
      '<div class="ayarlar__son"><button type="button" class="dugme dugme--sade" data-ac="sifirla">Hepsini varsayılana döndür</button></div></div></div></div>';
  }
  function sayfaFelsefe(yer) {
    var f = felsefe, ic;
    if (!f) ic = '<p class="soluk" aria-busy="true">Yükleniyor…</p>';
    else if (f.hata) ic = '<div class="yuva" role="note"><b>Yol haritası bu açılışta gösterilemiyor.</b><span>' +
      (f.hata === 'motor' ? 'Yol aracı yüklenemedi.' : 'Sayfa dosyadan açıldı; içerik LifeOS sunucusuyla açılınca yüklenir.') + '</span></div>';
    else ic = '<p class="asama"><span class="soluk">Aşama ' + 1 + '</span><br>' + kac(f.asama.ad) + '</p><ol class="uniteler">' + f.uniteler.map(function (u) {
      return '<li class="unite' + (u.acik ? '' : ' unite--kapali') + '"><span>' + kac(u.ad) + '</span><span class="soluk">' + u.dersler.length + ' ders' + (u.acik ? '' : ' · kilitli') + '</span></li>';
    }).join('') + '</ol>';
    return ust(kirinti(yer)) + '<div class="govde"><h1>Felsefe</h1>' + ic +
      '<div class="eylemler"><button type="button" class="dugme dugme--ana" aria-disabled="true" aria-describedby="ders-not">Başla</button>' +
      '<a class="dugme dugme--sade" href="' + yer.eski + '">Eski Felsefe sayfası</a></div><p id="ders-not" class="soluk">Ders ekranı sonraki adımda bağlanır.</p></div>';
  }
  function sayfaYer(yer) {
    var metin = yer.durum === 'eski' ? 'Bu alan henüz yeni sisteme taşınmadı. Şimdilik eski sayfasında çalışıyor.'
      : yer.durum === 'plan' ? 'Bu bölüm hazırlanıyor.' : 'Bu bölümün sayfası sonraki adımda bağlanır.';
    return ust(kirinti(yer)) + '<div class="govde"><h1>' + kac(yer.ad) + '</h1><p class="soluk">' + kac(yer.aciklama) + '</p><p>' + metin + '</p>' +
      (yer.eski ? '<div class="eylemler"><a class="dugme dugme--ana" href="' + yer.eski + '">Eski sayfada aç</a></div>' : '') + '</div>';
  }

  var sayfaEl;
  function rota() {
    var h = location.hash || '#/bugun', parca = h.split('?'), yer = H.YERLER.filter(function (y) { return y.yol === parca[0]; })[0] || H.bul('bugun');
    var html;
    if (yer.id === 'bugun') html = sayfaBugun();
    else if (yer.id === 'harita') html = sayfaHarita(yer);
    else if (yer.id === 'ayarlar') html = sayfaAyarlar(yer, parca[1] && decodeURIComponent(parca[1]));
    else if (yer.id === 'felsefe') html = sayfaFelsefe(yer);
    else if (H.DAL_SAYFASI[yer.dal] === yer.id && yer.dal !== 'king') html = sayfaDal(yer);
    else html = sayfaYer(yer);
    sayfaEl.innerHTML = html;
    sayfaEl.setAttribute('data-yer', yer.id);
    d.title = yer.ad + ' · LifeOS';
    return yer;
  }
  function git(yol) { if (location.hash === yol) rota(); else location.hash = yol; }

  /* ---------------- halka ---------------- */
  var halkaEl, perdeEl, komutEl, oncekiOdak = null, secili = -1, basili = null;
  function halkaKur() {
    var ys = H.halka();
    halkaEl.innerHTML = '<span class="halka__merkez" aria-hidden="true"></span>' + ys.map(function (y, i) {
      var a = -90 + i * 360 / ys.length;
      return '<button type="button" role="menuitem" class="halka__oge" data-yol="' + y.yol + '" style="--a:' + a + 'deg">' + kac(y.ad) + '</button>';
    }).join('');
  }
  function halkaAc(x, y) {
    oncekiOdak = d.activeElement;
    var w = innerWidth, hh = innerHeight, r = Math.max(84, Math.min(150, Math.min(w, hh) / 2 - 64));
    x = x == null ? w / 2 : Math.min(Math.max(x, r + 56), w - r - 56);
    y = y == null ? hh / 2 : Math.min(Math.max(y, r + 40), hh - r - 40);
    halkaEl.style.setProperty('--x', x + 'px'); halkaEl.style.setProperty('--y', y + 'px'); halkaEl.style.setProperty('--r', r + 'px');
    perdeEl.hidden = false; halkaEl.hidden = false; secili = -1;
    try { getSelection().removeAllRanges(); } catch (e) { /* yok */ }
    requestAnimationFrame(function () { halkaEl.classList.add('acik'); perdeEl.classList.add('acik'); });
  }
  function halkaKapat(odakDon) {
    if (halkaEl.hidden) return;
    halkaEl.classList.remove('acik'); perdeEl.classList.remove('acik'); halkaEl.hidden = true; perdeEl.hidden = true;
    halkaSec(-1);
    if (odakDon !== false && oncekiOdak && oncekiOdak.focus) oncekiOdak.focus();
  }
  function halkaOgeleri() { return [].slice.call(halkaEl.querySelectorAll('.halka__oge')); }
  function halkaSec(i) { secili = i; halkaOgeleri().forEach(function (b, j) { b.classList.toggle('secili', j === i); }); }

  // basılı tut: boş yerde, kıpırdamadan; sürükleyip bırakınca seçer
  var ETKILESIMLI = 'a,button,input,select,textarea,label,summary,[contenteditable],[role="dialog"],.halka';
  function basBasla(e) {
    if (e.button !== 0 || !halkaEl.hidden || !komutEl.hidden || e.target.closest(ETKILESIMLI)) return;
    var sx = e.clientX, sy = e.clientY;
    basili = { x: sx, y: sy, acildi: false, zaman: setTimeout(function () { basili.acildi = true; halkaAc(sx, sy); }, e.pointerType === 'mouse' ? 380 : 480) };
  }
  function basHareket(e) {
    if (!basili) return;
    if (!basili.acildi) { if (Math.abs(e.clientX - basili.x) + Math.abs(e.clientY - basili.y) > 10) { clearTimeout(basili.zaman); basili = null; } return; }
    var cx = parseFloat(halkaEl.style.getPropertyValue('--x')), cy = parseFloat(halkaEl.style.getPropertyValue('--y'));
    var dx = e.clientX - cx, dy = e.clientY - cy, n = halkaOgeleri().length;
    if (Math.hypot(dx, dy) < 32) return halkaSec(-1);
    // açı 0 = tepe (ilk öğe), saat yönünde; her öğe kendi diliminin ortasında
    var aci = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360 + 180 / n) % 360;
    halkaSec(Math.floor(aci / (360 / n)));
  }
  function basBitir() {
    if (!basili) return;
    clearTimeout(basili.zaman);
    var acildi = basili.acildi; basili = null;
    if (acildi && secili >= 0) { var yol = halkaOgeleri()[secili].getAttribute('data-yol'); halkaKapat(false); git(yol); }
    else if (acildi) { var b = halkaOgeleri()[0]; if (b) b.focus(); }
  }

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
    sonuc = q ? ara(q, ogeler, 8) : ogeler.filter(function (o) { var y = o.tur === 'yer' && H.bul(o.id); return y && (y.halka || y.id === 'ayarlar'); });
    etkin = 0;
    var liste = $('#komut-liste'), g = $('input', komutEl);
    liste.innerHTML = sonuc.length ? sonuc.map(function (o, i) {
      return '<li role="option" id="komut-' + i + '" aria-selected="' + (i === 0) + '" data-i="' + i + '"><span>' + kac(o.ad) + '</span><span class="soluk">' + kac(o.etiket) + '</span></li>';
    }).join('') : '<li class="komut__bos" role="presentation">Sonuç yok</li>';
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
    var satirEl = b.closest('.ayar'); satirEl.outerHTML = A.ciz(A.tanim(a), A.oku(depo, a));
    var yeni = $('[data-ayar-satir="' + a + '"] [data-deger="' + v + '"]'); if (yeni) yeni.focus();
  }
  function aralikYaz(el) {
    var a = el.getAttribute('data-ayar'), s = el.closest('.ayar'), v = A.oku(depo, a);
    v.acik = $('[data-parca="acik"]', s).checked; v.bas = $('[data-parca="bas"]', s).value; v.bit = $('[data-parca="bit"]', s).value;
    A.yaz(depo, a, v);
  }
  function tik(e) {
    var t = e.target;
    var ac = t.closest('[data-ac]');
    if (ac) {
      var n = ac.getAttribute('data-ac');
      if (n === 'komut') return komutAc();
      if (n === 'halka') return halkaAcOdakli();
      if (n === 'ipucu') { depo.setItem('lifeos.kabuk.ipucu', 'goruldu'); var ip = ac.closest('.ipucu'); if (ip) ip.remove(); return; }
      if (n === 'sifirla') { if (confirm('Bütün ayarlar varsayılana dönsün mü?')) { A.sifirla(depo); uygula(); rota(); } return; }
    }
    var hb = t.closest('.halka__oge'); if (hb) { var y = hb.getAttribute('data-yol'); halkaKapat(false); return git(y); }
    var li = t.closest('#komut-liste [data-i]'); if (li) return calistir(sonuc[+li.getAttribute('data-i')]);
    if (t === perdeEl) { halkaKapat(); komutKapat(); return; }
    var sec = t.closest('[role="radio"][data-ayar]'); if (sec) return ayarSec(sec);
    var dis = t.closest('[aria-disabled="true"]'); if (dis) e.preventDefault();
  }

  function baslat() {
    uygula();
    sayfaEl = $('#sayfa'); halkaEl = $('#halka'); perdeEl = $('#perde'); komutEl = $('#komut');
    ogeler = komutOgeleri(H, A);
    halkaKur();
    addEventListener('hashchange', function () { halkaKapat(false); komutKapat(false); rota(); sayfaEl.focus({ preventScroll: true }); scrollTo(0, 0); });
    d.addEventListener('keydown', tus);
    d.addEventListener('click', tik);
    d.addEventListener('change', function (e) { if (e.target.closest('.aralik [data-ayar]')) aralikYaz(e.target); });
    d.addEventListener('pointerdown', basBasla);
    d.addEventListener('pointermove', basHareket);
    d.addEventListener('pointerup', basBitir);
    d.addEventListener('pointercancel', function () { if (basili) { clearTimeout(basili.zaman); basili = null; } });
    d.addEventListener('contextmenu', function (e) { if (basili || !halkaEl.hidden) e.preventDefault(); });
    $('input', komutEl).addEventListener('input', function (e) { komutCiz(e.target.value); });
    if (matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', uygula);
    rota();
    felsefeYukle().then(function () { var y = sayfaEl.getAttribute('data-yer'); if (y === 'felsefe' || y === 'bugun') rota(); });
  }
  Kabuk.ac = { halka: halkaAcOdakli, komut: function () { komutAc(); }, git: function (y) { git(y); } };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', baslat); else baslat();
})(typeof window !== 'undefined' ? window : globalThis);
