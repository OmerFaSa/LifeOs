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

window.SP = window.SP || {};

SP.XPSayim = (function(){
  const S = SP.S, M = SP.Model;

  /* O gün GERÇEKTEN girilmiş ölçüm alanları. Boş bir kayıt «ölçüldü»
     değildir — bu deponun en çok tekrarlanan kuralı. */
  const OLCUM = ['sbp', 'dbp', 'rhr', 'hrv', 'spo2', 'temp',
    'weight', 'waist', 'bodyfat'];

  function gunluk(gun){
    const v = M.vitalsOf(gun);
    const olcum = v ? OLCUM.filter(k => v[k] != null).length : 0;
    const ogun = M.mealsOf(gun).length;
    const antrenman = (S.workouts || []).filter(w => w && w.date === gun).length;
    const tahlil = (S.labs || []).filter(l => l && l.date === gun).length;
    const uyku = (v && v.sleep != null) ? 1 : 0;

    return {
      'spi.antrenman':antrenman,
      'spi.ogun':ogun,
      'spi.uyku':uyku,
      'spi.olcum':olcum,
      'spi.tahlil':tahlil,
      'spi.gun':(olcum || ogun || antrenman || tahlil || uyku) ? 1 : 0,
    };
  }

  /* Gün kümesi — yüzey üç sistemde AYNI. Buradaki koleksiyonlar gün
     başına küçük olduğu için döngü yeterli; ESP'de aynı işlev tek
     geçişe indirildi çünkü orada kartın içindeki tekrar satırları
     ölçülebilir bir yük getiriyordu. */
  function gunler(liste){
    const g = (liste && liste.length) ? liste : [SP.U.todayISO()];
    const out = {};
    g.forEach(gun => { out[gun] = gunluk(gun); });
    return out;
  }

  return { gunluk:gunluk, gunler:gunler, OLCUM:OLCUM };
})();
