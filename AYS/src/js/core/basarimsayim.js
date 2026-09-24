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

   AYS'DE NE SAYILIR

     dakika    blokların `actualMin` toplamı — `core/beacon.js`'in
               `study_minutes` olarak merkeze gönderdiği sayının aynısı.
               İki yerde iki farklı «çalışma süresi» olamaz.
     gorev     biten blok + o gün kaydedilen deneme.
     kusursuz  soru çözüldü + en az bir blok bitti + gün kaydı var.
               Deneme ve tahmin kaydı DAHİL DEĞİL: her gün deneme
               çözmek beklenmez, beklenmeyen bir şeyi kusursuzluk şartı
               yapmak rozeti anlamsız yapardı. */

window.R = window.R || {};

R.BasarimSayim = (function(){
  const S = R.S;

  function gunluk(gun){
    const d = S.days[gun];
    const bloklar = (d && Array.isArray(d.blocks)) ? d.blocks : [];

    /* Yalnız ÖLÇÜLMÜŞ süre: `actualMin` null ise o blok süresizdir. */
    const dakika = bloklar.reduce(function(t, b){
      return t + (b && b.actualMin != null ? Number(b.actualMin) || 0 : 0);
    }, 0);

    const bitenBlok = bloklar.filter(function(b){ return b.status === 'done'; }).length;
    const deneme = (S.exams || []).filter(function(e){ return e && e.date === gun; }).length;

    const soru = R.Calc.gunSorusu(d);   /* tek tanım (HATALAR O-5) */
    const gunKaydi = (soru > 0 || bloklar.some(function(b){ return b.status !== 'pending'; })
      || (d && d.note)) ? 1 : 0;

    return {
      dakika:dakika,
      gorev:bitenBlok + deneme,
      kusursuz:(soru > 0 && bitenBlok > 0 && gunKaydi) ? 1 : 0,
    };
  }

  /* Gün kümesi — yüzey üç sistemde AYNI (bkz. xpsayim.js). */
  function gunler(liste){
    const g = (liste && liste.length) ? liste : [R.U.todayISO()];
    const out = {};
    g.forEach(function(gun){ out[gun] = gunluk(gun); });
    return out;
  }

  return { gunluk:gunluk, gunler:gunler };
})();
