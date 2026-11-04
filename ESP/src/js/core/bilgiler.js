/* BİLGİ PARÇALARI — bu modülün sayıları, nasıl okunduğu ve kesinlik etiketiyle (AGENTS §1.2).
   Sayıyı modülün kendi kuralı üretir; King buradan okur, kendi hesaplamaz.
   Yeni sayı: tek satır P.bilgi. Ekrana özel bilgi kendi ekran dosyasında da durabilir. */
(function(){
  const P = window.LIFEOS.PARCA;
  const hafta = id => { const s = ESP.KingVeri.hafta(ESP.U.todayISO()).satirlar.find(x => x.id === id); return s && s.deger != null ? { deger:s.deger, etiket:s.etiket } : null; };
  P.bilgi({ id:'esp.hafta-calisma', ad:'Son 7 gün çalışma', birim:'dk', etiket:'ölçüldü', oku:() => hafta('calisma_dk') });
  P.bilgi({ id:'esp.hafta-oturum', ad:'Son 7 gün oturum', etiket:'ölçüldü', oku:() => hafta('oturum') });
  P.bilgi({ id:'esp.hafta-gun', ad:'Son 7 gün çalışılan gün', etiket:'ölçüldü', oku:() => hafta('gun') });
})();
