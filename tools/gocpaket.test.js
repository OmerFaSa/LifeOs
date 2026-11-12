#!/usr/bin/env node
/* Göç paketi (brand/ortak/gocpaket.js) testi — tarayıcısız: sahte localStorage, sahte IndexedDB,
   Node'un gerçek SHA-256'sı. Söz 1-4 (dosya başı) tek tek denenir.

     node tools/gocpaket.test.js [KLASOR]   (çıkış 0 temiz, 1 kırmızı)

   KLASOR verilirse üretilen paketler oraya yazılır; tools/gocpaket_test.py onları PC tarafından
   (goc.paket_kaydet) ve göç okuyucusundan (goc.goc) geçirir. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const nodeCrypto = require('crypto');

let kirmizi = 0;
const dogru = (ad, kosul, ek) => {
  console.log((kosul ? '  ✓ ' : '  ✕ ') + ad + (kosul ? '' : '  ' + JSON.stringify(ek)));
  if(!kosul) kirmizi++;
};

function sahteLs(o){
  const k = Object.keys(o);
  return { length:k.length, key:i => k[i], getItem:x => (x in o ? o[x] : null), setItem(){ throw new Error('yazmamalı'); },
    removeItem(){ throw new Error('silmemeli'); } };
}

/* Yalnız gocpaket.js'in kullandığı kadar IndexedDB: open, onupgradeneeded (sürüm 0), getAll. */
function sahteIdb(dbler){
  const acilan = [];
  return { acilan, dbler, open(ad){
    const r = {};
    acilan.push(ad);
    setImmediate(() => {
      if(!dbler[ad]){
        let iptal = false;
        r.transaction = { abort(){ iptal = true; } };
        r.onupgradeneeded && r.onupgradeneeded({ oldVersion:0 });
        if(!iptal) dbler[ad] = {};                     // gocpaket iptal etmezse yaratılmış olurdu
        return r.onerror && r.onerror();
      }
      const d = dbler[ad];
      r.result = { objectStoreNames:{ contains:s => s in d }, close(){},
        transaction:s => ({ objectStore:() => ({ getAll(){
          const g = {}; setImmediate(() => { g.result = d[s].slice(); g.onsuccess(); }); return g; } }) }) };
      r.onsuccess();
    });
    return r;
  } };
}

const kok = path.resolve(__dirname, '..');
const pencere = { localStorage:null, indexedDB:null };
pencere.window = pencere;
vm.runInNewContext(fs.readFileSync(path.join(kok, 'brand', 'ortak', 'gocpaket.js'), 'utf8'),
  Object.assign(pencere, { Blob, btoa, console, setImmediate }));
const G = pencere.LIFEOS.GocPaket;

