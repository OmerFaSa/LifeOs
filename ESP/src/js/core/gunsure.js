/* TARIHLI GUNLUK SURE — temel taban + tarihli istisna (AYS istisna.js'in
   ESP karsiligi).

   «Carsamba 2 saat calisacagim» ya da «bu hafta gunde 20 dakika» denince
   TEMEL (profile.dailyMinutes) degismez. Degisiklik bitis tarihi olan bir
   kayit olarak durur; tarihi gecince taban kendiliginden temele doner.
   Temeli ezmek, «bir haftaligina» denen seyi kalici yapardi.

   Mola gunu burada DEGILDIR: hasta/izin/tatil gunleri seriyi dondurur
   (brand/ortak/seri.js); kotu gun bugunu asgari gune indirir (kotugun.js).
   Bu modul yalniz tabanin DAKIKASINI tarihle degistirir.

   Degismezler:
     1. GECMISE YAZILMAZ. Kayit bugunden once baslayamaz: gecmis bir gunun
        olcutunu sonradan degistirmek, o gunun «taban doluluğu»nu geriye
        donuk yeniden yazmak olurdu.
     2. SON EKLENEN KAZANIR. Ayni gune iki kayit dusuyorsa sonraki gecerlidir.
     3. AKSIYON SEVIYESI (AGENTS §1.9): tek gun KUCUK (sormadan, «Geri al»),
        birden cok gun ORTA (onizleme + onay). Seviyeyi bu modul soyler. */

window.ESP = window.ESP || {};

ESP.GunSure = (function(){
  const U = () => ESP.U;
  const KEY = 'meta/gunSure';
  const DAKIKA = { min:10, max:720 };
  const EN_UZUN = 42;
  const MAX = 60;
  const ISO = /^\d{4}-\d{2}-\d{2}$/;

  function kayitlar(){
    if(!Array.isArray(ESP.S.gunSure)) ESP.S.gunSure = [];
    return ESP.S.gunSure;
  }
  function temel(){
    const n = ESP.S.profile && ESP.S.profile.dailyMinutes;
    return (typeof n === 'number' && isFinite(n) && n > 0) ? n : 60;
  }
  function gunFarki(a, b){ return Math.round((U().parse(b) - U().parse(a)) / 86400000); }

  async function yukle(){
    const d = await ESP.Store.get(KEY);
    ESP.S.gunSure = Array.isArray(d) ? d.filter(x => x && ISO.test(x.bas) && ISO.test(x.bit)) : [];
    return ESP.S.gunSure;
  }
  async function kaydet(){
    /* Bitmis kayitlar bir sure tutulur (gecmisin olcutu okunabilsin), sonra
       en eskiden atilir. */
    const liste = kayitlar();
    if(liste.length > MAX) liste.splice(0, liste.length - MAX);
    await ESP.Store.set(KEY, liste);
  }

  /* {dakika, kaynak:'istisna'|'profil', kayit} — o gunun tabani. */
  function taban(gunISO){
    const g = gunISO || U().todayISO();
    const liste = kayitlar();
    for(let i = liste.length - 1; i >= 0; i--){
      const k = liste[i];
      if(k.bas <= g && g <= k.bit) return { dakika:k.dakika, kaynak:'istisna', kayit:k };
    }
    return { dakika:temel(), kaynak:'profil', kayit:null };
  }

  function seviye(bas, bit){ return bas === (bit || bas) ? 'kucuk' : 'orta'; }

  /* Ekrana gidecek sozlesme: kullanici ne olacagini onaydan ONCE gorur. */
  function onizleme(bas, bit, dakika){
    bit = bit || bas;
    const gun = gunFarki(bas, bit) + 1;
    const ne = gun === 1 ? U().fmtDate(bas) : U().fmtRange(bas, bit) + ' (' + gun + ' gün)';
    return { gun, seviye:seviye(bas, bit),
      metin:ne + ': günlük taban ' + U().fmtMin(Math.round(Number(dakika))) + ' (temel '
        + U().fmtMin(temel()) + '). Tarihi geçince temel kendiliğinden geri gelir.' };
  }

  function denetle(bas, bit, dakika){
    bit = bit || bas;
    if(!ISO.test(String(bas)) || !ISO.test(String(bit))) return 'Tarih geçersiz.';
    if(bas > bit) return 'Bitiş tarihi başlangıçtan önce olamaz.';
    if(bas < U().todayISO()) return 'Geçmiş bir günün süresi sonradan değiştirilmez.';
    if(gunFarki(bas, bit) + 1 > EN_UZUN) return 'Tek seferde en çok ' + EN_UZUN + ' gün.';
    const dk = Number(dakika);
    if(!isFinite(dk) || dk < DAKIKA.min || dk > DAKIKA.max) {
      return 'Süre ' + DAKIKA.min + '–' + DAKIKA.max + ' dakika arasında olmalı.';
    }
    return null;
  }

  async function ekle(bas, bit, dakika){
    bit = bit || bas;
    const hata = denetle(bas, bit, dakika);
    if(hata) return { ok:false, why:hata };
    const kayit = { id:'gs-' + bas + '-' + Math.random().toString(36).slice(2, 7),
      bas, bit, dakika:Math.round(Number(dakika)), at:new Date().toISOString() };
    kayitlar().push(kayit);
    await kaydet();
    return { ok:true, kayit, seviye:seviye(bas, bit) };
  }

  async function kaldir(id){
    const liste = kayitlar();
    const i = liste.findIndex(k => k.id === id);
    if(i < 0) return { ok:false, why:'Kayıt bulunamadı.' };
    const [k] = liste.splice(i, 1);
    await kaydet();
    return { ok:true, kayit:k };
  }

  /* Bugun ve sonrasini etkileyen kayitlar (ekranda listelenir). */
  function gecerliListe(){
    const bugun = U().todayISO();
    return kayitlar().filter(k => k.bit >= bugun);
  }
  function liste(){ return kayitlar().slice(); }

  return { yukle, taban, seviye, onizleme, denetle, ekle, kaldir, gecerliListe, liste,
    DAKIKA, EN_UZUN };
})();
