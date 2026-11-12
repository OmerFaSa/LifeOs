// Kabuk saf mantık testleri: node kabuk/kabuk.test.js  (✓/✕, çıkış 0/1)
'use strict';
const H = require('./harita.js');
const A = require('./ayar.js');
const K = require('./kabuk.js');

let gecen = 0, kalan = 0;
function t(ad, f) {
  try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); }
}
function esit(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || '') + ' beklenen ' + JSON.stringify(b) + ', gelen ' + JSON.stringify(a)); }
function dogru(x, m) { if (!x) throw new Error(m || 'doğru değil'); }
function sahteDepo(ilk) {
  const v = Object.assign({}, ilk);
  return { v, getItem: k => (k in v ? v[k] : null), setItem: (k, x) => { v[k] = String(x); }, removeItem: k => { delete v[k]; } };
}

// ---- harita ----
t('harita: kayıt geçerli (denetle boş liste)', () => esit(H.denetle(), []));
t('harita: id ve yol tekil', () => {
  const ids = H.YERLER.map(y => y.id), yollar = H.YERLER.map(y => y.yol);
  esit(new Set(ids).size, ids.length); esit(new Set(yollar).size, yollar.length);
});
t('harita: plandaki on alan var', () => {
  const alanlar = H.YERLER.filter(y => y.katman === 'alan').map(y => y.ad);
  esit(alanlar, ['Akademik', 'Dil', 'Felsefe', 'Tarih', 'Müzik', 'Okuma ve yazı', 'Beslenme', 'Hareket', 'Uyku', 'Tahlil']);
});
t('harita: yedi motor ve King var', () => {
  esit(H.YERLER.filter(y => y.katman === 'motor').map(y => y.id), ['yol', 'tekrar', 'soru', 'kayit', 'plan', 'not', 'arama']);
  esit(H.YERLER.filter(y => y.katman === 'king').length, 1);
});
t('harita: taşınmamış alanlar eski ve bağlantılı; Felsefe pilot', () => {
  H.YERLER.filter(y => y.katman === 'alan' && y.id !== 'felsefe').forEach(y => { esit(y.durum, 'eski', y.id); dogru(/\.html$/.test(y.eski), y.id + ' bağlantı'); });
  esit(H.bul('felsefe').durum, 'pilot');
});
t('harita: her yer halkadan en çok iki adımda', () => {
  H.YERLER.forEach(y => dogru(H.halkaAdimi(y.id) <= 2, y.id + ' ' + H.halkaAdimi(y.id)));
  esit(H.halkaAdimi('bugun'), 1); esit(H.halkaAdimi('felsefe'), 2);
});
t('harita: her yer komut çubuğundan bir adımda (adıyla aranınca ilk sırada)', () => {
  const og = K.komutOgeleri(H, A);
  H.YERLER.forEach(y => esit(K.ara(y.ad, og, 1)[0].id, y.id, y.ad));
});
t('harita: halka 3-6 yer; halkadan çıkarılınca denetim yakalar', () => {
  const n = H.halka().length; dogru(n >= 3 && n <= 6, String(n));
  const bozuk = H.YERLER.map(y => Object.assign({}, y, y.id === 'harita' || y.id === 'ogren' ? { halka: undefined } : {}));
  dogru(H.denetle(bozuk).some(h => /iki adımda/.test(h)), 'yakalamadı');
});
t('harita: bozuk satırları yakalar (tekrar id, eski bağlantısız, yanlış katman)', () => {
  const b = H.YERLER.concat([{ id: 'bugun', ad: 'X', katman: 'oda', dal: 'ana', yol: '#/x', durum: 'eski' }]);
  const h = H.denetle(b).join('|');
  dogru(/tekrar ediyor/.test(h) && /bağlantısı yok/.test(h) && /katman/.test(h), h);
});

