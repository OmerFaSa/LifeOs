/* BİLGİ PARÇALARI — bu modülün sayıları, nasıl okunduğu ve kesinlik etiketiyle (AGENTS §1.2).
   Sayıyı modülün kendi kuralı üretir; King buradan okur, kendi hesaplamaz.
   Yeni sayı: tek satır P.bilgi. Ekrana özel bilgi kendi ekran dosyasında da durabilir. */
(function(){
  const P = window.LIFEOS.PARCA;
  const hafta = id => { const s = SP.KingVeri.hafta(SP.U.todayISO()).satirlar.find(x => x.id === id); return s && s.deger != null ? { deger:s.deger, etiket:s.etiket } : null; };
  P.bilgi({ id:'spi.hafta-uyku', ad:'Son 7 gün uyku', birim:'saat', etiket:'hesaplandı', oku:() => hafta('uyku') });
  P.bilgi({ id:'spi.hafta-antrenman', ad:'Son 7 gün antrenman', etiket:'ölçüldü', oku:() => hafta('antrenman') });
  P.bilgi({ id:'spi.hafta-hareket', ad:'Son 7 gün hareket', birim:'dk', etiket:'ölçüldü', oku:() => hafta('hareket_dk') });
  P.bilgi({ id:'spi.hafta-ogun', ad:'Son 7 gün öğün', etiket:'ölçüldü', oku:() => hafta('ogun') });
  P.bilgi({ id:'spi.seri', ad:'Minimum gün serisi', birim:'gün', etiket:'hesaplandı', oku:() => SP.Calc.streak() });
})();
