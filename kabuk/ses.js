/* kabuk/ses.js — Arayüz sesleri (sahibin isteği 2026-11-16: «sisteme ses eklememiz lazım», sonra «sesler hâlâ tam değil, çok daha profesyonel yap»).
 * Ses dosyası ve dış kaynak yok: Web Audio sentezi. Tek akort: bütün tonlar Re majör pentatonikte (Re Mi Fa# La Si), böylece sesler
 * art arda çalınca da birbirine uyar. Tını: kısa FM (atakta parlak, sönümde yumuşak) + hafif aralıklı ikinci ses (sıcaklık),
 * dokunuşta süzülmüş gürültü (tık geçişi), ortak kısa yankı (üretilmiş dürtü), tepe sınırlayıcı, ana ses düzeyi.
 * Az ve anlamlı: SESLER kataloğu (her birinin ne zaman çaldığı «ne» alanında). Yalnız kullanıcının eylemiyle çalar
 * (son 1,5 sn'de dokunuş/tuş yoksa susar: ilk açılış ve kendiliğinden yeniden çizimler sessiz); 60 ms içinde eşit ya da daha az
 * önemli ikinci ses çalmaz. Ayar: lifeos.ses.arayuz açık | kapalı, lifeos.ses.duzey kısık | orta | yüksek (bu cihazın, kabuk/ayar.js).
 * Sessiz saatlerde (lifeos.sessiz) susar. kabuk.js'in Kabuk.Ses.cal('tik'|'ac'|'tamam') çağrıları korunur; öteki olaylar bu dosyanın
 * belge üstündeki dinleyicilerinden gelir (click, change, submit). Başka modül: document.dispatchEvent(new CustomEvent('basbug-ses', { detail: 'bildirim' })).
 * Node'da yalnız saf parçalar (katalog, hz, izin, susmali, duzeyKazanci). */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  var ANAHTAR = 'lifeos.ses.arayuz', DUZEY_ANAHTAR = 'lifeos.ses.duzey';
  var ARA_MS = 60, EYLEM_MS = 1500;

  // Re majör pentatonik: nota adı → Hz (A4 = 440). Akort dışı nota hata verir (testte yakalanır).
  var PERDE = { D: 2, E: 4, 'F#': 6, A: 9, B: 11 };
  function hz(ad) {
    var m = /^(D|E|F#|A|B)([2-7])$/.exec(ad); if (!m) throw new Error('akort dışı nota: ' + ad);
    return 440 * Math.pow(2, ((+m[2] + 1) * 12 + PERDE[m[1]] - 69) / 12);
  }

  /* Katman: ton { nota, nota2? (kayış), t, atak, sure, g, fm? {oran, indeks, sure}, ayri? (cent, ikinci ses), egim? (cent, başta yüksekten iner), yanki? }
   *         hisirti { f, f2?, q, t, atak, sure, g, yanki? }: süzülmüş beyaz gürültü (dokunuş, hava). Süreler sn, g doğrusal kazanç. */
  var SESLER = {
    tik: { ne: 'Sekme ya da bağlantıyla başka sayfaya geçince; halkada bir yer seçilince', oncelik: 1, katman: [
      { tip: 'hisirti', f: 3600, q: 1.1, t: 0, atak: 0.001, sure: 0.022, g: 0.592 },
      { tip: 'ton', nota: 'A5', egim: 400, t: 0, atak: 0.002, sure: 0.055, g: 0.259, fm: { oran: 2, indeks: 0.5, sure: 0.02 } }] },
    sec: { ne: 'Bir seçenek seçilince (ayar tercihi, açılır liste, sınav şıkkı)', oncelik: 1, katman: [
      { tip: 'hisirti', f: 5200, q: 1.4, t: 0, atak: 0.001, sure: 0.018, g: 0.414 },
      { tip: 'ton', nota: 'B5', t: 0, atak: 0.002, sure: 0.05, g: 0.23 }] },
    ac: { ne: 'Yerler halkası açılınca', oncelik: 2, katman: [
      { tip: 'hisirti', f: 700, f2: 2600, q: 0.9, t: 0, atak: 0.07, sure: 0.24, g: 0.0756, yanki: 0.3 },
      { tip: 'ton', nota: 'D5', nota2: 'A5', t: 0, atak: 0.05, sure: 0.26, g: 0.0378, ayri: 7, yanki: 0.3 },
      { tip: 'ton', nota: 'A5', t: 0.06, atak: 0.03, sure: 0.32, g: 0.0185, yanki: 0.45 }] },
    bas: { ne: 'Ana düğmeye basılınca (bağlantı ve gönder düğmeleri hariç: onların kendi sesi var)', oncelik: 1, katman: [
      { tip: 'hisirti', f: 1700, q: 0.8, t: 0, atak: 0.001, sure: 0.03, g: 0.371 },
      { tip: 'ton', nota: 'D5', egim: 500, t: 0, atak: 0.002, sure: 0.09, g: 0.257, fm: { oran: 1, indeks: 1.1, sure: 0.03 } }] },
    acik: { ne: 'Aç/kapa anahtarı açılınca (onay kutusu, basılı düğme, Açık seçeneği)', oncelik: 2, katman: [
      { tip: 'hisirti', f: 4200, q: 1.5, t: 0, atak: 0.001, sure: 0.015, g: 0.0904 },
      { tip: 'ton', nota: 'E5', t: 0, atak: 0.002, sure: 0.07, g: 0.0565 },
      { tip: 'ton', nota: 'A5', t: 0.055, atak: 0.002, sure: 0.11, g: 0.0621, fm: { oran: 2, indeks: 0.4, sure: 0.03 } }] },
    kapali: { ne: 'Aç/kapa anahtarı kapanınca: aynı iki nota, inen ve daha koyu', oncelik: 2, katman: [
      { tip: 'hisirti', f: 2800, q: 1.5, t: 0, atak: 0.001, sure: 0.015, g: 0.0854 },
      { tip: 'ton', nota: 'A5', t: 0, atak: 0.002, sure: 0.07, g: 0.0549 },
      { tip: 'ton', nota: 'E5', t: 0.055, atak: 0.002, sure: 0.11, g: 0.061 }] },
    kayit: { ne: 'Not, kayıt, açık uçlu cevap ya da sayı ayarı kaydedilince', oncelik: 3, katman: [
      { tip: 'ton', nota: 'A5', t: 0, atak: 0.003, sure: 0.28, g: 0.0636, fm: { oran: 2, indeks: 0.8, sure: 0.05 }, ayri: 5, yanki: 0.2 },
      { tip: 'ton', nota: 'D6', t: 0.07, atak: 0.003, sure: 0.42, g: 0.053, fm: { oran: 2, indeks: 0.6, sure: 0.06 }, yanki: 0.25 }] },
    dogru: { ne: 'Soruya doğru cevap verilince', oncelik: 4, katman: [
      { tip: 'ton', nota: 'A5', t: 0, atak: 0.003, sure: 0.32, g: 0.0588, fm: { oran: 2, indeks: 1, sure: 0.06 }, ayri: 5, yanki: 0.25 },
      { tip: 'ton', nota: 'D6', t: 0.085, atak: 0.003, sure: 0.6, g: 0.0637, fm: { oran: 2, indeks: 1, sure: 0.08 }, ayri: 5, yanki: 0.3 }] },
    yanlis: { ne: 'Yanlış cevapta ya da geçilemeyen kapıda: alçak, yumuşak, inen; cezalandırmaz', oncelik: 4, katman: [
      { tip: 'ton', nota: 'B4', t: 0, atak: 0.006, sure: 0.22, g: 0.0504, fm: { oran: 1, indeks: 0.4, sure: 0.05 }, ayri: 4, yanki: 0.15 },
      { tip: 'ton', nota: 'F#4', t: 0.11, atak: 0.006, sure: 0.38, g: 0.0504, ayri: 4, yanki: 0.2 }] },
    ders: { ne: 'Ders «okudum» ile bitince: dört notalı çan', oncelik: 5, katman: [
      { tip: 'ton', nota: 'D5', t: 0, atak: 0.003, sure: 0.5, g: 0.045, fm: { oran: 2, indeks: 1.2, sure: 0.07 }, ayri: 4, yanki: 0.3 },
      { tip: 'ton', nota: 'F#5', t: 0.09, atak: 0.003, sure: 0.5, g: 0.045, fm: { oran: 2, indeks: 1.2, sure: 0.07 }, ayri: 4, yanki: 0.3 },
      { tip: 'ton', nota: 'A5', t: 0.18, atak: 0.003, sure: 0.55, g: 0.045, fm: { oran: 2, indeks: 1.2, sure: 0.07 }, ayri: 4, yanki: 0.3 },
      { tip: 'ton', nota: 'D6', t: 0.27, atak: 0.003, sure: 1.0, g: 0.055, fm: { oran: 2, indeks: 1.2, sure: 0.1 }, ayri: 4, yanki: 0.35 }] },
    kapi: { ne: 'Kapı (ünite sınavı) geçilince: alçak gövde, yükselen akor, hava', oncelik: 6, katman: [
      { tip: 'ton', nota: 'D4', t: 0, atak: 0.012, sure: 1.3, g: 0.0816, ayri: 7, yanki: 0.3 },
      { tip: 'ton', nota: 'D5', t: 0, atak: 0.003, sure: 0.7, g: 0.0544, fm: { oran: 2, indeks: 1.4, sure: 0.08 }, ayri: 5, yanki: 0.4 },
      { tip: 'ton', nota: 'A5', t: 0.07, atak: 0.003, sure: 0.8, g: 0.0544, fm: { oran: 2, indeks: 1.4, sure: 0.08 }, ayri: 5, yanki: 0.4 },
      { tip: 'ton', nota: 'D6', t: 0.14, atak: 0.003, sure: 0.9, g: 0.0571, fm: { oran: 2, indeks: 1.2, sure: 0.09 }, ayri: 5, yanki: 0.45 },
      { tip: 'ton', nota: 'F#6', t: 0.21, atak: 0.003, sure: 1.2, g: 0.0476, fm: { oran: 2, indeks: 1, sure: 0.1 }, ayri: 5, yanki: 0.5 },
      { tip: 'hisirti', f: 5500, f2: 8000, q: 0.7, t: 0.05, atak: 0.15, sure: 0.5, g: 0.0272, yanki: 0.6 }] },
    uyari: { ne: 'Kayıt olmadı ya da girilen değer geçersiz: iki alçak, kısa vuruş', oncelik: 4, katman: [
      { tip: 'ton', nota: 'A4', t: 0, atak: 0.004, sure: 0.13, g: 0.0868, fm: { oran: 1, indeks: 1.3, sure: 0.04 } },
      { tip: 'ton', nota: 'A4', t: 0.14, atak: 0.004, sure: 0.2, g: 0.0744, fm: { oran: 1, indeks: 1.1, sure: 0.04 }, yanki: 0.15 }] },
    king: { ne: 'King\'in cevabı gelince (çok hafif)', oncelik: 2, katman: [
      { tip: 'ton', nota: 'B5', t: 0, atak: 0.004, sure: 0.32, g: 0.048, fm: { oran: 3, indeks: 0.7, sure: 0.05 }, yanki: 0.4 },
      { tip: 'ton', nota: 'F#6', t: 0.06, atak: 0.004, sure: 0.4, g: 0.0288, yanki: 0.5 }] },
    bildirim: { ne: 'Bildirim (basbug-ses olayıyla; kullanıcı eylemi beklemez)', oncelik: 3, katman: [
      { tip: 'ton', nota: 'D6', t: 0, atak: 0.003, sure: 0.4, g: 0.055, fm: { oran: 2, indeks: 1, sure: 0.07 }, ayri: 4, yanki: 0.3 },
      { tip: 'ton', nota: 'A5', t: 0.12, atak: 0.003, sure: 0.55, g: 0.055, fm: { oran: 2, indeks: 1, sure: 0.08 }, ayri: 4, yanki: 0.35 }] }
  };
  var KATALOG = Object.keys(SESLER);
  function katmanlar(tur) { return SESLER[tur] ? SESLER[tur].katman.map(function (k) { return Object.assign({}, k); }) : []; }
  function sure(tur) { return katmanlar(tur).reduce(function (m, k) { return Math.max(m, k.t + k.sure); }, 0); }

  // Hız sınırı: 60 ms içinde eşit ya da daha az önemli ses çalmaz (art arda tıklama); daha önemlisi (tık sonrası çan) çalar.
  function izin(son, tur, simdi) {
    if (!SESLER[tur]) return false;
    return !son || simdi - son.t >= ARA_MS || SESLER[tur].oncelik > SESLER[son.tur].oncelik;
  }
  var DUZEY = { kisik: 0.3, orta: 0.6, yuksek: 1 }, ARTI = 2; // ARTI: katalog kazançlarını ölçülen düzeye taşır (tur-20261116b/ses.md)
  function duzeyKazanci(d) { return DUZEY[d] || DUZEY.orta; }

  // Sessiz saatler: {acik, bas:'22:00', bit:'07:00'}; aralık gece yarısını geçebilir
  function susmali(sessiz, t) {
    if (!sessiz || !sessiz.acik) return false;
    var dk = function (s) { var p = String(s || '').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); };
    var a = dk(sessiz.bas), b = dk(sessiz.bit), n = t.getHours() * 60 + t.getMinutes();
    return a === b ? false : a < b ? n >= a && n < b : n >= a || n < b;
  }

  /* Ses çizgesi (canlı bağlam da çevrimdışı ölçüm de aynısını kullanır): kaynaklar → yol (kuru) + yankı gönderi → sıcaklık rafı → sınırlayıcı → çıkış. */
  function zincir(c, kazanc) {
    var yol = c.createGain(); yol.gain.value = kazanc * ARTI;
    var raf = c.createBiquadFilter(); raf.type = 'highshelf'; raf.frequency.value = 5000; raf.gain.value = -5; // tiz kenar: kulağı yormaz
    var sin = c.createDynamicsCompressor(); sin.threshold.value = -8; sin.knee.value = 4; sin.ratio.value = 12; sin.attack.value = 0.001; sin.release.value = 0.12;
    var n = Math.round(c.sampleRate * 1.1), b = c.createBuffer(2, n, c.sampleRate), on = Math.round(c.sampleRate * 0.008);
    for (var k = 0; k < 2; k++) { // kısa oda: 8 ms ön gecikme, üstel sönüm, tek kutuplu süzgeçle koyulaştırılmış gürültü; iki kanal ayrı (genişlik)
      var v = b.getChannelData(k), s = 0;
      for (var i = on; i < n; i++) { s = s * 0.55 + (Math.random() * 2 - 1) * 0.45; v[i] = s * Math.exp(-(i - on) / c.sampleRate * 5.5); }
    }
    var yanki = c.createConvolver(); yanki.buffer = b;
    var islak = c.createGain(); islak.gain.value = 0.35;
    yanki.connect(islak); islak.connect(yol); yol.connect(raf); raf.connect(sin); sin.connect(c.destination);
    var g = c.createBuffer(1, Math.round(c.sampleRate * 0.5), c.sampleRate), gv = g.getChannelData(0);
    for (var j = 0; j < gv.length; j++) gv[j] = Math.random() * 2 - 1;
    return { c: c, yol: yol, yanki: yanki, gurultu: g };
  }
  function zarf(c, p, k, b) { // çok kısa atak, doğal (üstel) sönüm; sonda değer tepenin ~1/1000'i: tık yok
    p.setValueAtTime(0, b); p.linearRampToValueAtTime(k.g, b + k.atak); p.setTargetAtTime(0, b + k.atak, (k.sure - k.atak) / 7);
  }
  function cal1(z, tur, bas) {
    var c = z.c;
    katmanlar(tur).forEach(function (k) {
      var b = bas + k.t, g = c.createGain(), son = b + k.sure + 0.02;
      zarf(c, g.gain, k, b); g.connect(z.yol);
      if (k.yanki) { var y = c.createGain(); y.gain.value = k.yanki; g.connect(y); y.connect(z.yanki); }
      if (k.tip === 'hisirti') {
        var src = c.createBufferSource(), s = c.createBiquadFilter();
        src.buffer = z.gurultu; s.type = 'bandpass'; s.Q.value = k.q; s.frequency.setValueAtTime(k.f, b);
        if (k.f2) s.frequency.exponentialRampToValueAtTime(k.f2, b + k.sure);
        src.connect(s); s.connect(g); src.start(b, Math.random() * 0.4); src.stop(son);
        return;
      }
      var f = hz(k.nota), sesler = k.ayri ? [[0, 1], [k.ayri, 0.45]] : [[0, 1]], mod = null;
      if (k.fm) { // FM: atakta parlak harmonikler, hızla söner: çan/marimba gibi sıcak bir kuyruk
        var m = c.createOscillator(); mod = c.createGain();
        m.frequency.value = f * k.fm.oran; mod.gain.setValueAtTime(f * k.fm.indeks, b); mod.gain.setTargetAtTime(0, b, k.fm.sure / 3);
        m.connect(mod); m.start(b); m.stop(son);
      }
      sesler.forEach(function (sv) {
        var o = c.createOscillator(), og = c.createGain(); og.gain.value = sv[1] / (k.ayri ? 1.45 : 1);
        o.detune.value = sv[0];
        o.frequency.setValueAtTime(k.egim ? f * Math.pow(2, k.egim / 1200) : f, b);
        if (k.egim) o.frequency.exponentialRampToValueAtTime(f, b + 0.03);
        if (k.nota2) o.frequency.exponentialRampToValueAtTime(hz(k.nota2), b + k.sure * 0.6);
        if (mod) mod.connect(o.frequency);
        o.connect(og); og.connect(g); o.start(b); o.stop(son);
      });
    });
  }
  // Ölçüm için: bir sesi çevrimdışı işler (Promise<AudioBuffer>); yalnız tarayıcıda
  function cevrimdisi(tur, duzey, sr) {
    sr = sr || 48000;
    var c = new kok.OfflineAudioContext(2, Math.round(sr * (sure(tur) + 1.2)), sr);
    cal1(zincir(c, duzeyKazanci(duzey)), tur, 0.005);
    return c.startRendering();
  }

  var Ses = { katmanlar: katmanlar, sure: sure, hz: hz, izin: izin, susmali: susmali, duzeyKazanci: duzeyKazanci,
    KATALOG: KATALOG, SESLER: SESLER, ANAHTAR: ANAHTAR, DUZEY_ANAHTAR: DUZEY_ANAHTAR, ARA_MS: ARA_MS, cevrimdisi: cevrimdisi };
  Kabuk.Ses = Ses;
  if (typeof module !== 'undefined' && module.exports) module.exports = Ses;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var d = document, z = null, son = null, sonEylem = -1e9, baglam = null, tamamCaldi = false, tiklanan = null;
  function oku(k) { var A = Kabuk.Ayar, I = Kabuk.ic; try { return A && I ? A.oku(I.depo, k) : null; } catch (e) { return null; } }
  function acik() { return oku(ANAHTAR) !== 'kapali' && !susmali(oku('lifeos.sessiz'), new Date()); }
  function kur() {
    if (z) return z;
    var C = kok.AudioContext || kok.webkitAudioContext; if (!C) return null;
    try { z = zincir(new C({ latencyHint: 'interactive' }), 1); } catch (e) { return null; }
    return z;
  }
  // tur: katalog adı; kabuk.js'in 'tamam'ı bağlama göre ders ya da kapı olur. zorla: kullanıcı eylemi beklenmez (bildirim).
  function cal(tur, zorla) {
    if (tur === 'tamam') { tamamCaldi = true; tur = baglam === 'kapi' ? 'kapi' : 'ders'; }
    // kabuk.js her tıklamada '[data-yol]' arar; #sayfa da data-yol taşıdığından sayfadaki her tık 'tik' isterdi: yalnız gerçek gezinmede çal
    if (tur === 'tik' && tiklanan && !gezinmeMi(tiklanan)) return;
    var simdi = Date.now();
    if (!SESLER[tur] || !acik() || (!zorla && simdi - sonEylem > EYLEM_MS) || !izin(son, tur, simdi)) return;
    if (!kur()) return;
    son = { tur: tur, t: simdi };
    z.yol.gain.value = duzeyKazanci(oku(DUZEY_ANAHTAR)) * ARTI;
    if (z.c.state === 'suspended') z.c.resume();
    cal1(z, tur, z.c.currentTime + 0.005);
  }
  Ses.cal = cal; Ses.son = function () { return son; }; // son: en son çalan ses (tarayıcı sınamaları için)

  function eylem(e) { if (e.isTrusted) { sonEylem = Date.now(); if (z && z.c.state === 'suspended' && acik()) z.c.resume(); } }
  d.addEventListener('pointerdown', function (e) { eylem(e); if (e.isTrusted && acik()) kur(); }, true); // bağlam dokunuşta kurulur: ilk ses gecikmez
  d.addEventListener('keydown', eylem, true);
  function sonra(f) { setTimeout(f, 0); } // ekranın kendi işleyicileri (kabuk.js) çalışıp yeniden çizdikten sonra durumu oku
  function sayfaIzi() { var s = d.getElementById('sayfa') || d.body; return { hata: s.querySelectorAll('.b-uyari--hata, [aria-invalid="true"]').length, tamam: s.querySelectorAll('.b-uyari--tamam').length + (s.textContent.match(/kaydedildi/gi) || []).length }; }

  function gezinmeMi(t) { var n = t.closest && t.closest('a[href^="#/"], [data-yol]'); return !!n && n.id !== 'sayfa'; }
  // Yakalama evresinde: öteki işleyiciler (araclar.js, kabuk.js) yeniden çizmeden önceki durum okunur; bu dosya kabuk.js'ten önce yüklenir.
  d.addEventListener('click', function (e) {
    tiklanan = e.isTrusted ? e.target : null; setTimeout(function () { tiklanan = null; }, 0);
    if (!e.isTrusted || !e.target.closest) return;
    var t = e.target;
    if (gezinmeMi(t) || t.closest('a[href], [data-ac="okudum"], [data-ac="halka"], [aria-disabled="true"], :disabled')) return; // kabuk.js çalar ya da eylem yok
    var sik = t.closest('.b-soru[data-soru] [data-h]');
    if (sik) {
      var id = sik.closest('.b-soru').getAttribute('data-soru');
      return sonra(function () {
        var s = d.querySelector('.b-soru[data-soru="' + id + '"] [data-h][aria-pressed="true"]');
        if (s) cal(s.classList.contains('b-soru__sik--dogru') ? 'dogru' : s.classList.contains('b-soru__sik--yanlis') ? 'yanlis' : 'sec');
      });
    }
    if (t.closest('[data-ac="acik-kaydet"]')) return sonra(function () { cal('kayit'); });
    var r = t.closest('[role="radio"], [role="option"]');
    if (r) { var v = r.getAttribute('data-deger'); return sonra(function () { cal(v === 'acik' ? 'acik' : v === 'kapali' ? 'kapali' : 'sec'); }); }
    var p = t.closest('[aria-pressed]');
    if (p) { var once = p.getAttribute('aria-pressed') === 'true'; return sonra(function () { cal(once ? 'kapali' : 'acik'); }); }
    var b = t.closest('.b-dugme--ana');
    if (b && b.getAttribute('type') !== 'submit') cal('bas');
  }, true);
  d.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('input[type="checkbox"]')) return cal(t.checked ? 'acik' : 'kapali');
    if (t.matches('input[type="radio"], select')) return cal('sec');
    if (t.matches('input[data-ayar]')) sonra(function () { cal(t.getAttribute('aria-invalid') === 'true' ? 'uyari' : 'kayit'); });
  });
  // Gönderme: kapı formunda kabuk.js'in 'tamam'ı kapı sesi olur, geçilemezse yumuşak 'yanlis'; King'de cevap gelince 'king';
  // öteki formlarda ekranda yeni bir hata çıkarsa 'uyari', «kaydedildi» çıkarsa 'kayit'.
  d.addEventListener('submit', function (e) {
    var f = e.target, k = f.closest && f.closest('[data-king-bolum]');
    if (k) return kingBekle();
    if (f.matches('form.kapi')) {
      if (f.hasAttribute('data-yer')) return;
      baglam = 'kapi'; tamamCaldi = false;
      return sonra(function () { baglam = null; if (!tamamCaldi && d.querySelector('[data-sonuc]')) cal('yanlis'); });
    }
    var once = sayfaIzi();
    setTimeout(function () { // kaydedip başka sayfaya gidenler hashchange'i bekler
      var simdi = sayfaIzi();
      if (simdi.hata > once.hata) cal('uyari'); else if (simdi.tamam > once.tamam) cal('kayit');
    }, 250);
  }, true); // yakalama: ekranın gönderme işleyicisi yeniden çizmeden önceki iz alınır, kapı bağlamı kabuk.js'ten önce kurulur
  function kingSay() { return d.querySelectorAll('.king-msj--king').length; }
  var kingGozcu = null;
  function kingBekle() { // gönderilen mesajın cevabı DOM'a düşünce bir kez; 2 dk içinde gelmezse vazgeç
    if (kingGozcu) kingGozcu.disconnect();
    var n = kingSay(), bit = Date.now() + 120000;
    kingGozcu = new MutationObserver(function () {
      if (Date.now() > bit) { kingGozcu.disconnect(); kingGozcu = null; return; }
      if (kingSay() > n) { kingGozcu.disconnect(); kingGozcu = null; cal('king', true); }
    });
    kingGozcu.observe(d.body, { childList: true, subtree: true });
  }
  d.addEventListener('basbug-ses', function (e) { cal(String(e.detail || ''), true); });
})(typeof window !== 'undefined' ? window : globalThis);
