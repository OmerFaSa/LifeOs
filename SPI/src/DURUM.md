# SPİ — Durum ve öncelik raporu

Tarih: 11 Eylül 2026 · Derleme: `b390072` · 42 commit

Bu belge **ne kaldığını** söyler. `YOLHARITASI.md` ve `SAGLIK.md` planları
anlatır; bu belge o planların önüne geçen üç bulguyu ve işlerin hangi
sırayla yapılacağını anlatır.

Yazılı raporun tasarlanmış hâli bir Artifact olarak da duruyor.

---

## Yöntem

Hiçbir sayı tahmin değildir. Envanter kaynaktan sayıldı; süreler ve
depolama ayak izi uygulamayı gerçek tarayıcıda koşarak ölçüldü.

---

## 1. Ölçülen gerçekler

| Ölçüm | Sonuç | Yorum |
|---|---|---|
| İlk çizim — yazı tipi CDN'i kapalı | **342 ms** | Uygulamanın gerçek hızı |
| İlk çizim — CDN yanıt vermiyor | **12.931 ms** | 38 kat fark, tamamı ağdan |
| Ekranlar arası geçiş | ~125 ms | On iki ekranda aynı; hız sorunu yok |
| Bir yıllık gerçekçi veri | 366 KB | Yerel kotanın %7'si |
| Beş yıllık veri (öngörü) | 1,8 MB | **Depolama on yıl sorun değil** |
| Tek dosya dağıtım | 806 KB | Bir defa iniyor; kabul edilebilir |

Bir yıllık veri = günlük vital + 3 öğün + haftalık antrenman + 3 ayda bir
tahlil.

---

## 2. Yol haritasında olmayan üç bulgu

Bunlar «şunu da ekleyelim» maddeleri değil: ikisi sistemin ürettiği
**yorumu bozuyor**, biri kendi doktrinini çürütüyor.

### 2.1 · İlaç ve takviye kaydı hiç yok

Sistem «doz önermez» kuralını doğru uyguluyor ama **ne kullanıldığını da
kaydetmiyor.** Oysa bir hap ölçümü değiştirir: demir takviyesi ferritini
yükseltir, statin LDL'yi düşürür, mide ilacı B12 emilimini bozar.

Bugün kişisel taban çizgi motoru «ferritin gerçekten yükseldi» diyor —
**sebebini bilmeden.** Kullanıcı üç aydır demir hapı içiyorsa bu bir başarı
değil, beklenen bir sonuçtur. Kayıt olmadan sistem ikisini ayıramaz ve
yanlış cesaret verir.

### 2.2 · Açlık durumu kaydedilmiyor

Açlık glukozu, açlık insülini, trigliserit ve onlardan türeyen **TyG ile
TG/HDL** yalnız aç karnına alınan kandan yorumlanır. Sistem şu an bunu
sormuyor ve hepsini açmış gibi yorumluyor.

Tok karnına alınmış bir trigliserit «referans üstü» diye işaretlenip
beslenme hedefini değiştirebiliyor. Bu bir ölçüm hatası değil **bağlam
eksikliği**; çözümü bir alan: «aç / tok / bilinmiyor».

### 2.3 · «Sıfır bağımlılık» iddiası tipografide tutmuyor

Çalışma zamanı bağımlılığı gerçekten yok — ama üç yazı ailesi Google
Fonts'tan iniyor ve bu istek açılışı kilitliyor (ölçüm yukarıda).

Bu bir hız sorunundan fazlası: sistem çevrimdışı çalıştığını söylüyor,
kötü bağlantıda ise ya bekletiyor ya yanlış yazı tipiyle açılıyor.

---

## 3. Dalga 1 — Güven

Tek ölçüt: *kullanıcı üç hafta sonra hâlâ açıyor mu?* Hiçbiri yeni yetenek
eklemiyor; var olanı güvenilir kılıyor.

