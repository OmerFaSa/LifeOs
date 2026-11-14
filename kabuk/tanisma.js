/* LIFEOS.Kabuk.Tanisma — Tanışma ekranı (plan madde 11, sadeleşme Faz 7).
 * Dil modeli yok: sorular bir kural tablosundan gelir, «anlaşılan» yalnız açık seçimlerden ve test edilmiş
 * Türkçe desenlerden (sayı + birim, alan adı) çıkar. Desenin çözemediği yazı yorumlanmaz, «kendi sözün» olarak aynen saklanır.
 * Hiçbir şey son adımda onaylanmadan yazılmaz; onaylanan her satır panelden geri alınır (AGENTS §1: görünür, silinir, teşhis yok).
 * Kayıt biçimi (yeni sistemde kişi kaydı türü olmadığı için burada tanımlı, en küçük hâli):
 *   kişi olgusu { id, soru, konu, metin, tur: secim|desen|not|duzeltme, kesinlik: 'soz', kisi, kaynak: 'tanisma', deger?, ayar? }
 *   kesinlik 'soz' = brand/ortak/kisi.js'teki «senin sözün» katmanı; kisi = kisi.js yaşam alanı kimliği.
 *   ayar: Ayarlar › Beden satırı (kabuk/ayar.js); onayda Ayar.yaz ile şemadan geçerek yazılır.
 * Depo anahtarları: lifeos.tanisma.taslak (yarım görüşme, devam için), lifeos.tanisma.kayit (onaylanan), lifeos.tanisma.davet.
 * shortcut: kayıtlar bu tarayıcının deposunda durur; tek depoya (sistem/veri.py) P6 göçünden sonra bağlanır.
 * Sıfır bağımlılık; tarayıcıda window.LIFEOS.Kabuk.Tanisma, Node'da module.exports (yalnız saf kısım). kabuk.js'ten ÖNCE yüklenir. */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  if (typeof module !== 'undefined' && module.exports && !Kabuk.katla) { require('./harita.js'); require('./ayar.js'); require('./kabuk.js'); }
  function H() { return Kabuk.Harita; }
  function katla(s) { return Kabuk.katla(s); }
  function kopya(v) { return JSON.parse(JSON.stringify(v)); }

  /* ---------------- desenler (katlanmış metin üzerinde) ---------------- */
  var SOZ = { bir: 1, iki: 2, uc: 3, dort: 4, bes: 5, alti: 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10, yirmi: 20, otuz: 30, kirk: 40, elli: 50, altmis: 60, doksan: 90 };
  var BIRLER = 'bir|iki|uc|dort|bes|alti|yedi|sekiz|dokuz', ONLAR = 'on|yirmi|otuz|kirk|elli|altmis|doksan';
  var NUM = '(?:\\d+(?:[.,]\\d+)?|yarim|(?:(?:' + ONLAR + ')\\s+)?(?:' + BIRLER + ')|' + ONLAR + ')(?:\\s+bucuk)?';
  var BIRIM = { dakika: 'dk', dk: 'dk', saat: 'saat', sayfa: 'sayfa', gun: 'gun', kez: 'kez', kere: 'kez', defa: 'kez', sefer: 'kez', kilometre: 'km', km: 'km' };
  var SIK = { gunde: 'gun', haftada: 'hafta', ayda: 'ay', 'her gun': 'gun', 'her hafta': 'hafta' };
  var DESEN = new RegExp('(?:^|[^a-z0-9])(?:(gunde|haftada|ayda|her gun|her hafta)\\s+)?(' + NUM + ')(?:\\s*[-–]\\s*(' + NUM + '))?' +
    '(?:\\s*(' + Object.keys(BIRIM).join('|') + ')[a-z]{0,5})?(?=$|[^a-z0-9])', 'g');
  var SIK_AD = { gun: 'günde', hafta: 'haftada', ay: 'ayda' }, BIRIM_AD = { dk: 'dk', saat: 'saat', sayfa: 'sayfa', gun: 'gün', kez: 'kez', km: 'km' };
  function sayiCoz(s) {
    if (/^\d/.test(s)) return Number(s.replace(',', '.'));
    var v = 0;
    s.split(/\s+/).forEach(function (p) { v += p === 'yarim' || p === 'bucuk' ? 0.5 : SOZ[p]; });
    return v;
  }
  function sayiYaz(v) { return String(v).replace('.', ','); }
  // «haftada 2», «günde 30 dk», «bir buçuk saat», «20-30 dakika». Sıklık ya da birimden biri şart; çıplak sayı (1998) alınmaz.
  function sayilar(metin) {
    var f = katla(metin), l = [], m;
    DESEN.lastIndex = 0;
    while ((m = DESEN.exec(f))) {
      var siklik = m[1] ? SIK[m[1].replace(/\s+/g, ' ')] : null, birim = m[4] ? BIRIM[m[4]] : null;
      if (!siklik && !birim) continue;
      if (!siklik && birim === 'gun' && !/^\d/.test(m[2])) continue; // «bir gün» deyimdir, sayı değil
      if (siklik && !birim) birim = 'kez';
      var v = sayiCoz(m[2]), ust = m[3] ? sayiCoz(m[3]) : null, bas = m.index + (/^[^a-z0-9]/.test(m[0]) ? 1 : 0);
      if (ust != null && ust <= v) ust = null;
      var o = { v: v, birim: birim, siklik: siklik, bas: bas, son: m.index + m[0].length };
      if (ust != null) o.ust = ust;
      o.metin = (siklik ? SIK_AD[siklik] + ' ' : '') + sayiYaz(v) + (ust != null ? '–' + sayiYaz(ust) : '') + ' ' + BIRIM_AD[birim];
      l.push(o);
    }
    return l;
  }
  // Alan adları ve yakın sözcükleri; ek alan kök: «matematikte», «ingilizceyi», «kitapları». Olumsuz cümlecikten alan çıkmaz.
  var ANAHTAR = {
    akademik: ['akademik', 'sinav', 'tyt', 'ayt', 'yks', 'lgs', 'kpss', 'ales', 'matematik', 'fizik', 'kimya', 'biyoloji', 'geometri', 'ders'],
    dil: ['dil', 'ingilizce', 'almanca', 'fransizca', 'ispanyolca', 'italyanca', 'arapca', 'rusca', 'japonca', 'diksiyon'],
    felsefe: ['felsefe', 'mantik'],
    tarih: ['tarih'],
    muzik: ['muzik', 'gitar', 'piyano', 'keman', 'baglama', 'solfej'],
    okuma: ['okuma', 'okumak', 'kitap', 'kitab', 'roman', 'yazi', 'yazmak'],
    beslenme: ['beslenme', 'beslenmek', 'yemek', 'diyet', 'ogun', 'kilo'],
    hareket: ['hareket', 'spor', 'antrenman', 'kosu', 'kosmak', 'yuruyus', 'fitness', 'salon', 'egzersiz', 'yuzme', 'pilates', 'yoga'],
    uyku: ['uyku', 'uyumak', 'uykusuzluk'],
    tahlil: ['tahlil', 'kolesterol', 'vitamin']
  };
  var EK = /^(?:l[ae]r)?(?:[iu]?m|[iu]?n|[iu]?m[iu]z|[iu]?n[iu]z)?(?:y?[iu]|n?[iu]n|y?[ae]|[dt][ae]|[dt][ae]n|[dt][ae]ki|y?l[ae]|s[iu]|n[iu]|n[ae])?$/;
  var OLUMSUZ = /(?:^|[^a-z])(degil|istemiyorum|istemem|haric|olmasin|yok)(?=$|[^a-z])/;
  function kelimeUyar(k, a) { return k === a || (k.indexOf(a) === 0 && EK.test(k.slice(a.length))); }
  function alanBul(metin) {
    var f = katla(metin), l = [], gor = {}, m, kes = /[,.;!?\n]|\s(?:ama|fakat|ancak|ve|ile|veya)\s/g, bas = 0, parcalar = [];
    while ((m = kes.exec(f))) { parcalar.push([bas, m.index]); bas = m.index + m[0].length; }
    parcalar.push([bas, f.length]);
    parcalar.forEach(function (p) {
      var c = f.slice(p[0], p[1]), w, kr = /[a-z0-9]+/g;
      if (OLUMSUZ.test(c)) return;
      while ((w = kr.exec(c))) {
        for (var a in ANAHTAR) {
          if (ANAHTAR[a].some(function (x) { return kelimeUyar(w[0], x); })) {
            l.push({ alan: a, bas: p[0] + w.index, son: p[0] + w.index + w[0].length });
            if (!gor[a]) gor[a] = 1;
            break;
          }
        }
      }
    });
    return l;
  }
  // Ayarlar › Beden: boy (cm) ve doğum yılı; sınırlar ayar şemasından (kabuk/ayar.js), şema dışı sayı alınmaz.
  function bedenBul(metin) {
    var f = katla(metin), A = Kabuk.Ayar, r = { izler: [] }, m;
    var boyT = A.tanim('lifeos.beden.boy'), yilT = A.tanim('lifeos.beden.dogumYili');
    if ((m = /(?:^|[^0-9.,])(\d{3})\s*(?:cm|santim)/.exec(f)) || (m = /boy[a-z]*\s*:?\s*(\d{3})(?![0-9])/.exec(f))) r.boy = { v: +m[1], m: m };
    else if ((m = /(?:^|[^0-9.,])(1)[.,](\d{2})\s*(?:m|metre)?(?=$|[^0-9a-z])/.exec(f))) r.boy = { v: 100 + +m[2], m: m };
    if (r.boy && !A.dogrula(boyT, r.boy.v)) delete r.boy;
    if ((m = /(?:^|[^0-9.,])((?:19|20)\d\d)(?![0-9])/.exec(f)) && A.dogrula(yilT, +m[1])) r.dogumYili = { v: +m[1], m: m };
    ['boy', 'dogumYili'].forEach(function (k) {
      if (!r[k]) return;
      var x = r[k].m, b = x.index + (/^[^0-9a-z]/.test(x[0]) ? 1 : 0);
      r.izler.push([b, x.index + x[0].length]); r[k] = r[k].v;
    });
    return r;
  }
  // Desenlerin aldığı yerler çıkınca anlamlı söz kalıyor mu? Kalıyorsa yazı «kendi sözün» olarak aynen saklanır.
  var DOLGU = ['ve', 'ile', 'de', 'da', 'ya', 'veya', 'yaklasik', 'civari', 'civarinda', 'kadar', 'falan', 'gibi', 'ortalama', 'asagi', 'yukari', 'en', 'az'];
  function artakalanVar(metin, izler) {
    var f = katla(metin).split('');
    izler.forEach(function (z) { for (var i = z[0]; i < z[1]; i++) f[i] = ' '; });
    return f.join('').split(/[^a-z0-9]+/).some(function (w) { return w.length > 1 && DOLGU.indexOf(w) < 0; });
  }

  /* ---------------- soru tablosu ---------------- */
  var HEDEF = [['sinav', 'Bir sınava hazırlanıyorum'], ['ogrenmek', 'Yeni bir şey öğrenmek istiyorum'], ['saglik', 'Sağlığıma ve formuma dönmek istiyorum'], ['duzen', 'Günüme düzen kurmak istiyorum']];
  var SEVIYE = [['yeni', 'Yeni başlıyorum'], ['temel', 'Temelim var'], ['rahat', 'Rahatım, ilerlemek istiyorum']];
  var SURE = [['15', '15 dakika'], ['30', '30 dakika'], ['60', '1 saat'], ['120', '2 saat ya da daha çok']];
  var CINSIYET = [['kadin', 'Kadın'], ['erkek', 'Erkek'], ['belirtilmedi', 'Belirtmek istemiyorum']];
  var SAGLIK = [['yok', 'Yok']];
  function alanlar() { return H().YERLER.filter(function (y) { return y.katman === 'alan'; }); }
  function hedefAlanlari(h) {
    if (h === 'sinav') return ['akademik'];
    var dal = h === 'ogrenmek' ? 'ogren' : h === 'saglik' ? 'saglik' : null;
    return dal ? alanlar().filter(function (y) { return y.dal === dal; }).map(function (y) { return y.id; }) : [];
  }
  function tekle(l) { return l.filter(function (x, i) { return l.indexOf(x) === i; }); }
  // alan sorusunda önceden basılı gelen öneri: hedef sınavsa Akademik, sağlıksa üçü, hedef yazısında geçen alanlar. Gönderen yine kendisidir.
  function onerilenAlanlar(t) {
    var c = t.cevaplar.hedef;
    if (!c || c.atlandi) return [];
    var l = c.secim[0] === 'sinav' ? ['akademik'] : c.secim[0] === 'saglik' ? ['hareket', 'beslenme', 'uyku'] : [];
    return tekle(l.concat(alanBul(c.metin).map(function (x) { return x.alan; })));
  }
  function soru(id, t) {
    if (id === 'hedef') return { id: id, metin: 'Merhaba. Şu sıralar hayatında en çok neyi değiştirmek istiyorsun?', secenek: HEDEF, konu: 'Hedef', kisi: 'kimlik', desen: true,
      ipucu: 'Örnek: sınava hazırlanıyorum, bir de haftada 2 gün spora gidiyorum' };
    if (id === 'alanlar') return { id: id, metin: 'Hangi alanlarla başlamak istersin? Birkaç tane seçebilir ya da yazabilirsin.', coklu: true, konu: 'Başlamak istediğin alan', kisi: 'gelisim',
      secenek: alanlar().map(function (y) { return [y.id, y.ad]; }), onerilen: t ? onerilenAlanlar(t) : [], ipucu: 'Örnek: felsefe ve İngilizce' };
    var m = /^seviye:([a-z]+)$/.exec(id), y = m && H().bul(m[1]);
    if (y && y.katman === 'alan') {
      var sg = y.dal === 'saglik';
      return { id: id, alan: y.id, konu: y.ad, kisi: sg ? 'fizyoloji' : 'ogrenme', desen: true, secenek: SEVIYE,
        metin: sg ? y.ad + ' tarafında şu an neler yapıyorsun? Ne sıklıkla, nasıl yaptığını kendi sözlerinle anlat.'
          : y.ad + ' tarafında kendini nasıl görüyorsun? İstersen konu konu anlat: nerede iyisin, nerede takılıyorsun, nasıl çalışıyorsun.',
        ipucu: sg ? 'Örnek: haftada 2 gün salona gidiyorum ama düzensiz' : 'Örnek: temelim var, bazı konularda takılıyorum; günde 20 dk çalışıyorum' };
    }
    if (id === 'sure') return { id: id, metin: 'Bunlara günde ne kadar zaman ayırabilirsin?', secenek: SURE, konu: 'Günlük süre', kisi: 'ritim', desen: true, ipucu: 'Örnek: hafta içi günde 45 dk' };
    if (id === 'beden') return { id: id, metin: 'Beslenme hesabı için boyunu, doğum yılını ve cinsiyetini yazar mısın? İstemezsen atla.', secenek: CINSIYET, konu: 'Beden', kisi: 'fizyoloji', ipucu: 'Örnek: 178 cm, 1998' };
    if (id === 'saglik') return { id: id, metin: 'Sağlığınla ilgili bilmemi istediğin bir şey var mı? Bir rahatsızlık, ilaç ya da dikkat ettiğin bir durum. Yazdığın olduğu gibi saklanır, yorumlanmaz.',
      secenek: SAGLIK, konu: 'Sağlık notu', kisi: 'fizyoloji', ipucu: 'İstersen boş bırak' };
    return null;
  }
  function bos() { return { surum: 1, cevaplar: {}, silinen: [], duzelt: {}, bitir: false, guncel: 0 }; }
  function soruOf(olguId) { return olguId.split('|')[0]; }
  function secilenAlanlar(t) {
    var c = t.cevaplar.alanlar;
    if (!c || c.atlandi) return [];
    return tekle(c.secim.concat(alanBul(c.metin).map(function (x) { return x.alan; })))
      .filter(function (a) { return t.silinen.indexOf('alanlar|' + a) < 0; });
  }
  // Kural tablosu: hedef → alanlar → seçilen her alan için düzey → günlük süre → (sağlık alanı seçildiyse) beden ve sağlık notu.
  function sorular(t) {
    var al = secilenAlanlar(t), l = ['hedef', 'alanlar'].concat(al.map(function (a) { return 'seviye:' + a; }), ['sure']);
    if (al.some(function (a) { return H().bul(a).dal === 'saglik'; })) l.push('beden', 'saglik');
    return l;
  }
  function siradaki(t) {
    if (t.bitir) return null;
    var l = sorular(t);
    for (var i = 0; i < l.length; i++) if (!t.cevaplar[l[i]]) return l[i];
    return null;
  }
  // Cevap: { secim: [kimlik], metin }. İkisi de boşsa «atlandı». Yeni cevap o sorunun eski silme ve düzeltmelerini temizler.
  function cevapla(t, id, cevap, simdi) {
    if (sorular(t).indexOf(id) < 0) throw new Error('Tanışma: bu soru şu an sorulmuyor: ' + id);
    var s = soru(id, t), gecerli = s.secenek.map(function (x) { return x[0]; });
    var secim = tekle((cevap && cevap.secim) || []).filter(function (x) { return gecerli.indexOf(x) >= 0; });
    if (!s.coklu) secim = secim.slice(0, 1);
    var metin = String((cevap && cevap.metin) || '').trim().slice(0, 1000), y = kopya(t);
    y.cevaplar[id] = secim.length || metin ? { secim: secim, metin: metin, zaman: simdi } : { atlandi: true, zaman: simdi };
    y.silinen = y.silinen.filter(function (x) { return soruOf(x) !== id; });
    Object.keys(y.duzelt).forEach(function (x) { if (soruOf(x) === id) delete y.duzelt[x]; });
    y.bitir = false; y.guncel = simdi;
    return y;
  }
  function atla(t, id, simdi) { return cevapla(t, id, {}, simdi); }
  function etiket(s, k) { return (s.secenek.filter(function (x) { return x[0] === k; })[0] || [k, k])[1]; }

  /* ---------------- anlaşılanlar ---------------- */
  var TUR_AD = { secim: 'seçtin', desen: 'yazdığından', not: 'kendi sözün', duzeltme: 'düzelttin' };
  function anla(t) {
    var l = [];
    sorular(t).forEach(function (id) {
      var c = t.cevaplar[id];
      if (!c || c.atlandi) return;
      var s = soru(id, t), izler = [];
      var ekle = function (parca, o) { l.push(Object.assign({ id: id + '|' + parca, soru: id, konu: s.konu, kesinlik: 'soz', kisi: s.kisi, kaynak: 'tanisma' }, o)); };
      if (id === 'alanlar') {
        var bulunan = alanBul(c.metin);
        izler = bulunan.map(function (x) { return [x.bas, x.son]; });
        tekle(c.secim.concat(bulunan.map(function (x) { return x.alan; }))).forEach(function (a) {
          ekle(a, { metin: H().bul(a).ad, tur: c.secim.indexOf(a) >= 0 ? 'secim' : 'desen' });
        });
      } else if (id === 'beden') {
        if (c.secim[0]) ekle('cinsiyet', { konu: 'Cinsiyet', metin: etiket(s, c.secim[0]), tur: 'secim', ayar: { anahtar: 'lifeos.beden.cinsiyet', deger: c.secim[0] } });
        var b = bedenBul(c.metin);
        izler = b.izler;
        if (b.boy) ekle('boy', { konu: 'Boy', metin: b.boy + ' cm', tur: 'desen', deger: { v: b.boy, birim: 'cm' }, ayar: { anahtar: 'lifeos.beden.boy', deger: b.boy } });
        if (b.dogumYili) ekle('dogumYili', { konu: 'Doğum yılı', metin: String(b.dogumYili), tur: 'desen', deger: { v: b.dogumYili }, ayar: { anahtar: 'lifeos.beden.dogumYili', deger: b.dogumYili } });
      } else {
        if (c.secim[0]) ekle('secim', Object.assign({ metin: etiket(s, c.secim[0]), tur: 'secim' }, id === 'sure' ? { deger: { v: +c.secim[0], birim: 'dk', siklik: 'gun' } } : {}));
        if (s.desen) sayilar(c.metin).forEach(function (x, i) {
          var dg = { v: x.v, birim: x.birim, siklik: x.siklik };
          if (x.ust != null) dg.ust = x.ust;
          ekle('sayi' + i, { konu: (x.siklik ? 'Sıklık' : 'Süre') + ' · ' + s.konu, metin: x.metin, tur: 'desen', deger: dg });
          izler.push([x.bas, x.son]);
        });
      }
      // sağlık notu her zaman aynen saklanır, desene sokulmaz
      if (c.metin && (id === 'saglik' || artakalanVar(c.metin, izler))) ekle('not', { konu: s.konu + ' · kendi sözün', metin: c.metin, tur: 'not' });
    });
    return l.filter(function (o) { return t.silinen.indexOf(o.id) < 0; }).map(function (o) {
      if (!(o.id in t.duzelt)) return o;
      var y = Object.assign({}, o, { metin: t.duzelt[o.id], tur: 'duzeltme' });
      delete y.deger; delete y.ayar;
      // düzeltilmiş boy ve doğum yılı aynı desenle yeniden okunur; okunamazsa yalnız söz olarak kalır
      var b = (o.id === 'beden|boy' || o.id === 'beden|dogumYili') && bedenBul(y.metin), k = o.id.split('|')[1];
      if (b && b[k]) { y.deger = { v: b[k] }; if (k === 'boy') y.deger.birim = 'cm'; y.ayar = { anahtar: o.ayar.anahtar, deger: b[k] }; }
      return y;
    });
  }
  function sil(t, olguId, simdi) {
    var y = kopya(t);
    if (y.silinen.indexOf(olguId) < 0) y.silinen.push(olguId);
    delete y.duzelt[olguId]; y.guncel = simdi || y.guncel;
    return y;
  }
  function duzelt(t, olguId, metin, simdi) {
    metin = String(metin || '').trim().slice(0, 1000);
    if (!metin) return sil(t, olguId, simdi);
    var y = kopya(t); y.duzelt[olguId] = metin; y.guncel = simdi || y.guncel;
    return y;
  }

  /* ---------------- Yol için başlangıç önerisi ---------------- */
  // Her seçilen alan için öneri; ilk açılacak alan: hedefe bağlı taşınmış alan, yoksa seçimdeki ilk taşınmış alan.
  // «Rahatım» diyen için ilk ünite kapısı (ustalık kapısı geçirir, okumak geçirmez); öneri tek dokunuşla onaylanır.
  var BASLANGIC = { bas: 'İlk dersten başla.', kapi: 'Önce ilk ünite kapısını dene; geçersen sıradaki üniteden devam edersin.', eski: 'Bu alan henüz eski sayfasında; yeni sistemde açılınca buradan başlarsın.' };
  function oneriler(t) {
    var al = secilenAlanlar(t), h = t.cevaplar.hedef, hs = h && !h.atlandi ? h.secim[0] : null;
    var tasindi = function (a) { return !!H().bul(a).asama; };
    var ilk = hedefAlanlari(hs).filter(function (a) { return al.indexOf(a) >= 0 && tasindi(a); })[0] || al.filter(tasindi)[0] || null;
    return al.map(function (a) {
      var y = H().bul(a), c = t.cevaplar['seviye:' + a], sv = c && !c.atlandi ? c.secim[0] : null;
      var b = !y.asama ? 'eski' : sv === 'rahat' ? 'kapi' : 'bas';
      return { alan: a, ad: y.ad, ilk: a === ilk, baslangic: b, metin: BASLANGIC[b], yol: y.yol };
    }).sort(function (x, y) { return y.ilk - x.ilk; });
  }

  /* ---------------- depo: taslak, onay, geri alma ---------------- */
  var TASLAK = 'lifeos.tanisma.taslak', KAYIT = 'lifeos.tanisma.kayit', DAVET = 'lifeos.tanisma.davet';
  function jsonOku(depo, k) { try { return JSON.parse(depo.getItem(k)); } catch (e) { return null; } }
  function taslakOku(depo) {
    var v = jsonOku(depo, TASLAK);
    return v && v.surum === 1 && v.cevaplar && Array.isArray(v.silinen) && v.duzelt ? v : bos();
  }
  function taslakYaz(depo, t) { depo.setItem(TASLAK, JSON.stringify(t)); }
  function kayitOku(depo) { var v = jsonOku(depo, KAYIT); return v && v.surum === 1 && Array.isArray(v.olgular) ? v : null; }
  function hamGeri(depo, a, ham) { if (ham == null) depo.removeItem(a); else depo.setItem(a, ham); }
  // Tek yazma kapısı: kişinin onayıyla çağrılır. Ayar satırları şemadan geçer; ilk onaydan önceki değerler geri alma için saklanır.
  function onayla(t, depo, A, simdi) {
    var eski = kayitOku(depo), ayarEski = eski ? eski.ayarEski : {}, olgular = anla(t).map(function (o) { return Object.assign({}, o, { zaman: simdi }); });
    var yazilan = {};
    olgular.forEach(function (o) {
      if (!o.ayar) return;
      var a = o.ayar.anahtar;
      if (!(a in ayarEski)) ayarEski[a] = depo.getItem(a);
      if (A.yaz(depo, a, o.ayar.deger)) yazilan[a] = 1; else delete o.ayar;
    });
    Object.keys(ayarEski).forEach(function (a) { if (!yazilan[a]) { hamGeri(depo, a, ayarEski[a]); delete ayarEski[a]; } }); // artık söylenmeyen değer eski hâline döner
    var kayit = { surum: 1, zaman: simdi, olgular: olgular, oneriler: oneriler(t), ayarEski: ayarEski };
    depo.setItem(KAYIT, JSON.stringify(kayit));
    return kayit;
  }
  // olguId verilirse o satır, verilmezse bütün kayıt geri alınır; Ayarlar'a yazılan değer onay öncesine döner.
  function geriAl(depo, olguId) {
    var k = kayitOku(depo);
    if (!k) return null;
    var gidenler = k.olgular.filter(function (o) { return olguId == null || o.id === olguId; });
    k.olgular = k.olgular.filter(function (o) { return gidenler.indexOf(o) < 0; });
    gidenler.forEach(function (o) {
      var a = o.ayar && o.ayar.anahtar;
      if (a && a in k.ayarEski && !k.olgular.some(function (x) { return x.ayar && x.ayar.anahtar === a; })) { hamGeri(depo, a, k.ayarEski[a]); delete k.ayarEski[a]; }
    });
    if (olguId == null) { depo.removeItem(KAYIT); return null; }
    depo.setItem(KAYIT, JSON.stringify(k));
    return k;
  }
  function oneriOnayla(depo, alan, simdi) {
    var k = kayitOku(depo);
    if (!k) return null;
    k.oneriler.forEach(function (o) { if (o.alan === alan) o.onay = simdi; });
    depo.setItem(KAYIT, JSON.stringify(k));
    return k;
  }

  var Tanisma = { sayilar: sayilar, alanBul: alanBul, bedenBul: bedenBul, artakalanVar: artakalanVar, soru: soru, sorular: sorular, siradaki: siradaki,
    secilenAlanlar: secilenAlanlar, onerilenAlanlar: onerilenAlanlar, cevapla: cevapla, atla: atla, anla: anla, sil: sil, duzelt: duzelt, oneriler: oneriler,
    bos: bos, taslakOku: taslakOku, taslakYaz: taslakYaz, kayitOku: kayitOku, onayla: onayla, geriAl: geriAl, oneriOnayla: oneriOnayla, TUR_AD: TUR_AD,
    ANAHTARLAR: { taslak: TASLAK, kayit: KAYIT, davet: DAVET } };
  Kabuk.Tanisma = Tanisma;
  if (typeof module !== 'undefined' && module.exports) module.exports = Tanisma;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var d = document, ic = function () { return Kabuk.ic; }, B = Kabuk.Bilesen; // ekran yalnız kataloğun taşlarından (sohbet, çipler, yanlı düzen, liste)
  var degistir = null, duzenlenen = null, odakla = null; // yeniden cevaplanan soru, düzeltilen satır, çizimden sonra odaklanacak seçici

  function cevapYazisi(s, c) {
    return c.atlandi ? null : (c.secim.length ? [c.secim.map(function (x) { return etiket(s, x); }).join(', ')] : []).concat(c.metin ? [c.metin] : []);
  }
  function soruFormu(t, id) {
    var s = soru(id, t), c = t.cevaplar[id], basili = c && !c.atlandi ? c.secim : (s.onerilen || []);
    return { form: { 'tn-soru': id }, soru: { metin: s.metin, id: 'tn-soru-metni', canli: true }, govde: [
      B.cipler({ ad: 'Hızlı seçenekler' + (s.coklu ? ', birden çok seçilebilir' : ', biri seçilir'), ogeler: s.secenek.map(function (x) { return { metin: x[1], basili: basili.indexOf(x[0]) >= 0, veri: { 'tn-cip': x[0] } }; }) }),
      B.alan({ ad: 'Kendi sözlerinle cevap', isim: 'metin', tur: 'cok', deger: c && !c.atlandi ? c.metin : '', ipucu: s.ipucu, tarif: 'tn-soru-metni', enCok: 1000 }),
      B.eylemler([{ metin: 'Gönder', tur: 'ana', tip: 'submit' }, { metin: 'Atla', tur: 'sade', veri: { 'tn-ac': 'atla' } },
        degistir ? { metin: 'Vazgeç', tur: 'sade', veri: { 'tn-ac': 'vazgec-soru' } } : null, { yazi: 'Enter gönderir, Shift Enter yeni satır.' }])] };
  }
  // King'in anladığı bir satır: metin kısaltılmaz (uzun satır; tam okunmalı), konu notta, tür rozette; düzeltilirken aynı kutuda form
  function olguSatiri(o, onayli) {
    var ozet = o.konu + ', ' + o.metin;
    if (!onayli && duzenlenen === o.id) return { form: { veri: { 'tn-olgu': o.id }, govde: [B.alan({ ad: 'Düzelt: ' + o.konu, isim: 'duzelt', tur: 'metin', deger: o.metin, enCok: 1000 }),
      B.eylemler([{ metin: 'Kaydet', tip: 'submit' }, { metin: 'Vazgeç', tur: 'sade', veri: { 'tn-ac': 'vazgec-duzelt' } }])] } };
    return { ad: o.tur === 'not' ? '«' + o.metin + '»' : o.metin, not: o.konu, pul: TUR_AD[o.tur], uzun: true,
      eylemler: [onayli ? null : { metin: 'Düzelt', tur: 'sade', etiket: 'Düzelt: ' + ozet, veri: { 'tn-ac': 'duzelt', id: o.id } },
        { metin: onayli ? 'Geri al' : 'Sil', tur: 'sade', etiket: (onayli ? 'Geri al: ' : 'Sil: ') + ozet, veri: { 'tn-ac': onayli ? 'geri-al' : 'sil', id: o.id } }] };
  }
  function sayfa(yer) {
    var I = ic(), k = I.kac, t = taslakOku(I.depo), kayit = kayitOku(I.depo), sira = siradaki(t);
    var simdi = degistir && sorular(t).indexOf(degistir) >= 0 ? degistir : sira, temiz = kayit && kayit.zaman >= t.guncel && !simdi;
    var gecmis = sorular(t).filter(function (id) { return t.cevaplar[id] && id !== simdi; }).map(function (id) {
      var s = soru(id, t), c = cevapYazisi(s, t.cevaplar[id]);
      return { soru: s.metin, cevap: c, atlandi: !c, eylem: { metin: 'Değiştir', tur: 'sade', etiket: 'Cevabı değiştir: ' + s.metin, veri: { 'tn-ac': 'degistir', soru: id } } };
    });
    var olgular = temiz ? kayit.olgular : anla(t), oner = temiz ? kayit.oneriler : oneriler(t), sag;
    var oneriHtml = oner.length ? B.bolum({ baslik: 'Başlangıç önerisi', govde: oner.map(function (o) {
      return B.panel({ tur: o.ilk ? 'basari' : 'normal', govde: ['<p><b>' + k(o.ad) + (o.ilk ? ' · önce bu' : '') + '</b></p>', '<p class="soluk">' + k(o.metin) + '</p>',
        temiz && o.baslangic !== 'eski' ? B.eylemler([{ metin: 'Buradan başla', tur: o.ilk ? 'ana' : 'ikincil', veri: { 'tn-ac': 'basla', alan: o.alan } }, o.onay ? { yazi: 'başladın' } : null]) : ''] });
    }) }) : '';
    if (simdi) sag = soruFormu(t, simdi);
    else if (temiz) sag = { etiket: 'tn-bitti', govde: [B.panel({ tur: 'basari', durum: true, id: 'tn-bitti', govde: '<p><b>Kaydedildi.</b> ' +
      kayit.olgular.length + ' satır. Listedeki her satırı tek tek geri alabilirsin.</p>' }), oneriHtml,
      B.eylemler([sira || t.bitir && siradaki(Object.assign({}, t, { bitir: false })) ? { metin: 'Kalan sorulara devam et', veri: { 'tn-ac': 'devam' } } : null,
        { metin: 'Hepsini geri al', tur: 'sade', veri: { 'tn-ac': 'hepsini-geri-al' } }])] };
    else sag = { etiket: 'tn-onay', soru: { id: 'tn-onay', odak: true, metin: olgular.length ? 'Anladıklarımı kaydedeyim mi? Kaydetmeden önce «King\'in anladığı» listesindeki her satırı düzeltebilir ya da silebilirsin.'
      : 'Kaydedilecek bir şey yok. İstersen bir cevabı değiştir.' }, govde: [oneriHtml,
      B.eylemler([olgular.length ? { metin: 'Onayla ve kaydet', tur: 'ana', veri: { 'tn-ac': 'onayla' } } : null,
        siradaki(Object.assign({}, t, { bitir: false })) ? { metin: 'Sorulara devam et', tur: 'sade', veri: { 'tn-ac': 'devam' } } : null]),
      '<p class="soluk">Onaylamadan hiçbir şey kaydedilmez. Boy, doğum yılı ve cinsiyet Ayarlar › Beden\'e yazılır.</p>'] };
    var panel = B.panel({ baslik: 'King\'in anladığı · ' + (temiz ? 'kaydedildi, geri alabilirsin' : 'düzeltebilirsin'), id: 'tn-panel', govde: [
      olgular.length ? B.liste({ ad: 'King\'in anladığı', canli: true, ogeler: olgular.map(function (o) { return olguSatiri(o, temiz); }) })
        : '<p class="soluk">Cevap verdikçe burada görünür. Yalnız seçtiklerin ve açıkça yazdığın sayılar anlaşılır; geri kalanı kendi sözün olarak aynen durur.</p>',
      B.eylemler([!temiz && simdi && olgular.length ? { metin: 'Şimdilik bu kadar, kaydetmeye geç', tur: 'sade', veri: { 'tn-ac': 'bitir' } } : null])] });
    return I.ust(I.kirinti(yer)) + '<div class="govde govde--genis" data-arac="tanisma">' +
      B.baslik({ metin: 'Tanışma', alt: 'Kendi sözlerinle anlat. Anladıklarım ayrı bir listede görünür; düzeltebilir, silebilirsin. Sen onaylamadan hiçbir şey kaydedilmez.' }) +
      B.yanli({ taraf: 'sag', tamamlayici: true, ana: B.sohbet({ ad: 'Sohbet', gecmis: gecmis, simdi: sag }), yan: panel }) + '</div>';
  }
  function ciz(secici) {
    ic().rota();
    var el = d.querySelector(secici || '#b-alan-metin') || d.querySelector('#tn-onay, #tn-bitti');
    if (el) el.focus({ preventScroll: !!secici });
  }
  function kaydet(t) { taslakYaz(ic().depo, t); }
  function gonder(form) {
    var I = ic(), t = taslakOku(I.depo), id = form.getAttribute('data-tn-soru');
    var secim = [].map.call(form.querySelectorAll('[data-tn-cip][aria-pressed="true"]'), function (b) { return b.getAttribute('data-tn-cip'); });
    try { kaydet(cevapla(t, id, { secim: secim, metin: form.elements.metin.value }, Date.now())); } catch (e) { /* soru artık akışta yok: çizim düzeltir */ }
    degistir = null; ciz();
  }

  // Bugün ekranı: kayıt yoksa tek sessiz satır; «Sonra» denince bir daha gösterilmez (Sistem haritasından ve aramadan hep açılır).
  Kabuk.tanismaDavet = function () {
    var I = ic(); if (!I) return '';
    if (kayitOku(I.depo) || I.depo.getItem(DAVET) === 'kapali') return '';
    var t = taslakOku(I.depo), yarim = Object.keys(t.cevaplar).length > 0;
    return B.uyari({ tur: 'bilgi', veri: { 'tn-davet': '' }, metin: yarim ? 'Tanışmayı yarıda bıraktın.' : 'Seni biraz tanıyayım mı? Birkaç kısa soru.',
      eylem: [{ metin: yarim ? 'Devam et' : 'Tanışalım', tur: 'sade', href: '#/tanisma' }, { metin: 'Sonra', tur: 'sade', veri: { 'tn-ac': 'davet-kapat' } }] });
  };
  Kabuk.ek = Kabuk.ek || {};
  Kabuk.ek.tanisma = sayfa;

  d.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.matches('form[data-tn-soru]')) { e.preventDefault(); return gonder(f); }
    if (f.matches('form[data-tn-olgu]')) {
      e.preventDefault();
      var I = ic(), id = f.getAttribute('data-tn-olgu');
      kaydet(duzelt(taslakOku(I.depo), id, f.elements.duzelt.value, Date.now()));
      duzenlenen = null; ciz('[data-tn-ac="duzelt"][data-id="' + id + '"]');
    }
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.target.id === 'b-alan-metin') { e.preventDefault(); gonder(e.target.form); }
  });
  d.addEventListener('click', function (e) {
    var cip = e.target.closest('[data-tn-cip]');
    if (cip) {
      var f = cip.closest('form'), s = soru(f.getAttribute('data-tn-soru'), taslakOku(ic().depo)), bas = cip.getAttribute('aria-pressed') !== 'true';
      if (!s.coklu) [].forEach.call(f.querySelectorAll('[data-tn-cip]'), function (b) { b.setAttribute('aria-pressed', 'false'); });
      cip.setAttribute('aria-pressed', String(bas));
      return;
    }
    var b = e.target.closest('[data-tn-ac]');
    if (!b) return;
    var I = ic(), ne = b.getAttribute('data-tn-ac'), t = taslakOku(I.depo), simdi = Date.now(), id = b.getAttribute('data-id');
    if (ne === 'davet-kapat') { I.depo.setItem(DAVET, 'kapali'); var p = b.closest('[data-tn-davet]'); if (p) p.remove(); return; }
    if (ne === 'atla') { var fs = b.closest('form'); try { kaydet(atla(t, fs.getAttribute('data-tn-soru'), simdi)); } catch (x) { /* akışta değil */ } degistir = null; return ciz(); }
    if (ne === 'degistir') { degistir = b.getAttribute('data-soru'); return ciz(); }
    if (ne === 'vazgec-soru') { degistir = null; return ciz(); }
    if (ne === 'duzelt') { duzenlenen = id; return ciz('#b-alan-duzelt'); }
    if (ne === 'vazgec-duzelt') { var eskiId = duzenlenen; duzenlenen = null; return ciz('[data-tn-ac="duzelt"][data-id="' + eskiId + '"]'); }
    if (ne === 'sil') { kaydet(sil(t, id, simdi)); return ciz(); }
    if (ne === 'bitir') { t.bitir = true; kaydet(t); return ciz(); }
    if (ne === 'devam') { t.bitir = false; t.guncel = simdi; kaydet(t); return ciz(); }
    if (ne === 'onayla') { onayla(t, I.depo, Kabuk.Ayar, Math.max(simdi, t.guncel)); return ciz('#tn-bitti'); }
    if (ne === 'geri-al') {
      if (!confirm('Bu satır geri alınsın mı? Kayıttan çıkar.')) return;
      geriAl(I.depo, id); kaydet(sil(t, id, t.guncel)); return ciz();
    }
    if (ne === 'hepsini-geri-al') { if (!confirm('Tanışmada kaydedilen her şey geri alınsın mı? Cevapların taslak olarak kalır.')) return; geriAl(I.depo); return ciz(); }
    if (ne === 'basla') { var al = b.getAttribute('data-alan'); oneriOnayla(I.depo, al, simdi); I.depo.setItem('lifeos.yol.son', al); return I.git(H().bul(al).yol); } // Bugün de bu alanla karşılar
  });
})(typeof window !== 'undefined' ? window : globalThis);
