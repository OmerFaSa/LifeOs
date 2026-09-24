/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/hkmbag.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* HKM BAĞI — bir modülde HKM'ye aynı anda TEK profil bağlanır.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/hkmbag.js`; `tools/ortak.py --yay` ile üç arayüzün
   `src/js/core/` klasörüne birebir kopyalanır.

   HKM profil bilmez: sync, hafıza, hedef ve yedek uçları yalnız modül
   adıyla anahtarlanır. Aynı cihazda iki profil (hane üyesi) ayrı ayrı
   bağlanınca iki kişinin uykusu aynı seriye yazılıyor, hafızası
   «unutuldu» oluyor, hedefleri ve yedeği birbirini eziyordu
   (ekip/HATALAR.md Y-7). Dokuz ay için en küçük doğru yol: bağı TEK
   profile vermek.

   Sözler:
     1. BAĞIN SAHİBİ CİHAZDA DURUR, profilde değil: profil anahtarının
        dışında, modül başına tek bir değer (`lifeos.hkm.sahip.<modül>`).
     2. İşareti açan profil bağı alır; bağ başkasındaysa açamaz ve kime
        ait olduğu söylenir. Kapatan (ya da silinen) profil bağı bırakır.
     3. Sahibi olmayan profilde `Beacon.settings().enabled` false döner:
        özet, geçmiş, yedek, hafıza, hedef, King ve BAM kanalları hep
        oradan geçtiği için hepsi birlikte susar. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.HkmBag = (function(){
  function anahtar(modul){ return 'lifeos.hkm.sahip.' + String(modul || ''); }

  function sahip(modul){
    try{ return localStorage.getItem(anahtar(modul)) || null; }
    catch(e){ return null; }
  }

  function izinli(modul, profil){
    const s = sahip(modul);
    return !s || s === String(profil);
  }

  function al(modul, profil){
    /* Profil bilinmiyorsa bag yazilmaz: «null» adli bir sahip, modulu
       kendi cihazinda kilitlerdi. */
    if(!profil) return { ok:true, sahip:null };
    const s = sahip(modul);
    if(s && s !== String(profil)) return { ok:false, sahip:s };
    try{ localStorage.setItem(anahtar(modul), String(profil)); }catch(e){}
    return { ok:true, sahip:String(profil) };
  }

  function birak(modul, profil){
    if(sahip(modul) !== String(profil)) return false;
    try{ localStorage.removeItem(anahtar(modul)); }catch(e){}
    return true;
  }

  function not(s){
    return 'HKM başka profile bağlı («' + s + '»). HKM profil ayırt etmediği için aynı '
      + 'anda tek profil bağlanabilir; bağlamak için önce o profilde işareti kapat.';
  }

  return { anahtar, sahip, izinli, al, birak, not };
})();
