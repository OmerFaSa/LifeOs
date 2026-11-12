/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/gocpaket.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* GÖÇ PAKETİ — sadeleşme Faz 1 P2 (belgeler/ekip/sadelesme/faz1.md). Donmuş modüllere tek istisna.

   Bu kökende duran her şeyi, tek depoya taşınmak üzere PC'ye yollar:
     profiller   — bütün profillerin ana deposu (yalnız etkin olanı değil; «örnek» profil hariç)
     anahtarlar  — ana depo dışındaki localStorage anahtarları (King dersleri, profil listeleri, Gün geçmişi …)
     medya       — IndexedDB'deki fotoğraf ve defter medyası: base64 + sha256 + kaydın kendisi
     bekleyen    — hesap eşitleme sırasında henüz sunucuya gitmemiş değişiklik sayısı (alan başına)
   Biçimi sistem/goc.py topla_paketler okur; PC'de goc.paket_kaydet denetleyip saklar.

   Sözler:
   1. Hiçbir şeye yazmaz, hiçbir şeyi silmez; olmayan IndexedDB veritabanını yaratmaz.
   2. Sır adlı anahtar (goc.py SIR_RE) pakete hiç girmez; yalnız sayısı yazılır.
   3. Eşitleme düzeneği (`lifeos.hesap.*`) veri değildir: girmez, yalnız sıradaki sayılır.
   4. Medya `parca` baytlık paketlere bölünür ve her paket dolunca yollanır: bellek bir parçayla sınırlı.

     LIFEOS.GocPaket.yolla({ kaynak:'spi', cihaz, depo:SP.Store, jeton, adres })  → makbuz
