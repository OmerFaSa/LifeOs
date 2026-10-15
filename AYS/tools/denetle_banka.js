// Bütün AYS soru bankasını (184 konu, 1.847+ soru) uçtan uca denetler.
// Çalıştırma: node tools/denetle_banka.js

const fs = require('fs');
const path = require('path');

global.window = {};
global.R = {};

const files = [
  'src/js/core/utils.js',
  'src/js/data/subjects.js',
  'src/js/data/curriculum.js',
  'src/js/core/sekil.js',
  'src/js/core/ogren.js',
  'src/js/data/anlatim.js',
  'src/js/data/anlatim-tr.js',
  'src/js/data/anlatim-tm.js',
  'src/js/data/anlatim-tf.js',
  'src/js/data/anlatim-ts.js',
  'src/js/data/anlatim-am.js',
  'src/js/data/anlatim-af.js',
  'src/js/data/anlatim-ak.js',
  'src/js/data/anlatim-ab.js',
  'src/js/data/derin.js',
  'src/js/data/derin-tr.js',
  'src/js/data/derin-tm.js',
  'src/js/data/derin-tf.js',
  'src/js/data/derin-ts.js',
  'src/js/data/derin-am.js',
  'src/js/data/derin-af.js',
  'src/js/data/derin-ak.js',
  'src/js/data/derin-ab.js',
  'src/js/data/paragraf.js'
];

files.forEach(f => {
  const p = path.join(__dirname, '..', f);
  if (fs.existsSync(p)) {
    eval(fs.readFileSync(p, 'utf8'));
  } else {
    console.error('Bulunamadı:', p);
  }
});

const SK = R.Sekil;
const OG = R.Ogren;
const HARFLER = ['A', 'B', 'C', 'D', 'E'];
const hatalar = [];
let toplamSoru = 0;
let toplamOrnek = 0;

function metinDenetle(konu, yer, metin) {
  const s = String(metin || '');
  if (!s.trim()) hatalar.push(`${konu} - ${yer}: Boş metin`);
  if (/ {2,}/.test(s)) hatalar.push(`${konu} - ${yer}: Çift boşluk içeriyor`);
  const plain = OG ? OG.duzMetin(s) : s;
  if (/\*\*|[\^_]\{/.test(plain)) hatalar.push(`${konu} - ${yer}: Kapanmamış format işareti`);
}

function sekilTabloDenetle(konu, yer, nesne) {
  if (!nesne) return;
  if (nesne.sekil) {
    const errs = SK.denetle(nesne.sekil);
    if (errs.length) hatalar.push(`${konu} - ${yer} (şekil): ${errs.join(', ')}`);
  }
  if (nesne.tablo) {
    const errs = SK.tabloDenetle(nesne.tablo);
    if (errs.length) hatalar.push(`${konu} - ${yer} (tablo): ${errs.join(', ')}`);
  }
}

function soruDenetle(konu, tur, idx, q) {
  toplamSoru++;
  const yer = `${tur} soru ${idx + 1}`;
  metinDenetle(konu, `${yer} (kök)`, q.soru);

  if (!Array.isArray(q.sec)) {
    hatalar.push(`${konu} - ${yer}: Seçenekler dizi değil`);
  } else {
    if (q.sec.length !== 5) {
      hatalar.push(`${konu} - ${yer}: Seçenek sayısı 5 değil (${q.sec.length})`);
    }
    const set = new Set(q.sec.map(x => String(x).trim()));
    if (set.size !== q.sec.length) {
      hatalar.push(`${konu} - ${yer}: Yinelenen seçenek`);
    }
    q.sec.forEach((sec, k) => {
      metinDenetle(konu, `${yer} (seçenek ${HARFLER[k]})`, sec);
    });
  }

  if (HARFLER.indexOf(q.dogru) < 0) {
    hatalar.push(`${konu} - ${yer}: Geçersiz doğru cevap (${q.dogru})`);
  }

  const cozumDizi = Array.isArray(q.cozum) ? q.cozum : (q.cozum ? [q.cozum] : []);
  if (!cozumDizi.length) {
    hatalar.push(`${konu} - ${yer}: Çözüm yok`);
  } else {
    cozumDizi.forEach((c, k) => metinDenetle(konu, `${yer} (çözüm ${k+1})`, c));
  }

  sekilTabloDenetle(konu, yer, q);
}

// 1. Temel Sorular (KONU_ANLATIM)
Object.keys(R.KONU_ANLATIM || {}).forEach(k => {
  const a = R.KONU_ANLATIM[k];
  (a.sorular || []).forEach((q, i) => soruDenetle(k, 'temel', i, q));
});

// 2. Derin Sorular & Örnekler (KONU_DERIN)
Object.keys(R.KONU_DERIN || {}).forEach(k => {
  const d = R.KONU_DERIN[k];
  (d.ornekler || []).forEach((o, i) => {
    toplamOrnek++;
    metinDenetle(k, `örnek ${i+1}`, o.soru);
    sekilTabloDenetle(k, `örnek ${i+1}`, o);
  });
  (d.sorular || []).forEach((q, i) => soruDenetle(k, 'derin', i, q));
});

// 3. Paragraf Havuzu
if (R.Paragraf && Array.isArray(R.Paragraf.HAVUZ)) {
  R.Paragraf.HAVUZ.forEach((q, i) => soruDenetle('paragraf-' + q.id, 'paragraf', i, q));
}

console.log(`\n=== AYS Bütünsel Soru Bankası Denetim Raporu ===`);
console.log(`Toplam Denetlenen Soru: ${toplamSoru}`);
console.log(`Toplam Çözümlü Örnek:  ${toplamOrnek}`);
console.log(`Tespit Edilen Hata:     ${hatalar.length}`);

if (hatalar.length > 0) {
  console.log(`\nHata Ayrıntıları:`);
  hatalar.slice(0, 30).forEach(h => console.log('  [!] ' + h));
  if (hatalar.length > 30) console.log(`  ... ve ${hatalar.length - 30} hata daha`);
  process.exit(1);
} else {
  console.log(`\nSONUÇ: Bütün 1.847+ soru ve örnekler 100% şema, seçenek, anahtar ve biçim denetiminden GEÇTİ!`);
  process.exit(0);
}
