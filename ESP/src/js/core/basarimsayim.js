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

   ESP'DE NE SAYILIR

     dakika    `Model.minutesOf(gün)` — oturumların ölçülmüş süresi.
               XP'nin `esp.oturum` için kullandığı sayının aynısı;
               ikinci bir «pratik süresi» tanımı açmak, ikisinin bir
               gün ayrışması demekti.
     gorev     kart tekrarı + atomik not + yazı taslağı.
     kusursuz  kart tekrarlandı + pratik ölçüldü + gün kaydı var.
               Not ve taslak DAHİL DEĞİL: her gün yazı yazmak
               beklenmez. */

window.ESP = window.ESP || {};

ESP.BasarimSayim = (function(){
  const S = ESP.S, M = ESP.Model;

  function gunluk(gun){
    let kart = 0;
    (S.cards || []).forEach(function(c){
      (c.history || []).forEach(function(h){
        if(String((h && h.at) || '').slice(0, 10) === gun) kart++;
      });
    });
    const not = (S.notes || []).filter(function(n){
      return String((n && n.createdAt) || '').slice(0, 10) === gun; }).length;
    const taslak = (S.drafts || []).filter(function(t){
      return String((t && t.createdAt) || '').slice(0, 10) === gun; }).length;

    /* Ölçülmemiş oturum sayılmaz — `minutesOf` null döner. */
    const dakika = Number(M.minutesOf(gun)) || 0;
    const gunKaydi = M.dayHasEntry(M.dayOf(gun)) ? 1 : 0;

    return {
      dakika:dakika,
      gorev:kart + not + taslak,
      kusursuz:(kart > 0 && dakika > 0 && gunKaydi) ? 1 : 0,
    };
  }

  /* Gün kümesi — yüzey üç sistemde AYNI (bkz. xpsayim.js). */
  function gunler(liste){
    const g = (liste && liste.length) ? liste : [ESP.U.todayISO()];
    const out = {};
    g.forEach(function(gun){ out[gun] = gunluk(gun); });
    return out;
  }

  return { gunluk:gunluk, gunler:gunler };
})();
