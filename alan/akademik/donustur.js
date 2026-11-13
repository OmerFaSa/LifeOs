/* AYS ders verisini müfredat şemasına (alan/SEMA.md) dönüştürür.
   Kullanım: node alan/akademik/donustur.js   → alan/akademik/asama-1.json
   Bağımlılık yok (node:fs, node:vm). AYS dosyalarına yalnız okur.
   Eşleme ve kararlar: belgeler/ekip/sadelesme/faz6-akademik-icerik.md */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const KOK = path.resolve(__dirname, '..', '..');
const VERI = 'AYS/src/js/data';
const ONEKLER = ['tr', 'tm', 'tf', 'ts', 'am', 'af', 'ak', 'ab'];

// AYS veri dosyaları tarayıcı betiğidir (window.R); yalıtılmış bağlamda yüklenir.
const ctx = { window: {} };
ctx.window.window = ctx.window;
vm.createContext(ctx.window);
const dosyalar = ['subjects.js', 'anlatim.js', 'derin.js', 'paragraf.js']
  .concat(ONEKLER.map(o => `anlatim-${o}.js`), ONEKLER.map(o => `derin-${o}.js`));
const metinler = {};
for (const f of dosyalar) {
  metinler[f] = fs.readFileSync(path.join(KOK, VERI, f), 'utf8');
  vm.runInContext(metinler[f], ctx.window, { filename: f });
}
const R = ctx.window.R;

function satirBul(dosya, anahtar) {
  const s = metinler[dosya].split('\n');
  const i = s.findIndex(x => x.includes(`'${anahtar}':`));
  return i < 0 ? undefined : String(i + 1);
}

const kaynaklar = [];
function kaynak(ad, dosya, bolum, anahtar) {
  const id = `k${kaynaklar.length + 1}`;
  const k = { id, ad, tur: 'depo', yol: `${VERI}/${dosya}`, bolum, dogrulama: 'dogrulanmamis' };
  const sat = anahtar && satirBul(dosya, anahtar);
  if (sat) k.satir = sat;
  kaynaklar.push(k);
  return id;
}

const sorunlar = [];   // kaynakta görülen sorunlar (rapora gider)
const disarida = [];   // şema dışı kaldığı için alınmayan sorular
const TASLAK = { durum: 'taslak', yazan: 'model' };

function tabloMetni(t) {
  const sat = [t.bas.join(' | ')].concat(t.satir.map(r => r.join(' | ')));
  return `Tablo — ${t.baslik}: ` + sat.join(' ; ');
}

// Kaynak soru (anlatım/derin/paragraf) → şema alıştırması; uygun değilse null.
function soruDonustur(s, id, kid, yer) {
  if (s.sekil) { disarida.push(`${yer}: şekilli soru (şema şekil taşımıyor)`); return null; }
  const sec = s.sec;
  const harfler = 'ABCDE'.slice(0, Array.isArray(sec) ? sec.length : 0);
  if (!Array.isArray(sec) || sec.length < 2 || sec.length > 5 || !harfler.includes(s.dogru)) {
    sorunlar.push(`${yer}: seçenek/cevap anahtarı geçersiz (dogru=${s.dogru})`); return null;
  }
  if (new Set(sec.map(x => String(x).trim())).size !== sec.length) sorunlar.push(`${yer}: yinelenen seçenek`);
  let soru = s.soru;
  if (s.tablo) soru += '\n' + tabloMetni(s.tablo);
  const a = { id, tur: 'secmeli', soru, sec: sec.map(String), dogru: s.dogru };
  if (Array.isArray(s.cozum) && s.cozum.length) a.cozum = s.cozum;
  if (s.ipucu) a.ipucu = s.ipucu;     // şemada yok; motor yok sayar (rapor: Açık konular)
  if (s.seviye) a.seviye = s.seviye;  // aynı
  return Object.assign(a, TASLAK, { kaynak: [kid] });
}

function cozumMetni(c) {
  return 'Çözüm: ' + (c || []).map((x, i) => `${i + 1}) ${x}`).join(' ');
}

function anlatimMetni(an) {
  const p = [an.giris];
  for (const b of an.bolumler || []) {
    p.push(`**${b.baslik}**`);
    if (b.metin) p.push(...[].concat(b.metin));
    if (b.liste) p.push(...b.liste.map(x => '• ' + x));
    if (b.formul) p.push(...b.formul);
    if (b.tablo) p.push(tabloMetni(b.tablo));
    if (b.sekil) p.push(`[Şekil: ${b.sekil.alt || 'açıklama yok'}]`);
    if (b.ornek) p.push('Örnek: ' + b.ornek.soru, cozumMetni(b.ornek.cozum));
    if (b.dikkat) p.push('Dikkat: ' + b.dikkat);
  }
  return p.filter(x => typeof x === 'string' && x.trim());
}

