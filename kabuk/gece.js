/* kabuk/gece.js — Ambiyans sesi: tarayıcıda üretilen gündüz ve gece ambiyansı (sahibin isteği 2026-11-15: önce «sakin bir gece»,
 * sonra «gece ve gündüz ambiyans sesini daha güzel, daha profesyonel»). Ses dosyası ve dış kaynak yok: Web Audio ile sentez.
 *  Rüzgâr katmanlı ve bozkır havasında (2026-11-16 «daha doğal»): alçak gövde, orta esinti, ot hışırtısı, çok hafif bozkır ıslığı;
 *  hepsi aynı yavaş, birbirine oranı düzensiz üç dalgalanmayla kabarır (rüzgâr bir bütün gibi eser). Döngü gürültüleri 8–14 sn,
 *  uçları üst üste bindirilmiş (dikiş tıkı yok), uzunlukları ortak katı olmayan sürelerde: desen kulakta tekrar etmez.
 *  2026-11-17 «daha kaliteli»: düzensiz esinti eğrisi (sakin anlar ve kabarmalar; esince hava ve hışırtı açılır), kanallar arası ilinti
 *  (gövde ortada, hışırtı geniş), uğultu kesici, zamanla koyulaşan yankı, yumuşak cırcır heceleri, uzak cırcır korosu, titreyen kuş ötüşü.
 *  Gece: rüzgâr, birkaç cırcır böceği (her biri kendi ritminde, 2–4 nabız, arada susar; biri uzakta, boğuk), uzakta kurbağa, çok seyrek baykuş.
 *  Gündüz: bozkır rüzgârı, uzakta akan dere (kısık), ötüşen kuşlar (cıvıltı, tarla kuşu gibi ötüş), arada uzaktan guguk.
 *  Uzaktaki sesler ortak bir yankıdan geçer (aynı açık havada duyulur); sıkıştırıcı ani tepeleri yumuşatır.
 * Ayar: lifeos.ses.gece (bu cihazın, kabuk/ayar.js): kapalı | açık (saate göre: 06–20 gündüz) | hep gece | hep gündüz.
 * Üst çubuktaki düğme açar/kapatır. Tarayıcı sesi ancak bir dokunuştan sonra başlatır: ayar açıksa ilk tıklamada/tuşta başlar.
 * Node'da yalnız saf parçalar (plan, kipSec). */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  var ANAHTAR = 'lifeos.ses.gece';

  // Ayar ve saat → kip. 'acik' saate göre: 06:00–19:59 gündüz.
  function kipSec(deger, saat) {
    if (deger === 'gece' || deger === 'gunduz') return deger;
    return saat >= 6 && saat < 20 ? 'gunduz' : 'gece';
  }

  /* Saf zamanlayıcı: durum (her kaynağın bir sonraki zamanı) ve [simdi, simdi+ufuk) penceresi → o penceredeki olaylar ve yeni durum.
   * Olay: { tur, t, i (sıra) }. rnd 0..1.
   * Gece: üç cırcır 0,9–1,7 sn arayla, kurbağa 7–16 sn, baykuş 40–90 sn. Gündüz: üç kuş 3–9 sn arayla, guguk 25–60 sn. */
  var KAYNAK = {
    gece: [{ tur: 'cir', n: 3, ilk: function (r, i) { return 0.3 + r() * 1.5 + i * 0.4; }, ara: function (r) { return 0.9 + r() * 0.8; } },
      { tur: 'kurbaga', n: 1, ilk: function (r) { return 3 + r() * 6; }, ara: function (r) { return 7 + r() * 9; } },
      { tur: 'baykus', n: 1, ilk: function (r) { return 15 + r() * 25; }, ara: function (r) { return 40 + r() * 50; } }],
    gunduz: [{ tur: 'kus', n: 3, ilk: function (r, i) { return 0.5 + r() * 2 + i * 1.3; }, ara: function (r) { return 3 + r() * 6; } },
      { tur: 'guguk', n: 1, ilk: function (r) { return 10 + r() * 15; }, ara: function (r) { return 25 + r() * 35; } }]
  };
  function plan(durum, simdi, ufuk, rnd, kip) {
    var K = KAYNAK[kip === 'gunduz' ? 'gunduz' : 'gece'], y = {}, olay = [], son = simdi + ufuk;
    K.forEach(function (k) {
      var l = (durum && durum[k.tur] ? durum[k.tur].slice() : []);
      for (var i = 0; i < k.n; i++) {
        if (l[i] == null) l[i] = simdi + k.ilk(rnd, i);
        while (l[i] < son) { olay.push({ tur: k.tur, t: l[i], i: i }); l[i] += k.ara(rnd); }
      }
      y[k.tur] = l;
    });
    olay.sort(function (a, b) { return a.t - b.t; });
    return { olaylar: olay, durum: y };
  }

  // Dikişsiz döngü: n+x örneklik h'den n örnek; son x örnek başa eş güçle bindirilir, böylece v[n-1] → v[0] geçişi h[n-1] → h[n] gibi akar.
  function dikis(h, n, x) {
    var v = new Float32Array(n);
    for (var i = 0; i < n; i++) v[i] = i < x ? h[i] * Math.sin(i / x * Math.PI / 2) + h[n + i] * Math.cos(i / x * Math.PI / 2) : h[i];
    return v;
  }

  var Gece = { plan: plan, kipSec: kipSec, dikis: dikis, ANAHTAR: ANAHTAR };
  Kabuk.Gece = Gece;
  if (typeof module !== 'undefined' && module.exports) module.exports = Gece;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var d = document, ctx = null, ana = null, yanki = null, katman = {}, saat = null, durum = null, calisiyor = false, kip = null;
  var CIR_SES = [{ f: 4400, pan: -0.55 }, { f: 4750, pan: 0.45 }, { f: 4100, pan: 0.1, uzak: true }];
  var ANA = 0.55; // ana düzey: ambiyans arka planda kalır (ölçüm: belgeler/ekip/sadelesme/tur-20261116b/ses.md)
  var KUS = [{ pan: -0.6, f: 3600 }, { pan: 0.55, f: 4300 }, { pan: 0.05, f: 3000 }];
  function deger() { var A = Kabuk.Ayar, I = Kabuk.ic; try { return A && I ? A.oku(I.depo, ANAHTAR) : 'kapali'; } catch (e) { return 'kapali'; } }
  function acikMi() { var v = deger(); return !!v && v !== 'kapali'; }
  function simdikiKip() { return kipSec(deger(), new Date().getHours()); }

  // Döngü stereo gürültü: kahverengi (rüzgâr), yumuşatılmış (dere) ya da beyaz (ot hışırtısı). kor: iki kanalın ortak payı (0 ayrı, 1 mono):
  // alçak gövde ortada ve dolgun, tiz hışırtı geniş (gerçek açık hava kaydı gibi; tamamen ayrı kanallar «kafanın içinde» boşluk yapar).
  // Son 0,6 sn başa eş güçle bindirilir: döngü noktasında sıçrama (tık) olmaz.
  function gurultu(sn, tip, kor) {
    var sr = ctx.sampleRate, n = Math.round(sr * sn), x = Math.round(sr * 0.6), b = ctx.createBuffer(2, n, sr), h = [new Float32Array(n + x), new Float32Array(n + x)];
    var ka = Math.sqrt(kor), kb = Math.sqrt(1 - kor), son = [0, 0], c = tip === 'kahve' ? 3.5 : tip === 'yumusak' ? 1.6 : 0.5;
    for (var i = 0; i < n + x; i++) {
      var o = Math.random() * 2 - 1;
      for (var k = 0; k < 2; k++) {
        var w = ka * o + kb * (Math.random() * 2 - 1);
        son[k] = tip === 'kahve' ? (son[k] + 0.02 * w) / 1.02 : tip === 'yumusak' ? son[k] * 0.86 + w * 0.14 : w;
        h[k][i] = son[k] * c;
      }
    }
    b.getChannelData(0).set(dikis(h[0], n, x)); b.getChannelData(1).set(dikis(h[1], n, x));
    return b;
  }
  // Esinti eğrisi: düzensiz aralıklı (3–9 sn) rastgele noktalar arasında yumuşak (kosinüs) geçiş; çoğu an sakin, arada kabarır.
  // Son nokta ilkine eşit: döngü dikişsiz. 8 kHz örneklemeli tek kanal: 83 sn ~2,6 MB. Sinüs dalgalanmalarının aksine kendini tekrar etmez.
  function esintiEgrisi(sn) {
    var sr = 8000, b;
    try { b = ctx.createBuffer(1, Math.round(sr * sn), sr); } catch (e) { sr = ctx.sampleRate; b = ctx.createBuffer(1, Math.round(sr * sn), sr); } // eski Safari 8 kHz'i reddeder
    var n = b.length, v = b.getChannelData(0), n0 = 0, p0 = -0.3, ilk = p0;
    while (n0 < n) {
      var n1 = Math.min(n, n0 + Math.round(sr * (3 + Math.random() * 6))), p1 = n1 >= n ? ilk : -0.6 + 1.6 * Math.pow(Math.random(), 2.2);
      for (var i = n0; i < n1; i++) v[i] = p0 + (p1 - p0) * (0.5 - 0.5 * Math.cos(Math.PI * (i - n0) / (n1 - n0)));
      n0 = n1; p0 = p1;
    }
    var k = ctx.createBufferSource(); k.buffer = b; k.loop = true; k.start(0, Math.random() * sn);
    return k;
  }
  function lfo(l) { // yavaş dalgalanmaların toplamı: [hız Hz, pay]; hızların oranı düzensiz, desen tekrar etmez
    var t = ctx.createGain();
    l.forEach(function (x) { var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = x[0]; g.gain.value = x[1]; o.connect(g); g.connect(t); o.start(); });
    return t;
  }
  function yankiKur() { // 2,4 sn sönen stereo açık hava yankısı: 25 ms ön gecikme, yumuşak giriş, kuyruk zamanla koyulaşır (hava tizi yutar)
    var sr = ctx.sampleRate, n = Math.round(sr * 2.4), on = Math.round(sr * 0.025), b = ctx.createBuffer(2, n, sr);
    for (var k = 0; k < 2; k++) {
      var v = b.getChannelData(k), s = 0;
      for (var i = on; i < n; i++) {
        var u = (i - on) / (n - on), a = 0.2 + 0.7 * u;
        s = s * a + (Math.random() * 2 - 1) * (1 - a);
        v[i] = s * Math.sqrt((1 + a) / (1 - a)) * Math.pow(1 - u, 3.2) * Math.min(1, (i - on) / (sr * 0.01));
      }
    }
    var c = ctx.createConvolver(); c.buffer = b;
    var g = ctx.createGain(); g.gain.value = 0.32; c.connect(g); g.connect(ana);
    return c;
  }
  // Sürekli katman: döngü gürültü (rastgele yerden, hafif farklı hızda) → süzgeç → dalgalanan kazanç → kip kazancı (4 sn'de açılır/kapanır) → ana.
  // mod: ortak rüzgâr dalgası (katmanlar birlikte kabarır); fmod: süzgeç frekansını gezdiren dalga (ıslık).
  function surekli(buf, tur, f, q, taban, derinlik, mod, fmod) {
    var k = ctx.createBufferSource(); k.buffer = buf; k.loop = true; k.playbackRate.value = 0.92 + Math.random() * 0.16;
    var s = ctx.createBiquadFilter(); s.type = tur; s.frequency.value = f; s.Q.value = q;
    var g = ctx.createGain(); g.gain.value = taban;
    var der = ctx.createGain(); der.gain.value = derinlik; mod.connect(der); der.connect(g.gain);
    if (fmod) { var fd = ctx.createGain(); fd.gain.value = f * 0.12; fmod.connect(fd); fd.connect(s.frequency); }
    var kg = ctx.createGain(); kg.gain.value = 0;
    k.connect(s); s.connect(g); g.connect(kg); kg.connect(ana); k.start(0, Math.random() * buf.duration);
    return kg;
  }
  function kur() { ctx = new (kok.AudioContext || kok.webkitAudioContext)(); kurIc(); }
  function kurIc() {
    ana = ctx.createGain(); ana.gain.value = 0;
    var alt = ctx.createBiquadFilter(); alt.type = 'highpass'; alt.frequency.value = 55; alt.Q.value = 0.6; // derin uğultu: hoparlör çıkarmaz, kulaklıkta basınç yapar
    var sik = ctx.createDynamicsCompressor(); sik.threshold.value = -18; sik.ratio.value = 3;
    ana.connect(alt); alt.connect(sik); sik.connect(ctx.destination);
    yanki = yankiKur();
    var kahve = gurultu(11.3, 'kahve', 0.6), kahve2 = gurultu(9.7, 'kahve', 0.35), yumusak = gurultu(13.7, 'yumusak', 0.4), beyaz = gurultu(7.9, 'beyaz', 0.15);
    // esinti: iki yavaş sinüs + düzensiz esinti eğrisi (çoğu an sakin, arada kabarır); toplam −0,96 … +1,3. Katman tabanı derinlik × 0,96'dan büyük: kazanç eksiye düşmez.
    var esinti = lfo([[0.043, 0.3], [0.117, 0.15]]), gezin = lfo([[0.029, 0.7], [0.083, 0.3]]), dg = ctx.createGain();
    dg.gain.value = 0.85; esintiEgrisi(83).connect(dg); dg.connect(esinti);
    // Esince yalnız düzey değil renk de değişir: hava ve hışırtının süzgeci esintiyle yükselir (fmod).
    katman.gece = [surekli(kahve, 'lowpass', 260, 0.7, 0.085, 0.07, esinti), // gövde
      surekli(kahve2, 'bandpass', 700, 0.7, 0.05, 0.045, esinti), // esinti
      surekli(yumusak, 'bandpass', 1400, 0.6, 0.014, 0.013, esinti, esinti), // hava: esintide açılan orta bölge
      surekli(beyaz, 'bandpass', 4800, 0.6, 0.008, 0.0075, esinti, esinti), // ot hışırtısı: sakinde neredeyse susar
      surekli(kahve, 'bandpass', 480, 9, 0.04, 0.035, esinti, gezin), // bozkır ıslığı: dar bant, frekansı gezinir
      surekli(beyaz, 'bandpass', 4500, 7, 0.0045, 0.0015, lfo([[0.05, 1]]))]; // uzak cırcır korosu: çok kısık, ışıldayan tek renk
    katman.gunduz = [surekli(kahve, 'lowpass', 340, 0.7, 0.06, 0.055, esinti),
      surekli(kahve2, 'bandpass', 800, 0.7, 0.055, 0.05, esinti),
      surekli(yumusak, 'bandpass', 1800, 0.6, 0.016, 0.015, esinti, esinti),
      surekli(beyaz, 'bandpass', 4500, 0.6, 0.012, 0.011, esinti, esinti),
      surekli(kahve, 'bandpass', 640, 9, 0.035, 0.03, esinti, gezin),
      surekli(yumusak, 'bandpass', 2300, 0.6, 0.025, 0.008, lfo([[0.31, 1]])), // dere (uzakta): küçük hızlı kabarmalar
      surekli(yumusak, 'lowpass', 520, 0.8, 0.03, 0.008, lfo([[0.11, 1]]))]; // derenin gövdesi
  }
  function kipUygula(yeni) {
    if (yeni === kip) return;
    kip = yeni; durum = null;
    var t = ctx.currentTime;
    ['gece', 'gunduz'].forEach(function (k) {
      katman[k].forEach(function (g) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(k === kip ? 1 : 0, t + 4); });
    });
    dugmeYaz();
  }
  function cikis(pan, yankili) { // olay → kaydırıcı → ana (+ yankı)
    var p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); p.connect(ana);
    if (yankili) p.connect(yanki);
    return p;
  }
  // tek nota: frekans kayar, kazanç yumuşak açılıp söner. atak: açılış (sn; yoksa en çok 20 ms); vib: [Hz, oran] perde titreşimi (kuş ötüşü)
  function ton(p, b, sure, f0, f1, tepe, tip, atak, vib) {
    var o = ctx.createOscillator(), g = ctx.createGain(), a = atak || Math.min(0.02, sure / 3);
    o.type = tip || 'sine'; o.frequency.setValueAtTime(f0, b); o.frequency.exponentialRampToValueAtTime(f1, b + sure);
    if (vib) { var v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = vib[0]; vg.gain.value = (f0 + f1) / 2 * vib[1]; v.connect(vg); vg.connect(o.frequency); v.start(b); v.stop(b + sure + 0.02); }
    g.gain.setValueAtTime(0, b); g.gain.linearRampToValueAtTime(tepe, b + a); g.gain.exponentialRampToValueAtTime(0.0008, b + sure);
    o.connect(g); g.connect(p); o.start(b); o.stop(b + sure + 0.02);
  }

  function cir(t, i) { // 2–4 kısa nabız, her nabızda hafif inen perde; arada susar (makine gibi düzenli değil); uzaktaki boğuk ve yankılı
    if (Math.random() < 0.18) return;
    var c = CIR_SES[i % CIR_SES.length], o = ctx.createOscillator(), g = ctx.createGain(), f = c.f + (Math.random() * 80 - 40);
    var n = 2 + Math.floor(Math.random() * 3), tepe = (c.uzak ? 0.006 : 0.011) + Math.random() * 0.004, ara = 0.04 + Math.random() * 0.008;
    o.type = 'sine'; g.gain.value = 0;
    for (var j = 0; j < n; j++) {
      var b = t + j * ara;
      o.frequency.setValueAtTime(f * 1.012, b); o.frequency.exponentialRampToValueAtTime(f, b + 0.02);
      // hece: 5 ms'de açılır, 9 ms tutar, üstel söner (doğrusal sıfıra iniş kesik gibi duyuluyordu); bir sonraki heceye kadar tepenin ~%0,1'ine iner
      g.gain.setValueAtTime(0, b); g.gain.linearRampToValueAtTime(tepe * (j === n - 1 ? 0.7 : 1) * (0.85 + Math.random() * 0.15), b + 0.005); g.gain.setTargetAtTime(0, b + 0.014, 0.004);
    }
    var p = cikis(c.pan, !!c.uzak);
    if (c.uzak) { var s = ctx.createBiquadFilter(); s.type = 'lowpass'; s.frequency.value = 4300; o.connect(g); g.connect(s); s.connect(p); } else { o.connect(g); g.connect(p); }
    o.start(t); o.stop(t + n * ara + 0.05);
  }
  function kurbaga(t) { // uzakta iki boğuk vırak
    var p = cikis(0.65, true);
    for (var n = 0; n < 2; n++) {
      var b = t + n * 0.22, o = ctx.createOscillator(), g = ctx.createGain(), s = ctx.createBiquadFilter();
      o.type = 'triangle'; o.frequency.setValueAtTime(190, b); o.frequency.exponentialRampToValueAtTime(130, b + 0.14);
      s.type = 'lowpass'; s.frequency.value = 700;
      g.gain.setValueAtTime(0, b); g.gain.linearRampToValueAtTime(0.05, b + 0.02); g.gain.exponentialRampToValueAtTime(0.001, b + 0.16);
      o.connect(s); s.connect(g); g.connect(p); o.start(b); o.stop(b + 0.2);
    }
  }
  function baykus(t) { // uzaktan yumuşak «hu-huu»
    var p = cikis(-0.7, true);
    ton(p, t, 0.34, 410, 385, 0.03, 'sine', 0.06, [5, 0.004]); ton(p, t + 0.55, 0.75, 400, 360, 0.03, 'sine', 0.09, [4.5, 0.006]);
  }
  function kus(t, i) { // her kuşun kendi şarkısı: üçüncüsü ötüş (tarla kuşu gibi), ötekiler cıvıltı
    var k = KUS[i % KUS.length], p = cikis(k.pan + (Math.random() * 0.2 - 0.1), true), tepe = 0.009 + Math.random() * 0.007, f = k.f * (0.94 + Math.random() * 0.12);
    if (i % 3 === 2) {
      var n = 7 + Math.floor(Math.random() * 6);
      for (var j = 0; j < n; j++) ton(p, t + j * 0.065, 0.05, f * 1.15, f * 0.95, tepe * 0.8);
      ton(p, t + n * 0.065 + 0.02, 0.18, f * 1.3, f * 0.7, tepe);
    } else {
      var m = 2 + Math.floor(Math.random() * 4), b = t;
      for (var q = 0; q < m; q++) {
        var s = 0.06 + Math.random() * 0.08, yukari = (q + i) % 2 === 0;
        ton(p, b, s, yukari ? f * 0.85 : f * 1.25, yukari ? f * 1.3 : f * 0.8, tepe, 'sine', 0.008, Math.random() < 0.5 ? [28 + Math.random() * 18, 0.025] : null);
        b += s + 0.04 + Math.random() * 0.08;
      }
    }
  }
  function guguk(t) { // uzaktan «gu-guk»: iki inen nota, ormanın derininden
    var p = cikis(-0.35 + Math.random() * 0.7, true), s = ctx.createBiquadFilter();
    s.type = 'lowpass'; s.frequency.value = 1400; s.connect(p);
    ton(s, t, 0.28, 690, 670, 0.035, 'triangle', 0.035); ton(s, t + 0.42, 0.42, 560, 540, 0.03, 'triangle', 0.04);
  }
  var CAL = { cir: cir, kurbaga: kurbaga, baykus: baykus, kus: kus, guguk: guguk };
  function dongu() { // 2,5 sn ileriyi planlar (gizli sekmede zamanlayıcı seyrekleşse de ses kesilmez); saat dönünce kip yumuşakça değişir
    kipUygula(simdikiKip());
    var p = plan(durum, ctx.currentTime, 2.5, Math.random, kip);
    durum = p.durum;
    p.olaylar.forEach(function (o) { if (o.t >= ctx.currentTime) CAL[o.tur](o.t, o.i); });
    Object.keys(durum).forEach(function (k) { durum[k] = durum[k].map(function (x) { return Math.max(x, ctx.currentTime); }); });
  }
  function basla() {
    if (calisiyor) return dongu(); // ayar gece↔gündüz değiştiyse hemen uyar
    try { if (!ctx) kur(); } catch (e) { return; } // ses yok (eski tarayıcı)
    calisiyor = true; durum = null;
    ctx.resume();
    ana.gain.cancelScheduledValues(ctx.currentTime); ana.gain.setValueAtTime(ana.gain.value, ctx.currentTime); ana.gain.linearRampToValueAtTime(ANA, ctx.currentTime + 3);
    dongu(); saat = setInterval(dongu, 1000);
    dugmeYaz();
  }
  function dur() {
    if (!calisiyor) return dugmeYaz();
    calisiyor = false; clearInterval(saat); saat = null;
    ana.gain.cancelScheduledValues(ctx.currentTime); ana.gain.setValueAtTime(ana.gain.value, ctx.currentTime); ana.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    setTimeout(function () { if (!calisiyor && ctx) ctx.suspend(); }, 900);
    dugmeYaz();
  }
  function esitle() { if (acikMi()) basla(); else dur(); }
  function dugmeYaz() {
    var b = d.querySelector('[data-ac="gece"]');
    if (!b) return;
    var gunduz = (calisiyor && kip ? kip : simdikiKip()) === 'gunduz', ad = 'Ambiyans sesi (' + (gunduz ? 'gündüz' : 'gece') + ')';
    b.setAttribute('aria-pressed', String(acikMi())); b.classList.toggle('calisiyor', calisiyor);
    b.setAttribute('aria-label', ad); b.title = ad;
    var u = b.querySelector('use'); if (u) u.setAttribute('href', gunduz ? '#i-gunes' : '#i-gece');
  }
  // Ölçüm için: bir kipi sn saniye çevrimdışı işler (Promise<AudioBuffer>); canlı bağlama dokunmaz
  Gece.cevrimdisi = function (k, sn) {
    var es = [ctx, ana, yanki, katman], oc = new kok.OfflineAudioContext(2, Math.round(44100 * sn), 44100);
    ctx = oc; katman = {};
    try {
      kurIc(); ana.gain.value = ANA; katman[k].forEach(function (g) { g.gain.value = 1; });
      plan(null, 0, sn, Math.random, k).olaylar.forEach(function (o) { CAL[o.tur](o.t, o.i); });
    } finally { ctx = es[0]; ana = es[1]; yanki = es[2]; katman = es[3]; }
    return oc.startRendering();
  };
  Gece.esitle = esitle; Gece.calisiyorMu = function () { return calisiyor; }; Gece.kip = function () { return kip; }; Gece.dugmeYaz = dugmeYaz;

  // Üst çubuk düğmesi açar/kapatır (açınca saate göre); her tıklama/tuş (tarayıcının «kullanıcı dokundu» izni) ayara göre başlatır ya da durdurur.
  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ac="gece"]');
    if (b && Kabuk.Ayar && Kabuk.ic) Kabuk.Ayar.yaz(Kabuk.ic.depo, ANAHTAR, acikMi() ? 'kapali' : 'acik');
    setTimeout(esitle, 0);
  });
  d.addEventListener('keydown', function () { if (!calisiyor && acikMi()) setTimeout(esitle, 0); });
  kok.addEventListener('hashchange', function () { setTimeout(dugmeYaz, 0); });
})(typeof window !== 'undefined' ? window : globalThis);