// ---- ayar şeması ----
t('ayar: her satırın zorunlu alanları var ve varsayılan geçerli', () => {
  const g = A.GRUPLAR.map(x => x.id), gor = {};
  A.SEMA.forEach(s => {
    ['anahtar', 'ad', 'tur', 'aciklama', 'kaynak'].forEach(k => dogru(s[k], s.anahtar + ' ' + k));
    dogru(typeof s.esitlenir === 'boolean', s.anahtar + ' esitlenir');
    dogru(g.indexOf(s.grup) >= 0, s.anahtar + ' grup');
    dogru(A.dogrula(s, s.varsayilan), s.anahtar + ' varsayılan');
    dogru(!gor[s.anahtar], s.anahtar + ' tekrar'); gor[s.anahtar] = 1;
    dogru(/envanter-kabuk-sunucu\.md §3[bc]/.test(s.kaynak), s.anahtar + ' kaynak');
  });
});
t('ayar: doğrulama yanlış değeri reddeder', () => {
  dogru(!A.dogrula(A.tanim('lifeos.boyut'), 'dev'));
  dogru(!A.dogrula(A.tanim('lifeos.sessiz'), { acik: true, bas: '25:00', bit: '07:00' }));
  dogru(A.dogrula(A.tanim('lifeos.sessiz'), { acik: true, bas: '23:30', bit: '06:00' }));
});
t('ayar: oku boş, bozuk ya da geçersiz değerde varsayılana düşer', () => {
  const d = sahteDepo({ 'lifeos.boyut': 'dev', 'lifeos.sessiz': '{bozuk', 'lifeos.satir': 'genis' });
  esit(A.oku(d, 'lifeos.boyut'), 'normal'); esit(A.oku(d, 'lifeos.sessiz').bas, '22:00');
  esit(A.oku(d, 'lifeos.satir'), 'genis'); esit(A.oku(d, 'lifeos.kontrast'), 'normal');
});
t('ayar: yaz geçersizi yazmaz; nesne JSON olarak yazılır', () => {
  const d = sahteDepo();
  esit(A.yaz(d, 'lifeos.boyut', 'dev'), false); esit(d.v['lifeos.boyut'], undefined);
  esit(A.yaz(d, 'lifeos.sessiz', { acik: true, bas: '21:00', bit: '06:30' }), true);
  esit(A.oku(d, 'lifeos.sessiz'), { acik: true, bas: '21:00', bit: '06:30' });
  esit(A.yaz(d, 'lifeos.yok', 'x'), false);
});
t('ayar: sıfırlama tek anahtarı ya da hepsini siler, şema dışına dokunmaz', () => {
  const d = sahteDepo({ 'lifeos.boyut': 'buyuk', 'lifeos.satir': 'genis', 'baska': '1' });
  A.sifirla(d, 'lifeos.boyut'); esit(d.v['lifeos.boyut'], undefined); esit(d.v['lifeos.satir'], 'genis');
  A.sifirla(d); esit(Object.keys(d.v), ['baska']);
});
t('ayar: dışa aktarım yalnız eşitlenenleri verir; içe alım süzer', () => {
  const d = sahteDepo({ 'lifeos.kilit.odeme': 'acik' });
  const p = A.disaAktar(d);
  dogru(!('lifeos.kilit.odeme' in p), 'eşitlenmeyen gitti');
  esit(Object.keys(p).length, A.SEMA.filter(s => s.esitlenir).length);
  const d2 = sahteDepo();
  esit(A.iceAl(d2, { 'lifeos.boyut': 'buyuk', 'lifeos.kontrast': 'cok', 'lifeos.kilit.odeme': 'acik', 'yabanci': 'x' }), ['lifeos.boyut']);
  esit(d2.v, { 'lifeos.boyut': 'buyuk' });
});
t('ayar: kök nitelikleri; Cihaza uy temada niteliği kaldırır', () => {
  const n = A.kokNitelikleri(sahteDepo({ 'lifeos.boyut': 'buyuk' }));
  esit(n['data-boyut'], 'buyuk'); esit(n['data-theme'], null);
  esit(A.kokNitelikleri(sahteDepo({ 'lifeos.tema.secim': 'dark' }))['data-theme'], 'dark');
});
t('ayar: ciz her seçeneği bir radyo düğmesi yapar, seçili tek, metin kaçışlı', () => {
  const s = A.tanim('lifeos.boyut'), h = A.ciz(s, 'buyuk');
  esit((h.match(/role="radio"/g) || []).length, 4);
  esit((h.match(/aria-checked="true"/g) || []).length, 1);
  dogru(/data-deger="buyuk"[^>]*>Büyük/.test(h.replace('aria-checked="true" tabindex="0" ', '')) || /aria-checked="true"[^>]*data-deger="buyuk"/.test(h));
  dogru(!/<script/.test(A.ciz(Object.assign({}, s, { ad: '<script>' }), 'normal')));
  dogru(/type="time"/.test(A.ciz(A.tanim('lifeos.sessiz'), A.tanim('lifeos.sessiz').varsayilan)));
});

