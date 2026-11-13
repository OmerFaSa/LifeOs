// Tanışma saf mantık testleri: node kabuk/tanisma.test.js  (✓/✕, çıkış 0/1)
'use strict';
const T = require('./tanisma.js');
const H = require('./harita.js');
const A = require('./ayar.js');

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
const sayi = m => T.sayilar(m).map(x => x.metin);
const alan = m => T.alanBul(m).map(x => x.alan);
const ids = l => l.map(o => o.id);
function yuru(cevaplar) { // { soruId: cevap } sırayla; akış sorduğu sürece
  let s = T.bos(), z = 1, id;
  while ((id = T.siradaki(s)) && z < 100) s = T.cevapla(s, id, cevaplar[id] || {}, z++);
  return s;
}

// ---- Türkçe desenler ----
t('sayı: sıklık ve birim (rakam)', () => {
  esit(sayi('haftada 2'), ['haftada 2 kez']);
  esit(sayi('Günde 30 dk'), ['günde 30 dk']);
  esit(sayi('haftada 3 gün koşuyorum'), ['haftada 3 gün']);
  esit(sayi('günde 1,5 saat'), ['günde 1,5 saat']);
  esit(sayi('30dk'), ['30 dk']);
  esit(sayi('her gün 20 dakika'), ['günde 20 dk']);
  esit(sayi('ayda 2 kez'), ['ayda 2 kez']);
});
t('sayı: yazıyla sayılar, buçuk, yarım, aralık', () => {
  esit(sayi('haftada iki gün'), ['haftada 2 gün']);
  esit(sayi('GÜNDE ON BEŞ DAKİKA'), ['günde 15 dk']);
  esit(sayi('bir buçuk saat'), ['1,5 saat']);
  esit(sayi('yarım saat'), ['0,5 saat']);
  esit(sayi('günde 20-30 dakika'), ['günde 20–30 dk']);
  esit(T.sayilar('günde 20-30 dakika')[0].ust, 30);
  esit(sayi('haftada üç kez yüzerim, günde kırk dakika yürürüm'), ['haftada 3 kez', 'günde 40 dk']);
});
t('sayı: çıplak sayı, deyim ve sözcük içi alınmaz', () => {
  esit(sayi('1998 doğumluyum'), []);
  esit(sayi('bir gün spora başlayacağım'), []);
  esit(sayi('ikinci dönem'), []);
  esit(sayi('beslenmem kötü'), []);
  esit(sayi('saat 7 de kalkarım'), []);
  esit(sayi('3 salon değiştirdim'), []);
});
t('alan: katlama, ekler, eş sözcükler', () => {
  esit(alan('Felsefe ve İngilizce'), ['felsefe', 'dil']);
  esit(alan('MATEMATİKTE iyiyim'), ['akademik']);
  esit(alan('kitapları severim'), ['okuma']);
  esit(alan('spora gidiyorum, uykum bozuk'), ['hareket', 'uyku']);
  esit(alan('tarihi seviyorum'), ['tarih']);
});
t('alan: olumsuz cümlecik ve benzer sözcük alan çıkarmaz', () => {
  esit(alan('felsefe değil, tarih olsun'), ['tarih']);
  esit(alan('spor istemiyorum'), []);
  esit(alan('yazılımcıyım, mantıklı düşünürüm, neyi seversin'), []);
});
t('beden: boy ve doğum yılı şema sınırında', () => {
  const b = T.bedenBul('178 cm, 1998');
  esit([b.boy, b.dogumYili], [178, 1998]);
  esit(T.bedenBul('boyum 1,82').boy, 182);
  esit(T.bedenBul('boyum 1.75 m').boy, 175);
  esit(T.bedenBul('boy: 165').boy, 165);
  esit(T.bedenBul('300 cm').boy, undefined);
  esit(T.bedenBul('2024').dogumYili, undefined);
  esit(T.bedenBul('1890').dogumYili, undefined);
});
t('artakalan: desenin aldığı çıkınca dolgu sayılmaz, söz sayılır', () => {
  const iz = m => T.sayilar(m).map(x => [x.bas, x.son]);
  dogru(!T.artakalanVar('günde 30 dk kadar', iz('günde 30 dk kadar')));
  dogru(T.artakalanVar('haftada 2 gün spora gidiyorum ama düzensiz', iz('haftada 2 gün spora gidiyorum ama düzensiz')));
});

