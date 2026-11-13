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
  panel: () => B.panel({ baslik: K, govde: [B.pul('x')] })
};

t('katalog on iki taş sunar ve her biri test örneğine sahip', () => {
  dogru(B.TASLAR.length === 12, 'taş sayısı ' + B.TASLAR.length);
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

// ---- CSS ve katalog sayfası: A2 kuralları yapısal olarak ----
const css = fs.readFileSync(path.join(__dirname, 'bilesen.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const kabukCss = fs.readFileSync(path.join(__dirname, 'kabuk.css'), 'utf8');
t('bilesen.css yalnız kabuk.css jetonlarını kullanır; yeni jeton ve renk yok', () => {
  const jeton = new Set((kabukCss.match(/--[a-z0-9-]+(?=\s*:)/g) || []));
  (css.match(/var\(--[a-z0-9-]+/g) || []).forEach(v => dogru(jeton.has(v.slice(4)), 'kabuk.css\'te yok: ' + v));
  dogru(!/(^|[;{\s])--[a-z0-9-]+\s*:/.test(css), 'yeni jeton tanımı var');
  dogru(!/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(css), 'elle renk var');
  (css.match(/font-family:[^;}]+/g) || []).forEach(f => dogru(/font-family:var\(--(piksel|govde)\)/.test(f), f));
  dogru(!/border-radius/.test(css), 'köşe yuvarlatma');
});
t('bilesen.css bağlam seçicisi yazmaz: her kural bir .b- taşıyla başlar', () => {
  const kurallar = css.replace(/@media[^{]+\{/g, '').split('}').map(x => x.split('{')[0].trim()).filter(Boolean);
  dogru(kurallar.length > 40, 'kural sayısı ' + kurallar.length);
  kurallar.forEach(k => k.split(',').forEach(s => dogru(/^(a|textarea|select|input)?\.b-[a-z]/.test(s.trim()), 'bağlam seçicisi: ' + s.trim())));
});
t('katalog sayfası yalnız kabuk.css, bilesen.css, bilesen.js (ve gömülü yazı tipi) yükler; on iki taşı gösterir', () => {
  const h = fs.readFileSync(path.join(__dirname, 'bilesen.html'), 'utf8');
  const yuk = (h.match(/(?:href|src)="[^"#]+\.(?:css|js)"/g) || []).map(x => x.replace(/^(href|src)="|"$/g, ''));
  dogru(JSON.stringify(yuk) === JSON.stringify(['../brand/ortak/piksel-yazi.css', 'kabuk.css', 'bilesen.css', 'bilesen.js']), yuk.join(', '));
  for (let n = 1; n <= 12; n++) dogru(h.indexOf('tas(' + n + ',') > 0, 'taş ' + n + ' katalogda yok');
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
