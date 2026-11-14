// Kayıt deposu testleri: node kabuk/depo.test.js  (✓/✕, çıkış 0/1). Kurulumsuz: IndexedDB biçimli sahte depo bu dosyada.
'use strict';
const fs = require('fs'), path = require('path');
const A = require('./ayar.js');

let gecen = 0, kalan = 0;
async function t(ad, f) {
  try { await f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); }
}
function esit(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || '') + ' beklenen ' + JSON.stringify(b) + ', gelen ' + JSON.stringify(a)); }
function dogru(x, m) { if (!x) throw new Error(m || 'doğru değil'); }
const uyu = ms => new Promise(r => setTimeout(r, ms));
console.warn = () => {}; // yerel/bellek kipine düşüş uyarısı bu testlerde beklenir
function taze() { delete require.cache[require.resolve('./depo.js')]; return require('./depo.js'); } // her sınama kendi açılışı

function sahteYerel(ilk) {
  const v = Object.assign({}, ilk);
  return { v, get length() { return Object.keys(v).length; }, key: i => Object.keys(v)[i] ?? null,
    getItem: k => (k in v ? v[k] : null), setItem: (k, x) => { v[k] = String(x); }, removeItem: k => { delete v[k]; } };
}
// IndexedDB biçimli sahte: open/onupgradeneeded/onsuccess, transaction/oncomplete/onabort, put/delete/get/getAll/getAllKeys.
// İşlem atomiktir: kesilirse (o.kes(tur, sira) doğru) o işlemde yazılanlar geri alınır. o.acilmaz, o.gec (ms), o.bozukOku.
function sahteIdb(o = {}) {
  const veri = new Map(); let tablo = false;
  const db = {
    createObjectStore() {},
    transaction(ad, tur) {
      const isler = [], tx = {};
      const istek = f => { const q = {}; isler.push(() => { q.result = f(); }); return q; };
      tx.objectStore = () => ({
        put: (v, k) => istek(() => { veri.set(k, v); return k; }),
        delete: k => istek(() => { veri.delete(k); }),
        get: k => istek(() => (o.bozukOku ? 'bozuk' : veri.get(k))),
        getAll: () => istek(() => [...veri.values()]),
        getAllKeys: () => istek(() => [...veri.keys()])
      });
      setTimeout(() => {
        const once = new Map(veri);
        for (let i = 0; i < isler.length; i++) {
          if (o.kes && o.kes(tur, i)) { veri.clear(); once.forEach((v, k) => veri.set(k, v)); tx.error = new Error('işlem kesildi'); return tx.onabort(); }
          isler[i]();
        }
        tx.oncomplete();
      }, 0);
      return tx;
    }
  };
  return {
    veri, o,
    open() {
      const r = {};
      if (o.asili) return r;
      setTimeout(() => {
        if (o.acilmaz) { r.error = new Error('açılmadı'); return r.onerror(); }
        r.result = db;
        if (!tablo) { tablo = true; r.onupgradeneeded(); }
        r.onsuccess();
      }, o.gec || 0);
      return r;
    }
  };
}

// Kayıt / ayar ayrımı (rapordaki liste). Kabuk dosyalarında geçen her lifeos.* anahtarı ikisinden birinde olmalı.
const KAYITLAR = ['lifeos.yol.felsefe.1', 'lifeos.yol.dil.2', 'lifeos.not.kayit', 'lifeos.not.araclar', 'lifeos.tekrar.kartlar', 'lifeos.tekrar.bugun',
  'lifeos.kayit.kayitlar', 'lifeos.plan.durum', 'lifeos.plan.sablon', 'lifeos.soru.oturum', 'lifeos.soru.gecmis', 'lifeos.soru.deneme',
  'lifeos.soru.denemeler', 'lifeos.tanisma.kayit', 'lifeos.tanisma.taslak', 'lifeos.beden.boy', 'lifeos.beden.cinsiyet',
  'lifeos.beden.dogumYili', 'lifeos.beden.hedef', 'lifeos.onay', 'lifeos.plan.eski', 'lifeos.soru.eski'];
