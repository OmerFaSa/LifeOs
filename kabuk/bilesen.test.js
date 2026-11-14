// Bileşen kataloğu testleri: node kabuk/bilesen.test.js  (✓/✕, çıkış 0/1). Kurulum yok.
'use strict';
const fs = require('fs'), path = require('path');
const B = require('./bilesen.js');

let gecen = 0, kalan = 0;
function t(ad, f) {
  try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); }
}
function dogru(x, m) { if (!x) throw new Error(m || 'doğru değil'); }
function atar(f, desen, m) {
  try { f(); } catch (e) { if (!(e instanceof TypeError) || (desen && !desen.test(e.message))) throw new Error((m || '') + ' yanlış hata: ' + e.message); return; }
  throw new Error((m || '') + ' hata atmadı');
}

// her taş, her metin alanına zararlı metin verilerek çizilir
const K = '<img src=x onerror="alert(1)">\'&';
const ORNEK = {
  dugme: () => B.dugme({ metin: K.slice(0, 40), etiket: K, veri: { ac: K } }),
  pul: () => B.pul({ metin: '<x-p>"x"&\'' }),
  satir: () => B.satir({ ad: K, not: K, pul: '<x-s>&', href: '#/a' }),
  ders: () => B.ders({ baslik: K, ozet: K, href: '#/d', durum: 'okundu', taslak: true }),
  ilerleme: () => B.ilerleme({ ad: K, deger: 2, toplam: 5 }),
  alan: () => B.alan({ ad: K, isim: 'ad', deger: K, ipucu: K, hata: K }),
  bos: () => B.bos({ baslik: K, metin: K, eylem: { metin: 'Git', href: '#/x' } }),
  baslik: () => B.baslik({ metin: K, alt: K, eylem: { metin: 'Yeni' } }),
  sayi: () => B.sayi({ ad: K, deger: 3, birim: '<x-b>', etiket: 'measured' }),
  uyari: () => B.uyari({ tur: 'hata', metin: K }),
  bolum: () => B.bolum({ baslik: K, govde: B.pul('x') }),
  panel: () => B.panel({ baslik: K, govde: [B.pul('x')] }),
  eylemler: () => B.eylemler([{ metin: K.slice(0, 40), veri: { ac: K } }, null, { yazi: K }]),
  acilir: () => B.acilir({ baslik: K, not: K, govde: B.pul('x'), veri: { a: K } }),
  soru: () => B.soru({ soru: K, ust: K, secenekler: [K, K], secili: 'A', dogru: 'B', sikVeri: { ac: K }, veri: { s: K }, sonuc: { baslik: K, metin: K, maddeler: [K], not: K } }),
  tercih: () => B.tercih({ ad: K, secenekler: { a: K.slice(0, 40), b: 'B' }, deger: 'a', veri: { ayar: K } }),
  kart: () => B.kart({ on: K, arka: K, veri: { kart: K }, notlar: [{ metin: '<x-n>', sure: K, veri: { not: K } }] }),
  tablo: () => B.tablo({ ad: K, ilk: K, sutunlar: [{ metin: K, alt: K }], satirlar: [{ ad: K, alt: K, pul: '<x-t>', hucreler: [{ metin: K, alt: K, okunur: K }] }] }),
  serit: () => B.serit({ baslik: K, alt: K, sayac: { metin: K, ad: K }, veri: { s: K } }),
  adimlar: () => B.adimlar({ ad: K, ogeler: [{ etiket: K, veri: { i: K } }] }),
  ayar: () => B.ayar({ ad: K, not: K, id: 'ayar-x', deger: K, veri: { 'ayar-satir': K } }),
  ag: () => B.ag({ ad: K, en: 100, boy: 50, dugumler: [{ id: 'a', ad: K, x: 1, y: 1, href: '#/a' }, { id: 'b', ad: K, etiket: K, x: 9, y: 9, href: '#/b' }], kenarlar: [{ a: 'a', b: 'b', tur: 'kesik' }],
    ozet: K, aciklama: { kesik: K } }),
  karsilama: () => B.karsilama({ selam: K, sira: { ust: K, metin: K }, adim: K, eylem: { metin: K.slice(0, 40), href: '#/a' }, baglanti: { metin: K, href: '#/b' } }),
  halka: () => B.halka({ id: 'halka', ad: K, ogeler: [{ ad: '<x-h>&"', yol: '#/a' }, { ad: 'B', yol: '#/b' }] }),
  komut: () => B.komut({ id: 'komut', ad: K, yerTutucu: K }) + B.komutListe({ id: 'komut', ogeler: [{ ad: K, etiket: K }] }),
  sohbet: () => B.sohbet({ ad: K, gecmis: [{ soru: K, cevap: [K, K], eylem: { metin: 'Değiştir', etiket: K } }, { soru: K, atlandi: true }],
    simdi: { form: { 'tn-soru': K }, soru: { metin: K, id: 'soru-x', canli: true }, govde: B.pul('x') } }),
  cipler: () => B.cipler({ ad: K, ogeler: [{ metin: K.slice(0, 40), veri: { cip: K } }] }),
  yanli: () => B.yanli({ taraf: 'sol', yan: B.gezinme({ ad: K, ogeler: [{ metin: K, href: '#/a' }] }), ana: B.pul('x') })
};

