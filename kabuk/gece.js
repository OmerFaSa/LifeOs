/* kabuk/gece.js — Gece sesi: tarayıcıda üretilen rahatlatıcı gece ambiyansı (sahibin isteği 2026-11-15, «yağmursuz, sakin bir gece»).
 * Ses dosyası ve dış kaynak yok: Web Audio ile sentez. Katmanlar: hafif rüzgâr (süzülmüş kahverengi gürültü, yavaş dalgalanır),
 * birkaç cırcır böceği (her biri kendi ritminde ve kendi yerinde, sağ-sol), uzakta seyrek kurbağa, çok seyrek baykuş.
 * Açık/kapalı: lifeos.ses.gece (bu cihazın ayarı, kabuk/ayar.js). Üst çubuktaki düğme ve Ayarlar › Ses değiştirir.
 * Tarayıcı sesi ancak bir dokunuştan sonra başlatır: ayar açıksa ilk tıklamada/tuşta başlar. Node'da yalnız saf zamanlayıcı (plan). */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  var ANAHTAR = 'lifeos.ses.gece';

  /* Saf zamanlayıcı: durum (her kaynağın bir sonraki zamanı) ve [simdi, simdi+ufuk) penceresi → o penceredeki olaylar ve yeni durum.
   * Olay: { tur: 'cir'|'kurbaga'|'baykus', t, i (cırcır sırası) }. rnd 0..1. Cırcırlar 0,9–1,7 sn arayla, kurbağa 7–16 sn, baykuş 40–90 sn. */
  var CIR = 3;
  function ara(tur, rnd) { return tur === 'cir' ? 0.9 + rnd() * 0.8 : tur === 'kurbaga' ? 7 + rnd() * 9 : 40 + rnd() * 50; }
  function plan(durum, simdi, ufuk, rnd) {
    var y = { cir: (durum && durum.cir ? durum.cir.slice() : []), kurbaga: durum && durum.kurbaga, baykus: durum && durum.baykus }, olay = [];
    for (var i = 0; i < CIR; i++) if (y.cir[i] == null) y.cir[i] = simdi + 0.3 + rnd() * 1.5 + i * 0.4;
    if (y.kurbaga == null) y.kurbaga = simdi + 3 + rnd() * 6;
    if (y.baykus == null) y.baykus = simdi + 15 + rnd() * 25;
    var son = simdi + ufuk;
    for (i = 0; i < CIR; i++) while (y.cir[i] < son) { olay.push({ tur: 'cir', t: y.cir[i], i: i }); y.cir[i] += ara('cir', rnd); }
    while (y.kurbaga < son) { olay.push({ tur: 'kurbaga', t: y.kurbaga }); y.kurbaga += ara('kurbaga', rnd); }
    while (y.baykus < son) { olay.push({ tur: 'baykus', t: y.baykus }); y.baykus += ara('baykus', rnd); }
    olay.sort(function (a, b) { return a.t - b.t; });
    return { olaylar: olay, durum: y };
  }

  var Gece = { plan: plan, ANAHTAR: ANAHTAR };
  Kabuk.Gece = Gece;
  if (typeof module !== 'undefined' && module.exports) module.exports = Gece;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var d = document, ctx = null, ana = null, ruzgar = null, saat = null, durum = null, calisiyor = false;
  var CIR_SES = [{ f: 4400, pan: -0.55 }, { f: 4750, pan: 0.45 }, { f: 4100, pan: 0.1 }];
  function acikMi() { var A = Kabuk.Ayar, I = Kabuk.ic; try { return !!(A && I) && A.oku(I.depo, ANAHTAR) === 'acik'; } catch (e) { return false; } }

  function gurultu() { // 4 sn kahverengi gürültü (döngü)
    var n = ctx.sampleRate * 4, b = ctx.createBuffer(1, n, ctx.sampleRate), v = b.getChannelData(0), son = 0;
    for (var i = 0; i < n; i++) { son = (son + 0.02 * (Math.random() * 2 - 1)) / 1.02; v[i] = son * 3.5; }
    return b;
  }
  function kur() {
    ctx = new (kok.AudioContext || kok.webkitAudioContext)();
    ana = ctx.createGain(); ana.gain.value = 0; ana.connect(ctx.destination);
    // rüzgâr: süzülmüş gürültü, kazancı 14 sn'lik yavaş dalgayla kabarıp söner
    var k = ctx.createBufferSource(); k.buffer = gurultu(); k.loop = true;
    var s = ctx.createBiquadFilter(); s.type = 'lowpass'; s.frequency.value = 420;
    ruzgar = ctx.createGain(); ruzgar.gain.value = 0.16;
    var dalga = ctx.createOscillator(), derin = ctx.createGain(); dalga.frequency.value = 0.07; derin.gain.value = 0.07;
    dalga.connect(derin); derin.connect(ruzgar.gain);
    k.connect(s); s.connect(ruzgar); ruzgar.connect(ana); k.start(); dalga.start();
  }
  function cir(t, i) { // üç kısa nabız: cırcırın «cri-cri-cri»si
    var c = CIR_SES[i % CIR_SES.length], o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner();
    o.type = 'sine'; o.frequency.value = c.f + (Math.random() * 60 - 30); p.pan.value = c.pan; g.gain.value = 0;
    var tepe = 0.018 + Math.random() * 0.008;
    for (var n = 0; n < 3; n++) { var b = t + n * 0.045; g.gain.setValueAtTime(0, b); g.gain.linearRampToValueAtTime(tepe, b + 0.006); g.gain.linearRampToValueAtTime(0, b + 0.028); }
    o.connect(g); g.connect(p); p.connect(ana); o.start(t); o.stop(t + 0.2);
  }
  function kurbaga(t) { // uzakta iki boğuk vırak
    for (var n = 0; n < 2; n++) {
      var b = t + n * 0.22, o = ctx.createOscillator(), g = ctx.createGain(), s = ctx.createBiquadFilter(), p = ctx.createStereoPanner();
      o.type = 'triangle'; o.frequency.setValueAtTime(190, b); o.frequency.exponentialRampToValueAtTime(130, b + 0.14);
      s.type = 'lowpass'; s.frequency.value = 700; p.pan.value = 0.65;
      g.gain.setValueAtTime(0, b); g.gain.linearRampToValueAtTime(0.05, b + 0.02); g.gain.exponentialRampToValueAtTime(0.001, b + 0.16);
      o.connect(s); s.connect(g); g.connect(p); p.connect(ana); o.start(b); o.stop(b + 0.2);
    }
  }
  function baykus(t) { // uzaktan yumuşak «hu-huu»
    [[0, 0.32, 410, 385], [0.55, 0.7, 400, 360]].forEach(function (h) {
      var b = t + h[0], o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner();
      o.type = 'sine'; o.frequency.setValueAtTime(h[2], b); o.frequency.linearRampToValueAtTime(h[3], b + h[1]); p.pan.value = -0.7;
      g.gain.setValueAtTime(0, b); g.gain.linearRampToValueAtTime(0.03, b + 0.09); g.gain.linearRampToValueAtTime(0, b + h[1]);
      o.connect(g); g.connect(p); p.connect(ana); o.start(b); o.stop(b + h[1] + 0.05);
    });
  }
  function dongu() { // 2 sn ileriyi planlar (gizli sekmede zamanlayıcı seyrekleşse de ses kesilmez)
    var p = plan(durum, ctx.currentTime, 2.5, Math.random);
    durum = p.durum;
    p.olaylar.forEach(function (o) { if (o.t < ctx.currentTime) return; if (o.tur === 'cir') cir(o.t, o.i); else if (o.tur === 'kurbaga') kurbaga(o.t); else baykus(o.t); });
    durum.cir = durum.cir.map(function (x) { return Math.max(x, ctx.currentTime); });
  }
  function basla() {
    if (calisiyor) return;
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
    if (b) { b.setAttribute('aria-pressed', String(acikMi())); b.classList.toggle('calisiyor', calisiyor); }
  }
  Gece.esitle = esitle; Gece.calisiyorMu = function () { return calisiyor; };

  // Üst çubuk düğmesi ayarı çevirir; her tıklama/tuş (tarayıcının «kullanıcı dokundu» izni) ayara göre başlatır ya da durdurur.
  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ac="gece"]');
    if (b && Kabuk.Ayar && Kabuk.ic) Kabuk.Ayar.yaz(Kabuk.ic.depo, ANAHTAR, acikMi() ? 'kapali' : 'acik');
    setTimeout(esitle, 0);
  });
  d.addEventListener('keydown', function () { if (!calisiyor && acikMi()) setTimeout(esitle, 0); });
  kok.addEventListener('hashchange', function () { setTimeout(dugmeYaz, 0); });
})(typeof window !== 'undefined' ? window : globalThis);