// lifeos.kabuk.baslangic: getirilen başlangıç paketinin kimliği; lifeos.tasima: köken taşımasında işlenen paket adları (ikisi de iz, kayıt değil)
const AYARLAR = ['lifeos.yol.son', 'lifeos.kabuk.ipucu', 'lifeos.kabuk.depo', 'lifeos.kabuk.esitle','lifeos.tanisma.davet', 'lifeos.kullanim', 'lifeos.kabuk.baslangic', 'lifeos.tasima']
  .concat(A.SEMA.filter(s => s.grup !== 'beden').map(s => s.anahtar));
const ORNEK = { 'lifeos.yol.felsefe.1': '{"dersler":{"a":1}}', 'lifeos.not.kayit': '[{"id":"n1"}]', 'lifeos.beden.boy': '170',
  'lifeos.tema.secim': 'dark', 'lifeos.yol.son': 'dil', 'lifeos.tanisma.davet': 'kapali' };

(async () => {
  await t('anahtar: kayıt listesi kayıt, ayar listesi ayar', () => {
    const D = taze();
    esit(KAYITLAR.filter(k => !D.kayitMi(k)), [], 'kayıt sayılmayan:');
    esit(AYARLAR.filter(k => D.kayitMi(k)), [], 'kayıt sayılan ayar:');
    dogru(!D.kayitMi('lifeos.kayit.baska') && !D.kayitMi('lifeos.tanisma.davetX') && D.kayitMi('lifeos.yol.sonra.1') && !D.kayitMi('lifeos.onay.x') && !D.kayitMi('lifeos.onaylar'), 'yalnız tam ad; «sonra» alanı kayıttır');
  });
  await t('anahtar: kabuk dosyalarındaki her lifeos.* anahtarı sınıflanmış', () => {
    const bilinen = new Set(KAYITLAR.concat(AYARLAR)), yeni = [];
    ['kabuk.js', 'araclar.js', 'deneme.js', 'tanisma.js', 'tasima.js', 'harita.js', 'ayar.js', 'onay.js'].forEach(f => {
      (fs.readFileSync(path.join(__dirname, f), 'utf8').match(/'lifeos\.[\w.]+'/g) || []).map(s => s.slice(1, -1))
        .filter(k => !k.endsWith('.') && !bilinen.has(k)).forEach(k => yeni.push(f + ': ' + k));
    });
    esit(yeni, [], 'listede olmayan anahtar (kayıt mı ayar mı, karar ver):');
  });

  await t('taşıma: kayıtlar IndexedDB\'ye geçer, geri okununca localStorage\'dan silinir; ayarlar yerinde', async () => {
    const D = taze(), ls = sahteYerel(ORNEK), idb = sahteIdb();
    esit(await D.ac(ls, idb), 'idb');
    esit([...idb.veri.keys()].sort(), ['lifeos.beden.boy', 'lifeos.not.kayit', 'lifeos.yol.felsefe.1']);
    esit(Object.keys(ls.v).sort(), ['lifeos.kabuk.depo', 'lifeos.tanisma.davet', 'lifeos.tema.secim', 'lifeos.yol.son']);
    esit(ls.v['lifeos.kabuk.depo'], 'idb');
    Object.keys(ORNEK).forEach(k => esit(D.getItem(k), ORNEK[k], k));
    esit(A.oku(D, 'lifeos.beden.boy'), 170, 'ayar.js kayıt anahtarını bu depodan okur');
  });

  await t('yazı: önce bellek (eşzamanlı), sonra IndexedDB; yeniden açılışta kalır; ayar localStorage\'a gider', async () => {
    const ls = sahteYerel(), idb = sahteIdb();
    let D = taze(); await D.ac(ls, idb);
    D.setItem('lifeos.plan.durum', '{"isler":[]}');
    esit(D.getItem('lifeos.plan.durum'), '{"isler":[]}', 'aynı anda okunur');
    await D.yaz('lifeos.soru.gecmis', '[1]');
    esit(idb.veri.get('lifeos.soru.gecmis'), '[1]', 'yaz() çözülünce IndexedDB\'de');
    dogru(A.yaz(D, 'lifeos.tema.secim', 'light') && ls.v['lifeos.tema.secim'] === 'light' && !idb.veri.has('lifeos.tema.secim'), 'ayar yerelde');
    await uyu(5);
    D = taze(); await D.ac(ls, idb);
    esit([D.getItem('lifeos.plan.durum'), D.getItem('lifeos.soru.gecmis')], ['{"isler":[]}', '[1]']);
    esit(Object.keys(ls.v).filter(k => D.kayitMi(k)), [], 'localStorage\'da kayıt yok');
  });

  await t('al, sil, hepsi(önek)', async () => {
    const D = taze(), idb = sahteIdb(); await D.ac(sahteYerel(ORNEK), idb);
    esit(await D.al('lifeos.not.kayit'), '[{"id":"n1"}]');
    await D.yaz('lifeos.yol.dil.1', '{}');
    esit(Object.keys(await D.hepsi('lifeos.yol.')).sort(), ['lifeos.yol.dil.1', 'lifeos.yol.felsefe.1'], 'ayar olan yol.son gelmez');
    await D.sil('lifeos.not.kayit');
    dogru(D.getItem('lifeos.not.kayit') === null && !idb.veri.has('lifeos.not.kayit'), 'silindi');
    D.removeItem('lifeos.beden.boy'); await uyu(5);
    dogru(!idb.veri.has('lifeos.beden.boy'), 'removeItem de IndexedDB\'den siler');
  });

  await t('taşıma yarıda kesilirse hiçbir şey silinmez, kabuk localStorage\'da çalışır; sonraki açılış taşır', async () => {
    const ls = sahteYerel(ORNEK), once = JSON.stringify(ls.v), idb = sahteIdb({ kes: (tur, i) => tur === 'readwrite' && i === 2 });
    let D = taze();
    esit(await D.ac(ls, idb), 'yerel');
    esit(JSON.stringify(ls.v), once, 'localStorage aynen');
    esit(idb.veri.size, 0, 'kesilen işlem geri alındı');
    D.setItem('lifeos.not.kayit', '[]');
    esit(ls.v['lifeos.not.kayit'], '[]', 'yerel kipte yazı localStorage\'a');
    idb.o.kes = null;
    D = taze();
    esit(await D.ac(ls, idb), 'idb');
    esit([idb.veri.get('lifeos.not.kayit'), ls.v['lifeos.not.kayit']], ['[]', undefined]);
  });

  await t('geri okuma tutmazsa hiçbir şey silinmez', async () => {
    const ls = sahteYerel(ORNEK), once = JSON.stringify(ls.v), D = taze();
    esit(await D.ac(ls, sahteIdb({ bozukOku: true })), 'yerel');
    esit(JSON.stringify(ls.v), once);
  });

  await t('IndexedDB yoksa ya da açılmazsa: yerel kip, kayıt localStorage\'da', async () => {
    const ls = sahteYerel(ORNEK), D = taze(), eski = globalThis.indexedDB;
    globalThis.indexedDB = undefined;
    try { esit(await D.ac(ls), 'yerel'); } finally { globalThis.indexedDB = eski; }
    await D.yaz('lifeos.kayit.kayitlar', '[2]');
    esit([ls.v['lifeos.kayit.kayitlar'], D.getItem('lifeos.yol.felsefe.1')], ['[2]', ORNEK['lifeos.yol.felsefe.1']]);
    esit(Object.keys(await D.hepsi('lifeos.')).length, 4, 'hepsi localStorage\'daki kayıtları verir');
    const D2 = taze();
    esit(await D2.ac(sahteYerel(ORNEK), sahteIdb({ acilmaz: true })), 'yerel');
  });

  await t('IndexedDB takılırsa süre dolunca yerel kip; geç gelen açılış localStorage\'dan silmez', async () => {
    const ls = sahteYerel(ORNEK), once = JSON.stringify(ls.v), D = taze();
    D.sure = 20;
    esit(await D.ac(ls, sahteIdb({ gec: 60 })), 'yerel');
    await uyu(120);
    esit(JSON.stringify(ls.v), once, 'geç taşıma silmedi');
    const D2 = taze(); D2.sure = 20;
    esit(await D2.ac(sahteYerel(), sahteIdb({ asili: true })), 'yerel');
  });

  await t('daha önce taşınmışken IndexedDB açılmazsa: bellek kipi, eski kaydın üstüne yazacak hiçbir şey localStorage\'a gitmez', async () => {
    const ls = sahteYerel({ 'lifeos.kabuk.depo': 'idb', 'lifeos.tema.secim': 'dark' }), D = taze();
    esit(await D.ac(ls, sahteIdb({ acilmaz: true })), 'bellek');
    D.setItem('lifeos.not.kayit', '[9]');
    esit([D.getItem('lifeos.not.kayit'), ls.v['lifeos.not.kayit']], ['[9]', undefined]);
    D.setItem('lifeos.tema.secim', 'light');
    esit(ls.v['lifeos.tema.secim'], 'light', 'ayar yine yazılır');
  });

  await t('IndexedDB yazamazsa değer localStorage\'a kurtarılır; sonraki açılış taşır, sonraki başarılı yazı kurtarılanı temizler', async () => {
    const ls = sahteYerel(), idb = sahteIdb(), D = taze(), hata = console.error;
    await D.ac(ls, idb);
    idb.o.kes = tur => tur === 'readwrite';
    console.error = () => {};
    try { await D.yaz('lifeos.tekrar.kartlar', '[1]'); } finally { console.error = hata; }
    esit([ls.v['lifeos.tekrar.kartlar'], idb.veri.has('lifeos.tekrar.kartlar')], ['[1]', false]);
    idb.o.kes = null;
    await D.yaz('lifeos.tekrar.kartlar', '[1,2]');
    esit([ls.v['lifeos.tekrar.kartlar'], idb.veri.get('lifeos.tekrar.kartlar')], [undefined, '[1,2]'], 'başarılı yazı kurtarılanı sildi');
    idb.o.kes = tur => tur === 'readwrite'; console.error = () => {};
    try { await D.yaz('lifeos.tekrar.bugun', '{"yeni":1}'); } finally { console.error = hata; }
    idb.o.kes = null;
    const D2 = taze(); await D2.ac(ls, idb);
    esit([idb.veri.get('lifeos.tekrar.bugun'), ls.v['lifeos.tekrar.bugun'], D2.getItem('lifeos.tekrar.kartlar')], ['{"yeni":1}', undefined, '[1,2]']);
  });

  await t('kalıcı depolama bir kez istenir; verilmişse yeniden sorulmaz', async () => {
    const eski = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    let soruldu = 0;
    const kur = verilmis => Object.defineProperty(globalThis, 'navigator', { configurable: true, writable: true,
      value: { storage: { persisted: () => Promise.resolve(verilmis), persist: () => { soruldu++; return Promise.resolve(true); } } } });
    try {
      kur(false); let D = taze(); esit(D.kalici(), null, 'yanıt gelmeden bilinmiyor');
      await D.ac(sahteYerel(), sahteIdb()); await uyu(5);
      esit([D.kalici(), soruldu], [true, 1]);
      kur(true); D = taze(); await D.ac(sahteYerel(), sahteIdb()); await uyu(5);
      esit([D.kalici(), soruldu], [true, 1], 'verilmişken persist çağrılmaz');
    } finally { if (eski) Object.defineProperty(globalThis, 'navigator', eski); else delete globalThis.navigator; }
  });

  await t('öteki sekmenin yazdığı bu sekmenin belleğine düşer (BroadcastChannel)', async () => {
    if (typeof BroadcastChannel === 'undefined') return;
    const idb = sahteIdb(), ls = sahteYerel();
    const D1 = taze(); await D1.ac(ls, idb);
    const D2 = taze(); await D2.ac(ls, idb);
    D1.setItem('lifeos.plan.sablon', '{"a":1}'); D1.setItem('lifeos.not.araclar', '[]'); await uyu(20);
    esit([D2.getItem('lifeos.plan.sablon'), D2.getItem('lifeos.not.araclar')], ['{"a":1}', '[]']);
    D1.removeItem('lifeos.not.araclar'); await uyu(20);
    esit(D2.getItem('lifeos.not.araclar'), null, 'silme de düşer');
  });

  // Eşitleme: sistem/veri.py kabuk_yaz/kabuk_cek kurallarının aynısıyla çalışan sahte sunucu (gerçeği tools/tekdepo_test.py ve
  // HKM/tests/test_hesap.py sınar). Her cihaz kendi localStorage + IndexedDB'siyle.
  function sahteSunucu() {
    const kayit = new Map(), cakisma = [], istekler = []; let sira = 0, kapali = 0;
    const cevap = (status, v) => ({ ok: status < 400, status, json: async () => v });
    return {
      kayit, cakisma, istekler, kapat(kod) { kapali = kod; },
      yaz(k, v) { kayit.set(k, { v, surum: ++sira }); },
      ag: async (url, o) => {
        istekler.push([o.method, url, o.headers]);
        if (kapali) { if (kapali === 'ag') throw new TypeError('Failed to fetch'); return cevap(kapali, {}); }
        if (o.method === 'GET') {
          const son = +url.split('son=')[1];
          const l = [...kayit].filter(([, x]) => x.surum > son).sort((a, b) => a[1].surum - b[1].surum).map(([k, x]) => ({ k, v: x.v, surum: x.surum }));
          return cevap(200, { kayitlar: l, son: Math.max(sira, son), daha: false });
        }
        const surumler = {};
        for (const y of JSON.parse(o.body).yazimlar) {
          const x = kayit.get(y.k), simdi = x ? x.v : null;
          if (y.sakla) { if (y.v != null && y.v !== simdi) cakisma.push([y.k, y.v]); continue; }
          if (simdi === y.v) { surumler[y.k] = x ? x.surum : 0; continue; }
          if (simdi != null && x.surum !== y.taban) cakisma.push([y.k, simdi]);
          kayit.set(y.k, { v: y.v, surum: ++sira }); surumler[y.k] = sira;
        }
        return cevap(200, { surumler, cakisma: 0 });
      }
    };
  }
  async function cihaz(s, ls, idb) { const D = taze(); D.ag = s.ag; D.bekle = 5; await D.ac(ls || sahteYerel(), idb || sahteIdb()); await D.esitle(); return D; }

  await t('eşitleme: ilk cihaz yerel kayıtlarını gönderir; ayarlar gitmez; istek özel başlıklı', async () => {
    const s = sahteSunucu(), ls = sahteYerel(ORNEK), D = await cihaz(s, ls);
    esit([...s.kayit.keys()].sort(), ['lifeos.beden.boy', 'lifeos.not.kayit', 'lifeos.yol.felsefe.1']);
    esit(s.kayit.get('lifeos.not.kayit').v, ORNEK['lifeos.not.kayit']);
    dogru(s.istekler.every(x => x[2]['X-LifeOS'] === 'kabuk' && !x[2].Authorization), 'X-LifeOS: kabuk, oturumsuz');
    esit([D.esitleme().bekleyen, D.esitleme().acik, D.esitleme().hata], [0, true, '']);
    dogru(!D.kayitMi('lifeos.kabuk.esitle') && 'lifeos.kabuk.esitle' in ls.v, 'durum localStorage\'da, kayıt değil');
  });

  await t('eşitleme: katılan cihaz sunucudakini alır, dinleyen haber alır; farklı yerel değeri kaybolmaz (sakla)', async () => {
    const s = sahteSunucu();
    s.yaz('lifeos.not.kayit', '[{"id":"pc"}]'); s.yaz('lifeos.plan.durum', '{"p":1}');
    const D = taze(); D.ag = s.ag; D.bekle = 5; let gelen = [];
    D.dinle(l => { gelen = gelen.concat(l); });
    await D.ac(sahteYerel({ 'lifeos.not.kayit': '[{"id":"tel"}]', 'lifeos.soru.gecmis': '[7]' }), sahteIdb()); await D.esitle();
    esit([D.getItem('lifeos.not.kayit'), D.getItem('lifeos.plan.durum')], ['[{"id":"pc"}]', '{"p":1}']);
    esit(gelen.sort(), ['lifeos.not.kayit', 'lifeos.plan.durum']);
    esit(s.cakisma, [['lifeos.not.kayit', '[{"id":"tel"}]']], 'telefonun eski notu sunucuda saklandı');
    esit(s.kayit.get('lifeos.soru.gecmis').v, '[7]', 'sunucuda olmayan yerel kayıt gönderildi');
    esit(s.kayit.get('lifeos.not.kayit').v, '[{"id":"pc"}]', 'sunucudaki ezilmedi');
  });

  await t('eşitleme: bir cihazın yazısı öbürüne gider; silme de gider', async () => {
    const s = sahteSunucu(), A = await cihaz(s), B = await cihaz(s);
    A.setItem('lifeos.tekrar.kartlar', '[1]'); await uyu(20); await A.esitle();
    await B.esitle();
    esit(B.getItem('lifeos.tekrar.kartlar'), '[1]');
    B.removeItem('lifeos.tekrar.kartlar'); await B.esitle();
    await A.esitle();
    esit([A.getItem('lifeos.tekrar.kartlar'), s.kayit.get('lifeos.tekrar.kartlar').v, s.cakisma.length], [null, null, 0]);
  });

  await t('eşitleme: görmeden yazan cihaz kazanır ama öbürünün değeri sunucuda saklanır; bekleyen yerel yazı çekişte ezilmez', async () => {
    const s = sahteSunucu(), A = await cihaz(s), B = await cihaz(s);
    A.setItem('lifeos.not.kayit', '["A1"]'); await A.esitle(); await B.esitle();
    s.kapat('ag'); B.setItem('lifeos.not.kayit', '["B"]'); await B.esitle(); s.kapat(0); // B çevrimdışı yazdı
    A.setItem('lifeos.not.kayit', '["A2"]'); await A.esitle();
    await B.esitle();
    esit(B.getItem('lifeos.not.kayit'), '["B"]', 'çekiş B\'nin bekleyen yazısını ezmedi');
    esit([s.kayit.get('lifeos.not.kayit').v, s.cakisma], ['["B"]', [['lifeos.not.kayit', '["A2"]']]]);
    await A.esitle();
    esit(A.getItem('lifeos.not.kayit'), '["B"]');
  });

  await t('eşitleme: ağ yoksa bekleyen kalır, yeniden açılışta gider; uç yoksa (404) kapanır, kabuk çalışır', async () => {
    const s = sahteSunucu(), ls = sahteYerel(), idb = sahteIdb();
    let D = await cihaz(s, ls, idb);
    s.kapat('ag'); D.setItem('lifeos.onay', '{"x":1}'); await D.esitle();
    esit([D.esitleme().bekleyen, D.esitleme().hata], [1, 'Sunucuya ulaşılamadı']);
    s.kapat(0); await uyu(5);
    D = await cihaz(s, ls, idb);
    esit([s.kayit.get('lifeos.onay').v, D.esitleme().bekleyen], ['{"x":1}', 0]);
    const s2 = sahteSunucu(); s2.kapat(404);
    const E = await cihaz(s2);
    E.setItem('lifeos.onay', '{}'); await E.esitle();
    esit([E.getItem('lifeos.onay'), E.esitleme().acik, s2.istekler.length], ['{}', false, 1]);
  });

  await t('eşitleme: telefonda sahibin oturum jetonu gider (hesap.js çerezi)', async () => {
    const s = sahteSunucu(), eski = globalThis.document;
    globalThis.document = { cookie: 'x=1; lifeos_hesap=' + encodeURIComponent(JSON.stringify({ j: 'jeton-123', a: 'omer' })) };
    try { await cihaz(s, sahteYerel(ORNEK)); } finally { if (eski === undefined) delete globalThis.document; else globalThis.document = eski; }
    dogru(s.istekler.length && s.istekler.every(x => x[2].Authorization === 'Bearer jeton-123'));
  });

  console.log(kalan ? '\n' + kalan + ' test kaldı, ' + gecen + ' geçti' : '\n' + gecen + ' test geçti');
  process.exit(kalan ? 1 : 0);
})();
