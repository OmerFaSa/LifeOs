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

window.R = window.R || {};

R.XPSayim = (function(){
  const S = R.S, M = R.Model;

  function gunluk(gun){
    const d = S.days[gun];
    const bloklar = (d && Array.isArray(d.blocks)) ? d.blocks : [];
    /* Günün sorusu: bloklara yazılanlar + derse bağlanmayan serbest
       sorular. İkisini toplamak core/goodhart.js ile aynı okumadır. */
    const soru = bloklar.reduce((t, b) => t + (Number(b.actualQ) || 0), 0)
      + (Number(d && d.freeQ) || 0);

    return {
      'ays.soru':soru,
      'ays.deneme':(S.exams || []).filter(e => e && e.date === gun).length,
      'ays.blok':bloklar.filter(b => b.status === 'done').length,
      'ays.kalibrasyon':(S.forecasts || []).filter(
        f => String(f.at || '').slice(0, 10) === gun).length,
      /* Gün kaydı: o güne dair BİR ŞEY girilmiş mi. */
      'ays.gun':(soru > 0 || bloklar.some(b => b.status !== 'pending')
        || (d && d.note)) ? 1 : 0,
    };
  }

  /* Gün kümesi — yüzey üç sistemde AYNI. Buradaki koleksiyonlar gün
     başına küçük olduğu için döngü yeterli; ESP'de aynı işlev tek
     geçişe indirildi çünkü orada kartın içindeki tekrar satırları
     ölçülebilir bir yük getiriyordu. */
  function gunler(liste){
    const g = (liste && liste.length) ? liste : [R.U.todayISO()];
    const out = {};
    g.forEach(gun => { out[gun] = gunluk(gun); });
    return out;
  }

  return { gunluk:gunluk, gunler:gunler };
})();
