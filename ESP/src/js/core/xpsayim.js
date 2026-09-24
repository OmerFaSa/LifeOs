/* XP sayımları — «o gün ne yapıldı» sorusunun tek cevabı.

   XP bir OLAY AKIŞI DEĞİL, verinin bir PROJEKSİYONUDUR. Onaltı ekrana
   onaltı `XP.kazan()` serpiştirmek iki şeyi kaçınılmaz kılardı: biri
   unutulur (o iş hiç puan vermez) ve birinin geri alma yolu yazılmaz
   (silinen kayıt puanı bırakır). Burada bir kez okunur, `XP.esitle()`
   defteri buna eşitler. Bu deponun doktrini zaten budur: sayıyı ve
   kararı kod üretir.

   Kazandırdığı üç şey:
     · Bir ekran unutulamaz — sayım verinin kendisinden gelir.
     · Silinen kayıt puanını bırakmaz — sayım düşer, XP düşer.
     · Tekrar çalışması zararsızdır — eşitleme fikri budur.

   NEDEN KABUKTA DEĞİL BURADA: bu bir arayüz işi değil, «hangi veri
   hangi işe sayılır» kararıdır — yani alan bilgisi. Kabuğun içinde
   dururken testten erişilemiyordu; oysa kataloğun ve sayımın birbirini
   tutması tam olarak sınanması gereken şey (bkz. src/tests/xp.test.js).

   Buradaki her satırın kataloğda bir karşılığı vardır ve TERSİ DE
   doğrudur; bir test bunu denetler. */

window.ESP = window.ESP || {};

ESP.XPSayim = (function(){
  const S = ESP.S, M = ESP.Model;

  /* Bir gün kümesi için TEK GEÇİŞ.

     Sekiz günü ayrı ayrı sormak, koleksiyonu sekiz kez taramak demekti.
     Dokuz aylık ağır bir defterde (2 000 kart × 40 tekrar = 80 000
     satır) ölçüldü:

         gün gün sorma   60,1 ms
         tek geçiş        7,5 ms

     Fark sekiz kat ve bedeli her tıklamadan sonra ödeniyordu. Koleksiyon
     bir kez gezilir, gün başına sayaç doldurulur. */
  function gunBasi(liste, tarihAlani, gunler){
    const say = {};
    gunler.forEach(g => { say[g] = 0; });
    (liste || []).forEach(x => {
      const g = String((x && x[tarihAlani]) || '').slice(0, 10);
      if(g in say) say[g]++;
    });
    return say;
  }

  function gunler(liste){
    const g = (liste && liste.length) ? liste : [ESP.U.todayISO()];

    /* Kart tekrarları kartın İÇİNDE (history) durur: iki katmanlı. */
    const kart = {};
    g.forEach(x => { kart[x] = 0; });
    (S.cards || []).forEach(c => {
      (c.history || []).forEach(h => {
        const gun = ESP.U.gunOf(String((h && h.at) || ''));
        if(gun in kart) kart[gun]++;
      });
    });

    const not = gunBasi(S.notes, 'createdAt', g);
    const taslak = gunBasi(S.drafts, 'createdAt', g);

    const out = {};
    g.forEach(gun => {
      out[gun] = {
        'esp.kart':kart[gun] || 0,
        /* Dakika: ölçülmemiş oturum sayılmaz — `minutesOf` null döner. */
        'esp.oturum':M.minutesOf(gun) || 0,
        'esp.okuma':not[gun] || 0,
        'esp.yazi':taslak[gun] || 0,
        'esp.gun':M.dayHasEntry(M.dayOf(gun)) ? 1 : 0,
      };
    });
    return out;
  }

  function gunluk(gun){ return gunler([gun])[gun]; }

  return { gunluk:gunluk, gunler:gunler };
})();
