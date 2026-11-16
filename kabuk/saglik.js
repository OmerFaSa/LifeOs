/* LIFEOS.Kabuk.Saglik — Sağlık panosu (#/saglik; 2026-11-16, sahibin isteği: «Sağlık sayfası yalnız dört bağlantı; sade bir pano»).
 * Üç parça, yukarıdan aşağı: Bugün (son öğün, hareket, gece uykusu, kilo; kayıt yoksa «henüz kayıt yok» ve tek dokunuşla Kayıt'ın o türü),
 * Son 7 gün (yalnız kaydı olan ölçüler; kayıtsız gün «·», sıfır değil) ve Tahliller (belirteç başına değerlerin zaman içindeki listesi),
 * en altta dört alanın dersleri. Her sayı Kayıt motorundan ve kesinlik etiketiyle gelir (AGENTS §1.2); burada sayı üretilmez.
 * Sıfır bağımlılık; tarayıcıda Kabuk.ek.saglik (kabuk.js rota()), Node'da module.exports (saf kısım: pano, cubuk). kabuk.js'ten ÖNCE yüklenir. */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};

  /* ---------------- saf ---------------- */
  var BLOK = '▁▂▃▄▅▆▇█';
  // Yedi günün küçük eğilimi: değer en büyüğe göre sekiz basamaktan biri, kayıtsız gün «·». Hiç kayıt yoksa null.
  function cubuk(degerler) {
    var l = degerler.filter(function (v) { return v != null; });
    if (!l.length) return null;
    var en = Math.max.apply(null, l), az = Math.min.apply(null, l);
    // kilo gibi dar aralıklı ölçü düz çizgi olmasın: en küçükten en büyüğe yayılır; hepsi aynıysa orta basamak
    return degerler.map(function (v) { return v == null ? '·' : BLOK[en === az ? 3 : Math.round((v - az) / (en - az) * 7)]; }).join('');
  }
  function yaz(v) { return String(Math.round(v * 10) / 10).replace('.', ','); }
  // Panonun verisi; bütün sayılar motorun {v, k} değeriyle. kayitlar: lifeos.kayit.kayitlar, bugun: 'YYYY-AA-GG'.
  function pano(Kayit, kayitlar, bugun) {
    var l = kayitlar || [], Y = Kayit.yardimci, g = Kayit.gunluk(l, bugun), og = Y.turde(l, 'ogun', bugun), son = og[og.length - 1];
    var kl = Y.turde(l.filter(function (r) { return r.gun <= bugun; }), 'kilo'), sk = kl[kl.length - 1], kd = Kayit.deger(sk, 'kg');
    var icerik = son && son.ek && son.ek.icerik ? String(son.ek.icerik) : '';
    var bugunS = [
      { id: 'ogun', ad: 'Öğün', tur: 'ogun', d: g.ogun.sayi, metin: og.length ? og.length + ' öğün' + (icerik ? ' · son: ' + (icerik.length > 40 ? icerik.slice(0, 39) + '…' : icerik) : '') : null },
      { id: 'hareket', ad: 'Hareket', tur: 'hareket', d: g.hareket.dk, metin: g.hareket.dk.v != null ? yaz(g.hareket.dk.v) + ' dk' + (g.hareket.seans > 1 ? ' · ' + g.hareket.seans + ' seans' : '') : null },
      { id: 'uyku', ad: 'Gece uykusu', tur: 'uyku', d: g.uyku.gece, metin: g.uyku.gece.v != null ? yaz(g.uyku.gece.v) + ' saat' : null },
      { id: 'kilo', ad: 'Kilo', tur: 'kilo', d: kd, gun: sk ? sk.gun : null, metin: kd.v != null ? yaz(kd.v) + ' kg' : null }];
    var h = Kayit.haftalik(l, bugun), olc = function (x, t, a) { return x.olcum[t] ? x.olcum[t][a] : { v: null, k: 'missing' }; };
    var egilim = [
      { ad: 'Öğün', birim: 'öğün', ort: true, d: h.gunler.map(function (x) { return x.ogun.sayi; }) },
      { ad: 'Hareket', birim: 'dk', ort: true, d: h.gunler.map(function (x) { return x.hareket.dk; }) },
      { ad: 'Gece uykusu', birim: 'saat', ort: true, d: h.gunler.map(function (x) { return x.uyku.gece; }) },
      { ad: 'Kilo', birim: 'kg', ort: false, d: h.gunler.map(function (x) { return olc(x, 'kilo', 'kg'); }) }
    ].map(function (x) {
      var var_ = x.d.filter(function (v) { return v.v != null; }), ks = var_.map(function (v) { return v.k; });
      if (!var_.length) return null;
      var toplam = var_.reduce(function (t, v) { return t + v.v; }, 0);
      return { ad: x.ad, cubuk: cubuk(x.d.map(function (v) { return v.v; })), gun: var_.length,
        // ortalama motorun birleşik kuralıyla etiketlenir (türetilmiş sayı); kilo son değerdir, kendi etiketiyle
        ozet: x.ort ? { metin: 'ort. ' + yaz(toplam / var_.length) + ' ' + x.birim, k: Kayit.birlesik(ks) } : { metin: 'son ' + yaz(var_[var_.length - 1].v) + ' ' + x.birim, k: var_[var_.length - 1].k } };
    }).filter(Boolean);
    return { bugun: bugunS, egilim: egilim, tahliller: Kayit.tahliller(l), bas: h.bas };
  }

  var Saglik = { pano: pano, cubuk: cubuk };
  Kabuk.Saglik = Saglik;
  if (typeof module !== 'undefined' && module.exports) module.exports = Saglik;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var KONUM = { alt: 'aralığın altında', ic: 'aralıkta', ust: 'aralığın üstünde' };
  function gunYaz(g) { return new Date(g + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function kayitYolu(tur) { return '#/motor/kayit/tur/' + tur; }
  function sayfa(yer) {
    var I = Kabuk.ic, B = Kabuk.Bilesen, Kayit = L.Motor && L.Motor.Kayit, A = Kabuk.Arac, H = Kabuk.Harita, E = Kayit && Kayit.ETIKET;
    var bas = I.ust(I.kirinti(yer)) + '<div class="govde" data-saglik>' + B.baslik({ metin: 'Sağlık', alt: 'Bugün ve son yedi gün.' });
    var alanlar = H.dalinYerleri('saglik'), ren = I.alanRenk || {};
    var dersler = B.bolum({ baslik: 'Dersler', govde: B.liste({ ad: 'Sağlık alanları', ogeler: alanlar.map(function (y) { return { ad: y.ad, not: y.aciklama, href: y.yol, simge: ren[y.id] ? y.id : null, renk: ren[y.id] }; }) }) });
    if (!Kayit || !A) return bas + B.bos({ baslik: 'Kayıtlar bu açılışta okunamadı.', metin: 'Sayfayı yenile.' }) + dersler + '</div>';
    var l; try { l = JSON.parse(I.depo.getItem('lifeos.kayit.kayitlar')); } catch (e) { l = null; }
    var p = pano(Kayit, Array.isArray(l) ? l : [], A.gunAdi(Date.now()));
    var bugunH = B.liste({ ad: 'Bugün', ogeler: p.bugun.map(function (x) {
      return x.metin ? { ad: x.ad, not: x.metin + (x.gun && x.gun !== A.gunAdi(Date.now()) ? ' · ' + gunYaz(x.gun) : ''), pul: E[x.d.k], uzun: true,
        eylemler: [{ metin: 'Ekle', tur: 'sade', etiket: x.ad + ' kaydı ekle', href: kayitYolu(x.tur) }] }
        : { ad: x.ad, not: 'Henüz kayıt yok', eylemler: [{ metin: 'Kaydet', tur: 'ikincil', etiket: x.ad + ' kaydet', href: kayitYolu(x.tur) }] };
    }) });
    var egilimH = p.egilim.length ? B.bolum({ baslik: 'Son 7 gün', govde: [B.liste({ ad: 'Son 7 gün', ogeler: p.egilim.map(function (x) {
      return { ad: x.ad, not: x.cubuk + '  ' + x.ozet.metin + ' · ' + x.gun + '/7 gün kayıtlı', pul: E[x.ozet.k], uzun: true };
    }) }), '<p class="soluk">Soldan sağa ' + gunYaz(p.bas) + ' – bugün. Nokta: o gün kayıt yok; sıfır değildir.</p>'] }) : '';
    var tahlilH = B.bolum({ baslik: 'Tahliller', eylem: p.tahliller.length ? { metin: 'Tahlil ekle', tur: 'sade', href: kayitYolu('tahlil') } : null,
      govde: p.tahliller.length ? p.tahliller.map(function (t) {
        var s = t.son, sat = function (x) { return String(x.deger.v).replace('.', ',') + (x.birim ? ' ' + x.birim : '') + (x.konum ? ' · ' + KONUM[x.konum] : ''); };
        return B.acilir({ baslik: t.belirtec, duzey: 3, not: sat(s) + ' · ' + gunYaz(s.gun), govde: B.liste({ ad: t.belirtec + ' değerleri', ogeler: t.degerler.slice().reverse().map(function (x) {
          return { ad: gunYaz(x.gun), not: sat(x) + (x.ref ? ' (aralık ' + (x.ref.alt != null ? String(x.ref.alt).replace('.', ',') : '…') + '–' + (x.ref.ust != null ? String(x.ref.ust).replace('.', ',') : '…') + ')' : ''), pul: E[x.deger.k], uzun: true };
        }) }) });
      }).join('') : B.bos({ baslik: 'Henüz tahlil kaydı yok.', metin: 'Sonuç kâğıdındaki değeri belirteciyle yaz; zamanla değişimini burada görürsün.', eylem: { metin: 'Tahlil ekle', tur: 'ana', href: kayitYolu('tahlil') } }) });
    return bas + B.bolum({ baslik: 'Bugün', govde: bugunH }) + egilimH + tahlilH + dersler + '</div>';
  }
  Kabuk.ek = Kabuk.ek || {};
  Kabuk.ek.saglik = sayfa;
})(typeof window !== 'undefined' ? window : globalThis);
