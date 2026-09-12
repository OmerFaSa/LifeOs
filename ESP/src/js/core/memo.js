/* ÇİZİM ÖNBELLEĞİ — bir karede aynı hesabı iki kez yapma.

   Sorun ölçülerek bulundu. Beş yıllık veriyle ofis ekranı 996 ms
   sürüyordu ve sebep ağır bir fonksiyon değildi: AYNI fonksiyonun
   tek çizimde defalarca çağrılmasıydı.

     Bio.attention()        12 kez
     Bio.overdue()          11 kez
     Calc.crossFindings()    9 kez
     Office.notes()          9 kez

   Bunlar birbirini çağırıyor: her masa kendi notunu süzmek için
   notes()'un TAMAMINI üretiyor, patron brifingi crossFindings()'i
   yeniden hesaplıyor, başlık/istatistik/alt başlık üçlüsü aynı şeyi
   bir kez daha istiyor. Boş veriyle hiçbiri görünmüyordu; denetim
   koşumları sekiz ölçümle çalışıyor, beş yılla değil.

   ─────────────────────────────────────────────────────────────

   ÇÖZÜMÜN SINIRI ÖNEMLİ: önbellek YALNIZCA bir çizim boyunca yaşar.
   Çizim başlarken açılır, biterken kapanır ve boşaltılır. Kare
   dışında `of()` hiçbir şey saklamaz, doğrudan hesabı çağırır.

   Bu bilerek seçildi. Kalıcı bir önbellek "durum değişti mi?"
   sorusunu sormak zorundadır ve o soru yanlış cevaplanırsa sistem
   ESKİ SAYIYI gösterir — bu sistemde bir sayının yanlış olması, geç
   gelmesinden çok daha kötüdür. Kare önbelleğinde böyle bir soru
   yoktur: veri kare içinde değişmez.

   KURAL: buraya konan bir değer PAYLAŞILIR. Çağıran onu
   değiştiremez. Diziyi sıralamak, itmek, eleman silmek yasaktır;
   `filter`/`map`/`slice` zaten kopya döndürür. */

window.ESP = window.ESP || {};

ESP.Memo = (function(){
  let acik = false;
  const kutu = new Map();

  /* Kare başladı: önbellek açılır ve boş başlar. */
  function baslat(){ acik = true; kutu.clear(); }

  /* Kare bitti: önbellek kapanır ve boşalır. Kapalıyken `of()`
     saklamaz — testler ve kare dışı çağrılar hep taze hesap alır. */
  function bitir(){ acik = false; kutu.clear(); }

  function of(anahtar, uret){
    if(!acik) return uret();
    if(kutu.has(anahtar)) return kutu.get(anahtar);
    const v = uret();
    kutu.set(anahtar, v);
    return v;
  }

  /* Ölçüm için: kare içinde kaç ayrı hesap saklandı? */
  function boyut(){ return kutu.size; }
  function acikMi(){ return acik; }

  return { of, baslat, bitir, boyut, acikMi };
})();
