/* BAŞARIM SAYIMI — «o gün ne kadar iş, ne kadar süre» sorusunun cevabı.

   XP sayımından (`xpsayim.js`) AYRI durur ve bilerek: XP «hangi iş kaç
   puan» sorusunu, bu ise «kaç görev, kaç dakika» sorusunu cevaplar.
   İkisini tek yere koymak, bir gün birinin eşiği değişince ötekinin de
   değişmesi demekti — oysa rozetin XP ile hiçbir ilişkisi yok
   (bkz. brand/seviye/basarimlar.js).

   Üç sayı döner ve üçü de VERİDEN TÜRETİLİR, hiçbir ekran tetiklemez:

     dakika    ÖLÇÜLMÜŞ süre. Süresi girilmemiş kayıt «0 dakika» değil
               «veri yok»tur ve sayılmaz (AGENTS.md §1.2).
     gorev     biten iş sayısı.
     kusursuz  o gün GÜNLÜK BEKLENEN işlerin hepsi yapıldı mı.

   SPİ'DE NE SAYILIR

     dakika    antrenmanların `minutes` toplamı — süresi girilmemiş
               antrenman sayılmaz.
     gorev     antrenman + öğün + tahlil + girilmiş ölçüm alanı.
     kusursuz  öğün var + uyku girilmiş + en az bir ölçüm var.
               Antrenman DAHİL DEĞİL ve bu bir sağlık kararıdır:
               dinlenme günü eksiklik değildir, her gün antrenman
               beklemek kusursuzluğu zararlı bir şeye çevirirdi. */

window.SP = window.SP || {};

SP.BasarimSayim = (function(){
  const S = SP.S, M = SP.Model;
  const OLCUM = SP.XPSayim.OLCUM;

  function gunluk(gun){
    const v = M.vitalsOf(gun);
    const olcum = v ? OLCUM.filter(function(k){ return v[k] != null; }).length : 0;
    const ogun = M.mealsOf(gun).length;
    const antrenmanlar = (S.workouts || []).filter(function(w){ return w && w.date === gun; });
    const tahlil = (S.labs || []).filter(function(l){ return l && l.date === gun; }).length;
    const uyku = (v && v.sleep != null) ? 1 : 0;

    /* Yalnız ÖLÇÜLMÜŞ süre: `minutes` boşsa o antrenman süresizdir. */
    const dakika = antrenmanlar.reduce(function(t, w){
      return t + (w && w.minutes != null ? Number(w.minutes) || 0 : 0);
    }, 0);

    return {
      dakika:dakika,
      gorev:antrenmanlar.length + ogun + tahlil + olcum,
      kusursuz:(ogun > 0 && uyku && olcum > 0) ? 1 : 0,
    };
  }

  /* Gün kümesi — yüzey üç sistemde AYNI (bkz. xpsayim.js). */
  function gunler(liste){
    const g = (liste && liste.length) ? liste : [SP.U.todayISO()];
    const out = {};
    g.forEach(function(gun){ out[gun] = gunluk(gun); });
    return out;
  }

  return { gunluk:gunluk, gunler:gunler };
})();
