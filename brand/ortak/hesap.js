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
      cihazın az önce gelen değişikliğini eziyordu. Aynı denetim arka
      plan yoklamalarına da açıktır (cizIste): King'in teklifleri ve
      haftalık özet veriyi hemen koyar, ekranı yazı bitince çizer.
  10. AYNI DEĞER EKRANI YENİLEMEZ. Uzaktan gelen kayıt bu cihazdakiyle
      aynıysa yazılmaz, ekran yenilenmez: değişmemiş bir kaydı yeniden
      yazan bir cihaz öteki cihazları durmadan yenilemesin.
  11. ÖNCE ANA MENÜ (depo sahibi, 2026-10-05: «giriş kısmında ilk ana
      menü gelsin»). Giriş ekranı formla değil karşılamayla açılır: bu
      cihazda girilmiş hesaplar, «Giriş yap», «Hesap oluştur», beta.
      Hatırlanan hesap yalnız ad, görünen ad ve renktir (çerez); şifre
      ve jeton hatırlanmaz. «×» onu bu cihazdan unutur.
  12. HESAP SAYFASI (aynı gün: «çok daha ayarlı; ücretli sürümler,
      kişisel hesap ayarları»). Profil, plan, cihazlar, güvenlik,
      eşitleme ve (admin) yönetim tek sayfada, iOS Ayarlar gibi
      gruplu. Plan yalnız görünürlüktür (sunucu sözü 8): hiçbir şey
      plana bakmaz. Sayfa sunucuya ulaşamazsa son bilineni gösterir,
      modülü bekletmez.
  13. SİLİNEN HESAP CİHAZI KİLİTLEMEZ (ikinci tur: etkinlik, özet, verin,
      kişisel bilgiler). Bir alan, bağlandığı hesabın adıyla birlikte
      rastgele KİMLİĞİNİ de saklar. Aynı adla girilip kimlik farklıysa
      eski hesap silinip yeniden açılmıştır (adlar tekildir); başka adla
      girilince sunucuya «o kimlik hâlâ var mı» diye sorulur. Eski hesap
      yoksa bağ çözülür ve cihazdaki veri yeni hesaba İLK EŞİTLEMEYLE
      gider (söz 3: sunucudakini ezmez). Eski hesap varsa söz 5 geçerli.
  14. KİŞİSEL BİLGİ YALNIZ OKUNDUĞU YERDE. Hitap ve doğum günü King'in
      selamına girer; başka hiçbir hesaba, plana, karara girmez. Sunucu
      cevabı gelmeden kişisel alanlar formda çizilmez: boş form
      kaydedilip var olan bilgi silinmesin. */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.HESAP = (function(){
  'use strict';

  const L = window.LIFEOS;
  const CEREZ = 'lifeos_hesap';
  const CIHAZ = 'lifeos_cihaz';
  const SUNUCU = 'lifeos_sunucu';
  const BETA = 'lifeos_beta';
  const HESAPLAR = 'lifeos_hesaplar';    // bu cihazda girilmiş hesaplar (söz 11)
  const HATIRLA_EN_COK = 4;
  const ONEK = 'lifeos.hesap.';
  const ARALIK = 60000;              // açıkken dakikada bir
  const ERTELE = 2500;               // yazmadan sonra toplu gönderim
  const ZAMAN_ASIMI = 60000;         // ilk eşitleme birkaç MB olabilir
  const DURUM_ZAMAN_ASIMI = 6000;
  const PARTI_KAYIT = 400;
  const PARTI_BAYT = 1500000;
  const TELEFON_KAPI = 5183;         // ev ağı https kapısı (sistem/telefon.py)
  const MODUL_AD = { ays:'AYS', spi:'SPİ', esp:'ESP' };
  /* Profil renkleri: kimlikler sunucudaki RENKLER ile aynı. Beyaz harf
     her birinde 4,5:1'in üstünde (küçük monogramda da okunur). */
  const RENK = { mavi:'#2D5BE3', turkuaz:'#0B7A69', turuncu:'#A85F12', mor:'#7453D4',
    pembe:'#C2457A', yesil:'#277A50', grafit:'#4A4F57' };
  const RENK_AD = { mavi:'Mavi', turkuaz:'Turkuaz', turuncu:'Turuncu', mor:'Mor', pembe:'Pembe',
    yesil:'Yeşil', grafit:'Grafit' };

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
    /* Dosya ver: uygulamada paylaşım sayfası (indirme yok), tarayıcıda indirme. */
    indir:(ad, metin) => {
      const blob = new Blob([metin], { type:'application/json' });
      try{
        if(window.LIFEOS_YEREL && navigator.canShare && typeof File === 'function'){
          const f = new File([blob], ad, { type:'application/json' });
          if(navigator.canShare({ files:[f] })) return navigator.share({ files:[f] });
        }
      }catch(e){ /* paylaşılamadı: indirmeye düş */ }
      const u = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = u; a.download = ad; a.hidden = true;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 5000);
    },
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
  const adEsit = (x, y) => String(x).toLocaleLowerCase('tr-TR') === String(y).toLocaleLowerCase('tr-TR');
  /* Bağı çözer (söz 13): bir sonraki girişte alan İLK EŞİTLEMEYLE bağlanır;
     cihazdaki kayıtlar yerinde kalır, hepsi yeni hesaba gider. */
  function baglantiCoz(a){
    ['sahip', 'imlec', 'hesap', 'sira', 'son'].forEach(t => ortam.depo.sil(anahtar(t, a)));
  }

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
  let aktif = null, siradaki = null, profilTazelendi = false;
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
    let o = oturum();
    const base = sunucuAdresi(), a = alan();
    if(!o) return durumYaz(sunucu || ortam.yerelUygulama() ? 'giris' : 'yok', '');
    if(!o.h && !profilTazelendi && base !== null){
      profilTazelendi = true;                       // kimliksiz eski çerez: bir kez tazelenir
      try{ await ben(); }catch(e){ /* tur kendi hatasını görür */ }
      o = oturum() || o;
    }
    if(base === null) return durumYaz('adres', 'Bilgisayarın adresi bilinmiyor; yeniden giriş yap.');
    if(!a) return hal;
    let bagli = sahip(a);
    const hk = ortam.depo.oku(anahtar('hesap', a));
    if(bagli && o.h && typeof hk === 'string' && hk && hk !== o.h){
      /* Bağlı hesap silinmiş mi? (söz 13) Aynı ad + başka kimlik: evet. */
      let gitti = adEsit(bagli, o.a);
      if(!gitti){
        try{ gitti = (await istek(base, '/api/hesap/yasiyor', { kimlik:hk }, o.j, DURUM_ZAMAN_ASIMI)).var === false; }
        catch(e){ gitti = false; }
      }
      if(gitti){ baglantiCoz(a); bagli = null; }
    }
    if(bagli && !adEsit(bagli, o.a)){
      return durumYaz('baska', 'Bu cihazdaki ' + (MODUL_AD[ayar.modul] || '') + ' verisi «' + bagli
        + '» hesabına bağlı; «' + o.a + '» ile eşitlenmez.');
    }
    if(bagli && o.h && typeof hk !== 'string') ortam.depo.yaz(anahtar('hesap', a), o.h);   // eski bağa kimlik
    durumYaz('esitleniyor', '');
    let uygulanan = 0, giden = 0;
    try{
      let im = ortam.depo.oku(anahtar('imlec', a));
      if(!bagli || !im || typeof im !== 'object'){
        /* İlk bağlanış (söz 3): bütün yerel yollar «ilk» olarak gider. */
        im = { son:0, ilk:false, kalan:Object.keys(ayar.depo.hepsi()) };
        ortam.depo.yaz(anahtar('sahip', a), o.a);
        if(o.h) ortam.depo.yaz(anahtar('hesap', a), o.h);
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
  /* Dinleyici dosya yüklenince kurulur, kur()'u beklemez: çizim isteyen
     öteki tazeleyiciler (cizIste) de aynı bilgiye bakar. */
  if(dokunulan && typeof document !== 'undefined' && document.addEventListener){
    const dokun = e => {
      const t = e.target;
      if(t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) dokunulan.add(t);
    };
    document.addEventListener('input', dokun, true);
    document.addEventListener('change', dokun, true);
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

  /* ÖTEKİ TAZELEYİCİLER DE YAZILANI SİLMEZ (söz 9). King'in teklifleri ve
     haftalık özet gibi arka plan yoklamaları da ekranı baştan çizer:
     veriyi hemen koyar, çizimi buradan ister. Kullanıcı yazmıyorsa hemen
     çizilir; yazıyorsa, yazıp kaydetmediyse ya da kağıt açıksa 1,5 sn'de
     bir yeniden bakılır. Aynı çizim üst üste istenirse bir kez yapılır.
     Denetim eşitlemeninkidir (mesgulNeden); ikinci bir «yazıyor mu?» yok. */
  const cizimler = [];
  let cizimId = null;
  function cizIste(fn){
    if(typeof fn !== 'function') return;
    if(cizimler.indexOf(fn) < 0) cizimler.push(fn);
    cizimDene();
  }
  function cizimDene(){
    if(cizimId != null){ ortam.iptal(cizimId); cizimId = null; }
    if(!cizimler.length) return;
    if(mesgulNeden()){ cizimId = ortam.zamanla(() => { cizimId = null; cizimDene(); }, 1500); return; }
    cizimler.splice(0).forEach(fn => {
      try{ Promise.resolve(fn()).catch(e => console.error('Hesap: çizim', e)); }
      catch(e){ console.error('Hesap: çizim', e); }
    });
  }

  /* ------------------------------------------------------- hesap işleri */

  /* Çerezdeki profil: g görünen ad, k renk, p plan, pa planın adı. Hesap
     düğmesi, kısa panel ve seçim sayfasının çipi sunucuyu beklemeden
     bunu çizer. */
  function profilAlanlari(k, eski){
    eski = eski || {};
    const dg = /^\d{4}-\d{2}-\d{2}$/.test(k.dogum || '') ? k.dogum.slice(5) : '';
    return { a:k.ad, r:k.rol, g:k.gorunen_ad || k.ad, k:RENK[k.renk] ? k.renk : 'mavi',
      p:k.plan || 'ucretsiz', pa:k.plan_ad || '',
      /* kimlik (söz 13), hitap ve doğum günü (AA-GG; King'in selamı, söz 14).
         Alan cevapta yoksa (başkasının satırı) eldeki kalır. */
      h:typeof k.kimlik === 'string' ? k.kimlik : (eski.h || ''),
      t:typeof k.hitap === 'string' ? k.hitap : (eski.t || ''),
      dg:typeof k.dogum === 'string' ? dg : (eski.dg || '') };
  }
  function oturumYaz(v, base){
    if(!v || !v.jeton || !v.kullanici) throw new Error('Sunucunun cevabı okunamadı.');
    cerezYaz(CEREZ, Object.assign({ j:v.jeton, s:base || '' }, profilAlanlari(v.kullanici)));
    if(ortam.yerelUygulama() && base) cerezYaz(SUNUCU, base);
    hatirla(v.kullanici);
    kapiKapat();
    cipTazele();
  }
  /* Sunucudaki profil (başka cihazda değişmiş olabilir) çereze iner. */
  function profilYaz(k){
    const o = oturum();
    if(!o || !k || typeof k.ad !== 'string') return;
    if(k.ad.toLocaleLowerCase('tr-TR') !== o.a.toLocaleLowerCase('tr-TR')) return;
    const y = profilAlanlari(k, o);
    if(['a', 'r', 'g', 'k', 'p', 'pa', 'h', 't', 'dg'].some(x => y[x] !== o[x])) cerezYaz(CEREZ, Object.assign({}, o, y));
    hatirla(k);
    dugmeTazele();
    cipTazele();
  }

  /* BU CİHAZDAKİ HESAPLAR (söz 11): karşılamada tek dokunuşla seçilir. */
  function hatirlananlar(){
    const l = cerezOku(HESAPLAR);
    return Array.isArray(l) ? l.filter(x => x && typeof x.a === 'string' && x.a).slice(0, HATIRLA_EN_COK) : [];
  }
  function hatirla(k){
    if(!k || typeof k.ad !== 'string' || !k.ad) return;
    const ad = k.ad.toLocaleLowerCase('tr-TR');
    const l = hatirlananlar().filter(x => x.a.toLocaleLowerCase('tr-TR') !== ad);
    l.unshift({ a:k.ad, g:k.gorunen_ad || k.ad, k:RENK[k.renk] ? k.renk : 'mavi' });
    cerezYaz(HESAPLAR, l.slice(0, HATIRLA_EN_COK));
  }
  function unut(ad){
    const l = hatirlananlar().filter(x => x.a !== ad);
    if(l.length) cerezYaz(HESAPLAR, l); else cerezSil(HESAPLAR);
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
      oturum:o ? { ad:o.a, rol:o.r, sunucu:o.s || '', gorunen_ad:o.g || o.a, renk:o.k || 'mavi',
        plan:o.p || 'ucretsiz', hitap:o.t || '', dogum_gun:o.dg || '' } : null, sunucu };
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
    cipTazele();
    const el = typeof document !== 'undefined' && document.getElementById('hesap-durum');
    if(el){
      el.textContent = durumMetni();
      el.className = 'hesap__durum is-' + hal.durum;
    }
    const kisa = typeof document !== 'undefined' && document.getElementById('hesap-esit-kisa');
    if(kisa) kisa.textContent = esitKisa();
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

  /* Çizgi simgeler (tek renk, metnin renginde; sade görsel kararı). */
  const IKON = {
    profil:'<circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5"/>',
    plan:'<path d="M12 3.8l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.2l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/>',
    cihazlar:'<rect x="3" y="5" width="13" height="10" rx="1.8"/><path d="M7 19h5"/><rect x="17.5" y="9" width="4" height="10" rx="1.2"/>',
    guvenlik:'<rect x="5" y="10.5" width="14" height="9.5" rx="2.2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    anahtar:'<circle cx="8" cy="15" r="3.5"/><path d="M10.6 12.4 19 4M15.5 7.5l2.5 2.5"/>',
    soru:'<circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.6a2.4 2.4 0 0 1 4.6.9c0 1.6-2.3 2-2.3 3.5"/><path d="M12 16.9v.1"/>',
    esitleme:'<path d="M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 9.5a4.5 4.5 0 0 0 0 9z"/>',
    yonetim:'<circle cx="9" cy="9" r="3"/><path d="M3.5 19c.9-2.8 2.9-4.3 5.5-4.3s4.6 1.5 5.5 4.3"/><circle cx="17" cy="9.5" r="2.4"/><path d="M16 14.8c2.2 0 3.8 1.3 4.5 3.7"/>',
    ekle:'<circle cx="12" cy="12" r="8.5"/><path d="M12 8.5v7M8.5 12h7"/>',
    telefon:'<rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M11 18.5h2"/>',
    tablet:'<rect x="4.5" y="3" width="15" height="18" rx="2.2"/><path d="M11 18h2"/>',
    bilgisayar:'<rect x="3" y="4.5" width="18" height="12" rx="1.8"/><path d="M8.5 20h7M12 16.5V20"/>',
    ileri:'<path d="M9.5 6l6 6-6 6"/>',
    geri:'<path d="M14.5 6l-6 6 6 6"/>',
    kapat:'<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    tamam:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    goz:'<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    etkinlik:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    veri:'<ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6"/><path d="M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8"/>',
    indir:'<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19.5h14"/>',
    uyari:'<path d="M12 4.5 20.5 19H3.5z"/><path d="M12 10v4M12 16.6v.2"/>',
    giris:'<path d="M10 4.5h7.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H10"/><path d="M3.5 12H14M10.5 8.5 14 12l-3.5 3.5"/>',
    cikis:'<path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14"/><path d="M10.5 12H20M16.5 8.5 20 12l-3.5 3.5"/>',
  };
  function ikon(ad, sinif){
    return '<svg class="' + (sinif || 'hesap-ikon') + '" viewBox="0 0 24 24" aria-hidden="true">' + (IKON[ad] || '') + '</svg>';
  }

  /* Monogram: görünen adın baş harfi, profil renginde. */
  function harfi(s){ return (String(s || '').trim().charAt(0) || '·').toLocaleUpperCase('tr-TR'); }
  function avatar(ad, renk, boyut){
    return '<span class="hesap-avatar" style="--av:' + (RENK[renk] || RENK.mavi) + ';--av-boyut:' + (boyut || 40) + 'px" aria-hidden="true">'
      + kac(harfi(ad)) + '</span>';
  }

  /* Şifre alanı: göster/gizle, büyük harf kilidi uyarısı ve (yeni
     şifrede) güç çubuğu. Güç yalnız ipucudur; sunucu uzunluğa bakar. */
  function sifreAlani(id, etiket, ac, guc){
    return '<label class="hesap__alan" for="' + id + '"><span>' + kac(etiket) + '</span>'
      + '<span class="hesap__sifre"><input id="' + id + '" type="password" autocomplete="' + ac + '" required'
      + (ac === 'new-password' ? ' minlength="8"' : '') + ' data-sifre/>'
      + '<button type="button" class="hesap__goster" data-hesap="goster" aria-label="Şifreyi göster" aria-pressed="false">'
      + ikon('goz') + '</button></span>'
      + (guc ? '<span class="hesap__guc" data-guc="0" hidden><i></i><i></i><i></i><small></small></span>' : '')
      + '</label>';
  }
  const CAPS = '<p class="hesap__caps" hidden>Büyük harf kilidi açık</p>';
  const GUC_AD = ['En az 8 karakter', 'Zayıf', 'İyi', 'Güçlü'];
  function sifreGucu(s){
    s = String(s || '');
    if(s.length < 8) return 0;
    const tur = [/[a-zçğıöşü]/, /[A-ZÇĞİÖŞÜ]/, /[0-9]/, /[^0-9A-Za-zÇĞİÖŞÜçğıöşü]/].filter(r => r.test(s)).length;
    if(s.length >= 16 || (s.length >= 12 && tur >= 3)) return 3;
    if(s.length >= 12 || tur >= 3) return 2;
    return 1;
  }
  function gucTazele(input){
    const lab = input.closest && input.closest('.hesap__alan');
    const g = lab && lab.querySelector('.hesap__guc');
    if(!g) return;
    const p = sifreGucu(input.value);
    g.hidden = !input.value;
    g.setAttribute('data-guc', String(p));
    g.querySelector('small').textContent = GUC_AD[p];
  }

  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function tarihMetni(s){
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
    return m ? Number(m[3]) + ' ' + AYLAR[Number(m[2]) - 1] + ' ' + m[1] : '';
  }
  function sonMetni(ms){
    if(!ms) return 'hiç';
    const d = new Date(ms), b = new Date(ortam.simdi());
    const gun = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const fark = Math.round((gun(b) - gun(d)) / 86400000);
    if(fark <= 0) return 'bugün ' + saatMetni(ms);
    if(fark === 1) return 'dün ' + saatMetni(ms);
    return d.getDate() + ' ' + AYLAR[d.getMonth()] + (d.getFullYear() !== b.getFullYear() ? ' ' + d.getFullYear() : '');
  }
  function cihazTuru(ad){
    const s = String(ad || '');
    return /iPhone|telefon/i.test(s) ? 'telefon' : /iPad|tablet/i.test(s) ? 'tablet' : 'bilgisayar';
  }
  const ROL_AD = r => (r === 'admin' ? 'Admin' : 'Üye');

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
     tek sade kart. ÖNCE ANA MENÜ (söz 11): bu cihazdaki hesaplar, «Giriş
     yap», «Hesap oluştur», beta girişi; form seçilince yandan kayarak
     gelir, «‹» ana menüye döner. Sunucu yoksa (geliştirme sunucusu,
     dosyadan açılmış sayfa) hiç çıkmaz; telefon uygulamasında
     bilgisayarın adresini de sorar. Hata olunca kart yeniden çizilmez:
     yazılan kaybolmaz, yalnız mesaj. */
  const KAPI_SIRA = { karsila:0, giris:1, kayit:1, unuttum:2 };
  let kapi = { gorunum:'karsila', soru:null, ad:'', adres:null, secili:null, ilk:true };

  function kapiGerekli(){
    if(oturum() || betaMi() || ornekMi()) return false;
    return !!sunucu || ortam.yerelUygulama();
  }

  function kurulumMu(){ return !!(sunucu && sunucu.kurulum); }
  /* Hesap oluşturulabilir mi? Sunucu henüz bilinmiyorsa (uygulama, adres
     yazılmadı) evet: kararı sunucu verir. */
  function kayitAcikMi(){
    if(!sunucu) return true;
    if(sunucu.kurulum) return !!sunucu.yerel;
    return sunucu.kayit !== false;
  }

  function kapiNotu(){
    if(!sunucu){
      return ortam.yerelUygulama()
        ? 'Telefon ve bilgisayar aynı Wi-Fi\'da olmalı. Adres, bilgisayardaki LifeOS\'ta Hesap › Cihazlar\'da yazar.'
        : 'Bilgisayara ulaşılamıyor. Beta girişiyle bu cihazda devam edebilirsin.';
    }
    if(sunucu.kurulum) return sunucu.yerel ? 'İlk hesap admin olur.' : 'İlk hesap bilgisayarın kendisinde açılır.';
    return '';
  }

  /* LifeOS işareti: dört sistemin rengi. Her şekil kendi grubunda; ilk
     açılışta sırayla belirir (grup oynar, şeklin kendi dönüşü bozulmaz). */
  function isaret(ilk){
    return '<svg class="hesap-kapi__isaret' + (ilk ? ' is-ilk' : '') + '" viewBox="0 0 32 32" aria-hidden="true">'
      + '<g><rect x="3" y="3" width="12" height="12" rx="3" fill="#4F86FF"/></g>'
      + '<g><circle cx="23" cy="9" r="6" fill="#2EC4A9"/></g>'
      + '<g><rect x="5" y="19" width="9" height="9" rx="2" fill="#F2A93B" transform="rotate(45 9.5 23.5)"/></g>'
      + '<g><rect x="17" y="17" width="12" height="12" rx="3" fill="#9A86FF"/></g></svg>';
  }

  /* ANA SAYFA (depo sahibi, 2026-10-05: «giriş kısmına bir anasayfa;
     güzel bir giriş»). Kartın yanında (telefonda üstünde) tek ekranlık
     tanıtım: işaret, tek cümle, dört sistem, üç söz. Kaydırma yok;
     telefonda form açılınca tanıtım çekilir, form tek işe kalır. */
  const SISTEMLER = [
    ['AYS', 'Sınav hazırlığı', '<rect x="5" y="5" width="14" height="14" rx="3.5"/>', '#4F86FF'],
    ['SPİ', 'Sağlık ve toparlanma', '<circle cx="12" cy="12" r="7.5"/>', '#2EC4A9'],
    ['ESP', 'Dil, müzik, okuma', '<rect x="6.6" y="6.6" width="10.8" height="10.8" rx="2.4" transform="rotate(45 12 12)"/>', '#F2A93B'],
    ['Merkez', 'Günün özeti', '<path d="M12 4.3 18.8 8.2v7.6L12 19.7 5.2 15.8V8.2z"/>', '#9A86FF'],
  ];
  const SOZLER = ['PC, telefon ve tablet aynı hesapla', 'Verin hiçbir şirketin sunucusuna gitmez',
    'Bilgisayar kapalıyken de çalışır'];
  function tanitimHtml(){
    return '<section class="hesap-kapi__tanitim" aria-label="LifeOS">' + isaret(true)
      + '<p class="hesap-kapi__ad">LifeOS</p>'
      + '<p class="hesap-kapi__slogan">Sınav, sağlık ve gelişim tek yerde.</p>'
      + '<ul class="hesap-kapi__sistemler">' + SISTEMLER.map(([ad, acik, sekil, renk], i) =>
          '<li style="--renk:' + renk + ';--sira:' + i + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + sekil + '</svg>'
          + '<b>' + kac(ad) + '</b><span>' + kac(acik) + '</span></li>').join('') + '</ul>'
      + '<ul class="hesap-kapi__sozler">' + SOZLER.map(x => '<li>' + ikon('tamam') + '<span>' + kac(x) + '</span></li>').join('')
      + '</ul></section>';
  }

  function karsilaGovde(){
    const not = kapiNotu(), kurulum = kurulumMu(), kayitVar = kayitAcikMi();
    const l = kurulum ? [] : hatirlananlar();
    const hesaplar = l.length
      ? '<ul class="hesap-kapi__hesaplar" aria-label="Bu cihazdaki hesaplar">' + l.map(x =>
          '<li class="hesap-kapi__hesap">'
          + '<button type="button" class="hesap-kapi__hesap-sec" data-hesap="hatirla" data-ad="' + kac(x.a) + '">'
          +   avatar(x.g || x.a, x.k, 40)
          +   '<span class="hesap-kapi__hesap-ad"><b>' + kac(x.g || x.a) + '</b><small>@' + kac(x.a) + '</small></span></button>'
          + '<button type="button" class="hesap-kapi__unut" data-hesap="unut" data-ad="' + kac(x.a) + '"'
          +   ' aria-label="' + kac('«' + x.a + '» hesabını bu cihazdan unut') + '" title="Bu cihazdan unut">' + ikon('kapat') + '</button>'
          + '</li>').join('') + '</ul>'
      : '';
    const dugmeler = [];
    if(!kurulum){
      dugmeler.push('<button type="button" class="' + (l.length ? 'hesap__ikinci' : 'hesap__ana') + ' hesap__tam"'
        + ' data-hesap="gorunum" data-gorunum="giris">' + (l.length ? 'Başka hesapla giriş yap' : 'Giriş yap') + '</button>');
    }
    if(kayitVar){
      dugmeler.push('<button type="button" class="' + (kurulum ? 'hesap__ana' : 'hesap__ikinci') + ' hesap__tam"'
        + ' data-hesap="gorunum" data-gorunum="kayit">Hesap oluştur</button>');
    }
    return '<div class="hesap-kapi__marka hesap-kapi__marka--ana">'
      + '<h1 class="hesap-kapi__baslik" id="hesap-kapi-baslik">Hoş geldin</h1>'
      + '<p class="hesap-kapi__alt">' + (kurulum ? 'İlk hesabı aç, dört sistem birlikte açılsın.'
        : l.length ? 'Hesabını seç, kaldığın yerden devam et.' : 'Tek hesap, dört sistem.') + '</p></div>'
      + (not ? '<p class="hesap__not hesap-kapi__not">' + kac(not) + '</p>' : '')
      + hesaplar
      + (dugmeler.length ? '<div class="hesap-kapi__menu">' + dugmeler.join('') + '</div>' : '')
      + '<button type="button" class="hesap-kapi__beta" data-hesap="beta"><b>Beta girişi</b> · hesapsız, yalnız bu cihazda</button>';
  }

  function kapiBaslik(baslik, alt, geri){
    return '<button type="button" class="hesap-kapi__geri" data-hesap="gorunum" data-gorunum="' + (geri || 'karsila') + '"'
      + ' aria-label="' + (geri === 'giris' ? 'Girişe dön' : 'Ana menüye dön') + '">' + ikon('geri') + '</button>'
      + '<div class="hesap-kapi__marka">'
      + '<h1 class="hesap-kapi__baslik" id="hesap-kapi-baslik">' + kac(baslik) + '</h1>'
      + (alt ? '<p class="hesap-kapi__alt">' + kac(alt) + '</p>' : '') + '</div>';
  }

  function kapiGovde(){
    const g = kapi.gorunum;
    if(g === 'karsila' || !KAPI_SIRA[g]) return karsilaGovde();
    const mesaj = '<p class="hesap__mesaj" id="hesap-mesaj" role="alert" hidden></p>';
    const ana = metin => '<button type="submit" class="hesap__ana hesap__tam">' + metin + '</button>';
    if(g === 'kayit'){
      return kapiBaslik('Hesap oluştur', kurulumMu() ? kapiNotu() : '')
        + '<form class="hesap__form" data-hesap-form="kayit" data-ayar-disi>' + adresAlani()
        + alanHtml('hesap-ad', 'Kullanıcı adı', 'text', 'autocomplete="username" ' + AD_EK)
        + sifreAlani('hesap-parola', 'Şifre', 'new-password', true)
        + sifreAlani('hesap-parola2', 'Şifre (tekrar)', 'new-password')
        + CAPS
        + '<p class="hesap-kapi__ara">Şifreni unutursan</p>'
        + alanHtml('hesap-soru', 'Kendine bir soru', 'text',
          'required minlength="4" maxlength="120" autocomplete="off" placeholder="Örn. İlk öğretmenimin adı?"')
        + alanHtml('hesap-cevap', 'Cevabın', 'text', CEVAP_EK)
        + mesaj + ana('Hesap oluştur') + '</form>';
    }
    if(g === 'unuttum' && !kapi.soru){
      return kapiBaslik('Şifreni yenile', 'Kullanıcı adını yaz', 'giris')
        + '<form class="hesap__form" data-hesap-form="soru" data-ayar-disi>' + adresAlani()
        + alanHtml('hesap-ad', 'Kullanıcı adı', 'text', 'autocomplete="username" ' + AD_EK + ' value="' + kac(kapi.ad) + '"')
        + mesaj + ana('Devam') + '</form>';
    }
    if(g === 'unuttum'){
      return kapiBaslik('Şifreni yenile', 'Kendi sorunu cevapla', 'giris')
        + '<p class="hesap-kapi__soru">' + kac(kapi.soru) + '</p>'
        + '<form class="hesap__form" data-hesap-form="kurtar" data-ayar-disi>'
        + alanHtml('hesap-cevap', 'Cevabın', 'text', CEVAP_EK)
        + sifreAlani('hesap-parola', 'Yeni şifre', 'new-password', true)
        + sifreAlani('hesap-parola2', 'Yeni şifre (tekrar)', 'new-password')
        + CAPS + mesaj + ana('Şifreyi yenile') + '</form>';
    }
    /* Giriş. Hatırlanan hesap seçildiyse ad sorulmaz: monogram ve ad. */
    const s = kapi.secili;
    const bas = s
      ? '<button type="button" class="hesap-kapi__geri" data-hesap="gorunum" data-gorunum="karsila" aria-label="Ana menüye dön">'
        + ikon('geri') + '</button>'
        + '<div class="hesap-kapi__marka">' + avatar(s.g || s.a, s.k, 64)
        + '<h1 class="hesap-kapi__baslik" id="hesap-kapi-baslik">' + kac(s.g || s.a) + '</h1>'
        + '<p class="hesap-kapi__alt">@' + kac(s.a) + '</p></div>'
      : kapiBaslik('Giriş yap', '');
    return bas
      + '<form class="hesap__form" data-hesap-form="giris" data-ayar-disi>' + adresAlani()
      + (s ? '<input id="hesap-ad" type="hidden" autocomplete="username" value="' + kac(s.a) + '"/>'
        : alanHtml('hesap-ad', 'Kullanıcı adı', 'text', 'autocomplete="username" ' + AD_EK))
      + sifreAlani('hesap-parola', 'Şifre', 'current-password')
      + CAPS + mesaj + ana('Giriş yap') + '</form>'
      + '<div class="hesap-kapi__baglar">'
      +   '<button type="button" class="hesap-kapi__bag" data-hesap="unuttum">Şifremi unuttum</button>'
      +   (s ? '<button type="button" class="hesap-kapi__bag" data-hesap="gorunum" data-gorunum="giris">Başka hesap</button>' : '')
      + '</div>';
  }

  function kapiAcikMi(){ return !!(typeof document !== 'undefined' && document.querySelector('[data-hesap-kapi]')); }
  function azaltilmis(){
    try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return true; }
  }
  /* Kart yeni içeriğin boyuna yumuşakça uzar/kısalır (zıplamaz). */
  let boyId = null;
  function kapiTazele(yon){
    const kart = typeof document !== 'undefined' && document.querySelector('[data-hesap-kapi] .hesap-kapi__kart');
    if(!kart) return;
    const once = yon && !azaltilmis() ? kart.offsetHeight : 0;
    if(boyId != null){ clearTimeout(boyId); boyId = null; kart.style.height = ''; kart.style.transition = ''; }
    kart.innerHTML = '<div class="hesap-kapi__ic' + (yon ? ' is-' + yon : '') + '">' + kapiGovde() + '</div>';
    kapi.ilk = false;
    const kok = kart.closest('[data-hesap-kapi]');
    if(kok) kok.classList.toggle('is-form', kapi.gorunum !== 'karsila');
    const sonra = once ? kart.offsetHeight : 0;
    if(once && sonra && Math.abs(once - sonra) > 2){
      kart.style.height = once + 'px';
      void kart.offsetHeight;
      kart.style.transition = 'height .42s cubic-bezier(.32,.72,0,1)';
      kart.style.height = sonra + 'px';
      boyId = setTimeout(() => { boyId = null; kart.style.height = ''; kart.style.transition = ''; }, 460);
    }
    /* Ana menüde odak karttadır (halka çizilmez); formda ilk alana gider
       (telefonda klavye kendiliğinden açılmasın diye gitmez). */
    const ilk = kapi.gorunum === 'karsila' ? null : kart.querySelector('input:not([type=hidden])');
    const tel = !!(L.KABUK && L.KABUK.telefonMu && L.KABUK.telefonMu());
    try{ (ilk && !tel ? ilk : kart).focus({ preventScroll:true }); }catch(e){ /* odaklanamadı */ }
  }
  function kapiGit(g, ek){
    const once = kapi.gorunum;
    kapi = Object.assign({ gorunum:g, soru:null, ad:'', adres:null, secili:null, ilk:false }, ek || {});
    kapiTazele((KAPI_SIRA[g] || 0) < (KAPI_SIRA[once] || 0) ? 'geri' : 'ileri');
  }
  function kapiAc(g){
    if(typeof document === 'undefined' || !document.body) return;
    if(L.KABUK && L.KABUK.katmanAcik(PANEL)) L.KABUK.katmanKapat();
    merkezKapat();
    kapi = { gorunum:g || 'karsila', soru:null, ad:'', adres:null, secili:null, ilk:true };
    if(!kapiAcikMi()){
      const el = document.createElement('div');
      el.className = 'hesap-kapi';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-labelledby', 'hesap-kapi-baslik');
      el.setAttribute('data-hesap-panel', '');
      el.setAttribute('data-hesap-kapi', '');
      el.innerHTML = '<div class="hesap-kapi__sahne">' + tanitimHtml() + '<div class="hesap-kapi__kart" tabindex="-1"></div></div>';
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

  /* ------------------------------------------------------- hesap işleri (sayfa)

     Sunucudaki profil, cihazlar ve yönetim. Hepsi oturumun jetonuyla;
     ağ hatası çağırana gider (sayfa söyler), modülü hiçbiri bekletmez. */
  async function api(yol, govde){
    const o = oturum(), base = sunucuAdresi();
    if(!o || base === null){ const h = new Error('Önce giriş yap.'); h.kod = 401; throw h; }
    return istek(base, yol, govde || null, o.j, govde ? 30000 : 15000);
  }
  async function ben(){
    const v = await api('/api/hesap/ben');
    if(v && v.kullanici) profilYaz(v.kullanici);
    if(v && typeof v.kayit === 'boolean' && sunucu) sunucu.kayit = v.kayit;
    return v;
  }
  /* ek: { dogum, hitap, eposta } — verilmeyen alan sunucuda değişmez. */
  async function profilAyarla(gorunenAd, renk, ek){
    const v = await api('/api/hesap/profil', Object.assign({ gorunen_ad:gorunenAd, renk }, ek || {}));
    profilYaz(v.kullanici);
    return v.kullanici;
  }
  async function etkinlik(){ return (await api('/api/hesap/etkinlik')).olaylar || []; }
  /* Bilgisayardaki kopyanın tamamı tek JSON dosyası (sunucu sözü 13). */
  async function disaAktar(){
    const v = await api('/api/hesap/disa');
    const o = oturum() || {}, d = new Date(ortam.simdi());
    const gun = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const ad = 'lifeos-hesap-' + String(o.a || 'hesap').replace(/[^0-9A-Za-zÇĞİÖŞÜçğıöşü_.-]/g, '') + '-' + gun + '.json';
    const metin = JSON.stringify(v, null, 1);
    await ortam.indir(ad, metin);
    let n = 0;
    Object.values(v.alanlar || {}).forEach(x => { n += Object.keys(x).length; });
    return { ad, kayit:n, bayt:metin.length };
  }
  /* Hesabı siler (sunucu sözü 13). Bu cihazdaki veri yerinde kalır; bağ
     çözülür, hatırlanan hesap unutulur, giriş ekranı gelir. */
  async function hesabiSil(parola){
    const o = oturum();
    await api('/api/hesap/sil', { parola });
    cerezSil(CEREZ);
    if(o) unut(o.a);
    const a = alan();
    if(a) baglantiCoz(a);
    merkezKapat();
    if(L.KABUK && L.KABUK.katmanAcik && L.KABUK.katmanAcik(PANEL)) L.KABUK.katmanKapat();
    sunucu = Object.assign({}, sunucu);
    await yokla();
    durumYaz('giris', 'Hesap silindi. Bu cihazdaki veri yerinde duruyor.');
    if(kapiGerekli()) kapiAc();
  }
  async function cihazlar(){ return (await api('/api/hesap/cihazlar')).cihazlar || []; }
  async function cihazCikar(id){
    const v = await api('/api/hesap/cihaz-cikar', { id });
    if(v.bu) oturumKapandi();
    return v;
  }
  async function otekilerdenCik(){ return (await api('/api/hesap/otekilerden-cik', {})).n; }
  async function kullanicilar(){ return api('/api/hesap/kullanicilar'); }
  async function yonet(id, degisim){
    const k = (await api('/api/hesap/yonet', Object.assign({ id }, degisim))).kullanici;
    profilYaz(k);                     // kendi rolü değiştiyse çerez de
    return k;
  }
  async function kayitAyarla(acik){
    const v = await api('/api/hesap/ayar', { kayit:!!acik });
    if(sunucu) sunucu.kayit = v.kayit;
    return v.kayit;
  }
  async function kullaniciEkle(ad, parola){ return api('/api/hesap/kullanici', { ad, parola }); }

  /* Oturum sunucuda kapanmış (başka cihazdan çıkarıldı, süresi doldu). */
  function oturumKapandi(){
    cerezSil(CEREZ);
    durumYaz('giris', 'Oturum kapandı; yeniden giriş yap. Bu cihazdaki değişiklikler sırada bekliyor.');
    merkezKapat();
    if(L.KABUK && L.KABUK.katmanAcik && L.KABUK.katmanAcik(PANEL)) L.KABUK.katmanKapat();
    if(kapiGerekli()) kapiAc();
  }

  /* ------------------------------------------------------- hesap sayfası (söz 12)

     iOS Ayarlar gibi: üstte kimlik (monogram, görünen ad, plan), altında
     gruplu satırlar; satır alt sayfayı yandan kaydırarak açar, «‹» döner.
     Veri sunucudan gelir, bellekte durur; sunucuya ulaşılamazsa çerezdeki
     profil gösterilir ve bu söylenir. Sayfa [data-hesap-panel]'dir:
     içindeki alanlar modülün «yazıyor mu?» denetimine sayılmaz. */
  const SAYFA_AD = { kok:'Hesap', profil:'Profil', plan:'Plan', cihazlar:'Cihazlar', guvenlik:'Güvenlik',
    esitleme:'Eşitleme', yonetim:'Yönetim', kisi:'Kullanıcı', etkinlik:'Etkinlik', verin:'Verin' };

  /* Etkinlik defterindeki olay türleri (sunucu sözü 11). */
  const OLAY = {
    giris:['giris', 'Giriş'], yanlis:['uyari', 'Yanlış şifre'], kayit:['ekle', 'Hesap açıldı'],
    kurtar:['soru', 'Şifre soruyla yenilendi'], 'kurtar-yanlis':['uyari', 'Kurtarma cevabı yanlış'],
    parola:['anahtar', 'Şifre değişti'], soru:['soru', 'Kurtarma sorusu değişti'], cikis:['cikis', 'Çıkış'],
    cihaz:['cihazlar', 'Cihazdan çıkıldı'], otekiler:['cihazlar', 'Öteki cihazlardan çıkıldı'],
    yonetim:['yonetim', 'Admin değişikliği'],
  };
  const YANLIS = { yanlis:1, 'kurtar-yanlis':1 };
  const HAFTA_MS = 7 * 86400000;
  function yanlisSayisi(l){
    const sinir = ortam.simdi() - HAFTA_MS;
    return (l || []).filter(o => YANLIS[o.tur] && o.zaman >= sinir).length;
  }
  function boyut(b){
    if(b == null) return '';
    if(b < 1024) return b + ' B';
    if(b < 1048576) return Math.max(1, Math.round(b / 1024)) + ' KB';
    return (b / 1048576).toLocaleString('tr-TR', { maximumFractionDigits:1 }) + ' MB';
  }
  function toplam(m){
    const ay = m && m.ben && m.ben.ayrinti;
    if(!ay) return null;
    let n = 0, b = 0;
    Object.keys(ay).forEach(a => { n += Number(ay[a].n) || 0; b += Number(ay[a].bayt) || 0; });
    return { n, b };
  }
  function bugunGun(){
    const d = new Date(ortam.simdi());
    return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function gunBasligi(ms){
    const s = sonMetni(ms);
    return /^bugün/.test(s) ? 'Bugün' : /^dün/.test(s) ? 'Dün' : s;
  }
  let merkez = null;

  function merkezAcikMi(){ return !!(typeof document !== 'undefined' && document.querySelector('[data-hesap-merkez]')); }
  function sayfa(){ return merkez ? merkez.yigin[merkez.yigin.length - 1] : 'kok'; }

  function kim(){
    const k = merkez && merkez.ben && merkez.ben.kullanici;
    if(k) return { ad:k.ad, g:k.gorunen_ad || k.ad, k:k.renk, r:k.rol, p:k.plan, pa:k.plan_ad, olusturma:k.olusturma };
    const o = oturum() || {};
    return { ad:o.a || '', g:o.g || o.a || '', k:o.k || 'mavi', r:o.r, p:o.p || 'ucretsiz', pa:o.pa || '', olusturma:'' };
  }
  function planBul(id){
    const l = merkez && merkez.ben && merkez.ben.planlar;
    return (l || []).find(p => p.id === id) || null;
  }
  function kisiBul(){
    return merkez && merkez.kullanicilar ? merkez.kullanicilar.find(u => u.id === merkez.kisi) || null : null;
  }
  function esitKisa(){
    if(!ayar || !ayar.depo) return '';
    const n = bekleyen();
    switch(hal.durum){
      case 'tamam': return n ? n + ' sırada' : 'Eşitlendi';
      case 'esitleniyor': return 'Eşitleniyor…';
      case 'cevrimdisi': return 'Çevrimdışı';
      case 'hata': case 'baska': return 'Sorun var';
      default: return '';
    }
  }
  function yukleniyor(m){ return m.uyari ? '' : '<p class="hesap__not">Yükleniyor…</p>'; }
  function bilgi(dt, dd){ return '<div><dt>' + kac(dt) + '</dt><dd>' + kac(dd) + '</dd></div>'; }
  function satir(o){
    const veri = o.sayfa ? 'data-hesap="sayfa" data-sayfa="' + o.sayfa + '"' : 'data-hesap="' + o.eylem + '"';
    return '<li><button type="button" class="hesap-satir' + (o.sinif ? ' ' + o.sinif : '') + '" ' + veri + '>'
      + (o.ikon ? ikon(o.ikon, 'hesap-satir__ikon') : '')
      + '<span class="hesap-satir__ad">' + kac(o.ad) + '</span>'
      + (o.detay != null ? '<span class="hesap-satir__detay"' + (o.detayId ? ' id="' + o.detayId + '"' : '') + '>'
        + kac(o.detay) + '</span>' : '')
      + (o.sayfa ? ikon('ileri', 'hesap-satir__ok') : '') + '</button></li>';
  }
  function acilir(anahtar, ikonAd, ad, detay, govde){
    const acik = !!(merkez && merkez.acik && merkez.acik[anahtar]);
    return '<details class="hesap-ac" data-ac="' + anahtar + '"' + (acik ? ' open' : '') + '><summary class="hesap-satir">'
      + ikon(ikonAd, 'hesap-satir__ikon') + '<span class="hesap-satir__ad">' + kac(ad) + '</span>'
      + (detay ? '<span class="hesap-satir__detay">' + kac(detay) + '</span>' : '')
      + ikon('ileri', 'hesap-satir__ok') + '</summary><div class="hesap-ac__ic">' + govde + '</div></details>';
  }
  const formMesaj = '<p class="hesap__mesaj" role="alert" hidden></p>';

  const SAYFALAR = {
    kok(m){
      const k = kim(), p = planBul(k.p), o = oturum() || {}, t = toplam(m);
      /* Özet: ölçülmemiş sayı «—»dır, sıfır değil (AGENTS §1.2). */
      const uye = k.olusturma ? Math.max(0, Math.floor((ortam.simdi() - new Date(k.olusturma).getTime()) / 86400000)) : null;
      const say = (deger, ad) => '<div><b>' + (deger == null ? '—' : kac(deger)) + '</b><span>' + ad + '</span></div>';
      const yanlis = yanlisSayisi(m.etkinlik);
      const sonGiris = (m.etkinlik || []).find(x => x.tur === 'giris');
      return '<div class="hesap-kimlik">' + avatar(k.g, k.k, 76)
        + '<p class="hesap-kimlik__ad">' + kac(k.g) + '</p>'
        + '<p class="hesap-kimlik__alt">@' + kac(k.ad) + ' · ' + ROL_AD(k.r) + '</p>'
        + (o.dg && o.dg === bugunGun() ? '<p class="hesap-kimlik__kutla">İyi ki doğdun!</p>' : '')
        + (k.pa ? '<button type="button" class="hesap-hap" data-hesap="sayfa" data-sayfa="plan">'
          + kac(k.pa) + (p && p.etiket ? ' · ' + kac(p.etiket) : '') + '</button>' : '')
        + '</div>'
        + '<div class="hesap-sayilar">'
        +   say(uye == null ? null : (uye + 1).toLocaleString('tr-TR'), 'gündür üye')
        +   say(t ? t.n.toLocaleString('tr-TR') : null, 'kayıt')
        +   say(m.cihazlar ? String(m.cihazlar.length) : null, 'cihaz')
        + '</div>'
        + '<ul class="hesap-liste">'
        +   satir({ ikon:'profil', ad:'Profil', sayfa:'profil' })
        +   satir({ ikon:'plan', ad:'Plan', detay:k.pa || '', sayfa:'plan' })
        +   satir({ ikon:'cihazlar', ad:'Cihazlar', detay:m.cihazlar ? String(m.cihazlar.length) : '', sayfa:'cihazlar' })
        +   satir({ ikon:'etkinlik', ad:'Etkinlik', sayfa:'etkinlik', sinif:yanlis ? 'is-dikkat' : '',
              detay:yanlis ? yanlis + ' yanlış deneme' : sonGiris ? sonMetni(sonGiris.zaman) : '' })
        +   satir({ ikon:'guvenlik', ad:'Güvenlik', sayfa:'guvenlik' })
        + '</ul>'
        + '<ul class="hesap-liste">'
        +   satir({ ikon:'esitleme', ad:'Eşitleme', detay:esitKisa(), detayId:'hesap-esit-kisa', sayfa:'esitleme' })
        +   satir({ ikon:'veri', ad:'Verin', detay:t && t.b ? boyut(t.b) : '', sayfa:'verin' })
        + '</ul>'
        + (k.r === 'admin' ? '<ul class="hesap-liste">' + satir({ ikon:'yonetim', ad:'Yönetim',
          detay:m.kullanicilar ? m.kullanicilar.length + ' kişi' : '', sayfa:'yonetim' }) + '</ul>' : '')
        + '<ul class="hesap-liste">' + satir({ ad:'Çıkış yap', eylem:'cikis', sinif:'is-tehlike' }) + '</ul>';
    },

    profil(m){
      const k = kim(), ku = m.ben && m.ben.kullanici;
      const renkler = ((m.ben && m.ben.renkler) || Object.keys(RENK)).filter(r => RENK[r]);
      const d = new Date(ortam.simdi());
      const bugun = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      /* Kişisel alanlar yalnız sunucunun cevabıyla çizilir (söz 14). */
      const kisisel = ku
        ? '<p class="hesap-bolum hesap-bolum--form">Kişisel bilgiler · isteğe bağlı</p>'
          + alanHtml('hesap-hitap', 'King sana nasıl seslensin', 'text', 'maxlength="30" autocomplete="off" placeholder="'
            + kac(k.g) + '" value="' + kac(ku.hitap || '') + '"')
          + alanHtml('hesap-dogum', 'Doğum günü', 'date', 'min="1900-01-01" max="' + bugun + '" value="' + kac(ku.dogum || '') + '"')
          + alanHtml('hesap-eposta', 'E-posta', 'email', 'maxlength="200" autocomplete="email" value="' + kac(ku.eposta || '') + '"')
          + '<p class="hesap__not hesap__not--form">Hiçbiri bir yere gönderilmez; yalnız bilgisayarındaki LifeOS’ta durur.</p>'
        : '';
      return '<div class="hesap-kimlik hesap-kimlik--kucuk" data-hesap-onizleme>' + avatar(k.g, k.k, 64) + '</div>'
        + '<form class="hesap__form" data-hesap-form="profil" data-ayar-disi>'
        +   alanHtml('hesap-gorunen', 'Görünen ad', 'text', 'maxlength="40" autocomplete="nickname" value="' + kac(k.g) + '"')
        +   '<fieldset class="hesap-renkler"><legend>Renk</legend><div class="hesap-renkler__liste">' + renkler.map(r =>
              '<label class="hesap-renk" style="--renk:' + RENK[r] + '" title="' + kac(RENK_AD[r]) + '">'
              + '<input type="radio" name="hesap-renk" value="' + r + '"' + (r === k.k ? ' checked' : '') + '/>'
              + '<span class="hesap-renk__ad">' + kac(RENK_AD[r]) + '</span></label>').join('') + '</div></fieldset>'
        +   kisisel
        +   formMesaj
        +   '<button type="submit" class="hesap__ana hesap__tam">Kaydet</button>'
        + '</form>'
        + '<dl class="hesap-bilgi">' + bilgi('Kullanıcı adı', '@' + k.ad) + bilgi('Rol', ROL_AD(k.r))
        +   (k.olusturma ? bilgi('Üyelik', tarihMetni(k.olusturma)) : '') + '</dl>';
    },

    /* Plan yalnız görünürlüktür (sunucu sözü 8). Fiyat yok, düğme yok:
       «Yakında» bir etikettir, tıklanacak bir şey değil. */
    plan(m){
      const k = kim(), l = m.ben && m.ben.planlar;
      if(!l) return yukleniyor(m);
      return '<div class="hesap-planlar">' + l.map(p => {
        const simdi = p.id === k.p;
        return '<article class="hesap-plan' + (simdi ? ' is-simdi' : '') + '">'
          + '<header class="hesap-plan__bas"><h3>' + kac(p.ad) + '</h3>'
          + '<span class="hesap-plan__etiket' + (p.durum === 'yakinda' ? ' is-yakinda' : '') + '">' + kac(p.etiket) + '</span></header>'
          + '<p class="hesap-plan__ozet">' + kac(p.ozet) + '</p>'
          + '<ul class="hesap-plan__liste">' + (p.ozellik || []).map(x => '<li>' + ikon('tamam') + '<span>' + kac(x) + '</span></li>').join('') + '</ul>'
          + (simdi ? '<p class="hesap-plan__durum">' + ikon('tamam') + 'Şu anki planın</p>' : '')
          + '</article>';
      }).join('') + '</div>'
      + '<p class="hesap__not">Ödeme yok; hiçbir özellik plana bağlı değil.</p>';
    },

    cihazlar(m){
      const l = m.cihazlar;
      if(!l) return yukleniyor(m);
      const oteki = l.filter(c => !c.bu).length;
      return '<ul class="hesap-liste">' + l.map(c =>
          '<li class="hesap-oge">' + ikon(cihazTuru(c.cihaz_ad), 'hesap-satir__ikon')
          + '<span class="hesap-oge__metin"><b>' + kac(c.cihaz_ad) + '</b><small>'
          + (c.bu ? 'Bu cihaz' : 'Son görülme: ' + kac(sonMetni(c.son))) + '</small></span>'
          + (c.bu ? '' : '<button type="button" class="hesap__kucuk" data-hesap="cihaz-cikar" data-id="' + Number(c.id) + '"'
            + ' aria-label="' + kac(c.cihaz_ad + ' oturumunu kapat') + '">Çıkar</button>')
          + '</li>').join('') + '</ul>'
        + (!oteki ? '' : m.onay
          ? '<div class="hesap-onay" role="group" aria-label="Onay"><p>Öteki ' + oteki + ' cihazda oturum kapanır; '
            + 'orada yeniden giriş gerekir. Kayıtlar silinmez.</p><div class="hesap__eylem">'
            + '<button type="button" class="hesap__tehlike" data-hesap="otekiler-evet">Hepsinden çık</button>'
            + '<button type="button" class="hesap__ikinci" data-hesap="otekiler-vazgec">Vazgeç</button></div></div>'
          : '<ul class="hesap-liste">' + satir({ ad:'Öteki cihazların hepsinden çık', eylem:'otekiler', sinif:'is-tehlike' }) + '</ul>')
        + adresNotu();
    },

    guvenlik(m){
      const soruVar = m.ben ? m.ben.soru_var : null;
      return '<div class="hesap-liste hesap-liste--ac">'
        + acilir('parola', 'anahtar', 'Şifreyi değiştir', '',
            '<form class="hesap__form" data-hesap-form="parola" data-ayar-disi>'
            + sifreAlani('hesap-eski', 'Şimdiki şifre', 'current-password')
            + sifreAlani('hesap-yeni', 'Yeni şifre', 'new-password', true)
            + sifreAlani('hesap-yeni2', 'Yeni şifre (tekrar)', 'new-password')
            + CAPS + formMesaj + '<button type="submit" class="hesap__ana hesap__tam">Şifreyi değiştir</button></form>')
        + acilir('soru', 'soru', 'Kurtarma sorusu', soruVar === true ? 'Ayarlı' : soruVar === false ? 'Ayarlı değil' : '',
            '<form class="hesap__form" data-hesap-form="soru-ayarla" data-ayar-disi>'
            + alanHtml('hesap-yeni-soru', 'Soru (kendin yaz)', 'text', 'required minlength="4" maxlength="120" autocomplete="off"')
            + alanHtml('hesap-yeni-cevap', 'Cevabın', 'text', CEVAP_EK)
            + sifreAlani('hesap-soru-sifre', 'Şifren', 'current-password')
            + CAPS + formMesaj + '<button type="submit" class="hesap__ana hesap__tam">Kaydet</button></form>')
        + '</div>'
        + '<ul class="hesap-liste">' + satir({ ikon:'cihazlar', ad:'Oturum açık cihazlar',
          detay:m.cihazlar ? String(m.cihazlar.length) : '', sayfa:'cihazlar' }) + '</ul>'
        + '<p class="hesap__not">Şifre değişince öteki cihazlarda yeniden giriş gerekir.</p>';
    },

    esitleme(m){
      const modulde = !!(ayar && ayar.depo);
      const ay = m.ben && m.ben.ayrinti;
      const sayi = { ays:{ n:0, b:0, son:0 }, spi:{ n:0, b:0, son:0 }, esp:{ n:0, b:0, son:0 } };
      if(ay) Object.keys(ay).forEach(a => {
        const k = a.split('/')[0];
        if(!(k in sayi)) return;
        sayi[k].n += Number(ay[a].n) || 0; sayi[k].b += Number(ay[a].bayt) || 0;
        sayi[k].son = Math.max(sayi[k].son, Number(ay[a].son) || 0);
      });
      return (modulde
          ? '<div class="hesap-esit"><p class="hesap__durum is-' + kac(hal.durum) + '" id="hesap-durum" role="status" aria-live="polite">'
            + kac(durumMetni()) + '</p><button type="button" class="hesap__ana" data-hesap="esitle">Şimdi eşitle</button></div>'
          : '')
        + (ay ? '<p class="hesap-bolum">Bilgisayardaki kopya</p><ul class="hesap-liste hesap-liste--duz">' + ['ays', 'spi', 'esp'].map(k =>
            '<li class="hesap-oge"><span class="hesap-oge__metin"><b>' + MODUL_AD[k] + '</b><small>'
            + (sayi[k].n ? sayi[k].n.toLocaleString('tr-TR') + ' kayıt · ' + boyut(sayi[k].b) : 'kayıt yok') + '</small></span>'
            + (sayi[k].son ? '<span class="hesap-satir__detay">' + kac(sonMetni(sayi[k].son)) + '</span>' : '') + '</li>').join('')
            + '</ul>' : yukleniyor(m))
        + (m.cihazlar && m.cihazlar.length ? '<p class="hesap-bolum">Cihazların son eşitlemesi</p><ul class="hesap-liste">'
            + m.cihazlar.map(c => '<li class="hesap-oge">' + ikon(cihazTuru(c.cihaz_ad), 'hesap-satir__ikon')
              + '<span class="hesap-oge__metin"><b>' + kac(c.cihaz_ad) + '</b><small>' + (c.bu ? 'Bu cihaz' : 'Cihaz') + '</small></span>'
              + '<span class="hesap-satir__detay">' + (c.esitleme ? kac(sonMetni(c.esitleme)) : 'henüz yok') + '</span></li>').join('')
            + '</ul>' : '')
        + '<p class="hesap__not">Bu cihaz: ' + kac(cihazAdi()) + '. Kayıtlar bilgisayardaki LifeOS ile eşitlenir; '
        + 'fotoğraflar çekildiği cihazda kalır.' + (modulde ? '' : ' Eşitleme her sistemin içinde kendiliğinden olur.') + '</p>';
    },

    yonetim(m){
      const l = m.kullanicilar;
      const kayit = typeof m.kayit === 'boolean' ? m.kayit : !(sunucu && sunucu.kayit === false);
      return '<ul class="hesap-liste hesap-liste--duz"><li class="hesap-oge">'
        + '<span class="hesap-oge__metin"><b id="hesap-kayit-ad">Yeni hesap açılabilir</b><small>'
        + (kayit ? 'Herkes kendi hesabını açar.' : 'Kapalı: hesabı sen eklersin.') + '</small></span>'
        + '<button type="button" class="hesap-anahtar" role="switch" aria-checked="' + (kayit ? 'true' : 'false') + '"'
        + ' aria-labelledby="hesap-kayit-ad" data-hesap="kayit-ayar"></button></li></ul>'
        + (l ? '<p class="hesap-bolum">Kullanıcılar</p><ul class="hesap-liste">' + l.map(u =>
            '<li><button type="button" class="hesap-satir hesap-satir--kisi" data-hesap="kisi" data-id="' + Number(u.id) + '">'
            + avatar(u.gorunen_ad, u.renk, 34)
            + '<span class="hesap-oge__metin"><b>' + kac(u.gorunen_ad) + '</b><small>@' + kac(u.ad) + ' · ' + ROL_AD(u.rol)
            + ' · ' + kac(u.plan_ad) + '</small></span>' + ikon('ileri', 'hesap-satir__ok') + '</button></li>').join('') + '</ul>'
          : yukleniyor(m))
        + '<div class="hesap-liste hesap-liste--ac">' + acilir('ekle', 'ekle', 'Kullanıcı ekle', '',
            '<form class="hesap__form" data-hesap-form="kullanici-ekle" data-ayar-disi>'
            + alanHtml('hesap-yeni-ad', 'Kullanıcı adı', 'text', 'autocomplete="off" ' + AD_EK)
            + sifreAlani('hesap-yeni-sifre', 'Geçici şifre', 'new-password', true)
            + formMesaj + '<button type="submit" class="hesap__ana hesap__tam">Ekle</button></form>') + '</div>';
    },

    etkinlik(m){
      const l = m.etkinlik;
      if(!l) return yukleniyor(m);
      if(!l.length) return '<p class="hesap__not">Henüz kayıtlı etkinlik yok.</p>';
      const yanlis = yanlisSayisi(l);
      let gun = '', html = '';
      l.forEach(o => {
        const g = gunBasligi(o.zaman);
        if(g !== gun){
          if(gun) html += '</ul>';
          html += '<p class="hesap-bolum">' + kac(g) + '</p><ul class="hesap-liste">';
          gun = g;
        }
        const t = OLAY[o.tur] || ['etkinlik', o.tur];
        const alt = (o.tur === 'cihaz' ? [o.ayrinti, o.cihaz_ad ? 'ile: ' + o.cihaz_ad : ''] :
          o.tur === 'otekiler' ? [o.ayrinti + ' cihaz', o.cihaz_ad] :
          o.tur === 'yonetim' ? [o.ayrinti] : [o.cihaz_ad, o.ip]).filter(Boolean).join(' · ');
        html += '<li class="hesap-oge hesap-olay' + (YANLIS[o.tur] ? ' is-dikkat' : '') + '">' + ikon(t[0], 'hesap-satir__ikon')
          + '<span class="hesap-oge__metin"><b>' + kac(t[1]) + '</b>' + (alt ? '<small>' + kac(alt) + '</small>' : '') + '</span>'
          + '<span class="hesap-satir__detay">' + saatMetni(o.zaman) + '</span></li>';
      });
      return (yanlis ? '<div class="hesap-uyari" role="status">' + ikon('uyari') + '<p>Son 7 günde <b>' + yanlis
          + ' yanlış deneme</b>. Sen değilsen şifreni değiştir.</p>'
          + '<button type="button" class="hesap__kucuk hesap__kucuk--duz" data-hesap="sayfa" data-sayfa="guvenlik">Güvenlik</button></div>' : '')
        + html + '</ul><p class="hesap__not">Son ' + l.length + ' olay. Şifre ve cevaplar deftere hiç yazılmaz.</p>';
    },

    /* VERİN (sunucu sözü 13): indir ya da hesabı sil. Silme geri
       alınamaz: önce ne gideceği ve ne kalacağı yazılır, şifre sorulur. */
    verin(m){
      const t = toplam(m), n = m.cihazlar ? m.cihazlar.length : null;
      return '<ul class="hesap-liste"><li class="hesap-oge">' + ikon('indir', 'hesap-satir__ikon')
        + '<span class="hesap-oge__metin"><b>Verimi indir</b><small>Bilgisayardaki kopyanın tamamı'
        + (t ? ' · ' + t.n.toLocaleString('tr-TR') + ' kayıt' + (t.b ? ' · ' + boyut(t.b) : '') : '') + ' · tek JSON dosyası</small></span>'
        + '<button type="button" class="hesap__kucuk hesap__kucuk--duz" data-hesap="indir">İndir</button></li></ul>'
        + (!m.silOnay
          ? '<ul class="hesap-liste">' + satir({ ad:'Hesabı sil', eylem:'sil-ac', sinif:'is-tehlike' }) + '</ul>'
          : '<div class="hesap-onay"><p><b>Hesabın kalıcı olarak silinir.</b> Geri alınamaz.</p>'
            + '<ul class="hesap-onay__liste">'
            + '<li>Silinir: bilgisayardaki kopya' + (t ? ' (' + t.n.toLocaleString('tr-TR') + ' kayıt)' : '') + ', '
            + (n == null ? 'oturumlar' : n + ' cihazdaki oturum') + ', etkinlik ve kişisel bilgiler.</li>'
            + '<li>Kalır: her cihazdaki veri, o cihazın kendi deposunda.</li></ul>'
            + '<form class="hesap__form" data-hesap-form="sil" data-ayar-disi>'
            + sifreAlani('hesap-sil-sifre', 'Onay için şifren', 'current-password') + CAPS + formMesaj
            + '<div class="hesap__eylem"><button type="submit" class="hesap__tehlike">Hesabı kalıcı olarak sil</button>'
            + '<button type="button" class="hesap__ikinci" data-hesap="sil-vazgec">Vazgeç</button></div></form></div>')
        + '<p class="hesap__not">İstersen önce indir. Her sistemin kendi yedeği de o sistemin Ayarlar’ında durur.</p>';
    },

    kisi(m){
      const u = kisiBul();
      if(!u) return yukleniyor(m);
      const planlar = (m.ben && m.ben.planlar) || [];
      const seg = (alan, etiketId, secenek, simdiki) => '<div class="hesap-seg" role="group" aria-labelledby="' + etiketId + '">'
        + secenek.map(([d, ad]) => '<button type="button" data-hesap="yonet" data-alan="' + alan + '" data-deger="' + kac(d) + '"'
          + ' aria-pressed="' + (d === simdiki ? 'true' : 'false') + '">' + kac(ad) + '</button>').join('') + '</div>';
      return '<div class="hesap-kimlik hesap-kimlik--kucuk">' + avatar(u.gorunen_ad, u.renk, 64)
        + '<p class="hesap-kimlik__alt">@' + kac(u.ad) + '</p></div>'
        + '<div class="hesap-ayar"><p class="hesap-ayar__ad" id="hesap-kisi-rol">Rol</p>'
        +   seg('rol', 'hesap-kisi-rol', [['uye', 'Üye'], ['admin', 'Admin']], u.rol) + '</div>'
        + (planlar.length ? '<div class="hesap-ayar"><p class="hesap-ayar__ad" id="hesap-kisi-plan">Plan</p>'
          + seg('plan', 'hesap-kisi-plan', planlar.map(p => [p.id, p.ad]), u.plan) + '</div>' : '')
        + '<p class="hesap__mesaj" role="alert" hidden data-hesap-kisi-mesaj></p>'
        + '<dl class="hesap-bilgi">' + bilgi('Cihaz', String(u.cihaz || 0)) + bilgi('Son görülme', sonMetni(u.son))
        +   bilgi('Üyelik', tarihMetni(u.olusturma)) + '</dl>';
    },
  };

  function merkezHtml(yon){
    const m = merkez || { yigin:['kok'] };
    const s = sayfa(), y = m.yigin;
    const u = s === 'kisi' ? kisiBul() : null;
    const baslik = u ? u.gorunen_ad : SAYFA_AD[s] || SAYFA_AD.kok;
    const onceki = y.length > 1 ? SAYFA_AD[y[y.length - 2]] : '';
    return '<header class="hesap-merkez__ust">'
      + (onceki ? '<button type="button" class="hesap-merkez__geri" data-hesap="geri" aria-label="' + kac(onceki + ' sayfasına dön') + '">'
        + ikon('geri') + '<span>' + kac(onceki) + '</span></button>' : '<span></span>')
      + '<h2 class="hesap-merkez__baslik" id="hesap-merkez-baslik">' + kac(baslik) + '</h2>'
      + '<button type="button" class="hesap-merkez__kapat" data-hesap="merkez-kapat" aria-label="Hesap sayfasını kapat">'
      + ikon('kapat') + '</button></header>'
      + '<div class="hesap-merkez__govde"><div class="hesap-merkez__ic' + (yon ? ' is-' + yon : '') + '">'
      + (m.uyari ? '<p class="hesap__not hesap-merkez__uyari" role="status">' + kac(m.uyari) + '</p>' : '')
      + (m.mesaj ? '<p class="hesap-merkez__mesaj" role="status">' + ikon('tamam') + '<span>' + kac(m.mesaj) + '</span></p>' : '')
      + (SAYFALAR[s] || SAYFALAR.kok)(m) + '</div></div>';
  }

  /* Kullanıcı sayfada yazıyorsa (ya da yazıp kaydetmediyse) gelen veri
     sayfayı yeniden çizmez: yazılan silinmesin (söz 9'un sayfadaki eşi). */
  function merkezKirli(){
    const el = document.querySelector('[data-hesap-merkez]');
    if(!el) return false;
    const a = document.activeElement;
    if(a && el.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'radio') return true;
    return Array.from(el.querySelectorAll('input, textarea')).some(i =>
      i.type === 'radio' || i.type === 'checkbox' ? i.checked !== i.defaultChecked
        : i.type !== 'hidden' && i.value !== i.defaultValue);
  }
  function merkezTazele(yon){
    const kart = typeof document !== 'undefined' && document.querySelector('[data-hesap-merkez] .hesap-merkez__kart');
    if(!kart || !merkez) return;
    const g = kart.querySelector('.hesap-merkez__govde');
    const kay = g && !yon ? g.scrollTop : 0;
    merkez.acik = {};
    kart.querySelectorAll('details[data-ac]').forEach(d => { if(d.open) merkez.acik[d.getAttribute('data-ac')] = true; });
    if(yon) merkez.acik = {};
    kart.innerHTML = merkezHtml(yon);
    const g2 = kart.querySelector('.hesap-merkez__govde');
    if(g2) g2.scrollTop = kay;
    if(yon){
      const odak = kart.querySelector('.hesap-merkez__geri') || kart.querySelector('.hesap-merkez__baslik');
      try{ (odak.tagName === 'BUTTON' ? odak : kart).focus({ preventScroll:true }); }catch(e){ /* odaklanamadı */ }
    }
  }

  async function merkezYukle(){
    const m = merkez;
    if(!m) return;
    const isler = [
      ben().then(v => { m.ben = v; if(typeof v.kayit === 'boolean') m.kayit = v.kayit; }),
      cihazlar().then(l => { m.cihazlar = l; }),
      etkinlik().then(l => { m.etkinlik = l; }),
    ];
    if((oturum() || {}).r === 'admin'){
      isler.push(kullanicilar().then(v => { m.kullanicilar = v.kullanicilar || []; m.kayit = v.kayit; }));
    }
    const sonuc = await Promise.all(isler.map(p => p.then(() => null, e => e)));
    if(merkez !== m) return;
    const hata = sonuc.find(Boolean);
    if(hata && hata.kod === 401 && !m.ben) return oturumKapandi();
    m.uyari = !hata ? '' : hata.kod === 0 ? 'Bilgisayara ulaşılamıyor; son bilinen bilgiler gösteriliyor.' : (hata.message || '');
    if(!merkezKirli()) merkezTazele();
  }

  function merkezAc(ilkSayfa){
    if(typeof document === 'undefined' || !document.body || !oturum()) return;
    if(L.KABUK && L.KABUK.katmanAcik && L.KABUK.katmanAcik(PANEL)) L.KABUK.katmanKapat();
    const once = document.activeElement;
    merkez = { yigin:['kok'], ben:null, cihazlar:null, kullanicilar:null, etkinlik:null, kayit:null, kisi:null,
      mesaj:'', uyari:'', onay:false, silOnay:false, acik:{}, once };
    if(ilkSayfa && ilkSayfa !== 'kok' && SAYFA_AD[ilkSayfa]) merkez.yigin.push(ilkSayfa);
    if(!merkezAcikMi()){
      const el = document.createElement('div');
      el.className = 'hesap-merkez';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-labelledby', 'hesap-merkez-baslik');
      el.setAttribute('data-hesap-panel', '');
      el.setAttribute('data-hesap-merkez', '');
      el.innerHTML = '<div class="hesap-merkez__kart" tabindex="-1"></div>';
      document.body.appendChild(el);
      document.documentElement.classList.add('hesap-merkez-acik');
    }
    merkezTazele();
    const kart = document.querySelector('[data-hesap-merkez] .hesap-merkez__kart');
    try{ kart.focus({ preventScroll:true }); }catch(e){ /* odaklanamadı */ }
    return merkezYukle();
  }
  function merkezKapat(){
    if(typeof document === 'undefined') return;
    const el = document.querySelector('[data-hesap-merkez]');
    const once = merkez && merkez.once;
    merkez = null;
    if(!el) return;
    el.remove();
    document.documentElement.classList.remove('hesap-merkez-acik');
    if(once && once.isConnected && once.focus){ try{ once.focus({ preventScroll:true }); }catch(e){ /* yok */ } }
  }
  function merkezGit(s, ek){
    if(!merkez) return;
    Object.assign(merkez, { mesaj:'', onay:false, silOnay:false }, ek || {});
    merkez.yigin.push(s);
    merkezTazele('ileri');
    if(s === 'etkinlik') sayfaVerisi(() => etkinlik().then(l => { merkez.etkinlik = l; }));
    /* Listeler her girişte tazelenir (başka cihazdan değişmiş olabilir). */
    if(s === 'cihazlar') sayfaVerisi(() => cihazlar().then(l => { merkez.cihazlar = l; }));
    if(s === 'yonetim') sayfaVerisi(() => kullanicilar().then(v => { merkez.kullanicilar = v.kullanicilar || []; merkez.kayit = v.kayit; }));
  }
  function merkezGeri(){
    if(!merkez || merkez.yigin.length < 2) return merkezKapat();
    merkez.yigin.pop();
    Object.assign(merkez, { mesaj:'', onay:false, silOnay:false });
    merkezTazele('geri');
  }
  function sayfaVerisi(fn){
    const m = merkez;
    fn().then(() => { if(merkez === m && !merkezKirli()) merkezTazele(); }, e => {
      if(merkez !== m) return;
      if(e && e.kod === 401) return oturumKapandi();
      m.uyari = e && e.kod === 0 ? 'Bilgisayara ulaşılamıyor; son bilinen bilgiler gösteriliyor.' : ((e && e.message) || '');
      if(!merkezKirli()) merkezTazele();
    });
  }
  /* Sayfadaki düğme işi: hata düğmenin yakınına yazılır, sayfa çizilmez. */
  async function merkezIs(fn, hataYeri){
    const m = merkez;
    try{
      const mesaj = await fn();
      if(merkez !== m) return;
      m.mesaj = mesaj || '';
      merkezTazele();
    }catch(e){
      if(merkez !== m) return;
      if(e && e.kod === 401 && /^Oturum/.test(e.message || '')) return oturumKapandi();
      const metin = e && e.kod === 0 ? baglantiHatasi() : (e && e.message) || 'İşlem yapılamadı.';
      const el = hataYeri && document.querySelector(hataYeri);
      if(el){ el.textContent = metin; el.hidden = false; }
      else{ m.mesaj = ''; m.uyari = metin; merkezTazele(); }
    }
  }

  /* ------------------------------------------------------- kısa panel */

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
    return '<button type="button" class="hesap-kisa" data-hesap="merkez" aria-label="' + kac('Hesap ayarları — ' + (o.g || o.a)) + '">'
      + avatar(o.g || o.a, o.k, 40)
      + '<span class="hesap-oge__metin"><b>' + kac(o.g || o.a) + '</b><small>@' + kac(o.a) + (o.pa ? ' · ' + kac(o.pa) : '') + '</small></span>'
      + ikon('ileri', 'hesap-satir__ok') + '</button>'
      + durumSatiri + mesaj
      + '<div class="hesap__eylem">'
      +   '<button type="button" class="hesap__ana" data-hesap="esitle">Şimdi eşitle</button>'
      +   '<button type="button" class="hesap__ikinci" data-hesap="cikis">Çıkış yap</button>'
      + '</div>';
  }

  function panelHtml(){
    return '<div class="katman kmenu kmenu--hesap" role="dialog" aria-label="Hesap ve eşitleme" data-hesap-panel>'
      + '<div class="hesap__bas"><p class="kmenu__bas">Hesap</p>'
      + '<button type="button" class="hesap__kapat" data-katman-kapat aria-label="Hesabı kapat">'
      + ikon('kapat') + '</button></div>'
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

  /* ------------------------------------------------------- seçim sayfasının çipi

     Modül seçim sayfasında (giriş bir kez orada) sağ üstte: girişliyken
     monogram ve görünen ad (hesap sayfasını açar), değilken «Giriş yap». */
  function cipTazele(){
    if(typeof document === 'undefined') return;
    const el = document.querySelector('[data-hesap-cip]');
    if(!el) return;
    const o = oturum();
    el.hidden = !o && !(sunucu || ortam.yerelUygulama());
    const html = o ? avatar(o.g || o.a, o.k, 28) + '<span>' + kac(o.g || o.a) + '</span>' : '<span>Giriş yap</span>';
    if(el.getAttribute('data-cizim') !== html){
      el.innerHTML = html;
      el.setAttribute('data-cizim', html);
    }
    el.classList.toggle('is-girisli', !!o);
    el.setAttribute('aria-label', o ? 'Hesap — ' + (o.g || o.a) : 'Giriş yap');
  }

  function deger(id){ const e = document.getElementById(id); return e ? e.value : ''; }

  async function formIsle(tur, form){
    const kapida = !!(form.closest && form.closest('[data-hesap-kapi]'));
    const merkezde = !!(form.closest && form.closest('[data-hesap-merkez]'));
    const dugmeEl = form.querySelector('button[type=submit]');
    if(dugmeEl) dugmeEl.disabled = true;
    const adres = () => (document.getElementById('hesap-adres') ? deger('hesap-adres') : null);
    let mesaj = '', ciz = false, hata = false;
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
        if(deger('hesap-yeni') !== deger('hesap-yeni2')) throw new Error('İki şifre aynı değil.');
        await parolaDegistir(deger('hesap-eski'), deger('hesap-yeni'));
        mesaj = 'Şifre değişti. Öteki cihazlarda yeniden giriş gerekir.';
      }else if(tur === 'soru-ayarla'){
        await soruAyarla(deger('hesap-soru-sifre'), deger('hesap-yeni-soru'), deger('hesap-yeni-cevap'));
        if(merkez && merkez.ben) merkez.ben.soru_var = true;
        mesaj = 'Kurtarma sorusu kaydedildi.';
      }else if(tur === 'profil'){
        const r = form.querySelector('input[name="hesap-renk"]:checked');
        /* Kişisel alanlar formda yoksa (sunucu cevabı gelmedi) gönderilmez. */
        const ek = document.getElementById('hesap-hitap')
          ? { hitap:deger('hesap-hitap'), dogum:deger('hesap-dogum'), eposta:deger('hesap-eposta') } : {};
        const k = await profilAyarla(deger('hesap-gorunen'), r ? r.value : null, ek);
        if(merkez && merkez.ben) merkez.ben.kullanici = k;
        mesaj = 'Profil kaydedildi.';
      }else if(tur === 'kullanici-ekle'){
        const u = await kullaniciEkle(deger('hesap-yeni-ad').trim(), deger('hesap-yeni-sifre'));
        if(merkez){ const v = await kullanicilar(); merkez.kullanicilar = v.kullanicilar || []; }
        mesaj = '«' + u.ad + '» eklendi. Geçici şifreyi ona sen söyle.';
      }else if(tur === 'sil'){
        await hesabiSil(deger('hesap-sil-sifre'));
        return;                                         // sayfa kapandı, giriş ekranı açık
      }
    }catch(e){
      hata = true;
      mesaj = e && e.kod === 0 ? baglantiHatasi() : (e && e.message) || 'İşlem yapılamadı.';
    }finally{
      if(dugmeEl) dugmeEl.disabled = false;
    }
    if(kapida){
      if(ciz && !hata && kapiAcikMi()) kapiTazele('ileri');
      else mesajYaz(mesaj);
    }else if(merkezde){
      if(hata){
        const el = form.querySelector('.hesap__mesaj');
        if(el){ el.textContent = mesaj; el.hidden = !mesaj; }
      }else if(merkez){
        merkez.mesaj = mesaj;
        merkez.acik = {};
        const kart = document.querySelector('[data-hesap-merkez] .hesap-merkez__kart');
        if(kart) kart.innerHTML = merkezHtml();     // form temizlenir, açılır bölüm kapanır
      }
    }else{
      panelMesaj = mesaj;
      panelTazele();
    }
  }

  /* Seçilen renk ve yazılan ad önizlemede hemen görünür (kaydetmeden). */
  function onizle(form){
    const kap = document.querySelector('[data-hesap-onizleme]');
    if(!kap) return;
    const r = form.querySelector('input[name="hesap-renk"]:checked');
    const ad = deger('hesap-gorunen') || kim().ad;
    kap.innerHTML = avatar(ad, r ? r.value : kim().k, 64);
  }

  function eylem(ad, is){
    if(ad === 'esitle'){
      panelMesaj = '';
      esitle().then(() => { panelTazele(); const k = document.getElementById('hesap-esit-kisa'); if(k) k.textContent = esitKisa(); });
    }else if(ad === 'cikis'){
      panelMesaj = '';
      cikisYap().then(() => {
        merkezKapat();
        if(L.KABUK) L.KABUK.katmanKapat();
        if(kapiGerekli()) kapiAc();
      });
    }else if(ad === 'beta') betaGir();
    else if(ad === 'unuttum') kapiGit('unuttum', { ad:deger('hesap-ad').trim() });
    else if(ad === 'gorunum') kapiGit(is.getAttribute('data-gorunum'));
    else if(ad === 'hatirla'){
      const a = is.getAttribute('data-ad');
      kapiGit('giris', { secili:hatirlananlar().find(x => x.a === a) || null });
    }else if(ad === 'unut'){ unut(is.getAttribute('data-ad')); kapiTazele(); }
    else if(ad === 'goster'){
      const inp = is.parentElement && is.parentElement.querySelector('input');
      if(!inp) return;
      const ac = inp.type === 'password';
      inp.type = ac ? 'text' : 'password';
      is.setAttribute('aria-pressed', ac ? 'true' : 'false');
      is.setAttribute('aria-label', ac ? 'Şifreyi gizle' : 'Şifreyi göster');
    }else if(ad === 'merkez') merkezAc();
    else if(ad === 'merkez-kapat') merkezKapat();
    else if(ad === 'sayfa') merkezGit(is.getAttribute('data-sayfa'));
    else if(ad === 'geri') merkezGeri();
    else if(ad === 'kisi') merkezGit('kisi', { kisi:Number(is.getAttribute('data-id')) });
    else if(ad === 'cihaz-cikar'){
      const id = Number(is.getAttribute('data-id'));
      is.disabled = true;
      merkezIs(async () => {
        await cihazCikar(id);
        if(merkez) merkez.cihazlar = await cihazlar();
        return 'Oturum kapatıldı.';
      });
    }else if(ad === 'otekiler' || ad === 'otekiler-vazgec'){
      if(merkez){ merkez.onay = ad === 'otekiler'; merkez.mesaj = ''; merkezTazele(); }
      const d = merkez && merkez.onay && document.querySelector('[data-hesap="otekiler-evet"]');
      if(d){ try{ d.focus(); }catch(e){ /* yok */ } }
    }else if(ad === 'otekiler-evet'){
      is.disabled = true;
      merkezIs(async () => {
        const n = await otekilerdenCik();
        if(merkez){ merkez.onay = false; merkez.cihazlar = await cihazlar(); }
        return n ? n + ' cihazda oturum kapandı.' : 'Öteki cihaz yoktu.';
      });
    }else if(ad === 'indir'){
      is.disabled = true;
      merkezIs(async () => {
        const v = await disaAktar();
        return v.ad + ' hazır · ' + v.kayit.toLocaleString('tr-TR') + ' kayıt.';
      });
    }else if(ad === 'sil-ac' || ad === 'sil-vazgec'){
      if(!merkez) return;
      merkez.silOnay = ad === 'sil-ac';
      merkez.mesaj = '';
      merkezTazele();
      const f = merkez.silOnay && document.getElementById('hesap-sil-sifre');
      if(f){ try{ f.focus(); }catch(e){ /* yok */ } }
    }else if(ad === 'kayit-ayar'){
      const yeni = is.getAttribute('aria-checked') !== 'true';
      is.disabled = true;
      merkezIs(async () => {
        const v = await kayitAyarla(yeni);
        if(merkez) merkez.kayit = v;
        return v ? 'Yeni hesap açma açık.' : 'Yeni hesap açma kapalı.';
      });
    }else if(ad === 'yonet'){
      const alan = is.getAttribute('data-alan'), d = is.getAttribute('data-deger');
      if(is.getAttribute('aria-pressed') === 'true' || !merkez) return;
      const id = merkez.kisi;
      merkezIs(async () => {
        const u = await yonet(id, { [alan]:d });
        if(merkez && merkez.kullanicilar){
          merkez.kullanicilar = merkez.kullanicilar.map(x => (x.id === u.id ? Object.assign({}, x, u) : x));
        }
        return 'Kaydedildi.';
      }, '[data-hesap-kisi-mesaj]');
    }
  }

  let bagli = false, basilan = null;
  function bagla(){
    if(bagli || typeof document === 'undefined') return;
    bagli = true;
    document.addEventListener('pointerdown', e => { basilan = e.target; }, true);
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      const d = t.closest('.ust__hesap');
      if(d){ e.preventDefault(); hesapDugmesi(d); return; }
      const cip = t.closest('[data-hesap-cip]');
      if(cip){
        e.preventDefault();
        if(oturum()) merkezAc(); else if(sunucu || ortam.yerelUygulama()) kapiAc();
        return;
      }
      /* Sayfanın dışına (karartmaya) dokunmak sayfayı kapatır; kartın
         içinde başlayıp dışarıda biten sürükleme (yazı seçme) kapatmaz. */
      if(t.matches && t.matches('[data-hesap-merkez]')){ if(basilan === t) merkezKapat(); return; }
      const is = t.closest('[data-hesap-panel] [data-hesap]');
      if(!is) return;
      eylem(is.getAttribute('data-hesap'), is);
    });
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-hesap-form]') : null;
      if(!f) return;
      e.preventDefault();
      formIsle(f.getAttribute('data-hesap-form'), f);
    });
    const yazi = e => {
      const t = e.target;
      if(!t || !t.closest || !t.closest('[data-hesap-panel]')) return;
      if(t.hasAttribute && t.hasAttribute('data-sifre')) gucTazele(t);
      const f = t.closest('[data-hesap-form="profil"]');
      if(f) onizle(f);
    };
    document.addEventListener('input', yazi);
    document.addEventListener('change', yazi);
    /* Büyük harf kilidi: şifre alanında basılan tuştan okunur. */
    const caps = e => {
      const t = e.target;
      if(!t || !t.hasAttribute || !t.hasAttribute('data-sifre') || typeof e.getModifierState !== 'function') return;
      const f = t.closest('form');
      const c = f && f.querySelector('.hesap__caps');
      if(c) c.hidden = !e.getModifierState('CapsLock');
    };
    document.addEventListener('keydown', caps);
    document.addEventListener('keyup', caps);
    /* Esc ve sekme tuşu: açık karttan dışarı çıkılmaz (aria-modal). */
    document.addEventListener('keydown', e => {
      const kok = document.querySelector('[data-hesap-kapi]') || document.querySelector('[data-hesap-merkez]');
      if(!kok) return;
      if(e.key === 'Escape'){
        if(kok.hasAttribute('data-hesap-merkez')){ e.preventDefault(); e.stopPropagation(); merkezGeri(); }
        else if(kapi.gorunum !== 'karsila'){ e.preventDefault(); e.stopPropagation(); kapiGit(kapi.gorunum === 'unuttum' ? 'giris' : 'karsila'); }
        return;
      }
      if(e.key !== 'Tab') return;
      const odak = Array.from(kok.querySelectorAll('button, [href], input:not([type=hidden]), textarea, select, summary'))
        .filter(el => !el.disabled && el.getClientRects().length && !(el.type === 'radio' && !el.checked));
      if(!odak.length) return;
      const ilk = odak[0], son = odak[odak.length - 1], a = document.activeElement;
      if(!kok.contains(a) || a === kok.firstElementChild){ e.preventDefault(); (e.shiftKey ? son : ilk).focus(); }
      else if(e.shiftKey && a === ilk){ e.preventDefault(); son.focus(); }
      else if(!e.shiftKey && a === son){ e.preventDefault(); ilk.focus(); }
    }, true);
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
      cipTazele();
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
    if(cizimId != null) ortam.iptal(cizimId);
    erteleId = null; yenileId = null; cizimId = null; cizimler.length = 0;
    ayar = null; hal = { durum:'bilinmiyor', mesaj:'' }; sunucu = null;
    aktif = null; siradaki = null; panelMesaj = ''; onayBitis = 0;
    modelBekliyor = false; ekranBekliyor = false; tazeleme = null; profilTazelendi = false;
    kapi = { gorunum:'karsila', soru:null, ad:'', adres:null, secili:null, ilk:true };
    kapiKapat();
    merkezKapat();
  }

  /* Modül seçim sayfası (sistem/sunucu.py giris_html, telefonda da): giriş
     bir kez orada yapılır; çerez kapıya bakmadığı için üç modül girişli açılır. */
  try{
    const b = typeof document !== 'undefined' && document.currentScript;
    if(b && b.hasAttribute('data-giris')) kur({ modul:'giris' });
  }catch(e){ /* sayfa dışında (test) */ }

  return {
    kur, esitle, yokla, degisti, girisYap, kayitOl, soruGetir, kurtar, cikisYap, parolaDegistir, soruAyarla,
    betaGir, kapiAc, kapiAcikMi, dugme, durum, dinle, silmeNotu, panelHtml, adresDuzelt, cihazKimligi, cizIste,
    ben, profilAyarla, cihazlar, cihazCikar, otekilerdenCik, kullanicilar, yonet, kayitAyarla, kullaniciEkle,
    merkezAc, merkezKapat, merkezAcikMi, hatirlananlar, unut, sifreGucu, etkinlik, disaAktar, hesabiSil,
    _ortam:ortam, _sifirla, _istek:istek,
    CEREZ, ONEK,
  };
})();