// ---- kural tablosu ----
t('akış: soru sırası hedef → alanlar → düzey → süre; sağlık alanı yoksa beden sorulmaz', () => {
  let s = T.bos(), sor = [];
  const c = { hedef: { secim: ['sinav'] }, alanlar: { secim: ['akademik', 'felsefe'] }, 'seviye:akademik': { secim: ['temel'] }, 'seviye:felsefe': { secim: ['yeni'] }, sure: { secim: ['30'] } };
  let id, z = 1;
  while ((id = T.siradaki(s))) { sor.push(id); s = T.cevapla(s, id, c[id], z++); }
  esit(sor, ['hedef', 'alanlar', 'seviye:akademik', 'seviye:felsefe', 'sure']);
});
t('akış: sağlık alanı seçilince beden ve sağlık notu eklenir', () => {
  const s = yuru({ alanlar: { secim: ['hareket'] } });
  esit(Object.keys(s.cevaplar), ['hedef', 'alanlar', 'seviye:hareket', 'sure', 'beden', 'saglik']);
});
t('akış: her yol biter, ölü soru yok (bütün hedefler × bütün alan altkümeleri × atla/ilk seçenek)', () => {
  const al = H.YERLER.filter(y => y.katman === 'alan').map(y => y.id), sorulan = {};
  const hedefler = [null].concat(T.soru('hedef').secenek.map(x => x[0]));
  let yol = 0;
  hedefler.forEach(h => {
    for (let m = 0; m < 1 << al.length; m++) {
      const secim = al.filter((_, i) => m & (1 << i));
      [false, true].forEach(atlaHep => {
        let s = T.bos(), id, adim = 0;
        while ((id = T.siradaki(s))) {
          const q = T.soru(id, s);
          dogru(q && q.metin && q.secenek.length, 'ölü soru: ' + id);
          sorulan[id.split(':')[0]] = 1;
          const c = id === 'hedef' ? (h ? { secim: [h] } : {}) : id === 'alanlar' ? { secim } : atlaHep ? {} : { secim: [q.secenek[0][0]] };
          s = T.cevapla(s, id, c, ++adim);
          dogru(adim <= 3 + al.length + 2, 'bitmeyen yol');
        }
        yol++;
      });
    }
  });
  esit(Object.keys(sorulan).sort(), ['alanlar', 'beden', 'hedef', 'saglik', 'seviye', 'sure']);
  dogru(yol === 5 * 1024 * 2, yol);
});
t('akış: akışta olmayan soruya cevap reddedilir; geçersiz seçim düşer; tek seçimlide bir seçim kalır', () => {
  let s = T.bos();
  let hata = null; try { T.cevapla(s, 'seviye:felsefe', { secim: ['yeni'] }, 1); } catch (e) { hata = e.message; }
  dogru(/sorulmuyor/.test(hata), hata);
  s = T.cevapla(s, 'hedef', { secim: ['sinav', 'saglik', 'uydurma'] }, 1);
  esit(s.cevaplar.hedef.secim, ['sinav']);
  s = T.cevapla(s, 'alanlar', { secim: ['felsefe', 'yok', 'dil'] }, 2);
  esit(s.cevaplar.alanlar.secim, ['felsefe', 'dil']);
});
t('akış: hedefe göre önerilen alanlar (basılı gelir, gönderen kendisi)', () => {
  esit(T.onerilenAlanlar(T.cevapla(T.bos(), 'hedef', { secim: ['sinav'] }, 1)), ['akademik']);
  esit(T.onerilenAlanlar(T.cevapla(T.bos(), 'hedef', { secim: ['saglik'], metin: 'bir de felsefe' }, 1)), ['hareket', 'beslenme', 'uyku', 'felsefe']);
  esit(T.secilenAlanlar(T.cevapla(T.bos(), 'hedef', { secim: ['sinav'] }, 1)), []); // öneri seçim değildir
});