// ---- komut çubuğu sıralaması ----
t('katla: Türkçe harfler (ç ğ ı İ ö ş ü) ve büyük/küçük', () => {
  esit(K.katla('ÇĞIİÖŞÜ çğıiöşü'), 'cgiiosu cgiiosu');
  esit(K.katla('  Okuma   ve YAZI '), 'okuma ve yazi');
  esit(K.katla('İstanbul'), K.katla('istanbul'));
});
const og = K.komutOgeleri(H, A);
t('ara: aksansız yazınca bulur (muzik → Müzik, saglik → Sağlık, uyku)', () => {
  esit(K.ara('muzik', og, 1)[0].id, 'muzik');
  esit(K.ara('saglik', og, 1)[0].id, 'saglik');
  esit(K.ara('UYKU', og, 1)[0].id, 'uyku');
});
t('ara: büyük İ ve I doğru katlanır (YAZI → yazı, İLK → ilk)', () => {
  const y = K.ara('YAZI', og, 3).map(o => o.id);
  esit(y.slice(0, 2).sort(), ['lifeos.boyut', 'lifeos.yazi'], 'ad başı (Yazı …) önce'); esit(y[2], 'okuma', 'kelime başı sonra');
  esit(K.ara('SATIN', og, 1)[0].id, 'lifeos.kilit.odeme');
  esit(K.ara('İLK TAŞINAN', og, 1)[0].id, 'felsefe');
});
t('ara: ad başı önce, eşit puanda kısa ad önce, ad içi sonra', () => {
  const r = K.ara('fel', og, 3).map(o => o.id);
  esit(r[0], 'felsefe');
  const s = K.ara('ta', og, 99).map(o => o.id);
  esit(s.slice(0, 2), ['tarih', 'tahlil'], 'eşit puanda kısa ad önce');
  dogru(s.indexOf('yol') > 1, 'açıklamada geçen sonra: ' + s.join(','));
});
t('ara: eşit puanda yer, ayardan; ayar, eylemden önce', () => {
  const r = K.ara('tema', og).map(o => o.tur);
  dogru(r.indexOf('ayar') < r.indexOf('eylem'), r.join(','));
});
t('ara: çok kelimede her kelime tutmalı', () => {
  esit(K.ara('okuma yazı', og, 1)[0].id, 'okuma');
  esit(K.ara('felsefe uçak', og).length, 0);
});
t('ara: ayarlar ve eylemler de aranır (koyu, sessiz)', () => {
  esit(K.ara('koyu', og, 1)[0].id, 'tema-koyu');
  esit(K.ara('sessiz', og, 1)[0].id, 'lifeos.sessiz');
});
t('ara: boş sorgu hepsine 1 puan, sonuç sınırı uygulanır', () => {
  esit(K.puan('', og[0]), 1); esit(K.ara('', og, 5).length, 5); esit(K.ara('zzzz', og).length, 0);
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
