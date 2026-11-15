/* kabuk/ses.js — Arayüz sesleri (sahibin isteği 2026-11-16: «sisteme ses eklememiz lazım»). Ses dosyası yok: Web Audio ile kısa, yumuşak
 * sentez. Az ve anlamlı: sayfa değişince hafif bir «tok», Yerler halkası açılınca hava sesi gibi bir yükseliş, ders/kapı bitince iki notalı çan.
 * Ayar: lifeos.ses.arayuz (bu cihazın, kabuk/ayar.js) açık | kapalı. Sessiz saatlerde (lifeos.sessiz) susar.
 * Tarayıcı sesi yalnız bir dokunuştan sonra başlatır: ses hep kullanıcının eylemiyle çalar, bağlam ilk çalışta kurulur.
 * Node'da yalnız saf parçalar (notalar, susmali). */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  var ANAHTAR = 'lifeos.ses.arayuz';

  // Her ses: notalar listesi { f: başlangıç Hz, f2: bitiş Hz, t: başlangıç sn, sure: sn, g: kazanç, dalga }
  var SESLER = {
    tik: [{ f: 540, f2: 380, t: 0, sure: 0.09, g: 0.05, dalga: 'triangle' }],
    ac: [{ f: 330, f2: 520, t: 0, sure: 0.16, g: 0.03, dalga: 'sine' }, { f: 660, f2: 990, t: 0.03, sure: 0.14, g: 0.012, dalga: 'sine' }],
    tamam: [{ f: 784, f2: 784, t: 0, sure: 0.7, g: 0.045, dalga: 'sine' }, { f: 1047, f2: 1047, t: 0.09, sure: 0.9, g: 0.04, dalga: 'sine' },
      { f: 2094, f2: 2094, t: 0.09, sure: 0.35, g: 0.006, dalga: 'sine' }]
  };
  function notalar(tur) { return SESLER[tur] ? SESLER[tur].slice() : []; }

  // Sessiz saatler: {acik, bas:'22:00', bit:'07:00'}; aralık gece yarısını geçebilir
  function susmali(sessiz, t) {
    if (!sessiz || !sessiz.acik) return false;
    var dk = function (s) { var p = String(s || '').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); };
    var a = dk(sessiz.bas), b = dk(sessiz.bit), n = t.getHours() * 60 + t.getMinutes();
    return a === b ? false : a < b ? n >= a && n < b : n >= a || n < b;
  }

  var Ses = { notalar: notalar, susmali: susmali, ANAHTAR: ANAHTAR };
  Kabuk.Ses = Ses;
  if (typeof module !== 'undefined' && module.exports) module.exports = Ses;
  if (typeof document === 'undefined') return;

  var ctx = null, ana = null;
  function oku(k) { var A = Kabuk.Ayar, I = Kabuk.ic; try { return A && I ? A.oku(I.depo, k) : null; } catch (e) { return null; } }
  function kur() {
    if (ctx) return ctx;
    var C = kok.AudioContext || kok.webkitAudioContext; if (!C) return null;
    ctx = new C(); ana = ctx.createGain(); ana.gain.value = 1;
    var yumusak = ctx.createBiquadFilter(); yumusak.type = 'lowpass'; yumusak.frequency.value = 3200; // tiz kenarı alır: kulağı yormaz
    ana.connect(yumusak); yumusak.connect(ctx.destination);
    return ctx;
  }
  Ses.cal = function (tur) {
    if (oku(ANAHTAR) === 'kapali' || susmali(oku('lifeos.sessiz'), new Date())) return;
    var l = notalar(tur); if (!l.length || !kur()) return;
    if (ctx.state === 'suspended') ctx.resume();
    var s = ctx.currentTime + 0.01;
    l.forEach(function (n) {
      var o = ctx.createOscillator(), g = ctx.createGain(), b = s + n.t;
      o.type = n.dalga; o.frequency.setValueAtTime(n.f, b); if (n.f2 !== n.f) o.frequency.exponentialRampToValueAtTime(n.f2, b + n.sure * 0.8);
      g.gain.setValueAtTime(0.0001, b); g.gain.exponentialRampToValueAtTime(n.g, b + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, b + n.sure);
      o.connect(g); g.connect(ana); o.start(b); o.stop(b + n.sure + 0.02);
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
