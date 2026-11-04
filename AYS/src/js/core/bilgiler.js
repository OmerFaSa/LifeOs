/* BİLGİ PARÇALARI — bu modülün sayıları, nasıl okunduğu ve kesinlik etiketiyle (AGENTS §1.2).
   Sayıyı modülün kendi kuralı üretir; King buradan okur, kendi hesaplamaz.
   Yeni sayı: tek satır P.bilgi. Ekrana özel bilgi kendi ekran dosyasında da durabilir. */
(function(){
  const P = window.LIFEOS.PARCA;
  const C = () => R.Calc, M = () => R.Model;
  const hafta = id => { const s = R.KingVeri.hafta(R.U.todayISO()).satirlar.find(x => x.id === id); return s && s.deger != null ? { deger:s.deger, etiket:s.etiket } : null; };
  const net = aile => C().medianTrend(aile).last3;
  P.bilgi({ id:'ays.hafta-calisma', ad:'Son 7 gün çalışma', birim:'dk', etiket:'ölçüldü', oku:() => hafta('calisma_dk') });
  P.bilgi({ id:'ays.hafta-soru', ad:'Son 7 gün soru', etiket:'ölçüldü', oku:() => hafta('soru') });
  P.bilgi({ id:'ays.hafta-blok', ad:'Son 7 gün tamamlanan blok', etiket:'ölçüldü', oku:() => hafta('blok') });
  P.bilgi({ id:'ays.tyt-net', ad:'TYT neti (son 3 deneme medyanı)', etiket:'hesaplandı', oku:() => net('TYT') });
  P.bilgi({ id:'ays.ayt-net', ad:'AYT neti (son 3 deneme medyanı)', etiket:'hesaplandı', oku:() => net('AYT') });
  P.bilgi({ id:'ays.analiz-borcu', ad:'Analizi bekleyen deneme', etiket:'hesaplandı', oku:() => C().analysisDebt().length });
  P.bilgi({ id:'ays.vadesi-gelen-kart', ad:'Vadesi gelen tekrar kartı', etiket:'hesaplandı', oku:() => C().dueCards().length });
  P.bilgi({ id:'ays.geciken-kart', ad:'Geciken tekrar kartı', etiket:'hesaplandı', oku:() => C().overdueCards().length });
  P.bilgi({ id:'ays.plan-tamamlama', ad:'Bu hafta plan tamamlama', birim:'%', etiket:'hesaplandı', oku:() => C().planCompletion(M().currentWeek()) });
  P.bilgi({ id:'ays.konu-kapanis', ad:'Kapanan konu oranı', birim:'%', etiket:'hesaplandı', oku:() => C().overallClosure().pct });
  P.bilgi({ id:'ays.uyku-ortalamasi', ad:'Son 7 gün uyku ortalaması', birim:'saat', etiket:'hesaplandı', oku:() => C().sleepAverage(7) });
  P.bilgi({ id:'ays.seri', ad:'Davranış serisi', birim:'gün', etiket:'hesaplandı', oku:() => C().behaviorStreak().streak });
})();