t('katalog yirmi sekiz taş sunar ve her biri test örneğine sahip', () => {
  dogru(B.TASLAR.length === 28, 'taş sayısı ' + B.TASLAR.length);
  B.TASLAR.forEach(ad => dogru(typeof B[ad] === 'function' && ORNEK[ad], ad));
});
t('kaçış: hiçbir taş ham etiket ya da tırnak sızdırmaz', () => {
  B.TASLAR.forEach(ad => {
    const h = ORNEK[ad]();
    dogru(!/<img|<x-|onerror="/.test(h), ad + ' sızdırdı: ' + h);
    dogru(/&lt;/.test(h), ad + ' kaçışsız');
    // nitelik değerlerinde kaçışsız tırnak yok: her ="…" dengeli kapanır
    dogru(!/="[^"]*'[^"]*"/.test(h.replace(/&#39;/g, '')), ad + ' tek tırnak kaçmadı');
  });
});
t('rol ve etiket: düğme, satır, liste, ders', () => {
  dogru(/^<button type="button" class="b-dugme b-dugme--ikincil">Kaydet<\/button>$/.test(B.dugme({ metin: 'Kaydet' })));
  dogru(/^<a class="b-dugme b-dugme--ana" href="#\/x">/.test(B.dugme({ metin: 'Git', tur: 'ana', href: '#/x' })));
  dogru(/type="submit"/.test(B.dugme({ metin: 'Gönder', tip: 'submit' })));
  dogru(/aria-disabled="true"/.test(B.dugme({ metin: 'Kaydet', kapali: true, href: '#/x' })) && !/href/.test(B.dugme({ metin: 'Kaydet', kapali: true, href: '#/x' })), 'kapalı düğme bağlantı değil');
  dogru(/aria-label="Kapat"/.test(B.dugme({ metin: '×', etiket: 'Kapat' })));
  const l = B.liste({ ad: 'Yerler', ogeler: [{ ad: 'A', href: '#/a' }, { ad: 'B', durum: 'kilitli' }, { ad: 'C', durum: 'secili', href: '#/c' }] });
  dogru(/^<ul class="b-liste b-liste--satir" aria-label="Yerler"><li>/.test(l), l);
  dogru(/class="b-satir b-satir--kilitli" aria-disabled="true"/.test(l) && /kilitli<\/span>/.test(l), 'kilitli satır işaretli ve yazılı');
  dogru(/aria-current="true"/.test(l), 'seçili');
  dogru(/<span class="b-satir__ok" aria-hidden="true">/.test(l), 'ok gizli');
  const d = B.ders({ baslik: 'Bilgi', ozet: 'Ö', durum: 'kilitli' });
  dogru(/aria-disabled="true"/.test(d) && !/href/.test(d), 'kilitli ders bağlantı değil');
  dogru(/>taslak</.test(B.ders({ baslik: 'B', href: '#/d', taslak: true })), 'taslak etiketi');
});
t('rol ve etiket: ilerleme, alan, boş, başlık, uyarı, bölüm, panel, sayılar', () => {
  const i = B.ilerleme({ ad: 'Ders', deger: 3, toplam: 8 });
  ['role="progressbar"', 'aria-label="Ders"', 'aria-valuemin="0"', 'aria-valuemax="8"', 'aria-valuenow="3"', 'aria-valuetext="8 içinden 3"'].forEach(x => dogru(i.indexOf(x) >= 0, x));
  dogru((i.match(/<i/g) || []).length === 8 && (i.match(/class="dolu"/g) || []).length === 3, 'tik tik');
  dogru(/width:39.2%/.test(B.ilerleme({ ad: 'A', deger: 47, toplam: 120 })), 'sürekli çubuk');
  const a = B.alan({ ad: 'Su', isim: 'su', tur: 'sayi', ipucu: 'ml', hata: 'Boş olamaz', zorunlu: true });
  dogru(/<label class="b-alan__ad" for="b-alan-su">/.test(a) && /id="b-alan-su"/.test(a), 'etiket bağlı');
  dogru(/aria-describedby="b-alan-su-ipucu b-alan-su-hata"/.test(a) && /aria-invalid="true"/.test(a) && /required/.test(a), 'tarif ve hata');
  dogru(/<b>Hata:<\/b>/.test(a), 'hata sözcükle');
  dogru(/<select/.test(B.alan({ ad: 'G', isim: 'g', tur: 'secim', deger: 'b', secenekler: { a: 'A', b: 'B' } })) , 'seçim');
  dogru(/<textarea[^>]*rows="4"/.test(B.alan({ ad: 'N', isim: 'n', tur: 'cok' })), 'çok satır sabit 4');
  dogru(/type="checkbox"[^>]* checked/.test(B.alan({ ad: 'O', isim: 'o', tur: 'onay', deger: true })), 'onay');
  dogru(/role="note"/.test(B.bos({ baslik: 'Yok' })));
  dogru(/<h1 id="b-son-denemeler">Son denemeler<\/h1>/.test(B.baslik({ metin: 'Son denemeler' })), 'türkçe kimlik');
  dogru(/<h2 id="x">/.test(B.baslik({ metin: 'A', duzey: 2, id: 'x' })));
  esitRol('bilgi', 'note'); esitRol('tamam', 'status'); esitRol('dikkat', 'note'); esitRol('hata', 'alert');
  dogru(/>Hata</.test(B.uyari({ tur: 'hata', metin: 'x' })), 'tür sözcükle');
  dogru(/<section class="b-bolum" aria-labelledby="b-bugun"><div class="b-bolum__ust"><h2 id="b-bugun">/.test(B.bolum({ baslik: 'Bugün', govde: '' })));
  dogru(/^<section class="b-panel b-panel--basari" aria-labelledby="p">/.test(B.panel({ baslik: 'K', id: 'p', tur: 'basari', govde: '' })));
  dogru(/^<div class="b-panel b-panel--normal">/.test(B.panel({ govde: '' })), 'başlıksız panel bölge değil');
  dogru(/^<ul class="b-sayilar" aria-label="Gün"><li><div class="b-sayi"/.test(B.sayilar({ ad: 'Gün', ogeler: [{ ad: 'Su', deger: 1, etiket: 'measured' }] })));
  // ekranların istediği eklemeler: aç/kapa ve kısayollu düğme, eylemli satır ve uyarı, eylem sırası, açılır bölüm, kök yolu
  dogru(/aria-pressed="true"/.test(B.dugme({ metin: 'A', basili: true })) && /aria-pressed="false"/.test(B.dugme({ metin: 'A', basili: false })) && !/aria-pressed/.test(B.dugme({ metin: 'A' })), 'basılı');
  dogru(/aria-keyshortcuts="Control\+K"[^>]*>Ara<kbd>Ctrl K<\/kbd><\/button>/.test(B.dugme({ metin: 'Ara', kisayol: 'Control+K', tus: 'Ctrl K' })), 'kısayol');
  dogru(/^<div class="b-satir"><span class="b-satir__metin">.*<div class="b-eylemler"><button[^>]*data-ac="sil"/.test(B.satir({ ad: 'Kart', eylemler: [{ metin: 'Sil', veri: { ac: 'sil' } }] })), 'eylemli satır');
  dogru(/<\/p><button[^>]*>Anladım<\/button><\/div>$/.test(B.uyari({ tur: 'bilgi', metin: 'x', eylem: { metin: 'Anladım' } })), 'eylemli uyarı');
  dogru(B.eylemler([null, false]) === '' && /^<div class="b-eylemler"><a class="b-dugme b-dugme--ana" href="#\/x">Git<\/a><span class="b-eylemler__yazi">ya da<\/span>/.test(B.eylemler([{ metin: 'Git', tur: 'ana', href: '#/x' }, { yazi: 'ya da' }])), 'eylem sırası');
  const ac = B.acilir({ baslik: 'Ünite 1', not: '2/3 ders', govde: B.pul('x'), acik: true });
  dogru(/^<details class="b-acilir" open><summary class="b-acilir__ust"><h2 class="b-acilir__baslik">Ünite 1<\/h2><span class="b-acilir__not">2\/3 ders<\/span><\/summary><div class="b-acilir__govde">/.test(ac), ac);
  dogru(/<h3/.test(B.acilir({ baslik: 'K', govde: '', duzey: 3 })) && !/ open/.test(B.acilir({ baslik: 'K', govde: '' })), 'düzey ve kapalı');
  dogru(/href="\/esp\/"/.test(B.dugme({ metin: 'Eski', href: '/esp/' })), 'kök yolu');
  dogru(/^<div class="b-panel b-panel--normal" id="tn-bitti">/.test(B.panel({ id: 'tn-bitti', govde: '' })), 'başlıksız panelde kimlik');
  dogru(/^<section class="b-bolum" aria-labelledby="b-kurallar" data-kural="">/.test(B.bolum({ baslik: 'Kurallar', veri: { kural: '' }, govde: '' })), 'bölümde veri');
  dogru(/aria-describedby="soru-1 b-alan-m-ipucu"/.test(B.alan({ ad: 'M', isim: 'm', tarif: 'soru-1', ipucu: 'i' })), 'ek tarif');
  dogru(/<\/p><div class="b-eylemler"><a[^>]*>Git<\/a><button[^>]*>Sonra<\/button><\/div><\/div>$/.test(B.uyari({ tur: 'bilgi', metin: 'x', eylem: [{ metin: 'Git', href: '#/g' }, { metin: 'Sonra' }] })), 'iki eylemli uyarı');
  dogru(/^<div class="b-panel b-panel--basari" role="status" tabindex="-1" data-sonuc="gecti">/.test(B.panel({ tur: 'basari', durum: true, veri: { sonuc: 'gecti' }, govde: '' })), 'sonuç paneli');
  function esitRol(tur, rol) { dogru(B.uyari({ tur, metin: 'x' }).indexOf('role="' + rol + '"') > 0, tur); }
});
t('kötü girdi: eksik metin, yanlış tür, tehlikeli bağlantı reddedilir', () => {
  B.TASLAR.forEach(ad => atar(() => B[ad](), /seçenek nesnesi/, ad));
  atar(() => B.dugme({}), /metin gerekli/);
  atar(() => B.dugme({ metin: { x: 1 } }), /metin olmalı/);
  atar(() => B.dugme({ metin: 'x'.repeat(41) }), /en çok 40/);
  atar(() => B.dugme({ metin: 'x', tur: 'kirmizi' }), /tur/);
  ['javascript:alert(1)', 'JAVASCRIPT:x', 'data:text/html,x', '//kotu.example', '#/a b', ''].forEach(h => atar(() => B.dugme({ metin: 'x', href: h }), /href/, h));
  atar(() => B.satir({ ad: 'x', href: 'javascript:x' }), /href/);
  atar(() => B.dugme({ metin: 'x', veri: { 'on click': 'x' } }), /veri anahtarı/);
  atar(() => B.pul({ metin: 'x'.repeat(25) }), /en çok 24/);
  atar(() => B.satir({ ad: 'x', durum: 'acik-ama' }), /durum/);
  atar(() => B.liste({ ad: 'L', ogeler: [] }), /boş olmayan/);
  atar(() => B.ders({ baslik: 'B', durum: 'yeni' }), /href gerekli/);
  atar(() => B.ders({ baslik: 'B', href: '#/d', sure: -3 }), /sure/);
  atar(() => B.ilerleme({ ad: 'A', deger: 9, toplam: 8 }), /deger/);
  atar(() => B.ilerleme({ ad: 'A', deger: 1.5, toplam: 8 }), /deger/);
  atar(() => B.ilerleme({ ad: 'A', deger: null, toplam: 8 }), /deger/);
  atar(() => B.ilerleme({ ad: 'A', deger: 0, toplam: 0 }), /toplam/);
  atar(() => B.alan({ ad: 'A', isim: '1x' }), /isim/);
  atar(() => B.alan({ ad: 'A', isim: 'x"y' }), /isim/);
  atar(() => B.alan({ ad: 'A', isim: 'g', tur: 'secim', deger: 'z', secenekler: { a: 'A' } }), /seçeneklerde yok/);
  atar(() => B.alan({ ad: 'A', isim: 'o', tur: 'onay', deger: 'evet' }), /true\/false/);
  atar(() => B.baslik({ metin: 'A', duzey: 3 }), /duzey/);
  atar(() => B.baslik({ metin: 'A', id: 'Kötü id' }), /id/);
  atar(() => B.uyari({ tur: 'kirmizi', metin: 'x' }), /tur/);
  atar(() => B.bolum({ baslik: 'A', govde: { html: 'x' } }), /govde/);
  atar(() => B.panel({ govde: 5 }), /govde/);
  atar(() => B.dugme({ metin: 'x', basili: 'evet' }), /basili/);
  atar(() => B.alan({ ad: 'A', isim: 'a', tarif: 'x" onfocus="y' }), /tarif/);
  atar(() => B.satir({ ad: 'x', href: '#/a', eylemler: [{ metin: 'Sil' }] }), /eylem olmaz/, 'bağlantı içinde düğme');
  atar(() => B.eylemler({ metin: 'x' }), /dizisi/);
  atar(() => B.eylemler(['<b>x</b>']), /seçenek nesnesi/, 'HTML metni öğe olamaz');
  atar(() => B.acilir({ baslik: 'A', govde: {} }), /govde/);
  atar(() => B.acilir({ baslik: 'A', govde: '', duzey: 1 }), /duzey/);
});
t('sayı kutusu: kesinlik etiketi zorunlu, eksik veri sıfır değildir', () => {
  atar(() => B.sayi({ ad: 'Su', deger: 2 }), /etiket zorunlu/);
  atar(() => B.sayi({ ad: 'Su', deger: 2, etiket: '' }), /etiket zorunlu/);
  atar(() => B.sayi({ ad: 'Su', deger: 2, etiket: 'ölçüldü' }), /etiket zorunlu/, 'görünen ad değil motor anahtarı');
  atar(() => B.sayi({ ad: 'Su', deger: 2, etiket: 'toString' }), /etiket zorunlu/, 'prototip adı');
  atar(() => B.sayi({ ad: 'Su', deger: 0, etiket: 'missing' }), /null/, 'veri yok ama sayı var');
  atar(() => B.sayi({ ad: 'Su', deger: null, etiket: 'measured' }), /sonlu sayı/);
  atar(() => B.sayi({ ad: 'Su', deger: NaN, etiket: 'computed' }), /sonlu sayı/);
  atar(() => B.sayi({ ad: 'Su', deger: '3', etiket: 'measured' }), /sonlu sayı/);
  atar(() => B.sayilar({ ad: 'G', ogeler: [{ ad: 'Su', deger: 1 }] }), /etiket zorunlu/, 'ızgarada da');
  const BEK = { measured: 'ölçüldü', estimated: 'tahmin', computed: 'hesaplandı', missing: 'veri yok', eski: 'eski kayıt' };
  Object.keys(BEK).forEach(k => {
    const h = B.sayi({ ad: 'Su', deger: k === 'missing' ? null : 7.5, birim: 'L', etiket: k });
    dogru(h.indexOf('>' + BEK[k] + '</span>') > 0, k + ' görünür etiket');
    dogru(h.indexOf('aria-label="Su: ' + (k === 'missing' ? 'veri yok' : '7,5 L, ' + BEK[k]) + '"') > 0, k + ' cümle: ' + h);
  });
  dogru(/>—</.test(B.sayi({ ad: 'Nabız', deger: null, etiket: 'missing' })) && !/>0</.test(B.sayi({ ad: 'Nabız', deger: null, etiket: 'missing' })), 'veri yok sıfır çizilmez');
  dogru(/b-pul--kesik">tahmin/.test(B.sayi({ ad: 'Su', deger: 1, etiket: 'estimated' })), 'tahmin kesik çizgiyle de ayrılır');
});

t('soru: şıklar, seçili, doğru/yanlış yazıyla, kilit, radyo, açık uçlu, sonuç', () => {
  const s = B.soru({ soru: 'Arkhe?', ust: 'Soru 1 / 3', secenekler: ['Su', 'Hava', 'Ateş'], secili: 'A', dogru: 'B', kilitli: true, sikVeri: { 'arac-ac': 'soru-cevap' }, veri: { sira: 0 },
    sonuc: { baslik: 'Yanlış.', metin: 'Thales suyu söyler.' } });
  dogru(/^<fieldset class="b-soru" tabindex="-1" data-sira="0"><legend class="b-soru__metin">Arkhe\?<\/legend><p class="b-soru__ust">Soru 1 \/ 3<\/p>/.test(s), s);
  dogru((s.match(/<button type="button" class="b-soru__sik[^"]*" data-arac-ac="soru-cevap" data-h="[ABC]" aria-pressed="(true|false)" aria-disabled="true">/g) || []).length === 3 && !/ disabled/.test(s), 'üç kilitli şık odakta kalır (aria-disabled, disabled değil)');
  dogru(/b-soru__sik b-soru__sik--yanlis" [^>]*data-h="A" aria-pressed="true"/.test(s) && /✕ senin cevabın/.test(s), 'seçilen yanlış kesik çizgi + yazı');
  dogru(/b-soru__sik b-soru__sik--dogru" [^>]*data-h="B" aria-pressed="false"/.test(s) && /✓ doğru/.test(s), 'doğru şık işaretli + yazı');
  dogru(/<div class="b-soru__sonuc" tabindex="-1" role="status"><b>Yanlış\.<\/b> Thales suyu söyler\.<\/div><\/fieldset>$/.test(s), 'sonuç satırı');
  const bos = B.soru({ soru: 'S', secenekler: ['a', 'b'] });
  dogru(!/b-soru__im|disabled|aria-pressed="true"/.test(bos) && /<div class="b-soru__sonuc" tabindex="-1" role="status"><\/div>/.test(bos), 'cevapsız soru: işaret yok, sonuç boş');
  dogru(!/b-soru__sik--/.test(B.soru({ soru: 'S', secenekler: ['a', 'b'], secili: 'A' })), 'doğru verilmezse (deneme) doğru/yanlış söylenmez');
  const r = B.soru({ kip: 'radyo', isim: 'f.u1.k1', soru: 'S', secenekler: ['a', 'b'], secili: 'B' });
  dogru((r.match(/<label class="b-soru__sik"><input type="radio" name="f\.u1\.k1" value="[AB]"/g) || []).length === 2 && /value="B" checked>/.test(r), 'radyo grubu, içerik kimliği ad');
  const a = B.soru({ soru: 'Neden?', govde: B.alan({ ad: 'Cevabın', isim: 'c', tur: 'cok' }), sonuc: { baslik: 'Kaydedildi.', maddeler: ['ölçüt 1'], not: 'Örnek cevap: x' } });
  dogru(/<textarea/.test(a) && !/b-soru__siklar/.test(a) && /<ul><li>ölçüt 1<\/li><\/ul><p class="b-soru__not">Örnek cevap: x<\/p>/.test(a), 'açık uçlu');
  atar(() => B.soru({ soru: 'S' }), /secenekler ya da govde/);
  atar(() => B.soru({ soru: 'S', secenekler: ['a'] }), /2–8/);
  atar(() => B.soru({ soru: 'S', secenekler: ['a', 'b'], secili: 'C' }), /secili/);
  atar(() => B.soru({ soru: 'S', secenekler: ['a', 'b'], dogru: 'ab' }), /dogru/);
  atar(() => B.soru({ kip: 'radyo', soru: 'S', secenekler: ['a', 'b'] }), /isim gerekli/);
  atar(() => B.soru({ soru: 'S', secenekler: ['a', 'b'], sonuc: { metin: 'x' } }), /sonuc\.baslik gerekli/);
  atar(() => B.soru({ soru: 'S', secenekler: ['a', 'b'], sonuc: { baslik: 'x', maddeler: 'y' } }), /maddeler dizi/);
  atar(() => B.soru({ soru: 'S', secenekler: ['a', 'b'], kip: 'cizgi' }), /kip/);
});
t('tercih: radyo grubu, tek seçili, tek sekme durağı, veri her düğmede', () => {
  const h = B.tercih({ etiket: 'ayar-boyut', secenekler: { kucuk: 'Küçük', buyuk: 'Büyük' }, deger: 'buyuk', veri: { ayar: 'lifeos.boyut' } });
  dogru(/^<div class="b-tercih" role="radiogroup" aria-labelledby="ayar-boyut">/.test(h), h);
  dogru((h.match(/role="radio"/g) || []).length === 2 && /aria-checked="true" tabindex="0" data-ayar="lifeos\.boyut" data-deger="buyuk">Büyük/.test(h), 'seçili');
  dogru(/aria-checked="false" tabindex="-1" data-ayar="lifeos\.boyut" data-deger="kucuk"/.test(h), 'seçili olmayan sekmede değil');
  dogru(/aria-checked="false" tabindex="0"[^>]*data-deger="a"/.test(B.tercih({ ad: 'X', secenekler: { a: 'A', b: 'B' } })), 'seçim yoksa ilki sekme durağı');
  dogru(/aria-label="X"/.test(B.tercih({ ad: 'X', secenekler: { a: 'A' } })), 'ad');
  atar(() => B.tercih({ ad: 'X', secenekler: {} }), /boş/);
  atar(() => B.tercih({ etiket: 'Kötü id', secenekler: { a: 'A' } }), /etiket/);
  atar(() => B.tercih({ secenekler: { a: 'A' } }), /ad gerekli/);
});
t('alan: arama, salt, uzun, yer tutucu, veri, optgroup, çoklu ve radyo grubu, Türkçe ondalık', () => {
  const s = B.alan({ ad: 'Su', isim: 'su', tur: 'sayi', yerTutucu: '0 – 5', veri: { 'kayit-gun': '' } });
  dogru(/type="text"[^>]*data-kayit-gun=""[^>]*placeholder="0 – 5"[^>]* inputmode="decimal"/.test(s), 'sayı metin kutusu, virgül yazılır: ' + s);
  dogru(/type="search"/.test(B.alan({ ad: 'Ara', isim: 'ara', tur: 'arama' })) && / readonly/.test(B.alan({ ad: 'K', isim: 'k', salt: true })), 'arama, salt');
  dogru(/b-alan__giris--uzun" rows="12"/.test(B.alan({ ad: 'N', isim: 'n', tur: 'cok', uzun: true })), 'uzun');
  const g = B.alan({ ad: 'Tür', isim: 't', tur: 'secim', deger: 'su', secenekler: { Genel: { su: 'Su' }, Spor: { kosu: 'Koşu' } } });
  dogru(/<optgroup label="Genel"><option value="su" selected>Su<\/option><\/optgroup><optgroup label="Spor">/.test(g), 'optgroup');
  const c = B.alan({ ad: 'Günler', isim: 'gun', tur: 'coklu', secenekler: { 0: 'Pzt', 1: 'Sal', 2: 'Çar' }, deger: [0, 2] });
  dogru(/^<fieldset class="b-alan b-alan--grup"><legend class="b-alan__ad">Günler<\/legend>/.test(c) && (c.match(/type="checkbox" name="gun" value="\d"/g) || []).length === 3, 'çoklu: ' + c);
  dogru(/value="0" checked/.test(c) && !/value="1" checked/.test(c) && /value="2" checked/.test(c) && !/id="b-alan-gun"/.test(c), 'işaretliler, yinelenen kimlik yok');
  dogru(/type="radio" name="g" value="ag" checked/.test(B.alan({ ad: 'Görünüm', isim: 'g', tur: 'radyo', secenekler: { liste: 'Liste', ag: 'Ağ' }, deger: 'ag' })), 'radyo');
  atar(() => B.alan({ ad: 'G', isim: 'g', tur: 'coklu', secenekler: { a: 'A' }, deger: 'a' }), /dizi/);
  atar(() => B.alan({ ad: 'G', isim: 'g', tur: 'radyo', secenekler: { a: 'A' }, deger: 'z' }), /seçeneklerde yok/);
  atar(() => B.alan({ ad: 'G', isim: 'g', tur: 'secim', secenekler: { G: { a: 'A' } }, deger: 'G' }), /seçeneklerde yok/, 'grup adı değer değil');
});
t('uzun satır ve odaklanan ileti', () => {
  dogru(/^<div class="b-satir b-satir--uzun">/.test(B.satir({ ad: 'Test', not: '2 doğru (ölçüldü)', uzun: true })) && !/--uzun/.test(B.satir({ ad: 'x' })), 'uzun');
  dogru(/role="alert" tabindex="-1"/.test(B.uyari({ tur: 'hata', metin: 'x' })) && /role="status" tabindex="-1"/.test(B.uyari({ tur: 'tamam', metin: 'x' })) && !/tabindex/.test(B.uyari({ tur: 'bilgi', metin: 'x' })), 'ileti odaklanır');
});

// ---- CSS ve katalog sayfası: A2 kuralları yapısal olarak ----
const css = fs.readFileSync(path.join(__dirname, 'bilesen.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const kabukCss = fs.readFileSync(path.join(__dirname, 'kabuk.css'), 'utf8');
t('bilesen.css yalnız kabuk.css jetonlarını kullanır; yeni jeton ve renk yok', () => {
  // halkanın konum değişkenleri jeton değildir: --a taşın kendisi düğmeye satır içi yazar, --x --y --r ekran açarken (kabuk.js halkaAc); tanımı hiçbir css'te yok
  const jeton = new Set((kabukCss.match(/--[a-z0-9-]+(?=\s*:)/g) || []).concat(['--a', '--x', '--y', '--r']));
  ['--a', '--x', '--y', '--r'].forEach(v => dogru(!new RegExp(v + '\\s*:').test(kabukCss), 'konum değişkeni kabuk.css\'te jeton olmuş: ' + v));
  dogru(/style="--a:-90deg"/.test(B.halka({ id: 'h', ad: 'Y', ogeler: [{ ad: 'A', yol: '#/a' }, { ad: 'B', yol: '#/b' }] })), '--a taşın satır içi yazdığı açı');
  (css.match(/var\(--[a-z0-9-]+/g) || []).forEach(v => dogru(jeton.has(v.slice(4)), 'kabuk.css\'te yok: ' + v));
  dogru(!/(^|[;{\s])--[a-z0-9-]+\s*:/.test(css), 'yeni jeton tanımı var');
  dogru(!/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(css), 'elle renk var');
  (css.match(/font-family:[^;}]+/g) || []).forEach(f => dogru(/font-family:var\(--(piksel|govde)\)/.test(f), f));
  (css.match(/border-radius:[^;}]+/g) || []).forEach(k => dogru(/^border-radius:(0|var\(--kose(-k)?\))$/.test(k), 'köşe yalnız jetondan: ' + k));
});
t('bilesen.css bağlam seçicisi yazmaz: her kural bir .b- taşıyla başlar', () => {
  const kurallar = css.replace(/@media[^{]+\{/g, '').split('}').map(x => x.split('{')[0].trim()).filter(Boolean);
  dogru(kurallar.length > 40, 'kural sayısı ' + kurallar.length);
  kurallar.forEach(k => k.split(',').forEach(s => dogru(/^(a|textarea|select|input)?\.b-[a-z]/.test(s.trim()), 'bağlam seçicisi: ' + s.trim())));
});
t('katalog sayfası yalnız kabuk.css, bilesen.css, bilesen.js (ve gömülü yazı tipi) yükler; yirmi sekiz taşı gösterir', () => {
  const h = fs.readFileSync(path.join(__dirname, 'bilesen.html'), 'utf8');
  const yuk = (h.match(/(?:href|src)="[^"#]+\.(?:css|js)"/g) || []).map(x => x.replace(/^(href|src)="|"$/g, ''));
  dogru(JSON.stringify(yuk) === JSON.stringify(['../brand/ortak/piksel-yazi.css', 'kabuk.css', 'bilesen.css', 'bilesen.js']), yuk.join(', '));
  for (let n = 1; n <= 28; n++) dogru(h.indexOf('tas(' + n + ',') > 0, 'taş ' + n + ' katalogda yok');
});

t('kart: ön yüz, arka odak alır, dört not düğmesi aralıklarıyla, kapalıyken tek eylem', () => {
  const on = B.kart({ on: 'Arkhe?', veri: { kart: 'k1' }, eylem: { metin: 'Cevabı göster', tur: 'ana' } });
  dogru(/^<div class="b-kart" data-kart="k1"><p class="b-kart__on">Arkhe\?<\/p><div class="b-eylemler"><button[^>]*b-dugme--ana">Cevabı göster/.test(on) && !/b-kart__arka|b-kart__not/.test(on), on);
  const a = B.kart({ on: 'Arkhe?', arka: 'Su', notlar: ['Yine', 'Zor', 'İyi', 'Kolay'].map((m, i) => ({ metin: m, sure: i ? i + ' gün sonra' : 'şimdi', veri: { not: i + 1 } })) });
  dogru(/<p class="b-kart__arka" tabindex="-1">Su<\/p><div class="b-kart__notlar" role="group" aria-label="Ne kadar hatırladın\?">/.test(a), 'arka odak alır, notlar grup');
  dogru((a.match(/<button type="button" class="b-kart__not" data-not="\d"><span class="b-kart__notad">[^<]+<\/span><span class="gizli">, <\/span><span class="b-kart__sure">/g) || []).length === 4, 'dört not, ad + süre okunur');
  atar(() => B.kart({ on: 'x', notlar: [{ metin: 'a', sure: 'b' }] }), /arka yüzle/, 'arkasız not');
  atar(() => B.kart({ on: 'x', arka: 'y', notlar: [] }), /notlar/, 'boş not dizisi');
  atar(() => B.kart({ arka: 'y' }), /on gerekli/, 'önsüz kart');
});
t('tablo: başlıklar kapsamlı, bugün işaretli, veri yok sıfır değil, kendi kabında kayar', () => {
  const h = B.tablo({ etiket: 'kh-gunler', ilk: 'Tür', sutunlar: [{ metin: 'Pzt', alt: '9 Kas' }, { metin: 'Sal', alt: '10 Kas', bugun: true }],
    satirlar: [{ ad: 'Su', alt: 'L', pul: 'ölçüldü', hucreler: [{ metin: '2', okunur: 'ölçüldü' }, null] }, { ad: 'Uyku', hucreler: [{ metin: '7', alt: 'tahmin' }, { metin: '8' }] }] });
  dogru(/^<div class="b-tablo" role="region" tabindex="0" aria-labelledby="kh-gunler"><table><thead><tr><th scope="col">Tür<\/th><th scope="col">Pzt<small>9 Kas<\/small><\/th><th scope="col" aria-current="date">Sal/.test(h), h);
  dogru(/<th scope="row">Su <small>L<\/small> <span class="b-pul b-pul--normal">ölçüldü<\/span><\/th><td>2<span class="gizli"> ölçüldü<\/span><\/td><td class="b-tablo__yok"><span aria-hidden="true">·<\/span><span class="gizli">veri yok<\/span><\/td>/.test(h), 'satır başlığı, gizli etiket, veri yok');
  dogru(/<td>7<small>tahmin<\/small><\/td>/.test(h), 'görünür alt satır');
  atar(() => B.tablo({ ad: 'T', ilk: 'Tür', sutunlar: [{ metin: 'a' }], satirlar: [{ ad: 'x', hucreler: [] }] }), /sütun sayısı/, 'eksik hücre');
  atar(() => B.tablo({ ad: 'T', ilk: 'Tür', sutunlar: [{ metin: 'a' }], satirlar: [] }), /satirlar/, 'boş tablo');
  atar(() => B.tablo({ etiket: 'Kötü kimlik', ilk: 'Tür', sutunlar: [{ metin: 'a' }], satirlar: [{ ad: 'x', hucreler: [null] }] }), /kimliği/, 'kötü etiket');
});
t('şerit ve adımlar: sayaç role=timer ve son dakika sınıfı; numaralar sırayla, şu anki ve yapılan işaretli', () => {
  const s = B.serit({ baslik: 'TYT provası', alt: 'Test 1/3', sayac: { metin: '00:59', ad: 'Kalan süre', az: true } });
  dogru(s === '<div class="b-serit"><p class="b-serit__baslik">TYT provası<span class="b-serit__alt">Test 1/3</span></p><span class="b-serit__sayac b-serit__sayac--az" role="timer" aria-label="Kalan süre">00:59</span></div>', s);
  const a = B.adimlar({ ad: 'Sorular', ogeler: [{ etiket: 'Soru 1, cevaplandı', dolu: true, veri: { deneme: 'git', i: 0 } }, { etiket: 'Soru 2', secili: true, veri: { deneme: 'git', i: 1 } }] });
  dogru(a === '<nav class="b-adimlar" aria-label="Sorular"><button type="button" class="b-adimlar__no b-adimlar__no--dolu" data-deneme="git" data-i="0" aria-label="Soru 1, cevaplandı">1</button>' +
    '<button type="button" class="b-adimlar__no" data-deneme="git" data-i="1" aria-current="step" aria-label="Soru 2">2</button></nav>', a);
  atar(() => B.adimlar({ ad: 'S', ogeler: [] }), /ogeler/, 'boş adımlar');
  atar(() => B.serit({ baslik: 'x', sayac: { metin: '1' } }), /sayac.ad/, 'adsız sayaç');
});
t('ayar satırı: ad kimlikli, tek denetim ya da birden çoksa grup, salt değer; alanın gizli etiketi', () => {
  const t1 = B.ayar({ ad: 'Tema', not: 'Açık ya da koyu.', id: 'ayar-tema', govde: B.tercih({ etiket: 'ayar-tema', secenekler: { a: 'A' }, deger: 'a' }), veri: { 'ayar-satir': 'lifeos.tema' } });
  dogru(/^<div class="b-ayar" data-ayar-satir="lifeos.tema"><p class="b-ayar__metin"><span class="b-ayar__ad" id="ayar-tema">Tema<\/span><span class="b-ayar__not">Açık ya da koyu.<\/span><\/p><div class="b-ayar__denetim"><div class="b-tercih" role="radiogroup" aria-labelledby="ayar-tema">/.test(t1), t1);
  dogru(/<div class="b-ayar__denetim" role="group" aria-labelledby="ayar-x">/.test(B.ayar({ ad: 'X', id: 'ayar-x', govde: [B.pul('a'), B.pul('b')] })), 'birden çok denetim grup olur');
  dogru(/<span class="b-ayar__deger">Kalıcı<\/span>/.test(B.ayar({ ad: 'Depo', id: 'ayar-d', deger: 'Kalıcı', isik: true })) && /b-ayar b-ayar--isik/.test(B.ayar({ ad: 'D', id: 'ayar-d', deger: 'x', isik: true })), 'salt değer, ışık');
  dogru(/<label class="b-alan__ad gizli" for="b-alan-boy">Boy<\/label>/.test(B.alan({ ad: 'Boy', isim: 'boy', tur: 'sayi', gizliAd: true })), 'gizli etiket yine label');
  atar(() => B.ayar({ ad: 'X', id: 'Kötü', deger: 'x' }), /id/, 'kötü kimlik');
});
t('ağ: düğümler bağlantı, kenar türleri, açıklama örnek çizgili, kötü girdi reddedilir', () => {
  const d = [{ id: 'a', ad: 'Sokrates ve sorgulama yöntemi üzerine', x: 10, y: 10, r: 7, href: '#/motor/not/a', etiket: 'Sokrates, 1 bağ' }, { id: 'b', ad: 'Erdem', x: 600, y: 300, href: '#/motor/not/b' }];
  const h = B.ag({ ad: 'Not ağı: 2 not', en: 640, boy: 400, dugumler: d, kenarlar: [{ a: 'a', b: 'b', tur: 'duz' }], ozet: '2 not · 1 bağ', aciklama: { duz: 'bağ', kalin: 'çelişki' } });
  dogru(/^<figure class="b-ag"><svg class="b-ag__cizim" viewBox="0 0 640 400" role="group" aria-label="Not ağı: 2 not"><line class="b-ag__duz" x1="10" y1="10" x2="600" y2="300"\/>/.test(h), h);
  dogru(/<a href="#\/motor\/not\/a" aria-label="Sokrates, 1 bağ"><title>Sokrates ve sorgulama yöntemi üzerine<\/title><circle cx="10" cy="10" r="7"\/><text x="24" y="14">Sokrates ve sorgulama…<\/text><\/a>/.test(h), 'düğüm: bağlantı, tam ad title, kısaltılmış yazı');
  dogru(/<text x="586" y="304" text-anchor="end">Erdem<\/text>/.test(h), 'sağ kenarda ad sola yazılır');
  dogru(/<figcaption class="b-ag__alt"><span>2 not · 1 bağ<\/span><ul class="b-ag__aciklama"><li><span class="b-ag__im b-ag__im--duz" aria-hidden="true"><\/span>bağ<\/li><li><span class="b-ag__im b-ag__im--kalin"/.test(h), 'özet ve açıklama');
  dogru(/b-ag__cizim--kalabalik/.test(B.ag({ ad: 'A', en: 10, boy: 10, dugumler: Array.from({ length: 41 }, (_, i) => ({ id: 'n' + i, ad: 'n', x: 1, y: 1, href: '#/n' })) })), 'kalabalıkta adlar odakta');
  atar(() => B.ag({ ad: 'A', en: 1, boy: 1, dugumler: [d[0]] }), /en az 2/, 'tek düğüm');
  atar(() => B.ag({ ad: 'A', en: 640, boy: 400, dugumler: d, kenarlar: [{ a: 'a', b: 'z', tur: 'duz' }] }), /bilinmeyen/, 'kopuk kenar');
  atar(() => B.ag({ ad: 'A', en: 640, boy: 400, dugumler: d, kenarlar: [{ a: 'a', b: 'b', tur: 'mor' }] }), /kenar.tur/, 'bilinmeyen çizgi');
  atar(() => B.ag({ ad: 'A', en: 640, boy: 400, dugumler: [d[0], Object.assign({}, d[1], { href: 'javascript:alert(1)' })] }), /href/, 'javascript: bağlantısı');
});
t('karşılama (Manzara): manzara şeridi + h1 selam, iş kartında sırada/adım/tek ana düğme/bağlantı/halka, bekleyenler tek kartta, alanlar; boşsa kap çizilmez', () => {
  const h = B.karsilama({ tarih: 'Cumartesi · 14 Kasım', selam: 'Günaydın.', ozet: 'Bugün bir dersin var.', sira: { ust: 'Felsefe · Ünite 1', metin: 'Sanı', simge: 'felsefe' }, adim: 'Ders 3 / 9', eylem: { metin: 'Başla', href: '#/alan/felsefe/ders/x' },
    baglanti: { metin: 'Günü planla', href: '#/motor/plan' }, ilerleme: { deger: 2, toplam: 8 }, ekler: ['', B.uyari({ tur: 'bilgi', metin: 'İpucu' }), B.uyari({ tur: 'bilgi', metin: 'Onay', alt: '<b>', simge: 'onay', renk: 'mor' })],
    plan: { href: '#/motor/plan', satirlar: [{ saat: '18:30', ad: 'Okuma', bitti: true, dk: 20 }, { saat: '19:30', ad: 'Felsefe <dersi>', not: 'Sanı', dk: 12 }] },
    alanlar: [{ ad: 'Felsefe', not: 'Soru, kavram', href: '#/alan/felsefe', simge: 'felsefe', renk: 'turuncu', yuzde: 25 }, { ad: 'Dil', href: '#/alan/dil', simge: 'dil', renk: 'yok' }] });
  dogru(h.startsWith('<div class="b-karsilama"><div class="b-karsilama__sahne"><canvas class="b-karsilama__manzara" width="384" height="96" aria-hidden="true"></canvas><div class="b-karsilama__ic"><p class="b-karsilama__tarih">Cumartesi · 14 Kasım</p><h1 class="b-karsilama__selam">Günaydın.</h1><p class="b-karsilama__ozet">Bugün bir dersin var.</p></div></div>'), h);
  dogru(h.includes('<p class="b-karsilama__ust"><svg aria-hidden="true"><use href="#i-felsefe"/></svg>Felsefe · Ünite 1</p><h2 class="b-karsilama__sira">Sanı</h2><p class="b-karsilama__adim">Ders 3 / 9</p><div class="b-karsilama__eylem"><a class="b-dugme b-dugme--ana" href="#/alan/felsefe/ders/x">Başla<svg class="b-karsilama__ileri" aria-hidden="true"><use href="#i-ok"/></svg></a><a class="b-karsilama__baglanti" href="#/motor/plan">Günü planla</a></div>'), 'iş kartı');
  dogru(/<h2 class="b-karsilama__baslik" id="b-k-plan">Bugünün planı<\/h2><a class="b-karsilama__tumu" href="#\/motor\/plan">Planı aç<\/a><\/div><ol class="b-karsilama__plan"><li class="b-karsilama__blok b-karsilama__blok--bitti"><span class="b-karsilama__saat">18:30<\/span><span class="b-karsilama__tik" aria-hidden="true"><svg><use href="#i-tik"\/><\/svg><\/span>[\s\S]*?tamamlandı<\/span><\/li><li class="b-karsilama__blok">[\s\S]*?Felsefe &lt;dersi&gt;[\s\S]*?b-karsilama__alannot">Sanı[\s\S]*?#i-saat"\/><\/svg>12 dk<\/span><\/li><\/ol>/.test(h), 'plan: saat, tik, ad (kaçışlı), süre ya da tamamlandı');
  dogru(h.indexOf('id="b-k-plan"') < h.indexOf('id="b-k-bekleyen"') && h.indexOf('id="b-k-bekleyen"') < h.indexOf('id="b-k-alanlar"'), 'sıra: iş, plan, bekleyenler, alanlar');
  dogru(h.includes('<div class="b-uyari b-uyari--satir b-uyari--bilgi b-uyari--simgeli" role="note"><span class="b-simge b-simge--mor" aria-hidden="true"><svg><use href="#i-onay"/></svg></span>') && h.includes('Onay<span class="b-uyari__alt">&lt;b&gt;</span></p>'), 'simgeli bekleyen satırı, alt satır kaçışlı');
  dogru(/aria-label="İlerleme yüzde 25"[\s\S]*stroke-dashoffset="188\.5"[\s\S]*%25<small>2 \/ 8 ders<\/small>/.test(h), 'halka');
  dogru(h.includes('<h2 class="b-karsilama__baslik" id="b-k-bekleyen">Bekleyenler</h2></div><div class="b-karsilama__ek"><div class="b-uyari b-uyari--satir b-uyari--bilgi" role="note">'), 'bekleyenler');
  dogru(h.includes('b-simge--turuncu') && h.includes('<use href="#i-felsefe"/>') && h.includes('%25</span>') && /b-simge--turuncu[\s\S]*Dil/.test(h) && h.includes('#i-sag'), 'alanlar: renk, simge, yüzde, bilinmeyen renk turuncuya düşer');
  dogru((h.match(/<h1/g) || []).length === 1 && (h.match(/b-dugme--ana/g) || []).length === 1, 'tek h1, tek ana düğme');
  dogru(!/b-karsilama__ek|b-karsilama__baglanti|b-karsilama__adim|b-karsilama__halka|b-karsilama__alanlar|b-karsilama__plan|b-karsilama__ozet/.test(B.karsilama({ selam: 'Selam.', eylem: { metin: 'Başla', href: '#/a' }, ekler: ['', ''], plan: { href: '#/p', satirlar: [] } })), 'boş ekler, bağlantısız, ilerlemesiz, alansız: kap yok');
  atar(() => B.karsilama({ selam: 'S' }), /seçenek nesnesi/, 'düğmesiz karşılama');
  atar(() => B.karsilama({ selam: 'S', eylem: { metin: 'B', href: '#/a' }, baglanti: { metin: 'x', href: 'javascript:alert(1)' } }), /href/, 'tehlikeli bağlantı');
  atar(() => B.karsilama({ selam: 'S', eylem: { metin: 'B', href: '#/a' }, alanlar: [{ ad: 'x', href: 'javascript:alert(1)' }] }), /href/, 'tehlikeli alan bağlantısı');
});
t('halka ve komut çubuğu: menü/menuitem, dialog/combobox/listbox, gizli çizilir; sonuç öğeleri option, boşsa «Sonuç yok»', () => {
  const h = B.halka({ id: 'halka', ad: 'Yerler', ogeler: ['Bugün', 'Öğren', 'Sağlık', 'Ayarlar'].map((ad, i) => ({ ad, yol: '#/y' + i })) });
  dogru(/^<div id="halka" class="b-halka" role="menu" aria-label="Yerler" hidden><span class="b-halka__merkez" aria-hidden="true"><\/span><button type="button" role="menuitem" class="b-halka__oge" data-yol="#\/y0" style="--a:-90deg">Bugün<\/button>/.test(h), h);
  dogru(/style="--a:0deg">Öğren/.test(h) && /style="--a:90deg">Sağlık/.test(h) && /style="--a:180deg">Ayarlar/.test(h), 'ilki tepede, saat yönünde eşit açı');
  atar(() => B.halka({ id: 'halka', ad: 'Y', ogeler: [{ ad: 'A', yol: '#/a' }] }), /en az 2/, 'tek öğeli halka');
  atar(() => B.halka({ id: 'halka', ad: 'Y', ogeler: [{ ad: 'A', yol: '#/a' }, { ad: 'B', yol: 'javascript:x' }] }), /href/, 'tehlikeli yol');
  atar(() => B.halka({ id: 'Halka', ad: 'Y', ogeler: [{ ad: 'A', yol: '#/a' }, { ad: 'B', yol: '#/b' }] }), /id/, 'kötü kimlik');
  const k = B.komut({ id: 'komut', ad: 'Ara', yerTutucu: 'Bir yer ara' });
  ['role="dialog" aria-modal="true" aria-label="Ara" hidden', 'role="combobox" aria-expanded="false" aria-controls="komut-liste" aria-autocomplete="list" aria-label="Bir yer ara" placeholder="Bir yer ara"',
    '<ul id="komut-liste" class="b-komut__liste" role="listbox" aria-label="Sonuçlar"></ul>', '<p id="komut-durum" class="gizli" aria-live="polite"></p>', '<kbd>Esc</kbd>'].forEach(x => dogru(k.indexOf(x) >= 0, x));
  const l = B.komutListe({ id: 'komut', ogeler: [{ ad: 'Not', etiket: 'araç' }, { ad: 'Koyu temaya geç', etiket: 'eylem' }] });
  dogru(l === '<li class="b-komut__oge" role="option" id="komut-0" aria-selected="true" data-i="0"><span>Not</span><span class="b-komut__etiket">araç</span></li>' +
    '<li class="b-komut__oge" role="option" id="komut-1" aria-selected="false" data-i="1"><span>Koyu temaya geç</span><span class="b-komut__etiket">eylem</span></li>', l);
  dogru(B.komutListe({ id: 'komut', ogeler: [] }) === '<li class="b-komut__bos" role="presentation">Sonuç yok</li>', 'boş sonuç');
  atar(() => B.komutListe({ id: 'komut', ogeler: null }), /dizi/, 'dizisiz sonuç');
});
t('sohbet, çipler, yanlı düzen: geçmiş, şu anki form ya da bölüm, gizli legend, yan sütun ve gezinme; satır yerinde form, canlı liste; kart üst satırı; şerit duyurusu', () => {
  const s = B.sohbet({ ad: 'Sohbet', gecmis: [{ soru: 'Adın?', cevap: ['Ece'], eylem: { metin: 'Değiştir', tur: 'sade', etiket: 'Cevabı değiştir: Adın?' } }, { soru: 'Yaşın?', atlandi: true }],
    simdi: { form: { 'tn-soru': 'is' }, soru: { metin: 'Ne iş yaparsın?', id: 'tn-soru-metni', canli: true }, govde: '' } });
  dogru(/^<section class="b-sohbet" aria-label="Sohbet"><ol class="b-sohbet__akis"><li class="b-sohbet__soru">Adın\?<\/li><li class="b-sohbet__ben"><span>Ece<\/span><button type="button" class="b-dugme b-dugme--sade" aria-label="Cevabı değiştir: Adın\?"/.test(s), s);
  dogru(/<li class="b-sohbet__ben"><span class="b-sohbet__atla">Atladın<\/span><\/li>/.test(s), 'atlanan soru');
  dogru(/<form class="b-sohbet__simdi" data-tn-soru="is" novalidate><p class="b-sohbet__soru b-sohbet__soru--simdi" id="tn-soru-metni" aria-live="polite">Ne iş yaparsın\?<\/p><\/form><\/section>$/.test(s), 'şu anki soru formda, canlı');
  const b = B.sohbet({ ad: 'Sohbet', simdi: { etiket: 'tn-onay', soru: { metin: 'Kaydedeyim mi?', id: 'tn-onay', odak: true }, govde: [B.pul('x')] } });
  dogru(b === '<section class="b-sohbet" aria-label="Sohbet"><section class="b-sohbet__simdi" aria-labelledby="tn-onay"><p class="b-sohbet__soru b-sohbet__soru--simdi" id="tn-onay" tabindex="-1">Kaydedeyim mi?</p>' +
    '<span class="b-pul b-pul--normal">x</span></section></section>', b);
  atar(() => B.sohbet({ ad: 'S', simdi: { govde: '' } }), /etiket/, 'formsuz ve başlıksız şu an');
  atar(() => B.sohbet({ ad: 'S', gecmis: [{ soru: 'x' }], simdi: { form: {}, govde: '' } }), /cevap/, 'cevapsız geçmiş');
  const c = B.cipler({ ad: 'Hızlı seçenekler, biri seçilir', ogeler: [{ metin: 'Öğrenci', basili: true, veri: { 'tn-cip': 'ogr' } }, { metin: 'Çalışıyorum', veri: { 'tn-cip': 'is' } }] });
  dogru(/^<fieldset class="b-cipler"><legend class="gizli">Hızlı seçenekler, biri seçilir<\/legend><div class="b-eylemler"><button type="button" class="b-dugme b-dugme--ikincil" aria-pressed="true" data-tn-cip="ogr">Öğrenci/.test(c) && /aria-pressed="false" data-tn-cip="is"/.test(c), c);
  atar(() => B.cipler({ ad: 'x', ogeler: [] }), /ogeler/, 'boş çipler');
  const y = B.yanli({ taraf: 'sol', yan: B.gezinme({ ad: 'Ayar grupları', ogeler: [{ metin: 'Görünüm', href: '#/ayarlar?grup-gorunum' }] }), ana: ['<p>a</p>', '<p>b</p>'] });
  dogru(y === '<div class="b-yanli b-yanli--sol"><div class="b-yanli__yan"><nav class="b-gezinme" aria-label="Ayar grupları"><a class="b-gezinme__oge" href="#/ayarlar?grup-gorunum">Görünüm</a></nav></div>' +
    '<div class="b-yanli__ana"><p>a</p><p>b</p></div></div>', y);
  dogru(/^<div class="b-yanli b-yanli--sag"><div class="b-yanli__ana">a<\/div><aside class="b-yanli__yan">y<\/aside><\/div>$/.test(B.yanli({ taraf: 'sag', tamamlayici: true, ana: 'a', yan: 'y' })), 'sağda tamamlayıcı yan');
  atar(() => B.yanli({ taraf: 'ust', ana: '', yan: '' }), /taraf/, 'bilinmeyen taraf');
  atar(() => B.gezinme({ ad: 'G', ogeler: [{ metin: 'x', href: 'javascript:1' }] }), /href/, 'tehlikeli gezinme');
  const f = B.liste({ ad: 'King\'in anladığı', canli: true, ogeler: [{ form: { veri: { 'tn-olgu': 'o1' }, govde: B.alan({ ad: 'Düzelt', isim: 'duzelt' }) } }, { ad: 'Ece', not: 'Ad', pul: 'senin sözün', uzun: true, eylemler: [{ metin: 'Sil', tur: 'sade' }] }] });
  dogru(/^<ul class="b-liste b-liste--satir" aria-label="King&#39;in anladığı" aria-live="polite"><li><form class="b-satir b-satir--form" data-tn-olgu="o1" novalidate><div class="b-alan">/.test(f), f);
  dogru(/<div class="b-satir b-satir--uzun"><span class="b-satir__metin"><span class="b-satir__ad">Ece<\/span><span class="b-satir__not">Ad<\/span><\/span><span class="b-pul b-pul--normal">senin sözün<\/span><div class="b-eylemler">/.test(f), 'uzun satır eylemli');
  dogru(/^<div class="b-kart"><p class="b-kart__ust">Bugün 2 tekrar, 1 yeni kart<\/p><p class="b-kart__on">Arkhe\?<\/p>/.test(B.kart({ ust: 'Bugün 2 tekrar, 1 yeni kart', on: 'Arkhe?' })), 'kart üst satırı');
  dogru(/<\/span><p class="gizli" aria-live="polite" id="deneme-duyuru"><\/p><\/div>$/.test(B.serit({ baslik: 'D', sayac: { metin: '10:00', ad: 'Kalan süre' }, duyuru: 'deneme-duyuru' })), 'şerit duyurusu');
  atar(() => B.serit({ baslik: 'D', duyuru: 'Kötü kimlik' }), /duyuru/, 'kötü duyuru kimliği');
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
