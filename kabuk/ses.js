/* kabuk/ses.js — Arayüz sesleri (sahibin isteği 2026-11-16: «sisteme ses eklememiz lazım», sonra «sesler hâlâ tam değil, çok daha profesyonel yap»).
 * Ses dosyası ve dış kaynak yok: Web Audio sentezi. Tek akort: bütün tonlar Re majör pentatonikte (Re Mi Fa# La Si), böylece sesler
 * art arda çalınca da birbirine uyar. Tını (2026-11-17 «daha kaliteli»): vurulan cisim gibi kısmi sesler (TINI: tahta, cam, yumuşak;
 * üst kısmiler daha çabuk söner), hafif sağa-sola açılan ikinci ses, dokunuşta süzülmüş gürültü (tokmak), zamanla koyulaşan kısa oda
 * yankısı, alçak kesici, tepe sınırlayıcı. Her sesin db'si ölçülen yüksekliği (LUFS) dört kademede 9 LU içinde tutar.
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

  /* Katman: ton { nota, nota2? (kayış), t, atak, sure, g, tini? (TINI adı), ayri? (cent: iki ses sağa sola açılır), egim? (cent, başta yüksekten iner), yanki? }
   *         hisirti { f, f2?, q, t, atak, sure, g, yanki? }: süzülmüş gürültü (tokmak dokunuşu, hava). Süreler sn, g doğrusal kazanç (sesin içindeki karışım).
   * Ses: db = sesin bütün düzeyi (dB); ölçülen yükseklik (LUFS-M, orta) dört kademede ve 8 LU içinde kalsın diye ayarlandı (tur-20261117c/ses.md). */
  var SESLER = {
    tik: { ne: 'Sekme ya da bağlantıyla başka sayfaya geçince; halkada bir yer seçilince', oncelik: 1, db: 7.8, katman: [
      { tip: 'hisirti', f: 2600, q: 1, t: 0, atak: 0.002, sure: 0.02, g: 0.5 },
      { tip: 'ton', nota: 'A5', egim: 200, t: 0, atak: 0.002, sure: 0.055, g: 0.26, tini: 'tahta' }] },
    sec: { ne: 'Bir seçenek seçilince (ayar tercihi, açılır liste, sınav şıkkı)', oncelik: 1, db: 8.8, katman: [
      { tip: 'hisirti', f: 3800, q: 1.2, t: 0, atak: 0.002, sure: 0.016, g: 0.35 },
      { tip: 'ton', nota: 'B5', t: 0, atak: 0.002, sure: 0.05, g: 0.23, tini: 'tahta' }] },
    ac: { ne: 'Yerler halkası açılınca', oncelik: 2, db: 6.5, katman: [
      { tip: 'hisirti', f: 700, f2: 2200, q: 0.9, t: 0, atak: 0.07, sure: 0.24, g: 0.0756, yanki: 0.3 },
      { tip: 'ton', nota: 'D5', nota2: 'A5', t: 0, atak: 0.04, sure: 0.24, g: 0.0378, ayri: 3, yanki: 0.3 },
      { tip: 'ton', nota: 'A5', t: 0.06, atak: 0.004, sure: 0.3, g: 0.0185, tini: 'cam', yanki: 0.4 }] },
    bas: { ne: 'Ana düğmeye basılınca (bağlantı ve gönder düğmeleri hariç: onların kendi sesi var)', oncelik: 1, db: 6.1, katman: [
      { tip: 'hisirti', f: 1500, q: 0.8, t: 0, atak: 0.002, sure: 0.026, g: 0.37 },
      { tip: 'ton', nota: 'D5', egim: 250, t: 0, atak: 0.002, sure: 0.09, g: 0.257, tini: 'tahta' }] },
    acik: { ne: 'Aç/kapa anahtarı açılınca (onay kutusu, basılı düğme, Açık seçeneği)', oncelik: 2, db: 8.4, katman: [
      { tip: 'hisirti', f: 3600, q: 1.4, t: 0, atak: 0.002, sure: 0.015, g: 0.0904 },
      { tip: 'ton', nota: 'E5', t: 0, atak: 0.002, sure: 0.07, g: 0.0565, tini: 'tahta' },
      { tip: 'ton', nota: 'A5', t: 0.055, atak: 0.002, sure: 0.11, g: 0.0621, tini: 'tahta' }] },
    kapali: { ne: 'Aç/kapa anahtarı kapanınca: aynı iki nota, inen ve daha koyu', oncelik: 2, db: 8.3, katman: [
      { tip: 'hisirti', f: 2400, q: 1.4, t: 0, atak: 0.002, sure: 0.015, g: 0.0854 },
      { tip: 'ton', nota: 'A5', t: 0, atak: 0.002, sure: 0.07, g: 0.0549 },
      { tip: 'ton', nota: 'E5', t: 0.055, atak: 0.002, sure: 0.11, g: 0.061 }] },
    kayit: { ne: 'Not, kayıt, açık uçlu cevap ya da sayı ayarı kaydedilince', oncelik: 3, db: 5.1, katman: [
      { tip: 'ton', nota: 'A5', t: 0, atak: 0.003, sure: 0.22, g: 0.0636, tini: 'cam', ayri: 2, yanki: 0.2 },
      { tip: 'ton', nota: 'D6', t: 0.07, atak: 0.003, sure: 0.34, g: 0.053, tini: 'cam', yanki: 0.25 }] },
    dogru: { ne: 'Soruya doğru cevap verilince', oncelik: 4, db: 3.3, katman: [
      { tip: 'ton', nota: 'A5', t: 0, atak: 0.003, sure: 0.28, g: 0.0588, tini: 'cam', ayri: 2, yanki: 0.25 },
      { tip: 'ton', nota: 'D6', t: 0.085, atak: 0.003, sure: 0.48, g: 0.0637, tini: 'cam', ayri: 2, yanki: 0.3 }] },
    yanlis: { ne: 'Yanlış cevapta ya da geçilemeyen kapıda: alçak, yumuşak, inen; cezalandırmaz', oncelik: 4, db: 5.3, katman: [
      { tip: 'ton', nota: 'B4', t: 0, atak: 0.005, sure: 0.2, g: 0.0504, tini: 'tahta', ayri: 2, yanki: 0.15 },
      { tip: 'ton', nota: 'F#4', t: 0.11, atak: 0.005, sure: 0.32, g: 0.0504, ayri: 2, yanki: 0.2 }] },
    ders: { ne: 'Ders «okudum» ile bitince: dört notalı çan', oncelik: 5, db: 1, katman: [
      { tip: 'ton', nota: 'D5', t: 0, atak: 0.003, sure: 0.5, g: 0.045, tini: 'cam', ayri: 2, yanki: 0.3 },
      { tip: 'ton', nota: 'F#5', t: 0.09, atak: 0.003, sure: 0.5, g: 0.045, tini: 'cam', ayri: 2, yanki: 0.3 },
      { tip: 'ton', nota: 'A5', t: 0.18, atak: 0.003, sure: 0.55, g: 0.045, tini: 'cam', ayri: 2, yanki: 0.3 },
      { tip: 'ton', nota: 'D6', t: 0.27, atak: 0.003, sure: 1.0, g: 0.055, tini: 'cam', ayri: 2, yanki: 0.35 }] },
    kapi: { ne: 'Kapı (ünite sınavı) geçilince: alçak gövde, yükselen akor, hava', oncelik: 6, db: -2.7, katman: [
      { tip: 'ton', nota: 'D4', t: 0, atak: 0.012, sure: 1.3, g: 0.0816, ayri: 3, yanki: 0.3 },
      { tip: 'ton', nota: 'D5', t: 0, atak: 0.003, sure: 0.7, g: 0.0544, tini: 'cam', ayri: 2, yanki: 0.4 },
      { tip: 'ton', nota: 'A5', t: 0.07, atak: 0.003, sure: 0.8, g: 0.0544, tini: 'cam', ayri: 2, yanki: 0.4 },
      { tip: 'ton', nota: 'D6', t: 0.14, atak: 0.003, sure: 0.9, g: 0.0571, tini: 'cam', ayri: 2, yanki: 0.45 },
      { tip: 'ton', nota: 'F#6', t: 0.21, atak: 0.003, sure: 1.2, g: 0.0476, tini: 'cam', ayri: 2, yanki: 0.5 },
      { tip: 'hisirti', f: 4500, f2: 7000, q: 0.7, t: 0.05, atak: 0.15, sure: 0.5, g: 0.0272, yanki: 0.6 }] },
    uyari: { ne: 'Kayıt olmadı ya da girilen değer geçersiz: iki alçak, kısa vuruş', oncelik: 4, db: 4.6, katman: [
      { tip: 'ton', nota: 'A4', t: 0, atak: 0.004, sure: 0.12, g: 0.0868, tini: 'tahta' },
      { tip: 'ton', nota: 'A4', t: 0.14, atak: 0.004, sure: 0.18, g: 0.0744, tini: 'tahta', yanki: 0.15 }] },
    king: { ne: 'Başbuğ\'un cevabı gelince (çok hafif)', oncelik: 2, db: 6.6, katman: [
      { tip: 'ton', nota: 'B5', t: 0, atak: 0.004, sure: 0.26, g: 0.048, tini: 'cam', yanki: 0.4 },
      { tip: 'ton', nota: 'F#6', t: 0.06, atak: 0.004, sure: 0.32, g: 0.0288, yanki: 0.5 }] },
    bildirim: { ne: 'Bildirim (basbug-ses olayıyla; kullanıcı eylemi beklemez)', oncelik: 3, db: 3.6, katman: [
      { tip: 'ton', nota: 'D6', t: 0, atak: 0.003, sure: 0.34, g: 0.055, tini: 'cam', ayri: 2, yanki: 0.3 },
      { tip: 'ton', nota: 'A5', t: 0.12, atak: 0.003, sure: 0.46, g: 0.055, tini: 'cam', ayri: 2, yanki: 0.35 }] }
  };
  /* Tını: vurulan bir cismin kısmi sesleri [oran, pay, sönüm çarpanı]; üst kısmiler daha çabuk söner (gerçek tahta/cam gibi),
   * böylece atak parlak, kuyruk yuvarlak sinüs olur. 8 kHz üstü kısmi çalınmaz (tizlik ve takma yok). Belirtilmezse 'yumusak'. */
  var TINI = {
    yumusak: [[1, 1, 1], [2, 0.06, 0.4]],
    tahta: [[1, 1, 1], [3.93, 0.2, 0.22], [9.4, 0.04, 0.1]], // marimba/kalimba: tok, kısa
    cam: [[1, 1, 1], [2, 0.16, 0.5], [3, 0.06, 0.3], [5.04, 0.025, 0.16]] // çan/cam: berrak, uzun
  };
  var KATALOG = Object.keys(SESLER);
  function katmanlar(tur) { return SESLER[tur] ? SESLER[tur].katman.map(function (k) { return Object.assign({}, k); }) : []; }
  function sure(tur) { return katmanlar(tur).reduce(function (m, k) { return Math.max(m, k.t + k.sure); }, 0); }

  // Hız sınırı: 60 ms içinde eşit ya da daha az önemli ses çalmaz (art arda tıklama); daha önemlisi (tık sonrası çan) çalar.
  function izin(son, tur, simdi) {
    if (!SESLER[tur]) return false;
    return !son || simdi - son.t >= ARA_MS || SESLER[tur].oncelik > SESLER[son.tur].oncelik;
  }
  var DUZEY = { kisik: 0.3, orta: 0.6, yuksek: 1 }, ARTI = 2.6; // tok ses aynı genlikte daha kısık duyulur: 2 → 2,6 // ARTI: katalog kazançlarını ölçülen düzeye taşır (tur-20261116b/ses.md)
  function duzeyKazanci(d) { return DUZEY[d] || DUZEY.orta; }

  // Sessiz saatler: {acik, bas:'22:00', bit:'07:00'}; aralık gece yarısını geçebilir
  function susmali(sessiz, t) {
    if (!sessiz || !sessiz.acik) return false;
    var dk = function (s) { var p = String(s || '').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); };
    var a = dk(sessiz.bas), b = dk(sessiz.bit), n = t.getHours() * 60 + t.getMinutes();
    return a === b ? false : a < b ? n >= a && n < b : n >= a || n < b;
  }

  /* Ses çizgesi (canlı bağlam da çevrimdışı ölçüm de aynısını kullanır): kaynaklar → yol (kuru) + yankı gönderi → alçak kesici → sıcaklık rafı → sınırlayıcı → çıkış. */
  function zincir(c, kazanc) {
    var yol = c.createGain(); yol.gain.value = kazanc * ARTI;
    var alt = c.createBiquadFilter(); alt.type = 'highpass'; alt.frequency.value = 70; alt.Q.value = 0.6; // dizüstü hoparlörün çıkaramadığı uğultu ve DC
    var raf = c.createBiquadFilter(); raf.type = 'highshelf'; raf.frequency.value = 1800; raf.gain.value = -10; // tiz kesilir: ses tok ve sıcak kalır
    var sin = c.createDynamicsCompressor(); sin.threshold.value = -8; sin.knee.value = 4; sin.ratio.value = 12; sin.attack.value = 0.001; sin.release.value = 0.12;
    var sr = c.sampleRate, n = Math.round(sr * 1.0), b = c.createBuffer(2, n, sr), on = Math.round(sr * 0.008), T60 = 0.85;
    for (var k = 0; k < 2; k++) { // küçük oda: 8 ms ön gecikme, 4 ms yumuşak giriş, üstel sönüm; kuyruk zamanla koyulaşır (havanın tizi yutması); iki kanal ayrı
      var v = b.getChannelData(k), s = 0;
      for (var i = on; i < n; i++) {
        var t = (i - on) / sr, a = 0.3 + 0.62 * Math.min(1, t / T60); // tek kutuplu alçak geçiren: kuyrukta kesim ~5 kHz'den ~300 Hz'e iner
        s = s * a + (Math.random() * 2 - 1) * (1 - a);
        v[i] = s * Math.sqrt((1 + a) / (1 - a)) * Math.exp(-t * 6.9 / T60) * Math.min(1, t / 0.004) * 0.45; // süzgeç gücü yitirmesin: düzey yalnız sönümle iner
      }
    }
    var yanki = c.createConvolver(); yanki.buffer = b;
    var islak = c.createGain(); islak.gain.value = 0.35;
    yanki.connect(islak); islak.connect(yol); yol.connect(alt); alt.connect(raf); raf.connect(sin); sin.connect(c.destination);
    var g = c.createBuffer(1, Math.round(sr * 0.5), sr), gv = g.getChannelData(0);
    for (var j = 0; j < gv.length; j++) gv[j] = Math.random() * 2 - 1;
    return { c: c, yol: yol, yanki: yanki, gurultu: g };
  }
  // Tok ses (2026-11-18, sahip: «sesler çok tiz, tok ve güzel olsun»): katalog aynı kalır, çalarken her nota iki oktav iner
  // (perde düzeni bozulmaz), 140 Hz'in altına inen nota bir oktav yukarıda kalır (dizüstü hoparlör çıkaramaz); dokunuş gürültüsü koyulaşır, sesler biraz uzar.
  var TOK_EN_AZ = 140, TOK_GURULTU = 0.35, TOK_SURE = 1.35;
  function tok(f) { var g = f / 4; while (g < TOK_EN_AZ) g *= 2; return g; }
  function zarf(p, tepe, atak, sure, b) { // kısa doğrusal atak (sıfırdan: tık yok), doğal üstel sönüm; sürenin sonunda tepenin ~1/1000'i
    p.setValueAtTime(0, b); p.linearRampToValueAtTime(tepe, b + atak); p.setTargetAtTime(0, b + atak, Math.max(0.002, (sure - atak) / 7));
  }
  function cal1(z, tur, bas) {
    var c = z.c, ses = SESLER[tur], hepsi = c.createGain();
    hepsi.gain.value = Math.pow(10, (ses.db || 0) / 20); hepsi.connect(z.yol);
    var yankiGir = c.createGain(); yankiGir.connect(z.yanki); yankiGir.gain.value = hepsi.gain.value;
    katmanlar(tur).forEach(function (k) {
      var b = bas + k.t, g = c.createGain(), son = b + k.sure * TOK_SURE + 0.02;
      g.gain.value = 1; g.connect(hepsi);
      if (k.yanki) { var y = c.createGain(); y.gain.value = k.yanki; g.connect(y); y.connect(yankiGir); }
      if (k.tip === 'hisirti') {
        var src = c.createBufferSource(), s = c.createBiquadFilter(), e = c.createGain();
        src.buffer = z.gurultu; s.type = 'bandpass'; s.Q.value = k.q; s.frequency.setValueAtTime(k.f * TOK_GURULTU, b);
        if (k.f2) s.frequency.exponentialRampToValueAtTime(k.f2 * TOK_GURULTU, b + k.sure);
        zarf(e.gain, k.g, k.atak, k.sure, b);
        src.connect(s); s.connect(e); e.connect(g); src.start(b, Math.random() * 0.4); src.stop(son);
        return;
      }
      var f = tok(hz(k.nota)), f2 = k.nota2 ? tok(hz(k.nota2)) : 0, ksure = k.sure * TOK_SURE;
      // ayri: iki ses hafif aralıklı ve sağa-sola açık (genişlik; çok küçük aralık: titreşim duyulmaz); yoksa tek ses ortada
      var sesler = k.ayri ? [[-k.ayri / 2, -0.35], [k.ayri / 2, 0.35]] : [[0, 0]];
      sesler.forEach(function (sv) {
        var p = c.createStereoPanner(); p.pan.value = sv[1]; p.connect(g);
        (TINI[k.tini] || TINI.yumusak).forEach(function (ks, i) {
          if (f * ks[0] > 8000) return;
          var o = c.createOscillator(), og = c.createGain(), fo = f * ks[0];
          o.detune.value = sv[0];
          o.frequency.setValueAtTime(k.egim ? fo * Math.pow(2, k.egim / 1200) : fo, b);
          if (k.egim) o.frequency.exponentialRampToValueAtTime(fo, b + 0.03);
          if (f2) o.frequency.exponentialRampToValueAtTime(f2 * ks[0], b + ksure * 0.6);
          // kısminin payı perde yükseldikçe azalır (tiz notalarda üst kısmi kulağı tırmalamasın); atak da üst kısmide biraz daha kısa
          zarf(og.gain, k.g * ks[1] * (i ? Math.min(1, 700 / f) : 1) / sesler.length, i ? Math.max(0.001, k.atak * 0.7) : k.atak, ksure * ks[2], b);
          o.connect(og); og.connect(p); o.start(b); o.stop(son);
        });
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

  var Ses = { TINI: TINI, katmanlar: katmanlar, sure: sure, hz: hz, izin: izin, susmali: susmali, duzeyKazanci: duzeyKazanci,
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
  // Gönderme: kapı formunda kabuk.js'in 'tamam'ı kapı sesi olur, geçilemezse yumuşak 'yanlis'; Başbuğ'da cevap gelince 'king';
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
