/* YETKİ — King'in sistem içindeki değişiklikleri yaptığı kapalı katalog.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/yetki.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   Depo sahibinin kararı (2026-10-17): «King'in her şeye yetkisi olsun:
   onaylama, değiştirme, bir modülü sıfırdan başlatma gibi en köklü
   değişiklikler bile; kişinin kendi hesabı hariç.»

   Sözler:
   1. KAPALI KATALOG (AGENTS §1.1). King cümleyi buradaki tipli bir eyleme
      çevirir; eylemi modülün KENDİ kodu uygular (öneri kapısı, kayıt
      deposu, profil). Katalogda olmayan iş yapılmaz; model eylem uyduramaz.
   2. SEVİYEYİ KATALOG BELİRLER (§1.9).
        küçük  hemen uygulanır, «Geri al» kalır
        orta   önizleme + tek onay
        büyük  ayrıntılı önizleme + açık onay + ÖNCE dönüş noktası.
      Büyük eylem «evet» ile değil, yalnız «onaylıyorum» ya da düğmeyle
      uygulanır.
   3. HESAP DIŞARIDA. Parola, iki adım, cihazlar, yönetici, e-posta, hesap
      silme, oturum: King bunlara dokunmaz; söyler, kullanıcı Hesap
      sayfasından yapar.
   4. ÖLÇÜM UYDURULMAZ (§1.1–1.2). Hiçbir eylem ölçülmüş ya da hesaplanmış
      bir sayıyı kendiliğinden değiştirmez. Sıfırlama kaydı siler, sayı
      üretmez; dönüş noktasıyla geri gelir.
   5. DÖNÜŞ NOKTASI. Büyük eylemden önce modülün bütün kaydı
      (`donus.al()`, modülde Store.exportAll) bu cihazda DONUS anahtarına
      yazılır. «Dönüş noktasına dön» onu modülün kendi içe aktarmasıyla
      geri koyar. Fotoğraflar dönüş noktasına girmez; önizleme söyler.
      Yazılamazsa (yer yok) sıfırlama yapılmaz.
   6. OLUMSUZ İSTEK EYLEM DEĞİLDİR. «verileri sıfırlama», «temayı
      değiştirme» hiçbir şey yapmaz (LIFEOS.Olumsuz, eylemEngeli).
   8. MODÜLÜN KENDİ EYLEMLERİ (2026-10-19, depo sahibi: «King neredeyse
      her şeyi yapsın, toplantı başlatsın»). Modül kur'da `eylemler` verir:
      aynı biçimde (id, seviye, ad, anla, onizle, uygula); yalnız küçük ve
      orta seviye kabul edilir (büyük eylem dönüş noktası ister, katalogda
      kalır). Eylemi yine modülün kendi kodu uygular; kimliği katalogdakiyle
      çakışan eylem alınmaz.
   7. BAŞKA MODÜLÜN İŞİ ORADA YAPILIR. «SPİ'yi sıfırla» AYS'de istenirse
      AYS bunu yapmaz; King o modüle geçmeyi önerir (kayıtlar ayrı
      kökende, ayrı depoda). */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.YETKI = (function(){
  const L = window.LIFEOS;
  const DONUS = 'lifeos.king.donus';
  const MODUL_AD = { ays:'AYS', spi:'SPİ', esp:'ESP' };
  const SEVIYE_AD = { kucuk:'küçük', orta:'orta', buyuk:'büyük' };

  let ayar = null;

  const ortam = {
    depo:{
      oku:k => { try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } },
      yaz:(k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } },
      sil:k => { try{ localStorage.removeItem(k); }catch(e){ /* yok */ } },
    },
    simdi:() => new Date(),
  };

  const kucult = s => String(s || '').toLocaleLowerCase('tr').replace(/[’']/g, '\'').trim();
  const B = '(?<![a-zçğıöşü])';

  /* Hesap: King'in dokunmadığı tek alan (söz 3). */
  const HESAP_RE = new RegExp(B + '(parola|şifre|iki adım|2fa|doğrulama kodu|yedek kod|hesab(?:ım|ımı|ımın|ı sil)|e-?posta(?:mı)?|kullanıcı adı|'
    + 'cihaz(?:ı|ları|larımı) (?:çıkar|sil|kaldır|bağla)|yönetici|admin|oturumu? kapat|çıkış yap|kurtarma sorusu)');

  /* Modül adı geçiyor mu: «spi'yi sıfırla». */
  const MODUL_RE = { ays:/(?<![a-zçğıöşü])ays|sınav sistemi/, spi:/(?<![a-zçğıöşü])sp[iı]|sağlık sistemi/, esp:/(?<![a-zçğıöşü])esp|gelişim sistemi/ };
  function anilanModul(t){
    return Object.keys(MODUL_RE).filter(m => MODUL_RE[m].test(t));
  }

  /* Katalog fiillerinin olumsuz emri; Olumsuz süzgecinin sözlüğüne ek. */
  const OLUMSUZ_RE = new RegExp(B + '(?:geçme|yapma|değiştirme|kapatma|açma|silme|sıfırlama|onaylama|reddetme|durdurma|başlatma|istemiyorum|etme)(?![a-zçğıöşü])');
  function olumsuz(metin){
    if(OLUMSUZ_RE.test(kucult(metin))) return true;
    const O = L.Olumsuz;
    try{ return !!(O && O.eylemEngeli && O.eylemEngeli(metin)); }catch(e){ return false; }
  }

  /* ------------------------------------------------------------ katalog */

  function temaSec(t){
    if(/(koyu|karanlık|gece) (tema|mod|görünüm)|temayı (koyu|karanlık)|karanlık moda/.test(t)) return 'dark';
    if(/(açık|aydınlık|gündüz) (tema|mod|görünüm)|temayı (açık|aydınlık)/.test(t)) return 'light';
    if(/(sistem(?:e uy)?|otomatik) (tema|görünüm)|temayı (sisteme|otomatiğe)/.test(t)) return 'system';
    return null;
  }
  const TEMA_AD = { dark:'koyu', light:'açık', system:'sisteme uyan' };
  const ANIM_AD = { tam:'tam', az:'az', sistem:'sisteme uyan' };
  const ZEMIN_AD = { yumusak:'canlı', sade:'sade' };

  const EYLEMLER = [
    {
      id:'tema', seviye:'kucuk', ad:'Tema',
      anla:t => { const v = temaSec(t); return v && ayar.tema ? { v } : null; },
      onizle:p => ({ metin:'Tema ' + TEMA_AD[p.v] + ' olacak.' }),
      async uygula(p){
        const eski = ayar.tema.oku();
        await ayar.tema.yaz(p.v);
        return { metin:'Temayı ' + TEMA_AD[p.v] + ' yaptım.', geriAl:async () => { await ayar.tema.yaz(eski); } };
      },
    },
    {
      id:'animasyon', seviye:'kucuk', ad:'Animasyonlar',
      anla:t => {
        if(!L.ANIMASYON || !/animasyon|hareket(ler)?i/.test(t)) return null;
        if(/kapat|azalt|kıs|az olsun|sakin/.test(t)) return { v:'az' };
        if(/aç|tam|artır|geri getir/.test(t)) return { v:'tam' };
        if(/sistem/.test(t)) return { v:'sistem' };
        return null;
      },
      onizle:p => ({ metin:'Animasyonlar ' + ANIM_AD[p.v] + ' olacak.' }),
      async uygula(p){
        const A = L.ANIMASYON, eski = A.kip();
        A.ayarla(p.v);
        return { metin:'Animasyonları ' + ANIM_AD[p.v] + ' yaptım.', geriAl:async () => { A.ayarla(eski); } };
      },
    },
    {
      id:'zemin', seviye:'kucuk', ad:'Zemin',
      anla:t => {
        if(!L.ZEMIN || !/zemin|arka ?plan/.test(t)) return null;
        if(/sade|düz|sakin/.test(t)) return { v:'sade' };
        if(/canlı|renkli|yumuşak/.test(t)) return { v:'yumusak' };
        return null;
      },
      onizle:p => ({ metin:'Zemin ' + ZEMIN_AD[p.v] + ' olacak.' }),
      async uygula(p){
        const Z = L.ZEMIN, eski = Z.kip();
        Z.ayarla(p.v);
        return { metin:'Zemini ' + ZEMIN_AD[p.v] + ' yaptım.', geriAl:async () => { Z.ayarla(eski); } };
      },
    },
    {
      id:'muzik', seviye:'kucuk', ad:'Müzik',
      anla:t => {
        if(!L.SES || !/müzi[kğ]|radyo|şarkı/.test(t)) return null;
        if(/durdur|kapat|kes|sustur/.test(t)) return { v:'dur' };
        /* «(Müzik çalıyor)» bir durumdur, istek değil (Whisper uydurması, 2026-10-19). */
        if(/aç|çal(?!ıyor|dı|ıyordu)|başlat/.test(t)) return { v:'cal' };
        return null;
      },
      onizle:p => ({ metin:p.v === 'dur' ? 'Müzik duracak.' : 'Müzik çalacak.' }),
      async uygula(p){
        const S = L.SES;
        if(p.v === 'dur'){ S.durdur(); return { metin:'Müziği durdurdum.', geriAl:async () => { S.cal(); } }; }
        S.cal();
        return { metin:'Müziği açtım.', geriAl:async () => { S.durdur(); } };
      },
    },
    {
      id:'onay-liste', seviye:null, ad:'Bekleyen onaylar',
      anla:t => ayar.onaylar && /bekleyen/.test(t)
        && !/(?<![a-zçğıöşü])(?:onayla|reddet|geç)(?![a-zçğıöşü])|onaylayabilir|onaylar mısın/.test(t) ? {} : null,
      onizle:() => null,
    },
    {
      id:'onay-hepsi', seviye:'orta', ad:'Bekleyenleri onayla',
      anla:t => ayar.onaylar && /(hepsini|tümünü|bütün(?:ünü)?|bekleyen(?:ler)?(?:i)?|önerileri|teklifleri) (de )?onayla(?:r mısın|yabilirsin)?(?![a-zçğıöşü])|onayla hepsini/.test(t) ? {} : null,
      onizle:() => {
        const l = bekleyenler();
        return l.length ? { metin:l.length + ' öneri onaylanacak; her biri modülün kendi kodundan geçer.', satirlar:l.slice(0, 8).map(x => x.metin) } : null;
      },
      async uygula(){
        const l = bekleyenler();
        let n = 0; const dusen = [];
        for(const x of l){
          let r = null;
          try{ r = await ayar.onaylar.onayla(x.id); }catch(e){ r = { ok:false, why:(e && e.message) || 'hata' }; }
          if(r && r.ok) n++; else dusen.push(x.metin + (r && r.why ? ': ' + r.why : ''));
        }
        return { metin:n + ' öneri onaylandı' + (dusen.length ? ', ' + dusen.length + ' tanesi uygulanamadı.' : '.'), satirlar:dusen };
      },
    },
    {
      id:'red-hepsi', seviye:'orta', ad:'Bekleyenleri geç',
      anla:t => ayar.onaylar && ayar.onaylar.reddet && /(hepsini|tümünü|bekleyen(?:ler)?(?:i)?|önerileri|teklifleri) (reddet|geç)(?![a-zçğıöşü])/.test(t) ? {} : null,
      onizle:() => {
        const l = bekleyenler();
        return l.length ? { metin:l.length + ' öneri geçilecek; hiçbiri uygulanmaz.', satirlar:l.slice(0, 8).map(x => x.metin) } : null;
      },
      async uygula(){
        const l = bekleyenler();
        let n = 0;
        for(const x of l){ try{ const r = await ayar.onaylar.reddet(x.id); if(!r || r.ok !== false) n++; }catch(e){ /* kart durur */ } }
        return { metin:n + ' öneri geçildi.' };
      },
    },
    {
      id:'sifirdan', seviye:'buyuk', ad:'Sıfırdan başlat',
      anla:t => ayar.donus && new RegExp('(sıfırdan başla(?:t|yalım|mak istiyorum)?|baştan başla(?:t|yalım)?|sıfırla(?:yalım)?(?![a-zçğıöşü])|'
        + '(?:bütün|tüm|tüm bu) (?:veri(?:ler)?(?:i|imi)?|kayıt(?:lar)?(?:ı|ımı)?) (?:sil|sıfırla)(?![a-zçğıöşü])|verileri sil(?![a-zçğıöşü])|her şeyi sil(?![a-zçğıöşü]))').test(t) ? {} : null,
      onizle:() => {
        const n = ayar.donus.sayi ? ayar.donus.sayi() : null;
        return { metin:MODUL_AD[ayar.modul] + ' sıfırdan başlayacak: bütün kayıtlar bu cihazdan ve hesaptan silinecek.',
          satirlar:[(n != null ? n + ' kayıt grubu silinecek.' : 'Bütün kayıtlar silinecek.'),
            'Önce dönüş noktası alınır; «Dönüş noktasına dön» dersen her şey geri gelir.',
            ayar.donus.foto || 'Bu cihazdaki fotoğraflar dönüş noktasına girmez.',
            'Hesabın, öteki modüller ve LifeOS ayarların değişmez.'] };
      },
      async uygula(){
        const kopya = ayar.donus.al();
        const nokta = { zaman:ortam.simdi().toISOString(), modul:ayar.modul, neden:'sifirdan', veri:kopya };
        /* Önce yazmayı dene; yer yoksa silme sonrası boşalan yere yaz, o da
           olmazsa kaydı geri koy ve dur (söz 5). */
        let yazildi = ortam.depo.yaz(DONUS, nokta);
        await ayar.donus.sil();
        if(!yazildi) yazildi = ortam.depo.yaz(DONUS, nokta);
        if(!yazildi){
          await ayar.donus.yukle(kopya);
          return { ok:false, metin:'Dönüş noktası bu cihaza yazılamadı (yer yok); hiçbir şeyi silmedim. Önce yedek alıp yer aç.' };
        }
        return { metin:MODUL_AD[ayar.modul] + ' sıfırdan başladı. Dönüş noktası bu cihazda duruyor.', yenile:true };
      },
    },
    {
      id:'donus', seviye:'buyuk', ad:'Dönüş noktasına dön',
      anla:t => ayar.donus && /(dönüş noktasına (?:dön|geri dön)|sıfırlamayı geri al|eski haline (?:getir|döndür|dön)|silineni geri getir|verilerimi geri (?:getir|yükle))/.test(t) ? {} : null,
      onizle:() => {
        const d = donusNoktasi();
        if(!d) return { yok:true, metin:'Bu cihazda dönüş noktası yok; geri koyacak bir şey bulamadım.' };
        return { metin:MODUL_AD[ayar.modul] + ' ' + tarihYaz(d.zaman) + ' anına dönecek.',
          satirlar:['O andan sonra girilen kayıtlar bu dönüşle silinir.', 'Modülün içe aktarması kendi geri alma yuvasını bırakır.'] };
      },
      async uygula(){
        const d = donusNoktasi();
        if(!d) return { ok:false, metin:'Bu cihazda dönüş noktası yok.' };
        await ayar.donus.yukle(d.veri);
        ortam.depo.sil(DONUS);
        return { metin:MODUL_AD[ayar.modul] + ' dönüş noktasına döndü.', yenile:true };
      },
    },
  ];

  /* Söz 8: modülün kendi eylemleri (küçük ve orta; kimliği çakışmayan). */
  function ekEylemler(){
    const l = ayar && Array.isArray(ayar.eylemler) ? ayar.eylemler : [];
    return l.filter(e => e && typeof e.id === 'string' && (e.seviye === 'kucuk' || e.seviye === 'orta')
      && typeof e.anla === 'function' && typeof e.onizle === 'function' && typeof e.uygula === 'function'
      && !EYLEMLER.some(x => x.id === e.id));
  }
  function hepsi(){ return EYLEMLER.concat(ekEylemler()); }

  function iki(n){ return (n < 10 ? '0' : '') + n; }
  function tarihYaz(iso){
    const d = new Date(iso);
    return isNaN(d) ? '' : iki(d.getDate()) + '.' + iki(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + iki(d.getHours()) + ':' + iki(d.getMinutes());
  }
  function bekleyenler(){
    try{ return ((ayar && ayar.onaylar && ayar.onaylar.bekleyen()) || []).filter(x => x && x.id != null).map(x => ({ id:x.id, metin:String(x.metin || 'Öneri') })); }
    catch(e){ return []; }
  }
  function donusNoktasi(){
    const d = ortam.depo.oku(DONUS);
    return d && ayar && d.modul === ayar.modul && d.veri ? d : null;
  }

  /* ------------------------------------------------------------- arayüz */

  function kur(o){
    ayar = Object.assign({ modul:'spi' }, o || {});
    return api;
  }

  /* Cümle → niyet. Dönüş:
       null                         katalogda yok (King kendi yoluna devam eder)
       { tur:'hesap', metin }       hesap işi; yapılmaz (söz 3)
       { tur:'olumsuz' }            olumsuz istek; hiçbir şey yapılmaz (söz 6)
       { tur:'baska', modul, metin} başka modülün işi (söz 7)
       { tur:'liste', satirlar, metin }
       { tur:'eylem', id, seviye, ad, param, onizle:{ metin, satirlar } } */
  function anla(metin){
    if(!ayar) return null;
    const t = kucult(metin);
    if(!t) return null;
    if(HESAP_RE.test(t)) return { tur:'hesap', metin:'Hesabına (parola, iki adım, cihazlar, yönetici, e-posta) dokunamam; onu yalnız sen Hesap sayfasından değiştirirsin.' };
    for(const e of hepsi()){
      let p = null;
      try{ p = e.anla(t); }catch(err){ p = null; }
      if(!p) continue;
      if(olumsuz(metin)) return { tur:'olumsuz' };
      const obur = anilanModul(t).filter(m => m !== ayar.modul);
      if(e.seviye === 'buyuk' && obur.length && anilanModul(t).indexOf(ayar.modul) < 0){
        return { tur:'baska', modul:obur[0], metin:MODUL_AD[obur[0]] + '’nin kayıtları kendi içinde durur; bunu ' + MODUL_AD[obur[0]] + '’de yapabilirim.' };
      }
      if(e.id === 'onay-liste'){
        const l = bekleyenler();
        return { tur:'liste', metin:l.length ? l.length + ' öneri onay bekliyor:' : 'Onay bekleyen öneri yok.', satirlar:l.slice(0, 8).map(x => x.metin), sayi:l.length };
      }
      const oz = e.onizle(p);
      if(!oz) return { tur:'liste', metin:'Onay bekleyen öneri yok.', satirlar:[], sayi:0 };
      if(oz.yok) return { tur:'liste', metin:oz.metin, satirlar:[], sayi:0 };
      return { tur:'eylem', id:e.id, seviye:e.seviye, seviyeAd:SEVIYE_AD[e.seviye], ad:e.ad, param:p, onizle:oz };
    }
    return null;
  }

  async function uygula(niyet){
    if(!ayar || !niyet || niyet.tur !== 'eylem') return { ok:false, metin:'Uygulanacak bir şey yok.' };
    const e = hepsi().find(x => x.id === niyet.id);
    if(!e) return { ok:false, metin:'Bu iş katalogda yok.' };
    try{
      const r = await e.uygula(niyet.param);
      return Object.assign({ ok:true }, r);
    }catch(err){
      return { ok:false, metin:'Uygulanamadı: ' + ((err && err.message) || 'bilinmeyen hata') };
    }
  }

  function katalog(){
    return hepsi().filter(e => e.seviye).map(e => ({ id:e.id, ad:e.ad, seviye:e.seviye }));
  }

  function _sifirla(){ ayar = null; }

  const api = { kur, anla, uygula, katalog, donusNoktasi, DONUS, HESAP_RE, kuruluMu:() => !!ayar, _ortam:ortam, _sifirla };
  return api;
})();