// ---- anlaşılanlar ----
const ornek = () => yuru({
  hedef: { secim: ['sinav'], metin: 'Sınava hazırlanıyorum, bir de haftada iki gün spora gidiyorum ama düzensiz.' },
  alanlar: { secim: ['akademik'], metin: 've spor' },
  'seviye:akademik': { secim: ['temel'], metin: 'Matematik fena değil, fizikte elektrik hep takılıyor.' },
  'seviye:hareket': { metin: 'haftada 2' },
  sure: { metin: 'günde 45 dk kadar' },
  beden: { secim: ['erkek'], metin: '178 cm, 1998' },
  saglik: { metin: 'Dizimde eski bir sakatlık var.' }
});
t('anla: seçimler, desenler ve kendi sözü ayrı türde; sayılar etiketli, kesinlik «senin sözün»', () => {
  const l = T.anla(ornek()), by = {}; l.forEach(o => { by[o.id] = o; });
  esit(ids(l), ['hedef|secim', 'hedef|sayi0', 'hedef|not', 'alanlar|akademik', 'alanlar|hareket', 'seviye:akademik|secim', 'seviye:akademik|not',
    'seviye:hareket|sayi0', 'sure|sayi0', 'beden|cinsiyet', 'beden|boy', 'beden|dogumYili', 'saglik|not']);
  esit([by['hedef|secim'].tur, by['alanlar|hareket'].tur, by['seviye:akademik|not'].tur, by['sure|sayi0'].tur], ['secim', 'desen', 'not', 'desen']);
  esit(by['sure|sayi0'].deger, { v: 45, birim: 'dk', siklik: 'gun' });
  esit(by['seviye:hareket|sayi0'].metin, 'haftada 2 kez');
  esit(by['beden|boy'].ayar, { anahtar: 'lifeos.beden.boy', deger: 178 });
  dogru(l.every(o => o.kesinlik === 'soz' && o.kaynak === 'tanisma' && o.kisi), 'etiket eksik');
});
t('anla: çözülemeyen yazı aynen not kalır, hiçbir zaman olguya dönmez', () => {
  const l = T.anla(ornek()), not = l.filter(o => o.tur === 'not');
  esit(not.map(o => o.metin), ['Sınava hazırlanıyorum, bir de haftada iki gün spora gidiyorum ama düzensiz.', 'Matematik fena değil, fizikte elektrik hep takılıyor.', 'Dizimde eski bir sakatlık var.']);
  // «fizik» ve «matematik» düzey yazısında geçse de ne alan ne yargı olur; düzey yalnız seçimden
  dogru(!l.some(o => /fizik|elektrik|matematik/i.test(o.metin) && o.tur !== 'not'), 'yorumlandı');
  dogru(l.filter(o => o.soru === 'saglik').every(o => o.tur === 'not'), 'sağlık notu yorumlandı');
  // tamamen desenle okunan yazı ikinci kez not olmaz
  dogru(!l.some(o => o.id === 'sure|not' || o.id === 'seviye:hareket|not'), 'gereksiz not');
});
t('anla: hiçbir şey sayılamayan yazı yalnız not; atlanan soru hiçbir şey üretmez', () => {
  let s = T.cevapla(T.bos(), 'hedef', { metin: 'Daha sakin olmak istiyorum' }, 1);
  esit(T.anla(s).map(o => [o.id, o.tur]), [['hedef|not', 'not']]);
  s = T.atla(T.bos(), 'hedef', 1);
  esit(T.anla(s), []); esit(s.cevaplar.hedef.atlandi, true);
});
t('panel: sil ve düzelt; alan silinince onun sorusu akıştan çıkar; yeni cevap eski düzeltmeyi temizler', () => {
  let s = ornek();
  s = T.sil(s, 'hedef|sayi0', 9);
  dogru(!ids(T.anla(s)).includes('hedef|sayi0'));
  s = T.duzelt(s, 'beden|boy', '180 cm', 9);
  const boy = T.anla(s).filter(o => o.id === 'beden|boy')[0];
  esit([boy.tur, boy.metin, boy.ayar.deger], ['duzeltme', '180 cm', 180]);
  s = T.duzelt(s, 'seviye:hareket|sayi0', 'haftada 2, bazen 3', 9);
  const h = T.anla(s).filter(o => o.id === 'seviye:hareket|sayi0')[0];
  esit([h.tur, h.deger], ['duzeltme', undefined]); // düzeltilen söz yeniden yorumlanmaz
  s = T.sil(s, 'alanlar|hareket', 9);
  dogru(!T.sorular(s).includes('seviye:hareket') && !T.sorular(s).includes('beden'), 'hareket akışta kaldı');
  s = T.cevapla(s, 'alanlar', { secim: ['akademik', 'hareket'] }, 10);
  dogru(T.sorular(s).includes('seviye:hareket'), 'yeni cevap silmeyi temizlemedi');
  s = T.duzelt(s, 'sure|sayi0', '', 11);
  dogru(!ids(T.anla(s)).includes('sure|sayi0'), 'boş düzeltme silmeli');
});

// ---- yarım ve devam ----
t('yarım: yarıda bırakılan görüşme taslaktan aynı sorudan sürer; bozuk taslak boş başlar', () => {
  const depo = sahteDepo();
  let s = T.cevapla(T.bos(), 'hedef', { secim: ['ogrenmek'] }, 1);
  s = T.cevapla(s, 'alanlar', { secim: ['dil', 'tarih'] }, 2);
  T.taslakYaz(depo, s);
  const geri = T.taslakOku(depo);
  esit(T.siradaki(geri), 'seviye:dil');
  esit(T.anla(geri), T.anla(s));
  depo.setItem('lifeos.tanisma.taslak', '{bozuk');
  esit(T.taslakOku(depo), T.bos());
});
t('yarım: «şimdilik bu kadar» akışı durdurur, devam kaldığı yerden sürer', () => {
  let s = T.cevapla(T.bos(), 'hedef', { secim: ['duzen'] }, 1);
  s.bitir = true;
  esit(T.siradaki(s), null);
  s.bitir = false;
  esit(T.siradaki(s), 'alanlar');
});

