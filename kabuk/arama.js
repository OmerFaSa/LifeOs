/* LIFEOS.Kabuk.Arama — «Her şeyde arama» (#/motor/arama): on alanın dersleri (bütün aşamalar: başlık, ders metni,
 * alıştırma soruları), notlar (Not motorunun kendi araması), Tekrar kartları (ön ve arka yüz), Plan (bugünün blokları,
 * işler, sabit bloklar), metin alanı olan kayıtlar ve komut çubuğunun bildiği yerler ve ayarlar. Yerel ve ağsız; katlama kabuğunkidir (Kabuk.katla: ç ğ ı İ ö ş ü).
 * Ders dizini ilk aramada bir kez kurulur; onay değişip bir aşama yeniden kurulursa yalnız o zaman yenilenir.
 * Özel notlar da aranır (sahibin kendi ekranı); bu sayfa hiçbir şeyi King'e ya da ağa vermez.
 * Saf kısım Node'da test edilir (kabuk/kabuk.test.js); sayfa yalnız tarayıcıda. kabuk.js'ten ÖNCE yüklenir. */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  function katla(s) { return Kabuk.katla(s); } // kabuk.js'te tanımlı; çağrı anında hazır
  function kelimeler(q) { return katla(q).split(/[^\p{L}\p{N}]+/u).filter(Boolean); }
  function kelimeBasi(s, k) { var i = s.indexOf(k); return i === 0 || /[^\p{L}\p{N}]/u.test(s.charAt(i - 1)); }
  // Eşleşmenin çevresi (en çok ~140 harf). Katlama harf sayısını çoğu zaman korur; kaymada parça yaklaşık kalır.
  function parca(metin, k) {
    var i = katla(metin).indexOf(k);
    if (i < 0) return '';
    var bas = Math.max(0, i - 40), son = Math.min(metin.length, i + 100);
    return (bas ? '…' : '') + metin.slice(bas, son).replace(/\s+/g, ' ').trim() + (son < metin.length ? '…' : '');
  }

  /* Ders dizini. alanlar: [{ id, ad, ys: [Yol.yukle çıktısı, aşama sırasıyla] }]. Satır: ders başına bir. */
  function dersDizini(Yol, alanlar) {
    var l = [];
    alanlar.forEach(function (a) {
      (a.ys || []).forEach(function (y, j) {
        y.veri.uniteler.forEach(function (u) {
          (u.dersler || []).forEach(function (d) {
            var metin = (d.metin || []).join('\n'), sorular = (d.alistirmalar || []).map(function (x) { return x.soru || ''; }).join('\n');
            l.push({ alan: a.id, alanAd: a.ad, n: j + 1, id: d.id, ad: d.ad, unite: u.ad, ozet: d.ozet || '', metin: metin, sorular: sorular,
              taslak: Yol.etiket(d) === 'taslak', k: { ad: katla(d.ad), ozet: katla(d.ozet), metin: katla(metin), soru: katla(sorular) } });
          });
        });
      });
    });
    return l;
  }
  /* Ders araması: her kelime başlıkta, özette, metinde ya da alıştırma sorusunda geçmeli (VE).
   * Puan: başlık 10 (+5 kelime başı), özet 4, metin 2, soru 1; tam başlık +30. Eşitlikte alan sırası ve ders sırası (dizin sırası). */
  function dersAra(dizin, sorgu, sinir) {
    var ks = kelimeler(sorgu), q = ks.join(' '), out = [];
    if (!ks.length) return { sonuclar: [], toplam: 0 };
    dizin.forEach(function (x, sira) {
      var p = 0;
      for (var i = 0; i < ks.length; i++) {
        var k = ks[i], b = x.k.ad.indexOf(k) >= 0, o = x.k.ozet.indexOf(k) >= 0, m = x.k.metin.indexOf(k) >= 0, s = x.k.soru.indexOf(k) >= 0;
        if (!b && !o && !m && !s) return;
        p += (b ? 10 + (kelimeBasi(x.k.ad, k) ? 5 : 0) : 0) + (o ? 4 : 0) + (m ? 2 : 0) + (s ? 1 : 0);
      }
      if (x.k.ad === q) p += 30;
      out.push({ x: x, p: p, sira: sira });
    });
    out.sort(function (a, b) { return b.p - a.p || a.sira - b.sira; });
    return { toplam: out.length, sonuclar: out.slice(0, sinir || 20).map(function (r) {
      var x = r.x, k = ks.filter(function (w) { return x.k.ad.indexOf(w) < 0; })[0] || ks[0];
      // parça: başlıkta olmayan ilk kelimenin geçtiği yer (özet → metin → soru); hepsi başlıktaysa özet
      var pr = x.k.ozet.indexOf(k) >= 0 ? x.ozet : x.k.metin.indexOf(k) >= 0 ? parca(x.metin, k) : x.k.soru.indexOf(k) >= 0 ? 'Alıştırma: ' + parca(x.sorular, k) : x.ozet;
      return { tur: 'ders', id: x.id, ad: x.ad, alan: x.alan, alanAd: x.alanAd, n: x.n, unite: x.unite, taslak: x.taslak, parca: pr, yol: '#/alan/' + x.alan + '/ders/' + x.id };
    }) };
  }
  /* Kayıt araması: yalnız metin alanı (r.ek) olan kayıtlar; her kelime bir metin alanında geçmeli. Yeni kayıt önce. */
  function kayitAra(kayitlar, sorgu, sinir) {
    var ks = kelimeler(sorgu);
    if (!ks.length) return { sonuclar: [], toplam: 0 };
    var l = (kayitlar || []).filter(function (r) {
      var m = katla(Object.keys(r.ek || {}).map(function (a) { return r.ek[a]; }).join(' '));
      return m && ks.every(function (k) { return m.indexOf(k) >= 0; });
    }).sort(function (a, b) { return (b.zaman || 0) - (a.zaman || 0) || (a.id < b.id ? -1 : 1); });
    return { toplam: l.length, sonuclar: l.slice(0, sinir || 10) };
  }
  /* Kart araması (Tekrar): her kelime ön ya da arka yüzde geçmeli. Ön yüzde geçen önce (kelime başı 2 fazla), eşitlikte kayıt sırası.
   * Arkada geçen kelimenin çevresi «Cevap: …» parçası olur. Kapıda kalınan soru, içerik onaylanana kadar taslaktır (Tekrar'ın kuralı).
   * Bağlantı kartın kendisini açar (#/motor/tekrar/kart/<kimlik>). */
  function kartAra(kartlar, sorgu, sinir) {
    var ks = kelimeler(sorgu), out = [];
    if (!ks.length) return { sonuclar: [], toplam: 0 };
    (kartlar || []).forEach(function (x, sira) {
      if (!x || !x.id) return;
      var on = katla(x.on), arka = katla(x.arka), p = 0;
      for (var i = 0; i < ks.length; i++) {
        var o = on.indexOf(ks[i]) >= 0, a = arka.indexOf(ks[i]) >= 0;
        if (!o && !a) return;
        p += (o ? 4 + (kelimeBasi(on, ks[i]) ? 2 : 0) : 0) + (a ? 1 : 0);
      }
      out.push({ x: x, p: p, sira: sira });
    });
    out.sort(function (a, b) { return b.p - a.p || a.sira - b.sira; });
    return { toplam: out.length, sonuclar: out.slice(0, sinir || 10).map(function (r) {
      var x = r.x, k = ks.filter(function (w) { return katla(x.on).indexOf(w) < 0; })[0];
      return { tur: 'kart', id: x.id, ad: String(x.on || ''), parca: k ? 'Cevap: ' + parca(String(x.arka || ''), k) : '', taslak: x.kaynak === 'kapi' && x.icerik !== 'onayli',
        yol: '#/motor/tekrar/kart/' + encodeURIComponent(x.id) };
    }) };
  }
  /* Plan araması: bugünün planındaki bloklar (mola ve sabit hariç; sabitler şablondan), plandaki işler (bugünün bloğu olan iş tekrar
   * yazılmaz) ve hafta şablonundaki sabit bloklar; ad üzerinden, her kelime geçmeli. plan: lifeos.plan.durum (gün devri uygulanmış),
   * sablon: lifeos.plan.sablon, bugun: YYYY-AA-GG; başka günün kalmış planı aranmaz. Blok ve iş bugünün planını, sabit blok hafta planını açar. */
  var GUN_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  function planAra(plan, sablon, bugun, sorgu, sinir) {
    var ks = kelimeler(sorgu), l = [], blokta = {};
    if (!ks.length) return { sonuclar: [], toplam: 0 };
    var tut = function (ad) { var a = katla(ad); return a && ks.every(function (k) { return a.indexOf(k) >= 0; }); };
    var gp = plan && plan.gunPlan && plan.gunPlan.gun === bugun && plan.gunPlan.plan;
    ((gp && gp.bloklar) || []).forEach(function (b) {
      blokta[b.kaynakId || b.id] = true;
      if (b.tur !== 'mola' && b.tur !== 'sabit' && tut(b.ad)) l.push({ tur: 'plan', id: b.id, ad: b.ad, not: 'Bugünün planı · ' + b.bas + '–' + b.bit, yol: '#/motor/plan' });
    });
    ((plan && plan.isler) || []).forEach(function (x) {
      if (x && !blokta[x.id] && tut(x.ad)) l.push({ tur: 'plan', id: x.id, ad: x.ad, not: 'İş · ' + x.dk + ' dk' + (x.son ? ' · son ' + x.son : ''), yol: '#/motor/plan' });
    });
    ((sablon && sablon.sabitler) || []).forEach(function (s) {
      if (s && Array.isArray(s.gunler) && tut(s.ad)) l.push({ tur: 'plan', id: s.id, ad: s.ad, yol: '#/motor/plan/hafta',
        not: 'Sabit blok · ' + s.bas + '–' + s.bit + ' · ' + (s.gunler.length === 7 ? 'her gün' : s.gunler.map(function (g) { return GUN_KISA[g]; }).join(', ')) });
    });
    return { toplam: l.length, sonuclar: l.slice(0, sinir || 10) };
  }
  /* Bütün kaynaklar tek çağrıda; her grup { tur, ad, sonuclar, toplam } (boş grup da döner, ekran atlar).
   * kaynak: { dizin (dersDizini; null = henüz kurulmadı), notlar, kartlar, plan, sablon, bugun, kayitlar, ogeler (komut çubuğunun öğeleri) }; M: { Not } */
  var SINIR = { ders: 20, not: 10, kart: 10, plan: 10, kayit: 10, yer: 8 };
  function ara(sorgu, kaynak, M) {
    var bos = !kelimeler(sorgu).length, n = bos ? [] : M.Not.ara(kaynak.notlar || [], sorgu, { sinir: 200 });
    var yerler = bos ? [] : Kabuk.ara(sorgu, (kaynak.ogeler || []).filter(function (o) { return o.yol; }), 50);
    return [
      Object.assign({ tur: 'ders', ad: 'Dersler', hazir: !!kaynak.dizin }, kaynak.dizin ? dersAra(kaynak.dizin, sorgu, SINIR.ders) : { sonuclar: [], toplam: 0 }),
      { tur: 'not', ad: 'Notlar', sonuclar: n.slice(0, SINIR.not), toplam: n.length },
      Object.assign({ tur: 'kart', ad: 'Tekrar kartları' }, kartAra(kaynak.kartlar, sorgu, SINIR.kart)),
      Object.assign({ tur: 'plan', ad: 'Plan' }, planAra(kaynak.plan, kaynak.sablon, kaynak.bugun, sorgu, SINIR.plan)),
      Object.assign({ tur: 'kayit', ad: 'Kayıtlar' }, kayitAra(kaynak.kayitlar, sorgu, SINIR.kayit)),
      { tur: 'yer', ad: 'Yerler ve ayarlar', sonuclar: yerler.slice(0, SINIR.yer), toplam: yerler.length }
    ];
  }
  // Sayfanın sorgusu adresin «?» sonrasında durur (yalnız bu tarayıcıda; adres hiçbir yere gönderilmez).
  function sorguYolu(q) { q = String(q || '').trim(); return '#/motor/arama' + (q ? '?' + encodeURIComponent(q) : ''); }

  var Arama = { dersDizini: dersDizini, dersAra: dersAra, kayitAra: kayitAra, kartAra: kartAra, planAra: planAra, ara: ara, sorguYolu: sorguYolu, SINIR: SINIR };
  Kabuk.Arama = Arama;
  if (typeof module !== 'undefined' && module.exports) module.exports = Arama;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var d = document, B = Kabuk.Bilesen, ic = function () { return Kabuk.ic; };
  function oku(anahtar) { try { var v = JSON.parse(ic().depo.getItem(anahtar)); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function okuN(anahtar) { try { var v = JSON.parse(ic().depo.getItem(anahtar)); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch (e) { return null; } }
  // Plan durumu, Plan sayfasının okuduğu gibi: gün değiştiyse devir kuralı burada yalnız okunarak uygulanır (yazmak Plan sayfasının işi)
  function planOku(bugun) {
    var v = okuN('lifeos.plan.durum'), A = Kabuk.Arac, P = L.Motor && L.Motor.Plan;
    if (!v || !v.ayar || !Array.isArray(v.isler)) return null;
    try { return A && P ? A.planGunDevri(P, v, bugun) : v; } catch (e) { return v; }
  }
  function simdi() { return kok.performance ? performance.now() : Date.now(); }
  // dizin: { ys: { alan: aşama dizisi } kurulduğu andaki aşamalar, l: satırlar }; ölçüm: son kurulumun ve son sorgunun süresi (ms)
  var dizin = null, kuruluyor = null, olcum = { dizinMs: null, sorguMs: null, ders: 0 };
  function dizinGuncel() {
    var I = ic();
    return dizin && I.tasinanlar().every(function (a) { return dizin.ys[a.id] === I.asamalar(a.id); });
  }
  function dizinKur() {
    if (dizinGuncel()) return Promise.resolve(dizin);
    if (kuruluyor) return kuruluyor;
    var I = ic(), t0 = simdi(), alanlar = I.tasinanlar();
    return (kuruluyor = Promise.all(alanlar.map(function (a) { return I.alanYukle(a.id); })).then(function () {
      var ys = {}, girdi = alanlar.map(function (a) { ys[a.id] = I.asamalar(a.id); return { id: a.id, ad: a.ad, ys: ys[a.id] || [] }; });
      dizin = { ys: ys, l: dersDizini(I.Yol, girdi) };
      olcum.dizinMs = Math.round(simdi() - t0); olcum.ders = dizin.l.length; kuruluyor = null;
      return dizin;
    }, function () { kuruluyor = null; return null; }));
  }
  function sorguOku() { var h = location.hash.split('?')[1]; try { return h ? decodeURIComponent(h) : ''; } catch (e) { return ''; } }

  function satir(g, x) {
    if (g === 'ders') return { ad: x.ad, not: x.alanAd + ' · Aşama ' + x.n + (x.parca ? ' · ' + x.parca : ''), pul: x.taslak ? { metin: 'taslak', tur: 'kesik' } : null, href: x.yol };
    if (g === 'not') return { ad: x.ad || 'Adsız not', not: x.parca || '', pul: x.ozel ? 'özel' : null, href: '#/motor/not/' + x.id };
    if (g === 'kayit') return { ad: Kabuk.Arac.kayitMetni(L.Motor.Kayit, x), not: x.gun, href: '#/motor/kayit/gun/' + x.gun };
    if (g === 'kart') return { ad: x.ad, not: x.parca || 'Tekrar kartı', pul: x.taslak ? { metin: 'taslak', tur: 'kesik' } : null, href: x.yol };
    if (g === 'plan') return { ad: x.ad, not: x.not, href: x.yol };
    return { ad: x.ad, not: x.etiket, href: x.yol };
  }
  function sonucHtml(q) {
    var I = ic(), notlar = oku('lifeos.not.kayit'), ozel = {};
    notlar.forEach(function (n) { if (n.ozel) ozel[n.id] = 1; });
    if (!kelimeler(q).length) return { html: B.bos({ baslik: 'Ne arıyorsun?', metin: 'Bir sözcük yaz: derslerin, notların, tekrar kartların, planın, kayıtların, yerler ve ayarlar birlikte aranır.' }), durum: '' };
    var bugun = Kabuk.Arac.gunAdi(Date.now());
    var t0 = simdi(), gruplar = ara(q, { dizin: dizinGuncel() ? dizin.l : null, notlar: notlar, kartlar: oku('lifeos.tekrar.kartlar'), plan: planOku(bugun), sablon: okuN('lifeos.plan.sablon'), bugun: bugun,
      kayitlar: oku('lifeos.kayit.kayitlar'), ogeler: Kabuk.komutOgeleri(Kabuk.Harita, Kabuk.Ayar) }, { Not: L.Motor.Not });
    if (gruplar[0].hazir) olcum.sorguMs = Math.round((simdi() - t0) * 10) / 10;
    var toplam = 0, html = gruplar.map(function (g) {
      toplam += g.toplam;
      if (g.tur === 'ders' && !g.hazir) return B.bolum({ baslik: g.ad, id: 'arama-ders', govde: '<p class="soluk" aria-busy="true">Dersler hazırlanıyor…</p>' });
      if (!g.toplam) return '';
      var ogeler = g.sonuclar.map(function (x) { if (g.tur === 'not') x = Object.assign({ ozel: !!ozel[x.id] }, x); return satir(g.tur, x); });
      return B.bolum({ baslik: g.ad + ' (' + g.toplam + ')', id: 'arama-' + g.tur, veri: { 'arama-grup': g.tur }, govde: [B.liste({ ad: g.ad, ogeler: ogeler }),
        g.toplam > g.sonuclar.length ? '<p class="soluk">' + g.toplam + ' sonuçtan ilk ' + g.sonuclar.length + ' tanesi; aramayı daralt.</p>' : ''] });
    }).join('');
    var hazir = gruplar[0].hazir;
    return { html: html || B.bos({ baslik: 'Bu aramaya uyan bir şey yok.', metin: 'Başka bir sözcük dene; harf farkı (ç, ğ, ı, ö, ş, ü) önemli değil.' }),
      durum: hazir ? toplam + ' sonuç' : 'Dersler hazırlanıyor' };
  }
  function ciz(q) {
    var s = sonucHtml(q), el = d.getElementById('arama-sonuc'), du = d.getElementById('arama-durum');
    if (el) el.innerHTML = s.html;
    if (du) du.textContent = s.durum;
    return s;
  }
  function sayfaArama(yer) {
    var I = ic(), q = sorguOku(), s = sonucHtml(q);
    if (!dizinGuncel()) dizinKur().then(function () { var g = d.querySelector('[data-arac="arama"] [data-her-ara]'); if (g) ciz(g.value); });
    setTimeout(function () { var g = d.querySelector('[data-her-ara]'); if (g && d.activeElement !== g) { g.focus({ preventScroll: true }); g.setSelectionRange(g.value.length, g.value.length); } }, 0);
    return I.ust(I.kirinti(yer)) + '<div class="govde" data-arac="arama">' + B.baslik({ metin: 'Her şeyde arama', alt: 'Dersler, notlar, tekrar kartları, plan, kayıtlar, yerler ve ayarlar; bu cihazda, internetsiz.' }) +
      '<form class="aramaform" role="search" novalidate>' + B.alan({ ad: 'Ara', isim: 'herSeydeAra', tur: 'arama', deger: q, yerTutucu: 'Bir sözcük yaz', veri: { 'her-ara': '' } }) + '</form>' +
      '<p id="arama-durum" class="gizli" aria-live="polite">' + I.kac(s.durum) + '</p><div id="arama-sonuc">' + s.html + '</div></div>';
  }
  Kabuk.ek = Kabuk.ek || {};
  Kabuk.ek.arama = sayfaArama;
  Arama.olcum = olcum; // gezi (tools/kabuk_gez.js) süreyi buradan okur

  d.addEventListener('input', function (e) {
    if (!e.target.matches('[data-her-ara]')) return;
    ciz(e.target.value);
    try { history.replaceState(null, '', sorguYolu(e.target.value)); } catch (x) { /* dosyadan açıldı: adres değişmez */ }
  });
  d.addEventListener('submit', function (e) { if (e.target.matches('form.aramaform')) e.preventDefault(); });
})(typeof window !== 'undefined' ? window : globalThis);