(async () => {
  const AYS = { yerelAnahtar:p => (p === 'main' ? 'rota84285.v2' : 'rota84285.v2.' + p), varsayilanProfil:'main' };
  const SPI = { yerelAnahtar:p => 'spi.v1.' + p, varsayilanProfil:'ben' };
  dogru('AYS ana profil (özel anahtar)', G.profilOf('rota84285.v2', AYS) === 'main');
  dogru('AYS ikinci profil', G.profilOf('rota84285.v2.p2', AYS) === 'p2');
  dogru('AYS ana depo olmayan anahtar', G.profilOf('rota84285.v2x', AYS) === null && G.profilOf('rota.profiles', AYS) === null);
  dogru('içe aktarma öncesi kopyası profil sayılmaz', G.profilOf('spi.v1.ben.oncesi', SPI) === null);

  const ls = {
    'spi.v1.ben':JSON.stringify({ 'meals/2026-11-12':{ kcal:350 }, 'storage/x':{ n:1 } }),
    'spi.v1.anne':JSON.stringify({ 'sleep/2026-11-12':{ sure:420 } }),
    'spi.v1.ornek':JSON.stringify({ 'meals/o':{ kcal:1 } }),
    'spi.v1.ben.oncesi':JSON.stringify({ eski:true }),
    'spi.household':JSON.stringify(['ben', 'anne']),
    'spi.activeProfile':'ben',
    'lifeos.king.dersler':JSON.stringify([{ ders:'x' }]),
    'spi.llm.keys':JSON.stringify({ openai:'GIZLI' }),
    'lifeos.ayar.apiKey':'GIZLI',
    'lifeos.hesap.sira.spi/ben':JSON.stringify({ 'meals/a':1, 'meals/b':1 }),
    'lifeos.hesap.sahip.spi/ben':'"ali"',
  };
  const t = G.topla(sahteLs(ls), SPI);
  dogru('bütün profiller, örnek hariç', JSON.stringify(Object.keys(t.profiller).sort()) === '["anne","ben"]', Object.keys(t.profiller));
  dogru('ana depo gövdesi aynen (cihaza ait yol göçe sayılsın diye kalır)',
    JSON.stringify(t.profiller.ben.data) === ls['spi.v1.ben']);
  dogru('ana depo dışı anahtarlar girer', 'lifeos.king.dersler' in t.anahtarlar && 'spi.household' in t.anahtarlar);
  dogru('sır adlı anahtar girmez, sayılır', !JSON.stringify(t).includes('GIZLI') && t.atlanan.sir === 2, t.atlanan);
  dogru('eşitleme düzeneği girmez, bekleyen sayılır',
    !Object.keys(t.anahtarlar).some(k => k.startsWith('lifeos.hesap.')) && t.bekleyen['spi/ben'] === 2, t.bekleyen);
  dogru('öncesi kopyası girmez, örnek sayılır', !('spi.v1.ben.oncesi' in t.anahtarlar) && t.atlanan.ornek === 1);

  // Medya: iki veritabanı var, defter yok; parça sınırı 10 bayt → foto ve not ayrı paketlere.
  const foto = new Blob([Buffer.from('JPEGVERI-1')], { type:'image/jpeg' });
  const not = new Blob([Buffer.from('ses dosyasi 22 bayt..')], { type:'audio/webm' });
  const idb = sahteIdb({ 'spi-foto':{ foto:[{ k:'tahlil/1', blob:foto, at:5 }, { k:'bos' }] } });
  idb.dbler['lifeos-defter-spi'] = { medya:[{ id:'m1', notId:'n1', ad:'kayit.webm', blob:not }] };
  const giden = [];
  const fetch = async (adres, o) => {
    giden.push({ adres, o });
    return { ok:true, json:async () => ({ ad:'paket-' + giden.length + '.json' }) };
  };
  const m = await G.yolla({ kaynak:'spi', cihaz:'cihazTEL01', depo:SPI, jeton:'j1', ls:sahteLs(ls), idb,
    subtle:globalThis.crypto.subtle, fetch, parca:10 });
  const paketler = giden.map(g => JSON.parse(g.o.body));
  dogru('makbuz', m.paket === 2 && m.profil === 2 && m.medya === 2 && m.bayt === 31, m);
  dogru('istek başlığı ve adres', giden.every(g => g.adres === '/api/hesap/goc-paket' && g.o.headers['X-LifeOS'] === 'goc'
    && g.o.headers.Authorization === 'Bearer j1'));
  dogru('parça sınırında bölünür, veri ilk pakette', paketler[0].medya.length === 1 && paketler[1].medya.length === 1
    && paketler[0].profiller && !paketler[1].profiller);
  const f = paketler[0].medya[0];
  dogru('medya sha256 ve base64 doğru', f.sha256 === nodeCrypto.createHash('sha256').update('JPEGVERI-1').digest('hex')
    && Buffer.from(f.veri, 'base64').toString() === 'JPEGVERI-1' && f.boyut === 10 && f.tur === 'image/jpeg');
  dogru('medya kaydının kendisi (blob hariç) taşınır', JSON.stringify(paketler[1].medya[0].kayit) === '{"id":"m1","notId":"n1","ad":"kayit.webm"}');
  dogru('olmayan veritabanı yaratılmaz', !('lifeos-defter-ays' in idb.dbler) && Object.keys(idb.dbler).length === 2);
  try{
    await G.yolla({ kaynak:'spi', cihaz:'cihazTEL01', depo:SPI, ls:sahteLs({}), idb, subtle:null, fetch });
    dogru('güvensiz bağlantıda açık hata', false);
  }catch(e){ dogru('güvensiz bağlantıda açık hata', /https/.test(e.message)); }
  const ret = async () => ({ ok:false, status:413, json:async () => ({ hata:'Paket çok büyük.' }) });
  try{
    await G.yolla({ kaynak:'esp', cihaz:'cihazTEL01', ls:sahteLs({}), idb:null, subtle:globalThis.crypto.subtle, fetch:ret });
    dogru('sunucunun hatası kullanıcıya aynen', false);
  }catch(e){ dogru('sunucunun hatası kullanıcıya aynen', e.message === 'Paket çok büyük.'); }

  const hedef = process.argv[2];
  if(hedef){
    fs.mkdirSync(hedef, { recursive:true });
    giden.forEach((g, i) => fs.writeFileSync(path.join(hedef, 'p' + i + '.json'), g.o.body));
  }
  console.log('\nGöç paketi: ' + (kirmizi ? kirmizi + ' kırmızı' : 'temiz'));
  process.exit(kirmizi ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