function derinMetni(dr) {
  const p = ['**Çözümlü örnekler** (önce kendin dene, sonra çözüme bak)'];
  for (const o of dr.ornekler || []) {
    p.push(`Örnek (${o.seviye || 'seviye yok'}): ${o.soru}`);
    if (o.tablo) p.push(tabloMetni(o.tablo));
    if (o.sekil) p.push(`[Şekil: ${o.sekil.alt || 'açıklama yok'}]`);
    p.push(cozumMetni(o.cozum));
  }
  if ((dr.kaliplar || []).length) p.push('**Sınavda nasıl sorulur**', ...dr.kaliplar.map(x => '• ' + x));
  if ((dr.hatalar || []).length) p.push('**Sık yapılan hatalar**', ...dr.hatalar.map(x => '• ' + x));
  return p.filter(x => typeof x === 'string' && x.trim());
}

// ---- iskelet: ders → konu grubu (ünite) → konu (iki ders: anlatım + derinleştirme)
const AID = 'akademik.1';
const paragrafKid = kaynak('AYS günlük paragraf havuzu (R.PARAGRAF_HAVUZU)', 'paragraf.js', 'R.PARAGRAF_HAVUZU');
const uniteler = [];
const konuDers = {};    // konu kimliği → { anlatim: ders id, unite: ünite id }
const konuUnite = {};
const bekleyenOnKosul = [];  // [ders nesnesi, konu kimliği]
const asamaKapisi = [];
let toplamKapiAday = 0;

for (const sub of R.SUBJECTS) {
  const gruplar = [];
  for (const t of [...sub.topics].sort((a, b) => a.order - b.order)) {
    let g = gruplar.find(x => x.ad === (t.group || sub.name));
    if (!g) gruplar.push(g = { ad: t.group || sub.name, konular: [] });
    g.konular.push(t);
  }
  for (const g of gruplar) {
    const uid = `${AID}.${uniteler.length + 1}`;
    const u = { id: uid, ad: `${sub.name} · ${g.ad}`, onKosul: [], kapi: { esik: 0.75, sorular: [] }, dersler: [] };
    const kapiAday = [];
    for (const t of g.konular) {
      const on = t.id.split('-')[0];
      const an = R.KONU_ANLATIM[t.id], dr = R.KONU_DERIN[t.id];
      if (!an || !dr) { sorunlar.push(`${t.id}: anlatım ya da derin kaydı yok, konu alınmadı`); continue; }
      konuUnite[t.id] = uid;
      // anlatım dersi
      const d1id = `${uid}.${u.dersler.length + 1}`;
      const k1 = kaynak(`AYS konu anlatımı: ${t.name}`, `anlatim-${on}.js`, `R.KONU_ANLATIM['${t.id}']`, t.id);
      const d1 = { id: d1id, ad: t.name, onKosul: [] };
      if ((dr.kazanim || []).length) d1.kazanim = dr.kazanim;
      Object.assign(d1, TASLAK, { kaynak: [k1], ozet: an.giris, metin: anlatimMetni(an), alistirmalar: [] });
      (an.sorular || []).forEach((s, i) => {
        const a = soruDonustur(s, `${d1id}.a${d1.alistirmalar.length + 1}`, k1, `${t.id} anlatım soru ${i + 1}`);
        if (a) d1.alistirmalar.push(a);
      });
      u.dersler.push(d1);
      bekleyenOnKosul.push([d1, t.id, dr.onKosul || []]);
      konuDers[t.id] = d1id;
      // derinleştirme dersi
      const d2id = `${uid}.${u.dersler.length + 1}`;
      const k2 = kaynak(`AYS konu derinleştirme: ${t.name}`, `derin-${on}.js`, `R.KONU_DERIN['${t.id}']`, t.id);
      const d2 = Object.assign({ id: d2id, ad: `${t.name}: sınav düzeyi`, onKosul: [d1id] }, TASLAK, {
        kaynak: [k2],
        ozet: `${t.name} konusunu sınav düzeyine taşır: çözümlü örnekler, soru kalıpları ve sık yapılan hatalar.`,
        metin: derinMetni(dr), alistirmalar: [] });
      if (on === 'tr') {
        R.PARAGRAF_HAVUZU.filter(p => p.konu === t.id).forEach(p => {
          const a = soruDonustur(p, `${d2id}.a${d2.alistirmalar.length + 1}`, paragrafKid, `paragraf ${p.id}`);
          if (a) d2.alistirmalar.push(a);
        });
        if (d2.alistirmalar.length) d2.kaynak.push(paragrafKid);
      }
      u.dersler.push(d2);
      // derin soruları: derste gösterilmez, ünite kapısına aday
      (dr.sorular || []).forEach((s, i) => kapiAday.push({ s, kid: k2, yer: `${t.id} derin soru ${i + 1}` }));
    }
    if (!u.dersler.length) continue;
    // bir ileri soru aşama kapısına ayrılır (ünite kapısında yinelenmez)
    let ayrilan = kapiAday.findIndex(x => x.s.seviye === 'ileri' && !x.s.sekil);
    const sorular = [];
    kapiAday.forEach((x, i) => {
      if (i === ayrilan) {
        const a = soruDonustur(x.s, `${AID}.k${asamaKapisi.length + 1}`, x.kid, x.yer);
        if (a) { asamaKapisi.push(a); return; }
      }
      const a = soruDonustur(x.s, `${uid}.k${sorular.length + 1}`, x.kid, x.yer);
      if (a) sorular.push(a);
    });
    toplamKapiAday += kapiAday.length;
    u.kapi.sorular = sorular;
    if (sorular.length < 3) sorunlar.push(`${uid}: kapıda 3'ten az gerçek soru (${sorular.length})`);
    uniteler.push(u);
  }
}

