/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/hesap.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* HESAP — PC sunucusuyla giriş ve eşitleme (sistem/hesap.py).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/hesap.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi
   `hesap.css`; düğmeyi kabuk çizer (kabuk.js ustHesap), durumunu ve
   panelini bu dosya yönetir (ses.js ile aynı kalıp).
   ==================================================================

   Depo sahibinin kararı (2026-10-04): PC, telefon ve tablet aynı hesapla
   girer; verinin kopyası PC'deki LifeOS sunucusunda durur. Cihaz
   çevrimdışıyken değişiklik sıraya girer, sunucuya ulaşınca oraya akar.

   Sözler:
   1. MODÜL ONSUZ DA ÇALIŞIR. Sunucu yoksa, kapalıysa ya da cevap
      vermezse hiçbir ekran beklemez, hiçbir veri kaybolmaz (AGENTS §1.4'ün
      sunucu karşılığı). Bütün ağ işi arkada ve zaman aşımıyla.
   2. ÖNCE CİHAZ. Her yazma önce bu cihazın deposuna iner (store.js); bu
      dosya yalnız «hangi yol ne zaman değişti»yi sıraya yazar. Sıra bu
      cihazın deposundadır: sayfa kapansa da kaybolmaz.
   3. İLK EŞİTLEME EZMEZ. Bir alan bu cihazda ilk kez bir hesaba bağlanınca
      yerel kayıtlar «ilk» işaretiyle gider: sunucuda olan kalır (PC'deki
      gerçek kayıt telefondaki denemeyle ezilmez), sunucudaki sürüm cihaza
      iner. Bağlanmadan önceki değişiklik sıraya girmez; ilk eşitleme
      hepsini zaten taşır.
   4. TEK GİRİŞ, ÜÇ MODÜL. Oturum sayfanın makinesine ait bir çerezdedir;
      çerez kapı numarasına bakmaz: aynı cihazdaki AYS, SPİ ve ESP birlikte
      girer, birlikte çıkar. Jeton hiçbir ekrana, günlüğe, adres satırına
      yazılmaz; sunucuya yalnız Authorization başlığıyla gider.
   5. BİR CİHAZ, BİR HESAP. Bu cihazdaki bir alan bir hesaba bağlandıysa
      başka bir hesapla girilince o alan eşitlenmez ve bu söylenir:
      birinin verisi ötekinin hesabına akmaz.
   6. ÖRNEK PROFİL EŞİTLENMEZ.
   7. KAYITTA SON YAZAN KAZANIR (sunucu sözü 2). Uzaktan gelen kayıt, bu
      cihazda daha yeni bir değişikliği sırada bekleyen yolun üstüne
      yazılmaz.
   8. FOTOĞRAFLAR EŞİTLENMEZ: tarayıcının ayrı deposundadır (foto.js) ve
      bu sürümde çekildiği cihazda kalır. Panel bunu söyler.
   9. YAZILAN SİLİNMEZ, KAYDET EN YENİNİN ÜSTÜNE YAZAR (2026-10-05).
      Uzaktan kayıt gelince model hemen tazelenir (modülün `yukle`'si);
      ekran (`yenile`) kullanıcı yazarken ya da yazıp henüz kaydetmemişken
      beklenir — odak alandan çıkmış olsa da (telefonda klavye kapandı).
      Açık bir kağıt ikisini de bekletir. Eskiden ikisi birlikte
      bekliyordu: «Kaydet» eski modelden kurulan kaydı yazıp öteki
      cihazın az önce gelen değişikliğini eziyordu.
  10. AYNI DEĞER EKRANI YENİLEMEZ. Uzaktan gelen kayıt bu cihazdakiyle
      aynıysa yazılmaz, ekran yenilenmez: değişmemiş bir kaydı yeniden
      yazan bir cihaz öteki cihazları durmadan yenilemesin. */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.HESAP = (function(){
  'use strict';

  const L = window.LIFEOS;
  const CEREZ = 'lifeos_hesap';
  const CIHAZ = 'lifeos_cihaz';
  const SUNUCU = 'lifeos_sunucu';
  const BETA = 'lifeos_beta';
  const ONEK = 'lifeos.hesap.';
  const ARALIK = 60000;              // açıkken dakikada bir
  const ERTELE = 2500;               // yazmadan sonra toplu gönderim
  const ZAMAN_ASIMI = 60000;         // ilk eşitleme birkaç MB olabilir
  const DURUM_ZAMAN_ASIMI = 6000;
  const PARTI_KAYIT = 400;
  const PARTI_BAYT = 1500000;
  const TELEFON_KAPI = 5183;         // ev ağı https kapısı (sistem/telefon.py)
  const MODUL_AD = { ays:'AYS', spi:'SPİ', esp:'ESP' };

  /* Dış dünya tek yerde; testler bunları değiştirir. */
  const ortam = {
    fetch:(a, b) => fetch(a, b),
    simdi:() => Date.now(),
    yerelUygulama:() => !!(typeof window !== 'undefined' && window.LIFEOS_YEREL),
    konum:() => window.location,
    cerez:{
      oku:() => (typeof document !== 'undefined' ? document.cookie : ''),
      yaz:s => { if(typeof document !== 'undefined') document.cookie = s; },
    },
    depo:{
      oku(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } },
      yaz(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } },
      sil(k){ try{ localStorage.removeItem(k); }catch(e){ /* depo yok */ } },
    },
    zamanla:(fn, ms) => setTimeout(fn, ms),
    iptal:id => clearTimeout(id),
    rastgele:n => {
      const b = new Uint8Array(n);
      if(typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(b);
      else for(let i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256);
      return b;
    },
  };

  let ayar = null;            // { modul, depo, yukle, yenile, mesgul, kesilebilir, ornek }
  let hal = { durum:'bilinmiyor', mesaj:'' };
  let sunucu = null;          // /api/hesap/durum cevabı; null = API yok/ulaşılamadı
  let erteleId = null, araId = null;
  let sonGorunur = 0, panelMesaj = '';
  /* Uzaktan gelenin modele (yukle) ve ekrana (yenile) inişi (söz 9). */
  let modelBekliyor = false, ekranBekliyor = false, yenileId = null, tazeleme = null;
  /* EŞİTLENDİ İŞARETİ (kullanıcı, 2026-10-05, «7 güzel»): bir şey gerçekten
     gidip geldiyse bulut simgesinde onay bir kez belirip söner. Boş tur
     (dakikalık yoklama) işaret koymaz. */
  const ONAY_MS = 1800;
  let onayBitis = 0;
  const dinleyiciler = [];

  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }

  /* İki JSON değeri aynı mı? Anahtar sırası önemsiz (söz 10). */
  function esit(a, b){
    if(a === b) return true;
    if(a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
    if(Array.isArray(a) !== Array.isArray(b)) return false;
    if(Array.isArray(a)){
      if(a.length !== b.length) return false;
      for(let i = 0; i < a.length; i++) if(!esit(a[i], b[i])) return false;
      return true;
    }
    const ka = Object.keys(a);
    if(ka.length !== Object.keys(b).length) return false;
    return ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && esit(a[k], b[k]));
  }

  /* --------------------------------------------------------- çerez */

  function cerezOku(ad){
    const m = String(ortam.cerez.oku() || '').match(new RegExp('(?:^|;\\s*)' + ad + '=([^;]*)'));
    if(!m || !m[1]) return null;
    try{ return JSON.parse(decodeURIComponent(m[1])); }catch(e){ return null; }
  }
  /* oturumluk: süresiz (tarayıcı/uygulama kapanınca biter) — beta girişi. */
  function cerezYaz(ad, deger, oturumluk){
    const guvenli = ortam.konum().protocol === 'https:' ? '; Secure' : '';
    ortam.cerez.yaz(ad + '=' + encodeURIComponent(JSON.stringify(deger))
      + '; Path=/' + (oturumluk ? '' : '; Max-Age=34560000') + '; SameSite=Strict' + guvenli);
  }
  function cerezSil(ad){ ortam.cerez.yaz(ad + '=; Path=/; Max-Age=0; SameSite=Strict'); }

  function cihazKimligi(){
    const c = cerezOku(CIHAZ);
    if(typeof c === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(c)) return c;
    const yeni = 'c' + Array.from(ortam.rastgele(12), x => x.toString(16).padStart(2, '0')).join('');
    cerezYaz(CIHAZ, yeni);
    return yeni;
  }
  function cihazAdi(){
    const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
    const tur = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad'
      : /Android/.test(ua) ? (/Mobile/.test(ua) ? 'Android telefon' : 'Android tablet')
      : /Windows/.test(ua) ? 'Windows PC' : /Macintosh/.test(ua) ? 'Mac' : 'Cihaz';
    return tur + (ortam.yerelUygulama() ? ' · uygulama' : '');
  }

  function oturum(){
    const o = cerezOku(CEREZ);
    return o && typeof o.j === 'string' && o.j && typeof o.a === 'string' ? o : null;
  }

  /* «192.168.0.10» → «https://192.168.0.10:5183». Yol, sorgu atılır. */
  function adresDuzelt(yazi){
    let s = String(yazi || '').trim();
    if(!s) return null;
    if(!/^https?:\/\//i.test(s)) s = 'https://' + s;
    let u;
    try{ u = new URL(s); }catch(e){ return null; }
    if(!u.hostname) return null;
    return u.protocol + '//' + u.hostname + ':' + (u.port || (u.protocol === 'https:' ? TELEFON_KAPI : 80));
  }

  /* Sunucu nerede? Uygulamada (telefon) kullanıcının yazdığı adres;
     tarayıcıda sayfanın kendi kökeni (LifeOS sunucusu her modül kapısında
     /api/hesap/ sunar). null = bilinmiyor. */
  function sunucuAdresi(){
    const o = oturum();
    if(o && typeof o.s === 'string' && o.s) return o.s;
    if(ortam.yerelUygulama()){
      const s = cerezOku(SUNUCU);
      return typeof s === 'string' && s ? s : null;
    }
    const k = ortam.konum();
    return /^https?:$/.test(k.protocol) ? '' : null;
  }

  /* ------------------------------------------------------- sıra */

  const anahtar = (tur, alan) => ONEK + tur + '.' + alan;
  function alan(){ return ayar && ayar.depo && ayar.depo.alan ? String(ayar.depo.alan) : ''; }
  function ornekMi(){ try{ return !!(ayar && ayar.ornek && ayar.ornek()); }catch(e){ return false; } }
  function siraOku(a){
    const s = ortam.depo.oku(anahtar('sira', a));
    return s && typeof s === 'object' && !Array.isArray(s) ? s : {};
  }
  function siraYaz(a, s){
    if(Object.keys(s).length) ortam.depo.yaz(anahtar('sira', a), s);
    else ortam.depo.sil(anahtar('sira', a));
  }
  function bekleyen(){ const a = alan(); return a ? Object.keys(siraOku(a)).length : 0; }
  function sahip(a){ const s = ortam.depo.oku(anahtar('sahip', a)); return typeof s === 'string' ? s : null; }

  /* store.js her yazmada çağırır (onDegisim). */
  function degisti(yollar){
    if(!ayar || ornekMi()) return;
    const a = alan();
    if(!a || !sahip(a)) return;                       // söz 3
    const s = siraOku(a), z = ortam.simdi();
    (yollar || []).forEach(y => {
      if(typeof y === 'string' && y) s[y] = Math.max(z, (Number(s[y]) || 0) + 1);
    });
    siraYaz(a, s);
    durumYaz(hal.durum, hal.mesaj);
    ertele();
  }

  function ertele(ms){
    if(erteleId != null) ortam.iptal(erteleId);
    erteleId = ortam.zamanla(() => { erteleId = null; esitle(); }, ms == null ? ERTELE : ms);
  }

  /* ------------------------------------------------------- ağ */

  async function istek(base, yol, govde, jeton, sure){
    let kes = null, zaman = null;
    try{
      kes = new AbortController();
      zaman = ortam.zamanla(() => { try{ kes.abort(); }catch(e){ /* kapanmış */ } }, sure || DURUM_ZAMAN_ASIMI);
    }catch(e){ kes = null; }
    try{
      const baslik = {};
      if(govde){ baslik['Content-Type'] = 'application/json'; baslik['X-LifeOS'] = 'hesap'; }
      if(jeton) baslik.Authorization = 'Bearer ' + jeton;
      const r = await ortam.fetch(base + yol, {
        method:govde ? 'POST' : 'GET', headers:baslik,
        body:govde ? JSON.stringify(govde) : undefined,
        signal:kes ? kes.signal : undefined, cache:'no-store', credentials:'omit',
      });
      let v = null;
      try{ v = await r.json(); }catch(e){ v = null; }
      if(!r.ok){
        const h = new Error((v && v.hata) || ('Sunucu cevap vermedi (' + r.status + ').'));
        h.kod = r.status;
        throw h;
      }
      return v || {};
    }catch(e){
      if(e && e.kod) throw e;
      const h = new Error('Sunucuya ulaşılamadı.');
      h.kod = 0;
      throw h;
    }finally{
      if(zaman != null) ortam.iptal(zaman);
    }
  }

  async function yokla(){
    const base = sunucuAdresi();
    if(base === null){ sunucu = null; return null; }
    try{ sunucu = await istek(base, '/api/hesap/durum', null, null, DURUM_ZAMAN_ASIMI); }
    catch(e){ sunucu = null; }
    return sunucu;
  }

  /* ------------------------------------------------------- eşitleme */

  function partile(aday){
    const out = [];
    let bayt = 0;
    for(const g of aday){
      const n = JSON.stringify(g.d === undefined ? null : g.d).length + g.y.length + 40;
      if(out.length && (out.length >= PARTI_KAYIT || bayt + n > PARTI_BAYT)) break;
      out.push(g);
      bayt += n;
    }
    return out;
  }

  /* Aynı anda tek tur. Tur sürerken gelen çağrılar TEK bir sonraki tura
     bağlanır ve onu bekler: «eşitle» diyen, kendi değişikliğinin de
     gittiği turun bitişini görür. */
  let aktif = null, siradaki = null;
  function esitle(){
    if(siradaki) return siradaki;
    if(!aktif){
      aktif = tur().finally(() => { aktif = null; });
      return aktif;
    }
    siradaki = aktif.then(() => { siradaki = null; return esitle(); });
    return siradaki;
  }

  async function tur(){
    if(!ayar || !ayar.depo) return hal;
    if(ornekMi()) return durumYaz('ornek', 'Örnek profil eşitlenmez.');
    const o = oturum(), base = sunucuAdresi(), a = alan();
    if(!o) return durumYaz(sunucu || ortam.yerelUygulama() ? 'giris' : 'yok', '');
    if(base === null) return durumYaz('adres', 'Bilgisayarın adresi bilinmiyor; yeniden giriş yap.');
    if(!a) return hal;
    const bagli = sahip(a);
    if(bagli && bagli.toLocaleLowerCase('tr-TR') !== o.a.toLocaleLowerCase('tr-TR')){
      return durumYaz('baska', 'Bu cihazdaki ' + (MODUL_AD[ayar.modul] || '') + ' verisi «' + bagli
        + '» hesabına bağlı; «' + o.a + '» ile eşitlenmez.');
    }
    durumYaz('esitleniyor', '');
    let uygulanan = 0, giden = 0;
    try{
      let im = ortam.depo.oku(anahtar('imlec', a));
      if(!bagli || !im || typeof im !== 'object'){
        /* İlk bağlanış (söz 3): bütün yerel yollar «ilk» olarak gider. */
        im = { son:0, ilk:false, kalan:Object.keys(ayar.depo.hepsi()) };
        ortam.depo.yaz(anahtar('sahip', a), o.a);
        ortam.depo.yaz(anahtar('imlec', a), im);
      }
      for(let tur = 0; tur < 500; tur++){
        const hepsi = ayar.depo.hepsi();
        const aday = !im.ilk
          ? (im.kalan || []).filter(y => hepsi[y] !== undefined).map(y => ({ y, d:hepsi[y], z:1, ilk:true }))
          : Object.entries(siraOku(a)).map(([y, z]) => ({ y, d:hepsi[y] === undefined ? null : hepsi[y], z:Number(z) || 1 }));
        const parti = partile(aday);
        giden += parti.length;
        const c = await istek(base, '/api/hesap/esitle', { alan:a, cihaz:cihazKimligi(), cihaz_ad:cihazAdi(),
          son:im.son || 0, gonder:parti }, o.j, ZAMAN_ASIMI);
        /* Uzaktan gelenler; sırada daha yeni değişikliği olan yol atlanır
           (söz 7), bu cihazdakiyle aynı olan yazılmaz (söz 10). */
        const sira = siraOku(a), yaz = [], yerel = (c.al || []).length ? ayar.depo.hepsi() : {};
        (c.al || []).forEach(r => {
          if(!r || typeof r.y !== 'string') return;
          if(sira[r.y] != null && Number(sira[r.y]) > Number(r.z)) return;
          const d = r.d === undefined ? null : r.d;
          if(esit(yerel[r.y] === undefined ? null : yerel[r.y], d)) return;
          yaz.push([r.y, d]);
        });
        if(yaz.length){ ayar.depo.uzaktan(yaz); uygulanan += yaz.length; }
        /* Gönderilen, gönderimden sonra yeniden değişmediyse sıradan düşer. */
        if(im.ilk){
          const s2 = siraOku(a);
          parti.forEach(g => { if(Number(s2[g.y]) === g.z) delete s2[g.y]; });
          siraYaz(a, s2);
        }else{
          const giden = new Set(parti.map(g => g.y));
          im.kalan = (im.kalan || []).filter(y => !giden.has(y) && hepsi[y] !== undefined);
          if(!im.kalan.length){ im.ilk = true; delete im.kalan; }
        }
        if(typeof c.son === 'number') im.son = c.son;
        ortam.depo.yaz(anahtar('imlec', a), im);
        const kalan = im.ilk ? Object.keys(siraOku(a)).length : im.kalan.length;
        if(!c.daha && (!kalan || !parti.length)) break;
      }
      ortam.depo.yaz(anahtar('son', a), ortam.simdi());
      if(giden || uygulanan){
        onayBitis = ortam.simdi() + ONAY_MS;
        ortam.zamanla(() => { onayBitis = 0; dugmeTazele(); }, ONAY_MS);
      }
      durumYaz('tamam', '');
    }catch(e){
      if(e.kod === 401){
        cerezSil(CEREZ);
        durumYaz('giris', 'Oturum kapandı; yeniden giriş yap. Bu cihazdaki değişiklikler sırada bekliyor.');
      }else if(!e.kod){
        durumYaz('cevrimdisi', '');
      }else{
        durumYaz('hata', e.message);
      }
    }finally{
      if(uygulanan) yenileIste();
    }
    return hal;
  }

  /* Uzaktan gelen kayıtlar uygulamanın belleğine (model) ancak yeniden
     yüklemeyle girer, ekrana ancak yeniden çizimle (söz 9).

     DOKUNULAN ALAN. Kullanıcının yazdığı (input/change olayı gelen) ve
     değeri çizildiği değerden (defaultValue) farklı olan görünür alan
     «kaydedilmemiş yazı»dır: yeniden çizim onu siler. Programın kendi
     koyduğu değer olay üretmez, sayılmaz. Kaydedince form yeniden
     çizilir, yeni alan temizdir. */
  const dokunulan = typeof WeakSet === 'function' ? new WeakSet() : null;
  function kirliMi(el){
    if(!dokunulan || !dokunulan.has(el) || el.disabled || el.readOnly) return false;
    if(el.tagName === 'SELECT'){
      const o = el.options;
      if(el.multiple || el.size > 1){
        for(let i = 0; i < o.length; i++) if(o[i].selected !== o[i].defaultSelected) return true;
        return false;
      }
      let v = -1;
      for(let i = 0; i < o.length; i++) if(o[i].defaultSelected) v = i;
      if(v < 0) for(let i = 0; i < o.length; i++) if(!o[i].disabled){ v = i; break; }
      return el.selectedIndex !== v;
    }
    const t = String(el.type || '').toLowerCase();
    if(t === 'checkbox' || t === 'radio') return el.checked !== el.defaultChecked;
    if(/^(hidden|button|submit|reset|image|file)$/.test(t)) return false;
    return el.value !== el.defaultValue;
  }

  /* Neden beklenir? 'kagit': açık bir kağıt (ya da modülün kendi işi) —
     model de ekran da bekler, kağıdın elindeki kayıt tazelenen modelden
     kopmasın. 'yazi': kullanıcı yazıyor ya da yazıp henüz kaydetmedi —
     model hemen tazelenir, ekran bekler. null: beklenmez. */
  function mesgulNeden(){
    if(ayar && typeof ayar.mesgul === 'function'){
      try{ if(ayar.mesgul()) return 'kagit'; }catch(e){ /* sorulamadı */ }
    }
    if(typeof document === 'undefined') return null;
    /* Kesilebilir kağıt (kurulum sihirbazı): profil sunucudan gelince
       yenilenir ve sihirbaz kendiliğinden kapanır; beklemek, girişten sonra
       zaten dolu bir profilin boş formunu göstermek olurdu. */
    let kesilir = false;
    try{ kesilir = !!(ayar && typeof ayar.kesilebilir === 'function' && ayar.kesilebilir()); }catch(e){ kesilir = false; }
    const k = document.querySelector('#sheet .sheet');
    if(k && k.getClientRects().length && !kesilir) return 'kagit';
    const sayilir = el => !(el.closest && (el.closest('[data-hesap-panel]') || (kesilir && el.closest('#sheet'))));
    const a = document.activeElement;
    if(a && a !== document.body && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) && sayilir(a)) return 'yazi';
    const alanlar = document.querySelectorAll('input, textarea, select');
    for(let i = 0; i < alanlar.length; i++){
      const el = alanlar[i];
      if(kirliMi(el) && sayilir(el) && el.getClientRects().length) return 'yazi';
    }
    return null;
  }
  function yenileIste(){
    if(!ayar) return;
    if(typeof ayar.yukle === 'function') modelBekliyor = true;
    if(typeof ayar.yenile === 'function') ekranBekliyor = true;
    yenileDene();
  }
  function yenileDene(){
    if(yenileId != null){ ortam.iptal(yenileId); yenileId = null; }
    const o = ayar;
    if(!o) return;
    const neden = mesgulNeden();
    if(modelBekliyor && neden !== 'kagit'){
      modelBekliyor = false;
      tazeleme = Promise.resolve(tazeleme).then(() => o.yukle())
        .catch(e => console.error('Hesap: model tazelenemedi', e));
    }
    if(ekranBekliyor && !modelBekliyor && !neden){
      ekranBekliyor = false;
      Promise.resolve(tazeleme).then(() => o.yenile())
        .catch(e => console.error('Hesap: yeniden yükleme', e));
    }
    if(modelBekliyor || ekranBekliyor) yenileId = ortam.zamanla(() => { yenileId = null; yenileDene(); }, 1500);
  }

  /* ------------------------------------------------------- hesap işleri */

  function oturumYaz(v, base){
    if(!v || !v.jeton || !v.kullanici) throw new Error('Sunucunun cevabı okunamadı.');
    cerezYaz(CEREZ, { j:v.jeton, a:v.kullanici.ad, r:v.kullanici.rol, s:base || '' });
    if(ortam.yerelUygulama() && base) cerezYaz(SUNUCU, base);
    kapiKapat();
  }

  function hedefAdres(adres){
    if(adres != null && String(adres).trim()){
      const d = adresDuzelt(adres);
      if(!d) throw new Error('Bilgisayarın adresi okunamadı (örnek: 192.168.0.10).');
      return d;
    }
    const b = sunucuAdresi();
    if(b === null) throw new Error('Bilgisayarın adresini yaz (örnek: 192.168.0.10).');
    return b;
  }

  async function girisYap(ad, parola, adres){
    const base = hedefAdres(adres);
    const v = await istek(base, '/api/hesap/giris', { ad, parola, cihaz:cihazKimligi(), cihaz_ad:cihazAdi() }, null, 30000);
    oturumYaz(v, base);
    sunucu = sunucu || { kurulum:false };
    esitle();
    return v.kullanici;
  }

  /* Kendi kendine hesap: ad, şifre ve kullanıcının KENDİ yazdığı kurtarma
     sorusuyla cevabı. İlk hesap yalnız bilgisayarın kendisinde açılır ve
     admin olur (sunucu sözü 5). */
  async function kayitOl(ad, sifre, soru, cevap, adres){
    const base = hedefAdres(adres);
    const v = await istek(base, '/api/hesap/kayit', { ad, parola:sifre, soru, cevap,
      cihaz:cihazKimligi(), cihaz_ad:cihazAdi() }, null, 30000);
    oturumYaz(v, base);
    sunucu = Object.assign({}, sunucu, { kurulum:false });
    esitle();
    return v.kullanici;
  }

  /* Şifremi unuttum: önce kullanıcının kendi sorusu, sonra cevapla yeni
     şifre (sunucu sözü 7). Doğru cevap oturumu da açar. */
  async function soruGetir(ad, adres){
    const v = await istek(hedefAdres(adres), '/api/hesap/soru', { ad }, null, 15000);
    return v.soru;
  }
  async function kurtar(ad, cevap, yeni, adres){
    const base = hedefAdres(adres);
    const v = await istek(base, '/api/hesap/kurtar', { ad, cevap, yeni,
      cihaz:cihazKimligi(), cihaz_ad:cihazAdi() }, null, 30000);
    oturumYaz(v, base);
    esitle();
    return v.kullanici;
  }

  async function cikisYap(){
    const o = oturum(), base = sunucuAdresi();
    cerezSil(CEREZ);
    if(o && base !== null){
      try{ await istek(base, '/api/hesap/cikis', {}, o.j, 6000); }catch(e){ /* jeton zaten silindi */ }
    }
    durumYaz('giris', '');
  }

  async function parolaDegistir(eski, yeni){
    const o = oturum(), base = sunucuAdresi();
    if(!o || base === null) throw new Error('Önce giriş yap.');
    return istek(base, '/api/hesap/parola', { eski, yeni }, o.j, 30000);
  }

  async function soruAyarla(sifre, soru, cevap){
    const o = oturum(), base = sunucuAdresi();
    if(!o || base === null) throw new Error('Önce giriş yap.');
    return istek(base, '/api/hesap/soru-ayarla', { parola:sifre, soru, cevap }, o.j, 30000);
  }

  /* BETA GİRİŞİ (depo sahibi, 2026-10-04: «şimdilik beta girişi diye bir
     buton olsun ama istersek kullanıcı şeklinde de girebilelim»): hesapsız,
     kayıtlar yalnız bu cihazda. Oturumluk çerez: uygulama kapanınca giriş
     ekranı yine gelir. Sonra kaldırılacak. */
  function betaMi(){ return cerezOku(BETA) === 1; }
  function betaGir(){
    cerezYaz(BETA, 1, true);
    kapiKapat();
    durumYaz(hal.durum, hal.mesaj);
  }

  /* ------------------------------------------------------- durum */

  function saatMetni(ms){
    if(!ms) return '';
    const d = new Date(ms);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function durumMetni(){
    const n = bekleyen(), sira = n ? n + ' değişiklik sırada' : '';
    switch(hal.durum){
      case 'tamam': {
        const s = saatMetni(ortam.depo.oku(anahtar('son', alan())));
        return 'Eşitlendi' + (s ? ' · ' + s : '') + (n ? ' · ' + sira : '');
      }
      case 'esitleniyor': return 'Eşitleniyor…';
      case 'cevrimdisi': return 'Bilgisayara ulaşılamıyor' + (n ? ' · ' + sira + '; bağlanınca gider' : ' · bağlanınca eşitlenir');
      case 'giris': return hal.mesaj || ('Giriş yapılmadı' + (n ? ' · ' + sira : ''));
      case 'adres': case 'baska': case 'hata': case 'ornek': return hal.mesaj;
      case 'yok': return 'Bu sayfa LifeOS sunucusundan açılmadı; hesap kullanılamıyor.';
      default: return '';
    }
  }

  function gizliMi(){
    if(ortam.yerelUygulama() || oturum() || bekleyen()) return false;
    return hal.durum === 'yok' || hal.durum === 'bilinmiyor';
  }

  /* kabuk.js düğmeyi çizerken sorar. */
  function dugme(){
    const o = oturum();
    const sinif = ' is-' + (hal.durum === 'tamam' && bekleyen() ? 'bekliyor' : hal.durum)
      + (onayBitis > ortam.simdi() ? ' is-esitlendi' : '');
    const metin = durumMetni();
    return {
      sinif, gizli:gizliMi(),
      etiket:'Hesap ve eşitleme' + (o ? ' — ' + o.a : '') + (metin ? ': ' + metin : ''),
      ipucu:o ? o.a + (metin ? ' · ' + metin : '') : 'Hesap: giriş yapılmadı',
    };
  }

  function durum(){
    const o = oturum();
    return { durum:hal.durum, mesaj:hal.mesaj, metin:durumMetni(), bekleyen:bekleyen(),
      oturum:o ? { ad:o.a, rol:o.r, sunucu:o.s || '' } : null, sunucu };
  }

  /* «Bütün veriyi sil» kapısının notu: bağlı alanda silme sunucuya ve
     öteki cihazlara da gider (store.js clear → degisti). */
  function silmeNotu(){
    const o = oturum(), a = alan();
    if(!o || !a || !sahip(a)) return null;
    return 'Bu cihaz «' + o.a + '» hesabına bağlı: silme bilgisayardaki kopyaya ve öteki cihazlara da gider.';
  }

  function dinle(fn){
    dinleyiciler.push(fn);
    return () => { const i = dinleyiciler.indexOf(fn); if(i >= 0) dinleyiciler.splice(i, 1); };
  }

  function durumYaz(d, mesaj){
    hal = { durum:d, mesaj:mesaj || '' };
    dugmeTazele();
    const el = typeof document !== 'undefined' && document.getElementById('hesap-durum');
    if(el){
      el.textContent = durumMetni();
      el.className = 'hesap__durum is-' + hal.durum;
    }
    dinleyiciler.slice().forEach(fn => { try{ fn(durum()); }catch(e){ console.error('Hesap dinleyicisi:', e); } });
    return hal;
  }

  function dugmeTazele(){
    if(typeof document === 'undefined') return;
    const d = dugme();
    document.querySelectorAll('.ust__hesap').forEach(b => {
      b.className = b.className.replace(/\s?is-[a-z]+/g, '') + d.sinif;
      b.hidden = d.gizli;
      b.setAttribute('aria-label', d.etiket);
      b.setAttribute('title', d.ipucu);
    });
  }

  /* ------------------------------------------------------- ortak parçalar */

  function alanHtml(id, etiket, tur, ek){
    return '<label class="hesap__alan" for="' + id + '"><span>' + kac(etiket) + '</span>'
      + '<input id="' + id + '" type="' + (tur || 'text') + '" ' + (ek || '') + '/></label>';
  }
  const AD_EK = 'autocapitalize="none" autocorrect="off" spellcheck="false" required minlength="2" maxlength="32"';
  const CEVAP_EK = 'required minlength="2" maxlength="120" autocomplete="off" autocapitalize="none" spellcheck="false"';

  /* Bilgisayarın kendisinde: telefon ve tablette yazılacak adres. Ev ağı
     kapalıysa (sertifika yok) nasıl açılacağı söylenir. */
  function adresNotu(){
    if(ortam.yerelUygulama() || !sunucu || !sunucu.yerel) return '';
    const l = Array.isArray(sunucu.ev_agi) ? sunucu.ev_agi : [];
    if(l.length){
      return '<p class="hesap__not">Telefonda ve tablette bilgisayarın adresi: <b>' + l.map(kac).join('</b> ya da <b>')
        + '</b>. Tablette tarayıcıda <b>https://' + kac(l[0]) + ':' + TELEFON_KAPI + '</b> açılır.</p>';
    }
    return '<p class="hesap__not">Telefon ve tablet için ev ağı kapalı. Bilgisayarda bir kez '
      + '<code>python sistem/telefon.py</code> çalıştırıp LifeOS\'u yeniden başlat.</p>';
  }

  function adresAlani(){
    if(!ortam.yerelUygulama()) return '';
    const adres = cerezOku(SUNUCU) || '';
    return alanHtml('hesap-adres', 'Bilgisayarın adresi', 'text',
      'inputmode="url" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="192.168.0.10" value="'
      + kac(String(adres).replace(/^https:\/\//, '').replace(':' + TELEFON_KAPI, '')) + '"');
  }

  function baglantiHatasi(){
    return ortam.yerelUygulama()
      ? 'Bilgisayara ulaşılamadı. Aynı Wi-Fi\'da mısınız, LifeOS açık mı, adres doğru mu? '
        + 'iPhone\'da LifeOS kök sertifikası kurulu ve «tam güven» açık olmalı.'
      : 'Bilgisayara ulaşılamadı; LifeOS açık mı?';
  }

  function mesajYaz(m){
    const el = typeof document !== 'undefined' && document.getElementById('hesap-mesaj');
    if(!el) return;
    el.textContent = m || '';
    el.hidden = !m;
  }

  /* ------------------------------------------------------- giriş ekranı

     Açılışta hesap yoksa (ve beta girişi seçilmediyse) uygulamanın önünde
     tek sade kart: Giriş yap · Hesap oluştur · Şifremi unuttum · Beta
     girişi. Sunucu yoksa (geliştirme sunucusu, dosyadan açılmış sayfa)
     hiç çıkmaz; telefon uygulamasında bilgisayarın adresini de sorar.
     Hata olunca kart yeniden çizilmez: yazılan kaybolmaz, yalnız mesaj. */
  let kapi = { gorunum:'giris', soru:null, ad:'', adres:null };

  function kapiGerekli(){
    if(oturum() || betaMi() || ornekMi()) return false;
    return !!sunucu || ortam.yerelUygulama();
  }

  function kapiNotu(){
    if(!sunucu){
      return ortam.yerelUygulama()
        ? 'Telefon ve bilgisayar aynı Wi-Fi\'da olmalı. Adres, bilgisayardaki LifeOS\'ta Hesap panelinde yazar.'
        : 'Bilgisayara ulaşılamıyor. Beta girişiyle bu cihazda devam edebilirsin.';
    }
    if(sunucu.kurulum) return sunucu.yerel ? 'İlk hesap admin olur.' : 'İlk hesap bilgisayarın kendisinde açılır.';
    return '';
  }

  /* LifeOS işareti: dört sistemin rengi (seçim sayfasının sekme simgesiyle aynı). */
  const ISARET = '<svg class="hesap-kapi__isaret" viewBox="0 0 32 32" aria-hidden="true">'
    + '<rect x="3" y="3" width="12" height="12" rx="3" fill="#4F86FF"/><circle cx="23" cy="9" r="6" fill="#2EC4A9"/>'
    + '<rect x="5" y="19" width="9" height="9" rx="2" fill="#F2A93B" transform="rotate(45 9.5 23.5)"/>'
    + '<rect x="17" y="17" width="12" height="12" rx="3" fill="#9A86FF"/></svg>';

  function kapiGovde(){
    const g = kapi.gorunum, not = kapiNotu();
    const mesaj = '<p class="hesap__mesaj" id="hesap-mesaj" role="alert" hidden></p>';
    const sec = g === 'unuttum' ? ''
      : '<div class="seg seg--block hesap-kapi__sec" role="group" aria-label="Giriş ya da kayıt">'
        + [['giris', 'Giriş yap'], ['kayit', 'Hesap oluştur']].map(([x, ad]) =>
          '<button type="button" data-hesap="gorunum" data-gorunum="' + x + '"' + (g === x ? ' class="is-on"' : '')
          + ' aria-pressed="' + (g === x ? 'true' : 'false') + '">' + ad + '</button>').join('') + '</div>';
    const geri = '<button type="button" class="hesap-kapi__bag" data-hesap="gorunum" data-gorunum="giris">Girişe dön</button>';
    let form;
    if(g === 'kayit'){
      form = '<form class="hesap__form" data-hesap-form="kayit" data-ayar-disi>' + adresAlani()
        + alanHtml('hesap-ad', 'Kullanıcı adı', 'text', 'autocomplete="username" ' + AD_EK)
        + alanHtml('hesap-parola', 'Şifre (en az 8)', 'password', 'autocomplete="new-password" required minlength="8"')
        + alanHtml('hesap-parola2', 'Şifre (tekrar)', 'password', 'autocomplete="new-password" required minlength="8"')
        + '<p class="hesap-kapi__ara">Şifreni unutursan</p>'
        + alanHtml('hesap-soru', 'Kendine bir soru', 'text',
          'required minlength="4" maxlength="120" autocomplete="off" placeholder="Örn. İlk öğretmenimin adı?"')
        + alanHtml('hesap-cevap', 'Cevabın', 'text', CEVAP_EK)
        + mesaj + '<button type="submit" class="hesap__ana hesap__ana--tam">Hesap oluştur</button></form>';
    }else if(g === 'unuttum' && !kapi.soru){
      form = '<form class="hesap__form" data-hesap-form="soru" data-ayar-disi>' + adresAlani()
        + alanHtml('hesap-ad', 'Kullanıcı adı', 'text', 'autocomplete="username" ' + AD_EK + ' value="' + kac(kapi.ad) + '"')
        + mesaj + '<button type="submit" class="hesap__ana hesap__ana--tam">Devam</button></form>' + geri;
    }else if(g === 'unuttum'){
      form = '<p class="hesap-kapi__soru">' + kac(kapi.soru) + '</p>'
        + '<form class="hesap__form" data-hesap-form="kurtar" data-ayar-disi>'
        + alanHtml('hesap-cevap', 'Cevabın', 'text', CEVAP_EK)
        + alanHtml('hesap-parola', 'Yeni şifre (en az 8)', 'password', 'autocomplete="new-password" required minlength="8"')
        + alanHtml('hesap-parola2', 'Yeni şifre (tekrar)', 'password', 'autocomplete="new-password" required minlength="8"')
        + mesaj + '<button type="submit" class="hesap__ana hesap__ana--tam">Şifreyi yenile</button></form>' + geri;
    }else{
      form = '<form class="hesap__form" data-hesap-form="giris" data-ayar-disi>' + adresAlani()
        + alanHtml('hesap-ad', 'Kullanıcı adı', 'text', 'autocomplete="username" ' + AD_EK)
        + alanHtml('hesap-parola', 'Şifre', 'password', 'autocomplete="current-password" required')
        + mesaj + '<button type="submit" class="hesap__ana hesap__ana--tam">Giriş yap</button></form>'
        + '<button type="button" class="hesap-kapi__bag" data-hesap="unuttum">Şifremi unuttum</button>';
    }
    const alt = g === 'unuttum' ? (kapi.soru ? 'Kendi sorunu cevapla' : 'Kullanıcı adını yaz')
      : g === 'kayit' ? 'Yeni hesap' : 'Hesabınla devam et';
    return '<div class="hesap-kapi__marka">' + ISARET
      + '<h1 class="hesap-kapi__baslik" id="hesap-kapi-baslik">' + (g === 'unuttum' ? 'Şifreni yenile' : 'LifeOS') + '</h1>'
      + '<p class="hesap-kapi__alt">' + alt + '</p></div>'
      + (not ? '<p class="hesap__not hesap-kapi__not">' + kac(not) + '</p>' : '')
      + sec + form
      + '<button type="button" class="hesap-kapi__beta" data-hesap="beta"><b>Beta girişi</b> · hesapsız, yalnız bu cihazda</button>';
  }

  function kapiAcikMi(){ return !!(typeof document !== 'undefined' && document.querySelector('[data-hesap-kapi]')); }
  function kapiTazele(){
    const kart = typeof document !== 'undefined' && document.querySelector('[data-hesap-kapi] .hesap-kapi__kart');
    if(!kart) return;
    kart.innerHTML = kapiGovde();
    const ilk = kart.querySelector('input');
    if(ilk && !(L.KABUK && L.KABUK.telefonMu && L.KABUK.telefonMu())){ try{ ilk.focus({ preventScroll:true }); }catch(e){} }
  }
  function kapiAc(g){
    if(typeof document === 'undefined' || !document.body) return;
    if(L.KABUK && L.KABUK.katmanAcik(PANEL)) L.KABUK.katmanKapat();
    kapi = { gorunum:g || (sunucu && sunucu.kurulum ? 'kayit' : 'giris'), soru:null, ad:'', adres:null };
    if(!kapiAcikMi()){
      const el = document.createElement('div');
      el.className = 'hesap-kapi';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-labelledby', 'hesap-kapi-baslik');
      el.setAttribute('data-hesap-panel', '');
      el.setAttribute('data-hesap-kapi', '');
      el.innerHTML = '<div class="hesap-kapi__kart"></div>';
      document.body.appendChild(el);
      document.documentElement.classList.add('hesap-kapi-acik');
    }
    kapiTazele();
  }
  function kapiKapat(){
    if(typeof document === 'undefined') return;
    const el = document.querySelector('[data-hesap-kapi]');
    if(el) el.remove();
    document.documentElement.classList.remove('hesap-kapi-acik');
  }

  /* ------------------------------------------------------- panel */

  function panelGovde(){
    const o = oturum();
    const mesaj = '<p class="hesap__mesaj" id="hesap-mesaj" role="alert"' + (panelMesaj ? '>' + kac(panelMesaj) : ' hidden>') + '</p>';
    const durumSatiri = '<p class="hesap__durum is-' + kac(hal.durum) + '" id="hesap-durum" role="status" aria-live="polite">'
      + kac(durumMetni()) + '</p>';
    if(!o){
      return durumSatiri
        + (betaMi() ? '<p class="hesap__not">Beta girişindesin: kayıtlar yalnız bu cihazda.</p>' : '')
        + '<p class="hesap__not">Hesap, bilgisayardaki LifeOS üzerinden çalışır. Bu sayfayı LifeOS uygulamasından '
        + '(ya da ev ağındaki https adresinden) aç.</p>';
    }
    return '<div class="hesap__kim"><b>' + kac(o.a) + '</b><span class="hesap__rol">' + (o.r === 'admin' ? 'admin' : 'üye') + '</span></div>'
      + durumSatiri + mesaj
      + '<div class="hesap__eylem">'
      +   '<button type="button" class="hesap__ana" data-hesap="esitle">Şimdi eşitle</button>'
      +   '<button type="button" class="hesap__ikinci" data-hesap="cikis">Çıkış yap</button>'
      + '</div>'
      + '<details class="hesap__ek"><summary>Şifreyi değiştir</summary>'
      +   '<form class="hesap__form" data-hesap-form="parola" data-ayar-disi>'
      +     alanHtml('hesap-eski', 'Şimdiki şifre', 'password', 'autocomplete="current-password" required')
      +     alanHtml('hesap-yeni', 'Yeni şifre (en az 8)', 'password', 'autocomplete="new-password" required minlength="8"')
      +     '<button type="submit" class="hesap__ikinci">Değiştir</button>'
      +   '</form></details>'
      + '<details class="hesap__ek"><summary>Kurtarma sorusu</summary>'
      +   '<form class="hesap__form" data-hesap-form="soru-ayarla" data-ayar-disi>'
      +     alanHtml('hesap-yeni-soru', 'Soru (kendin yaz)', 'text', 'required minlength="4" maxlength="120" autocomplete="off"')
      +     alanHtml('hesap-yeni-cevap', 'Cevabın', 'text', CEVAP_EK)
      +     alanHtml('hesap-soru-sifre', 'Şifren', 'password', 'autocomplete="current-password" required')
      +     '<button type="submit" class="hesap__ikinci">Kaydet</button>'
      +   '</form></details>'
      + adresNotu()
      + '<p class="hesap__not">Bu cihaz: ' + kac(cihazAdi()) + '. Kayıtlar bilgisayardaki LifeOS sunucusuyla eşitlenir; '
      +   'fotoğraflar çekildiği cihazda kalır.</p>';
  }

  function panelHtml(){
    return '<div class="katman kmenu kmenu--hesap" role="dialog" aria-label="Hesap ve eşitleme" data-hesap-panel>'
      + '<div class="hesap__bas"><p class="kmenu__bas">Hesap</p>'
      + '<button type="button" class="hesap__kapat" data-katman-kapat aria-label="Hesabı kapat">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'
      + panelGovde() + '</div>';
  }

  const PANEL = 'kabuk-hesap';
  function panelAcik(){ return !!(L.KABUK && L.KABUK.katmanAcik(PANEL)); }
  function panelTazele(){
    if(!panelAcik()) return;
    L.KABUK.katmanTazele(PANEL, panelHtml());
  }
  async function hesapDugmesi(d){
    /* Giriş yoksa ve sunucu varsa düğme doğrudan giriş ekranını açar. */
    if(!oturum()){
      if(!sunucu) await yokla();
      if(sunucu || ortam.yerelUygulama()){ kapiAc(); return; }
    }
    const K = L.KABUK;
    if(!K) return;
    if(K.katmanAcik(PANEL)){ K.katmanKapat(); return; }
    panelMesaj = '';
    K.katmanAc(PANEL, panelHtml(), d);
  }

  function deger(id){ const e = document.getElementById(id); return e ? e.value : ''; }

  async function formIsle(tur, form){
    const kapida = !!(form.closest && form.closest('[data-hesap-kapi]'));
    const dugmeEl = form.querySelector('button[type=submit]');
    if(dugmeEl) dugmeEl.disabled = true;
    const adres = () => (document.getElementById('hesap-adres') ? deger('hesap-adres') : null);
    let mesaj = '', ciz = false;
    try{
      if(tur === 'giris'){
        await girisYap(deger('hesap-ad').trim(), deger('hesap-parola'), adres());
        kapiKapat();
      }else if(tur === 'kayit'){
        if(deger('hesap-parola') !== deger('hesap-parola2')) throw new Error('İki şifre aynı değil.');
        await kayitOl(deger('hesap-ad').trim(), deger('hesap-parola'), deger('hesap-soru'), deger('hesap-cevap'), adres());
        kapiKapat();
      }else if(tur === 'soru'){
        kapi.ad = deger('hesap-ad').trim();
        kapi.adres = adres();
        kapi.soru = await soruGetir(kapi.ad, kapi.adres);
        ciz = true;
      }else if(tur === 'kurtar'){
        if(deger('hesap-parola') !== deger('hesap-parola2')) throw new Error('İki şifre aynı değil.');
        await kurtar(kapi.ad, deger('hesap-cevap'), deger('hesap-parola'), kapi.adres);
        kapiKapat();
      }else if(tur === 'parola'){
        await parolaDegistir(deger('hesap-eski'), deger('hesap-yeni'));
        mesaj = 'Şifre değişti. Öteki cihazlarda yeniden giriş gerekir.';
      }else if(tur === 'soru-ayarla'){
        await soruAyarla(deger('hesap-soru-sifre'), deger('hesap-yeni-soru'), deger('hesap-yeni-cevap'));
        mesaj = 'Kurtarma sorusu kaydedildi.';
      }
    }catch(e){
      mesaj = e && e.kod === 0 ? baglantiHatasi() : (e && e.message) || 'İşlem yapılamadı.';
    }finally{
      if(dugmeEl) dugmeEl.disabled = false;
    }
    if(kapida){
      if(ciz && kapiAcikMi()) kapiTazele();
      else mesajYaz(mesaj);
    }else{
      panelMesaj = mesaj;
      panelTazele();
    }
  }

  let bagli = false;
  function bagla(){
    if(bagli || typeof document === 'undefined') return;
    bagli = true;
    /* Dokunulan alan (söz 9): yalnız kullanıcının yazdığı sayılır. */
    const dokun = e => {
      const t = e.target;
      if(dokunulan && t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) dokunulan.add(t);
    };
    document.addEventListener('input', dokun, true);
    document.addEventListener('change', dokun, true);
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      const d = t.closest('.ust__hesap');
      if(d){ e.preventDefault(); hesapDugmesi(d); return; }
      const is = t.closest('[data-hesap-panel] [data-hesap]');
      if(!is) return;
      const ad = is.getAttribute('data-hesap');
      if(ad === 'esitle'){ panelMesaj = ''; esitle().then(panelTazele); }
      else if(ad === 'cikis'){
        panelMesaj = '';
        cikisYap().then(() => {
          if(L.KABUK) L.KABUK.katmanKapat();
          if(kapiGerekli()) kapiAc('giris');
        });
      }
      else if(ad === 'beta') betaGir();
      else if(ad === 'unuttum'){ kapi = { gorunum:'unuttum', soru:null, ad:deger('hesap-ad').trim(), adres:null }; kapiTazele(); }
      else if(ad === 'gorunum'){ kapi = { gorunum:is.getAttribute('data-gorunum'), soru:null, ad:'', adres:null }; kapiTazele(); }
    });
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-hesap-form]') : null;
      if(!f) return;
      e.preventDefault();
      formIsle(f.getAttribute('data-hesap-form'), f);
    });
    window.addEventListener('online', () => esitle());
    document.addEventListener('visibilitychange', () => {
      if(document.visibilityState !== 'visible') return;
      const s = ortam.simdi();
      if(s - sonGorunur < 10000) return;
      sonGorunur = s;
      esitle();
    });
  }

  /* Modülün tek çağrısı (app.js, model yüklendikten sonra). */
  function kur(o){
    ayar = Object.assign({ modul:'spi' }, o || {});
    if(ayar.depo) ayar.depo.onDegisim = degisti;
    bagla();
    if(ornekMi()){ durumYaz('ornek', 'Örnek profil eşitlenmez.'); return; }
    durumYaz('bilinmiyor', '');
    yokla().then(() => {
      if(kapiGerekli()) kapiAc();
      return esitle();
    }).catch(e => console.error('Hesap:', e));
    if(araId == null && typeof setInterval === 'function'){
      araId = setInterval(() => {
        if(typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        esitle();
      }, ARALIK);
    }
  }

  /* Testler için: bellekteki hâli bırakır. */
  function _sifirla(){
    if(erteleId != null) ortam.iptal(erteleId);
    if(yenileId != null) ortam.iptal(yenileId);
    erteleId = null; yenileId = null;
    ayar = null; hal = { durum:'bilinmiyor', mesaj:'' }; sunucu = null;
    aktif = null; siradaki = null; panelMesaj = ''; onayBitis = 0;
    modelBekliyor = false; ekranBekliyor = false; tazeleme = null;
    kapi = { gorunum:'giris', soru:null, ad:'', adres:null };
    kapiKapat();
  }

  /* Modül seçim sayfası (sistem/sunucu.py giris_html, telefonda da): giriş
     bir kez orada yapılır; çerez kapıya bakmadığı için üç modül girişli açılır. */
  try{
    const b = typeof document !== 'undefined' && document.currentScript;
    if(b && b.hasAttribute('data-giris')) kur({ modul:'giris' });
  }catch(e){ /* sayfa dışında (test) */ }

  return {
    kur, esitle, yokla, degisti, girisYap, kayitOl, soruGetir, kurtar, cikisYap, parolaDegistir, soruAyarla,
    betaGir, kapiAc, kapiAcikMi, dugme, durum, dinle, silmeNotu, panelHtml, adresDuzelt, cihazKimligi,
    _ortam:ortam, _sifirla, _istek:istek,
    CEREZ, ONEK,
  };
})();
