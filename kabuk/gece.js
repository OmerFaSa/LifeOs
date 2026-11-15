/* kabuk/gece.js — Ambiyans sesi: tarayıcıda üretilen gündüz ve gece ambiyansı (sahibin isteği 2026-11-15: önce «sakin bir gece»,
 * sonra «gece ve gündüz ambiyans sesini daha güzel, daha profesyonel»). Ses dosyası ve dış kaynak yok: Web Audio ile sentez.
 *  Gece: hafif rüzgâr, birkaç cırcır böceği (her biri kendi ritminde, sağda solda), uzakta kurbağa, çok seyrek baykuş.
 *  Gündüz: esinti, uzakta akan dere, ötüşen kuşlar (cıvıltı, ışıl ışıl ötüş), arada uzaktan guguk.
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

  var Gece = { plan: plan, kipSec: kipSec, ANAHTAR: ANAHTAR };
  Kabuk.Gece = Gece;
  if (typeof module !== 'undefined' && module.exports) module.exports = Gece;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var d = document, ctx = null, ana = null, yanki = null, katman = {}, saat = null, durum = null, calisiyor = false, kip = null;
  var CIR_SES = [{ f: 4400, pan: -0.55 }, { f: 4750, pan: 0.45 }, { f: 4100, pan: 0.1 }];
  var KUS = [{ pan: -0.6, f: 3600 }, { pan: 0.55, f: 4300 }, { pan: 0.05, f: 3000 }];
  function deger() { var A = Kabuk.Ayar, I = Kabuk.ic; try { return A && I ? A.oku(I.depo, ANAHTAR) : 'kapali'; } catch (e) { return 'kapali'; } }
  function acikMi() { var v = deger(); return !!v && v !== 'kapali'; }
  function simdikiKip() { return kipSec(deger(), new Date().getHours()); }

  function gurultu(sn, kahve) { // döngü stereo gürültü: kahverengi (rüzgâr) ya da yumuşatılmış (dere)
    var n = Math.round(ctx.sampleRate * sn), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var k = 0; k < 2; k++) {
      var v = b.getChannelData(k), son = 0;
      for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1; son = kahve ? (son + 0.02 * w) / 1.02 : son * 0.86 + w * 0.14; v[i] = son * (kahve ? 3.5 : 1.6); }
    }
    return b;
  }
  function yankiKur() { // 2,4 sn sönen stereo yankı
    var n = Math.round(ctx.sampleRate * 2.4), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var k = 0; k < 2; k++) { var v = b.getChannelData(k); for (var i = 0; i < n; i++) v[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
    var c = ctx.createConvolver(); c.buffer = b;
    var g = ctx.createGain(); g.gain.value = 0.32; c.connect(g); g.connect(ana);
    return c;
  }
  // Sürekli katman: döngü gürültü → süzgeç → yavaş dalgalanan kazanç → kip kazancı (kipe göre 4 sn'de açılır/kapanır) → ana.
  function surekli(buf, tur, f, q, taban, derinlik, hiz) {
    var k = ctx.createBufferSource(); k.buffer = buf; k.loop = true; k.playbackRate.value = 0.9 + Math.random() * 0.2;
    var s = ctx.createBiquadFilter(); s.type = tur; s.frequency.value = f; s.Q.value = q;
    var g = ctx.createGain(); g.gain.value = taban;
    var dalga = ctx.createOscillator(), der = ctx.createGain(); dalga.frequency.value = hiz; der.gain.value = derinlik;
    dalga.connect(der); der.connect(g.gain);
    var kg = ctx.createGain(); kg.gain.value = 0;
    k.connect(s); s.connect(g); g.connect(kg); kg.connect(ana); k.start(); dalga.start();
    return kg;
  }
  function kur() {
    ctx = new (kok.AudioContext || kok.webkitAudioContext)();
    ana = ctx.createGain(); ana.gain.value = 0;
    var sik = ctx.createDynamicsCompressor(); sik.threshold.value = -18; sik.ratio.value = 3;
    ana.connect(sik); sik.connect(ctx.destination);
    yanki = yankiKur();
    var kahve = gurultu(6, true), yumusak = gurultu(5, false);
    katman.gece = [surekli(kahve, 'lowpass', 420, 0.7, 0.16, 0.07, 0.07)];
    katman.gunduz = [surekli(kahve, 'lowpass', 900, 0.5, 0.07, 0.04, 0.05), // esinti
      surekli(yumusak, 'bandpass', 2300, 0.6, 0.05, 0.015, 0.31), // dere: küçük hızlı kabarmalar
      surekli(yumusak, 'lowpass', 520, 0.8, 0.05, 0.012, 0.11)]; // derenin gövdesi
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
  function ton(p, b, sure, f0, f1, tepe, tip) { // tek nota: frekans kayar, kazanç yumuşak açılıp söner
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tip || 'sine'; o.frequency.setValueAtTime(f0, b); o.frequency.exponentialRampToValueAtTime(f1, b + sure);
    g.gain.setValueAtTime(0, b); g.gain.linearRampToValueAtTime(tepe, b + Math.min(0.02, sure / 3)); g.gain.exponentialRampToValueAtTime(0.0008, b + sure);
    o.connect(g); g.connect(p); o.start(b); o.stop(b + sure + 0.02);
  }

  function cir(t, i) { // üç kısa nabız: cırcırın «cri-cri-cri»si
    var c = CIR_SES[i % CIR_SES.length], o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = c.f + (Math.random() * 60 - 30); g.gain.value = 0;
    var tepe = 0.018 + Math.random() * 0.008;
    for (var n = 0; n < 3; n++) { var b = t + n * 0.045; g.gain.setValueAtTime(0, b); g.gain.linearRampToValueAtTime(tepe, b + 0.006); g.gain.linearRampToValueAtTime(0, b + 0.028); }
    o.connect(g); g.connect(cikis(c.pan, false)); o.start(t); o.stop(t + 0.2);
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
    ton(p, t, 0.32, 410, 385, 0.03); ton(p, t + 0.55, 0.7, 400, 360, 0.03);
  }
  function kus(t, i) { // her kuşun kendi şarkısı: üçüncüsü ötüş, ötekiler cıvıltı
    var k = KUS[i % KUS.length], p = cikis(k.pan + (Math.random() * 0.2 - 0.1), true), tepe = 0.012 + Math.random() * 0.008, f = k.f * (0.94 + Math.random() * 0.12);
    if (i % 3 === 2) {
      var n = 7 + Math.floor(Math.random() * 6);
      for (var j = 0; j < n; j++) ton(p, t + j * 0.065, 0.05, f * 1.15, f * 0.95, tepe * 0.8);
      ton(p, t + n * 0.065 + 0.02, 0.18, f * 1.3, f * 0.7, tepe);
    } else {
      var m = 2 + Math.floor(Math.random() * 4), b = t;
      for (var q = 0; q < m; q++) {
        var s = 0.06 + Math.random() * 0.08, yukari = (q + i) % 2 === 0;
        ton(p, b, s, yukari ? f * 0.85 : f * 1.25, yukari ? f * 1.3 : f * 0.8, tepe);
        b += s + 0.04 + Math.random() * 0.08;
      }
    }
  }
  function guguk(t) { // uzaktan «gu-guk»: iki inen nota, ormanın derininden
    var p = cikis(-0.35 + Math.random() * 0.7, true), s = ctx.createBiquadFilter();
    s.type = 'lowpass'; s.frequency.value = 1400; s.connect(p);
    ton(s, t, 0.28, 690, 670, 0.035, 'triangle'); ton(s, t + 0.42, 0.42, 560, 540, 0.03, 'triangle');
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
    ana.gain.cancelScheduledValues(ctx.currentTime); ana.gain.setValueAtTime(ana.gain.value, ctx.currentTime); ana.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 3);
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