// ---- önkoşullar: konu onKosul → ders ve ünite bağı
const uniteBag = {};
for (const [d, konu, ok] of bekleyenOnKosul) {
  for (const o of ok) {
    if (!konuDers[o]) { sorunlar.push(`${konu}: bilinmeyen önkoşul konu ${o}`); continue; }
    if (o === konu) { sorunlar.push(`${konu}: kendisine önkoşul`); continue; }
    d.onKosul.push(konuDers[o]);
    const a = konuUnite[konu], b = konuUnite[o];
    if (a !== b) (uniteBag[a] = uniteBag[a] || new Set()).add(b);
  }
}
// ünite bağları döngü kurmasın: kuran bağ atlanır ve raporlanır (ders bağları kalır)
function ulasir(bas, hedef, bag) {
  const yig = [bas], gor = new Set();
  while (yig.length) {
    const x = yig.pop();
    if (x === hedef) return true;
    if (gor.has(x)) continue;
    gor.add(x);
    for (const y of bag[x] || []) yig.push(y);
  }
  return false;
}
const kesin = {};
for (const u of uniteler) {
  for (const b of [...(uniteBag[u.id] || [])].sort()) {
    if (ulasir(b, u.id, kesin)) { sorunlar.push(`ünite önkoşulu atlandı (döngü): ${u.id} → ${b}`); continue; }
    (kesin[u.id] = kesin[u.id] || []).push(b);
    u.onKosul.push(b);
  }
}

const asama = {
  sema: 1, alan: 'akademik', id: AID, sira: 1,
  ad: 'YKS konu temeli',
  hedef: 'TYT ve AYT Sayısal derslerinin 184 konusunu temel anlatımdan sınav düzeyine kadar öğrenmek ve her konu grubunu ustalık kapısıyla geçmek.',
  onKosul: [],
  kanitIsi: 'Bir deneme sınavını süre tutarak çözüp yanlışlarını konu ve hata türüne göre ayırmak. Sahip değerlendirir; puanlanmaz.',
  kapi: { esik: 0.8, sorular: asamaKapisi },
  kaynaklar, uniteler,
};
const cikti = path.join(__dirname, 'asama-1.json');
fs.writeFileSync(cikti, JSON.stringify(asama, null, 1) + '\n');

let ders = 0, alis = 0, kapi = 0;
for (const u of uniteler) { ders += u.dersler.length; kapi += u.kapi.sorular.length;
  for (const d of u.dersler) alis += d.alistirmalar.length; }
console.log(JSON.stringify({ konu: Object.keys(konuDers).length, unite: uniteler.length, ders, alistirma: alis,
  uniteKapiSorusu: kapi, asamaKapiSorusu: asamaKapisi.length, kapiAday: toplamKapiAday, kaynak: kaynaklar.length,
  bayt: fs.statSync(cikti).size }, null, 0));
console.log('SORUNLAR ' + sorunlar.length); sorunlar.forEach(x => console.log('  ' + x));
console.log('DISARIDA ' + disarida.length); disarida.forEach(x => console.log('  ' + x));