*/
(function(){
  'use strict';
  const SIR_RE = /(llm\.keys|anahtar|apikey|api_key|token|jeton|parola|sifre|secret|password)/i;
  const PARCA = 48 * 1024 * 1024;
  const MEDYA = {
    ays:[['ays-soru-foto', 'foto'], ['lifeos-defter-ays', 'medya']],
    spi:[['spi-foto', 'foto'], ['lifeos-defter-spi', 'medya']],
    esp:[['lifeos-defter-esp', 'medya']],
    gun:[],
  };

  function coz(v){ try{ return JSON.parse(v); }catch(e){ return v; } }

  /* Ana depo anahtarı → profil adı, değilse null. depo: { yerelAnahtar(p), varsayilanProfil } (depo.js kur). */
  function profilOf(k, depo){
    if(!depo || typeof depo.yerelAnahtar !== 'function') return null;
    const sablon = depo.yerelAnahtar('\u0001'), i = sablon.indexOf('\u0001'), son = sablon.length - i - 1;
    const adaylar = [depo.varsayilanProfil];
    if(i >= 0 && k.length > sablon.length - 1 && k.startsWith(sablon.slice(0, i)) && k.endsWith(sablon.slice(i + 1)))
      adaylar.push(k.slice(i, k.length - son));
    return adaylar.find(p => p && !/\.oncesi$/.test(p) && depo.yerelAnahtar(p) === k) || null;
  }

  /* localStorage'ı sınıflar (söz 1-3). ls: getItem/key/length arayüzü. */
  function topla(ls, depo){
    const out = { profiller:{}, anahtarlar:{}, bekleyen:{}, atlanan:{ sir:0, ornek:0 } };
    for(let j = 0; j < ls.length; j++){
      const k = ls.key(j), v = k == null ? null : ls.getItem(k);
      if(v == null) continue;
      if(k.indexOf('lifeos.hesap.') === 0){
        if(k.indexOf('lifeos.hesap.sira.') === 0){
          const s = coz(v);
          out.bekleyen[k.slice(18)] = s && typeof s === 'object' ? Object.keys(s).length : 0;
        }
        continue;
      }
      const p = profilOf(k, depo);
      if(p){
        if(p === 'ornek'){ out.atlanan.ornek++; continue; }
        const d = coz(v);
        out.profiller[p] = { data:d && typeof d === 'object' && !Array.isArray(d) ? d : {} };
        continue;
      }
      if(/\.oncesi$/.test(k) && profilOf(k.slice(0, -7), depo)) continue;   // içe aktarmadan önceki kopya
      if(SIR_RE.test(k)){ out.atlanan.sir++; continue; }
      out.anahtarlar[k] = coz(v);
    }
    return out;
  }

  /* Var olan veritabanını açar; yoksa null döner ve yaratmaz (yükseltme sürüm 0'dan ise iptal). */
  function idbAc(idb, ad){
    return new Promise(ok => {
      let r;
      try{ r = idb.open(ad); }catch(e){ ok(null); return; }
      r.onupgradeneeded = e => { if(e.oldVersion === 0) r.transaction.abort(); };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ok(null);
      r.onblocked = () => ok(null);
    });
  }

  async function medyaOku(idb, liste){
    const out = [];
    if(!idb) return out;
    for(const [db, depo] of liste){
      const c = await idbAc(idb, db);
      if(!c) continue;
      try{
        if(!c.objectStoreNames.contains(depo)) continue;
        const kayitlar = await new Promise((ok, red) => {
          const r = c.transaction(depo, 'readonly').objectStore(depo).getAll();
          r.onsuccess = () => ok(r.result || []); r.onerror = () => red(r.error);
        });
        kayitlar.forEach(k => out.push({ db, depo, kayit:k }));
      }finally{ c.close(); }
    }
    return out;
  }

  // shortcut: dosyanın tamamı bellekte base64'e çevrilir (defter dosyası en çok 300 MB); daha büyüğü gelirse dilimle oku
  function b64(buf){
    const u = new Uint8Array(buf);
    let s = '';
    for(let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(s);
  }
  const hex = buf => Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');

  async function gonder(paket, o){
    const baslik = { 'Content-Type':'application/json', 'X-LifeOS':'goc' };
    if(o.jeton) baslik.Authorization = 'Bearer ' + o.jeton;
    const r = await o.fetch(o.adres || '/api/hesap/goc-paket', { method:'POST', headers:baslik, body:JSON.stringify(paket) });
    let v = {};
    try{ v = await r.json(); }catch(e){ /* gövdesiz cevap */ }
    if(!r.ok) throw new Error(v.hata || ('Göç paketi gönderilemedi (' + r.status + ').'));
    return v;
  }

  /* Paketi hazırlar ve yollar. o: { kaynak, cihaz, depo?, jeton?, adres?, ls?, idb?, subtle?, fetch?, parca? }.
     Döner: { paket, profil, anahtar, medya, bayt, bekleyen, atlanan, adlar }. */
  async function yolla(o){
    o = Object.assign({
      ls:window.localStorage, idb:window.indexedDB, fetch:window.fetch && window.fetch.bind(window),
      subtle:window.crypto && window.crypto.subtle, parca:PARCA,
    }, o);
    if(!o.subtle) throw new Error('Bu bağlantı güvenli değil (https gerekir); göç paketi hazırlanamadı.');
    const t = topla(o.ls, o.depo);
    const bas = { lifeos_goc:1, kaynak:o.kaynak, cihaz:o.cihaz };
    const makbuz = { paket:0, profil:Object.keys(t.profiller).length, anahtar:Object.keys(t.anahtarlar).length,
      medya:0, bayt:0, bekleyen:t.bekleyen, atlanan:t.atlanan, adlar:[] };
    let cur = Object.assign({ parca:1, profiller:t.profiller, anahtarlar:t.anahtarlar, bekleyen:t.bekleyen,
      atlanan:t.atlanan, medya:[] }, bas), dolu = 0;
    const yolla1 = async p => { const v = await gonder(p, o); makbuz.paket++; makbuz.adlar.push(v.ad); };
    for(const m of await medyaOku(o.idb, MEDYA[o.kaynak] || [])){
      const alan = Object.keys(m.kayit || {}).find(x => m.kayit[x] instanceof Blob);
      if(!alan) continue;
      const blob = m.kayit[alan], buf = await blob.arrayBuffer();
      if(dolu && dolu + buf.byteLength > o.parca){
        await yolla1(cur);
        cur = Object.assign({ parca:makbuz.paket + 1, medya:[] }, bas);
        dolu = 0;
      }
      const kayit = Object.assign({}, m.kayit);
      delete kayit[alan];
      cur.medya.push({ db:m.db, depo:m.depo, anahtar:String(kayit.id || kayit.k || ''), tur:blob.type || '',
        boyut:buf.byteLength, sha256:hex(await o.subtle.digest('SHA-256', buf)), veri:b64(buf), kayit });
      dolu += buf.byteLength;
      makbuz.medya++;
      makbuz.bayt += buf.byteLength;
    }
    await yolla1(cur);
    return makbuz;
  }

  window.LIFEOS = window.LIFEOS || {};
  LIFEOS.GocPaket = Object.freeze({ topla, profilOf, yolla, PARCA, MEDYA });
})();