// ---- onay ve geri alma ----
t('onay: cevaplamak, silmek, düzeltmek depoya kişi kaydı ya da ayar yazmaz', () => {
  const depo = sahteDepo();
  let s = ornek(); s = T.sil(s, 'hedef|not', 9); s = T.duzelt(s, 'beden|boy', '181 cm', 9);
  T.taslakYaz(depo, s);
  esit(Object.keys(depo.v), ['lifeos.tanisma.taslak']);
  esit(T.kayitOku(depo), null);
});
t('onay: onaylayınca olgular ve öneriler yazılır, beden Ayarlar şemasından geçer', () => {
  const depo = sahteDepo({ 'lifeos.beden.boy': '170' });
  const k = T.onayla(ornek(), depo, A, 100);
  esit(k.olgular.length, 13); esit(T.kayitOku(depo).zaman, 100);
  esit([A.oku(depo, 'lifeos.beden.boy'), A.oku(depo, 'lifeos.beden.dogumYili'), A.oku(depo, 'lifeos.beden.cinsiyet')], [178, 1998, 'erkek']);
  esit(k.ayarEski, { 'lifeos.beden.cinsiyet': null, 'lifeos.beden.boy': '170', 'lifeos.beden.dogumYili': null });
});
t('geri al: tek satır ayarı onay öncesine döndürür; hepsi kaydı siler', () => {
  const depo = sahteDepo({ 'lifeos.beden.boy': '170' });
  T.onayla(ornek(), depo, A, 100);
  const k = T.geriAl(depo, 'beden|boy');
  dogru(!ids(k.olgular).includes('beden|boy'));
  esit(depo.getItem('lifeos.beden.boy'), '170');
  esit(A.oku(depo, 'lifeos.beden.cinsiyet'), 'erkek');
  esit(T.geriAl(depo), null);
  esit(T.kayitOku(depo), null);
  esit([depo.getItem('lifeos.beden.cinsiyet'), depo.getItem('lifeos.beden.dogumYili')], [null, null]);
});
t('onay: yeniden onayda artık söylenmeyen beden değeri ilk hâline döner', () => {
  const depo = sahteDepo({ 'lifeos.beden.boy': '170' });
  let s = ornek();
  T.onayla(s, depo, A, 100);
  s = T.sil(s, 'beden|boy', 101);
  const k = T.onayla(s, depo, A, 102);
  esit(depo.getItem('lifeos.beden.boy'), '170');
  dogru(!('lifeos.beden.boy' in k.ayarEski));
});

// ---- Yol önerisi ----
t('öneri: hedefe bağlı alan önce; «rahatım» kapı, yeni başlayan ilk ders (on alanın onu da taşındı)', () => {
  const s = yuru({ hedef: { secim: ['sinav'] }, alanlar: { secim: ['felsefe', 'akademik', 'muzik'] }, 'seviye:akademik': { secim: ['rahat'] }, 'seviye:felsefe': { secim: ['yeni'] } });
  esit(T.oneriler(s).map(o => [o.alan, o.ilk, o.baslangic]), [['akademik', true, 'kapi'], ['felsefe', false, 'bas'], ['muzik', false, 'bas']]);
  const s2 = yuru({ alanlar: { secim: ['muzik', 'tarih'] } });
  esit(T.oneriler(s2).map(o => [o.alan, o.ilk]), [['muzik', true], ['tarih', false]]);   // ikisi de taşındı: seçim sırası
  esit(T.oneriler(T.bos()), []);
});
t('öneri: tek dokunuşla onay kayda işlenir', () => {
  const depo = sahteDepo();
  T.onayla(yuru({ alanlar: { secim: ['felsefe'] } }), depo, A, 5);
  esit(T.oneriOnayla(depo, 'felsefe', 6).oneriler[0].onay, 6);
});

// ---- kayıt ----
t('kayıt: Tanışma haritada, ana dalda, halkadan iki adımda; harita geçerli', () => {
  const y = H.bul('tanisma');
  esit([y.katman, y.dal, y.yol, y.durum], ['kabuk', 'ana', '#/tanisma', 'yeni']);
  esit(H.halkaAdimi('tanisma'), 2);
  esit(H.denetle(), []);
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
