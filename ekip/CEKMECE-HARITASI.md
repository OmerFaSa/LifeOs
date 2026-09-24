# Çekmece haritası — Part 9 önerisi (ONAY BEKLİYOR, uygulanmadı)

> Bu belge bir **öneridir**. Kod değişmedi. Kullanıcı onaylarsa (ya da düzeltirse)
> Part 9 buna göre uygulanır. Görsel tasarım (renk, yazı, boşluk) ayrı adımdır; burada
> yalnız **düzen** var: ne nerede durur.

## Neden

Bugün üç modülde aynı şey farklı yerde ve iç içe duruyor. Ölçülen durum
(2026-09-24, ekran dosyalarından sayıldı):

| | Üst menü | Ekran | İç sekmesi olan ekran | En derin iç içelik |
|---|---|---|---|---|
| AYS | 7 grup | 20 | 4 (Analiz 8 sekme, Rehber 7) | menü › grup › ekran › sekme = **4 kat** |
| SPİ | 8 grup | 13 | 8 (Testler 7 sekme + alt sekme) | menü › grup › ekran › sekme › alt sekme = **5 kat** |
| ESP | 9 grup | 15 | 12 (Dil 6, Tarih 6, Sempozyum 6) | **4 kat** |
| HKM yüzü | 9 sayfa | — | Ayarlar 7 sekme | 3 kat |

Tekrar eden örnekler: «Analiz» AYS'de ayrı grup, SPİ ve ESP'de Ofis'in içinde;
«Rehber» AYS'de Profiller'le, SPİ'de Hane'yle, ESP'de Profil'le; onay bekleyen işler
Bugün'de (HKM teklifi, King teklifi), Ofis'te (öneriler) ve Danışma'da ayrı ayrı;
«Kütüphane» ESP'de okuma notları, AYS'de BAM kitapları demek.

## Kurallar (DEVIR Part 9'dan)

1. Üç modülde **aynı iskelet, aynı çekmece adları**.
2. İç içelik **en çok iki kat**: çekmece › bölüm. Bölümün içinde sekme yok; kartlar
   alt alta.
3. **Aynı şey iki yerde durmaz.**
4. Her bölümün içi aynı dört parça: **başlık · kısa özet · liste · eylem**.
5. Her ekran hangi çekmecede olduğunu söyler (üstte «Plan › Hafta» gibi).
6. **Onaylar tek çekmecede.**

## Ortak iskelet (üç modülde aynı sıra, aynı ad)

| # | Çekmece | İçinde ne var | Not |
|---|---|---|---|
| 1 | **Bugün** | Giriş · Özet · Geçmiş | Günün tek ekranı. Onay sayısı burada yalnız bir **rozet**tir, onayın kendisi 5'te. |
| 2 | **Plan** | Hafta · Hedefler · Merdiven | Program, hedef ve seviye tek yerde. |
| 3 | **Çalışma** | modüle özgü bölümler (aşağıda) | Alanın asıl işi. |
| 4 | **Analiz** | İlerleme · Çapraz bağlar · Denetim ve dürüstlük | Üç modülde de Ofis'ten çıkar, kendi çekmecesi olur. |
| 5 | **Onaylar** | Bekleyen · Geçmiş (geri al) | HKM teklifi, King teklifi, ofis önerisi, BAM çıktısı: **hepsi burada**. |
| 6 | **Ofis** | Masalar · Danışma · Toplantı | Koçlarla konuşma; öneriler artık 5'te. |
| 7 | **Kütüphanem** | BAM'ın ürettikleri · Kendi kaynakların | Test kitabı, ünite, gıda bilgisi, ürünler, rapor. «Kütüphane» adı yalnız burada. |
| 8 | **Ayarlar** | Profil · Görünüm ve veri · HKM · Rehber | Rütbe de burada bir bölüm olur (XP yalnız görünürlüktür, kendi çekmecesini gerektirmez). |

Mobil alt çubuk (5 düğme): **Bugün · Plan · Çalışma · Onaylar · Menü**.

## 3 · Çalışma çekmecesinin bölümleri (modüle özgü, en çok 6)

| Modül | Bölümler | Bugün nereden geliyor |
|---|---|---|
| AYS | Konu çalış · Soru çöz · Deneme · Tekrar · Sınama | Öğrenme, Soru çöz, Deneme, Tekrar (+ Yanlış defteri kartı), Sınama |
| SPİ | Testler · Öğün · Mutfak · Hareket · Bütçe | Testler (7 sekme → 3 kart grubu: Sonuç, Gir, Geçmiş/Eğilim; İlaç kartı), Öğünler, Mutfak, Hareket, Finans |
| ESP | Dil · Felsefe · Tarih · Ses · Okuma · Yazı | Her disiplin bugün 4–6 iç sekme taşıyor → sekmeler **kart** olur: Çalış, Ekle, Öğren, İlerleme kartları alt alta |

## Taşınanlar (aynı şey iki yerde kalmasın)

| Bugün | Önerilen tek yer |
|---|---|
| Bugün › HKM teklifi, Bugün › King teklifi, Ofis › öneriler | **Onaylar › Bekleyen** |
| AYS «Analiz» grubu, SPİ/ESP «Ofis › Analiz» | **Analiz** |
| AYS Rehber › Profiller, SPİ Ayarlar › Hane, ESP Ayarlar › Profil | **Ayarlar › Profil** |
| «Rütbe» ayrı grup (üçünde) | **Ayarlar › Rütbe** (ya da Analiz › İlerleme'nin kartı — seçim sizin) |
| AYS Kütüphanem (test kitabı), Ofis › BAM ürünleri, ESP ünite/gitar paketi, SPİ BAM gıdası | **Kütüphanem** |
| ESP «Okuma › Kütüphane» | **Çalışma › Okuma** (ad çakışması kalkar) |
| SPİ `designs.css` beş düzen + tasarım seçici | **Kalkar** (tek tasarım) |

## HKM yüzü

Aynı dil: **Bugün · Onaylar (Teklifler) · Hedefler · Sistemler · Ofis · Sohbet ·
Ayarlar**. Profil ve Motto → Ayarlar içinde bölüm. Ayarlar'ın 7 sekmesi → 4 bölüm:
Yapay zekâ ve bütçe · Kanallar ve cihazlar · Eşikler · Sunucu.

## Sizden istenen karar

1. Sekiz çekmecelik ortak iskelet uygun mu (ad ve sıra)?
2. Rütbe: **Ayarlar**'da mı, **Analiz**'de mi?
3. Mobil alt çubuk: Bugün · Plan · Çalışma · Onaylar · Menü — uygun mu?
4. ESP'de altı disiplin tek «Çalışma» çekmecesinde mi dursun, yoksa her biri kendi
   çekmecesi mi olsun (o zaman iskelet üç modülde birebir aynı kalmaz)?

Onaydan sonra sıra: önce iskelet (menü + yönlendirme, veri değişmez), sonra ekran ekran
iç sekmelerin karta dönüşmesi, en son görsel tasarım. Her adım duman testi + 390px düzen
denetiminden geçer.
