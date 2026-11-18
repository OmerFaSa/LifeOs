# Tur 2026-11-18j · Başbuğ adı, tok ses, geçişsiz açılış, keskin piksel

Sahip: «King'i Başbuğ yap; sesler çok tiz, tok ve güzel olsun; geçiş animasyonunu kaldır, direkt yüklensin; arka plandaki pixelartları kaliteli yap.»

- **King → Başbuğ:** kabukta görünen her ad ve ek (Başbuğ'a, Başbuğ'un, Başbuğ'la), sekme, Ayarlar grubu, sohbet; sayfa başlığı yalnız «Başbuğ». Sunucuda asistanın kimliği («Adın Başbuğ. Başbuğ uygulamasının kişisel asistanısın»), köprü istemi ve Antigravity konuşma başlığı. İç kimlikler (`king`, `#/king`, `lifeos.king.*`, eski HKM metinleri) aynı.
- **Tok ses (kabuk/ses.js):** katalog aynı; çalarken her nota iki oktav iner (en az 140 Hz, perde düzeni korunur), dokunuş gürültüsü 0,35 kat koyu, sesler 1,35 kat uzun, tiz rafı 1,8 kHz'de −10 dB, kazanç 2 → 2,6.
- **Geçiş yok (kabuk/kabuk.js):** görünüm geçişi ve sayfa girişindeki süzülme kaldırıldı; sayfa doğrudan çizilir. Kullanılmayan geçiş/paylaşılan öğe kodu silindi. Yanlış/doğru cevap, ilerleme çubuğu gibi küçük geri bildirim hareketleri duruyor. `tools/hareket_gez.js` buna göre.
- **Keskin piksel:** sahnenin her pikseli tam sayıda cihaz noktası (1,25 ölçekte 4, 1,5'te 5, telefonda 6); tuval CSS'te gerilmez, `scale(1.05)` kalktı, imleç kayması için tuval kutudan 12/6 px taşar.

Açık: CSS'teki görünüm geçişi kuralları artık işlemiyor (zararsız, sonra silinebilir); ses gerçek hoparlörde dinlenmedi.
Görüntüler: `*-masaustu-125.png`, `*-masaustu-150.png`, `*-telefon.png`.