| # | İş | Büyüklük |
|---|---|---|
| 1.1 | Yazı tiplerini uygulamaya göm (woff2, ~300 KB) | Orta |
| 1.2 | İlaç ve takviye kaydı — eğilimde başlangıç çizgisi, karşılaştırmada uyarı | Büyük |
| 1.3 | Oturuma açlık durumu ve saat | Küçük |
| 1.4 | Kurulum ekranı — ilk izlenim, hiç tasarlanmadı | Orta |
| 1.5 | Telefonda alt gezinme | Orta |
| 1.6 | Bekleme durumları | Küçük |

## 4. Dalga 2 — Sürtünme

Sistemin en büyük riski teknik değil **davranışsal**. Her madde günde beş
kez birkaç saniye kazandırıyor.

| # | İş | Büyüklük |
|---|---|---|
| 2.1 | Satır içi düzenleme | Orta |
| 2.2 | Komut paletiyle veri girişi (`ferritin 26`) — ayrıştırıcılar zaten var | Orta |
| 2.3 | Günlükte zaman kaydırıcı | Küçük |
| 2.4 | Besin etiketi fotoğrafı → yeni gıda | Orta |
| 2.5 | Sabitlenen ölçümler | Küçük |
| 2.6 | Klavye gezinme (`j`/`k`) | Küçük |

## 5. Dalga 3 — Derinlik

Yalnız sistem düzenli kullanılmaya başladıysa anlamlı; veri yoksa
gösterecek şeyleri olmaz.

| # | İş | Büyüklük |
|---|---|---|
| 3.1 | Şikâyet ve semptom günlüğü | Orta |
| 3.2 | Adet döngüsü — kadın profilinde demir yorumu buna bağlı | Orta |
| 3.3 | Panel görünümü | Orta |
| 3.4 | Grafik kalitesi | Orta |
| 3.5 | Ofis masa düzeni ve ajan derinliği — en özgün fikir, en jenerik tasarım | Büyük |
| 3.6 | Tablet aralığı ve alt sayfa tasarımı | Orta |

---

## 6. Yapılmayacaklar

Bir planın yapılacaklar listesi kadar önemli tarafı budur. Aşağıdakiler
unutulmadı, **reddedildi**.

- **Canlı market fiyatı** — uygulama hiçbir siteyi taramaz. «Uydurulmuş
  sayı gösterilmez» kuralının fiyat tarafındaki sonucu.
- **Sesli cevap (TTS)** — dikte yeterli; TTS kesinlik katmaz, bedel katar.
- **PDF kitaplığı** — bağımlılık gerektirir; ekran görüntüsü çalışıyor.
- **Giyilebilir cihaz API'si** — hesap zaten eksik girdiye dayanıklı;
  cihaz bağlanınca yalnız giriş kanalı değişir.
- **Teşhis ve doz** — sınırın kendisi, yetenek eksiği değil.

---

## 7. Borçlar

| Borç | Ölçü | Ne zaman sorun olur |
|---|---|---|
| `labs.js` | 977 satır | Sağlık Faz 4'te. Bölünmeli: sonuç · giriş · karşılaştırma · çıktı |
| `meals.js`, `llm.js` | 748 / 737 | Aynı sınıra yaklaşıyorlar |
| Ekran okuyucu bildirimleri | 1 `aria-live` | Erişilebilirlik denetimi hiç yapılmadı |
| API anahtarları düz metin | localStorage | Aile içinde kabul; **genele açılırken mutlaka** |
| `tasarim/` 20 örnek | 20 dosya | Dördü sisteme girdi; gerisi referans, güncellenmiyor |

---

## 8. «Bitti» ne demek

Bitiş çizgisi bir özellik listesi değil. Üç cümle, üçü de bugün tam doğru
değil:

1. **Hiçbir ekran ağı beklemez.** Bugün yazı tipi bekliyor → 1.1
2. **Bir günün verisini telefonda bir dakikada girebilirsin.** Bugün alt
   sayfalar ve hamburger menü bunu uzatıyor → 1.5, 2.1, 2.2
3. **Sistem bir sayının neden değiştiğini söyleyebilir.** Bugün
   değiştiğini söyleyebiliyor, nedenini değil → 1.2, 1.3, 3.1

Üçü sağlandığında sistem dokuz ay boyunca her gün açılmayı hak eder. O
noktaya kadar geri kalan her madde **iyileştirmedir**, gereklilik değil.
